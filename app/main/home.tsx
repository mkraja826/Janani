import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JananiPageHeader } from '@/components/navigation/JananiPageHeader';
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

const CACHE_KEY = 'home-summary-v1';

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

    if (family.error || !family.data || inviteCodeResult.error) {
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
    <SafeAreaView style={styles.page} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <JananiPageHeader
          eyebrow={summary?.familyName.toUpperCase()}
          title={summary?.role === 'mother' ? 'How are you feeling today?' : 'A little care goes a long way.'}
          subtitle={summary?.role === 'mother'
            ? 'Janani will keep the important things close and do the complicated work quietly in the background.'
            : 'Stay close to the pregnancy journey without making the mother manage another complicated app.'}
        />

        <Pressable onPress={() => router.push('/pregnancy-guide')} style={({ pressed }) => [styles.heroCard, pressed && styles.pressed]}>
          <View style={styles.heroIcon}>
            <Ionicons name="heart-circle" size={38} color={colors.rose} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.cardEyebrow}>TODAY WITH JANANI</Text>
            {progress ? (
              <>
                <Text style={styles.week}>Week {progress.gestationalWeek}</Text>
                <Text style={styles.cardTitle}>{trimesterLabel(progress.trimester)} · day {progress.gestationalDay}</Text>
                <Text style={styles.cardMeta}>
                  {progress.isPastDue
                    ? 'Your due date has arrived. Keep in touch with your maternity care team.'
                    : `${progress.daysRemaining} days until the estimated due date`}
                </Text>
              </>
            ) : (
              <Text style={styles.cardTitle}>Your pregnancy progress will appear here.</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.roseDark} />
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today</Text>
          <Text style={styles.sectionCaption}>Only the things you are most likely to need right now.</Text>
        </View>

        <Pressable onPress={() => router.push('/reminders')} style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}>
          <View style={styles.actionIcon}><Ionicons name="alarm-outline" size={23} color={colors.roseDark} /></View>
          <View style={styles.flex}>
            <Text style={styles.actionTitle}>Medicines & reminders</Text>
            <Text style={styles.actionCaption}>See today’s medicine and care schedule.</Text>
          </View>
          <Ionicons name="chevron-forward" size={19} color={colors.muted} />
        </Pressable>

        <Pressable onPress={() => router.push('/main/ask')} style={({ pressed }) => [styles.askCard, pressed && styles.pressed]}>
          <View style={styles.actionIcon}><Ionicons name="sparkles-outline" size={23} color={colors.roseDark} /></View>
          <View style={styles.flex}>
            <Text style={styles.actionTitle}>Ask Janani</Text>
            <Text style={styles.actionCaption}>Ask a pregnancy or maternal-wellness question.</Text>
          </View>
          <Ionicons name="arrow-forward" size={19} color={colors.roseDark} />
        </Pressable>

        {summary?.inviteCode ? (
          <View style={styles.inviteCard}>
            <View style={styles.inviteHeader}>
              <Ionicons name="people-outline" size={22} color={colors.roseDark} />
              <Text style={styles.inviteLabel}>Invite your partner</Text>
            </View>
            <Text selectable style={styles.inviteCode}>{summary.inviteCode}</Text>
            <Text style={styles.inviteHelp}>Share this code privately. Your partner gets a separate support-focused Janani experience.</Text>
          </View>
        ) : (
          <Pressable onPress={() => router.push('/thinking-of-you')} style={({ pressed }) => [styles.partnerCard, pressed && styles.pressed]}>
            <Ionicons name="heart-outline" size={22} color={colors.roseDark} />
            <View style={styles.flex}>
              <Text style={styles.actionTitle}>Thinking of you</Text>
              <Text style={styles.actionCaption}>Send a little warmth to your partner.</Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={colors.muted} />
          </Pressable>
        )}

        <Text style={styles.disclaimer}>Janani supports daily care and does not replace advice from your doctor.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  flex: { flex: 1 },
  pressed: { opacity: 0.82 },
  heroCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.blush, borderWidth: 1, borderColor: colors.border },
  heroIcon: { width: 54, height: 54, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  cardEyebrow: { fontSize: 11, letterSpacing: 1.7, fontWeight: '800', color: colors.roseDark },
  week: { marginTop: spacing.xs, fontSize: 28, fontWeight: '900', color: colors.ink },
  cardTitle: { marginTop: 3, fontSize: 15, lineHeight: 21, fontWeight: '700', color: colors.ink },
  cardMeta: { marginTop: spacing.sm, fontSize: 12, lineHeight: 18, color: colors.muted },
  sectionHeader: { gap: 3, marginTop: spacing.xs },
  sectionTitle: { fontSize: 19, fontWeight: '900', color: colors.ink },
  sectionCaption: { fontSize: 13, lineHeight: 19, color: colors.muted },
  actionCard: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  askCard: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.sageSoft, borderWidth: 1, borderColor: colors.border },
  actionIcon: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blush },
  actionTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  actionCaption: { marginTop: 3, fontSize: 12, lineHeight: 18, color: colors.muted },
  inviteCard: { padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  inviteHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inviteLabel: { fontSize: 15, fontWeight: '800', color: colors.ink },
  inviteCode: { marginVertical: spacing.sm, fontSize: 24, letterSpacing: 2.3, fontWeight: '900', color: colors.roseDark },
  inviteHelp: { fontSize: 13, lineHeight: 19, color: colors.muted },
  partnerCard: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  disclaimer: { textAlign: 'center', fontSize: 12, lineHeight: 18, color: colors.muted },
  errorTitle: { textAlign: 'center', fontSize: 20, fontWeight: '800', color: colors.ink },
  errorText: { maxWidth: 340, textAlign: 'center', fontSize: 14, lineHeight: 21, color: colors.muted },
  retryButton: { minWidth: 130, minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.rose },
  retryText: { fontWeight: '800', color: colors.surface },
});
