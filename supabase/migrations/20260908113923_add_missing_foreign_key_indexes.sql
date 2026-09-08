begin;

-- These foreign keys are traversed during parent-row updates/deletes. The
-- existing partial idempotency indexes do not cover the general FK checks.
create index if not exists reminders_created_by_idx
  on public.reminders (created_by);

create index if not exists journal_entries_author_id_idx
  on public.journal_entries (author_id);

create index if not exists medical_report_facts_pregnancy_id_idx
  on public.medical_report_facts (pregnancy_id);

commit;
