# Janani Android Two-Device Acceptance Checklist

Use one physical Android device as **Mother** and a second as **Partner**. Record device model, Android version, app build number, test date, and tester name for every run.

## Installation and authentication

- Install the same development or preview APK on both devices.
- Confirm clean launch, splash behavior, and no immediate crash.
- Register separate accounts and complete email verification if enabled.
- Confirm sign-out and sign-in restore the correct role and family.

## Family onboarding

- Mother creates a family using due-date and optional LMP pickers.
- Confirm pregnancy week and trimester are plausible for the entered date.
- Mother shares the generated invite code.
- Partner joins using the code.
- Confirm an invalid or reused code produces a safe error.
- Confirm neither account can see data from another family.

## Reminders

- Create medicine, hydration, appointment, nutrition, and custom reminders.
- Verify the native time picker and duration validation.
- Confirm local notifications arrive near the selected time.
- Mark a reminder taken on one device and confirm realtime update on the other.
- Test skip, pause, resume, edit, and delete.
- Turn internet off, mark taken or skipped, then reconnect and confirm pending sync clears.
- Create and edit a reminder offline after the pregnancy has been cached; reconnect and confirm only one shared reminder exists.
- Reboot the device and verify reminders and widget remain available.

## Journal

- Create a private entry and confirm the partner cannot see it.
- Enable sharing and confirm the partner can see it.
- Edit, unshare, and delete entries.
- Create and edit while offline, reconnect, and confirm no duplicate entries or duplicate edits.
- Verify journal dates cannot be set in the future.

## Thinking of you

- Send each quick message from both roles.
- Confirm realtime history on both devices.
- Confirm push notification delivery while recipient app is foregrounded, backgrounded, and closed.
- Tap the notification and confirm it opens Thinking of you.
- Send a heart acknowledgement and confirm the sender sees it.
- Confirm invalid/stale push tokens do not break message creation.

## Android widget

- Add the Janani care widget to each home screen.
- Confirm pregnancy week, family name, next reminder, and partner message update.
- Tap the widget body and confirm Home opens.
- Tap Reminders and Thinking of you buttons and confirm correct deep links.
- Resize the widget and check clipping, readability, and touch targets.
- Reboot and confirm widget data recovers.

## Offline and recovery

- Launch reminders, journal, and partner timeline without internet after they have been cached.
- Confirm a visible offline or pending-sync message appears where appropriate.
- Use manual Retry after reconnecting.
- Force-close Janani with queued changes, reopen, and confirm replay.
- Confirm repeated retries do not create duplicates.

## Privacy and safety

- Verify journal is private by default.
- Confirm push tokens and internal IDs are never displayed.
- Confirm medicine text does not imply prescription or diagnosis.
- Confirm medical disclaimer is visible in the planned legal/about surface.
- Verify sign-out removes access to protected screens.

## Release gate

A build must not enter closed testing until:

- TypeScript validation passes.
- Expo prebuild completes.
- Android debug/development compilation succeeds.
- No critical crash occurs in two full end-to-end runs.
- Mother/partner isolation and private journal behavior are verified.
- Reminder, push, offline replay, and widget tests pass on both devices.
- Privacy-policy URL and account-deletion method are available.
