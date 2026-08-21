# Janani Future Feature Stack Readiness — 2026-08-15

Source reviewed: `feature/release-readiness-validation`

This document preserves the post-`main` feature-stack order without merging future product code into the Janani 1.0 production candidate.

## Status

Reference only for future releases.

Do not treat this file as approval to ship Care+, billing, AI, clinical rules, health tracker, condition packs, or report extraction in Janani 1.0.

## Why this layer was not merged as code

The source branch includes release-readiness items, but it also includes broad future-product code:

- Care+ screens and assistant UI.
- Google Play billing native module.
- Billing verification functions.
- Care+ AI Edge Functions and provider code.
- Health profile, health tracker and care timeline foundations.
- Nutrition personalization and condition rule packs.
- Supabase migrations for future health, AI and billing tables.

Those areas require backend staging, clinical review, billing lifecycle testing, and physical-device validation before they are production-safe.

## Code gates to run after a future feature stack batch

- `npm ci`
- `npm run validate:production-config`
- `npm run audit:production`
- `npm run typecheck`
- `npm run lint`
- `npx expo-doctor`
- Android clean prebuild
- Android debug APK compile
- physical-device smoke test after backend migrations are staged
- no fatal Janani crash/ANR in Logcat

## Future backend gates before Play billing tests

Apply migrations in repository order to a non-production/staging Supabase project first. Verify:

- mother-only health profile access
- mother-only tracker access
- care timeline CRUD
- Care+ entitlement RPC does not permit client writes
- AI usage reservation is server-controlled
- Google Play purchase-token table is inaccessible to authenticated clients
- RTDN event table is inaccessible to authenticated clients

Deploy billing functions only after the database schema exists:

1. `verify-google-play-subscription`
2. `google-play-rtdn`

Keep production AI disabled while validating billing.

## Future Google Play setup

- package: `com.mkraja826.janani`
- subscription product: `janani_care_plus_monthly`
- subscription product: `janani_care_plus_annual`
- configure active auto-renewing base plans
- use Play-provided localized prices in the app
- configure license testers/internal testers
- configure Android Publisher service account with minimum required Play access
- configure RTDN Pub/Sub topic and push subscription
- keep Google service-account credentials and RTDN secret only in Supabase secrets

## Future internal purchase acceptance

Install Janani from the Play internal-testing link, not by sideloading, then verify:

- monthly product loads
- annual product loads
- monthly purchase sheet opens
- annual purchase sheet opens
- PENDING does not activate Care+
- PURCHASED activates Care+ only after backend verification
- reinstall + Restore Purchases restores a valid entitlement
- cancellation keeps access through paid expiry
- renewal keeps access
- grace period keeps access
- account hold removes access
- expiry removes access
- refund/revocation removes access
- duplicate RTDN delivery is idempotent
- a purchase token already owned by another Janani account cannot be claimed

## Future merge order

The future feature stack must merge bottom-up:

1. Health Profile
2. Health Tracker
3. Care Timeline
4. Food & Nutrition
5. Deterministic Personalization
6. Gestational Diabetes rule framework
7. Diabetes + Hypertension rule packs
8. Anemia + Thyroid rule packs
9. Care+ AI Gateway
10. AI Evaluation Harness
11. Care+ UI
12. Google Play Verification
13. Android Play Billing
14. Subscription Lifecycle
15. release-readiness validation

Do not merge or deploy condition-specific AI personalization merely because the code is present. Condition packs remain disabled until qualified clinical review.

## Release artifact gate for a future Care+/billing release

After all code and backend checks pass:

- configure production signing / Play App Signing path
- increment Android `versionCode` when required by Play Console
- build signed release AAB
- inspect package name/version/signing
- upload to Internal testing first
- complete billing lifecycle tests before broader rollout
