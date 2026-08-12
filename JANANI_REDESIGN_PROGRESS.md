# Janani Product Redesign Progress

**Current redesign progress: 21%**

**Progress baseline: 0%**  
**Baseline date:** 2026-08-12

This tracker starts a new product-progress scale from the point where Janani's technical foundation already existed but the simplified, background-intelligence product experience had not yet been built.

The previous repository production-readiness percentage remains historical engineering context and must not be mixed with this new product-redesign percentage.

## Product direction frozen at baseline

Janani should feel simple, emotional and easy to operate while most complexity runs in the background.

Primary navigation:

1. Home
2. Health
3. Ask Janani
4. Reports
5. Journey

Secondary/occasional actions belong in a consistent top-right overflow menu.

Janani should progressively understand the mother's pregnancy, health profile, medicines and confirmed report information, then use clinically approved rules and AI within strict safety boundaries.

## Roadmap

| Milestone | Scope | Status |
|---|---|---|
| 1 | Primary navigation shell + overflow menu | Engineering complete / device review pending |
| 2 | Home redesign and daily-priority experience | Engineering complete / device review pending |
| 3 | Structured Health / mother profile redesign | Engineering complete / device review pending |
| 4 | Private Reports upload + extraction + confirmation | In progress |
| 5 | Mother Context Engine | Not started |
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

The redesign uses product- and safety-weighted milestones rather than equal steps:

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

Milestones 1–3 contribute 21 percentage points after repository engineering validation. Physical-device review remains a separate acceptance gate and can still produce follow-up fixes.

## Milestone 1 acceptance criteria

- [x] Five primary destinations exist.
- [x] Persistent bottom navigation is implemented with Ask Janani in the center.
- [x] Home and Ask Janani route through the new shell.
- [x] Health, Reports and Journey primary destinations exist.
- [x] Shared top-right overflow menu exists.
- [x] Existing working backend/auth/family/reminder systems are preserved.
- [x] Legacy `/home` and `/ai-companion` entry points remain compatible through redirects.
- [x] Repository quality workflow passes, including Android x86_64 debug APK compilation.
- [ ] Physical-device navigation review completed.

## Milestone 1 validation notes

Repository-level validation completed successfully on 2026-08-12. The quality workflow passed deterministic install, the production dependency security gate, TypeScript, lint, Expo Doctor, legal-site validation, Android PNG validation, Expo public-config resolution, Android prebuild, Janani widget-generation checks, and x86_64 debug APK compilation.

## Milestone 2 acceptance criteria

- [x] Home is organized around what matters today rather than a feature grid.
- [x] Pregnancy week, trimester and due-date progress remain visible without dominating the screen.
- [x] Home derives the next unresolved care item from existing reminder and reminder-log data.
- [x] Home shows compact planned / taken / left care status.
- [x] Home uses cached daily data when the network is temporarily unavailable.
- [x] Home refreshes when pregnancy/reminder family invalidations arrive or the app becomes active.
- [x] Partner invitation is removed from the daily Home surface and remains a secondary Partner & Family action.
- [x] Ask Janani remains reachable as a lightweight contextual action.
- [x] Repository quality workflow passes on the Milestone 2 branch, including x86_64 debug APK compilation.
- [ ] Physical-device Home review completed.

## Milestone 2 validation notes

Repository-level validation completed successfully on 2026-08-12. The full Janani quality workflow passed, including the native x86_64 Android debug APK compile.

## Milestone 3 acceptance criteria

- [x] Health uses Janani's existing mother-only secure health RPCs instead of exposing raw health tables.
- [x] Health clearly shows what Janani currently understands and why each data area matters.
- [x] Mother can edit current weight, pregnancy type, dietary pattern, activity, allergies, avoided foods, cuisine preferences, clinician dietary instructions and supported health conditions.
- [x] Self-reported health data is not presented as a diagnosis.
- [x] Partner Health view does not expose the mother's private medical profile by default.
- [x] Existing pregnancy basics, private medication context and health-profile data are reused rather than duplicated.
- [x] Repository quality workflow passes on the Milestone 3 branch, including x86_64 debug APK compilation.
- [ ] Physical-device Health review completed.

## Milestone 3 validation notes

Repository-level validation completed successfully on 2026-08-12. The corrected Milestone 3 branch passed deterministic install, production dependency audit, TypeScript, lint, Expo Doctor, legal-site checks, Android image checks, Expo public config, Android prebuild, widget generation and the x86_64 debug APK compile.

## Milestone 4 acceptance criteria

- [ ] Medical report files are stored in a private bucket with mother-only ownership enforcement.
- [ ] Report metadata and processing state are stored separately from the file object.
- [ ] Images and PDFs can be selected from the device and uploaded with strict MIME/size limits.
- [ ] Extraction output is stored as proposed data only; it never becomes trusted medical context automatically.
- [ ] Every proposed value retains provenance back to report, extraction attempt and source location/excerpt where available.
- [ ] Mother can confirm, correct or reject extracted values before Janani treats them as confirmed facts.
- [ ] Partner does not receive access to private medical reports by default.
- [ ] Reports screen lists uploaded records and their confirmation state without exposing raw storage URLs.
- [ ] Failed/interrupted uploads can be retried or safely removed without leaving trusted orphan data.
- [ ] Repository quality workflow passes on the Milestone 4 branch, including x86_64 debug APK compilation.
- [ ] Physical-device report upload/review completed.

**Progress remains 21% until Milestone 4 passes repository engineering validation.**
