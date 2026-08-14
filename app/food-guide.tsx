import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme/tokens';

const groups = [
  {
    icon: 'leaf-outline' as const,
    title: 'Build every plate gently',
    text: 'Choose a mix of vegetables, fruit, whole grains, protein foods and calcium-rich foods. Small regular meals can be easier when appetite or nausea changes.',
  },
  {
    icon: 'water-outline' as const,
    title: 'Hydration matters',
    text: 'Sip water through the day. Increase fluids in hot weather, after activity, or when your maternity team recommends it.',
  },
  {
    icon: 'nutrition-outline' as const,
    title: 'Iron, folate and protein',
    text: 'Include iron- and folate-rich foods and regular protein sources. Take supplements only as prescribed or recommended by your maternity clinician.',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Food safety first',
    text: 'Prefer freshly prepared, thoroughly cooked food and pasteurized dairy. Wash produce well and avoid foods your clinician has specifically told you to avoid.',
  },
];

export default function FoodGuideScreen() {
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>JANANI FOOD GUIDE</Text>
            <Text style={styles.title}>Simple nourishment for pregnancy</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Ionicons name="nutrition" size={38} color={colors.rose} />
          <Text style={styles.heroTitle}>Food guidance, not a prescription</Text>
          <Text style={styles.body}>
            Use this guide for everyday ideas. If you have diabetes, thyroid disease, high blood pressure, anemia, allergies, severe vomiting, or another medical condition, follow your clinician or dietitian&apos;s plan first.
          </Text>
        </View>

        {groups.map((item) => (
          <View key={item.title} style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={24} color={colors.rose} />
            </View>
            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.body}>{item.text}</Text>
            </View>
          </View>
        ))}

        <View style={styles.askCard}>
          <View style={styles.askIcon}><Ionicons name="sparkles-outline" size={24} color={colors.gold} /></View>
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle}>Need an idea for today?</Text>
            <Text style={styles.body}>Ask Janani Companion for a general meal idea. Do not use AI advice as a substitute for medical nutrition care.</Text>
            <Pressable onPress={() => router.push('/ai-companion')} style={styles.askButton}>
              <Text style={styles.askButtonText}>Ask Janani</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.surface} />
            </Pressable>
          </View>
        </View>

        <Text style={styles.disclaimer}>Janani provides supportive educational information and does not diagnose, prescribe, or replace professional medical care.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  header: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', marginBottom: spacing.sm },
  headerCopy: { flex: 1 },
  backButton: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  eyebrow: { fontSize: 12, letterSpacing: 1.8, fontWeight: '800', color: colors.rose },
  title: { marginTop: spacing.xs, fontSize: 28, lineHeight: 35, fontWeight: '900', color: colors.ink },
  hero: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.blush, borderWidth: 1, borderColor: colors.border },
  heroTitle: { fontSize: 19, fontWeight: '800', color: colors.ink },
  card: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  askCard: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.sageSoft, borderWidth: 1, borderColor: colors.border },
  iconWrap: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blush },
  askIcon: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  cardCopy: { flex: 1, gap: spacing.sm },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
  body: { fontSize: 14, lineHeight: 21, color: colors.muted },
  askButton: { marginTop: spacing.xs, minHeight: 46, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.rose, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  askButtonText: { fontSize: 14, fontWeight: '800', color: colors.surface },
  disclaimer: { marginTop: spacing.sm, textAlign: 'center', fontSize: 12, lineHeight: 18, color: colors.muted },
});
