import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { productionConfig } from '@/config/production';
import { cacheActivePregnancyId } from '@/features/pregnancy/activePregnancy';
import { getPregnancyProgress, trimesterLabel } from '@/features/pregnancy/progress';
import { readCache, writeCache } from '@/lib/cache';
import { supabase } from '@/lib/supabase';
import { useMembership } from '@/providers/AuthGate';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

type FamilySummary = {
  role: 'mother' | 'partner';
  familyName: string;
  dueDate: string | null;
  inviteCode: string | null;
};

const CACHE_KEY = 'home-summary-v2';

export default function HomeScreen() {
  const { session } = useAuth();
  const { markMembership } = useMembership();
  const [summary, setSummary] = useState<FamilySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const userId = session?.user.id;

  const load = useCallback(async () => {
    if (!userId) return;
    setLoadError(false);
    const cached = await readCache<FamilySummary>(userId, CACHE_KEY);
    if (cached) {
      setSummary(cached);
      setLoading(false);
    }

    const membership = await supabase.from('family_members').select('role,family_id').eq('user_id', userId).maybeSingle();
    if (membership.error) {
      if (!cached) setLoadError(true);
      setLoading(false);
      return;
    }
    if (!membership.data) {
      await markMembership(false);
      router.replace('/onboarding');
      return;
    }

    const isMother = membership.data.role === 'mother';
    const [family, inviteCodeResult] = await Promise.all([
      supabase.from('families').select('name,pregnancies(id,due_date,status)').eq('id', membership.data.family_id).maybeSingle(),
      isMother ? supabase.rpc('get_mother_family_invite_code') : Promise.resolve({ data: null, error: null }),
    ]);

    if (family.error || !family.data || inviteCodeResult.error) {
      if (!cached) setLoadError(true);
      setLoading(false);
      return;
    }

    const familyData = family.data as unknown as {
      name: string;
      pregnancies: { id: string; due_date: string; status: string }[] | { id: string; due_date: string; status: string } | null;
    };
    const pregnancies = Array.isArray(familyData.pregnancies)
      ? familyData.pregnancies
      : familyData.pregnancies
        ? [familyData.pregnancies]
        : [];
    const activePregnancy = pregnancies.find((item) => item.status === 'active');
    const pregnancy = activePregnancy ?? pregnancies[0];
    const next: FamilySummary = {
      role: membership.data.role as FamilySummary['role'],
      familyName: familyData.name ?? 'Our little family',
      dueDate: pregnancy?.due_date ?? null,
      inviteCode: isMother ? inviteCodeResult.data : null,
    };

    setSummary(next);
    setLoading(false);
    await Promise.all([
      writeCache(userId, CACHE_KEY, next),
      cacheActivePregnancyId(userId, activePregnancy?.id ?? null),
    ]);
  }, [markMembership, userId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const progress = useMemo(
    () => (summary?.dueDate ? getPregnancyProgress(summary.dueDate) : null),
    [summary?.dueDate],
  );

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.rose} /></View>;
  if (loadError && !summary) {
    return <View style={styles.center}>
      <Ionicons name="cloud-offline-outline" size={34} color={colors.roseDark} />
      <Text style={styles.errorTitle}>PregaLove could not load today</Text>
      <Text style={styles.errorText}>Check your connection. Your saved pregnancy information is still safe.</Text>
      <Pressable onPress={() => { setLoading(true); void load(); }} style={styles.retryButton}><Text style={styles.retryText}>Try again</Text></Pressable>
    </View>;
  }

  const isMother = summary?.role === 'mother';
  const carePlusAvailable = isMother && productionConfig.carePlusVisible;

  return <SafeAreaView style={styles.page}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topRow}>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>TODAY WITH PREGALOVE</Text>
          <Text style={styles.title}>{isMother ? 'Good morning ❤️' : 'Here’s how you can help today ❤️'}</Text>
        </View>
        <Pressable accessibilityLabel="Settings" onPress={() => router.push('/settings')} style={styles.iconButton}>
          <Ionicons name="settings-outline" size={21} color={colors.inkSoft} />
        </Pressable>
      </View>

      <Pressable onPress={() => router.push('/pregnancy-guide')} style={styles.pregnancyCard}>
        <View style={styles.pregnancyIcon}><Ionicons name="heart" size={28} color={colors.surface} /></View>
        <View style={styles.flex}>
          {progress ? <>
            <Text style={styles.week}>Week {progress.gestationalWeek} + {progress.gestationalDay} days</Text>
            <Text style={styles.meta}>{trimesterLabel(progress.trimester)}</Text>
            <Text style={styles.caption}>{progress.isPastDue ? 'Your estimated due date has arrived.' : `${progress.daysRemaining} days until your estimated due date`}</Text>
          </> : <>
            <Text style={styles.week}>Your pregnancy journey</Text>
            <Text style={styles.caption}>Complete your pregnancy details so PregaLove can personalize today for you.</Text>
          </>}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.roseDark} />
      </Pressable>

      <Pressable onPress={() => router.push('/ai-companion')} disabled={!carePlusAvailable} style={[styles.askCard, !carePlusAvailable && styles.disabledCard]}>
        <View style={styles.askIcon}><Ionicons name="sparkles" size={24} color={colors.surface} /></View>
        <View style={styles.flex}>
          <Text style={styles.askTitle}>Ask PregaLove</Text>
          <Text style={styles.askText}>{carePlusAvailable ? 'Tell me what you need. I can help organize reminders, food, questions and your pregnancy day.' : 'AI assistance will appear here when Care+ is available for this account.'}</Text>
        </View>
        {carePlusAvailable ? <Ionicons name="mic-outline" size={22} color={colors.roseDark} /> : null}
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your day</Text>
        <Text style={styles.sectionCaption}>Only the things that matter now.</Text>
      </View>

      <View style={styles.todayGrid}>
        <TodayCard icon="alarm-outline" title="Medicines & reminders" caption="See what is due today" onPress={() => router.push('/reminders')} />
        <TodayCard icon="nutrition-outline" title="Food for today" caption="Regional pregnancy-friendly choices" onPress={() => router.push('/food-guide')} />
        {isMother ? <TodayCard icon="pulse-outline" title="Health" caption="Measurements and trends" onPress={() => router.push('/health-tracker')} /> : <TodayCard icon="heart-outline" title="Support her" caption="Send a thoughtful nudge" onPress={() => router.push('/thinking-of-you')} />}
        <TodayCard icon="book-outline" title="Journal" caption="Save how today felt" onPress={() => router.push('/journal')} />
      </View>

      {summary?.inviteCode ? <View style={styles.partnerCard}>
        <Ionicons name="people-outline" size={22} color={colors.roseDark} />
        <View style={styles.flex}>
          <Text style={styles.partnerTitle}>Invite your partner</Text>
          <Text style={styles.partnerText}>Share this code once. You control what is shared later.</Text>
          <Text selectable style={styles.inviteCode}>{summary.inviteCode}</Text>
        </View>
      </View> : null}

      <View style={styles.moreRow}>
        <Pressable onPress={() => router.push('/care-timeline')} style={styles.moreButton}><Ionicons name="calendar-clear-outline" size={18} color={colors.roseDark} /><Text style={styles.moreText}>Care timeline</Text></Pressable>
        <Pressable onPress={() => router.push('/health-guide')} style={styles.moreButton}><Ionicons name="medical-outline" size={18} color={colors.roseDark} /><Text style={styles.moreText}>Health guide</Text></Pressable>
      </View>

      <Text style={styles.disclaimer}>PregaLove supports everyday pregnancy care and does not replace your doctor.</Text>
    </ScrollView>
  </SafeAreaView>;
}

function TodayCard({ icon, title, caption, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; caption: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.todayCard}>
    <View style={styles.todayIcon}><Ionicons name={icon} size={21} color={colors.roseDark} /></View>
    <Text style={styles.todayTitle}>{title}</Text>
    <Text style={styles.todayCaption}>{caption}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},
  center:{flex:1,alignItems:'center',justifyContent:'center',gap:spacing.md,padding:spacing.xl,backgroundColor:colors.background},
  content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.xl},
  flex:{flex:1},
  topRow:{flexDirection:'row',alignItems:'flex-start',gap:spacing.md},
  eyebrow:{fontSize:11,letterSpacing:2.1,fontWeight:'900',color:colors.rose},
  title:{marginTop:6,fontSize:31,lineHeight:38,fontWeight:'900',color:colors.ink},
  iconButton:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},
  pregnancyCard:{flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.lg,borderRadius:26,backgroundColor:colors.rosePale,borderWidth:1,borderColor:colors.border},
  pregnancyIcon:{width:54,height:54,borderRadius:18,alignItems:'center',justifyContent:'center',backgroundColor:colors.rose},
  week:{fontSize:22,lineHeight:28,fontWeight:'900',color:colors.ink},
  meta:{marginTop:2,fontSize:14,fontWeight:'800',color:colors.roseDark},
  caption:{marginTop:5,fontSize:13,lineHeight:19,color:colors.muted},
  askCard:{flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.lg,borderRadius:24,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},
  disabledCard:{opacity:.6},
  askIcon:{width:48,height:48,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:colors.rose},
  askTitle:{fontSize:18,fontWeight:'900',color:colors.ink},
  askText:{marginTop:4,fontSize:13,lineHeight:19,color:colors.muted},
  sectionHeader:{gap:4},sectionTitle:{fontSize:21,fontWeight:'900',color:colors.ink},sectionCaption:{fontSize:13,color:colors.muted},
  todayGrid:{flexDirection:'row',flexWrap:'wrap',gap:spacing.md},
  todayCard:{width:'47%',minHeight:138,padding:spacing.md,borderRadius:22,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},
  todayIcon:{width:42,height:42,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:colors.blush},
  todayTitle:{marginTop:spacing.md,fontSize:15,fontWeight:'900',color:colors.ink},todayCaption:{marginTop:4,fontSize:12,lineHeight:17,color:colors.muted},
  partnerCard:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:22,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},
  partnerTitle:{fontSize:16,fontWeight:'900',color:colors.ink},partnerText:{marginTop:4,fontSize:12,lineHeight:18,color:colors.muted},inviteCode:{marginTop:spacing.sm,fontSize:18,letterSpacing:2,fontWeight:'900',color:colors.roseDark},
  moreRow:{flexDirection:'row',gap:spacing.md},moreButton:{flex:1,minHeight:52,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,borderRadius:radius.pill,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface},moreText:{fontSize:13,fontWeight:'800',color:colors.roseDark},
  disclaimer:{textAlign:'center',fontSize:11,lineHeight:17,color:colors.muted},
  errorTitle:{fontSize:20,fontWeight:'900',color:colors.ink,textAlign:'center'},errorText:{fontSize:13,lineHeight:20,color:colors.muted,textAlign:'center'},retryButton:{paddingHorizontal:20,paddingVertical:13,borderRadius:radius.pill,backgroundColor:colors.rose},retryText:{fontWeight:'900',color:colors.surface},
});
