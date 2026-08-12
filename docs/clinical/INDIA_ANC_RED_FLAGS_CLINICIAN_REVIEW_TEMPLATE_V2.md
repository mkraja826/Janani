# Janani India ANC Red Flags — Clinician Review Record v2

Package under review: **`IN-ANC-RED-FLAGS-REVIEW-V2`**  
Jurisdiction: **India**  
Runtime status before review: **not registered / not active**

> This form records clinical review; completing it does not automatically activate a Janani clinical rule pack. The exact clinician-approved runtime ruleset must later be registered immutably, hash-bound, safety-tested and separately promoted.

## Reviewer identity

- Reviewer full name:
- Qualification(s):
- Registration / professional identifier, if applicable:
- Specialty / role:
- Organisation / practice (optional):
- Review date:
- Conflict of interest declaration:

## Evidence reviewed

Please confirm the reviewer had access to the exact evidence package:

- [ ] `INDIA_ANC_RED_FLAGS_REVIEW_V2.json`
- [ ] `INDIA_ANC_RED_FLAGS_EVIDENCE_V2.md`
- [ ] `INDIA_ANC_SOURCE_REGISTER_V2.json`
- [ ] Official ICMR/DHR December 2025 ANC STW PDF
- [ ] Relevant current NHM/MoHFW source material available for reconciliation
- [ ] Runtime mapping/gap document

Additional evidence reviewed:

- 

## Package integrity

Repository commit reviewed:

`________________________________________`

SHA-256 or immutable runtime ruleset hash: **not applicable until a runtime candidate is generated after clinical review**.

If the review package changes after sign-off, this review must not be silently carried forward; changes require explicit re-review.

## Rule-by-rule review

For every row choose **PASS**, **CHANGE**, or **REJECT**. Do not leave final urgency blank if the rule is approved for runtime conversion.

Allowed review outcomes in this document are descriptive. Runtime actions are separately constrained by Janani's clinical engine.

| Rule | Trigger concept | Decision | Final consumer urgency | Required action / referral | Gestational constraint | Wording / change notes |
|---|---|---|---|---|---|---|
| IN-ANC-RF-001 | Fever |  |  |  |  |  |
| IN-ANC-RF-002 | Persistent vomiting |  |  |  |  |  |
| IN-ANC-RF-003 | Abnormal vaginal discharge |  |  |  |  |  |
| IN-ANC-RF-004A | Palpitations |  |  |  |  |  |
| IN-ANC-RF-004B | Easy fatigability |  |  |  |  |  |
| IN-ANC-RF-004C | Breathlessness at rest / mild exertion |  |  |  |  |  |
| IN-ANC-RF-005 | Generalized swelling / facial puffiness |  |  |  |  |  |
| IN-ANC-RF-006 | Vaginal bleeding |  |  |  |  |  |
| IN-ANC-RF-007 | Decreased / absent fetal movement |  |  |  |  |  |
| IN-ANC-RF-008 | Watery fluid leakage per vaginum |  |  |  |  |  |
| IN-ANC-RF-009A | Severe headache |  |  |  |  |  |
| IN-ANC-RF-009B | Blurred vision |  |  |  |  |  |
| IN-ANC-RF-009C | Convulsion |  |  |  |  |  |
| IN-ANC-RF-010A | Reduced urine output |  |  |  |  |  |
| IN-ANC-RF-010B | Burning micturition |  |  |  |  |  |
| IN-ANC-RF-011 | Generalized itching |  |  |  |  |  |

## Mandatory clinical questions

### Symptom grouping

1. Should palpitations, easy fatigability and breathlessness remain separate consumer rules?
   - Decision:
   - Rationale:

2. Should breathlessness at rest and on mild exertion use different urgency/actions?
   - Decision:
   - Rationale:

3. Should decreased and absent fetal movements use different urgency/actions after the approved gestational boundary?
   - Decision:
   - Rationale:

4. Should severe headache and visual symptoms independently trigger the same action, or does combination change urgency?
   - Decision:
   - Rationale:

5. Which symptom combinations must escalate beyond the individual rule action?
   - 

### Gestational boundaries

For fetal movement guidance:

- Approved gestational condition:
- How should Janani handle exactly 28 weeks?
- How should Janani handle unknown gestational age?
- Should Janani distinguish a mother's established usual movement pattern from a generic threshold?
- Consumer wording:

### False reassurance protections

Confirm that Janani must **not** infer that absence of a listed danger signal means the pregnancy is safe.

- [ ] Confirmed

Confirm that a non-triggering rule must not be presented as a clinical clearance or diagnosis exclusion.

- [ ] Confirmed

Additional false-reassurance risks:

- 

## Consumer action language

For each approved rule, the reviewer must specify whether the consumer action should be represented as one of the application's reviewed categories, for example:

- educational / routine discussion
- attention / contact maternity care team
- urgent / seek urgent medical care

Do not use these categories merely because the source says “report to health facility”; the final consumer urgency must be clinically adjudicated.

### Emergency-language review

Explicitly review the action language for severe warning signs such as convulsion and any other rule designated urgent/emergency.

- Approved English urgent wording:

- Can the user safely wait for a routine appointment? YES / NO
- Should AI reassurance be blocked? YES / NO
- Is care contact required? YES / NO

## Diagnosis/treatment boundary

Please confirm that approval of these rules would authorize **escalation guidance only**, not autonomous diagnosis or treatment.

- [ ] No diagnosis from a trigger alone
- [ ] No medication start/stop/dose change
- [ ] No investigation interpretation beyond separately approved rules
- [ ] No prediction of fetal or maternal outcome
- [ ] No AI override of an urgent deterministic rule

## Runtime-schema review

The current Janani clinical engine does not yet support a symptom-identity predicate. A future extension must use a closed, normalized symptom concept allow-list rather than arbitrary free text.

Clinical reviewer comments on the proposed symptom normalization approach:

- 

Are the 16 normalized V2 trigger concepts clinically distinct enough for deterministic matching? YES / NO / CHANGES REQUIRED

Required terminology changes:

- 

## Language review

Clinical approval of English wording does **not** automatically approve translated safety copy.

### English

- [ ] English clinical meaning approved
- [ ] English urgency/action wording approved

### Telugu

Reviewer / qualified translator:

- [ ] Clinical meaning preserved
- [ ] Urgency preserved
- [ ] No added reassurance
- [ ] No medication/treatment meaning added

### Hindi

Reviewer / qualified translator:

- [ ] Clinical meaning preserved
- [ ] Urgency preserved
- [ ] No added reassurance
- [ ] No medication/treatment meaning added

Other languages require their own review record.

## Overall decision

Choose one:

- [ ] **APPROVE FOR RUNTIME-CANDIDATE CONVERSION** — all approved rows have explicit actions/urgency and all required changes are incorporated.
- [ ] **CHANGES REQUIRED** — do not generate an approvable runtime pack yet.
- [ ] **REJECT PACKAGE** — source interpretation or product approach is unsuitable.

Overall notes:

- 

Reviewer signature / recorded approval method:

- 

## After clinician sign-off

Engineering must still:

1. incorporate every approved change;
2. add the deterministic symptom-concept data model/predicate;
3. generate the exact declarative ruleset and source manifest;
4. register it as an immutable server version;
5. capture the server-computed SHA-256 hash;
6. bind clinician approval to that exact version/hash/source manifest;
7. run unit, conflict, privacy, false-reassurance and rollback tests;
8. verify localized critical-safety wording;
9. only then consider production eligibility/activation.
