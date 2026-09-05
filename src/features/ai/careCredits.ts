import { supabase } from '@/lib/supabase';

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
