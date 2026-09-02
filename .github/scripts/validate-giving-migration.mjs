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
requireText('alter table janani_giving.organisations enable row level security', 'Organisation table must have RLS enabled.');
requireText('alter table janani_giving.periods enable row level security', 'Giving accounting periods must have RLS enabled.');
requireText('alter table janani_giving.donations enable row level security', 'Donation table must have RLS enabled.');
requireText('alter table janani_giving.audit_events enable row level security', 'Giving audit table must have RLS enabled.');
requireText('revoke all on all tables in schema janani_giving from public, anon, authenticated', 'Private Giving tables must be denied to public app roles.');

requireText('create table if not exists public.public_giving_ledger', 'A dedicated sanitized public ledger is required.');
requireText('grant select on public.public_giving_ledger to anon, authenticated', 'Website access must remain SELECT-only on the sanitized public ledger.');
requireText("check (verification_status = 'verified')", 'Public ledger must accept only verified records.');
requireText("if v_donation.status <> 'reconciled'", 'Publishing must require a reconciled donation.');
requireText("if v_organisation.due_diligence_status <> 'verified'", 'Publishing must require a verified organisation.');
requireText('or not v_organisation.bank_account_verified', 'Publishing must require bank-account verification.');
requireText('or not v_organisation.child_safeguarding_verified', 'Publishing must require child-safeguarding verification.');
requireText("'jg-'", 'Public references must be Janani-generated rather than raw bank references.');

requireText('revoke all on function janani_giving.publish_donation(uuid) from public, anon, authenticated', 'Publish function must not be callable by public app roles.');
requireText('grant execute on function janani_giving.publish_donation(uuid) to service_role', 'Publish function must be server-only.');
requireText('revoke all on function janani_giving.unpublish_donation(uuid) from public, anon, authenticated', 'Unpublish function must not be callable by public app roles.');
requireText('grant execute on function janani_giving.unpublish_donation(uuid) to service_role', 'Unpublish function must be server-only.');

forbid(/grant\s+(insert|update|delete|all)[^;]*public_giving_ledger[^;]*\b(anon|authenticated)\b/i, 'Public website/app roles must never receive write access to public_giving_ledger.');
forbid(/grant\s+(select|insert|update|delete|all)[^;]*janani_giving\.[^;]*\b(anon|authenticated)\b/i, 'Private janani_giving relations must never be exposed to anon/authenticated roles.');
forbid(/public_giving_ledger[\s\S]{0,600}(internal_transfer_reference|receipt_storage_path|registration_number|tax_registration_number|private_notes|mother_id|pregnancy_id|user_id|email)/i, 'Public ledger definition must not include private financial, NGO, account, pregnancy, or health identifiers.');

console.log('Validated Janani Giving migration isolation, publication gates, and public read-only contract.');
