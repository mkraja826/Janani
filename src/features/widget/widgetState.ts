import { NativeModules, Platform } from 'react-native';

import { uiTranslationLanguageFor } from '@/i18n/localeRegistry';
import { systemCopy } from '@/i18n/systemSurfaces';
import { readGlobalUiLocale } from '@/i18n/uiLocale';
import { encryptedLocalStorage } from '@/lib/encryptedLocalStorage';

const WIDGET_STATE_KEY='janani:widget-state:v1';
const widgetBridge=NativeModules.JananiWidget as {update?:(state:Record<string,string>)=>Promise<void>}|undefined;

export type JananiWidgetState={familyName:string;role:'mother'|'partner';pregnancyWeek:number|null;nextReminderTitle:string|null;nextReminderTime:string|null;partnerMessage:string|null;updatedAt:string};
export async function saveWidgetState(state:JananiWidgetState){await encryptedLocalStorage.setItem(WIDGET_STATE_KEY,JSON.stringify(state));}
export async function readWidgetState():Promise<JananiWidgetState|null>{try{const raw=await encryptedLocalStorage.getItem(WIDGET_STATE_KEY);return raw?JSON.parse(raw) as JananiWidgetState:null;}catch{return null;}}
export async function clearWidgetState(){await encryptedLocalStorage.removeItem(WIDGET_STATE_KEY);}
export function canUpdateNativeWidget(){return Platform.OS==='android'&&Boolean(widgetBridge?.update);}
export async function updateNativeWidget(state:Record<string,string>){if(!canUpdateNativeWidget()||!widgetBridge?.update)return;await widgetBridge.update(state);}
export async function clearPrivateWidgetContent(){
  const locale=await readGlobalUiLocale();
  const localized=systemCopy(uiTranslationLanguageFor(locale));
  const cleared={
    week_label:'Janani',
    family_label:localized.signedOutFamily,
    next_reminder:localized.privateCare,
    next_medicine:localized.openMedicines,
    next_appointment:localized.openAppointments,
    partner_message:localized.openJanani,
    baby_message:localized.privatePregnancy,
    wellness_message:localized.openWellness,
    daily_message:localized.privateCare,
    widget_today_title:localized.widgetTodayTitle,
    widget_medicine_title:localized.widgetMedicineTitle,
    widget_love_title:localized.widgetLoveTitle,
    widget_appointment_title:localized.widgetAppointmentTitle,
    widget_wellness_title:localized.widgetWellnessTitle,
    widget_care_fallback:localized.widgetCareFallback,
    widget_medicine_fallback:localized.widgetMedicineFallback,
    widget_appointment_fallback:localized.widgetAppointmentFallback,
    widget_baby_fallback:localized.widgetBabyFallback,
    widget_wellness_fallback:localized.widgetWellnessFallback,
  };
  await Promise.allSettled([clearWidgetState(),updateNativeWidget(cleared)]);
}
export const widgetActions={openReminders:'janani://reminders',openThinkingOfYou:'janani://thinking-of-you',sendThinkingOfYou:'janani://thinking-of-you?action=send',openPregnancyGuide:'janani://pregnancy-guide',openFoodGuide:'janani://food-guide'} as const;
