# Janani 0.1.0 — Internal Testing Candidate

Janani is a pregnancy-support app for mothers and linked partners. This candidate focuses on gentle daily-care support, shared family reminders, private journaling, emotional connection, and resilient offline behavior.

**Distribution status:** Not cleared for public release or closed testing yet. The live backend is hardened, but final Android execution and two-device evidence, production signing, public policy hosting, and one live Supabase Auth security setting remain open.

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
- Safety, privacy, and medical-disclaimer information

## Backend baseline

- Supabase project `brdjnhfvytdmsnwexras` has all 15 repository migrations applied.
- `send-partner-nudge` and `delete-account` are active as version 5 with JWT verification.
- Private family-scoped Realtime Broadcast replaces unsafe delete-payload synchronization.
- Push-token registration, nudge replay/idempotency, invite rotation, mother-private fields, and deletion cleanup were hardened.
- A transaction-wrapped SQL smoke test passed and rolled back.
- A disposable account passed the server-side permanent-deletion flow with no remaining Auth, profile, cleanup-request, or test storage records.
- EAS project `@astromicirql/janani` is linked for development, preview, and production profiles.

## Verification status

- A clean `npm ci`, TypeScript, lint, all 18 Expo Doctor checks, high-severity production dependency audit, legal-site validation, Deno checks, Expo config resolution, and final diff check passed on the finished source.
- A clean Expo SDK 54 Android prebuild completed after the final client hardening changes, with the generated widget bridge/provider verified.
- The final application/native source compiled to an x86_64 debug APK (46,080,516 bytes; SHA-256 `16d05f331d5392a8745b44131a6c510ae0c6ddf326277259f330efcb2721c088`).
- The current host has not installed or launched that APK. The disposable Android 15 AVD repeatedly dropped back to ADB `offline`, and its only install attempt failed inside the still-initializing emulator storage service before Janani was installed.
- Physical two-device, real push, notification, reboot, widget, and signed-AAB testing have not been completed.

## Important limitations and release gates

- Janani is not a medical device and does not diagnose, prescribe, monitor, or provide emergency care.
- Critical medicine schedules must always have an independent backup.
- A reminder created fully offline receives its local phone schedule after the queued mutation reaches Supabase.
- Local notification delivery can be delayed by Android permissions, battery policy, reboot state, or vendor restrictions.
- Real push delivery and widget behavior require physical-device verification even though the EAS project is linked.
- Leaked-password protection is still disabled in the live Supabase Auth settings and must be enabled if supported by the project plan.
- Production signing is not configured and no release AAB has been approved.
- The legal-site source exists, but GitHub Pages and the expected public policy/support URLs are not live yet.
- Account deletion passed backend smoke testing, but the in-app flow still requires disposable-device acceptance for mother, partner, and no-family accounts.

## Tester focus after a build is cleared

- Complete mother and partner onboarding on two separate physical devices.
- Verify private mother pregnancy fields and invite codes are not partner-visible.
- Test reminder notifications, notification taps, completion synchronization, and reboot recovery.
- Test journal privacy, sharing, unsharing, and family-membership revocation.
- Test partner messages, acknowledgements, push delivery, and replay protection after unlinking.
- Test offline creation/editing, force-close recovery, reconnect synchronization, and duplicate prevention.
- Add, resize, tap, refresh, and reboot-test the Android widget.
- Export data; disconnect and leave the family; then permanently delete disposable mother, partner, and no-family accounts.
- Report crashes, confusing language, privacy concerns, stale data, notification delays, and any access that survives sign-out or unlinking.
