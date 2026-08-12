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
import {
  buildDailyCareSnapshot,
  type DailyReminder,
  type DailyReminderLog,
  greetingForNow,
  priorityTimingLabel,
} from '@/features/home/dailySnapshot';
import {
  getCurrentDailyPersonalization,
  parseDailyPersonalization,
  type DailyPersonalization,
} from '@/features/home/dailyPersonalization';
import { cacheActivePregnancyId } from '@/features/pregnancy/activePregnancy';
import { getPregnancyProgress, trimesterLabel } from '@/features/pregnancy/progress';
import { readCache, writeCache } from '@/lib/cache';
import { toLocalDate } from '@/lib/date';
import { supabase } from '@/lib/supabase';
import { useMembership } from '@/providers/AuthGate';
import { useAuth } from '@/providers/AuthProvider';
import { subscribeToUserInvalidations } from '@/features/user/userInvalidation';
import { colors, radius, spacing } from '@/theme/tokens';

type FamilySummary = {
  role: 'mother' | 'partner';
  familyName: string;
  dueDate: string | null;
};

type HomeReminder = DailyReminder & {
  start_date: string;
  end_date: string | null;
  days_of_week: number[];
};

type HomeReminderLog = DailyReminderLog & {
  scheduled_for: string;
};

type HomeCache = {
  date: string;
  summary: FamilySummary;
  reminders: HomeReminder[];
  logs: HomeReminderLog[];
  personalization?: DailyPersonalization | null;
};

const CACHE_KEY = 'home-daily-v2';

function reminderIcon(kind: HomeReminder['kind']) {
  if (kind === 'medication') return 'medical-outline' as const;
  if (kind === 'hydration') return 'water-outline' as const;
  if (kind === 'nutrition') return 'nutrition-outline' as const;
  if (kind === 'appointment') return 'calendar-outline' as const;
  return 'alarm-outline' as const;
}

function personalizationPresentation(item: DailyPersonalization) {
  switch (item.actionType) {
    case 'review_report':
      return {
        icon: 'document-text-outline' as const,
        title: 'Your report is ready for your eyes',
        body: `${item.pendingReportReviewCount} value${item.pendingReportReviewCount === 1 ? '' : 's'} Janani read ${item.pendingReportReviewCount === 1 ? 'is' : 'are'} waiting for you to confirm.`,
        route: '/main/reports' as const,
      };
    case 'upcoming_appointment': {
      const scheduledAt = typeof item.actionMeta.scheduledAt === 'string'
        ? new Date(item.actionMeta.scheduledAt)
        : null;
      const timing = scheduledAt && !Number.isNaN(scheduledAt.getTime())
        ? scheduledAt.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
        : 'soon';
      return {
        icon: 'calendar-outline' as const,
        title: 'Your next appointment is coming up',
        body: `It is scheduled for ${timing}. Keep anything you want to ask your care team close by.`,
        route: '/main/health' as const,
      };
    }
    case 'complete_health_profile':
      return {
        icon: 'heart-outline' as const,
        title: 'Help Janani understand you a little better',
        body: 'A few everyday details are still missing. Adding them makes future suggestions more relevant without changing your medical care.',
        route: '/edit-health-profile' as const,
      };
    case 'ask_food_ideas':
      return {
        icon: 'nutrition-outline' as const,
        title: 'Your food preferences are ready to use',
        body: 'Ask Janani for simple meal ideas that fit the preferences and allergies you saved.',
        route: '/main/ask' as const,
      };
    default:
      return {
        icon: 'leaf-outline' as const,
        title: 'See what this week brings',
        body: 'Your current pregnancy week is ready in Journey whenever you want it.',
        route: '/main/journey' as const,
      };
  }
}

export default function HomeScreen() {
  const { session } = useAuth();
  const { markMembership, onFamilyInvalidation } = useMembership();
  const [summary, setSummary] = useState<FamilySummary | null>(null);
  const [reminders, setReminders] = useState<HomeReminder[]>([]);
  const [logs, setLogs] = useState<HomeReminderLog[]>([]);
  const [personalization, setPersonalization] = useState<DailyPersonalization | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [offline, setOffline] = useState(false);
  const loadRevision = useRef(0);
  const userId = session?.user.id;

  useEffect(() => {
    loadRevision.current += 1;
    setSummary(null);
    setReminders([]);
    setLogs([]);
    setPersonalization(null);
    setLoadError(false);
    setOffline(false);
    setLoading(Boolean(userId));
  }, [userId]);

  const load = useCallback(async () => {
    if (!userId) return;
    const revision = ++loadRevision.current;
    setLoadError(false);

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const date = toLocalDate(start);

    const cached = await readCache<HomeCache>(userId, CACHE_KEY);
    if (revision !== loadRevision.current) return;
    const validCache = cached?.date === date ? cached : null;
    if (validCache) {
      setSummary(validCache.summary);
      setReminders(validCache.reminders);
      setLogs(validCache.logs);
      setPersonalization(validCache.personalization ?? null);
      setLoading(false);
    }

    const membership = await supabase
      .from('family_members')
      .select('role,family_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (revision !== loadRevision.current) return;
    if (membership.error) {
      setOffline(Boolean(validCache));
      if (!validCache) setLoadError(true);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (!membership.data) {
      await markMembership(false);
      router.replace('/onboarding');
      return;
    }

    const [family, reminderItems, reminderHistory, personalizationResult] = await Promise.all([
      supabase
        .from('families')
        .select('name,pregnancies(id,due_date,status)')
        .eq('id', membership.data.family_id)
        .maybeSingle(),
      supabase
        .from('reminders')
        .select('id,title,kind,local_time,start_date,end_date,days_of_week,is_active')
        .eq('is_active', true)
        .lte('start_date', date)
        .or(`end_date.is.null,end_date.gte.${date}`)
        .order('local_time'),
      supabase
        .from('reminder_logs')
        .select('reminder_id,scheduled_for,state')
        .gte('scheduled_for', start.toISOString())
        .lt('scheduled_for', end.toISOString()),
      membership.data.role === 'mother'
        ? getCurrentDailyPersonalization()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (revision !== loadRevision.current) return;
    if (toLocalDate(new Date()) !== date) {
      void load();
      return;
    }

    if (family.error || !family.data || reminderItems.error || reminderHistory.error) {
      setOffline(Boolean(validCache));
      if (!validCache) setLoadError(true);
      setLoading(false);
      setRefreshing(false);
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
    const nextSummary: FamilySummary = {
      role: membership.data.role as FamilySummary['role'],
      familyName: familyData.name ?? 'Our little family',
      dueDate: pregnancy?.due_date ?? null,
    };

    const weekday = start.getDay();
    const nextReminders = (reminderItems.data ?? []).filter((item) => (
      item.days_of_week.length === 0 || item.days_of_week.includes(weekday)
    )) as HomeReminder[];
    const nextLogs = (reminderHistory.data ?? []) as HomeReminderLog[];
    const nextPersonalization = membership.data.role === 'mother' && !personalizationResult.error
      ? parseDailyPersonalization(personalizationResult.data)
      : validCache?.personalization ?? null;

    setSummary(nextSummary);
    setReminders(nextReminders);
    setLogs(nextLogs);
    setPersonalization(nextPersonalization);
    setOffline(false);
    setLoading(false);
    setRefreshing(false);

    await Promise.all([
      writeCache<HomeCache>(userId, CACHE_KEY, {
        date,
        summary: nextSummary,
        reminders: nextReminders,
        logs: nextLogs,
        personalization: nextPersonalization,
      }),
      cacheActivePregnancyId(userId, activePregnancy?.id ?? null),
    ]);
  }, [markMembership, userId]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  useEffect(() => {
    const accessToken = session?.access_token;
    if (!userId || !accessToken) return undefined;
    return subscribeToUserInvalidations({
      userId,
      accessToken,
      onInvalidate: () => void load(),
      onConnectionIssue: () => undefined,
    });
  }, [load, session?.access_token, userId]);

  useEffect(() => {
    const stopInvalidations = onFamilyInvalidation(
      ['families', 'pregnancies', 'reminders', 'reminder_logs'],
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
  const care = useMemo(
    () => buildDailyCareSnapshot(reminders, logs),
    [logs, reminders],
  );
  const priority = care.priority;
  const personalizedAction = personalization ? personalizationPresentation(personalization) : null;

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.rose} /></View>;
  }

  if (loadError && !summary) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Janani could not load today</Text>
        <Text style={styles.errorText}>Check your connection. Your saved information has not been removed.</Text>
        <Pressable onPress={() => { setLoading(true); void load(); }} style={styles.retryButton}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  const greeting = greetingForNow();
  const isMother = summary?.role === 'mother';
  const priorityIcon = priority ? reminderIcon(priority.reminder.kind) : care.total === 0 ? 'leaf-outline' : 'checkmark-circle-outline';

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        )}
      >
        <JananiPageHeader
          eyebrow={summary?.familyName.toUpperCase()}
          title={`${greeting}.`}
          subtitle={isMother
            ? 'Here is what matters today. Everything else can stay quietly in the background.'
            : 'Here is the simplest way to stay close to the pregnancy today.'}
        />

        {offline ? (
          <View style={styles.offlineCard}>
            <Ionicons name="cloud-offline-outline" size={18} color={colors.roseDark} />
            <Text style={styles.offlineText}>Showing the most recent saved view of today.</Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => router.push('/pregnancy-guide')}
          style={({ pressed }) => [styles.pregnancyCard, pressed && styles.pressed]}
        >
          <View style={styles.pregnancyIcon}>
            <Ionicons name="heart-circle" size={38} color={colors.rose} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.cardEyebrow}>YOUR JOURNEY</Text>
            {progress ? (
              <>
                <Text style={styles.week}>Week {progress.gestationalWeek}</Text>
                <Text style={styles.cardTitle}>{trimesterLabel(progress.trimester)} · day {progress.gestationalDay}</Text>
                <Text style={styles.cardMeta}>
                  {progress.isPastDue
                    ? 'Your estimated due date has arrived.'
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
          <Text style={styles.sectionTitle}>What matters today</Text>
          <Text style={styles.sectionCaption}>Janani keeps the list short and puts the next care item first.</Text>
        </View>

        <Pressable
          onPress={() => router.push('/reminders')}
          style={({ pressed }) => [styles.priorityCard, pressed && styles.pressed]}
        >
          <View style={[styles.priorityIcon, priority?.timing === 'overdue' && styles.priorityIconAttention]}>
            <Ionicons
              name={priorityIcon}
              size={26}
              color={priority?.timing === 'overdue' ? colors.danger : colors.roseDark}
            />
          </View>
          <View style={styles.flex}>
            <Text style={styles.cardEyebrow}>
              {priority ? 'NEXT CARE' : care.total === 0 ? 'TODAY’S CARE' : 'CARE CHECKED'}
            </Text>
            <Text style={styles.priorityTitle}>
              {priority?.reminder.title
                ?? (care.total === 0 ? 'Nothing scheduled today' : 'Today’s reminders are reviewed')}
            </Text>
            <Text style={styles.priorityMeta}>
              {priority
                ? priorityTimingLabel(priority)
                : care.total === 0
                  ? 'Add a reminder only when you need one.'
                  : 'You have checked everything that was planned for today.'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>

        {care.total > 0 ? (
          <View style={styles.careStats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{care.total}</Text>
              <Text style={styles.statLabel}>planned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{care.taken}</Text>
              <Text style={styles.statLabel}>taken</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{care.remaining}</Text>
              <Text style={styles.statLabel}>left</Text>
            </View>
          </View>
        ) : null}

        {isMother && personalizedAction ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>For you today</Text>
              <Text style={styles.sectionCaption}>Chosen quietly from the information you already gave Janani.</Text>
            </View>
            <Pressable
              onPress={() => router.push(personalizedAction.route)}
              style={({ pressed }) => [styles.askCard, pressed && styles.pressed]}
            >
              <View style={styles.askIcon}>
                <Ionicons name={personalizedAction.icon} size={23} color={colors.roseDark} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.actionTitle}>{personalizedAction.title}</Text>
                <Text style={styles.actionCaption}>{personalizedAction.body}</Text>
              </View>
              <Ionicons name="arrow-forward" size={19} color={colors.roseDark} />
            </Pressable>
          </>
        ) : null}

        {personalization?.actionType !== 'ask_food_ideas' ? (
        <Pressable
          onPress={() => router.push('/main/ask')}
          style={({ pressed }) => [styles.askCard, pressed && styles.pressed]}
        >
          <View style={styles.askIcon}>
            <Ionicons name="sparkles-outline" size={23} color={colors.roseDark} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.actionTitle}>Something on your mind?</Text>
            <Text style={styles.actionCaption}>Ask Janani a pregnancy or maternal-wellness question.</Text>
          </View>
          <Ionicons name="arrow-forward" size={19} color={colors.roseDark} />
        </Pressable>
        ) : null}

        {!isMother ? (
          <Pressable
            onPress={() => router.push('/thinking-of-you')}
            style={({ pressed }) => [styles.partnerCard, pressed && styles.pressed]}
          >
            <Ionicons name="heart-outline" size={22} color={colors.roseDark} />
            <View style={styles.flex}>
              <Text style={styles.actionTitle}>Thinking of you</Text>
              <Text style={styles.actionCaption}>Send a little warmth without interrupting the day.</Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={colors.muted} />
          </Pressable>
        ) : null}

        <Text style={styles.disclaimer}>Janani supports daily care and does not replace advice from your doctor.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  flex: { flex: 1 },
  pressed: { opacity: 0.82 },
  offlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.blush,
  },
  offlineText: { flex: 1, fontSize: 12, lineHeight: 18, color: colors.roseDark },
  pregnancyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.blush,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pregnancyIcon: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  cardEyebrow: { fontSize: 11, letterSpacing: 1.7, fontWeight: '800', color: colors.roseDark },
  week: { marginTop: spacing.xs, fontSize: 28, fontWeight: '900', color: colors.ink },
  cardTitle: { marginTop: 3, fontSize: 15, lineHeight: 21, fontWeight: '700', color: colors.ink },
  cardMeta: { marginTop: spacing.sm, fontSize: 12, lineHeight: 18, color: colors.muted },
  sectionHeader: { gap: 3, marginTop: spacing.xs },
  sectionTitle: { fontSize: 19, fontWeight: '900', color: colors.ink },
  sectionCaption: { fontSize: 13, lineHeight: 19, color: colors.muted },
  priorityCard: {
    minHeight: 110,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priorityIcon: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sageSoft,
  },
  priorityIconAttention: { backgroundColor: colors.blush },
  priorityTitle: { marginTop: spacing.xs, fontSize: 18, lineHeight: 24, fontWeight: '900', color: colors.ink },
  priorityMeta: { marginTop: 4, fontSize: 12, lineHeight: 18, color: colors.muted },
  careStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 20, fontWeight: '900', color: colors.ink },
  statLabel: { fontSize: 11, fontWeight: '700', color: colors.muted },
  statDivider: { width: 1, height: 30, backgroundColor: colors.border },
  askCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.sageSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  askIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blush,
  },
  actionTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  actionCaption: { marginTop: 3, fontSize: 12, lineHeight: 18, color: colors.muted },
  partnerCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disclaimer: { textAlign: 'center', fontSize: 12, lineHeight: 18, color: colors.muted },
  errorTitle: { textAlign: 'center', fontSize: 20, fontWeight: '800', color: colors.ink },
  errorText: { maxWidth: 340, textAlign: 'center', fontSize: 14, lineHeight: 21, color: colors.muted },
  retryButton: {
    minWidth: 130,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.rose,
  },
  retryText: { fontWeight: '800', color: colors.surface },
});
