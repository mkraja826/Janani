import crashlytics from '@react-native-firebase/crashlytics';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Component, type ErrorInfo, type ReactNode, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { productionConfig } from '@/config/production';
import { prepareJananiNotificationChannels } from '@/features/notifications/channels';
import { OfflineQueueSync } from '@/features/offline/OfflineQueueSync';
import { SyncStatus } from '@/features/offline/SyncStatus';
import { ReminderScheduleSync } from '@/features/reminders/ReminderScheduleSync';
import { WidgetSync } from '@/features/widget/WidgetSync';
import { AuthGate } from '@/providers/AuthGate';
import { AuthProvider } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function recordReleaseBreadcrumb(message: string) {
  try { crashlytics().log(message); } catch {}
}

function RuntimeBreadcrumbs() {
  useEffect(() => {
    const commit = process.env.EXPO_PUBLIC_RELEASE_COMMIT?.slice(0, 12) || 'unknown';
    recordReleaseBreadcrumb(`startup commit=${commit}`);
    recordReleaseBreadcrumb(`features carePlus=${productionConfig.carePlusVisible} ai=${productionConfig.aiUiEnabled} purchases=${productionConfig.carePlusPurchasesEnabled}`);
    return () => recordReleaseBreadcrumb('root layout unmounted');
  }, []);
  return null;
}

function NotificationNavigation() {
  useEffect(() => {
    void prepareJananiNotificationChannels()
      .then(() => recordReleaseBreadcrumb('notification channels ready'))
      .catch((error) => {
        recordReleaseBreadcrumb('notification channel setup failed');
        try { crashlytics().recordError(error instanceof Error ? error : new Error('Notification channel setup failed')); } catch {}
      });

    function openFromResponse(response: Notifications.NotificationResponse | null) {
      const screen = response?.notification.request.content.data?.screen;
      if (screen === '/reminders' || screen === '/thinking-of-you' || screen === '/home') {
        recordReleaseBreadcrumb(`notification navigation ${screen}`);
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

class RootErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    try {
      crashlytics().log(`root error boundary: ${info.componentStack?.slice(0, 500) ?? 'no stack'}`);
      crashlytics().recordError(error);
    } catch {}
  }

  render() {
    if (this.state.failed) {
      return (
        <View style={styles.failurePage}>
          <Text style={styles.failureTitle}>PregaLove could not start normally</Text>
          <Text style={styles.failureText}>The error was recorded for this release candidate. You can retry without reinstalling the app.</Text>
          <Pressable style={styles.retryButton} onPress={() => this.setState({ failed: false })}><Text style={styles.retryText}>Try again</Text></Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <RootErrorBoundary>
        <AuthProvider>
          <AuthGate>
            <RuntimeBreadcrumbs />
            <NotificationNavigation />
            <OfflineQueueSync />
            <ReminderScheduleSync />
            <WidgetSync />
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'fade' }} />
          </AuthGate>
          <SyncStatus />
        </AuthProvider>
      </RootErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  failurePage:{flex:1,alignItems:'center',justifyContent:'center',gap:spacing.md,padding:spacing.xl,backgroundColor:colors.background},
  failureTitle:{fontSize:22,fontWeight:'800',textAlign:'center',color:colors.ink},
  failureText:{maxWidth:360,fontSize:14,lineHeight:21,textAlign:'center',color:colors.muted},
  retryButton:{minWidth:140,minHeight:50,alignItems:'center',justifyContent:'center',borderRadius:radius.pill,backgroundColor:colors.rose},
  retryText:{fontWeight:'800',color:colors.surface},
});
