import { supabase } from '@/lib/supabase';

export const CARE_PLUS_PRODUCTS = {
  monthly: 'janani_care_plus_monthly',
  annual: 'janani_care_plus_annual',
} as const;

export type CarePlusProductId = typeof CARE_PLUS_PRODUCTS[keyof typeof CARE_PLUS_PRODUCTS];

export type VerifiedPlaySubscription = {
  verified?: boolean;
  active?: boolean;
  status?: 'active' | 'grace_period' | 'expired' | 'revoked';
  planCode?: 'care_plus_monthly' | 'care_plus_annual';
  currentPeriodEnd?: string | null;
  acknowledgementState?: string | null;
  error?: string;
};

/**
 * Called only after Google Play Billing returns a subscription purchase token.
 * The mobile app never grants Care+ itself; the server verifies with Google and
 * updates the server-side entitlement if the purchase is legitimate.
 */
export async function verifyGooglePlaySubscription(
  purchaseToken: string,
  productId: CarePlusProductId,
): Promise<VerifiedPlaySubscription> {
  const token = purchaseToken.trim();
  if (!token) throw new Error('A Google Play purchase token is required.');

  const { data, error } = await supabase.functions.invoke<VerifiedPlaySubscription>(
    'verify-google-play-subscription',
    { body: { purchaseToken: token, productId } },
  );

  if (error) throw new Error(error.message || 'Janani could not verify this purchase.');
  return data ?? { error: 'empty_verification_response' };
}
