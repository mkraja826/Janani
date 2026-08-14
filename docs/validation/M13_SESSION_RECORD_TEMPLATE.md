# M13 Validation Session Record

Copy this template for each real validation session. Do not put passwords, OTPs, access tokens, raw medical reports, private journal content or unnecessary personal health information in this document.

## Session identity

- Session ID:
- Date/time:
- Tested commit SHA:
- Build/version:
- Tester role: mother / partner / clinician / observer
- Device make/model:
- Android/iOS version:
- Screen size class: small / medium / large
- Network condition: normal / intermittent / offline-recovery
- UI language: English / Telugu / Hindi / other
- Test data: synthetic / specifically consented test data

## Tasks attempted

| Task ID | Task | Result | Needed help? | Notes |
|---|---|---|---|---|
| | | Pass / Fail / Blocked | Yes / No | |

## Comprehension checks

Record the participant’s meaning in short paraphrase, not sensitive verbatim health details.

- What does Janani use for personalization?
- What happens after a report is uploaded?
- What can the partner see?
- What should happen when Janani says maternity care should be contacted?
- How can a wrong machine-read report value be corrected?

## Findings

| Finding ID | Severity | Screen/flow | What happened | Expected | Reproducible? | Fix commit | Retest |
|---|---|---|---|---|---|---|---|
| | P0/P1/P2/P3 | | | | Yes/No | | Pending/Pass/Fail |

## Privacy observations

- Any cross-account data observed? Yes / No
- Any mother-private Health/report data visible to partner unexpectedly? Yes / No
- Any previous-account cached data visible after sign-out/account switch? Yes / No
- Any sensitive data exposed in notifications/widget where it should not be? Yes / No

If any answer above is Yes, stop acceptance and open a P0/P1 finding as appropriate.

## Safety/tone observations

- Did ordinary Janani copy feel natural rather than synthetic?
- Did any message give unsupported reassurance?
- Did urgent wording put the action first?
- Did sensitive/loss wording contain clichés, blame, prediction or forced positivity?
- Did translated copy preserve the same action/meaning as English?

## Language/layout observations

- Script rendered correctly: Yes / No
- Any clipped tab label: Yes / No
- Any overlapping text/control: Yes / No
- Any untranslated high-impact text: Yes / No
- English fallback behaved safely: Yes / No

## Notification observations

- Permission state tested:
- Reminder fired at expected time:
- Tap destination correct:
- Edited/deleted schedule behaved correctly:
- Notes:

## Session disposition

- Pass / Fail / Needs retest
- Open P0 count:
- Open P1 count:
- Open P2 count:
- Open P3 count:
- Retest required: Yes / No
- Observer initials/reference:

## Clinician-only review fields

Complete only for clinical review sessions.

- Clinical role/specialty:
- Review scope/content version:
- Emergency wording: Approved / Changes required / Not reviewed
- Attention/contact-care wording: Approved / Changes required / Not reviewed
- Report interpretation boundaries: Approved / Changes required / Not reviewed
- Condition wording: Approved / Changes required / Not reviewed
- Sensitive/loss wording: Approved / Changes required / Not reviewed
- Telugu critical safety wording: Approved / Changes required / Not reviewed
- Hindi critical safety wording: Approved / Changes required / Not reviewed
- Additional notes/reference to internal signed approval record:

Do not mark clinician approval from a casual verbal comment. The approval record must identify the reviewed version and disposition clearly.
