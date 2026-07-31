# Janani

Janani is a pregnancy-support mobile application for mothers and invited partners. It combines practical daily-care tools with a warm, reassuring voice inspired by a caring grandmother.

## Current capabilities

- Mother and partner role-based onboarding
- Private family invitation linking
- Pregnancy week, trimester, and due-date progress
- Medicine and custom reminders with local notifications
- Reminder completion, pause, resume, edit, and deletion
- Pregnancy journal with private-by-default partner sharing
- Thinking-of-you messages, realtime updates, and cross-device push notifications
- Offline cache, idempotent queued writes, pending-sync indicator, and manual retry
- Android home-screen widget with pregnancy, reminder, and partner-message state
- In-app safety and privacy information

## Safety boundary

Janani provides supportive reminders and educational information. It does not diagnose, prescribe, monitor a medical condition, or replace a doctor, emergency service, or qualified healthcare professional.

## Technology

- Expo + React Native + TypeScript
- Expo Router
- Supabase Auth, PostgreSQL, Realtime, and Edge Functions
- TanStack Query and AsyncStorage
- Expo Notifications
- Native Android AppWidget generated through an Expo config plugin
- EAS Build profiles for development APK, preview APK, and production AAB

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
3. Run `npm install`.
4. Run `npm run typecheck`.
5. Run `npx expo prebuild --platform android --clean`.
6. Run `npx expo run:android` or create an EAS development build.

Never commit service-role keys, database passwords, Android signing files, or production secrets.

## Release status

Product implementation is advanced, but Janani is **not yet release-ready**. A deterministic lockfile, successful TypeScript/Expo prebuild validation, Android compilation, physical two-device testing, final app icon/splash assets, public privacy-policy URL, and tested account deletion flow remain mandatory release gates.

See:

- `PROJECT_PROGRESS_0_TO_100.md`
- `docs/ANDROID_TWO_DEVICE_TEST_CHECKLIST.md`
- `docs/PRIVACY_POLICY_DRAFT.md`
