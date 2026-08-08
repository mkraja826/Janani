import { NativeModule, requireNativeModule } from 'expo';

export type PlaySubscriptionProduct = {
  productId: string;
  name: string;
  title: string;
  description: string;
  offerToken?: string | null;
  basePlanId?: string | null;
  formattedPrice?: string | null;
  priceAmountMicros?: number | null;
  priceCurrencyCode?: string | null;
  billingPeriod?: string | null;
};

export type PlayPurchase = {
  purchaseToken: string;
  products: string[];
  purchaseState: 'purchased' | 'pending' | 'unspecified';
  acknowledged: boolean;
  purchaseTime: number;
  autoRenewing: boolean;
};

type BillingEvents = {
  onPurchaseUpdated(event: {
    responseCode: number;
    debugMessage: string;
    purchases: PlayPurchase[];
  }): void;
};

declare class JananiPlayBillingNativeModule extends NativeModule<BillingEvents> {
  connect(): Promise<boolean>;
  disconnect(): Promise<boolean>;
  querySubscriptions(productIds: string[]): Promise<PlaySubscriptionProduct[]>;
  purchaseSubscription(productId: string): Promise<boolean>;
  restoreSubscriptions(): Promise<PlayPurchase[]>;
}

export default requireNativeModule<JananiPlayBillingNativeModule>('JananiPlayBilling');
