begin;

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
  created_at timestamptz not null default now()
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

create index if not exists weight_entries_pregnancy_recorded_idx on public.weight_entries(pregnancy_id, recorded_at desc);
create index if not exists blood_pressure_entries_pregnancy_recorded_idx on public.blood_pressure_entries(pregnancy_id, recorded_at desc);
create index if not exists glucose_entries_pregnancy_recorded_idx on public.glucose_entries(pregnancy_id, recorded_at desc);
create index if not exists lab_results_pregnancy_tested_idx on public.lab_results(pregnancy_id, tested_on desc);
create index if not exists symptom_entries_pregnancy_started_idx on public.symptom_entries(pregnancy_id, started_at desc);

alter table public.weight_entries enable row level security;
alter table public.blood_pressure_entries enable row level security;
alter table public.glucose_entries enable row level security;
alter table public.lab_results enable row level security;
alter table public.symptom_entries enable row level security;

revoke all on public.weight_entries from anon, authenticated;
revoke all on public.blood_pressure_entries from anon, authenticated;
revoke all on public.glucose_entries from anon, authenticated;
revoke all on public.lab_results from anon, authenticated;
revoke all on public.symptom_entries from anon, authenticated;

create or replace function public.get_own_health_tracker(p_pregnancy_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.pregnancies p where p.id = p_pregnancy_id and p.mother_id = v_user_id) then
    raise exception 'Health tracker is available only to the mother who owns this pregnancy';
  end if;
  return jsonb_build_object(
    'weight', coalesce((select jsonb_agg(to_jsonb(x) order by x.recorded_at desc) from (select id,recorded_at,weight_kg,note from public.weight_entries where pregnancy_id=p_pregnancy_id and mother_id=v_user_id limit 100) x),'[]'::jsonb),
    'blood_pressure', coalesce((select jsonb_agg(to_jsonb(x) order by x.recorded_at desc) from (select id,recorded_at,systolic,diastolic,pulse,symptoms,note from public.blood_pressure_entries where pregnancy_id=p_pregnancy_id and mother_id=v_user_id limit 100) x),'[]'::jsonb),
    'glucose', coalesce((select jsonb_agg(to_jsonb(x) order by x.recorded_at desc) from (select id,recorded_at,value_mg_dl,context,minutes_after_meal,note from public.glucose_entries where pregnancy_id=p_pregnancy_id and mother_id=v_user_id limit 100) x),'[]'::jsonb),
    'labs', coalesce((select jsonb_agg(to_jsonb(x) order by x.tested_on desc) from (select id,tested_on,test_name,result_value,unit,reference_range,note from public.lab_results where pregnancy_id=p_pregnancy_id and mother_id=v_user_id limit 100) x),'[]'::jsonb),
    'symptoms', coalesce((select jsonb_agg(to_jsonb(x) order by x.started_at desc) from (select id,started_at,symptom,severity,duration_minutes,contacted_care,note from public.symptom_entries where pregnancy_id=p_pregnancy_id and mother_id=v_user_id limit 100) x),'[]'::jsonb)
  );
end;
$$;

create or replace function public.add_own_health_tracker_entry(p_pregnancy_id uuid, p_kind text, p_entry jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
  v_weight numeric;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.pregnancies p where p.id = p_pregnancy_id and p.mother_id = v_user_id) then
    raise exception 'Health tracker is available only to the mother who owns this pregnancy';
  end if;

  if p_kind = 'weight' then
    v_weight := (p_entry->>'weight_kg')::numeric;
    insert into public.weight_entries(pregnancy_id,mother_id,recorded_at,weight_kg,note)
    values(p_pregnancy_id,v_user_id,coalesce((p_entry->>'recorded_at')::timestamptz,now()),v_weight,nullif(btrim(coalesce(p_entry->>'note','')),'')) returning id into v_id;
    update public.health_profiles set current_weight_kg=v_weight, updated_at=now() where pregnancy_id=p_pregnancy_id and mother_id=v_user_id;
  elsif p_kind = 'blood_pressure' then
    insert into public.blood_pressure_entries(pregnancy_id,mother_id,recorded_at,systolic,diastolic,pulse,symptoms,note)
    values(p_pregnancy_id,v_user_id,coalesce((p_entry->>'recorded_at')::timestamptz,now()),(p_entry->>'systolic')::smallint,(p_entry->>'diastolic')::smallint,nullif(p_entry->>'pulse','')::smallint,coalesce(array(select jsonb_array_elements_text(coalesce(p_entry->'symptoms','[]'::jsonb))),'{}'),nullif(btrim(coalesce(p_entry->>'note','')),'')) returning id into v_id;
  elsif p_kind = 'glucose' then
    insert into public.glucose_entries(pregnancy_id,mother_id,recorded_at,value_mg_dl,context,minutes_after_meal,note)
    values(p_pregnancy_id,v_user_id,coalesce((p_entry->>'recorded_at')::timestamptz,now()),(p_entry->>'value_mg_dl')::numeric,p_entry->>'context',nullif(p_entry->>'minutes_after_meal','')::smallint,nullif(btrim(coalesce(p_entry->>'note','')),'')) returning id into v_id;
  elsif p_kind = 'lab' then
    insert into public.lab_results(pregnancy_id,mother_id,tested_on,test_name,result_value,unit,reference_range,note)
    values(p_pregnancy_id,v_user_id,(p_entry->>'tested_on')::date,btrim(p_entry->>'test_name'),btrim(p_entry->>'result_value'),nullif(btrim(coalesce(p_entry->>'unit','')),''),nullif(btrim(coalesce(p_entry->>'reference_range','')),''),nullif(btrim(coalesce(p_entry->>'note','')),'')) returning id into v_id;
  elsif p_kind = 'symptom' then
    insert into public.symptom_entries(pregnancy_id,mother_id,started_at,symptom,severity,duration_minutes,contacted_care,note)
    values(p_pregnancy_id,v_user_id,coalesce((p_entry->>'started_at')::timestamptz,now()),btrim(p_entry->>'symptom'),(p_entry->>'severity')::smallint,nullif(p_entry->>'duration_minutes','')::integer,coalesce((p_entry->>'contacted_care')::boolean,false),nullif(btrim(coalesce(p_entry->>'note','')),'')) returning id into v_id;
  else
    raise exception 'Unsupported health tracker entry type';
  end if;
  return v_id;
end;
$$;

create or replace function public.delete_own_health_tracker_entry(p_kind text, p_entry_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_kind='weight' then delete from public.weight_entries where id=p_entry_id and mother_id=v_user_id;
  elsif p_kind='blood_pressure' then delete from public.blood_pressure_entries where id=p_entry_id and mother_id=v_user_id;
  elsif p_kind='glucose' then delete from public.glucose_entries where id=p_entry_id and mother_id=v_user_id;
  elsif p_kind='lab' then delete from public.lab_results where id=p_entry_id and mother_id=v_user_id;
  elsif p_kind='symptom' then delete from public.symptom_entries where id=p_entry_id and mother_id=v_user_id;
  else raise exception 'Unsupported health tracker entry type'; end if;
end;
$$;

revoke all on function public.get_own_health_tracker(uuid) from public;
revoke all on function public.add_own_health_tracker_entry(uuid,text,jsonb) from public;
revoke all on function public.delete_own_health_tracker_entry(text,uuid) from public;
grant execute on function public.get_own_health_tracker(uuid) to authenticated;
grant execute on function public.add_own_health_tracker_entry(uuid,text,jsonb) to authenticated;
grant execute on function public.delete_own_health_tracker_entry(text,uuid) to authenticated;

commit;
