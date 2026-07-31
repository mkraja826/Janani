import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'janani-care-reminders';

export async function prepareReminderNotifications(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  let granted = current.granted;

  if (!granted) {
    const requested = await Notifications.requestPermissionsAsync();
    granted = requested.granted;
  }

  if (granted && Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Janani care reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  return granted;
}

export async function scheduleDailyReminder(title: string, instructions: string | null, localTime: string): Promise<string | null> {
  const allowed = await prepareReminderNotifications();
  if (!allowed) return null;

  const [hour, minute] = localTime.split(':').map(Number);

  return Notifications.scheduleNotificationAsync({
    content: {
      title: `A gentle reminder: ${title}`,
      body: instructions?.trim() || 'It is time for today’s care. Tap Janani when you are done.',
      sound: true,
      data: { screen: '/reminders' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
    },
  });
}

export async function cancelReminderNotification(identifier: string | null): Promise<void> {
  if (!identifier) return;
  await Notifications.cancelScheduledNotificationAsync(identifier);
}
