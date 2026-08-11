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

async function readFunctionErrorBody(error: unknown): Promise<CarePlusAiResponse | null> {
  const context = (error as { context?: Response } | null)?.context;
  if (!context || typeof context.clone !== 'function') return null;
  try {
    const body = await context.clone().json();
    if (body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string') {
      return body as CarePlusAiResponse;
    }
  } catch {
    // A network/proxy failure may not contain JSON. The caller will use a safe generic error.
  }
  return null;
}

export async function getCarePlusStatus(): Promise<CarePlusStatus> {
  // The production migration adds this RPC before the generated client types are refreshed.
  // Keep the compatibility cast narrow and preserve the Supabase client method receiver.
  const response = supabase.rpc('get_own_care_plus_status' as never) as unknown as PromiseLike<CarePlusStatusRpcResult>;
  const { data, error } = await response;
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
  if (error) {
    const functionBody = await readFunctionErrorBody(error);
    if (functionBody) return functionBody;
    throw new Error('Janani Care+ could not respond right now.');
  }
  return data ?? { error: 'empty_gateway_response' };
}
