# Janani Project Progress

**Overall progress: 32%**

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
- Home navigation connected to Reminders, Journal and Thinking of You

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
4. Family members create and complete daily reminders.
5. Either user can create a journal entry with a mood.
6. The author chooses whether an entry stays private or is shared.
7. Mother and partner can send a one-tap caring message.
8. The recipient can acknowledge it with a heart.

## Next milestone

Phase 4 reliability and cross-device connection:

1. Native date and time pickers
2. Reminder editing, pausing, deletion and notification cancellation
3. Journal editing and deletion
4. Push-token registration and cross-device nudge notifications
5. Realtime updates for reminders, journal and nudges
6. Android home-screen widget architecture
7. Offline cache and sync queue foundation
8. Automated typecheck, lint and Android build verification

## Safety principles

- Medical guidance is educational and trimester-aware, never diagnostic.
- Urgent warning signs must direct users to qualified medical care.
- Medicine names, doses and duration are user-entered and must follow the prescribing clinician.
- Journal sharing is explicit and private by default.
- Partner access is explicit, revocable, and protected by RLS.
- No service-role keys or production secrets may enter the mobile app or repository.
