import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { flushJananiOfflineQueue } from '@/features/offline/OfflineQueueSync';
import {
  discardFirstFailedOfflineMutation,
  type OfflineQueueStatus,
  retryFailedOfflineMutations,
  subscribeToOfflineQueueStatus,
} from '@/lib/offlineQueue';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

export function SyncStatus() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<OfflineQueueStatus>({
    count: 0,
    failedCount: 0,
    firstFailure: null,
  });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!userId) {
      setStatus({ count: 0, failedCount: 0, firstFailure: null });
      return;
    }
    return subscribeToOfflineQueueStatus(userId, setStatus);
  }, [userId]);
  if (!userId || status.count === 0) return null;

  async function retry() {
    if (!userId) return;
    setSyncing(true);
    try {
      if (status.failedCount) await retryFailedOfflineMutations(userId);
      await flushJananiOfflineQueue(userId);
    } catch {
      Alert.alert(
        'Could not retry this change',
        'The saved change is still protected on this device. Review it again or try after restarting Janani.',
      );
    } finally {
      setSyncing(false);
    }
  }

  function reviewFailure() {
    if (!userId) return;
    Alert.alert(
      'A change needs attention',
      status.firstFailure ?? 'Supabase rejected the oldest queued change.',
      [
        { text: 'Keep for later', style: 'cancel' },
        { text: 'Retry now', onPress: () => void retry() },
        {
          text: 'Discard this change',
          style: 'destructive',
          onPress: () => {
            void discardFirstFailedOfflineMutation(userId)
              .then(() => flushJananiOfflineQueue(userId))
              .catch(() => undefined);
          },
        },
      ],
    );
  }

  return <View style={[styles.wrap, { bottom: Math.max(insets.bottom, spacing.md) }]} pointerEvents="box-none">
    <View style={[styles.card, status.failedCount > 0 && styles.failedCard]}>
      <Text style={styles.text}>
        {status.failedCount > 0
          ? 'A saved change needs attention'
          : `${status.count} change${status.count === 1 ? '' : 's'} waiting to sync`}
      </Text>
      <Pressable disabled={syncing} onPress={status.failedCount > 0 ? reviewFailure : retry} style={styles.button}>
        {syncing
          ? <ActivityIndicator size="small" color={colors.surface} />
          : <Text style={styles.buttonText}>{status.failedCount > 0 ? 'Review' : 'Retry'}</Text>}
      </Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  wrap:{position:'absolute',left:spacing.md,right:spacing.md,zIndex:50},
  card:{minHeight:52,flexDirection:'row',alignItems:'center',gap:spacing.md,paddingHorizontal:spacing.md,borderRadius:radius.lg,backgroundColor:colors.ink},
  failedCard:{backgroundColor:colors.danger},
  text:{flex:1,fontSize:13,fontWeight:'700',color:colors.surface},
  button:{minWidth:70,minHeight:36,alignItems:'center',justifyContent:'center',paddingHorizontal:spacing.md,borderRadius:radius.pill,backgroundColor:colors.rose},
  buttonText:{fontSize:12,fontWeight:'800',color:colors.surface},
});
