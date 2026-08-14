# Janani Production Candidate — 2026-08-15

Branch: `production/janani-main-candidate-20260815`
Base: clean `main`

This branch is the controlled production path. It must not merge the full `integration/merge-all-janani-20260814-235800` branch directly.

## Rule

Bring production-safe changes into this branch in small groups. After every group, run:

```bash
npm ci
npm run validate:production-config
npm run audit:production
npm run typecheck
npm run lint
npx expo-doctor
npx expo config --type public
```

Only merge this branch to `main` after the checks pass and physical-device release validation is recorded.

## Milestone 1 — Auth confirmation callback

Status: code added, local/CI validation pending.

Included changes:

- `app/auth.tsx` now sends Supabase email confirmation links to `janani://auth/callback`.
- Auth requests use a timeout so the app does not hang indefinitely on weak networks.
- `app/auth/callback.tsx` handles Supabase confirmation links, code exchange, session setup, and role-aware routing.
- `src/providers/AuthGate.tsx` treats `/auth/callback` as a public route so confirmation links are not blocked before a session exists.

Validation still required:

- Fresh sign-up with email confirmation on release/debug build.
- Expired/invalid confirmation link handling.
- Confirmed user with no family routes to onboarding.
- Confirmed existing family member routes to home.

## Milestone 2 — Android config cleanup

Status: config cleanup added, local/CI validation pending.

Included changes:

- Removed `android.edgeToEdgeEnabled` from `app.json` to eliminate the Expo-manifest warning while keeping the existing Android package, permissions, adaptive icon, Firebase configuration, widget plugin and release-signing plugin unchanged.
- Reviewed old `fix/android-debug-warnings`; it is intentionally not merged because it is far behind current `main` and only contains an old `app/home.tsx` change plus progress-doc edits.
- Reviewed the signed-AAB workflow and release-signing plugin already present on this candidate branch; no replacement was made because the candidate plugin already includes the safer EAS Build guard.

Validation still required:

- `npx expo config --type public` must resolve without the `edgeToEdgeEnabled` warning.
- `npm run typecheck`, `npm run lint`, and `npx expo-doctor` must pass after pulling this branch locally.
- Signed AAB workflow still requires GitHub production environment secrets/vars before it can be used for a real release build.

## Milestone 3 — Production config and audit gate cleanup

Status: documentation/config alignment added, local/CI validation pending.

Included changes:

- `.env.example` now lists every public variable required by `scripts/validate-production-config.mjs`: Supabase URL, Supabase publishable key, support email, privacy URL and account-deletion URL.
- `.env.example` explicitly keeps future Care+ flags disabled by default: `EXPO_PUBLIC_CARE_PLUS_VISIBLE=false`, `EXPO_PUBLIC_CARE_PLUS_PURCHASES_ENABLED=false`, and `EXPO_PUBLIC_CARE_PLUS_AI_ENABLED=false`.
- Existing production validator was reviewed and kept strict: support email must be valid, legal/account URLs must be HTTPS, Care+ AI/purchases cannot be enabled while hidden, and purchases remain blocked until the billing milestone is intentionally integrated.
- Existing production audit script was reviewed and kept strict: it still blocks unmitigated high/critical dependency findings and keeps the image-size Metro adapter guard.

Validation still required:

- Copy `.env.example` to `.env` locally and replace placeholder values with real production-safe values.
- Run `npm run validate:production-config` with real values loaded.
- Run `npm run audit:production` after `npm ci` from a clean checkout.
- Do not weaken the audit gate just to make the branch merge faster.

## Milestone 4 — Signed AAB release workflow gate

Status: release workflow strengthened, GitHub production-environment validation pending.

Included changes:

- `.github/workflows/release-aab.yml` now runs `npm run audit:production` after deterministic install and before production config validation, version mutation, prebuild and Gradle bundling.
- The workflow still requires manual `workflow_dispatch` inputs for `version_name` and `version_code` and validates them before mutating `app.json` for the release artifact.
- The workflow still materializes the Android keystore from GitHub production secrets and uploads only the generated signed AAB artifact.
- Care+ purchases remain forced off in the signed-AAB workflow until billing is intentionally integrated.

GitHub production environment requirements before running the workflow:

Secrets:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `JANANI_ANDROID_KEYSTORE_BASE64`
- `JANANI_ANDROID_KEYSTORE_PASSWORD`
- `JANANI_ANDROID_KEY_ALIAS`
- `JANANI_ANDROID_KEY_PASSWORD`

Variables:

- `EXPO_PUBLIC_SUPPORT_EMAIL`
- `EXPO_PUBLIC_PRIVACY_URL`
- `EXPO_PUBLIC_ACCOUNT_DELETION_URL`
- `EXPO_PUBLIC_CARE_PLUS_VISIBLE=false`
- `EXPO_PUBLIC_CARE_PLUS_AI_ENABLED=false`

Validation still required:

- Pull this branch locally and run the full local gate set before starting a signed build.
- Configure the GitHub production environment secrets/vars above.
- Run `Janani Signed AAB` manually with an intended version name/code.
- Record the workflow run, artifact name, release version and SHA before any merge to `main`.
