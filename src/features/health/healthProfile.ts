import { supabase } from '@/lib/supabase';

export type PregnancyType = 'singleton' | 'twins' | 'higher_multiple' | 'unknown';
export type DietaryPattern = 'vegetarian' | 'eggetarian' | 'non_vegetarian' | 'vegan' | 'no_preference';
export type ActivityLevel = 'low' | 'moderate' | 'high' | 'clinician_restricted' | 'not_set';
export type ConditionStatus = 'doctor_diagnosed' | 'under_evaluation' | 'pregnancy_history';

export type HealthConditionCode =
  | 'preexisting_diabetes'
  | 'gestational_diabetes'
  | 'hypothyroidism'
  | 'hyperthyroidism'
  | 'chronic_hypertension'
  | 'pregnancy_hypertension'
  | 'anemia'
  | 'pcos'
  | 'previous_preeclampsia'
  | 'previous_miscarriage'
  | 'previous_preterm_birth';

export type HealthCondition = { condition_code: HealthConditionCode; status: ConditionStatus };

export type HealthProfile = {
  pregnancy_id: string;
  current_weight_kg: number | null;
  pregnancy_type: PregnancyType;
  dietary_pattern: DietaryPattern;
  activity_level: ActivityLevel;
  cuisine_preferences: string[];
  allergies: string[];
  foods_avoided: string[];
  clinician_dietary_instructions: string | null;
  conditions: HealthCondition[];
};

export type SaveHealthProfileInput = Omit<HealthProfile, 'pregnancy_id' | 'conditions'> & { conditions: HealthCondition[] };

type RpcError = { message: string };
type RpcResponse<T> = PromiseLike<{ data: T | null; error: RpcError | null }>;

function healthRpc<T>(fn: string, args: Record<string, unknown>): RpcResponse<T> {
  return supabase.rpc(fn as never, args as never) as unknown as RpcResponse<T>;
}

export const CONDITION_OPTIONS: ReadonlyArray<{ code: HealthConditionCode; label: string; historyOnly?: boolean }> = [
  { code: 'preexisting_diabetes', label: 'Pre-existing diabetes' },
  { code: 'gestational_diabetes', label: 'Gestational diabetes' },
  { code: 'hypothyroidism', label: 'Hypothyroidism' },
  { code: 'hyperthyroidism', label: 'Hyperthyroidism' },
  { code: 'chronic_hypertension', label: 'Chronic high blood pressure' },
  { code: 'pregnancy_hypertension', label: 'Pregnancy-related high blood pressure' },
  { code: 'anemia', label: 'Anemia' },
  { code: 'pcos', label: 'PCOS' },
  { code: 'previous_preeclampsia', label: 'Previous preeclampsia', historyOnly: true },
  { code: 'previous_miscarriage', label: 'Previous miscarriage', historyOnly: true },
  { code: 'previous_preterm_birth', label: 'Previous preterm birth', historyOnly: true },
];

export async function loadHealthProfile(pregnancyId: string): Promise<HealthProfile> {
  const { data, error } = await healthRpc<HealthProfile>('get_own_health_profile', { p_pregnancy_id: pregnancyId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Janani could not load this health profile.');
  return data;
}

export async function saveHealthProfile(pregnancyId: string, input: SaveHealthProfileInput): Promise<HealthProfile> {
  const { conditions, ...profile } = input;
  const { data, error } = await healthRpc<HealthProfile>('save_own_health_profile', {
    p_pregnancy_id: pregnancyId,
    p_profile: profile,
    p_conditions: conditions,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Janani could not save this health profile.');
  return data;
}

export function parseList(value: string): string[] {
  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))]
    .map((item) => item.slice(0, 80))
    .slice(0, 20);
}

export function joinList(value: string[]): string {
  return value.join(', ');
}
