import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { uiTranslationLanguageFor } from '@/i18n/localeRegistry';
import { readGlobalUiLocale } from '@/i18n/uiLocale';

export const CARE_REMINDER_CHANNEL_ID = 'janani-care-reminders';
export const MEDICATION_ALARM_CHANNEL_ID = 'janani-medication-alarms';
export const PARTNER_MESSAGE_CHANNEL_ID = 'janani-partner-messages';

const channelCopy = {
  en: {
    careName: 'Janani care reminders',
    careDescription: 'Gentle hydration, nutrition, appointment and custom care reminders.',
    medicineName: 'Medicine alarms',
    medicineDescription: 'High-priority medicine reminders from Janani.',
    partnerName: 'Thinking of You',
    partnerDescription: 'Soft private notes and little moments of warmth from your partner.',
  },
  te: {
    careName: 'జనని సంరక్షణ రిమైండర్లు',
    careDescription: 'నీరు, ఆహారం, అపాయింట్‌మెంట్ మరియు ఇతర సంరక్షణ గుర్తింపులు.',
    medicineName: 'మందుల అలారాలు',
    medicineDescription: 'జనని నుంచి అధిక ప్రాధాన్యత గల మందుల రిమైండర్లు.',
    partnerName: 'నిన్ను గుర్తు చేసుకుంటున్నాను',
    partnerDescription: 'మీ భాగస్వామి నుంచి వ్యక్తిగతమైన చిన్న ప్రేమ సందేశాలు.',
  },
  hi: {
    careName: 'जननी केयर रिमाइंडर',
    careDescription: 'पानी, पोषण, अपॉइंटमेंट और अन्य देखभाल के हल्के रिमाइंडर।',
    medicineName: 'दवा अलार्म',
    medicineDescription: 'जननी से उच्च-प्राथमिकता वाले दवा रिमाइंडर।',
    partnerName: 'आपकी याद',
    partnerDescription: 'आपके साथी की ओर से निजी और हल्के अपनापन भरे संदेश।',
  },
} as const;

export async function prepareJananiNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const locale = await readGlobalUiLocale();
  const copy = channelCopy[uiTranslationLanguageFor(locale)];

  await Promise.all([
    Notifications.setNotificationChannelAsync(CARE_REMINDER_CHANNEL_ID, {
      name: copy.careName,
      description: copy.careDescription,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 180, 120, 180],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
      sound: 'default',
    }),
    Notifications.setNotificationChannelAsync(MEDICATION_ALARM_CHANNEL_ID, {
      name: copy.medicineName,
      description: copy.medicineDescription,
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 700, 250, 700, 250, 900],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
      sound: 'default',
      bypassDnd: false,
    }),
    Notifications.setNotificationChannelAsync(PARTNER_MESSAGE_CHANNEL_ID, {
      name: copy.partnerName,
      description: copy.partnerDescription,
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 120, 90, 160],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
      sound: 'default',
    }),
  ]);
}
