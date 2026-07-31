# Janani Project Progress

**Overall progress: 50%**

## Completed

- GitHub repository initialized on `main`
- Expo + React Native + TypeScript foundation added
- Emotional welcome, authentication and role-aware onboarding added
- Secure mother family creation and partner invite joining added
- Pregnancy week, trimester and due-date countdown added
- Daily medicine and care reminders added
- Local notification permissions and daily scheduling added
- Reminder taken, skipped, pause, resume, edit and deletion flows added
- Reminder edits and resumes safely replace local notification schedules
- Pregnancy journal timeline, mood and private/shared controls added
- Journal edit and delete actions connected for authors
- Thinking-of-you partner message and acknowledgement added
- Realtime publication and subscriptions added for reminders, logs, journal entries and partner nudges
- Device push-token table deployed with owner-only RLS
- Expo push-token registration added after authentication
- Authenticated `send-partner-nudge` Edge Function deployed
- Thinking-of-you messages now trigger secure cross-device Expo push delivery
- Push delivery gracefully falls back to realtime/in-app delivery when no device token exists
- Supabase Row Level Security protects family, pregnancy, journal and token data
- GitHub Actions typecheck workflow made runnable without a lockfile

## Database modules deployed

- profiles
- families
- family_members
- pregnancies
- reminders
- reminder_logs
- journal_entries
- partner_nudges
- device_push_tokens

## Edge Functions deployed

- send-partner-nudge

## Current usable flow

1. User registers or signs in.
2. Mother creates a family and pregnancy profile, or partner joins with an invite code.
3. Home shows pregnancy progress.
4. Family members create, complete, pause, resume, edit or delete reminders.
5. Users create private or shared journal entries and can edit or delete their own entries.
6. Supported development builds register a private Expo push token.
7. Mother or partner sends a Thinking-of-you message.
8. Janani saves the nudge, resolves only the linked recipient and sends a cross-device push notification.
9. Realtime keeps the shared message history updated and the recipient can acknowledge it with a heart.

## Next milestone

Phase 8 device readiness and offline reliability:

1. Observe and fix the first GitHub Actions typecheck result
2. Commit a deterministic npm lockfile from a local install
3. Native date and time pickers
4. Notification tap deep-link handling
5. Offline cache and sync queue foundation
6. Android home-screen widget architecture
7. Android development build and physical-device verification
8. Push receipt handling and invalid-token cleanup

## Safety principles

- Medical guidance is educational and trimester-aware, never diagnostic.
- Urgent warning signs must direct users to qualified medical care.
- Medicine details must follow the prescribing clinician.
- Journal sharing is explicit and private by default.
- Partner access is explicit, revocable, and protected by RLS.
- Push tokens are private per user and never exposed to other family members.
- The push Edge Function authenticates every request before resolving a recipient.
- No service-role keys or production secrets may enter the mobile app or repository.
