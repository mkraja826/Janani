begin;

set local lock_timeout = '10s';
set local statement_timeout = '5min';

-- A nudge row and its push attempt must share the same idempotency boundary.
-- Existing rows are marked as already dispatched so an old mutation id cannot
-- be replayed after this migration to produce a new notification.
alter table public.partner_nudges
  add column if not exists push_dispatched_at timestamptz;

update public.partner_nudges
set push_dispatched_at = created_at
where push_dispatched_at is null;

create or replace function public.send_partner_nudge(
  p_message text,
  p_client_mutation_id uuid
)
returns public.partner_nudges
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_family_id uuid;
  v_role text;
  v_recipient_id uuid;
  v_message text := btrim(coalesce(p_message, ''));
  v_nudge public.partner_nudges;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  if p_client_mutation_id is null then
    raise exception using errcode = '22023', message = 'Mutation id is required';
  end if;

  if char_length(v_message) not between 1 and 120 then
    raise exception using
      errcode = '22023',
      message = 'Message must be between 1 and 120 characters';
  end if;

  select member.family_id, member.role::text
  into v_family_id, v_role
  from public.family_members as member
  where member.user_id = v_user_id
    and member.role in (
      'mother'::public.janani_role,
      'partner'::public.janani_role
    );

  if v_family_id is null then
    raise exception using errcode = '42501', message = 'No linked family found';
  end if;

  -- Unlink operations lock the same family row. Rechecking membership after
  -- acquiring it prevents a send from committing after a disconnect/leave.
  perform 1
  from public.families as family
  where family.id = v_family_id
  for update;

  select member.role::text
  into v_role
  from public.family_members as member
  where member.family_id = v_family_id
    and member.user_id = v_user_id
    and member.role in (
      'mother'::public.janani_role,
      'partner'::public.janani_role
    );

  if v_role is null then
    raise exception using errcode = '42501', message = 'No linked family found';
  end if;

  select member.user_id
  into v_recipient_id
  from public.family_members as member
  where member.family_id = v_family_id
    and member.role = case
      when v_role = 'mother'
        then 'partner'::public.janani_role
      else 'mother'::public.janani_role
    end;

  if v_recipient_id is null then
    raise exception using
      errcode = '22023',
      message = 'Your partner has not joined yet';
  end if;

  -- Serialize retries and rate checks per sender while the family lock is held.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text, 0)
  );

  select nudge.*
  into v_nudge
  from public.partner_nudges as nudge
  where nudge.sender_id = v_user_id
    and nudge.client_mutation_id = p_client_mutation_id;

  if found then
    if v_nudge.family_id <> v_family_id
       or v_nudge.recipient_id <> v_recipient_id then
      raise exception using
        errcode = '22023',
        message = 'Mutation id belongs to a different family link';
    end if;
    return v_nudge;
  end if;

  if exists (
    select 1
    from public.partner_nudges
    where sender_id = v_user_id
      and created_at >= statement_timestamp() - interval '30 seconds'
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'Please wait before sending another message';
  end if;

  if (
    select count(*)
    from public.partner_nudges
    where sender_id = v_user_id
      and created_at >= statement_timestamp() - interval '24 hours'
  ) >= 20 then
    raise exception using
      errcode = 'P0001',
      message = 'Daily message limit reached';
  end if;

  insert into public.partner_nudges (
    family_id,
    sender_id,
    recipient_id,
    message,
    client_mutation_id
  )
  values (
    v_family_id,
    v_user_id,
    v_recipient_id,
    v_message,
    p_client_mutation_id
  )
  returning * into v_nudge;

  return v_nudge;
end;
$function$;

create or replace function public.acknowledge_partner_nudge(p_nudge_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_family_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  select nudge.family_id
  into v_family_id
  from public.partner_nudges as nudge
  where nudge.id = p_nudge_id
    and nudge.recipient_id = v_user_id;

  if v_family_id is null then
    raise exception using errcode = '42501', message = 'Nudge not found';
  end if;

  perform 1
  from public.families as family
  where family.id = v_family_id
  for update;

  if not exists (
    select 1
    from public.family_members as member
    where member.family_id = v_family_id
      and member.user_id = v_user_id
  ) then
    raise exception using errcode = '42501', message = 'Nudge not found';
  end if;

  update public.partner_nudges
  set acknowledged_at = coalesce(acknowledged_at, statement_timestamp())
  where id = p_nudge_id
    and recipient_id = v_user_id;
end;
$function$;

-- Active Expo tokens cannot be taken over by another authenticated account.
-- Locking the token identity closes the cross-user last-writer-wins race.
create or replace function public.register_device_push_token(
  p_expo_push_token text,
  p_platform text,
  p_device_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_token text := btrim(coalesce(p_expo_push_token, ''));
  v_device_name text := nullif(btrim(p_device_name), '');
  v_token_id uuid;
  v_existing_user_id uuid;
  v_existing_active boolean;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  if char_length(v_token) not between 1 and 255
     or v_token !~ '^Expo(nent)?PushToken\[[^]]+\]$' then
    raise exception using errcode = '22023', message = 'Invalid Expo push token';
  end if;

  if p_platform not in ('android', 'ios') then
    raise exception using errcode = '22023', message = 'Invalid device platform';
  end if;

  if v_device_name is not null and char_length(v_device_name) > 100 then
    raise exception using errcode = '22023', message = 'Device name is too long';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_token, 2)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text, 1)
  );

  select token.user_id, token.is_active
  into v_existing_user_id, v_existing_active
  from public.device_push_tokens as token
  where token.expo_push_token = v_token
  for update;

  if v_existing_active
     and v_existing_user_id is distinct from v_user_id then
    raise exception using
      errcode = '42501',
      message = 'This active device token belongs to another account';
  end if;

  if not coalesce(
    v_existing_user_id = v_user_id and v_existing_active,
    false
  ) and (
    select count(*)
    from public.device_push_tokens
    where user_id = v_user_id
      and is_active
  ) >= 10 then
    raise exception using
      errcode = 'P0001',
      message = 'Active device limit reached';
  end if;

  insert into public.device_push_tokens (
    user_id,
    expo_push_token,
    platform,
    device_name,
    is_active,
    last_seen_at
  )
  values (
    v_user_id,
    v_token,
    p_platform,
    v_device_name,
    true,
    statement_timestamp()
  )
  on conflict (expo_push_token)
  do update
  set user_id = excluded.user_id,
      platform = excluded.platform,
      device_name = excluded.device_name,
      is_active = true,
      last_seen_at = excluded.last_seen_at
  where public.device_push_tokens.user_id = excluded.user_id
     or not public.device_push_tokens.is_active
  returning id into v_token_id;

  if v_token_id is null then
    raise exception using
      errcode = '42501',
      message = 'This active device token belongs to another account';
  end if;

  return v_token_id;
end;
$function$;

-- The mother remains the data owner for care reminders after a partner leaves.
create or replace function janani_private.can_delete_reminder(
  target_pregnancy_id uuid,
  target_creator_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select target_creator_id = (select auth.uid())
    or exists (
      select 1
      from public.pregnancies as pregnancy
      join public.family_members as member
        on member.family_id = pregnancy.family_id
      where pregnancy.id = target_pregnancy_id
        and member.user_id = (select auth.uid())
        and member.role = 'mother'::public.janani_role
    );
$function$;

revoke all on function janani_private.can_delete_reminder(uuid, uuid)
  from public, anon, authenticated;
grant execute on function janani_private.can_delete_reminder(uuid, uuid)
  to authenticated;

drop policy if exists reminders_delete_creator on public.reminders;
create policy reminders_delete_owner
on public.reminders
for delete
to authenticated
using (
  janani_private.can_delete_reminder(pregnancy_id, created_by)
);

-- Rotate an invitation whenever a partner membership disappears, including an
-- Auth cascade during partner account deletion.
create or replace function janani_private.rotate_invite_after_partner_removed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if old.role = 'partner'::public.janani_role then
    update public.families
    set invite_code = upper(encode(extensions.gen_random_bytes(10), 'hex'))
    where id = old.family_id;
  end if;
  return old;
end;
$function$;

revoke all on function janani_private.rotate_invite_after_partner_removed()
  from public, anon, authenticated;

drop trigger if exists family_members_rotate_invite_after_partner_removed
  on public.family_members;
create trigger family_members_rotate_invite_after_partner_removed
after delete on public.family_members
for each row
execute function janani_private.rotate_invite_after_partner_removed();

-- Partners need pregnancy progress, not private body measurements or a reusable
-- family invitation. Expose sensitive values only through mother-validated RPCs.
revoke select on public.families from authenticated;
revoke select on public.pregnancies from authenticated;

grant select (
  id,
  name,
  created_by,
  created_at,
  updated_at
) on public.families to authenticated;

grant select (
  id,
  family_id,
  mother_id,
  due_date,
  status,
  created_at,
  updated_at
) on public.pregnancies to authenticated;

create or replace function public.get_mother_family_invite_code()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_invite_code text;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  select family.invite_code
  into v_invite_code
  from public.family_members as member
  join public.families as family
    on family.id = member.family_id
  where member.user_id = auth.uid()
    and member.role = 'mother'::public.janani_role;

  if v_invite_code is null then
    raise exception using errcode = '42501', message = 'Mother access required';
  end if;

  return v_invite_code;
end;
$function$;

create or replace function public.get_mother_pregnancy_private_details()
returns table (
  pregnancy_id uuid,
  last_menstrual_period date,
  height_cm numeric,
  pre_pregnancy_weight_kg numeric
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    pregnancy.id,
    pregnancy.last_menstrual_period,
    pregnancy.height_cm,
    pregnancy.pre_pregnancy_weight_kg
  from public.pregnancies as pregnancy
  join public.family_members as member
    on member.family_id = pregnancy.family_id
  where member.user_id = (select auth.uid())
    and member.role = 'mother'::public.janani_role
    and pregnancy.mother_id = (select auth.uid())
  order by pregnancy.created_at;
$function$;

revoke all on function public.get_mother_family_invite_code()
  from public, anon;
revoke all on function public.get_mother_pregnancy_private_details()
  from public, anon;
grant execute on function public.get_mother_family_invite_code()
  to authenticated;
grant execute on function public.get_mother_pregnancy_private_details()
  to authenticated;

-- Durable account-deletion state prevents database writes after deletion starts
-- and preserves a storage cleanup manifest if the Auth or Storage API is
-- temporarily unavailable.
create table if not exists public.account_deletion_requests (
  user_id uuid primary key,
  status text not null default 'pending'
    check (status in ('pending', 'auth_deleted')),
  storage_objects jsonb not null default '[]'::jsonb
    check (
      jsonb_typeof(storage_objects) = 'array'
      and jsonb_array_length(storage_objects) <= 10001
    ),
  last_error text,
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.account_deletion_requests enable row level security;
revoke all on public.account_deletion_requests
  from public, anon, authenticated;
grant select, insert, update, delete on public.account_deletion_requests
  to service_role;

create or replace function janani_private.reject_writes_during_account_deletion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is not null
     and coalesce(auth.role(), '') <> 'service_role'
     and exists (
       select 1
       from public.account_deletion_requests as request
       where request.user_id = v_user_id
     ) then
    raise exception using
      errcode = '55000',
      message = 'Account deletion is already in progress';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$function$;

revoke all on function janani_private.reject_writes_during_account_deletion()
  from public, anon, authenticated;

do $triggers$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'families',
    'family_members',
    'pregnancies',
    'reminders',
    'reminder_logs',
    'journal_entries',
    'partner_nudges',
    'device_push_tokens'
  ]
  loop
    execute format(
      'drop trigger if exists reject_writes_during_account_deletion on public.%I',
      table_name
    );
    execute format(
      'create trigger reject_writes_during_account_deletion
       before insert or update or delete on public.%I
       for each row execute function
       janani_private.reject_writes_during_account_deletion()',
      table_name
    );
  end loop;
end
$triggers$;

create or replace function public.list_own_storage_objects_for_account_deletion(
  p_limit integer default 1000
)
returns table (
  bucket_id text,
  object_name text
)
language sql
stable
security definer
set search_path = ''
as $function$
  select stored_object.bucket_id, stored_object.name
  from storage.objects as stored_object
  where stored_object.owner_id = (select auth.uid())::text
     or stored_object.owner = (select auth.uid())
  order by stored_object.bucket_id, stored_object.name
  limit least(greatest(coalesce(p_limit, 1000), 1), 10001);
$function$;

-- Sanitized private Broadcast invalidations close the DELETE and newly-private
-- row gap without publishing old row contents.
drop policy if exists "janani family members receive invalidations"
  on realtime.messages;
create policy "janani family members receive invalidations"
on realtime.messages
for select
to authenticated
using (
  realtime.messages.extension = 'broadcast'
  and exists (
    select 1
    from public.family_members as member
    where member.user_id = (select auth.uid())
      and (select realtime.topic()) =
        'janani-family:' || member.family_id::text
  )
);

create or replace function janani_private.broadcast_family_invalidation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_family_id uuid;
  v_reference_id uuid;
begin
  if tg_table_name in ('families', 'family_members', 'partner_nudges') then
    if tg_table_name = 'families' then
      if tg_op = 'DELETE' then
        v_family_id := old.id;
      else
        v_family_id := new.id;
      end if;
    else
      if tg_op = 'DELETE' then
        v_family_id := old.family_id;
      else
        v_family_id := new.family_id;
      end if;
    end if;
  elsif tg_table_name = 'pregnancies' then
    if tg_op = 'DELETE' then
      v_family_id := old.family_id;
    else
      v_family_id := new.family_id;
    end if;
  elsif tg_table_name in ('reminders', 'journal_entries') then
    if tg_op = 'DELETE' then
      v_reference_id := old.pregnancy_id;
    else
      v_reference_id := new.pregnancy_id;
    end if;
    select pregnancy.family_id
    into v_family_id
    from public.pregnancies as pregnancy
    where pregnancy.id = v_reference_id;
  elsif tg_table_name = 'reminder_logs' then
    if tg_op = 'DELETE' then
      v_reference_id := old.reminder_id;
    else
      v_reference_id := new.reminder_id;
    end if;
    select pregnancy.family_id
    into v_family_id
    from public.reminders as reminder
    join public.pregnancies as pregnancy
      on pregnancy.id = reminder.pregnancy_id
    where reminder.id = v_reference_id;
  end if;

  if v_family_id is not null then
    perform realtime.send(
      jsonb_build_object('entity', tg_table_name),
      'invalidate',
      'janani-family:' || v_family_id::text,
      true
    );
  end if;

  return null;
end;
$function$;

revoke all on function janani_private.broadcast_family_invalidation()
  from public, anon, authenticated;

do $broadcast_triggers$
declare
  table_name text;
begin
  foreach table_name in array array[
    'families',
    'family_members',
    'pregnancies',
    'reminders',
    'reminder_logs',
    'journal_entries',
    'partner_nudges'
  ]
  loop
    execute format(
      'drop trigger if exists broadcast_family_invalidation on public.%I',
      table_name
    );
    execute format(
      'create trigger broadcast_family_invalidation
       after insert or update or delete on public.%I
       for each row execute function
       janani_private.broadcast_family_invalidation()',
      table_name
    );
  end loop;
end
$broadcast_triggers$;

commit;
