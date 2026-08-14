import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { resolveActivePregnancyId } from '@/features/pregnancy/activePregnancy';
import {
  pickPrivateMedicalReport,
  ReportUploadError,
  uploadPrivateMedicalReport,
  type PreparedReport,
} from '@/features/reports/reportUpload';
import {
  REPORT_KIND_OPTIONS,
  type MedicalReportKind,
} from '@/features/reports/reportTypes';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

function dateOnly(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function formatBytes(value: number): string {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AddReportScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [pregnancyId, setPregnancyId] = useState<string | null>(null);
  const [prepared, setPrepared] = useState<PreparedReport | null>(null);
  const [reportKind, setReportKind] = useState<MedicalReportKind>('blood_test');
  const [reportDate, setReportDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [providerName, setProviderName] = useState('');
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let disposed = false;
    void (async () => {
      if (!userId) return;
      const activeId = await resolveActivePregnancyId(userId);
      if (disposed) return;
      setPregnancyId(activeId);
      setLoading(false);
    })();
    return () => { disposed = true; };
  }, [userId]);

  async function chooseFile() {
    setPicking(true);
    try {
      const picked = await pickPrivateMedicalReport();
      if (picked) setPrepared(picked);
    } catch (error) {
      Alert.alert('Could not use this report', error instanceof ReportUploadError ? error.message : 'Choose the report again.');
    } finally {
      setPicking(false);
    }
  }

  async function upload() {
    if (!pregnancyId || !prepared) return;
    setUploading(true);
    try {
      const result = await uploadPrivateMedicalReport({
        pregnancyId,
        prepared,
        reportKind,
        reportDate: reportDate ? dateOnly(reportDate) : null,
        providerName,
      });
      router.replace({ pathname: '/report-detail', params: { id: result.reportId } });
    } catch (error) {
      Alert.alert(
        'Report was not added',
        error instanceof ReportUploadError ? error.message : 'Check your connection and try again.',
      );
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.rose} /></View>;

  if (!pregnancyId) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No active pregnancy found</Text>
          <Text style={styles.emptyText}>Janani needs an active pregnancy before a medical report can be stored.</Text>
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
          <Text style={styles.eyebrow}>PRIVATE MEDICAL RECORD</Text>
          <Text style={styles.title}>Add a report</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.privacyCard}>
          <Ionicons name="lock-closed-outline" size={21} color={colors.roseDark} />
          <Text style={styles.privacyText}>The original file is stored privately. Your partner does not receive report access by default.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Choose the original</Text>
          <Text style={styles.sectionText}>PDF, JPG, PNG, WebP, HEIC or HEIF · maximum 15 MB.</Text>
          {prepared ? (
            <View style={styles.fileCard}>
              <View style={styles.fileIcon}><Ionicons name={prepared.mimeType === 'application/pdf' ? 'document-text-outline' : 'image-outline'} size={24} color={colors.roseDark} /></View>
              <View style={styles.flex}>
                <Text numberOfLines={2} style={styles.fileName}>{prepared.asset.name}</Text>
                <Text style={styles.fileMeta}>{formatBytes(prepared.size)} · {prepared.mimeType === 'application/pdf' ? 'PDF' : 'Image'}</Text>
              </View>
              <Pressable disabled={picking || uploading} onPress={() => void chooseFile()} style={styles.changeButton}><Text style={styles.changeText}>Change</Text></Pressable>
            </View>
          ) : (
            <Pressable disabled={picking || uploading} onPress={() => void chooseFile()} style={styles.chooseButton}>
              {picking ? <ActivityIndicator color={colors.roseDark} /> : <Ionicons name="cloud-upload-outline" size={24} color={colors.roseDark} />}
              <Text style={styles.chooseText}>{picking ? 'Opening files…' : 'Choose report file'}</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Tell Janani what it is</Text>
          <Text style={styles.sectionText}>This helps organize the record. It does not change or interpret the report.</Text>
          <View style={styles.chips}>
            {REPORT_KIND_OPTIONS.map(([value, label]) => (
              <Pressable key={value} onPress={() => setReportKind(value)} style={[styles.chip, reportKind === value && styles.chipSelected]}>
                <Text style={[styles.chipText, reportKind === value && styles.chipTextSelected]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Hospital / lab / doctor (optional)</Text>
            <TextInput
              value={providerName}
              onChangeText={setProviderName}
              maxLength={160}
              placeholder="Where this report came from"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Report date (optional)</Text>
            <Pressable onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
              <Ionicons name="calendar-outline" size={19} color={colors.roseDark} />
              <Text style={styles.dateText}>{reportDate ? reportDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Choose date'}</Text>
              {reportDate ? <Pressable onPress={() => setReportDate(null)} hitSlop={8}><Ionicons name="close-circle" size={20} color={colors.muted} /></Pressable> : null}
            </Pressable>
          </View>
          {showDatePicker ? (
            <DateTimePicker
              value={reportDate ?? new Date()}
              mode="date"
              maximumDate={new Date()}
              onChange={(_, value) => {
                if (Platform.OS === 'android') setShowDatePicker(false);
                if (value) setReportDate(value);
              }}
            />
          ) : null}
        </View>

        <View style={styles.confirmCard}>
          <Ionicons name="checkmark-done-outline" size={22} color={colors.roseDark} />
          <View style={styles.flex}>
            <Text style={styles.confirmTitle}>Machine reading is never accepted automatically</Text>
            <Text style={styles.confirmText}>If Janani later extracts values from this report, they remain proposals until you review them against the original.</Text>
          </View>
        </View>

        <Pressable disabled={!prepared || uploading || picking} onPress={() => void upload()} style={[styles.primaryButton, (!prepared || uploading || picking) && styles.disabled]}>
          {uploading ? <ActivityIndicator color={colors.surface} /> : <><Ionicons name="lock-closed-outline" size={19} color={colors.surface} /><Text style={styles.primaryText}>Store report privately</Text></>}
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
  title: { marginTop: 3, fontSize: 24, lineHeight: 30, fontWeight: '900', color: colors.ink },
  content: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl, gap: spacing.lg },
  flex: { flex: 1 },
  privacyCard: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.sageSoft },
  privacyText: { flex: 1, fontSize: 13, lineHeight: 20, color: colors.ink },
  section: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.ink },
  sectionText: { marginTop: -spacing.xs, fontSize: 12, lineHeight: 18, color: colors.muted },
  chooseButton: { minHeight: 96, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.rose, backgroundColor: colors.blush },
  chooseText: { fontSize: 14, fontWeight: '800', color: colors.roseDark },
  fileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  fileIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blush },
  fileName: { fontSize: 14, lineHeight: 19, fontWeight: '800', color: colors.ink },
  fileMeta: { marginTop: 3, fontSize: 11, color: colors.muted },
  changeButton: { minHeight: 38, justifyContent: 'center', paddingHorizontal: spacing.sm },
  changeText: { fontSize: 12, fontWeight: '800', color: colors.roseDark },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  chipSelected: { backgroundColor: colors.blush, borderColor: colors.rose },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.muted },
  chipTextSelected: { color: colors.roseDark },
  field: { gap: spacing.xs },
  fieldLabel: { fontSize: 13, fontWeight: '800', color: colors.ink },
  input: { minHeight: 50, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, color: colors.ink, fontSize: 15 },
  dateButton: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  dateText: { flex: 1, fontSize: 14, color: colors.ink },
  confirmCard: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.blush },
  confirmTitle: { fontSize: 13, fontWeight: '900', color: colors.ink },
  confirmText: { marginTop: 3, fontSize: 12, lineHeight: 18, color: colors.muted },
  primaryButton: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.pill, backgroundColor: colors.rose },
  primaryText: { color: colors.surface, fontWeight: '900', fontSize: 15 },
  disabled: { opacity: 0.5 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: colors.ink },
  emptyText: { textAlign: 'center', fontSize: 14, lineHeight: 21, color: colors.muted },
});
