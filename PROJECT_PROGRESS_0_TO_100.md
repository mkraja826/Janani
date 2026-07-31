# Janani Project Progress

**Overall progress: 88%**

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
- Settings & Account screen linked from Home
- JSON account data export through the native share sheet
- Partner leave-family workflow that preserves the mother’s pregnancy space
- Mother-controlled partner disconnection with automatic invite-code rotation
- Authenticated account deletion Edge Function requiring exact DELETE confirmation
- Role-specific deletion warnings: mother deletion removes the family pregnancy space; partner deletion preserves it
- Android version code and explicit notification/widget-related permission metadata
- EAS development APK, preview APK, and production AAB build profiles
- Public legal-site source for privacy policy, terms, medical disclaimer, and legal landing page
- GitHub Pages deployment workflow for the legal site
- In-app links to the public Privacy Policy and Terms pages
- Play Console Data Safety working sheet matched to current implementation
- Internal-testing release notes
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
- leave_family RPC
- disconnect_partner RPC
- send-partner-nudge Edge Function
- delete-account Edge Function

## Release gates still open

1. Generate and commit a deterministic `package-lock.json` from a network-enabled local install.
2. Obtain a successful TypeScript and Expo prebuild run.
3. Compile the Android development build and fix native errors.
4. Test account deletion, partner unlinking, and export using disposable test accounts.
5. Test mother and partner journeys on two physical Android devices.
6. Test widget refresh, deep links, reminder scheduling, push delivery, reboot recovery, and offline replay.
7. Create final app icon, adaptive icon foreground, splash image, notification icon, and store graphics.
8. Confirm the GitHub Pages legal site is live and replace the support-contact placeholders.
9. Recheck Play Console Data Safety answers against the final dependency tree and current Google wording.
10. Complete closed-testing materials and production signing configuration.

## Known limitations

- Offline reminder creation requires a pregnancy ID cached during an earlier online session.
- A reminder created fully offline receives its local notification after reconnect.
- The generated native widget bridge has not been compiled on Android hardware.
- GitHub has not returned a visible successful quality CI status.
- This execution environment cannot perform a direct clone, npm install, deterministic lockfile generation, Expo prebuild, or Android compilation.
- GitHub Pages deployment has been configured but the public URL has not yet been confirmed live.
- Legal pages still contain a support-contact placeholder that must be replaced before public release.
- Account deletion and unlinking are implemented but not yet verified on disposable physical-device accounts.
- JSON export currently uses the platform share sheet; formatted PDF export is not yet included.

## Safety principles

- Janani is supportive and educational, never diagnostic.
- Medicine details must follow the prescribing clinician.
- Urgent concerns must direct users to qualified medical or emergency care.
- Journal sharing is explicit and private by default.
- Partner access is explicit, revocable, and protected by RLS.
- Push tokens are private per user.
- Offline data is a local convenience copy; Supabase remains authoritative.
- Destructive account actions require explicit role-aware warnings and typed confirmation.
- No service-role keys, passwords, signing files, or production secrets may enter the mobile repository.
