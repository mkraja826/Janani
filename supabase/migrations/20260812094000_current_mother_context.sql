begin;

create or replace function public.get_current_own_mother_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_pregnancy_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  select pregnancy.id
  into v_pregnancy_id
  from public.pregnancies pregnancy
  where pregnancy.mother_id = v_user_id
    and pregnancy.status in ('active'::public.pregnancy_status, 'completed'::public.pregnancy_status)
  order by
    case pregnancy.status
      when 'active'::public.pregnancy_status then 0
      else 1
    end,
    pregnancy.updated_at desc,
    pregnancy.created_at desc
  limit 1;

  if v_pregnancy_id is null then
    raise exception using errcode = 'P0002', message = 'No current mother pregnancy context is available';
  end if;

  return public.get_own_mother_context(v_pregnancy_id, 5, 100);
end;
$function$;

revoke all on function public.get_current_own_mother_context() from public, anon;
grant execute on function public.get_current_own_mother_context() to authenticated;

commit;
