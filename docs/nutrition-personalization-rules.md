# Janani deterministic nutrition personalization rules

This milestone personalizes presentation only. It does not diagnose, prescribe, or create condition-specific meal plans.

## Inputs
- current trimester
- dietary pattern
- cuisine preferences
- known allergies or intolerances
- foods intentionally avoided
- clinician dietary instructions
- saved health conditions and their status

## Rule order
1. Clinician instructions take priority over generic Janani guidance.
2. Allergy and avoidance context is surfaced before future meal generation.
3. Trimester-specific education is shown only for the current trimester when known.
4. Diet and cuisine preferences are used only as presentation context at this stage.
5. If an active diabetes, thyroid, hypertension, or anaemia condition is present, condition-specific nutrition personalization fails closed until a clinically reviewed rule pack exists.
6. Pregnancy-history-only conditions do not trigger current condition-specific diet logic.
7. AI is not used in this layer.

## Fail-closed conditions currently recognized
- pre-existing diabetes
- gestational diabetes
- hypothyroidism
- hyperthyroidism
- chronic hypertension
- pregnancy-related hypertension
- anaemia

## Explicit non-goals
- calorie targets
- weight-gain targets
- carbohydrate prescriptions
- sodium prescriptions
- supplement doses
- medication timing or changes
- diagnosis from readings
- replacing a qualified maternity clinician or dietitian
