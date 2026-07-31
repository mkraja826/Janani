# Janani Project Progress

**Overall progress: 71%**

## Completed

- GitHub repository initialized on `main`
- Expo + React Native + TypeScript foundation added
- Emotional welcome, authentication and role-aware onboarding added
- Secure mother family creation and partner invite joining added
- Pregnancy week, trimester and due-date countdown added
- Daily medicine and care reminders added
- Local notification permissions and daily scheduling added
- Reminder taken, skipped, pause, resume, edit and deletion flows added
- Reminder edits and resumes safely replace local notification schedules
- Native reminder time picker added
- Native expected due-date and optional LMP pickers added to mother onboarding
- Native journal memory-date picker added
- Notification taps deep-link to the intended Janani screen
- Pregnancy journal timeline, mood and private/shared controls added
- Journal edit and delete actions connected for authors
- Idempotent journal creation RPC and per-author mutation key protection deployed
- New journal entries queue safely during transient network failures without duplicate replay
- Thinking-of-you partner message and acknowledgement added
- Realtime publication and subscriptions added for reminders, logs, journal entries and partner nudges
- Device push-token table deployed with owner-only RLS
- Expo push-token registration added after authentication
- Authenticated `send-partner-nudge` Edge Function deployed
- Thinking-of-you messages trigger secure cross-device Expo push delivery
- Invalid Expo device tokens are removed when Expo reports `DeviceNotRegistered`
- Shared JSON cache utility added with failure-safe AsyncStorage handling
- Reminder list and today-status history load from local cache before network refresh
- Reminder taken/skipped actions use optimistic updates and queue failed writes
- Journal timeline loads from local cache and failed deletions are queued
- Partner message timeline loads its last saved copy when offline
- Offline mutation processor handles reminder status, journal create/delete and partner acknowledgement
- Queued mutations flush after sign-in and whenever the app returns to the foreground
- Android home-screen widget state and deep-link action contract added
- Expo config plugin generates the Android AppWidget provider and resources
- Native `JananiWidgetModule` and `JananiWidgetPackage` generation added
- MainApplication registration is patched automatically during Expo prebuild
- WidgetSync writes pregnancy week, family, next reminder and partner message to native SharedPreferences
- Widget refresh is forced immediately after state updates
- Widget buttons open Reminders and Thinking of you directly
- CI validates TypeScript, Expo config, Android prebuild and generated widget files
- Supabase Row Level Security protects family, pregnancy, journal and token data

## Database modules deployed

- profiles
- families
- family_members
- pregnancies
- reminders
- reminder_logs
- journal_entries
- partner_nudges
- device_push_tokens

## Edge Functions deployed

- send-partner-nudge (version 2)

## Current usable flow

1. User registers or signs in.
2. Mother creates a family using native due-date and LMP pickers, or partner joins with an invite code.
3. Home shows pregnancy progress.
4. Family members create reminders with a native clock picker and may complete, pause, resume, edit or delete them.
5. Reminder, journal and partner timelines can open from saved device data.
6. Failed reminder status, journal create/delete and partner acknowledgement writes are retained and retried when the app becomes active.
7. Journal creation uses a stable client mutation ID, so replay cannot create duplicate memories.
8. Mother and partner exchange cross-device caring notifications.
9. Tapping a Janani notification opens the relevant screen.
10. Expo prebuild generates the Android widget provider, React Native bridge and resources.
11. WidgetSync writes live pregnancy, reminder and partner-message data and refreshes installed widgets.
12. Widget buttons open the corresponding Janani care screens.

## Next milestone

Phase 14 compilation and release readiness:

1. Obtain and inspect a successful GitHub Actions run
2. Commit a deterministic npm lockfile from a network-enabled local install
3. Add idempotent offline journal editing
4. Add offline reminder creation with safe local-notification reconciliation
5. Verify Expo prebuild output and Android manifest on a local clone
6. Compile the Android development build
7. Test widget updates, deep links, reminders and push notifications on two physical devices
8. Prepare app icons, splash assets, privacy policy and closed-testing checklist

## Known limitations

- Reminder creation/editing and journal editing still require an active connection.
- Offline reminder creation needs reconciliation between the local notification identifier and the final Supabase reminder ID.
- The generated native widget bridge has not yet been compiled on Android hardware.
- GitHub has not yet returned a successful CI status for the repository.
- This execution environment cannot resolve GitHub through direct git clone, so a local npm install, deterministic lockfile, Expo prebuild and Android compile could not be performed here.
- A physical Android development build and two-device mother/partner test remain pending.

## Safety principles

- Medical guidance is educational and trimester-aware, never diagnostic.
- Urgent warning signs must direct users to qualified medical care.
- Medicine details must follow the prescribing clinician.
- Journal sharing is explicit and private by default.
- Partner access is explicit, revocable, and protected by RLS.
- Push tokens are private per user and never exposed to other family members.
- The push Edge Function authenticates every request before resolving a recipient.
- Offline data is a local convenience copy and Supabase remains the authoritative shared record.
- No service-role keys or production secrets may enter the mobile app or repository.
