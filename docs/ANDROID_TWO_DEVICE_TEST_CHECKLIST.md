# Janani Android Two-Device Acceptance Checklist

**Current gate status:** Not completed.

Use one physical Android device as **Mother** and a second as **Partner**. Use disposable accounts only. Record the app version/build, APK or AAB checksum, device model, Android version, time zone, test date, and tester for every run. Keep screenshots and logs free of personal, pregnancy, medication, invite-code, credential, and token data.

## Preconditions

- [x] Final TypeScript, lint, Expo Doctor, dependency, Edge Function, Expo config, diff, and legal-site checks pass.
- [x] A clean Android prebuild and native x86_64 compilation pass from the final application/native source.
- [ ] Both devices install the same signed or internally distributed build.
- [ ] Notification permission is available on both devices.
- [ ] The test accounts and family are uniquely identified as disposable.
- [ ] The unknown pre-existing live Auth/profile account is not used, changed, or deleted.
- [ ] Testers know that Janani is not a medical device and critical reminders need an independent backup.

Local build evidence: debug APK size 46,080,516 bytes; SHA-256 `16d05f331d5392a8745b44131a6c510ae0c6ddf326277259f330efcb2721c088`. This checksum is not a substitute for a signed distribution build.

## Installation and authentication

- [ ] Confirm clean launch, splash behavior, readable safe areas, and no immediate crash on both devices.
- [ ] Register separate accounts with passwords that meet the eight-character letters-and-digits policy.
- [ ] Complete email confirmation when enabled and verify the deep-link or return-to-sign-in behavior.
- [ ] Verify an unconfirmed account cannot silently enter protected screens.
- [ ] Sign out and sign in again; confirm each device restores only its own role, family, caches, queues, reminder registry, push state, and widget state.
- [ ] Switch from one test account to another on a device and confirm no previous user's data flashes or remains.

## Family onboarding and membership

- [ ] Mother creates a family with a plausible due date and optional LMP/measurement values.
- [ ] Confirm pregnancy week and trimester are plausible for the entered date.
- [ ] Mother retrieves the 20-character invite code.
- [ ] Partner joins with the code; confirm an invalid, malformed, or reused code produces a safe error.
- [ ] Confirm the partner cannot read the invite code, LMP, height, or pre-pregnancy weight.
- [ ] Confirm neither account can see data from an unrelated disposable family.
- [ ] Background one device, change membership on the other, then foreground/reconnect; stale family access must be purged.

## Reminders and local notifications

- [ ] Create medicine, hydration, appointment, nutrition, and custom reminders.
- [ ] Verify date/time pickers, selected weekdays, start/end dates, duration validation, and time-zone behavior.
- [ ] Confirm local notifications arrive near the selected time with private lock-screen copy.
- [ ] Tap a notification and confirm it opens only an allowed Janani route.
- [ ] Mark a reminder taken or skipped and confirm the other device refreshes.
- [ ] Test pause, resume, edit, and delete from each permitted role.
- [ ] Confirm a mother can delete a family reminder created by the linked partner.
- [ ] Turn internet off, queue status/edit/create actions, reconnect, and confirm pending sync clears without duplicates.
- [ ] Leave a device idle or backgrounded across a reconciliation interval and confirm local schedules match server state on return.
- [ ] Change the device time zone and verify the documented local-time behavior.
- [ ] Reboot and verify the reminder registry and upcoming alerts recover.

## Journal

- [ ] Create a private entry and confirm the partner cannot see it.
- [ ] Enable sharing and confirm the partner can see it.
- [ ] Edit, unshare, and delete entries; confirm each change reaches the other device.
- [ ] Create and edit while offline, force-close, reconnect, and confirm no duplicate entries or duplicate edits.
- [ ] Verify journal dates cannot be set in the future.
- [ ] Disconnect or leave the family and confirm previously shared journal content is no longer accessible to the former partner.

## Thinking of you and push

- [ ] Send every quick message from both roles.
- [ ] Confirm history refreshes on both devices through private family invalidation.
- [ ] Confirm push delivery while the recipient app is foregrounded, backgrounded, and closed.
- [ ] Tap the push notification and confirm it opens Thinking of you.
- [ ] Send a heart acknowledgement and confirm the sender sees it.
- [ ] Reuse the same client mutation ID and confirm it does not create a second nudge or send a second push.
- [ ] Disconnect the partner, then confirm neither side can replay or acknowledge a former-family nudge.
- [ ] Sign out, switch accounts, and confirm a push token cannot remain active for or be taken over from the previous account.
- [ ] Confirm an invalid/stale push token does not break message creation.

## Android widget

- [ ] Add the Janani care widget to each home screen.
- [ ] Confirm pregnancy week, family name, next reminder, and partner-message state update.
- [ ] Tap the widget body and confirm Home opens.
- [ ] Tap Reminders and Thinking of you buttons and confirm the correct deep links.
- [ ] Resize the widget and check clipping, readability, color contrast, and touch targets.
- [ ] Sign out and confirm protected widget content clears.
- [ ] Change or remove family membership and confirm stale widget content clears.
- [ ] Switch accounts on the same device and confirm the previous user's widget state never reappears.
- [ ] Reboot and confirm widget data recovers only for the current account.

## Offline and recovery

- [ ] Open reminders, journal, and partner history without internet after each has been cached.
- [ ] Confirm an offline or pending-sync message appears where appropriate.
- [ ] Queue multiple ordered edits, use manual Retry after reconnecting, and confirm server order is preserved.
- [ ] Force-close Janani with queued changes, reopen as the same account, and confirm replay.
- [ ] Sign out with queued work and verify the app warns before discard or preserves only the intended same-user queue.
- [ ] Switch accounts and confirm queued calls cannot execute with the new account's session.
- [ ] Confirm repeated retries do not create duplicate reminders, journal entries, or partner messages.
- [ ] Confirm permanent failures move out of the retry loop and are surfaced safely.

## Export, unlinking, and deletion

- [ ] Export JSON as the mother; confirm it contains only records that account may read, including mother-private pregnancy fields.
- [ ] Export JSON as the partner; confirm it excludes invite code, LMP, height, and pre-pregnancy weight.
- [ ] Mother disconnects the partner; confirm the invite code rotates and former access disappears on both devices.
- [ ] Rejoin with the old invite code and confirm it fails.
- [ ] Partner leaves a family; confirm the mother's pregnancy space remains intact.
- [ ] Create a third disposable account that has no family membership and verify it can reach the onboarding deletion control.
- [ ] For each deletion role, type `DELETE`, enter the current password, and confirm an incorrect password is rejected without deleting data.
- [ ] Delete a disposable partner account and confirm the mother's family space remains.
- [ ] Delete a disposable mother account and confirm its family pregnancy space and dependent shared records are removed.
- [ ] Delete the no-family disposable account and confirm it can no longer authenticate.
- [ ] After every deletion, confirm local caches, queues, push registration, reminder schedules, and widget state are cleared.
- [ ] Confirm deleted accounts cannot sign back in and that only the exact disposable test records were removed.

## Privacy, safety, and resilience

- [ ] Verify journals are private by default.
- [ ] Confirm push tokens, access tokens, internal IDs, and service errors are never shown to users.
- [ ] Confirm medicine text does not imply prescription, diagnosis, monitoring, or emergency response.
- [ ] Confirm safety, privacy, terms, support, and account-deletion links are reachable in the tested release environment.
- [ ] Deny notification permission and verify the app remains usable with a clear explanation.
- [ ] Interrupt connectivity during onboarding, deletion, nudge send, and export; verify failures are recoverable and do not expose secrets.
- [ ] Confirm sign-out and membership revocation remove access to every protected screen.

## Acceptance evidence

For every failed item, capture a privacy-safe issue with build identifier, device/OS, exact steps, expected result, actual result, and relevant sanitized logs. A retry without identifying the cause does not close a release blocker.

## Release gate

Do not promote a build beyond controlled internal testing until:

- [ ] all static and native build checks pass on the exact revision;
- [ ] two complete mother/partner runs pass without a critical crash;
- [ ] family isolation, mother-private fields, and private journal behavior are proven;
- [ ] reminder, push, offline replay, reconnect, deletion, and widget tests pass on both devices;
- [ ] production signing and a release AAB are verified;
- [ ] leaked-password protection is enabled and verified in the live Supabase Auth settings; if the current plan cannot provide it, release remains blocked until that risk is resolved; and
- [ ] the public privacy-policy and account-deletion URLs are live, accurate, and entered into the relevant Play Console fields.
