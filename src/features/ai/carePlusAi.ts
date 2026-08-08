import { supabase } from '@/lib/supabase';

export type CarePlusAiCategory =
  | 'daily_summary'
  | 'weekly_meal_ideas'
  | 'appointment_summary'
  | 'health_trend_summary'
  | 'explain_guidance'
  | 'meal_alternative';

export type CarePlusAiRequest = {
  pregnancyId: string;
  category: CarePlusAiCategory;
  userText?: string;
};

export type CarePlusAiResponse = {
  text?: string;
  error?: string;
  gatewayReady?: boolean;
  blockedConditions?: string[];
};

export async function requestCarePlusAi(input: CarePlusAiRequest): Promise<CarePlusAiResponse> {
  const { data, error } = await supabase.functions.invoke<CarePlusAiResponse>('care-plus-ai', {
    body: {
      pregnancyId: input.pregnancyId,
      category: input.category,
      userText: input.userText?.trim().slice(0, 1200) || undefined,
    },
  });

  if (error) {
    throw new Error(error.message || 'Janani Care+ could not respond right now.');
  }
  return data ?? { error: 'empty_gateway_response' };
}
