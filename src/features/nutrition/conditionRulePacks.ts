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

export const CONDITION_RULE_PACKS: Partial<Record<HealthConditionCode, ConditionRulePack>> = {
  gestational_diabetes: GDM_RULE_PACK,
  preexisting_diabetes: PREEXISTING_DIABETES_RULE_PACK,
  chronic_hypertension: CHRONIC_HYPERTENSION_RULE_PACK,
  pregnancy_hypertension: PREGNANCY_HYPERTENSION_RULE_PACK,
};

export function getConditionRulePack(condition: HealthConditionCode): ConditionRulePack | null {
  return CONDITION_RULE_PACKS[condition] ?? null;
}
