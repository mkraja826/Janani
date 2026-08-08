import { Platform } from 'react-native';

import JananiPlayBilling, { PlayPurchase, PlaySubscriptionProduct } from '../../../modules/janani-play-billing';
import { supabase } from '@/lib/supabase';

export const CARE_PLUS_PRODUCT_IDS = [
  'janani_care_plus_monthly',
  'janani_care_plus_annual',
] as const;

export type CarePlusProductId = typeof CARE_PLUS_PRODUCT_IDS[number];

type PurchaseUpdatedEvent = {
  responseCode: number;
  debugMessage: string;
  purchases: PlayPurchase[];
};

function billingModule() {
  if (Platform.OS !== 'android') throw new Error('Google Play Billing is only available on Android.');
  if (!JananiPlayBilling) throw new Error('This Janani build does not include the Google Play Billing module. Rebuild the Android app.');
  return JananiPlayBilling;
}

export async function connectPlayBilling(): Promise<void> {
  await billingModule().connect();
}

export async function loadCarePlusProducts(): Promise<PlaySubscriptionProduct[]> {
  const billing = billingModule();
  await billing.connect();
  return billing.querySubscriptions([...CARE_PLUS_PRODUCT_IDS]);
}

export async function launchCarePlusPurchase(productId: CarePlusProductId): Promise<void> {
  const billing = billingModule();
  await billing.connect();
  await billing.purchaseSubscription(productId);
}

export async function verifyPlayPurchase(purchase: PlayPurchase) {
  if (purchase.purchaseState !== 'purchased') {
    return { verified: false, pending: purchase.purchaseState === 'pending' };
  }
  const productId = purchase.products.find((id: string): id is CarePlusProductId =>
    (CARE_PLUS_PRODUCT_IDS as readonly string[]).includes(id),
  );
  if (!productId) throw new Error('This Google Play purchase does not belong to a Janani Care+ plan.');

  const { data, error } = await supabase.functions.invoke('verify-google-play-subscription', {
    body: { purchaseToken: purchase.purchaseToken, productId },
  });
  if (error) throw new Error(error.message || 'Could not verify this Google Play purchase.');
  if (!data?.verified) throw new Error(data?.error || 'Google Play purchase verification failed.');
  return data;
}

export async function restoreCarePlusPurchases() {
  const billing = billingModule();
  await billing.connect();
  const purchases = await billing.restoreSubscriptions();
  const results = [];
  for (const purchase of purchases) {
    if (purchase.purchaseState !== 'purchased') continue;
    results.push(await verifyPlayPurchase(purchase));
  }
  return results;
}

export function addPlayPurchaseListener(listener: (purchase: PlayPurchase) => void) {
  return billingModule().addListener('onPurchaseUpdated', (event: PurchaseUpdatedEvent) => {
    for (const purchase of event.purchases ?? []) listener(purchase);
  });
}
