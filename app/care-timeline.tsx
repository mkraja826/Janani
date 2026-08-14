import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APPOINTMENT_TYPES, type AppointmentStatus, type AppointmentType, type CareAppointment, deleteCareAppointment, listCareAppointments, saveCareAppointment, splitLines } from '@/features/care/careTimeline';
import { resolveActivePregnancyId } from '@/features/pregnancy/activePregnancy';
import { careFoodT } from '@/i18n/careFood';
import { readGlobalUiLocale } from '@/i18n/uiLocale';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

export default function CareTimelineScreen() {
  const { session } = useAuth();
  const [language, setLanguage] = useState('en');
  const [pregnancyId, setPregnancyId] = useState<string | null>(null);
  const [items, setItems] = useState<CareAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<AppointmentType>('doctor_visit');
  const [status, setStatus] = useState<AppointmentStatus>('scheduled');
  const [scheduledAt, setScheduledAt] = useState(new Date(Date.now() + 86400000));
  const [provider, setProvider] = useState('');
  const [facility, setFacility] = useState('');
  const [purpose, setPurpose] = useState('');
  const [questions, setQuestions] = useState('');
  const [notes, setNotes] = useState('');
  const [tests, setTests] = useState('');
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const tr = (key: Parameters<typeof careFoodT>[1]) => careFoodT(language, key);

  useEffect(() => { void readGlobalUiLocale().then(setLanguage); }, []);

  const load = useCallback(async () => {
    const userId = session?.user.id;
    if (!userId) return;
    setLoading(true);
    try {
      const id = await resolveActivePregnancyId(userId);
      if (!id) throw new Error('No active pregnancy was found.');
      setPregnancyId(id);
      setItems(await listCareAppointments(id));
    } catch (error) {
      Alert.alert('Care timeline unavailable', error instanceof Error ? error.message : 'Please try again.');
    } finally { setLoading(false); }
  }, [session?.user.id]);

  useFocusEffect(useCallback(() => { void load(); void readGlobalUiLocale().then(setLanguage); }, [load]));

  function reset() { setEditingId(null); setType('doctor_visit'); setStatus('scheduled'); setScheduledAt(new Date(Date.now() + 86400000)); setProvider(''); setFacility(''); setPurpose(''); setQuestions(''); setNotes(''); setTests(''); setPickerMode(null); }
  function edit(item: CareAppointment) { setEditingId(item.id); setType(item.appointment_type); setStatus(item.status); setScheduledAt(new Date(item.scheduled_at)); setProvider(item.provider_name ?? ''); setFacility(item.facility_name ?? ''); setPurpose(item.purpose ?? ''); setQuestions(item.questions.join('\n')); setNotes(item.notes_after ?? ''); setTests(item.tests_prescribed.join('\n')); }
  async function save() {
    if (!pregnancyId || saving) return;
    setSaving(true);
    try {
      await saveCareAppointment(pregnancyId, { ...(editingId ? { id: editingId } : {}), appointment_type:type, scheduled_at:scheduledAt.toISOString(), provider_name:provider.trim()||null, facility_name:facility.trim()||null, purpose:purpose.trim()||null, questions:splitLines(questions), notes_after:notes.trim()||null, tests_prescribed:splitLines(tests), next_followup_at:null, status });
      reset(); await load();
    } catch (error) { Alert.alert('Could not save', error instanceof Error ? error.message : 'Please try again.'); }
    finally { setSaving(false); }
  }
  function remove(item: CareAppointment) {
    if (!pregnancyId) return;
    Alert.alert('Delete this entry?', 'Use this only to correct your timeline.', [
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive', onPress:()=>void deleteCareAppointment(pregnancyId,item.id).then(load).catch((error)=>Alert.alert('Could not delete',error instanceof Error?error.message:'Please try again.')) },
    ]);
  }
  if (loading && !pregnancyId) return <View style={styles.center}><ActivityIndicator color={colors.rose}/></View>;
  const statusLabel = (value: AppointmentStatus) => tr(value);

  return <SafeAreaView style={styles.page}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.back}><Ionicons name="arrow-back" size={22} color={colors.ink}/></Pressable><View style={{flex:1}}><Text style={styles.eyebrow}>{tr('careEyebrow')}</Text><Text style={styles.title}>{tr('careTitle')}</Text></View></View>
      <View style={styles.notice}><Text style={styles.noticeText}>Janani organizes what you enter. It does not decide which tests, scans or appointments you need.</Text></View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{editingId?tr('editCareEntry'):tr('addCareEntry')}</Text>
        <Text style={styles.label}>{tr('type')}</Text><View style={styles.row}>{APPOINTMENT_TYPES.map((x)=><Pressable key={x.value} onPress={()=>setType(x.value)} style={[styles.pill,type===x.value&&styles.selected]}><Text style={styles.pillText}>{x.label}</Text></Pressable>)}</View>
        <View style={styles.row}><Pressable style={styles.dateButton} onPress={()=>setPickerMode('date')}><Text style={styles.small}>{tr('date')}</Text><Text style={styles.value}>{scheduledAt.toLocaleDateString()}</Text></Pressable><Pressable style={styles.dateButton} onPress={()=>setPickerMode('time')}><Text style={styles.small}>{tr('time')}</Text><Text style={styles.value}>{scheduledAt.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</Text></Pressable></View>
        <Field label={tr('doctorProvider')} value={provider} onChangeText={setProvider} maxLength={120}/><Field label={tr('facility')} value={facility} onChangeText={setFacility} maxLength={160}/><Field label={tr('purpose')} value={purpose} onChangeText={setPurpose} maxLength={500}/><Field label={tr('questionsToAsk')} value={questions} onChangeText={setQuestions} multiline placeholder={tr('onePerLine')}/>
        <Text style={styles.label}>{tr('status')}</Text><View style={styles.row}>{(['scheduled','completed','cancelled'] as AppointmentStatus[]).map((x)=><Pressable key={x} onPress={()=>setStatus(x)} style={[styles.pill,status===x&&styles.selected]}><Text style={styles.pillText}>{statusLabel(x)}</Text></Pressable>)}</View>
        {status==='completed'?<><Field label={tr('notesAfterVisit')} value={notes} onChangeText={setNotes} multiline maxLength={4000}/><Field label={tr('testsPrescribed')} value={tests} onChangeText={setTests} multiline placeholder={tr('onePerLine')}/></>:null}
        <View style={styles.row}>{editingId?<Pressable onPress={reset} style={styles.secondary}><Text style={styles.secondaryText}>{tr('cancel')}</Text></Pressable>:null}<Pressable disabled={saving} onPress={()=>void save()} style={styles.primary}>{saving?<ActivityIndicator color={colors.surface}/>:<Text style={styles.primaryText}>{tr('save')}</Text>}</Pressable></View>
      </View>
      <View style={styles.card}><Text style={styles.cardTitle}>{tr('timeline')}</Text>{items.length===0?<Text style={styles.muted}>{tr('noEntries')}</Text>:items.map((item)=><View key={item.id} style={styles.entry}><View style={{flex:1}}><Text style={styles.entryTitle}>{APPOINTMENT_TYPES.find((x)=>x.value===item.appointment_type)?.label??'Care'} · {statusLabel(item.status)}</Text><Text style={styles.muted}>{new Date(item.scheduled_at).toLocaleString()}</Text>{item.purpose?<Text style={styles.muted}>{item.purpose}</Text>:null}</View><Pressable onPress={()=>edit(item)}><Ionicons name="create-outline" size={20} color={colors.roseDark}/></Pressable><Pressable onPress={()=>remove(item)}><Ionicons name="trash-outline" size={20} color={colors.muted}/></Pressable></View>)}</View>
      <Text style={styles.disclaimer}>Always follow your maternity care team&apos;s schedule and instructions.</Text>
    </ScrollView>
    {pickerMode?<DateTimePicker value={scheduledAt} mode={pickerMode} onChange={(_,value)=>{if(Platform.OS==='android')setPickerMode(null);if(!value)return;const next=new Date(scheduledAt);if(pickerMode==='date')next.setFullYear(value.getFullYear(),value.getMonth(),value.getDate());else next.setHours(value.getHours(),value.getMinutes(),0,0);setScheduledAt(next);}}/>:null}
  </SafeAreaView>;
}

function Field(props: React.ComponentProps<typeof TextInput>&{label:string}){const{label,...input}=props;return <View><Text style={styles.label}>{label}</Text><TextInput {...input} placeholderTextColor={colors.muted} style={[styles.input,input.multiline&&styles.multiline]}/></View>}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.lg},header:{flexDirection:'row',gap:spacing.md},back:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},eyebrow:{fontSize:12,letterSpacing:2,fontWeight:'800',color:colors.rose},title:{marginTop:spacing.xs,fontSize:28,lineHeight:35,fontWeight:'900',color:colors.ink},notice:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},noticeText:{fontSize:13,lineHeight:20,color:colors.muted},card:{padding:spacing.lg,gap:spacing.md,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},cardTitle:{fontSize:19,fontWeight:'900',color:colors.ink},label:{marginBottom:6,fontSize:13,fontWeight:'800',color:colors.ink},input:{minHeight:50,paddingHorizontal:spacing.md,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.background,color:colors.ink},multiline:{minHeight:92,paddingTop:spacing.md,textAlignVertical:'top'},row:{flexDirection:'row',flexWrap:'wrap',gap:spacing.sm},pill:{paddingHorizontal:spacing.md,paddingVertical:10,borderRadius:radius.pill,borderWidth:1,borderColor:colors.border,backgroundColor:colors.background},selected:{borderColor:colors.rose,backgroundColor:colors.blush},pillText:{fontSize:12,fontWeight:'700',color:colors.ink},dateButton:{flex:1,minWidth:130,padding:spacing.md,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.background},small:{fontSize:11,color:colors.muted},value:{marginTop:4,fontSize:14,fontWeight:'800',color:colors.ink},primary:{minWidth:110,minHeight:48,alignItems:'center',justifyContent:'center',paddingHorizontal:spacing.lg,borderRadius:radius.pill,backgroundColor:colors.rose},primaryText:{fontWeight:'800',color:colors.surface},secondary:{minWidth:110,minHeight:48,alignItems:'center',justifyContent:'center',borderRadius:radius.pill,borderWidth:1,borderColor:colors.rose},secondaryText:{fontWeight:'800',color:colors.roseDark},entry:{flexDirection:'row',gap:spacing.sm,alignItems:'center',paddingVertical:spacing.sm,borderBottomWidth:1,borderBottomColor:colors.border},entryTitle:{fontSize:14,fontWeight:'800',color:colors.ink},muted:{fontSize:13,lineHeight:19,color:colors.muted},disclaimer:{textAlign:'center',fontSize:12,lineHeight:18,color:colors.muted}});
