# Janani release readiness evidence — 2026-08-22

This record captures verified release evidence after restoring the Expo/React Native production baseline on 2026-08-22. It contains no credentials or private user data.

## Source and Android validation

- Production source was restored after an accidental Vite-only migration on `main`; the Vite redesign is preserved separately and was not merged into the release baseline.
- Recovered source was verified file-for-file against the previous reviewed Expo/React Native production tree before stabilization.
- Clean dependency install passed.
- Production dependency audit passed under the repository's reviewed mitigation policy.
- TypeScript and lint passed.
- Expo Doctor passed with the intentionally audited SDK 54 patch baseline excluded only from patch-drift checks; all other Expo Doctor checks remain active.
- Legal-site validation and public Expo configuration resolution passed.
- Clean Android Expo prebuild passed.
- Janani native widget generation checks passed.
- x86_64 Android debug APK compilation passed.

## Live Supabase evidence

- Production project was active and healthy when checked.
- Production Edge Functions used by the current application were active.
- Recent Auth and Edge Function log checks returned no current errors during this audit window.
- Sensitive RPC-only tables flagged as `RLS enabled no policy` were verified to deny authenticated users direct SELECT, INSERT, UPDATE, and DELETE privileges. Their no-direct-table-access design must not be weakened merely to silence advisor INFO notices.
- Supabase leaked-password protection remains disabled and is an external Auth configuration gate before public release.

## Migration-history drift

The live database contains deployed migration versions that are not represented one-for-one by filenames on the recovered `main` branch. The production database must not be reset or replayed to resolve this. A separate reconciliation branch exists to reconstruct the exact deployed history from `supabase_migrations.schema_migrations` before future database deployment automation is treated as reproducible.

The current Android release path was checked and does not directly call the live-only report/context migration stack; therefore this drift is tracked as an operations/reproducibility blocker for future database changes and for a final 100% readiness claim, not as evidence that the currently validated Android client cannot run against the existing live schema.

## Signed AAB gate

The signed AAB workflow correctly failed closed during release-candidate preflight because the GitHub `production` environment currently lacks:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_SUPPORT_EMAIL`
- `EXPO_PUBLIC_PRIVACY_URL`
- `EXPO_PUBLIC_ACCOUNT_DELETION_URL`
- `JANANI_ANDROID_KEYSTORE_BASE64`
- `JANANI_ANDROID_KEYSTORE_PASSWORD`
- `JANANI_ANDROID_KEY_ALIAS`
- `JANANI_ANDROID_KEY_PASSWORD`

The Supabase URL and publishable key are recoverable from the connected production project, and the legal URLs have canonical published sources. A monitored Janani support mailbox must not be invented or replaced by a personal mailbox. Android signing credentials must reuse the existing Janani/EAS signing identity if one already exists; do not generate a replacement key blindly.

## Remaining release gates

1. Recover/reuse the authoritative Android signing identity and configure the GitHub production signing secrets, or use the existing EAS signing path.
2. Configure the monitored Janani support mailbox and production public environment values.
3. Enable Supabase leaked-password protection when available for the project.
4. Produce and cryptographically verify the signed release AAB.
5. Complete physical two-device mother/partner acceptance, real push/reminder/widget tests, offline replay, partner revocation, and disposable-account deletion acceptance.
6. Reconcile exact live migration history into source control before future database deployments and before claiming complete operational reproducibility.
7. Complete final Play Console Data Safety/health declarations, listing assets, testing requirements, and rollout.

Care+ purchases remain intentionally disabled until Google Play Billing and server-side lifecycle reconciliation are implemented.
