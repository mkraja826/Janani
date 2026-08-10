export type LocaleDirection = 'ltr' | 'rtl';
export type TranslationStatus = 'native' | 'reviewed' | 'machine_assisted' | 'fallback';
export type ClinicalTranslationStatus = 'reviewed' | 'pending' | 'unavailable';

export type LocaleDefinition = {
  code: string;
  baseLanguage: string;
  nativeName: string;
  englishName: string;
  direction: LocaleDirection;
  uiStatus: TranslationStatus;
  healthStatus: ClinicalTranslationStatus;
  clinicalStatus: ClinicalTranslationStatus;
};

const locale = (
  code: string,
  nativeName: string,
  englishName: string,
  direction: LocaleDirection = 'ltr',
  uiStatus: TranslationStatus = 'fallback',
  healthStatus: ClinicalTranslationStatus = 'pending',
  clinicalStatus: ClinicalTranslationStatus = 'pending',
): LocaleDefinition => ({
  code,
  baseLanguage: code.split('-')[0].toLowerCase(),
  nativeName,
  englishName,
  direction,
  uiStatus,
  healthStatus,
  clinicalStatus,
});

export const JANANI_LOCALES: LocaleDefinition[] = [
  locale('en', 'English', 'English', 'ltr', 'native', 'reviewed', 'reviewed'),
  locale('te', 'తెలుగు', 'Telugu', 'ltr', 'native'), locale('hi', 'हिन्दी', 'Hindi', 'ltr', 'native'),
  locale('ta', 'தமிழ்', 'Tamil', 'ltr', 'machine_assisted'), locale('kn', 'ಕನ್ನಡ', 'Kannada', 'ltr', 'machine_assisted'), locale('ml', 'മലയാളം', 'Malayalam', 'ltr', 'machine_assisted'), locale('mr', 'मराठी', 'Marathi', 'ltr', 'machine_assisted'), locale('bn', 'বাংলা', 'Bengali', 'ltr', 'machine_assisted'), locale('gu', 'ગુજરાતી', 'Gujarati', 'ltr', 'machine_assisted'), locale('pa', 'ਪੰਜਾਬੀ', 'Punjabi', 'ltr', 'machine_assisted'), locale('or', 'ଓଡ଼ିଆ', 'Odia', 'ltr', 'machine_assisted'), locale('as', 'অসমীয়া', 'Assamese', 'ltr', 'machine_assisted'), locale('ur', 'اردو', 'Urdu', 'rtl', 'machine_assisted'), locale('ne', 'नेपाली', 'Nepali', 'ltr', 'machine_assisted'),
  locale('si', 'සිංහල', 'Sinhala'),
  locale('ar', 'العربية', 'Arabic', 'rtl', 'machine_assisted'), locale('fa', 'فارسی', 'Persian', 'rtl'), locale('he', 'עברית', 'Hebrew', 'rtl'),
  locale('es', 'Español', 'Spanish', 'ltr', 'machine_assisted'), locale('pt', 'Português', 'Portuguese', 'ltr', 'machine_assisted'), locale('fr', 'Français', 'French', 'ltr', 'machine_assisted'), locale('de', 'Deutsch', 'German', 'ltr', 'machine_assisted'),
  locale('it', 'Italiano', 'Italian'), locale('nl', 'Nederlands', 'Dutch'),
  locale('ru', 'Русский', 'Russian', 'ltr', 'machine_assisted'), locale('uk', 'Українська', 'Ukrainian'), locale('pl', 'Polski', 'Polish'), locale('cs', 'Čeština', 'Czech'), locale('ro', 'Română', 'Romanian'), locale('hu', 'Magyar', 'Hungarian'), locale('tr', 'Türkçe', 'Turkish'), locale('el', 'Ελληνικά', 'Greek'), locale('sv', 'Svenska', 'Swedish'), locale('da', 'Dansk', 'Danish'), locale('no', 'Norsk', 'Norwegian'), locale('fi', 'Suomi', 'Finnish'),
  locale('id', 'Bahasa Indonesia', 'Indonesian', 'ltr', 'machine_assisted'), locale('ms', 'Bahasa Melayu', 'Malay'), locale('fil', 'Filipino', 'Filipino'), locale('vi', 'Tiếng Việt', 'Vietnamese', 'ltr', 'machine_assisted'), locale('th', 'ไทย', 'Thai', 'ltr', 'machine_assisted'), locale('km', 'ខ្មែរ', 'Khmer'), locale('my', 'မြန်မာ', 'Burmese'), locale('lo', 'ລາວ', 'Lao'),
  locale('zh-CN', '简体中文', 'Chinese (Simplified)', 'ltr', 'machine_assisted'), locale('zh-TW', '繁體中文', 'Chinese (Traditional)', 'ltr', 'machine_assisted'), locale('ja', '日本語', 'Japanese', 'ltr', 'machine_assisted'), locale('ko', '한국어', 'Korean', 'ltr', 'machine_assisted'),
  locale('sw', 'Kiswahili', 'Swahili'), locale('am', 'አማርኛ', 'Amharic'), locale('ha', 'Hausa', 'Hausa'), locale('yo', 'Yorùbá', 'Yoruba'), locale('ig', 'Igbo', 'Igbo'), locale('zu', 'isiZulu', 'Zulu'), locale('af', 'Afrikaans', 'Afrikaans'), locale('sq', 'Shqip', 'Albanian'), locale('bg', 'Български', 'Bulgarian'), locale('hr', 'Hrvatski', 'Croatian'), locale('sr', 'Српски', 'Serbian'), locale('sk', 'Slovenčina', 'Slovak'), locale('sl', 'Slovenščina', 'Slovenian'), locale('et', 'Eesti', 'Estonian'), locale('lv', 'Latviešu', 'Latvian'), locale('lt', 'Lietuvių', 'Lithuanian'), locale('ka', 'ქართული', 'Georgian'), locale('hy', 'Հայերեն', 'Armenian'), locale('az', 'Azərbaycanca', 'Azerbaijani'), locale('kk', 'Қазақша', 'Kazakh'), locale('uz', 'Oʻzbekcha', 'Uzbek'), locale('mn', 'Монгол', 'Mongolian'), locale('ps', 'پښتو', 'Pashto', 'rtl'), locale('ku', 'Kurdî', 'Kurdish'), locale('so', 'Soomaali', 'Somali'), locale('mg', 'Malagasy', 'Malagasy'), locale('mi', 'Māori', 'Māori'),
];

const localeMap = new Map(JANANI_LOCALES.map((item) => [item.code.toLowerCase(), item]));

export function normalizeLocaleCode(value: string | null | undefined): string {
  const raw = value?.trim().replace('_', '-');
  if (!raw) return 'en';
  try { const canonical = Intl.getCanonicalLocales(raw)[0]; return canonical || 'en'; } catch { return 'en'; }
}

export function getLocaleDefinition(code: string): LocaleDefinition {
  const normalized = normalizeLocaleCode(code);
  const exact = localeMap.get(normalized.toLowerCase()); if (exact) return exact;
  const base = normalized.split('-')[0].toLowerCase();
  return localeMap.get(base) ?? locale('en', 'English', 'English', 'ltr', 'native', 'reviewed', 'reviewed');
}

export function uiTranslationLanguageFor(code: string): 'en' | 'te' | 'hi' {
  const base = normalizeLocaleCode(code).split('-')[0].toLowerCase();
  if (base === 'te' || base === 'hi') return base;
  return 'en';
}

export function detectDeviceLocale(): string { return normalizeLocaleCode(Intl.DateTimeFormat().resolvedOptions().locale); }
export function searchLocales(query: string): LocaleDefinition[] { const term=query.trim().toLocaleLowerCase(); if(!term)return JANANI_LOCALES; return JANANI_LOCALES.filter((item)=>item.code.toLocaleLowerCase().includes(term)||item.nativeName.toLocaleLowerCase().includes(term)||item.englishName.toLocaleLowerCase().includes(term)); }
export function isRtlLocale(code: string): boolean { return getLocaleDefinition(code).direction === 'rtl'; }
