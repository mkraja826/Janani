import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ActivityLevel,
  CONDITION_OPTIONS,
  ConditionStatus,
  DietaryPattern,
  HealthConditionCode,
  joinList,
  loadHealthProfile,
  parseList,
  PregnancyType,
  saveHealthProfile,
} from '@/features/health/healthProfile';
import { resolveActivePregnancyId } from '@/features/pregnancy/activePregnancy';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

type ConditionMap = Partial<Record<HealthConditionCode, ConditionStatus>>;

const pregnancyTypes: ReadonlyArray<{ value: PregnancyType; label: string }> = [
  { value: 'singleton', label: 'One baby' },
  { value: 'twins', label: 'Twins' },
  { value: 'higher_multiple', label: '3+ babies' },
  { value: 'unknown', label: 'Not confirmed' },
];

const diets: ReadonlyArray<{ value: DietaryPattern; label: string }> = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'eggetarian', label: 'Vegetarian + eggs' },
  { value: 'non_vegetarian', label: 'Non-vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'no_preference', label: 'No preference' },
];

const activityLevels: ReadonlyArray<{ value: ActivityLevel; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
  { value: 'clinician_restricted', label: 'Doctor restricted' },
  { value: 'not_set', label: 'Not sure' },
];

const statuses: ReadonlyArray<{ value: ConditionStatus; label: string }> = [
  { value: 'doctor_diagnosed', label: 'Diagnosed' },
  { value: 'under_evaluation', label: 'Checking' },
  { value: 'pregnancy_history', label: 'History' },
];

export default function HealthProfileScreen() {
  const { session } = useAuth();
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
  const [clinicianInstructions, setClinicianInstructions] = useState('');
  const [conditions, setConditions] = useState<ConditionMap>({});

  useEffect(() => {
    let active = true;
    async function load() {
      const userId = session?.user.id;
      if (!userId) return;
      try {
        const resolvedPregnancyId = await resolveActivePregnancyId(userId);
        if (!resolvedPregnancyId) throw new Error('No active pregnancy was found.');
        const profile = await loadHealthProfile(resolvedPregnancyId);
        if (!active) return;
        setPregnancyId(resolvedPregnancyId);
        setWeight(profile.current_weight_kg?.toString() ?? '');
        setPregnancyType(profile.pregnancy_type);
        setDiet(profile.dietary_pattern);
        setActivity(profile.activity_level);
        setCuisines(joinList(profile.cuisine_preferences));
        setAllergies(joinList(profile.allergies));
        setFoodsAvoided(joinList(profile.foods_avoided));
        setClinicianInstructions(profile.clinician_dietary_instructions ?? '');
        setConditions(Object.fromEntries(profile.conditions.map((item) => [item.condition_code, item.status])) as ConditionMap);
      } catch (error) {
        if (!active) return;
        Alert.alert(
          'Health profile unavailable',
          error instanceof Error ? error.message : 'Please try again.',
          [{ text: 'Back', onPress: () => router.replace('/home') }],
        );
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [session?.user.id]);

  const selectedConditionCount = useMemo(
    () => Object.values(conditions).filter(Boolean).length,
    [conditions],
  );

  function setConditionStatus(code: HealthConditionCode, status: ConditionStatus) {
    setConditions((current) => ({
      ...current,
      [code]: current[code] === status ? undefined : status,
    }));
  }

  async function save() {
    if (!pregnancyId || saving) return;
    const currentWeight = weight.trim() ? Number(weight) : null;
    if (currentWeight !== null && (!Number.isFinite(currentWeight) || currentWeight < 25 || currentWeight > 300)) {
      Alert.alert('Check current weight', 'Enter a weight between 25 and 300 kg, or leave it blank.');
      return;
    }
    if (clinicianInstructions.length > 2000) {
      Alert.alert('Instructions are too long', 'Keep clinician instructions within 2,000 characters.');
      return;
    }

    setSaving(true);
    try {
      await saveHealthProfile(pregnancyId, {
        current_weight_kg: currentWeight,
        pregnancy_type: pregnancyType,
        dietary_pattern: diet,
        activity_level: activity,
        cuisine_preferences: parseList(cuisines),
        allergies: parseList(allergies),
        foods_avoided: parseList(foodsAvoided),
        clinician_dietary_instructions: clinicianInstructions.trim() || null,
        conditions: Object.entries(conditions)
          .filter((entry): entry is [HealthConditionCode, ConditionStatus] => Boolean(entry[1]))
          .map(([condition_code, status]) => ({ condition_code, status })),
      });
      Alert.alert('Health profile saved', 'Janani will use these details only for features you choose to use.');
    } catch (error) {
      Alert.alert('Could not save health profile', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.rose} /></View>;
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </Pressable>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>PRIVATE HEALTH PROFILE</Text>
            <Text style={styles.title}>Help Janani understand your care context.</Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Ionicons name="lock-closed-outline" size={21} color={colors.roseDark} />
          <Text style={styles.noticeText}>
            These health details are private to the mother by default. Janani does not use them to diagnose a condition or change treatment.
          </Text>
        </View>

        <Section title="Pregnancy & body" subtitle="You can update these details whenever they change.">
          <Field label="Current weight (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="62.5" />
          <Text style={styles.label}>Pregnancy</Text>
          <ChoiceRow items={pregnancyTypes} value={pregnancyType} onChange={setPregnancyType} />
          <Text style={styles.label}>Activity level</Text>
          <ChoiceRow items={activityLevels} value={activity} onChange={setActivity} />
        </Section>

        <Section title="Food preferences" subtitle="This will later help filter nutrition guidance before any AI personalization is considered.">
          <Text style={styles.label}>Food pattern</Text>
          <ChoiceRow items={diets} value={diet} onChange={setDiet} />
          <Field label="Cuisine preferences" value={cuisines} onChangeText={setCuisines} placeholder="Telangana, South Indian" helper="Separate multiple entries with commas." />
          <Field label="Food allergies or intolerances" value={allergies} onChangeText={setAllergies} placeholder="Peanut, lactose" helper="Only enter allergies or intolerances you already know about." />
          <Field label="Foods you avoid" value={foodsAvoided} onChangeText={setFoodsAvoided} placeholder="Mushrooms, seafood" />
        </Section>

        <Section title="Health conditions" subtitle={`${selectedConditionCount} selected. Choose how each condition applies to you; Janani will not infer diagnoses from readings.`}>
          {CONDITION_OPTIONS.map((item) => {
            const availableStatuses = item.historyOnly
              ? statuses.filter((status) => status.value === 'pregnancy_history')
              : statuses;
            return (
              <View key={item.code} style={styles.conditionCard}>
                <Text style={styles.conditionTitle}>{item.label}</Text>
                <View style={styles.statusRow}>
                  {availableStatuses.map((status) => {
                    const selected = conditions[item.code] === status.value;
                    return (
                      <Pressable
                        key={status.value}
                        onPress={() => setConditionStatus(item.code, status.value)}
                        style={[styles.statusButton, selected && styles.statusButtonSelected]}
                      >
                        <Text style={[styles.statusText, selected && styles.statusTextSelected]}>{status.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </Section>

        <Section title="Clinician instructions" subtitle="Doctor or dietitian instructions should always take priority over generic Janani guidance.">
          <Field
            label="Dietary or activity instructions"
            value={clinicianInstructions}
            onChangeText={setClinicianInstructions}
            placeholder="Example: avoid fasting; follow the glucose targets provided by my doctor"
            multiline
            maxLength={2000}
          />
        </Section>

        <View style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>Important</Text>
          <Text style={styles.safetyText}>
            Saving a condition here records what you report. It does not confirm a diagnosis. Medication, glucose targets, blood-pressure targets, diet restrictions, and activity restrictions should follow your qualified care team.
          </Text>
        </View>

        <Pressable disabled={saving} onPress={() => void save()} style={[styles.saveButton, saving && styles.disabled]}>
          {saving ? <ActivityIndicator color={colors.surface} /> : <>
            <Text style={styles.saveText}>Save health profile</Text>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.surface} />
          </>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    <View style={styles.sectionBody}>{children}</View>
  </View>;
}

function Field({ label, helper, ...props }: React.ComponentProps<typeof TextInput> & { label: string; helper?: string }) {
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput {...props} placeholderTextColor={colors.muted} style={[styles.input, props.multiline && styles.multiline]} />
    {helper ? <Text style={styles.helper}>{helper}</Text> : null}
  </View>;
}

function ChoiceRow<T extends string>({
  items,
  value,
  onChange,
}: {
  items: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return <View style={styles.choiceRow}>
    {items.map((item) => {
      const selected = item.value === value;
      return <Pressable key={item.value} onPress={() => onChange(item.value)} style={[styles.choice, selected && styles.choiceSelected]}>
        <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{item.label}</Text>
      </Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xl },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  iconButton: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  flex: { flex: 1 },
  eyebrow: { fontSize: 12, letterSpacing: 2.2, fontWeight: '800', color: colors.rose },
  title: { marginTop: spacing.sm, fontSize: 29, lineHeight: 36, fontWeight: '800', color: colors.ink },
  notice: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.blush, borderWidth: 1, borderColor: colors.border },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 20, color: colors.muted },
  section: { padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: colors.ink },
  sectionSubtitle: { marginTop: spacing.xs, fontSize: 13, lineHeight: 20, color: colors.muted },
  sectionBody: { marginTop: spacing.lg, gap: spacing.md },
  field: { gap: spacing.sm },
  label: { fontSize: 14, fontWeight: '700', color: colors.ink },
  helper: { fontSize: 12, lineHeight: 18, color: colors.muted },
  input: { minHeight: 52, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, color: colors.ink, fontSize: 15 },
  multiline: { minHeight: 110, paddingTop: spacing.md, textAlignVertical: 'top' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choice: { minHeight: 42, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  choiceSelected: { borderColor: colors.rose, backgroundColor: colors.blush },
  choiceText: { fontSize: 13, fontWeight: '700', color: colors.muted },
  choiceTextSelected: { color: colors.roseDark },
  conditionCard: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  conditionTitle: { fontSize: 14, fontWeight: '800', color: colors.ink },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statusButton: { minHeight: 36, justifyContent: 'center', paddingHorizontal: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  statusButtonSelected: { backgroundColor: colors.blush, borderColor: colors.rose },
  statusText: { fontSize: 12, fontWeight: '700', color: colors.muted },
  statusTextSelected: { color: colors.roseDark },
  safetyCard: { padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  safetyTitle: { fontSize: 15, fontWeight: '800', color: colors.roseDark },
  safetyText: { marginTop: spacing.sm, fontSize: 13, lineHeight: 20, color: colors.muted },
  saveButton: { minHeight: 58, flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.rose },
  saveText: { fontSize: 16, fontWeight: '800', color: colors.surface },
  disabled: { opacity: 0.55 },
});
