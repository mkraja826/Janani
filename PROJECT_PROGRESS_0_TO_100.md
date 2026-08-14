# Janani Project Progress — Production 1.0

**Overall production readiness: ~88%**

**Status:** Unified production integration; not publicly launched

**Last verified:** 2026-08-11

This percentage describes complete-product production readiness, not just feature implementation. Janani must not be represented as 100% complete until every remaining launch gate below has evidence.

## Production source of truth

- Active integration branch: `production/janani-1.0-integration`.
- The branch contains the consolidated Janani 1.0 application and supersedes the older stacked health/Care+/release branches as the production integration line.
- At the latest audited head before this document update (`89ec037`), the branch was 175 commits ahead of `main` and GitHub Actions **Janani Quality run #333 passed successfully**.
- `main` has two later bookkeeping commits that add and then remove an accidental empty `docs/PRODUCTION_BACKEND_OPERATIONS.md`; they do not contain product functionality that must be ported into production.
- The preserved `codex/milestones-1-5` branch has two unique commits that must be selectively reviewed before final merge, especially pregnancy week content, pregnancy validation, offline/reliability changes, legal-site validation, and icon configuration. Do not merge that branch wholesale.

## Integrated application domains

### Core pregnancy and family experience

- Mother and partner onboarding and family linking.
- Private mother/partner membership boundaries.
- Pregnancy progress and trimester guidance.
- Medication/care reminders with notification channels and alarm-style medicine behavior.
- Journal with explicit partner sharing.
- Thinking of You partner connection.
- Android home-screen widget suite with user-scoped privacy reset.
- Offline cache and queued mutation architecture.

### Maternal health platform

- Private Health Profile.
- Health Tracker for weight, blood pressure, glucose, labs and symptoms.
- Correct latest-entry ordering and current-weight reconciliation after deletion.
- Mother-only RPC access to sensitive health data.
- Care Timeline for appointments, scans, tests and follow-up context.
- Private Care Context for medications, supplements, medical history, previous pregnancy history, clinician instructions, language/region and sharing preferences.

### Janani Profile Engine v2

The normalized profile/context layer now combines relevant pregnancy, health, care and preference data and exposes task-specific contexts:

- Nutrition Context
- Health Trend Context
- Appointment Context
- Daily Care Context
- Education Context
- Partner Support Context

AI should receive only the minimum task-relevant context rather than the user's entire raw database record.

### Nutrition

- Deterministic pregnancy nutrition foundation.
- Diet, allergy, food-avoidance, region/cuisine and clinician-instruction personalization.
- Condition-specific personalization fails closed unless the corresponding clinical rule pack is formally approved.

### Janani Care+

- Old generic `janani-ai` backend removed from the production path.
- Single `care-plus-ai` gateway with authenticated mother context.
- Care+ entitlement check.
- Relevant-context selection.
- Clinical-rule approval gate.
- Provider abstraction for an OpenAI-compatible endpoint.
- Urgent-input interception.
- Output safety validation.
- Server-only quota reservation/finalization.
- Provider failure accounting that does not silently burn successful-usage allowance.
- Structured metadata-only observability.
- AI provider keys and Supabase service-role credentials remain server-only.

### Clinical rule lifecycle

- Database-backed rule-pack lifecycle replaces hard-coded approvals.
- States support draft, pending review, approved, suspended and retired behavior.
- Approval requires version, reviewer identity/credentials, source manifest and review/effective metadata.
- Active rule resolution occurs server-side and fails closed.
- GDM, diabetes, hypertension, anemia and thyroid packs remain pending review and must not be represented as clinically approved.

### Localization

- Persistent locale architecture is integrated.
- High-traffic non-clinical UI has English, Telugu and Hindi coverage across Home, auth/onboarding, Health Profile/Tracker, Care Context/Timeline, Food Guide shell, Pregnancy Guide shell, reminders, journal, Thinking of You, Care+ shell and Settings/form surfaces.
- Additional global locale/RTL infrastructure exists for future international expansion.
- Medical, urgent-care, legal, destructive-action and other safety-critical wording must remain source-approved until reviewed translations are available.

### Production hardening and release infrastructure

- Production feature gates and config validation.
- Billing forced off until the final billing milestone.
- Firebase Analytics, Crashlytics and Performance configuration preserved.
- Fail-closed Android release-signing plugin.
- Signed-AAB GitHub workflow.
- Production audit scripts and dependency mitigations.
- Production backend operations and database/RPC audit documentation.
- Widget/icon/native CI diagnostics hardened.
- Latest audited Janani Quality workflow: **success** on production head `89ec037` (run #333).

## Backend/security audit state

Verified in source/audit:

- Health, Care Timeline, Private Care Context, Care+ usage/entitlement and clinical-rule tables use RLS and revoked direct client table access where appropriate.
- Mother-facing access is through ownership-checking RPCs.
- Care+ reservation/finalization RPCs are service-role only.
- Clinical-rule approval/state mutation is service-role only.
- Push registration derives the authenticated user rather than trusting client ownership input.
- Care+ logging policy prohibits prompts, generated health text, medication names, readings, lab data, symptoms, appointments, push tokens, credentials and direct user/pregnancy identifiers.
- Billing is deliberately deferred and production validation rejects enabling purchases.

## Current readiness by program

| Program | Approx. readiness |
|---|---:|
| Core mother/partner app | 97% |
| Pregnancy/reminders/journal/widgets | 95% |
| Health Profile + Tracker | 95% |
| Care Timeline + Care Context | 92% |
| Janani Profile Engine | 90% |
| Nutrition engine | 88% |
| Care+ architecture | 88% |
| Security/privacy foundation | 93% |
| Localization code foundation | 90% |
| Production signing/release tooling | 92% |
| Production backend deployment proof | 70% |
| Clinical approval/content review | 30% |
| Google Play Billing + RTDN | deferred/final milestone |
| Play Console/public release | not completed |

## Remaining production programs

### 1. Final branch reconciliation

- Selectively review the two unique `codex/milestones-1-5` commits.
- Port only improvements that are newer/better than production, especially pregnancy content validation and reliability fixes.
- Confirm the two newer `main` bookkeeping commits require no product merge.
- End with one reviewed production branch and a clean merge path to `main`.

### 2. Production backend deployment proof

- Apply the complete integration migration chain to a clean staging database first.
- Confirm every migration succeeds without hidden/manual prerequisites.
- Re-run mother/partner/cross-family access checks.
- Verify private table REST access remains denied.
- Deploy Edge Functions from the same reviewed commit.
- Configure production secret names documented in `docs/PRODUCTION_BACKEND_OPERATIONS.md`.
- Start Care+ with `JANANI_AI_ENABLED=false` and enable only after provider/context/usage smoke tests pass.
- Verify production logs are metadata-only.

### 3. Observability and privacy verification

- Confirm Crashlytics/Analytics events never contain health values, journal text, AI prompts, medications or clinician instructions.
- Configure launch alerting for Edge Function 5xx, Care+ provider failures, usage-finalization failures, authentication/RLS regressions and push failures.
- Verify request IDs are sufficient for incident correlation without direct user identifiers.

### 4. Clinical review

- Qualified clinical review of every condition pack.
- Review and approve source manifests and prohibited/allowed guidance.
- Approve Telugu/Hindi medical and urgent-care wording before enabling translated clinical guidance.
- Only approved rule-pack versions may be activated in the server registry.

### 5. Physical-device acceptance

- Two-device mother/partner acceptance flow.
- Reminder timing, alarm behavior, taps and reboot recovery.
- Push delivery and device-token lifecycle.
- Widget rendering/deep links/privacy reset.
- Offline create/edit/replay behavior.
- Partner removal/rejoin and access revocation.
- Account deletion/export on disposable accounts.
- Care+ unavailable/blocked/success paths.

### 6. Google Play Billing + RTDN — final major integration

Billing remains intentionally deferred. Final implementation must include:

- Google Play Billing client flow.
- Google server verification.
- Atomic purchase-token ownership claim.
- Server-authoritative Care+ entitlement.
- Purchase acknowledgement with durable retry.
- Restore/renew/cancel/grace/hold/expire/refund/revoke lifecycle.
- RTDN reconciliation.
- Billing observability and idempotency.

### 7. Final release

- Reconcile and merge production integration intentionally into `main`.
- Configure protected production signing secrets.
- Generate the final reproducible signed AAB from one reviewed commit.
- Verify install/update behavior on physical Android devices.
- Complete Privacy, Account Deletion, Support and Terms production URLs.
- Complete Play Data Safety and health/medical declarations based on the actual final AAB.
- Complete subscription disclosure after billing is integrated.
- Upload screenshots, feature graphic, descriptions and release notes.
- Complete closed/open testing as required, then production rollout.

## Definition of 100%

Janani reaches 100% production readiness only when:

1. The production integration branch is reconciled and merged into `main`.
2. CI/typecheck/lint/Expo Doctor/production audit/native release gates pass on the final commit.
3. Staging and production migrations are verified.
4. RLS/RPC/privacy boundaries pass acceptance tests.
5. Required production secrets and monitoring are configured.
6. Clinical rule packs intended for launch are formally approved or remain disabled.
7. Physical mother/partner/device acceptance passes.
8. Billing/RTDN is complete if Care+ purchases are part of launch.
9. Final signed AAB is reproducible and verified.
10. Play Console declarations/listing/release gates are complete.

## Safety principles

- Janani is supportive and educational, never diagnostic.
- AI cannot prescribe, change medications or declare mother/baby safety.
- Clinician instructions take priority over generated guidance.
- Urgent concerns bypass ordinary AI advice.
- Sensitive health information is mother-only by default.
- Partner sharing is explicit and revocable.
- AI receives task-relevant context only.
- No service-role keys, AI provider secrets, signing files or passwords may enter the mobile bundle or repository.
