alter table public.reminders
  add column if not exists notification_identifier text;

create unique index if not exists reminder_logs_one_occurrence
  on public.reminder_logs(reminder_id, scheduled_for);

create or replace function public.mark_reminder_occurrence(
  p_reminder_id uuid,
  p_scheduled_for timestamptz,
  p_state public.reminder_state,
  p_note text default null
)
returns public.reminder_logs
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.reminder_logs;
begin
  if not public.can_access_pregnancy((select pregnancy_id from public.reminders where id = p_reminder_id)) then
    raise exception 'Not authorized for this reminder';
  end if;

  insert into public.reminder_logs(reminder_id, scheduled_for, state, acted_by, acted_at, note)
  values (p_reminder_id, p_scheduled_for, p_state, auth.uid(), now(), p_note)
  on conflict (reminder_id, scheduled_for)
  do update set
    state = excluded.state,
    acted_by = excluded.acted_by,
    acted_at = excluded.acted_at,
    note = excluded.note
  returning * into result;

  return result;
end;
$$;

revoke all on function public.mark_reminder_occurrence(uuid, timestamptz, public.reminder_state, text) from public, anon;
grant execute on function public.mark_reminder_occurrence(uuid, timestamptz, public.reminder_state, text) to authenticated;
