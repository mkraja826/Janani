begin;

create or replace function public.get_current_own_mother_context_for_question(
  p_question text,
  p_recent_limit integer default 3,
  p_report_fact_limit integer default 30
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_question text := btrim(coalesce(p_question, ''));
  v_q text;
  v_pregnancy_id uuid;
  v_recent_limit integer := least(greatest(coalesce(p_recent_limit, 3), 1), 10);
  v_report_limit integer := least(greatest(coalesce(p_report_fact_limit, 30), 1), 100);
  v_full jsonb;
  v_topics text[] := array['pregnancy']::text[];
  v_include_nutrition boolean := false;
  v_include_medications boolean := false;
  v_include_reports boolean := false;
  v_include_bp boolean := false;
  v_include_glucose boolean := false;
  v_include_symptoms boolean := false;
  v_include_appointments boolean := false;
  v_include_history boolean := false;
  v_include_weight boolean := false;
  v_recent jsonb := '{}'::jsonb;
  v_care jsonb := '{}'::jsonb;
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  if char_length(v_question) < 1 or char_length(v_question) > 1200 then
    raise exception using errcode = '22023', message = 'Question must be between 1 and 1200 characters';
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

  v_q := lower(v_question);

  v_include_nutrition := v_q ~ '(eat|food|diet|meal|nutrition|protein|iron|calcium|vitamin|water|hydrat|fruit|vegetable|breakfast|lunch|dinner|snack|vegetarian|vegan|non[- ]?veg)';
  v_include_medications := v_q ~ '(medicine|medication|tablet|capsule|dose|dosage|supplement|prescription|drug|folic|levothyroxine|insulin)';
  v_include_reports := v_q ~ '(report|lab|test result|blood test|urine test|cbc|hemoglobin|haemoglobin|tsh|thyroid test|scan report|ultrasound report|gtt|hba1c)';
  v_include_bp := v_q ~ '(blood pressure|(^|[^a-z])bp([^a-z]|$)|hypertension|systolic|diastolic)';
  v_include_glucose := v_q ~ '(glucose|blood sugar|sugar level|diabetes|gdm|gestational diabetes|fasting sugar|postprandial|ppbs)';
  v_include_symptoms := v_q ~ '(symptom|pain|bleed|bleeding|spotting|vomit|nausea|headache|swelling|discharge|movement|breath|fever|itch|cramp|dizz|faint|contraction|fluid leak|watery leak)';
  v_include_appointments := v_q ~ '(appointment|doctor|visit|checkup|check-up|follow[- ]?up|hospital|clinic|scan|ultrasound|vaccin)';
  v_include_history := v_q ~ '(history|previous pregnancy|past pregnancy|miscarriage|abortion|previous birth|previous delivery|medical history)';
  v_include_weight := v_q ~ '(weight|weight gain|kg|bmi)';

  if v_include_nutrition then v_topics := array_append(v_topics, 'nutrition'); end if;
  if v_include_medications then v_topics := array_append(v_topics, 'medications'); end if;
  if v_include_reports then v_topics := array_append(v_topics, 'reports_labs'); end if;
  if v_include_bp then v_topics := array_append(v_topics, 'blood_pressure'); end if;
  if v_include_glucose then v_topics := array_append(v_topics, 'glucose'); end if;
  if v_include_symptoms then v_topics := array_append(v_topics, 'symptoms'); end if;
  if v_include_appointments then v_topics := array_append(v_topics, 'appointments'); end if;
  if v_include_history then v_topics := array_append(v_topics, 'history'); end if;
  if v_include_weight then v_topics := array_append(v_topics, 'weight'); end if;

  v_full := public.get_own_mother_context(v_pregnancy_id, v_recent_limit, v_report_limit);

  v_care := jsonb_strip_nulls(jsonb_build_object(
    'preferred_language', v_full #> '{care_context,preferred_language}',
    'region_preference', v_full #> '{care_context,region_preference}',
    'broader_clinician_instructions', v_full #> '{care_context,broader_clinician_instructions}',
    'source', v_full #> '{care_context,source}'
  ));
  if v_include_history then
    v_care := v_care || jsonb_strip_nulls(jsonb_build_object(
      'relevant_medical_history', v_full #> '{care_context,relevant_medical_history}',
      'previous_pregnancy_history', v_full #> '{care_context,previous_pregnancy_history}'
    ));
  end if;

  if v_include_weight or v_include_nutrition then
    v_recent := v_recent || jsonb_build_object('weight', coalesce(v_full #> '{recent_trackers,weight}', '[]'::jsonb));
  end if;
  if v_include_bp then
    v_recent := v_recent || jsonb_build_object('blood_pressure', coalesce(v_full #> '{recent_trackers,blood_pressure}', '[]'::jsonb));
  end if;
  if v_include_glucose then
    v_recent := v_recent || jsonb_build_object('glucose', coalesce(v_full #> '{recent_trackers,glucose}', '[]'::jsonb));
  end if;
  if v_include_symptoms then
    v_recent := v_recent || jsonb_build_object('symptoms', coalesce(v_full #> '{recent_trackers,symptoms}', '[]'::jsonb));
  end if;

  v_result := jsonb_build_object(
    'pregnancy', v_full->'pregnancy',
    'conditions', coalesce(v_full->'conditions', '[]'::jsonb),
    'care_context', v_care,
    'context_meta', coalesce(v_full->'context_meta', '{}'::jsonb) || jsonb_build_object(
      'selection_version', 'question-context-v1',
      'selection_strategy', 'deterministic_keyword',
      'selected_topics', to_jsonb(v_topics),
      'question_length', char_length(v_question),
      'recent_limit_applied', v_recent_limit,
      'report_fact_limit_applied', v_report_limit,
      'full_history_sent', false,
      'raw_question_stored', false
    )
  );

  if v_include_nutrition or v_include_weight then
    v_result := v_result || jsonb_build_object('health_profile', coalesce(v_full->'health_profile', '{}'::jsonb));
  end if;

  if v_include_medications or v_include_symptoms or v_include_reports or v_include_nutrition then
    v_result := v_result || jsonb_build_object('active_medications', coalesce(v_full->'active_medications', '[]'::jsonb));
  end if;

  if v_recent <> '{}'::jsonb then
    v_result := v_result || jsonb_build_object('recent_trackers', v_recent);
  end if;

  if v_include_appointments then
    v_result := v_result || jsonb_build_object('upcoming_appointments', coalesce(v_full->'upcoming_appointments', '[]'::jsonb));
  end if;

  if v_include_reports or v_include_nutrition or v_include_glucose or v_include_bp then
    v_result := v_result
      || jsonb_build_object('manual_lab_results', coalesce(v_full->'manual_lab_results', '[]'::jsonb))
      || jsonb_build_object('confirmed_report_facts', coalesce(v_full->'confirmed_report_facts', '[]'::jsonb));
  end if;

  return v_result;
end;
$function$;

revoke all on function public.get_current_own_mother_context_for_question(text,integer,integer) from public, anon;
grant execute on function public.get_current_own_mother_context_for_question(text,integer,integer) to authenticated;

commit;
