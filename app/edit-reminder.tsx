import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { cancelReminderNotification, scheduleDailyReminder } from '@/features/reminders/notifications';
import { supabase } from '@/lib/supabase';
import { colors, radius, spacing } from '@/theme/tokens';

export default function EditReminderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [time, setTime] = useState('09:00');
  const [oldIdentifier, setOldIdentifier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('reminders').select('title,instructions,local_time,notification_identifier').eq('id', id).single();
      if (error || !data) { Alert.alert('Reminder unavailable', error?.message ?? 'This reminder could not be found.'); router.back(); return; }
      setTitle(data.title); setInstructions(data.instructions ?? ''); setTime(data.local_time.slice(0, 5)); setOldIdentifier(data.notification_identifier); setLoading(false);
    }
    if (id) load();
  }, [id]);

  async function save() {
    if (!title.trim() || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) { Alert.alert('Check reminder', 'Add a title and a valid HH:MM time.'); return; }
    setSaving(true);
    let newIdentifier: string | null = null;
    try {
      await cancelReminderNotification(oldIdentifier);
      newIdentifier = await scheduleDailyReminder(title.trim(), instructions.trim() || null, time);
      const { error } = await supabase.from('reminders').update({ title: title.trim(), instructions: instructions.trim() || null, local_time: `${time}:00`, notification_identifier: newIdentifier, is_active: true }).eq('id', id);
      if (error) throw error;
      router.replace('/reminders');
    } catch (error) {
      Alert.alert('Could not update reminder', error instanceof Error ? error.message : 'Please try again.');
    } finally { setSaving(false); }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.rose} /></View>;
  return <SafeAreaView style={styles.page}>
    <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.icon}><Ionicons name="close" size={22} color={colors.ink} /></Pressable><View><Text style={styles.eyebrow}>EDIT CARE ROUTINE</Text><Text style={styles.title}>Keep it accurate</Text></View></View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Field label="Reminder title" value={title} onChangeText={setTitle} />
      <Field label="Instructions" value={instructions} onChangeText={setInstructions} multiline />
      <Field label="Daily time (HH:MM)" value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" />
      <Text style={styles.help}>Saving replaces the previous phone schedule and reactivates the reminder.</Text>
      <Pressable disabled={saving} onPress={save} style={styles.save}>{saving ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.saveText}>Save and reschedule</Text>}</Pressable>
    </ScrollView>
  </SafeAreaView>;
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) { return <View><Text style={styles.label}>{label}</Text><TextInput {...props} placeholderTextColor={colors.muted} style={[styles.input, props.multiline && styles.multiline]} /></View>; }
const styles = StyleSheet.create({page:{flex:1,backgroundColor:colors.background},center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:colors.background},header:{flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.lg},icon:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},eyebrow:{fontSize:11,letterSpacing:1.8,fontWeight:'800',color:colors.rose},title:{fontSize:27,fontWeight:'800',color:colors.ink},content:{padding:spacing.lg,gap:spacing.lg},label:{marginBottom:spacing.sm,fontSize:13,fontWeight:'800',color:colors.roseDark},input:{minHeight:54,paddingHorizontal:spacing.md,borderRadius:radius.md,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,fontSize:16,color:colors.ink},multiline:{minHeight:110,paddingTop:spacing.md,textAlignVertical:'top'},help:{fontSize:13,lineHeight:19,color:colors.muted},save:{minHeight:56,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.rose},saveText:{fontSize:16,fontWeight:'800',color:colors.surface}});