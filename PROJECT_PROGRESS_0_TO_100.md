# Janani Project Progress

**Overall progress: 64%**

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
- Offline mutation processor added for reminder status, journal deletion and partner acknowledgement
- Queued mutations flush after sign-in and whenever the app returns to the foreground
- Android home-screen widget state and deep-link action contract added
- Expo config plugin generates the first native Android AppWidget provider and resources
- Widget synchronization component now prepares live pregnancy week, next reminder and latest partner message
- Supabase Row Level Security protects family, pregnancy, journal and token data
- GitHub Actions typecheck workflow made runnable without a lockfile

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
6. Failed reminder status, journal deletion and partner acknowledgement writes are retained and retried when the app becomes active.
7. Users create journal memories for today or an earlier date using the native date picker.
8. Mother and partner exchange cross-device caring notifications.
9. Tapping a Janani notification opens the relevant screen.
10. Expo prebuild can generate the native Android Janani care widget provider and resources.
11. WidgetSync prepares the latest pregnancy, reminder and partner-message state for the native bridge.

## Next milestone

Phase 12 native bridge and build verification:

1. Generate and register the Android `JananiWidget` React Native bridge
2. Persist WidgetSync state into Android SharedPreferences and force widget refresh
3. Add separate widget buttons for Reminders and Thinking of you
4. Add idempotency protection for offline journal creation/editing
5. Commit a deterministic npm lockfile from a local install
6. Run Expo prebuild and verify generated Android manifest/resources
7. Fix all TypeScript and Android compilation errors
8. Create an Android development build and test mother/partner flows on two physical devices

## Known limitations

- Reminder creation/editing and journal creation/editing still require an active connection.
- Offline journal-save replay is intentionally held until an idempotency key is added.
- WidgetSync is mounted, but the native `JananiWidget` bridge still needs to be generated before live values reach SharedPreferences.
- TypeScript CI, Expo prebuild and physical Android compilation have not yet been confirmed successful.

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
