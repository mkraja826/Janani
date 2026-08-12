# Janani India Clinical Validation Framework v1.1

Status: **Evidence-governance foundation — not production-approved clinical content**  
Jurisdiction: **India**  
Evidence pass: **2026-08-12**

## Purpose

This framework defines how Janani converts Indian maternal-health guidance into auditable deterministic rules. It does **not** claim approval by the Government of India, ICMR, DHR, MoHFW, NHM, FSSAI, a professional society, or any clinician.

Finding an official source is not enough to expose a rule to users. Every rule must pass source verification, rule extraction, qualified clinical review, safety testing, version binding, and release approval.

## Safety precedence

0. Emergency / red-flag escalation
1. Treating-clinician instructions known to the user
2. Clinician-approved deterministic Janani clinical rules
3. Personalization within approved boundaries
4. AI wording / explanation
5. AI safety validator

AI must never override levels 0–3.

## India evidence hierarchy

1. WHO maternal-health baseline.
2. Government of India / national sources: MoHFW, DHR, NHM, ICMR, ICMR-NIN, FSSAI, NACO and relevant national programmes.
3. Indian professional-society guidance when national guidance is absent or incomplete.
4. International specialist guidance such as FIGO, ACOG and RCOG when the India layer remains incomplete.
5. High-quality systematic reviews or primary evidence only when higher-level guidance does not answer the question.

This is a source-selection hierarchy, not an automatic conflict-resolution rule.

## Conflict rule

If authoritative sources disagree on a threshold, medicine, dose, timing, referral criterion, investigation, vaccination, food restriction or treatment recommendation:

- do not silently choose one;
- mark the affected rule `blocked_conflict`;
- record both source statements and dates;
- require adjudication by a qualified maternal-health clinician;
- do not allow AI to resolve the conflict.

## Rule lifecycle

`identified` → `source_verified` → `rule_extracted` → `clinical_review_pending` → `clinician_approved` → `safety_tested` → `production_eligible`

Holding/terminal states:

- `blocked_conflict`
- `rejected`
- `superseded`
- `expired_review`

Only `production_eligible` rules may enter Janani's deterministic safety engine or approved AI clinical context.

## Mandatory metadata

Every source/rule must preserve:

- stable internal ID
- issuing authority and jurisdiction
- exact title and publication/version date
- official URL
- evidence tier and covered topics
- retrieval/verification date
- extraction provenance, including visual verification where PDF text extraction is incomplete
- clinician reviewer name/credentials
- approval and next-review dates
- conflicts, limitations and superseding source
- reuse/licence status before any production RAG ingestion

## India engine ownership

| Janani engine | Primary India source owners | State |
|---|---|---|
| ANC / maternal stage | ICMR-DHR, MoHFW, NHM | Active validation |
| Symptom / red flags | ICMR-DHR + MoHFW/NHM | Active validation |
| High-risk pregnancy | ICMR-DHR + MoHFW/NHM | Pending after red flags |
| Anaemia / micronutrients | NHM AMB + ICMR | Next |
| GDM | NHM + ICMR | Reconciliation required |
| Hypertension | ICMR-DHR + MoHFW/NHM | Pending |
| Thyroid | NHM/ICMR + reviewed obstetric guidance | Pending |
| Nutrition | ICMR-NIN | Pending |
| Food safety | FSSAI + pregnancy-specific clinical guidance | Pending |
| Vaccination | MoHFW UIP / U-WIN | Pending |
| Postpartum / breastfeeding | MoHFW/NHM + ICMR-NIN + WHO | Pending |
| Medication | Clinician-reviewed pharmacology + India regulatory information | No autonomous medication rules |
| AI safety validator | Production-eligible Janani rules only | Blocked until approved corpus exists |

## Current first package — ANC + red flags

The first package is intentionally escalation-focused because it outranks nutrition, personalization and AI.

Current source baseline:

- ICMR / Department of Health Research, **Standard Treatment Workflow for Ante-Natal Management of Normal Pregnancy**, December 2025.
- Current NHM Maternal Health programme and official guideline index, re-verified August 2026, as the India programme cross-check layer.

The rule package must not diagnose a condition from a danger signal. It may only detect a reviewed trigger and return the clinician-approved consumer action/urgency.

## Clinical review gate

Before `clinician_approved`, preferably an obstetrician/gynaecologist must confirm:

- exact source fidelity;
- India applicability and currentness;
- safe consumer wording;
- urgency/referral level;
- gestational-age constraints;
- exclusions and combinations that change urgency;
- no false reassurance;
- no diagnosis or treatment inference;
- translated wording preserves the same action and severity.

## AI boundary

Until a domain has `production_eligible` rules, Janani AI must not invent individualized clinical recommendations for it. In particular it must not create diagnoses, medication changes, supplement doses, investigation interpretation, scan interpretation, disease-specific treatment/diets, emergency reassurance, or maternal/fetal outcome predictions.

## Next order

1. ANC + red flags — source extraction and clinician review.
2. Anaemia / IFA / calcium reconciliation.
3. GDM.
4. Hypertension / high-risk pregnancy.
5. Thyroid.
6. Nutrition and gestational weight.
7. Food safety.
8. Vaccination.
9. Postpartum / breastfeeding.
10. Medication/lactation medication boundaries.
11. Deterministic rule, conflict, false-reassurance and multilingual tests.
12. Only then expose approved clinical content to AI retrieval.
