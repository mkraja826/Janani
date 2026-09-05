import { NativeModules, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

export const PLAY_PRODUCTS = {
  carePlusMonthly: 'pregalove_care_plus_monthly',
  creditsSmall: 'pregalove_care_credits_small',
  creditsMedium: 'pregalove_care_credits_medium',
  creditsLarge: 'pregalove_care_credits_large',
} as const;

export type PlayProductType = 'subs' | 'inapp';

export type PlaySubscriptionOffer = {
  offerToken: string;
  basePlanId?: string | null;
  offerId?: string | null;
  pricingPhases: Array<{
    formattedPrice: string;
    priceCurrencyCode: string;
    billingPeriod: string;
  }>;
};

export type PlayProduct = {
  productId: string;
  name: string;
  description: string;
  productType: PlayProductType;
  formattedPrice?: string;
  priceCurrencyCode?: string;
  subscriptionOffers?: PlaySubscriptionOffer[];
};

export type PlayPurchase = {
  purchaseToken: string;
  orderId?: string | null;
  purchaseTime: number;
  purchaseState: number;
  acknowledged: boolean;
  products: string[];
};

type NativeBillingModule = {
  connect(): Promise<boolean>;
  disconnect(): void;
  queryProducts(productIds: string[], productType: PlayProductType): Promise<PlayProduct[]>;
  purchase(productId: string, productType: PlayProductType, offerToken?: string | null, obfuscatedAccountId?: string | null): Promise<PlayPurchase[]>;
  queryPurchases(productType: PlayProductType): Promise<PlayPurchase[]>;
};

const nativeBilling = NativeModules.JananiPlayBilling as NativeBillingModule | undefined;

export function isPlayBillingAvailable(): boolean {
  return Platform.OS === 'android' && !!nativeBilling;
}

export async function connectPlayBilling(): Promise<boolean> {
  if (!isPlayBillingAvailable() || !nativeBilling) return false;
  return nativeBilling.connect();
}

export async function queryPlayProducts(productIds: string[], productType: PlayProductType): Promise<PlayProduct[]> {
  if (!nativeBilling) return [];
  await nativeBilling.connect();
  return nativeBilling.queryProducts(productIds, productType);
}

export async function beginPlayPurchase(input: {
  productId: string;
  productType: PlayProductType;
  offerToken?: string | null;
  accountId?: string | null;
}): Promise<PlayPurchase | null> {
  if (!nativeBilling) throw new Error('Google Play Billing is not available on this device.');
  await nativeBilling.connect();
  const purchases = await nativeBilling.purchase(
    input.productId,
    input.productType,
    input.offerToken ?? null,
    input.accountId ?? null,
  );
  return purchases.find((purchase) => purchase.products.includes(input.productId)) ?? null;
}

export async function verifyPlayPurchase(input: {
  productId: string;
  productType: PlayProductType;
  purchaseToken: string;
}): Promise<{ verified: boolean; entitlement?: string; creditsGranted?: number; error?: string }> {
  const { data, error } = await supabase.functions.invoke('verify-play-purchase', {
    body: input,
  });
  if (error) throw new Error('PregaLove could not verify this Google Play purchase yet.');
  return (data ?? { verified: false, error: 'empty_verification_response' }) as {
    verified: boolean;
    entitlement?: string;
    creditsGranted?: number;
    error?: string;
  };
}
