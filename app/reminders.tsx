import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  cancelReminderNotifications,
  NotificationPermissionError,
  scheduleReminderNotifications,
} from '@/features/reminders/notifications';
import { readCache, writeCache } from '@/lib/cache';
import { toLocalDate } from '@/lib/date';
import { isTransientError } from '@/lib/errors';
import { enqueueMutation } from '@/lib/offlineQueue';
import { supabase } from '@/lib/supabase';
import { useMembership } from '@/providers/AuthGate';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

type Reminder = { id: string; created_by: string; title: string; instructions: string | null; kind: 'medication' | 'appointment' | 'hydration' | 'nutrition' | 'custom'; local_time: string; start_date: string; end_date: string | null; days_of_week: number[]; is_active: boolean };
type ReminderLog = { reminder_id: string; scheduled_for: string; state: 'pending' | 'taken' | 'skipped' | 'missed' };
type FamilyRole = 'mother' | 'partner';
type ReminderCache = { date: string; role: FamilyRole | null; reminders: Reminder[]; logs: ReminderLog[] };
const CACHE_KEY = 'today-reminders-v2';

function todayOccurrence(localTime: string) { const [hour, minute] = localTime.split(':').map(Number); const value = new Date(); value.setHours(hour, minute, 0, 0); return value.toISOString(); }
function formatTime(localTime: string) { const [hour, minute] = localTime.split(':').map(Number); return new Date(2000, 0, 1, hour, minute).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }

export default function RemindersScreen() {
  const { session } = useAuth();
  const { onFamilyInvalidation } = useMembership();
  const userId = session?.user.id;
  const [reminders, setReminders] = useState<Reminder[]>([]); const [logs, setLogs] = useState<ReminderLog[]>([]); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [savingId, setSavingId] = useState<string | null>(null); const [offline, setOffline] = useState(false);
  const [familyRole, setFamilyRole] = useState<FamilyRole | null>(null);
  const visibleDate = useRef<string | null>(null);
  const loadRevision = useRef(0);
  useEffect(() => {
    loadRevision.current += 1;
    visibleDate.current = null;
    setReminders([]);
    setLogs([]);
    setFamilyRole(null);
    setOffline(false);
    setLoading(Boolean(userId));
  }, [userId]);
  const load = useCallback(async () => {
    if (!userId) return;
    const revision = ++loadRevision.current;
    const start = new Date();
    start.setHours(0,0,0,0);
    const end = new Date(start);
    end.setDate(end.getDate()+1);
    const date = toLocalDate(start);
    if (visibleDate.current !== date) {
      visibleDate.current = date;
      setReminders([]);
      setLogs([]);
      setLoading(true);
      setOffline(false);
    }
    const cached = await readCache<ReminderCache>(userId, CACHE_KEY);
    if (revision !== loadRevision.current) return;
    const validCache = cached?.date === date ? cached : null;
    if (validCache) {
      setReminders(validCache.reminders);
      setLogs(validCache.logs);
      setFamilyRole(validCache.role);
      setLoading(false);
    }
    const [items, history, membership] = await Promise.all([
      supabase.from('reminders').select('id,created_by,title,instructions,kind,local_time,start_date,end_date,days_of_week,is_active').lte('start_date', date).or(`end_date.is.null,end_date.gte.${date}`).order('local_time'),
      supabase.from('reminder_logs').select('reminder_id,scheduled_for,state').gte('scheduled_for', start.toISOString()).lt('scheduled_for', end.toISOString()),
      supabase.from('family_members').select('role').eq('user_id', userId).maybeSingle(),
    ]);
    if (revision !== loadRevision.current) return;
    if (toLocalDate(new Date()) !== date) {
      void load();
      return;
    }
    if (items.error || history.error) {
      setOffline(true);
      if (!validCache) Alert.alert('Could not load reminders', items.error?.message ?? history.error?.message);
    } else {
      const weekday = start.getDay();
      const nextReminders=(items.data ?? []).filter((item) => item.days_of_week.length === 0 || item.days_of_week.includes(weekday)) as Reminder[];
      const nextLogs=(history.data ?? []) as ReminderLog[];
      const nextRole = membership.error
        ? validCache?.role ?? null
        : membership.data?.role as FamilyRole | undefined ?? null;
      setReminders(nextReminders);
      setLogs(nextLogs);
      setFamilyRole(nextRole);
      setOffline(false);
      await writeCache(userId,CACHE_KEY,{date,role:nextRole,reminders:nextReminders,logs:nextLogs});
    }
    setLoading(false); setRefreshing(false);
  }, [userId]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useEffect(() => {
    const stopInvalidations = onFamilyInvalidation(
      ['reminders', 'reminder_logs'],
      () => void load(),
    );
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void load();
    });
    return () => {
      stopInvalidations();
      appState.remove();
    };
  }, [load, onFamilyInvalidation]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;
    function scheduleMidnightRefresh() {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 50);
      timer = setTimeout(() => {
        if (disposed) return;
        visibleDate.current = null;
        setReminders([]);
        setLogs([]);
        setLoading(true);
        void load();
        scheduleMidnightRefresh();
      }, nextMidnight.getTime() - now.getTime());
    }
    scheduleMidnightRefresh();
    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
    };
  }, [load]);
  const states = useMemo(() => new Map(logs.map((log) => [log.reminder_id, log.state])), [logs]);
  async function mark(reminder: Reminder, state: 'taken' | 'skipped') {
    if (!userId) return;
    setSavingId(reminder.id);
    const date = toLocalDate(new Date());
    const scheduledFor = todayOccurrence(reminder.local_time);
    const optimistic = { reminder_id: reminder.id, scheduled_for: scheduledFor, state };
    setLogs((current) => [
      ...current.filter((item) => item.reminder_id !== reminder.id),
      optimistic,
    ]);
    const { error } = await supabase.rpc('mark_reminder_occurrence', {
      p_reminder_id: reminder.id,
      p_scheduled_for: scheduledFor,
      p_state: state,
      p_note: null,
    });
    const sameDay = toLocalDate(new Date()) === date;
    if (error) {
      if (isTransientError(error)) {
        await enqueueMutation(userId, 'reminder_status', {
          reminderId: reminder.id,
          scheduledFor,
          state,
        });
        setOffline(true);
        Alert.alert(
          'Saved for later',
          'Janani will sync this reminder status when the connection returns.',
        );
      } else {
        if (sameDay) setLogs(logs);
        Alert.alert('Could not update reminder', error.message);
      }
    }
    if (sameDay) {
      await writeCache(userId, CACHE_KEY, {
        date,
        role: familyRole,
        reminders,
        logs: error && !isTransientError(error)
          ? logs
          : [...logs.filter((item) => item.reminder_id !== reminder.id), optimistic],
      });
    } else {
      void load();
    }
    setSavingId(null);
  }
  async function toggleActive(reminder: Reminder) { if(!userId)return; setSavingId(reminder.id); const nextActive=!reminder.is_active; const{error}=await supabase.from('reminders').update({is_active:nextActive}).eq('id',reminder.id); if(error){Alert.alert('Could not update reminder',error.message);setSavingId(null);return;} if(!nextActive){await cancelReminderNotifications(userId,reminder.id);}else{try{await scheduleReminderNotifications(userId,{id:reminder.id,title:reminder.title,instructions:reminder.instructions,kind:reminder.kind,localTime:reminder.local_time,startDate:reminder.start_date,endDate:reminder.end_date,daysOfWeek:reminder.days_of_week});}catch(notificationError){if(notificationError instanceof NotificationPermissionError)Alert.alert('Reminder resumed','Phone alerts are off. Enable notifications in device settings to receive it.');}} await load();setSavingId(null); }
  function remove(reminder: Reminder) { if(!userId||(familyRole!=='mother'&&reminder.created_by!==userId)){Alert.alert('Only the mother or creator can delete this reminder','You can pause or edit a shared family reminder, while its creator or the family’s mother can permanently delete it.');return;} Alert.alert('Delete reminder?','This removes the reminder and its history from Janani.',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:async()=>{setSavingId(reminder.id);const{error}=await supabase.from('reminders').delete().eq('id',reminder.id);if(error)Alert.alert('Could not delete reminder',error.message);else{await cancelReminderNotifications(userId,reminder.id);await load();}setSavingId(null);}}]); }
  return <SafeAreaView style={styles.page}><View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.iconButton}><Ionicons name="arrow-back" size={22} color={colors.ink}/></Pressable><View style={styles.headerCopy}><Text style={styles.eyebrow}>TODAY’S CARE</Text><Text style={styles.title}>Gentle reminders</Text></View><Pressable onPress={()=>router.push('/new-reminder')} style={styles.addButton}><Ionicons name="add" size={24} color={colors.surface}/></Pressable></View>{loading?<View style={styles.center}><ActivityIndicator color={colors.rose}/></View>:<ScrollView contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);load();}}/>}>{offline&&<View style={styles.offline}><Ionicons name="cloud-offline-outline" size={18} color={colors.roseDark}/><Text style={styles.offlineText}>Showing saved care data. Changes marked taken or skipped will sync later.</Text></View>}<View style={styles.note}><Ionicons name="heart-outline" size={22} color={colors.rose}/><Text style={styles.noteText}>No scolding here. Janani simply helps the family remember and try again.</Text></View>{reminders.length===0?<View style={styles.empty}><Ionicons name="alarm-outline" size={42} color={colors.sage}/><Text style={styles.emptyTitle}>Nothing scheduled today</Text><Text style={styles.emptyText}>Add medicines, hydration, appointments, or a custom care reminder.</Text><Pressable onPress={()=>router.push('/new-reminder')} style={styles.primaryButton}><Text style={styles.primaryText}>Add first reminder</Text></Pressable></View>:reminders.map((reminder)=>{const state=states.get(reminder.id)??'pending';const completed=state==='taken';return <View key={reminder.id} style={[styles.card,completed&&styles.cardDone,!reminder.is_active&&styles.cardPaused]}><View style={styles.cardTop}><View style={styles.kindIcon}><Ionicons name={reminder.kind==='medication'?'medical-outline':reminder.kind==='hydration'?'water-outline':'alarm-outline'} size={23} color={colors.rose}/></View><View style={styles.cardCopy}><Text style={styles.time}>{formatTime(reminder.local_time)}{!reminder.is_active?' · Paused':''}</Text><Text style={styles.cardTitle}>{reminder.title}</Text>{!!reminder.instructions&&<Text style={styles.instructions}>{reminder.instructions}</Text>}</View></View>{reminder.is_active&&<View style={styles.actions}><Pressable disabled={savingId===reminder.id} onPress={()=>mark(reminder,'skipped')} style={styles.skipButton}><Text style={styles.skipText}>{state==='skipped'?'Skipped':'Skip today'}</Text></Pressable><Pressable disabled={savingId===reminder.id} onPress={()=>mark(reminder,'taken')} style={[styles.doneButton,completed&&styles.doneButtonActive]}>{savingId===reminder.id?<ActivityIndicator color={colors.surface}/>:<><Ionicons name="checkmark" size={20} color={colors.surface}/><Text style={styles.doneText}>{completed?'Taken':'Mark taken'}</Text></>}</Pressable></View>}<View style={styles.manageRow}><Pressable onPress={()=>router.push({pathname:'/edit-reminder',params:{id:reminder.id}})} style={styles.manageButton}><Ionicons name="create-outline" size={18} color={colors.roseDark}/><Text style={styles.manageText}>Edit</Text></Pressable><Pressable onPress={()=>toggleActive(reminder)} style={styles.manageButton}><Ionicons name={reminder.is_active?'pause-outline':'play-outline'} size={18} color={colors.roseDark}/><Text style={styles.manageText}>{reminder.is_active?'Pause':'Resume'}</Text></Pressable>{(familyRole==='mother'||reminder.created_by===userId)&&<Pressable onPress={()=>remove(reminder)} style={styles.manageButton}><Ionicons name="trash-outline" size={18} color={colors.danger}/><Text style={[styles.manageText,{color:colors.danger}]}>Delete</Text></Pressable>}</View></View>;})}</ScrollView>}</SafeAreaView>;
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},header:{flexDirection:'row',alignItems:'center',padding:spacing.lg,gap:spacing.md},headerCopy:{flex:1},eyebrow:{fontSize:11,letterSpacing:1.8,fontWeight:'800',color:colors.rose},title:{marginTop:3,fontSize:27,fontWeight:'800',color:colors.ink},iconButton:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},addButton:{width:46,height:46,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.rose},center:{flex:1,alignItems:'center',justifyContent:'center'},list:{paddingHorizontal:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.md},offline:{flexDirection:'row',gap:spacing.sm,padding:spacing.md,borderRadius:radius.md,backgroundColor:colors.blush},offlineText:{flex:1,fontSize:13,lineHeight:19,color:colors.roseDark},note:{flexDirection:'row',gap:spacing.md,padding:spacing.md,borderRadius:radius.md,backgroundColor:colors.blush},noteText:{flex:1,fontSize:14,lineHeight:20,color:colors.roseDark},empty:{alignItems:'center',marginTop:spacing.xl,padding:spacing.xl,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},emptyTitle:{marginTop:spacing.md,fontSize:20,fontWeight:'800',color:colors.ink},emptyText:{marginTop:spacing.sm,textAlign:'center',fontSize:14,lineHeight:21,color:colors.muted},primaryButton:{marginTop:spacing.lg,minHeight:50,paddingHorizontal:spacing.lg,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.rose},primaryText:{color:colors.surface,fontWeight:'800'},card:{padding:spacing.lg,gap:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},cardDone:{backgroundColor:colors.sageSoft},cardPaused:{opacity:.65},cardTop:{flexDirection:'row',gap:spacing.md},kindIcon:{width:46,height:46,borderRadius:radius.md,alignItems:'center',justifyContent:'center',backgroundColor:colors.blush},cardCopy:{flex:1},time:{fontSize:12,fontWeight:'800',color:colors.rose},cardTitle:{marginTop:3,fontSize:18,fontWeight:'800',color:colors.ink},instructions:{marginTop:spacing.sm,fontSize:14,lineHeight:20,color:colors.muted},actions:{flexDirection:'row',gap:spacing.sm},skipButton:{flex:1,minHeight:48,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.border},skipText:{fontWeight:'700',color:colors.muted},doneButton:{flex:1.35,minHeight:48,flexDirection:'row',gap:spacing.sm,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.rose},doneButtonActive:{backgroundColor:colors.sage},doneText:{fontWeight:'800',color:colors.surface},manageRow:{flexDirection:'row',justifyContent:'flex-end',gap:spacing.md,flexWrap:'wrap'},manageButton:{flexDirection:'row',alignItems:'center',gap:6},manageText:{fontSize:13,fontWeight:'800',color:colors.roseDark}});
