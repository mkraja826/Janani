import { supabase } from '@/lib/supabase';

export type CarePlusAiCategory =
  | 'daily_summary'
  | 'weekly_meal_ideas'
  | 'appointment_summary'
  | 'health_trend_summary'
  | 'explain_guidance'
  | 'meal_alternative';

export type CarePlusStatus = {
  active: boolean;
  status: string;
  planCode?: string;
  currentPeriodEnd?: string | null;
  requestsUsed?: number;
  requestLimit?: number;
  inputTokensUsed?: number;
  inputTokenLimit?: number;
  outputTokensUsed?: number;
  outputTokenLimit?: number;
};

export type CarePlusAiResponse = {
  text?: string;
  error?: string;
  safety?: 'general' | 'urgent' | 'blocked';
  gatewayReady?: boolean;
  blockedConditions?: string[];
};

type CarePlusStatusRpcResult = {
  data: unknown;
  error: { message: string } | null;
};

export async function getCarePlusStatus(): Promise<CarePlusStatus> {
  // The production migration adds this RPC before the generated client types are refreshed.
  // Keep the compatibility cast narrow and remove it after regenerating types from production.
  const rpc = supabase.rpc as unknown as (name: 'get_own_care_plus_status') => PromiseLike<CarePlusStatusRpcResult>;
  const { data, error } = await rpc('get_own_care_plus_status');
  if (error) throw new Error(error.message);
  return (data ?? { active: false, status: 'none' }) as CarePlusStatus;
}

export async function requestCarePlusAi(input: {
  pregnancyId: string;
  category: CarePlusAiCategory;
  userText?: string;
}): Promise<CarePlusAiResponse> {
  const { data, error } = await supabase.functions.invoke<CarePlusAiResponse>('care-plus-ai', {
    body: {
      pregnancyId: input.pregnancyId,
      category: input.category,
      userText: input.userText?.trim().slice(0, 1200) || undefined,
    },
  });
  if (error) throw new Error(error.message || 'Janani Care+ could not respond right now.');
  return data ?? { error: 'empty_gateway_response' };
}
