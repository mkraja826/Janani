# India ANC + Red Flags — Evidence Pass v2

Date: **2026-08-12**  
Status: **Clinical review pending — not production eligible**

## Verified primary source

**ICMR / Department of Health Research, Ministry of Health & Family Welfare**  
Standard Treatment Workflow for **Ante-Natal Management of Normal Pregnancy**  
Publication: **December 2025**

Official PDF:
`https://www.icmr.gov.in/icmrobject/uploads/STWs/1771568619_ante-natalmanagementofnormalpregnancy-7.pdf`

Official ICMR STW index:
`https://www.icmr.gov.in/standard-treatment-workflows-stws`

The source explicitly instructs patients to report danger signals to a health facility and separately states that vaginal bleeding presentations should be assessed and referred to CHC or a higher centre.

## Extraction correction discovered in v2

The PDF was checked both through its parsed text layer and visually.

The visual danger-signal panel contains:

**Generalized swelling of the body / puffiness of the face**

This bullet was absent from the parsed text output used in the first extraction draft. Therefore:

- the V1 draft was incomplete;
- V2 adds this trigger;
- source verification for safety-critical PDFs must include visual review rather than relying only on extracted text/OCR;
- no V1 red-flag package should ever be promoted.

## ICMR danger-signal concepts captured in V2

V2 preserves the source meaning while splitting composite bullets into atomic clinician-review candidates:

- fever
- persistent vomiting
- abnormal vaginal discharge
- palpitations
- easy fatigability
- breathlessness at rest / mild exertion
- generalized body swelling / puffiness of face
- vaginal bleeding
- decreased / absent fetal movements after the source gestational threshold
- leaking watery fluid per vaginum
- severe headache
- blurring of vision
- convulsion
- reduced urine output
- burning micturition
- generalized itching

Splitting a source bullet does **not** assign different clinical meaning or urgency. Urgency remains null until clinician review.

## Current NHM / MoHFW cross-check

Re-verified current official India programme sources on 2026-08-12:

1. NHM Maternal Health programme page:
   `https://nhm.gov.in/index1.php?lang=1&level=2&lid=218&sublinkid=822`
2. NHM Maternal Health guideline index, updated August 2026:
   `https://www.nhm.gov.in/index1.php?lang=1&level=3&lid=377&sublinkid=839`
3. MoHFW PMSMA update:
   `https://www.mohfw.gov.in/?q=pressrelease-5`

The current NHM material confirms comprehensive ANC, early high-risk pregnancy detection, PMSMA/E-PMSMA follow-up and current availability of relevant national documents such as the Maternal Health Guidance Booklet for CHOs, Extended PMSMA guidance, MCP Card and My Safe Motherhood Booklet.

**Important limitation:** this evidence pass does not claim item-by-item equivalence between every ICMR danger-signal bullet and every NHM booklet. Item-level document reconciliation remains a clinical-review prerequisite where the full official document has not yet been extracted and checked.

## Safety decision for Janani

No rule in this package is enabled in production.

Janani must not, from this draft alone:

- label a symptom as a diagnosis;
- say a symptom is safe or normal;
- decide that the user may wait;
- prescribe treatment;
- change medicines;
- infer pre-eclampsia, infection, rupture of membranes, fetal compromise or any other diagnosis;
- downgrade an emergency symptom because an AI model sounds reassuring.

## Clinician review checklist

A qualified maternal-health clinician, preferably an obstetrician/gynaecologist, must review the exact V2 package and record:

- PASS / CHANGE / REJECT for each trigger;
- final consumer urgency;
- referral destination/action;
- gestational-age constraints;
- symptom combinations that increase urgency;
- exclusions/wording needed to avoid false positives without creating false reassurance;
- whether breathlessness at rest and mild exertion need separate urgency;
- whether decreased and absent fetal movement need different handling;
- emergency handling for convulsion and other severe warning symptoms;
- English consumer wording;
- separate approval of Telugu/Hindi and later translated safety wording.

After clinician approval, the next step is a hash-bound deterministic rule package plus unit, conflict and false-reassurance tests. Only after those tests pass may the package be considered for `production_eligible` status.
