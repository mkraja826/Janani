# Janani Product Redesign Progress

**Current redesign progress: 5%**

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
| 2 | Home redesign and daily-priority experience | In progress |
| 3 | Structured Health / mother profile redesign | Not started |
| 4 | Private Reports upload + extraction + confirmation | Not started |
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

Milestone 1 contributes 5 percentage points. Milestone 2 contributes 8 percentage points, bringing the redesign to 13% once its engineering validation passes. Later milestones are weighted by product and safety complexity rather than treated as equal-sized steps.

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

Milestone 1 remains intentionally unmerged and pending physical-device navigation review before it is treated as fully accepted.

## Milestone 2 acceptance criteria

- [x] Home is organized around what matters today rather than a feature grid.
- [x] Pregnancy week, trimester and due-date progress remain visible without dominating the screen.
- [x] Home derives the next unresolved care item from existing reminder and reminder-log data.
- [x] Home shows compact planned / taken / left care status.
- [x] Home uses cached daily data when the network is temporarily unavailable.
- [x] Home refreshes when pregnancy/reminder family invalidations arrive or the app becomes active.
- [x] Partner invitation is removed from the daily Home surface and remains a secondary Partner & Family action.
- [x] Ask Janani remains reachable as a lightweight contextual action.
- [ ] Repository quality workflow passes on the Milestone 2 branch.
- [ ] Physical-device Home review completed.

**Progress remains 5% until Milestone 2 passes repository quality validation.**
