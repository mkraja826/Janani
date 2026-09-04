import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { productionConfig } from '@/config/production';
import { supabase } from '@/lib/supabase';
import { colors, radius, spacing } from '@/theme/tokens';

type CheckState = 'checking' | 'pass' | 'fail';
type Check = { label: string; state: CheckState; detail: string };

export default function ReleaseDiagnosticsScreen() {
  const [checks, setChecks] = useState<Check[]>([
    { label: 'Supabase', state: 'checking', detail: 'Checking production connectivity…' },
    { label: 'Notifications', state: 'checking', detail: 'Reading device permission…' },
  ]);

  const appVersion = Constants.expoConfig?.version ?? 'unknown';
  const versionCode = String(Constants.expoConfig?.android?.versionCode ?? 'unknown');
  const commit = process.env.EXPO_PUBLIC_RELEASE_COMMIT?.trim() || 'not embedded';
  const releaseCandidate = process.env.EXPO_PUBLIC_RELEASE_CANDIDATE?.trim().toLowerCase() === 'true';

  const featureRows = useMemo(() => [
    ['Care+', productionConfig.carePlusVisible ? 'ON' : 'OFF'],
    ['Care+ AI UI', productionConfig.aiUiEnabled ? 'ON' : 'OFF'],
    ['Purchases', productionConfig.carePlusPurchasesEnabled ? 'ON' : 'OFF'],
  ] as const, []);

  useEffect(() => {
    let active = true;
    async function runChecks() {
      const next: Check[] = [];
      try {
        const { error } = await supabase.auth.getSession();
        next.push({ label: 'Supabase', state: error ? 'fail' : 'pass', detail: error ? 'Session endpoint returned an error.' : 'Production auth endpoint reachable.' });
      } catch {
        next.push({ label: 'Supabase', state: 'fail', detail: 'Could not reach the production backend.' });
      }

      try {
        const permission = await Notifications.getPermissionsAsync();
        next.push({ label: 'Notifications', state: permission.granted ? 'pass' : 'fail', detail: `Permission: ${permission.status}.` });
      } catch {
        next.push({ label: 'Notifications', state: 'fail', detail: 'Could not read notification permission.' });
      }
      if (active) setChecks(next);
    }
    void runChecks();
    return () => { active = false; };
  }, []);

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable>
          <View style={styles.flex}><Text style={styles.eyebrow}>RELEASE CANDIDATE</Text><Text style={styles.title}>Build diagnostics</Text><Text style={styles.subtitle}>Non-sensitive checks for validating the exact Play-installed build.</Text></View>
        </View>

        <View style={styles.card}>
          <Row label="App" value="PregaLove" />
          <Row label="Version" value={appVersion} />
          <Row label="Version code" value={versionCode} />
          <Row label="Commit" value={commit.slice(0, 12)} monospace />
          <Row label="RC diagnostics" value={releaseCandidate ? 'ENABLED' : 'DISABLED'} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Commercial feature state</Text>
          {featureRows.map(([label, value]) => <Row key={label} label={label} value={value} />)}
          <Text style={styles.note}>Purchases are expected to remain OFF in v13 until Google Play Billing and server-side entitlement verification are completed.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Runtime checks</Text>
          {checks.map((check) => <CheckRow key={check.label} check={check} />)}
        </View>

        <View style={styles.warningCard}>
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.rose} />
          <Text style={styles.warningText}>This screen intentionally does not display API keys, tokens, account data, pregnancy data, or signing information.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, monospace = false }: { label: string; value: string; monospace?: boolean }) {
  return <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text selectable style={[styles.rowValue, monospace && styles.mono]}>{value}</Text></View>;
}

function CheckRow({ check }: { check: Check }) {
  const icon = check.state === 'checking' ? null : check.state === 'pass' ? 'checkmark-circle' : 'alert-circle';
  return <View style={styles.checkRow}>{check.state === 'checking' ? <ActivityIndicator color={colors.rose} /> : <Ionicons name={icon!} size={22} color={check.state === 'pass' ? colors.rose : colors.danger} />}<View style={styles.flex}><Text style={styles.checkTitle}>{check.label}</Text><Text style={styles.checkDetail}>{check.detail}</Text></View></View>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.lg},header:{flexDirection:'row',gap:spacing.md,alignItems:'flex-start'},flex:{flex:1},iconButton:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},eyebrow:{fontSize:11,fontWeight:'800',letterSpacing:1.5,color:colors.rose},title:{marginTop:4,fontSize:27,lineHeight:34,fontWeight:'800',color:colors.ink},subtitle:{marginTop:5,fontSize:13,lineHeight:19,color:colors.muted},card:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,gap:spacing.sm},cardTitle:{fontSize:17,fontWeight:'800',color:colors.ink,marginBottom:4},row:{minHeight:34,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:spacing.md},rowLabel:{fontSize:13,color:colors.muted},rowValue:{flexShrink:1,textAlign:'right',fontSize:13,fontWeight:'800',color:colors.ink},mono:{fontFamily:'monospace'},note:{marginTop:spacing.sm,fontSize:12,lineHeight:18,color:colors.muted},checkRow:{flexDirection:'row',alignItems:'center',gap:spacing.md,paddingVertical:spacing.sm},checkTitle:{fontSize:14,fontWeight:'800',color:colors.ink},checkDetail:{marginTop:2,fontSize:12,lineHeight:17,color:colors.muted},warningCard:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.blush},warningText:{flex:1,fontSize:12,lineHeight:18,color:colors.ink}
});
