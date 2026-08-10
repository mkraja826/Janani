import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { addHealthTrackerEntry, deleteHealthTrackerEntry, loadHealthTracker, parseCommaList, type HealthTrackerSnapshot, type TrackerKind } from '@/features/health/healthTracker';
import { resolveActivePregnancyId } from '@/features/pregnancy/activePregnancy';
import { readUiLanguage, type JananiLanguage } from '@/i18n';
import { healthT } from '@/i18n/health';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

const EMPTY: HealthTrackerSnapshot = { weight: [], blood_pressure: [], glucose: [], labs: [], symptoms: [] };

export default function HealthTrackerScreen() {
  const { session } = useAuth();
  const [language, setLanguage] = useState<JananiLanguage>('en');
  const [pregnancyId, setPregnancyId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<HealthTrackerSnapshot>(EMPTY);
  const [kind, setKind] = useState<TrackerKind>('weight');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [a, setA] = useState(''); const [b, setB] = useState(''); const [c, setC] = useState(''); const [d, setD] = useState('');
  const [note, setNote] = useState('');
  const [context, setContext] = useState<'fasting'|'before_meal'|'after_meal'|'random'|'other'>('fasting');
  const [severity, setSeverity] = useState(1);
  const [contactedCare, setContactedCare] = useState(false);
  const tr = (key: Parameters<typeof healthT>[1]) => healthT(language, key);
  const kinds = useMemo<Array<{ value: TrackerKind; label: string }>>(() => [
    { value: 'weight', label: tr('weight') }, { value: 'blood_pressure', label: tr('bloodPressure') }, { value: 'glucose', label: tr('glucose') }, { value: 'lab', label: tr('labResult') }, { value: 'symptom', label: tr('symptom') },
  ], [language]);
  const contextLabel = (value: typeof context) => ({ fasting: tr('fasting'), before_meal: tr('beforeMeal'), after_meal: tr('afterMeal'), random: tr('random'), other: tr('other') })[value];

  async function refresh(id: string) { setSnapshot(await loadHealthTracker(id)); }
  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const locale = await readUiLanguage(); if (mounted) setLanguage(locale);
        const userId = session?.user.id; if (!userId) return;
        const id = await resolveActivePregnancyId(userId); if (!id) throw new Error('No active pregnancy was found.');
        const data = await loadHealthTracker(id); if (!mounted) return;
        setPregnancyId(id); setSnapshot(data);
      } catch (error) { Alert.alert('Health tracker unavailable', error instanceof Error ? error.message : 'Please try again.'); }
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [session?.user.id]);

  const recent = useMemo(() => {
    if (kind === 'weight') return snapshot.weight.slice(0, 8).map((x) => ({ id:x.id, title:`${x.weight_kg} kg`, meta:formatDate(x.recorded_at) }));
    if (kind === 'blood_pressure') return snapshot.blood_pressure.slice(0, 8).map((x) => ({ id:x.id, title:`${x.systolic}/${x.diastolic} mmHg`, meta:formatDate(x.recorded_at) }));
    if (kind === 'glucose') return snapshot.glucose.slice(0, 8).map((x) => ({ id:x.id, title:`${x.value_mg_dl} mg/dL`, meta:`${contextLabel(x.context)} · ${formatDate(x.recorded_at)}` }));
    if (kind === 'lab') return snapshot.labs.slice(0, 8).map((x) => ({ id:x.id, title:`${x.test_name}: ${x.result_value}${x.unit ? ` ${x.unit}` : ''}`, meta:x.tested_on }));
    return snapshot.symptoms.slice(0, 8).map((x) => ({ id:x.id, title:x.symptom, meta:`Severity ${x.severity}/5 · ${formatDate(x.started_at)}` }));
  }, [kind, snapshot, language]);

  function number(value: string, min: number, max: number, label: string) {
    const parsed = Number(value);
    if (!value.trim() || !Number.isFinite(parsed) || parsed < min || parsed > max) { Alert.alert(`Check ${label}`, `Enter a value between ${min} and ${max}.`); return null; }
    return parsed;
  }
  function reset() { setA(''); setB(''); setC(''); setD(''); setNote(''); setSeverity(1); setContactedCare(false); }

  async function save() {
    if (!pregnancyId || saving) return;
    let entry: Record<string, unknown>;
    if (kind === 'weight') { const value = number(a,25,300,'weight'); if (value === null) return; entry = { weight_kg:value, note:note.trim() || null }; }
    else if (kind === 'blood_pressure') { const sys=number(a,50,260,'systolic pressure'); const dia=number(b,30,180,'diastolic pressure'); if (sys===null || dia===null) return; const pulse=c.trim()?number(c,30,220,'pulse'):null; if(c.trim() && pulse===null)return; entry={systolic:sys,diastolic:dia,pulse,symptoms:parseCommaList(d),note:note.trim()||null}; }
    else if (kind === 'glucose') { const value=number(a,20,700,'glucose'); if(value===null)return; const minutes=context==='after_meal'&&b.trim()?number(b,0,360,'meal timing'):null; if(context==='after_meal'&&b.trim()&&minutes===null)return; entry={value_mg_dl:value,context,minutes_after_meal:minutes,note:note.trim()||null}; }
    else if (kind === 'lab') { if(!a.trim()||!b.trim()){Alert.alert('Test details needed','Enter the test name and result exactly as shown on the report.');return;} entry={tested_on:new Date().toISOString().slice(0,10),test_name:a.trim(),result_value:b.trim(),unit:c.trim()||null,reference_range:d.trim()||null,note:note.trim()||null}; }
    else { if(!a.trim()){Alert.alert('Symptom needed','Enter the symptom you experienced.');return;} const duration=b.trim()?number(b,0,10080,'duration'):null; if(b.trim()&&duration===null)return; entry={symptom:a.trim(),severity,duration_minutes:duration,contacted_care:contactedCare,note:note.trim()||null}; }
    setSaving(true);
    try { await addHealthTrackerEntry(pregnancyId,kind,entry); await refresh(pregnancyId); reset(); }
    catch(error){Alert.alert('Could not save entry',error instanceof Error?error.message:'Please try again.');}
    finally{setSaving(false);}
  }

  function remove(id:string){Alert.alert('Delete this entry?','Use this only to correct a mistaken record.',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>void(async()=>{if(!pregnancyId)return;try{await deleteHealthTrackerEntry(kind,id);await refresh(pregnancyId);}catch(error){Alert.alert('Could not delete entry',error instanceof Error?error.message:'Please try again.');}})()}]);}

  if(loading)return <View style={styles.center}><ActivityIndicator color={colors.rose}/></View>;
  const kindLabel = kinds.find((x)=>x.value===kind)?.label ?? '';
  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><Pressable accessibilityLabel="Back" onPress={()=>router.back()} style={styles.icon}><Ionicons name="arrow-back" size={22} color={colors.ink}/></Pressable><View style={styles.flex}><Text style={styles.eyebrow}>{tr('trackerEyebrow')}</Text><Text style={styles.title}>{tr('trackerTitle')}</Text></View></View>
    <View style={styles.notice}><Ionicons name="information-circle-outline" size={22} color={colors.roseDark}/><Text style={styles.noticeText}>Janani records what you enter. It does not diagnose a condition or decide whether a reading is safe.</Text></View>
    <View style={styles.tabs}>{kinds.map((item)=><Pressable key={item.value} onPress={()=>{setKind(item.value);reset();}} style={[styles.tab,kind===item.value&&styles.tabSelected]}><Text style={[styles.tabText,kind===item.value&&styles.tabTextSelected]}>{item.label}</Text></Pressable>)}</View>
    <View style={styles.card}><Text style={styles.cardTitle}>{tr('add')} {kindLabel}</Text><View style={styles.form}>
      {kind==='weight'&&<Field label={`${tr('weight')} (kg)`} value={a} onChangeText={setA} keyboardType="decimal-pad" placeholder="62.5"/>}
      {kind==='blood_pressure'&&<><Field label={tr('systolic')} value={a} onChangeText={setA} keyboardType="number-pad"/><Field label={tr('diastolic')} value={b} onChangeText={setB} keyboardType="number-pad"/><Field label={tr('pulseOptional')} value={c} onChangeText={setC} keyboardType="number-pad"/><Field label={tr('symptomsOptional')} value={d} onChangeText={setD} placeholder="Headache, dizziness"/></>}
      {kind==='glucose'&&<><Field label={tr('glucoseMgDl')} value={a} onChangeText={setA} keyboardType="decimal-pad"/><View style={styles.tabs}>{(['fasting','before_meal','after_meal','random','other'] as const).map((x)=><Pressable key={x} onPress={()=>setContext(x)} style={[styles.tab,context===x&&styles.tabSelected]}><Text style={[styles.tabText,context===x&&styles.tabTextSelected]}>{contextLabel(x)}</Text></Pressable>)}</View>{context==='after_meal'?<Field label={tr('minutesAfterMeal')} value={b} onChangeText={setB} keyboardType="number-pad"/>:null}</>}
      {kind==='lab'&&<><Field label={tr('testName')} value={a} onChangeText={setA}/><Field label={tr('result')} value={b} onChangeText={setB}/><Field label={tr('unitOptional')} value={c} onChangeText={setC}/><Field label={tr('referenceRangeOptional')} value={d} onChangeText={setD}/></>}
      {kind==='symptom'&&<><Field label={tr('symptom')} value={a} onChangeText={setA}/><Text style={styles.label}>{tr('severity')}</Text><View style={styles.tabs}>{[1,2,3,4,5].map((x)=><Pressable key={x} onPress={()=>setSeverity(x)} style={[styles.tab,severity===x&&styles.tabSelected]}><Text style={[styles.tabText,severity===x&&styles.tabTextSelected]}>{x}</Text></Pressable>)}</View><Field label={tr('durationMinutesOptional')} value={b} onChangeText={setB} keyboardType="number-pad"/><Pressable onPress={()=>setContactedCare((v)=>!v)} style={styles.check}><Ionicons name={contactedCare?'checkbox':'square-outline'} size={22} color={colors.roseDark}/><Text style={styles.checkText}>{tr('contactedCareTeam')}</Text></Pressable></>}
      <Field label={tr('noteOptional')} value={note} onChangeText={setNote} multiline maxLength={500}/><Pressable disabled={saving} onPress={()=>void save()} style={[styles.save,saving&&styles.disabled]}>{saving?<ActivityIndicator color={colors.surface}/>:<Text style={styles.saveText}>{tr('saveEntry')}</Text>}</Pressable>
    </View></View>
    <View style={styles.card}><Text style={styles.cardTitle}>{tr('recentEntries')}</Text>{recent.length===0?<Text style={styles.empty}>{tr('noEntries')}</Text>:recent.map((item)=><View key={item.id} style={styles.entry}><View style={styles.flex}><Text style={styles.entryTitle}>{item.title}</Text><Text style={styles.entryMeta}>{item.meta}</Text></View><Pressable accessibilityLabel={tr('deleteEntry')} onPress={()=>remove(item.id)}><Ionicons name="trash-outline" size={19} color={colors.muted}/></Pressable></View>)}</View>
    <Text style={styles.disclaimer}>If you feel seriously unwell or have urgent pregnancy concerns, contact your maternity care team or local emergency service rather than waiting for Janani to interpret a reading.</Text>
  </ScrollView></SafeAreaView>;
}
function Field(props:React.ComponentProps<typeof TextInput>&{label:string}){const{label,...input}=props;return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...input} placeholderTextColor={colors.muted} style={[styles.input,input.multiline&&styles.multiline]}/></View>}
function formatDate(value:string){return new Date(value).toLocaleString([], {day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.lg},header:{flexDirection:'row',gap:spacing.md,alignItems:'flex-start'},icon:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},flex:{flex:1},eyebrow:{fontSize:12,letterSpacing:2,fontWeight:'800',color:colors.rose},title:{marginTop:spacing.xs,fontSize:28,lineHeight:35,fontWeight:'900',color:colors.ink},notice:{flexDirection:'row',gap:spacing.sm,padding:spacing.md,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},noticeText:{flex:1,fontSize:13,lineHeight:20,color:colors.muted},tabs:{flexDirection:'row',flexWrap:'wrap',gap:spacing.sm},tab:{minHeight:38,justifyContent:'center',paddingHorizontal:spacing.md,borderRadius:radius.pill,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface},tabSelected:{backgroundColor:colors.blush,borderColor:colors.rose},tabText:{fontSize:13,fontWeight:'700',color:colors.muted,textTransform:'capitalize'},tabTextSelected:{color:colors.roseDark},card:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},cardTitle:{fontSize:18,fontWeight:'900',color:colors.ink},form:{marginTop:spacing.md,gap:spacing.md},field:{gap:spacing.sm},label:{fontSize:14,fontWeight:'800',color:colors.ink},input:{minHeight:50,paddingHorizontal:spacing.md,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.background,color:colors.ink,fontSize:15},multiline:{minHeight:90,paddingTop:spacing.md,textAlignVertical:'top'},check:{flexDirection:'row',alignItems:'center',gap:spacing.sm},checkText:{fontSize:14,color:colors.ink},save:{minHeight:52,alignItems:'center',justifyContent:'center',borderRadius:radius.pill,backgroundColor:colors.rose},saveText:{fontSize:16,fontWeight:'900',color:colors.surface},disabled:{opacity:.55},entry:{flexDirection:'row',alignItems:'center',gap:spacing.md,paddingVertical:spacing.md,borderBottomWidth:1,borderBottomColor:colors.border},entryTitle:{fontSize:15,fontWeight:'800',color:colors.ink},entryMeta:{marginTop:3,fontSize:12,color:colors.muted},empty:{marginTop:spacing.md,fontSize:14,color:colors.muted},disclaimer:{textAlign:'center',fontSize:12,lineHeight:18,color:colors.muted}});
