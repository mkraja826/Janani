import { createClient } from '@supabase/supabase-js';

const required = [
  'JANANI_STAGING_SUPABASE_URL',
  'JANANI_STAGING_SUPABASE_PUBLISHABLE_KEY',
  'JANANI_STAGING_TEST_EMAIL',
  'JANANI_STAGING_TEST_PASSWORD',
];

for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}
if (process.env.JANANI_STAGING_CONFIRM !== 'STAGING_ONLY') {
  throw new Error('Refusing to run without JANANI_STAGING_CONFIRM=STAGING_ONLY');
}

const url = process.env.JANANI_STAGING_SUPABASE_URL;
const key = process.env.JANANI_STAGING_SUPABASE_PUBLISHABLE_KEY;
const email = process.env.JANANI_STAGING_TEST_EMAIL;
const password = process.env.JANANI_STAGING_TEST_PASSWORD;
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const results = [];
function pass(name, detail = '') { results.push({ name, ok: true, detail }); console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`); }
function fail(name, error) { const message = error instanceof Error ? error.message : String(error); results.push({ name, ok: false, detail: message }); console.error(`✗ ${name} — ${message}`); }
async function rpc(name, args = undefined) {
  const result = await client.rpc(name, args);
  if (result.error) throw new Error(`${name}: ${result.error.message}`);
  return result.data;
}

let pregnancyId;
try {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user || !data.session) throw error ?? new Error('No authenticated session returned');
  pass('Authenticate staging test mother', data.user.id);

  const membership = await client.from('family_members').select('role,family_id').eq('user_id', data.user.id).maybeSingle();
  if (membership.error || !membership.data) throw membership.error ?? new Error('No family membership');
  if (membership.data.role !== 'mother') throw new Error('Staging smoke-test account must be a mother account');
  pass('Mother membership contract');

  const pregnancies = await client.from('pregnancies').select('id,status').eq('family_id', membership.data.family_id).order('created_at', { ascending: false });
  if (pregnancies.error) throw pregnancies.error;
  const pregnancy = (pregnancies.data ?? []).find((item) => item.status === 'active') ?? pregnancies.data?.[0];
  if (!pregnancy) throw new Error('Staging test mother has no pregnancy record');
  pregnancyId = pregnancy.id;
  pass('Resolve mother-owned pregnancy', pregnancyId);
} catch (error) {
  fail('Authentication / pregnancy setup', error);
}

if (pregnancyId) {
  for (const check of [
    ['Health profile RPC', 'get_own_health_profile', { p_pregnancy_id: pregnancyId }],
    ['Health tracker RPC', 'get_own_health_tracker', { p_pregnancy_id: pregnancyId }],
    ['Care timeline RPC', 'list_own_care_appointments', { p_pregnancy_id: pregnancyId }],
    ['Care+ entitlement RPC', 'get_own_care_plus_status', undefined],
  ]) {
    const [label, name, args] = check;
    try {
      const data = await rpc(name, args);
      pass(label, data == null ? 'null response accepted' : 'contract reachable');
    } catch (error) {
      fail(label, error);
    }
  }

  try {
    const { data: sessionData } = await client.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error('No access token available');
    const response = await fetch(`${url}/functions/v1/care-plus-ai`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', apikey: key },
      body: JSON.stringify({ pregnancyId, category: 'appointment_summary' }),
    });
    if (response.status === 404) throw new Error('care-plus-ai Edge Function is not deployed');
    if (![200, 402, 409, 501, 503].includes(response.status)) {
      const body = await response.text();
      throw new Error(`Unexpected status ${response.status}: ${body.slice(0, 300)}`);
    }
    pass('Care+ Edge Function route', `HTTP ${response.status} (policy/disabled response is acceptable in staging)`);
  } catch (error) {
    fail('Care+ Edge Function route', error);
  }
}

await client.auth.signOut().catch(() => undefined);

const failures = results.filter((item) => !item.ok);
console.log(`\nJanani staging smoke: ${results.length - failures.length}/${results.length} checks passed.`);
if (failures.length) process.exit(1);
