import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const CARE_REMINDER_CHANNEL_ID = 'janani-care-reminders';
export const MEDICATION_ALARM_CHANNEL_ID = 'janani-medication-alarms';
export const PARTNER_MESSAGE_CHANNEL_ID = 'janani-partner-messages';

export async function prepareJananiNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Promise.all([
    Notifications.setNotificationChannelAsync(CARE_REMINDER_CHANNEL_ID, {
      name: 'Janani care reminders',
      description: 'Gentle hydration, nutrition, appointment and custom care reminders.',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 180, 120, 180],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
      sound: 'default',
    }),
    Notifications.setNotificationChannelAsync(MEDICATION_ALARM_CHANNEL_ID, {
      name: 'Medicine alarms',
      description: 'High-priority medicine reminders from Janani.',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 700, 250, 700, 250, 900],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
      sound: 'default',
      bypassDnd: false,
    }),
    Notifications.setNotificationChannelAsync(PARTNER_MESSAGE_CHANNEL_ID, {
      name: 'Thinking of You',
      description: 'Soft private notes and little moments of warmth from your partner.',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 120, 90, 160],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
      sound: 'default',
    }),
  ]);
}
