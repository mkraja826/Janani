import type { HealthConditionCode } from '@/features/health/healthProfile';

export type RulePackStatus = 'source_grounded_pending_clinical_review' | 'approved';

export type ConditionRulePack = {
  condition: HealthConditionCode;
  version: string;
  status: RulePackStatus;
  enabledForPersonalization: boolean;
  allowedGuidance: string[];
  prohibitedActions: string[];
  escalationGuidance: string[];
  sourceIds: string[];
};

export const GDM_RULE_PACK: ConditionRulePack = {
  condition: 'gestational_diabetes',
  version: '2026-08-09-draft-1',
  status: 'source_grounded_pending_clinical_review',
  enabledForPersonalization: false,
  allowedGuidance: [
    'Encourage regular meals across the day rather than long gaps, while following the user’s maternity-team or dietitian plan.',
    'Encourage logging glucose readings and bringing the log to prenatal appointments.',
    'Explain that healthy food choices and regular activity may be part of gestational-diabetes management when the maternity team says activity is appropriate.',
    'Remind the user that some people need medication even when diet and activity changes are followed.',
    'Use only clinician-entered glucose targets for personalized interpretation inside Janani.',
  ],
  prohibitedActions: [
    'Do not diagnose gestational diabetes from user-entered glucose readings.',
    'Do not prescribe calories, carbohydrate grams, meal timing, weight-loss plans, or fasting.',
    'Do not start, stop, increase, decrease, or substitute insulin or other medication.',
    'Do not overwrite clinician-entered glucose targets with generic targets.',
    'Do not promise that a reading, meal, or trend means the mother or baby is safe.',
  ],
  escalationGuidance: [
    'If readings repeatedly fall outside the user’s clinician-entered targets, advise contacting the maternity or diabetes care team.',
    'If symptoms suggest severe illness, dehydration, loss of consciousness, or another emergency, bypass nutrition advice and use Janani’s fixed urgent-care flow.',
  ],
  sourceIds: ['ADA-2026-DIABETES-PREGNANCY', 'ACOG-GDM-FAQ', 'WHO-2025-DIABETES-PREGNANCY'],
};

export const PREEXISTING_DIABETES_RULE_PACK: ConditionRulePack = {
  condition: 'preexisting_diabetes',
  version: '2026-08-09-draft-1',
  status: 'source_grounded_pending_clinical_review',
  enabledForPersonalization: false,
  allowedGuidance: [
    'Support logging and reviewing trends without diagnosing or declaring control.',
    'Encourage following the user’s maternity and diabetes care plan and bringing logs to appointments.',
    'Use only clinician-entered glucose targets for any future personalized comparison.',
    'Provide general food-pattern education only when it does not conflict with clinician or dietitian instructions.',
  ],
  prohibitedActions: [
    'Do not diagnose diabetes type or pregnancy complications from user-entered readings.',
    'Do not invent or replace glucose, A1C, carbohydrate, calorie, or weight targets.',
    'Do not start, stop, increase, decrease, or substitute insulin or other medication.',
    'Do not recommend fasting or weight-loss plans during pregnancy.',
    'Do not reassure that a reading or trend means the mother or baby is safe.',
  ],
  escalationGuidance: [
    'Repeated readings outside clinician-entered targets should direct the user to the maternity or diabetes care team.',
    'Severe illness, loss of consciousness, inability to keep fluids down, or another emergency bypasses nutrition guidance and uses the fixed urgent-care flow.',
  ],
  sourceIds: ['ADA-2026-DIABETES-PREGNANCY'],
};

export const CHRONIC_HYPERTENSION_RULE_PACK: ConditionRulePack = {
  condition: 'chronic_hypertension',
  version: '2026-08-09-draft-1',
  status: 'source_grounded_pending_clinical_review',
  enabledForPersonalization: false,
  allowedGuidance: [
    'Support consistent BP logging and appointment preparation without diagnosing from app-entered values.',
    'Encourage following the maternity team’s BP-monitoring and treatment plan.',
    'Use only clinician-entered BP targets or thresholds for any future personalized comparison.',
  ],
  prohibitedActions: [
    'Do not diagnose chronic hypertension, gestational hypertension, or preeclampsia from app-entered readings.',
    'Do not invent BP targets or treatment thresholds.',
    'Do not prescribe sodium, fluid, calorie, or activity limits unless they are clinician-entered instructions.',
    'Do not start, stop, increase, decrease, or substitute antihypertensive medication.',
    'Do not reassure that a BP reading means the mother or baby is safe.',
  ],
  escalationGuidance: [
    'Concerning readings or symptoms should direct the user to the maternity team according to Janani’s reviewed escalation policy.',
    'Severe headache, visual disturbance, chest pain, difficulty breathing, seizure, fainting, severe abdominal pain, or another emergency bypasses nutrition guidance and uses the fixed urgent-care flow.',
  ],
  sourceIds: ['ACOG-CHRONIC-HYPERTENSION-CHAP', 'ACOG-CHRONIC-HYPERTENSION-PB203', 'WHO-2025-MATERNAL-HEALTH'],
};

export const PREGNANCY_HYPERTENSION_RULE_PACK: ConditionRulePack = {
  ...CHRONIC_HYPERTENSION_RULE_PACK,
  condition: 'pregnancy_hypertension',
  version: '2026-08-09-draft-1',
};

export const ANEMIA_RULE_PACK: ConditionRulePack = {
  condition: 'anemia',
  version: '2026-08-09-draft-1',
  status: 'source_grounded_pending_clinical_review',
  enabledForPersonalization: false,
  allowedGuidance: [
    'Explain that anemia in pregnancy can have different causes and that iron deficiency is common, so evaluation belongs with the maternity care team.',
    'Support food education around iron-containing foods and foods containing vitamin C without presenting food alone as treatment for diagnosed anemia.',
    'Encourage keeping laboratory results, supplement instructions, and follow-up appointments together for review with the maternity care team.',
    'Follow clinician-entered supplement and dietary instructions rather than creating a Janani-specific dose or treatment plan.',
  ],
  prohibitedActions: [
    'Do not diagnose anemia or iron deficiency from symptoms or a single user-entered laboratory value.',
    'Do not assume every anemia is caused by iron deficiency.',
    'Do not prescribe, start, stop, increase, decrease, or substitute iron, folate, vitamin B12, or other supplements.',
    'Do not invent hemoglobin, ferritin, supplement-dose, or treatment thresholds for personalized interpretation.',
    'Do not claim that dietary changes alone are sufficient treatment for diagnosed anemia.',
  ],
  escalationGuidance: [
    'Marked fatigue, shortness of breath, palpitations, fainting, chest pain, heavy bleeding, or rapidly worsening symptoms should prompt contact with the maternity care team or urgent-care pathway as appropriate.',
    'Concerning laboratory results should be reviewed by the maternity care team rather than interpreted by Janani.',
  ],
  sourceIds: ['ACOG-ANEMIA-PB233', 'WHO-IRON-FOLATE-PREGNANCY-2024'],
};

export const HYPOTHYROIDISM_RULE_PACK: ConditionRulePack = {
  condition: 'hypothyroidism',
  version: '2026-08-09-draft-1',
  status: 'source_grounded_pending_clinical_review',
  enabledForPersonalization: false,
  allowedGuidance: [
    'Support recording thyroid test results, medication instructions, and upcoming follow-up dates without interpreting treatment adequacy.',
    'Encourage following the obstetric and thyroid care team’s monitoring plan during pregnancy.',
    'Allow general balanced-diet education only when it does not conflict with clinician instructions.',
  ],
  prohibitedActions: [
    'Do not diagnose hypothyroidism from symptoms or user-entered thyroid results.',
    'Do not invent pregnancy-specific TSH, free-T4, iodine, or medication targets for personalized interpretation.',
    'Do not start, stop, increase, decrease, or substitute thyroid hormone or iodine-containing treatment.',
    'Do not recommend timing changes between thyroid medication, supplements, or meals unless the instruction was entered by the user’s clinician.',
    'Do not reassure that a thyroid result means the pregnancy is safe or treatment is adequate.',
  ],
  escalationGuidance: [
    'Unexpected or concerning thyroid results should be reviewed with the obstetric or thyroid care team.',
    'Severe illness, fainting, chest pain, difficulty breathing, marked confusion, or another emergency should bypass nutrition guidance and use the fixed urgent-care flow.',
  ],
  sourceIds: ['ATA-2017-THYROID-PREGNANCY'],
};

export const HYPERTHYROIDISM_RULE_PACK: ConditionRulePack = {
  ...HYPOTHYROIDISM_RULE_PACK,
  condition: 'hyperthyroidism',
  version: '2026-08-09-draft-1',
  allowedGuidance: [
    'Support recording thyroid test results, symptoms, medication instructions, and upcoming follow-up dates without interpreting treatment adequacy.',
    'Encourage following the obstetric and thyroid care team’s monitoring and treatment plan during pregnancy.',
    'Allow general balanced-diet education only when it does not conflict with clinician instructions.',
  ],
  prohibitedActions: [
    'Do not diagnose hyperthyroidism or thyrotoxicosis from symptoms or user-entered thyroid results.',
    'Do not invent pregnancy-specific thyroid targets or treatment thresholds for personalized interpretation.',
    'Do not start, stop, increase, decrease, or substitute antithyroid medication, thyroid medication, iodine, or other treatment.',
    'Do not recommend supplement or medication changes based on diet content.',
    'Do not reassure that a thyroid result means the pregnancy is safe or treatment is adequate.',
  ],
};

export const CONDITION_RULE_PACKS: Partial<Record<HealthConditionCode, ConditionRulePack>> = {
  gestational_diabetes: GDM_RULE_PACK,
  preexisting_diabetes: PREEXISTING_DIABETES_RULE_PACK,
  chronic_hypertension: CHRONIC_HYPERTENSION_RULE_PACK,
  pregnancy_hypertension: PREGNANCY_HYPERTENSION_RULE_PACK,
  anemia: ANEMIA_RULE_PACK,
  hypothyroidism: HYPOTHYROIDISM_RULE_PACK,
  hyperthyroidism: HYPERTHYROIDISM_RULE_PACK,
};

export function getConditionRulePack(condition: HealthConditionCode): ConditionRulePack | null {
  return CONDITION_RULE_PACKS[condition] ?? null;
}
