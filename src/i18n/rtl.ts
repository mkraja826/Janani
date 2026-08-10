import type { FlexStyle, TextStyle, ViewStyle } from 'react-native';

import { isRtlLocale } from '@/i18n/localeRegistry';

export type RtlLayout = {
  isRtl: boolean;
  text: TextStyle;
  row: ViewStyle;
  rowReverse: ViewStyle;
  startAligned: ViewStyle;
  endAligned: ViewStyle;
  startText: TextStyle;
  endText: TextStyle;
  writingDirection: TextStyle['writingDirection'];
  flexDirection: FlexStyle['flexDirection'];
};

/**
 * Screen-level RTL helper for controlled QA rollout.
 *
 * This intentionally does not call I18nManager.forceRTL()/allowRTL(). Global
 * process-level mirroring can require an app restart and can destabilize screens
 * that have not been individually verified. Production screens should opt into
 * these logical-direction styles one at a time during RTL QA.
 */
export function rtlLayoutFor(localeCode: string): RtlLayout {
  const isRtl = isRtlLocale(localeCode);
  return {
    isRtl,
    text: { writingDirection: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left' },
    row: { flexDirection: isRtl ? 'row-reverse' : 'row' },
    rowReverse: { flexDirection: isRtl ? 'row' : 'row-reverse' },
    startAligned: { alignItems: isRtl ? 'flex-end' : 'flex-start' },
    endAligned: { alignItems: isRtl ? 'flex-start' : 'flex-end' },
    startText: { textAlign: isRtl ? 'right' : 'left', writingDirection: isRtl ? 'rtl' : 'ltr' },
    endText: { textAlign: isRtl ? 'left' : 'right', writingDirection: isRtl ? 'rtl' : 'ltr' },
    writingDirection: isRtl ? 'rtl' : 'ltr',
    flexDirection: isRtl ? 'row-reverse' : 'row',
  };
}

export function directionalIconName(localeCode: string, ltrName: string, rtlName: string): string {
  return isRtlLocale(localeCode) ? rtlName : ltrName;
}
