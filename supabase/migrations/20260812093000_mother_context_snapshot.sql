begin;

create or replace function public.get_own_mother_context(
  p_pregnancy_id uuid,
  p_recent_limit integer default 5,
  p_report_fact_limit integer default 100
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_pregnancy public.pregnancies%rowtype;
  v_recent_limit integer := least(greatest(coalesce(p_recent_limit, 5), 1), 20);
  v_report_limit integer := least(greatest(coalesce(p_report_fact_limit, 100), 1), 200);
  v_health_profile jsonb;
  v_conditions jsonb;
  v_medications jsonb;
  v_care_context jsonb;
  v_weights jsonb;
  v_blood_pressure jsonb;
  v_glucose jsonb;
  v_symptoms jsonb;
  v_appointments jsonb;
  v_manual_labs jsonb;
  v_report_facts jsonb;
  v_gestation_days integer;
  v_gestation_source text;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  select * into v_pregnancy
  from public.pregnancies pregnancy
  where pregnancy.id = p_pregnancy_id
    and pregnancy.mother_id = v_user_id;

  if not found then
    raise exception using errcode = '42501', message = 'Mother context is available only to the mother who owns this pregnancy';
  end if;

  if v_pregnancy.last_menstrual_period is not null then
    v_gestation_days := greatest(0, current_date - v_pregnancy.last_menstrual_period);
    v_gestation_source := 'last_menstrual_period';
  elsif v_pregnancy.due_date is not null then
    v_gestation_days := greatest(0, current_date - (v_pregnancy.due_date - 280));
    v_gestation_source := 'due_date_estimate';
  else
    v_gestation_days := null;
    v_gestation_source := null;
  end if;

  select jsonb_build_object(
    'current_weight_kg', profile.current_weight_kg,
    'pregnancy_type', coalesce(profile.pregnancy_type, 'singleton'),
    'dietary_pattern', coalesce(profile.dietary_pattern, 'no_preference'),
    'activity_level', coalesce(profile.activity_level, 'not_set'),
    'cuisine_preferences', coalesce(to_jsonb(profile.cuisine_preferences), '[]'::jsonb),
    'allergies', coalesce(to_jsonb(profile.allergies), '[]'::jsonb),
    'foods_avoided', coalesce(to_jsonb(profile.foods_avoided), '[]'::jsonb),
    'clinician_dietary_instructions', profile.clinician_dietary_instructions,
    'source', 'self_reported'
  ) into v_health_profile
  from (select 1) seed
  left join public.health_profiles profile
    on profile.pregnancy_id = p_pregnancy_id
   and profile.mother_id = v_user_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'condition_code', condition.condition_code,
    'status', condition.status,
    'source', 'self_reported'
  ) order by condition.condition_code), '[]'::jsonb)
  into v_conditions
  from public.health_conditions condition
  where condition.pregnancy_id = p_pregnancy_id
    and condition.mother_id = v_user_id;

  select coalesce(jsonb_agg(item.value order by item.sort_key desc), '[]'::jsonb)
  into v_medications
  from (
    select medication.updated_at as sort_key,
      jsonb_build_object(
        'id', medication.id,
        'kind', medication.kind,
        'name', medication.name,
        'strength', medication.strength,
        'schedule_text', medication.schedule_text,
        'clinician_instructions', medication.clinician_instructions,
        'source', 'mother_recorded_medication'
      ) as value
    from public.care_medications medication
    where medication.pregnancy_id = p_pregnancy_id
      and medication.mother_id = v_user_id
      and medication.active = true
    order by medication.updated_at desc
    limit 30
  ) item;

  select coalesce(jsonb_build_object(
    'preferred_language', context.preferred_language,
    'region_preference', context.region_preference,
    'broader_clinician_instructions', context.broader_clinician_instructions,
    'relevant_medical_history', context.relevant_medical_history,
    'previous_pregnancy_history', context.previous_pregnancy_history,
    'source', 'mother_recorded_care_context'
  ), '{}'::jsonb)
  into v_care_context
  from (select 1) seed
  left join public.private_care_contexts context
    on context.pregnancy_id = p_pregnancy_id
   and context.mother_id = v_user_id;

  select coalesce(jsonb_agg(item.value order by item.sort_key desc), '[]'::jsonb)
  into v_weights
  from (
    select entry.recorded_at as sort_key,
      jsonb_build_object(
        'recorded_at', entry.recorded_at,
        'weight_kg', entry.weight_kg,
        'note', entry.note,
        'source', 'self_recorded_tracker'
      ) as value
    from public.weight_entries entry
    where entry.pregnancy_id = p_pregnancy_id and entry.mother_id = v_user_id
    order by entry.recorded_at desc
    limit v_recent_limit
  ) item;

  select coalesce(jsonb_agg(item.value order by item.sort_key desc), '[]'::jsonb)
  into v_blood_pressure
  from (
    select entry.recorded_at as sort_key,
      jsonb_build_object(
        'recorded_at', entry.recorded_at,
        'systolic', entry.systolic,
        'diastolic', entry.diastolic,
        'pulse', entry.pulse,
        'symptoms', coalesce(to_jsonb(entry.symptoms), '[]'::jsonb),
        'note', entry.note,
        'source', 'self_recorded_tracker'
      ) as value
    from public.blood_pressure_entries entry
    where entry.pregnancy_id = p_pregnancy_id and entry.mother_id = v_user_id
    order by entry.recorded_at desc
    limit v_recent_limit
  ) item;

  select coalesce(jsonb_agg(item.value order by item.sort_key desc), '[]'::jsonb)
  into v_glucose
  from (
    select entry.recorded_at as sort_key,
      jsonb_build_object(
        'recorded_at', entry.recorded_at,
        'value_mg_dl', entry.value_mg_dl,
        'context', entry.context,
        'minutes_after_meal', entry.minutes_after_meal,
        'note', entry.note,
        'source', 'self_recorded_tracker'
      ) as value
    from public.glucose_entries entry
    where entry.pregnancy_id = p_pregnancy_id and entry.mother_id = v_user_id
    order by entry.recorded_at desc
    limit v_recent_limit
  ) item;

  select coalesce(jsonb_agg(item.value order by item.sort_key desc), '[]'::jsonb)
  into v_symptoms
  from (
    select entry.started_at as sort_key,
      jsonb_build_object(
        'started_at', entry.started_at,
        'symptom', entry.symptom,
        'severity', entry.severity,
        'duration_minutes', entry.duration_minutes,
        'contacted_care', entry.contacted_care,
        'note', entry.note,
        'source', 'self_recorded_tracker'
      ) as value
    from public.symptom_entries entry
    where entry.pregnancy_id = p_pregnancy_id and entry.mother_id = v_user_id
    order by entry.started_at desc
    limit v_recent_limit
  ) item;

  select coalesce(jsonb_agg(item.value order by item.sort_key), '[]'::jsonb)
  into v_appointments
  from (
    select appointment.scheduled_at as sort_key,
      jsonb_build_object(
        'id', appointment.id,
        'appointment_type', appointment.appointment_type,
        'scheduled_at', appointment.scheduled_at,
        'provider_name', appointment.provider_name,
        'facility_name', appointment.facility_name,
        'purpose', appointment.purpose,
        'status', appointment.status,
        'next_followup_at', appointment.next_followup_at,
        'source', 'mother_recorded_appointment'
      ) as value
    from public.care_appointments appointment
    where appointment.pregnancy_id = p_pregnancy_id
      and appointment.mother_id = v_user_id
      and appointment.scheduled_at >= now() - interval '1 day'
      and appointment.status <> 'cancelled'
    order by appointment.scheduled_at
    limit 10
  ) item;

  select coalesce(jsonb_agg(item.value order by item.sort_key desc), '[]'::jsonb)
  into v_manual_labs
  from (
    select coalesce(result.tested_on::timestamptz, result.created_at) as sort_key,
      jsonb_build_object(
        'id', result.id,
        'tested_on', result.tested_on,
        'test_name', result.test_name,
        'result_value', result.result_value,
        'unit', result.unit,
        'reference_range', result.reference_range,
        'note', result.note,
        'source', 'mother_recorded_lab_result'
      ) as value
    from public.lab_results result
    where result.pregnancy_id = p_pregnancy_id and result.mother_id = v_user_id
    order by coalesce(result.tested_on::timestamptz, result.created_at) desc
    limit 30
  ) item;

  select coalesce(jsonb_agg(item.value order by item.sort_date desc, item.created_at desc), '[]'::jsonb)
  into v_report_facts
  from (
    select
      coalesce(fact.observed_on, report.report_date, fact.created_at::date) as sort_date,
      fact.created_at,
      jsonb_build_object(
        'fact_id', fact.id,
        'report_id', report.id,
        'report_kind', report.report_kind,
        'report_date', report.report_date,
        'provider_name', report.provider_name,
        'fact_kind', fact.fact_kind,
        'fact_key', fact.fact_key,
        'display_label', fact.display_label,
        'value', fact.confirmed_value,
        'unit', fact.confirmed_unit,
        'reference_range', fact.confirmed_reference_range,
        'observed_on', fact.observed_on,
        'review_status', fact.review_status,
        'source', case when fact.extraction_id is null then 'mother_confirmed_manual_report_fact' else 'mother_confirmed_machine_extraction' end
      ) as value
    from public.medical_report_facts fact
    join public.medical_reports report on report.id = fact.report_id
    where fact.pregnancy_id = p_pregnancy_id
      and fact.mother_id = v_user_id
      and report.mother_id = v_user_id
      and fact.review_status in ('confirmed','corrected')
      and fact.confirmed_value is not null
    order by coalesce(fact.observed_on, report.report_date, fact.created_at::date) desc, fact.created_at desc
    limit v_report_limit
  ) item;

  return jsonb_build_object(
    'pregnancy', jsonb_build_object(
      'id', v_pregnancy.id,
      'due_date', v_pregnancy.due_date,
      'last_menstrual_period', v_pregnancy.last_menstrual_period,
      'pre_pregnancy_weight_kg', v_pregnancy.pre_pregnancy_weight_kg,
      'height_cm', v_pregnancy.height_cm,
      'status', v_pregnancy.status,
      'estimated_gestation_days', v_gestation_days,
      'estimated_gestation_weeks', case when v_gestation_days is null then null else floor(v_gestation_days / 7.0)::integer end,
      'estimated_gestation_day_of_week', case when v_gestation_days is null then null else mod(v_gestation_days, 7) end,
      'gestation_source', v_gestation_source
    ),
    'health_profile', coalesce(v_health_profile, '{}'::jsonb),
    'conditions', v_conditions,
    'active_medications', v_medications,
    'care_context', coalesce(v_care_context, '{}'::jsonb),
    'recent_trackers', jsonb_build_object(
      'weight', v_weights,
      'blood_pressure', v_blood_pressure,
      'glucose', v_glucose,
      'symptoms', v_symptoms
    ),
    'upcoming_appointments', v_appointments,
    'manual_lab_results', v_manual_labs,
    'confirmed_report_facts', v_report_facts,
    'context_meta', jsonb_build_object(
      'generated_at', now(),
      'trust_version', 'mother-context-v1',
      'recent_limit', v_recent_limit,
      'report_fact_limit', v_report_limit,
      'raw_report_files_included', false,
      'proposed_report_facts_included', false,
      'clinical_interpretation_applied', false
    )
  );
end;
$function$;

revoke all on function public.get_own_mother_context(uuid,integer,integer) from public, anon;
grant execute on function public.get_own_mother_context(uuid,integer,integer) to authenticated;

commit;
