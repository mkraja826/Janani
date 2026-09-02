begin;
create index if not exists medical_report_facts_extraction_id_idx on public.medical_report_facts(extraction_id) where extraction_id is not null;
create index if not exists medical_report_facts_mother_id_idx on public.medical_report_facts(mother_id);
create index if not exists medical_report_facts_reviewed_by_idx on public.medical_report_facts(reviewed_by) where reviewed_by is not null;
commit;