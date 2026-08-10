begin;

create table if not exists public.clinical_rule_packs (
  condition_code text primary key check (condition_code in (
    'preexisting_diabetes','gestational_diabetes','hypothyroidism','hyperthyroidism',
    'chronic_hypertension','pregnancy_hypertension','anemia','pcos',
    'previous_preeclampsia','previous_miscarriage','previous_preterm_birth'
  )),
  status text not null default 'draft' check (status in ('draft','pending_review','approved','suspended','retired')),
  current_version text,
  source_manifest jsonb not null default '[]'::jsonb,
  reviewer_name text,
  reviewer_credentials text,
  reviewed_at timestamptz,
  effective_at timestamptz,
  expires_at timestamptz,
  suspended_at timestamptz,
  suspension_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_rule_approved_metadata check (
    status <> 'approved' or (
      current_version is not null and length(trim(current_version)) between 1 and 80
      and reviewer_name is not null and length(trim(reviewer_name)) between 1 and 160
      and reviewer_credentials is not null and length(trim(reviewer_credentials)) between 1 and 240
      and reviewed_at is not null
      and effective_at is not null
      and jsonb_typeof(source_manifest) = 'array'
      and jsonb_array_length(source_manifest) > 0
    )
  ),
  constraint clinical_rule_expiry_order check (expires_at is null or effective_at is null or expires_at > effective_at)
);

create table if not exists public.clinical_rule_pack_reviews (
  id uuid primary key default gen_random_uuid(),
  condition_code text not null references public.clinical_rule_packs(condition_code) on delete restrict,
  version text not null check (length(trim(version)) between 1 and 80),
  decision text not null check (decision in ('submitted','approved','changes_requested','suspended','retired')),
  reviewer_name text,
  reviewer_credentials text,
  source_manifest jsonb not null default '[]'::jsonb,
  notes text,
  ruleset_hash text,
  created_at timestamptz not null default now()
);

alter table public.clinical_rule_packs enable row level security;
alter table public.clinical_rule_pack_reviews enable row level security;
revoke all on public.clinical_rule_packs from anon, authenticated;
revoke all on public.clinical_rule_pack_reviews from anon, authenticated;

insert into public.clinical_rule_packs(condition_code, status)
values
  ('gestational_diabetes','pending_review'),
  ('preexisting_diabetes','pending_review'),
  ('chronic_hypertension','pending_review'),
  ('pregnancy_hypertension','pending_review'),
  ('anemia','pending_review'),
  ('hypothyroidism','pending_review'),
  ('hyperthyroidism','pending_review'),
  ('pcos','draft'),
  ('previous_preeclampsia','draft'),
  ('previous_miscarriage','draft'),
  ('previous_preterm_birth','draft')
on conflict (condition_code) do nothing;

create or replace function public.get_active_clinical_rule_packs_server(p_condition_codes text[])
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'conditionCode', condition_code,
    'version', current_version,
    'reviewedAt', reviewed_at,
    'effectiveAt', effective_at,
    'expiresAt', expires_at
  ) order by condition_code), '[]'::jsonb)
  from public.clinical_rule_packs
  where condition_code = any(coalesce(p_condition_codes, array[]::text[]))
    and status = 'approved'
    and effective_at <= now()
    and (expires_at is null or expires_at > now());
$$;

revoke all on function public.get_active_clinical_rule_packs_server(text[]) from public, anon, authenticated;
grant execute on function public.get_active_clinical_rule_packs_server(text[]) to service_role;

create or replace function public.set_clinical_rule_pack_state_server(
  p_condition_code text,
  p_status text,
  p_version text default null,
  p_reviewer_name text default null,
  p_reviewer_credentials text default null,
  p_source_manifest jsonb default '[]'::jsonb,
  p_notes text default null,
  p_ruleset_hash text default null,
  p_effective_at timestamptz default null,
  p_expires_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_decision text;
begin
  if p_status not in ('draft','pending_review','approved','suspended','retired') then
    raise exception 'invalid clinical rule status';
  end if;

  if p_status = 'approved' then
    if nullif(trim(coalesce(p_version,'')), '') is null
       or nullif(trim(coalesce(p_reviewer_name,'')), '') is null
       or nullif(trim(coalesce(p_reviewer_credentials,'')), '') is null
       or jsonb_typeof(p_source_manifest) <> 'array'
       or jsonb_array_length(p_source_manifest) = 0 then
      raise exception 'approval requires version, reviewer identity/credentials and sources';
    end if;
  end if;

  insert into public.clinical_rule_packs(condition_code, status)
  values (p_condition_code, p_status)
  on conflict (condition_code) do nothing;

  update public.clinical_rule_packs
  set status = p_status,
      current_version = case when p_version is not null then trim(p_version) else current_version end,
      source_manifest = case when p_source_manifest is not null then p_source_manifest else source_manifest end,
      reviewer_name = case when p_status = 'approved' then trim(p_reviewer_name) else reviewer_name end,
      reviewer_credentials = case when p_status = 'approved' then trim(p_reviewer_credentials) else reviewer_credentials end,
      reviewed_at = case when p_status = 'approved' then now() else reviewed_at end,
      effective_at = case when p_status = 'approved' then coalesce(p_effective_at, now()) else effective_at end,
      expires_at = case when p_status = 'approved' then p_expires_at else expires_at end,
      suspended_at = case when p_status = 'suspended' then now() else null end,
      suspension_reason = case when p_status = 'suspended' then left(nullif(trim(coalesce(p_notes,'')), ''), 1000) else null end,
      updated_at = now()
  where condition_code = p_condition_code;

  v_decision := case p_status
    when 'pending_review' then 'submitted'
    when 'approved' then 'approved'
    when 'suspended' then 'suspended'
    when 'retired' then 'retired'
    else 'changes_requested'
  end;

  if p_version is not null then
    insert into public.clinical_rule_pack_reviews(
      condition_code, version, decision, reviewer_name, reviewer_credentials,
      source_manifest, notes, ruleset_hash
    ) values (
      p_condition_code, trim(p_version), v_decision,
      nullif(trim(coalesce(p_reviewer_name,'')), ''),
      nullif(trim(coalesce(p_reviewer_credentials,'')), ''),
      coalesce(p_source_manifest, '[]'::jsonb),
      left(nullif(trim(coalesce(p_notes,'')), ''), 4000),
      left(nullif(trim(coalesce(p_ruleset_hash,'')), ''), 128)
    );
  end if;
end;
$$;

revoke all on function public.set_clinical_rule_pack_state_server(text,text,text,text,text,jsonb,text,text,timestamptz,timestamptz) from public, anon, authenticated;
grant execute on function public.set_clinical_rule_pack_state_server(text,text,text,text,text,jsonb,text,text,timestamptz,timestamptz) to service_role;

commit;
