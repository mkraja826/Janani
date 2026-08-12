export type HealthConditionStatus = 'doctor_diagnosed' | 'under_evaluation' | 'pregnancy_history';

export type HealthCondition = {
  condition_code: string;
  status: HealthConditionStatus;
};

export type HealthProfile = {
  pregnancy_id: string;
  current_weight_kg: number | null;
  pregnancy_type: 'singleton' | 'twins' | 'higher_multiple' | 'unknown';
  dietary_pattern: 'vegetarian' | 'eggetarian' | 'non_vegetarian' | 'vegan' | 'no_preference';
  activity_level: 'low' | 'moderate' | 'high' | 'clinician_restricted' | 'not_set';
  cuisine_preferences: string[];
  allergies: string[];
  foods_avoided: string[];
  clinician_dietary_instructions: string | null;
  conditions: HealthCondition[];
};

export const CONDITION_OPTIONS = [
  ['preexisting_diabetes', 'Diabetes before pregnancy', 'doctor_diagnosed'],
  ['gestational_diabetes', 'Gestational diabetes', 'doctor_diagnosed'],
  ['hypothyroidism', 'Hypothyroidism', 'doctor_diagnosed'],
  ['hyperthyroidism', 'Hyperthyroidism', 'doctor_diagnosed'],
  ['chronic_hypertension', 'High blood pressure before pregnancy', 'doctor_diagnosed'],
  ['pregnancy_hypertension', 'High blood pressure during pregnancy', 'doctor_diagnosed'],
  ['anemia', 'Anaemia', 'doctor_diagnosed'],
  ['pcos', 'PCOS', 'doctor_diagnosed'],
  ['previous_preeclampsia', 'Previous pre-eclampsia', 'pregnancy_history'],
  ['previous_miscarriage', 'Previous miscarriage', 'pregnancy_history'],
  ['previous_preterm_birth', 'Previous preterm birth', 'pregnancy_history'],
] as const;

export const DIET_OPTIONS = [
  ['no_preference', 'No preference'],
  ['vegetarian', 'Vegetarian'],
  ['eggetarian', 'Eggetarian'],
  ['non_vegetarian', 'Non-vegetarian'],
  ['vegan', 'Vegan'],
] as const;

export const ACTIVITY_OPTIONS = [
  ['not_set', 'Not set'],
  ['low', 'Mostly resting / light activity'],
  ['moderate', 'Moderately active'],
  ['high', 'Highly active'],
  ['clinician_restricted', 'Doctor advised activity restriction'],
] as const;

export function emptyHealthProfile(pregnancyId: string): HealthProfile {
  return {
    pregnancy_id: pregnancyId,
    current_weight_kg: null,
    pregnancy_type: 'singleton',
    dietary_pattern: 'no_preference',
    activity_level: 'not_set',
    cuisine_preferences: [],
    allergies: [],
    foods_avoided: [],
    clinician_dietary_instructions: null,
    conditions: [],
  };
}

export function parseHealthProfile(value: unknown, pregnancyId: string): HealthProfile {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyHealthProfile(pregnancyId);
  const data = value as Record<string, unknown>;
  const arrayOfStrings = (item: unknown) => Array.isArray(item) ? item.filter((x): x is string => typeof x === 'string') : [];
  const conditions = Array.isArray(data.conditions)
    ? data.conditions.flatMap((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
        const condition = item as Record<string, unknown>;
        if (typeof condition.condition_code !== 'string' || typeof condition.status !== 'string') return [];
        return [{ condition_code: condition.condition_code, status: condition.status as HealthConditionStatus }];
      })
    : [];
  return {
    pregnancy_id: typeof data.pregnancy_id === 'string' ? data.pregnancy_id : pregnancyId,
    current_weight_kg: typeof data.current_weight_kg === 'number' ? data.current_weight_kg : null,
    pregnancy_type: (typeof data.pregnancy_type === 'string' ? data.pregnancy_type : 'singleton') as HealthProfile['pregnancy_type'],
    dietary_pattern: (typeof data.dietary_pattern === 'string' ? data.dietary_pattern : 'no_preference') as HealthProfile['dietary_pattern'],
    activity_level: (typeof data.activity_level === 'string' ? data.activity_level : 'not_set') as HealthProfile['activity_level'],
    cuisine_preferences: arrayOfStrings(data.cuisine_preferences),
    allergies: arrayOfStrings(data.allergies),
    foods_avoided: arrayOfStrings(data.foods_avoided),
    clinician_dietary_instructions: typeof data.clinician_dietary_instructions === 'string' ? data.clinician_dietary_instructions : null,
    conditions,
  };
}

export function healthProfileCompletion(profile: HealthProfile, hasPregnancyBasics: boolean) {
  const groups = [
    hasPregnancyBasics,
    profile.current_weight_kg !== null,
    profile.dietary_pattern !== 'no_preference',
    profile.activity_level !== 'not_set',
    profile.allergies.length > 0 || profile.foods_avoided.length > 0,
    profile.conditions.length > 0,
  ];
  const completed = groups.filter(Boolean).length;
  return { completed, total: groups.length, ratio: completed / groups.length };
}

export function conditionLabel(code: string): string {
  return CONDITION_OPTIONS.find(([value]) => value === code)?.[1] ?? code.replaceAll('_', ' ');
}
