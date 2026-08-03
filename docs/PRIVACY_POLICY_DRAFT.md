# Janani Privacy Policy — Maintained Repository Source

**Effective date in the legal-site source:** August 3, 2026

**Publication status:** Ready for release review, but not yet publicly hosted. The intended canonical URL is `https://mkraja826.github.io/Janani/privacy/`; do not submit that URL to a store until GitHub Pages is enabled and the page is verified.

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

Janani does not require a medical diagnosis. Users should avoid placing unnecessary sensitive information in free-text reminders, journals, messages, screenshots, or support requests.

## 2. How information is used

Janani uses this information to authenticate accounts, create and protect a family space, calculate pregnancy progress, provide reminders, synchronize selected family information, deliver partner notifications, preserve journal entries, support offline synchronization, operate the home-screen widget, prevent duplicate writes, and maintain service reliability and security.

## 3. Family sharing and journal choices

A partner can join a family only through an invitation flow. Linked family members can see shared reminders and partner messages. Journal entries are private unless their author chooses to share them with the linked partner.

Sensitive mother-only pregnancy details—last menstrual period, height, and pre-pregnancy weight—and the active family invite code are not exposed to a linked partner through the application API. The due date and shared care state support the linked family experience.

## 4. Service providers

Janani uses:

- Supabase for authentication, database storage, Realtime synchronization, and server functions;
- Expo services for device-token registration and push-notification delivery; and
- GitHub for the public legal site and public support issue tracker once Pages is enabled.

Those providers may process technical logs under their own terms and privacy practices. Janani does not sell personal information and does not currently include advertising or dedicated analytics SDKs.

## 5. Device permissions and local storage

Notification permission is used for care and partner alerts. Android reboot and widget functionality may restore reminders and display selected care information. Janani keeps encrypted, per-user on-device caches and pending synchronization state, plus the minimum local notification and widget state needed for those features.

Device settings can limit permissions. Clearing Janani's app data or uninstalling the app removes app-controlled local storage from that device.

## 6. Security

Janani uses authenticated access controls, database Row Level Security, restricted column grants, protected server functions, private family-scoped Realtime invalidation, replay-resistant writes, and restricted access to device tokens. Data is sent over encrypted network connections supported by the app and its providers.

No application or storage system can guarantee absolute security. Users should protect their devices, passwords, and family invite codes.

## 7. Retention, export, and deletion

Application data is retained while needed to provide the account and family space. Signed-in users can export a JSON copy in Settings and permanently delete their account from the app. Users who have an account but have not completed family onboarding also have an in-app deletion path.

Permanent deletion requires typing `DELETE` and reauthenticating with the current password. Deletion removes the Auth account and active application data according to the user's family role:

- deleting a mother account removes its associated family pregnancy space and dependent shared records;
- deleting a partner account removes that partner and dependent authored records while preserving the mother's family pregnancy space; and
- unlinking or leaving a family does not itself delete the user's Auth account.

Infrastructure providers may retain limited backups or security logs for periods governed by operational or legal requirements. The account-deletion source now documents exact `DELETE` confirmation and current-password reauthentication at the intended public route, `https://mkraja826.github.io/Janani/account-deletion/`; that route must still be verified live before store submission.

## 8. User choices

Users can change notification permission in device settings, choose whether individual journal entries are shared, export their data, leave or disconnect a family relationship where the app provides that option, and permanently delete their account.

## 9. Children

Janani is intended for adults managing a pregnancy journey and is not directed to children.

## 10. Medical and emergency information

Janani does not monitor symptoms or contact emergency services. Severe pain, heavy bleeding, breathing difficulty, fainting, seizures, reduced consciousness, or any urgent concern requires immediate contact with local emergency services or a qualified maternity-care professional.

## 11. Changes to this policy

This policy may change as Janani changes. The effective date must be updated when a revised policy is published. Data behavior, providers, retention, permissions, public URLs, and support channels must be rechecked for every release.

## 12. Contact and privacy requests

No support email or separate legal identity is currently published; none is invented in this source. Janani currently directs users to the repository's [public GitHub Issues support path](https://github.com/mkraja826/Janani/issues).

GitHub Issues and replies are public. Never post an email address, password, family invite code, pregnancy or health information, journal content, medication details, access token, device token, or screenshots containing personal data. Until a private security-reporting channel is published, users should open only a minimal issue asking the maintainer to provide a private method.
