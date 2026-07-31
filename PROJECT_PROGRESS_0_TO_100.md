# Janani Project Progress

**Overall progress: 38%**

## Completed

- GitHub repository initialized on `main`
- Expo + React Native + TypeScript foundation added
- Expo Router root layout added
- Emotional welcome screen for mother and partner paths added
- Janani design tokens and Supabase client foundation added
- Core database schema deployed with Row Level Security
- Persistent authentication, mother onboarding and partner linking added
- Atomic family creation and secure invite joining RPCs deployed
- Role-aware protected home foundation added
- Pregnancy week, day, trimester and due-date countdown added
- Daily medicine and care reminder creation added
- Local notification permission, Android channel and daily scheduling added
- Taken and skipped reminder-state tracking added
- Pregnancy journal timeline added
- Journal mood selection and entry composer added
- Private versus partner-shared journal control added
- Journal RLS corrected so private entries remain author-only
- Thinking-of-you partner message experience added
- Secure partner nudge send and acknowledgement RPCs deployed
- Reminder pause and resume controls added
- Reminder deletion and scheduled-notification cancellation added
- Journal entry deletion added for authors
- Realtime publication enabled for reminders, reminder logs, journal entries and partner nudges
- Reminder and journal screens subscribe to Supabase realtime changes
- GitHub Actions typecheck workflow added

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
3. Home shows pregnancy week and trimester.
4. Family members create, complete, pause, resume or delete daily reminders.
5. Scheduled local notifications are cancelled when an active reminder is paused or deleted.
6. Either user can create a journal entry with a mood.
7. The author chooses whether an entry stays private or is shared and may delete their own entry.
8. Mother and partner can send and acknowledge caring messages.
9. Shared care data refreshes through Supabase realtime subscriptions.

## Next milestone

Phase 5 cross-device delivery and offline reliability:

1. Fix any failures reported by the new GitHub Actions typecheck
2. Native date and time pickers
3. Reminder editing and safe notification rescheduling
4. Journal editing
5. Push-token registration and cross-device nudge notifications
6. Android home-screen widget architecture
7. Offline cache and sync queue foundation
8. Android development build and device verification

## Safety principles

- Medical guidance is educational and trimester-aware, never diagnostic.
- Urgent warning signs must direct users to qualified medical care.
- Medicine names, doses and duration are user-entered and must follow the prescribing clinician.
- Journal sharing is explicit and private by default.
- Partner access is explicit, revocable, and protected by RLS.
- No service-role keys or production secrets may enter the mobile app or repository.
