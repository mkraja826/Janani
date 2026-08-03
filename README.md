# Janani

Janani is a pregnancy-support mobile application for mothers and invited partners. It combines practical daily-care tools with a warm, reassuring voice inspired by a caring grandmother.

## Current capabilities

- Mother and partner role-based onboarding
- Private family invitation linking
- Pregnancy week, trimester, and due-date progress
- Medicine and custom reminders with local notifications
- Reminder completion, pause, resume, edit, and deletion
- Pregnancy journal with private-by-default partner sharing
- Thinking-of-you messages, acknowledgements, realtime invalidation, and cross-device push support
- Offline cache, idempotent queued writes, pending-sync indicator, and manual retry
- Android home-screen widget with pregnancy, reminder, and partner-message state
- JSON data export, partner unlinking or leaving, and permanent account deletion
- In-app safety and privacy information

## Safety boundary

Janani provides supportive reminders and educational information. It does not diagnose, prescribe, monitor a medical condition, or replace a doctor, emergency service, or qualified healthcare professional.

## Technology

- Expo + React Native + TypeScript
- Expo Router
- Supabase Auth, PostgreSQL, Realtime, and Edge Functions
- Zustand, AsyncStorage, SecureStore, and encrypted per-user local state
- Expo Notifications
- Native Android AppWidget generated through an Expo config plugin
- EAS Build profiles for development APK, preview APK, and production AAB

## Connected services

- Supabase project `brdjnhfvytdmsnwexras` in the Mumbai region
- 15 source-controlled migrations applied to the live project
- `send-partner-nudge` and `delete-account` deployed as version 5 with JWT verification
- EAS project `@astromicirql/janani` linked through project ID `2897dd94-47bf-4b4c-a7a9-82e40aaa65a1`
- GitHub repository `mkraja826/Janani`

The deployed backend includes role-aware Row Level Security, restricted column grants, private Realtime Broadcast invalidation, protected push-token registration, replay-safe partner nudges, and durable account-deletion cleanup.

## Repository structure

```text
app/                     Expo Router screens
src/features/            Domain modules and synchronization
src/lib/                 Supabase, cache, and offline infrastructure
src/theme/               Design tokens
plugins/                 Android widget config plugin
supabase/migrations/     Versioned database schema
docs/                    Architecture, privacy, safety, and testing
```

## Local setup

1. Copy `.env.example` to `.env`.
2. Add the Janani Supabase project URL and publishable key.
3. Use Node.js 22 or newer and run `npm ci`.
4. Run `npm run typecheck`.
5. Run `npm run lint` and `npx expo-doctor`.
6. Run `npx expo prebuild --platform android --clean`.
7. Run `npx expo run:android` or create an EAS development build.

Never commit service-role keys, database passwords, Android signing files, or production secrets.

## Release status

Janani is in production-readiness verification; it has **not been publicly launched**. The live database hardening, version 5 Edge Functions, EAS linkage, legal-site source, deterministic lockfile, app assets, final static checks, clean Android prebuild, and final-source x86_64 debug build have been verified.

Release approval still requires:

- installation and end-to-end execution on working Android hardware;
- two-device mother/partner, offline, Realtime, push, notification, widget, unlinking, export, and deletion acceptance tests;
- enabling leaked-password protection in the live Supabase Auth settings, subject to dashboard access and plan support;
- production Android signing and a verified AAB;
- enabling GitHub Pages and confirming every privacy, terms, support, and deletion URL is publicly reachable; and
- a passing GitHub review/CI cycle plus final Play Console declarations.

The repository contains a validated legal-site source, but GitHub Pages is not live yet. Do not use the expected Pages URLs in a store listing until they have been published and checked.

See:

- `PROJECT_PROGRESS_0_TO_100.md`
- `docs/ANDROID_TWO_DEVICE_TEST_CHECKLIST.md`
- `docs/PRIVACY_POLICY_DRAFT.md`
- `docs/PLAY_CONSOLE_DATA_SAFETY.md`
