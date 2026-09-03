import { t, type MessageKey } from '@/i18n';
import { GLOBAL_UI_PACKS } from '@/i18n/globalUiPacks';
import { INTERNATIONAL_UI_PACKS } from '@/i18n/internationalUiPacks';
import { normalizeLocaleCode, uiTranslationLanguageFor } from '@/i18n/localeRegistry';

export function brandizeUiCopy(value: string): string {
  return value
    .replace(/JANANI/g, 'PREGALOVE')
    .replace(/Janani/g, 'PregaLove')
    .replace(/janani/g, 'PregaLove')
    .replace(/జనని/g, 'PregaLove')
    .replace(/जननी/g, 'PregaLove')
    .replace(/ஜனனி/g, 'PregaLove')
    .replace(/ಜನನಿ/g, 'PregaLove')
    .replace(/ജനനി/g, 'PregaLove')
    .replace(/জননী/g, 'PregaLove')
    .replace(/જનની/g, 'PregaLove')
    .replace(/ਜਨਨੀ/g, 'PregaLove')
    .replace(/ଜନନୀ/g, 'PregaLove')
    .replace(/جاناني/g, 'PregaLove')
    .replace(/جانانی/g, 'PregaLove');
}

export function tg(localeCode: string, key: MessageKey): string {
  const normalized = normalizeLocaleCode(localeCode);
  const base = normalized.split('-')[0].toLowerCase();
  const packValue = INTERNATIONAL_UI_PACKS[normalized]?.[key]
    ?? INTERNATIONAL_UI_PACKS[base]?.[key]
    ?? GLOBAL_UI_PACKS[normalized]?.[key]
    ?? GLOBAL_UI_PACKS[base]?.[key];
  if (packValue) return brandizeUiCopy(packValue);
  return brandizeUiCopy(t(uiTranslationLanguageFor(normalized), key));
}

export function hasGlobalUiPack(localeCode: string): boolean {
  const normalized = normalizeLocaleCode(localeCode);
  const base = normalized.split('-')[0].toLowerCase();
  return Boolean(
    INTERNATIONAL_UI_PACKS[normalized]
    || INTERNATIONAL_UI_PACKS[base]
    || GLOBAL_UI_PACKS[normalized]
    || GLOBAL_UI_PACKS[base],
  );
}
