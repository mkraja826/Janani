# Janani Project Progress

**Overall progress: 46%**

## Completed

- GitHub repository initialized on `main`
- Expo + React Native + TypeScript foundation added
- Emotional welcome, authentication and role-aware onboarding added
- Secure mother family creation and partner invite joining added
- Pregnancy week, trimester and due-date countdown added
- Daily medicine and care reminders added
- Local notification permissions and daily scheduling added
- Reminder taken, skipped, pause, resume and deletion flows added
- Notification cancellation added for paused or deleted reminders
- Reminder editing connected from reminder cards
- Reminder edits replace the prior phone schedule safely
- Reminder resume now recreates a cancelled local notification
- Pregnancy journal timeline, mood and private/shared controls added
- Journal edit and delete actions connected for authors
- Thinking-of-you partner message and acknowledgement added
- Realtime publication and subscriptions added for reminders, logs, journal entries and partner nudges
- Device push-token table deployed with owner-only RLS
- Expo push-token registration added after authentication
- Supabase Row Level Security protects family, pregnancy and private journal data
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

## Current usable flow

1. User registers or signs in.
2. Mother creates a family and pregnancy profile, or partner joins with an invite code.
3. Home shows pregnancy progress.
4. Family members create, complete, pause, resume, edit or delete reminders.
5. Reminder edits and resumes create the correct local notification schedule.
6. Users create private or shared journal entries and can edit or delete their own entries.
7. Mother and partner exchange caring nudges.
8. Shared data refreshes through Supabase realtime.
9. Supported development builds register an Expo push token for future cross-device delivery.

## Next milestone

Phase 7 cross-device notification delivery and device readiness:

1. Observe and fix the first GitHub Actions typecheck result
2. Commit a deterministic npm lockfile from a local install
3. Deploy authenticated Edge Function for partner nudge push delivery
4. Trigger push delivery after a nudge is saved
5. Native date and time pickers
6. Offline cache and sync queue foundation
7. Android home-screen widget architecture
8. Android development build and physical-device verification

## Safety principles

- Medical guidance is educational and trimester-aware, never diagnostic.
- Urgent warning signs must direct users to qualified medical care.
- Medicine details must follow the prescribing clinician.
- Journal sharing is explicit and private by default.
- Partner access is explicit, revocable, and protected by RLS.
- Push tokens are private per user and never exposed to other family members.
- No service-role keys or production secrets may enter the mobile app or repository.
