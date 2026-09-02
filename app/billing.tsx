import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { productionConfig } from '@/config/production';
import { supabase } from '@/lib/supabase';
import { colors, radius, spacing } from '@/theme/tokens';

type CarePlusStatus = {
  active: boolean;
  status: 'none' | 'active' | 'grace_period' | 'expired' | 'revoked' | string;
  planCode?: string | null;
  currentPeriodEnd?: string | null;
  requestsUsed?: number;
  requestLimit?: number;
};

const PLAY_BILLING_CONNECTED = false;
const GOOGLE_PLAY_SUBSCRIPTIONS_URL = 'https://play.google.com/store/account/subscriptions';

export default function BillingScreen() {
  const [status, setStatus] = useState<CarePlusStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase.rpc('get_own_care_plus_status');
    if (error) {
      setLoadError('Janani could not verify your Care+ status right now. Your existing Janani data is unaffected.');
      setLoading(false);
      return;
    }
    setStatus((data ?? null) as CarePlusStatus | null);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const used = Math.max(0, status?.requestsUsed ?? 0);
  const limit = Math.max(1, status?.requestLimit ?? 100);
  const periodEnd = status?.currentPeriodEnd ? new Date(status.currentPeriodEnd) : null;
  const periodLabel = periodEnd && !Number.isNaN(periodEnd.getTime()) ? periodEnd.toLocaleDateString() : null;

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </Pressable>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>JANANI CARE+</Text>
            <Text style={styles.title}>Plan & billing</Text>
            <Text style={styles.subtitle}>Your subscription, Care+ access and monthly AI allowance in one place.</Text>
          </View>
        </View>

        <View style={styles.planCard}>
          <View style={styles.planTopRow}>
            <View>
              <Text style={styles.planName}>Janani Care+</Text>
              <Text style={styles.price}>₹699 <Text style={styles.priceSuffix}>/ month</Text></Text>
            </View>
            <View style={[styles.statusBadge, status?.active ? styles.statusActive : styles.statusInactive]}>
              <Text style={[styles.statusText, status?.active ? styles.statusTextActive : styles.statusTextInactive]}>
                {loading ? 'Checking' : status?.active ? 'Active' : 'Not active'}
              </Text>
            </View>
          </View>
          <Benefit icon="sparkles-outline" text="Personalised Janani Care+ support using the pregnancy context you choose to save." />
          <Benefit icon="calendar-outline" text="Appointment preparation, daily summaries and health-trend explanations." />
          <Benefit icon="nutrition-outline" text="Pregnancy-aware meal ideas subject to Janani safety and clinical rules." />
          <Benefit icon="shield-checkmark-outline" text="AI remains support-only: no diagnosis, prescribing or medicine changes." />
        </View>

        {loading ? (
          <View style={styles.stateCard}><ActivityIndicator color={colors.rose} /><Text style={styles.stateText}>Checking your Care+ entitlement…</Text></View>
        ) : loadError ? (
          <View style={styles.stateCard}>
            <Ionicons name="cloud-offline-outline" size={24} color={colors.rose} />
            <Text style={styles.stateTitle}>Could not verify billing status</Text>
            <Text style={styles.stateText}>{loadError}</Text>
            <Pressable onPress={() => void load()} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Try again</Text></Pressable>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Care+ status</Text>
            <InfoRow label="Subscription" value={status?.active ? 'Active' : status?.status === 'grace_period' ? 'Grace period' : 'Inactive'} />
            {status?.planCode ? <InfoRow label="Plan" value={status.planCode} /> : null}
            {periodLabel ? <InfoRow label="Current period ends" value={periodLabel} /> : null}
            <InfoRow label="AI requests this month" value={`${used} of ${limit}`} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Google Play billing</Text>
          {productionConfig.carePlusPurchasesEnabled && PLAY_BILLING_CONNECTED ? (
            <Pressable style={styles.primaryButton}><Ionicons name="card-outline" size={20} color={colors.surface} /><Text style={styles.primaryButtonText}>{status?.active ? 'Manage subscription' : 'Subscribe with Google Play'}</Text></Pressable>
          ) : (
            <View style={styles.pendingCard}>
              <Ionicons name="construct-outline" size={23} color={colors.rose} />
              <View style={styles.flex}>
                <Text style={styles.pendingTitle}>Checkout is not connected yet</Text>
                <Text style={styles.pendingText}>This screen is production-safe: it will never simulate a charge. Google Play Billing still needs to be connected and purchase verification tested before Janani can accept subscription payments.</Text>
              </View>
            </View>
          )}
          <Pressable onPress={() => void Linking.openURL(GOOGLE_PLAY_SUBSCRIPTIONS_URL)} style={styles.linkButton}>
            <Ionicons name="open-outline" size={19} color={colors.rose} />
            <Text style={styles.linkButtonText}>Open Google Play subscriptions</Text>
          </Pressable>
          <Text style={styles.smallPrint}>Purchases, renewals, cancellations and refunds are handled according to Google Play billing rules once Play Billing is enabled.</Text>
        </View>

        <View style={styles.legalCard}>
          <Text style={styles.legalTitle}>Before subscribing</Text>
          <Text style={styles.legalText}>Care+ provides supportive and educational information. It is not medical care and does not replace your maternity team.</Text>
          <View style={styles.legalLinks}>
            <Pressable onPress={() => router.push('/terms-of-service')}><Text style={styles.legalLink}>Terms of Service</Text></Pressable>
            <Pressable onPress={() => router.push('/privacy-policy')}><Text style={styles.legalLink}>Privacy Policy</Text></Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Benefit({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return <View style={styles.benefit}><View style={styles.benefitIcon}><Ionicons name={icon} size={19} color={colors.rose} /></View><Text style={styles.benefitText}>{text}</Text></View>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.lg},header:{flexDirection:'row',alignItems:'flex-start',gap:spacing.md},flex:{flex:1},iconButton:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},eyebrow:{fontSize:11,letterSpacing:1.8,fontWeight:'800',color:colors.rose},title:{marginTop:4,fontSize:29,lineHeight:36,fontWeight:'900',color:colors.ink},subtitle:{marginTop:spacing.sm,fontSize:14,lineHeight:21,color:colors.muted},planCard:{gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},planTopRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',gap:spacing.md},planName:{fontSize:21,fontWeight:'900',color:colors.ink},price:{marginTop:4,fontSize:28,fontWeight:'900',color:colors.roseDark},priceSuffix:{fontSize:13,fontWeight:'600',color:colors.muted},statusBadge:{paddingHorizontal:11,paddingVertical:7,borderRadius:radius.pill},statusActive:{backgroundColor:colors.sageSoft},statusInactive:{backgroundColor:colors.blush},statusText:{fontSize:11,fontWeight:'900'},statusTextActive:{color:colors.sage},statusTextInactive:{color:colors.roseDark},benefit:{flexDirection:'row',gap:spacing.md,alignItems:'flex-start'},benefitIcon:{width:34,height:34,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.blush},benefitText:{flex:1,fontSize:13,lineHeight:20,color:colors.ink},section:{gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},sectionTitle:{fontSize:18,fontWeight:'900',color:colors.ink},infoRow:{minHeight:40,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:spacing.md,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:colors.border},infoLabel:{fontSize:13,color:colors.muted},infoValue:{flexShrink:1,textAlign:'right',fontSize:13,fontWeight:'800',color:colors.ink},stateCard:{gap:spacing.sm,alignItems:'center,padding':0},stateText:{fontSize:13,lineHeight:20,textAlign:'center',color:colors.muted},stateTitle:{fontSize:16,fontWeight:'800',color:colors.ink},secondaryButton:{minHeight:46,minWidth:120,alignItems:'center',justifyContent:'center',borderRadius:radius.pill,borderWidth:1,borderColor:colors.rose},secondaryButtonText:{fontSize:14,fontWeight:'800',color:colors.roseDark},primaryButton:{minHeight:54,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm,borderRadius:radius.pill,backgroundColor:colors.rose},primaryButtonText:{fontSize:15,fontWeight:'900',color:colors.surface},pendingCard:{flexDirection:'row',gap:spacing.md,padding:spacing.md,borderRadius:radius.md,backgroundColor:colors.blush},pendingTitle:{fontSize:14,fontWeight:'900',color:colors.ink},pendingText:{marginTop:4,fontSize:12,lineHeight:18,color:colors.muted},linkButton:{minHeight:50,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm,borderRadius:radius.pill,borderWidth:1,borderColor:colors.border},linkButtonText:{fontSize:14,fontWeight:'800',color:colors.roseDark},smallPrint:{fontSize:11,lineHeight:17,color:colors.muted},legalCard:{gap:spacing.sm,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.sageSoft,borderWidth:1,borderColor:colors.border},legalTitle:{fontSize:16,fontWeight:'900',color:colors.ink},legalText:{fontSize:13,lineHeight:20,color:colors.muted},legalLinks:{marginTop:spacing.sm,flexDirection:'row',flexWrap:'wrap',gap:spacing.lg},legalLink:{fontSize:13,fontWeight:'900',color:colors.roseDark,textDecorationLine:'underline'}
});
