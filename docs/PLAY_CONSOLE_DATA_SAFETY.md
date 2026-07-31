# Janani Play Console Data Safety Working Sheet

Use this as an implementation-matched working sheet. Recheck every answer against the final production build and Google Play's current wording before submission.

## Does the app collect or share user data?

Yes. Janani transmits user-provided and app-generated data to Supabase and sends push-notification payloads through Expo's push service.

## Data collected

### Personal information

- Email address / account identifier
- Profile name
- Family role: mother or partner

Purpose: account management, authentication, app functionality, family linking.

### Health and fitness-related information

- Estimated due date
- Optional last menstrual period
- Optional height and pre-pregnancy weight
- User-entered medicine and care reminders
- Reminder completion history
- Pregnancy journal entries and moods

Purpose: app functionality, pregnancy progress display, reminders, journaling. Janani is not diagnostic and does not create clinical records.

### App activity and user-generated content

- Partner messages and acknowledgements
- Reminder actions
- Journal sharing choices

Purpose: app functionality and family communication.

### Device or other identifiers

- Expo push token

Purpose: app functionality and notifications.

## Data shared with service providers

- Supabase: authentication, database, realtime, and server functions
- Expo push notification service: device token and notification payload required for delivery

Treat this as service-provider processing, subject to Google's definitions and the final contractual configuration. Janani does not sell user data.

## Security practices

- Data encrypted in transit using HTTPS/TLS
- Supabase authentication required
- Row Level Security limits family and user access
- Push tokens are private to their owner and server processes
- Destructive account actions require explicit confirmation
- Users can request deletion directly inside the app

Confirm whether the final provider configuration supports encryption at rest before selecting that declaration in Play Console.

## Deletion

Janani provides in-app deletion from Settings & Account.

- Mother deletion removes the linked family pregnancy space and dependent shared records.
- Partner deletion removes the partner account and dependent authored records while preserving the mother's pregnancy space.
- Mothers can disconnect partners without deleting the family.
- Partners can leave a family without deleting the mother's data.

## Optional data

The following are optional: LMP, height, weight, journal title, journal sharing, and free-text reminder instructions. Account and pregnancy setup data needed for the selected role are required for core functionality.

## Advertising and analytics

The current implementation contains no advertising SDK and no dedicated analytics SDK. Revisit this section before release if analytics, crash reporting, attribution, or advertising libraries are added.

## Final verification checklist

- Inspect the final Android dependency tree.
- Verify every SDK and its data behavior.
- Confirm public privacy-policy URL is live.
- Confirm account deletion works on a disposable account.
- Confirm data export respects RLS.
- Reconcile answers with Google's current Data Safety form language.
