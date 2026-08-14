import type { HealthConditionCode } from '@/features/health/healthProfile';

export type ConditionReviewState = 'source_grounded_pending_clinical_review' | 'approved' | 'retired';

export type ConditionRuleRegistration = {
  code: HealthConditionCode;
  reviewState: ConditionReviewState;
  enabledForPersonalization: boolean;
  sourceKeys: string[];
};

export const CONDITION_RULE_REGISTRY: Readonly<Record<string, ConditionRuleRegistration>> = {
  gestational_diabetes: {
    code: 'gestational_diabetes',
    reviewState: 'source_grounded_pending_clinical_review',
    enabledForPersonalization: false,
    sourceKeys: ['ADA_PREGNANCY', 'ACOG_GDM', 'WHO_DIABETES_PREGNANCY'],
  },
  preexisting_diabetes: {
    code: 'preexisting_diabetes',
    reviewState: 'source_grounded_pending_clinical_review',
    enabledForPersonalization: false,
    sourceKeys: ['ADA_PREGNANCY'],
  },
  chronic_hypertension: {
    code: 'chronic_hypertension',
    reviewState: 'source_grounded_pending_clinical_review',
    enabledForPersonalization: false,
    sourceKeys: ['ACOG_CHRONIC_HYPERTENSION'],
  },
  pregnancy_hypertension: {
    code: 'pregnancy_hypertension',
    reviewState: 'source_grounded_pending_clinical_review',
    enabledForPersonalization: false,
    sourceKeys: ['ACOG_HYPERTENSION'],
  },
  anemia: {
    code: 'anemia',
    reviewState: 'source_grounded_pending_clinical_review',
    enabledForPersonalization: false,
    sourceKeys: ['ACOG_ANEMIA', 'WHO_IRON_FOLATE'],
  },
  hypothyroidism: {
    code: 'hypothyroidism',
    reviewState: 'source_grounded_pending_clinical_review',
    enabledForPersonalization: false,
    sourceKeys: ['ATA_PREGNANCY'],
  },
  hyperthyroidism: {
    code: 'hyperthyroidism',
    reviewState: 'source_grounded_pending_clinical_review',
    enabledForPersonalization: false,
    sourceKeys: ['ATA_PREGNANCY'],
  },
};

export function getConditionRuleState(code: HealthConditionCode): ConditionRuleRegistration | null {
  return CONDITION_RULE_REGISTRY[code] ?? null;
}

export function isConditionPersonalizationApproved(code: HealthConditionCode): boolean {
  const registration = getConditionRuleState(code);
  return registration?.reviewState === 'approved' && registration.enabledForPersonalization;
}
