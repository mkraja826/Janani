# Janani Play production package

This file is the source-controlled owner checklist for the production Play Console submission. It does not claim that console-side actions are complete.

## Required listing assets

- App name and descriptions: `play/listings/en-US/`
- Approved Janani app icon from the release branch
- Feature graphic
- Phone screenshots showing the actually released feature set
- Support contact
- Privacy policy URL
- Account-deletion URL

## Required Play Console declarations

Complete these using the behavior of the final signed AAB, not planned future features:

- App access
- Ads declaration
- Content rating
- Target audience
- Data Safety
- Health-app / health-content declarations where requested by Play
- Account deletion
- Privacy policy
- Permissions and sensitive API declarations where applicable

## Data Safety reconciliation

Janani can process account information, pregnancy-related information, reminders, journal entries, and partner/family interactions. The final Play Data Safety form must be reconciled against the production database schema, analytics/crash providers actually enabled, notification infrastructure, and any AI/subscription providers enabled in the release.

Do not declare a future provider that is disabled, and do not omit a provider that receives production user data.

## Paid Care+ release gate

If Care+ purchases are disabled by the production feature gate, subscription products and AI claims must not be presented as available in the store listing. If they are enabled, Play subscription terms, pricing, purchase restoration, server verification, and applicable AI/privacy disclosures must be complete before submission.

## Production submission sequence

1. Produce the signed AAB from the protected `production` GitHub environment.
2. Confirm version name and version code match the Play release entry.
3. Upload the AAB to the intended Play track.
4. Fill declarations using the exact released feature set.
5. Attach screenshots/assets that match the release build.
6. Add release notes.
7. Submit for Google Play review only after all owner/provider configuration gates are complete.
