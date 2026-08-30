# Janani live migration reconciliation — 2026-08-30

This branch is documentation-only until live Supabase access is available again. Do not apply, delete, rename, repair, or rewrite production migration history from this branch.

## Current repository baseline

`main` currently contains source migrations through:

- `20260812003000_repair_health_tracker_rpcs.sql`
- `20260812034500_autonomous_nutrition_foundation.sql`

The repository migration directory was re-read from the current `main` on 2026-08-30.

## Previously verified live production history

During the production audit on 2026-08-22, the live Supabase migration table contained additional applied versions that are not represented one-for-one by files on `main`:

- `20260812080740_add_private_maternal_health_profiles`
- `20260812080838_remove_duplicate_maternal_health_profiles`
- `20260812083237_private_medical_reports`
- `20260812083323_index_medical_report_foreign_keys`
- `20260812090705_secure_report_extraction_worker`
- `20260812092518_mother_context_snapshot`
- `20260812092650_current_mother_context`
- `20260812093648_question_relevant_mother_context`
- `20260812093835_fix_question_context_limits`
- `20260812094833_versioned_clinical_rule_governance`
- `20260812095819_declarative_clinical_rule_engine`
- `20260812100207_preserve_clinical_provenance_on_state_change`
- `20260812100336_harden_clinical_rule_version_immutability`
- `20260812100851_ai_personalization_consent`
- `20260812103003_private_user_invalidations`
- `20260812103142_daily_personalization_snapshot`
- `20260812104547_partner_safe_support_context`
- `20260812104651_fix_partner_pregnancy_rls`
- `20260814155851_autonomous_nutrition_foundation`

The Aug 22 audit also verified that live `20260814155851_autonomous_nutrition_foundation` had the same SQL content as repository `20260812034500_autonomous_nutrition_foundation.sql`; only the deployed migration version/timestamp differed.

The other Aug 12 live-only versions must NOT be recreated from later branch copies by assumption. Their exact deployed SQL must be recovered from `supabase_migrations.schema_migrations.statements` and compared before any source-control reconciliation.

## Safe reconciliation procedure

When Supabase access is restored:

1. Re-read `supabase_migrations.schema_migrations` from production and confirm the live version/name list has not changed since the Aug 22 audit.
2. Export the exact `statements` array for every live-only migration above.
3. Hash each reconstructed SQL file and compare against any candidate repository/branch copy.
4. Add exact historical SQL files to this reconciliation branch only when the deployed contents are proven.
5. For the autonomous nutrition timestamp mismatch, preserve a documented alias/history decision rather than executing duplicate SQL against production.
6. Run a clean migration replay against an isolated staging database before merging reconciliation work to `main`.
7. Never use production `db reset`, never delete rows from `supabase_migrations.schema_migrations`, and never mark migrations repaired merely to make CLI output green.

## Release impact

The current mobile release candidate can continue through app-side validation because the live production schema already contains these migrations. However, Janani must not claim fully reproducible backend deployment until this history is reconciled and a clean replay passes.

## Current hold

Supabase connector access was unavailable during the 2026-08-30 continuation, so no live SQL was read and no production database change was made in this step.
