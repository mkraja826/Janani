begin;

create or replace function public.get_current_own_daily_personalization()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_pregnancy public.pregnancies%rowtype;
  v_profile public.health_profiles%rowtype;
  v_consent public.ai_personalization_consents%rowtype;
  v_pending_report_reviews integer := 0;
  v_next_appointment public.care_appointments%rowtype;
  v_missing_profile_fields text[] := array[]::text[];
  v_action_type text;
  v_action_meta jsonb := '{}'::jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  select * into v_pregnancy
  from public.pregnancies pregnancy
  where pregnancy.mother_id = v_user_id
    and pregnancy.status in ('active'::public.pregnancy_status, 'completed'::public.pregnancy_status)
  order by
    case pregnancy.status when 'active'::public.pregnancy_status then 0 else 1 end,
    pregnancy.updated_at desc,
    pregnancy.created_at desc
  limit 1;

  if not found then
    raise exception using errcode = 'P0002', message = 'No current mother pregnancy is available';
  end if;

  select * into v_profile
  from public.health_profiles profile
  where profile.pregnancy_id = v_pregnancy.id
    and profile.mother_id = v_user_id;

  select * into v_consent
  from public.ai_personalization_consents consent
  where consent.pregnancy_id = v_pregnancy.id
    and consent.mother_id = v_user_id;

  select count(*)::integer
  into v_pending_report_reviews
  from public.medical_report_facts fact
  join public.medical_reports report on report.id = fact.report_id
  where fact.pregnancy_id = v_pregnancy.id
    and fact.mother_id = v_user_id
    and report.mother_id = v_user_id
    and fact.review_status = 'proposed';

  select * into v_next_appointment
  from public.care_appointments appointment
  where appointment.pregnancy_id = v_pregnancy.id
    and appointment.mother_id = v_user_id
    and appointment.status = 'scheduled'
    and appointment.scheduled_at >= now()
  order by appointment.scheduled_at
  limit 1;

  if v_profile.pregnancy_id is null then
    v_missing_profile_fields := array['current_weight','dietary_pattern','activity_level']::text[];
  else
    if v_profile.current_weight_kg is null then
      v_missing_profile_fields := array_append(v_missing_profile_fields, 'current_weight');
    end if;
    if coalesce(v_profile.dietary_pattern, 'no_preference') = 'no_preference' then
      v_missing_profile_fields := array_append(v_missing_profile_fields, 'dietary_pattern');
    end if;
    if coalesce(v_profile.activity_level, 'not_set') = 'not_set' then
      v_missing_profile_fields := array_append(v_missing_profile_fields, 'activity_level');
    end if;
  end if;

  if v_pending_report_reviews > 0 then
    v_action_type := 'review_report';
    v_action_meta := jsonb_build_object('pendingCount', v_pending_report_reviews);
  elsif v_next_appointment.id is not null
    and v_next_appointment.scheduled_at <= now() + interval '7 days' then
    v_action_type := 'upcoming_appointment';
    v_action_meta := jsonb_build_object(
      'appointmentType', v_next_appointment.appointment_type,
      'scheduledAt', v_next_appointment.scheduled_at
    );
  elsif cardinality(v_missing_profile_fields) > 0 then
    v_action_type := 'complete_health_profile';
    v_action_meta := jsonb_build_object('missingFields', to_jsonb(v_missing_profile_fields));
  elsif coalesce(v_profile.dietary_pattern, 'no_preference') <> 'no_preference' then
    v_action_type := 'ask_food_ideas';
    v_action_meta := jsonb_build_object(
      'dietaryPattern', v_profile.dietary_pattern,
      'cuisinePreferences', coalesce(to_jsonb(v_profile.cuisine_preferences), '[]'::jsonb)
    );
  else
    v_action_type := 'open_journey';
  end if;

  return jsonb_build_object(
    'generatedAt', now(),
    'snapshotVersion', 'janani-daily-v1',
    'actionType', v_action_type,
    'actionMeta', v_action_meta,
    'pendingReportReviewCount', v_pending_report_reviews,
    'nextAppointment', case when v_next_appointment.id is null then null else jsonb_build_object(
      'appointmentType', v_next_appointment.appointment_type,
      'scheduledAt', v_next_appointment.scheduled_at
    ) end,
    'healthProfileMissingFields', to_jsonb(v_missing_profile_fields),
    'dietaryPattern', case when v_profile.pregnancy_id is null then null else v_profile.dietary_pattern end,
    'cuisinePreferences', case when v_profile.pregnancy_id is null then '[]'::jsonb else coalesce(to_jsonb(v_profile.cuisine_preferences), '[]'::jsonb) end,
    'aiPersonalizationEnabled', coalesce(v_consent.enabled, false),
    'clinicalAdviceGenerated', false,
    'aiCalled', false
  );
end;
$function$;

revoke all on function public.get_current_own_daily_personalization() from public, anon;
grant execute on function public.get_current_own_daily_personalization() to authenticated;

commit;
