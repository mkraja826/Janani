# Janani Project Progress

**Overall progress: 81%**

## Completed

- Expo + React Native + TypeScript mobile foundation
- Secure Supabase authentication, family linking, pregnancy profiles, RLS, realtime, and Edge Functions
- Mother and partner role-aware onboarding
- Pregnancy week, trimester, and due-date progress
- Daily reminders with local notifications, completion history, pause, resume, edit, and deletion
- Native date and time pickers
- Pregnancy journal with private-by-default partner sharing
- Thinking-of-you messages, acknowledgements, realtime updates, and cross-device push delivery
- Offline cache and idempotent queue for reminder status/create/edit and journal create/edit/delete
- Pending-sync banner, automatic foreground replay, and manual Retry control
- Android home-screen widget provider, native bridge, state synchronization, refresh, and deep-link buttons
- Notification-tap deep linking
- Supabase push-token privacy and invalid-token cleanup
- In-app Safety & Privacy screen linked from Home
- Android version code and explicit notification/widget-related permission metadata
- EAS development APK, preview APK, and production AAB build profiles
- Privacy-policy draft
- Two-device Android acceptance checklist
- Updated project README and release status
- GitHub Actions workflow for TypeScript, Expo configuration, Android prebuild, and widget-generation validation

## Backend modules deployed

- profiles
- families
- family_members
- pregnancies
- reminders
- reminder_logs
- journal_entries
- partner_nudges
- device_push_tokens
- authenticated family/reminder/journal RPCs
- send-partner-nudge Edge Function

## Release gates still open

1. Generate and commit a deterministic `package-lock.json` from a network-enabled local install.
2. Obtain a successful TypeScript and Expo prebuild run.
3. Compile the Android development build and fix native errors.
4. Test mother and partner journeys on two physical Android devices.
5. Test widget refresh, deep links, reminder scheduling, push delivery, reboot recovery, and offline replay.
6. Create final app icon, adaptive icon foreground, splash image, notification icon, and store graphics.
7. Add and test account deletion and family unlinking.
8. Publish the final privacy policy at a public URL and replace all placeholders.
9. Complete Play Console data-safety answers and closed-testing materials.

## Known limitations

- Offline reminder creation requires a pregnancy ID cached during an earlier online session.
- A reminder created fully offline receives its local notification after reconnect.
- The generated native widget bridge has not been compiled on Android hardware.
- GitHub has not returned a visible successful CI status.
- This execution environment cannot perform a direct clone, npm install, deterministic lockfile generation, Expo prebuild, or Android compilation.
- The current privacy policy is a draft and is not yet published.
- Account deletion is not yet implemented; public release is blocked until it is tested.

## Safety principles

- Janani is supportive and educational, never diagnostic.
- Medicine details must follow the prescribing clinician.
- Urgent concerns must direct users to qualified medical or emergency care.
- Journal sharing is explicit and private by default.
- Partner access is explicit, revocable, and protected by RLS.
- Push tokens are private per user.
- Offline data is a local convenience copy; Supabase remains authoritative.
- No service-role keys, passwords, signing files, or production secrets may enter the mobile repository.
