# Janani production auth and support gates

These are provider/owner configuration gates. The application must not invent or embed credentials for them.

## Required before release

- Configure a production SMTP provider in Supabase Auth.
- Verify password-recovery mail uses the production Janani sender identity.
- Enable leaked-password/compromised-password protection when available for the project.
- Configure `EXPO_PUBLIC_SUPPORT_EMAIL` to a private monitored support mailbox.
- Keep health or pregnancy details out of public issue trackers.
- Keep service-role, SMTP, Play, and AI credentials server-side only.

## Release behavior

The app exposes only the public support email address. Missing support configuration is treated as a release-configuration failure by `npm run validate:production-config` rather than silently using a placeholder.

## Owner evidence to record

Record the SMTP provider, sender domain, support mailbox owner, password-recovery destination URL, leaked-password protection state, and the date these were enabled. Do not commit passwords, API keys, SMTP credentials, or private mailbox tokens.
