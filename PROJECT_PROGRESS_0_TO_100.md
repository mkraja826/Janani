# Janani Project Progress

**Overall progress: 8%**

## Completed

- GitHub repository initialized on `main`
- Expo + React Native + TypeScript foundation added
- Expo Router root layout added
- Emotional welcome screen for mother and partner paths added
- Janani color, spacing, typography and radius tokens added
- Supabase client foundation added
- Environment variable template and secret-safe `.gitignore` added
- Janani Supabase project verified healthy in `ap-south-1`
- Core database schema deployed
- Row Level Security enabled
- Auth profile trigger added
- Family membership access helpers added
- Security hardening migration applied

## Database modules deployed

- profiles
- families
- family_members
- pregnancies
- reminders
- reminder_logs
- journal_entries
- partner_nudges

## Next milestone

Phase 1 onboarding and authentication:

1. Email/OTP authentication screens
2. Mother versus partner onboarding
3. Family creation and secure invite linking
4. Pregnancy setup and due-date calculation
5. Session routing and protected app shell
6. Generate and commit Supabase TypeScript database types
7. Add automated typecheck and lint workflow

## Safety principles

- Medical guidance is educational and trimester-aware, never diagnostic.
- Urgent warning signs must direct users to qualified medical care.
- Partner access is explicit, revocable, and protected by RLS.
- No service-role keys or production secrets may enter the mobile app or repository.
