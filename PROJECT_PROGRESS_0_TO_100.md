# Janani Project Progress

**Overall progress: 42%**

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
- Reminder editing screen added with notification replacement and safe rescheduling
- Pregnancy journal timeline, mood and private/shared controls added
- Journal deletion and journal editing screens added
- Thinking-of-you partner message and acknowledgement added
- Realtime publication and subscriptions added for reminders, logs, journal entries and partner nudges
- Supabase Row Level Security protects family, pregnancy and private journal data
- GitHub Actions typecheck workflow foundation added

## Database modules deployed

- profiles
- families
- family_members
- pregnancies
- reminders
- reminder_logs
- journal_entries
- partner_nudges

## Current usable flow

1. User registers or signs in.
2. Mother creates a family and pregnancy profile, or partner joins with an invite code.
3. Home shows pregnancy progress.
4. Family members create, complete, pause, resume or delete reminders.
5. Reminder edits replace the prior local notification schedule.
6. Users create private or shared journal entries and can edit or delete their own entries.
7. Mother and partner exchange caring nudges.
8. Shared data refreshes through Supabase realtime.

## Next milestone

Phase 6 cross-device delivery and device readiness:

1. Connect edit actions visibly from reminder and journal cards
2. Commit a deterministic npm lockfile and run CI successfully
3. Native date and time pickers
4. Push-token registration and cross-device nudge notifications
5. Offline cache and sync queue foundation
6. Android home-screen widget architecture
7. Android development build and physical-device verification

## Safety principles

- Medical guidance is educational and trimester-aware, never diagnostic.
- Urgent warning signs must direct users to qualified medical care.
- Medicine details must follow the prescribing clinician.
- Journal sharing is explicit and private by default.
- Partner access is explicit, revocable, and protected by RLS.
- No service-role keys or production secrets may enter the mobile app or repository.
