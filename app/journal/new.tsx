import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { resolveActivePregnancyId } from '@/features/pregnancy/activePregnancy';
import { readCache, writeCache } from '@/lib/cache';
import { isTransientError } from '@/lib/errors';
import { enqueueMutation } from '@/lib/offlineQueue';
import { supabase } from '@/lib/supabase';
import { randomUuid } from '@/lib/uuid';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

const moods = [
  { value: 1, emoji: '😞', label: 'Low' }, { value: 2, emoji: '😕', label: 'Heavy' },
  { value: 3, emoji: '😌', label: 'Calm' }, { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '🥰', label: 'Joyful' },
];
const dateOnly = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
const JOURNAL_CACHE_KEY = 'journal-timeline-v1';

type CachedJournalEntry = {
  id: string;
  author_id: string;
  title: string | null;
  body: string;
  mood: number | null;
  entry_date: string;
  is_shared_with_partner: boolean;
  pending?: boolean;
};

export default function NewJournalEntryScreen() {
  const { session } = useAuth();
  const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [mood, setMood] = useState(3);
  const [entryDate, setEntryDate] = useState(new Date()); const [showDate, setShowDate] = useState(false);
  const [shared, setShared] = useState(false); const [saving, setSaving] = useState(false);

  async function save() {
    if (!session || !body.trim()) return Alert.alert('Write a little more', 'Your journal entry needs a few words before it can be saved.');
    setSaving(true);
    const pregnancyId = await resolveActivePregnancyId(session.user.id);
    if (!pregnancyId) {
      setSaving(false);
      return Alert.alert('Pregnancy profile unavailable', 'Open Janani once while connected after onboarding, then offline journal saving will work.');
    }

    const clientMutationId = randomUuid();
    const payload = {
      p_client_mutation_id: clientMutationId,
      p_pregnancy_id: pregnancyId,
      p_title: title.trim(),
      p_body: body.trim(),
      p_mood: mood,
      p_is_shared_with_partner: shared,
      p_entry_date: dateOnly(entryDate),
    };
    const { error } = await supabase.rpc('save_journal_entry_idempotent', payload);
    setSaving(false);

    if (!error) {
      router.replace('/journal');
      return;
    }

    if (!isTransientError(error)) {
      Alert.alert('Could not save entry', error.message);
      return;
    }

    await enqueueMutation(session.user.id, 'journal_save', payload);
    const cached = await readCache<CachedJournalEntry[]>(session.user.id, JOURNAL_CACHE_KEY) ?? [];
    await writeCache(session.user.id, JOURNAL_CACHE_KEY, [{
      id: `offline:${clientMutationId}`,
      author_id: session.user.id,
      title: title.trim() || null,
      body: body.trim(),
      mood,
      entry_date: dateOnly(entryDate),
      is_shared_with_partner: shared,
      pending: true,
    }, ...cached]);
    Alert.alert('Saved on this phone', 'Janani will securely add this memory when the connection returns.', [
      { text: 'Open journal', onPress: () => router.replace('/journal') },
    ]);
  }

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.iconButton}><Ionicons name="close" size={24} color={colors.ink} /></Pressable><View style={styles.flex}><Text style={styles.eyebrow}>NEW MEMORY</Text><Text style={styles.title}>What is in your heart today?</Text></View></View>
    <View style={styles.section}><Text style={styles.label}>Memory date</Text><Pressable onPress={() => setShowDate(true)} style={styles.dateButton}><Text style={styles.dateText}>{entryDate.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}</Text><Ionicons name="calendar-outline" size={20} color={colors.rose} /></Pressable>{showDate && <DateTimePicker value={entryDate} mode="date" maximumDate={new Date()} onChange={(_, value) => { if (Platform.OS === 'android') setShowDate(false); if (value) setEntryDate(value); }} />}</View>
    <View style={styles.section}><Text style={styles.label}>How does that day feel?</Text><View style={styles.moods}>{moods.map((item) => <Pressable key={item.value} onPress={() => setMood(item.value)} style={[styles.moodCard, mood === item.value && styles.moodCardActive]}><Text style={styles.emoji}>{item.emoji}</Text><Text style={[styles.moodLabel, mood === item.value && styles.moodLabelActive]}>{item.label}</Text></Pressable>)}</View></View>
    <View style={styles.section}><Text style={styles.label}>Title <Text style={styles.optional}>(optional)</Text></Text><TextInput value={title} onChangeText={setTitle} placeholder="A tiny milestone" placeholderTextColor={colors.muted} style={styles.input} maxLength={80} /></View>
    <View style={styles.section}><Text style={styles.label}>Your words</Text><TextInput value={body} onChangeText={setBody} placeholder="Write freely. This space belongs to you." placeholderTextColor={colors.muted} style={[styles.input, styles.textArea]} multiline textAlignVertical="top" maxLength={3000} /><Text style={styles.counter}>{body.length}/3000</Text></View>
    <View style={styles.shareCard}><View style={styles.shareIcon}><Ionicons name={shared ? 'people-outline' : 'lock-closed-outline'} size={22} color={colors.rose} /></View><View style={styles.flex}><Text style={styles.shareTitle}>{shared ? 'Shared with partner' : 'Private entry'}</Text><Text style={styles.shareText}>{shared ? 'Your linked partner can read this entry.' : 'Only you can read this entry.'}</Text></View><Switch value={shared} onValueChange={setShared} trackColor={{ false: colors.border, true: colors.blush }} thumbColor={shared ? colors.rose : colors.muted} /></View>
    <Pressable disabled={saving} onPress={save} style={[styles.saveButton, saving && styles.disabled]}>{saving ? <ActivityIndicator color={colors.surface} /> : <><Ionicons name="heart-outline" size={20} color={colors.surface} /><Text style={styles.saveText}>Keep this memory</Text></>}</Pressable><Text style={styles.note}>Your feelings are valid. Janani’s journal is for reflection, not diagnosis.</Text>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.xl},header:{flexDirection:'row',alignItems:'flex-start',gap:spacing.md},flex:{flex:1},eyebrow:{fontSize:11,letterSpacing:1.8,fontWeight:'800',color:colors.rose},title:{marginTop:4,fontSize:29,lineHeight:36,fontWeight:'800',color:colors.ink},iconButton:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},section:{gap:spacing.sm},label:{fontSize:15,fontWeight:'800',color:colors.ink},optional:{fontWeight:'500',color:colors.muted},dateButton:{minHeight:54,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:spacing.md,borderRadius:radius.md,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},dateText:{fontSize:16,color:colors.ink},moods:{flexDirection:'row',gap:spacing.sm},moodCard:{flex:1,alignItems:'center',paddingVertical:spacing.md,borderRadius:radius.md,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},moodCardActive:{backgroundColor:colors.blush,borderColor:colors.rose},emoji:{fontSize:26},moodLabel:{marginTop:4,fontSize:11,fontWeight:'700',color:colors.muted},moodLabelActive:{color:colors.roseDark},input:{minHeight:54,paddingHorizontal:spacing.md,borderRadius:radius.md,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,fontSize:16,color:colors.ink},textArea:{minHeight:190,paddingTop:spacing.md},counter:{alignSelf:'flex-end',fontSize:11,color:colors.muted},shareCard:{flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.md,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},shareIcon:{width:44,height:44,borderRadius:radius.md,alignItems:'center',justifyContent:'center',backgroundColor:colors.blush},shareTitle:{fontSize:15,fontWeight:'800',color:colors.ink},shareText:{marginTop:3,fontSize:12,lineHeight:17,color:colors.muted},saveButton:{minHeight:56,flexDirection:'row',gap:spacing.sm,alignItems:'center',justifyContent:'center',borderRadius:radius.pill,backgroundColor:colors.rose},disabled:{opacity:.6},saveText:{fontSize:16,fontWeight:'800',color:colors.surface},note:{textAlign:'center',fontSize:12,lineHeight:18,color:colors.muted}});
