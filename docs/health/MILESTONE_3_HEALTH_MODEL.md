# Milestone 3 — Health model

Janani's redesigned Health experience reuses the existing production health subsystem rather than introducing parallel medical storage.

## Source of truth

Mother-owned data is accessed through the existing security-definer RPCs, including:

- `get_own_health_profile`
- `save_own_health_profile`
- `get_own_private_care_context`
- `get_own_health_tracker`
- `get_mother_pregnancy_private_details`

Raw private health tables are not exposed to the partner UI.

## UX principle

The Health tab answers: **What does Janani understand about me, and how will adding more information improve my experience?**

It must not look like a hospital dashboard. It should progressively surface pregnancy basics, current weight, food preference, activity, allergies/avoided foods, health conditions and medication context.

## Safety principle

Profile inputs are self-reported unless explicitly marked as coming from another source. A selected condition is never itself treated as an AI diagnosis. Janani's later clinical safety and AI layers must distinguish profile data from clinician-confirmed records and report-extracted observations.

## Partner privacy

The partner experience does not automatically expose the mother's private health profile. Partner-facing health UX remains support-oriented until explicit mother-controlled sharing rules are implemented.

## Schema note

During Milestone 3 discovery, a temporary `maternal_health_profiles` table was created after the repository snapshot appeared to lack structured health storage. Live-schema regeneration revealed the richer existing `health_profiles` / `health_conditions` / private-care architecture, so the duplicate table was immediately removed through a follow-up migration. No runtime feature depends on the temporary table.
