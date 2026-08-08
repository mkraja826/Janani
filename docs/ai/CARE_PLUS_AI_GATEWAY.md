# Janani Care+ AI Gateway

Status: architecture baseline. Live model calls are disabled by default.

## Request path

1. Authenticate the caller.
2. Require a verified Care+ entitlement stored server-side.
3. Accept only a small allow-list of request categories.
4. Resolve the caller's own pregnancy and private health profile through existing mother-owned RPCs.
5. Build a minimal context object. Never send email, phone, invite codes, raw auth tokens, partner messages, or full journal history.
6. Check condition rule-pack readiness. A current condition whose rule pack is not clinically approved blocks condition-specific AI personalization.
7. Reserve request/token quota atomically.
8. Call the configured provider only when the global AI feature flag and provider are enabled.
9. Validate the provider output against fixed safety rules.
10. Persist provider/model/token metadata and return the validated result.

## Initial request categories

- `daily_summary`
- `weekly_meal_ideas`
- `appointment_summary`
- `health_trend_summary`
- `explain_guidance`
- `meal_alternative`

Each category must eventually receive an independent prompt, schema, output limit, cache policy, and evaluation set.

## Hard boundaries

The AI layer must never diagnose, prescribe, alter medication or supplement doses, invent glucose/BP/thyroid targets, promise safety, override clinician-entered instructions, or bypass an unapproved condition rule pack.

Urgent symptom handling is not delegated to a generative model.

## Entitlements

The mobile client cannot grant itself Care+. Only trusted billing verification code may write `care_plus_entitlements`. The Edge Function reads the verified entitlement before any paid AI request.

## Launch quotas

Planning defaults per paid user/month:

- 100 completed generations
- 150,000 input tokens
- 50,000 output tokens

These are server-side limits, not user-visible promises, and can be adjusted by plan version.

## Provider policy

`JANANI_AI_ENABLED` defaults to disabled. `JANANI_AI_PROVIDER` defaults to disabled. No provider key is stored in the app or committed to the repository.

A provider adapter may be enabled only after privacy review, model evaluation, clinical safety testing, billing verification, and production secrets are configured.
