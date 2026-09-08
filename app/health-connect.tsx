import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getHealthConnectCapability, getHealthConnectPermissions, readHealthConnectSummary, requestHealthConnectPermissions } from '@/features/healthConnect/healthConnectGateway';
import type { HealthConnectCapability, HealthConnectPermissions, HealthConnectSummary } from '@/features/healthConnect/healthConnectTypes';
import { colors, radius, spacing } from '@/theme/tokens';

export default function HealthConnectScreen() {
  const [capability, setCapability] = useState<HealthConnectCapability | null>(null);
  const [permissions, setPermissions] = useState<HealthConnectPermissions | null>(null);
  const [summary, setSummary] = useState<HealthConnectSummary | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => { void refresh(); }, []);

  async function refresh() {
    setBusy(true);
    const nextCapability = await getHealthConnectCapability();
    const nextPermissions = await getHealthConnectPermissions();
    const nextSummary = await readHealthConnectSummary();
    setCapability(nextCapability);
    setPermissions(nextPermissions);
    setSummary(nextSummary);
    setBusy(false);
  }

  async function connect() {
    setBusy(true);
    await requestHealthConnectPermissions();
    await refresh();
  }

  const nativeMissing = capability?.reason === 'native_module_missing';
  const providerUpdate = capability?.reason === 'provider_update_required';

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={22} color={colors.ink}/></Pressable><View style={styles.flex}><Text style={styles.eyebrow}>HEALTH CONNECT</Text><Text style={styles.title}>Bring your health data into PregaLove.</Text><Text style={styles.subtitle}>Optional, read-only access to steps, sleep, heart rate and weight. PregaLove uses trends for supportive summaries, never diagnosis.</Text></View></View>

    {busy ? <ActivityIndicator color={colors.rose}/> : <>
      <View style={styles.statusCard}><View style={styles.statusIcon}><Ionicons name={capability?.available ? 'checkmark-circle' : 'watch-outline'} size={26} color={colors.roseDark}/></View><View style={styles.flex}><Text style={styles.statusTitle}>{capability?.available ? 'Health Connect is available' : providerUpdate ? 'Health Connect needs an update' : nativeMissing ? 'Health Connect bridge is unavailable in this build' : 'Health Connect is not available on this device'}</Text><Text style={styles.statusText}>{capability?.available ? 'Choose which supported health data PregaLove may read. You can revoke access later in Android settings.' : providerUpdate ? 'Update Health Connect on this device, then return here.' : capability?.reason === 'android_version' ? 'This Android version cannot provide Health Connect data, but the rest of PregaLove continues to work.' : 'The rest of PregaLove continues to work normally.'}</Text></View></View>

      <View style={styles.grid}>
        <Metric icon="footsteps-outline" title="Steps" value={summary?.stepsToday == null ? 'Not connected' : `${Math.round(summary.stepsToday)}`} granted={permissions?.steps}/>
        <Metric icon="moon-outline" title="Sleep" value={summary?.sleepMinutesLastNight == null ? 'Not connected' : `${Math.floor(summary.sleepMinutesLastNight / 60)}h ${Math.round(summary.sleepMinutesLastNight % 60)}m`} granted={permissions?.sleep}/>
        <Metric icon="heart-outline" title="Latest heart rate" value={summary?.latestHeartRateBpm == null ? 'Not connected' : `${Math.round(summary.latestHeartRateBpm)} bpm`} granted={permissions?.heart_rate}/>
        <Metric icon="scale-outline" title="Weight" value={summary?.latestWeightKg == null ? 'Not connected' : `${summary.latestWeightKg.toFixed(1)} kg`} granted={permissions?.weight}/>
      </View>

      <Pressable disabled={!capability?.available} onPress={connect} style={[styles.primary, !capability?.available && styles.disabled]}><Ionicons name="link-outline" size={20} color={colors.surface}/><Text style={styles.primaryText}>{capability?.available ? 'Choose Health Connect access' : 'Health Connect unavailable'}</Text></Pressable>
    </>}

    <View style={styles.safety}><Ionicons name="shield-checkmark-outline" size={22} color={colors.roseDark}/><Text style={styles.safetyText}>Wearable and phone health data can be incomplete or inaccurate. PregaLove will not use it to diagnose pregnancy complications, prescribe treatment, or tell you that you or your baby are safe.</Text></View>
  </ScrollView></SafeAreaView>;
}

function Metric({icon,title,value,granted}:{icon:keyof typeof Ionicons.glyphMap;title:string;value:string;granted?:boolean}) { return <View style={styles.metric}><View style={styles.metricIcon}><Ionicons name={icon} size={21} color={colors.roseDark}/></View><Text style={styles.metricTitle}>{title}</Text><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricMeta}>{granted ? 'Permission granted' : 'Permission not granted'}</Text></View>; }

const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.lg},header:{flexDirection:'row',gap:spacing.md,alignItems:'flex-start'},back:{width:44,height:44,borderRadius:radius.pill,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center'},flex:{flex:1},eyebrow:{fontSize:11,letterSpacing:2,fontWeight:'900',color:colors.rose},title:{marginTop:5,fontSize:29,lineHeight:36,fontWeight:'900',color:colors.ink},subtitle:{marginTop:8,fontSize:14,lineHeight:21,color:colors.muted},statusCard:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:24,backgroundColor:colors.rosePale,borderWidth:1,borderColor:colors.border},statusIcon:{width:48,height:48,borderRadius:16,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center'},statusTitle:{fontSize:17,fontWeight:'900',color:colors.ink},statusText:{marginTop:4,fontSize:13,lineHeight:19,color:colors.muted},grid:{flexDirection:'row',flexWrap:'wrap',gap:spacing.md},metric:{width:'47%',minHeight:135,padding:spacing.md,borderRadius:22,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},metricIcon:{width:42,height:42,borderRadius:14,backgroundColor:colors.blush,alignItems:'center',justifyContent:'center'},metricTitle:{marginTop:spacing.sm,fontSize:14,fontWeight:'900',color:colors.ink},metricValue:{marginTop:4,fontSize:16,fontWeight:'900',color:colors.roseDark},metricMeta:{marginTop:3,fontSize:11,lineHeight:16,color:colors.muted},primary:{minHeight:56,borderRadius:radius.pill,backgroundColor:colors.rose,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:spacing.sm},disabled:{opacity:.5},primaryText:{fontSize:16,fontWeight:'900',color:colors.surface},safety:{flexDirection:'row',gap:spacing.sm,padding:spacing.md,borderRadius:20,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},safetyText:{flex:1,fontSize:12,lineHeight:18,color:colors.muted}});
