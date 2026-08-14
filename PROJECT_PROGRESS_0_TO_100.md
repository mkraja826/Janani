# Janani Project Progress

**Overall progress: 95%**

**Status:** Production-readiness verification; not publicly launched

**Last verified:** 2026-08-03

The percentage describes engineering readiness, not store approval or production availability. Janani must not be represented as 100% complete until every open release gate below has evidence.

## Verified application and repository work

- Deterministic `package-lock.json` and Node.js 22 runtime policy are present.
- A clean `npm ci`, TypeScript, Expo lint, all 18 Expo Doctor checks, high-severity production dependency audit, legal-site validation, Edge Function formatting/lint/type checks, Expo public-config resolution, and final diff check passed on the finished source.
- Expo SDK 54 Android prebuild completed cleanly after the final client hardening changes, including the SDK-compatible System UI module, and widget package registration remained idempotent.
- The final application/native source compiled into an x86_64 debug APK at `android/app/build/outputs/apk/debug/app-debug.apk` (46,080,516 bytes; SHA-256 `16d05f331d5392a8745b44131a6c510ae0c6ddf326277259f330efcb2721c088`).
- A physical-device Logcat session showed no fatal Janani crash or ANR. The observed sign-out navigation race was fixed by removing the redundant root-route replacement and delegating post-sign-out routing to `AuthGate`.
- Auth sessions and user-scoped local data are encrypted, with key material held in SecureStore.
- Caches, offline queues, local reminder schedules, push-token state, and widget state are isolated or cleared by authenticated user.
- Authenticated screens are gated by both session and current family membership.
- Sign-up validates the password policy, preserves mother/partner intent, and supports email-confirmation flows.
- Mother onboarding validates pregnancy dates and optional measurements; partner onboarding uses a 20-character high-entropy invite code.
- Offline reminder and journal mutations are idempotent, user-scoped, ordered, and separated into retryable and permanent failures.
- Reminder notifications use private lock-screen copy and a per-user local registry.
- Local reminder schedules honor start date, end date, local time, and selected weekdays, and are reconciled on a rolling horizon.
- Original app icon, adaptive foreground, monochrome, splash, notification, and favicon assets are wired into Expo configuration.
- The legal-site source contains Privacy, Terms, Account Deletion, Support, robots, sitemap, accessibility, and security metadata.
- GitHub Pages is enabled in workflow mode; the home, privacy, terms, account-deletion, and support routes were deployed and returned HTTP 200 over HTTPS.
- EAS is linked to `@astromicirql/janani` with project ID `2897dd94-47bf-4b4c-a7a9-82e40aaa65a1`; public environment variables are configured for development, preview, and production profiles.

## Verified live Supabase backend

- Connected project: `brdjnhfvytdmsnwexras`, Mumbai region.
- All 15 source-controlled migrations are recorded in the live migration history.
- The three production-hardening migrations cover core policy/grant repairs, partner-join ambiguity, and final deletion, token, nudge, and Realtime audit gaps.
- `send-partner-nudge` version 5 is active with JWT verification, family membership checks, rate limiting, mutation idempotency, former-partner replay protection, and an atomic push-dispatch claim.
- `delete-account` version 5 is active with JWT verification, current-password reauthentication, durable cleanup requests, role-aware deletion, and retryable storage cleanup.
- Push tokens cannot be taken over by another active account; inactive-token reassignment is controlled.
- Partners cannot read a mother's invite code, last menstrual period, height, or pre-pregnancy weight. Mother-only RPCs expose the private fields to their owner.
- Mothers can delete partner-created family reminders, and partner removal rotates the family invite code, including deletion cascades.
- Private Realtime Broadcast policies and sanitized family invalidation triggers cover family, membership, pregnancy, reminder, journal, and partner-message changes.
- A transactional database smoke test passed and rolled back without leaving test rows.
- A disposable account completed the version 5 deletion flow; its Auth, profile, cleanup-request, and storage records were verified absent afterward.
- Browser preflight checks accept the intended GitHub Pages origin, and unauthenticated function calls are rejected.
- Current Security Advisor warnings for authenticated `SECURITY DEFINER` RPCs are intentional because each function performs explicit authenticated ownership or family checks. The server-only deletion queue intentionally has RLS enabled without authenticated policies.

## Release gates still open

1. Reinstall the patched APK on a physical device and confirm sign-out no longer emits the unhandled `REPLACE index` warning.
2. Complete the full mother/partner checklist on two physical Android devices, including offline replay and membership revocation.
3. Verify real push delivery, notification timing/taps, reboot recovery, and widget rendering/deep links on physical hardware.
4. Enable leaked-password protection in the live Supabase Auth settings. This remains an external dashboard/plan gate.
5. Configure production signing, build a signed AAB, and verify its install/update behavior.
6. Pass the final GitHub Actions quality run, complete review, and merge intentionally.
7. Reconcile the final dependency tree and behavior with the current Play Console Data Safety form, then complete closed-testing and store-listing materials.

## Environment and operational notes

- The disposable Android 15 `Janani_Test` AVD was freshly wiped and booted under WHPX. ADB repeatedly returned to `offline`; the only streamed install reached the OS but failed before installing Janani because the still-initializing emulator storage service had no `PackageManagerInternal`. The AVD was stopped afterward.
- The existing `Pixel_7` AVD was not wiped or modified.
- A later physical-device session showed Janani running without a fatal native crash or ANR; sign-out produced a development navigation warning that is now patched and awaiting regression verification.
- Two-device and physical-hardware feature behavior has not been claimed as fully tested.
- GitHub Pages is live at `https://mkraja826.github.io/Janani/`; all five published routes were checked successfully after deployment.
- One pre-existing Auth/profile account remains in the live project. Its ownership is unknown, so it is intentionally preserved and must not be used as disposable test data.
- Supabase leaked-password protection is still disabled. Enabling it requires access to the correct project dashboard and may depend on the project plan.
- `npm audit --omit=dev --audit-level=high` passes. It reports 15 moderate transitive `uuid`/Expo build-tool findings whose offered forced fix downgrades Expo incompatibly; no forced major change was applied.

## Known behavior to validate on devices

- A reminder created fully offline receives its local phone schedule only after the queued mutation reaches Supabase.
- Local alerts are scheduled on a rolling 60-day horizon and refreshed when Janani returns to the foreground.
- Production push delivery depends on EAS/Expo credentials and physical-device behavior even though the project is now linked.
- Account deletion and family unlinking have backend verification but still require end-to-end app acceptance on disposable accounts.

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