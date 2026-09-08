-- Production hardening: fix mutable function search_path and add advisor-confirmed
-- covering indexes for foreign keys used by Janani/Care+ workloads.

alter function public.normalize_short_text_array(jsonb, integer, integer)
  set search_path = pg_catalog, public;

create index if not exists ai_generations_pregnancy_id_idx
  on public.ai_generations (pregnancy_id);

create index if not exists ai_generations_user_id_idx
  on public.ai_generations (user_id);

create index if not exists blood_pressure_entries_mother_id_idx
  on public.blood_pressure_entries (mother_id);

create index if not exists care_credit_reservations_generation_id_idx
  on public.care_credit_reservations (generation_id);

create index if not exists care_credit_reservations_user_id_idx
  on public.care_credit_reservations (user_id);

create index if not exists care_medications_mother_id_idx
  on public.care_medications (mother_id);

create index if not exists clinical_rule_pack_reviews_condition_code_idx
  on public.clinical_rule_pack_reviews (condition_code);

create index if not exists glucose_entries_mother_id_idx
  on public.glucose_entries (mother_id);

create index if not exists health_conditions_mother_id_idx
  on public.health_conditions (mother_id);

create index if not exists lab_results_mother_id_idx
  on public.lab_results (mother_id);

create index if not exists private_care_contexts_mother_id_idx
  on public.private_care_contexts (mother_id);

create index if not exists symptom_entries_mother_id_idx
  on public.symptom_entries (mother_id);

create index if not exists weekly_nutrition_plans_mother_id_idx
  on public.weekly_nutrition_plans (mother_id);

create index if not exists weight_entries_mother_id_idx
  on public.weight_entries (mother_id);
