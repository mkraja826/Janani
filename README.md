<div align="center">

# Janani

### Pregnancy support designed for mothers and their partners

A privacy-conscious mobile experience that combines pregnancy progress, reminders, journaling, partner connection, offline support, notifications, and an Android home-screen widget.

**React Native · Expo · TypeScript · Supabase · PostgreSQL**

</div>

---

## Overview

Janani is a pregnancy-support application built around a simple idea: everyday pregnancy support should feel useful, private, calm, and human.

The product supports both mothers and invited partners, combining practical daily-care tools with a warm communication style while maintaining a clear boundary between supportive software and professional medical care.

## Product Highlights

- Mother and partner role-based onboarding
- Private family invitation and account linking
- Pregnancy week, trimester, and due-date progress
- Medicine and custom reminders with local notifications
- Reminder completion, pause, resume, editing, and deletion
- Pregnancy journal with private-by-default partner sharing
- Thinking-of-you messages and acknowledgements
- Cross-device push notifications and Realtime invalidation
- Offline cache with idempotent queued writes and retry support
- Android home-screen widget for pregnancy, reminder, and partner state
- User data export, partner unlinking, and permanent account deletion
- In-app privacy and safety information

## Architecture

```text
Mobile App (Expo / React Native)
        │
        ├── Expo Router
        ├── Local encrypted state / offline queue
        ├── Notifications
        └── Android AppWidget
        │
        ▼
Supabase
        ├── Authentication
        ├── PostgreSQL
        ├── Row Level Security
        ├── Realtime
        └── Edge Functions
```

The application is designed around role-aware data access, private family relationships, offline resilience, and explicit ownership of personal data.

## Technology

| Area | Technology |
|---|---|
| Mobile | React Native 0.81 · Expo 54 |
| Language | TypeScript |
| Navigation | Expo Router |
| Backend | Supabase |
| Database | PostgreSQL |
| Realtime | Supabase Realtime |
| Server logic | Supabase Edge Functions |
| State | Zustand |
| Local persistence | AsyncStorage · SecureStore · encrypted per-user state |
| Notifications | Expo Notifications |
| Native integration | Android AppWidget via Expo config plugin |
| Builds | EAS Build |

## Privacy & Security

Janani is designed for sensitive personal information, so privacy is treated as an architectural requirement rather than only a UI feature.

Current safeguards include:

- role-aware Row Level Security;
- restricted database grants;
- private Realtime invalidation;
- protected push-token registration;
- replay-safe partner interactions;
- encrypted per-user local state;
- account unlinking and deletion flows;
- user-accessible JSON data export.

Production secrets, service-role keys, signing files, and database credentials must never be committed to the repository.

## Safety Boundary

Janani provides supportive reminders and educational information. It does **not** diagnose, prescribe, monitor a medical condition, or replace a doctor, emergency service, or qualified healthcare professional.

## Repository Structure

```text
app/                     Expo Router screens
src/features/            Domain modules and synchronization
src/lib/                 Supabase, cache, and offline infrastructure
src/theme/               Design tokens
plugins/                 Android widget config plugin
supabase/migrations/     Versioned database schema
docs/                    Architecture, privacy, safety, and testing
```

## Local Development

### Requirements

- Node.js 22+
- Android development environment or compatible Expo/EAS workflow
- A configured Supabase development project

### Setup

```bash
git clone https://github.com/mkraja826/Janani.git
cd Janani
npm ci
cp .env.example .env
npm run typecheck
npm run lint
npx expo start
```

Add the required Supabase development configuration to `.env` before running backend-connected functionality.

For a native Android development build:

```bash
npx expo prebuild --platform android --clean
npx expo run:android
```

## Quality & Release Process

The repository includes production-readiness work covering database migrations, privacy and safety documentation, Android testing, deterministic dependency installation, static checks, account deletion, data export, and Play Console preparation.

Janani is currently in **production-readiness verification** and should not be represented as publicly launched until final device acceptance testing, production signing, release AAB verification, and store approval are complete.

Useful project documentation includes:

- `PROJECT_PROGRESS_0_TO_100.md`
- `docs/ANDROID_TWO_DEVICE_TEST_CHECKLIST.md`
- `docs/PRIVACY_POLICY_DRAFT.md`
- `docs/PLAY_CONSOLE_DATA_SAFETY.md`

## Product Direction

Janani is being developed as more than a pregnancy tracker. The longer-term product direction is a supportive family platform that can grow from pregnancy planning through pregnancy, delivery, and eventually early parenting experiences.

---

<div align="center">

**Built as part of the MiCirql product portfolio.**

</div>
