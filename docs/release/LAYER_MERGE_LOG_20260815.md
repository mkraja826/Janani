# Janani Production Candidate Layer Merge Log — 2026-08-15

Branch: `production/janani-main-candidate-20260815`  
Base: clean `main`

## Release rule

Do not merge the archived all-integration branch directly. Old release/feature/codex branches are references only. Each layer must be inspected, copied intentionally, and kept within Janani 1.0 production scope unless documented as future-stack-only tooling.

## Janani 1.0 production scope

Included:

- Auth, signup, signin and email confirmation callback.
- Existing mother/partner onboarding and family linking from clean `main`.
- Existing pregnancy progress, reminders, journal, notifications and widget scope from clean `main`.
- Production public config, support/legal/account-deletion settings.
- Strict dependency audit, TypeScript, lint, Expo Doctor and public config gates.
- Signed Android AAB workflow guardrails.
- Play listing/package readiness documents.

Excluded from Janani 1.0 runtime:

- Full Ask Janani AI rollout.
- Clinical rule engine production rollout.
- Report extraction/provider rollout.
- Billing/Care+ purchases.
- Full product redesign branches.
- Any diagnostic, prescriptive or emergency-triage claim.

## Completed layers

### Layer 0 — branch foundation

Source: clean `main`

Status: created candidate from clean main.

Result:

- Created `production/janani-main-candidate-20260815` from clean `main`.
- Archived the old all-integration branch separately.

### Layer 1 — auth confirmation callback

Source inspected: `fix/email-confirmation-callback`

Status: merged selectively.

Files:

- `app/auth.tsx`
- `app/auth/callback.tsx`
- `src/providers/AuthGate.tsx`

Result:

- Supabase signup uses `janani://auth/callback`.
- Callback handles auth code/session token completion.
- AuthGate allows `/auth/callback` as a public route.
- Current multilingual auth UI was preserved.

### Layer 2 — Android config cleanup

Sources inspected:

- `fix/android-debug-warnings`
- `release/signed-aab-pipeline`

Status: merged selectively.

Files:

- `app.json`

Result:

- Removed only `android.edgeToEdgeEnabled`.
- Preserved Firebase, widget, package and signing configuration.
- Did not merge stale home-screen/progress-doc edits.

### Layer 3 — production config and audit gate

Sources inspected: current candidate scripts and older release branches.

Status: merged selectively.

Files:

- `.env.example`

Result:

- `.env.example` documents required public production variables.
- Care+ public flags remain documented and disabled by default.
- Existing production validator/audit scripts remain strict.

### Layer 4 — signed AAB workflow gate

Sources inspected:

- `.github/workflows/release-aab.yml`
- `plugins/withJananiReleaseSigning.js`

Status: strengthened.

Files:

- `.github/workflows/release-aab.yml`

Result:

- Signed-AAB workflow now runs `npm run audit:production` before release build steps.
- Workflow still requires protected production secrets and manual version input.

### Layer 5 — production readiness checklist

Source: candidate documentation.

Status: documented.

Files:

- `docs/release/PRODUCTION_CANDIDATE_20260815.md`
- `docs/release/MAIN_MERGE_CHECKLIST_20260815.md`

Result:

- Candidate branch records release scope, exclusions, checklist, merge rule and post-merge rule.

### Layer 6 — production support contact helper

Source inspected: `release/auth-support-readiness`

Status: merged selectively.

Files:

- `src/config/support.ts`

Result:

- Added support-mail helper using `EXPO_PUBLIC_SUPPORT_EMAIL` through `productionConfig`.
- Did not merge broad app config, asset, site, Cloudflare, docs or Supabase changes from the old branch.

### Layer 7 — deploy controls for account deletion and legal-site safety

Source inspected: `release/production-deploy-controls`

Status: merged selectively; validation deferred to batch-end.

Files:

- `.github/scripts/validate-legal-site.mjs`
- `site/account-deletion/index.html`
- `cloudflare/account-deletion/README.md`
- `cloudflare/account-deletion/public/_headers`
- `cloudflare/account-deletion/public/config.js`
- `cloudflare/account-deletion/public/app.js`
- `cloudflare/account-deletion/public/index.html`
- `cloudflare/account-deletion/public/styles.css`
- `cloudflare/account-deletion/validate.mjs`

Result:

- GitHub Pages account-deletion page is information-only.
- Dedicated Cloudflare static deletion page added with strict headers and direct Supabase Auth verification.
- Legal-site validator blocks credential-handling scripts/forms on shared GitHub Pages origin.
- Did not merge app-config, launcher asset, package, Supabase or broad doc churn.

### Layer 8 — production feature-gate review

Source inspected: `release/production-feature-gates`

Status: reviewed and skipped; no code copied.

Result:

- Candidate already has safer `src/config/production.ts` feature-gate shape.
- Candidate keeps `aiUiEnabled` as UI-only public flag.
- Server-side Care+ entitlement, `JANANI_AI_ENABLED`, provider configuration, clinical rule approval and usage enforcement remain authoritative.
- Copying older broader `aiEnabled` client flag would have been a downgrade.

### Layer 9 — release-readiness validation review

Source inspected: `feature/release-readiness-validation`

Status: reviewed selectively; future product code not merged.

Files:

- `docs/release/FUTURE_FEATURE_STACK_READINESS_20260815.md`

Result:

- Preserved future merge order and readiness checklist.
- Did not merge Care+, billing, AI, health tracker, care timeline, nutrition personalization, condition rule packs, billing Edge Functions or future Supabase schemas.
- Candidate's existing `Janani Quality` workflow was already stronger than the old `Janani Build Validation` workflow.

### Layer 10 — Play production package

Source inspected: `release/play-production-package`

Status: merged selectively.

Files:

- `docs/release/PLAY_PRODUCTION_PACKAGE.md`
- `docs/release/AUTH_SUPPORT_PRODUCTION.md`
- `play/listings/en-US/title.txt`
- `play/listings/en-US/short-description.txt`
- `play/listings/en-US/full-description.txt`

Result:

- Added Play Console production package checklist.
- Added auth/support owner gates.
- Added English Play listing text matching the Janani 1.0 released feature set.
- Did not merge old release workflow, launcher assets, package/plugin changes or app config churn.

### Layer 11 — staging backend smoke gate

Source inspected: `feature/staging-backend-smoke-tests`

Status: merged selectively as future-stack-only staging tooling; not Janani 1.0 runtime.

Files:

- `.github/workflows/staging-backend-smoke.yml`
- `scripts/staging-backend-smoke.mjs`
- `docs/release/STAGING_BACKEND_SMOKE.md`

Result:

- Added manual-only GitHub Actions workflow for read-only staging backend contract checks.
- Script refuses to run unless `JANANI_STAGING_CONFIRM=STAGING_ONLY` and staging secrets are present.
- It does not create/edit/delete records, purchases, subscriptions or AI generations.
- It is intended for the future health/Care+/AI stack after staging migrations/functions exist.
- Did not merge the branch's app screens, billing module, AI functions, clinical docs, future migrations or feature UI.

### Layer 12 — final missing-files review

Sources searched/inspected:

- branch search: `privacy`
- branch search: `legal`
- branch search: `support`
- branch search: `backend`
- branch search: `release`
- `release/auth-support-readiness`

Status: reviewed; no code copied.

Result:

- No separate privacy/legal branch remains.
- Remaining support/backend branches had already been inspected through Layers 6, 10 and 11.
- `release/auth-support-readiness` still contains broad old asset/config/Supabase churn, but the candidate already has the safe support helper, auth/support gates, legal-site validation and Cloudflare account-deletion flow.
- No additional Janani 1.0-safe files were identified.

## Batch validation required before merge to main

```bash
npm ci
npm run validate:production-config
npm run audit:production
npm run typecheck
npm run lint
npx expo-doctor
npx expo config --type public
node cloudflare/account-deletion/validate.mjs
node .github/scripts/validate-legal-site.mjs
```

Optional/manual future-stack validation only after staging secrets and future migrations/functions exist:

```bash
node scripts/staging-backend-smoke.mjs
```

## Remaining inspection order

1. Run batch validation locally or in GitHub Actions.
2. Fix only validation failures, if any.
3. Open/merge candidate to `main` only after validation and owner release checklist are accepted.

Do not inspect product-redesign, AI, reports, billing or clinical branches for Janani 1.0 unless a production blocker specifically requires a small isolated change from them.
