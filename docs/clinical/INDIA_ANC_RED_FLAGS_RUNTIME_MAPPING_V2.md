# India ANC Red Flags — Runtime Mapping v2

Status: **Blocked from runtime registration**  
Clinical package: `IN-ANC-RED-FLAGS-REVIEW-V2`  
Target runtime schema: `janani-clinical-v1`

## Purpose

This document maps the clinician-review candidate to Janani's existing immutable clinical-rule engine **without registering or activating any clinical rule**.

The mapping inspection found an important runtime-schema gap: the current engine can evaluate numeric values, a small allow-list of recorded conditions, pregnancy type, and logical combinations, but it cannot safely test **which symptom concept** a mother reported. It only exposes `latest_symptom_severity` as a numeric target.

Therefore the 16 ANC danger-signal concepts must **not** be encoded using severity alone, free text, condition codes, or another unrelated predicate. Doing so could fire the wrong clinical action.

## Existing runtime contract

A registered immutable version requires:

- `condition_code`
- `version`
- `schema_version`
- a ruleset object with `schemaVersion` and `rules`
- a non-empty structured source manifest
- a server-computed SHA-256 hash bound to the exact ruleset

Current ruleset schema is `janani-clinical-v1`.

Each rule supports:

- `id`
- optional integer `priority`
- `sourceIds`
- `when`
- `action`

Current allowed predicate operators are:

- `all`
- `any`
- `numeric_compare`
- `condition_present`
- `pregnancy_type_is`

Current numeric targets include gestation, weight, blood pressure, pulse, glucose and `latest_symptom_severity`.

Current action fields are:

- `severity`: `info | attention | urgent`
- `messageKey`: `clinical.*`
- `blockAiReassurance`: boolean
- `requiresCareContact`: boolean

An `urgent` action is structurally required to set both safety flags to `true`.

Approval is hash-bound: the runtime requires the exact registered version/hash/source manifest plus reviewer identity and credentials before a pack can become approved.

## Why V2 cannot yet be registered

The source concepts are symptom identities, for example:

- fever
- vaginal bleeding
- watery fluid leakage
- severe headache
- blurred vision
- convulsion
- generalized swelling / facial puffiness
- reduced or absent fetal movement

`latest_symptom_severity >= N` cannot distinguish one of these from an unrelated symptom. A severity-only rule would therefore be clinically unsafe and source-infaithful.

The existing `condition_present` predicate is also inappropriate: danger signals are symptoms, not doctor-diagnosed condition codes.

Free-text matching inside the clinical evaluator is deliberately unsupported and must remain unsupported.

## Required runtime extension before conversion

After clinician review confirms the source concepts and consumer actions, the clinical engine needs a narrow, deterministic symptom predicate such as:

```json
{
  "op": "symptom_present",
  "conceptCode": "vaginal_bleeding",
  "recency": "current_or_recent"
}
```

This example is **design-only**. The exact schema, recency model and allow-list are not approved yet.

The extension must satisfy all of the following before use:

1. Accept only a closed allow-list of normalized Janani symptom concept codes.
2. Never evaluate arbitrary user text or AI-generated labels.
3. Preserve the original user-entered symptom plus normalized concept provenance.
4. Define deterministic recency semantics; no guessed time window.
5. Support gestational constraints only through explicit reviewed predicates.
6. Fail closed when symptom identity, timing or gestation is missing/ambiguous.
7. Keep symptom identity separate from symptom severity.
8. Add unit tests proving unrelated symptoms cannot trigger a red-flag rule.
9. Add combination tests where clinician review says multiple signs change urgency.
10. Add rollback and immutability tests for registered versions.

## Per-rule runtime state

All V2 rules currently have the same runtime state:

`clinical_review_pending → blocked_runtime_schema → not_registered → not_active`

| V2 rule | Concept | Runtime state |
|---|---|---|
| IN-ANC-RF-001 | fever | blocked — symptom concept predicate required |
| IN-ANC-RF-002 | persistent vomiting | blocked — symptom concept predicate required |
| IN-ANC-RF-003 | abnormal vaginal discharge | blocked — symptom concept predicate required |
| IN-ANC-RF-004A | palpitations | blocked — symptom concept predicate required |
| IN-ANC-RF-004B | easy fatigability | blocked — symptom concept predicate required |
| IN-ANC-RF-004C | breathlessness at rest/mild exertion | blocked — symptom concept predicate required |
| IN-ANC-RF-005 | generalized swelling / facial puffiness | blocked — symptom concept predicate required |
| IN-ANC-RF-006 | vaginal bleeding | blocked — symptom concept predicate required |
| IN-ANC-RF-007 | decreased/absent fetal movement >28 weeks | blocked — symptom predicate + reviewed gestational boundary required |
| IN-ANC-RF-008 | watery fluid leakage | blocked — symptom concept predicate required |
| IN-ANC-RF-009A | severe headache | blocked — symptom concept predicate required |
| IN-ANC-RF-009B | blurred vision | blocked — symptom concept predicate required |
| IN-ANC-RF-009C | convulsion | blocked — symptom concept predicate + clinician urgency required |
| IN-ANC-RF-010A | reduced urine output | blocked — symptom concept predicate required |
| IN-ANC-RF-010B | burning micturition | blocked — symptom concept predicate required |
| IN-ANC-RF-011 | generalized itching | blocked — symptom concept predicate required |

## Source-manifest mapping

When a future clinician-approved ruleset is prepared, its source manifest must use the runtime field names:

```json
[
  {
    "sourceId": "IN-ICMR-DHR-ANC-STW-2025-12",
    "authority": "Indian Council of Medical Research / Department of Health Research, Ministry of Health & Family Welfare, Government of India",
    "title": "Standard Treatment Workflow for Ante-Natal Management of Normal Pregnancy",
    "versionOrDate": "December 2025",
    "url": "https://www.icmr.gov.in/icmrobject/uploads/STWs/1771568619_ante-natalmanagementofnormalpregnancy-7.pdf"
  }
]
```

Additional NHM/MoHFW sources may be included only when their exact item-level contribution to a rule has been verified.

## Promotion sequence

No shortcut is permitted:

1. Complete item-level India source reconciliation.
2. Obtain qualified clinician review of V2.
3. Record final urgency/action and consumer wording.
4. Design and security-review the normalized symptom data model/predicate.
5. Implement the predicate with a closed concept allow-list.
6. Build a candidate `janani-clinical-v1` or successor ruleset.
7. Validate source manifest.
8. Register an immutable version server-side.
9. Record clinician approval against the exact server ruleset hash.
10. Run deterministic, conflict, false-reassurance and rollback tests.
11. Only then consider `production_eligible` / activation.

Until then, Janani's live state remains **0 active ANC red-flag clinical packs**.
