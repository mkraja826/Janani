import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NotificationPermissionError, scheduleReminderNotifications } from '@/features/reminders/notifications';
import { resolveActivePregnancyId } from '@/features/pregnancy/activePregnancy';
import { formsAccountCopy } from '@/i18n/formsAccount';
import { readUiLanguage } from '@/i18n';
import { toLocalDate } from '@/lib/date';
import { isTransientError } from '@/lib/errors';
import { enqueueMutation } from '@/lib/offlineQueue';
import { supabase } from '@/lib/supabase';
import { randomUuid } from '@/lib/uuid';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

const kinds = [
  { value: 'medication', key: 'medicine', icon: 'medical-outline' },
  { value: 'hydration', key: 'water', icon: 'water-outline' },
  { value: 'appointment', key: 'appointment', icon: 'calendar-outline' },
  { value: 'nutrition', key: 'nutrition', icon: 'nutrition-outline' },
  { value: 'custom', key: 'other', icon: 'sparkles-outline' },
] as const;
function toLocalTime(value: Date) { return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`; }

export default function NewReminderScreen() {
  const { session } = useAuth();
  const [copy, setCopy] = useState(() => formsAccountCopy('en'));
  const [kind, setKind] = useState<(typeof kinds)[number]['value']>('medication');
  const [title, setTitle] = useState(''); const [instructions, setInstructions] = useState('');
  const [timeValue, setTimeValue] = useState(() => new Date(2000, 0, 1, 9, 0)); const [showTimePicker, setShowTimePicker] = useState(false);
  const [durationDays, setDurationDays] = useState('30'); const [saving, setSaving] = useState(false);
  const time = useMemo(() => toLocalTime(timeValue), [timeValue]);
  useEffect(() => { void readUiLanguage().then((language) => setCopy(formsAccountCopy(language))); }, []);
  function onTimeChange(event: DateTimePickerEvent, selected?: Date) { if (Platform.OS === 'android') setShowTimePicker(false); if (event.type !== 'dismissed' && selected) setTimeValue(selected); }

  async function save() {
    if (!session || !title.trim()) return Alert.alert('Check the reminder', 'Add a reminder title.');
    const days = Number(durationDays); if (!Number.isInteger(days) || days < 1 || days > 60) return Alert.alert('Check duration', 'Choose a duration between 1 and 60 days.');
    setSaving(true); const pregnancyId = await resolveActivePregnancyId(session.user.id);
    if (!pregnancyId) { setSaving(false); return Alert.alert('Pregnancy not available offline', 'Open Janani once with internet after pregnancy setup, then offline reminder creation will work.'); }
    const start = new Date(); const end = new Date(); end.setDate(end.getDate() + days - 1);
    const payload = { p_pregnancy_id: pregnancyId, p_client_mutation_id: randomUuid(), p_title: title.trim(), p_instructions: instructions.trim(), p_kind: kind, p_start_date: toLocalDate(start), p_end_date: toLocalDate(end), p_local_time: `${time}:00`, p_days_of_week: [0,1,2,3,4,5,6] };
    const { data: reminderId, error } = await supabase.rpc('create_reminder_idempotent', payload);
    if (error || typeof reminderId !== 'string') { if (error && !isTransientError(error)) { setSaving(false); Alert.alert('Could not save reminder', error.message); return; } await enqueueMutation(session.user.id, 'reminder_create', payload); setSaving(false); Alert.alert('Saved on this phone', 'Janani will create this reminder and enable its phone alert when the connection returns.'); router.replace('/reminders'); return; }
    let notificationStatus: 'enabled'|'permission-denied'|'failed' = 'enabled';
    try { await scheduleReminderNotifications(session.user.id, { id: reminderId, title: title.trim(), instructions: instructions.trim() || null, localTime: `${time}:00`, startDate: payload.p_start_date, endDate: payload.p_end_date, daysOfWeek: payload.p_days_of_week }); } catch (notificationError) { notificationStatus = notificationError instanceof NotificationPermissionError ? 'permission-denied' : 'failed'; }
    setSaving(false); Alert.alert('Reminder saved', notificationStatus === 'enabled' ? 'Janani will nudge gently around the preferred time. Android may delay non-urgent alerts to protect battery life.' : notificationStatus === 'permission-denied' ? 'The care reminder is saved, but phone alerts are off. Enable notifications in device settings to receive them.' : 'The care reminder is saved, but this phone could not schedule its alert. Reopen Janani or edit the reminder to try again.', [{ text: 'View reminders', onPress: () => router.replace('/reminders') }]);
  }

  const labelForKind = (key: (typeof kinds)[number]['key']) => copy[key];
  return <SafeAreaView style={styles.page}><View style={styles.header}><Pressable onPress={() => router.back()} style={styles.iconButton}><Ionicons name="close" size={23} color={colors.ink} /></Pressable><View style={styles.headerCopy}><Text style={styles.eyebrow}>{copy.newReminderEyebrow}</Text><Text style={styles.title}>{copy.newReminderTitle}</Text></View></View><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={styles.label}>{copy.type}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kindRow}>{kinds.map((item) => <Pressable key={item.value} onPress={() => setKind(item.value)} style={[styles.kind, kind === item.value && styles.kindActive]}><Ionicons name={item.icon} size={21} color={kind === item.value ? colors.surface : colors.rose} /><Text style={[styles.kindText, kind === item.value && styles.kindTextActive]}>{labelForKind(item.key)}</Text></Pressable>)}</ScrollView>
    <Field label={kind === 'medication' ? copy.medicineName : copy.reminderTitle} value={title} onChangeText={setTitle} placeholder={kind === 'medication' ? 'Example: Iron tablet' : 'Example: Drink water'} />
    <Field label={copy.instructionsOptional} value={instructions} onChangeText={setInstructions} placeholder="Example: After breakfast, as prescribed" multiline />
    <View style={styles.split}><View style={styles.flex}><Text style={styles.label}>{copy.preferredDailyTime}</Text><Pressable onPress={() => setShowTimePicker(true)} style={styles.timeButton}><Ionicons name="time-outline" size={21} color={colors.rose} /><Text style={styles.timeText}>{timeValue.toLocaleTimeString([], { hour:'numeric', minute:'2-digit' })}</Text></Pressable></View><View style={styles.flex}><Field label={copy.forHowManyDays} value={durationDays} onChangeText={setDurationDays} placeholder="30" keyboardType="number-pad" /></View></View>
    {showTimePicker && <DateTimePicker value={timeValue} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onTimeChange} />}
    <View style={styles.safetyCard}><Ionicons name="shield-checkmark-outline" size={22} color={colors.sage} /><Text style={styles.safetyText}>Janani remembers what the family enters. Medicine name, dose, and duration should follow the prescribing doctor’s advice.</Text></View>
    <Pressable disabled={saving} onPress={save} style={styles.saveButton}>{saving ? <ActivityIndicator color={colors.surface} /> : <><Text style={styles.saveText}>{copy.saveDailyReminder}</Text><Ionicons name="checkmark-circle-outline" size={21} color={colors.surface} /></>}</Pressable>
  </ScrollView></SafeAreaView>;
}
function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput placeholderTextColor={colors.muted} style={[styles.input, props.multiline && styles.multiline]} {...props} /></View>; }
const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},header:{flexDirection:'row',alignItems:'flex-start',gap:spacing.md,padding:spacing.lg},iconButton:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},headerCopy:{flex:1},eyebrow:{fontSize:11,letterSpacing:1.8,fontWeight:'800',color:colors.rose},title:{marginTop:4,fontSize:27,lineHeight:33,fontWeight:'800',color:colors.ink},content:{paddingHorizontal:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.lg},label:{marginBottom:spacing.sm,fontSize:13,fontWeight:'800',color:colors.roseDark},kindRow:{gap:spacing.sm},kind:{minWidth:100,minHeight:48,paddingHorizontal:spacing.md,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm,borderRadius:radius.pill,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},kindActive:{backgroundColor:colors.rose,borderColor:colors.rose},kindText:{fontSize:13,fontWeight:'700',color:colors.roseDark},kindTextActive:{color:colors.surface},field:{flex:1},input:{minHeight:54,paddingHorizontal:spacing.md,borderRadius:radius.md,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,fontSize:16,color:colors.ink},multiline:{minHeight:100,paddingTop:spacing.md,textAlignVertical:'top'},split:{flexDirection:'row',gap:spacing.md},flex:{flex:1},timeButton:{minHeight:54,paddingHorizontal:spacing.md,flexDirection:'row',alignItems:'center',gap:spacing.sm,borderRadius:radius.md,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},timeText:{fontSize:16,fontWeight:'700',color:colors.ink},safetyCard:{flexDirection:'row',gap:spacing.md,padding:spacing.md,borderRadius:radius.md,backgroundColor:colors.sageSoft},safetyText:{flex:1,fontSize:13,lineHeight:19,color:colors.muted},saveButton:{minHeight:56,borderRadius:radius.pill,backgroundColor:colors.rose,flexDirection:'row',gap:spacing.sm,alignItems:'center',justifyContent:'center'},saveText:{fontSize:16,fontWeight:'800',color:colors.surface}});
