# Milestone 5 — Mother Context Engine

Status: design contract only; implementation belongs on the M5 stacked branch.

## Purpose

Build one compact, mother-private context snapshot that future Janani AI and personalization services can consume without asking the mother to repeat information she has already provided.

## Trust rule

The context engine may include:

- pregnancy basics owned by the mother
- structured Health profile and self-reported conditions
- active medicines/supplements and recorded clinician instructions
- private relevant medical/pregnancy history entered into Janani
- recent mother-entered trackers (weight, blood pressure, glucose, symptoms)
- relevant appointments
- manually entered lab results
- report facts only when `review_status` is `confirmed` or `corrected`

It must never include as trusted context:

- raw medical-report files
- `medical_report_facts.review_status = 'proposed'`
- rejected machine extraction
- raw extraction-provider output
- a diagnosis inferred by AI from user data
- partner-only/private data belonging to another account

## Context characteristics

- Mother-only ownership check at the database boundary.
- Compact and capped: recent observations rather than an unlimited history dump.
- Provenance preserved for report-derived facts.
- Self-reported vs report-confirmed vs clinician-instruction sources stay distinguishable.
- No clinical interpretation happens inside the context builder.
- No AI call happens inside the context builder.
- Future question-specific selection may reduce this snapshot further before an LLM call.

## Initial snapshot sections

1. `pregnancy`
2. `health_profile`
3. `conditions`
4. `active_medications`
5. `care_context`
6. `recent_trackers`
7. `upcoming_appointments`
8. `manual_lab_results`
9. `confirmed_report_facts`
10. `context_meta`

## Safety boundary

The Mother Context Engine is a data-selection layer, not a clinical decision engine. Milestone 6 remains responsible for deterministic clinical safety rules. Milestone 7 may give the resulting approved context to Ask Janani only after those boundaries are in place.
