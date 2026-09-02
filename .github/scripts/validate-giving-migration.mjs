import fs from 'node:fs';

const migrationPath = 'supabase/migrations/20260902043000_janani_giving_foundation.sql';
if (!fs.existsSync(migrationPath)) {
  console.log('Janani Giving migration is not present on this branch; skipping Giving migration validation.');
  process.exit(0);
}

const sql = fs.readFileSync(migrationPath, 'utf8');
const normalized = sql.replace(/\s+/g, ' ').toLowerCase();

const requireText = (needle, message) => {
  if (!normalized.includes(needle.toLowerCase())) throw new Error(message);
};
const forbid = (pattern, message) => {
  if (pattern.test(sql)) throw new Error(message);
};

requireText('create schema if not exists janani_giving', 'Giving data must remain isolated in the janani_giving schema.');
requireText('revoke all on schema janani_giving from public, anon, authenticated', 'Private Giving schema must not be directly exposed to public app roles.');
for (const table of ['organisations', 'periods', 'donations', 'publications', 'audit_events']) {
  requireText(`alter table janani_giving.${table} enable row level security`, `${table} must have RLS enabled.`);
}
requireText('revoke all on all tables in schema janani_giving from public, anon, authenticated', 'Private Giving tables must be denied to public app roles.');

requireText('create table if not exists janani_giving.publications', 'Published Giving records must be stored in the private Giving schema.');
requireText('create view public.public_giving_ledger', 'The public ledger must be a restricted view, not a public storage table.');
requireText('grant select on public.public_giving_ledger to anon, authenticated', 'Website access must remain SELECT-only on the sanitized public ledger.');
requireText("'verified'::text as verification_status", 'Public ledger must expose only verified publication status.');
requireText('p.organisation_name', 'Public ledger must expose organisation name.');
requireText('p.cause', 'Public ledger must expose cause.');
requireText('p.amount_inr', 'Public ledger must expose amount.');
requireText('p.transferred_at', 'Public ledger must expose transfer date.');
requireText('p.public_reference', 'Public ledger must expose Janani public reference.');
forbid(/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.public_giving_ledger/i, 'Public ledger must not be a table because callers could request internal columns.');
forbid(/create\s+(?:or\s+replace\s+)?view\s+public\.public_giving_ledger[\s\S]*?select[\s\S]*?\bdonation_id\b[\s\S]*?from\s+janani_giving\.publications/i, 'Public ledger view must never expose the internal donation ID.');
forbid(/create\s+(?:or\s+replace\s+)?view\s+public\.public_giving_ledger[\s\S]*?select[\s\S]*?\bpublished_at\b[\s\S]*?from\s+janani_giving\.publications/i, 'Public ledger view must expose only the approved six fields.');

requireText("if v_donation.status <> 'reconciled'", 'Publishing must require a reconciled donation.');
requireText("v_period.status <> 'closed'", 'Publishing must require a closed accounting period.');
requireText("if v_organisation.due_diligence_status <> 'verified'", 'Publishing must require a verified organisation.');
requireText('or not v_organisation.bank_account_verified', 'Publishing must require bank-account verification.');
requireText('or not v_organisation.child_safeguarding_verified', 'Publishing must require child-safeguarding verification.');
requireText("'jg-'", 'Public references must be Janani-generated rather than raw bank references.');

requireText('committed donations cannot exceed the giving period allocation', 'Database must enforce the approved period allocation cap.');
requireText('closed giving periods are immutable', 'Closed accounting periods must be immutable.');
requireText('new donations must start as draft', 'Donation lifecycle must start in draft state.');
requireText('draft donation must be approved before transfer', 'Donation lifecycle must enforce approval before transfer.');
requireText('transferred donation must be reconciled before publication', 'Donation lifecycle must enforce reconciliation before publication.');
requireText('reconciled donation requires reconciler and receipt evidence', 'Reconciliation must require receipt evidence.');

requireText('revoke all on function janani_giving.publish_donation(uuid) from public, anon, authenticated', 'Publish function must not be callable by public app roles.');
requireText('grant execute on function janani_giving.publish_donation(uuid) to service_role', 'Publish function must be server-only.');
requireText('revoke all on function janani_giving.unpublish_donation(uuid) from public, anon, authenticated', 'Unpublish function must not be callable by public app roles.');
requireText('grant execute on function janani_giving.unpublish_donation(uuid) to service_role', 'Unpublish function must be server-only.');

forbid(/grant\s+(insert|update|delete|all)[^;]*public_giving_ledger[^;]*\b(anon|authenticated)\b/i, 'Public website/app roles must never receive write access to public_giving_ledger.');
forbid(/grant\s+(select|insert|update|delete|all)[^;]*janani_giving\.[^;]*\b(anon|authenticated)\b/i, 'Private janani_giving relations must never be exposed to anon/authenticated roles.');
forbid(/create\s+(?:or\s+replace\s+)?view\s+public\.public_giving_ledger[\s\S]*?(internal_transfer_reference|receipt_storage_path|registration_number|tax_registration_number|private_notes|mother_id|pregnancy_id|user_id|email)[\s\S]*?from\s+janani_giving\.publications/i, 'Public ledger view must not include private financial, NGO, account, pregnancy, or health identifiers.');

console.log('Validated Janani Giving isolation, accounting controls, lifecycle gates, and six-field public view.');
