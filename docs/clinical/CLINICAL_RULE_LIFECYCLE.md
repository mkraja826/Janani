# Janani clinical rule lifecycle

Condition-aware personalization is disabled unless a rule pack is explicitly approved in the server-side clinical registry.

## States

- `draft` — incomplete and never usable for personalization.
- `pending_review` — source-grounded draft awaiting qualified review; never usable for personalization.
- `approved` — may be used only while its effective window is active and required approval metadata is present.
- `suspended` — immediately unavailable to Care+.
- `retired` — permanently withdrawn from active personalization.

## Approval requirements

An `approved` pack requires:

- condition code
- explicit version
- reviewer name
- reviewer credentials
- review timestamp
- effective timestamp
- non-empty source manifest
- optional expiry timestamp
- preferably a ruleset hash tying approval to the exact reviewed artifact

Approval is performed through the service-role-only `set_clinical_rule_pack_state_server` RPC. Normal authenticated clients have no table access and cannot approve, suspend, retire, or inspect internal review records.

Every versioned state transition is appended to `clinical_rule_pack_reviews` as review history. Existing review rows should be treated as audit evidence and never repurposed as mutable app content.

## Care+ enforcement

For condition-sensitive categories Care+:

1. loads the mother-owned health profile;
2. extracts active non-history condition codes;
3. asks `get_active_clinical_rule_packs_server` for currently approved versions;
4. blocks the request if any active condition lacks an active approved version;
5. includes only approved rule-pack metadata in AI context.

A registry lookup failure blocks condition-sensitive AI rather than falling back to model knowledge.

Suspending, expiring, or retiring a pack therefore removes it from Care+ immediately without requiring an Android release.

## Initial registry state

The existing source-grounded draft packs for gestational diabetes, pre-existing diabetes, chronic/pregnancy hypertension, anemia, hypothyroidism, and hyperthyroidism are seeded as `pending_review`, not approved.

PCOS and previous-pregnancy-history codes remain `draft` until dedicated rule artifacts and review processes exist.

## Production rule

Never set a pack to `approved` merely because references exist in the repository. Approval means a qualified reviewer has reviewed the exact version and source manifest intended for production use.
