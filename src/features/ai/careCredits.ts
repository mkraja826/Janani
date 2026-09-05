import { supabase } from '@/lib/supabase';
import type { CarePlusAiCategory } from '@/features/ai/carePlusAi';

export type CareCreditStatus = {
  balance: number;
  welcomeCredits: number;
  welcomeExpiresAt: string | null;
  currency: 'care_credit';
};

type RpcResult = {
  data: unknown;
  error: { message: string } | null;
};

export const CARE_CREDIT_COSTS: Record<CarePlusAiCategory, number> = {
  daily_summary: 2,
  weekly_meal_ideas: 5,
  appointment_summary: 3,
  health_trend_summary: 4,
  explain_guidance: 2,
  meal_alternative: 2,
};

export const LOW_CREDIT_THRESHOLD = 10;

export async function getCareCreditStatus(): Promise<CareCreditStatus> {
  const response = supabase.rpc('get_own_care_credit_status' as never) as unknown as PromiseLike<RpcResult>;
  const { data, error } = await response;
  if (error) throw new Error(error.message);
  const value = (data ?? {}) as Partial<CareCreditStatus>;
  return {
    balance: typeof value.balance === 'number' ? value.balance : 0,
    welcomeCredits: typeof value.welcomeCredits === 'number' ? value.welcomeCredits : 100,
    welcomeExpiresAt: typeof value.welcomeExpiresAt === 'string' ? value.welcomeExpiresAt : null,
    currency: 'care_credit',
  };
}
