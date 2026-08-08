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

export const CONDITION_RULE_PACKS: Partial<Record<HealthConditionCode, ConditionRulePack>> = {
  gestational_diabetes: GDM_RULE_PACK,
};

export function getConditionRulePack(condition: HealthConditionCode): ConditionRulePack | null {
  return CONDITION_RULE_PACKS[condition] ?? null;
}
