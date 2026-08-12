# Janani Product Redesign Progress

**Current redesign progress: 71%**

**Progress baseline: 0%**  
**Baseline date:** 2026-08-12

This scale starts where Janani's technical foundation already existed but the simplified, emotionally warm, background-intelligence product experience had not yet been built. The older repository production-readiness percentage is historical engineering context and must not be mixed with this redesign score.

## Frozen product direction

Janani should feel simple, emotional and easy to operate while most complexity runs quietly in the background.

Primary navigation:

1. Home
2. Health
3. Ask Janani
4. Reports
5. Journey

Secondary/occasional actions belong in the top-right overflow menu.

AI is an explanation/personalization layer only. Mother-confirmed data and clinician-approved deterministic rules outrank AI. Raw or unreviewed report extraction never becomes trusted medical context automatically.

## Roadmap

| Milestone | Scope | Status | Points counted |
|---|---|---|---:|
| 1 | Primary navigation shell + overflow menu | Engineering complete / device review pending | 5 |
| 2 | Home redesign + daily-priority experience | Engineering complete / device review pending | 8 |
| 3 | Structured Health / mother profile | Engineering complete / device review pending | 8 |
| 4 | Private Reports upload + extraction + confirmation | Engineering complete / provider + device validation pending | 10 |
| 5 | Mother Context Engine | Engineering complete | 10 |
| 6 | Clinical Safety Engine integration | ANC/red-flag V2 evidence extracted / clinician review + symptom runtime predicate pending | 0 |
| 7 | Context-aware Ask Janani | Engineering complete / device/provider interaction review pending | 10 |
| 8 | Background personalization/event engine | Engineering complete / device event review pending | 8 |
| 9 | Journey consolidation | Engineering complete / device review pending | 6 |
| 10 | Partner experience redesign | Engineering complete / device sharing review pending | 6 |
| 11 | Emotional tone system | Engineering/native complete / live AI deployment blocked | 0 |
| 12 | Multilingual product foundation | Engineering/native complete / live backend + critical-safety language gates pending | 0 |
| 13 | Mother/partner/clinician + physical-device UX validation | Validation harness complete / real sessions pending | 0 |
| 14 | Production release gates | Gate framework complete / release blocked | 0 |

**Counted progress: 71%.** Milestone 6's infrastructure is intentionally not counted because no clinician-reviewed, source-backed clinical rule pack is active yet.

M11–M14 also remain uncounted until their acceptance evidence is complete. M11/M12 live AI deployment is currently blocked by connected Supabase permissions; M12 critical safety translations require review; M13 requires real physical-device/clinician sessions; M14 requires every release gate to pass.

## Milestone weights

- M1 5
- M2 8
- M3 8
- M4 10
- M5 10
- M6 10
- M7 10
- M8 8
- M9 6
- M10 6
- M11 4
- M12 5
- M13 5
- M14 5

## Completed engineering milestones

### M1 — navigation shell
- [x] Persistent Home / Health / Ask Janani / Reports / Journey tabs.
- [x] Shared overflow menu.
- [x] Legacy entry points remain compatible.
- [x] Existing auth/family/reminder backend preserved.
- [x] Full quality workflow + native x86_64 APK passed.
- [ ] Physical-device navigation review.

### M2 — Home
- [x] Home centers on what matters today, not a feature grid.
- [x] Pregnancy progress + next unresolved care item + compact care status.
- [x] Offline cache and refresh on invalidations/app foreground.
- [x] Full quality workflow + native APK passed.
- [ ] Physical-device Home review.

### M3 — Health
- [x] Mother-only Health RPCs reused rather than duplicate storage.
- [x] Weight, pregnancy type, diet, activity, allergies, foods, cuisines, clinician dietary instructions and supported conditions editable.
- [x] Self-reported data is not presented as diagnosis.
- [x] Partner cannot see mother-private Health by default.
- [x] Full quality workflow + native APK passed.
- [ ] Physical-device Health review.

### M4 — Reports
- [x] Private mother-owned medical-report bucket + metadata/extraction/fact separation.
- [x] PDF/image upload with 15 MB/type checks.
- [x] Machine values remain proposed until mother confirms/corrects/rejects them.
- [x] Provenance retained; partner gets no report access by default.
- [x] JWT-protected extraction worker with explicit per-report provider consent.
- [x] Raw prenatal imagery is not diagnostically interpreted and fetal-sex extraction is blocked.
- [x] Full quality workflow + native APK passed.
- [ ] Production report-reading provider configured and validated on representative real reports.
- [ ] Physical-device upload/review.

### M5 — Mother Context Engine
- [x] Mother-only trusted context snapshot.
- [x] Includes pregnancy, Health, conditions, medicines, care context, recent trackers, appointments, manual labs and confirmed/corrected report facts.
- [x] Excludes raw reports, proposed/rejected extraction and raw provider payloads.
- [x] Deterministic question-relevant selector minimizes context and enforces limits.
- [x] Authenticated-path privacy/shape tests passed.
- [x] Full quality workflow + native APK passed.

### M6 — Clinical Safety infrastructure (points withheld)
- [x] Immutable versioned clinical-rule storage + server SHA-256 binding.
- [x] Approval requires exact registered version/hash/sources + reviewer credentials/effective dates.
- [x] Strict declarative evaluator rejects arbitrary code/unsupported fields.
- [x] Service-only raw rule registration/loading; mother receives decisions only.
- [x] Fail-closed mother wrapper tested.
- [x] Full quality workflow + native APK passed.
- [x] First India package (ANC/red flags) extracted from verified current ICMR source with NHM/MoHFW programme/index cross-check and visual-PDF verification.
- [ ] Complete item-level NHM/MoHFW document reconciliation for the ANC/red-flag package.
- [ ] Add a closed normalized symptom-concept predicate to the deterministic engine after clinical/schema review.
- [ ] Qualified clinician review/approval recorded.
- [ ] Remaining India clinical domains extracted and reviewed (anaemia, GDM, hypertension, thyroid, nutrition, food safety, vaccination, postpartum/breastfeeding, medication boundaries).
- [ ] At least one production-eligible approved pack activated and safety-tested.

Current live clinical state remains intentionally **0 registered production versions / 0 active clinical rule packs**.

ANC/red-flag V2 is a **clinical-review candidate only**. It contains 16 atomic source concepts and is deliberately not registered because final urgency is unapproved and the current engine cannot safely match symptom identity.

### M7 — context-aware Ask Janani
- [x] Real in-session chat with General vs Personalized mode.
- [x] Mother personalization consent defaults OFF, is versioned and reversible.
- [x] Partner remains general-support only with no mother-private context.
- [x] Safety layer runs before model call; unsafe/unchecked path fails closed.
- [x] Consent checked server-side; context minimized/sanitized before provider transmission.
- [x] Raw report files/internal IDs are not sent through chat.
- [x] When no approved clinical packs exist, AI is explicitly prevented from interpreting measurements/labs/reports or inventing disease-specific medical advice.
- [x] `janani-ai` deployed with JWT verification.
- [x] Full quality workflow + native APK passed.

### M8 — background personalization
- [x] Mother-private realtime invalidation channel separate from family/partner channel.
- [x] 13 private tables broadcast entity-name invalidations only, never medical values.
- [x] Deterministic daily snapshot chooses one useful next action with `aiCalled=false` and `clinicalAdviceGenerated=false`.
- [x] Home shows one `For you today` card and refreshes from private/family/app events.
- [x] Partner does not call mother-private daily snapshot.
- [x] Full quality workflow + native APK passed.

### M9 — Journey
- [x] Current week/day, trimester and due-date progress consolidated into Journey.
- [x] Existing trimester content shared with the standalone pregnancy guide.
- [x] Current-stage preview avoids inventing detailed fetal/clinical week claims.
- [x] Recent journal memories shown as a privacy-aware timeline.
- [x] Existing journal RLS, sharing, cache and invalidations reused.
- [x] Full quality workflow + native APK passed.

### M10 — Partner experience
- [x] Dedicated Partner & Family screen exists from the overflow menu.
- [x] Mother can explicitly control pregnancy-progress and upcoming-care-timeline sharing.
- [x] Partner-safe RPC excludes Health, reports and medicines.
- [x] Pregnancy RLS now enforces the mother's progress-sharing switch, not just UI hiding.
- [x] Rollback privacy tests confirm sharing OFF hides direct pregnancy rows and shares zero appointments.
- [x] Partner Home is support-first: shared progress, shared appointment when allowed, reminder support, Thinking of You and general Ask Janani.
- [x] Partner does not cache a mother-owned active pregnancy id.
- [x] Latest M10 branch passes full repository quality workflow + native APK.
- [ ] Physical-device mother/partner sharing review.

## M11 — Emotional tone system acceptance

- [ ] Central tone states and writing rules exist instead of scattered ad-hoc warmth.
- [ ] Normal/supportive copy is warm, simple and culturally familiar without sounding synthetic.
- [ ] Uncertainty/attention copy acknowledges concern without false reassurance.
- [ ] Urgent safety copy stays direct and action-first; emotional phrasing cannot dilute escalation.
- [ ] Sensitive/grief copy avoids cheerfulness, blame, prediction and minimizing language.
- [ ] Ask Janani provider prompt uses the same tone contract while clinical/safety instructions retain higher priority.
- [ ] Representative Home, Health, Reports, Journey and partner surfaces use the shared tone system.
- [ ] Full quality workflow + native APK passes.

**Next progress change:** M11 adds 4 points after the latest branch passes repository/native validation.
