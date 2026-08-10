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
  const value = process.env[name];
  try {
    const url = new URL(value);
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

const productionOnlyOffByDefault = [
  'EXPO_PUBLIC_CARE_PLUS_VISIBLE',
  'EXPO_PUBLIC_CARE_PLUS_PURCHASES_ENABLED',
  'EXPO_PUBLIC_CARE_PLUS_AI_ENABLED',
];
for (const name of productionOnlyOffByDefault) {
  const value = (process.env[name] ?? 'false').toLowerCase();
  if (!['true', 'false'].includes(value)) {
    console.error(`${name} must be true or false.`);
    process.exit(1);
  }
}

if ((process.env.EXPO_PUBLIC_CARE_PLUS_AI_ENABLED ?? 'false') === 'true' &&
    (process.env.EXPO_PUBLIC_CARE_PLUS_VISIBLE ?? 'false') !== 'true') {
  console.error('Care+ AI cannot be enabled while Care+ is hidden.');
  process.exit(1);
}

console.log('Production public configuration is complete and internally consistent.');
