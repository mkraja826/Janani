const required = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_SUPPORT_EMAIL',
  'EXPO_PUBLIC_PRIVACY_URL',
  'EXPO_PUBLIC_ACCOUNT_DELETION_URL',
];

const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  console.error(`Missing required production configuration: ${missing.join(', ')}`);
  process.exit(1);
}

for (const name of ['EXPO_PUBLIC_PRIVACY_URL', 'EXPO_PUBLIC_ACCOUNT_DELETION_URL']) {
  try {
    const url = new URL(process.env[name]);
    if (url.protocol !== 'https:') throw new Error('HTTPS required');
  } catch {
    console.error(`${name} must be a valid HTTPS URL.`);
    process.exit(1);
  }
}

const email = process.env.EXPO_PUBLIC_SUPPORT_EMAIL;
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('EXPO_PUBLIC_SUPPORT_EMAIL must be a valid email address.');
  process.exit(1);
}

const booleanFlags = [
  'EXPO_PUBLIC_CARE_PLUS_VISIBLE',
  'EXPO_PUBLIC_CARE_PLUS_PURCHASES_ENABLED',
  'EXPO_PUBLIC_CARE_PLUS_AI_ENABLED',
];
for (const name of booleanFlags) {
  const value = (process.env[name] ?? 'false').trim().toLowerCase();
  if (!['true', 'false'].includes(value)) {
    console.error(`${name} must be true or false.`);
    process.exit(1);
  }
}

const visible = (process.env.EXPO_PUBLIC_CARE_PLUS_VISIBLE ?? 'false').toLowerCase() === 'true';
const purchases = (process.env.EXPO_PUBLIC_CARE_PLUS_PURCHASES_ENABLED ?? 'false').toLowerCase() === 'true';
const ai = (process.env.EXPO_PUBLIC_CARE_PLUS_AI_ENABLED ?? 'false').toLowerCase() === 'true';
if ((ai || purchases) && !visible) {
  console.error('Care+ AI/purchases cannot be enabled while Care+ is hidden.');
  process.exit(1);
}

// Billing is intentionally deferred. Prevent accidental production exposure
// until the verified Play Billing integration is completed.
if (purchases) {
  console.error('Care+ purchases must remain disabled until the final billing milestone is integrated.');
  process.exit(1);
}

console.log('Production public configuration is complete and internally consistent.');
