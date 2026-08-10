import { t, type MessageKey } from '@/i18n';
import { GLOBAL_UI_PACKS } from '@/i18n/globalUiPacks';
import { normalizeLocaleCode, uiTranslationLanguageFor } from '@/i18n/localeRegistry';

export function tg(localeCode: string, key: MessageKey): string {
  const normalized = normalizeLocaleCode(localeCode);
  const base = normalized.split('-')[0].toLowerCase();
  const packValue = GLOBAL_UI_PACKS[normalized]?.[key] ?? GLOBAL_UI_PACKS[base]?.[key];
  if (packValue) return packValue;
  return t(uiTranslationLanguageFor(normalized), key);
}

export function hasGlobalUiPack(localeCode: string): boolean {
  const normalized = normalizeLocaleCode(localeCode);
  const base = normalized.split('-')[0].toLowerCase();
  return Boolean(GLOBAL_UI_PACKS[normalized] || GLOBAL_UI_PACKS[base]);
}
