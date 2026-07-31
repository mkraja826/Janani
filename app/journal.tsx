import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

type Entry = {
  id: string;
  author_id: string;
  title: string | null;
  body: string;
  mood: number | null;
  entry_date: string;
  is_shared_with_partner: boolean;
};

const moodEmoji: Record<number, string> = { 1: '😞', 2: '😕', 3: '😌', 4: '🙂', 5: '🥰' };

export default function JournalScreen() {
  const { session } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('id, author_id, title, body, mood, entry_date, is_shared_with_partner')
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) Alert.alert('Could not load journal', error.message);
    else setEntries((data ?? []) as Entry[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable>
        <View style={styles.flex}><Text style={styles.eyebrow}>PREGNANCY JOURNAL</Text><Text style={styles.title}>Little moments, safely kept</Text></View>
        <Pressable onPress={() => router.push('/journal/new')} style={styles.addButton}><Ionicons name="add" size={24} color={colors.surface} /></Pressable>
      </View>

      {loading ? <View style={styles.center}><ActivityIndicator color={colors.rose} /></View> : (
        <ScrollView contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
          <View style={styles.note}><Ionicons name="lock-closed-outline" size={21} color={colors.rose} /><Text style={styles.noteText}>Every entry is private unless its author chooses to share it with the partner.</Text></View>
          {entries.length === 0 ? <View style={styles.empty}><Ionicons name="book-outline" size={44} color={colors.sage} /><Text style={styles.emptyTitle}>Your story begins here</Text><Text style={styles.emptyText}>Write about a feeling, a tiny milestone, a doctor visit, or something you want to remember years from now.</Text><Pressable onPress={() => router.push('/journal/new')} style={styles.primary}><Text style={styles.primaryText}>Write first entry</Text></Pressable></View> : entries.map((entry) => {
            const mine = entry.author_id === session?.user.id;
            return <View key={entry.id} style={styles.card}>
              <View style={styles.cardTop}><Text style={styles.date}>{new Date(`${entry.entry_date}T00:00:00`).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</Text><View style={styles.badge}><Ionicons name={entry.is_shared_with_partner ? 'people-outline' : 'lock-closed-outline'} size={14} color={colors.roseDark} /><Text style={styles.badgeText}>{entry.is_shared_with_partner ? 'Shared' : 'Private'}</Text></View></View>
              <View style={styles.moodRow}><Text style={styles.mood}>{entry.mood ? moodEmoji[entry.mood] : '🫶'}</Text><Text style={styles.author}>{mine ? 'Your entry' : 'Shared by your partner'}</Text></View>
              {!!entry.title && <Text style={styles.cardTitle}>{entry.title}</Text>}
              <Text style={styles.body}>{entry.body}</Text>
            </View>;
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},header:{flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.lg},flex:{flex:1},eyebrow:{fontSize:11,letterSpacing:1.8,fontWeight:'800',color:colors.rose},title:{marginTop:3,fontSize:25,lineHeight:31,fontWeight:'800',color:colors.ink},iconButton:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},addButton:{width:46,height:46,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.rose},center:{flex:1,alignItems:'center',justifyContent:'center'},list:{paddingHorizontal:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.md},note:{flexDirection:'row',gap:spacing.md,padding:spacing.md,borderRadius:radius.md,backgroundColor:colors.blush},noteText:{flex:1,fontSize:14,lineHeight:20,color:colors.roseDark},empty:{alignItems:'center',padding:spacing.xl,marginTop:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},emptyTitle:{marginTop:spacing.md,fontSize:20,fontWeight:'800',color:colors.ink},emptyText:{marginTop:spacing.sm,textAlign:'center',fontSize:14,lineHeight:21,color:colors.muted},primary:{marginTop:spacing.lg,minHeight:50,paddingHorizontal:spacing.lg,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.rose},primaryText:{fontWeight:'800',color:colors.surface},card:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},cardTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:spacing.md},date:{fontSize:12,fontWeight:'800',color:colors.muted},badge:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:10,paddingVertical:6,borderRadius:radius.pill,backgroundColor:colors.blush},badgeText:{fontSize:11,fontWeight:'800',color:colors.roseDark},moodRow:{flexDirection:'row',alignItems:'center',gap:spacing.sm,marginTop:spacing.md},mood:{fontSize:28},author:{fontSize:12,fontWeight:'700',color:colors.rose},cardTitle:{marginTop:spacing.md,fontSize:19,fontWeight:'800',color:colors.ink},body:{marginTop:spacing.sm,fontSize:15,lineHeight:23,color:colors.muted}
});