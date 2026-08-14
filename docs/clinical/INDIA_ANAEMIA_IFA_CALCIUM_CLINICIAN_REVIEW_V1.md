# India M6.2 — Anaemia / IFA / Calcium Clinician Review Form v1

Package: `IN-ANAEMIA-IFA-CALCIUM-REVIEW-V1`  
Status before review: **clinical_review_pending**  
Production eligible before sign-off: **No**

## Reviewer

- Reviewer name:
- Qualification:
- Specialty:
- Registration / credential reference:
- Institution / practice:
- Review date:
- Conflicts of interest:

## Required source review

The reviewer should verify the source documents directly, not only this summary:

- current NHM Anaemia Mukt Bharat programme material;
- Anemia MuktBharat Abhiyaan Operational Guidelines 2026 (full treatment sections required before treatment rules can pass);
- ICMR/DHR Standard Treatment Workflow for Ante-Natal Management of Normal Pregnancy, December 2025;
- National Guidelines for Calcium Supplementation During Pregnancy and Lactation, December 2014, as still listed on the current NHM Maternal Health guideline index.

## Review decisions

For each candidate, choose one:

- `approve_intent_only` — clinical intent is correct but wording/runtime implementation still needs review;
- `approve_for_rule_conversion` — may be converted to an immutable deterministic ruleset after runtime schema/test requirements are satisfied;
- `changes_requested`;
- `blocked_conflict`;
- `reject`.

### IN-M6-2-001 — preconception / first-trimester folic acid programme

Decision:  
Comments:  

Confirm:
- Is 400 mcg daily appropriate as generic national-programme education for the intended user population?
- Which high-risk groups must be explicitly excluded from generic dose messaging because they may require a different clinician-directed regimen?
- Should Janani show a numeric dose proactively, or only explain/remind a clinician/user-entered regimen?

### IN-M6-2-002 — routine pregnancy/lactation IFA programme

Decision:  
Comments:  

Confirm:
- exact consumer-safe start wording;
- pregnancy duration and postpartum duration;
- whether tablet composition may be displayed as programme education;
- whether Janani should avoid creating a medicine automatically and instead ask the mother to follow/confirm her clinician's prescribed regimen.

### IN-M6-2-003 — Hb-dependent IFA intensity

Decision:  
Comments:  

Mandatory adjudication:
- reconcile the December 2025 ICMR Hb-dependent statement against the full 2026 AMB treatment protocol;
- determine whether this is treatment rather than prophylaxis;
- determine whether Janani should **never** surface a dose-change instruction and instead use a care-contact action.

### IN-M6-2-004 — no Hb rise after four weeks of oral tablets

Decision:  
Comments:  

Confirm:
- what constitutes a clinically meaningful 'rise';
- whether the four-week interval is suitable for a consumer escalation rule;
- minimum adherence/provenance conditions;
- urgency level and consumer wording.

### IN-M6-2-005 — low-Hb treatment/referral statements

Decision:  
Comments:  

Mandatory boundary:
- Janani must not recommend IV/parenteral iron.

Confirm:
- whether any Hb threshold should trigger a deterministic care-contact/referral message;
- appropriate urgency;
- whether the rule requires repeat/confirmed Hb, symptoms, gestational age, treatment history or other context.

### IN-M6-2-006 — routine pregnancy calcium regimen

Decision:  
Comments:  

Confirm:
- current applicability of 500 mg elemental calcium + 250 IU vitamin D3 twice daily;
- whether numeric formulation should appear only in prescription explanation/reminder context;
- whether any contraindication/high-risk exclusions require structured screening before generic messaging.

### IN-M6-2-007 — calcium and IFA not together

Decision:  
Comments:  

Confirm:
- consumer-safe instruction;
- whether a minimum separation interval should be stated, and identify the current authoritative source if so;
- reminder behavior when the user has entered both at the same time.

### IN-M6-2-008 — calcium postpartum duration

Decision:  
Comments:  

Confirm:
- whether continuation through six months postpartum remains current national guidance;
- whether lactation status changes the recommendation;
- whether newer national material supersedes the 2014 text.

### IN-M6-2-009 — calcium with meals / divided doses

Decision:  
Comments:  

Confirm consumer wording and whether reminder scheduling may gently suggest spacing while preserving clinician-entered instructions.

## Runtime/data review

Please confirm or amend these engineering safeguards:

- Hb may only drive a rule from a **typed, confirmed** laboratory observation with unit, report date and provenance.
- Unconfirmed OCR/proposed report extraction cannot trigger a clinical rule.
- Janani cannot infer an iron dose from Hb.
- Janani cannot create an IV-iron recommendation.
- A medication-timing rule cannot silently overwrite an existing clinician/user-entered schedule.
- Stale or conflicting Hb observations must fail closed and prompt clinical review rather than choose a value automatically.

## Language review

After clinical intent is approved, separately approve:

- English consumer wording;
- Telugu wording;
- Hindi wording;
- urgent/attention tone state;
- message keys used by the deterministic engine.

Translation approval must confirm identical urgency and clinical intent across languages.

## Final reviewer disposition

- [ ] Package rejected
- [ ] Changes requested
- [ ] Partially approved; list approved candidate IDs below
- [ ] Approved for deterministic-rule conversion after runtime/schema tests

Approved candidate IDs:

Reviewer signature / attestation:

Date:

## Janani release note

Reviewer sign-off alone does **not** make a rule production eligible. After sign-off Janani still requires immutable ruleset registration, SHA-256/source-manifest binding, deterministic tests, conflict tests, false-reassurance tests, multilingual safety wording review and an explicit production-eligibility decision.
