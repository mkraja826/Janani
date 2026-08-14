Milestone 3 schema discovery note:
20260812090000_add_private_maternal_health_profiles.sql created a temporary duplicate table after repository-only inspection.
20260812090100_remove_duplicate_maternal_health_profiles.sql removed it immediately once live Supabase types revealed the existing richer health subsystem.
Runtime Milestone 3 uses the existing health_profiles, health_conditions and secure own-health RPCs.
