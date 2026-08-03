-- Production hardening migration applied through the connected Supabase project.
begin;

set local lock_timeout = '10s';
set local statement_timeout = '5min';

-- Keep privileged helpers out of the API-exposed public schema.
create schema if not exists janani_private;
revoke all on schema janani_private from public, anon, authenticated;
grant usage on schema janani_private to authenticated;

-- Repair the live schema/function mismatch and add server-side idempotency.
alter table public.families
  add column if not exists updated_at timestamptz not null default now();

alter table public.families
  alter column invite_code
  set default upper(encode(extensions.gen_random_bytes(10), 'hex'));

alter table public.partner_nudges
  add column if not exists client_mutation_id uuid;

alter table public.journal_entries
  alter column is_shared_with_partner set default false;

-- Existing blank profile names are equivalent to no name and would violate the
-- stricter shape constraint below.
update public.profiles
set full_name = null
where full_name is not null
  and btrim(full_name) = '';

-- Replace the short, reusable invite tokens with 80-bit tokens. The current
-- mobile app reads the current token from families, so it remains compatible.
update public.families
set invite_code = upper(encode(extensions.gen_random_bytes(10), 'hex')),
    updated_at = now()
where invite_code !~ '^[0-9A-F]{20}$';

-- Abort with a useful message instead of allowing a cryptic unique-index error
-- if a later environment already contains ambiguous membership data.
do $preflight$
begin
  if exists (
    select 1
    from public.family_members
    group by user_id
    having count(*) > 1
  ) then
    raise exception
      'Janani hardening requires each user to belong to at most one family';
  end if;

  if exists (
    select 1
    from public.family_members
    where role in ('mother'::public.janani_role, 'partner'::public.janani_role)
    group by family_id, role
    having count(*) > 1
  ) then
    raise exception
      'Janani hardening requires at most one mother and one partner per family';
  end if;

  if exists (
    select 1
    from public.pregnancies
    where status = 'active'::public.pregnancy_status
    group by family_id
    having count(*) > 1
  ) then
    raise exception
      'Janani hardening requires at most one active pregnancy per family';
  end if;
end
$preflight$;

-- Validate user-controlled fields at the database boundary.
do $constraints$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_full_name_shape'
  ) then
    alter table public.profiles
      add constraint profiles_full_name_shape
      check (
        full_name is null
        or (full_name = btrim(full_name) and char_length(full_name) between 1 and 100)
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_optional_fields_length'
  ) then
    alter table public.profiles
      add constraint profiles_optional_fields_length
      check (
        (avatar_url is null or char_length(avatar_url) <= 2048)
        and (phone is null or char_length(phone) <= 32)
        and char_length(preferred_language) between 2 and 16
        and char_length(timezone) between 1 and 64
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.families'::regclass
      and conname = 'families_name_shape'
  ) then
    alter table public.families
      add constraint families_name_shape
      check (name = btrim(name) and char_length(name) between 1 and 100);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.families'::regclass
      and conname = 'families_invite_code_shape'
  ) then
    alter table public.families
      add constraint families_invite_code_shape
      check (invite_code ~ '^[0-9A-F]{20}$');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.pregnancies'::regclass
      and conname = 'pregnancies_dates_ordered'
  ) then
    alter table public.pregnancies
      add constraint pregnancies_dates_ordered
      check (
        last_menstrual_period is null
        or last_menstrual_period <= due_date
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.reminders'::regclass
      and conname = 'reminders_content_shape'
  ) then
    alter table public.reminders
      add constraint reminders_content_shape
      check (
        title = btrim(title)
        and char_length(title) between 1 and 120
        and (instructions is null or char_length(instructions) <= 2000)
        and (
          notification_identifier is null
          or char_length(notification_identifier) <= 255
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.reminders'::regclass
      and conname = 'reminders_days_of_week_shape'
  ) then
    alter table public.reminders
      add constraint reminders_days_of_week_shape
      check (
        cardinality(days_of_week) between 1 and 7
        and days_of_week <@ array[0,1,2,3,4,5,6]::smallint[]
        and array_position(days_of_week, null::smallint) is null
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.reminder_logs'::regclass
      and conname = 'reminder_logs_note_length'
  ) then
    alter table public.reminder_logs
      add constraint reminder_logs_note_length
      check (note is null or char_length(note) <= 500);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.journal_entries'::regclass
      and conname = 'journal_entries_content_shape'
  ) then
    alter table public.journal_entries
      add constraint journal_entries_content_shape
      check (
        (title is null or char_length(title) between 1 and 80)
        and body = btrim(body)
        and char_length(body) between 1 and 3000
        and cardinality(photo_paths) <= 5
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.partner_nudges'::regclass
      and conname = 'partner_nudges_message_shape'
  ) then
    alter table public.partner_nudges
      add constraint partner_nudges_message_shape
      check (message = btrim(message) and char_length(message) between 1 and 120);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.device_push_tokens'::regclass
      and conname = 'device_push_tokens_content_shape'
  ) then
    alter table public.device_push_tokens
      add constraint device_push_tokens_content_shape
      check (
        expo_push_token = btrim(expo_push_token)
        and char_length(expo_push_token) between 1 and 255
        and (device_name is null or char_length(device_name) <= 100)
      );
  end if;
end
$constraints$;

-- Cardinality and foreign-key indexes. Partial unique indexes encode the
-- one-mother/one-partner/one-active-pregnancy invariants without blocking
-- historical completed pregnancies.
create unique index if not exists family_members_user_uidx
  on public.family_members (user_id);

create unique index if not exists family_members_one_mother_per_family_uidx
  on public.family_members (family_id)
  where role = 'mother'::public.janani_role;

create unique index if not exists family_members_one_partner_per_family_uidx
  on public.family_members (family_id)
  where role = 'partner'::public.janani_role;

create unique index if not exists pregnancies_one_active_per_family_uidx
  on public.pregnancies (family_id)
  where status = 'active'::public.pregnancy_status;

create unique index if not exists partner_nudges_sender_mutation_uidx
  on public.partner_nudges (sender_id, client_mutation_id)
  where client_mutation_id is not null;

create index if not exists families_created_by_idx
  on public.families (created_by);

create index if not exists pregnancies_mother_id_idx
  on public.pregnancies (mother_id);

create index if not exists reminder_logs_acted_by_idx
  on public.reminder_logs (acted_by);

create index if not exists partner_nudges_family_id_idx
  on public.partner_nudges (family_id);

create index if not exists partner_nudges_sender_created_at_idx
  on public.partner_nudges (sender_id, created_at desc);

drop index if exists public.family_members_user_idx;
drop index if exists public.reminder_logs_one_occurrence;

-- Shared updated_at behavior. The new families trigger repairs the live RPCs
-- that currently reference a missing families.updated_at column.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at = statement_timestamp();
  return new;
end;
$function$;

drop trigger if exists families_updated_at on public.families;
create trigger families_updated_at
before update on public.families
for each row execute function public.set_updated_at();

-- Prevent permitted UPDATE operations from moving data across users or
-- pregnancies after RLS has evaluated the old row.
create or replace function janani_private.enforce_reminder_identity()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.pregnancy_id is distinct from old.pregnancy_id
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception using
      errcode = '23514',
      message = 'Reminder ownership fields are immutable';
  end if;
  return new;
end;
$function$;

create or replace function janani_private.enforce_journal_identity()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.pregnancy_id is distinct from old.pregnancy_id
     or new.author_id is distinct from old.author_id
     or new.created_at is distinct from old.created_at then
    raise exception using
      errcode = '23514',
      message = 'Journal ownership fields are immutable';
  end if;
  return new;
end;
$function$;

revoke all on function janani_private.enforce_reminder_identity()
  from public, anon, authenticated;
revoke all on function janani_private.enforce_journal_identity()
  from public, anon, authenticated;

drop trigger if exists reminders_enforce_identity on public.reminders;
create trigger reminders_enforce_identity
before update on public.reminders
for each row execute function janani_private.enforce_reminder_identity();

drop trigger if exists journal_entries_enforce_identity on public.journal_entries;
create trigger journal_entries_enforce_identity
before update on public.journal_entries
for each row execute function janani_private.enforce_journal_identity();

-- RLS helpers execute with the table owner's privileges to avoid recursive
-- family_members policies. The private schema is not exposed through PostgREST.
create or replace function janani_private.is_family_member(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.family_members as member
    where member.family_id = target_family_id
      and member.user_id = (select auth.uid())
  );
$function$;

create or replace function janani_private.can_access_pregnancy(
  target_pregnancy_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.pregnancies as pregnancy
    join public.family_members as member
      on member.family_id = pregnancy.family_id
    where pregnancy.id = target_pregnancy_id
      and member.user_id = (select auth.uid())
  );
$function$;

create or replace function janani_private.can_read_shared_journal(
  target_pregnancy_id uuid,
  target_author_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.pregnancies as pregnancy
    join public.family_members as viewer
      on viewer.family_id = pregnancy.family_id
     and viewer.user_id = (select auth.uid())
     and viewer.role in (
       'mother'::public.janani_role,
       'partner'::public.janani_role
     )
    join public.family_members as author
      on author.family_id = pregnancy.family_id
     and author.user_id = target_author_id
     and author.role in (
       'mother'::public.janani_role,
       'partner'::public.janani_role
     )
    where pregnancy.id = target_pregnancy_id
      and viewer.user_id <> author.user_id
  );
$function$;

revoke all on function janani_private.is_family_member(uuid)
  from public, anon, authenticated;
revoke all on function janani_private.can_access_pregnancy(uuid)
  from public, anon, authenticated;
revoke all on function janani_private.can_read_shared_journal(uuid, uuid)
  from public, anon, authenticated;

-- These grants are only for policy evaluation. janani_private is not in the
-- Data API's exposed schemas and authenticated has no CREATE privilege there,
-- so clients cannot invoke the helpers as PostgREST RPCs.
grant execute on function janani_private.is_family_member(uuid)
  to authenticated;
grant execute on function janani_private.can_access_pregnancy(uuid)
  to authenticated;
grant execute on function janani_private.can_read_shared_journal(uuid, uuid)
  to authenticated;

-- Keep auth-trigger logic private and bounded. Empty metadata no longer creates
-- an invalid empty-string profile name.
create or replace function janani_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(
      left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 100),
      ''
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;

revoke all on function janani_private.handle_new_user()
  from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function janani_private.handle_new_user();

-- Family creation and joining are the only membership write paths.
create or replace function public.create_mother_family(
  p_full_name text,
  p_family_name text,
  p_due_date date,
  p_last_menstrual_period date default null,
  p_height_cm numeric default null,
  p_pre_pregnancy_weight_kg numeric default null
)
returns table (
  family_id uuid,
  pregnancy_id uuid,
  invite_code text
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_family_id uuid;
  v_pregnancy_id uuid;
  v_invite_code text;
  v_family_name text :=
    coalesce(nullif(btrim(p_family_name), ''), 'Our little family');
  v_full_name text := nullif(btrim(p_full_name), '');
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  if p_due_date is null then
    raise exception using errcode = '22023', message = 'Due date is required';
  end if;

  if p_due_date < current_date
     or p_due_date > current_date + 320 then
    raise exception using
      errcode = '22023',
      message = 'Due date must be within the next 320 days';
  end if;

  if p_last_menstrual_period is not null
     and p_last_menstrual_period > p_due_date then
    raise exception using
      errcode = '22023',
      message = 'Last menstrual period must not be after the due date';
  end if;

  if p_height_cm is not null
     and p_height_cm not between 80 and 250 then
    raise exception using
      errcode = '22023',
      message = 'Height must be between 80 and 250 cm';
  end if;

  if p_pre_pregnancy_weight_kg is not null
     and p_pre_pregnancy_weight_kg not between 20 and 300 then
    raise exception using
      errcode = '22023',
      message = 'Weight must be between 20 and 300 kg';
  end if;

  if char_length(v_family_name) > 100 then
    raise exception using errcode = '22023', message = 'Family name is too long';
  end if;

  if v_full_name is not null and char_length(v_full_name) > 100 then
    raise exception using errcode = '22023', message = 'Full name is too long';
  end if;

  if exists (
    select 1
    from public.family_members as member
    where member.user_id = v_user_id
  ) then
    raise exception using
      errcode = '23505',
      message = 'This account is already linked to a family';
  end if;

  update public.profiles
  set full_name = v_full_name
  where id = v_user_id;

  if not found then
    raise exception using errcode = '23503', message = 'Profile not found';
  end if;

  loop
    v_invite_code :=
      upper(encode(extensions.gen_random_bytes(10), 'hex'));
    exit when not exists (
      select 1
      from public.families as family
      where family.invite_code = v_invite_code
    );
  end loop;

  insert into public.families (name, invite_code, created_by)
  values (v_family_name, v_invite_code, v_user_id)
  returning id into v_family_id;

  insert into public.family_members (family_id, user_id, role)
  values (
    v_family_id,
    v_user_id,
    'mother'::public.janani_role
  );

  insert into public.pregnancies (
    family_id,
    mother_id,
    due_date,
    last_menstrual_period,
    height_cm,
    pre_pregnancy_weight_kg
  )
  values (
    v_family_id,
    v_user_id,
    p_due_date,
    p_last_menstrual_period,
    p_height_cm,
    p_pre_pregnancy_weight_kg
  )
  returning id into v_pregnancy_id;

  return query
  select v_family_id, v_pregnancy_id, v_invite_code;
end;
$function$;

create or replace function public.join_family_as_partner(
  p_full_name text,
  p_invite_code text
)
returns table (
  family_id uuid,
  pregnancy_id uuid
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_family_id uuid;
  v_pregnancy_id uuid;
  v_invite_code text := upper(btrim(coalesce(p_invite_code, '')));
  v_full_name text := nullif(btrim(p_full_name), '');
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  if v_invite_code !~ '^[0-9A-F]{20}$' then
    raise exception using errcode = '22023', message = 'Invite code is invalid';
  end if;

  if v_full_name is not null and char_length(v_full_name) > 100 then
    raise exception using errcode = '22023', message = 'Full name is too long';
  end if;

  if exists (
    select 1
    from public.family_members as member
    where member.user_id = v_user_id
  ) then
    raise exception using
      errcode = '23505',
      message = 'This account is already linked to a family';
  end if;

  select family.id
  into v_family_id
  from public.families as family
  where family.invite_code = v_invite_code
  for update;

  if v_family_id is null or exists (
    select 1
    from public.family_members as member
    where member.family_id = v_family_id
      and member.role = 'partner'::public.janani_role
  ) then
    raise exception using
      errcode = '22023',
      message = 'Invite code is invalid or has already been used';
  end if;

  update public.profiles as profile
  set full_name = v_full_name
  where profile.id = v_user_id;

  if not found then
    raise exception using errcode = '23503', message = 'Profile not found';
  end if;

  insert into public.family_members (family_id, user_id, role)
  values (
    v_family_id,
    v_user_id,
    'partner'::public.janani_role
  );

  -- One-time invitation: rotate while the family row is still locked.
  update public.families as family
  set invite_code = upper(encode(extensions.gen_random_bytes(10), 'hex'))
  where family.id = v_family_id;

  select pregnancy.id
  into v_pregnancy_id
  from public.pregnancies as pregnancy
  where pregnancy.family_id = v_family_id
    and pregnancy.status = 'active'::public.pregnancy_status
  order by pregnancy.created_at desc
  limit 1;

  return query
  select v_family_id, v_pregnancy_id;
end;
$function$;

create or replace function public.disconnect_partner()
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_family_id uuid;
  v_role text;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  select member.family_id, member.role::text
  into v_family_id, v_role
  from public.family_members as member
  where member.user_id = v_user_id;

  if v_family_id is null or v_role <> 'mother' then
    raise exception using
      errcode = '42501',
      message = 'Only the mother can disconnect the linked partner';
  end if;

  perform 1
  from public.families
  where id = v_family_id
  for update;

  delete from public.family_members
  where family_id = v_family_id
    and role = 'partner'::public.janani_role;

  update public.families
  set invite_code = upper(encode(extensions.gen_random_bytes(10), 'hex'))
  where id = v_family_id;
end;
$function$;

create or replace function public.leave_family()
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_family_id uuid;
  v_role text;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  select member.family_id, member.role::text
  into v_family_id, v_role
  from public.family_members as member
  where member.user_id = v_user_id;

  if v_family_id is null then
    return;
  end if;

  if v_role = 'mother' then
    raise exception using
      errcode = '42501',
      message = 'The mother cannot leave the pregnancy family; use account deletion after exporting any data to keep';
  end if;

  perform 1
  from public.families
  where id = v_family_id
  for update;

  delete from public.family_members
  where family_id = v_family_id
    and user_id = v_user_id;

  update public.families
  set invite_code = upper(encode(extensions.gen_random_bytes(10), 'hex'))
  where id = v_family_id;
end;
$function$;

-- Idempotent, serialized nudge creation prevents retry duplicates and bounds
-- abuse. The two-argument overload is used by the Edge Function; the legacy
-- one-argument API remains compatible with existing direct callers.
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

  select nudge.*
  into v_nudge
  from public.partner_nudges as nudge
  where nudge.sender_id = v_user_id
    and nudge.client_mutation_id = p_client_mutation_id;

  if found then
    return v_nudge;
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

  -- Serialize rate checks per sender without locking unrelated families.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text, 0)
  );

  -- Check again after acquiring the lock so a concurrent retry is idempotent.
  select nudge.*
  into v_nudge
  from public.partner_nudges as nudge
  where nudge.sender_id = v_user_id
    and nudge.client_mutation_id = p_client_mutation_id;

  if found then
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
  on conflict (sender_id, client_mutation_id)
    where client_mutation_id is not null
  do nothing
  returning * into v_nudge;

  if v_nudge.id is null then
    select nudge.*
    into strict v_nudge
    from public.partner_nudges as nudge
    where nudge.sender_id = v_user_id
      and nudge.client_mutation_id = p_client_mutation_id;
  end if;

  return v_nudge;
end;
$function$;

create or replace function public.send_partner_nudge(
  p_message text default 'Thinking of you'
)
returns public.partner_nudges
language sql
security definer
set search_path = ''
as $function$
  select public.send_partner_nudge(
    p_message,
    pg_catalog.gen_random_uuid()
  );
$function$;

create or replace function public.acknowledge_partner_nudge(p_nudge_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  update public.partner_nudges
  set acknowledged_at = coalesce(acknowledged_at, statement_timestamp())
  where id = p_nudge_id
    and recipient_id = v_user_id;

  if not found then
    raise exception using errcode = '42501', message = 'Nudge not found';
  end if;
end;
$function$;

create or replace function public.create_reminder_idempotent(
  p_pregnancy_id uuid,
  p_client_mutation_id uuid,
  p_title text,
  p_instructions text,
  p_kind public.reminder_kind,
  p_start_date date,
  p_end_date date,
  p_local_time time without time zone,
  p_days_of_week smallint[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_reminder_id uuid;
  v_title text := btrim(coalesce(p_title, ''));
  v_instructions text := nullif(btrim(p_instructions), '');
  v_days smallint[] :=
    coalesce(p_days_of_week, array[0,1,2,3,4,5,6]::smallint[]);
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  if p_client_mutation_id is null then
    raise exception using errcode = '22023', message = 'Mutation id is required';
  end if;

  if char_length(v_title) not between 1 and 120 then
    raise exception using
      errcode = '22023',
      message = 'Reminder title must be between 1 and 120 characters';
  end if;

  if v_instructions is not null and char_length(v_instructions) > 2000 then
    raise exception using errcode = '22023', message = 'Instructions are too long';
  end if;

  if p_start_date is null or p_local_time is null then
    raise exception using
      errcode = '22023',
      message = 'Reminder date and time are required';
  end if;

  if p_end_date is not null and p_end_date < p_start_date then
    raise exception using errcode = '22023', message = 'Invalid date range';
  end if;

  if cardinality(v_days) not between 1 and 7
     or not (v_days <@ array[0,1,2,3,4,5,6]::smallint[])
     or array_position(v_days, null::smallint) is not null then
    raise exception using errcode = '22023', message = 'Invalid days of week';
  end if;

  insert into public.reminders (
    pregnancy_id,
    created_by,
    title,
    instructions,
    kind,
    start_date,
    end_date,
    local_time,
    days_of_week,
    client_mutation_id
  )
  values (
    p_pregnancy_id,
    v_user_id,
    v_title,
    v_instructions,
    coalesce(p_kind, 'custom'::public.reminder_kind),
    p_start_date,
    p_end_date,
    p_local_time,
    v_days,
    p_client_mutation_id
  )
  on conflict (created_by, client_mutation_id)
    where client_mutation_id is not null
  do nothing
  returning id into v_reminder_id;

  if v_reminder_id is null then
    select reminder.id
    into strict v_reminder_id
    from public.reminders as reminder
    where reminder.created_by = v_user_id
      and reminder.client_mutation_id = p_client_mutation_id;
  end if;

  return v_reminder_id;
end;
$function$;

create or replace function public.update_reminder_offline_safe(
  p_reminder_id uuid,
  p_title text,
  p_instructions text,
  p_local_time time without time zone
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_title text := btrim(coalesce(p_title, ''));
  v_instructions text := nullif(btrim(p_instructions), '');
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  if char_length(v_title) not between 1 and 120 then
    raise exception using
      errcode = '22023',
      message = 'Reminder title must be between 1 and 120 characters';
  end if;

  if v_instructions is not null and char_length(v_instructions) > 2000 then
    raise exception using errcode = '22023', message = 'Instructions are too long';
  end if;

  if p_local_time is null then
    raise exception using errcode = '22023', message = 'Reminder time is required';
  end if;

  update public.reminders
  set title = v_title,
      instructions = v_instructions,
      local_time = p_local_time,
      is_active = true
  where id = p_reminder_id;

  if not found then
    raise exception using
      errcode = '42501',
      message = 'Reminder not found or access denied';
  end if;

  return p_reminder_id;
end;
$function$;

create or replace function public.mark_reminder_occurrence(
  p_reminder_id uuid,
  p_scheduled_for timestamptz,
  p_state public.reminder_state,
  p_note text default null
)
returns public.reminder_logs
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_pregnancy_id uuid;
  v_note text := nullif(btrim(p_note), '');
  v_result public.reminder_logs;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  if p_scheduled_for is null then
    raise exception using
      errcode = '22023',
      message = 'Scheduled occurrence is required';
  end if;

  if p_state not in (
    'taken'::public.reminder_state,
    'skipped'::public.reminder_state
  ) then
    raise exception using
      errcode = '22023',
      message = 'Only taken or skipped can be recorded by a user';
  end if;

  if v_note is not null and char_length(v_note) > 500 then
    raise exception using errcode = '22023', message = 'Note is too long';
  end if;

  select reminder.pregnancy_id
  into v_pregnancy_id
  from public.reminders as reminder
  where reminder.id = p_reminder_id;

  if v_pregnancy_id is null
     or not janani_private.can_access_pregnancy(v_pregnancy_id) then
    raise exception using
      errcode = '42501',
      message = 'Reminder not found or access denied';
  end if;

  insert into public.reminder_logs (
    reminder_id,
    scheduled_for,
    state,
    acted_by,
    acted_at,
    note
  )
  values (
    p_reminder_id,
    p_scheduled_for,
    p_state,
    v_user_id,
    statement_timestamp(),
    v_note
  )
  on conflict (reminder_id, scheduled_for)
  do update
  set state = excluded.state,
      acted_by = excluded.acted_by,
      acted_at = excluded.acted_at,
      note = excluded.note
  returning * into v_result;

  return v_result;
end;
$function$;

create or replace function public.save_journal_entry_idempotent(
  p_client_mutation_id uuid,
  p_pregnancy_id uuid,
  p_title text,
  p_body text,
  p_mood integer,
  p_is_shared_with_partner boolean,
  p_entry_date date
)
returns public.journal_entries
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_title text := nullif(btrim(p_title), '');
  v_body text := btrim(coalesce(p_body, ''));
  v_entry public.journal_entries;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  if p_client_mutation_id is null then
    raise exception using errcode = '22023', message = 'Mutation id is required';
  end if;

  if v_title is not null and char_length(v_title) > 80 then
    raise exception using errcode = '22023', message = 'Journal title is too long';
  end if;

  if char_length(v_body) not between 1 and 3000 then
    raise exception using
      errcode = '22023',
      message = 'Journal body must be between 1 and 3000 characters';
  end if;

  if p_mood is not null and p_mood not between 1 and 5 then
    raise exception using errcode = '22023', message = 'Invalid mood';
  end if;

  insert into public.journal_entries (
    pregnancy_id,
    author_id,
    title,
    body,
    mood,
    is_shared_with_partner,
    entry_date,
    client_mutation_id
  )
  values (
    p_pregnancy_id,
    v_user_id,
    v_title,
    v_body,
    p_mood,
    coalesce(p_is_shared_with_partner, false),
    coalesce(p_entry_date, current_date),
    p_client_mutation_id
  )
  on conflict (author_id, client_mutation_id)
    where client_mutation_id is not null
  do nothing
  returning * into v_entry;

  if v_entry.id is null then
    select entry.*
    into strict v_entry
    from public.journal_entries as entry
    where entry.author_id = v_user_id
      and entry.client_mutation_id = p_client_mutation_id;
  end if;

  return v_entry;
end;
$function$;

create or replace function public.update_journal_entry_idempotent(
  p_entry_id uuid,
  p_client_mutation_id uuid,
  p_title text,
  p_body text,
  p_mood smallint,
  p_is_shared_with_partner boolean
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_title text := nullif(btrim(p_title), '');
  v_body text := btrim(coalesce(p_body, ''));
  v_existing_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  if p_client_mutation_id is null then
    raise exception using errcode = '22023', message = 'Mutation id is required';
  end if;

  if v_title is not null and char_length(v_title) > 80 then
    raise exception using errcode = '22023', message = 'Journal title is too long';
  end if;

  if char_length(v_body) not between 1 and 3000 then
    raise exception using
      errcode = '22023',
      message = 'Journal body must be between 1 and 3000 characters';
  end if;

  if p_mood is not null and p_mood not between 1 and 5 then
    raise exception using errcode = '22023', message = 'Invalid mood';
  end if;

  select entry.id
  into v_existing_id
  from public.journal_entries as entry
  where entry.author_id = v_user_id
    and entry.last_edit_mutation_id = p_client_mutation_id;

  if v_existing_id is not null then
    if v_existing_id <> p_entry_id then
      raise exception using
        errcode = '22023',
        message = 'Mutation id was already used for a different journal entry';
    end if;
    return v_existing_id;
  end if;

  update public.journal_entries
  set title = v_title,
      body = v_body,
      mood = p_mood,
      is_shared_with_partner = coalesce(p_is_shared_with_partner, false),
      last_edit_mutation_id = p_client_mutation_id
  where id = p_entry_id
    and author_id = v_user_id
  returning id into v_existing_id;

  if v_existing_id is null then
    raise exception using
      errcode = '42501',
      message = 'Journal entry not found or not editable';
  end if;

  return v_existing_id;
end;
$function$;

-- Device token ownership is enforced in these validated RPCs. Claiming a
-- token moves it to the currently authenticated account, which handles a
-- legitimate device being reused after logout without exposing other tokens.
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
    pg_catalog.hashtextextended(v_user_id::text, 1)
  );

  if not exists (
    select 1
    from public.device_push_tokens
    where user_id = v_user_id
      and expo_push_token = v_token
      and is_active
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
  returning id into v_token_id;

  return v_token_id;
end;
$function$;

create or replace function public.unregister_device_push_token(
  p_expo_push_token text
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  update public.device_push_tokens
  set is_active = false,
      last_seen_at = statement_timestamp()
  where user_id = v_user_id
    and expo_push_token = btrim(coalesce(p_expo_push_token, ''));
end;
$function$;

-- Storage objects must be removed through the Storage API before Auth will
-- delete an owning user. This bounded RPC exposes only the caller's object
-- paths so the delete-account Edge Function can perform that API cleanup.
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
  limit least(greatest(coalesce(p_limit, 1000), 1), 1000);
$function$;

-- Replace every legacy policy in one transaction so no permissive PUBLIC
-- policy survives alongside the hardened authenticated-only policies.
do $policies$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles',
        'families',
        'family_members',
        'pregnancies',
        'reminders',
        'reminder_logs',
        'journal_entries',
        'partner_nudges',
        'device_push_tokens'
      )
  loop
    execute format(
      'drop policy %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end
$policies$;

alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.pregnancies enable row level security;
alter table public.reminders enable row level security;
alter table public.reminder_logs enable row level security;
alter table public.journal_entries enable row level security;
alter table public.partner_nudges enable row level security;
alter table public.device_push_tokens enable row level security;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy families_select_member
on public.families
for select
to authenticated
using (janani_private.is_family_member(id));

create policy family_members_select_member
on public.family_members
for select
to authenticated
using (janani_private.is_family_member(family_id));

create policy pregnancies_select_member
on public.pregnancies
for select
to authenticated
using (janani_private.is_family_member(family_id));

create policy reminders_select_member
on public.reminders
for select
to authenticated
using (janani_private.can_access_pregnancy(pregnancy_id));

create policy reminders_insert_member
on public.reminders
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and janani_private.can_access_pregnancy(pregnancy_id)
);

create policy reminders_update_member
on public.reminders
for update
to authenticated
using (janani_private.can_access_pregnancy(pregnancy_id))
with check (janani_private.can_access_pregnancy(pregnancy_id));

create policy reminders_delete_creator
on public.reminders
for delete
to authenticated
using (
  created_by = (select auth.uid())
  and janani_private.can_access_pregnancy(pregnancy_id)
);

create policy reminder_logs_select_member
on public.reminder_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.reminders as reminder
    where reminder.id = reminder_logs.reminder_id
      and janani_private.can_access_pregnancy(reminder.pregnancy_id)
  )
);

create policy journal_entries_select_owner_or_partner
on public.journal_entries
for select
to authenticated
using (
  author_id = (select auth.uid())
  or (
    is_shared_with_partner
    and janani_private.can_read_shared_journal(pregnancy_id, author_id)
  )
);

create policy journal_entries_insert_owner
on public.journal_entries
for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and janani_private.can_access_pregnancy(pregnancy_id)
);

create policy journal_entries_update_owner
on public.journal_entries
for update
to authenticated
using (author_id = (select auth.uid()))
with check (
  author_id = (select auth.uid())
  and janani_private.can_access_pregnancy(pregnancy_id)
);

create policy journal_entries_delete_owner
on public.journal_entries
for delete
to authenticated
using (author_id = (select auth.uid()));

create policy partner_nudges_select_participant
on public.partner_nudges
for select
to authenticated
using (
  (
    sender_id = (select auth.uid())
    or recipient_id = (select auth.uid())
  )
  and janani_private.is_family_member(family_id)
);

create policy device_push_tokens_select_own
on public.device_push_tokens
for select
to authenticated
using (user_id = (select auth.uid()));

create policy device_push_tokens_update_own
on public.device_push_tokens
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- The old exposed helper functions are no longer referenced.
drop function if exists public.is_family_member(uuid);
drop function if exists public.can_access_pregnancy(uuid);
drop function if exists public.handle_new_user();

-- Start from no client privileges. service_role retains its administrative
-- grants and bypasses RLS; anon receives no application-table capability.
revoke all privileges on all tables in schema public from anon, authenticated;
revoke all privileges on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

grant usage on schema public to authenticated;
grant usage on type public.janani_role to authenticated;
grant usage on type public.pregnancy_status to authenticated;
grant usage on type public.reminder_kind to authenticated;
grant usage on type public.reminder_state to authenticated;

grant select on public.profiles to authenticated;
grant update (
  full_name,
  avatar_url,
  phone,
  preferred_language,
  timezone
) on public.profiles to authenticated;

grant select on public.families to authenticated;
grant select on public.family_members to authenticated;
grant select on public.pregnancies to authenticated;

grant select, delete on public.reminders to authenticated;
grant insert (
  pregnancy_id,
  created_by,
  title,
  instructions,
  kind,
  start_date,
  end_date,
  local_time,
  days_of_week,
  client_mutation_id
) on public.reminders to authenticated;
grant update (
  title,
  instructions,
  local_time,
  is_active,
  notification_identifier
) on public.reminders to authenticated;

grant select on public.reminder_logs to authenticated;

grant select, delete on public.journal_entries to authenticated;
grant insert (
  pregnancy_id,
  author_id,
  title,
  body,
  mood,
  photo_paths,
  is_shared_with_partner,
  entry_date,
  client_mutation_id
) on public.journal_entries to authenticated;
grant update (
  title,
  body,
  mood,
  photo_paths,
  is_shared_with_partner,
  entry_date,
  last_edit_mutation_id
) on public.journal_entries to authenticated;

grant select on public.partner_nudges to authenticated;

grant select on public.device_push_tokens to authenticated;
grant update (
  is_active,
  last_seen_at
) on public.device_push_tokens to authenticated;

grant execute on function public.create_mother_family(
  text,
  text,
  date,
  date,
  numeric,
  numeric
) to authenticated;
grant execute on function public.join_family_as_partner(text, text)
  to authenticated;
grant execute on function public.disconnect_partner()
  to authenticated;
grant execute on function public.leave_family()
  to authenticated;
grant execute on function public.send_partner_nudge(text, uuid)
  to authenticated;
grant execute on function public.send_partner_nudge(text)
  to authenticated;
grant execute on function public.acknowledge_partner_nudge(uuid)
  to authenticated;
grant execute on function public.create_reminder_idempotent(
  uuid,
  uuid,
  text,
  text,
  public.reminder_kind,
  date,
  date,
  time without time zone,
  smallint[]
) to authenticated;
grant execute on function public.update_reminder_offline_safe(
  uuid,
  text,
  text,
  time without time zone
) to authenticated;
grant execute on function public.mark_reminder_occurrence(
  uuid,
  timestamptz,
  public.reminder_state,
  text
) to authenticated;
grant execute on function public.save_journal_entry_idempotent(
  uuid,
  uuid,
  text,
  text,
  integer,
  boolean,
  date
) to authenticated;
grant execute on function public.update_journal_entry_idempotent(
  uuid,
  uuid,
  text,
  text,
  smallint,
  boolean
) to authenticated;
grant execute on function public.register_device_push_token(
  text,
  text,
  text
) to authenticated;
grant execute on function public.unregister_device_push_token(text)
  to authenticated;
grant execute on function
  public.list_own_storage_objects_for_account_deletion(integer)
  to authenticated;

-- Future objects must be opted into client access explicitly.
alter default privileges in schema public
  revoke all on tables from anon, authenticated;
alter default privileges in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges in schema public
  revoke execute on functions from public, anon, authenticated;

-- Postgres Changes DELETE events cannot be filtered with RLS. Publish only
-- INSERT/UPDATE and add pregnancies, which the app already subscribes to.
-- Cross-device delete fan-out should use a private Realtime Broadcast channel.
do $realtime$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    execute
      'alter publication supabase_realtime set (publish = ''insert, update'')';

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'pregnancies'
    ) then
      execute
        'alter publication supabase_realtime add table public.pregnancies';
    end if;
  end if;
end
$realtime$;

commit;
