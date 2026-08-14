begin;

create table if not exists public.maternal_health_profiles (
  pregnancy_id uuid primary key references public.pregnancies(id) on delete cascade,
  date_of_birth date,
  dietary_pattern text,
  allergies text[] not null default '{}',
  condition_codes text[] not null default '{}',
  other_health_details text,
  data_source text not null default 'self_reported',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint maternal_health_profiles_dietary_pattern_check
    check (
      dietary_pattern is null
      or dietary_pattern in (
        'vegetarian',
        'non_vegetarian',
        'eggetarian',
        'vegan',
        'other'
      )
    ),
  constraint maternal_health_profiles_allergies_count_check
    check (cardinality(allergies) <= 20),
  constraint maternal_health_profiles_condition_codes_count_check
    check (cardinality(condition_codes) <= 20),
  constraint maternal_health_profiles_condition_codes_check
    check (
      condition_codes <@ array[
        'diabetes_pre_existing',
        'gestational_diabetes',
        'hypothyroidism',
        'hyperthyroidism',
        'chronic_hypertension',
        'gestational_hypertension',
        'anaemia',
        'pcos',
        'asthma',
        'epilepsy',
        'kidney_disease',
        'heart_condition',
        'other'
      ]::text[]
    ),
  constraint maternal_health_profiles_other_health_details_length
    check (other_health_details is null or char_length(other_health_details) <= 500),
  constraint maternal_health_profiles_data_source_check
    check (data_source = 'self_reported')
);

alter table public.maternal_health_profiles enable row level security;

-- Detailed maternal health information is private to the mother by default.
-- A partner may access the shared pregnancy journey but does not automatically
-- receive access to the mother's health profile.
drop policy if exists maternal_health_profiles_select_mother on public.maternal_health_profiles;
create policy maternal_health_profiles_select_mother
on public.maternal_health_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.pregnancies p
    where p.id = maternal_health_profiles.pregnancy_id
      and p.mother_id = (select auth.uid())
  )
);

drop policy if exists maternal_health_profiles_insert_mother on public.maternal_health_profiles;
create policy maternal_health_profiles_insert_mother
on public.maternal_health_profiles
for insert
to authenticated
with check (
  exists (
    select 1
    from public.pregnancies p
    where p.id = maternal_health_profiles.pregnancy_id
      and p.mother_id = (select auth.uid())
  )
);

drop policy if exists maternal_health_profiles_update_mother on public.maternal_health_profiles;
create policy maternal_health_profiles_update_mother
on public.maternal_health_profiles
for update
to authenticated
using (
  exists (
    select 1
    from public.pregnancies p
    where p.id = maternal_health_profiles.pregnancy_id
      and p.mother_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.pregnancies p
    where p.id = maternal_health_profiles.pregnancy_id
      and p.mother_id = (select auth.uid())
  )
);

drop policy if exists maternal_health_profiles_delete_mother on public.maternal_health_profiles;
create policy maternal_health_profiles_delete_mother
on public.maternal_health_profiles
for delete
to authenticated
using (
  exists (
    select 1
    from public.pregnancies p
    where p.id = maternal_health_profiles.pregnancy_id
      and p.mother_id = (select auth.uid())
  )
);

revoke all on public.maternal_health_profiles from anon;
grant select, insert, update, delete on public.maternal_health_profiles to authenticated;

-- Reuse Janani's standard timestamp trigger.
drop trigger if exists maternal_health_profiles_updated_at on public.maternal_health_profiles;
create trigger maternal_health_profiles_updated_at
before update on public.maternal_health_profiles
for each row execute function public.set_updated_at();

commit;
