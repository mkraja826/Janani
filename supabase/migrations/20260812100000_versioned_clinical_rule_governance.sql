begin;

alter table public.clinical_rule_packs
  add column if not exists current_ruleset_hash text;

alter table public.clinical_rule_packs
  drop constraint if exists clinical_rule_packs_current_ruleset_hash_check;
alter table public.clinical_rule_packs
  add constraint clinical_rule_packs_current_ruleset_hash_check
  check (current_ruleset_hash is null or current_ruleset_hash ~ '^[0-9a-f]{64}$');

create table if not exists public.clinical_rule_versions (
  condition_code text not null references public.clinical_rule_packs(condition_code) on delete cascade,
  version text not null,
  schema_version text not null,
  ruleset jsonb not null,
  ruleset_hash text not null,
  source_manifest jsonb not null,
  created_at timestamptz not null default now(),
  primary key (condition_code, version),
  constraint clinical_rule_versions_version_check
    check (version = btrim(version) and char_length(version) between 1 and 64),
  constraint clinical_rule_versions_schema_version_check
    check (schema_version = btrim(schema_version) and char_length(schema_version) between 1 and 80),
  constraint clinical_rule_versions_hash_check
    check (ruleset_hash ~ '^[0-9a-f]{64}$'),
  constraint clinical_rule_versions_ruleset_object_check
    check (jsonb_typeof(ruleset) = 'object'),
  constraint clinical_rule_versions_rules_array_check
    check (jsonb_typeof(ruleset->'rules') = 'array'),
  constraint clinical_rule_versions_rule_count_check
    check (jsonb_array_length(ruleset->'rules') <= 500),
  constraint clinical_rule_versions_schema_match_check
    check (ruleset->>'schemaVersion' = schema_version),
  constraint clinical_rule_versions_ruleset_size_check
    check (octet_length(ruleset::text) <= 524288),
  constraint clinical_rule_versions_sources_array_check
    check (jsonb_typeof(source_manifest) = 'array' and jsonb_array_length(source_manifest) > 0),
  constraint clinical_rule_versions_sources_size_check
    check (octet_length(source_manifest::text) <= 131072)
);

alter table public.clinical_rule_versions enable row level security;
revoke all on public.clinical_rule_versions from public, anon, authenticated;
grant select, insert on public.clinical_rule_versions to service_role;

create or replace function public.register_clinical_rule_version_server(
  p_condition_code text,
  p_version text,
  p_schema_version text,
  p_ruleset jsonb,
  p_source_manifest jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_condition text := btrim(coalesce(p_condition_code, ''));
  v_version text := btrim(coalesce(p_version, ''));
  v_schema text := btrim(coalesce(p_schema_version, ''));
  v_hash text;
  v_existing public.clinical_rule_versions%rowtype;
begin
  if char_length(v_condition) < 1 or char_length(v_condition) > 100 then
    raise exception using errcode = '22023', message = 'Invalid clinical rule condition code';
  end if;
  if char_length(v_version) < 1 or char_length(v_version) > 64 then
    raise exception using errcode = '22023', message = 'Invalid clinical rule version';
  end if;
  if char_length(v_schema) < 1 or char_length(v_schema) > 80 then
    raise exception using errcode = '22023', message = 'Invalid clinical rule schema version';
  end if;
  if not exists (select 1 from public.clinical_rule_packs pack where pack.condition_code = v_condition) then
    raise exception using errcode = '23503', message = 'Clinical rule pack does not exist';
  end if;
  if jsonb_typeof(p_ruleset) <> 'object'
     or jsonb_typeof(p_ruleset->'rules') <> 'array'
     or p_ruleset->>'schemaVersion' is distinct from v_schema then
    raise exception using errcode = '22023', message = 'Clinical ruleset schema is invalid';
  end if;
  if jsonb_array_length(p_ruleset->'rules') > 500 or octet_length(p_ruleset::text) > 524288 then
    raise exception using errcode = '22023', message = 'Clinical ruleset is too large';
  end if;
  if jsonb_typeof(p_source_manifest) <> 'array'
     or jsonb_array_length(p_source_manifest) = 0
     or octet_length(p_source_manifest::text) > 131072 then
    raise exception using errcode = '22023', message = 'Clinical rule sources are required';
  end if;

  v_hash := encode(extensions.digest(convert_to(p_ruleset::text, 'UTF8'), 'sha256'), 'hex');

  select * into v_existing
  from public.clinical_rule_versions version_row
  where version_row.condition_code = v_condition and version_row.version = v_version;

  if found then
    if v_existing.ruleset_hash <> v_hash
       or v_existing.ruleset <> p_ruleset
       or v_existing.source_manifest <> p_source_manifest
       or v_existing.schema_version <> v_schema then
      raise exception using errcode = '23505', message = 'Clinical rule version is immutable and already exists with different content';
    end if;
    return jsonb_build_object(
      'conditionCode', v_existing.condition_code,
      'version', v_existing.version,
      'rulesetHash', v_existing.ruleset_hash,
      'createdAt', v_existing.created_at,
      'existing', true
    );
  end if;

  insert into public.clinical_rule_versions(
    condition_code, version, schema_version, ruleset, ruleset_hash, source_manifest
  ) values (
    v_condition, v_version, v_schema, p_ruleset, v_hash, p_source_manifest
  );

  return jsonb_build_object(
    'conditionCode', v_condition,
    'version', v_version,
    'rulesetHash', v_hash,
    'existing', false
  );
end;
$function$;

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
set search_path = ''
as $function$
declare
  v_decision text;
  v_version text := nullif(btrim(coalesce(p_version, '')), '');
  v_hash text := nullif(lower(btrim(coalesce(p_ruleset_hash, ''))), '');
  v_registered public.clinical_rule_versions%rowtype;
  v_effective_at timestamptz;
begin
  if p_status not in ('draft','pending_review','approved','suspended','retired') then
    raise exception using errcode = '22023', message = 'Invalid clinical rule status';
  end if;

  if p_status = 'approved' then
    if v_version is null
       or nullif(btrim(coalesce(p_reviewer_name,'')), '') is null
       or nullif(btrim(coalesce(p_reviewer_credentials,'')), '') is null
       or v_hash is null
       or v_hash !~ '^[0-9a-f]{64}$'
       or jsonb_typeof(p_source_manifest) <> 'array'
       or jsonb_array_length(p_source_manifest) = 0 then
      raise exception using errcode = '22023', message = 'Approval requires version, reviewed ruleset hash, reviewer identity/credentials and sources';
    end if;

    select * into v_registered
    from public.clinical_rule_versions version_row
    where version_row.condition_code = p_condition_code
      and version_row.version = v_version;
    if not found then
      raise exception using errcode = '22023', message = 'Approved clinical rule version is not registered';
    end if;
    if v_registered.ruleset_hash <> v_hash then
      raise exception using errcode = '22023', message = 'Approved ruleset hash does not match the registered immutable version';
    end if;
    if v_registered.source_manifest <> p_source_manifest then
      raise exception using errcode = '22023', message = 'Approved source manifest does not match the registered immutable version';
    end if;

    v_effective_at := coalesce(p_effective_at, now());
    if p_expires_at is not null and p_expires_at <= v_effective_at then
      raise exception using errcode = '22023', message = 'Clinical rule expiry must be after its effective time';
    end if;
  end if;

  insert into public.clinical_rule_packs(condition_code, status)
  values (p_condition_code, p_status)
  on conflict (condition_code) do nothing;

  update public.clinical_rule_packs
  set status = p_status,
      current_version = case when p_version is not null then btrim(p_version) else current_version end,
      current_ruleset_hash = case when p_status = 'approved' then v_hash else current_ruleset_hash end,
      source_manifest = case when p_source_manifest is not null then p_source_manifest else source_manifest end,
      reviewer_name = case when p_status = 'approved' then btrim(p_reviewer_name) else reviewer_name end,
      reviewer_credentials = case when p_status = 'approved' then btrim(p_reviewer_credentials) else reviewer_credentials end,
      reviewed_at = case when p_status = 'approved' then now() else reviewed_at end,
      effective_at = case when p_status = 'approved' then v_effective_at else effective_at end,
      expires_at = case when p_status = 'approved' then p_expires_at else expires_at end,
      suspended_at = case when p_status = 'suspended' then now() else null end,
      suspension_reason = case when p_status = 'suspended' then left(nullif(btrim(coalesce(p_notes,'')), ''), 1000) else null end,
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
      p_condition_code, btrim(p_version), v_decision,
      nullif(btrim(coalesce(p_reviewer_name,'')), ''),
      nullif(btrim(coalesce(p_reviewer_credentials,'')), ''),
      coalesce(p_source_manifest, '[]'::jsonb),
      left(nullif(btrim(coalesce(p_notes,'')), ''), 4000),
      left(v_hash, 128)
    );
  end if;
end;
$function$;

create or replace function public.get_active_clinical_rules_server(p_condition_codes text[])
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(jsonb_agg(jsonb_build_object(
    'conditionCode', pack.condition_code,
    'version', pack.current_version,
    'schemaVersion', version_row.schema_version,
    'rulesetHash', version_row.ruleset_hash,
    'ruleset', version_row.ruleset,
    'sourceManifest', version_row.source_manifest,
    'reviewedAt', pack.reviewed_at,
    'effectiveAt', pack.effective_at,
    'expiresAt', pack.expires_at
  ) order by pack.condition_code), '[]'::jsonb)
  from public.clinical_rule_packs pack
  join public.clinical_rule_versions version_row
    on version_row.condition_code = pack.condition_code
   and version_row.version = pack.current_version
   and version_row.ruleset_hash = pack.current_ruleset_hash
  where pack.condition_code = any(coalesce(p_condition_codes, array[]::text[]))
    and pack.status = 'approved'
    and pack.reviewed_at is not null
    and pack.reviewer_name is not null
    and pack.reviewer_credentials is not null
    and pack.effective_at <= now()
    and (pack.expires_at is null or pack.expires_at > now())
    and pack.suspended_at is null;
$function$;

revoke all on function public.register_clinical_rule_version_server(text,text,text,jsonb,jsonb) from public, anon, authenticated;
revoke all on function public.set_clinical_rule_pack_state_server(text,text,text,text,text,jsonb,text,text,timestamptz,timestamptz) from public, anon, authenticated;
revoke all on function public.get_active_clinical_rules_server(text[]) from public, anon, authenticated;
grant execute on function public.register_clinical_rule_version_server(text,text,text,jsonb,jsonb) to service_role;
grant execute on function public.set_clinical_rule_pack_state_server(text,text,text,text,text,jsonb,text,text,timestamptz,timestamptz) to service_role;
grant execute on function public.get_active_clinical_rules_server(text[]) to service_role;

commit;
