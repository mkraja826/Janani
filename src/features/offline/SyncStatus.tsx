import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { flushJananiOfflineQueue } from '@/features/offline/OfflineQueueSync';
import { subscribeToQueuedMutationCount } from '@/lib/offlineQueue';
import { colors, radius, spacing } from '@/theme/tokens';

export function SyncStatus() {
  const [count, setCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => subscribeToQueuedMutationCount(setCount), []);
  if (count === 0) return null;

  async function retry() {
    setSyncing(true);
    try { await flushJananiOfflineQueue(); } finally { setSyncing(false); }
  }

  return <View style={styles.wrap} pointerEvents="box-none">
    <View style={styles.card}>
      <Text style={styles.text}>{count} change{count === 1 ? '' : 's'} waiting to sync</Text>
      <Pressable disabled={syncing} onPress={retry} style={styles.button}>
        {syncing ? <ActivityIndicator size="small" color={colors.surface} /> : <Text style={styles.buttonText}>Retry</Text>}
      </Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  wrap:{position:'absolute',left:spacing.md,right:spacing.md,bottom:spacing.md,zIndex:50},
  card:{minHeight:52,flexDirection:'row',alignItems:'center',gap:spacing.md,paddingHorizontal:spacing.md,borderRadius:radius.lg,backgroundColor:colors.ink},
  text:{flex:1,fontSize:13,fontWeight:'700',color:colors.surface},
  button:{minWidth:70,minHeight:36,alignItems:'center',justifyContent:'center',paddingHorizontal:spacing.md,borderRadius:radius.pill,backgroundColor:colors.rose},
  buttonText:{fontSize:12,fontWeight:'800',color:colors.surface},
});