import {
  loadPartnerCarePlusCopy as loadLegacyPartnerCarePlusCopy,
  type PartnerCarePlusCopy,
} from '../../../features/localization/partnerCarePlusLocale';

import { brandizeUiCopy } from '@/i18n/globalUi';

export type { PartnerCarePlusCopy } from '../../../features/localization/partnerCarePlusLocale';

export async function loadPartnerCarePlusCopy(): Promise<PartnerCarePlusCopy> {
  const copy = await loadLegacyPartnerCarePlusCopy();
  return Object.fromEntries(
    Object.entries(copy).map(([key, value]) => [key, brandizeUiCopy(value)]),
  ) as PartnerCarePlusCopy;
}
