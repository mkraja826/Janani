# Janani Project Progress

**Overall progress: 16%**

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
- Persistent Supabase authentication provider added
- Email sign-up and sign-in screen added
- Mother and partner onboarding forms added
- Atomic mother family and pregnancy creation RPC deployed
- Secure partner invite-code joining RPC deployed
- Role-aware protected home foundation added
- Mother-only partner invite code display added
- Supabase TypeScript types generated and schema compatibility reviewed

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

1. User opens the emotional Janani welcome screen.
2. User creates an account or signs in.
3. Mother creates a private family and pregnancy profile.
4. Janani generates a private partner invite code.
5. Partner signs in and joins using that code.
6. Both reach a role-aware family home protected by Supabase RLS.

## Next milestone

Phase 2 daily care foundation:

1. Replace manual date text fields with native date pickers
2. Calculate pregnancy week and trimester from due date/LMP
3. Add medication reminder creation and daily schedule
4. Add local notification permissions and scheduling
5. Add reminder completion, skip and missed-state tracking
6. Add partner-visible reminder status
7. Add automated typecheck and lint workflow

## Safety principles

- Medical guidance is educational and trimester-aware, never diagnostic.
- Urgent warning signs must direct users to qualified medical care.
- Partner access is explicit, revocable, and protected by RLS.
- No service-role keys or production secrets may enter the mobile app or repository.
