import type { HealthConditionCode, PregnancyType } from '@/features/health/healthProfile';

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';
export type WeightGainAssessment = {
  bmi: number | null;
  bmiCategory: BmiCategory | null;
  recommendedTotalGainKg: { min: number; max: number } | null;
  currentGainKg: number | null;
  requiresClinicianGoal: boolean;
  note: string;
};

export type MaternalNutritionContextInput = {
  pregnancyId: string;
  gestationalWeek: number | null;
  trimester: 1 | 2 | 3 | null;
  pregnancyType: PregnancyType;
  heightCm: number | null;
  prePregnancyWeightKg: number | null;
  currentWeightKg: number | null;
  dietaryPattern: string;
  cuisinePreferences: string[];
  regionPreference: string | null;
  allergies: string[];
  foodsAvoided: string[];
  activityLevel: string;
  activeConditions: HealthConditionCode[];
  clinicianInstructions: string | null;
  activeMedicationNames: string[];
};

export type MaternalNutritionAssessment = {
  weight: WeightGainAssessment;
  contextVersion: string;
  materialReasons: string[];
};

function round(value: number, precision = 1) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function calculatePrePregnancyBmi(heightCm: number | null, weightKg: number | null): number | null {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
  const meters = heightCm / 100;
  return round(weightKg / (meters * meters), 1);
}

export function classifyBmi(bmi: number | null): BmiCategory | null {
  if (bmi === null) return null;
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

function recommendedGainFor(category: BmiCategory, pregnancyType: PregnancyType) {
  if (pregnancyType === 'higher_multiple' || pregnancyType === 'unknown') return null;
  if (pregnancyType === 'twins') {
    if (category === 'underweight') return { min: 22.7, max: 28.1 };
    if (category === 'normal') return { min: 16.8, max: 24.5 };
    if (category === 'overweight') return { min: 14.1, max: 22.7 };
    return { min: 11.3, max: 19.1 };
  }
  if (category === 'underweight') return { min: 12.7, max: 18.1 };
  if (category === 'normal') return { min: 11.3, max: 15.9 };
  if (category === 'overweight') return { min: 6.8, max: 11.3 };
  return { min: 5, max: 9.1 };
}

export function assessPregnancyWeightGain(input: Pick<MaternalNutritionContextInput, 'heightCm' | 'prePregnancyWeightKg' | 'currentWeightKg' | 'pregnancyType'>): WeightGainAssessment {
  const bmi = calculatePrePregnancyBmi(input.heightCm, input.prePregnancyWeightKg);
  const bmiCategory = classifyBmi(bmi);
  const recommendedTotalGainKg = bmiCategory ? recommendedGainFor(bmiCategory, input.pregnancyType) : null;
  const currentGainKg = input.prePregnancyWeightKg !== null && input.currentWeightKg !== null
    ? round(input.currentWeightKg - input.prePregnancyWeightKg, 1)
    : null;
  const requiresClinicianGoal = input.pregnancyType === 'higher_multiple' || !recommendedTotalGainKg;

  return {
    bmi,
    bmiCategory,
    recommendedTotalGainKg,
    currentGainKg,
    requiresClinicianGoal,
    note: requiresClinicianGoal
      ? 'Janani needs a clinician-provided weight-gain goal for this pregnancy before using weight trajectory for meal planning.'
      : 'Janani uses this range as a pregnancy weight-gain reference only. It does not prescribe weight loss or calorie restriction.',
  };
}

function stableNormalize(value: unknown): unknown {
  if (Array.isArray(value)) return [...value].map(stableNormalize).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => [key, stableNormalize(nested)]));
  }
  return value;
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function buildNutritionContextVersion(input: MaternalNutritionContextInput): string {
  return `nutrition-v1-${hashString(JSON.stringify(stableNormalize(input)))}`;
}

export function assessMaternalNutritionContext(input: MaternalNutritionContextInput): MaternalNutritionAssessment {
  const materialReasons: string[] = [];
  if (input.gestationalWeek !== null) materialReasons.push(`pregnancy-week:${input.gestationalWeek}`);
  if (input.currentWeightKg !== null) materialReasons.push('weight');
  if (input.dietaryPattern) materialReasons.push('dietary-pattern');
  if (input.cuisinePreferences.length) materialReasons.push('cuisine');
  if (input.regionPreference) materialReasons.push('region');
  if (input.allergies.length) materialReasons.push('allergies');
  if (input.foodsAvoided.length) materialReasons.push('foods-avoided');
  if (input.activeConditions.length) materialReasons.push('conditions');
  if (input.clinicianInstructions?.trim()) materialReasons.push('clinician-instructions');
  if (input.activeMedicationNames.length) materialReasons.push('medications-supplements');

  return {
    weight: assessPregnancyWeightGain(input),
    contextVersion: buildNutritionContextVersion(input),
    materialReasons,
  };
}
