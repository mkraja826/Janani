begin;

create or replace function public.validate_clinical_source_manifest_server(p_manifest jsonb)
returns void
language plpgsql
immutable
security definer
set search_path = ''
as $function$
declare
  v_source jsonb;
  v_source_id text;
  v_url text;
begin
  if jsonb_typeof(p_manifest) <> 'array'
     or jsonb_array_length(p_manifest) < 1
     or jsonb_array_length(p_manifest) > 100 then
    raise exception using errcode = '22023', message = 'Clinical source manifest must contain between 1 and 100 sources';
  end if;

  for v_source in select value from jsonb_array_elements(p_manifest) loop
    if jsonb_typeof(v_source) <> 'object' then
      raise exception using errcode = '22023', message = 'Each clinical source must be an object';
    end if;
    v_source_id := btrim(coalesce(v_source->>'sourceId', ''));
    v_url := btrim(coalesce(v_source->>'url', ''));
    if v_source_id !~ '^[A-Za-z0-9._:-]{1,120}$' then
      raise exception using errcode = '22023', message = 'Clinical sourceId is missing or invalid';
    end if;
    if char_length(btrim(coalesce(v_source->>'authority', ''))) not between 2 and 200
       or char_length(btrim(coalesce(v_source->>'title', ''))) not between 2 and 300
       or char_length(btrim(coalesce(v_source->>'versionOrDate', ''))) not between 1 and 120 then
      raise exception using errcode = '22023', message = 'Clinical source authority, title and version/date are required';
    end if;
    if char_length(v_url) > 1000 or v_url !~ '^https://[^[:space:]]+$' then
      raise exception using errcode = '22023', message = 'Clinical source URL must be an HTTPS URL';
    end if;
  end loop;

  if exists (
    select 1
    from (
      select source->>'sourceId' as source_id, count(*) as count_value
      from jsonb_array_elements(p_manifest) source
      group by source->>'sourceId'
    ) duplicate
    where duplicate.count_value > 1
  ) then
    raise exception using errcode = '22023', message = 'Clinical sourceIds must be unique within a ruleset';
  end if;
end;
$function$;

create or replace function public.validate_clinical_predicate_server(
  p_predicate jsonb,
  p_depth integer default 0
)
returns void
language plpgsql
immutable
security definer
set search_path = ''
as $function$
declare
  v_op text;
  v_child jsonb;
  v_target text;
  v_comparator text;
  v_status jsonb;
  v_condition_code text;
begin
  if p_depth > 6 then
    raise exception using errcode = '22023', message = 'Clinical rule predicate nesting is too deep';
  end if;
  if jsonb_typeof(p_predicate) <> 'object' then
    raise exception using errcode = '22023', message = 'Clinical rule predicate must be an object';
  end if;
  v_op := p_predicate->>'op';

  if v_op in ('all','any') then
    if exists (select 1 from jsonb_object_keys(p_predicate) key where key not in ('op','conditions')) then
      raise exception using errcode = '22023', message = 'Unsupported field in logical clinical predicate';
    end if;
    if jsonb_typeof(p_predicate->'conditions') <> 'array'
       or jsonb_array_length(p_predicate->'conditions') not between 1 and 20 then
      raise exception using errcode = '22023', message = 'Logical clinical predicate requires 1 to 20 conditions';
    end if;
    for v_child in select value from jsonb_array_elements(p_predicate->'conditions') loop
      perform public.validate_clinical_predicate_server(v_child, p_depth + 1);
    end loop;
    return;
  end if;

  if v_op = 'numeric_compare' then
    if exists (select 1 from jsonb_object_keys(p_predicate) key where key not in ('op','target','comparator','value')) then
      raise exception using errcode = '22023', message = 'Unsupported field in numeric clinical predicate';
    end if;
    v_target := p_predicate->>'target';
    v_comparator := p_predicate->>'comparator';
    if v_target not in (
      'gestation_weeks',
      'latest_weight_kg',
      'latest_bp_systolic',
      'latest_bp_diastolic',
      'latest_bp_pulse',
      'latest_glucose_mg_dl',
      'latest_symptom_severity'
    ) then
      raise exception using errcode = '22023', message = 'Unsupported numeric clinical target';
    end if;
    if v_comparator not in ('lt','lte','eq','gte','gt') then
      raise exception using errcode = '22023', message = 'Unsupported numeric clinical comparator';
    end if;
    if jsonb_typeof(p_predicate->'value') <> 'number' then
      raise exception using errcode = '22023', message = 'Numeric clinical predicate value must be a number';
    end if;
    return;
  end if;

  if v_op = 'condition_present' then
    if exists (select 1 from jsonb_object_keys(p_predicate) key where key not in ('op','conditionCode','statuses')) then
      raise exception using errcode = '22023', message = 'Unsupported field in condition clinical predicate';
    end if;
    v_condition_code := btrim(coalesce(p_predicate->>'conditionCode', ''));
    if v_condition_code not in (
      'preexisting_diabetes','gestational_diabetes','hypothyroidism','hyperthyroidism',
      'chronic_hypertension','pregnancy_hypertension','anemia','pcos',
      'previous_preeclampsia','previous_miscarriage','previous_preterm_birth'
    ) then
      raise exception using errcode = '22023', message = 'Unsupported clinical condition code';
    end if;
    if jsonb_typeof(p_predicate->'statuses') <> 'array'
       or jsonb_array_length(p_predicate->'statuses') not between 1 and 3 then
      raise exception using errcode = '22023', message = 'Condition clinical predicate requires explicit statuses';
    end if;
    for v_status in select value from jsonb_array_elements(p_predicate->'statuses') loop
      if jsonb_typeof(v_status) <> 'string'
         or (v_status #>> '{}') not in ('doctor_diagnosed','under_evaluation','pregnancy_history') then
        raise exception using errcode = '22023', message = 'Unsupported clinical condition status';
      end if;
    end loop;
    return;
  end if;

  if v_op = 'pregnancy_type_is' then
    if exists (select 1 from jsonb_object_keys(p_predicate) key where key not in ('op','value')) then
      raise exception using errcode = '22023', message = 'Unsupported field in pregnancy-type clinical predicate';
    end if;
    if (p_predicate->>'value') not in ('singleton','twins','higher_multiple','unknown') then
      raise exception using errcode = '22023', message = 'Unsupported pregnancy type';
    end if;
    return;
  end if;

  raise exception using errcode = '22023', message = 'Unsupported clinical predicate operator';
end;
$function$;

create or replace function public.validate_clinical_ruleset_server(
  p_ruleset jsonb,
  p_source_manifest jsonb
)
returns void
language plpgsql
immutable
security definer
set search_path = ''
as $function$
declare
  v_rule jsonb;
  v_action jsonb;
  v_source_id jsonb;
  v_id text;
  v_message_key text;
  v_priority numeric;
begin
  perform public.validate_clinical_source_manifest_server(p_source_manifest);

  if jsonb_typeof(p_ruleset) <> 'object'
     or exists (select 1 from jsonb_object_keys(p_ruleset) key where key not in ('schemaVersion','rules'))
     or p_ruleset->>'schemaVersion' <> 'janani-clinical-v1'
     or jsonb_typeof(p_ruleset->'rules') <> 'array'
     or jsonb_array_length(p_ruleset->'rules') > 500 then
    raise exception using errcode = '22023', message = 'Unsupported Janani clinical ruleset schema';
  end if;

  for v_rule in select value from jsonb_array_elements(p_ruleset->'rules') loop
    if jsonb_typeof(v_rule) <> 'object'
       or exists (select 1 from jsonb_object_keys(v_rule) key where key not in ('id','priority','sourceIds','when','action')) then
      raise exception using errcode = '22023', message = 'Clinical rule contains unsupported fields';
    end if;
    v_id := btrim(coalesce(v_rule->>'id', ''));
    if v_id !~ '^[a-z0-9][a-z0-9._-]{0,79}$' then
      raise exception using errcode = '22023', message = 'Clinical rule id is missing or invalid';
    end if;
    if v_rule ? 'priority' then
      if jsonb_typeof(v_rule->'priority') <> 'number' then
        raise exception using errcode = '22023', message = 'Clinical rule priority must be numeric';
      end if;
      v_priority := (v_rule->>'priority')::numeric;
      if v_priority <> trunc(v_priority) or v_priority not between 0 and 10000 then
        raise exception using errcode = '22023', message = 'Clinical rule priority must be an integer from 0 to 10000';
      end if;
    end if;

    if jsonb_typeof(v_rule->'sourceIds') <> 'array'
       or jsonb_array_length(v_rule->'sourceIds') not between 1 and 20 then
      raise exception using errcode = '22023', message = 'Every clinical rule requires sourceIds';
    end if;
    for v_source_id in select value from jsonb_array_elements(v_rule->'sourceIds') loop
      if jsonb_typeof(v_source_id) <> 'string'
         or not exists (
           select 1 from jsonb_array_elements(p_source_manifest) source
           where source->>'sourceId' = (v_source_id #>> '{}')
         ) then
        raise exception using errcode = '22023', message = 'Clinical rule references an unknown sourceId';
      end if;
    end loop;

    perform public.validate_clinical_predicate_server(v_rule->'when', 0);

    v_action := v_rule->'action';
    if jsonb_typeof(v_action) <> 'object'
       or exists (
         select 1 from jsonb_object_keys(v_action) key
         where key not in ('severity','messageKey','blockAiReassurance','requiresCareContact')
       ) then
      raise exception using errcode = '22023', message = 'Clinical rule action contains unsupported fields';
    end if;
    if (v_action->>'severity') not in ('info','attention','urgent') then
      raise exception using errcode = '22023', message = 'Clinical rule action severity is invalid';
    end if;
    v_message_key := btrim(coalesce(v_action->>'messageKey', ''));
    if v_message_key !~ '^clinical\.[a-z0-9][a-z0-9._-]{0,110}$' then
      raise exception using errcode = '22023', message = 'Clinical rule action messageKey is invalid';
    end if;
    if jsonb_typeof(v_action->'blockAiReassurance') <> 'boolean'
       or jsonb_typeof(v_action->'requiresCareContact') <> 'boolean' then
      raise exception using errcode = '22023', message = 'Clinical rule safety action flags must be booleans';
    end if;
    if v_action->>'severity' = 'urgent'
       and ((v_action->>'blockAiReassurance')::boolean is not true
         or (v_action->>'requiresCareContact')::boolean is not true) then
      raise exception using errcode = '22023', message = 'Urgent clinical rules must block AI reassurance and require care contact';
    end if;
  end loop;

  if exists (
    select 1
    from (
      select rule->>'id' as rule_id, count(*) as count_value
      from jsonb_array_elements(p_ruleset->'rules') rule
      group by rule->>'id'
    ) duplicate
    where duplicate.count_value > 1
  ) then
    raise exception using errcode = '22023', message = 'Clinical rule ids must be unique within a ruleset';
  end if;
end;
$function$;

create or replace function public.enforce_clinical_rule_version_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_expected_hash text;
begin
  if tg_op = 'UPDATE' then
    raise exception using errcode = '55000', message = 'Clinical rule versions are immutable';
  end if;
  perform public.validate_clinical_ruleset_server(new.ruleset, new.source_manifest);
  v_expected_hash := encode(extensions.digest(convert_to(new.ruleset::text, 'UTF8'), 'sha256'), 'hex');
  if new.ruleset_hash <> v_expected_hash then
    raise exception using errcode = '22023', message = 'Clinical ruleset hash does not match its payload';
  end if;
  return new;
end;
$function$;

drop trigger if exists clinical_rule_versions_integrity on public.clinical_rule_versions;
create trigger clinical_rule_versions_integrity
before insert or update on public.clinical_rule_versions
for each row execute function public.enforce_clinical_rule_version_integrity();

create or replace function public.clinical_numeric_value_server(p_context jsonb, p_target text)
returns numeric
language plpgsql
immutable
security definer
set search_path = ''
as $function$
declare
  v_value jsonb;
begin
  v_value := case p_target
    when 'gestation_weeks' then p_context #> '{pregnancy,estimated_gestation_weeks}'
    when 'latest_weight_kg' then p_context #> '{recent_trackers,weight,0,weight_kg}'
    when 'latest_bp_systolic' then p_context #> '{recent_trackers,blood_pressure,0,systolic}'
    when 'latest_bp_diastolic' then p_context #> '{recent_trackers,blood_pressure,0,diastolic}'
    when 'latest_bp_pulse' then p_context #> '{recent_trackers,blood_pressure,0,pulse}'
    when 'latest_glucose_mg_dl' then p_context #> '{recent_trackers,glucose,0,value_mg_dl}'
    when 'latest_symptom_severity' then p_context #> '{recent_trackers,symptoms,0,severity}'
    else null
  end;
  if v_value is null or jsonb_typeof(v_value) <> 'number' then return null; end if;
  return (v_value #>> '{}')::numeric;
exception when others then
  return null;
end;
$function$;

create or replace function public.evaluate_clinical_predicate_server(
  p_context jsonb,
  p_predicate jsonb,
  p_depth integer default 0
)
returns boolean
language plpgsql
immutable
security definer
set search_path = ''
as $function$
declare
  v_op text := p_predicate->>'op';
  v_child jsonb;
  v_actual numeric;
  v_expected numeric;
  v_comparator text;
  v_condition_code text;
  v_statuses jsonb;
begin
  perform public.validate_clinical_predicate_server(p_predicate, p_depth);

  if v_op = 'all' then
    for v_child in select value from jsonb_array_elements(p_predicate->'conditions') loop
      if not public.evaluate_clinical_predicate_server(p_context, v_child, p_depth + 1) then return false; end if;
    end loop;
    return true;
  end if;

  if v_op = 'any' then
    for v_child in select value from jsonb_array_elements(p_predicate->'conditions') loop
      if public.evaluate_clinical_predicate_server(p_context, v_child, p_depth + 1) then return true; end if;
    end loop;
    return false;
  end if;

  if v_op = 'numeric_compare' then
    v_actual := public.clinical_numeric_value_server(p_context, p_predicate->>'target');
    if v_actual is null then return false; end if;
    v_expected := (p_predicate->>'value')::numeric;
    v_comparator := p_predicate->>'comparator';
    return case v_comparator
      when 'lt' then v_actual < v_expected
      when 'lte' then v_actual <= v_expected
      when 'eq' then v_actual = v_expected
      when 'gte' then v_actual >= v_expected
      when 'gt' then v_actual > v_expected
      else false
    end;
  end if;

  if v_op = 'condition_present' then
    v_condition_code := p_predicate->>'conditionCode';
    v_statuses := p_predicate->'statuses';
    return exists (
      select 1
      from jsonb_array_elements(coalesce(p_context->'conditions', '[]'::jsonb)) condition
      where condition->>'condition_code' = v_condition_code
        and exists (
          select 1 from jsonb_array_elements_text(v_statuses) allowed_status
          where allowed_status = condition->>'status'
        )
    );
  end if;

  if v_op = 'pregnancy_type_is' then
    return coalesce(p_context #>> '{health_profile,pregnancy_type}', 'unknown') = p_predicate->>'value';
  end if;

  return false;
end;
$function$;

create or replace function public.evaluate_approved_clinical_rules_server(
  p_context jsonb,
  p_condition_codes text[]
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_packs jsonb;
  v_pack jsonb;
  v_rule jsonb;
  v_action jsonb;
  v_decisions jsonb := '[]'::jsonb;
  v_highest text := 'none';
  v_block boolean := false;
  v_contact boolean := false;
  v_rules_evaluated integer := 0;
  v_rules_matched integer := 0;
begin
  v_packs := public.get_active_clinical_rules_server(coalesce(p_condition_codes, array[]::text[]));

  for v_pack in select value from jsonb_array_elements(v_packs) loop
    perform public.validate_clinical_ruleset_server(v_pack->'ruleset', v_pack->'sourceManifest');
    for v_rule in select value from jsonb_array_elements(v_pack #> '{ruleset,rules}') order by coalesce((value->>'priority')::integer, 0) desc, value->>'id' loop
      v_rules_evaluated := v_rules_evaluated + 1;
      if public.evaluate_clinical_predicate_server(p_context, v_rule->'when', 0) then
        v_action := v_rule->'action';
        v_rules_matched := v_rules_matched + 1;
        v_decisions := v_decisions || jsonb_build_array(jsonb_build_object(
          'conditionCode', v_pack->>'conditionCode',
          'ruleId', v_rule->>'id',
          'ruleVersion', v_pack->>'version',
          'rulesetHash', v_pack->>'rulesetHash',
          'severity', v_action->>'severity',
          'messageKey', v_action->>'messageKey',
          'blockAiReassurance', (v_action->>'blockAiReassurance')::boolean,
          'requiresCareContact', (v_action->>'requiresCareContact')::boolean,
          'sourceIds', v_rule->'sourceIds'
        ));
        v_block := v_block or (v_action->>'blockAiReassurance')::boolean;
        v_contact := v_contact or (v_action->>'requiresCareContact')::boolean;
        if v_action->>'severity' = 'urgent' then
          v_highest := 'urgent';
        elsif v_action->>'severity' = 'attention' and v_highest not in ('urgent') then
          v_highest := 'attention';
        elsif v_action->>'severity' = 'info' and v_highest = 'none' then
          v_highest := 'info';
        end if;
      end if;
    end loop;
  end loop;

  return jsonb_build_object(
    'engineVersion', 'janani-clinical-safety-v1',
    'activeRulePackCount', jsonb_array_length(v_packs),
    'rulesEvaluated', v_rules_evaluated,
    'rulesMatched', v_rules_matched,
    'decisions', v_decisions,
    'highestSeverity', v_highest,
    'blockAiReassurance', v_block,
    'requiresCareContact', v_contact,
    'clinicalContentAvailable', jsonb_array_length(v_packs) > 0,
    'failClosed', true
  );
end;
$function$;

create or replace function public.evaluate_current_own_clinical_safety()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_context jsonb;
  v_condition_codes text[];
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  v_context := public.get_current_own_mother_context();
  select coalesce(array_agg(distinct condition->>'condition_code') filter (where condition->>'condition_code' is not null), array[]::text[])
  into v_condition_codes
  from jsonb_array_elements(coalesce(v_context->'conditions', '[]'::jsonb)) condition;

  -- Reserve pregnancy_safety as a future general-maternal safety domain. It
  -- currently has no approved rule pack, so it contributes no decisions.
  v_condition_codes := array_append(v_condition_codes, 'pregnancy_safety');

  return public.evaluate_approved_clinical_rules_server(v_context, v_condition_codes);
end;
$function$;

revoke all on function public.validate_clinical_source_manifest_server(jsonb) from public, anon, authenticated;
revoke all on function public.validate_clinical_predicate_server(jsonb,integer) from public, anon, authenticated;
revoke all on function public.validate_clinical_ruleset_server(jsonb,jsonb) from public, anon, authenticated;
revoke all on function public.enforce_clinical_rule_version_integrity() from public, anon, authenticated;
revoke all on function public.clinical_numeric_value_server(jsonb,text) from public, anon, authenticated;
revoke all on function public.evaluate_clinical_predicate_server(jsonb,jsonb,integer) from public, anon, authenticated;
revoke all on function public.evaluate_approved_clinical_rules_server(jsonb,text[]) from public, anon, authenticated;
revoke all on function public.evaluate_current_own_clinical_safety() from public, anon;

grant execute on function public.validate_clinical_source_manifest_server(jsonb) to service_role;
grant execute on function public.validate_clinical_predicate_server(jsonb,integer) to service_role;
grant execute on function public.validate_clinical_ruleset_server(jsonb,jsonb) to service_role;
grant execute on function public.clinical_numeric_value_server(jsonb,text) to service_role;
grant execute on function public.evaluate_clinical_predicate_server(jsonb,jsonb,integer) to service_role;
grant execute on function public.evaluate_approved_clinical_rules_server(jsonb,text[]) to service_role;
grant execute on function public.evaluate_current_own_clinical_safety() to authenticated, service_role;

commit;
