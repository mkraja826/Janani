begin;

-- Server-only extraction lifecycle. The Edge Function authenticates the mother,
-- then uses these service-role-only RPCs so claim/complete/fail transitions are
-- atomic and machine output can only create review_status='proposed' facts.

create or replace function public.claim_medical_report_extraction(
  p_report_id uuid,
  p_mother_id uuid,
  p_provider text,
  p_model text,
  p_parser_version text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_report public.medical_reports%rowtype;
  v_active public.medical_report_extractions%rowtype;
  v_attempt integer;
  v_extraction_id uuid := extensions.gen_random_uuid();
  v_provider text := nullif(btrim(coalesce(p_provider, '')), '');
  v_model text := nullif(btrim(coalesce(p_model, '')), '');
  v_parser text := nullif(btrim(coalesce(p_parser_version, '')), '');
begin
  if p_mother_id is null then
    raise exception using errcode = '28000', message = 'Mother identity is required';
  end if;
  if v_provider is null or char_length(v_provider) > 80 then
    raise exception using errcode = '22023', message = 'Invalid extraction provider';
  end if;
  if v_model is null or char_length(v_model) > 120 then
    raise exception using errcode = '22023', message = 'Invalid extraction model';
  end if;
  if v_parser is null or char_length(v_parser) > 80 then
    raise exception using errcode = '22023', message = 'Invalid parser version';
  end if;

  select * into v_report
  from public.medical_reports report
  where report.id = p_report_id
  for update;

  if not found or v_report.mother_id <> p_mother_id then
    raise exception using errcode = '42501', message = 'Report not found';
  end if;
  if v_report.upload_state <> 'uploaded' then
    raise exception using errcode = '22023', message = 'Upload must finish before extraction';
  end if;
  if v_report.extraction_status = 'confirmed' then
    raise exception using errcode = '55000', message = 'Confirmed report extraction cannot be replaced';
  end if;
  if exists (
    select 1 from public.medical_report_facts fact
    where fact.report_id = p_report_id and fact.review_status = 'proposed'
  ) then
    raise exception using errcode = '55000', message = 'Review current proposed values before extracting again';
  end if;

  select * into v_active
  from public.medical_report_extractions extraction
  where extraction.report_id = p_report_id
    and extraction.status = 'processing'
  order by extraction.attempt_number desc
  limit 1;

  if found then
    if v_active.started_at > now() - interval '10 minutes' then
      raise exception using errcode = '55P03', message = 'This report is already being read';
    end if;
    update public.medical_report_extractions
    set status = 'failed', error_code = 'worker_timeout', completed_at = now()
    where id = v_active.id;
  end if;

  select coalesce(max(extraction.attempt_number), 0) + 1
  into v_attempt
  from public.medical_report_extractions extraction
  where extraction.report_id = p_report_id;

  if v_attempt > 20 then
    raise exception using errcode = '54000', message = 'Too many extraction attempts for this report';
  end if;

  insert into public.medical_report_extractions(
    id, report_id, attempt_number, status, provider, model, parser_version
  ) values (
    v_extraction_id, p_report_id, v_attempt, 'processing', v_provider, v_model, v_parser
  );

  update public.medical_reports
  set extraction_status = 'processing', confirmed_at = null
  where id = p_report_id;

  return jsonb_build_object(
    'extractionId', v_extraction_id,
    'attemptNumber', v_attempt,
    'reportId', v_report.id,
    'pregnancyId', v_report.pregnancy_id,
    'motherId', v_report.mother_id,
    'storagePath', v_report.storage_path,
    'mimeType', v_report.mime_type,
    'fileSizeBytes', v_report.file_size_bytes,
    'originalFileName', v_report.original_file_name,
    'reportKind', v_report.report_kind,
    'reportDate', v_report.report_date
  );
end;
$function$;

create or replace function public.complete_medical_report_extraction(
  p_report_id uuid,
  p_extraction_id uuid,
  p_facts jsonb,
  p_source_manifest jsonb,
  p_provider_payload jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_report public.medical_reports%rowtype;
  v_extraction public.medical_report_extractions%rowtype;
  v_fact jsonb;
  v_ordinal bigint;
  v_kind text;
  v_key text;
  v_label text;
  v_value text;
  v_unit text;
  v_range text;
  v_observed_on date;
  v_confidence numeric;
  v_source_page integer;
  v_excerpt text;
  v_locator jsonb;
  v_fact_count integer;
begin
  if jsonb_typeof(coalesce(p_facts, '[]'::jsonb)) <> 'array' then
    raise exception using errcode = '22023', message = 'Extracted facts must be an array';
  end if;
  v_fact_count := jsonb_array_length(coalesce(p_facts, '[]'::jsonb));
  if v_fact_count > 100 then
    raise exception using errcode = '22023', message = 'Too many extracted facts';
  end if;
  if jsonb_typeof(coalesce(p_source_manifest, '{}'::jsonb)) <> 'object' then
    raise exception using errcode = '22023', message = 'Invalid extraction source manifest';
  end if;

  select * into v_report
  from public.medical_reports report
  where report.id = p_report_id
  for update;
  if not found then
    raise exception using errcode = '42501', message = 'Report not found';
  end if;

  select * into v_extraction
  from public.medical_report_extractions extraction
  where extraction.id = p_extraction_id
    and extraction.report_id = p_report_id
  for update;
  if not found then
    raise exception using errcode = '42501', message = 'Extraction attempt not found';
  end if;

  -- Idempotent completion protects against a lost response after commit.
  if v_extraction.status = 'completed' then
    return jsonb_build_object(
      'reportId', p_report_id,
      'extractionId', p_extraction_id,
      'extractionStatus', v_report.extraction_status,
      'factCount', (
        select count(*) from public.medical_report_facts fact
        where fact.extraction_id = p_extraction_id
      )
    );
  end if;
  if v_extraction.status <> 'processing' then
    raise exception using errcode = '55000', message = 'Extraction attempt is not active';
  end if;

  delete from public.medical_report_facts fact
  where fact.extraction_id = p_extraction_id and fact.review_status = 'proposed';

  for v_fact, v_ordinal in
    select value, ordinality - 1
    from jsonb_array_elements(coalesce(p_facts, '[]'::jsonb)) with ordinality
  loop
    v_kind := coalesce(v_fact->>'factKind', 'other');
    if v_kind not in ('lab_result','measurement','medication','diagnosis_note','appointment','other') then
      v_kind := 'other';
    end if;
    v_key := nullif(btrim(coalesce(v_fact->>'factKey', '')), '');
    v_label := btrim(coalesce(v_fact->>'displayLabel', ''));
    v_value := nullif(btrim(coalesce(v_fact->>'value', '')), '');
    v_unit := nullif(btrim(coalesce(v_fact->>'unit', '')), '');
    v_range := nullif(btrim(coalesce(v_fact->>'referenceRange', '')), '');
    v_excerpt := nullif(btrim(coalesce(v_fact->>'sourceExcerpt', '')), '');
    v_locator := case
      when jsonb_typeof(v_fact->'sourceLocator') = 'object' then v_fact->'sourceLocator'
      else '{}'::jsonb
    end;

    if char_length(v_label) not between 1 and 120 or v_value is null then
      raise exception using errcode = '22023', message = 'Invalid extracted fact';
    end if;
    if char_length(v_value) > 500
       or (v_key is not null and char_length(v_key) > 100)
       or (v_unit is not null and char_length(v_unit) > 80)
       or (v_range is not null and char_length(v_range) > 160)
       or (v_excerpt is not null and char_length(v_excerpt) > 800) then
      raise exception using errcode = '22023', message = 'Extracted fact is too long';
    end if;

    begin
      v_observed_on := case when nullif(v_fact->>'observedOn', '') is null then null else (v_fact->>'observedOn')::date end;
      v_confidence := case when nullif(v_fact->>'confidence', '') is null then null else (v_fact->>'confidence')::numeric end;
      v_source_page := case when nullif(v_fact->>'sourcePage', '') is null then null else (v_fact->>'sourcePage')::integer end;
    exception when others then
      raise exception using errcode = '22023', message = 'Invalid extracted fact metadata';
    end;

    if v_observed_on is not null and v_observed_on > current_date then
      v_observed_on := null;
    end if;
    if v_confidence is not null and (v_confidence < 0 or v_confidence > 1) then
      v_confidence := null;
    end if;
    if v_source_page is not null and (v_source_page < 1 or v_source_page > 5000) then
      v_source_page := null;
    end if;

    insert into public.medical_report_facts(
      report_id, extraction_id, pregnancy_id, mother_id, ordinal, fact_kind,
      fact_key, display_label, extracted_value, extracted_unit,
      extracted_reference_range, observed_on, confidence, source_page,
      source_excerpt, source_locator, review_status
    ) values (
      p_report_id, p_extraction_id, v_report.pregnancy_id, v_report.mother_id,
      v_ordinal::integer, v_kind, v_key, v_label, v_value, v_unit, v_range,
      v_observed_on, v_confidence, v_source_page, v_excerpt, v_locator, 'proposed'
    );
  end loop;

  update public.medical_report_extractions
  set status = 'completed',
      raw_payload = p_provider_payload,
      source_manifest = coalesce(p_source_manifest, '{}'::jsonb),
      completed_at = now(),
      error_code = null
  where id = p_extraction_id;

  update public.medical_reports
  set extraction_status = case when v_fact_count > 0 then 'needs_confirmation' else 'not_available' end,
      confirmed_at = null
  where id = p_report_id;

  return jsonb_build_object(
    'reportId', p_report_id,
    'extractionId', p_extraction_id,
    'extractionStatus', case when v_fact_count > 0 then 'needs_confirmation' else 'not_available' end,
    'factCount', v_fact_count
  );
end;
$function$;

create or replace function public.fail_medical_report_extraction(
  p_report_id uuid,
  p_extraction_id uuid,
  p_error_code text,
  p_source_manifest jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_error text := left(coalesce(nullif(btrim(p_error_code), ''), 'extraction_failed'), 120);
begin
  update public.medical_report_extractions
  set status = 'failed', error_code = v_error,
      source_manifest = case when jsonb_typeof(coalesce(p_source_manifest, '{}'::jsonb)) = 'object' then coalesce(p_source_manifest, '{}'::jsonb) else '{}'::jsonb end,
      completed_at = now()
  where id = p_extraction_id
    and report_id = p_report_id
    and status = 'processing';

  if found then
    update public.medical_reports
    set extraction_status = case when extraction_status = 'confirmed' then 'confirmed' else 'failed' end,
        confirmed_at = case when extraction_status = 'confirmed' then confirmed_at else null end
    where id = p_report_id;
  end if;
end;
$function$;

revoke all on function public.claim_medical_report_extraction(uuid,uuid,text,text,text) from public, anon, authenticated;
revoke all on function public.complete_medical_report_extraction(uuid,uuid,jsonb,jsonb,jsonb) from public, anon, authenticated;
revoke all on function public.fail_medical_report_extraction(uuid,uuid,text,jsonb) from public, anon, authenticated;

grant execute on function public.claim_medical_report_extraction(uuid,uuid,text,text,text) to service_role;
grant execute on function public.complete_medical_report_extraction(uuid,uuid,jsonb,jsonb,jsonb) to service_role;
grant execute on function public.fail_medical_report_extraction(uuid,uuid,text,jsonb) to service_role;

commit;
