import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { deleteCareMedication, loadPrivateCareContext, saveCareMedication, savePrivateCareContext, type CareMedication, type MedicationKind, type SupportedLanguage } from '@/features/profile/careContext';
import { resolveActivePregnancyId } from '@/features/pregnancy/activePregnancy';
import { type MessageKey } from '@/i18n';
import { tg } from '@/i18n/globalUi';
import { getLocaleDefinition, searchLocales } from '@/i18n/localeRegistry';
import { writeGlobalUiLocale } from '@/i18n/uiLocale';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

export default function CareContextScreen() {
  const { session } = useAuth();
  const [pregnancyId, setPregnancyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [languageQuery, setLanguageQuery] = useState('');
  const [showLanguages, setShowLanguages] = useState(false);
  const [region, setRegion] = useState('');
  const [clinicianInstructions, setClinicianInstructions] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [pregnancyHistory, setPregnancyHistory] = useState('');
  const [shareTimeline, setShareTimeline] = useState(false);
  const [shareProgress, setShareProgress] = useState(true);
  const [medications, setMedications] = useState<CareMedication[]>([]);
  const [kind, setKind] = useState<MedicationKind>('medication');
  const [name, setName] = useState('');
  const [strength, setStrength] = useState('');
  const [schedule, setSchedule] = useState('');
  const [medInstructions, setMedInstructions] = useState('');
  const tr = (key: MessageKey) => tg(language, key);
  const selectedLocale = getLocaleDefinition(language);
  const localeResults = useMemo(() => searchLocales(languageQuery), [languageQuery]);

  async function load() {
    const userId = session?.user.id;
    if (!userId) return;
    try {
      const id = await resolveActivePregnancyId(userId);
      if (!id) throw new Error('No active pregnancy was found.');
      const context = await loadPrivateCareContext(id);
      setPregnancyId(id);
      setLanguage(context.preferred_language);
      await writeGlobalUiLocale(context.preferred_language);
      setRegion(context.region_preference ?? '');
      setClinicianInstructions(context.broader_clinician_instructions ?? '');
      setMedicalHistory(context.relevant_medical_history ?? '');
      setPregnancyHistory(context.previous_pregnancy_history ?? '');
      setShareTimeline(context.share_care_timeline_with_partner);
      setShareProgress(context.share_pregnancy_progress_with_partner);
      setMedications(context.medications);
    } catch (error) {
      Alert.alert('Care context unavailable', error instanceof Error ? error.message : 'Please try again.');
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [session?.user.id]);

  async function changeLanguage(next: SupportedLanguage) {
    setLanguage(next);
    setShowLanguages(false);
    setLanguageQuery('');
    await writeGlobalUiLocale(next);
  }

  async function saveContext() {
    if (!pregnancyId || saving) return;
    setSaving(true);
    try {
      await savePrivateCareContext(pregnancyId, {
        preferred_language: language,
        region_preference: region.trim() || null,
        broader_clinician_instructions: clinicianInstructions.trim() || null,
        relevant_medical_history: medicalHistory.trim() || null,
        previous_pregnancy_history: pregnancyHistory.trim() || null,
        share_care_timeline_with_partner: shareTimeline,
        share_pregnancy_progress_with_partner: shareProgress,
      });
      await writeGlobalUiLocale(language);
      Alert.alert(tr('saved'), tr('savedBody'));
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Please try again.');
    } finally { setSaving(false); }
  }

  async function addMedication() {
    if (!pregnancyId || !name.trim()) return;
    try {
      await saveCareMedication(pregnancyId, { kind, name: name.trim(), strength: strength.trim() || null, schedule_text: schedule.trim() || null, clinician_instructions: medInstructions.trim() || null, active: true });
      setName(''); setStrength(''); setSchedule(''); setMedInstructions('');
      await load();
    } catch (error) { Alert.alert('Could not save', error instanceof Error ? error.message : 'Please try again.'); }
  }

  async function removeMedication(item: CareMedication) {
    if (!pregnancyId) return;
    try { await deleteCareMedication(pregnancyId, item.id); await load(); }
    catch (error) { Alert.alert('Could not delete', error instanceof Error ? error.message : 'Please try again.'); }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.rose} /></View>;

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><Pressable accessibilityLabel="Back" onPress={() => router.back()} style={styles.iconButton}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable><View style={styles.flex}><Text style={styles.eyebrow}>{tr('careContextEyebrow')}</Text><Text style={styles.title}>{tr('careContextTitle')}</Text></View></View>
    <View style={styles.notice}><Ionicons name="lock-closed-outline" size={22} color={colors.roseDark} /><Text style={styles.noticeText}>{tr('careContextNotice')}</Text></View>

    <Section title={tr('languageRegion')}>
      <Pressable onPress={() => setShowLanguages((value) => !value)} style={styles.languageSelector}>
        <View style={styles.flex}><Text style={styles.languageName}>{selectedLocale.nativeName}</Text><Text style={styles.languageMeta}>{selectedLocale.englishName} · {selectedLocale.code} · {selectedLocale.direction.toUpperCase()}</Text></View>
        <Ionicons name={showLanguages ? 'chevron-up' : 'chevron-down'} size={20} color={colors.roseDark} />
      </Pressable>
      {selectedLocale.uiStatus === 'fallback' ? <View style={styles.localeNotice}><Ionicons name="language-outline" size={18} color={colors.roseDark} /><Text style={styles.localeNoticeText}>Janani will save {selectedLocale.englishName} as your preferred Care+ language. Until a reviewed native UI pack is available, app controls fall back to English.</Text></View> : null}
      {showLanguages ? <View style={styles.languagePanel}>
        <TextInput value={languageQuery} onChangeText={setLanguageQuery} placeholder="Search any language" placeholderTextColor={colors.muted} style={styles.languageSearch} autoCapitalize="none" />
        <View style={styles.languageList}>{localeResults.map((item) => <Pressable key={item.code} onPress={() => void changeLanguage(item.code)} style={[styles.languageOption, item.code === language && styles.languageOptionSelected]}>
          <View style={styles.flex}><Text style={styles.languageName}>{item.nativeName}</Text><Text style={styles.languageMeta}>{item.englishName} · {item.code}{item.direction === 'rtl' ? ' · RTL' : ''}</Text></View>
          <View style={[styles.statusDot, item.uiStatus !== 'fallback' && styles.statusDotReady]} />
        </Pressable>)}</View>
      </View> : null}
      <Field label={tr('regionPreference')} value={region} onChangeText={setRegion} placeholder="Telangana, Andhra, North Indian…" maxLength={120} />
    </Section>

    <Section title={tr('medicalPregnancyHistory')}>
      <Field label={tr('relevantMedicalHistory')} value={medicalHistory} onChangeText={setMedicalHistory} multiline maxLength={4000} />
      <Field label={tr('previousPregnancyHistory')} value={pregnancyHistory} onChangeText={setPregnancyHistory} multiline maxLength={4000} />
      <Field label={tr('broaderClinicianInstructions')} value={clinicianInstructions} onChangeText={setClinicianInstructions} multiline maxLength={4000} />
    </Section>

    <Section title={tr('medicationsSupplements')} subtitle={tr('medicationSafety')}>
      <View style={styles.row}><Pressable onPress={() => setKind('medication')} style={[styles.pill, kind === 'medication' && styles.pillSelected]}><Text style={[styles.pillText, kind === 'medication' && styles.pillTextSelected]}>{tr('medication')}</Text></Pressable><Pressable onPress={() => setKind('supplement')} style={[styles.pill, kind === 'supplement' && styles.pillSelected]}><Text style={[styles.pillText, kind === 'supplement' && styles.pillTextSelected]}>{tr('supplement')}</Text></Pressable></View>
      <Field label={tr('name')} value={name} onChangeText={setName} maxLength={160} />
      <Field label={tr('strength')} value={strength} onChangeText={setStrength} maxLength={120} />
      <Field label={tr('schedule')} value={schedule} onChangeText={setSchedule} maxLength={500} />
      <Field label={tr('clinicianInstructions')} value={medInstructions} onChangeText={setMedInstructions} multiline maxLength={2000} />
      <Pressable onPress={() => void addMedication()} disabled={!name.trim()} style={[styles.secondaryButton, !name.trim() && styles.disabled]}><Text style={styles.secondaryText}>{tr('addCareContext')}</Text></Pressable>
      {medications.map((item) => <View key={item.id} style={styles.medCard}><View style={styles.flex}><Text style={styles.medName}>{item.name}</Text><Text style={styles.medMeta}>{item.kind}{item.strength ? ` · ${item.strength}` : ''}{item.schedule_text ? ` · ${item.schedule_text}` : ''}</Text></View><Pressable accessibilityLabel={`Delete ${item.name}`} onPress={() => void removeMedication(item)}><Ionicons name="trash-outline" size={20} color={colors.roseDark} /></Pressable></View>)}
    </Section>

    <Section title={tr('partnerSharing')}>
      <ToggleRow label={tr('sharePregnancyProgress')} value={shareProgress} onValueChange={setShareProgress} />
      <ToggleRow label={tr('shareCareTimeline')} value={shareTimeline} onValueChange={setShareTimeline} />
      <Text style={styles.helper}>{tr('partnerPrivateNote')}</Text>
    </Section>

    <Pressable disabled={saving} onPress={() => void saveContext()} style={[styles.save, saving && styles.disabled]}>{saving ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.saveText}>{tr('saveCareContext')}</Text>}</Pressable>
  </ScrollView></SafeAreaView>;
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) { return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}<View style={styles.sectionBody}>{children}</View></View>; }
function Field({ label, ...props }: React.ComponentProps<typeof TextInput> & { label: string }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} placeholderTextColor={colors.muted} style={[styles.input, props.multiline && styles.multiline]} /></View>; }
function ToggleRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }) { return <View style={styles.toggleRow}><Text style={styles.label}>{label}</Text><Switch value={value} onValueChange={onValueChange} /></View>; }

const styles = StyleSheet.create({page:{flex:1,backgroundColor:colors.background},center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.lg},header:{flexDirection:'row',gap:spacing.md,alignItems:'flex-start'},flex:{flex:1},iconButton:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},eyebrow:{fontSize:12,letterSpacing:1.5,fontWeight:'800',color:colors.rose},title:{marginTop:spacing.xs,fontSize:28,lineHeight:35,fontWeight:'900',color:colors.ink},notice:{flexDirection:'row',gap:spacing.sm,padding:spacing.md,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},noticeText:{flex:1,fontSize:13,lineHeight:20,color:colors.muted},card:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},cardTitle:{fontSize:18,fontWeight:'900',color:colors.ink},subtitle:{marginTop:spacing.xs,fontSize:13,lineHeight:19,color:colors.muted},sectionBody:{marginTop:spacing.md,gap:spacing.md},field:{gap:spacing.sm},label:{fontSize:14,fontWeight:'800',color:colors.ink},input:{minHeight:50,paddingHorizontal:spacing.md,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.background,color:colors.ink,fontSize:15},multiline:{minHeight:110,paddingTop:spacing.md,textAlignVertical:'top'},row:{flexDirection:'row',flexWrap:'wrap',gap:spacing.sm},pill:{minHeight:38,justifyContent:'center',paddingHorizontal:spacing.md,borderRadius:radius.pill,borderWidth:1,borderColor:colors.border,backgroundColor:colors.background},pillSelected:{borderColor:colors.rose,backgroundColor:colors.blush},pillText:{fontSize:13,fontWeight:'700',color:colors.muted},pillTextSelected:{color:colors.roseDark},secondaryButton:{minHeight:48,alignItems:'center',justifyContent:'center',borderRadius:radius.pill,borderWidth:1,borderColor:colors.rose},secondaryText:{fontWeight:'800',color:colors.roseDark},medCard:{flexDirection:'row',gap:spacing.md,alignItems:'center',padding:spacing.md,borderRadius:radius.md,backgroundColor:colors.background,borderWidth:1,borderColor:colors.border},medName:{fontSize:15,fontWeight:'800',color:colors.ink},medMeta:{marginTop:3,fontSize:12,lineHeight:18,color:colors.muted},toggleRow:{minHeight:48,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:spacing.md},helper:{fontSize:12,lineHeight:18,color:colors.muted},save:{minHeight:54,borderRadius:radius.pill,backgroundColor:colors.rose,alignItems:'center',justifyContent:'center'},saveText:{fontSize:16,fontWeight:'900',color:colors.surface},disabled:{opacity:.5},languageSelector:{minHeight:58,flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.md,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.background},languageName:{fontSize:15,fontWeight:'800',color:colors.ink},languageMeta:{marginTop:2,fontSize:11,color:colors.muted},localeNotice:{flexDirection:'row',gap:spacing.sm,padding:spacing.md,borderRadius:radius.md,backgroundColor:colors.blush},localeNoticeText:{flex:1,fontSize:12,lineHeight:18,color:colors.roseDark},languagePanel:{gap:spacing.sm},languageSearch:{minHeight:48,paddingHorizontal:spacing.md,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.background,color:colors.ink},languageList:{maxHeight:440,gap:4},languageOption:{minHeight:54,flexDirection:'row',alignItems:'center',gap:spacing.sm,paddingHorizontal:spacing.md,borderRadius:radius.md,backgroundColor:colors.background},languageOptionSelected:{backgroundColor:colors.blush},statusDot:{width:8,height:8,borderRadius:4,backgroundColor:colors.border},statusDotReady:{backgroundColor:colors.sage}});