export type PlayBillingProductKind = 'subscription' | 'care_credit_topup';

export type PlayBillingProduct = {
  id: string;
  kind: PlayBillingProductKind;
  enabled: boolean;
  credits?: number;
  displayName: string;
};

// Product identifiers are stable app contracts. They remain disabled until the
// matching Google Play Console products exist and server-side purchase verification
// has been tested end-to-end.
export const PLAY_BILLING_PRODUCTS: readonly PlayBillingProduct[] = [
  {
    id: 'pregalove_care_plus_monthly',
    kind: 'subscription',
    enabled: false,
    displayName: 'PregaLove Care+ Monthly',
  },
  {
    id: 'pregalove_care_credits_small',
    kind: 'care_credit_topup',
    enabled: false,
    displayName: 'Care Credits Small Pack',
  },
  {
    id: 'pregalove_care_credits_medium',
    kind: 'care_credit_topup',
    enabled: false,
    displayName: 'Care Credits Medium Pack',
  },
  {
    id: 'pregalove_care_credits_large',
    kind: 'care_credit_topup',
    enabled: false,
    displayName: 'Care Credits Large Pack',
  },
] as const;

export const CARE_PLUS_MONTHLY_PRODUCT_ID = 'pregalove_care_plus_monthly';

export function isPlayBillingCatalogEnabled(): boolean {
  return PLAY_BILLING_PRODUCTS.some((product) => product.enabled);
}
