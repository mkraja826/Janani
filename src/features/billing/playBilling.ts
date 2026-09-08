import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';
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

export function playBillingAccountId(userId: string): string {
  return bytesToHex(sha256(utf8ToBytes(`janani-play-account:${userId}`)));
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

export async function queryOwnedPlayPurchases(productType: PlayProductType): Promise<PlayPurchase[]> {
  if (!nativeBilling) return [];
  await nativeBilling.connect();
  return nativeBilling.queryPurchases(productType);
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

export async function purchaseCarePlusMonthly(userId: string): Promise<boolean> {
  const products = await queryPlayProducts([PLAY_PRODUCTS.carePlusMonthly], 'subs');
  const product = products.find((item) => item.productId === PLAY_PRODUCTS.carePlusMonthly);
  const offerToken = product?.subscriptionOffers?.[0]?.offerToken;
  if (!product || !offerToken) throw new Error('PregaLove Care+ is not available from Google Play yet.');

  const purchase = await beginPlayPurchase({
    productId: PLAY_PRODUCTS.carePlusMonthly,
    productType: 'subs',
    offerToken,
    accountId: playBillingAccountId(userId),
  });
  if (!purchase) return false;
  if (purchase.purchaseState !== 1) throw new Error('Google Play has not completed this purchase yet.');

  const verified = await verifyPlayPurchase({
    productId: PLAY_PRODUCTS.carePlusMonthly,
    productType: 'subs',
    purchaseToken: purchase.purchaseToken,
  });
  if (!verified.verified) throw new Error('PregaLove could not verify this Google Play subscription yet.');
  return true;
}

export async function restoreCarePlusSubscription(): Promise<boolean> {
  const purchases = await queryOwnedPlayPurchases('subs');
  const owned = purchases
    .filter((purchase) => purchase.purchaseState === 1 && purchase.products.includes(PLAY_PRODUCTS.carePlusMonthly))
    .sort((a, b) => b.purchaseTime - a.purchaseTime);

  for (const purchase of owned) {
    const verified = await verifyPlayPurchase({
      productId: PLAY_PRODUCTS.carePlusMonthly,
      productType: 'subs',
      purchaseToken: purchase.purchaseToken,
    });
    if (verified.verified) return true;
  }
  return false;
}
