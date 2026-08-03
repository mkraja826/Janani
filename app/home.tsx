import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { flushJananiOfflineQueue } from '@/features/offline/OfflineQueueSync';
import { cacheActivePregnancyId } from '@/features/pregnancy/activePregnancy';
import { getPregnancyProgress, trimesterLabel } from '@/features/pregnancy/progress';
import { readCache, writeCache } from '@/lib/cache';
import { supabase } from '@/lib/supabase';
import { useMembership } from '@/providers/AuthGate';
import { PendingOfflineChangesError, useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

type FamilySummary = {
  role: 'mother' | 'partner';
  familyName: string;
  dueDate: string | null;
  inviteCode: string | null;
};

const CACHE_KEY = 'home-summary-v1';

export default function HomeScreen() {
  const { session, signOut } = useAuth();
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

    const membership = await supabase
      .from('family_members')
      .select('role,family_id')
      .eq('user_id', userId)
      .maybeSingle();
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
      supabase
        .from('families')
        .select('name,pregnancies(id,due_date,status)')
        .eq('id', membership.data.family_id)
        .maybeSingle(),
      isMother
        ? supabase.rpc('get_mother_family_invite_code')
        : Promise.resolve({ data: null, error: null }),
    ]);
    if (family.error || !family.data) {
      if (!cached) setLoadError(true);
      setLoading(false);
      return;
    }
    if (inviteCodeResult.error) {
      if (!cached) setLoadError(true);
      setLoading(false);
      return;
    }

    const familyData = family.data as unknown as {
      name: string;
      pregnancies:
        | { id: string; due_date: string; status: string }[]
        | { id: string; due_date: string; status: string }
        | null;
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

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  async function finishSignOut(discardPending = false) {
    try {
      await signOut({ discardPending });
      router.replace('/');
    } catch (error) {
      if (error instanceof PendingOfflineChangesError) {
        Alert.alert(
          'Unsynced changes',
          `${error.message} Stay signed in to preserve them, or explicitly discard them before signing out.`,
          [
            { text: 'Stay signed in', style: 'cancel' },
            {
              text: 'Sync first',
              onPress: () => {
                if (!userId) return;
                void flushJananiOfflineQueue(userId)
                  .then(() => finishSignOut(false))
                  .catch(() => Alert.alert('Could not sync', 'Check your connection and try again.'));
              },
            },
            {
              text: 'Discard & sign out',
              style: 'destructive',
              onPress: () => void finishSignOut(true),
            },
          ],
        );
        return;
      }
      Alert.alert('Could not sign out', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  const progress = useMemo(
    () => summary?.dueDate ? getPregnancyProgress(summary.dueDate) : null,
    [summary?.dueDate],
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.rose} /></View>;
  }
  if (loadError && !summary) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Janani could not load your family</Text>
        <Text style={styles.errorText}>Check your connection. Your saved information has not been removed.</Text>
        <Pressable onPress={() => { setLoading(true); void load(); }} style={styles.retryButton}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>{summary?.familyName.toUpperCase()}</Text>
            <Text style={styles.title}>{summary?.role === 'mother' ? 'How are you feeling today?' : 'A little care goes a long way.'}</Text>
          </View>
          <View style={styles.topActions}>
            <Pressable accessibilityLabel="Settings" onPress={() => router.push('/settings')} style={styles.iconButton}>
              <Ionicons name="settings-outline" size={21} color={colors.muted} />
            </Pressable>
            <Pressable accessibilityLabel="Sign out" onPress={() => void finishSignOut()} style={styles.iconButton}>
              <Ionicons name="log-out-outline" size={22} color={colors.muted} />
            </Pressable>
          </View>
        </View>
        <View style={styles.heroCard}>
          <Ionicons name="heart-circle" size={52} color={colors.rose} />
          <View style={styles.flex}>
            <Text style={styles.cardEyebrow}>TODAY WITH JANANI</Text>
            {progress
              ? <>
                  <Text style={styles.week}>Week {progress.gestationalWeek}</Text>
                  <Text style={styles.cardTitle}>{trimesterLabel(progress.trimester)} · day {progress.gestationalDay}</Text>
                  <Text style={styles.cardMeta}>
                    {progress.isPastDue
                      ? 'Your due date has arrived. Keep in touch with your maternity care team.'
                      : `${progress.daysRemaining} days until the estimated due date`}
                  </Text>
                </>
              : <Text style={styles.cardTitle}>Drink a glass of water and take one quiet minute for yourself.</Text>}
          </View>
        </View>
        {summary?.inviteCode
          ? <View style={styles.inviteCard}>
              <Text style={styles.inviteLabel}>Partner invite code</Text>
              <Text selectable style={styles.inviteCode}>{summary.inviteCode}</Text>
              <Text style={styles.inviteHelp}>Share this privately with your partner. It links both of you to the same family space.</Text>
            </View>
          : null}
        <View style={styles.grid}>
          <Feature icon="alarm-outline" title="Reminders" caption="Medicines and care" onPress={() => router.push('/reminders')} />
          <Feature icon="book-outline" title="Journal" caption="Keep every memory" onPress={() => router.push('/journal')} />
          <Feature icon="nutrition-outline" title="Food guide" caption="Coming soon" />
          <Feature icon="heart-outline" title="Thinking of you" caption="Send partner warmth" onPress={() => router.push('/thinking-of-you')} />
          <Feature icon="shield-checkmark-outline" title="Safety & privacy" caption="Know your choices" onPress={() => router.push('/safety-privacy')} />
          <Feature icon="settings-outline" title="Settings" caption="Export and account" onPress={() => router.push('/settings')} />
        </View>
        <Text style={styles.disclaimer}>Janani supports daily care and does not replace advice from your doctor.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Feature({ icon, title, caption, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  caption: string;
  onPress?: () => void;
}) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={[styles.feature, !onPress && styles.featureDisabled]}>
      <View style={styles.featureIcon}><Ionicons name={icon} size={24} color={colors.rose} /></View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureCaption}>{caption}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},
  center:{flex:1,alignItems:'center',justifyContent:'center',gap:spacing.md,padding:spacing.xl,backgroundColor:colors.background},
  content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.xl},
  topRow:{flexDirection:'row',justifyContent:'space-between',gap:spacing.md,alignItems:'flex-start'},
  topActions:{flexDirection:'row',gap:spacing.sm},
  flex:{flex:1},
  eyebrow:{fontSize:12,letterSpacing:2.2,fontWeight:'800',color:colors.rose},
  title:{marginTop:spacing.sm,maxWidth:290,fontSize:30,lineHeight:37,fontWeight:'800',color:colors.ink},
  iconButton:{width:44,height:44,borderRadius:radius.pill,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.border},
  heroCard:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},
  cardEyebrow:{fontSize:11,letterSpacing:1.8,fontWeight:'800',color:colors.roseDark},
  week:{marginTop:spacing.sm,fontSize:30,fontWeight:'900',color:colors.ink},
  cardTitle:{marginTop:4,fontSize:17,lineHeight:24,fontWeight:'700',color:colors.ink},
  cardMeta:{marginTop:spacing.md,fontSize:13,lineHeight:19,color:colors.muted},
  inviteCard:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},
  inviteLabel:{fontSize:13,fontWeight:'700',color:colors.muted},
  inviteCode:{marginVertical:spacing.sm,fontSize:25,letterSpacing:2.5,fontWeight:'900',color:colors.roseDark},
  inviteHelp:{fontSize:13,lineHeight:19,color:colors.muted},
  grid:{flexDirection:'row',flexWrap:'wrap',gap:spacing.md},
  feature:{width:'47.5%',minHeight:145,padding:spacing.md,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},
  featureDisabled:{opacity:0.65},
  featureIcon:{width:44,height:44,borderRadius:radius.md,alignItems:'center',justifyContent:'center',backgroundColor:colors.blush},
  featureTitle:{marginTop:spacing.md,fontSize:16,fontWeight:'800',color:colors.ink},
  featureCaption:{marginTop:spacing.xs,fontSize:13,color:colors.muted},
  disclaimer:{textAlign:'center',fontSize:12,lineHeight:18,color:colors.muted},
  errorTitle:{textAlign:'center',fontSize:20,fontWeight:'800',color:colors.ink},
  errorText:{maxWidth:340,textAlign:'center',fontSize:14,lineHeight:21,color:colors.muted},
  retryButton:{minWidth:130,minHeight:50,alignItems:'center',justifyContent:'center',borderRadius:radius.pill,backgroundColor:colors.rose},
  retryText:{fontWeight:'800',color:colors.surface},
});
