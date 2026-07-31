import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { OfflineQueueSync } from '@/features/offline/OfflineQueueSync';
import { SyncStatus } from '@/features/offline/SyncStatus';
import { WidgetSync } from '@/features/widget/WidgetSync';
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
      if (typeof screen === 'string' && screen.startsWith('/')) router.push(screen as never);
    }
    Notifications.getLastNotificationResponseAsync().then(openFromResponse);
    const subscription = Notifications.addNotificationResponseReceivedListener(openFromResponse);
    return () => subscription.remove();
  }, []);
  return null;
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  return <QueryClientProvider client={queryClient}><AuthProvider>
    <NotificationNavigation />
    <OfflineQueueSync />
    <WidgetSync />
    <StatusBar style="dark" />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'fade' }} />
    <SyncStatus />
  </AuthProvider></QueryClientProvider>;
}
