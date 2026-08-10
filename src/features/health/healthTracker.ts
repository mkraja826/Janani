import { supabase } from '@/lib/supabase';

export type TrackerKind = 'weight' | 'blood_pressure' | 'glucose' | 'lab' | 'symptom';
export type WeightEntry = { id: string; recorded_at: string; weight_kg: number; note: string | null };
export type BloodPressureEntry = { id: string; recorded_at: string; systolic: number; diastolic: number; pulse: number | null; symptoms: string[]; note: string | null };
export type GlucoseEntry = { id: string; recorded_at: string; value_mg_dl: number; context: 'fasting'|'before_meal'|'after_meal'|'random'|'other'; minutes_after_meal: number | null; note: string | null };
export type LabEntry = { id: string; tested_on: string; test_name: string; result_value: string; unit: string | null; reference_range: string | null; note: string | null };
export type SymptomEntry = { id: string; started_at: string; symptom: string; severity: number; duration_minutes: number | null; contacted_care: boolean; note: string | null };

export type HealthTrackerSnapshot = {
  weight: WeightEntry[];
  blood_pressure: BloodPressureEntry[];
  glucose: GlucoseEntry[];
  labs: LabEntry[];
  symptoms: SymptomEntry[];
};

type RpcError = { message: string };
type RpcResponse<T> = PromiseLike<{ data: T | null; error: RpcError | null }>;
type TrackerRpc = <T>(fn: string, args: Record<string, unknown>) => RpcResponse<T>;
const trackerRpc = supabase.rpc as unknown as TrackerRpc;

export async function loadHealthTracker(pregnancyId: string): Promise<HealthTrackerSnapshot> {
  const { data, error } = await trackerRpc<HealthTrackerSnapshot>('get_own_health_tracker', { p_pregnancy_id: pregnancyId });
  if (error) throw new Error(error.message);
  return data ?? { weight: [], blood_pressure: [], glucose: [], labs: [], symptoms: [] };
}

export async function addHealthTrackerEntry(pregnancyId: string, kind: TrackerKind, entry: Record<string, unknown>): Promise<string> {
  const { data, error } = await trackerRpc<string>('add_own_health_tracker_entry', {
    p_pregnancy_id: pregnancyId,
    p_kind: kind,
    p_entry: entry,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Janani could not save this health entry.');
  return data;
}

export async function deleteHealthTrackerEntry(kind: TrackerKind, entryId: string): Promise<void> {
  const { error } = await trackerRpc<null>('delete_own_health_tracker_entry', {
    p_kind: kind,
    p_entry_id: entryId,
  });
  if (error) throw new Error(error.message);
}

export function parseCommaList(value: string): string[] {
  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))]
    .map((item) => item.slice(0, 80))
    .slice(0, 20);
}
