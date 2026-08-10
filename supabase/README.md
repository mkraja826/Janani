# Janani Supabase Backend

This directory is the source-controlled backend for the connected Janani project, `brdjnhfvytdmsnwexras`, in the Mumbai region. It contains schema and function source, not production rows or secrets.

## Live deployment status

- All 15 SQL files in `migrations/` are applied and recorded in the remote migration history.
- The earlier migrations define the application schema and role-aware workflows.
- `20260803040253_harden_janani_production.sql` repairs production RLS, grants, RPCs, invite handling, indexes, and related invariants.
- `20260803042150_fix_partner_join_ambiguity.sql` removes the partner-join name-resolution ambiguity found during live testing.
- `20260803050226_close_production_audit_gaps.sql` closes the final token, nudge, account-deletion, column-privacy, and private Realtime Broadcast gaps.
- `send-partner-nudge` is active as deployed version 5 with JWT verification.
- `delete-account` is active as deployed version 7 with JWT verification and the dedicated Cloudflare origin as its only built-in browser origin.
- `account-deletion-page` is active as deployed version 2 without JWT verification because it only returns a fixed, no-body `302` redirect to `https://janani-account-deletion.pages.dev/` for `GET` and `HEAD` and rejects mutation methods.

The deployed implementation includes:

- high-entropy, automatically rotated family invitation codes;
- mother-only access to invite codes, last menstrual period, height, and pre-pregnancy weight;
- family-scoped Row Level Security and restricted column grants;
- protected push-token registration and unregistration;
- nudge rate limiting, family-lock membership validation, idempotency, replay protection after unlinking, and one-time push dispatch;
- current-password reauthentication and durable cleanup tracking for permanent account deletion; and
- private, family-scoped Realtime Broadcast invalidation with sanitized payloads.

The hardened external deletion form for users who no longer have the app is served as reviewed static files from the dedicated Cloudflare Pages origin `https://janani-account-deletion.pages.dev/`. Its browser code sends the email/password directly to Supabase Auth and sends the returned access token plus current password directly to the JWT-protected `delete-account` function. Cloudflare serves the static files and does not receive the form submission; GitHub Pages provides information and a link only. The browser uses only the public publishable key and never receives a service-role or secret key. The old Supabase page URL remains solely as a compatibility redirect and contains no form or response body.

## Directory contents

- `migrations/` contains the complete 15-migration history currently applied to the connected project.
- `functions/send-partner-nudge/` contains the partner-message and push-dispatch function.
- `functions/delete-account/` contains the role-aware permanent deletion function.
- `functions/account-deletion-page/` contains the no-body compatibility redirect to the canonical Cloudflare form.
- `functions/_shared/` contains shared database and HTTP/CORS helpers.
- `functions/deno.json` and `functions/deno.lock` pin the Edge Function runtime dependencies.
- `config.toml` is the local Supabase configuration; production dashboard settings must be verified separately.
- `seed.sql` is intentionally empty. Never commit production-like personal or pregnancy data as seed data.

## Edge Function environment

Supabase injects `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` at runtime.

Optional secrets:

- `ALLOWED_ORIGINS`: comma-separated additional browser origins for explicitly reviewed temporary clients; native Expo requests normally have no `Origin` header. The protected deletion function's source-controlled production allowlist contains only `https://janani-account-deletion.pages.dev`; GitHub Pages does not submit credentials or tokens.
- `EXPO_ACCESS_TOKEN`: recommended if Expo push access-token security is enabled.

Set secrets through Supabase secret management, never in a tracked `.env` file. The deployed `send-partner-nudge` and `delete-account` functions must retain JWT verification. `account-deletion-page` is intentionally public (`verify_jwt = false`) because it performs only the fixed no-body redirect; it does not read credentials, keys, tokens, or user data and accepts no mutation method.

## Auth configuration

The source-controlled local configuration requires at least eight characters containing letters and digits, enables email confirmation, and requires a recent login for password changes. Local URL values in `config.toml` are development-only and must not be copied blindly into the production dashboard.

The live project's leaked-password protection is still disabled. Enabling it in the correct Supabase dashboard remains a release gate and may depend on plan support.

Production email Auth is also incomplete. Supabase's default SMTP service is intended for testing, restricts recipients and delivery volume, and has no production delivery guarantee. Before public release, configure owner-controlled custom SMTP, a trusted sender/domain, rate limits and abuse controls, then verify signup confirmation and password-recovery delivery. A complete recovery flow must request the reset email, accept only approved redirects/deep links, establish the recovery session, update the password safely, and return the user to Janani without leaking tokens.

Recheck the production site URL, redirect allowlist, confirmation and recovery templates, email-confirmation behavior, password policy, and leaked-password setting before public release. Current Supabase references: [custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [password-based Auth and recovery](https://supabase.com/docs/guides/auth/passwords), and the [production checklist](https://supabase.com/docs/guides/deployment/going-into-prod).

## Verification completed

- The final hardening migration was applied atomically.
- A transaction-wrapped database smoke test exercised invite rotation, restricted pregnancy columns, mother reminder deletion, token reassignment rules, nudge replay rejection, deletion write guards, and Realtime policies, then rolled back.
- A disposable account completed the version 5 account-deletion flow. Its Auth user, profile, cleanup request, and test storage object were confirmed absent afterward.
- Unauthenticated requests to the protected deployed Edge Functions are rejected; the public compatibility redirect performs no privileged operation itself.
- The canonical Cloudflare static assets, anti-framing/no-store security headers, and non-destructive Supabase Auth/`delete-account` CORS preflights passed live verification. The protected deletion preflight returns the exact canonical Cloudflare origin rather than a wildcard.
- The old Supabase `account-deletion-page` endpoint returns a no-body `302` to the canonical Cloudflare URL for `GET`/`HEAD` and rejects mutation methods.
- The repository smoke harness now passes the same generated disposable-account password to `delete-account` that was used to create and sign in the test accounts. This corrects the stale invocation that omitted the live function's required `current_password` field.
- Deno formatting, linting, and type checking passed for the function source during this readiness pass.
- Supabase Security Advisor findings were reviewed. Authenticated `SECURITY DEFINER` RPC warnings are expected because the functions perform explicit authentication and ownership/family checks. The account-deletion request table intentionally has RLS enabled with no authenticated policy because it is server-only.

## Verification still required

- Enable and confirm leaked-password protection in the live Auth settings.
- Configure custom SMTP and complete real signup-confirmation and password-recovery delivery/redirect tests.
- Run the corrected repository smoke script with an authorized server-only service-role environment when appropriate; never expose that key to the app, either public web page, function output, or logs.
- Complete one successful deletion through the live Cloudflare form using an exactly identified disposable account, then verify rejected sign-in and the expected role-specific data effects. Static behavior, deployment, response-header, source-integrity, and CORS checks are already complete.
- Complete two-account mother/partner acceptance on real Android devices, including disconnect, leave-family, notification, push, and account deletion flows.
- Re-run Security and Performance Advisors before the release cut.

## Production data preservation

One pre-existing Auth/profile account remains in the connected project. Its ownership is unknown, so it must not be modified or deleted during disposable-account testing. Always create uniquely identified test accounts and prove their exact IDs before cleanup.
