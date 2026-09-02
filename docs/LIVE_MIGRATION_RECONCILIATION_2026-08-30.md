# Janani live migration reconciliation — verified 2026-09-02

This branch remains reconciliation-only. Do not apply, delete, rename, repair, or rewrite production migration history from this branch.

## Direct production verification

Supabase production project `brdjnhfvytdmsnwexras` was re-read directly on 2026-09-02. `supabase_migrations.schema_migrations` is readable again, including each migration's deployed `statements` array.

No production database changes were made during this verification.

## Repository baseline

`main` currently contains source migrations through:

- `20260812003000_repair_health_tracker_rpcs.sql`
- `20260812034500_autonomous_nutrition_foundation.sql`

The repository does not currently contain one-for-one historical files for the live migration sequence below.

## Confirmed drift set

There are exactly 19 reconciliation items:

- 18 live-only migrations missing from `main`.
- 1 timestamp/version mismatch for `autonomous_nutrition_foundation`.

Each migration below currently has exactly one entry in its deployed `statements` array. The fingerprint is MD5 of that exact deployed statement text; it is for reconciliation identity only, not for security use.

| Live version | Migration name | Deployed SQL fingerprint |
| --- | --- | --- |
| `20260812080740` | `add_private_maternal_health_profiles` | `453c6f94ebae483020a901d5b2494bc3` |
| `20260812080838` | `remove_duplicate_maternal_health_profiles` | `aec3b3e19653cec0435bcf7e4071bc8b` |
| `20260812083237` | `private_medical_reports` | `f905dde4edf095575ced648238b6faee` |
| `20260812083323` | `index_medical_report_foreign_keys` | `0542fc71da0ce8b1cc769dd0722a17ac` |
| `20260812090705` | `secure_report_extraction_worker` | `662e9f2f7f47b0baa62deea5324d785b` |
| `20260812092518` | `mother_context_snapshot` | `328aaee8e9556b6ca4b1668d6c32a799` |
| `20260812092650` | `current_mother_context` | `64e97971665989cb6fa4f07cc7ab864a` |
| `20260812093648` | `question_relevant_mother_context` | `f6467a984c82b938c18a9df669467433` |
| `20260812093835` | `fix_question_context_limits` | `8e5aa76e0eebae0b83a7a9e9ebe746a3` |
| `20260812094833` | `versioned_clinical_rule_governance` | `8cd6f29eff3c7f3a83c74b0e5aa901e1` |
| `20260812095819` | `declarative_clinical_rule_engine` | `205c5960a37429a25b50bc8219222a27` |
| `20260812100207` | `preserve_clinical_provenance_on_state_change` | `b8d3c8234856a7bff4a7eee49bd04bd1` |
| `20260812100336` | `harden_clinical_rule_version_immutability` | `fe781978beef9f8599ac58601e48ab06` |
| `20260812100851` | `ai_personalization_consent` | `c597e11c13e5937e1e80667d9087bceb` |
| `20260812103003` | `private_user_invalidations` | `74eda9fc432e86fa1695e232735a47a3` |
| `20260812103142` | `daily_personalization_snapshot` | `c90f4f64f622ce4d22405f8863db6b49` |
| `20260812104547` | `partner_safe_support_context` | `75eef7e8e2c9d8eadef0af695d7a12b3` |
| `20260812104651` | `fix_partner_pregnancy_rls` | `0742077de309b00837e2f714afabcc1e` |
| `20260814155851` | `autonomous_nutrition_foundation` | `3839867de7cbc86ccc72f076f57975da` |

## Autonomous nutrition timestamp mismatch

Repository history currently uses `20260812034500_autonomous_nutrition_foundation.sql`, while production recorded the migration as `20260814155851_autonomous_nutrition_foundation`.

The previously verified Aug 22 audit found the deployed SQL and repository SQL to be the same migration content with a different migration timestamp. Before changing repository history, the 2026-09-02 deployed SQL must still be compared byte-for-byte/normalized against the current repository file. Do not execute the nutrition migration again against production merely to make versions align.

## Required reconciliation sequence

1. Recover the exact deployed SQL text for each of the 18 live-only migrations from `supabase_migrations.schema_migrations.statements`.
2. Commit those exact historical migration files to this reconciliation branch using their live version and name.
3. Compare `20260814155851_autonomous_nutrition_foundation` with repository `20260812034500_autonomous_nutrition_foundation.sql` and document the canonical alias/timestamp decision.
4. Re-read the resulting branch migration directory and require an exact one-for-one version/name match with live history.
5. Replay the reconciled migration chain on an isolated Supabase staging/development branch from a clean database.
6. Run schema, RLS, RPC, storage, Realtime, security-advisor, and application smoke checks on staging.
7. Only after clean replay should PR #60 become eligible to merge.

## Safety constraints

- Never run production `db reset`.
- Never delete or rewrite rows in `supabase_migrations.schema_migrations` to manufacture alignment.
- Never apply reconstructed historical migrations to production when production already records them as applied.
- Do not activate clinical rule packs as part of migration reconciliation.
- PR #60 remains draft until clean staging replay passes.
- PR #68 (Janani Giving) remains independent and draft; live donations stay fail-closed during backend reconciliation.

## Current staging state

Janani currently has no Supabase development branch. Creating one requires Supabase cost confirmation. Until that branch is intentionally created, reconciliation work is limited to source-control recovery and read-only production verification.
