# Janani Privacy Policy — Maintained Repository Source

**Effective date in the legal-site source:** August 3, 2026

**Repository revision:** August 10, 2026

**Publication status:** The policy is published over HTTPS at `https://mkraja826.github.io/Janani/privacy/`. This repository revision updates the disclosure for the live dedicated Cloudflare form; the HTML policy source must remain synchronized with this maintained companion. Static deployment, response-header, source-integrity, compatibility-redirect, and Supabase CORS checks are complete, but a successful disposable-account deletion and rejected sign-in remain required before the flow is production-complete.

This Markdown file is the maintained policy companion to `site/privacy/index.html`. The publishable HTML remains the legal-site source of record. Update both files together when Janani's data behavior or providers change.

Janani is a pregnancy-support application. It is not a medical device and does not provide diagnosis, treatment, monitoring, or emergency services.

## 1. Information Janani processes

Depending on the features used, Janani may process:

- account identifiers and email address;
- profile, family membership, and mother-or-partner role information;
- pregnancy dates and optional body measurements;
- reminder content, schedules, and completion history;
- journal entries, moods, and sharing choices;
- partner messages and acknowledgements; and
- device push tokens and technical information needed to deliver notifications and protect the service.

If a user chooses the external account-deletion form, the hardened static page at `https://janani-account-deletion.pages.dev/` processes the Janani account email and current password in the browser long enough to authenticate directly with Supabase Auth and submit the protected deletion request directly to Supabase. Cloudflare Pages serves the static files but does not receive the form submission. The form is designed to keep credentials and returned Auth tokens in browser memory only, use only the access token for the deletion call, clear sensitive fields and discard response tokens after the attempt, omit intentional browser credential storage and analytics, and send no credentials or tokens to Cloudflare Pages, GitHub Issues, GitHub Pages, or unrelated origins. The GitHub Pages deletion route is information/link-only and does not host the form.

Janani does not require a medical diagnosis. Users should avoid placing unnecessary sensitive information in free-text reminders, journals, messages, screenshots, or support requests.

## 2. How information is used

Janani uses this information to authenticate accounts, create and protect a family space, calculate pregnancy progress, provide reminders, synchronize selected family information, deliver partner notifications, preserve journal entries, support offline synchronization, operate the home-screen widget, prevent duplicate writes, and maintain service reliability and security.

## 3. Family sharing and journal choices

A partner can join a family only through an invitation flow. Linked family members can see shared reminders and partner messages. Journal entries are private unless their author chooses to share them with the linked partner.

Sensitive mother-only pregnancy details—last menstrual period, height, and pre-pregnancy weight—and the active family invite code are not exposed to a linked partner through the application API. The due date and shared care state support the linked family experience.

## 4. Service providers

Janani uses:

- Supabase for authentication, database storage, Realtime synchronization, and protected server functions;
- Expo services for device-token registration and push-notification delivery; and
- Cloudflare Pages for serving the static external deletion-form files; and
- GitHub for the public legal site and public support issue tracker.

Those providers may process technical or hosting-request logs under their own terms and privacy practices. Loading the Cloudflare page may create ordinary hosting logs, but the browser sends the form submission directly to Supabase rather than Cloudflare. Janani does not sell personal information and does not currently include advertising or dedicated analytics SDKs.

## 5. Device permissions and local storage

Notification permission is used for care and partner alerts. Android reboot and widget functionality may restore reminders and display selected care information. Janani keeps encrypted, per-user on-device caches and pending synchronization state, plus the minimum local notification and widget state needed for those features.

Device settings can limit permissions. Clearing Janani's app data or uninstalling the app removes app-controlled local storage from that device. The Cloudflare-hosted external deletion page does not intentionally persist the submitted email, password, or access token in browser storage; users should close the page when finished and avoid using an untrusted or shared device.

## 6. Security

Janani uses authenticated access controls, database Row Level Security, restricted column grants, protected server functions, private family-scoped Realtime invalidation, replay-resistant writes, and restricted access to device tokens. Data is sent over encrypted network connections supported by the app and its providers.

No application or storage system can guarantee absolute security. Users should protect their devices, passwords, and family invite codes.

## 7. Retention, export, and deletion

Application data is retained while needed to provide the account and family space. Signed-in users can export a JSON copy in Settings and permanently delete their account from the app. Users who have an account but have not completed family onboarding also have an in-app deletion path.

Permanent deletion requires typing `DELETE` and reauthenticating with the current password. Deletion removes the Auth account and active application data according to the user's family role:

- deleting a mother account removes its associated family pregnancy space and dependent shared records;
- deleting a partner account removes that partner and dependent authored records while preserving the mother's family pregnancy space; and
- unlinking or leaving a family does not itself delete the user's Auth account.

Infrastructure providers may retain limited backups or security logs for periods governed by operational or legal requirements.

Janani provides two authenticated deletion paths in the current source:

- the in-app control requires exact `DELETE` confirmation and current-password reauthentication; and
- the external web form at `https://janani-account-deletion.pages.dev/` sends browser requests directly to Supabase Auth over HTTPS, then calls the same protected deletion service with exact `DELETE` confirmation and the current password.

The public GitHub Pages route, `https://mkraja826.github.io/Janani/account-deletion/`, provides deletion information and a link to the canonical Cloudflare form only. It does not collect credentials or perform Auth/deletion requests. The former Supabase `account-deletion-page` URL is retained only as a no-body `302` compatibility redirect to the canonical form.

The canonical Cloudflare form, security headers, source integrity, compatibility redirect, and exact-origin Supabase CORS policy have passed live checks. A successful deletion and rejected sign-in must still be tested with an exactly identified disposable account. A success message is shown only after the deletion service returns success; a timeout means the final result is unknown, and an error is not treated as confirmed deletion. If protected-file cleanup cannot complete immediately, the backend records the unresolved work and it may continue asynchronously.

## 8. User choices

Users can change notification permission in device settings, choose whether individual journal entries are shared, export their data, leave or disconnect a family relationship where the app provides that option, and permanently delete their account.

## 9. Children

Janani is intended for adults managing a pregnancy journey and is not directed to children.

## 10. Medical and emergency information

Janani does not monitor symptoms or contact emergency services. Severe pain, heavy bleeding, breathing difficulty, fainting, seizures, reduced consciousness, or any urgent concern requires immediate contact with local emergency services or a qualified maternity-care professional.

## 11. Changes to this policy

This policy may change as Janani changes. The effective date must be updated when a revised policy is published. Data behavior, providers, retention, permissions, public URLs, and support channels must be rechecked for every release.

## 12. Contact and privacy requests

No support email or separate legal identity is currently published; none is invented in this source. Janani's current support source points non-sensitive requests to the repository's [public GitHub Issues path](https://github.com/mkraja826/Janani/issues), but issue creation is currently restricted and the path is not a private support channel.

GitHub Issues and replies are public. Never post an email address, password, family invite code, pregnancy or health information, journal content, medication details, access token, device token, or screenshots containing personal data. A private support, privacy-request, and security-reporting channel remains a release gate. Until one is published, users should open only a minimal issue asking the maintainer to provide a private method and must not include sensitive details.
