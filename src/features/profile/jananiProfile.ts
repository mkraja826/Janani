import { getPregnancyProgress } from '@/features/pregnancy/progress';
import { loadHealthProfile, type HealthCondition } from '@/features/health/healthProfile';
import { loadHealthTracker, type HealthTrackerSnapshot } from '@/features/health/healthTracker';
import { supabase } from '@/lib/supabase';

export type JananiProfile = {
  pregnancy: {
    id: string;
    dueDate: string | null;
    gestationalWeek: number | null;
    gestationalDay: number | null;
    trimester: 1 | 2 | 3 | null;
    pregnancyType: string;
  };
  health: {
    currentWeightKg: number | null;
    activityLevel: string;
    conditions: HealthCondition[];
  };
  nutrition: {
    dietaryPattern: string;
    cuisinePreferences: string[];
    allergies: string[];
    foodsAvoided: string[];
    clinicianInstructions: string | null;
  };
  trends: {
    latestWeightKg: number | null;
    recentBloodPressure: Array<{ systolic: number; diastolic: number; pulse: number | null; recordedAt: string }>;
    recentGlucose: Array<{ valueMgDl: number; context: string; recordedAt: string }>;
    recentLabs: Array<{ testName: string; resultValue: string; unit: string | null; testedOn: string }>;
    recentSymptoms: Array<{ symptom: string; severity: number; startedAt: string; contactedCare: boolean }>;
  };
};

export type NutritionContext = Pick<JananiProfile, 'pregnancy' | 'nutrition'> & {
  activeConditions: string[];
  latestWeightKg: number | null;
};

export type HealthTrendContext = Pick<JananiProfile, 'pregnancy' | 'trends'> & {
  activeConditions: string[];
};

function activeConditionCodes(conditions: HealthCondition[]) {
  return conditions
    .filter((condition) => condition.status !== 'pregnancy_history')
    .map((condition) => condition.condition_code);
}

function trimTracker(snapshot: HealthTrackerSnapshot): JananiProfile['trends'] {
  return {
    latestWeightKg: snapshot.weight[0]?.weight_kg ?? null,
    recentBloodPressure: snapshot.blood_pressure.slice(0, 14).map((entry) => ({
      systolic: entry.systolic,
      diastolic: entry.diastolic,
      pulse: entry.pulse,
      recordedAt: entry.recorded_at,
    })),
    recentGlucose: snapshot.glucose.slice(0, 20).map((entry) => ({
      valueMgDl: entry.value_mg_dl,
      context: entry.context,
      recordedAt: entry.recorded_at,
    })),
    recentLabs: snapshot.labs.slice(0, 12).map((entry) => ({
      testName: entry.test_name,
      resultValue: entry.result_value,
      unit: entry.unit,
      testedOn: entry.tested_on,
    })),
    recentSymptoms: snapshot.symptoms.slice(0, 20).map((entry) => ({
      symptom: entry.symptom,
      severity: entry.severity,
      startedAt: entry.started_at,
      contactedCare: entry.contacted_care,
    })),
  };
}

export async function buildJananiProfile(pregnancyId: string): Promise<JananiProfile> {
  const [{ data: pregnancy, error: pregnancyError }, profile, tracker] = await Promise.all([
    supabase.from('pregnancies').select('id,due_date,status').eq('id', pregnancyId).maybeSingle(),
    loadHealthProfile(pregnancyId),
    loadHealthTracker(pregnancyId),
  ]);

  if (pregnancyError) throw new Error(pregnancyError.message);
  if (!pregnancy) throw new Error('Janani could not load this pregnancy.');

  const progress = pregnancy.due_date ? getPregnancyProgress(pregnancy.due_date) : null;
  return {
    pregnancy: {
      id: pregnancyId,
      dueDate: pregnancy.due_date ?? null,
      gestationalWeek: progress?.gestationalWeek ?? null,
      gestationalDay: progress?.gestationalDay ?? null,
      trimester: progress?.trimester ?? null,
      pregnancyType: profile.pregnancy_type,
    },
    health: {
      currentWeightKg: profile.current_weight_kg,
      activityLevel: profile.activity_level,
      conditions: profile.conditions,
    },
    nutrition: {
      dietaryPattern: profile.dietary_pattern,
      cuisinePreferences: profile.cuisine_preferences,
      allergies: profile.allergies,
      foodsAvoided: profile.foods_avoided,
      clinicianInstructions: profile.clinician_dietary_instructions,
    },
    trends: trimTracker(tracker),
  };
}

export function buildNutritionContext(profile: JananiProfile): NutritionContext {
  return {
    pregnancy: profile.pregnancy,
    nutrition: profile.nutrition,
    activeConditions: activeConditionCodes(profile.health.conditions),
    latestWeightKg: profile.trends.latestWeightKg ?? profile.health.currentWeightKg,
  };
}

export function buildHealthTrendContext(profile: JananiProfile): HealthTrendContext {
  return {
    pregnancy: profile.pregnancy,
    trends: profile.trends,
    activeConditions: activeConditionCodes(profile.health.conditions),
  };
}
