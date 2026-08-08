import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { colors, radius, spacing } from '@/theme/tokens';

type Entitlement = {
  active: boolean;
  plan: string | null;
  periodEnd: string | null;
  requestsUsed: number;
  requestsLimit: number;
};

export default function CarePlusScreen() {
  const [status, setStatus] = useState<Entitlement | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc('get_own_care_plus_status');
    const raw = data as Record<string, unknown> | null;
    setStatus({
      active: Boolean(raw?.active),
      plan: typeof raw?.plan === 'string' ? raw.plan : null,
      periodEnd: typeof raw?.period_end === 'string' ? raw.period_end : null,
      requestsUsed: typeof raw?.requests_used === 'number' ? raw.requests_used : 0,
      requestsLimit: typeof raw?.requests_limit === 'number' ? raw.requests_limit : 100,
    });
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

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

        {loading ? <ActivityIndicator color={colors.rose} /> : status?.active ? (
          <View style={styles.activeCard}>
            <Ionicons name="sparkles" size={28} color={colors.roseDark} />
            <Text style={styles.activeTitle}>Care+ is active</Text>
            <Text style={styles.meta}>{status.requestsUsed} of {status.requestsLimit} AI generations used this month.</Text>
            <Pressable style={styles.primary} onPress={() => router.push('/care-plus-assistant')}>
              <Text style={styles.primaryText}>Open Care+ assistant</Text>
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
            <Text style={styles.small}>No payment is collected in this build. Play Billing must be implemented and server-verified before subscriptions can be sold.</Text>
          </View>
        )}

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

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.lg},header:{flexDirection:'row',gap:spacing.md,alignItems:'flex-start'},back:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},flex:{flex:1},eyebrow:{fontSize:11,letterSpacing:1.8,fontWeight:'800',color:colors.rose},title:{marginTop:spacing.xs,fontSize:28,lineHeight:35,fontWeight:'900',color:colors.ink},planCard:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,gap:spacing.sm},planName:{fontSize:19,fontWeight:'900',color:colors.roseDark},price:{fontSize:34,fontWeight:'900',color:colors.ink},month:{fontSize:16,fontWeight:'700',color:colors.muted},annual:{fontSize:13,color:colors.muted,marginBottom:spacing.sm},feature:{flexDirection:'row',gap:spacing.sm,alignItems:'flex-start'},featureText:{flex:1,fontSize:14,lineHeight:20,color:colors.ink},disabledButton:{marginTop:spacing.md,minHeight:50,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},disabledText:{fontWeight:'800',color:colors.roseDark},small:{fontSize:11,lineHeight:17,color:colors.muted,textAlign:'center'},activeCard:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border,gap:spacing.sm},activeTitle:{fontSize:20,fontWeight:'900',color:colors.ink},meta:{fontSize:13,color:colors.muted},primary:{marginTop:spacing.sm,minHeight:50,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.rose},primaryText:{fontWeight:'800',color:colors.surface},freeCard:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},safetyCard:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},sectionTitle:{fontSize:16,fontWeight:'900',color:colors.ink},body:{marginTop:spacing.sm,fontSize:13,lineHeight:20,color:colors.muted},
});
