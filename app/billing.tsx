import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { productionConfig } from '@/config/production';
import { supabase } from '@/lib/supabase';
import { colors, radius, spacing } from '@/theme/tokens';

type Status = { active: boolean; label: string; expiresAt: string | null };
type RpcResult = { data: unknown; error: { message: string } | null };

const PLAY_SUBSCRIPTIONS_URL = 'https://play.google.com/store/account/subscriptions?package=com.mkraja826.janani';

function parseStatus(value: unknown): Status {
  const first = Array.isArray(value) ? value[0] : value;
  if (!first || typeof first !== 'object') return { active: false, label: 'No active Care+ entitlement', expiresAt: null };
  const row = first as Record<string, unknown>;
  const rawStatus = typeof row.status === 'string' ? row.status : null;
  const active = row.active === true || row.is_active === true || row.entitled === true || rawStatus === 'active';
  const expiresAt = typeof row.expires_at === 'string' ? row.expires_at : typeof row.current_period_end === 'string' ? row.current_period_end : null;
  return { active, label: active ? 'Care+ active' : rawStatus ? `Care+ ${rawStatus}` : 'No active Care+ entitlement', expiresAt };
}

export default function BillingScreen() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const rpc = supabase.rpc as unknown as (name: string) => Promise<RpcResult>;
      const result = await rpc('get_own_care_plus_status');
      if (result.error) throw new Error(result.error.message);
      setStatus(parseStatus(result.data));
    } catch (caught) {
      setStatus(null);
      setError(caught instanceof Error ? caught.message : 'Care+ account status is temporarily unavailable.');
    } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function openPlaySubscriptions() {
    try { await Linking.openURL(PLAY_SUBSCRIPTIONS_URL); }
    catch { Alert.alert('Could not open Google Play', 'Open Google Play → Payments & subscriptions → Subscriptions to manage Janani.'); }
  }

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable><View style={styles.flex}><Text style={styles.eyebrow}>JANANI CARE+</Text><Text style={styles.title}>Billing & subscription</Text><Text style={styles.subtitle}>Your Care+ access and Google Play subscription controls.</Text></View></View>

    <View style={styles.statusCard}>
      <View style={styles.statusIcon}><Ionicons name="sparkles" size={25} color={colors.rose} /></View>
      <View style={styles.flex}>{loading ? <ActivityIndicator color={colors.rose} /> : <><Text style={styles.statusTitle}>{status?.label ?? 'Care+ status unavailable'}</Text>{status?.expiresAt ? <Text style={styles.statusMeta}>Current period ends {new Date(status.expiresAt).toLocaleDateString()}</Text> : null}{error ? <Text style={styles.error}>{error}</Text> : null}</>}</View>
      {!loading ? <Pressable accessibilityLabel="Refresh Care+ status" onPress={() => void load()}><Ionicons name="refresh" size={21} color={colors.muted} /></Pressable> : null}
    </View>

    <View style={styles.section}><Text style={styles.sectionTitle}>Manage subscription</Text><Text style={styles.body}>Google Play is the source of truth for payment method, renewal, cancellation and eligible refund controls. Uninstalling Janani does not cancel a subscription.</Text><Pressable onPress={() => void openPlaySubscriptions()} style={styles.primaryButton}><Ionicons name="logo-google-playstore" size={20} color={colors.surface} /><Text style={styles.primaryText}>Manage in Google Play</Text></Pressable></View>

    <View style={styles.section}><Text style={styles.sectionTitle}>New purchases</Text><View style={styles.row}><Ionicons name={productionConfig.carePlusPurchasesEnabled ? 'checkmark-circle-outline' : 'pause-circle-outline'} size={22} color={productionConfig.carePlusPurchasesEnabled ? colors.sage : colors.muted} /><Text style={styles.body}>{productionConfig.carePlusPurchasesEnabled ? 'This release allows the Care+ purchase experience to be shown when Google Play products and verified checkout are available.' : 'New Care+ purchases are not offered in this build. Existing subscription management remains available above.'}</Text></View><Text style={styles.small}>Janani never treats a local button tap as proof of payment. Care+ access must be verified by the service entitlement layer.</Text></View>

    <View style={styles.section}><Text style={styles.sectionTitle}>Billing help</Text><Pressable onPress={() => router.push('/terms-of-service')} style={styles.linkRow}><Ionicons name="document-text-outline" size={20} color={colors.rose} /><Text style={styles.linkText}>Subscription terms</Text><Ionicons name="chevron-forward" size={18} color={colors.muted} /></Pressable><Pressable onPress={() => router.push('/privacy-policy')} style={styles.linkRow}><Ionicons name="shield-checkmark-outline" size={20} color={colors.rose} /><Text style={styles.linkText}>Privacy Policy</Text><Ionicons name="chevron-forward" size={18} color={colors.muted} /></Pressable></View>

    <Text style={styles.footer}>Prices and renewal terms must be shown by Google Play before a purchase is confirmed. Janani does not ask you to enter card details directly in the app.</Text>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.lg},header:{flexDirection:'row',gap:spacing.md,alignItems:'flex-start'},backButton:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},flex:{flex:1},eyebrow:{fontSize:11,letterSpacing:1.8,fontWeight:'800',color:colors.rose},title:{marginTop:4,fontSize:27,lineHeight:34,fontWeight:'900',color:colors.ink},subtitle:{marginTop:spacing.sm,fontSize:14,lineHeight:21,color:colors.muted},statusCard:{flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},statusIcon:{width:48,height:48,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface},statusTitle:{fontSize:17,fontWeight:'900',color:colors.ink},statusMeta:{marginTop:4,fontSize:12,color:colors.muted},error:{marginTop:6,fontSize:12,lineHeight:17,color:colors.danger},section:{gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},sectionTitle:{fontSize:18,fontWeight:'900',color:colors.ink},body:{flex:1,fontSize:14,lineHeight:21,color:colors.muted},small:{fontSize:12,lineHeight:18,color:colors.muted},row:{flexDirection:'row',alignItems:'flex-start',gap:spacing.md},primaryButton:{minHeight:54,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm,borderRadius:radius.pill,backgroundColor:colors.rose},primaryText:{fontSize:15,fontWeight:'900',color:colors.surface},linkRow:{minHeight:52,flexDirection:'row',alignItems:'center',gap:spacing.md},linkText:{flex:1,fontSize:14,fontWeight:'800',color:colors.ink},footer:{textAlign:'center',fontSize:11,lineHeight:17,color:colors.muted}});
