begin;

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
  v_has_sources boolean := jsonb_typeof(p_source_manifest) = 'array'
    and jsonb_array_length(p_source_manifest) > 0;
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
       or not v_has_sources then
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
      current_version = case when v_version is not null then v_version else current_version end,
      current_ruleset_hash = case when p_status = 'approved' then v_hash else current_ruleset_hash end,
      source_manifest = case
        when p_status = 'approved' then p_source_manifest
        when v_has_sources then p_source_manifest
        else source_manifest
      end,
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

  if v_version is not null then
    insert into public.clinical_rule_pack_reviews(
      condition_code, version, decision, reviewer_name, reviewer_credentials,
      source_manifest, notes, ruleset_hash
    ) values (
      p_condition_code, v_version, v_decision,
      nullif(btrim(coalesce(p_reviewer_name,'')), ''),
      nullif(btrim(coalesce(p_reviewer_credentials,'')), ''),
      case when v_has_sources then p_source_manifest else '[]'::jsonb end,
      left(nullif(btrim(coalesce(p_notes,'')), ''), 4000),
      left(v_hash, 128)
    );
  end if;
end;
$function$;

revoke all on function public.set_clinical_rule_pack_state_server(text,text,text,text,text,jsonb,text,text,timestamptz,timestamptz) from public, anon, authenticated;
grant execute on function public.set_clinical_rule_pack_state_server(text,text,text,text,text,jsonb,text,text,timestamptz,timestamptz) to service_role;

commit;
