# Janani Project Progress

**Overall progress: 96%**

**Status:** Production-readiness verification; not publicly launched

**Last verified:** 2026-08-10

The percentage describes engineering readiness, not store approval or production availability. Janani must not be represented as 100% complete until every open release gate below has evidence.

## Verified application and repository work

- Deterministic `package-lock.json` and Node.js 22 runtime policy are present.
- A clean `npm ci`, TypeScript, Expo lint, all 18 Expo Doctor checks, the production dependency-security gate, legal-site validation, Edge Function formatting/lint/type checks and tests, Cloudflare static/live validation, Expo export and public-config resolution, clean Android prebuild, native compilation, and final diff check passed on the completed source.
- Expo SDK 54 Android prebuild completed cleanly after the client hardening changes, including the SDK-compatible System UI module, and widget package registration remained idempotent.
- The final branded native source completed a clean Android prebuild and compiled into an x86_64 debug APK at `android/app/build/outputs/apk/debug/app-debug.apk` (46,689,876 bytes; SHA-256 `e0bd1ac7cf4091bfe90dc0825238fb2c6a58568add0ce4d29ce316ac0a8253b4`). Package metadata, alignment, v2 signature verification, and generated launcher/adaptive/monochrome resources passed inspection. This debug-signed, debuggable, x86_64-only artifact is engineering evidence, not the production-signed Play AAB.
- A physical-device Logcat session showed no fatal Janani crash or ANR. The observed sign-out navigation race was fixed by removing the redundant root-route replacement and delegating post-sign-out routing to `AuthGate`.
- Auth sessions and user-scoped local data are encrypted, with key material held in SecureStore.
- Caches, offline queues, local reminder schedules, push-token state, and widget state are isolated or cleared by authenticated user.
- Authenticated screens are gated by both session and current family membership.
- Sign-up validates the password policy, preserves mother/partner intent, and supports email-confirmation flows.
- Mother onboarding validates pregnancy dates and optional measurements; partner onboarding uses a 20-character high-entropy invite code.
- Offline reminder and journal mutations are idempotent, user-scoped, ordered, and separated into retryable and permanent failures.
- Reminder notifications use private lock-screen copy and a per-user local registry.
- Local reminder schedules honor start date, end date, local time, and selected weekdays, and are reconciled on a rolling horizon.
- The exact user-approved 1254 x 1254 general icon was restored from its complete source parts, validated as a complete PNG, and wired as the generated general icon, splash image, and favicon. Its SHA-256 is `bcc71c6c06bc51f78b247d4bdc60acdb4c0ab69826f83eca114f97d14344048b`.
- New 1254 x 1254 adaptive-foreground and monochrome variants are wired for Android adaptive and notification contexts; the config rejects malformed, truncated, non-square, or undersized approved-icon source.
- The legal-site source contains Privacy, Terms, Account Deletion, Support, robots, sitemap, accessibility, and security metadata.
- GitHub Pages is enabled in workflow mode; the home, privacy, terms, account-deletion, and support routes are live over HTTPS, and account deletion remains an information/link-only route with no credential form or Auth logic.
- The hardened password-authenticated external form is live at `https://janani-account-deletion.pages.dev/` on a dedicated Cloudflare Pages origin. Cloudflare serves reviewed static assets only; the browser sends credentials and Auth tokens directly to Supabase Auth and the protected `delete-account` Edge Function. Live asset-integrity, anti-framing/no-store header, and exact-origin Supabase CORS checks passed. The legacy Supabase page URL is now a no-body `302` compatibility redirect to the canonical form. A successful disposable-account deletion and rejected sign-in remain unverified.
- The Supabase smoke harness now supplies its generated disposable-account password to `delete-account`, matching the live current-password contract.
- EAS is linked to `@astromicirql/janani` with project ID `2897dd94-47bf-4b4c-a7a9-82e40aaa65a1`; public environment variables are configured for development, preview, and production profiles.

## Verified live Supabase backend

- Connected project: `brdjnhfvytdmsnwexras`, Mumbai region.
- All 15 source-controlled migrations are recorded in the live migration history.
- The three production-hardening migrations cover core policy/grant repairs, partner-join ambiguity, and final deletion, token, nudge, and Realtime audit gaps.
- `send-partner-nudge` version 5 is active with JWT verification, family membership checks, rate limiting, mutation idempotency, former-partner replay protection, and an atomic push-dispatch claim.
- `delete-account` version 7 is active with JWT verification, current-password reauthentication, durable cleanup requests, role-aware deletion, finite best-effort storage-cleanup attempts, durable recording of unresolved cleanup, and an exact-origin browser CORS boundary for the dedicated Cloudflare form.
- `account-deletion-page` version 2 is active without JWT verification because it performs only a fixed, no-body `302` compatibility redirect and accepts no mutation method.
- Push tokens cannot be taken over by another active account; inactive-token reassignment is controlled.
- Partners cannot read a mother's invite code, last menstrual period, height, or pre-pregnancy weight. Mother-only RPCs expose the private fields to their owner.
- Mothers can delete partner-created family reminders, and partner removal rotates the family invite code, including deletion cascades.
- Private Realtime Broadcast policies and sanitized family invalidation triggers cover family, membership, pregnancy, reminder, journal, and partner-message changes.
- A transactional database smoke test passed and rolled back without leaving test rows.
- A disposable account completed the version 5 deletion flow; its Auth, profile, cleanup-request, and storage records were verified absent afterward.
- Unauthenticated requests to the protected deletion function are rejected. The public `account-deletion-page` compatibility endpoint returns only a no-body `302` redirect to the canonical Cloudflare form, and live CORS checks allow the exact dedicated Cloudflare origin.
- Current Security Advisor warnings for authenticated `SECURITY DEFINER` RPCs are intentional because each function performs explicit authenticated ownership or family checks. The server-only deletion queue intentionally has RLS enabled without authenticated policies.

## Release gates still open

1. Install the rebuilt APK on a physical device and confirm sign-out no longer emits the unhandled `REPLACE index` warning.
2. Complete the full mother/partner checklist on two physical Android devices, including offline replay and membership revocation.
3. Verify real push delivery, notification timing/taps, reboot recovery, and widget rendering/deep links on physical hardware.
4. Complete a successful deletion through the live Cloudflare form with an exact disposable account, then prove that the account cannot sign in and that only the intended role-specific records were removed.
5. Enable leaked-password protection in the live Supabase Auth settings. This remains an external dashboard/plan gate.
6. Configure production custom SMTP, verify signup/confirmation deliverability, and complete a safe password-recovery request, redirect, and password-update flow.
7. Publish a private support/privacy contact channel so users never need to put account, pregnancy, health, medication, or security details in public GitHub Issues.
8. Configure production signing, build a signed AAB, and verify its install/update behavior.
9. Reconcile the final dependency tree and behavior with the current Play Console Data Safety form, then complete closed testing and store-listing materials.

## Environment and operational notes

- The disposable Android 15 `Janani_Test` AVD was freshly wiped and booted under WHPX. ADB repeatedly returned to `offline`; the only streamed install reached the OS but failed before installing Janani because the still-initializing emulator storage service had no `PackageManagerInternal`. The AVD was stopped afterward.
- The existing `Pixel_7` AVD was not wiped or modified.
- A later physical-device session showed an earlier Janani build running without a fatal native crash or ANR; sign-out produced a development navigation warning that is now patched and awaiting regression verification in the rebuilt branded artifact.
- Two-device and physical-hardware feature behavior has not been claimed as fully tested.
- GitHub Pages is live at `https://mkraja826.github.io/Janani/`; its account-deletion route remains information/link-only and directs users to the canonical Cloudflare form. Cloudflare static deployment, response headers, source integrity, and Supabase CORS preflights have passed live verification.
- One pre-existing Auth/profile account remains in the live project. Its ownership is unknown, so it is intentionally preserved and must not be used as disposable test data.
- Supabase leaked-password protection is still disabled. Enabling it requires access to the correct project dashboard and may depend on the project plan.
- Supabase's default email sender is not a production delivery solution. Custom SMTP credentials, confirmation/recovery templates and redirects, deliverability checks, and abuse/rate-limit settings remain external owner/provider work.
- No private support or privacy-request channel is published yet; the current GitHub Issues path is public, unsuitable for sensitive requests, and currently reports that issue creation is restricted.
- The repository production audit gate transparently allows only two reviewed high-severity parser advisories in the pinned upstream `image-size` package, whose affected HEIF/ICNS/JXL parsers are disabled by a source-controlled compatibility adapter. Any other high or critical advisory fails the gate. The final clean-install and production audit passed; incompatible forced dependency downgrades were not applied.

## Known behavior to validate on devices

- A reminder created fully offline receives its local phone schedule only after the queued mutation reaches Supabase.
- Local alerts are scheduled on a rolling 60-day horizon and refreshed when Janani returns to the foreground.
- Production push delivery depends on EAS/Expo credentials and physical-device behavior even though the project is now linked.
- Account deletion and family unlinking have backend verification but still require end-to-end app acceptance on disposable accounts.
- The external deletion form is statically hosted on the dedicated Cloudflare origin and sends browser requests directly to the existing authenticated Supabase deletion service. Hosting and boundary checks are production evidence, but the flow is not complete until a real disposable-account deletion and rejected sign-in are verified live.

## Safety and privacy principles

- Janani is supportive and educational, never diagnostic.
- Medicine details must follow the prescribing clinician.
- Urgent concerns must direct users to qualified medical or emergency care.
- Journal sharing is explicit and private by default.
- Partner access is explicit, revocable, and enforced in the database.
- Sensitive mother-only pregnancy details and family invite codes are not partner-readable.
- Push tokens and profile details are private to the owning user.
- Offline data is scoped to the authenticated user; Supabase remains authoritative.
- Destructive account actions require explicit confirmation and current-password reauthentication.
- No service-role keys, passwords, signing files, or production secrets may enter the mobile repository.
