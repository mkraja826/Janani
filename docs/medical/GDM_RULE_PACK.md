# Janani gestational diabetes rule pack — draft

Status: **source grounded, pending clinical review**

This document is implementation support for Janani. It is not a clinical guideline and must not be treated as approval for automated medical advice.

## Intended product behavior

Janani may:
- remind a mother with doctor-diagnosed gestational diabetes to follow her maternity-team or dietitian plan;
- support regular meal logging and glucose logging;
- summarize the user's own logged data without diagnosing;
- encourage discussion with the care team when readings repeatedly fall outside clinician-entered targets;
- explain that healthy food choices, appropriate activity, glucose monitoring and, for some people, medication can be part of management.

Janani must not:
- diagnose gestational diabetes from readings;
- prescribe calories, carbohydrate grams, fasting, weight-loss plans, insulin, or other medication;
- modify medication or glucose targets;
- substitute generic targets for clinician-entered targets;
- reassure that the mother or baby is safe based on an app reading or trend.

## Rule hierarchy

1. Urgent-care flow
2. Clinician-entered instructions and targets
3. Allergy / food-avoidance filters
4. Condition rule pack
5. General pregnancy nutrition guidance
6. Tone/presentation layer

## Authoritative sources reviewed for this draft

### ADA — Standards of Care in Diabetes—2026, Management of Diabetes in Pregnancy
- Current annual professional standard.
- Supports fasting/premeal/postmeal glucose monitoring in diabetes in pregnancy and provides pregnancy glucose goals.
- Janani deliberately does **not** hard-code those targets as personalized targets; clinician-entered targets remain authoritative for the user.
- DOI: 10.2337/dc26-S015
- https://diabetesjournals.org/care/article/49/Supplement_1/S321/163918/15-Management-of-Diabetes-in-Pregnancy-Standards

### ACOG — Gestational Diabetes FAQ
- Supports glucose tracking, healthy food choices and regular exercise as common management components; some women need medication.
- Notes regular meals and sometimes snacks as part of dietary management.
- https://www.acog.org/womens-health/faqs/gestational-diabetes

### WHO — Recommendations on care for women with diabetes during pregnancy (2025)
- Provides current global clinical recommendations for diabetes first diagnosed in pregnancy and pre-existing diabetes.
- https://www.who.int/publications/b/81691

## Clinical review gate

Before `enabledForPersonalization` may be changed to `true`, a qualified obstetric/diabetes clinician or registered dietitian should review:
- wording of allowed guidance;
- escalation conditions;
- interaction with clinician-entered targets;
- meal-pattern language for Indian users;
- emergency bypass behavior;
- whether any additional exclusions are required for insulin-treated GDM, vomiting/dehydration, multiple pregnancy, or other comorbidities.

Reviewer name, credential, review date and rule-pack version should be recorded before activation.
