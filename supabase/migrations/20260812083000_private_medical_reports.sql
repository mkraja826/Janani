begin;

-- Milestone 4: private report ingestion and confirmation.
-- Report files, machine extraction and trusted mother-confirmed facts are kept
-- deliberately separate so an OCR/AI mistake can never silently become
-- medical truth inside Janani.

create table if not exists public.medical_reports (
  id uuid primary key default extensions.gen_random_uuid(),
  pregnancy_id uuid not null references public.pregnancies(id) on delete cascade,
  mother_id uuid not null references public.profiles(id) on delete cascade,
  client_mutation_id uuid,
  report_kind text not null default 'other',
  report_date date,
  provider_name text,
  original_file_name text not null,
  storage_path text not null unique,
  mime_type text not null,
  file_size_bytes bigint not null,
  upload_state text not null default 'pending',
  extraction_status text not null default 'not_started',
  uploaded_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medical_reports_kind_check check (
    report_kind in ('blood_test','urine_test','scan_report','prescription','discharge_summary','other')
  ),
  constraint medical_reports_provider_name_check check (
    provider_name is null or (provider_name = btrim(provider_name) and char_length(provider_name) between 1 and 160)
  ),
  constraint medical_reports_original_file_name_check check (
    original_file_name = btrim(original_file_name)
    and char_length(original_file_name) between 1 and 180
  ),
  constraint medical_reports_mime_type_check check (
    mime_type in ('application/pdf','image/jpeg','image/png','image/webp','image/heic','image/heif')
  ),
  constraint medical_reports_file_size_check check (
    file_size_bytes between 1 and 15728640
  ),
  constraint medical_reports_upload_state_check check (
    upload_state in ('pending','uploaded')
  ),
  constraint medical_reports_extraction_status_check check (
    extraction_status in ('not_started','queued','processing','needs_confirmation','confirmed','failed','not_available')
  ),
  constraint medical_reports_report_date_check check (
    report_date is null or report_date <= current_date
  )
);

create unique index if not exists medical_reports_mother_mutation_uidx
  on public.medical_reports(mother_id, client_mutation_id)
  where client_mutation_id is not null;
create index if not exists medical_reports_pregnancy_created_idx
  on public.medical_reports(pregnancy_id, created_at desc);
create index if not exists medical_reports_mother_created_idx
  on public.medical_reports(mother_id, created_at desc);

create table if not exists public.medical_report_extractions (
  id uuid primary key default extensions.gen_random_uuid(),
  report_id uuid not null references public.medical_reports(id) on delete cascade,
  attempt_number integer not null,
  status text not null default 'processing',
  provider text,
  model text,
  parser_version text,
  raw_payload jsonb,
  source_manifest jsonb not null default '{}'::jsonb,
  error_code text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint medical_report_extractions_attempt_check check (attempt_number between 1 and 20),
  constraint medical_report_extractions_status_check check (status in ('processing','completed','failed')),
  constraint medical_report_extractions_provider_check check (provider is null or char_length(provider) <= 80),
  constraint medical_report_extractions_model_check check (model is null or char_length(model) <= 120),
  constraint medical_report_extractions_parser_check check (parser_version is null or char_length(parser_version) <= 80),
  constraint medical_report_extractions_error_check check (error_code is null or char_length(error_code) <= 120),
  constraint medical_report_extractions_payload_size_check check (
    raw_payload is null or octet_length(raw_payload::text) <= 131072
  ),
  constraint medical_report_extractions_manifest_size_check check (
    octet_length(source_manifest::text) <= 16384
  ),
  unique(report_id, attempt_number)
);

create index if not exists medical_report_extractions_report_idx
  on public.medical_report_extractions(report_id, attempt_number desc);

create table if not exists public.medical_report_facts (
  id uuid primary key default extensions.gen_random_uuid(),
  report_id uuid not null references public.medical_reports(id) on delete cascade,
  extraction_id uuid references public.medical_report_extractions(id) on delete cascade,
  pregnancy_id uuid not null references public.pregnancies(id) on delete cascade,
  mother_id uuid not null references public.profiles(id) on delete cascade,
  ordinal integer not null default 0,
  fact_kind text not null default 'other',
  fact_key text,
  display_label text not null,
  extracted_value text,
  extracted_unit text,
  extracted_reference_range text,
  observed_on date,
  confidence numeric(5,4),
  source_page integer,
  source_excerpt text,
  source_locator jsonb not null default '{}'::jsonb,
  review_status text not null default 'proposed',
  confirmed_value text,
  confirmed_unit text,
  confirmed_reference_range text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medical_report_facts_ordinal_check check (ordinal between 0 and 500),
  constraint medical_report_facts_kind_check check (
    fact_kind in ('lab_result','measurement','medication','diagnosis_note','appointment','other')
  ),
  constraint medical_report_facts_key_check check (fact_key is null or char_length(fact_key) <= 100),
  constraint medical_report_facts_label_check check (
    display_label = btrim(display_label) and char_length(display_label) between 1 and 120
  ),
  constraint medical_report_facts_value_check check (
    (extracted_value is null or char_length(extracted_value) <= 500)
    and (confirmed_value is null or char_length(confirmed_value) <= 500)
  ),
  constraint medical_report_facts_unit_check check (
    (extracted_unit is null or char_length(extracted_unit) <= 80)
    and (confirmed_unit is null or char_length(confirmed_unit) <= 80)
  ),
  constraint medical_report_facts_range_check check (
    (extracted_reference_range is null or char_length(extracted_reference_range) <= 160)
    and (confirmed_reference_range is null or char_length(confirmed_reference_range) <= 160)
  ),
  constraint medical_report_facts_confidence_check check (
    confidence is null or confidence between 0 and 1
  ),
  constraint medical_report_facts_page_check check (source_page is null or source_page between 1 and 5000),
  constraint medical_report_facts_excerpt_check check (source_excerpt is null or char_length(source_excerpt) <= 800),
  constraint medical_report_facts_locator_check check (octet_length(source_locator::text) <= 4096),
  constraint medical_report_facts_review_status_check check (
    review_status in ('proposed','confirmed','corrected','rejected')
  ),
  constraint medical_report_facts_observed_on_check check (observed_on is null or observed_on <= current_date)
);

create index if not exists medical_report_facts_report_idx
  on public.medical_report_facts(report_id, ordinal, created_at);
create index if not exists medical_report_facts_confirmed_idx
  on public.medical_report_facts(pregnancy_id, mother_id, reviewed_at desc)
  where review_status in ('confirmed','corrected');

-- Keep updated_at behavior consistent with the existing Janani schema.
drop trigger if exists medical_reports_updated_at on public.medical_reports;
create trigger medical_reports_updated_at
before update on public.medical_reports
for each row execute function public.set_updated_at();

drop trigger if exists medical_report_facts_updated_at on public.medical_report_facts;
create trigger medical_report_facts_updated_at
before update on public.medical_report_facts
for each row execute function public.set_updated_at();

alter table public.medical_reports enable row level security;
alter table public.medical_report_extractions enable row level security;
alter table public.medical_report_facts enable row level security;

-- Authenticated clients can only SELECT their own report data. Mutations go
-- through validated RPCs; machine extraction writes use the service role.
revoke all on public.medical_reports from anon, authenticated;
revoke all on public.medical_report_extractions from anon, authenticated;
revoke all on public.medical_report_facts from anon, authenticated;
grant select on public.medical_reports to authenticated;
grant select on public.medical_report_extractions to authenticated;
grant select on public.medical_report_facts to authenticated;

create policy medical_reports_select_mother
on public.medical_reports
for select
to authenticated
using (mother_id = (select auth.uid()));

create policy medical_report_extractions_select_mother
on public.medical_report_extractions
for select
to authenticated
using (
  exists (
    select 1 from public.medical_reports report
    where report.id = medical_report_extractions.report_id
      and report.mother_id = (select auth.uid())
  )
);

create policy medical_report_facts_select_mother
on public.medical_report_facts
for select
to authenticated
using (mother_id = (select auth.uid()));

-- Private Storage bucket. A client must first create the matching report row;
-- storage access is then restricted to the authenticated mother owning that row.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'medical-reports',
  'medical-reports',
  false,
  15728640,
  array['application/pdf','image/jpeg','image/png','image/webp','image/heic','image/heif']::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists medical_reports_storage_select_mother on storage.objects;
create policy medical_reports_storage_select_mother
on storage.objects
for select
to authenticated
using (
  bucket_id = 'medical-reports'
  and exists (
    select 1 from public.medical_reports report
    where report.storage_path = storage.objects.name
      and report.mother_id = (select auth.uid())
  )
);

drop policy if exists medical_reports_storage_insert_mother on storage.objects;
create policy medical_reports_storage_insert_mother
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'medical-reports'
  and exists (
    select 1 from public.medical_reports report
    where report.storage_path = storage.objects.name
      and report.mother_id = (select auth.uid())
      and report.upload_state = 'pending'
  )
);

drop policy if exists medical_reports_storage_delete_mother on storage.objects;
create policy medical_reports_storage_delete_mother
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'medical-reports'
  and exists (
    select 1 from public.medical_reports report
    where report.storage_path = storage.objects.name
      and report.mother_id = (select auth.uid())
  )
);

create or replace function public.create_own_medical_report(
  p_pregnancy_id uuid,
  p_original_file_name text,
  p_mime_type text,
  p_file_size_bytes bigint,
  p_report_kind text default 'other',
  p_report_date date default null,
  p_provider_name text default null,
  p_client_mutation_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_report_id uuid := extensions.gen_random_uuid();
  v_original_name text := btrim(coalesce(p_original_file_name, ''));
  v_provider_name text := nullif(btrim(coalesce(p_provider_name, '')), '');
  v_extension text;
  v_storage_path text;
  v_existing public.medical_reports%rowtype;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  if not exists (
    select 1 from public.pregnancies pregnancy
    where pregnancy.id = p_pregnancy_id
      and pregnancy.mother_id = v_user_id
  ) then
    raise exception using errcode = '42501', message = 'Reports are available only to the mother who owns this pregnancy';
  end if;
  if p_client_mutation_id is not null then
    select * into v_existing
    from public.medical_reports report
    where report.mother_id = v_user_id
      and report.client_mutation_id = p_client_mutation_id;
    if found then
      return jsonb_build_object(
        'id', v_existing.id,
        'storagePath', v_existing.storage_path,
        'uploadState', v_existing.upload_state,
        'extractionStatus', v_existing.extraction_status
      );
    end if;
  end if;
  if char_length(v_original_name) not between 1 and 180 then
    raise exception using errcode = '22023', message = 'File name must be between 1 and 180 characters';
  end if;
  if p_mime_type not in ('application/pdf','image/jpeg','image/png','image/webp','image/heic','image/heif') then
    raise exception using errcode = '22023', message = 'Only PDF and supported image reports can be uploaded';
  end if;
  if p_file_size_bytes is null or p_file_size_bytes < 1 or p_file_size_bytes > 15728640 then
    raise exception using errcode = '22023', message = 'Report file must be 15 MB or smaller';
  end if;
  if p_report_kind not in ('blood_test','urine_test','scan_report','prescription','discharge_summary','other') then
    raise exception using errcode = '22023', message = 'Unsupported report type';
  end if;
  if p_report_date is not null and p_report_date > current_date then
    raise exception using errcode = '22023', message = 'Report date cannot be in the future';
  end if;
  if v_provider_name is not null and char_length(v_provider_name) > 160 then
    raise exception using errcode = '22023', message = 'Provider name is too long';
  end if;

  v_extension := case p_mime_type
    when 'application/pdf' then 'pdf'
    when 'image/png' then 'png'
    when 'image/webp' then 'webp'
    when 'image/heic' then 'heic'
    when 'image/heif' then 'heif'
    else 'jpg'
  end;
  v_storage_path := v_user_id::text || '/' || p_pregnancy_id::text || '/' || v_report_id::text || '/report.' || v_extension;

  insert into public.medical_reports(
    id, pregnancy_id, mother_id, client_mutation_id, report_kind, report_date,
    provider_name, original_file_name, storage_path, mime_type, file_size_bytes
  ) values (
    v_report_id, p_pregnancy_id, v_user_id, p_client_mutation_id, p_report_kind,
    p_report_date, v_provider_name, v_original_name, v_storage_path, p_mime_type,
    p_file_size_bytes
  );

  return jsonb_build_object(
    'id', v_report_id,
    'storagePath', v_storage_path,
    'uploadState', 'pending',
    'extractionStatus', 'not_started'
  );
end;
$function$;

create or replace function public.mark_own_medical_report_uploaded(p_report_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_report public.medical_reports%rowtype;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  select * into v_report
  from public.medical_reports report
  where report.id = p_report_id and report.mother_id = v_user_id;
  if not found then
    raise exception using errcode = '42501', message = 'Report not found';
  end if;
  if not exists (
    select 1 from storage.objects object
    where object.bucket_id = 'medical-reports'
      and object.name = v_report.storage_path
  ) then
    raise exception using errcode = '22023', message = 'Uploaded report file was not found';
  end if;

  update public.medical_reports
  set upload_state = 'uploaded', uploaded_at = coalesce(uploaded_at, now())
  where id = p_report_id;

  return jsonb_build_object('id', p_report_id, 'uploadState', 'uploaded');
end;
$function$;

create or replace function public.queue_own_medical_report_extraction(p_report_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_report public.medical_reports%rowtype;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  select * into v_report from public.medical_reports report
  where report.id = p_report_id and report.mother_id = v_user_id;
  if not found then raise exception using errcode = '42501', message = 'Report not found'; end if;
  if v_report.upload_state <> 'uploaded' then
    raise exception using errcode = '22023', message = 'Upload must finish before extraction';
  end if;
  if v_report.extraction_status = 'confirmed' then
    return jsonb_build_object('id', p_report_id, 'extractionStatus', 'confirmed');
  end if;
  update public.medical_reports set extraction_status = 'queued' where id = p_report_id;
  return jsonb_build_object('id', p_report_id, 'extractionStatus', 'queued');
end;
$function$;

create or replace function public.list_own_medical_reports(p_pregnancy_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_result jsonb;
begin
  if v_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  if not exists (
    select 1 from public.pregnancies pregnancy
    where pregnancy.id = p_pregnancy_id and pregnancy.mother_id = v_user_id
  ) then
    raise exception using errcode = '42501', message = 'Reports are private to the mother';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', report.id,
    'reportKind', report.report_kind,
    'reportDate', report.report_date,
    'providerName', report.provider_name,
    'originalFileName', report.original_file_name,
    'mimeType', report.mime_type,
    'fileSizeBytes', report.file_size_bytes,
    'uploadState', report.upload_state,
    'extractionStatus', report.extraction_status,
    'uploadedAt', report.uploaded_at,
    'confirmedAt', report.confirmed_at,
    'createdAt', report.created_at,
    'proposedFacts', (select count(*) from public.medical_report_facts fact where fact.report_id = report.id and fact.review_status = 'proposed'),
    'confirmedFacts', (select count(*) from public.medical_report_facts fact where fact.report_id = report.id and fact.review_status in ('confirmed','corrected'))
  ) order by coalesce(report.report_date, report.created_at::date) desc, report.created_at desc), '[]'::jsonb)
  into v_result
  from public.medical_reports report
  where report.pregnancy_id = p_pregnancy_id and report.mother_id = v_user_id;
  return v_result;
end;
$function$;

create or replace function public.get_own_medical_report(p_report_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_report public.medical_reports%rowtype;
  v_facts jsonb;
  v_extractions jsonb;
begin
  if v_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  select * into v_report from public.medical_reports report
  where report.id = p_report_id and report.mother_id = v_user_id;
  if not found then raise exception using errcode = '42501', message = 'Report not found'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', fact.id,
    'extractionId', fact.extraction_id,
    'factKind', fact.fact_kind,
    'factKey', fact.fact_key,
    'displayLabel', fact.display_label,
    'extractedValue', fact.extracted_value,
    'extractedUnit', fact.extracted_unit,
    'extractedReferenceRange', fact.extracted_reference_range,
    'confirmedValue', fact.confirmed_value,
    'confirmedUnit', fact.confirmed_unit,
    'confirmedReferenceRange', fact.confirmed_reference_range,
    'observedOn', fact.observed_on,
    'confidence', fact.confidence,
    'sourcePage', fact.source_page,
    'sourceExcerpt', fact.source_excerpt,
    'sourceLocator', fact.source_locator,
    'reviewStatus', fact.review_status,
    'reviewedAt', fact.reviewed_at
  ) order by fact.ordinal, fact.created_at), '[]'::jsonb)
  into v_facts from public.medical_report_facts fact where fact.report_id = p_report_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', extraction.id,
    'attemptNumber', extraction.attempt_number,
    'status', extraction.status,
    'provider', extraction.provider,
    'model', extraction.model,
    'parserVersion', extraction.parser_version,
    'errorCode', extraction.error_code,
    'startedAt', extraction.started_at,
    'completedAt', extraction.completed_at
  ) order by extraction.attempt_number desc), '[]'::jsonb)
  into v_extractions from public.medical_report_extractions extraction where extraction.report_id = p_report_id;

  return jsonb_build_object(
    'id', v_report.id,
    'pregnancyId', v_report.pregnancy_id,
    'reportKind', v_report.report_kind,
    'reportDate', v_report.report_date,
    'providerName', v_report.provider_name,
    'originalFileName', v_report.original_file_name,
    'storagePath', v_report.storage_path,
    'mimeType', v_report.mime_type,
    'fileSizeBytes', v_report.file_size_bytes,
    'uploadState', v_report.upload_state,
    'extractionStatus', v_report.extraction_status,
    'uploadedAt', v_report.uploaded_at,
    'confirmedAt', v_report.confirmed_at,
    'createdAt', v_report.created_at,
    'facts', v_facts,
    'extractions', v_extractions
  );
end;
$function$;

create or replace function public.review_own_medical_report_facts(
  p_report_id uuid,
  p_reviews jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_review jsonb;
  v_fact_id uuid;
  v_decision text;
  v_value text;
  v_unit text;
  v_range text;
  v_fact public.medical_report_facts%rowtype;
begin
  if v_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  if not exists (select 1 from public.medical_reports report where report.id = p_report_id and report.mother_id = v_user_id) then
    raise exception using errcode = '42501', message = 'Report not found';
  end if;
  if jsonb_typeof(coalesce(p_reviews, '[]'::jsonb)) <> 'array' then
    raise exception using errcode = '22023', message = 'Reviews must be an array';
  end if;
  if jsonb_array_length(coalesce(p_reviews, '[]'::jsonb)) > 100 then
    raise exception using errcode = '22023', message = 'Too many report facts in one review';
  end if;

  for v_review in select value from jsonb_array_elements(coalesce(p_reviews, '[]'::jsonb)) loop
    begin
      v_fact_id := (v_review->>'id')::uuid;
    exception when others then
      raise exception using errcode = '22023', message = 'Invalid report fact id';
    end;
    v_decision := v_review->>'decision';
    if v_decision not in ('confirmed','corrected','rejected') then
      raise exception using errcode = '22023', message = 'Invalid report fact review decision';
    end if;
    select * into v_fact from public.medical_report_facts fact
    where fact.id = v_fact_id and fact.report_id = p_report_id and fact.mother_id = v_user_id;
    if not found then raise exception using errcode = '42501', message = 'Report fact not found'; end if;

    if v_decision = 'rejected' then
      update public.medical_report_facts
      set review_status = 'rejected', confirmed_value = null, confirmed_unit = null,
          confirmed_reference_range = null, reviewed_by = v_user_id, reviewed_at = now()
      where id = v_fact_id;
    else
      v_value := nullif(btrim(coalesce(v_review->>'value', v_fact.extracted_value, '')), '');
      v_unit := nullif(btrim(coalesce(v_review->>'unit', v_fact.extracted_unit, '')), '');
      v_range := nullif(btrim(coalesce(v_review->>'referenceRange', v_fact.extracted_reference_range, '')), '');
      if v_value is null then raise exception using errcode = '22023', message = 'Confirmed report value cannot be empty'; end if;
      if char_length(v_value) > 500 or (v_unit is not null and char_length(v_unit) > 80) or (v_range is not null and char_length(v_range) > 160) then
        raise exception using errcode = '22023', message = 'Confirmed report value is too long';
      end if;
      update public.medical_report_facts
      set review_status = v_decision,
          confirmed_value = v_value,
          confirmed_unit = v_unit,
          confirmed_reference_range = v_range,
          reviewed_by = v_user_id,
          reviewed_at = now()
      where id = v_fact_id;
    end if;
  end loop;

  if not exists (select 1 from public.medical_report_facts fact where fact.report_id = p_report_id and fact.review_status = 'proposed')
     and exists (select 1 from public.medical_report_facts fact where fact.report_id = p_report_id) then
    update public.medical_reports set extraction_status = 'confirmed', confirmed_at = now() where id = p_report_id;
  else
    update public.medical_reports set extraction_status = 'needs_confirmation', confirmed_at = null where id = p_report_id;
  end if;

  return public.get_own_medical_report(p_report_id);
end;
$function$;

create or replace function public.add_own_manual_report_fact(
  p_report_id uuid,
  p_display_label text,
  p_value text,
  p_fact_kind text default 'other',
  p_unit text default null,
  p_reference_range text default null,
  p_observed_on date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_report public.medical_reports%rowtype;
  v_fact_id uuid := extensions.gen_random_uuid();
  v_label text := btrim(coalesce(p_display_label, ''));
  v_value text := btrim(coalesce(p_value, ''));
  v_unit text := nullif(btrim(coalesce(p_unit, '')), '');
  v_range text := nullif(btrim(coalesce(p_reference_range, '')), '');
  v_ordinal integer;
begin
  if v_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  select * into v_report from public.medical_reports report where report.id = p_report_id and report.mother_id = v_user_id;
  if not found then raise exception using errcode = '42501', message = 'Report not found'; end if;
  if v_report.upload_state <> 'uploaded' then raise exception using errcode = '22023', message = 'Upload must finish first'; end if;
  if p_fact_kind not in ('lab_result','measurement','medication','diagnosis_note','appointment','other') then raise exception using errcode = '22023', message = 'Unsupported fact type'; end if;
  if char_length(v_label) not between 1 and 120 or char_length(v_value) not between 1 and 500 then raise exception using errcode = '22023', message = 'Check the report value and label'; end if;
  if v_unit is not null and char_length(v_unit) > 80 then raise exception using errcode = '22023', message = 'Unit is too long'; end if;
  if v_range is not null and char_length(v_range) > 160 then raise exception using errcode = '22023', message = 'Reference range is too long'; end if;
  if p_observed_on is not null and p_observed_on > current_date then raise exception using errcode = '22023', message = 'Observed date cannot be in the future'; end if;
  select coalesce(max(fact.ordinal), -1) + 1 into v_ordinal from public.medical_report_facts fact where fact.report_id = p_report_id;
  if v_ordinal > 500 then raise exception using errcode = '22023', message = 'Too many facts in this report'; end if;

  insert into public.medical_report_facts(
    id, report_id, pregnancy_id, mother_id, ordinal, fact_kind, display_label,
    observed_on, source_locator, review_status, confirmed_value, confirmed_unit,
    confirmed_reference_range, reviewed_by, reviewed_at
  ) values (
    v_fact_id, p_report_id, v_report.pregnancy_id, v_user_id, v_ordinal, p_fact_kind,
    v_label, p_observed_on, jsonb_build_object('origin','manual_entry'), 'confirmed',
    v_value, v_unit, v_range, v_user_id, now()
  );
  update public.medical_reports
  set extraction_status = case when extraction_status = 'not_started' then 'needs_confirmation' else extraction_status end
  where id = p_report_id;
  return v_fact_id;
end;
$function$;

create or replace function public.delete_own_medical_report_record(p_report_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_report public.medical_reports%rowtype;
begin
  if v_user_id is null then raise exception using errcode = '28000', message = 'Authentication required'; end if;
  select * into v_report from public.medical_reports report where report.id = p_report_id and report.mother_id = v_user_id;
  if not found then raise exception using errcode = '42501', message = 'Report not found'; end if;
  if exists (select 1 from storage.objects object where object.bucket_id = 'medical-reports' and object.name = v_report.storage_path) then
    raise exception using errcode = '55000', message = 'Delete the private report file before deleting its record';
  end if;
  delete from public.medical_reports where id = p_report_id and mother_id = v_user_id;
end;
$function$;

revoke all on function public.create_own_medical_report(uuid,text,text,bigint,text,date,text,uuid) from public, anon;
revoke all on function public.mark_own_medical_report_uploaded(uuid) from public, anon;
revoke all on function public.queue_own_medical_report_extraction(uuid) from public, anon;
revoke all on function public.list_own_medical_reports(uuid) from public, anon;
revoke all on function public.get_own_medical_report(uuid) from public, anon;
revoke all on function public.review_own_medical_report_facts(uuid,jsonb) from public, anon;
revoke all on function public.add_own_manual_report_fact(uuid,text,text,text,text,text,date) from public, anon;
revoke all on function public.delete_own_medical_report_record(uuid) from public, anon;

grant execute on function public.create_own_medical_report(uuid,text,text,bigint,text,date,text,uuid) to authenticated;
grant execute on function public.mark_own_medical_report_uploaded(uuid) to authenticated;
grant execute on function public.queue_own_medical_report_extraction(uuid) to authenticated;
grant execute on function public.list_own_medical_reports(uuid) to authenticated;
grant execute on function public.get_own_medical_report(uuid) to authenticated;
grant execute on function public.review_own_medical_report_facts(uuid,jsonb) to authenticated;
grant execute on function public.add_own_manual_report_fact(uuid,text,text,text,text,text,date) to authenticated;
grant execute on function public.delete_own_medical_report_record(uuid) to authenticated;

commit;
