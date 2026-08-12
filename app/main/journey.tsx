import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JananiPageHeader } from '@/components/navigation/JananiPageHeader';
import { JANANI_COPY } from '@/features/tone/toneSystem';
import { guideForTrimester, journeyWeekLine } from '@/features/pregnancy/guideContent';
import { getPregnancyProgress, trimesterLabel } from '@/features/pregnancy/progress';
import { readCache, writeCache } from '@/lib/cache';
import { supabase } from '@/lib/supabase';
import { useMembership } from '@/providers/AuthGate';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

type JourneySummary = {
  role: 'mother' | 'partner';
  familyName: string;
  dueDate: string | null;
};

type JourneyEntry = {
  id: string;
  author_id: string;
  title: string | null;
  body: string;
  mood: number | null;
  entry_date: string;
  is_shared_with_partner: boolean;
};

type JourneyCache = {
  summary: JourneySummary;
  entries: JourneyEntry[];
};

const CACHE_KEY = 'journey-overview-v1';
const moodEmoji: Record<number, string> = { 1: '😞', 2: '😕', 3: '😌', 4: '🙂', 5: '🥰' };

function formatEntryDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function JourneyScreen() {
  const { session } = useAuth();
  const { markMembership, onFamilyInvalidation } = useMembership();
  const userId = session?.user.id;
  const [summary, setSummary] = useState<JourneySummary | null>(null);
  const [entries, setEntries] = useState<JourneyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const loadRevision = useRef(0);

  useEffect(() => {
    loadRevision.current += 1;
    setSummary(null);
    setEntries([]);
    setOffline(false);
    setLoadError(false);
    setLoading(Boolean(userId));
  }, [userId]);

  const load = useCallback(async () => {
    if (!userId) return;
    const revision = ++loadRevision.current;
    setLoadError(false);

    const cached = await readCache<JourneyCache>(userId, CACHE_KEY);
    if (revision !== loadRevision.current) return;
    if (cached) {
      setSummary(cached.summary);
      setEntries(cached.entries);
      setLoading(false);
    }

    const membership = await supabase
      .from('family_members')
      .select('role,family_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (revision !== loadRevision.current) return;
    if (membership.error) {
      setOffline(Boolean(cached));
      setLoadError(!cached);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (!membership.data) {
      await markMembership(false);
      router.replace('/onboarding');
      return;
    }

    const [family, journal] = await Promise.all([
      supabase
        .from('families')
        .select('name,pregnancies(due_date,status)')
        .eq('id', membership.data.family_id)
        .maybeSingle(),
      supabase
        .from('journal_entries')
        .select('id,author_id,title,body,mood,entry_date,is_shared_with_partner')
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(3),
    ]);

    if (revision !== loadRevision.current) return;
    if (family.error || !family.data || journal.error) {
      setOffline(Boolean(cached));
      setLoadError(!cached);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const familyData = family.data as unknown as {
      name: string;
      pregnancies: { due_date: string; status: string }[] | { due_date: string; status: string } | null;
    };
    const pregnancies = Array.isArray(familyData.pregnancies)
      ? familyData.pregnancies
      : familyData.pregnancies
        ? [familyData.pregnancies]
        : [];
    const pregnancy = pregnancies.find((item) => item.status === 'active') ?? pregnancies[0];
    const nextSummary: JourneySummary = {
      role: membership.data.role as JourneySummary['role'],
      familyName: familyData.name ?? 'Our little family',
      dueDate: pregnancy?.due_date ?? null,
    };
    const nextEntries = (journal.data ?? []) as JourneyEntry[];

    setSummary(nextSummary);
    setEntries(nextEntries);
    setOffline(false);
    setLoading(false);
    setRefreshing(false);
    await writeCache<JourneyCache>(userId, CACHE_KEY, { summary: nextSummary, entries: nextEntries });
  }, [markMembership, userId]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  useEffect(() => {
    const stopInvalidations = onFamilyInvalidation(
      ['families', 'pregnancies', 'journal_entries'],
      () => void load(),
    );
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void load();
    });
    return () => {
      stopInvalidations();
      appState.remove();
    };
  }, [load, onFamilyInvalidation]);

  const progress = useMemo(
    () => summary?.dueDate ? getPregnancyProgress(summary.dueDate) : null,
    [summary?.dueDate],
  );
  const currentGuide = progress ? guideForTrimester(progress.trimester) : null;
  const isMother = summary?.role === 'mother';

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.rose} /></View>;
  }

  if (loadError && !summary) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Your Journey could not load</Text>
        <Text style={styles.errorText}>Check your connection. Your pregnancy and journal information has not been removed.</Text>
        <Pressable onPress={() => { setLoading(true); void load(); }} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); void load(); }}
          />
        )}
      >
        <JananiPageHeader
          eyebrow="YOUR JOURNEY"
          title={isMother ? JANANI_COPY.journey.motherTitle : JANANI_COPY.journey.partnerTitle}
          subtitle={isMother ? JANANI_COPY.journey.motherSubtitle : JANANI_COPY.journey.partnerSubtitle}
        />

        {offline ? (
          <View style={styles.offlineCard}>
            <Ionicons name="cloud-offline-outline" size={18} color={colors.roseDark} />
            <Text style={styles.offlineText}>Showing the most recent Journey saved on this device.</Text>
          </View>
        ) : null}

        <View style={styles.weekCard}>
          <View style={styles.weekTop}>
            <View style={styles.weekIcon}>
              <Ionicons name="heart" size={27} color={colors.rose} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.cardEyebrow}>RIGHT NOW</Text>
              {progress ? (
                <>
                  <Text style={styles.weekTitle}>{journeyWeekLine(progress.gestationalWeek, progress.gestationalDay)}</Text>
                  <Text style={styles.weekMeta}>{trimesterLabel(progress.trimester)}</Text>
                </>
              ) : (
                <Text style={styles.weekTitle}>Your pregnancy week will appear here.</Text>
              )}
            </View>
          </View>
          {progress ? (
            <Text style={styles.weekBody}>
              {progress.isPastDue
                ? 'Your estimated due date has arrived. Keep following the plan from your maternity care team.'
                : `${progress.daysRemaining} days remain until the estimated due date. Janani will keep this page focused on the stage you are in now.`}
            </Text>
          ) : (
            <Text style={styles.weekBody}>Add or update your pregnancy dates so Janani can keep Journey in step with you.</Text>
          )}
        </View>

        {currentGuide ? (
          <View style={styles.stageCard}>
            <View style={styles.sectionHeadingRow}>
              <View style={styles.stageIcon}>
                <Ionicons name={currentGuide.icon} size={23} color={colors.roseDark} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.cardEyebrow}>THIS STAGE</Text>
                <Text style={styles.cardTitle}>{currentGuide.title}</Text>
                <Text style={styles.cardMeta}>{currentGuide.weeks}</Text>
              </View>
            </View>
            {currentGuide.points.slice(0, 2).map((point) => (
              <View key={point} style={styles.pointRow}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.sage} />
                <Text style={styles.pointText}>{point}</Text>
              </View>
            ))}
            <Pressable onPress={() => router.push('/pregnancy-guide')} style={styles.textButton}>
              <Text style={styles.textButtonText}>See the full trimester guide</Text>
              <Ionicons name="arrow-forward" size={17} color={colors.roseDark} />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.sectionHeadingRow}>
          <View style={styles.flex}>
            <Text style={styles.sectionTitle}>Memories</Text>
            <Text style={styles.sectionText}>A feeling, a visit, a small win—keep only what matters to you.</Text>
          </View>
          <Pressable accessibilityLabel="Add a journal memory" onPress={() => router.push('/journal/new')} style={styles.addButton}>
            <Ionicons name="add" size={22} color={colors.surface} />
          </Pressable>
        </View>

        {entries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="book-outline" size={34} color={colors.sage} />
            <Text style={styles.emptyTitle}>Your first memory can be tiny</Text>
            <Text style={styles.emptyText}>Write one sentence about today. It can stay private unless you choose to share it with your partner.</Text>
            <Pressable onPress={() => router.push('/journal/new')} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Write a memory</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.timeline}>
            {entries.map((entry, index) => {
              const mine = entry.author_id === userId;
              return (
                <Pressable key={entry.id} onPress={() => router.push('/journal')} style={({ pressed }) => [styles.memoryRow, pressed && styles.pressed]}>
                  <View style={styles.timelineRail}>
                    <View style={styles.timelineDot} />
                    {index < entries.length - 1 ? <View style={styles.timelineLine} /> : null}
                  </View>
                  <View style={styles.memoryCard}>
                    <View style={styles.memoryTop}>
                      <Text style={styles.memoryDate}>{formatEntryDate(entry.entry_date)}</Text>
                      <Text style={styles.memoryMood}>{entry.mood ? moodEmoji[entry.mood] : '🫶'}</Text>
                    </View>
                    <Text numberOfLines={1} style={styles.memoryTitle}>{entry.title || (mine ? 'Your memory' : 'A shared memory')}</Text>
                    <Text numberOfLines={2} style={styles.memoryBody}>{entry.body}</Text>
                    <View style={styles.memoryPrivacy}>
                      <Ionicons
                        name={mine && !entry.is_shared_with_partner ? 'lock-closed-outline' : 'people-outline'}
                        size={13}
                        color={colors.roseDark}
                      />
                      <Text style={styles.memoryPrivacyText}>
                        {mine
                          ? entry.is_shared_with_partner ? 'Shared with partner' : 'Private to you'
                          : 'Shared with you'}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {entries.length > 0 ? (
          <Pressable onPress={() => router.push('/journal')} style={styles.secondaryButton}>
            <Ionicons name="book-outline" size={18} color={colors.roseDark} />
            <Text style={styles.secondaryButtonText}>Open the full journal</Text>
          </Pressable>
        ) : null}

        <Text style={styles.disclaimer}>Journey keeps supportive pregnancy information and memories together. Medical care still belongs with your maternity team.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  flex: { flex: 1 },
  pressed: { opacity: 0.8 },
  offlineCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.blush },
  offlineText: { flex: 1, fontSize: 12, lineHeight: 18, color: colors.roseDark },
  weekCard: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.blush, borderWidth: 1, borderColor: colors.border },
  weekTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  weekIcon: { width: 50, height: 50, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  cardEyebrow: { fontSize: 11, letterSpacing: 1.5, fontWeight: '800', color: colors.roseDark },
  weekTitle: { marginTop: 3, fontSize: 25, lineHeight: 31, fontWeight: '900', color: colors.ink },
  weekMeta: { marginTop: 3, fontSize: 13, fontWeight: '800', color: colors.roseDark },
  weekBody: { fontSize: 14, lineHeight: 21, color: colors.muted },
  stageCard: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stageIcon: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sageSoft },
  cardTitle: { marginTop: 2, fontSize: 18, fontWeight: '900', color: colors.ink },
  cardMeta: { marginTop: 3, fontSize: 12, color: colors.muted },
  pointRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  pointText: { flex: 1, fontSize: 14, lineHeight: 21, color: colors.muted },
  textButton: { alignSelf: 'flex-start', minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  textButtonText: { fontSize: 13, fontWeight: '800', color: colors.roseDark },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: colors.ink },
  sectionText: { marginTop: 3, fontSize: 13, lineHeight: 19, color: colors.muted },
  addButton: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.rose },
  emptyCard: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  emptyTitle: { marginTop: spacing.xs, fontSize: 19, fontWeight: '900', color: colors.ink },
  emptyText: { textAlign: 'center', fontSize: 14, lineHeight: 21, color: colors.muted },
  primaryButton: { minHeight: 48, marginTop: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.rose },
  primaryButtonText: { fontSize: 14, fontWeight: '800', color: colors.surface },
  timeline: { gap: 0 },
  memoryRow: { flexDirection: 'row', gap: spacing.md },
  timelineRail: { width: 18, alignItems: 'center' },
  timelineDot: { width: 12, height: 12, marginTop: 22, borderRadius: radius.pill, backgroundColor: colors.rose },
  timelineLine: { flex: 1, width: 2, minHeight: 86, backgroundColor: colors.border },
  memoryCard: { flex: 1, marginBottom: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  memoryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  memoryDate: { fontSize: 11, fontWeight: '800', color: colors.muted },
  memoryMood: { fontSize: 21 },
  memoryTitle: { marginTop: spacing.sm, fontSize: 16, fontWeight: '900', color: colors.ink },
  memoryBody: { marginTop: spacing.xs, fontSize: 13, lineHeight: 19, color: colors.muted },
  memoryPrivacy: { marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 5 },
  memoryPrivacyText: { fontSize: 11, fontWeight: '700', color: colors.roseDark },
  secondaryButton: { minHeight: 48, paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  secondaryButtonText: { fontSize: 14, fontWeight: '800', color: colors.roseDark },
  errorTitle: { fontSize: 18, fontWeight: '900', color: colors.ink },
  errorText: { textAlign: 'center', fontSize: 14, lineHeight: 21, color: colors.muted },
  disclaimer: { textAlign: 'center', fontSize: 12, lineHeight: 18, color: colors.muted },
});
