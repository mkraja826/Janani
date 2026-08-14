import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ACTIVITY_OPTIONS,
  CONDITION_OPTIONS,
  DIET_OPTIONS,
  emptyHealthProfile,
  parseHealthProfile,
  type HealthCondition,
  type HealthProfile,
} from '@/features/health/healthProfile';
import { getOwnHealthProfile, saveOwnHealthProfile } from '@/features/health/healthRpc';
import { resolveActivePregnancyId } from '@/features/pregnancy/activePregnancy';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

function splitList(value: string): string[] {
  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))].slice(0, 20);
}

export default function EditHealthProfileScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [pregnancyId, setPregnancyId] = useState<string | null>(null);
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [weight, setWeight] = useState('');
  const [allergies, setAllergies] = useState('');
  const [foodsAvoided, setFoodsAvoided] = useState('');
  const [cuisines, setCuisines] = useState('');
  const [clinicianInstructions, setClinicianInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let disposed = false;
    void (async () => {
      if (!userId) return;
      const activeId = await resolveActivePregnancyId(userId);
      if (disposed) return;
      if (!activeId) {
        setLoading(false);
        return;
      }
      setPregnancyId(activeId);
      const result = await getOwnHealthProfile(activeId);
      if (disposed) return;
      if (result.error) {
        Alert.alert('Could not load your health details', result.error.message);
        setProfile(emptyHealthProfile(activeId));
      } else {
        const next = parseHealthProfile(result.data, activeId);
        setProfile(next);
        setWeight(next.current_weight_kg?.toString() ?? '');
        setAllergies(next.allergies.join(', '));
        setFoodsAvoided(next.foods_avoided.join(', '));
        setCuisines(next.cuisine_preferences.join(', '));
        setClinicianInstructions(next.clinician_dietary_instructions ?? '');
      }
      setLoading(false);
    })();
    return () => { disposed = true; };
  }, [userId]);

  const selectedConditions = useMemo(
    () => new Map((profile?.conditions ?? []).map((item) => [item.condition_code, item])),
    [profile?.conditions],
  );

  function toggleCondition(code: string, defaultStatus: HealthCondition['status']) {
    if (!profile) return;
    const exists = selectedConditions.has(code);
    setProfile({
      ...profile,
      conditions: exists
        ? profile.conditions.filter((item) => item.condition_code !== code)
        : [...profile.conditions, { condition_code: code, status: defaultStatus }],
    });
  }

  async function save() {
    if (!profile || !pregnancyId) return;
    const parsedWeight = weight.trim() ? Number(weight) : null;
    if (parsedWeight !== null && (!Number.isFinite(parsedWeight) || parsedWeight < 25 || parsedWeight > 300)) {
      Alert.alert('Check your weight', 'Enter a weight between 25 and 300 kg, or leave it blank.');
      return;
    }
    setSaving(true);
    const result = await saveOwnHealthProfile({
      pregnancyId,
      profile: {
        current_weight_kg: parsedWeight,
        pregnancy_type: profile.pregnancy_type,
        dietary_pattern: profile.dietary_pattern,
        activity_level: profile.activity_level,
        cuisine_preferences: splitList(cuisines),
        allergies: splitList(allergies),
        foods_avoided: splitList(foodsAvoided),
        clinician_dietary_instructions: clinicianInstructions.trim() || null,
      },
      conditions: profile.conditions,
    });
    setSaving(false);
    if (result.error) {
      Alert.alert('Could not save your health details', result.error.message);
      return;
    }
    router.back();
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.rose} /></View>;
  }

  if (!profile || !pregnancyId) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No active pregnancy found</Text>
          <Text style={styles.emptyText}>Janani needs an active pregnancy before building a health profile.</Text>
          <Pressable onPress={() => router.back()} style={styles.primaryButton}><Text style={styles.primaryText}>Go back</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>YOUR PRIVATE HEALTH DETAILS</Text>
            <Text style={styles.title}>Help Janani understand you</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.explainCard}>
            <Ionicons name="lock-closed-outline" size={21} color={colors.roseDark} />
            <Text style={styles.explainText}>These details are self-reported and private to you. They help Janani personalize safely; they do not become a diagnosis.</Text>
          </View>

          <Section title="Body & pregnancy" subtitle="These help Janani understand nutrition and pregnancy context.">
            <Field label="Current weight (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="60" />
            <Text style={styles.fieldLabel}>Pregnancy type</Text>
            <ChoiceRow options={[
              ['singleton', 'One baby'],
              ['twins', 'Twins'],
              ['higher_multiple', 'More than two'],
              ['unknown', 'Not sure'],
            ]} value={profile.pregnancy_type} onChange={(value) => setProfile({ ...profile, pregnancy_type: value as HealthProfile['pregnancy_type'] })} />
          </Section>

          <Section title="Food & activity" subtitle="So suggestions fit the way you actually eat and live.">
            <Text style={styles.fieldLabel}>Food preference</Text>
            <ChoiceRow options={DIET_OPTIONS} value={profile.dietary_pattern} onChange={(value) => setProfile({ ...profile, dietary_pattern: value as HealthProfile['dietary_pattern'] })} />
            <Text style={styles.fieldLabel}>Activity</Text>
            <ChoiceRow options={ACTIVITY_OPTIONS} value={profile.activity_level} onChange={(value) => setProfile({ ...profile, activity_level: value as HealthProfile['activity_level'] })} />
            <Field label="Foods you are allergic to" value={allergies} onChangeText={setAllergies} placeholder="Peanuts, milk..." helper="Separate multiple items with commas." />
            <Field label="Foods you avoid" value={foodsAvoided} onChangeText={setFoodsAvoided} placeholder="Foods you choose not to eat" helper="This is preference information, not a medical restriction." />
            <Field label="Cuisines you prefer" value={cuisines} onChangeText={setCuisines} placeholder="Telugu, South Indian..." helper="This helps later meal suggestions feel familiar." />
          </Section>

          <Section title="Health conditions" subtitle="Select only conditions a doctor has diagnosed or is currently evaluating, plus relevant pregnancy history.">
            <View style={styles.conditionList}>
              {CONDITION_OPTIONS.map(([code, label, defaultStatus]) => {
                const selected = selectedConditions.has(code);
                return (
                  <Pressable key={code} onPress={() => toggleCondition(code, defaultStatus)} style={[styles.conditionCard, selected && styles.conditionCardSelected]}>
                    <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={selected ? colors.roseDark : colors.muted} />
                    <Text style={[styles.conditionText, selected && styles.conditionTextSelected]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          <Section title="Doctor’s food instructions" subtitle="Only enter instructions actually given by your clinician.">
            <Field label="Clinician instructions" value={clinicianInstructions} onChangeText={setClinicianInstructions} placeholder="For example: advice given for your diet" multiline />
          </Section>

          <Pressable disabled={saving} onPress={() => void save()} style={[styles.primaryButton, saving && styles.disabled]}>
            {saving ? <ActivityIndicator color={colors.surface} /> : <><Text style={styles.primaryText}>Save my health details</Text><Ionicons name="checkmark" size={20} color={colors.surface} /></>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionSubtitle}>{subtitle}</Text>{children}</View>;
}

function ChoiceRow({ options, value, onChange }: { options: readonly (readonly [string, string])[]; value: string; onChange: (value: string) => void }) {
  return <View style={styles.chips}>{options.map(([optionValue, label]) => <Pressable key={optionValue} onPress={() => onChange(optionValue)} style={[styles.chip, value === optionValue && styles.chipSelected]}><Text style={[styles.chipText, value === optionValue && styles.chipTextSelected]}>{label}</Text></Pressable>)}</View>;
}

function Field({ label, helper, multiline, ...props }: ComponentProps<typeof TextInput> & { label: string; helper?: string; multiline?: boolean }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text>{helper ? <Text style={styles.helper}>{helper}</Text> : null}<TextInput {...props} multiline={multiline} placeholderTextColor={colors.muted} style={[styles.input, multiline && styles.inputMultiline]} /></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.sm },
  iconButton: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 10, letterSpacing: 1.5, fontWeight: '800', color: colors.roseDark },
  title: { marginTop: 3, fontSize: 24, lineHeight: 30, fontWeight: '900', color: colors.ink },
  content: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl, gap: spacing.lg },
  explainCard: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.sageSoft },
  explainText: { flex: 1, fontSize: 13, lineHeight: 20, color: colors.ink },
  section: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.ink },
  sectionSubtitle: { marginTop: -spacing.xs, fontSize: 12, lineHeight: 18, color: colors.muted },
  field: { gap: spacing.xs },
  fieldLabel: { fontSize: 13, fontWeight: '800', color: colors.ink },
  helper: { fontSize: 11, lineHeight: 16, color: colors.muted },
  input: { minHeight: 50, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, color: colors.ink, fontSize: 15 },
  inputMultiline: { minHeight: 100, paddingTop: spacing.md, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minHeight: 42, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  chipSelected: { backgroundColor: colors.blush, borderColor: colors.rose },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.muted },
  chipTextSelected: { color: colors.roseDark },
  conditionList: { gap: spacing.sm },
  conditionCard: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.md, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  conditionCardSelected: { backgroundColor: colors.blush, borderColor: colors.rose },
  conditionText: { flex: 1, fontSize: 13, lineHeight: 18, color: colors.ink },
  conditionTextSelected: { fontWeight: '800', color: colors.roseDark },
  primaryButton: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.pill, backgroundColor: colors.rose },
  primaryText: { color: colors.surface, fontWeight: '900', fontSize: 15 },
  disabled: { opacity: 0.55 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: colors.ink },
  emptyText: { textAlign: 'center', fontSize: 14, lineHeight: 21, color: colors.muted },
});
