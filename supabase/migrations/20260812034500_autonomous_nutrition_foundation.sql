begin;

alter table public.health_profiles
  add column if not exists height_cm numeric(5,2),
  add column if not exists pre_pregnancy_weight_kg numeric(5,2);

alter table public.health_profiles drop constraint if exists health_profiles_height_cm_check;
alter table public.health_profiles add constraint health_profiles_height_cm_check check (height_cm is null or height_cm between 80 and 250);
alter table public.health_profiles drop constraint if exists health_profiles_pre_pregnancy_weight_kg_check;
alter table public.health_profiles add constraint health_profiles_pre_pregnancy_weight_kg_check check (pre_pregnancy_weight_kg is null or pre_pregnancy_weight_kg between 25 and 300);

-- Older Janani onboarding already collected these values. Backfill when the
-- production profiles table contains the matching columns, without assuming
-- that every historical environment has them.
do $$
begin
  if exists (
    select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='height_cm'
  ) and exists (
    select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='pre_pregnancy_weight_kg'
  ) then
    execute $sql$
      update public.health_profiles hp
      set height_cm = coalesce(hp.height_cm, p.height_cm),
          pre_pregnancy_weight_kg = coalesce(hp.pre_pregnancy_weight_kg, p.pre_pregnancy_weight_kg)
      from public.profiles p
      where p.id = hp.mother_id
        and (hp.height_cm is null or hp.pre_pregnancy_weight_kg is null)
    $sql$;
  end if;
end $$;

create table if not exists public.weekly_nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references public.pregnancies(id) on delete cascade,
  mother_id uuid not null references public.profiles(id) on delete cascade,
  pregnancy_week smallint not null check (pregnancy_week between 1 and 43),
  context_version text not null check (char_length(context_version) between 8 and 120),
  plan jsonb not null,
  generation_reason text,
  status text not null default 'active' check (status in ('active','superseded','blocked','failed')),
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pregnancy_id, pregnancy_week, context_version)
);

create index if not exists weekly_nutrition_plans_lookup_idx
  on public.weekly_nutrition_plans(pregnancy_id, pregnancy_week, generated_at desc);

alter table public.weekly_nutrition_plans enable row level security;
revoke all on public.weekly_nutrition_plans from anon, authenticated;

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
    'height_cm', hp.height_cm,
    'pre_pregnancy_weight_kg', hp.pre_pregnancy_weight_kg,
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
  v_user_id uuid := auth.uid(); v_height numeric; v_pre_weight numeric; v_weight numeric; v_instructions text; v_condition jsonb;
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
  v_height := nullif(p_profile->>'height_cm','')::numeric;
  v_pre_weight := nullif(p_profile->>'pre_pregnancy_weight_kg','')::numeric;
  v_weight := nullif(p_profile->>'current_weight_kg','')::numeric;
  v_instructions := nullif(btrim(coalesce(p_profile->>'clinician_dietary_instructions','')), '');
  if v_height is not null and not (v_height between 80 and 250) then raise exception 'Height must be between 80 and 250 cm'; end if;
  if v_pre_weight is not null and not (v_pre_weight between 25 and 300) then raise exception 'Pre-pregnancy weight must be between 25 and 300 kg'; end if;
  if v_weight is not null and not (v_weight between 25 and 300) then raise exception 'Current weight must be between 25 and 300 kg'; end if;
  if v_instructions is not null and char_length(v_instructions)>2000 then raise exception 'Clinician instructions are too long'; end if;

  insert into public.health_profiles(
    pregnancy_id,mother_id,height_cm,pre_pregnancy_weight_kg,current_weight_kg,pregnancy_type,dietary_pattern,activity_level,
    cuisine_preferences,allergies,foods_avoided,clinician_dietary_instructions,updated_at
  ) values(
    p_pregnancy_id,v_user_id,v_height,v_pre_weight,v_weight,
    coalesce(nullif(p_profile->>'pregnancy_type',''),'singleton'),
    coalesce(nullif(p_profile->>'dietary_pattern',''),'no_preference'),
    coalesce(nullif(p_profile->>'activity_level',''),'not_set'),
    v_cuisines,v_allergies,v_avoided,v_instructions,now()
  )
  on conflict(pregnancy_id) do update set
    mother_id=excluded.mother_id,
    height_cm=excluded.height_cm,
    pre_pregnancy_weight_kg=excluded.pre_pregnancy_weight_kg,
    current_weight_kg=excluded.current_weight_kg,
    pregnancy_type=excluded.pregnancy_type,
    dietary_pattern=excluded.dietary_pattern,
    activity_level=excluded.activity_level,
    cuisine_preferences=excluded.cuisine_preferences,
    allergies=excluded.allergies,
    foods_avoided=excluded.foods_avoided,
    clinician_dietary_instructions=excluded.clinician_dietary_instructions,
    updated_at=now();

  delete from public.health_conditions where pregnancy_id=p_pregnancy_id and mother_id=v_user_id;
  if jsonb_array_length(coalesce(p_conditions,'[]'::jsonb)) > 20 then raise exception 'Too many health conditions'; end if;
  for v_condition in select value from jsonb_array_elements(coalesce(p_conditions,'[]'::jsonb)) loop
    insert into public.health_conditions(pregnancy_id,mother_id,condition_code,status,updated_at)
    values(p_pregnancy_id,v_user_id,v_condition->>'condition_code',v_condition->>'status',now());
  end loop;
  return public.get_own_health_profile(p_pregnancy_id);
end; $$;

create or replace function public.get_own_weekly_nutrition_plan(p_pregnancy_id uuid, p_pregnancy_week integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user_id uuid := auth.uid(); v_plan jsonb;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.pregnancies where id=p_pregnancy_id and mother_id=v_user_id) then
    raise exception 'Nutrition plan is available only to the mother who owns this pregnancy';
  end if;
  select to_jsonb(w) into v_plan
  from (
    select id,pregnancy_id,pregnancy_week,context_version,plan,generation_reason,status,generated_at,updated_at
    from public.weekly_nutrition_plans
    where pregnancy_id=p_pregnancy_id and mother_id=v_user_id and pregnancy_week=p_pregnancy_week and status='active'
    order by generated_at desc limit 1
  ) w;
  return v_plan;
end; $$;

create or replace function public.save_weekly_nutrition_plan_server(
  p_user_id uuid,
  p_pregnancy_id uuid,
  p_pregnancy_week integer,
  p_context_version text,
  p_plan jsonb,
  p_generation_reason text default null
)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if p_user_id is null then raise exception 'User is required'; end if;
  if not exists (select 1 from public.pregnancies where id=p_pregnancy_id and mother_id=p_user_id) then
    raise exception 'Nutrition plan pregnancy ownership mismatch';
  end if;
  if p_pregnancy_week not between 1 and 43 then raise exception 'Pregnancy week is outside the supported range'; end if;
  if p_context_version is null or char_length(p_context_version) < 8 then raise exception 'Nutrition context version is required'; end if;
  if p_plan is null or jsonb_typeof(p_plan) <> 'object' then raise exception 'Nutrition plan must be a JSON object'; end if;

  update public.weekly_nutrition_plans
    set status='superseded', updated_at=now()
    where pregnancy_id=p_pregnancy_id and mother_id=p_user_id and pregnancy_week=p_pregnancy_week and status='active'
      and context_version<>p_context_version;

  insert into public.weekly_nutrition_plans(pregnancy_id,mother_id,pregnancy_week,context_version,plan,generation_reason,status,generated_at,updated_at)
  values(p_pregnancy_id,p_user_id,p_pregnancy_week,left(p_context_version,120),p_plan,left(p_generation_reason,500),'active',now(),now())
  on conflict(pregnancy_id,pregnancy_week,context_version) do update set
    plan=excluded.plan,
    generation_reason=excluded.generation_reason,
    status='active',
    generated_at=now(),
    updated_at=now()
  returning id into v_id;
  return v_id;
end; $$;

revoke all on function public.get_own_health_profile(uuid) from public;
revoke all on function public.save_own_health_profile(uuid,jsonb,jsonb) from public;
revoke all on function public.get_own_weekly_nutrition_plan(uuid,integer) from public;
revoke all on function public.save_weekly_nutrition_plan_server(uuid,uuid,integer,text,jsonb,text) from public;

grant execute on function public.get_own_health_profile(uuid) to authenticated;
grant execute on function public.save_own_health_profile(uuid,jsonb,jsonb) to authenticated;
grant execute on function public.get_own_weekly_nutrition_plan(uuid,integer) to authenticated;
grant execute on function public.save_weekly_nutrition_plan_server(uuid,uuid,integer,text,jsonb,text) to service_role;

commit;
