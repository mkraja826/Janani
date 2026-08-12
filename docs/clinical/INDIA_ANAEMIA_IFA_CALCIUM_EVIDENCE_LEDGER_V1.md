# India M6.2 — Anaemia / IFA / Calcium Evidence Ledger v1

Status: **clinical review pending — not production content**  
Evidence pass: **2026-08-12**

## Purpose

This ledger records what the current India sources actually support and where Janani must stop. It does not authorize Janani to prescribe, alter, start, stop or intensify iron, folic acid, calcium, vitamin D or parenteral therapy.

## Current-source findings

### 1. NHM Anaemia Mukt Bharat — current programme material

The current NHM AMB programme page provides national prophylactic programme facts for pregnant/lactating women:

- daily IFA beginning from the fourth month / second trimester;
- minimum 180 days during pregnancy and 180 days postpartum;
- listed pregnancy/lactation tablet: 60 mg elemental iron + 500 mcg folic acid;
- preconception through first trimester: 400 mcg folic acid daily;
- detailed testing/treatment protocols are delegated to the AMB operational guidelines.

The current NHM AMB guideline index lists **Anemia MuktBharat Abhiyaan Operational Guidelines 2026**. During this evidence pass the full 33 MB document endpoint could not be reliably fetched through the evidence tool, so no treatment threshold or IV-iron rule is extracted from the index alone.

### 2. ICMR / DHR ANC Standard Treatment Workflow — December 2025

The current ANC STW includes:

- haemoglobin as an essential investigation;
- daily folic acid at the first visit;
- second-trimester IFA once daily if Hb >11 g% and twice daily if Hb <11 g%;
- referral if there is no rise in Hb after four weeks of oral tablets;
- later-visit parenteral-iron / referral statements for lower Hb values;
- Hb <7 g% as a high-risk pregnancy criterion;
- calcium carbonate 500 mg + vitamin D 250 units twice daily with meals;
- calcium and IFA should not be given together.

These are clinician-facing workflow statements. Janani may not convert the treatment statements into autonomous consumer prescribing.

### 3. National calcium guideline — December 2014, still listed by NHM in 2026

The current NHM Maternal Health guideline index continues to list the national calcium guideline. The guideline specifies:

- universal calcium-rich-food counselling for pregnant/lactating women;
- two 500 mg elemental-calcium tablets per day (1 g/day total) from 14 weeks through six months postpartum;
- 250 IU vitamin D3 per 500 mg calcium tablet;
- divided doses with meals;
- do not take both calcium tablets together;
- do not take calcium and IFA together.

The December 2025 ICMR ANC STW independently confirms the pregnancy-phase calcium formulation/frequency and the 'not together with IFA' instruction, which reduces concern that the pregnancy component of the older guideline is obsolete. The postpartum duration still requires clinician/current-programme review because the ANC STW does not address that period.

## Reconciliation matrix

| Topic | NHM AMB/current programme | ICMR ANC 2025 | National calcium guideline | M6.2 disposition |
|---|---|---|---|---|
| Preconception / first-trimester folic acid | 400 mcg daily | Daily folic acid, no dose stated | — | Compatible at concept level; dose still clinician-reviewed before consumer rule |
| Routine pregnancy IFA prophylaxis | 1 tablet daily from fourth month/second trimester; 60 mg Fe + 500 mcg FA | Hb-dependent once/twice daily statement | — | Scope overlap unresolved; do not infer treatment dosing from prophylaxis page |
| Anaemia treatment / dose escalation | Detailed protocol delegated to AMB operational guideline | Hb-dependent IFA + parenteral/referral statements | — | **Blocked pending full 2026 AMB treatment extraction + clinician reconciliation** |
| Hb <7 g% high-risk/referral | Not established from programme page alone | High-risk criterion / referral language | — | Potential escalation candidate only after typed-lab + clinician review |
| Calcium pregnancy formulation | — | 500 mg calcium carbonate + 250 units vitamin D twice daily with meals | 500 mg elemental calcium + 250 IU vitamin D3 twice daily | Compatible |
| Calcium start | — | Second-trimester workflow | From 14 weeks | Compatible in broad stage; exact consumer wording requires review |
| Calcium postpartum duration | — | Not covered | Through 6 months postpartum | Supported by older guideline that remains currently listed; needs current-programme/clinician confirmation |
| Calcium + IFA timing | — | Not together | Not together | Compatible; do not invent an exact separation interval |

## Safety decisions already made

1. **No dose or treatment statement in this package is production eligible.**
2. Janani will not advise a mother to double IFA because an Hb value is below a threshold.
3. Janani will not recommend parenteral iron.
4. Janani will not alter a medicine reminder to a different dose/frequency because of a report value.
5. A future Hb-based escalation rule must use a typed, confirmed Hb observation with unit, date, source and provenance. Generic OCR text or an unconfirmed extracted report value is insufficient.
6. Treating-clinician instructions remain higher priority than programme education.
7. Telugu/Hindi clinical wording requires separate review after English clinical intent is approved.

## Evidence gaps before promotion

- Complete item-level extraction of **AMB Operational Guidelines 2026**, especially pregnancy anaemia classification, oral-iron treatment, IV-iron indications/contraindications and referral pathways.
- Determine whether any 2026 national material supersedes the 2014 postpartum calcium duration or formulation.
- Clinician adjudication of Hb thresholds and whether Janani should present them as care-contact escalation rather than treatment advice.
- Define a typed laboratory observation contract for haemoglobin.
- Unit tests for stale Hb values, conflicting report values, unit mismatch, unconfirmed OCR, pregnancy/postpartum stage, clinician-entered regimen conflicts and false reassurance.

## Runtime implication

The current `janani-clinical-v1` evaluator has no typed laboratory predicate for haemoglobin/report observations. That is a deliberate blocker. Even after clinical approval, Hb rules cannot be registered until the rule engine supports a closed allow-listed lab-observation predicate with unit/date/provenance validation.
