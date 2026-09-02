# Janani Main Merge Checklist — 2026-08-15

Branch under review: `production/janani-main-candidate-20260815`
Target branch: `main`

This checklist is the final local/CI/device gate before this candidate branch can be merged to `main`.

## Non-negotiable merge rule

Do not merge this branch to `main` until every mandatory software gate passes on a clean checkout and the minimum physical-device smoke test is recorded.

The full `integration/merge-all-janani-20260814-235800` branch must not be merged directly into `main`. Use it only as a reference for future feature extraction.

## What this candidate includes

- Production-safe email confirmation redirect support.
- `/auth/callback` route for Supabase confirmation links.
- Auth request timeout handling so weak network calls do not hang indefinitely.
- AuthGate public-route allowance for `/auth/callback`.
- Android config cleanup by removing deprecated/invalid `edgeToEdgeEnabled` from `app.json`.
- `.env.example` aligned with production config validation.
- Signed-AAB GitHub workflow strengthened with production dependency audit before release build.
- Production candidate documentation and merge checklist.

## What this candidate intentionally excludes

These are not part of this production candidate and must stay out of `main` until separately tested:

- Full product redesign shell and new navigation.
- Reports upload/extraction and document-provider flow.
- Ask Janani AI backend/product behavior.
- Clinical rules engine and condition-specific production guidance.
- Billing/Care+ purchases.
- Multilingual critical clinical-safety wording claims.
- Any direct merge from the old all-branches integration branch.

## Clean local checkout gate

Run from a clean local checkout:

```powershell
cd C:\janani

git fetch origin --prune
git switch production/janani-main-candidate-20260815
git reset --hard origin/production/janani-main-candidate-20260815

Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue

npm ci
```

Expected result: deterministic install completes without modifying `package-lock.json`.

## Environment gate

Create `.env` from `.env.example` and replace placeholders with real values:

```powershell
copy .env.example .env
```

Required public values:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_SUPPORT_EMAIL`
- `EXPO_PUBLIC_PRIVACY_URL`
- `EXPO_PUBLIC_ACCOUNT_DELETION_URL`

Future flags must remain disabled unless a later milestone explicitly enables them:

- `EXPO_PUBLIC_CARE_PLUS_VISIBLE=false`
- `EXPO_PUBLIC_CARE_PLUS_PURCHASES_ENABLED=false`
- `EXPO_PUBLIC_CARE_PLUS_AI_ENABLED=false`

Run:

```powershell
npm run validate:production-config
```

Expected result: production public configuration is complete and internally consistent.

## Static quality gate

Run:

```powershell
npm run audit:production
npm run typecheck
npm run lint
npx expo-doctor
npx expo config --type public
```

Expected result:

- Dependency audit passes or any failure is fixed, not bypassed.
- TypeScript exits successfully.
- Lint has no errors.
- Expo Doctor passes.
- Expo public config resolves and shows no invalid `edgeToEdgeEnabled` warning.

## Auth callback smoke test

Minimum device/debug-build test before merge:

- Fresh sign-up sends confirmation email.
- Confirmation link opens `janani://auth/callback`.
- New confirmed user without family routes to onboarding.
- Existing confirmed family member routes to Home.
- Invalid/expired confirmation link shows safe failure copy and allows return to sign-in.
- Weak/no network during auth request shows timeout copy instead of hanging forever.

## Android release workflow gate

Before a real signed AAB workflow run, configure GitHub production environment secrets:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `JANANI_ANDROID_KEYSTORE_BASE64`
- `JANANI_ANDROID_KEYSTORE_PASSWORD`
- `JANANI_ANDROID_KEY_ALIAS`
- `JANANI_ANDROID_KEY_PASSWORD`

Configure GitHub production environment variables:

- `EXPO_PUBLIC_SUPPORT_EMAIL`
- `EXPO_PUBLIC_PRIVACY_URL`
- `EXPO_PUBLIC_ACCOUNT_DELETION_URL`
- `EXPO_PUBLIC_CARE_PLUS_VISIBLE=false`
- `EXPO_PUBLIC_CARE_PLUS_AI_ENABLED=false`

Then manually run `Janani Signed AAB` with the intended `version_name` and `version_code`.

Record before merge:

- Workflow run URL:
- Artifact name:
- Version name/code:
- Candidate commit SHA:
- AAB SHA/checksum if available:

## Merge to main only after PASS

Only after all gates above pass:

```powershell
git switch main
git pull --ff-only origin main
git merge --no-ff production/janani-main-candidate-20260815

npm ci
npm run validate:production-config
npm run audit:production
npm run typecheck
npm run lint
npx expo-doctor
npx expo config --type public

git push origin main
```

## Rollback plan

Before pushing merged `main`, record current main:

```powershell
git rev-parse origin/main
```

If the pushed `main` is bad, create an emergency rollback branch from the previous main SHA and revert the merge commit instead of force-pushing `main`.

Rollback record:

- Previous main SHA:
- Candidate merge commit SHA:
- Rollback branch/PR:

## Final disposition

- Local gates: PASS / BLOCKED
- Device smoke test: PASS / BLOCKED
- Signed AAB workflow: PASS / BLOCKED
- Open P0 defects: must be 0
- Open P1 defects: must be 0
- Final decision: MERGE / DO NOT MERGE
