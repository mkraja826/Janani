import AsyncStorage from '@react-native-async-storage/async-storage';

import { detectDeviceLocale, normalizeLocaleCode } from '@/i18n/localeRegistry';

const GLOBAL_UI_LOCALE_KEY = 'janani-ui-locale-v2';

export async function readGlobalUiLocale(): Promise<string> {
  const stored = await AsyncStorage.getItem(GLOBAL_UI_LOCALE_KEY);
  return stored ? normalizeLocaleCode(stored) : detectDeviceLocale();
}

export async function writeGlobalUiLocale(localeCode: string): Promise<string> {
  const normalized = normalizeLocaleCode(localeCode);
  await AsyncStorage.setItem(GLOBAL_UI_LOCALE_KEY, normalized);
  return normalized;
}

export async function clearGlobalUiLocale(): Promise<void> {
  await AsyncStorage.removeItem(GLOBAL_UI_LOCALE_KEY);
}
