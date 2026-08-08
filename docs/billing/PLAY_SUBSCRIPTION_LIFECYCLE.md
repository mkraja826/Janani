# Google Play subscription lifecycle

Janani treats Real-time Developer Notifications (RTDN) as change signals only. The backend always calls Google Play `purchases.subscriptionsv2.get` with the purchase token and derives the current Care+ entitlement from Google's returned subscription state.

## Intended Play Console products

- `janani_care_plus_monthly`
- `janani_care_plus_annual`

Configure these as auto-renewing subscriptions/base plans in Play Console. Pricing shown in-app should come from Google Play product details rather than being hard-coded for purchase decisions.

## RTDN setup

1. Create a Google Cloud Pub/Sub topic for Google Play notifications.
2. Grant the Google Play notifications service account permission to publish to the topic as required by Play Console.
3. Configure the Play Console monetization notification topic.
4. Create a Pub/Sub push subscription targeting the deployed Supabase function URL:
   `https://<project-ref>.supabase.co/functions/v1/google-play-rtdn?secret=<long-random-secret>`
5. Set the same random value as the Supabase secret `GOOGLE_PLAY_RTDN_SHARED_SECRET`.
6. Deploy `google-play-rtdn` as a webhook endpoint without Supabase user-JWT enforcement; the function authenticates the push endpoint using the shared secret and does not accept client entitlement writes.

## Required Supabase secrets

- `GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY`
- `GOOGLE_PLAY_RTDN_SHARED_SECRET`

Never place these values in the Android app or repository.

## Lifecycle mapping

- ACTIVE -> Care+ active
- IN_GRACE_PERIOD -> Care+ remains active
- CANCELED with a future expiry -> Care+ remains active until expiry
- EXPIRED -> Care+ removed
- ON_HOLD, PAUSED, PENDING, REVOKED or unknown non-entitled state -> Care+ removed

RTDN events are stored by Pub/Sub message ID for deduplication. Unknown purchase tokens are ignored rather than creating a new entitlement because initial ownership must first be established by the authenticated purchase-verification flow.

## Internal testing checklist

- configure both subscription products/base plans in Play Console
- add tester Google accounts as license testers/internal testers
- upload an internal-testing AAB signed with the Play app signing identity
- install from the Play testing link rather than sideloading
- verify monthly purchase
- verify annual purchase
- verify pending purchase then completion
- verify pending purchase cancellation
- verify restore after reinstall
- verify user cancellation keeps access through paid expiry
- verify grace-period access
- verify account hold removes Care+ access
- verify renewal restores/continues access
- verify refund/revocation removes access
- verify duplicate RTDN messages are idempotent

Do not enable production Care+ AI merely because billing succeeds. AI activation remains a separate safety/review gate.
