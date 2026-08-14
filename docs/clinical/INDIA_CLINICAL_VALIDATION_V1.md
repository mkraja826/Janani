# Janani India Clinical Validation Framework v1.0

Status: **Evidence-governance foundation — not yet production-approved clinical content**  
Jurisdiction: **India**  
Last evidence pass: **2026-08-12**

## Purpose

This document defines how Janani converts Indian maternal-health guidance into safe, auditable application rules. It does **not** declare Janani medically approved by the Government of India, ICMR, MoHFW, NHM, FSSAI, or any professional society.

Janani must not expose a clinical rule to users merely because a source has been found. Every rule must pass source verification, rule extraction, clinical review, safety testing, and release approval.

## Safety precedence

Janani keeps the previously defined safety order:

0. Emergency / red-flag escalation
1. Treating-clinician instructions known to the user
2. Clinician-approved deterministic Janani clinical rules
3. Personalization within approved boundaries
4. AI-generated wording or explanation
5. AI safety validator

AI must never override levels 0–3.

## Evidence hierarchy

For the India product profile, evidence is collected in this order:

1. WHO maternal-health guidance as the international baseline.
2. Government of India / national guidance: MoHFW, Department of Health Research, NHM, ICMR, ICMR-NIN, FSSAI, NACO and other relevant national programmes.
3. Indian professional-society guidance where national guidance is absent or incomplete.
4. International specialist guidance such as FIGO, ACOG and RCOG when the India layer remains incomplete.
5. High-quality systematic reviews or primary evidence only when higher-level guidance does not answer the question.

This hierarchy is a **source-selection hierarchy**, not an automatic conflict-resolution rule.

## Conflict rule

If two authoritative sources disagree on a threshold, medicine, dose, timing, referral criterion, food restriction, investigation, vaccination, or treatment recommendation:

- Janani must not silently choose one.
- The affected rule is marked `blocked_conflict`.
- The conflicting source text and publication/version dates must be recorded.
- A qualified maternal-health clinician must adjudicate the rule before it can be promoted.
- AI cannot resolve the conflict by itself.

Local implementation details from Indian national programmes may supersede generic international operational advice only after review confirms that the underlying clinical safety intent remains satisfied.

## Rule lifecycle

Every clinical rule moves through these states:

`identified` → `source_verified` → `rule_extracted` → `clinical_review_pending` → `clinician_approved` → `safety_tested` → `production_eligible`

Additional terminal/holding states:

- `blocked_conflict`
- `rejected`
- `superseded`
- `expired_review`

Only `production_eligible` rules may be used by Janani's deterministic safety layer or supplied to the AI as approved clinical context.

## Required metadata for every source

Each source record must include:

- stable internal source ID
- issuing authority
- jurisdiction
- exact title
- publication/version date when available
- official source URL
- topics / Janani engines covered
- evidence tier
- source verification status
- licence/reuse status
- date retrieved
- reviewer name and credentials
- clinical approval date
- next review date
- superseding source, when applicable
- notes about conflicts or implementation limitations

No source should be ingested into a production RAG corpus until its reuse/licence status has been checked.

## India source owners by Janani engine

| Janani engine | Primary India source owners | Current validation state |
|---|---|---|
| Maternal Stage / ANC | ICMR-DHR, MoHFW, NHM | Source identification started |
| Pregnancy Progress | ICMR-DHR, MoHFW, NHM | Source identification started |
| Gestational Weight | ICMR-NIN + reviewed obstetric guidance | Pending rule-level review |
| Nutrition | ICMR-NIN | Source identified |
| Food Safety | FSSAI + ICMR-NIN | Source identification started |
| Anaemia / Micronutrients | NHM Anaemia Mukt Bharat + ICMR | Source identified |
| Gestational Diabetes | NHM + ICMR | Source identified; reconciliation required |
| Hypertension / High-risk pregnancy | ICMR-DHR + MoHFW/NHM | Source identification started |
| Thyroid | ICMR + obstetric guidance | Pregnancy-specific reconciliation required |
| Medication | Clinician-reviewed pharmacology sources + India regulatory information where applicable | No autonomous medication rules allowed |
| Symptom / Red Flag | ICMR-DHR + MoHFW/NHM | High-priority extraction pending |
| Vaccination | MoHFW Universal Immunization Programme / U-WIN | Source identified |
| Labour / Birth Preparedness | ICMR-DHR + MoHFW/NHM | Source identification started |
| Postpartum | MoHFW/NHM + ICMR | Source identification started |
| Breastfeeding / Lactation | MoHFW/NHM + ICMR-NIN + WHO | Source identification started |
| Mental-health Safety | MoHFW/ICMR + WHO; specialist guidance if India-specific material is incomplete | Pending |
| AI Safety Validator | Derived only from production-eligible rules | Blocked until rule corpus is approved |

## Seed authoritative India sources

The structured register is maintained in `docs/clinical/INDIA_SOURCE_REGISTER_V1.json`. Initial high-priority sources include:

1. **ICMR / Department of Health Research — Standard Treatment Workflow for Ante-Natal Management of Normal Pregnancy (December 2025).** This is the highest-priority current India baseline found for normal antenatal management, high-risk identification, counselling and danger-signal escalation.
2. **ICMR-NIN — Dietary Guidelines for Indians 2024.** This is the primary India nutrition source for general dietary guidance, including pregnancy and lactation.
3. **NHM — Anaemia Mukt Bharat operational guidance (2026 edition listed by NHM).** This is the priority India programme source for anaemia prevention/control and iron-folic-acid related programme rules.
4. **NHM — National Guidelines for Diagnosis & Management of Gestational Diabetes Mellitus.** This remains an India-specific GDM source but must be reconciled against newer ICMR workflows and current specialist standards before rules are approved.
5. **MoHFW — Universal Immunization Programme / U-WIN.** This is the national operational source for pregnancy vaccination records and programme timing.
6. **FSSAI — Eat Right India materials.** These may support food-safety/hygiene rules, but pregnancy-specific medical restrictions must not be inferred from generic food-safety content.

## First extraction milestone

The first rule package to validate is **ANC + emergency red flags**, because these rules sit above nutrition/personalization/AI in the safety hierarchy.

The extraction package must cover at minimum:

- first-visit information capture
- gestational age / EDD inputs
- baseline risk history
- blood pressure and other high-risk flags
- vaginal bleeding escalation
- severe headache / visual symptoms / convulsion escalation
- fluid leakage escalation
- reduced/absent fetal movement escalation where gestational-age appropriate
- fever / persistent vomiting / breathlessness escalation
- birth preparedness and emergency transport messaging

These items must be converted into structured decision rules only after clinician review. The app must not diagnose a condition from these signs; it should provide the correct level of escalation.

## Clinical review gate

Before an India rule is promoted to `clinician_approved`, the reviewer should be a qualified clinician with relevant maternal-health competence (preferably an obstetrician/gynaecologist for obstetric rules). Review must confirm:

- source applicability to Indian users
- currentness of the source
- correct interpretation
- safe thresholds and timing
- safe wording for a consumer application
- clear escalation level
- whether the rule is educational, advisory, urgent, or emergency
- conditions/exclusions where the rule must not fire

## AI boundary for India validation

Until a domain has production-eligible rules, Janani AI may not create individualized clinical recommendations for that domain. It may provide non-clinical navigation or explain already-approved content, but it must not invent:

- diagnoses
- medication changes
- supplement doses
- investigation interpretations
- scan interpretations
- disease-specific diets
- emergency reassurance
- predictions of miscarriage, fetal abnormality or maternal outcome

## Next implementation order

1. Complete ANC + red-flag rule extraction from current ICMR/MoHFW/NHM sources.
2. Reconcile India anaemia/IFA/calcium guidance.
3. Validate GDM rules.
4. Validate hypertension/high-risk pregnancy rules.
5. Validate thyroid rules.
6. Validate nutrition and gestational-weight rules against ICMR-NIN.
7. Validate food-safety rules against FSSAI and pregnancy-specific clinical sources.
8. Validate vaccination rules against MoHFW/UIP/U-WIN.
9. Validate postpartum and breastfeeding rules.
10. Validate medication/lactation medication sources and hard safety boundaries.
11. Build rule tests and conflict tests.
12. Only then expose the approved corpus to the AI retrieval layer.
