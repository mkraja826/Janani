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
  check (current_weight_kg is null or (current_weight_kg >= 25 and current_weight_kg <= 300)),
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
  unique (pregnancy_id, condition_code)
);

create index if not exists health_profiles_mother_id_idx on public.health_profiles(mother_id);
create index if not exists health_conditions_mother_id_idx on public.health_conditions(mother_id);
create index if not exists health_conditions_pregnancy_id_idx on public.health_conditions(pregnancy_id);

alter table public.health_profiles enable row level security;
alter table public.health_conditions enable row level security;

revoke all on public.health_profiles from anon, authenticated;
revoke all on public.health_conditions from anon, authenticated;

create or replace function public.get_own_health_profile(p_pregnancy_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.pregnancies p
    where p.id = p_pregnancy_id and p.mother_id = v_user_id
  ) then
    raise exception 'Health profile is available only to the mother who owns this pregnancy';
  end if;

  select jsonb_build_object(
    'pregnancy_id', p_pregnancy_id,
    'current_weight_kg', hp.current_weight_kg,
    'pregnancy_type', coalesce(hp.pregnancy_type, 'singleton'),
    'dietary_pattern', coalesce(hp.dietary_pattern, 'no_preference'),
    'activity_level', coalesce(hp.activity_level, 'not_set'),
    'cuisine_preferences', coalesce(to_jsonb(hp.cuisine_preferences), '[]'::jsonb),
    'allergies', coalesce(to_jsonb(hp.allergies), '[]'::jsonb),
    'foods_avoided', coalesce(to_jsonb(hp.foods_avoided), '[]'::jsonb),
    'clinician_dietary_instructions', hp.clinician_dietary_instructions,
    'conditions', coalesce((
      select jsonb_agg(jsonb_build_object('condition_code', hc.condition_code, 'status', hc.status) order by hc.condition_code)
      from public.health_conditions hc
      where hc.pregnancy_id = p_pregnancy_id and hc.mother_id = v_user_id
    ), '[]'::jsonb)
  )
  into v_profile
  from (select 1) seed
  left join public.health_profiles hp
    on hp.pregnancy_id = p_pregnancy_id and hp.mother_id = v_user_id;

  return v_profile;
end;
$$;

create or replace function public.save_own_health_profile(
  p_pregnancy_id uuid,
  p_profile jsonb,
  p_conditions jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_weight numeric;
  v_instructions text;
  v_condition jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.pregnancies p
    where p.id = p_pregnancy_id and p.mother_id = v_user_id
  ) then
    raise exception 'Health profile is available only to the mother who owns this pregnancy';
  end if;

  v_weight := nullif(p_profile->>'current_weight_kg','')::numeric;
  if v_weight is not null and (v_weight < 25 or v_weight > 300) then
    raise exception 'Current weight must be between 25 and 300 kg';
  end if;

  v_instructions := nullif(btrim(coalesce(p_profile->>'clinician_dietary_instructions','')), '');
  if v_instructions is not null and char_length(v_instructions) > 2000 then
    raise exception 'Clinician instructions are too long';
  end if;

  insert into public.health_profiles (
    pregnancy_id, mother_id, current_weight_kg, pregnancy_type, dietary_pattern,
    activity_level, cuisine_preferences, allergies, foods_avoided,
    clinician_dietary_instructions, updated_at
  ) values (
    p_pregnancy_id,
    v_user_id,
    v_weight,
    coalesce(nullif(p_profile->>'pregnancy_type',''), 'singleton'),
    coalesce(nullif(p_profile->>'dietary_pattern',''), 'no_preference'),
    coalesce(nullif(p_profile->>'activity_level',''), 'not_set'),
    coalesce(array(select jsonb_array_elements_text(coalesce(p_profile->'cuisine_preferences','[]'::jsonb))), '{}'),
    coalesce(array(select jsonb_array_elements_text(coalesce(p_profile->'allergies','[]'::jsonb))), '{}'),
    coalesce(array(select jsonb_array_elements_text(coalesce(p_profile->'foods_avoided','[]'::jsonb))), '{}'),
    v_instructions,
    now()
  )
  on conflict (pregnancy_id) do update set
    mother_id = excluded.mother_id,
    current_weight_kg = excluded.current_weight_kg,
    pregnancy_type = excluded.pregnancy_type,
    dietary_pattern = excluded.dietary_pattern,
    activity_level = excluded.activity_level,
    cuisine_preferences = excluded.cuisine_preferences,
    allergies = excluded.allergies,
    foods_avoided = excluded.foods_avoided,
    clinician_dietary_instructions = excluded.clinician_dietary_instructions,
    updated_at = now();

  delete from public.health_conditions
  where pregnancy_id = p_pregnancy_id and mother_id = v_user_id;

  if jsonb_typeof(coalesce(p_conditions, '[]'::jsonb)) <> 'array' then
    raise exception 'Conditions must be an array';
  end if;

  for v_condition in select value from jsonb_array_elements(coalesce(p_conditions, '[]'::jsonb))
  loop
    insert into public.health_conditions (pregnancy_id, mother_id, condition_code, status, updated_at)
    values (
      p_pregnancy_id,
      v_user_id,
      v_condition->>'condition_code',
      v_condition->>'status',
      now()
    );
  end loop;

  return public.get_own_health_profile(p_pregnancy_id);
end;
$$;

revoke all on function public.get_own_health_profile(uuid) from public;
revoke all on function public.save_own_health_profile(uuid, jsonb, jsonb) from public;
grant execute on function public.get_own_health_profile(uuid) to authenticated;
grant execute on function public.save_own_health_profile(uuid, jsonb, jsonb) to authenticated;

commit;
