import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JananiPageHeader } from '@/components/navigation/JananiPageHeader';
import { resolveActivePregnancyId } from '@/features/pregnancy/activePregnancy';
import { deleteOwnMedicalReport, listOwnMedicalReports, pickAndUploadWrittenMedicalReport, retryOwnMedicalReportExtraction, type MedicalReportSummary } from '@/features/reports/medicalReports';
import { useAuth } from '@/providers/AuthProvider';
import { colors, spacing } from '@/theme/tokens';

function reportLabel(kind: string): string {
  switch (kind) {
    case 'blood_test': return 'Blood test';
    case 'urine_test': return 'Urine test';
    case 'scan_report': return 'Written scan report';
    case 'prescription': return 'Prescription';
    case 'discharge_summary': return 'Discharge summary';
    default: return 'Medical report';
  }
}

function statusLabel(report: MedicalReportSummary): string {
  if (report.extractionStatus === 'needs_confirmation') return 'Needs your review';
  if (report.extractionStatus === 'confirmed') return 'Reviewed';
  if (report.extractionStatus === 'processing' || report.extractionStatus === 'queued') return 'Reading report';
  if (report.extractionStatus === 'failed' || report.extractionStatus === 'not_available') return 'Reading failed — retry available';
  return report.uploadState === 'uploaded' ? 'Stored privately' : 'Upload incomplete';
}

function retryable(report: MedicalReportSummary): boolean {
  return report.uploadState === 'uploaded' && ['failed', 'not_available', 'not_started'].includes(report.extractionStatus);
}

export default function ReportsScreen() {
  const { session } = useAuth();
  const [reports, setReports] = useState<MedicalReportSummary[]>([]);
  const [pregnancyId, setPregnancyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyReportId, setBusyReportId] = useState<string | null>(null);

  async function load() {
    const userId = session?.user.id;
    if (!userId) return;
    try {
      const activePregnancyId = await resolveActivePregnancyId(userId);
      setPregnancyId(activePregnancyId);
      if (!activePregnancyId) {
        setReports([]);
        return;
      }
      setReports(await listOwnMedicalReports(activePregnancyId));
    } catch (error) {
      Alert.alert('Reports unavailable', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [session?.user.id]);

  async function addReport() {
    if (!pregnancyId || uploading) return;
    setUploading(true);
    try {
      const reportId = await pickAndUploadWrittenMedicalReport(pregnancyId);
      if (!reportId) return;
      await load();
      Alert.alert('Report stored privately', 'PregaLove will only use extracted values after you review and confirm them.');
    } catch (error) {
      Alert.alert('Could not add report', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function retryReport(report: MedicalReportSummary) {
    if (busyReportId || !retryable(report)) return;
    setBusyReportId(report.id);
    try {
      await retryOwnMedicalReportExtraction(report.id);
      await load();
      Alert.alert('Reading restarted', 'Your private report is being read again. You will still review every extracted value before PregaLove trusts it.');
    } catch (error) {
      Alert.alert('Could not retry report', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusyReportId(null);
    }
  }

  function confirmDelete(report: MedicalReportSummary) {
    if (busyReportId) return;
    Alert.alert(
      'Delete this private report?',
      'This permanently deletes the uploaded file and its extracted or confirmed report facts from PregaLove. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void deleteReport(report) },
      ],
    );
  }

  async function deleteReport(report: MedicalReportSummary) {
    setBusyReportId(report.id);
    try {
      await deleteOwnMedicalReport(report.id);
      await load();
    } catch (error) {
      Alert.alert('Could not delete report', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusyReportId(null);
    }
  }

  return <SafeAreaView style={styles.page} edges={['top']}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <JananiPageHeader eyebrow="YOUR RECORDS" title="Reports" subtitle="Keep written care records close to your pregnancy journey." />

    <View style={styles.heroCard}>
      <View style={styles.iconWrap}><Ionicons name="document-text-outline" size={27} color={colors.roseDark} /></View>
      <View style={styles.statusPill}><View style={styles.statusDot}/><Text style={styles.statusText}>PRIVATE + CONFIRM FIRST</Text></View>
      <Text style={styles.heroTitle}>Janani only trusts values you review</Text>
      <Text style={styles.heroText}>Upload PDFs or clear photos of written medical reports. PregaLove can organize visible text, but it does not diagnose, judge whether results are normal, or interpret ultrasound imagery.</Text>
      <Pressable disabled={!pregnancyId || uploading} onPress={() => void addReport()} style={[styles.uploadButton, (!pregnancyId || uploading) && styles.disabled]}>
        {uploading ? <ActivityIndicator color={colors.surface} /> : <><Ionicons name="cloud-upload-outline" size={19} color={colors.surface} /><Text style={styles.uploadText}>Add written report</Text></>}
      </Pressable>
      <Text style={styles.uploadHelper}>PDF/JPG/PNG/WebP/HEIC/HEIF · up to 15 MB · private to the mother</Text>
    </View>

    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Your private reports</Text><Text style={styles.sectionCaption}>Only reports belonging to your pregnancy are shown here.</Text></View>

    {loading ? <View style={styles.loading}><ActivityIndicator color={colors.rose} /><Text style={styles.loadingText}>Loading reports…</Text></View> : reports.length === 0 ? <View style={styles.emptyCard}><Ionicons name="folder-open-outline" size={28} color={colors.muted} /><Text style={styles.emptyTitle}>No reports yet</Text><Text style={styles.emptyText}>Add a written report when you are ready. Extracted values will wait for your confirmation.</Text></View> : reports.map((report) => {
      const needsReview = report.extractionStatus === 'needs_confirmation';
      const isBusy = busyReportId === report.id;
      return <View key={report.id} style={styles.reportCard}>
        <Pressable disabled={!needsReview || isBusy} onPress={() => router.push({ pathname: '/report-review', params: { reportId: report.id } })} style={({ pressed }) => [styles.reportMain, pressed && needsReview && styles.pressed]}>
          <View style={[styles.reportIcon, needsReview && styles.reportIconAttention]}><Ionicons name={needsReview ? 'alert-circle-outline' : 'document-outline'} size={22} color={needsReview ? colors.roseDark : colors.sage} /></View>
          <View style={styles.flex}><Text style={styles.reportTitle}>{reportLabel(report.reportKind)}</Text><Text numberOfLines={1} style={styles.reportName}>{report.originalFileName}</Text><Text style={styles.reportMeta}>{report.reportDate ?? 'Date not provided'} · {statusLabel(report)}{report.proposedFacts ? ` · ${report.proposedFacts} to review` : ''}</Text></View>
          {isBusy ? <ActivityIndicator color={colors.rose} /> : needsReview ? <Ionicons name="chevron-forward" size={18} color={colors.roseDark} /> : <Ionicons name="checkmark-circle-outline" size={19} color={report.extractionStatus === 'confirmed' ? colors.sage : colors.muted} />}
        </Pressable>
        <View style={styles.reportActions}>
          {retryable(report) ? <Pressable disabled={Boolean(busyReportId)} onPress={() => void retryReport(report)} style={({ pressed }) => [styles.retryAction, pressed && styles.pressed, Boolean(busyReportId) && styles.disabled]}><Ionicons name="refresh-outline" size={16} color={colors.roseDark} /><Text style={styles.retryActionText}>Retry reading</Text></Pressable> : <View />}
          <Pressable disabled={Boolean(busyReportId)} onPress={() => confirmDelete(report)} style={({ pressed }) => [styles.deleteAction, pressed && styles.pressed, Boolean(busyReportId) && styles.disabled]}><Ionicons name="trash-outline" size={16} color={colors.roseDark} /><Text style={styles.deleteActionText}>Delete</Text></Pressable>
        </View>
      </View>;
    })}

    <Pressable onPress={() => router.push('/care-context')} style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}><View style={styles.actionIcon}><Ionicons name="clipboard-outline" size={22} color={colors.roseDark} /></View><View style={styles.flex}><Text style={styles.actionTitle}>Care Context</Text><Text style={styles.actionText}>Review the information you have chosen to keep in PregaLove.</Text></View><Ionicons name="chevron-forward" size={18} color={colors.muted} /></Pressable>

    <View style={styles.noteCard}><Ionicons name="shield-checkmark-outline" size={18} color={colors.sage}/><Text style={styles.noteText}>Written-report upload, confirmation, retry and private deletion are now wired. Raw medical-image interpretation remains disabled.</Text></View>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.xl},flex:{flex:1},pressed:{opacity:.78,transform:[{scale:.995}]},disabled:{opacity:.55},
  heroCard:{alignItems:'flex-start',padding:spacing.lg,borderRadius:26,backgroundColor:colors.rosePale,borderWidth:1,borderColor:colors.border},iconWrap:{width:54,height:54,borderRadius:19,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface},statusPill:{marginTop:spacing.md,flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:9,paddingVertical:5,borderRadius:999,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},statusDot:{width:7,height:7,borderRadius:4,backgroundColor:colors.sage},statusText:{fontSize:9,letterSpacing:1.05,fontWeight:'900',color:colors.sage},heroTitle:{marginTop:spacing.md,fontSize:20,lineHeight:26,fontWeight:'900',color:colors.ink},heroText:{marginTop:spacing.sm,fontSize:13.5,lineHeight:21,color:colors.muted},uploadButton:{marginTop:spacing.lg,minHeight:48,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm,paddingHorizontal:spacing.lg,borderRadius:999,backgroundColor:colors.rose},uploadText:{fontSize:14,fontWeight:'900',color:colors.surface},uploadHelper:{marginTop:spacing.sm,fontSize:11.5,lineHeight:17,color:colors.muted},
  sectionHeader:{gap:2},sectionTitle:{fontSize:19,fontWeight:'900',color:colors.ink},sectionCaption:{fontSize:12.5,lineHeight:18,color:colors.muted},
  loading:{minHeight:110,alignItems:'center',justifyContent:'center',gap:spacing.sm},loadingText:{fontSize:12.5,color:colors.muted},emptyCard:{alignItems:'center',padding:spacing.xl,borderRadius:21,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},emptyTitle:{marginTop:spacing.sm,fontSize:16,fontWeight:'900',color:colors.ink},emptyText:{marginTop:5,textAlign:'center',fontSize:12.5,lineHeight:19,color:colors.muted},
  reportCard:{borderRadius:21,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,overflow:'hidden'},reportMain:{minHeight:90,flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.md},reportIcon:{width:46,height:46,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:colors.sageSoft},reportIconAttention:{backgroundColor:colors.rosePale},reportTitle:{fontSize:15,fontWeight:'900',color:colors.ink},reportName:{marginTop:2,fontSize:12.5,color:colors.muted},reportMeta:{marginTop:4,fontSize:11.5,lineHeight:17,color:colors.muted},reportActions:{minHeight:46,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:spacing.sm,paddingHorizontal:spacing.md,borderTopWidth:1,borderTopColor:colors.border},retryAction:{minHeight:38,flexDirection:'row',alignItems:'center',gap:6},retryActionText:{fontSize:12.5,fontWeight:'800',color:colors.roseDark},deleteAction:{minHeight:38,flexDirection:'row',alignItems:'center',gap:6},deleteActionText:{fontSize:12.5,fontWeight:'800',color:colors.roseDark},
  actionCard:{minHeight:84,flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.md,borderRadius:21,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},actionIcon:{width:46,height:46,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:colors.sageSoft},actionTitle:{fontSize:15.5,fontWeight:'900',color:colors.ink},actionText:{marginTop:3,fontSize:12.5,lineHeight:18,color:colors.muted},
  noteCard:{flexDirection:'row',alignItems:'flex-start',gap:spacing.sm,padding:spacing.md,borderRadius:18,backgroundColor:colors.surfaceWarm,borderWidth:1,borderColor:colors.border},noteText:{flex:1,fontSize:12,lineHeight:18,color:colors.muted}
});
