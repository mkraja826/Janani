# Janani Product Redesign Progress

**Current redesign progress: 31%**

**Progress baseline: 0%**  
**Baseline date:** 2026-08-12

This tracker starts a new product-progress scale from the point where Janani's technical foundation already existed but the simplified, background-intelligence product experience had not yet been built.

The previous repository production-readiness percentage remains historical engineering context and must not be mixed with this product-redesign percentage.

## Product direction frozen at baseline

Janani should feel simple, emotional and easy to operate while most complexity runs in the background.

Primary navigation:

1. Home
2. Health
3. Ask Janani
4. Reports
5. Journey

Secondary and occasional actions belong in a consistent top-right overflow menu.

Janani should progressively understand the mother's pregnancy, health profile, medicines and confirmed report information, then use clinically approved rules and AI within strict safety boundaries.

## Roadmap

| Milestone | Scope | Status |
|---|---|---|
| 1 | Primary navigation shell + overflow menu | Engineering complete / device review pending |
| 2 | Home redesign and daily-priority experience | Engineering complete / device review pending |
| 3 | Structured Health / mother profile redesign | Engineering complete / device review pending |
| 4 | Private Reports upload + extraction + confirmation | Engineering complete / device + provider validation pending |
| 5 | Mother Context Engine | In progress |
| 6 | Clinical Safety Engine integration | Not started |
| 7 | Context-aware Ask Janani | Not started |
| 8 | Background personalization/event engine | Not started |
| 9 | Journey consolidation | Not started |
| 10 | Partner experience redesign | Not started |
| 11 | Emotional tone system | Not started |
| 12 | Multilingual product layer | Not started |
| 13 | Mother/partner/clinician + physical-device UX validation | Not started |
| 14 | Production release gates | Not started |

## Progress weights

- Milestone 1: 5 points
- Milestone 2: 8 points
- Milestone 3: 8 points
- Milestone 4: 10 points
- Milestone 5: 10 points
- Milestone 6: 10 points
- Milestone 7: 10 points
- Milestone 8: 8 points
- Milestone 9: 6 points
- Milestone 10: 6 points
- Milestone 11: 4 points
- Milestone 12: 5 points
- Milestone 13: 5 points
- Milestone 14: 5 points

Milestones 1–4 contribute 31 percentage points after repository engineering validation. Physical-device and external-provider validation remain separate gates and can still produce follow-up fixes.

## Milestone 1 acceptance

- [x] Five primary destinations exist.
- [x] Persistent bottom navigation is implemented with Ask Janani in the center.
- [x] Home and Ask Janani route through the new shell.
- [x] Health, Reports and Journey primary destinations exist.
- [x] Shared top-right overflow menu exists.
- [x] Existing working backend/auth/family/reminder systems are preserved.
- [x] Legacy `/home` and `/ai-companion` entry points remain compatible through redirects.
- [x] Repository quality workflow passes, including Android x86_64 debug APK compilation.
- [ ] Physical-device navigation review completed.

## Milestone 2 acceptance

- [x] Home is organized around what matters today rather than a feature grid.
- [x] Pregnancy week, trimester and due-date progress remain visible without dominating the screen.
- [x] Home derives the next unresolved care item from existing reminder and reminder-log data.
- [x] Home shows compact planned / taken / left care status.
- [x] Home uses cached daily data when the network is temporarily unavailable.
- [x] Home refreshes when pregnancy/reminder invalidations arrive or the app becomes active.
- [x] Partner invitation is removed from the daily Home surface.
- [x] Ask Janani remains reachable as a lightweight contextual action.
- [x] Full repository quality workflow and native APK build pass.
- [ ] Physical-device Home review completed.

## Milestone 3 acceptance

- [x] Health uses Janani's existing mother-only secure health RPCs rather than exposing raw health tables.
- [x] Health clearly shows what Janani understands and why data improves suggestions.
- [x] Mother can edit weight, pregnancy type, diet, activity, allergies, avoided foods, cuisine preferences, clinician dietary instructions and supported health conditions.
- [x] Self-reported data is not presented as a diagnosis.
- [x] Partner Health does not expose the mother's private medical profile by default.
- [x] Existing pregnancy, medication and health data are reused rather than duplicated.
- [x] Full repository quality workflow and native APK build pass.
- [ ] Physical-device Health review completed.

## Milestone 4 acceptance

- [x] Medical report files are stored in a private bucket with mother-only ownership enforcement.
- [x] Report metadata and processing state are separate from file objects.
- [x] Images and PDFs can be selected and uploaded with strict MIME/15 MB limits.
- [x] Extraction output remains proposed and never becomes trusted medical context automatically.
- [x] Proposed values retain provenance to report/extraction/source information where available.
- [x] Mother can confirm, correct or reject machine-read values.
- [x] Partner does not receive private medical-report access by default.
- [x] Reports list confirmation/processing state without exposing raw storage URLs.
- [x] Interrupted uploads can be finalized or safely removed.
- [x] Report extraction worker is JWT-protected and server-only lifecycle RPCs are service-role only.
- [x] Automatic reading requires explicit per-report consent before sending a copy to the configured document provider.
- [x] Raw prenatal imagery is not diagnostically interpreted and fetal-sex extraction is blocked.
- [x] Full repository quality workflow passes, including native x86_64 Android APK compilation.
- [ ] Production document-provider secret/model configured and validated on representative real reports.
- [ ] Physical-device report upload/review completed.

## Milestone 4 validation notes

Repository engineering validation completed on 2026-08-12. The final reports-only branch passed deterministic install, production dependency audit, TypeScript, lint, Expo Doctor, legal-site checks, Android image checks, Expo public config, Android prebuild, widget generation and x86_64 debug APK compilation.

Provider activation is deliberately not counted as complete production validation: until a configured provider is tested, automatic extraction must fail safely to manual value entry.

## Milestone 5 acceptance

- [x] A mother-only trusted context snapshot exists.
- [x] Snapshot includes pregnancy basics, Health profile/conditions, active medicines, private care context, recent trackers, appointments, manual labs and confirmed/corrected report facts.
- [x] Raw report files, proposed/rejected extraction and raw provider payloads are excluded from trusted context.
- [x] Report-derived facts preserve source/provenance labels.
- [x] Snapshot history is capped instead of dumping unlimited records.
- [x] Server-side current-pregnancy resolver prefers the mother's active pregnancy and excludes paused pregnancies.
- [x] Question-relevant selector deterministically minimizes context before future AI use.
- [x] Selector carries pregnancy/conditions and clinician-wide instructions while loading detailed sections only when relevant.
- [x] Selector does not store the raw question and records selected topics/limits in metadata.
- [x] Context RPCs reject anonymous execution and enforce mother ownership.
- [x] Synthetic topic-selection tests cover nutrition, report/lab, BP, pregnancy-only, appointment and symptom questions.
- [ ] Final repository quality workflow passes on the latest M5 head, including native Android APK compilation.

**Progress remains 31% until the latest Milestone 5 head passes repository engineering validation.**
