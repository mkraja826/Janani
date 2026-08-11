# Janani 0.1.0 — Internal Testing Candidate

Janani is a pregnancy-support app for mothers and linked partners. This candidate focuses on gentle daily-care support, shared family reminders, private journaling, emotional connection, and resilient offline behavior.

**Distribution status:** Not cleared for public release or closed testing yet. The live backend, public policy hosting, canonical Cloudflare deletion-form deployment, and a branded debug build are in place, but successful disposable-account web deletion/rejected-sign-in evidence, physical two-device evidence, production signing/AAB, Supabase Auth production email/recovery configuration, private support, and store review remain open.

## Included

- Mother and partner onboarding with a private, high-entropy invite flow
- Pregnancy week, trimester, and estimated due-date progress
- Medicine, hydration, appointment, nutrition, and custom reminders
- Local phone notifications, completion history, pause, resume, edit, and deletion
- Private-by-default pregnancy journal with optional partner sharing
- Thinking-of-you messages, acknowledgements, family invalidation, and partner push support
- Encrypted per-user caches, idempotent offline writes, pending-sync status, and manual retry
- Android home-screen care widget with deep links
- JSON data export
- Mother-controlled partner disconnection and partner leave-family controls
- Permanent account deletion from Settings and from the no-family onboarding state
- Authenticated external account deletion through a hardened static form on a dedicated Cloudflare Pages origin using the same protected Supabase backend service, with GitHub Pages limited to information and a link
- Safety, privacy, and medical-disclaimer information

## Final branding source

- The exact user-approved 1254 x 1254 general icon is restored from complete validated source parts.
- The generated general icon is used for the application icon, splash image, and favicon.
- New 1254 x 1254 adaptive-foreground and monochrome variants are wired for Android adaptive and notification contexts.
- The build config rejects malformed Base64, truncated PNG chunks, missing image/final chunks, non-square images, and approved-icon sources smaller than 1024 x 1024.

## Backend baseline

- Supabase project `brdjnhfvytdmsnwexras` has all 15 repository migrations applied.
- `send-partner-nudge` is active as version 5 and `delete-account` as version 7, both with JWT verification. `account-deletion-page` version 2 is the public, no-body compatibility redirect.
- Private family-scoped Realtime Broadcast replaces unsafe delete-payload synchronization.
- Push-token registration, nudge replay/idempotency, invite rotation, mother-private fields, and deletion cleanup were hardened.
- A transaction-wrapped SQL smoke test passed and rolled back.
- A disposable account passed the server-side permanent-deletion flow with no remaining Auth, profile, cleanup-request, or test storage records.
- The repository smoke harness now passes its generated current password to `delete-account`, matching the live function contract.
- `https://janani-account-deletion.pages.dev/` is the canonical static browser form. The legacy Supabase `account-deletion-page` endpoint is retained only as a deployed no-body `302` compatibility redirect; the browser uses a public publishable key and never receives a service-role key.
- EAS project `@astromicirql/janani` is linked for development, preview, and production profiles.

## Verification status

- A clean `npm ci`, TypeScript, lint, all 18 Expo Doctor checks, the production dependency-security gate, legal-site validation, Deno checks and tests, Cloudflare static/live validation, Expo export and config resolution, clean prebuild, and native compilation passed on the completed source.
- The final branded native source completed a clean Android prebuild and compiled to an x86_64 debug APK (46,689,876 bytes; SHA-256 `e0bd1ac7cf4091bfe90dc0825238fb2c6a58568add0ce4d29ce316ac0a8253b4`). Package metadata, alignment, v2 signature verification, and launcher/adaptive/monochrome resources passed inspection. This debug-signed, debuggable, x86_64-only artifact is engineering evidence, not the signed distribution build.
- The current host did not install or launch the APK through the disposable Android 15 AVD because ADB repeatedly returned to `offline`; the earlier install attempt failed in the still-initializing emulator storage service before Janani was installed.
- GitHub Pages remains an information/link-only legal site. The canonical Cloudflare form is live, and remote source-integrity, anti-framing/no-store header, and exact-origin Supabase Auth/`delete-account` CORS checks passed. Cloudflare serves static files and does not receive the form submission.
- Physical two-device, real push, notification, reboot, widget, and signed-AAB testing have not been completed.

## Important limitations and release gates

- Janani is not a medical device and does not diagnose, prescribe, monitor, or provide emergency care.
- Critical medicine schedules must always have an independent backup.
- A reminder created fully offline receives its local phone schedule after the queued mutation reaches Supabase.
- Local notification delivery can be delayed by Android permissions, battery policy, reboot state, or vendor restrictions.
- Real push delivery and widget behavior require physical-device verification even though the EAS project is linked.
- Leaked-password protection is still disabled in the live Supabase Auth settings and must be enabled if supported by the project plan.
- Owner-controlled custom SMTP is not configured for production Auth email delivery, and signup confirmation/password-recovery deliverability has not been accepted.
- A complete password-recovery request, approved redirect/deep link, recovery session, and safe password-update flow remains unverified.
- GitHub Issues is public and currently reports restricted issue creation; a working private support/privacy/security contact path has not been published.
- Production signing is not configured and no release AAB has been approved.
- Account deletion passed backend smoke testing, but the in-app flow still requires disposable-device acceptance for mother, partner, and no-family accounts.
- The live Cloudflare form still requires one successful deletion with an exactly identified disposable account, followed by rejected sign-in and role-specific data-effect verification. Static behavior, deployment, response-header, source-integrity, redirect, and CORS checks are complete.

## Tester focus after a build is cleared

- Complete mother and partner onboarding on two separate physical devices.
- Verify signup confirmation and password recovery through the production SMTP sender and approved app/site redirects.
- Verify private mother pregnancy fields and invite codes are not partner-visible.
- Test reminder notifications, notification taps, completion synchronization, and reboot recovery.
- Test journal privacy, sharing, unsharing, and family-membership revocation.
- Test partner messages, acknowledgements, push delivery, and replay protection after unlinking.
- Test offline creation/editing, force-close recovery, reconnect synchronization, and duplicate prevention.
- Add, resize, tap, refresh, and reboot-test the Android widget.
- Export data; disconnect and leave the family; then permanently delete disposable mother, partner, and no-family accounts.
- Delete an additional disposable account through `https://janani-account-deletion.pages.dev/`; verify rejected sign-in, confirm credentials are not retained in browser storage, and confirm the form submission is sent directly to Supabase rather than Cloudflare Pages, GitHub Pages, or any unrelated origin.
- Report crashes, confusing language, privacy concerns, stale data, notification delays, and any access that survives sign-out or unlinking.
