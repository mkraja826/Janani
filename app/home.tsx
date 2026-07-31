import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getPregnancyProgress, trimesterLabel } from '@/features/pregnancy/progress';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

type FamilySummary = {
  role: 'mother' | 'partner';
  familyName: string;
  dueDate: string | null;
  inviteCode: string | null;
};

export default function HomeScreen() {
  const { session, signOut } = useAuth();
  const [summary, setSummary] = useState<FamilySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { router.replace('/auth'); return; }
    async function load() {
      const { data, error } = await supabase.from('family_members').select('role, families(name, invite_code, pregnancies(due_date,status))').eq('user_id', session!.user.id).maybeSingle();
      if (error || !data) { setLoading(false); router.replace('/onboarding'); return; }
      const family = Array.isArray(data.families) ? data.families[0] : data.families;
      const pregnancies = family?.pregnancies;
      const pregnancyList = Array.isArray(pregnancies) ? pregnancies : pregnancies ? [pregnancies] : [];
      const pregnancy = pregnancyList.find((item) => item.status === 'active') ?? pregnancyList[0];
      setSummary({ role: data.role, familyName: family?.name ?? 'Our little family', dueDate: pregnancy?.due_date ?? null, inviteCode: data.role === 'mother' ? family?.invite_code ?? null : null });
      setLoading(false);
    }
    load();
  }, [session]);

  const progress = useMemo(() => summary?.dueDate ? getPregnancyProgress(summary.dueDate) : null, [summary?.dueDate]);
  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.rose} /></View>;

  return <SafeAreaView style={styles.page}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <View style={styles.flex}><Text style={styles.eyebrow}>{summary?.familyName.toUpperCase()}</Text><Text style={styles.title}>{summary?.role === 'mother' ? 'How are you feeling today?' : 'A little care goes a long way.'}</Text></View>
        <Pressable accessibilityLabel="Sign out" onPress={async () => { await signOut(); router.replace('/'); }} style={styles.iconButton}><Ionicons name="log-out-outline" size={22} color={colors.muted} /></Pressable>
      </View>

      <View style={styles.heroCard}>
        <Ionicons name="heart-circle" size={52} color={colors.rose} />
        <View style={styles.flex}>
          <Text style={styles.cardEyebrow}>TODAY WITH JANANI</Text>
          {progress ? <>
            <Text style={styles.week}>Week {progress.gestationalWeek}</Text>
            <Text style={styles.cardTitle}>{trimesterLabel(progress.trimester)} · day {progress.gestationalDay}</Text>
            <Text style={styles.cardMeta}>{progress.isPastDue ? 'Your due date has arrived. Keep in touch with your maternity care team.' : `${progress.daysRemaining} days until the estimated due date`}</Text>
          </> : <Text style={styles.cardTitle}>Drink a glass of water and take one quiet minute for yourself.</Text>}
        </View>
      </View>

      {summary?.inviteCode && <View style={styles.inviteCard}><Text style={styles.inviteLabel}>Partner invite code</Text><Text style={styles.inviteCode}>{summary.inviteCode}</Text><Text style={styles.inviteHelp}>Share this privately with your partner. It links both of you to the same family space.</Text></View>}

      <View style={styles.grid}>
        <Feature icon="alarm-outline" title="Reminders" caption="Medicines and care" onPress={() => router.push('/reminders')} />
        <Feature icon="book-outline" title="Journal" caption="Keep every memory" />
        <Feature icon="nutrition-outline" title="Food guide" caption="Trimester-aware help" />
        <Feature icon="heart-outline" title="Thinking of you" caption="Send partner warmth" />
      </View>
      <Text style={styles.disclaimer}>Janani supports daily care and does not replace advice from your doctor.</Text>
    </ScrollView>
  </SafeAreaView>;
}

function Feature({ icon, title, caption, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; caption: string; onPress?: () => void }) {
  return <Pressable disabled={!onPress} onPress={onPress} style={styles.feature}><View style={styles.featureIcon}><Ionicons name={icon} size={24} color={colors.rose} /></View><Text style={styles.featureTitle}>{title}</Text><Text style={styles.featureCaption}>{caption}</Text></Pressable>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.xl},topRow:{flexDirection:'row',justifyContent:'space-between',gap:spacing.md,alignItems:'flex-start'},flex:{flex:1},eyebrow:{fontSize:12,letterSpacing:2.2,fontWeight:'800',color:colors.rose},title:{marginTop:spacing.sm,maxWidth:290,fontSize:30,lineHeight:37,fontWeight:'800',color:colors.ink},iconButton:{width:44,height:44,borderRadius:radius.pill,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.border},heroCard:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},cardEyebrow:{fontSize:11,letterSpacing:1.8,fontWeight:'800',color:colors.roseDark},week:{marginTop:spacing.sm,fontSize:30,fontWeight:'900',color:colors.ink},cardTitle:{marginTop:4,fontSize:17,lineHeight:24,fontWeight:'700',color:colors.ink},cardMeta:{marginTop:spacing.md,fontSize:13,lineHeight:19,color:colors.muted},inviteCard:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},inviteLabel:{fontSize:13,fontWeight:'700',color:colors.muted},inviteCode:{marginVertical:spacing.sm,fontSize:28,letterSpacing:4,fontWeight:'900',color:colors.roseDark},inviteHelp:{fontSize:13,lineHeight:19,color:colors.muted},grid:{flexDirection:'row',flexWrap:'wrap',gap:spacing.md},feature:{width:'47.5%',minHeight:145,padding:spacing.md,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},featureIcon:{width:44,height:44,borderRadius:radius.md,alignItems:'center',justifyContent:'center',backgroundColor:colors.blush},featureTitle:{marginTop:spacing.md,fontSize:16,fontWeight:'800',color:colors.ink},featureCaption:{marginTop:spacing.xs,fontSize:13,color:colors.muted},disclaimer:{textAlign:'center',fontSize:12,lineHeight:18,color:colors.muted}
});
