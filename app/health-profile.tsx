import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CONDITION_OPTIONS, joinList, loadHealthProfile, parseList, saveHealthProfile, type ActivityLevel, type ConditionStatus, type DietaryPattern, type HealthConditionCode, type PregnancyType } from '@/features/health/healthProfile';
import { resolveActivePregnancyId } from '@/features/pregnancy/activePregnancy';
import { readUiLanguage, type JananiLanguage } from '@/i18n';
import { healthT } from '@/i18n/health';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

type ConditionMap = Partial<Record<HealthConditionCode, ConditionStatus>>;

export default function HealthProfileScreen() {
  const { session } = useAuth();
  const [language, setLanguage] = useState<JananiLanguage>('en');
  const [pregnancyId, setPregnancyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weight, setWeight] = useState('');
  const [pregnancyType, setPregnancyType] = useState<PregnancyType>('singleton');
  const [diet, setDiet] = useState<DietaryPattern>('no_preference');
  const [activity, setActivity] = useState<ActivityLevel>('not_set');
  const [cuisines, setCuisines] = useState('');
  const [allergies, setAllergies] = useState('');
  const [foodsAvoided, setFoodsAvoided] = useState('');
  const [instructions, setInstructions] = useState('');
  const [conditions, setConditions] = useState<ConditionMap>({});
  const tr = (key: Parameters<typeof healthT>[1]) => healthT(language, key);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [locale] = await Promise.all([readUiLanguage()]);
        if (mounted) setLanguage(locale);
        const userId = session?.user.id;
        if (!userId) return;
        const id = await resolveActivePregnancyId(userId);
        if (!id) throw new Error('No active pregnancy was found.');
        const profile = await loadHealthProfile(id);
        if (!mounted) return;
        setPregnancyId(id);
        setWeight(profile.current_weight_kg?.toString() ?? '');
        setPregnancyType(profile.pregnancy_type);
        setDiet(profile.dietary_pattern);
        setActivity(profile.activity_level);
        setCuisines(joinList(profile.cuisine_preferences));
        setAllergies(joinList(profile.allergies));
        setFoodsAvoided(joinList(profile.foods_avoided));
        setInstructions(profile.clinician_dietary_instructions ?? '');
        setConditions(Object.fromEntries(profile.conditions.map((item) => [item.condition_code, item.status])) as ConditionMap);
      } catch (error) {
        Alert.alert('Health profile unavailable', error instanceof Error ? error.message : 'Please try again.');
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [session?.user.id]);

  const pregnancyTypes = useMemo<Array<{ value: PregnancyType; label: string }>>(() => [
    { value: 'singleton', label: tr('oneBaby') }, { value: 'twins', label: tr('twins') }, { value: 'higher_multiple', label: tr('threePlusBabies') }, { value: 'unknown', label: tr('notConfirmed') },
  ], [language]);
  const diets = useMemo<Array<{ value: DietaryPattern; label: string }>>(() => [
    { value: 'vegetarian', label: tr('vegetarian') }, { value: 'eggetarian', label: tr('vegetarianEggs') }, { value: 'non_vegetarian', label: tr('nonVegetarian') }, { value: 'vegan', label: tr('vegan') }, { value: 'no_preference', label: tr('noPreference') },
  ], [language]);
  const activities = useMemo<Array<{ value: ActivityLevel; label: string }>>(() => [
    { value: 'low', label: tr('activityLow') }, { value: 'moderate', label: tr('activityModerate') }, { value: 'high', label: tr('activityHigh') }, { value: 'clinician_restricted', label: tr('doctorRestricted') }, { value: 'not_set', label: tr('notSure') },
  ], [language]);
  const statuses: Array<{ value: ConditionStatus; label: string }> = [
    { value: 'doctor_diagnosed', label: 'Diagnosed' }, { value: 'under_evaluation', label: 'Checking' }, { value: 'pregnancy_history', label: 'History' },
  ];
  const selectedCount = useMemo(() => Object.values(conditions).filter(Boolean).length, [conditions]);

  async function save() {
    if (!pregnancyId || saving) return;
    const currentWeight = weight.trim() ? Number(weight) : null;
    if (currentWeight !== null && (!Number.isFinite(currentWeight) || currentWeight < 25 || currentWeight > 300)) {
      Alert.alert('Check current weight', 'Enter a weight between 25 and 300 kg, or leave it blank.');
      return;
    }
    setSaving(true);
    try {
      await saveHealthProfile(pregnancyId, {
        current_weight_kg: currentWeight, pregnancy_type: pregnancyType, dietary_pattern: diet, activity_level: activity,
        cuisine_preferences: parseList(cuisines), allergies: parseList(allergies), foods_avoided: parseList(foodsAvoided), clinician_dietary_instructions: instructions.trim() || null,
        conditions: Object.entries(conditions).filter((entry): entry is [HealthConditionCode, ConditionStatus] => Boolean(entry[1])).map(([condition_code, status]) => ({ condition_code, status })),
      });
      Alert.alert('Health profile saved', 'These details remain private to the mother unless Janani explicitly says otherwise.');
    } catch (error) { Alert.alert('Could not save health profile', error instanceof Error ? error.message : 'Please try again.'); }
    finally { setSaving(false); }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.rose} /></View>;
  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><Pressable accessibilityLabel="Back" onPress={() => router.back()} style={styles.iconButton}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable><View style={styles.flex}><Text style={styles.eyebrow}>{tr('profileEyebrow')}</Text><Text style={styles.title}>{tr('profileTitle')}</Text></View></View>
    <View style={styles.notice}><Ionicons name="lock-closed-outline" size={22} color={colors.roseDark} /><Text style={styles.noticeText}>These details are mother-only by default. Janani records what you report and does not diagnose a condition or change treatment.</Text></View>

    <Section title={tr('pregnancyBody')}><Field label={tr('currentWeight')} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="62.5" /><Choice label={tr('pregnancy')} items={pregnancyTypes} value={pregnancyType} onChange={setPregnancyType} /><Choice label={tr('activityLevel')} items={activities} value={activity} onChange={setActivity} /></Section>
    <Section title={tr('foodPreferences')}><Choice label={tr('foodPattern')} items={diets} value={diet} onChange={setDiet} /><Field label={tr('cuisinePreferences')} value={cuisines} onChangeText={setCuisines} placeholder="Telangana, South Indian" /><Field label={tr('foodAllergies')} value={allergies} onChangeText={setAllergies} placeholder="Peanut, lactose" /><Field label={tr('foodsAvoided')} value={foodsAvoided} onChangeText={setFoodsAvoided} placeholder="Mushrooms, seafood" /></Section>
    <Section title={tr('healthConditions')} subtitle={`${selectedCount} selected. Janani will never infer a diagnosis from your readings.`}>{CONDITION_OPTIONS.map((item) => <View key={item.code} style={styles.condition}><Text style={styles.conditionTitle}>{item.label}</Text><View style={styles.row}>{statuses.filter((status) => !item.historyOnly || status.value === 'pregnancy_history').map((status) => { const selected = conditions[item.code] === status.value; return <Pressable key={status.value} onPress={() => setConditions((current) => ({ ...current, [item.code]: selected ? undefined : status.value }))} style={[styles.pill, selected && styles.pillSelected]}><Text style={[styles.pillText, selected && styles.pillTextSelected]}>{status.label}</Text></Pressable>; })}</View></View>)}</Section>
    <Section title={tr('clinicianInstructions')} subtitle="Doctor or dietitian instructions always take priority over generic Janani guidance."><Field label={tr('dietaryActivityInstructions')} value={instructions} onChangeText={setInstructions} placeholder="Enter only instructions your care team has given you" multiline maxLength={2000} /></Section>

    <Pressable disabled={saving} onPress={() => void save()} style={[styles.save, saving && styles.disabled]}>{saving ? <ActivityIndicator color={colors.surface} /> : <><Text style={styles.saveText}>{tr('saveHealthProfile')}</Text><Ionicons name="shield-checkmark-outline" size={20} color={colors.surface} /></>}</Pressable>
    <Text style={styles.disclaimer}>Medication, glucose targets, blood-pressure targets, diet restrictions and activity restrictions should follow your qualified care team.</Text>
  </ScrollView></SafeAreaView>;
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) { return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}<View style={styles.sectionBody}>{children}</View></View>; }
function Field({ label, ...props }: React.ComponentProps<typeof TextInput> & { label: string }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} placeholderTextColor={colors.muted} style={[styles.input, props.multiline && styles.multiline]} /></View>; }
function Choice<T extends string>({ label, items, value, onChange }: { label: string; items: Array<{ value: T; label: string }>; value: T; onChange: (value: T) => void }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><View style={styles.row}>{items.map((item) => <Pressable key={item.value} onPress={() => onChange(item.value)} style={[styles.pill, item.value === value && styles.pillSelected]}><Text style={[styles.pillText, item.value === value && styles.pillTextSelected]}>{item.label}</Text></Pressable>)}</View></View>; }

const styles = StyleSheet.create({ page:{flex:1,backgroundColor:colors.background}, center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:colors.background}, content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.lg}, header:{flexDirection:'row',gap:spacing.md,alignItems:'flex-start'}, flex:{flex:1}, iconButton:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border}, eyebrow:{fontSize:12,letterSpacing:2,fontWeight:'800',color:colors.rose}, title:{marginTop:spacing.xs,fontSize:28,lineHeight:35,fontWeight:'900',color:colors.ink}, notice:{flexDirection:'row',gap:spacing.sm,padding:spacing.md,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border}, noticeText:{flex:1,fontSize:13,lineHeight:20,color:colors.muted}, card:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border}, cardTitle:{fontSize:18,fontWeight:'900',color:colors.ink}, subtitle:{marginTop:spacing.xs,fontSize:13,lineHeight:19,color:colors.muted}, sectionBody:{marginTop:spacing.md,gap:spacing.md}, field:{gap:spacing.sm}, label:{fontSize:14,fontWeight:'800',color:colors.ink}, input:{minHeight:50,paddingHorizontal:spacing.md,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.background,color:colors.ink,fontSize:15}, multiline:{minHeight:110,paddingTop:spacing.md,textAlignVertical:'top'}, row:{flexDirection:'row',flexWrap:'wrap',gap:spacing.sm}, pill:{minHeight:38,justifyContent:'center',paddingHorizontal:spacing.md,borderRadius:radius.pill,borderWidth:1,borderColor:colors.border,backgroundColor:colors.background}, pillSelected:{borderColor:colors.rose,backgroundColor:colors.blush}, pillText:{fontSize:13,fontWeight:'700',color:colors.muted}, pillTextSelected:{color:colors.roseDark}, condition:{gap:spacing.sm,padding:spacing.md,borderRadius:radius.md,backgroundColor:colors.background,borderWidth:1,borderColor:colors.border}, conditionTitle:{fontSize:14,fontWeight:'800',color:colors.ink}, save:{minHeight:54,borderRadius:radius.pill,backgroundColor:colors.rose,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm}, saveText:{fontSize:16,fontWeight:'900',color:colors.surface}, disabled:{opacity:.55}, disclaimer:{textAlign:'center',fontSize:12,lineHeight:18,color:colors.muted} });
