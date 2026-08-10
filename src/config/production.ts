function enabled(value: string | undefined) {
  return value?.trim().toLowerCase() === 'true';
}

export const productionConfig = {
  carePlusVisible: enabled(process.env.EXPO_PUBLIC_CARE_PLUS_VISIBLE),
  carePlusPurchasesEnabled: enabled(process.env.EXPO_PUBLIC_CARE_PLUS_PURCHASES_ENABLED),
  aiEnabled: enabled(process.env.EXPO_PUBLIC_CARE_PLUS_AI_ENABLED),
  supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || null,
  privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL?.trim() || null,
  accountDeletionUrl: process.env.EXPO_PUBLIC_ACCOUNT_DELETION_URL?.trim() || null,
} as const;

export function assertSafeProductionFeatureCombination() {
  if (productionConfig.aiEnabled && !productionConfig.carePlusVisible) {
    throw new Error('Care+ AI cannot be enabled while Care+ is hidden.');
  }
  if (productionConfig.carePlusPurchasesEnabled && !productionConfig.carePlusVisible) {
    throw new Error('Care+ purchases cannot be enabled while Care+ is hidden.');
  }
}
