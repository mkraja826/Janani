import type { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type DailyPersonalizationAction =
  | 'review_report'
  | 'upcoming_appointment'
  | 'complete_health_profile'
  | 'ask_food_ideas'
  | 'open_journey';

export type DailyPersonalization = {
  snapshotVersion: string;
  actionType: DailyPersonalizationAction;
  pendingReportReviewCount: number;
  healthProfileMissingFields: string[];
  dietaryPattern: string | null;
  cuisinePreferences: string[];
  aiPersonalizationEnabled: boolean;
  actionMeta: Record<string, unknown>;
};

type RpcResult<T> = { data: T | null; error: PostgrestError | null };
type DailyRpc = <T>(
  fn: 'get_current_own_daily_personalization',
  args?: Record<string, never>,
) => PromiseLike<RpcResult<T>>;

const dailyRpc = supabase.rpc.bind(supabase) as unknown as DailyRpc;

function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').slice(0, 20)
    : [];
}

const ACTIONS = new Set<DailyPersonalizationAction>([
  'review_report',
  'upcoming_appointment',
  'complete_health_profile',
  'ask_food_ideas',
  'open_journey',
]);

export function parseDailyPersonalization(value: unknown): DailyPersonalization | null {
  const row = asObject(value);
  if (!row || typeof row.actionType !== 'string' || !ACTIONS.has(row.actionType as DailyPersonalizationAction)) {
    return null;
  }
  return {
    snapshotVersion: typeof row.snapshotVersion === 'string' ? row.snapshotVersion : 'janani-daily-v1',
    actionType: row.actionType as DailyPersonalizationAction,
    pendingReportReviewCount: typeof row.pendingReportReviewCount === 'number' ? row.pendingReportReviewCount : 0,
    healthProfileMissingFields: stringArray(row.healthProfileMissingFields),
    dietaryPattern: typeof row.dietaryPattern === 'string' ? row.dietaryPattern : null,
    cuisinePreferences: stringArray(row.cuisinePreferences),
    aiPersonalizationEnabled: row.aiPersonalizationEnabled === true,
    actionMeta: asObject(row.actionMeta) ?? {},
  };
}

export function getCurrentDailyPersonalization(): PromiseLike<RpcResult<unknown>> {
  return dailyRpc('get_current_own_daily_personalization');
}
