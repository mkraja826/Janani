import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JananiPageHeader } from '@/components/navigation/JananiPageHeader';
import {
  conditionLabel,
  emptyHealthProfile,
  healthProfileCompletion,
  parseHealthProfile,
  type HealthProfile,
} from '@/features/health/healthProfile';
import { getOwnHealthProfile, getOwnPrivateCareContext } from '@/features/health/healthRpc';
import { resolveActivePregnancyId } from '@/features/pregnancy/activePregnancy';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

type PregnancyBasics = {
  height_cm: number | null;
  pre_pregnancy_weight_kg: number | null;
  last_menstrual_period: string | null;
};

type PrivateCareContext = {
  medications?: unknown[];
};

type FamilyRole = 'mother' | 'partner' | 'caregiver';

export default function HealthScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [role, setRole] = useState<FamilyRole | null>(null);
  const [pregnancyId, setPregnancyId] = useState<string | null>(null);
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [basics, setBasics] = useState<PregnancyBasics | null>(null);
  const [medicationCount, setMedicationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setError(false);
    const membership = await supabase.from('family_members').select('role').eq('user_id', userId).maybeSingle();
    if (membership.error || !membership.data) {
      setError(true);
      setLoading(false);
      return;
    }
    const resolvedRole = membership.data.role as FamilyRole;
    setRole(resolvedRole);
    const activeId = await resolveActivePregnancyId(userId);
    setPregnancyId(activeId);
    if (!activeId || resolvedRole !== 'mother') {
      setLoading(false);
      return;
    }

    const [healthResult, pregnancyResult, contextResult] = await Promise.all([
      getOwnHealthProfile(activeId),
      supabase.rpc('get_mother_pregnancy_private_details'),
      getOwnPrivateCareContext(activeId),
    ]);
    if (healthResult.error || pregnancyResult.error || contextResult.error) {
      setError(true);
      setLoading(false);
      return;
    }

    setProfile(parseHealthProfile(healthResult.data, activeId));
    const firstPregnancy = Array.isArray(pregnancyResult.data) ? pregnancyResult.data[0] : pregnancyResult.data;
    setBasics(firstPregnancy ? {
      height_cm: firstPregnancy.height_cm ?? null,
      pre_pregnancy_weight_kg: firstPregnancy.pre_pregnancy_weight_kg ?? null,
      last_menstrual_period: firstPregnancy.last_menstrual_period ?? null,
    } : null);
    const privateContext = contextResult.data && typeof contextResult.data === 'object' && !Array.isArray(contextResult.data)
      ? contextResult.data as PrivateCareContext
      : {};
    setMedicationCount(Array.isArray(privateContext.medications) ? privateContext.medications.length : 0);
    setLoading(false);
  }, [userId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const safeProfile = profile ?? (pregnancyId ? emptyHealthProfile(pregnancyId) : null);
  const completion = useMemo(
    () => safeProfile ? healthProfileCompletion(safeProfile, Boolean(basics?.height_cm && basics?.pre_pregnancy_weight_kg)) : null,
    [basics?.height_cm, basics?.pre_pregnancy_weight_kg, safeProfile],
  );

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.rose} /></View>;

  if (role && role !== 'mother') {
    return (
      <SafeAreaView style={styles.page} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <JananiPageHeader
            eyebrow="SUPPORT HER WELL"
            title="Her health stays hers"
            subtitle="Janani keeps the mother’s detailed health profile private. Your view focuses on helping, remembering and staying close."
          />
          <View style={styles.privacyCard}>
            <Ionicons name="shield-checkmark-outline" size={27} color={colors.roseDark} />
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>Privacy by default</Text>
              <Text style={styles.cardText}>You can still support reminders, pregnancy progress and shared care without seeing private medical details.</Text>
            </View>
          </View>
          <ActionCard icon="book-outline" title="Pregnancy health guide" caption="Learn what support may be useful during pregnancy." onPress={() => router.push('/health-guide')} />
          <ActionCard icon="alarm-outline" title="Shared reminders" caption="Help the family keep up with medicines and care tasks." onPress={() => router.push('/reminders')} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error || !safeProfile) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Janani could not load your health details</Text>
          <Text style={styles.errorText}>Your saved information has not been removed.</Text>
          <Pressable onPress={() => { setLoading(true); void load(); }} style={styles.primaryButton}><Text style={styles.primaryText}>Try again</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const conditions = safeProfile.conditions;
  const knownBasics = [basics?.height_cm ? `${basics.height_cm} cm` : null, basics?.pre_pregnancy_weight_kg ? `${basics.pre_pregnancy_weight_kg} kg before pregnancy` : null].filter(Boolean).join(' · ');

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <JananiPageHeader
          eyebrow="YOUR HEALTH"
          title="What Janani understands about you"
          subtitle="Add details once. Janani can use them quietly in the background to make future guidance more relevant."
        />

        <View style={styles.understandingCard}>
          <View style={styles.understandingTop}>
            <View style={styles.understandingIcon}><Ionicons name="heart-circle-outline" size={28} color={colors.roseDark} /></View>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>{completion?.completed ?? 0} of {completion?.total ?? 6} health areas understood</Text>
              <Text style={styles.cardText}>You do not need to complete everything at once. Each useful detail helps Janani avoid generic suggestions.</Text>
            </View>
          </View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.round((completion?.ratio ?? 0) * 100)}%` }]} /></View>
          <Pressable onPress={() => router.push('/edit-health-profile')} style={styles.primaryButton}>
            <Text style={styles.primaryText}>Update my health details</Text>
            <Ionicons name="arrow-forward" size={19} color={colors.surface} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Janani currently knows</Text>
          <InfoCard icon="calendar-outline" title="Pregnancy basics" value={knownBasics || 'Add height and pre-pregnancy weight'} caption="Helps with pregnancy and nutrition context." />
          <InfoCard icon="scale-outline" title="Current weight" value={safeProfile.current_weight_kg ? `${safeProfile.current_weight_kg} kg` : 'Not added yet'} caption="Useful for following changes during pregnancy." />
          <InfoCard icon="nutrition-outline" title="Food preference" value={safeProfile.dietary_pattern === 'no_preference' ? 'Not added yet' : safeProfile.dietary_pattern.replaceAll('_', ' ')} caption={safeProfile.allergies.length ? `Allergies noted: ${safeProfile.allergies.join(', ')}` : 'Add allergies so Janani can avoid unsuitable food suggestions.'} />
          <InfoCard icon="fitness-outline" title="Activity" value={safeProfile.activity_level === 'not_set' ? 'Not added yet' : safeProfile.activity_level.replaceAll('_', ' ')} caption="Helps keep general wellness suggestions realistic." />
          <InfoCard icon="medical-outline" title="Health conditions" value={conditions.length ? conditions.map((item) => conditionLabel(item.condition_code)).join(', ') : 'None added'} caption="Only doctor-diagnosed, under-evaluation or relevant pregnancy-history entries belong here." />
          <InfoCard icon="medkit-outline" title="Medicines & supplements" value={medicationCount ? `${medicationCount} saved` : 'No private medication records yet'} caption="Medicine reminders remain available separately." />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Useful next steps</Text>
          <ActionCard icon="alarm-outline" title="Medicines & reminders" caption="Manage the care schedule you already use." onPress={() => router.push('/reminders')} />
          <ActionCard icon="book-outline" title="Health guide" caption="Read pregnancy health guidance without changing your profile." onPress={() => router.push('/health-guide')} />
          <ActionCard icon="nutrition-outline" title="Food guide" caption="See the pregnancy nutrition guide already in Janani." onPress={() => router.push('/food-guide')} />
        </View>

        <Text style={styles.disclaimer}>Profile details are self-reported unless clearly marked otherwise. Janani does not convert them into a diagnosis.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoCard({ icon, title, value, caption }: { icon: keyof typeof Ionicons.glyphMap; title: string; value: string; caption: string }) {
  return <View style={styles.infoCard}><View style={styles.infoIcon}><Ionicons name={icon} size={21} color={colors.roseDark} /></View><View style={styles.flex}><Text style={styles.infoTitle}>{title}</Text><Text style={styles.infoValue}>{value}</Text><Text style={styles.infoCaption}>{caption}</Text></View></View>;
}

function ActionCard({ icon, title, caption, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; caption: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}><View style={styles.actionIcon}><Ionicons name={icon} size={22} color={colors.roseDark} /></View><View style={styles.flex}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionCaption}>{caption}</Text></View><Ionicons name="chevron-forward" size={19} color={colors.muted} /></Pressable>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xl },
  flex: { flex: 1 },
  pressed: { opacity: 0.78 },
  understandingCard: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.sageSoft, borderWidth: 1, borderColor: colors.border },
  understandingTop: { flexDirection: 'row', gap: spacing.md },
  understandingIcon: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  cardTitle: { fontSize: 17, fontWeight: '900', color: colors.ink },
  cardText: { marginTop: spacing.xs, fontSize: 13, lineHeight: 20, color: colors.muted },
  progressTrack: { height: 8, overflow: 'hidden', borderRadius: radius.pill, backgroundColor: colors.surface },
  progressFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.rose },
  primaryButton: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.pill, backgroundColor: colors.rose },
  primaryText: { color: colors.surface, fontWeight: '900' },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.ink },
  infoCard: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  infoIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blush },
  infoTitle: { fontSize: 12, fontWeight: '800', color: colors.muted },
  infoValue: { marginTop: 2, fontSize: 15, lineHeight: 20, fontWeight: '900', color: colors.ink, textTransform: 'capitalize' },
  infoCaption: { marginTop: 4, fontSize: 11, lineHeight: 17, color: colors.muted },
  actionCard: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  actionIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blush },
  actionTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  actionCaption: { marginTop: 3, fontSize: 12, lineHeight: 18, color: colors.muted },
  privacyCard: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.sageSoft, borderWidth: 1, borderColor: colors.border },
  disclaimer: { textAlign: 'center', fontSize: 12, lineHeight: 18, color: colors.muted },
  errorTitle: { textAlign: 'center', fontSize: 20, fontWeight: '900', color: colors.ink },
  errorText: { textAlign: 'center', fontSize: 14, lineHeight: 21, color: colors.muted },
});
