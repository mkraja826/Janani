import { getPregnancyProgress } from '@/features/pregnancy/progress';
import { loadHealthProfile, type HealthCondition, type HealthConditionCode } from '@/features/health/healthProfile';
import { loadHealthTracker, type HealthTrackerSnapshot } from '@/features/health/healthTracker';
import { listCareAppointments, type CareAppointment } from '@/features/care/careTimeline';
import { personalizeNutrition } from '@/features/nutrition/personalizationEngine';
import { loadPrivateCareContext, type CareMedication, type SupportedLanguage } from '@/features/profile/careContext';
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
    relevantMedicalHistory: string | null;
    previousPregnancyHistory: string | null;
    broaderClinicianInstructions: string | null;
  };
  nutrition: {
    dietaryPattern: string;
    cuisinePreferences: string[];
    allergies: string[];
    foodsAvoided: string[];
    clinicianInstructions: string | null;
    regionPreference: string | null;
  };
  preferences: {
    preferredLanguage: SupportedLanguage;
  };
  privacy: {
    shareCareTimelineWithPartner: boolean;
    sharePregnancyProgressWithPartner: boolean;
  };
  medications: {
    active: CareMedication[];
    inactive: CareMedication[];
  };
  trends: {
    latestWeightKg: number | null;
    recentBloodPressure: Array<{ systolic: number; diastolic: number; pulse: number | null; recordedAt: string }>;
    recentGlucose: Array<{ valueMgDl: number; context: string; recordedAt: string }>;
    recentLabs: Array<{ testName: string; resultValue: string; unit: string | null; testedOn: string }>;
    recentSymptoms: Array<{ symptom: string; severity: number; startedAt: string; contactedCare: boolean }>;
  };
  care: {
    upcoming: CareAppointment[];
    recentCompleted: CareAppointment[];
  };
};

export type NutritionContext = Pick<JananiProfile, 'pregnancy' | 'nutrition' | 'preferences'> & {
  activeConditions: HealthConditionCode[];
  latestWeightKg: number | null;
  blockedConditionCodes: HealthConditionCode[];
  safetyNotes: string[];
  activeMedicationsAndSupplements: CareMedication[];
};

export type HealthTrendContext = Pick<JananiProfile, 'pregnancy' | 'trends' | 'preferences'> & {
  activeConditions: HealthConditionCode[];
  clinicianInstructions: string | null;
  activeMedicationsAndSupplements: CareMedication[];
};

export type AppointmentContext = Pick<JananiProfile, 'pregnancy' | 'preferences'> & {
  activeConditions: HealthConditionCode[];
  upcoming: CareAppointment[];
  recentCompleted: CareAppointment[];
  recentSymptoms: JananiProfile['trends']['recentSymptoms'];
  recentBloodPressure: JananiProfile['trends']['recentBloodPressure'];
  recentGlucose: JananiProfile['trends']['recentGlucose'];
  activeMedicationsAndSupplements: CareMedication[];
  medicalHistory: string | null;
  previousPregnancyHistory: string | null;
  clinicianInstructions: string | null;
};

export type DailyCareContext = Pick<JananiProfile, 'pregnancy' | 'preferences'> & {
  activeConditions: HealthConditionCode[];
  latestWeightKg: number | null;
  recentSymptoms: JananiProfile['trends']['recentSymptoms'];
  upcomingCare: CareAppointment[];
  activeMedicationsAndSupplements: CareMedication[];
  clinicianInstructions: string | null;
};

export type EducationContext = Pick<JananiProfile, 'pregnancy' | 'preferences'> & {
  activeConditions: HealthConditionCode[];
  medicalHistory: string | null;
  clinicianInstructions: string | null;
};

export type PartnerSupportContext = Pick<JananiProfile, 'pregnancy' | 'preferences'> & {
  canSharePregnancyProgress: boolean;
  canShareCareTimeline: boolean;
  sharedUpcomingCare: CareAppointment[];
};

function activeConditionCodes(conditions: HealthCondition[]): HealthConditionCode[] {
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

function summarizeCare(items: CareAppointment[]): JananiProfile['care'] {
  const now = Date.now();
  return {
    upcoming: items
      .filter((item) => item.status === 'scheduled' && new Date(item.scheduled_at).getTime() >= now)
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
      .slice(0, 6),
    recentCompleted: items
      .filter((item) => item.status === 'completed')
      .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
      .slice(0, 6),
  };
}

export async function buildJananiProfile(pregnancyId: string): Promise<JananiProfile> {
  const [{ data: pregnancy, error: pregnancyError }, profile, tracker, careAppointments, privateCare] = await Promise.all([
    supabase.from('pregnancies').select('id,due_date,status').eq('id', pregnancyId).maybeSingle(),
    loadHealthProfile(pregnancyId),
    loadHealthTracker(pregnancyId),
    listCareAppointments(pregnancyId),
    loadPrivateCareContext(pregnancyId),
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
      relevantMedicalHistory: privateCare.relevant_medical_history,
      previousPregnancyHistory: privateCare.previous_pregnancy_history,
      broaderClinicianInstructions: privateCare.broader_clinician_instructions,
    },
    nutrition: {
      dietaryPattern: profile.dietary_pattern,
      cuisinePreferences: profile.cuisine_preferences,
      allergies: profile.allergies,
      foodsAvoided: profile.foods_avoided,
      clinicianInstructions: profile.clinician_dietary_instructions,
      regionPreference: privateCare.region_preference,
    },
    preferences: {
      preferredLanguage: privateCare.preferred_language,
    },
    privacy: {
      shareCareTimelineWithPartner: privateCare.share_care_timeline_with_partner,
      sharePregnancyProgressWithPartner: privateCare.share_pregnancy_progress_with_partner,
    },
    medications: {
      active: privateCare.medications.filter((item) => item.active),
      inactive: privateCare.medications.filter((item) => !item.active),
    },
    trends: trimTracker(tracker),
    care: summarizeCare(careAppointments),
  };
}

export function buildNutritionContext(profile: JananiProfile): NutritionContext {
  const activeConditions = activeConditionCodes(profile.health.conditions);
  const personalization = personalizeNutrition({
    trimester: profile.pregnancy.trimester,
    dietaryPattern: profile.nutrition.dietaryPattern,
    allergies: profile.nutrition.allergies,
    foodsAvoided: profile.nutrition.foodsAvoided,
    activeConditions,
    clinicianInstructions: profile.nutrition.clinicianInstructions,
  });

  return {
    pregnancy: profile.pregnancy,
    nutrition: profile.nutrition,
    preferences: profile.preferences,
    activeConditions,
    latestWeightKg: profile.trends.latestWeightKg ?? profile.health.currentWeightKg,
    blockedConditionCodes: personalization.blockedConditionCodes,
    safetyNotes: personalization.safetyNotes,
    activeMedicationsAndSupplements: profile.medications.active,
  };
}

export function buildHealthTrendContext(profile: JananiProfile): HealthTrendContext {
  return {
    pregnancy: profile.pregnancy,
    trends: profile.trends,
    preferences: profile.preferences,
    activeConditions: activeConditionCodes(profile.health.conditions),
    clinicianInstructions: profile.health.broaderClinicianInstructions,
    activeMedicationsAndSupplements: profile.medications.active,
  };
}

export function buildAppointmentContext(profile: JananiProfile): AppointmentContext {
  return {
    pregnancy: profile.pregnancy,
    preferences: profile.preferences,
    activeConditions: activeConditionCodes(profile.health.conditions),
    upcoming: profile.care.upcoming,
    recentCompleted: profile.care.recentCompleted,
    recentSymptoms: profile.trends.recentSymptoms,
    recentBloodPressure: profile.trends.recentBloodPressure,
    recentGlucose: profile.trends.recentGlucose,
    activeMedicationsAndSupplements: profile.medications.active,
    medicalHistory: profile.health.relevantMedicalHistory,
    previousPregnancyHistory: profile.health.previousPregnancyHistory,
    clinicianInstructions: profile.health.broaderClinicianInstructions,
  };
}

export function buildDailyCareContext(profile: JananiProfile): DailyCareContext {
  return {
    pregnancy: profile.pregnancy,
    preferences: profile.preferences,
    activeConditions: activeConditionCodes(profile.health.conditions),
    latestWeightKg: profile.trends.latestWeightKg ?? profile.health.currentWeightKg,
    recentSymptoms: profile.trends.recentSymptoms.slice(0, 8),
    upcomingCare: profile.care.upcoming.slice(0, 3),
    activeMedicationsAndSupplements: profile.medications.active,
    clinicianInstructions: profile.health.broaderClinicianInstructions,
  };
}

export function buildEducationContext(profile: JananiProfile): EducationContext {
  return {
    pregnancy: profile.pregnancy,
    preferences: profile.preferences,
    activeConditions: activeConditionCodes(profile.health.conditions),
    medicalHistory: profile.health.relevantMedicalHistory,
    clinicianInstructions: profile.health.broaderClinicianInstructions,
  };
}

export function buildPartnerSupportContext(profile: JananiProfile): PartnerSupportContext {
  return {
    pregnancy: profile.pregnancy,
    preferences: profile.preferences,
    canSharePregnancyProgress: profile.privacy.sharePregnancyProgressWithPartner,
    canShareCareTimeline: profile.privacy.shareCareTimelineWithPartner,
    sharedUpcomingCare: profile.privacy.shareCareTimelineWithPartner ? profile.care.upcoming.slice(0, 3) : [],
  };
}
