import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type FamilySummary = {
  role: 'mother' | 'partner';
  familyName: string;
  dueDate: string | null;
  inviteCode: string | null;
};

export default function HomeScreen() {
  const { session, signOut } = useAuth();
  const [summary, setSummary] = useState<FamilySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.replace('/auth');
      return;
    }

    async function load() {
      const { data, error } = await supabase
        .from('family_members')
        .select('role, families(name, invite_code, pregnancies(due_date))')
        .eq('user_id', session!.user.id)
        .maybeSingle();

      if (error || !data) {
        setLoading(false);
        router.replace('/onboarding');
        return;
      }

      const family = Array.isArray(data.families) ? data.families[0] : data.families;
      const pregnancies = family?.pregnancies;
      const pregnancy = Array.isArray(pregnancies) ? pregnancies[0] : pregnancies;
      setSummary({
        role: data.role,
        familyName: family?.name ?? 'Our little family',
        dueDate: pregnancy?.due_date ?? null,
        inviteCode: data.role === 'mother' ? family?.invite_code ?? null : null,
      });
      setLoading(false);
    }

    load();
  }, [session]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.rose} /></View>;
  }

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.eyebrow}>{summary?.familyName.toUpperCase()}</Text>
            <Text style={styles.title}>{summary?.role === 'mother' ? 'How are you feeling today?' : 'A little care goes a long way.'}</Text>
          </View>
          <Pressable accessibilityLabel="Sign out" onPress={async () => { await signOut(); router.replace('/'); }} style={styles.iconButton}>
            <Ionicons name="log-out-outline" size={22} color={colors.muted} />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <Ionicons name="heart-circle" size={48} color={colors.rose} />
          <View style={styles.flex}>
            <Text style={styles.cardEyebrow}>TODAY WITH JANANI</Text>
            <Text style={styles.cardTitle}>Drink a glass of water and take one quiet minute for yourself.</Text>
            {summary?.dueDate && <Text style={styles.cardMeta}>Expected due date: {summary.dueDate}</Text>}
          </View>
        </View>

        {summary?.inviteCode && (
          <View style={styles.inviteCard}>
            <Text style={styles.inviteLabel}>Partner invite code</Text>
            <Text style={styles.inviteCode}>{summary.inviteCode}</Text>
            <Text style={styles.inviteHelp}>Share this privately with your partner. It links both of you to the same family space.</Text>
          </View>
        )}

        <View style={styles.grid}>
          <Feature icon="alarm-outline" title="Reminders" caption="Medicines and care" />
          <Feature icon="book-outline" title="Journal" caption="Keep every memory" />
          <Feature icon="nutrition-outline" title="Food guide" caption="Trimester-aware help" />
          <Feature icon="heart-outline" title="Thinking of you" caption="Send partner warmth" />
        </View>
      </View>
    </SafeAreaView>
  );
}

function Feature({ icon, title, caption }: { icon: keyof typeof Ionicons.glyphMap; title: string; caption: string }) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}><Ionicons name={icon} size={24} color={colors.rose} /></View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureCaption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.lg, gap: spacing.xl },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, alignItems: 'flex-start' },
  eyebrow: { fontSize: 12, letterSpacing: 2.2, fontWeight: '800', color: colors.rose },
  title: { marginTop: spacing.sm, maxWidth: 290, fontSize: 30, lineHeight: 37, fontWeight: '800', color: colors.ink },
  iconButton: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  heroCard: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.blush, borderWidth: 1, borderColor: colors.border },
  flex: { flex: 1 },
  cardEyebrow: { fontSize: 11, letterSpacing: 1.8, fontWeight: '800', color: colors.roseDark },
  cardTitle: { marginTop: spacing.sm, fontSize: 18, lineHeight: 26, fontWeight: '700', color: colors.ink },
  cardMeta: { marginTop: spacing.md, fontSize: 13, color: colors.muted },
  inviteCard: { padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  inviteLabel: { fontSize: 13, fontWeight: '700', color: colors.muted },
  inviteCode: { marginVertical: spacing.sm, fontSize: 28, letterSpacing: 4, fontWeight: '900', color: colors.roseDark },
  inviteHelp: { fontSize: 13, lineHeight: 19, color: colors.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  feature: { width: '47.5%', minHeight: 145, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  featureIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blush },
  featureTitle: { marginTop: spacing.md, fontSize: 16, fontWeight: '800', color: colors.ink },
  featureCaption: { marginTop: spacing.xs, fontSize: 13, color: colors.muted },
});
