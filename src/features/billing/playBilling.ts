import { Platform } from 'react-native';

import JananiPlayBilling, { PlayPurchase, PlaySubscriptionProduct } from '@/modules/janani-play-billing';
import { supabase } from '@/lib/supabase';

export const CARE_PLUS_PRODUCT_IDS = [
  'janani_care_plus_monthly',
  'janani_care_plus_annual',
] as const;

export type CarePlusProductId = typeof CARE_PLUS_PRODUCT_IDS[number];

export async function connectPlayBilling(): Promise<void> {
  if (Platform.OS !== 'android') throw new Error('Google Play Billing is only available on Android.');
  await JananiPlayBilling.connect();
}

export async function loadCarePlusProducts(): Promise<PlaySubscriptionProduct[]> {
  await connectPlayBilling();
  return JananiPlayBilling.querySubscriptions([...CARE_PLUS_PRODUCT_IDS]);
}

export async function launchCarePlusPurchase(productId: CarePlusProductId): Promise<void> {
  await connectPlayBilling();
  await JananiPlayBilling.purchaseSubscription(productId);
}

export async function verifyPlayPurchase(purchase: PlayPurchase) {
  if (purchase.purchaseState !== 'purchased') {
    return { verified: false, pending: purchase.purchaseState === 'pending' };
  }
  const productId = purchase.products.find((id): id is CarePlusProductId =>
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
  await connectPlayBilling();
  const purchases = await JananiPlayBilling.restoreSubscriptions();
  const results = [];
  for (const purchase of purchases) {
    if (purchase.purchaseState !== 'purchased') continue;
    results.push(await verifyPlayPurchase(purchase));
  }
  return results;
}

export function addPlayPurchaseListener(listener: (purchase: PlayPurchase) => void) {
  return JananiPlayBilling.addListener('onPurchaseUpdated', (event) => {
    for (const purchase of event.purchases ?? []) listener(purchase);
  });
}
