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
- `npm run typecheck`, `npm run lint`, `npx expo-doctor`, and `npx expo config --type public` pass after pulling.

## Next safe milestones

1. Android debug warning fixes.
2. Release AAB/signing workflow cleanup.
3. Production config validation and legal/support URL readiness.
4. Reminder notification hardening that does not require redesign screens.
5. Final production build gate documentation.

## Explicitly excluded for now

Do not bring these into this production candidate until separate validation is complete:

- full product redesign navigation shell,
- Care+ and Play Billing,
- reports extraction/provider flow,
- Ask Janani AI personalization,
- clinical rule engine production activation,
- multilingual clinical safety copy claims.
