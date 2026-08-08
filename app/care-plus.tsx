import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { colors, radius, spacing } from '@/theme/tokens';

type Entitlement = {
  active: boolean;
  status: string;
  planCode: string | null;
  currentPeriodEnd: string | null;
  requestsUsed: number;
  requestsLimit: number;
  inputTokensUsed: number;
  inputTokensLimit: number;
  outputTokensUsed: number;
  outputTokensLimit: number;
};

const emptyStatus: Entitlement = {
  active: false,
  status: 'none',
  planCode: null,
  currentPeriodEnd: null,
  requestsUsed: 0,
  requestsLimit: 100,
  inputTokensUsed: 0,
  inputTokensLimit: 150000,
  outputTokensUsed: 0,
  outputTokensLimit: 50000,
};

export default function CarePlusScreen() {
  const [status, setStatus] = useState<Entitlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase.rpc('get_own_care_plus_status');
    if (error) {
      setStatus(null);
      setLoadError('Care+ status is unavailable in this build until the server migration is deployed.');
      setLoading(false);
      return;
    }
    const raw = (data ?? {}) as Record<string, unknown>;
    setStatus({
      active: Boolean(raw.active),
      status: typeof raw.status === 'string' ? raw.status : 'none',
      planCode: typeof raw.planCode === 'string' ? raw.planCode : null,
      currentPeriodEnd: typeof raw.currentPeriodEnd === 'string' ? raw.currentPeriodEnd : null,
      requestsUsed: typeof raw.requestsUsed === 'number' ? raw.requestsUsed : 0,
      requestsLimit: typeof raw.requestsLimit === 'number' ? raw.requestsLimit : 100,
      inputTokensUsed: typeof raw.inputTokensUsed === 'number' ? raw.inputTokensUsed : 0,
      inputTokensLimit: typeof raw.inputTokensLimit === 'number' ? raw.inputTokensLimit : 150000,
      outputTokensUsed: typeof raw.outputTokensUsed === 'number' ? raw.outputTokensUsed : 0,
      outputTokensLimit: typeof raw.outputTokensLimit === 'number' ? raw.outputTokensLimit : 50000,
    });
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const shown = status ?? emptyStatus;
  const requestPercent = Math.min(100, Math.round((shown.requestsUsed / Math.max(shown.requestsLimit, 1)) * 100));

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={23} color={colors.ink} />
          </Pressable>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>JANANI CARE+</Text>
            <Text style={styles.title}>Personalised support, with safety boundaries.</Text>
          </View>
        </View>

        {loading ? <ActivityIndicator color={colors.rose} /> : loadError ? (
          <View style={styles.warningCard}>
            <Ionicons name="construct-outline" size={25} color={colors.roseDark} />
            <View style={styles.flex}>
              <Text style={styles.sectionTitle}>Care+ beta is not deployed yet</Text>
              <Text style={styles.body}>{loadError}</Text>
              <Pressable onPress={() => void load()} style={styles.secondary}><Text style={styles.secondaryText}>Check again</Text></Pressable>
            </View>
          </View>
        ) : shown.active ? (
          <View style={styles.activeCard}>
            <Ionicons name="sparkles" size={28} color={colors.roseDark} />
            <Text style={styles.activeTitle}>Care+ is active</Text>
            <Text style={styles.meta}>{shown.requestsUsed} of {shown.requestsLimit} AI generations used this month.</Text>
            <View style={styles.track}><View style={[styles.fill, { width: `${requestPercent}%` }]} /></View>
            <View style={styles.quotaRow}>
              <Quota label="Input" used={shown.inputTokensUsed} limit={shown.inputTokensLimit} />
              <Quota label="Output" used={shown.outputTokensUsed} limit={shown.outputTokensLimit} />
            </View>
            {shown.currentPeriodEnd ? <Text style={styles.small}>Current period ends {new Date(shown.currentPeriodEnd).toLocaleDateString()}.</Text> : null}
            <Pressable style={styles.primary} onPress={() => router.push('/care-plus-assistant')}>
              <Text style={styles.primaryText}>Open protected beta</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.planCard}>
            <Text style={styles.planName}>Care+</Text>
            <Text style={styles.price}>₹99 <Text style={styles.month}>/ month</Text></Text>
            <Text style={styles.annual}>or ₹799/year · planned launch pricing</Text>
            <Feature text="Personalised daily wellbeing summary" />
            <Feature text="Weekly meal ideas based on approved guidance" />
            <Feature text="Appointment preparation summaries" />
            <Feature text="Health-trend explanations within reviewed safety rules" />
            <Feature text="Up to 100 AI generations each month" />
            <View style={styles.disabledButton}><Text style={styles.disabledText}>Subscriptions coming soon</Text></View>
            <Text style={styles.small}>No payment is collected in this build. Play Billing and server-side purchase verification must be completed before Care+ can be sold.</Text>
          </View>
        )}

        <View style={styles.betaCard}>
          <Ionicons name="flask-outline" size={24} color={colors.roseDark} />
          <View style={styles.flex}>
            <Text style={styles.sectionTitle}>Protected beta</Text>
            <Text style={styles.body}>The user interface is ready, but production AI remains switched off. Development evaluation uses fictional profiles only until the provider passes Janani's safety tests.</Text>
          </View>
        </View>

        <View style={styles.freeCard}>
          <Text style={styles.sectionTitle}>Janani stays useful without Care+</Text>
          <Text style={styles.body}>Pregnancy progress, reminders, journal, partner support, health records, basic food guidance, safety information, export and privacy controls remain available without AI.</Text>
        </View>

        <View style={styles.safetyCard}>
          <Ionicons name="shield-checkmark-outline" size={24} color={colors.roseDark} />
          <View style={styles.flex}>
            <Text style={styles.sectionTitle}>AI does not replace your maternity team</Text>
            <Text style={styles.body}>Care+ cannot diagnose a condition, change medicines, prescribe a dose, or guarantee that you or your baby are safe. Urgent concerns should go directly to your maternity care team.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Feature({ text }: { text: string }) {
  return <View style={styles.feature}><Ionicons name="checkmark-circle" size={20} color={colors.rose} /><Text style={styles.featureText}>{text}</Text></View>;
}

function Quota({ label, used, limit }: { label: string; used: number; limit: number }) {
  return <View style={styles.quota}><Text style={styles.quotaLabel}>{label} tokens</Text><Text style={styles.quotaValue}>{used.toLocaleString()} / {limit.toLocaleString()}</Text></View>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.lg},header:{flexDirection:'row',gap:spacing.md,alignItems:'flex-start'},back:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},flex:{flex:1},eyebrow:{fontSize:11,letterSpacing:1.8,fontWeight:'800',color:colors.rose},title:{marginTop:spacing.xs,fontSize:28,lineHeight:35,fontWeight:'900',color:colors.ink},planCard:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,gap:spacing.sm},planName:{fontSize:19,fontWeight:'900',color:colors.roseDark},price:{fontSize:34,fontWeight:'900',color:colors.ink},month:{fontSize:16,fontWeight:'700',color:colors.muted},annual:{fontSize:13,color:colors.muted,marginBottom:spacing.sm},feature:{flexDirection:'row',gap:spacing.sm,alignItems:'flex-start'},featureText:{flex:1,fontSize:14,lineHeight:20,color:colors.ink},disabledButton:{marginTop:spacing.md,minHeight:50,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},disabledText:{fontWeight:'800',color:colors.roseDark},small:{fontSize:11,lineHeight:17,color:colors.muted,textAlign:'center'},activeCard:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border,gap:spacing.sm},activeTitle:{fontSize:20,fontWeight:'900',color:colors.ink},meta:{fontSize:13,color:colors.muted},primary:{marginTop:spacing.sm,minHeight:50,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.rose},primaryText:{fontWeight:'800',color:colors.surface},secondary:{alignSelf:'flex-start',marginTop:spacing.sm,paddingHorizontal:spacing.md,paddingVertical:10,borderRadius:radius.pill,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},secondaryText:{fontWeight:'800',color:colors.roseDark},track:{height:8,borderRadius:4,backgroundColor:colors.surface,overflow:'hidden'},fill:{height:8,backgroundColor:colors.rose},quotaRow:{flexDirection:'row',gap:spacing.sm},quota:{flex:1,padding:spacing.sm,borderRadius:radius.md,backgroundColor:colors.surface},quotaLabel:{fontSize:11,fontWeight:'800',color:colors.muted},quotaValue:{marginTop:3,fontSize:12,fontWeight:'800',color:colors.ink},freeCard:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},safetyCard:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},betaCard:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},warningCard:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},sectionTitle:{fontSize:16,fontWeight:'900',color:colors.ink},body:{marginTop:spacing.sm,fontSize:13,lineHeight:20,color:colors.muted},
});
