begin;

create table if not exists public.health_profiles (
  id uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null unique references public.pregnancies(id) on delete cascade,
  mother_id uuid not null references public.profiles(id) on delete cascade,
  current_weight_kg numeric(5,2),
  pregnancy_type text not null default 'singleton' check (pregnancy_type in ('singleton','twins','higher_multiple','unknown')),
  dietary_pattern text not null default 'no_preference' check (dietary_pattern in ('vegetarian','eggetarian','non_vegetarian','vegan','no_preference')),
  activity_level text not null default 'not_set' check (activity_level in ('low','moderate','high','clinician_restricted','not_set')),
  cuisine_preferences text[] not null default '{}',
  allergies text[] not null default '{}',
  foods_avoided text[] not null default '{}',
  clinician_dietary_instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (current_weight_kg is null or current_weight_kg between 25 and 300),
  check (cardinality(cuisine_preferences) <= 20),
  check (cardinality(allergies) <= 20),
  check (cardinality(foods_avoided) <= 20),
  check (clinician_dietary_instructions is null or char_length(clinician_dietary_instructions) <= 2000)
);

create table if not exists public.health_conditions (
  id uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references public.pregnancies(id) on delete cascade,
  mother_id uuid not null references public.profiles(id) on delete cascade,
  condition_code text not null check (condition_code in (
    'preexisting_diabetes','gestational_diabetes','hypothyroidism','hyperthyroidism',
    'chronic_hypertension','pregnancy_hypertension','anemia','pcos',
    'previous_preeclampsia','previous_miscarriage','previous_preterm_birth'
  )),
  status text not null check (status in ('doctor_diagnosed','under_evaluation','pregnancy_history')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pregnancy_id, condition_code),
  check (condition_code not in ('previous_preeclampsia','previous_miscarriage','previous_preterm_birth') or status = 'pregnancy_history')
);

create table if not exists public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references public.pregnancies(id) on delete cascade,
  mother_id uuid not null references public.profiles(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  weight_kg numeric(5,2) not null check (weight_kg between 25 and 300),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now()
);

create table if not exists public.blood_pressure_entries (
  id uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references public.pregnancies(id) on delete cascade,
  mother_id uuid not null references public.profiles(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  systolic smallint not null check (systolic between 50 and 260),
  diastolic smallint not null check (diastolic between 30 and 180),
  pulse smallint check (pulse is null or pulse between 30 and 220),
  symptoms text[] not null default '{}',
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  check (cardinality(symptoms) <= 20)
);

create table if not exists public.glucose_entries (
  id uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references public.pregnancies(id) on delete cascade,
  mother_id uuid not null references public.profiles(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  value_mg_dl numeric(6,1) not null check (value_mg_dl between 20 and 700),
  context text not null check (context in ('fasting','before_meal','after_meal','random','other')),
  minutes_after_meal smallint check (minutes_after_meal is null or minutes_after_meal between 0 and 360),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now()
);

create table if not exists public.lab_results (
  id uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references public.pregnancies(id) on delete cascade,
  mother_id uuid not null references public.profiles(id) on delete cascade,
  tested_on date not null,
  test_name text not null check (char_length(test_name) between 1 and 100),
  result_value text not null check (char_length(result_value) between 1 and 100),
  unit text check (unit is null or char_length(unit) <= 40),
  reference_range text check (reference_range is null or char_length(reference_range) <= 100),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now()
);

create table if not exists public.symptom_entries (
  id uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references public.pregnancies(id) on delete cascade,
  mother_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  symptom text not null check (char_length(symptom) between 1 and 120),
  severity smallint not null check (severity between 1 and 5),
  duration_minutes integer check (duration_minutes is null or duration_minutes between 0 and 10080),
  contacted_care boolean not null default false,
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists health_profiles_mother_id_idx on public.health_profiles(mother_id);
create index if not exists health_conditions_pregnancy_id_idx on public.health_conditions(pregnancy_id);
create index if not exists weight_entries_pregnancy_recorded_idx on public.weight_entries(pregnancy_id, recorded_at desc);
create index if not exists blood_pressure_entries_pregnancy_recorded_idx on public.blood_pressure_entries(pregnancy_id, recorded_at desc);
create index if not exists glucose_entries_pregnancy_recorded_idx on public.glucose_entries(pregnancy_id, recorded_at desc);
create index if not exists lab_results_pregnancy_tested_idx on public.lab_results(pregnancy_id, tested_on desc);
create index if not exists symptom_entries_pregnancy_started_idx on public.symptom_entries(pregnancy_id, started_at desc);

alter table public.health_profiles enable row level security;
alter table public.health_conditions enable row level security;
alter table public.weight_entries enable row level security;
alter table public.blood_pressure_entries enable row level security;
alter table public.glucose_entries enable row level security;
alter table public.lab_results enable row level security;
alter table public.symptom_entries enable row level security;

revoke all on public.health_profiles, public.health_conditions, public.weight_entries,
  public.blood_pressure_entries, public.glucose_entries, public.lab_results, public.symptom_entries
  from anon, authenticated;

create or replace function public.get_own_health_profile(p_pregnancy_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user_id uuid := auth.uid(); v_result jsonb;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.pregnancies where id = p_pregnancy_id and mother_id = v_user_id) then
    raise exception 'Health profile is available only to the mother who owns this pregnancy';
  end if;
  select jsonb_build_object(
    'pregnancy_id', p_pregnancy_id,
    'current_weight_kg', hp.current_weight_kg,
    'pregnancy_type', coalesce(hp.pregnancy_type,'singleton'),
    'dietary_pattern', coalesce(hp.dietary_pattern,'no_preference'),
    'activity_level', coalesce(hp.activity_level,'not_set'),
    'cuisine_preferences', coalesce(to_jsonb(hp.cuisine_preferences),'[]'::jsonb),
    'allergies', coalesce(to_jsonb(hp.allergies),'[]'::jsonb),
    'foods_avoided', coalesce(to_jsonb(hp.foods_avoided),'[]'::jsonb),
    'clinician_dietary_instructions', hp.clinician_dietary_instructions,
    'conditions', coalesce((select jsonb_agg(jsonb_build_object('condition_code',condition_code,'status',status) order by condition_code)
      from public.health_conditions where pregnancy_id=p_pregnancy_id and mother_id=v_user_id),'[]'::jsonb)
  ) into v_result
  from (select 1) seed left join public.health_profiles hp on hp.pregnancy_id=p_pregnancy_id and hp.mother_id=v_user_id;
  return v_result;
end; $$;

create or replace function public.save_own_health_profile(p_pregnancy_id uuid, p_profile jsonb, p_conditions jsonb default '[]'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := auth.uid(); v_weight numeric; v_instructions text; v_condition jsonb;
  v_cuisines text[]; v_allergies text[]; v_avoided text[];
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.pregnancies where id=p_pregnancy_id and mother_id=v_user_id) then
    raise exception 'Health profile is available only to the mother who owns this pregnancy';
  end if;
  if jsonb_typeof(coalesce(p_profile->'cuisine_preferences','[]'::jsonb)) <> 'array'
     or jsonb_typeof(coalesce(p_profile->'allergies','[]'::jsonb)) <> 'array'
     or jsonb_typeof(coalesce(p_profile->'foods_avoided','[]'::jsonb)) <> 'array'
     or jsonb_typeof(coalesce(p_conditions,'[]'::jsonb)) <> 'array' then
    raise exception 'Health profile list fields must be arrays';
  end if;
  select coalesce(array_agg(x order by x), '{}') into v_cuisines from (
    select distinct left(btrim(value),80) x from jsonb_array_elements_text(coalesce(p_profile->'cuisine_preferences','[]'::jsonb)) where btrim(value)<>'' limit 20
  ) q;
  select coalesce(array_agg(x order by x), '{}') into v_allergies from (
    select distinct left(btrim(value),80) x from jsonb_array_elements_text(coalesce(p_profile->'allergies','[]'::jsonb)) where btrim(value)<>'' limit 20
  ) q;
  select coalesce(array_agg(x order by x), '{}') into v_avoided from (
    select distinct left(btrim(value),80) x from jsonb_array_elements_text(coalesce(p_profile->'foods_avoided','[]'::jsonb)) where btrim(value)<>'' limit 20
  ) q;
  v_weight := nullif(p_profile->>'current_weight_kg','')::numeric;
  v_instructions := nullif(btrim(coalesce(p_profile->>'clinician_dietary_instructions','')), '');
  if v_weight is not null and not (v_weight between 25 and 300) then raise exception 'Current weight must be between 25 and 300 kg'; end if;
  if v_instructions is not null and char_length(v_instructions)>2000 then raise exception 'Clinician instructions are too long'; end if;

  insert into public.health_profiles(pregnancy_id,mother_id,current_weight_kg,pregnancy_type,dietary_pattern,activity_level,cuisine_preferences,allergies,foods_avoided,clinician_dietary_instructions,updated_at)
  values(p_pregnancy_id,v_user_id,v_weight,coalesce(nullif(p_profile->>'pregnancy_type',''),'singleton'),coalesce(nullif(p_profile->>'dietary_pattern',''),'no_preference'),coalesce(nullif(p_profile->>'activity_level',''),'not_set'),v_cuisines,v_allergies,v_avoided,v_instructions,now())
  on conflict(pregnancy_id) do update set mother_id=excluded.mother_id,current_weight_kg=excluded.current_weight_kg,pregnancy_type=excluded.pregnancy_type,dietary_pattern=excluded.dietary_pattern,activity_level=excluded.activity_level,cuisine_preferences=excluded.cuisine_preferences,allergies=excluded.allergies,foods_avoided=excluded.foods_avoided,clinician_dietary_instructions=excluded.clinician_dietary_instructions,updated_at=now();

  delete from public.health_conditions where pregnancy_id=p_pregnancy_id and mother_id=v_user_id;
  if jsonb_array_length(coalesce(p_conditions,'[]'::jsonb)) > 20 then raise exception 'Too many health conditions'; end if;
  for v_condition in select value from jsonb_array_elements(coalesce(p_conditions,'[]'::jsonb)) loop
    insert into public.health_conditions(pregnancy_id,mother_id,condition_code,status,updated_at)
    values(p_pregnancy_id,v_user_id,v_condition->>'condition_code',v_condition->>'status',now());
  end loop;
  return public.get_own_health_profile(p_pregnancy_id);
end; $$;

create or replace function public.get_own_health_tracker(p_pregnancy_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.pregnancies where id=p_pregnancy_id and mother_id=v_user_id) then raise exception 'Health tracker is available only to the mother who owns this pregnancy'; end if;
  return jsonb_build_object(
    'weight', coalesce((select jsonb_agg(to_jsonb(x) order by x.recorded_at desc) from (select id,recorded_at,weight_kg,note from public.weight_entries where pregnancy_id=p_pregnancy_id and mother_id=v_user_id order by recorded_at desc limit 100) x),'[]'::jsonb),
    'blood_pressure', coalesce((select jsonb_agg(to_jsonb(x) order by x.recorded_at desc) from (select id,recorded_at,systolic,diastolic,pulse,symptoms,note from public.blood_pressure_entries where pregnancy_id=p_pregnancy_id and mother_id=v_user_id order by recorded_at desc limit 100) x),'[]'::jsonb),
    'glucose', coalesce((select jsonb_agg(to_jsonb(x) order by x.recorded_at desc) from (select id,recorded_at,value_mg_dl,context,minutes_after_meal,note from public.glucose_entries where pregnancy_id=p_pregnancy_id and mother_id=v_user_id order by recorded_at desc limit 100) x),'[]'::jsonb),
    'labs', coalesce((select jsonb_agg(to_jsonb(x) order by x.tested_on desc) from (select id,tested_on,test_name,result_value,unit,reference_range,note from public.lab_results where pregnancy_id=p_pregnancy_id and mother_id=v_user_id order by tested_on desc, created_at desc limit 100) x),'[]'::jsonb),
    'symptoms', coalesce((select jsonb_agg(to_jsonb(x) order by x.started_at desc) from (select id,started_at,symptom,severity,duration_minutes,contacted_care,note from public.symptom_entries where pregnancy_id=p_pregnancy_id and mother_id=v_user_id order by started_at desc limit 100) x),'[]'::jsonb)
  );
end; $$;

create or replace function public.add_own_health_tracker_entry(p_pregnancy_id uuid,p_kind text,p_entry jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_user_id uuid := auth.uid(); v_id uuid; v_weight numeric; v_symptoms text[];
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.pregnancies where id=p_pregnancy_id and mother_id=v_user_id) then raise exception 'Health tracker is available only to the mother who owns this pregnancy'; end if;
  if p_kind='weight' then
    v_weight := (p_entry->>'weight_kg')::numeric;
    insert into public.weight_entries(pregnancy_id,mother_id,recorded_at,weight_kg,note) values(p_pregnancy_id,v_user_id,coalesce(nullif(p_entry->>'recorded_at','')::timestamptz,now()),v_weight,nullif(btrim(coalesce(p_entry->>'note','')),'')) returning id into v_id;
    update public.health_profiles set current_weight_kg=v_weight,updated_at=now() where pregnancy_id=p_pregnancy_id and mother_id=v_user_id;
  elsif p_kind='blood_pressure' then
    if jsonb_typeof(coalesce(p_entry->'symptoms','[]'::jsonb)) <> 'array' then raise exception 'Symptoms must be an array'; end if;
    select coalesce(array_agg(x order by x),'{}') into v_symptoms from (select distinct left(btrim(value),80) x from jsonb_array_elements_text(coalesce(p_entry->'symptoms','[]'::jsonb)) where btrim(value)<>'' limit 20) q;
    insert into public.blood_pressure_entries(pregnancy_id,mother_id,recorded_at,systolic,diastolic,pulse,symptoms,note) values(p_pregnancy_id,v_user_id,coalesce(nullif(p_entry->>'recorded_at','')::timestamptz,now()),(p_entry->>'systolic')::smallint,(p_entry->>'diastolic')::smallint,nullif(p_entry->>'pulse','')::smallint,v_symptoms,nullif(btrim(coalesce(p_entry->>'note','')),'')) returning id into v_id;
  elsif p_kind='glucose' then
    insert into public.glucose_entries(pregnancy_id,mother_id,recorded_at,value_mg_dl,context,minutes_after_meal,note) values(p_pregnancy_id,v_user_id,coalesce(nullif(p_entry->>'recorded_at','')::timestamptz,now()),(p_entry->>'value_mg_dl')::numeric,p_entry->>'context',nullif(p_entry->>'minutes_after_meal','')::smallint,nullif(btrim(coalesce(p_entry->>'note','')),'')) returning id into v_id;
  elsif p_kind='lab' then
    insert into public.lab_results(pregnancy_id,mother_id,tested_on,test_name,result_value,unit,reference_range,note) values(p_pregnancy_id,v_user_id,(p_entry->>'tested_on')::date,btrim(p_entry->>'test_name'),btrim(p_entry->>'result_value'),nullif(btrim(coalesce(p_entry->>'unit','')),''),nullif(btrim(coalesce(p_entry->>'reference_range','')),''),nullif(btrim(coalesce(p_entry->>'note','')),'')) returning id into v_id;
  elsif p_kind='symptom' then
    insert into public.symptom_entries(pregnancy_id,mother_id,started_at,symptom,severity,duration_minutes,contacted_care,note) values(p_pregnancy_id,v_user_id,coalesce(nullif(p_entry->>'started_at','')::timestamptz,now()),btrim(p_entry->>'symptom'),(p_entry->>'severity')::smallint,nullif(p_entry->>'duration_minutes','')::integer,coalesce(nullif(p_entry->>'contacted_care','')::boolean,false),nullif(btrim(coalesce(p_entry->>'note','')),'')) returning id into v_id;
  else raise exception 'Unsupported health tracker entry type';
  end if;
  return v_id;
end; $$;

create or replace function public.delete_own_health_tracker_entry(p_kind text,p_entry_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_user_id uuid := auth.uid(); v_pregnancy_id uuid; v_latest_weight numeric;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_kind='weight' then
    delete from public.weight_entries where id=p_entry_id and mother_id=v_user_id returning pregnancy_id into v_pregnancy_id;
    if v_pregnancy_id is not null then
      select weight_kg into v_latest_weight from public.weight_entries where pregnancy_id=v_pregnancy_id and mother_id=v_user_id order by recorded_at desc, created_at desc limit 1;
      update public.health_profiles set current_weight_kg=v_latest_weight,updated_at=now() where pregnancy_id=v_pregnancy_id and mother_id=v_user_id;
    end if;
  elsif p_kind='blood_pressure' then delete from public.blood_pressure_entries where id=p_entry_id and mother_id=v_user_id;
  elsif p_kind='glucose' then delete from public.glucose_entries where id=p_entry_id and mother_id=v_user_id;
  elsif p_kind='lab' then delete from public.lab_results where id=p_entry_id and mother_id=v_user_id;
  elsif p_kind='symptom' then delete from public.symptom_entries where id=p_entry_id and mother_id=v_user_id;
  else raise exception 'Unsupported health tracker entry type'; end if;
end; $$;

revoke all on function public.get_own_health_profile(uuid) from public;
revoke all on function public.save_own_health_profile(uuid,jsonb,jsonb) from public;
revoke all on function public.get_own_health_tracker(uuid) from public;
revoke all on function public.add_own_health_tracker_entry(uuid,text,jsonb) from public;
revoke all on function public.delete_own_health_tracker_entry(text,uuid) from public;
grant execute on function public.get_own_health_profile(uuid) to authenticated;
grant execute on function public.save_own_health_profile(uuid,jsonb,jsonb) to authenticated;
grant execute on function public.get_own_health_tracker(uuid) to authenticated;
grant execute on function public.add_own_health_tracker_entry(uuid,text,jsonb) to authenticated;
grant execute on function public.delete_own_health_tracker_entry(text,uuid) to authenticated;

commit;
