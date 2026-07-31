import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { scheduleDailyReminder } from '@/features/reminders/notifications';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

const kinds = [
  { value: 'medication', label: 'Medicine', icon: 'medical-outline' },
  { value: 'hydration', label: 'Water', icon: 'water-outline' },
  { value: 'appointment', label: 'Appointment', icon: 'calendar-outline' },
  { value: 'nutrition', label: 'Nutrition', icon: 'nutrition-outline' },
  { value: 'custom', label: 'Other', icon: 'sparkles-outline' },
] as const;

export default function NewReminderScreen() {
  const { session } = useAuth();
  const [kind, setKind] = useState<(typeof kinds)[number]['value']>('medication');
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [time, setTime] = useState('09:00');
  const [durationDays, setDurationDays] = useState('30');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!session || !title.trim() || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      Alert.alert('Check the reminder', 'Add a title and use time in 24-hour HH:MM format, for example 09:00.');
      return;
    }

    const days = Number(durationDays);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      Alert.alert('Check duration', 'Choose a duration between 1 and 365 days.');
      return;
    }

    setSaving(true);
    const { data: memberships, error: membershipError } = await supabase
      .from('family_members')
      .select('families(pregnancies(id, status))')
      .eq('user_id', session.user.id)
      .maybeSingle();

    const family = Array.isArray(memberships?.families) ? memberships?.families[0] : memberships?.families;
    const pregnancies = family?.pregnancies;
    const pregnancy = (Array.isArray(pregnancies) ? pregnancies : pregnancies ? [pregnancies] : []).find((item) => item.status === 'active');

    if (membershipError || !pregnancy) {
      Alert.alert('Pregnancy not found', membershipError?.message ?? 'Complete pregnancy setup before adding reminders.');
      setSaving(false);
      return;
    }

    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days - 1);

    const { data: reminder, error } = await supabase
      .from('reminders')
      .insert({
        pregnancy_id: pregnancy.id,
        created_by: session.user.id,
        title: title.trim(),
        instructions: instructions.trim() || null,
        kind,
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
        local_time: `${time}:00`,
        days_of_week: [0, 1, 2, 3, 4, 5, 6],
      })
      .select('id')
      .single();

    if (error || !reminder) {
      Alert.alert('Could not save reminder', error?.message ?? 'Please try again.');
      setSaving(false);
      return;
    }

    try {
      const notificationIdentifier = await scheduleDailyReminder(title.trim(), instructions.trim() || null, time);
      if (notificationIdentifier) {
        await supabase.from('reminders').update({ notification_identifier: notificationIdentifier }).eq('id', reminder.id);
      }
    } catch {
      Alert.alert('Reminder saved', 'The reminder is in Janani, but phone notifications could not be enabled. You can allow notifications later in device settings.');
    }

    setSaving(false);
    router.replace('/reminders');
  }

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}><Ionicons name="close" size={23} color={colors.ink} /></Pressable>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>NEW CARE ROUTINE</Text><Text style={styles.title}>What shall I remember?</Text></View>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kindRow}>
          {kinds.map((item) => (
            <Pressable key={item.value} onPress={() => setKind(item.value)} style={[styles.kind, kind === item.value && styles.kindActive]}>
              <Ionicons name={item.icon} size={21} color={kind === item.value ? colors.surface : colors.rose} />
              <Text style={[styles.kindText, kind === item.value && styles.kindTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Field label={kind === 'medication' ? 'Medicine name' : 'Reminder title'} value={title} onChangeText={setTitle} placeholder={kind === 'medication' ? 'Example: Iron tablet' : 'Example: Drink water'} />
        <Field label="Instructions (optional)" value={instructions} onChangeText={setInstructions} placeholder="Example: After breakfast, as prescribed" multiline />
        <View style={styles.split}>
          <View style={styles.flex}><Field label="Daily time" value={time} onChangeText={setTime} placeholder="09:00" keyboardType="numbers-and-punctuation" /></View>
          <View style={styles.flex}><Field label="For how many days" value={durationDays} onChangeText={setDurationDays} placeholder="30" keyboardType="number-pad" /></View>
        </View>

        <View style={styles.safetyCard}>
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.sage} />
          <Text style={styles.safetyText}>Janani remembers what the family enters. Medicine name, dose, and duration should follow the prescribing doctor’s advice.</Text>
        </View>

        <Pressable disabled={saving} onPress={save} style={styles.saveButton}>
          {saving ? <ActivityIndicator color={colors.surface} /> : <><Text style={styles.saveText}>Save daily reminder</Text><Ionicons name="checkmark-circle-outline" size={21} color={colors.surface} /></>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput placeholderTextColor={colors.muted} style={[styles.input, props.multiline && styles.multiline]} {...props} /></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.lg },
  iconButton: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 11, letterSpacing: 1.8, fontWeight: '800', color: colors.rose },
  title: { marginTop: 4, fontSize: 27, lineHeight: 33, fontWeight: '800', color: colors.ink },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  label: { marginBottom: spacing.sm, fontSize: 13, fontWeight: '800', color: colors.roseDark },
  kindRow: { gap: spacing.sm },
  kind: { minWidth: 100, minHeight: 48, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  kindActive: { backgroundColor: colors.rose, borderColor: colors.rose },
  kindText: { fontSize: 13, fontWeight: '700', color: colors.roseDark },
  kindTextActive: { color: colors.surface },
  field: { flex: 1 },
  input: { minHeight: 54, paddingHorizontal: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, fontSize: 16, color: colors.ink },
  multiline: { minHeight: 100, paddingTop: spacing.md, textAlignVertical: 'top' },
  split: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  safetyCard: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.sageSoft },
  safetyText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.muted },
  saveButton: { minHeight: 56, borderRadius: radius.pill, backgroundColor: colors.rose, flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 16, fontWeight: '800', color: colors.surface },
});
