# Janani production release

Janani 1.0 production release must be built from the integrated production branch only. Do not release from the older stacked feature or release branches.

## Current production controls

- Care+ presentation is controlled by `EXPO_PUBLIC_CARE_PLUS_VISIBLE`.
- Care+ AI presentation is controlled by `EXPO_PUBLIC_CARE_PLUS_AI_ENABLED`, while the server-side `JANANI_AI_ENABLED`, entitlement checks, clinical rule approval and provider configuration remain authoritative.
- Care+ purchases are intentionally forced OFF until the final Google Play Billing milestone is integrated.
- Production builds require support, privacy and account-deletion endpoints.
- Android release tasks fail closed unless production signing credentials are supplied.
- Firebase Analytics, Crashlytics and Performance from current `main` are preserved in the integrated release configuration.
- Supabase Edge Function secrets, redacted logging rules, launch alert thresholds and backend deployment order are defined in `docs/PRODUCTION_BACKEND_OPERATIONS.md`.

## Required GitHub production environment values

Repository/environment variables:

- `EXPO_PUBLIC_SUPPORT_EMAIL`
- `EXPO_PUBLIC_PRIVACY_URL`
- `EXPO_PUBLIC_ACCOUNT_DELETION_URL`
- `EXPO_PUBLIC_CARE_PLUS_VISIBLE`
- `EXPO_PUBLIC_CARE_PLUS_AI_ENABLED`

Protected secrets:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `JANANI_ANDROID_KEYSTORE_BASE64`
- `JANANI_ANDROID_KEYSTORE_PASSWORD`
- `JANANI_ANDROID_KEY_ALIAS`
- `JANANI_ANDROID_KEY_PASSWORD`

Supabase Edge Function secrets are intentionally managed in Supabase rather than in the mobile build environment. See `docs/PRODUCTION_BACKEND_OPERATIONS.md` for the authoritative list. Never copy server-only secrets into `EXPO_PUBLIC_` variables.

Billing secrets/products are deliberately omitted until the final billing milestone.

## Release sequence

1. Run `npm ci`.
2. Run `npm run validate:production-config` with production public configuration.
3. Run TypeScript, lint and Expo Doctor.
4. Apply and verify the reviewed Supabase migration chain and Edge Function secret contract from `docs/PRODUCTION_BACKEND_OPERATIONS.md`.
5. Deploy backend functions with Care+ generation initially fail-closed, then complete authenticated backend smoke tests and log-redaction verification.
6. Perform a clean Android prebuild.
7. Build the signed release AAB through `.github/workflows/release-aab.yml`.
8. Verify the AAB artifact is non-empty and corresponds to the intended version/versionCode.
9. Complete final Google Play declarations and release metadata from the actual integrated artifact.
10. Add Google Play Billing only in its dedicated final milestone before paid Care+ is activated.

Billing is intentionally skipped in the current integration phase; the validator rejects `EXPO_PUBLIC_CARE_PLUS_PURCHASES_ENABLED=true` until that final milestone is complete.

Never commit keystores, signing passwords, provider secrets, service-account credentials or other production secrets to the repository.
