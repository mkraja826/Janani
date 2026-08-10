import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { readGlobalUiLocale } from '@/i18n/uiLocale';
import { createSessionBoundSupabaseClient, supabase } from '@/lib/supabase';

const PARTNER_CHANNEL_ID = 'janani-partner-messages';
const LAST_PUSH_TOKEN_KEY = 'janani-last-expo-push-token-v1';

type StoredPushToken = {
  userId: string;
  token: string;
};

let pushLifecycle = Promise.resolve();

function serializePushLifecycle(operation: () => Promise<void>): Promise<void> {
  const result = pushLifecycle.then(operation, operation);
  pushLifecycle = result.catch(() => undefined);
  return result;
}

function getProjectId() {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

async function registerDevicePushTokenInternal(userId: string): Promise<void> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(PARTNER_CHANNEL_ID, {
      name: 'Partner messages',
      description: 'Private, supportive messages from your linked Janani partner.',
      importance: Notifications.AndroidImportance.HIGH,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  let granted = current.granted;
  if (!granted) {
    const requested = await Notifications.requestPermissionsAsync();
    granted = requested.granted;
  }
  if (!granted) return;

  const projectId = getProjectId();
  if (!projectId) {
    if (!__DEV__) throw new Error('Janani is not linked to an EAS project for push delivery.');
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const localeCode = await readGlobalUiLocale();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const capturedSession = sessionData.session;
  if (sessionError || capturedSession?.user.id !== userId) return;

  const boundClient = createSessionBoundSupabaseClient(capturedSession.access_token);
  const { data: currentBeforeRpc } = await supabase.auth.getSession();
  if (currentBeforeRpc.session?.user.id !== userId) return;
  const { error } = await boundClient.rpc(
    'register_device_push_token_v2' as never,
    {
      p_expo_push_token: token,
      p_platform: Platform.OS,
      p_device_name: Constants.deviceName ?? null,
      p_locale_code: localeCode,
    } as never,
  );
  if (error) throw error;

  const { data: currentAfterRpc } = await supabase.auth.getSession();
  if (currentAfterRpc.session?.user.id !== userId) {
    try {
      await boundClient.rpc('unregister_device_push_token', {
        p_expo_push_token: token,
      });
    } catch {
      // The captured session may already have been revoked.
    }
    await Notifications.unregisterForNotificationsAsync().catch(() => undefined);
    return;
  }

  await SecureStore.setItemAsync(
    LAST_PUSH_TOKEN_KEY,
    JSON.stringify({ userId, token } satisfies StoredPushToken),
  );
}

export function registerDevicePushToken(userId: string): Promise<void> {
  return serializePushLifecycle(() => registerDevicePushTokenInternal(userId));
}

async function unregisterDevicePushTokenInternal(userId: string): Promise<void> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;
  let stored: StoredPushToken | null = null;
  try {
    const raw = await SecureStore.getItemAsync(LAST_PUSH_TOKEN_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredPushToken;
      if (parsed.userId === userId && typeof parsed.token === 'string') stored = parsed;
    }
  } catch {
    stored = null;
  }

  try {
    if (stored) {
      await supabase.rpc('unregister_device_push_token', {
        p_expo_push_token: stored.token,
      });
    }
    await supabase
      .from('device_push_tokens')
      .update({ is_active: false, last_seen_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_active', true);
  } finally {
    // Local unregistration is the privacy boundary when a session was already
    // revoked and the server RPC cannot run. Expo will reject the stale token.
    await SecureStore.deleteItemAsync(LAST_PUSH_TOKEN_KEY).catch(() => undefined);
    await Notifications.unregisterForNotificationsAsync().catch(() => undefined);
  }
}

export function unregisterDevicePushToken(userId: string): Promise<void> {
  return serializePushLifecycle(() => unregisterDevicePushTokenInternal(userId));
}
