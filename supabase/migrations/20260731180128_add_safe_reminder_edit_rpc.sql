create or replace function public.update_reminder_offline_safe(
  p_reminder_id uuid,
  p_title text,
  p_instructions text,
  p_local_time time without time zone
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if coalesce(length(trim(p_title)),0) = 0 then raise exception 'Reminder title is required'; end if;

  update public.reminders
  set title = trim(p_title),
      instructions = nullif(trim(p_instructions), ''),
      local_time = p_local_time,
      is_active = true,
      updated_at = now()
  where id = p_reminder_id
    and public.can_access_pregnancy(pregnancy_id);

  if not found then raise exception 'Reminder not found or access denied'; end if;
  return p_reminder_id;
end;
$$;

grant execute on function public.update_reminder_offline_safe(uuid,text,text,time without time zone) to authenticated;
