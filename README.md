# Janani

Janani is a pregnancy-support mobile application designed for mothers, partners, and trusted caregivers.

## Product promise

Janani combines practical pregnancy support with a warm, reassuring voice inspired by a caring grandmother. It helps families remember medication, appointments, hydration and nutrition, understand trimester-specific guidance, preserve pregnancy memories, and stay emotionally connected.

## Initial scope

- Mother and partner role-based experiences
- Pregnancy profile and trimester timeline
- Medication and custom reminders
- Reminder completion history
- Pregnancy journal with optional partner sharing
- Partner “Thinking of you” nudge and home-screen widget foundation
- Secure family linking
- Supabase authentication, database, realtime and storage
- Safety-first educational content that never replaces professional medical care

## Technology

- Expo + React Native + TypeScript
- Expo Router
- Supabase Auth, PostgreSQL, Realtime and Storage
- TanStack Query for server state
- Zustand for small local UI state
- Expo Notifications for device reminders
- EAS Build for Android and iOS

## Repository structure

```text
app/                     Expo Router screens
src/components/          Reusable UI components
src/features/            Domain modules
src/lib/                 Supabase and shared infrastructure
src/theme/               Design tokens
supabase/migrations/     Versioned database schema
docs/                    Architecture, UX and safety decisions
```

## Setup

1. Copy `.env.example` to `.env`.
2. Add the Janani Supabase project URL and publishable key.
3. Run `npm install`.
4. Run `npx expo start`.

Never commit service-role keys, database passwords, signing files, or production secrets.

## Current milestone

Phase 1 foundation is in progress: secure backend schema, mobile shell, design system, authentication foundation, and role-aware onboarding.
