import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OfflineQueueSync } from '@/features/offline/OfflineQueueSync';
import { SyncStatus } from '@/features/offline/SyncStatus';
import { ReminderScheduleSync } from '@/features/reminders/ReminderScheduleSync';
import { WidgetSync } from '@/features/widget/WidgetSync';
import { AuthGate } from '@/providers/AuthGate';
import { AuthProvider } from '@/providers/AuthProvider';
import { colors } from '@/theme/tokens';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function NotificationNavigation() {
  useEffect(() => {
    function openFromResponse(response: Notifications.NotificationResponse | null) {
      const screen = response?.notification.request.content.data?.screen;
      if (screen === '/reminders' || screen === '/thinking-of-you' || screen === '/home') {
        router.push(screen);
      }
    }
    void Notifications.getLastNotificationResponseAsync()
      .then(async (response) => {
        openFromResponse(response);
        if (response) await Notifications.clearLastNotificationResponseAsync();
      })
      .catch(() => undefined);
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openFromResponse(response);
      void Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
    });
    return () => subscription.remove();
  }, []);
  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthGate>
          <NotificationNavigation />
          <OfflineQueueSync />
          <ReminderScheduleSync />
          <WidgetSync />
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'fade' }} />
        </AuthGate>
        <SyncStatus />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
