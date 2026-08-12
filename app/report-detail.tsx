import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  addOwnManualReportFact,
  getOwnMedicalReport,
  markOwnMedicalReportUploaded,
  reviewOwnMedicalReportFacts,
} from '@/features/reports/reportRpc';
import {
  parseMedicalReportDetail,
  reportKindLabel,
  type MedicalReportDetail,
  type MedicalReportFact,
} from '@/features/reports/reportTypes';
import {
  deletePrivateMedicalReport,
  ReportUploadError,
} from '@/features/reports/reportUpload';
import { supabase } from '@/lib/supabase';
import { colors, radius, spacing } from '@/theme/tokens';

type FactDraft = { value: string; unit: string; referenceRange: string };

function formatDate(value: string | null, fallback?: string): string {
  const source = value ? `${value}T00:00:00` : fallback;
  if (!source) return 'Date not set';
  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) return 'Date not set';
  return parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function normalized(value: string | null | undefined): string {
  return (value ?? '').trim();
}

export default function ReportDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const reportId = typeof params.id === 'string' ? params.id : null;
  const [report, setReport] = useState<MedicalReportDetail | null>(null);
  const [drafts, setDrafts] = useState<Record<string, FactDraft>>({});
  const [loading, setLoading] = useState(true);
  const [busyFactId, setBusyFactId] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualLabel, setManualLabel] = useState('');
  const [manualValue, setManualValue] = useState('');
  const [manualUnit, setManualUnit] = useState('');
  const [manualRange, setManualRange] = useState('');
  const [addingManual, setAddingManual] = useState(false);

  const load = useCallback(async () => {
    if (!reportId) {
      setLoading(false);
      return;
    }
    const result = await getOwnMedicalReport(reportId);
    if (result.error) {
      setLoading(false);
      return;
    }
    const parsed = parseMedicalReportDetail(result.data);
    setReport(parsed);
    if (parsed) {
      const nextDrafts: Record<string, FactDraft> = {};
      parsed.facts.forEach((fact) => {
        if (fact.reviewStatus !== 'proposed') return;
        nextDrafts[fact.id] = {
          value: fact.extractedValue ?? '',
          unit: fact.extractedUnit ?? '',
          referenceRange: fact.extractedReferenceRange ?? '',
        };
      });
      setDrafts(nextDrafts);
    }
    setLoading(false);
  }, [reportId]);

  useEffect(() => { void load(); }, [load]);

  const proposedFacts = useMemo(() => report?.facts.filter((fact) => fact.reviewStatus === 'proposed') ?? [], [report?.facts]);
  const reviewedFacts = useMemo(() => report?.facts.filter((fact) => fact.reviewStatus !== 'proposed') ?? [], [report?.facts]);

  async function saveFact(fact: MedicalReportFact) {
    if (!report) return;
    const draft = drafts[fact.id] ?? { value: '', unit: '', referenceRange: '' };
    if (!draft.value.trim()) {
      Alert.alert('Value needed', 'Enter the value shown in the original report, or reject this proposed item.');
      return;
    }
    const changed = normalized(draft.value) !== normalized(fact.extractedValue)
      || normalized(draft.unit) !== normalized(fact.extractedUnit)
      || normalized(draft.referenceRange) !== normalized(fact.extractedReferenceRange);
    setBusyFactId(fact.id);
    const result = await reviewOwnMedicalReportFacts({
      reportId: report.id,
      reviews: [{
        id: fact.id,
        decision: changed ? 'corrected' : 'confirmed',
        value: draft.value.trim(),
        unit: draft.unit.trim(),
        referenceRange: draft.referenceRange.trim(),
      }],
    });
    setBusyFactId(null);
    if (result.error) {
      Alert.alert('Could not save this review', result.error.message);
      return;
    }
    await load();
  }

  async function rejectFact(fact: MedicalReportFact) {
    if (!report) return;
    setBusyFactId(fact.id);
    const result = await reviewOwnMedicalReportFacts({
      reportId: report.id,
      reviews: [{ id: fact.id, decision: 'rejected' }],
    });
    setBusyFactId(null);
    if (result.error) {
      Alert.alert('Could not reject this item', result.error.message);
      return;
    }
    await load();
  }

  async function addManualFact() {
    if (!report) return;
    const label = manualLabel.trim();
    const value = manualValue.trim();
    if (!label || !value) {
      Alert.alert('Add a label and value', 'Copy the important name and value from your original report.');
      return;
    }
    setAddingManual(true);
    const result = await addOwnManualReportFact({
      reportId: report.id,
      displayLabel: label,
      value,
      factKind: 'other',
      unit: manualUnit.trim() || null,
      referenceRange: manualRange.trim() || null,
    });
    setAddingManual(false);
    if (result.error) {
      Alert.alert('Could not add this value', result.error.message);
      return;
    }
    setManualLabel('');
    setManualValue('');
    setManualUnit('');
    setManualRange('');
    setManualOpen(false);
    await load();
  }

  async function openOriginal() {
    if (!report) return;
    setOpening(true);
    const result = await supabase.storage.from('medical-reports').createSignedUrl(report.storagePath, 60);
    setOpening(false);
    if (result.error || !result.data?.signedUrl) {
      Alert.alert('Could not open the original', result.error?.message ?? 'Try again.');
      return;
    }
    const supported = await Linking.canOpenURL(result.data.signedUrl);
    if (!supported) {
      Alert.alert('No viewer available', 'Your device could not open this report format.');
      return;
    }
    await Linking.openURL(result.data.signedUrl);
  }

  async function finalizePendingUpload() {
    if (!report) return;
    setFinalizing(true);
    const result = await markOwnMedicalReportUploaded(report.id);
    setFinalizing(false);
    if (result.error) {
      Alert.alert('Upload is still incomplete', 'The private file is not available in storage. You can safely remove this record and add the report again.');
      return;
    }
    await load();
  }

  function confirmDelete() {
    if (!report) return;
    Alert.alert(
      'Delete this report?',
      'This removes the private original and all extracted or confirmed values linked to it. This cannot be undone.',
      [
        { text: 'Keep report', style: 'cancel' },
        { text: 'Delete permanently', style: 'destructive', onPress: () => void performDelete() },
      ],
    );
  }

  async function performDelete() {
    if (!report) return;
    setDeleting(true);
    try {
      await deletePrivateMedicalReport(report.id, report.storagePath);
      router.back();
    } catch (error) {
      Alert.alert('Could not delete the report', error instanceof ReportUploadError ? error.message : 'Try again.');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.rose} /></View>;

  if (!report) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Report not available</Text>
          <Text style={styles.emptyText}>It may have been removed, or this account does not have permission to view it.</Text>
          <Pressable onPress={() => router.back()} style={styles.primaryButton}><Text style={styles.primaryText}>Go back</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>PRIVATE REPORT</Text>
          <Text numberOfLines={1} style={styles.title}>{reportKindLabel(report.reportKind)}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={styles.fileIcon}><Ionicons name="document-text-outline" size={26} color={colors.roseDark} /></View>
            <View style={styles.flex}>
              <Text numberOfLines={2} style={styles.fileName}>{report.originalFileName}</Text>
              <Text style={styles.meta}>{formatDate(report.reportDate, report.createdAt)}{report.providerName ? ` · ${report.providerName}` : ''}</Text>
            </View>
          </View>
          {report.uploadState === 'uploaded' ? (
            <Pressable disabled={opening} onPress={() => void openOriginal()} style={styles.secondaryButton}>
              {opening ? <ActivityIndicator color={colors.roseDark} /> : <><Ionicons name="eye-outline" size={19} color={colors.roseDark} /><Text style={styles.secondaryText}>View original</Text></>}
            </Pressable>
          ) : (
            <Pressable disabled={finalizing} onPress={() => void finalizePendingUpload()} style={styles.secondaryButton}>
              {finalizing ? <ActivityIndicator color={colors.roseDark} /> : <><Ionicons name="refresh-outline" size={19} color={colors.roseDark} /><Text style={styles.secondaryText}>Check incomplete upload</Text></>}
            </Pressable>
          )}
        </View>

        <View style={styles.safetyCard}>
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.roseDark} />
          <View style={styles.flex}>
            <Text style={styles.safetyTitle}>The original report is the source of truth</Text>
            <Text style={styles.safetyText}>Machine-read values below are only proposals. Compare them with the original before confirming or correcting them.</Text>
          </View>
        </View>

        {proposedFacts.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Needs your review</Text>
            <Text style={styles.sectionText}>{proposedFacts.length} proposed value{proposedFacts.length === 1 ? '' : 's'} will stay outside Janani’s trusted context until reviewed.</Text>
            {proposedFacts.map((fact) => {
              const draft = drafts[fact.id] ?? { value: '', unit: '', referenceRange: '' };
              const busy = busyFactId === fact.id;
              return (
                <View key={fact.id} style={styles.factCard}>
                  <Text style={styles.factLabel}>{fact.displayLabel}</Text>
                  {fact.sourcePage ? <Text style={styles.sourceText}>Source: page {fact.sourcePage}</Text> : null}
                  {fact.sourceExcerpt ? <Text style={styles.sourceExcerpt}>“{fact.sourceExcerpt}”</Text> : null}
                  <Text style={styles.fieldLabel}>Value</Text>
                  <TextInput
                    value={draft.value}
                    onChangeText={(value) => setDrafts((current) => ({ ...current, [fact.id]: { ...draft, value } }))}
                    maxLength={500}
                    placeholder="Value from report"
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                  />
                  <View style={styles.inlineFields}>
                    <View style={styles.flex}>
                      <Text style={styles.fieldLabel}>Unit</Text>
                      <TextInput value={draft.unit} onChangeText={(unit) => setDrafts((current) => ({ ...current, [fact.id]: { ...draft, unit } }))} maxLength={80} placeholder="Optional" placeholderTextColor={colors.muted} style={styles.input} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.fieldLabel}>Reference range</Text>
                      <TextInput value={draft.referenceRange} onChangeText={(referenceRange) => setDrafts((current) => ({ ...current, [fact.id]: { ...draft, referenceRange } }))} maxLength={160} placeholder="Optional" placeholderTextColor={colors.muted} style={styles.input} />
                    </View>
                  </View>
                  <View style={styles.reviewActions}>
                    <Pressable disabled={busy} onPress={() => void saveFact(fact)} style={[styles.confirmButton, busy && styles.disabled]}>
                      {busy ? <ActivityIndicator color={colors.surface} /> : <><Ionicons name="checkmark" size={18} color={colors.surface} /><Text style={styles.confirmText}>Confirm shown value</Text></>}
                    </Pressable>
                    <Pressable disabled={busy} onPress={() => void rejectFact(fact)} style={styles.rejectButton}><Text style={styles.rejectText}>Reject</Text></Pressable>
                  </View>
                  <Text style={styles.helper}>If you edit any field before confirming, Janani records it as a correction while preserving the original machine reading.</Text>
                </View>
              );
            })}
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeadingRow}>
            <View style={styles.flex}>
              <Text style={styles.sectionTitle}>Confirmed from this report</Text>
              <Text style={styles.sectionText}>Only confirmed or corrected values are eligible for future context use.</Text>
            </View>
            <Pressable onPress={() => setManualOpen((value) => !value)} style={styles.smallButton}><Ionicons name={manualOpen ? 'close' : 'add'} size={17} color={colors.roseDark} /><Text style={styles.smallButtonText}>{manualOpen ? 'Cancel' : 'Add value'}</Text></Pressable>
          </View>

          {manualOpen ? (
            <View style={styles.manualCard}>
              <Text style={styles.manualTitle}>Copy an important value manually</Text>
              <Text style={styles.helper}>Use the original report in front of you. Manual entries are marked as entered by you, not extracted by AI.</Text>
              <TextInput value={manualLabel} onChangeText={setManualLabel} maxLength={120} placeholder="Example: Hemoglobin" placeholderTextColor={colors.muted} style={styles.input} />
              <TextInput value={manualValue} onChangeText={setManualValue} maxLength={500} placeholder="Value" placeholderTextColor={colors.muted} style={styles.input} />
              <View style={styles.inlineFields}>
                <TextInput value={manualUnit} onChangeText={setManualUnit} maxLength={80} placeholder="Unit (optional)" placeholderTextColor={colors.muted} style={[styles.input, styles.flex]} />
                <TextInput value={manualRange} onChangeText={setManualRange} maxLength={160} placeholder="Range (optional)" placeholderTextColor={colors.muted} style={[styles.input, styles.flex]} />
              </View>
              <Pressable disabled={addingManual} onPress={() => void addManualFact()} style={[styles.confirmButton, addingManual && styles.disabled]}>
                {addingManual ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.confirmText}>Add confirmed value</Text>}
              </Pressable>
            </View>
          ) : null}

          {reviewedFacts.filter((fact) => fact.reviewStatus !== 'rejected').length ? reviewedFacts.filter((fact) => fact.reviewStatus !== 'rejected').map((fact) => (
            <View key={fact.id} style={styles.confirmedCard}>
              <View style={styles.confirmedIcon}><Ionicons name={fact.reviewStatus === 'corrected' ? 'create-outline' : 'checkmark-circle-outline'} size={21} color={colors.roseDark} /></View>
              <View style={styles.flex}>
                <Text style={styles.confirmedLabel}>{fact.displayLabel}</Text>
                <Text style={styles.confirmedValue}>{fact.confirmedValue ?? fact.extractedValue ?? 'Confirmed'}{fact.confirmedUnit ? ` ${fact.confirmedUnit}` : ''}</Text>
                {fact.confirmedReferenceRange ? <Text style={styles.confirmedMeta}>Reference: {fact.confirmedReferenceRange}</Text> : null}
                <Text style={styles.confirmedMeta}>{fact.reviewStatus === 'corrected' ? 'Corrected by you · original extraction retained' : fact.extractionId ? 'Confirmed by you' : 'Entered manually by you'}</Text>
              </View>
            </View>
          )) : <Text style={styles.noFacts}>No confirmed values saved from this report yet.</Text>}
        </View>

        {!proposedFacts.length && report.extractionStatus !== 'confirmed' ? (
          <View style={styles.readingCard}>
            <Ionicons name="sparkles-outline" size={21} color={colors.roseDark} />
            <View style={styles.flex}>
              <Text style={styles.readingTitle}>Automatic report reading is not enabled on this build yet</Text>
              <Text style={styles.readingText}>Your original is already stored safely. You can add important values manually without waiting for an extraction provider to be enabled.</Text>
            </View>
          </View>
        ) : null}

        <Pressable disabled={deleting} onPress={confirmDelete} style={[styles.deleteButton, deleting && styles.disabled]}>
          {deleting ? <ActivityIndicator color={colors.roseDark} /> : <><Ionicons name="trash-outline" size={18} color={colors.roseDark} /><Text style={styles.deleteText}>Delete report permanently</Text></>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.sm },
  iconButton: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 10, letterSpacing: 1.5, fontWeight: '800', color: colors.roseDark },
  title: { marginTop: 3, fontSize: 22, lineHeight: 28, fontWeight: '900', color: colors.ink },
  content: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl, gap: spacing.xl },
  flex: { flex: 1 },
  summaryCard: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  fileIcon: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blush },
  fileName: { fontSize: 16, lineHeight: 21, fontWeight: '900', color: colors.ink },
  meta: { marginTop: 3, fontSize: 12, lineHeight: 18, color: colors.muted },
  secondaryButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.rose, backgroundColor: colors.background },
  secondaryText: { fontSize: 13, fontWeight: '900', color: colors.roseDark },
  safetyCard: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.sageSoft },
  safetyTitle: { fontSize: 13, fontWeight: '900', color: colors.ink },
  safetyText: { marginTop: 3, fontSize: 12, lineHeight: 18, color: colors.muted },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.ink },
  sectionText: { marginTop: 3, fontSize: 12, lineHeight: 18, color: colors.muted },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  factCard: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.rose },
  factLabel: { fontSize: 16, fontWeight: '900', color: colors.ink },
  sourceText: { fontSize: 11, fontWeight: '800', color: colors.roseDark },
  sourceExcerpt: { fontSize: 12, lineHeight: 18, color: colors.muted, fontStyle: 'italic' },
  fieldLabel: { fontSize: 12, fontWeight: '800', color: colors.ink },
  input: { minHeight: 48, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, color: colors.ink, fontSize: 14 },
  inlineFields: { flexDirection: 'row', gap: spacing.sm },
  reviewActions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  confirmButton: { minHeight: 46, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.rose },
  confirmText: { color: colors.surface, fontSize: 12, fontWeight: '900' },
  rejectButton: { minHeight: 46, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  rejectText: { fontSize: 12, fontWeight: '800', color: colors.muted },
  helper: { fontSize: 11, lineHeight: 17, color: colors.muted },
  smallButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.blush },
  smallButtonText: { fontSize: 11, fontWeight: '800', color: colors.roseDark },
  manualCard: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.blush },
  manualTitle: { fontSize: 14, fontWeight: '900', color: colors.ink },
  confirmedCard: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  confirmedIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sageSoft },
  confirmedLabel: { fontSize: 12, fontWeight: '800', color: colors.muted },
  confirmedValue: { marginTop: 2, fontSize: 16, fontWeight: '900', color: colors.ink },
  confirmedMeta: { marginTop: 3, fontSize: 10, lineHeight: 15, color: colors.muted },
  noFacts: { padding: spacing.md, textAlign: 'center', fontSize: 12, color: colors.muted },
  readingCard: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.blush },
  readingTitle: { fontSize: 13, fontWeight: '900', color: colors.ink },
  readingText: { marginTop: 3, fontSize: 12, lineHeight: 18, color: colors.muted },
  deleteButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.rose, backgroundColor: colors.surface },
  deleteText: { fontSize: 13, fontWeight: '900', color: colors.roseDark },
  primaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, borderRadius: radius.pill, backgroundColor: colors.rose },
  primaryText: { color: colors.surface, fontWeight: '900' },
  disabled: { opacity: 0.5 },
  emptyTitle: { textAlign: 'center', fontSize: 20, fontWeight: '900', color: colors.ink },
  emptyText: { textAlign: 'center', fontSize: 14, lineHeight: 21, color: colors.muted },
});
