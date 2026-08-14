# Janani Production Candidate Layer Merge Log — 2026-08-15

Branch: `production/janani-main-candidate-20260815`
Base: clean `main`

## Non-negotiable rule

Do not merge `integration/merge-all-janani-20260814-235800` directly. Use it, the archive branch, and older release/feature branches only as references. Every layer must be copied intentionally, reviewed for Janani 1.0 scope, and validated before the branch can move toward `main`.

## Janani 1.0 scope

Included scope:

- Auth, signup, signin and email confirmation callback.
- Existing mother/partner onboarding and family linking from clean `main`.
- Existing pregnancy progress, reminders, journal, notifications and widget scope from clean `main`.
- Production public config, support/legal/account-deletion settings.
- Strict dependency audit, TypeScript, lint, Expo Doctor and public config gates.
- Signed Android AAB workflow guardrails.
- Play Console listing/checklist materials that match the released Janani 1.0 scope.

Excluded scope for this production candidate:

- Full Ask Janani AI rollout.
- Clinical rule engine production rollout.
- Report extraction/provider rollout.
- Billing/Care+ purchases.
- Full product redesign branches.
- Any diagnostic, prescriptive or emergency-triage claim.

## Completed layers

### Layer 0 — branch foundation

Source: clean `main`

Status: merged into candidate branch.

Result:

- Created `production/janani-main-candidate-20260815` from clean `main`.
- Kept the previous full integration work as reference only.

### Layer 1 — auth confirmation callback

Source inspected: `fix/email-confirmation-callback`

Status: merged selectively.

Files added/changed:

- `app/auth.tsx`
- `app/auth/callback.tsx`
- `src/providers/AuthGate.tsx`

Result:

- Supabase signup now sends confirmation links to `janani://auth/callback`.
- Callback route handles code/session token completion and role-aware routing.
- AuthGate allows `/auth/callback` as a public route.

### Layer 2 — Android config cleanup

Sources inspected:

- `fix/android-debug-warnings`
- `release/signed-aab-pipeline`

Status: merged selectively.

Files changed:

- `app.json`

Result:

- Removed `android.edgeToEdgeEnabled` from `app.json`.
- Did not merge old home-screen/progress-doc edits from `fix/android-debug-warnings`.
- Preserved existing Firebase, widget, signing and package configuration.

### Layer 3 — production config and audit gate

Sources inspected:

- current candidate scripts
- earlier release branches

Status: merged selectively.

Files changed:

- `.env.example`

Result:

- `.env.example` documents every public variable required by `scripts/validate-production-config.mjs`.
- Care+ flags remain documented and disabled by default.
- Production audit and validator remain strict.

### Layer 4 — signed AAB workflow gate

Sources inspected:

- `.github/workflows/release-aab.yml`
- `plugins/withJananiReleaseSigning.js`

Status: strengthened.

Files changed:

- `.github/workflows/release-aab.yml`

Result:

- Signed-AAB workflow now runs `npm run audit:production` before release build steps.
- The release workflow still requires production secrets and manual version input.

### Layer 5 — production readiness checklist

Source: candidate documentation.

Status: documented.

Files changed:

- `docs/release/PRODUCTION_CANDIDATE_20260815.md`

Result:

- Candidate branch records release scope, exclusions, checklist, merge rule and post-merge rule.

### Layer 6 — production support contact helper

Source inspected: `release/auth-support-readiness`

Status: merged selectively.

Files added:

- `src/config/support.ts`

Result:

- Added a small helper for production support email handling using `EXPO_PUBLIC_SUPPORT_EMAIL` through `productionConfig`.
- Did not merge broad app config, asset, site, Cloudflare, docs or Supabase changes from the old branch.

### Layer 7 — deploy controls for account deletion and legal-site safety

Source inspected: `release/production-deploy-controls`

Status: merged selectively, validation deferred to batch-end.

Files added/changed:

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

- The shared GitHub Pages account-deletion page is now information-only and links to the dedicated Cloudflare Pages deletion origin.
- The dedicated Cloudflare static deletion page was added with strict security headers, no storage usage, direct Supabase Auth verification, `DELETE` confirmation and timeout-uncertainty copy.
- The legal-site validator blocks credential-handling scripts/forms on the shared GitHub Pages origin and requires the dedicated Cloudflare deletion link.
- A compact local validator was added for the Cloudflare static deletion bundle.
- Did not merge app-config, launcher asset, package, Supabase, broad docs or other branch churn from `release/production-deploy-controls`.

### Layer 8 — production feature-gate review

Source inspected: `release/production-feature-gates`

Status: reviewed and skipped; no code copied.

Result:

- The candidate already has the safer `src/config/production.ts` feature-gate shape.
- The candidate keeps `aiUiEnabled` as a UI-only public flag rather than treating a public environment variable as authoritative backend AI enablement.
- The candidate documents that server-side Care+ entitlement, `JANANI_AI_ENABLED`, provider configuration, clinical rule approval and usage enforcement remain authoritative safety/security boundaries.
- The older branch version used a broader `aiEnabled` client flag and did not include the same explicit server-side boundary note, so copying it would be a downgrade.

### Layer 9 — release-readiness validation review

Source inspected: `feature/release-readiness-validation`

Status: reviewed selectively; future-stack readiness order preserved, future product code not merged.

Files added/changed:

- `docs/release/FUTURE_FEATURE_STACK_READINESS_20260815.md`
- `docs/release/LAYER_MERGE_LOG_20260815.md`

Result:

- The source branch contains useful future merge order/internal-testing content, but also broad future code for Care+, billing, AI, health tracker, care timeline, nutrition personalization, condition rule packs, billing Edge Functions and Supabase migrations.
- The candidate's existing `Janani Quality` workflow is already stronger than the old `Janani Build Validation` workflow because it includes production audit, legal-site validation, public config validation, widget generation checks and Android debug compile.
- No app screens, billing modules, AI functions, clinical documents, health migrations or Supabase future schemas were copied from this branch.
- The future sequence was preserved in `FUTURE_FEATURE_STACK_READINESS_20260815.md` so those updates can be merged later in the correct bottom-up order after staging/backend/clinical/billing validation.

### Layer 10 — Play production package materials

Source inspected: `release/play-production-package`

Status: merged selectively; app/config/assets/workflow churn not merged.

Files added:

- `docs/release/PLAY_PRODUCTION_PACKAGE.md`
- `docs/release/AUTH_SUPPORT_PRODUCTION.md`
- `play/listings/en-US/title.txt`
- `play/listings/en-US/short-description.txt`
- `play/listings/en-US/full-description.txt`

Result:

- Added a Play Console submission checklist that keeps declarations tied to the final signed AAB, not future planned features.
- Added auth/support owner gates for SMTP, password recovery, leaked-password protection and monitored support mailbox evidence.
- Added English Play listing text for the current Janani 1.0 scope: pregnancy progress, reminders, journal, partner support, widget, safety/privacy, export and deletion controls.
- Listing text includes a medical safety boundary: Janani provides supportive reminders/education and does not diagnose, prescribe or replace professional care.
- Did not merge the old branch's app config, release workflow, launcher icon parts, package files, plugin churn or broad docs because the candidate already has safer release workflow/config work.

Validation required after this batch:

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

## Next branch inspection order

1. Stable backend/privacy branches only if their changes are still missing from this candidate.
2. Product-redesign, AI, reports, billing and clinical branches must remain future-scope unless a production blocker specifically requires a small isolated change from them.
