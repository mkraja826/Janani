# Janani Play Console Data Safety Working Sheet

**Status:** Provisional; not ready to submit.

Use this as an implementation-matched inventory, not as a completed Play Console declaration. Recheck every answer against the exact signed production AAB, provider configuration, retention practice, and wording shown in Play Console at submission time.

Official references reviewed for this working sheet:

- [Provide information for Google Play's Data safety section](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Google Play User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311)
- [Google Play account-deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111)

## Collection and sharing overview

**Does Janani collect user data?** Yes. The app sends user-provided and app-generated data to the configured Supabase project so accounts, family features, synchronization, and deletion can work.

**Does Janani share user data under Google Play's definition?** Do not finalize this answer yet.

- Supabase and Expo receive data to provide contracted application infrastructure. Google Play may exclude transfers to a qualifying service provider from “sharing,” but the final provider roles, contracts, and use restrictions must be verified.
- A user intentionally shares selected reminders, partner messages, and optionally journal entries with a linked family member. Google Play has exceptions for some user-initiated transfers, but the exact form guidance must be applied at submission.
- If any provider uses Janani data for its own advertising, profiling, analytics across customers, or another non-service-provider purpose, the sharing answer and purposes must be updated.

Do not equate “transmitted to a provider” automatically with the Play Console “shared” answer, and do not answer “No” without completing the provider and SDK review.

## Provisional data inventory

### Personal information

Data:

- email address and Auth account identifier;
- profile/display name; and
- family role and membership.

Purposes:

- app functionality;
- account management;
- authentication; and
- security/fraud prevention where applicable.

Required status:

- account identifier, email, profile name, and selected role are required for an account;
- membership exists only when the user creates or joins a family.

Authentication credentials:

- a password is submitted directly to Supabase Auth for sign-in and current-password reauthentication;
- the Cloudflare-hosted external deletion form uses the same credential only for immediate direct browser requests to Supabase Auth and the protected deletion function and is designed not to persist it in browser storage or submit it to Cloudflare; and
- map authentication credentials to the exact category offered by the current Play Console form rather than assuming the email/account-identifier disclosure alone is sufficient.

### Health and fitness-related information

Data:

- estimated due date;
- optional last menstrual period;
- optional height and pre-pregnancy weight;
- user-entered medicine and care-reminder content;
- reminder schedule and completion history; and
- pregnancy journal text and moods.

Purposes:

- app functionality;
- pregnancy-progress display;
- reminders; and
- journaling.

Janani is not diagnostic and does not create or replace a clinical record. LMP, height, and pre-pregnancy weight are mother-private application fields; partners do not receive column access to them.

Required status:

- a due date is required to create the mother's pregnancy space;
- LMP, height, weight, journal content, moods, and free-text care details are optional;
- reminders and journal entries are optional features.

### User-generated content and app activity

Data:

- partner messages and acknowledgements;
- journal sharing choices;
- reminder actions such as taken or skipped; and
- client mutation identifiers used to prevent duplicate offline writes.

Purposes:

- app functionality;
- family communication;
- synchronization; and
- service reliability.

### Device or other identifiers

Data:

- Expo push token.

Purposes:

- app functionality; and
- push-notification delivery.

The token is registered through restricted RPCs and is not readable by other users.

### Local-only or transient implementation data

Janani also uses per-user on-device caches, pending mutation state, local notification identifiers, and widget state. Determine whether any of this becomes Play-disclosable collection based on whether the final build transmits it off device. Local storage alone is not automatically server collection.

## Provider transfers

### Supabase

Receives account, profile, family, pregnancy, reminder, journal, partner-message, push-token, and operational request data needed for Auth, Postgres, Realtime, Storage, and Edge Functions.

### Expo push service

Receives the Expo push token and the minimum notification payload needed for delivery. Final testing must confirm that notification payloads avoid unnecessary pregnancy, medication, journal, account, or secret data.

### Cloudflare deletion form, GitHub legal site, and Issues

Cloudflare Pages serves the reviewed static form assets at `https://janani-account-deletion.pages.dev/` and may process ordinary hosting-request logs when those files are loaded. The form does not submit to Cloudflare: browser requests carrying the email/password or access token go directly to Supabase Auth and the protected `delete-account` function.

GitHub Pages hosts the legal/support files and may process normal hosting logs. Its account-deletion route is information/link-only and contains no credential fields, Auth tokens, or deletion logic. Credentials and access tokens are not intentionally sent to Cloudflare Pages, GitHub Pages, GitHub Issues, analytics, or browser storage.

GitHub Issues remain public and currently report restricted issue creation. They must never be used to post credentials, account identifiers, pregnancy or health information, journal text, medicine details, family invite codes, access tokens, or device tokens. A working private support/privacy/security channel is not yet published and remains a release gate.

The current implementation contains no advertising SDK and no dedicated analytics, attribution, or crash-reporting SDK. Revisit every declaration if any such dependency is added.

## Security practices

Implementation evidence currently supports:

- data encrypted in transit using HTTPS/TLS;
- authenticated access to application data;
- Row Level Security and restricted column grants;
- private family-scoped Realtime Broadcast authorization;
- protected push-token access;
- encrypted per-user session/cache/offline state on device;
- current-password reauthentication plus explicit typed confirmation for permanent deletion;
- a public external deletion form served as static files from a dedicated Cloudflare Pages origin that sends Auth and deletion requests directly from the browser to Supabase and calls the same JWT-protected deletion service as the app, while GitHub Pages remains information/link-only; and
- an in-app JSON export.

Do not select an “encrypted at rest” declaration solely from this repository. Verify the final device storage behavior and each provider's production configuration and contractual commitment first.

Leaked-password protection is still disabled in the live Supabase Auth settings. It remains a production gate even though the source-controlled minimum password policy requires at least eight characters containing letters and digits.

Production custom SMTP and an end-to-end password-recovery flow are also incomplete. Do not claim production-ready account recovery until the final sender/domain, email delivery, approved redirect or deep link, recovery session, password update, abuse controls, and expired/used-link behavior are verified.

## Account and data deletion

Implemented in the app:

- signed-in mother and partner accounts can delete from Settings;
- an authenticated account with no family membership can delete from onboarding;
- the user must type `DELETE` and provide the current password;
- mother deletion removes the associated family pregnancy space and dependent shared records;
- partner deletion removes the partner account and dependent records while preserving the mother's family pregnancy space;
- unlinking or leaving a family does not delete the Auth account; and
- the backend makes finite best-effort storage-cleanup attempts around Auth deletion and durably records any unresolved protected-file cleanup so it may continue asynchronously.

Verification status:

- a disposable account passed the server-side version 5 deletion smoke test with no remaining Auth, profile, cleanup-request, or test storage records;
- mother, partner, and no-family deletion still require full in-app device acceptance; and
- deletion and sign-out cleanup of local caches, queues, notifications, push registration, and widget state still require device evidence.

External deletion resource:

- public information URL: `https://mkraja826.github.io/Janani/account-deletion/`; this route is link-only, with no credential form or Auth logic;
- canonical hardened form URL: `https://janani-account-deletion.pages.dev/`;
- compatibility URL: the former Supabase `account-deletion-page` endpoint returns only a no-body `302` redirect to the canonical form;
- live verification: the canonical static assets, source integrity, anti-framing/no-store headers, compatibility redirect, and exact-origin Supabase Auth/`delete-account` CORS preflights passed;
- processing design: Cloudflare serves the static files but does not receive the form submission; the browser authenticates directly with Supabase Auth, keeps credentials and returned Auth tokens in memory only, uses the access token to invoke the existing JWT-protected `delete-account` Edge Function, clears sensitive fields, discards response tokens after the attempt, and treats only an explicit backend success as completed deletion; and
- remaining evidence: verify successful deletion, role-specific data effects, and rejected sign-in after deletion with an exact disposable account.

This authenticated form removes reliance on a public GitHub Issue as the external deletion mechanism. Before Play submission, still confirm the deployed page satisfies the exact account-and-associated-data deletion questions shown in the current Play Console.

## Retention

The application retains active account and family data while needed to provide the service. Permanent deletion removes active application data according to role. The privacy policy notes that infrastructure providers may retain limited backups or security logs under their operational or legal requirements.

Before submission, document concrete provider retention and deletion windows wherever Play Console or policy disclosures require them. Do not invent a fixed retention period without provider and operational evidence.

## Final verification checklist

- [ ] Build the signed production AAB from the reviewed revision.
- [ ] Inspect the final Android dependency tree and manifest.
- [ ] Verify every SDK/provider, its contractual role, and its data behavior.
- [ ] Exercise every permission and network flow while capturing privacy-safe evidence.
- [ ] Verify notification payloads contain only the minimum non-sensitive content.
- [ ] Confirm leaked-password protection and final production Auth settings.
- [ ] Configure custom SMTP and verify signup confirmation, recovery email delivery, approved redirects/deep links, password update, and abuse/rate-limit controls.
- [ ] Complete mother, partner, and no-family deletion on disposable devices.
- [ ] Confirm data export is role-scoped and excludes mother-private fields for partners.
- [x] Deploy the canonical Cloudflare form and Supabase compatibility redirect; verify static source integrity, public URLs, anti-framing/no-store headers, and exact-origin Supabase CORS preflights.
- [ ] Complete the Cloudflare-hosted external deletion form with a disposable account, prove rejected sign-in and expected data effects, and confirm credentials/tokens are neither persisted in the browser nor submitted to Cloudflare Pages, GitHub Pages, or any unrelated origin.
- [ ] Publish a private support/privacy/security channel and keep sensitive requests out of public GitHub Issues.
- [ ] Reconcile retention statements with Supabase, Expo, Cloudflare, GitHub, and operational practice.
- [ ] Answer the current Play Console collection, sharing, purpose, optionality, security, and deletion questions from the final evidence.
