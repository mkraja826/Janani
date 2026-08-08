begin;

create table if not exists public.care_appointments (
  id uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references public.pregnancies(id) on delete cascade,
  mother_id uuid not null references public.profiles(id) on delete cascade,
  appointment_type text not null default 'doctor_visit' check (appointment_type in ('doctor_visit','scan','lab_test','procedure','vaccination','other')),
  scheduled_at timestamptz not null,
  provider_name text,
  facility_name text,
  purpose text,
  questions text[] not null default '{}',
  notes_after text,
  tests_prescribed text[] not null default '{}',
  next_followup_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (provider_name is null or char_length(provider_name) <= 120),
  check (facility_name is null or char_length(facility_name) <= 160),
  check (purpose is null or char_length(purpose) <= 500),
  check (notes_after is null or char_length(notes_after) <= 4000)
);

create index if not exists care_appointments_pregnancy_time_idx
  on public.care_appointments(pregnancy_id, scheduled_at desc);
create index if not exists care_appointments_mother_id_idx
  on public.care_appointments(mother_id);

alter table public.care_appointments enable row level security;
revoke all on public.care_appointments from anon, authenticated;

create or replace function public.list_own_care_appointments(p_pregnancy_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_result jsonb;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.pregnancies p
    where p.id = p_pregnancy_id and p.mother_id = v_user_id
  ) then
    raise exception 'Care timeline is available only to the mother who owns this pregnancy';
  end if;

  select coalesce(jsonb_agg(to_jsonb(a) order by a.scheduled_at desc), '[]'::jsonb)
  into v_result
  from public.care_appointments a
  where a.pregnancy_id = p_pregnancy_id and a.mother_id = v_user_id;

  return v_result;
end;
$$;

create or replace function public.save_own_care_appointment(
  p_pregnancy_id uuid,
  p_appointment jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
  v_row public.care_appointments;
  v_scheduled_at timestamptz;
  v_followup_at timestamptz;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.pregnancies p
    where p.id = p_pregnancy_id and p.mother_id = v_user_id
  ) then
    raise exception 'Care timeline is available only to the mother who owns this pregnancy';
  end if;

  v_scheduled_at := nullif(p_appointment->>'scheduled_at','')::timestamptz;
  if v_scheduled_at is null then raise exception 'Appointment date and time are required'; end if;
  v_followup_at := nullif(p_appointment->>'next_followup_at','')::timestamptz;
  v_id := nullif(p_appointment->>'id','')::uuid;

  if v_id is null then
    insert into public.care_appointments (
      pregnancy_id, mother_id, appointment_type, scheduled_at, provider_name, facility_name,
      purpose, questions, notes_after, tests_prescribed, next_followup_at, status
    ) values (
      p_pregnancy_id,
      v_user_id,
      coalesce(nullif(p_appointment->>'appointment_type',''), 'doctor_visit'),
      v_scheduled_at,
      nullif(btrim(coalesce(p_appointment->>'provider_name','')), ''),
      nullif(btrim(coalesce(p_appointment->>'facility_name','')), ''),
      nullif(btrim(coalesce(p_appointment->>'purpose','')), ''),
      coalesce(array(select jsonb_array_elements_text(coalesce(p_appointment->'questions','[]'::jsonb))), '{}'),
      nullif(btrim(coalesce(p_appointment->>'notes_after','')), ''),
      coalesce(array(select jsonb_array_elements_text(coalesce(p_appointment->'tests_prescribed','[]'::jsonb))), '{}'),
      v_followup_at,
      coalesce(nullif(p_appointment->>'status',''), 'scheduled')
    ) returning * into v_row;
  else
    update public.care_appointments set
      appointment_type = coalesce(nullif(p_appointment->>'appointment_type',''), appointment_type),
      scheduled_at = v_scheduled_at,
      provider_name = nullif(btrim(coalesce(p_appointment->>'provider_name','')), ''),
      facility_name = nullif(btrim(coalesce(p_appointment->>'facility_name','')), ''),
      purpose = nullif(btrim(coalesce(p_appointment->>'purpose','')), ''),
      questions = coalesce(array(select jsonb_array_elements_text(coalesce(p_appointment->'questions','[]'::jsonb))), '{}'),
      notes_after = nullif(btrim(coalesce(p_appointment->>'notes_after','')), ''),
      tests_prescribed = coalesce(array(select jsonb_array_elements_text(coalesce(p_appointment->'tests_prescribed','[]'::jsonb))), '{}'),
      next_followup_at = v_followup_at,
      status = coalesce(nullif(p_appointment->>'status',''), status),
      updated_at = now()
    where id = v_id and pregnancy_id = p_pregnancy_id and mother_id = v_user_id
    returning * into v_row;

    if v_row.id is null then raise exception 'Appointment not found'; end if;
  end if;

  return to_jsonb(v_row);
end;
$$;

create or replace function public.delete_own_care_appointment(
  p_pregnancy_id uuid,
  p_appointment_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.pregnancies p
    where p.id = p_pregnancy_id and p.mother_id = v_user_id
  ) then
    raise exception 'Care timeline is available only to the mother who owns this pregnancy';
  end if;

  delete from public.care_appointments
  where id = p_appointment_id and pregnancy_id = p_pregnancy_id and mother_id = v_user_id;
end;
$$;

revoke all on function public.list_own_care_appointments(uuid) from public;
revoke all on function public.save_own_care_appointment(uuid, jsonb) from public;
revoke all on function public.delete_own_care_appointment(uuid, uuid) from public;
grant execute on function public.list_own_care_appointments(uuid) to authenticated;
grant execute on function public.save_own_care_appointment(uuid, jsonb) to authenticated;
grant execute on function public.delete_own_care_appointment(uuid, uuid) to authenticated;

commit;
