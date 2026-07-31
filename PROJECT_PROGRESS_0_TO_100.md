# Janani Project Progress

**Overall progress: 24%**

## Completed

- GitHub repository initialized on `main`
- Expo + React Native + TypeScript foundation added
- Expo Router root layout added
- Emotional welcome screen for mother and partner paths added
- Janani color, spacing, typography and radius tokens added
- Supabase client foundation added
- Environment variable template and secret-safe `.gitignore` added
- Janani Supabase project verified healthy in `ap-south-1`
- Core database schema deployed with Row Level Security
- Persistent authentication, mother onboarding and partner linking added
- Atomic family creation and secure invite joining RPCs deployed
- Role-aware protected home foundation added
- Pregnancy week, day, trimester and due-date countdown calculation added
- Daily reminder list added
- Medicine, hydration, appointment, nutrition and custom reminder creation added
- Reminder duration and daily time support added
- Local notification permission, Android channel and daily scheduling added
- Foreground notification presentation configured
- Taken and skipped reminder-state tracking added
- Duplicate occurrence history prevented at database level
- Partner-visible shared reminder status supported through family RLS
- Medical reminder safety copy added

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
3. Home shows the current pregnancy week and trimester.
4. Either family member opens Reminders.
5. A daily care or medicine reminder is created with time and duration.
6. Janani schedules a local phone notification after permission is granted.
7. Either linked family member can mark the occurrence taken or skipped.

## Next milestone

Phase 3 journal and partner connection:

1. Native date and time pickers
2. Reminder editing, pausing and notification cancellation
3. Pregnancy journal create, edit and timeline screens
4. Mood selection and optional partner sharing
5. Thinking-of-you partner nudge flow
6. Push-token registration for cross-device nudges
7. Home-screen widget architecture for Android and iOS
8. Automated typecheck and lint workflow

## Safety principles

- Medical guidance is educational and trimester-aware, never diagnostic.
- Urgent warning signs must direct users to qualified medical care.
- Medicine names, doses and duration are user-entered and must follow the prescribing clinician.
- Partner access is explicit, revocable, and protected by RLS.
- No service-role keys or production secrets may enter the mobile app or repository.
