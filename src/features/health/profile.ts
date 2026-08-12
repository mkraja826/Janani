export const DIETARY_PATTERNS = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'non_vegetarian', label: 'Non-vegetarian' },
  { value: 'eggetarian', label: 'Eggetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'other', label: 'Other' },
] as const;

export type DietaryPattern = (typeof DIETARY_PATTERNS)[number]['value'];

export const CONDITION_OPTIONS = [
  { value: 'diabetes_pre_existing', label: 'Diabetes before pregnancy' },
  { value: 'gestational_diabetes', label: 'Gestational diabetes' },
  { value: 'hypothyroidism', label: 'Hypothyroidism' },
  { value: 'hyperthyroidism', label: 'Hyperthyroidism' },
  { value: 'chronic_hypertension', label: 'High BP before pregnancy' },
  { value: 'gestational_hypertension', label: 'High BP during pregnancy' },
  { value: 'anaemia', label: 'Anaemia' },
  { value: 'pcos', label: 'PCOS' },
  { value: 'asthma', label: 'Asthma' },
  { value: 'epilepsy', label: 'Epilepsy' },
  { value: 'kidney_disease', label: 'Kidney condition' },
  { value: 'heart_condition', label: 'Heart condition' },
  { value: 'other', label: 'Another condition' },
] as const;

export type ConditionCode = (typeof CONDITION_OPTIONS)[number]['value'];

export type MaternalHealthProfile = {
  pregnancy_id: string;
  date_of_birth: string | null;
  dietary_pattern: DietaryPattern | null;
  allergies: string[];
  condition_codes: ConditionCode[];
  other_health_details: string | null;
  data_source: 'self_reported';
  created_at: string;
  updated_at: string;
};

export type HealthProfileCompletionInput = {
  dateOfBirth: string | null;
  dietaryPattern: DietaryPattern | null;
  allergiesReviewed: boolean;
  conditionsReviewed: boolean;
  pregnancyBasicsComplete: boolean;
};

export type HealthProfileCompletion = {
  completed: number;
  total: number;
  label: 'Getting started' | 'Janani knows the basics' | 'Well understood';
  missing: string[];
};

export function calculateHealthProfileCompletion(
  input: HealthProfileCompletionInput,
): HealthProfileCompletion {
  const checks = [
    { done: Boolean(input.dateOfBirth), label: 'age' },
    { done: Boolean(input.dietaryPattern), label: 'food preference' },
    { done: input.allergiesReviewed, label: 'allergies' },
    { done: input.conditionsReviewed, label: 'health conditions' },
    { done: input.pregnancyBasicsComplete, label: 'height and pre-pregnancy weight' },
  ];
  const completed = checks.filter((item) => item.done).length;
  const label = completed >= 5
    ? 'Well understood'
    : completed >= 3
      ? 'Janani knows the basics'
      : 'Getting started';

  return {
    completed,
    total: checks.length,
    label,
    missing: checks.filter((item) => !item.done).map((item) => item.label),
  };
}

export function dietaryPatternLabel(value: DietaryPattern | null): string {
  return DIETARY_PATTERNS.find((item) => item.value === value)?.label ?? 'Not added yet';
}

export function conditionLabel(value: string): string {
  return CONDITION_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

export function normalizeAllergies(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, items) => items.findIndex((candidate) => candidate.toLowerCase() === item.toLowerCase()) === index)
    .slice(0, 20);
}

export function ageFromDateOfBirth(value: string | null, now = new Date()): number | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  let age = now.getFullYear() - year;
  const birthdayPassed = now.getMonth() + 1 > month
    || (now.getMonth() + 1 === month && now.getDate() >= day);
  if (!birthdayPassed) age -= 1;
  return age >= 0 ? age : null;
}
