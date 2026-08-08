# Janani internal testing readiness

This checklist is intentionally separate from the existing dependency-security audit. Passing native build validation does not waive or resolve a security advisory.

## Required code gates

- `npm ci`
- `npm run typecheck`
- `npm run lint`
- `npx expo-doctor`
- Android clean prebuild
- `./gradlew assembleDebug`
- physical-device smoke test after backend migrations are staged
- no fatal Janani crash/ANR in Logcat

## Required backend gates before Play billing tests

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

## Required Google Play setup

- package: `com.mkraja826.janani`
- subscription product: `janani_care_plus_monthly`
- subscription product: `janani_care_plus_annual`
- configure active auto-renewing base plans
- use Play-provided localized prices in the app
- configure license testers/internal testers
- configure Android Publisher service account with minimum required Play access
- configure RTDN Pub/Sub topic and push subscription
- keep Google service-account credentials and RTDN secret only in Supabase secrets

## Internal purchase acceptance

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

## Merge order

The current feature stack must merge bottom-up:

1. #3 Health Profile
2. #4 Health Tracker
3. #5 Care Timeline
4. #6 Food & Nutrition
5. #7 Deterministic Personalization
6. #8 Gestational Diabetes rule framework
7. #9 Diabetes + Hypertension rule packs
8. #10 Anemia + Thyroid rule packs
9. #11 Care+ AI Gateway
10. #12 AI Evaluation Harness
11. #13 Care+ UI
12. #14 Google Play Verification
13. #15 Android Play Billing
14. #16 Subscription Lifecycle
15. release-readiness validation

Do not merge or deploy condition-specific AI personalization merely because the code is present. The condition packs remain disabled until qualified clinical review.

## Release artifact gate

After all code and backend checks pass:

- configure production signing / Play App Signing path
- increment Android `versionCode` if Play Console already contains code 1
- build signed release AAB
- inspect package name/version/signing
- upload to Internal testing first
- complete billing lifecycle tests before broader rollout
