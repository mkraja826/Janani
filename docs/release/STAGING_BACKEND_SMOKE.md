# Janani staging backend smoke gate

This gate is read-only and must run only against a separate staging Supabase project.

## What it verifies

- staging test user can authenticate
- the test account is a mother account with a pregnancy record
- `get_own_health_profile` is reachable
- `get_own_health_tracker` is reachable
- `list_own_care_appointments` is reachable
- `get_own_care_plus_status` is reachable
- the `care-plus-ai` Edge Function route is deployed and returns an expected policy/disabled response

The smoke test does not create, edit, or delete health records, purchases, subscriptions, or AI generations.

## Required GitHub environment

Create a protected GitHub Actions environment named `staging` and add:

- `JANANI_STAGING_SUPABASE_URL`
- `JANANI_STAGING_SUPABASE_PUBLISHABLE_KEY`
- `JANANI_STAGING_TEST_EMAIL`
- `JANANI_STAGING_TEST_PASSWORD`

The test account must be synthetic and must never contain real pregnancy or health data.

## Running

Use the manual `Janani Staging Backend Smoke` workflow after the feature-stack migrations and Edge Functions have been deployed to staging.

A 200, 402, 409, 501, or 503 response from `care-plus-ai` is accepted because production AI is intentionally disabled and entitlement/rule gates may block the fictional test account. A 404 is a failure because it means the function is missing.

## Promotion gate

Do not promote the new health/Care+ stack to production until:

1. build validation is green,
2. the staging backend smoke test is green,
3. migration order has been reviewed,
4. synthetic two-account mother/partner privacy testing passes,
5. Google Play purchase/restore/lifecycle testing passes in internal testing,
6. condition rule packs receive the required clinical review before condition-specific personalization is enabled.
