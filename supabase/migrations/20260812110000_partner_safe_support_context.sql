begin;

create or replace function public.get_current_partner_support_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_family_id uuid;
  v_family_name text;
  v_pregnancy public.pregnancies%rowtype;
  v_private public.private_care_contexts%rowtype;
  v_progress_shared boolean := true;
  v_timeline_shared boolean := false;
  v_appointments jsonb := '[]'::jsonb;
begin
  if v_user_id is null then
    raise exception using errcode='28000', message='Authentication required';
  end if;

  select member.family_id, family.name
  into v_family_id, v_family_name
  from public.family_members member
  join public.families family on family.id = member.family_id
  where member.user_id = v_user_id
    and member.role = 'partner'::public.janani_role
  order by member.joined_at desc
  limit 1;

  if v_family_id is null then
    raise exception using errcode='42501', message='Partner support context is available only to a linked partner';
  end if;

  select * into v_pregnancy
  from public.pregnancies pregnancy
  where pregnancy.family_id = v_family_id
    and pregnancy.status in ('active'::public.pregnancy_status,'completed'::public.pregnancy_status)
  order by
    case pregnancy.status when 'active'::public.pregnancy_status then 0 else 1 end,
    pregnancy.updated_at desc,
    pregnancy.created_at desc
  limit 1;

  if v_pregnancy.id is not null then
    select * into v_private
    from public.private_care_contexts context
    where context.pregnancy_id = v_pregnancy.id
      and context.mother_id = v_pregnancy.mother_id;

    if found then
      v_progress_shared := v_private.share_pregnancy_progress_with_partner;
      v_timeline_shared := v_private.share_care_timeline_with_partner;
    end if;

    if v_timeline_shared then
      select coalesce(jsonb_agg(jsonb_build_object(
        'appointmentType', appointment.appointment_type,
        'scheduledAt', appointment.scheduled_at
      ) order by appointment.scheduled_at), '[]'::jsonb)
      into v_appointments
      from (
        select appointment_type, scheduled_at
        from public.care_appointments appointment
        where appointment.pregnancy_id = v_pregnancy.id
          and appointment.mother_id = v_pregnancy.mother_id
          and appointment.status = 'scheduled'
          and appointment.scheduled_at >= now()
        order by appointment.scheduled_at
        limit 3
      ) appointment;
    end if;
  end if;

  return jsonb_build_object(
    'familyName', coalesce(v_family_name, 'Our little family'),
    'pregnancyProgressShared', v_progress_shared,
    'careTimelineShared', v_timeline_shared,
    'pregnancy', case
      when v_pregnancy.id is not null and v_progress_shared then jsonb_build_object(
        'dueDate', v_pregnancy.due_date,
        'status', v_pregnancy.status
      )
      else null
    end,
    'upcomingAppointments', case when v_timeline_shared then v_appointments else '[]'::jsonb end,
    'privateHealthIncluded', false,
    'reportsIncluded', false,
    'medicationsIncluded', false
  );
end;
$function$;

create or replace function public.get_current_own_partner_sharing()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_pregnancy public.pregnancies%rowtype;
  v_context public.private_care_contexts%rowtype;
begin
  if v_user_id is null then raise exception using errcode='28000', message='Authentication required'; end if;
  select * into v_pregnancy
  from public.pregnancies pregnancy
  where pregnancy.mother_id = v_user_id
    and pregnancy.status in ('active'::public.pregnancy_status,'completed'::public.pregnancy_status)
  order by case pregnancy.status when 'active'::public.pregnancy_status then 0 else 1 end,
           pregnancy.updated_at desc, pregnancy.created_at desc
  limit 1;
  if v_pregnancy.id is null then raise exception using errcode='P0002', message='No current mother pregnancy is available'; end if;

  select * into v_context from public.private_care_contexts context
  where context.pregnancy_id=v_pregnancy.id and context.mother_id=v_user_id;

  return jsonb_build_object(
    'pregnancyId', v_pregnancy.id,
    'sharePregnancyProgress', coalesce(v_context.share_pregnancy_progress_with_partner, true),
    'shareCareTimeline', coalesce(v_context.share_care_timeline_with_partner, false)
  );
end;
$function$;

create or replace function public.set_current_own_partner_sharing(
  p_share_pregnancy_progress boolean,
  p_share_care_timeline boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_pregnancy public.pregnancies%rowtype;
begin
  if v_user_id is null then raise exception using errcode='28000', message='Authentication required'; end if;
  if p_share_pregnancy_progress is null or p_share_care_timeline is null then
    raise exception using errcode='22023', message='Both partner-sharing choices are required';
  end if;

  select * into v_pregnancy
  from public.pregnancies pregnancy
  where pregnancy.mother_id = v_user_id
    and pregnancy.status in ('active'::public.pregnancy_status,'completed'::public.pregnancy_status)
  order by case pregnancy.status when 'active'::public.pregnancy_status then 0 else 1 end,
           pregnancy.updated_at desc, pregnancy.created_at desc
  limit 1;
  if v_pregnancy.id is null then raise exception using errcode='P0002', message='No current mother pregnancy is available'; end if;

  insert into public.private_care_contexts(
    pregnancy_id, mother_id, share_pregnancy_progress_with_partner, share_care_timeline_with_partner
  ) values (
    v_pregnancy.id, v_user_id, p_share_pregnancy_progress, p_share_care_timeline
  )
  on conflict (pregnancy_id) do update set
    share_pregnancy_progress_with_partner = excluded.share_pregnancy_progress_with_partner,
    share_care_timeline_with_partner = excluded.share_care_timeline_with_partner,
    updated_at = now();

  return public.get_current_own_partner_sharing();
end;
$function$;

-- Mother always sees her own pregnancy. A partner sees it only while the
-- mother's progress-sharing preference is enabled (default true when no
-- private-care row has been created yet).
drop policy if exists pregnancies_select_member on public.pregnancies;
create policy pregnancies_select_member
on public.pregnancies
for select
to authenticated
using (
  mother_id = (select auth.uid())
  or (
    janani_private.is_family_member(family_id)
    and exists (
      select 1 from public.family_members member
      where member.family_id = pregnancies.family_id
        and member.user_id = (select auth.uid())
        and member.role = 'partner'::public.janani_role
    )
    and coalesce((
      select context.share_pregnancy_progress_with_partner
      from public.private_care_contexts context
      where context.pregnancy_id = pregnancies.id
        and context.mother_id = pregnancies.mother_id
    ), true)
  )
);

revoke all on function public.get_current_partner_support_context() from public, anon;
revoke all on function public.get_current_own_partner_sharing() from public, anon;
revoke all on function public.set_current_own_partner_sharing(boolean,boolean) from public, anon;
grant execute on function public.get_current_partner_support_context() to authenticated;
grant execute on function public.get_current_own_partner_sharing() to authenticated;
grant execute on function public.set_current_own_partner_sharing(boolean,boolean) to authenticated;

commit;
