# Janani Supabase Backend

This directory is the source-controlled backend for the connected Janani project, `brdjnhfvytdmsnwexras`, in the Mumbai region. It contains schema and function source, not production rows or secrets.

## Live deployment status

- All 15 SQL files in `migrations/` are applied and recorded in the remote migration history.
- The earlier migrations define the application schema and role-aware workflows.
- `20260803040253_harden_janani_production.sql` repairs production RLS, grants, RPCs, invite handling, indexes, and related invariants.
- `20260803042150_fix_partner_join_ambiguity.sql` removes the partner-join name-resolution ambiguity found during live testing.
- `20260803050226_close_production_audit_gaps.sql` closes the final token, nudge, account-deletion, column-privacy, and private Realtime Broadcast gaps.
- `send-partner-nudge` is active as deployed version 5 with JWT verification.
- `delete-account` is active as deployed version 5 with JWT verification.

The deployed implementation includes:

- high-entropy, automatically rotated family invitation codes;
- mother-only access to invite codes, last menstrual period, height, and pre-pregnancy weight;
- family-scoped Row Level Security and restricted column grants;
- protected push-token registration and unregistration;
- nudge rate limiting, family-lock membership validation, idempotency, replay protection after unlinking, and one-time push dispatch;
- current-password reauthentication and durable cleanup tracking for permanent account deletion; and
- private, family-scoped Realtime Broadcast invalidation with sanitized payloads.

## Directory contents

- `migrations/` contains the complete 15-migration history currently applied to the connected project.
- `functions/send-partner-nudge/` contains the partner-message and push-dispatch function.
- `functions/delete-account/` contains the role-aware permanent deletion function.
- `functions/_shared/` contains shared database and HTTP/CORS helpers.
- `functions/deno.json` and `functions/deno.lock` pin the Edge Function runtime dependencies.
- `config.toml` is the local Supabase configuration; production dashboard settings must be verified separately.
- `seed.sql` is intentionally empty. Never commit production-like personal or pregnancy data as seed data.

## Edge Function environment

Supabase injects `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` at runtime.

Optional secrets:

- `ALLOWED_ORIGINS`: comma-separated additional browser origins. The known legal-site origin, `https://mkraja826.github.io`, is included in the source allowlist; native Expo requests normally have no `Origin` header.
- `EXPO_ACCESS_TOKEN`: recommended if Expo push access-token security is enabled.

Set secrets through Supabase secret management, never in a tracked `.env` file. Both deployed functions must retain JWT verification.

## Auth configuration

The source-controlled local configuration requires at least eight characters containing letters and digits, enables email confirmation, and requires a recent login for password changes. Local URL values in `config.toml` are development-only and must not be copied blindly into the production dashboard.

The live project's leaked-password protection is still disabled. Enabling it in the correct Supabase dashboard remains a release gate and may depend on plan support. Recheck the production site URL, redirect allowlist, email-confirmation behavior, SMTP delivery, password policy, and leaked-password setting before public release.

## Verification completed

- The final hardening migration was applied atomically.
- A transaction-wrapped database smoke test exercised invite rotation, restricted pregnancy columns, mother reminder deletion, token reassignment rules, nudge replay rejection, deletion write guards, and Realtime policies, then rolled back.
- A disposable account completed the version 5 account-deletion flow. Its Auth user, profile, cleanup request, and test storage object were confirmed absent afterward.
- Browser preflight requests from the intended GitHub Pages origin return the expected CORS response.
- Unauthenticated Edge Function requests are rejected.
- Deno formatting, linting, and type checking passed for the function source during this readiness pass.
- Supabase Security Advisor findings were reviewed. Authenticated `SECURITY DEFINER` RPC warnings are expected because the functions perform explicit authentication and ownership/family checks. The account-deletion request table intentionally has RLS enabled with no authenticated policy because it is server-only.

## Verification still required

- Enable and confirm leaked-password protection in the live Auth settings.
- Run the repository smoke script with an authorized server-only service-role environment when appropriate; never expose that key to the app or logs.
- Complete two-account mother/partner acceptance on real Android devices, including disconnect, leave-family, notification, push, and account deletion flows.
- Re-run Security and Performance Advisors before the release cut.

## Production data preservation

One pre-existing Auth/profile account remains in the connected project. Its ownership is unknown, so it must not be modified or deleted during disposable-account testing. Always create uniquely identified test accounts and prove their exact IDs before cleanup.
