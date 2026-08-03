alter table public.journal_entries add column if not exists last_edit_mutation_id uuid;
create unique index if not exists journal_entries_author_edit_mutation_uidx
  on public.journal_entries(author_id, last_edit_mutation_id)
  where last_edit_mutation_id is not null;

alter table public.reminders add column if not exists client_mutation_id uuid;
create unique index if not exists reminders_creator_mutation_uidx
  on public.reminders(created_by, client_mutation_id)
  where client_mutation_id is not null;

create or replace function public.update_journal_entry_idempotent(
  p_entry_id uuid,
  p_client_mutation_id uuid,
  p_title text,
  p_body text,
  p_mood smallint,
  p_is_shared_with_partner boolean
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_existing uuid;
begin
  if v_user is null then raise exception 'Unauthorized'; end if;
  if p_client_mutation_id is null then raise exception 'Mutation id required'; end if;
  if nullif(trim(p_body), '') is null then raise exception 'Entry body required'; end if;
  if p_mood is not null and (p_mood < 1 or p_mood > 5) then raise exception 'Invalid mood'; end if;

  select id into v_existing
  from public.journal_entries
  where author_id = v_user and last_edit_mutation_id = p_client_mutation_id
  limit 1;
  if v_existing is not null then return v_existing; end if;

  update public.journal_entries
  set title = nullif(trim(p_title), ''),
      body = trim(p_body),
      mood = p_mood,
      is_shared_with_partner = coalesce(p_is_shared_with_partner, false),
      last_edit_mutation_id = p_client_mutation_id,
      updated_at = now()
  where id = p_entry_id and author_id = v_user
  returning id into v_existing;

  if v_existing is null then raise exception 'Entry not found or not editable'; end if;
  return v_existing;
end;
$$;

create or replace function public.create_reminder_idempotent(
  p_pregnancy_id uuid,
  p_client_mutation_id uuid,
  p_title text,
  p_instructions text,
  p_kind public.reminder_kind,
  p_start_date date,
  p_end_date date,
  p_local_time time,
  p_days_of_week smallint[]
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
begin
  if v_user is null then raise exception 'Unauthorized'; end if;
  if p_client_mutation_id is null then raise exception 'Mutation id required'; end if;
  if nullif(trim(p_title), '') is null then raise exception 'Reminder title required'; end if;
  if p_end_date is not null and p_end_date < p_start_date then raise exception 'Invalid date range'; end if;

  select id into v_id
  from public.reminders
  where created_by = v_user and client_mutation_id = p_client_mutation_id
  limit 1;
  if v_id is not null then return v_id; end if;

  insert into public.reminders(
    pregnancy_id, created_by, title, instructions, kind, start_date, end_date,
    local_time, days_of_week, client_mutation_id
  ) values (
    p_pregnancy_id, v_user, trim(p_title), nullif(trim(p_instructions), ''), p_kind,
    p_start_date, p_end_date, p_local_time,
    coalesce(p_days_of_week, array[0,1,2,3,4,5,6]::smallint[]), p_client_mutation_id
  )
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.update_journal_entry_idempotent(uuid,uuid,text,text,smallint,boolean) to authenticated;
grant execute on function public.create_reminder_idempotent(uuid,uuid,text,text,public.reminder_kind,date,date,time,smallint[]) to authenticated;
revoke execute on function public.update_journal_entry_idempotent(uuid,uuid,text,text,smallint,boolean) from anon;
revoke execute on function public.create_reminder_idempotent(uuid,uuid,text,text,public.reminder_kind,date,date,time,smallint[]) from anon;
