import { createClient } from '@supabase/supabase-js';
import { randomBytes, randomUUID } from 'node:crypto';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (process.env.JANANI_ALLOW_REMOTE_SMOKE !== '1') {
  throw new Error('Set JANANI_ALLOW_REMOTE_SMOKE=1 to create and clean up disposable test accounts.');
}
if (!url || !publishableKey || !serviceRoleKey) {
  throw new Error(
    'The Supabase URL, publishable key, and a server-only SUPABASE_SERVICE_ROLE_KEY are required.',
  );
}

const runId = `${Date.now()}-${randomBytes(4).toString('hex')}`;
const password = `Janani-Smoke!-${randomBytes(12).toString('base64url')}`;

function client() {
  return createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

const admin = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function row(value) {
  return Array.isArray(value) ? value[0] : value;
}

async function signUp(role) {
  const supabase = client();
  const email = `janani.smoke.${runId}.${role}@gmail.com`;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { intended_role: role },
  });
  if (created.error || !created.data.user) {
    throw created.error ?? new Error(`Disposable ${role} account was not created.`);
  }
  const signedIn = await supabase.auth.signInWithPassword({ email, password });
  if (signedIn.error || !signedIn.data.session) {
    await admin.auth.admin.deleteUser(created.data.user.id).catch(() => undefined);
    throw signedIn.error ?? new Error(`Disposable ${role} account did not receive a session.`);
  }
  return { client: supabase, userId: created.data.user.id };
}

async function deleteDisposableAccount(account, role) {
  const { data, error } = await account.client.functions.invoke('delete-account', {
    body: {
      confirmation: 'DELETE',
      current_password: password,
    },
  });
  if (error || data?.ok !== true) {
    throw error ?? new Error(`Could not delete disposable ${role} account.`);
  }
}

async function forceCleanup(account) {
  if (!account) return;
  const existing = await admin.auth.admin.getUserById(account.userId);
  if (!existing.data.user) return;
  const deleted = await admin.auth.admin.deleteUser(account.userId);
  if (deleted.error) throw deleted.error;
}

let mother;
let partner;
let primaryError;

try {
  console.log('1/8 Creating disposable mother and partner accounts');
  mother = await signUp('mother');
  partner = await signUp('partner');
  const motherClient = mother.client;
  const partnerClient = partner.client;

  console.log('2/8 Creating the family and consuming its one-time invite');
  const created = await motherClient.rpc('create_mother_family', {
    p_full_name: 'Smoke Mother',
    p_family_name: 'Janani smoke family',
    p_due_date: new Date(Date.now() + 120 * 86400000).toISOString().slice(0, 10),
    p_last_menstrual_period: null,
    p_height_cm: 165,
    p_pre_pregnancy_weight_kg: 60,
  });
  if (created.error) throw created.error;
  const family = row(created.data);
  assert(
    family?.family_id && family?.pregnancy_id && /^[A-F0-9]{20}$/.test(family?.invite_code),
    'Family creation returned an invalid result.',
  );
  const joined = await partnerClient.rpc('join_family_as_partner', {
    p_full_name: 'Smoke Partner',
    p_invite_code: family.invite_code,
  });
  if (joined.error) throw joined.error;
  assert(row(joined.data)?.family_id === family.family_id, 'Partner joined the wrong family.');

  console.log('3/8 Verifying private and shared journal RLS');
  for (const [title, shared] of [['Private smoke entry', false], ['Shared smoke entry', true]]) {
    const saved = await motherClient.rpc('save_journal_entry_idempotent', {
      p_client_mutation_id: randomUUID(),
      p_pregnancy_id: family.pregnancy_id,
      p_title: title,
      p_body: 'Disposable smoke-test content.',
      p_mood: 4,
      p_is_shared_with_partner: shared,
      p_entry_date: new Date().toISOString().slice(0, 10),
    });
    if (saved.error) throw saved.error;
  }
  const partnerJournal = await partnerClient
    .from('journal_entries')
    .select('title')
    .eq('pregnancy_id', family.pregnancy_id);
  if (partnerJournal.error) throw partnerJournal.error;
  assert(
    partnerJournal.data.length === 1 && partnerJournal.data[0].title === 'Shared smoke entry',
    'Journal privacy policy exposed the wrong entries.',
  );
  const impersonation = await partnerClient.from('journal_entries').insert({
    pregnancy_id: family.pregnancy_id,
    author_id: mother.userId,
    title: 'Forbidden',
    body: 'This insert must fail.',
    is_shared_with_partner: true,
  });
  assert(impersonation.error, 'Journal ownership impersonation was not rejected.');

  console.log('4/8 Verifying reminder creation and creator-only deletion');
  const reminder = await motherClient.rpc('create_reminder_idempotent', {
    p_client_mutation_id: randomUUID(),
    p_pregnancy_id: family.pregnancy_id,
    p_title: 'Smoke reminder',
    p_instructions: null,
    p_kind: 'custom',
    p_local_time: '09:30',
    p_start_date: new Date().toISOString().slice(0, 10),
    p_end_date: null,
    p_days_of_week: [0, 1, 2, 3, 4, 5, 6],
  });
  if (reminder.error) throw reminder.error;
  const deniedDelete = await partnerClient
    .from('reminders')
    .delete()
    .eq('id', reminder.data)
    .select('id');
  if (deniedDelete.error) throw deniedDelete.error;
  assert(deniedDelete.data.length === 0, 'A non-creator deleted a reminder.');
  const reminderStillExists = await motherClient
    .from('reminders')
    .select('id')
    .eq('id', reminder.data)
    .maybeSingle();
  if (reminderStillExists.error) throw reminderStillExists.error;
  assert(reminderStillExists.data?.id === reminder.data, 'Reminder disappeared after denied deletion.');

  console.log('5/8 Verifying idempotent partner messages');
  const mutationId = randomUUID();
  const firstNudge = await partnerClient.functions.invoke('send-partner-nudge', {
    body: { message: 'Thinking of you', client_mutation_id: mutationId },
  });
  if (firstNudge.error) throw firstNudge.error;
  const repeatedNudge = await partnerClient.functions.invoke('send-partner-nudge', {
    body: { message: 'Thinking of you', client_mutation_id: mutationId },
  });
  if (repeatedNudge.error) throw repeatedNudge.error;
  assert(
    firstNudge.data?.nudge_id && firstNudge.data.nudge_id === repeatedNudge.data?.nudge_id,
    'A repeated partner message created a duplicate.',
  );
  const acknowledged = await motherClient.rpc('acknowledge_partner_nudge', {
    p_nudge_id: firstNudge.data.nudge_id,
  });
  if (acknowledged.error) throw acknowledged.error;

  console.log('6/8 Verifying membership revocation');
  const left = await partnerClient.rpc('leave_family');
  if (left.error) throw left.error;
  const revokedJournal = await partnerClient.from('journal_entries').select('id');
  if (revokedJournal.error) throw revokedJournal.error;
  assert(revokedJournal.data.length === 0, 'A former partner retained journal access.');
  const revokedNudges = await partnerClient.from('partner_nudges').select('id');
  if (revokedNudges.error) throw revokedNudges.error;
  assert(revokedNudges.data.length === 0, 'A former partner retained message access.');

  console.log('7/8 Deleting disposable accounts through the production Edge Function');
  await deleteDisposableAccount(partner, 'partner');
  partner = undefined;
  await deleteDisposableAccount(mother, 'mother');
  mother = undefined;

  console.log('8/8 Supabase production smoke test passed');
} catch (error) {
  primaryError = error;
  console.error(`Smoke test failed: ${error instanceof Error ? error.message : String(error)}`);
} finally {
  const cleanupErrors = [];
  if (partner) {
    await forceCleanup(partner).catch((error) => cleanupErrors.push(error));
  }
  if (mother) {
    await forceCleanup(mother).catch((error) => cleanupErrors.push(error));
  }
  if (cleanupErrors.length) {
    throw new AggregateError(cleanupErrors, 'Disposable account cleanup failed.');
  }
  if (primaryError) throw primaryError;
}
