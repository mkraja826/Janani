# Janani Project Progress

**Overall progress: 61%**

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
- Notification taps now deep-link to the intended Janani screen
- Pregnancy journal timeline, mood and private/shared controls added
- Journal edit and delete actions connected for authors
- Thinking-of-you partner message and acknowledgement added
- Realtime publication and subscriptions added for reminders, logs, journal entries and partner nudges
- Device push-token table deployed with owner-only RLS
- Expo push-token registration added after authentication
- Authenticated `send-partner-nudge` Edge Function deployed
- Thinking-of-you messages trigger secure cross-device Expo push delivery
- Invalid Expo device tokens are removed when the push service reports `DeviceNotRegistered`
- Shared JSON cache utility added with failure-safe AsyncStorage handling
- Reminder list and today-status history now load from local cache before network refresh
- Reminder taken/skipped actions use optimistic updates and queue failed writes for retry
- Journal timeline now loads from local cache before network refresh
- Journal deletion uses an optimistic local update and queues failed deletion for retry
- Partner message timeline loads its last saved copy when offline
- Offline mutation queue foundation added with retry-attempt tracking
- Android home-screen widget state and deep-link action contract added
- Expo config plugin now generates the first native Android AppWidget provider, layout, background and provider metadata
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
2. Mother creates a family and pregnancy profile, or partner joins with an invite code.
3. Home shows pregnancy progress.
4. Family members create reminders using the native clock picker and may complete, pause, resume, edit or delete them.
5. Reminder and journal timelines open from saved device data before attempting a network refresh.
6. Failed reminder taken/skipped updates and journal deletions are retained in the local retry queue.
7. Users create private or shared journal entries and can edit or delete their own entries.
8. Supported development builds register a private Expo push token.
9. Mother or partner sends a Thinking-of-you message and Janani sends a cross-device push notification.
10. Tapping a Janani notification opens the relevant reminder or partner connection screen.
11. Expo prebuild can generate the first Android Janani care widget provider and resources.

## Next milestone

Phase 11 synchronization and build verification:

1. Observe and fix the first successful GitHub Actions typecheck run
2. Commit a deterministic npm lockfile from a local install
3. Add a reconnect processor that safely flushes each queued mutation type
4. Add native date pickers in pregnancy setup and journal entry date selection
5. Sync real pregnancy week, next reminder and partner message into Android widget storage
6. Add widget buttons for reminders and Thinking of you
7. Run Expo prebuild and verify generated Android manifest/resources
8. Create an Android development build and test on two physical devices

## Known limitations

- The offline queue stores failed mutations, but automatic reconnect-time flushing is not yet wired into app lifecycle.
- Reminder creation, reminder editing and journal creation still require an active connection.
- The Android widget provider currently displays fallback SharedPreferences values until React Native-to-widget state synchronization is added.
- Native pregnancy and journal date pickers are still pending.
- TypeScript CI and physical Android compilation have not yet been confirmed successful.

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
