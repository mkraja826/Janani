# Janani Production Candidate — 2026-08-15

Branch: `production/janani-main-candidate-20260815`
Base: clean `main`

This branch is the controlled production path. It must not merge the full `integration/merge-all-janani-20260814-235800` branch directly.

## Rule

Bring production-safe changes into this branch in small groups. After every group, run:

```bash
npm ci
npm run validate:production-config
npm run audit:production
npm run typecheck
npm run lint
npx expo-doctor
npx expo config --type public
```

Only merge this branch to `main` after the checks pass and physical-device release validation is recorded.

## Milestone 1 — Auth confirmation callback

Status: code added, local/CI validation pending.

Included changes:

- `app/auth.tsx` now sends Supabase email confirmation links to `janani://auth/callback`.
- Auth requests use a timeout so the app does not hang indefinitely on weak networks.
- `app/auth/callback.tsx` handles Supabase confirmation links, code exchange, session setup, and role-aware routing.
- `src/providers/AuthGate.tsx` treats `/auth/callback` as a public route so confirmation links are not blocked before a session exists.

Validation still required:

- Fresh sign-up with email confirmation on release/debug build.
- Expired/invalid confirmation link handling.
- Confirmed user with no family routes to onboarding.
- Confirmed existing family member routes to home.

## Milestone 2 — Android config cleanup

Status: config cleanup added, local/CI validation pending.

Included changes:

- Removed `android.edgeToEdgeEnabled` from `app.json` to eliminate the Expo-manifest warning while keeping the existing Android package, permissions, adaptive icon, Firebase configuration, widget plugin and release-signing plugin unchanged.
- Reviewed old `fix/android-debug-warnings`; it is intentionally not merged because it is far behind current `main` and only contains an old `app/home.tsx` change plus progress-doc edits.
- Reviewed the signed-AAB workflow and release-signing plugin already present on this candidate branch; no replacement was made because the candidate plugin already includes the safer EAS Build guard.

Validation still required:

- `npx expo config --type public` must resolve without the `edgeToEdgeEnabled` warning.
- `npm run typecheck`, `npm run lint`, and `npx expo-doctor` must pass after pulling this branch locally.
- Signed AAB workflow still requires GitHub production environment secrets/vars before it can be used for a real release build.
