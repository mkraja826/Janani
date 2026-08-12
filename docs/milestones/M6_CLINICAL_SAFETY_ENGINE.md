# Milestone 6 — Clinical Safety Engine

Status: infrastructure build. Clinical content remains blocked until review.

## Current safety state

The live Janani database currently contains 11 clinical rule-pack records, but all are `draft` or `pending_review`. None has a current approved version, recorded clinician reviewer, effective date, or source manifest. Therefore **zero condition-specific clinical rules are eligible to run**.

Milestone 6 must preserve that fail-closed state while making the system ready for reviewed India clinical packs later.

## Purpose

Create a deterministic clinical-safety layer between trusted mother context and any later AI response.

Order of authority:

1. emergency / red-flag deterministic rules
2. known treating-clinician instructions recorded by the mother
3. clinician-approved Janani deterministic clinical rules
4. personalization within approved boundaries
5. AI explanation / wording

AI can never approve, create, modify or override clinical rules.

## Rule governance

A production clinical rule version must be immutable and include:

- condition/domain code
- semantic version
- ruleset schema version
- complete declarative ruleset payload
- SHA-256 ruleset hash
- non-empty official/source manifest
- qualified reviewer name and credentials
- review decision
- effective date
- optional expiry date

A rule pack cannot become `approved` unless the approved version exists and its stored hash matches the reviewer-approved hash.

## Rule payload boundary

Rules are declarative data, not executable SQL/JavaScript supplied by reviewers.

The initial ruleset schema supports only allow-listed logical/comparison operations. It must never execute arbitrary code, SQL fragments, regular expressions supplied as actions, prompts, URLs, or dynamic functions.

A rule action may produce structured safety output such as:

- `severity`: `info`, `attention`, `urgent`
- `messageKey`: approved localized-message identifier
- `blockAiReassurance`: boolean
- `requiresCareContact`: boolean
- `ruleId`
- `ruleVersion`
- provenance / source identifiers

The engine returns structured decisions only. Human-facing medical wording remains separately reviewed/localized content.

## Fail-closed requirements

- Draft or pending-review packs are never loaded.
- Suspended, expired or not-yet-effective packs are never loaded.
- Missing ruleset version/hash prevents approval.
- Hash mismatch prevents approval and loading.
- No approved packs means the evaluator returns no condition-specific rule decisions.
- No AI fallback is allowed to invent a clinical decision when rules are unavailable.
- Proposed/unconfirmed report extraction is never clinical input.

## Separation from other milestones

Milestone 5 supplies trusted, provenance-aware mother context.
Milestone 6 evaluates only approved deterministic rules.
Milestone 7 may give the context plus M6 safety decisions to Ask Janani.

Clinical content review remains governed by the India clinical-validation workflow and is not bypassed by this infrastructure milestone.
