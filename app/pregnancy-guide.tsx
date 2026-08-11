import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { resolveActivePregnancy } from '@/features/pregnancy/activePregnancy';
import { getPregnancyProgress, trimesterLabel } from '@/features/pregnancy/progress';
import {
  PREGNANCY_CONTENT_SAFETY_NOTE,
  getPregnancyWeekContent,
  normalizePregnancyContentWeek,
} from '@/features/pregnancy/weekContent';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

type GuideSection = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: string[];
  tone?: 'default' | 'soft' | 'warning';
};

export default function PregnancyGuideScreen() {
  const { session } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [currentWeek, setCurrentWeek] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const userId = session?.user.id;
    if (!userId) {
      setLoading(false);
      return () => { active = false; };
    }

    void resolveActivePregnancy(userId)
      .then((pregnancy) => {
        if (!active || !pregnancy?.dueDate) return;
        const progress = getPregnancyProgress(pregnancy.dueDate);
        const contentWeek = normalizePregnancyContentWeek(progress.gestationalWeek);
        setCurrentWeek(contentWeek);
        setSelectedWeek(contentWeek);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [session?.user.id]);

  const content = useMemo(() => getPregnancyWeekContent(selectedWeek), [selectedWeek]);
  const sections = useMemo<GuideSection[]>(() => [
    { title: 'Baby development', icon: 'heart-circle-outline', items: content.babyDevelopment, tone: 'soft' },
    { title: 'Changes you may notice', icon: 'body-outline', items: content.motherChanges },
    { title: 'Common experiences', icon: 'sparkles-outline', items: content.commonExperiences },
    { title: 'Nutrition focus', icon: 'nutrition-outline', items: content.nutritionFocus, tone: 'soft' },
    { title: 'Hydration', icon: 'water-outline', items: content.hydration },
    { title: 'Movement and rest', icon: 'walk-outline', items: content.movementAndRestGuidance },
    { title: 'Emotional wellbeing', icon: 'happy-outline', items: content.emotionalWellbeing, tone: 'soft' },
    { title: 'Partner guidance', icon: 'people-outline', items: content.partnerGuidance },
    { title: 'Things to prepare', icon: 'checkmark-done-outline', items: content.thingsToPrepare },
    { title: 'Tests and appointments that may be coming up', icon: 'calendar-outline', items: content.commonUpcomingTestsAndAppointments },
    { title: 'Questions you could ask your clinician', icon: 'chatbubbles-outline', items: content.suggestedClinicianQuestions, tone: 'soft' },
    { title: 'Warning signs: get medical help', icon: 'warning-outline', items: content.educationalWarningSigns, tone: 'warning' },
  ], [content]);

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>MY PREGNANCY</Text>
            <Text style={styles.title}>Week-by-week guide</Text>
            <Text style={styles.subtitle}>Explore supportive education for weeks 1–40.</Text>
          </View>
        </View>

        <View style={styles.weekCard}>
          <View style={styles.weekTopRow}>
            <Pressable
              accessibilityLabel="Previous pregnancy week"
              disabled={selectedWeek === 1}
              onPress={() => setSelectedWeek((week) => Math.max(1, week - 1))}
              style={[styles.weekButton, selectedWeek === 1 && styles.weekButtonDisabled]}
            >
              <Ionicons name="chevron-back" size={22} color={colors.roseDark} />
            </Pressable>
            <View style={styles.weekHeading}>
              <Text style={styles.week}>Week {content.gestationalWeek}</Text>
              <Text style={styles.trimester}>{trimesterLabel(content.trimester)}</Text>
            </View>
            <Pressable
              accessibilityLabel="Next pregnancy week"
              disabled={selectedWeek === 40}
              onPress={() => setSelectedWeek((week) => Math.min(40, week + 1))}
              style={[styles.weekButton, selectedWeek === 40 && styles.weekButtonDisabled]}
            >
              <Ionicons name="chevron-forward" size={22} color={colors.roseDark} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.currentRow}>
              <ActivityIndicator size="small" color={colors.rose} />
              <Text style={styles.currentText}>Finding your current week…</Text>
            </View>
          ) : currentWeek ? (
            <Pressable
              accessibilityRole="button"
              disabled={selectedWeek === currentWeek}
              onPress={() => setSelectedWeek(currentWeek)}
              style={styles.currentPill}
            >
              <Ionicons name="locate-outline" size={16} color={colors.roseDark} />
              <Text style={styles.currentPillText}>
                {selectedWeek === currentWeek ? 'Your current week' : `Return to your current week: ${currentWeek}`}
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.currentText}>No active due date is available, so you can browse every week manually.</Text>
          )}
        </View>

        <View style={styles.dailyCard}>
          <Text style={styles.dailyLabel}>A GENTLE MESSAGE FOR THIS WEEK</Text>
          <Text style={styles.dailyMessage}>{content.dailyGentleMessage}</Text>
        </View>

        {sections.map((section) => (
          <GuideCard key={section.title} {...section} />
        ))}

        <View style={styles.widgetPreview}>
          <Text style={styles.widgetTitle}>This week on your widgets</Text>
          <View style={styles.widgetMessageRow}>
            <Text style={styles.widgetEmoji}>👶</Text>
            <Text style={styles.widgetText}>{content.widgetBabyMessage}</Text>
          </View>
          <View style={styles.widgetMessageRow}>
            <Text style={styles.widgetEmoji}>🌿</Text>
            <Text style={styles.widgetText}>{content.widgetWellnessMessage}</Text>
          </View>
        </View>

        <Pressable onPress={() => router.push('/reminders')} style={styles.primaryButton}>
          <Ionicons name="alarm-outline" size={19} color={colors.surface} />
          <Text style={styles.primaryButtonText}>Open my reminders</Text>
        </Pressable>
        <Text style={styles.disclaimer}>{PREGNANCY_CONTENT_SAFETY_NOTE}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function GuideCard({ title, icon, items, tone = 'default' }: GuideSection) {
  return (
    <View style={[
      styles.card,
      tone === 'soft' && styles.cardSoft,
      tone === 'warning' && styles.cardWarning,
    ]}>
      <View style={styles.cardTop}>
        <View style={[styles.iconWrap, tone === 'warning' && styles.warningIconWrap]}>
          <Ionicons name={icon} size={23} color={tone === 'warning' ? colors.danger : colors.rose} />
        </View>
        <Text style={[styles.cardTitle, tone === 'warning' && styles.warningTitle]}>{title}</Text>
      </View>
      {items.map((item) => (
        <View key={item} style={styles.pointRow}>
          <Ionicons
            name={tone === 'warning' ? 'alert-circle-outline' : 'checkmark-circle-outline'}
            size={18}
            color={tone === 'warning' ? colors.danger : colors.sage}
          />
          <Text style={styles.pointText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  header: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', marginBottom: spacing.sm },
  headerCopy: { flex: 1 },
  backButton: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  eyebrow: { fontSize: 12, letterSpacing: 1.8, fontWeight: '800', color: colors.rose },
  title: { marginTop: spacing.xs, fontSize: 30, lineHeight: 36, fontWeight: '900', color: colors.ink },
  subtitle: { marginTop: spacing.xs, fontSize: 14, lineHeight: 20, color: colors.muted },
  weekCard: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  weekTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  weekButton: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blush },
  weekButtonDisabled: { opacity: 0.35 },
  weekHeading: { flex: 1, alignItems: 'center' },
  week: { fontSize: 30, fontWeight: '900', color: colors.ink },
  trimester: { marginTop: 2, fontSize: 13, fontWeight: '800', color: colors.roseDark },
  currentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  currentText: { textAlign: 'center', fontSize: 12, lineHeight: 18, color: colors.muted },
  currentPill: { minHeight: 38, paddingHorizontal: spacing.md, borderRadius: radius.pill, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.sageSoft },
  currentPillText: { fontSize: 12, fontWeight: '800', color: colors.roseDark },
  dailyCard: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.blush, borderWidth: 1, borderColor: colors.border },
  dailyLabel: { fontSize: 11, letterSpacing: 1.4, fontWeight: '900', color: colors.roseDark },
  dailyMessage: { fontSize: 18, lineHeight: 26, fontWeight: '800', color: colors.ink },
  card: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  cardSoft: { backgroundColor: colors.sageSoft },
  cardWarning: { backgroundColor: '#FFF2F1', borderColor: '#F0C8C4' },
  cardTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  iconWrap: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blush },
  warningIconWrap: { backgroundColor: '#FBE0DD' },
  cardTitle: { flex: 1, fontSize: 18, lineHeight: 24, fontWeight: '900', color: colors.ink },
  warningTitle: { color: colors.danger },
  pointRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  pointText: { flex: 1, fontSize: 14, lineHeight: 21, color: colors.muted },
  widgetPreview: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  widgetTitle: { fontSize: 17, fontWeight: '900', color: colors.ink },
  widgetMessageRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  widgetEmoji: { fontSize: 20 },
  widgetText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.muted },
  primaryButton: { minHeight: 52, paddingHorizontal: spacing.lg, borderRadius: radius.pill, backgroundColor: colors.rose, flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontSize: 15, fontWeight: '800', color: colors.surface },
  disclaimer: { marginTop: spacing.sm, textAlign: 'center', fontSize: 12, lineHeight: 18, color: colors.muted },
});
