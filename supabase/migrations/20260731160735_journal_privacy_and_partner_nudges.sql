drop policy if exists "journal_family_read" on public.journal_entries;
create policy "journal_owner_or_shared_read"
on public.journal_entries for select
to authenticated
using (
  author_id = auth.uid()
  or (
    is_shared_with_partner = true
    and public.can_access_pregnancy(pregnancy_id)
  )
);

drop policy if exists "journal_family_insert" on public.journal_entries;
create policy "journal_author_insert"
on public.journal_entries for insert
to authenticated
with check (
  author_id = auth.uid()
  and public.can_access_pregnancy(pregnancy_id)
);

drop policy if exists "journal_family_update" on public.journal_entries;
create policy "journal_author_update"
on public.journal_entries for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

drop policy if exists "journal_family_delete" on public.journal_entries;
create policy "journal_author_delete"
on public.journal_entries for delete
to authenticated
using (author_id = auth.uid());

create or replace function public.send_partner_nudge(p_message text default 'Thinking of you')
returns public.partner_nudges
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id uuid;
  v_recipient_id uuid;
  v_nudge public.partner_nudges;
begin
  select fm.family_id into v_family_id
  from public.family_members fm
  where fm.user_id = auth.uid()
  limit 1;

  if v_family_id is null then
    raise exception 'No linked family found';
  end if;

  select fm.user_id into v_recipient_id
  from public.family_members fm
  where fm.family_id = v_family_id and fm.user_id <> auth.uid()
  order by fm.joined_at
  limit 1;

  if v_recipient_id is null then
    raise exception 'Your partner has not joined yet';
  end if;

  insert into public.partner_nudges (family_id, sender_id, recipient_id, message)
  values (v_family_id, auth.uid(), v_recipient_id, left(coalesce(nullif(trim(p_message), ''), 'Thinking of you'), 120))
  returning * into v_nudge;

  return v_nudge;
end;
$$;

create or replace function public.acknowledge_partner_nudge(p_nudge_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.partner_nudges
  set acknowledged_at = now()
  where id = p_nudge_id and recipient_id = auth.uid();

  if not found then
    raise exception 'Nudge not found';
  end if;
end;
$$;

revoke all on function public.send_partner_nudge(text) from public, anon;
grant execute on function public.send_partner_nudge(text) to authenticated;
revoke all on function public.acknowledge_partner_nudge(uuid) from public, anon;
grant execute on function public.acknowledge_partner_nudge(uuid) to authenticated;
