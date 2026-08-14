begin;

-- Production repair for projects where the integrated health foundation was
-- recorded/applied without the health-tracker RPC surface being available to
-- PostgREST. Recreate the three RPCs idempotently and restore authenticated
-- EXECUTE grants without weakening table RLS or direct table privileges.

create or replace function public.get_own_health_tracker(p_pregnancy_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.pregnancies
    where id = p_pregnancy_id
      and mother_id = v_user_id
  ) then
    raise exception 'Health tracker is available only to the mother who owns this pregnancy';
  end if;

  return jsonb_build_object(
    'weight', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.recorded_at desc)
      from (
        select id, recorded_at, weight_kg, note
        from public.weight_entries
        where pregnancy_id = p_pregnancy_id and mother_id = v_user_id
        order by recorded_at desc
        limit 100
      ) x
    ), '[]'::jsonb),
    'blood_pressure', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.recorded_at desc)
      from (
        select id, recorded_at, systolic, diastolic, pulse, symptoms, note
        from public.blood_pressure_entries
        where pregnancy_id = p_pregnancy_id and mother_id = v_user_id
        order by recorded_at desc
        limit 100
      ) x
    ), '[]'::jsonb),
    'glucose', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.recorded_at desc)
      from (
        select id, recorded_at, value_mg_dl, context, minutes_after_meal, note
        from public.glucose_entries
        where pregnancy_id = p_pregnancy_id and mother_id = v_user_id
        order by recorded_at desc
        limit 100
      ) x
    ), '[]'::jsonb),
    'labs', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.tested_on desc)
      from (
        select id, tested_on, test_name, result_value, unit, reference_range, note
        from public.lab_results
        where pregnancy_id = p_pregnancy_id and mother_id = v_user_id
        order by tested_on desc, created_at desc
        limit 100
      ) x
    ), '[]'::jsonb),
    'symptoms', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.started_at desc)
      from (
        select id, started_at, symptom, severity, duration_minutes, contacted_care, note
        from public.symptom_entries
        where pregnancy_id = p_pregnancy_id and mother_id = v_user_id
        order by started_at desc
        limit 100
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.add_own_health_tracker_entry(
  p_pregnancy_id uuid,
  p_kind text,
  p_entry jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
  v_weight numeric;
  v_symptoms text[];
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.pregnancies
    where id = p_pregnancy_id
      and mother_id = v_user_id
  ) then
    raise exception 'Health tracker is available only to the mother who owns this pregnancy';
  end if;

  if p_kind = 'weight' then
    v_weight := (p_entry ->> 'weight_kg')::numeric;
    insert into public.weight_entries(pregnancy_id, mother_id, recorded_at, weight_kg, note)
    values (
      p_pregnancy_id,
      v_user_id,
      coalesce(nullif(p_entry ->> 'recorded_at', '')::timestamptz, now()),
      v_weight,
      nullif(btrim(coalesce(p_entry ->> 'note', '')), '')
    )
    returning id into v_id;

    update public.health_profiles
    set current_weight_kg = v_weight,
        updated_at = now()
    where pregnancy_id = p_pregnancy_id
      and mother_id = v_user_id;

  elsif p_kind = 'blood_pressure' then
    if jsonb_typeof(coalesce(p_entry -> 'symptoms', '[]'::jsonb)) <> 'array' then
      raise exception 'Symptoms must be an array';
    end if;

    select coalesce(array_agg(x order by x), '{}')
    into v_symptoms
    from (
      select distinct left(btrim(value), 80) x
      from jsonb_array_elements_text(coalesce(p_entry -> 'symptoms', '[]'::jsonb))
      where btrim(value) <> ''
      limit 20
    ) q;

    insert into public.blood_pressure_entries(
      pregnancy_id, mother_id, recorded_at, systolic, diastolic, pulse, symptoms, note
    )
    values (
      p_pregnancy_id,
      v_user_id,
      coalesce(nullif(p_entry ->> 'recorded_at', '')::timestamptz, now()),
      (p_entry ->> 'systolic')::smallint,
      (p_entry ->> 'diastolic')::smallint,
      nullif(p_entry ->> 'pulse', '')::smallint,
      v_symptoms,
      nullif(btrim(coalesce(p_entry ->> 'note', '')), '')
    )
    returning id into v_id;

  elsif p_kind = 'glucose' then
    insert into public.glucose_entries(
      pregnancy_id, mother_id, recorded_at, value_mg_dl, context, minutes_after_meal, note
    )
    values (
      p_pregnancy_id,
      v_user_id,
      coalesce(nullif(p_entry ->> 'recorded_at', '')::timestamptz, now()),
      (p_entry ->> 'value_mg_dl')::numeric,
      p_entry ->> 'context',
      nullif(p_entry ->> 'minutes_after_meal', '')::smallint,
      nullif(btrim(coalesce(p_entry ->> 'note', '')), '')
    )
    returning id into v_id;

  elsif p_kind = 'lab' then
    insert into public.lab_results(
      pregnancy_id, mother_id, tested_on, test_name, result_value, unit, reference_range, note
    )
    values (
      p_pregnancy_id,
      v_user_id,
      (p_entry ->> 'tested_on')::date,
      btrim(p_entry ->> 'test_name'),
      btrim(p_entry ->> 'result_value'),
      nullif(btrim(coalesce(p_entry ->> 'unit', '')), ''),
      nullif(btrim(coalesce(p_entry ->> 'reference_range', '')), ''),
      nullif(btrim(coalesce(p_entry ->> 'note', '')), '')
    )
    returning id into v_id;

  elsif p_kind = 'symptom' then
    insert into public.symptom_entries(
      pregnancy_id, mother_id, started_at, symptom, severity, duration_minutes, contacted_care, note
    )
    values (
      p_pregnancy_id,
      v_user_id,
      coalesce(nullif(p_entry ->> 'started_at', '')::timestamptz, now()),
      btrim(p_entry ->> 'symptom'),
      (p_entry ->> 'severity')::smallint,
      nullif(p_entry ->> 'duration_minutes', '')::integer,
      coalesce(nullif(p_entry ->> 'contacted_care', '')::boolean, false),
      nullif(btrim(coalesce(p_entry ->> 'note', '')), '')
    )
    returning id into v_id;

  else
    raise exception 'Unsupported health tracker entry type';
  end if;

  return v_id;
end;
$$;

create or replace function public.delete_own_health_tracker_entry(
  p_kind text,
  p_entry_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_pregnancy_id uuid;
  v_latest_weight numeric;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_kind = 'weight' then
    delete from public.weight_entries
    where id = p_entry_id and mother_id = v_user_id
    returning pregnancy_id into v_pregnancy_id;

    if v_pregnancy_id is not null then
      select weight_kg
      into v_latest_weight
      from public.weight_entries
      where pregnancy_id = v_pregnancy_id
        and mother_id = v_user_id
      order by recorded_at desc, created_at desc
      limit 1;

      update public.health_profiles
      set current_weight_kg = v_latest_weight,
          updated_at = now()
      where pregnancy_id = v_pregnancy_id
        and mother_id = v_user_id;
    end if;

  elsif p_kind = 'blood_pressure' then
    delete from public.blood_pressure_entries where id = p_entry_id and mother_id = v_user_id;
  elsif p_kind = 'glucose' then
    delete from public.glucose_entries where id = p_entry_id and mother_id = v_user_id;
  elsif p_kind = 'lab' then
    delete from public.lab_results where id = p_entry_id and mother_id = v_user_id;
  elsif p_kind = 'symptom' then
    delete from public.symptom_entries where id = p_entry_id and mother_id = v_user_id;
  else
    raise exception 'Unsupported health tracker entry type';
  end if;
end;
$$;

revoke all on function public.get_own_health_tracker(uuid) from public;
revoke all on function public.add_own_health_tracker_entry(uuid, text, jsonb) from public;
revoke all on function public.delete_own_health_tracker_entry(text, uuid) from public;

grant execute on function public.get_own_health_tracker(uuid) to authenticated;
grant execute on function public.add_own_health_tracker_entry(uuid, text, jsonb) to authenticated;
grant execute on function public.delete_own_health_tracker_entry(text, uuid) to authenticated;

commit;
