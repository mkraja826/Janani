import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getOwnMedicalReport, reviewOwnMedicalReportFacts, type MedicalReportDetail, type MedicalReportFactReview } from '@/features/reports/medicalReports';
import { colors, radius, spacing } from '@/theme/tokens';

type Draft = Record<string, { value: string; unit: string; referenceRange: string; decision: 'confirmed' | 'corrected' | 'rejected' }>;

export default function ReportReviewScreen() {
  const params = useLocalSearchParams<{ reportId?: string }>();
  const reportId = typeof params.reportId === 'string' ? params.reportId : '';
  const [report, setReport] = useState<MedicalReportDetail | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!reportId) return;
    try {
      const next = await getOwnMedicalReport(reportId);
      setReport(next);
      const nextDraft: Draft = {};
      for (const fact of next.facts ?? []) {
        if (fact.reviewStatus !== 'proposed') continue;
        nextDraft[fact.id] = {
          value: fact.extractedValue ?? '',
          unit: fact.extractedUnit ?? '',
          referenceRange: fact.extractedReferenceRange ?? '',
          decision: 'confirmed',
        };
      }
      setDraft(nextDraft);
    } catch (error) {
      Alert.alert('Report unavailable', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [reportId]);

  const proposedFacts = useMemo(() => report?.facts?.filter((fact) => fact.reviewStatus === 'proposed') ?? [], [report]);

  async function saveReview() {
    if (!report || saving || proposedFacts.length === 0) return;
    const reviews: MedicalReportFactReview[] = proposedFacts.map((fact) => {
      const item = draft[fact.id];
      if (!item || item.decision === 'rejected') return { id: fact.id, decision: 'rejected' };
      const extractedValue = fact.extractedValue ?? '';
      const extractedUnit = fact.extractedUnit ?? '';
      const extractedRange = fact.extractedReferenceRange ?? '';
      const changed = item.value.trim() !== extractedValue || item.unit.trim() !== extractedUnit || item.referenceRange.trim() !== extractedRange;
      return {
        id: fact.id,
        decision: changed ? 'corrected' : 'confirmed',
        value: item.value.trim(),
        unit: item.unit.trim() || null,
        referenceRange: item.referenceRange.trim() || null,
      };
    });
    if (reviews.some((item) => item.decision !== 'rejected' && !item.value?.trim())) {
      Alert.alert('Check the values', 'Confirmed values cannot be empty. Reject a value instead if Janani read it incorrectly.');
      return;
    }
    setSaving(true);
    try {
      const updated = await reviewOwnMedicalReportFacts(report.id, reviews);
      setReport(updated);
      setDraft({});
      Alert.alert('Report reviewed', 'Only the values you confirmed or corrected can now be used as trusted report context.');
    } catch (error) {
      Alert.alert('Could not save review', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.rose} /></View>;
  if (!report) return <View style={styles.center}><Text style={styles.muted}>This report could not be loaded.</Text></View>;

  return <SafeAreaView style={styles.page} edges={['top']}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><Pressable accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable><View style={styles.flex}><Text style={styles.eyebrow}>REPORT REVIEW</Text><Text style={styles.title}>{report.originalFileName}</Text></View></View>
    <View style={styles.notice}><Ionicons name="shield-checkmark-outline" size={22} color={colors.roseDark} /><Text style={styles.noticeText}>Janani has transcribed written information only. It does not diagnose, judge whether results are normal, or interpret ultrasound imagery. Review every value before saving it.</Text></View>

    {proposedFacts.length === 0 ? <View style={styles.card}><Ionicons name="checkmark-circle-outline" size={28} color={colors.sage} /><Text style={styles.cardTitle}>Review complete</Text><Text style={styles.muted}>There are no unreviewed extracted values in this report.</Text></View> : proposedFacts.map((fact) => {
      const item = draft[fact.id];
      if (!item) return null;
      const rejected = item.decision === 'rejected';
      return <View key={fact.id} style={styles.card}>
        <View style={styles.factHeader}><View style={styles.flex}><Text style={styles.cardTitle}>{fact.displayLabel}</Text><Text style={styles.meta}>{fact.factKind.replaceAll('_', ' ')}{fact.observedOn ? ` · ${fact.observedOn}` : ''}{fact.sourcePage ? ` · page ${fact.sourcePage}` : ''}</Text></View><Pressable onPress={() => setDraft((current) => ({ ...current, [fact.id]: { ...current[fact.id], decision: rejected ? 'confirmed' : 'rejected' } }))} style={[styles.rejectButton, rejected && styles.rejectButtonSelected]}><Text style={[styles.rejectText, rejected && styles.rejectTextSelected]}>{rejected ? 'Keep' : 'Reject'}</Text></Pressable></View>
        {fact.sourceExcerpt ? <View style={styles.excerpt}><Text style={styles.excerptLabel}>From the report</Text><Text style={styles.excerptText}>“{fact.sourceExcerpt}”</Text></View> : null}
        {!rejected ? <>
          <Field label="Value" value={item.value} maxLength={500} onChangeText={(value) => setDraft((current) => ({ ...current, [fact.id]: { ...current[fact.id], value } }))} />
          <Field label="Unit" value={item.unit} maxLength={80} onChangeText={(unit) => setDraft((current) => ({ ...current, [fact.id]: { ...current[fact.id], unit } }))} />
          <Field label="Printed reference range" value={item.referenceRange} maxLength={160} onChangeText={(referenceRange) => setDraft((current) => ({ ...current, [fact.id]: { ...current[fact.id], referenceRange } }))} />
        </> : <Text style={styles.rejectedNote}>This extracted value will not be trusted or used by Janani.</Text>}
      </View>;
    })}

    {proposedFacts.length > 0 ? <Pressable disabled={saving} onPress={() => void saveReview()} style={[styles.save, saving && styles.disabled]}>{saving ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.saveText}>Confirm reviewed values</Text>}</Pressable> : null}
    <Text style={styles.footer}>Your clinician’s report remains the source of truth. Janani only helps organize information you confirm.</Text>
  </ScrollView></SafeAreaView>;
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  return <View style={styles.field}><Text style={styles.label}>{props.label}</Text><TextInput {...props} style={styles.input} placeholderTextColor={colors.muted} /></View>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},center:{flex:1,alignItems:'center',justifyContent:'center',padding:spacing.xl,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.lg},header:{flexDirection:'row',gap:spacing.md,alignItems:'flex-start'},back:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},flex:{flex:1},eyebrow:{fontSize:11,letterSpacing:1.4,fontWeight:'900',color:colors.rose},title:{marginTop:4,fontSize:24,lineHeight:30,fontWeight:'900',color:colors.ink},notice:{flexDirection:'row',gap:spacing.sm,padding:spacing.md,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},noticeText:{flex:1,fontSize:13,lineHeight:20,color:colors.muted},card:{gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},factHeader:{flexDirection:'row',gap:spacing.md,alignItems:'flex-start'},cardTitle:{fontSize:17,fontWeight:'900',color:colors.ink},meta:{marginTop:3,fontSize:12,textTransform:'capitalize',color:colors.muted},excerpt:{padding:spacing.md,borderRadius:radius.md,backgroundColor:colors.surfaceWarm,borderWidth:1,borderColor:colors.border},excerptLabel:{fontSize:11,fontWeight:'900',letterSpacing:.8,color:colors.roseDark},excerptText:{marginTop:5,fontSize:13,lineHeight:19,color:colors.ink},field:{gap:6},label:{fontSize:13,fontWeight:'800',color:colors.ink},input:{minHeight:48,paddingHorizontal:spacing.md,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.background,color:colors.ink,fontSize:15},rejectButton:{minHeight:36,paddingHorizontal:spacing.md,alignItems:'center',justifyContent:'center',borderRadius:radius.pill,borderWidth:1,borderColor:colors.border},rejectButtonSelected:{backgroundColor:colors.blush,borderColor:colors.rose},rejectText:{fontSize:12,fontWeight:'800',color:colors.muted},rejectTextSelected:{color:colors.roseDark},rejectedNote:{fontSize:13,lineHeight:19,color:colors.muted},save:{minHeight:54,borderRadius:radius.pill,backgroundColor:colors.rose,alignItems:'center',justifyContent:'center'},saveText:{fontSize:15,fontWeight:'900',color:colors.surface},disabled:{opacity:.6},muted:{fontSize:13,lineHeight:20,color:colors.muted},footer:{textAlign:'center',fontSize:12,lineHeight:18,color:colors.muted}
});
