# India M6.2 — Anaemia / IFA / Calcium Runtime Mapping v1

Status: **design mapping only — no rule registration**

## Existing Janani clinical runtime

The current `janani-clinical-v1` engine is intentionally declarative and allow-listed. It currently supports:

- gestational age numeric comparison;
- current structured BP/glucose/weight/symptom-severity numeric values;
- selected structured condition presence/status;
- pregnancy type;
- logical `all` / `any` predicates;
- structured actions with `info`, `attention` or `urgent` severity.

It does **not** currently provide a safe typed predicate for laboratory observations such as haemoglobin. It also does not manage medication schedules or doses.

## M6.2 runtime decisions

### Candidates that require a new typed laboratory predicate

`IN-M6-2-003`, `IN-M6-2-004`, and `IN-M6-2-005` depend on haemoglobin or haemoglobin trends.

They must not be approximated using:

- free text;
- symptom severity;
- generic report facts without unit/date typing;
- OCR/provider confidence alone;
- a client-supplied numeric value with no provenance.

A future predicate should be narrowly allow-listed, for example conceptually:

```json
{
  "op": "lab_compare",
  "testCode": "haemoglobin",
  "unit": "g/dL",
  "comparator": "lt",
  "value": 0,
  "maxAgeDays": 0,
  "requiredReviewState": "confirmed_or_corrected"
}
```

The placeholder above is **not a clinical rule** and the zero values are intentionally non-clinical. Final schema design must additionally validate:

- canonical test code;
- canonical/convertible unit;
- observed date versus upload date;
- mother confirmation/correction state;
- source/report provenance;
- freshness;
- duplicate/conflicting observations;
- whether the value was clinician-entered versus machine-extracted;
- pregnancy/postpartum context.

A trend predicate may be needed separately for the 'no rise after four weeks' concept. It must not be implemented as two arbitrary client values.

### Candidates that belong primarily to medicine/reminder policy, not the clinical evaluator

`IN-M6-2-001`, `IN-M6-2-002`, `IN-M6-2-006`, `IN-M6-2-007`, `IN-M6-2-008`, and `IN-M6-2-009` are mainly programme education, adherence or medication-timing concepts.

They should not automatically create or change a medicine. A safer implementation path after clinician approval is:

1. preserve the mother/clinician-entered medicine and schedule as source of truth;
2. explain approved national-programme information when asked;
3. detect a timing conflict such as user-entered IFA and calcium at the same time only if the approved rule permits it;
4. ask the mother to adjust/confirm the schedule rather than silently rewriting it;
5. if the medicine/dose differs from general programme guidance, defer to the treating clinician rather than telling the mother to change it.

## Proposed data prerequisite: typed maternal lab observation

Before Hb can participate in the deterministic safety layer, Janani needs a typed observation contract. Minimum fields should include:

- `pregnancy_id`
- `mother_id`
- canonical test code (`haemoglobin`)
- raw value
- normalized numeric value where conversion is safe
- raw unit
- canonical unit
- lab reference range as printed, if available
- specimen/report date
- source report ID or clinician/manual source
- review state (`confirmed`, `corrected`, etc.)
- reviewer/user confirmation timestamp
- extraction provenance where applicable
- superseded/conflict status

No unreviewed machine proposal may enter this table as a trusted observation.

## Ruleset conversion gate

After clinician approval, each approved concept must be classified as one of:

- deterministic safety/escalation rule;
- approved educational content;
- medication-reminder interaction guard;
- clinician-only content not exposed as an autonomous rule;
- rejected/blocked conflict.

Only deterministic safety/escalation rules should enter `clinical_rule_versions`.

## Current decision

**Register zero M6.2 clinical rules now.**

Reasons:

- full 2026 AMB treatment reconciliation is incomplete;
- clinician adjudication is absent;
- Hb lacks a typed lab predicate/data contract;
- medication dose/timing behaviors require a separate safe interaction policy;
- multilingual clinical wording is unreviewed.
