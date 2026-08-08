import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  APPOINTMENT_TYPES,
  AppointmentStatus,
  AppointmentType,
  CareAppointment,
  deleteCareAppointment,
  joinLines,
  listCareAppointments,
  saveCareAppointment,
  splitList,
} from '@/features/care/careTimeline';
import { resolveActivePregnancyId } from '@/features/pregnancy/activePregnancy';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

type PickerField = 'date' | 'time' | 'followup' | null;

const STATUS_OPTIONS: ReadonlyArray<{ value: AppointmentStatus; label: string }> = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function CareTimelineScreen() {
  const { session } = useAuth();
  const [pregnancyId, setPregnancyId] = useState<string | null>(null);
  const [items, setItems] = useState<CareAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<AppointmentType>('doctor_visit');
  const [status, setStatus] = useState<AppointmentStatus>('scheduled');
  const [scheduledAt, setScheduledAt] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [provider, setProvider] = useState('');
  const [facility, setFacility] = useState('');
  const [purpose, setPurpose] = useState('');
  const [questions, setQuestions] = useState('');
  const [notesAfter, setNotesAfter] = useState('');
  const [tests, setTests] = useState('');
  const [followup, setFollowup] = useState<Date | null>(null);
  const [picker, setPicker] = useState<PickerField>(null);

  const load = useCallback(async () => {
    const userId = session?.user.id;
    if (!userId) return;
    setLoading(true);
    try {
      const resolved = await resolveActivePregnancyId(userId);
      if (!resolved) throw new Error('No active pregnancy was found.');
      setPregnancyId(resolved);
      setItems(await listCareAppointments(resolved));
    } catch (error) {
      Alert.alert('Care timeline unavailable', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  function resetForm() {
    setEditingId(null);
    setType('doctor_visit');
    setStatus('scheduled');
    setScheduledAt(new Date(Date.now() + 24 * 60 * 60 * 1000));
    setProvider('');
    setFacility('');
    setPurpose('');
    setQuestions('');
    setNotesAfter('');
    setTests('');
    setFollowup(null);
    setPicker(null);
  }

  function edit(item: CareAppointment) {
    setEditingId(item.id);
    setType(item.appointment_type);
    setStatus(item.status);
    setScheduledAt(new Date(item.scheduled_at));
    setProvider(item.provider_name ?? '');
    setFacility(item.facility_name ?? '');
    setPurpose(item.purpose ?? '');
    setQuestions(joinLines(item.questions));
    setNotesAfter(item.notes_after ?? '');
    setTests(joinLines(item.tests_prescribed));
    setFollowup(item.next_followup_at ? new Date(item.next_followup_at) : null);
  }

  async function save() {
    if (!pregnancyId || saving) return;
    if (purpose.length > 500 || notesAfter.length > 4000 || provider.length > 120 || facility.length > 160) {
      Alert.alert('Check the details', 'One or more fields are longer than Janani can safely store.');
      return;
    }
    setSaving(true);
    try {
      await saveCareAppointment(pregnancyId, {
        ...(editingId ? { id: editingId } : {}),
        appointment_type: type,
        scheduled_at: scheduledAt.toISOString(),
        provider_name: provider.trim() || null,
        facility_name: facility.trim() || null,
        purpose: purpose.trim() || null,
        questions: splitList(questions),
        notes_after: notesAfter.trim() || null,
        tests_prescribed: splitList(tests),
        next_followup_at: followup?.toISOString() ?? null,
        status,
      });
      resetForm();
      await load();
      Alert.alert('Saved', 'Your care timeline has been updated.');
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(item: CareAppointment) {
    if (!pregnancyId) return;
    Alert.alert('Delete this entry?', 'Use this only to correct an entry you no longer want in your timeline.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          void deleteCareAppointment(pregnancyId, item.id)
            .then(load)
            .catch((error) => Alert.alert('Could not delete', error instanceof Error ? error.message : 'Please try again.'));
        },
      },
    ]);
  }

  function onPickerChange(_: unknown, value?: Date) {
    if (Platform.OS === 'android') setPicker(null);
    if (!value || !picker) return;
    if (picker === 'followup') {
      setFollowup(value);
      return;
    }
    const next = new Date(scheduledAt);
    if (picker === 'date') {
      next.setFullYear(value.getFullYear(), value.getMonth(), value.getDate());
    } else {
      next.setHours(value.getHours(), value.getMinutes(), 0, 0);
    }
    setScheduledAt(next);
  }

  if (loading && !pregnancyId) {
    return <View style={styles.center}><ActivityIndicator color={colors.rose} /></View>;
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </Pressable>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>CARE TIMELINE</Text>
            <Text style={styles.title}>Keep visits, scans and follow-ups in one place.</Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Ionicons name="calendar-clear-outline" size={22} color={colors.roseDark} />
          <Text style={styles.noticeText}>This timeline organizes information you enter. It does not decide which tests, scans or appointments you need.</Text>
        </View>

        <Section title={editingId ? 'Edit timeline entry' : 'Add to your timeline'}>
          <Text style={styles.label}>Type</Text>
          <ChoiceRow items={APPOINTMENT_TYPES} value={type} onChange={setType} />
          <View style={styles.dateRow}>
            <DateButton label="Date" value={scheduledAt.toLocaleDateString()} onPress={() => setPicker('date')} />
            <DateButton label="Time" value={scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} onPress={() => setPicker('time')} />
          </View>
          <Field label="Doctor / provider" value={provider} onChangeText={setProvider} placeholder="Optional" maxLength={120} />
          <Field label="Hospital / clinic / lab" value={facility} onChangeText={setFacility} placeholder="Optional" maxLength={160} />
          <Field label="Purpose" value={purpose} onChangeText={setPurpose} placeholder="Routine visit, scan review..." maxLength={500} />
          <Field label="Questions to ask" value={questions} onChangeText={setQuestions} placeholder="One question per line" multiline />
          <Text style={styles.label}>Status</Text>
          <ChoiceRow items={STATUS_OPTIONS} value={status} onChange={setStatus} />
          {status === 'completed' ? <>
            <Field label="Notes after the visit" value={notesAfter} onChangeText={setNotesAfter} placeholder="What did your care team tell you?" multiline maxLength={4000} />
            <Field label="Tests or scans prescribed" value={tests} onChangeText={setTests} placeholder="One item per line" multiline />
            <DateButton label="Next follow-up" value={followup ? followup.toLocaleDateString() : 'Not set'} onPress={() => setPicker('followup')} />
          </> : null}
          {followup ? <Pressable onPress={() => setFollowup(null)}><Text style={styles.clearText}>Clear follow-up date</Text></Pressable> : null}
          <View style={styles.actionRow}>
            {editingId ? <Pressable onPress={resetForm} style={styles.secondaryButton}><Text style={styles.secondaryText}>Cancel edit</Text></Pressable> : null}
            <Pressable disabled={saving} onPress={() => void save()} style={[styles.saveButton, saving && styles.disabled]}>
              {saving ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.saveText}>{editingId ? 'Update entry' : 'Save entry'}</Text>}
            </Pressable>
          </View>
        </Section>

        <Section title="Your timeline">
          {items.length === 0 ? <Text style={styles.empty}>No appointments or scans have been added yet.</Text> : items.map((item) => {
            const typeLabel = APPOINTMENT_TYPES.find((option) => option.value === item.appointment_type)?.label ?? 'Care';
            return <View key={item.id} style={styles.timelineCard}>
              <View style={styles.timelineTop}>
                <View style={styles.flex}>
                  <Text style={styles.timelineType}>{typeLabel}</Text>
                  <Text style={styles.timelineDate}>{new Date(item.scheduled_at).toLocaleString()}</Text>
                </View>
                <Text style={styles.status}>{item.status}</Text>
              </View>
              {item.purpose ? <Text style={styles.timelinePurpose}>{item.purpose}</Text> : null}
              {item.provider_name || item.facility_name ? <Text style={styles.timelineMeta}>{[item.provider_name, item.facility_name].filter(Boolean).join(' · ')}</Text> : null}
              {item.questions.length ? <Text style={styles.timelineMeta}>{item.questions.length} question{item.questions.length === 1 ? '' : 's'} prepared</Text> : null}
              {item.next_followup_at ? <Text style={styles.followup}>Next follow-up: {new Date(item.next_followup_at).toLocaleDateString()}</Text> : null}
              <View style={styles.rowActions}>
                <Pressable onPress={() => edit(item)}><Text style={styles.editText}>Edit</Text></Pressable>
                <Pressable onPress={() => confirmDelete(item)}><Text style={styles.deleteText}>Delete</Text></Pressable>
              </View>
            </View>;
          })}
        </Section>

        <Text style={styles.disclaimer}>Always follow your maternity care team’s schedule and instructions. Janani is an organizer, not a clinical decision-maker.</Text>
      </ScrollView>

      {picker ? <DateTimePicker
        value={picker === 'followup' ? followup ?? new Date() : scheduledAt}
        mode={picker === 'time' ? 'time' : 'date'}
        onChange={onPickerChange}
      /> : null}
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><View style={styles.sectionBody}>{children}</View></View>;
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, ...inputProps } = props;
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...inputProps} placeholderTextColor={colors.muted} style={[styles.input, inputProps.multiline && styles.multiline]} /></View>;
}

function DateButton({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.dateButton}><Text style={styles.dateLabel}>{label}</Text><Text style={styles.dateValue}>{value}</Text></Pressable>;
}

function ChoiceRow<T extends string>({ items, value, onChange }: { items: ReadonlyArray<{ value: T; label: string }>; value: T; onChange: (value: T) => void }) {
  return <View style={styles.choiceRow}>{items.map((item) => {
    const selected = item.value === value;
    return <Pressable key={item.value} onPress={() => onChange(item.value)} style={[styles.choice, selected && styles.choiceSelected]}><Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{item.label}</Text></Pressable>;
  })}</View>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.xl},headerRow:{flexDirection:'row',alignItems:'flex-start',gap:spacing.md},iconButton:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},flex:{flex:1},eyebrow:{fontSize:12,letterSpacing:2.2,fontWeight:'800',color:colors.rose},title:{marginTop:spacing.sm,fontSize:29,lineHeight:36,fontWeight:'800',color:colors.ink},notice:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},noticeText:{flex:1,fontSize:13,lineHeight:20,color:colors.muted},section:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},sectionTitle:{fontSize:19,fontWeight:'800',color:colors.ink},sectionBody:{marginTop:spacing.lg,gap:spacing.md},field:{gap:spacing.sm},label:{fontSize:14,fontWeight:'700',color:colors.ink},input:{minHeight:52,paddingHorizontal:spacing.md,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.background,color:colors.ink,fontSize:15},multiline:{minHeight:100,paddingTop:spacing.md,textAlignVertical:'top'},choiceRow:{flexDirection:'row',flexWrap:'wrap',gap:spacing.sm},choice:{minHeight:40,justifyContent:'center',paddingHorizontal:spacing.md,borderRadius:radius.pill,borderWidth:1,borderColor:colors.border,backgroundColor:colors.background},choiceSelected:{borderColor:colors.rose,backgroundColor:colors.blush},choiceText:{fontSize:12,fontWeight:'700',color:colors.muted},choiceTextSelected:{color:colors.roseDark},dateRow:{flexDirection:'row',gap:spacing.md},dateButton:{flex:1,minHeight:58,padding:spacing.md,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.background},dateLabel:{fontSize:11,fontWeight:'700',color:colors.muted},dateValue:{marginTop:4,fontSize:14,fontWeight:'800',color:colors.ink},clearText:{fontSize:13,fontWeight:'700',color:colors.roseDark},actionRow:{flexDirection:'row',gap:spacing.md,justifyContent:'flex-end'},saveButton:{minHeight:50,minWidth:130,alignItems:'center',justifyContent:'center',paddingHorizontal:spacing.lg,borderRadius:radius.pill,backgroundColor:colors.rose},saveText:{fontWeight:'800',color:colors.surface},secondaryButton:{minHeight:50,alignItems:'center',justifyContent:'center',paddingHorizontal:spacing.lg,borderRadius:radius.pill,borderWidth:1,borderColor:colors.border},secondaryText:{fontWeight:'800',color:colors.roseDark},disabled:{opacity:0.6},empty:{fontSize:14,lineHeight:21,color:colors.muted},timelineCard:{padding:spacing.md,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.background,gap:spacing.sm},timelineTop:{flexDirection:'row',gap:spacing.md,alignItems:'flex-start'},timelineType:{fontSize:15,fontWeight:'800',color:colors.ink},timelineDate:{marginTop:2,fontSize:12,color:colors.muted},status:{fontSize:11,fontWeight:'800',textTransform:'uppercase',color:colors.roseDark},timelinePurpose:{fontSize:14,lineHeight:20,color:colors.ink},timelineMeta:{fontSize:12,lineHeight:18,color:colors.muted},followup:{fontSize:12,fontWeight:'700',color:colors.roseDark},rowActions:{flexDirection:'row',gap:spacing.lg,marginTop:spacing.xs},editText:{fontSize:13,fontWeight:'800',color:colors.roseDark},deleteText:{fontSize:13,fontWeight:'800',color:colors.rose},disclaimer:{textAlign:'center',fontSize:12,lineHeight:18,color:colors.muted},
});
