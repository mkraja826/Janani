# Janani release readiness — 2026-08-22

This document records release evidence and blockers verified during the August 22 production audit.

## Verified source and CI state

- Janani is restored to the reviewed Expo / React Native Android production tree.
- The audited Expo SDK 54 dependency baseline is intentionally frozen for release stability.
- Static quality gates passed: dependency install, production dependency audit, TypeScript, lint, Expo Doctor, legal-site validation, and public Expo config.
- Clean Android prebuild, Janani native widget generation, and x86_64 debug APK compilation were validated during release-candidate checks.
- The Android release workflow requires production configuration and signing credentials, verifies the final AAB signature, and emits SHA-256 evidence.

## Production backend state

- The live Supabase project was healthy during the audit.
- RLS-only advisor notices on RPC-only tables were reviewed separately; authenticated direct table privileges were not broadly enabled merely to silence notices.
- Security-definer RPCs require selective ownership/auth review rather than blanket revocation.
- Leaked-password protection was disabled during the audit and remains an external auth-setting gate until re-verified enabled.
- Live migration history and repository migration history are not yet one-for-one reproducible. Reconciliation must preserve production state and recover exact deployed SQL from Supabase migration history rather than rewriting production history.

## Release blockers

1. Reuse the authoritative existing Android/EAS signing identity; do not generate a replacement key blindly.
2. Configure the required production public values and a monitored private support mailbox.
3. Re-verify Supabase leaked-password protection and security advisories.
4. Reconcile live migration history with source control without modifying production state.
5. Complete physical-device acceptance: auth callback, mother/partner flow, reminders/notifications, widgets, offline replay, partner revocation, and disposable-account deletion.
6. Produce and verify a signed production AAB.
7. Complete Play Console Data Safety / health declarations, listing assets, testing, and staged rollout.
8. Keep unapproved clinical rule packs inactive.
9. Keep Care+ purchases disabled until the final Play Billing milestone.

This evidence must be revalidated when the release baseline changes materially.
