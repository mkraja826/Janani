# Janani production database and RPC audit

Audit scope: Janani 1.0 production integration migrations and Edge Function boundaries.

## Passed controls

### Health profile and tracker

- Health profile, condition, weight, blood-pressure, glucose, lab and symptom tables have RLS enabled.
- `anon` and `authenticated` have no direct table privileges on these private maternal tables.
- Client access is exposed only through `security definer` RPCs that verify `auth.uid()` owns the pregnancy as the mother.
- Tracker write/delete RPCs bind writes to the authenticated mother instead of trusting a client-supplied owner id.

### Care timeline

- `care_appointments` has RLS enabled and no direct `anon`/`authenticated` table privileges.
- List/save/delete RPCs verify mother ownership of the pregnancy before accessing appointment data.
- The shared text-array normalizer is not directly executable by public client roles.

### Private Care Context

- `private_care_contexts` and `care_medications` have RLS enabled and direct client table privileges revoked.
- Read/write medication/context RPCs verify mother ownership.
- Global locale support replaces the original three-language constraint with a bounded locale-code format check.

### Care+ entitlement and usage

- `care_plus_entitlements`, `ai_usage_monthly` and `ai_generations` have RLS enabled.
- `anon` and `authenticated` have no direct table privileges.
- `get_own_care_plus_status()` is the only client-facing entitlement/usage RPC and derives identity from `auth.uid()`.
- Reservation and finalization RPCs are executable only by `service_role`.
- Reservation independently verifies an active entitlement and mother-owned pregnancy before usage is consumed.
- Finalization is idempotent because only rows in `reserved` status are reconciled.

### Clinical rule lifecycle

- Clinical rule tables have RLS enabled and no direct client privileges.
- Active approved-rule lookup and rule-state mutation RPCs are `service_role` only.
- Approval requires reviewer identity, reviewer credentials, a version, and at least one source entry.
- Suspended, retired, future-effective and expired packs cannot be returned as active rule packs.

### Device push locale

- The v2 push-token registration RPC derives `user_id` from `auth.uid()` and validates platform, token presence and locale format.
- The v2 RPC is additive, preserving compatibility with older installed clients using the original push registration function.
- Partner push delivery reads only active recent tokens and uses a per-device locale with safe fallback.

## Fixed during this audit

### Care+ finalization contract mismatch

The Edge Function was passing `p_refund_usage` to `finalize_care_plus_ai_request_server`, but the production RPC has no such parameter. The gateway now calls the actual production signature and supplies provider, model, actual token counts and safety/error code where appropriate.

### Care+ operational visibility

The Care+ gateway now emits structured redacted events for request receipt, authentication, entitlement, context loading, clinical-rule checks, quota reservation, provider completion/failure, safety rejection and finalization. Logs must never contain prompts, medical context, generated medical text, credentials, emails, push tokens or user/pregnancy identifiers.

## Remaining release blocker discovered by CI

`npm ci` currently fails because `package.json` contains React Native Firebase dependencies that are not represented in `package-lock.json`. The lockfile must be regenerated from the current manifest and committed before the production quality gate can execute TypeScript, lint, Expo Doctor and Android compilation.

Do not hand-edit or fabricate the npm dependency graph. Regenerate it using the repository's supported Node/npm environment, then rerun the full Janani Quality workflow.

## Pre-production verification

Before production deployment:

1. Apply the full migration chain to a clean staging database.
2. Verify each migration completes without relying on pre-existing manual database state.
3. Test mother RPC access with a mother JWT and confirm partner/other-user access is denied.
4. Test Care+ server RPCs with `authenticated` and confirm reservation/finalization are denied.
5. Test the same server RPCs through the deployed Care+ Edge Function using service-role credentials stored only as Supabase secrets.
6. Verify direct REST table access to private health, Care+, clinical-rule and private-care tables is denied to `anon` and `authenticated`.
7. Register two devices for one test user with different locales and verify partner pushes localize independently without exposing private message content on the lock screen.
8. Confirm Care+ logs contain request/stage metadata only and no maternal health content or identifiers.
