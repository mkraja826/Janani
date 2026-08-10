begin;

create table if not exists public.private_care_contexts (
  pregnancy_id uuid primary key references public.pregnancies(id) on delete cascade,
  mother_id uuid not null references public.profiles(id) on delete cascade,
  preferred_language text not null default 'en' check (preferred_language in ('en','te','hi')),
  region_preference text,
  broader_clinician_instructions text,
  relevant_medical_history text,
  previous_pregnancy_history text,
  share_care_timeline_with_partner boolean not null default false,
  share_pregnancy_progress_with_partner boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (region_preference is null or char_length(region_preference) <= 120),
  check (broader_clinician_instructions is null or char_length(broader_clinician_instructions) <= 4000),
  check (relevant_medical_history is null or char_length(relevant_medical_history) <= 4000),
  check (previous_pregnancy_history is null or char_length(previous_pregnancy_history) <= 4000)
);

create table if not exists public.care_medications (
  id uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references public.pregnancies(id) on delete cascade,
  mother_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('medication','supplement')),
  name text not null,
  strength text,
  schedule_text text,
  clinician_instructions text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(name) between 1 and 160),
  check (strength is null or char_length(strength) <= 120),
  check (schedule_text is null or char_length(schedule_text) <= 500),
  check (clinician_instructions is null or char_length(clinician_instructions) <= 2000)
);

create index if not exists care_medications_pregnancy_active_idx
  on public.care_medications(pregnancy_id, active, updated_at desc);

alter table public.private_care_contexts enable row level security;
alter table public.care_medications enable row level security;
revoke all on public.private_care_contexts from anon, authenticated;
revoke all on public.care_medications from anon, authenticated;

create or replace function public.get_own_private_care_context(p_pregnancy_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_context public.private_care_contexts%rowtype;
  v_medications jsonb;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.pregnancies p where p.id = p_pregnancy_id and p.mother_id = v_user) then
    raise exception 'Private care context is available only to the mother who owns this pregnancy';
  end if;

  insert into public.private_care_contexts(pregnancy_id, mother_id)
  values (p_pregnancy_id, v_user)
  on conflict (pregnancy_id) do nothing;

  select * into v_context from public.private_care_contexts where pregnancy_id = p_pregnancy_id and mother_id = v_user;
  select coalesce(jsonb_agg(to_jsonb(m) order by m.active desc, m.updated_at desc), '[]'::jsonb)
    into v_medications
  from public.care_medications m
  where m.pregnancy_id = p_pregnancy_id and m.mother_id = v_user;

  return to_jsonb(v_context) || jsonb_build_object('medications', v_medications);
end;
$$;

create or replace function public.save_own_private_care_context(p_pregnancy_id uuid, p_context jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.private_care_contexts%rowtype;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.pregnancies p where p.id = p_pregnancy_id and p.mother_id = v_user) then
    raise exception 'Private care context is available only to the mother who owns this pregnancy';
  end if;

  insert into public.private_care_contexts(
    pregnancy_id,mother_id,preferred_language,region_preference,broader_clinician_instructions,
    relevant_medical_history,previous_pregnancy_history,share_care_timeline_with_partner,
    share_pregnancy_progress_with_partner
  ) values (
    p_pregnancy_id,v_user,
    case when p_context->>'preferred_language' in ('en','te','hi') then p_context->>'preferred_language' else 'en' end,
    nullif(left(btrim(coalesce(p_context->>'region_preference','')),120),''),
    nullif(left(btrim(coalesce(p_context->>'broader_clinician_instructions','')),4000),''),
    nullif(left(btrim(coalesce(p_context->>'relevant_medical_history','')),4000),''),
    nullif(left(btrim(coalesce(p_context->>'previous_pregnancy_history','')),4000),''),
    coalesce((p_context->>'share_care_timeline_with_partner')::boolean,false),
    coalesce((p_context->>'share_pregnancy_progress_with_partner')::boolean,true)
  )
  on conflict (pregnancy_id) do update set
    preferred_language = excluded.preferred_language,
    region_preference = excluded.region_preference,
    broader_clinician_instructions = excluded.broader_clinician_instructions,
    relevant_medical_history = excluded.relevant_medical_history,
    previous_pregnancy_history = excluded.previous_pregnancy_history,
    share_care_timeline_with_partner = excluded.share_care_timeline_with_partner,
    share_pregnancy_progress_with_partner = excluded.share_pregnancy_progress_with_partner,
    updated_at = now()
  where public.private_care_contexts.mother_id = v_user
  returning * into v_row;

  return public.get_own_private_care_context(p_pregnancy_id);
end;
$$;

create or replace function public.save_own_care_medication(p_pregnancy_id uuid, p_medication jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid := nullif(p_medication->>'id','')::uuid;
  v_row public.care_medications%rowtype;
  v_kind text;
  v_name text;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.pregnancies p where p.id = p_pregnancy_id and p.mother_id = v_user) then
    raise exception 'Medication context is available only to the mother who owns this pregnancy';
  end if;
  v_kind := p_medication->>'kind';
  if v_kind not in ('medication','supplement') then raise exception 'Invalid medication kind'; end if;
  v_name := nullif(left(btrim(coalesce(p_medication->>'name','')),160),'');
  if v_name is null then raise exception 'Medication or supplement name is required'; end if;

  if v_id is null then
    insert into public.care_medications(pregnancy_id,mother_id,kind,name,strength,schedule_text,clinician_instructions,active)
    values (
      p_pregnancy_id,v_user,v_kind,v_name,
      nullif(left(btrim(coalesce(p_medication->>'strength','')),120),''),
      nullif(left(btrim(coalesce(p_medication->>'schedule_text','')),500),''),
      nullif(left(btrim(coalesce(p_medication->>'clinician_instructions','')),2000),''),
      coalesce((p_medication->>'active')::boolean,true)
    ) returning * into v_row;
  else
    update public.care_medications set
      kind=v_kind,
      name=v_name,
      strength=nullif(left(btrim(coalesce(p_medication->>'strength','')),120),''),
      schedule_text=nullif(left(btrim(coalesce(p_medication->>'schedule_text','')),500),''),
      clinician_instructions=nullif(left(btrim(coalesce(p_medication->>'clinician_instructions','')),2000),''),
      active=coalesce((p_medication->>'active')::boolean,true),
      updated_at=now()
    where id=v_id and pregnancy_id=p_pregnancy_id and mother_id=v_user
    returning * into v_row;
    if v_row.id is null then raise exception 'Medication or supplement not found'; end if;
  end if;
  return to_jsonb(v_row);
end;
$$;

create or replace function public.delete_own_care_medication(p_pregnancy_id uuid, p_medication_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  delete from public.care_medications
  where id=p_medication_id and pregnancy_id=p_pregnancy_id and mother_id=v_user;
end;
$$;

revoke all on function public.get_own_private_care_context(uuid) from public;
revoke all on function public.save_own_private_care_context(uuid,jsonb) from public;
revoke all on function public.save_own_care_medication(uuid,jsonb) from public;
revoke all on function public.delete_own_care_medication(uuid,uuid) from public;
grant execute on function public.get_own_private_care_context(uuid) to authenticated;
grant execute on function public.save_own_private_care_context(uuid,jsonb) to authenticated;
grant execute on function public.save_own_care_medication(uuid,jsonb) to authenticated;
grant execute on function public.delete_own_care_medication(uuid,uuid) to authenticated;

commit;
