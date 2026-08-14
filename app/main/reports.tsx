import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JananiPageHeader } from '@/components/navigation/JananiPageHeader';
import { resolveActivePregnancyId } from '@/features/pregnancy/activePregnancy';
import { listOwnMedicalReports } from '@/features/reports/reportRpc';
import {
  parseMedicalReportList,
  reportKindLabel,
  type MedicalReportSummary,
} from '@/features/reports/reportTypes';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { colors, radius, spacing } from '@/theme/tokens';

function statusCopy(report: MedicalReportSummary): { label: string; caption: string; icon: keyof typeof Ionicons.glyphMap } {
  if (report.uploadState === 'pending') return { label: 'Upload incomplete', caption: 'Open this report to retry cleanup or remove it safely.', icon: 'cloud-offline-outline' };
  if (report.extractionStatus === 'confirmed') return { label: 'Reviewed', caption: `${report.confirmedFacts} confirmed detail${report.confirmedFacts === 1 ? '' : 's'}`, icon: 'checkmark-circle-outline' };
  if (report.proposedFacts > 0 || report.extractionStatus === 'needs_confirmation') return { label: 'Needs your review', caption: `${report.proposedFacts} proposed detail${report.proposedFacts === 1 ? '' : 's'} waiting`, icon: 'eye-outline' };
  if (report.extractionStatus === 'queued' || report.extractionStatus === 'processing') return { label: 'Reading report', caption: 'Janani will keep machine-read details untrusted until you review them.', icon: 'hourglass-outline' };
  if (report.extractionStatus === 'failed') return { label: 'Could not read automatically', caption: 'The original report is safe. You can add important values manually.', icon: 'alert-circle-outline' };
  return { label: 'Stored privately', caption: 'Add important values manually or review them when extraction is available.', icon: 'lock-closed-outline' };
}

function formatReportDate(value: string | null, fallback: string): string {
  const source = value ? `${value}T00:00:00` : fallback;
  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) return 'Date not set';
  return parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ReportsScreen() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const userId = session?.user.id;
  const [role, setRole] = useState<'mother' | 'partner' | 'caregiver' | null>(null);
  const [reports, setReports] = useState<MedicalReportSummary[]>([]);
  const [pregnancyId, setPregnancyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(false);
    const membership = await supabase.from('family_members').select('role').eq('user_id', userId).maybeSingle();
    if (membership.error || !membership.data) {
      setError(true);
      setLoading(false);
      return;
    }
    const resolvedRole = membership.data.role as typeof role;
    setRole(resolvedRole);
    const activeId = await resolveActivePregnancyId(userId);
    setPregnancyId(activeId);
    if (!activeId || resolvedRole !== 'mother') {
      setReports([]);
      setLoading(false);
      return;
    }
    const result = await listOwnMedicalReports(activeId);
    if (result.error) {
      setError(true);
      setLoading(false);
      return;
    }
    setReports(parseMedicalReportList(result.data));
    setLoading(false);
  }, [userId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const reviewedCount = useMemo(
    () => reports.filter((report) => report.extractionStatus === 'confirmed').length,
    [reports],
  );

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.rose} /></View>;

  if (role && role !== 'mother') {
    return (
      <SafeAreaView style={styles.page} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <JananiPageHeader
            eyebrow="HER PRIVATE RECORDS"
            title={t('tone.reports.partnerTitle')}
            subtitle={t('tone.reports.partnerSubtitle')}
          />
          <View style={styles.privacyCard}>
            <Ionicons name="shield-checkmark-outline" size={28} color={colors.roseDark} />
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>Privacy by default</Text>
              <Text style={styles.cardText}>You can still support shared reminders and pregnancy progress without opening her medical files.</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error || !pregnancyId) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>{error ? 'Janani could not load your reports' : 'No active pregnancy found'}</Text>
          <Text style={styles.errorText}>{error ? 'Your private files have not been removed.' : 'An active pregnancy is needed before reports can be added.'}</Text>
          {error ? <Pressable onPress={() => void load()} style={styles.primaryButton}><Text style={styles.primaryText}>Try again</Text></Pressable> : null}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <JananiPageHeader
          eyebrow="YOUR PRIVATE RECORDS"
          title={t('tone.reports.motherTitle')}
          subtitle={t('tone.reports.motherSubtitle')}
        />

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.iconWrap}><Ionicons name="document-lock-outline" size={28} color={colors.roseDark} /></View>
            <View style={styles.flex}>
              <Text style={styles.heroTitle}>{reports.length ? `${reports.length} private report${reports.length === 1 ? '' : 's'}` : 'Your private report folder'}</Text>
              <Text style={styles.heroText}>{reports.length ? `${reviewedCount} reviewed · originals stay private` : 'Add PDFs or report images up to 15 MB.'}</Text>
            </View>
          </View>
          <Pressable onPress={() => router.push('/add-report')} style={styles.primaryButton}>
            <Ionicons name="add" size={20} color={colors.surface} />
            <Text style={styles.primaryText}>Add a report</Text>
          </Pressable>
        </View>

        <View style={styles.safetyCard}>
          <Ionicons name="checkmark-done-outline" size={21} color={colors.roseDark} />
          <Text style={styles.safetyText}>{t('tone.reports.reviewFlow')}</Text>
        </View>

        {reports.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your records</Text>
            {reports.map((report) => {
              const status = statusCopy(report);
              return (
                <Pressable
                  key={report.id}
                  onPress={() => router.push({ pathname: '/report-detail', params: { id: report.id } })}
                  style={({ pressed }) => [styles.reportCard, pressed && styles.pressed]}
                >
                  <View style={styles.reportIcon}><Ionicons name="document-text-outline" size={23} color={colors.roseDark} /></View>
                  <View style={styles.flex}>
                    <Text style={styles.reportTitle}>{reportKindLabel(report.reportKind)}</Text>
                    <Text style={styles.reportMeta}>{formatReportDate(report.reportDate, report.createdAt)}{report.providerName ? ` · ${report.providerName}` : ''}</Text>
                    <View style={styles.statusRow}>
                      <Ionicons name={status.icon} size={15} color={colors.roseDark} />
                      <View style={styles.flex}>
                        <Text style={styles.statusLabel}>{status.label}</Text>
                        <Text style={styles.statusCaption}>{status.caption}</Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={19} color={colors.muted} />
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-upload-outline" size={34} color={colors.sage} />
            <Text style={styles.emptyTitle}>No reports added yet</Text>
            <Text style={styles.emptyText}>Add a lab report, scan report, prescription or other pregnancy record. The original stays private to you.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xl },
  flex: { flex: 1 },
  pressed: { opacity: 0.78 },
  heroCard: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.blush, borderWidth: 1, borderColor: colors.border },
  heroTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  iconWrap: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  heroTitle: { fontSize: 18, lineHeight: 23, fontWeight: '900', color: colors.ink },
  heroText: { marginTop: 4, fontSize: 13, lineHeight: 19, color: colors.muted },
  primaryButton: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.pill, backgroundColor: colors.rose },
  primaryText: { color: colors.surface, fontSize: 14, fontWeight: '900' },
  safetyCard: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.sageSoft },
  safetyText: { flex: 1, fontSize: 12, lineHeight: 18, color: colors.ink },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.ink },
  reportCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  reportIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blush },
  reportTitle: { fontSize: 16, fontWeight: '900', color: colors.ink },
  reportMeta: { marginTop: 3, fontSize: 11, lineHeight: 17, color: colors.muted },
  statusRow: { marginTop: spacing.sm, flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' },
  statusLabel: { fontSize: 12, fontWeight: '800', color: colors.roseDark },
  statusCaption: { marginTop: 1, fontSize: 11, lineHeight: 16, color: colors.muted },
  emptyState: { alignItems: 'center', padding: spacing.xl, borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, backgroundColor: colors.surface },
  emptyTitle: { marginTop: spacing.md, fontSize: 16, fontWeight: '800', color: colors.ink },
  emptyText: { marginTop: spacing.sm, maxWidth: 340, textAlign: 'center', fontSize: 13, lineHeight: 20, color: colors.muted },
  privacyCard: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.sageSoft, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 17, fontWeight: '900', color: colors.ink },
  cardText: { marginTop: spacing.xs, fontSize: 13, lineHeight: 20, color: colors.muted },
  errorTitle: { textAlign: 'center', fontSize: 20, fontWeight: '900', color: colors.ink },
  errorText: { textAlign: 'center', fontSize: 14, lineHeight: 21, color: colors.muted },
});
