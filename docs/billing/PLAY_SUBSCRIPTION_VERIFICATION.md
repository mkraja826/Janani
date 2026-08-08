# Janani Care+ Play subscription verification

The Android client must never grant Care+ locally. Purchase state must be verified server-side before a Care+ entitlement is written.

Planned flow:
1. Android billing client receives a Google Play purchase token.
2. The app sends only the product ID and purchase token to an authenticated Supabase Edge Function.
3. The Edge Function verifies the signed-in user and calls the Google Play Developer API using server credentials.
4. The server checks package name, product/base plan, purchase state, expiry, acknowledgement, cancellation/revocation state, and token identity.
5. Only a verified active subscription can upsert the user's Care+ entitlement.
6. Restore/reconcile repeats verification; it does not trust local cached state.
7. Refund, revocation, expiry, and account-hold states must remove or suspend entitlement according to the verified Play state.

No service-account credential, API secret, or entitlement-writing capability belongs in the mobile app.
