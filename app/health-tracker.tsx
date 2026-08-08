import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  addHealthTrackerEntry,
  deleteHealthTrackerEntry,
  HealthTrackerSnapshot,
  loadHealthTracker,
  parseCommaList,
  TrackerKind,
} from '@/features/health/healthTracker';
import { resolveActivePregnancyId } from '@/features/pregnancy/activePregnancy';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

const EMPTY: HealthTrackerSnapshot = { weight: [], blood_pressure: [], glucose: [], labs: [], symptoms: [] };
const kinds: ReadonlyArray<{ value: TrackerKind; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { value: 'weight', label: 'Weight', icon: 'scale-outline' },
  { value: 'blood_pressure', label: 'Blood pressure', icon: 'heart-outline' },
  { value: 'glucose', label: 'Glucose', icon: 'water-outline' },
  { value: 'lab', label: 'Lab result', icon: 'flask-outline' },
  { value: 'symptom', label: 'Symptom', icon: 'pulse-outline' },
];

export default function HealthTrackerScreen() {
  const { session } = useAuth();
  const [pregnancyId, setPregnancyId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<HealthTrackerSnapshot>(EMPTY);
  const [kind, setKind] = useState<TrackerKind>('weight');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weight, setWeight] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [bpSymptoms, setBpSymptoms] = useState('');
  const [glucose, setGlucose] = useState('');
  const [glucoseContext, setGlucoseContext] = useState<'fasting'|'before_meal'|'after_meal'|'random'|'other'>('fasting');
  const [minutesAfterMeal, setMinutesAfterMeal] = useState('');
  const [testName, setTestName] = useState('');
  const [resultValue, setResultValue] = useState('');
  const [unit, setUnit] = useState('');
  const [referenceRange, setReferenceRange] = useState('');
  const [symptom, setSymptom] = useState('');
  const [severity, setSeverity] = useState(1);
  const [duration, setDuration] = useState('');
  const [contactedCare, setContactedCare] = useState(false);
  const [note, setNote] = useState('');

  async function refresh(id: string) {
    setSnapshot(await loadHealthTracker(id));
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const userId = session?.user.id;
        if (!userId) return;
        const id = await resolveActivePregnancyId(userId);
        if (!id) throw new Error('No active pregnancy was found.');
        const data = await loadHealthTracker(id);
        if (!active) return;
        setPregnancyId(id);
        setSnapshot(data);
      } catch (error) {
        if (active) Alert.alert('Health tracker unavailable', error instanceof Error ? error.message : 'Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [session?.user.id]);

  const recent = useMemo(() => {
    if (kind === 'weight') return snapshot.weight.slice(0, 5).map((x) => ({ id: x.id, title: `${x.weight_kg} kg`, meta: formatDate(x.recorded_at) }));
    if (kind === 'blood_pressure') return snapshot.blood_pressure.slice(0, 5).map((x) => ({ id: x.id, title: `${x.systolic}/${x.diastolic} mmHg`, meta: `${formatDate(x.recorded_at)}${x.pulse ? ` · pulse ${x.pulse}` : ''}` }));
    if (kind === 'glucose') return snapshot.glucose.slice(0, 5).map((x) => ({ id: x.id, title: `${x.value_mg_dl} mg/dL`, meta: `${labelContext(x.context)} · ${formatDate(x.recorded_at)}` }));
    if (kind === 'lab') return snapshot.labs.slice(0, 5).map((x) => ({ id: x.id, title: `${x.test_name}: ${x.result_value}${x.unit ? ` ${x.unit}` : ''}`, meta: x.tested_on }));
    return snapshot.symptoms.slice(0, 5).map((x) => ({ id: x.id, title: x.symptom, meta: `Severity ${x.severity}/5 · ${formatDate(x.started_at)}` }));
  }, [kind, snapshot]);

  function validateNumber(value: string, min: number, max: number, label: string): number | null {
    const number = Number(value);
    if (!value.trim() || !Number.isFinite(number) || number < min || number > max) {
      Alert.alert(`Check ${label}`, `Enter a value between ${min} and ${max}.`);
      return null;
    }
    return number;
  }

  async function save() {
    if (!pregnancyId || saving) return;
    let entry: Record<string, unknown>;
    if (kind === 'weight') {
      const value = validateNumber(weight, 25, 300, 'weight'); if (value === null) return;
      entry = { weight_kg: value, note: note.trim() || null };
    } else if (kind === 'blood_pressure') {
      const sys = validateNumber(systolic, 50, 260, 'systolic pressure'); if (sys === null) return;
      const dia = validateNumber(diastolic, 30, 180, 'diastolic pressure'); if (dia === null) return;
      const pulseValue = pulse.trim() ? Number(pulse) : null;
      if (pulseValue !== null && (!Number.isFinite(pulseValue) || pulseValue < 30 || pulseValue > 220)) return Alert.alert('Check pulse', 'Enter a pulse between 30 and 220, or leave it blank.');
      entry = { systolic: sys, diastolic: dia, pulse: pulseValue, symptoms: parseCommaList(bpSymptoms), note: note.trim() || null };
    } else if (kind === 'glucose') {
      const value = validateNumber(glucose, 20, 700, 'glucose'); if (value === null) return;
      const minutes = minutesAfterMeal.trim() ? Number(minutesAfterMeal) : null;
      if (minutes !== null && (!Number.isFinite(minutes) || minutes < 0 || minutes > 360)) return Alert.alert('Check meal timing', 'Enter minutes between 0 and 360, or leave it blank.');
      entry = { value_mg_dl: value, context: glucoseContext, minutes_after_meal: minutes, note: note.trim() || null };
    } else if (kind === 'lab') {
      if (!testName.trim() || !resultValue.trim()) return Alert.alert('Test details needed', 'Enter the test name and result exactly as shown on the report.');
      entry = { tested_on: today(), test_name: testName.trim(), result_value: resultValue.trim(), unit: unit.trim() || null, reference_range: referenceRange.trim() || null, note: note.trim() || null };
    } else {
      if (!symptom.trim()) return Alert.alert('Symptom needed', 'Enter the symptom you experienced.');
      const minutes = duration.trim() ? Number(duration) : null;
      if (minutes !== null && (!Number.isFinite(minutes) || minutes < 0 || minutes > 10080)) return Alert.alert('Check duration', 'Enter duration in minutes up to 7 days, or leave it blank.');
      entry = { symptom: symptom.trim(), severity, duration_minutes: minutes, contacted_care: contactedCare, note: note.trim() || null };
    }

    setSaving(true);
    try {
      await addHealthTrackerEntry(pregnancyId, kind, entry);
      await refresh(pregnancyId);
      clearCurrentForm();
      Alert.alert('Saved', 'This entry is stored in your private maternal health record.');
    } catch (error) {
      Alert.alert('Could not save entry', error instanceof Error ? error.message : 'Please try again.');
    } finally { setSaving(false); }
  }

  function clearCurrentForm() {
    setWeight(''); setSystolic(''); setDiastolic(''); setPulse(''); setBpSymptoms(''); setGlucose(''); setMinutesAfterMeal('');
    setTestName(''); setResultValue(''); setUnit(''); setReferenceRange(''); setSymptom(''); setSeverity(1); setDuration(''); setContactedCare(false); setNote('');
  }

  function remove(entryId: string) {
    Alert.alert('Delete this entry?', 'Use this only to correct an entry that was recorded by mistake.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void (async () => {
        if (!pregnancyId) return;
        try { await deleteHealthTrackerEntry(kind, entryId); await refresh(pregnancyId); }
        catch (error) { Alert.alert('Could not delete entry', error instanceof Error ? error.message : 'Please try again.'); }
      })() },
    ]);
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.rose} /></View>;

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><Pressable accessibilityLabel="Back" onPress={() => router.back()} style={styles.icon}><Ionicons name="arrow-back" size={22} color={colors.ink}/></Pressable><View style={styles.flex}><Text style={styles.eyebrow}>PRIVATE HEALTH TRACKER</Text><Text style={styles.title}>Keep your readings together.</Text></View></View>
    <View style={styles.notice}><Ionicons name="information-circle-outline" size={22} color={colors.roseDark}/><Text style={styles.noticeText}>Janani records what you enter; it does not diagnose a condition or decide whether a reading is safe. Follow targets and instructions from your maternity care team.</Text></View>

    <View style={styles.kindGrid}>{kinds.map((item) => <Pressable key={item.value} onPress={() => { setKind(item.value); setNote(''); }} style={[styles.kind, kind===item.value&&styles.kindSelected]}><Ionicons name={item.icon} size={22} color={kind===item.value?colors.roseDark:colors.muted}/><Text style={[styles.kindText,kind===item.value&&styles.kindTextSelected]}>{item.label}</Text></Pressable>)}</View>

    <View style={styles.card}><Text style={styles.cardTitle}>Add {kinds.find((x)=>x.value===kind)?.label.toLowerCase()}</Text><View style={styles.form}>
      {kind==='weight' && <Field label="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="62.5"/>}
      {kind==='blood_pressure' && <><Field label="Systolic" value={systolic} onChangeText={setSystolic} keyboardType="number-pad" placeholder="120"/><Field label="Diastolic" value={diastolic} onChangeText={setDiastolic} keyboardType="number-pad" placeholder="80"/><Field label="Pulse (optional)" value={pulse} onChangeText={setPulse} keyboardType="number-pad" placeholder="78"/><Field label="Symptoms at the time (optional)" value={bpSymptoms} onChangeText={setBpSymptoms} placeholder="Headache, dizziness"/></>}
      {kind==='glucose' && <><Field label="Glucose (mg/dL)" value={glucose} onChangeText={setGlucose} keyboardType="decimal-pad" placeholder="96"/><Text style={styles.label}>Reading context</Text><View style={styles.row}>{(['fasting','before_meal','after_meal','random','other'] as const).map((x)=><Pressable key={x} onPress={()=>setGlucoseContext(x)} style={[styles.pill,glucoseContext===x&&styles.pillSelected]}><Text style={[styles.pillText,glucoseContext===x&&styles.pillTextSelected]}>{labelContext(x)}</Text></Pressable>)}</View>{glucoseContext==='after_meal'&&<Field label="Minutes after meal (optional)" value={minutesAfterMeal} onChangeText={setMinutesAfterMeal} keyboardType="number-pad" placeholder="120"/>}</>}
      {kind==='lab' && <><Field label="Test name" value={testName} onChangeText={setTestName} placeholder="TSH"/><Field label="Result" value={resultValue} onChangeText={setResultValue} placeholder="2.4"/><Field label="Unit (optional)" value={unit} onChangeText={setUnit} placeholder="mIU/L"/><Field label="Reference range from report (optional)" value={referenceRange} onChangeText={setReferenceRange} placeholder="0.4–4.0"/></>}
      {kind==='symptom' && <><Field label="Symptom" value={symptom} onChangeText={setSymptom} placeholder="Headache"/><Text style={styles.label}>How strong did it feel?</Text><View style={styles.row}>{[1,2,3,4,5].map((x)=><Pressable key={x} onPress={()=>setSeverity(x)} style={[styles.severity,severity===x&&styles.pillSelected]}><Text style={[styles.pillText,severity===x&&styles.pillTextSelected]}>{x}</Text></Pressable>)}</View><Field label="Duration in minutes (optional)" value={duration} onChangeText={setDuration} keyboardType="number-pad" placeholder="30"/><Pressable onPress={()=>setContactedCare((x)=>!x)} style={[styles.checkRow,contactedCare&&styles.checkRowSelected]}><Ionicons name={contactedCare?'checkbox':'square-outline'} size={22} color={colors.roseDark}/><Text style={styles.checkText}>I contacted my care team about this</Text></Pressable></>}
      <Field label="Note (optional)" value={note} onChangeText={setNote} placeholder="Anything useful to remember" multiline maxLength={500}/>
      <Pressable disabled={saving} onPress={()=>void save()} style={[styles.save,saving&&styles.disabled]}>{saving?<ActivityIndicator color={colors.surface}/>:<><Text style={styles.saveText}>Save entry</Text><Ionicons name="add-circle-outline" size={20} color={colors.surface}/></>}</Pressable>
    </View></View>

    <View style={styles.card}><Text style={styles.cardTitle}>Recent entries</Text>{recent.length===0?<Text style={styles.empty}>No entries yet.</Text>:recent.map((item)=><View key={item.id} style={styles.entry}><View style={styles.flex}><Text style={styles.entryTitle}>{item.title}</Text><Text style={styles.entryMeta}>{item.meta}</Text></View><Pressable accessibilityLabel="Delete entry" onPress={()=>remove(item.id)} style={styles.delete}><Ionicons name="trash-outline" size={18} color={colors.muted}/></Pressable></View>)}</View>

    <View style={styles.safety}><Text style={styles.safetyTitle}>Need medical help?</Text><Text style={styles.safetyText}>Do not wait for Janani to interpret a reading or symptom. If you feel seriously unwell or have urgent pregnancy concerns, contact your maternity care team or local emergency service.</Text></View>
  </ScrollView></SafeAreaView>;
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) { const {label,...input}=props; return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...input} placeholderTextColor={colors.muted} style={[styles.input,input.multiline&&styles.multiline]}/></View>; }
function today(){return new Date().toISOString().slice(0,10);}
function formatDate(value:string){return new Date(value).toLocaleString([], { day:'numeric', month:'short', hour:'numeric', minute:'2-digit' });}
function labelContext(value:string){return ({fasting:'Fasting',before_meal:'Before meal',after_meal:'After meal',random:'Random',other:'Other'} as Record<string,string>)[value]??value;}

const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.lg},header:{flexDirection:'row',gap:spacing.md,alignItems:'flex-start'},icon:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},flex:{flex:1},eyebrow:{fontSize:12,letterSpacing:2,fontWeight:'800',color:colors.rose},title:{marginTop:spacing.xs,fontSize:29,lineHeight:36,fontWeight:'800',color:colors.ink},notice:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},noticeText:{flex:1,fontSize:13,lineHeight:20,color:colors.muted},kindGrid:{flexDirection:'row',flexWrap:'wrap',gap:spacing.sm},kind:{minWidth:'30%',flexGrow:1,minHeight:70,padding:spacing.sm,alignItems:'center',justifyContent:'center',gap:spacing.xs,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface},kindSelected:{borderColor:colors.rose,backgroundColor:colors.blush},kindText:{fontSize:12,fontWeight:'700',color:colors.muted,textAlign:'center'},kindTextSelected:{color:colors.roseDark},card:{padding:spacing.lg,gap:spacing.md,borderRadius:radius.lg,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface},cardTitle:{fontSize:18,fontWeight:'800',color:colors.ink},form:{gap:spacing.md},field:{gap:spacing.sm},label:{fontSize:14,fontWeight:'700',color:colors.ink},input:{minHeight:52,paddingHorizontal:spacing.md,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.background,color:colors.ink,fontSize:15},multiline:{minHeight:90,paddingTop:spacing.md,textAlignVertical:'top'},row:{flexDirection:'row',flexWrap:'wrap',gap:spacing.sm},pill:{minHeight:38,justifyContent:'center',paddingHorizontal:spacing.sm,borderRadius:radius.pill,borderWidth:1,borderColor:colors.border,backgroundColor:colors.background},pillSelected:{borderColor:colors.rose,backgroundColor:colors.blush},pillText:{fontSize:12,fontWeight:'700',color:colors.muted},pillTextSelected:{color:colors.roseDark},severity:{width:42,height:42,alignItems:'center',justifyContent:'center',borderRadius:radius.pill,borderWidth:1,borderColor:colors.border},checkRow:{flexDirection:'row',alignItems:'center',gap:spacing.sm,padding:spacing.md,borderRadius:radius.md,borderWidth:1,borderColor:colors.border},checkRowSelected:{backgroundColor:colors.blush,borderColor:colors.rose},checkText:{flex:1,fontSize:13,fontWeight:'700',color:colors.ink},save:{minHeight:54,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm,borderRadius:radius.pill,backgroundColor:colors.rose},saveText:{fontSize:16,fontWeight:'800',color:colors.surface},disabled:{opacity:.6},empty:{fontSize:14,color:colors.muted},entry:{flexDirection:'row',alignItems:'center',gap:spacing.sm,paddingVertical:spacing.sm,borderBottomWidth:1,borderBottomColor:colors.border},entryTitle:{fontSize:15,fontWeight:'800',color:colors.ink},entryMeta:{marginTop:3,fontSize:12,color:colors.muted},delete:{width:38,height:38,alignItems:'center',justifyContent:'center'},safety:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},safetyTitle:{fontSize:15,fontWeight:'800',color:colors.roseDark},safetyText:{marginTop:spacing.sm,fontSize:13,lineHeight:20,color:colors.muted}});
