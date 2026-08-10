# Janani production backend operations

This document is the deployment contract for Supabase Edge Functions and operational monitoring. It intentionally contains secret **names only**, never secret values.

## Required Supabase Edge Function secrets

All production functions that create authenticated/user-scoped or service-role Supabase clients require:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

`SUPABASE_SERVICE_ROLE_KEY` is server-only. It must never be exposed through Expo public configuration, app bundles, logs, client errors, screenshots or support exports.

### Care+ AI

Care+ is fail-closed. To enable generated responses in production all of the following must be present:

- `JANANI_AI_ENABLED=true`
- `JANANI_AI_PROVIDER=openai_compatible`
- `JANANI_AI_API_URL` — HTTPS endpoint only
- `JANANI_AI_API_KEY`
- `JANANI_AI_MODEL`

If any provider value is missing or invalid, Care+ must return a generic unavailable response and must not expose the missing variable name, provider response body, prompt, health context, key, URL credentials or raw exception to the client.

### Partner push notifications

- `EXPO_ACCESS_TOKEN` is optional only when the Expo project accepts unauthenticated push requests. Production should configure it when Expo push access security is enabled.
- Device locale is stored on `device_push_tokens.locale_code` and is not a secret.

## Public mobile configuration

The production mobile build uses the values listed in `docs/PRODUCTION_RELEASE.md`. Anything prefixed `EXPO_PUBLIC_` is considered public and may be present in the compiled application. Never place an AI provider key, service-role key, signing password, Firebase service-account private key or Expo access token in an `EXPO_PUBLIC_` variable.

## Logging policy

Production backend logs are metadata-only. Allowed fields include:

- generated request ID
- service/function name
- coarse processing stage
- HTTP/status class
- stable internal error code
- AI category
- provider identifier/model identifier when they contain no credentials
- token counts
- duration in milliseconds
- number of push tokens attempted/accepted/deactivated

Never log:

- authorization headers or JWTs
- Supabase service/anon keys
- AI API keys
- Expo push tokens
- email addresses or phone numbers
- user-entered Care+ prompts
- generated Care+ response text
- pregnancy IDs, user IDs or family IDs in plaintext
- medication names/doses
- diagnoses/conditions
- readings, lab values, symptoms, appointments, journal content or partner-message content
- full third-party response bodies

When a stable identifier is operationally necessary, prefer a request-scoped random ID. Do not introduce hashing of health/user identifiers unless there is a documented incident-response need and an approved retention policy.

## Required production signals

At minimum, operations should be able to distinguish these failure classes without reading sensitive payloads:

### Care+

- authentication failure rate
- entitlement check failures
- context-load failures
- clinical-rule registry failures
- requests blocked because a clinical rule pack is not approved
- quota reservation failures
- provider timeouts/network failures
- provider HTTP 4xx/5xx classes
- empty provider output
- safety-filter rejection count
- successful generation count and token usage
- final usage-accounting/finalization failures

### Partner push

- push-token lookup failure
- number of active tokens selected
- Expo request failure/status class
- Expo tickets accepted for processing
- `DeviceNotRegistered` count
- stale token deactivation failure

Expo `status=ok` means accepted for processing, not delivered. Do not label it as device delivery unless receipt polling confirms delivery.

## Alert thresholds for launch

Configure alerts in the chosen log/monitoring platform before production traffic:

- Edge Function 5xx error rate > 2% for 5 minutes
- Care+ provider failures > 5% for 5 minutes
- Care+ safety-filter rejection spike materially above normal baseline
- Care+ quota/finalization database failures > 0 sustained for 5 minutes
- partner push Expo request failures > 10% for 10 minutes
- authentication/RLS permission errors appearing after a migration

Thresholds should be tuned after real baseline traffic exists; the launch thresholds above are conservative starting points, not clinical thresholds.

## Deployment order

1. Apply migrations in repository timestamp order.
2. Confirm `device_push_tokens.locale_code` and `register_device_push_token_v2` exist.
3. Set required Supabase Edge Function secrets.
4. Deploy shared function dependencies first only when the platform requires it; otherwise deploy each Edge Function from the same reviewed commit.
5. Deploy `care-plus-ai` with `JANANI_AI_ENABLED=false` initially.
6. Deploy `send-partner-nudge` and verify a test recipient device stores its locale.
7. Run authenticated smoke tests for account/family boundaries, Care+ fail-closed behavior and partner push.
8. Verify logs contain request/stage metadata but no health/user content.
9. Enable `JANANI_AI_ENABLED=true` only after provider, entitlement, clinical-rule registry and usage-accounting smoke tests pass.
10. Keep Google Play Billing disabled until the dedicated final billing milestone.

## Incident rule

If logs reveal health content, prompts, push tokens, credentials or direct user identifiers, treat it as a privacy incident: stop the emitting code path, rotate affected secrets where applicable, restrict/expire log access according to the platform, document scope, and ship a redaction fix before restoring the feature.
