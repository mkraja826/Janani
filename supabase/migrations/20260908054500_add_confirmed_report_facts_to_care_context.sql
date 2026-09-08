begin;

create or replace function public.get_own_private_care_context(p_pregnancy_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_context public.private_care_contexts%rowtype;
  v_medications jsonb;
  v_report_facts jsonb;
begin
  if v_user is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.pregnancies pregnancy
    where pregnancy.id = p_pregnancy_id
      and pregnancy.mother_id = v_user
  ) then
    raise exception using errcode = '42501', message = 'Private care context is available only to the mother who owns this pregnancy';
  end if;

  insert into public.private_care_contexts(pregnancy_id, mother_id)
  values (p_pregnancy_id, v_user)
  on conflict (pregnancy_id) do nothing;

  select *
  into v_context
  from public.private_care_contexts context
  where context.pregnancy_id = p_pregnancy_id
    and context.mother_id = v_user;

  select coalesce(
    jsonb_agg(to_jsonb(medication) order by medication.active desc, medication.updated_at desc),
    '[]'::jsonb
  )
  into v_medications
  from public.care_medications medication
  where medication.pregnancy_id = p_pregnancy_id
    and medication.mother_id = v_user;

  select coalesce(
    jsonb_agg(fact_payload order by observed_on desc nulls last, reviewed_at desc nulls last, created_at desc),
    '[]'::jsonb
  )
  into v_report_facts
  from (
    select
      jsonb_build_object(
        'id', fact.id,
        'factKind', fact.fact_kind,
        'displayLabel', fact.display_label,
        'value', fact.confirmed_value,
        'unit', fact.confirmed_unit,
        'referenceRange', fact.confirmed_reference_range,
        'observedOn', fact.observed_on,
        'reviewStatus', fact.review_status,
        'reportKind', report.report_kind,
        'reportDate', report.report_date,
        'providerName', report.provider_name
      ) as fact_payload,
      fact.observed_on,
      fact.reviewed_at,
      fact.created_at
    from public.medical_report_facts fact
    join public.medical_reports report on report.id = fact.report_id
    where fact.pregnancy_id = p_pregnancy_id
      and fact.mother_id = v_user
      and report.pregnancy_id = p_pregnancy_id
      and report.mother_id = v_user
      and report.extraction_status = 'confirmed'
      and fact.review_status in ('confirmed', 'corrected')
      and fact.confirmed_value is not null
    order by fact.observed_on desc nulls last, fact.reviewed_at desc nulls last, fact.created_at desc
    limit 50
  ) confirmed;

  return to_jsonb(v_context)
    || jsonb_build_object(
      'medications', v_medications,
      'confirmedReportFacts', v_report_facts
    );
end;
$function$;

revoke all on function public.get_own_private_care_context(uuid) from public, anon;
grant execute on function public.get_own_private_care_context(uuid) to authenticated;

commit;
