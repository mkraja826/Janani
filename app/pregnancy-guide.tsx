import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TRIMESTER_GUIDES } from '@/features/pregnancy/guideContent';
import { colors, radius, spacing } from '@/theme/tokens';

export default function PregnancyGuideScreen() {
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>MY PREGNANCY</Text>
            <Text style={styles.title}>A gentle guide through each trimester</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Ionicons name="heart-circle" size={42} color={colors.rose} />
          <Text style={styles.heroTitle}>Use Janani beside your maternity care, not instead of it.</Text>
          <Text style={styles.body}>Your home screen already calculates your current pregnancy week and trimester from the due date saved during onboarding. This guide gives simple supportive reminders for each stage.</Text>
        </View>

        {TRIMESTER_GUIDES.map((item) => (
          <View key={item.title} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.iconWrap}><Ionicons name={item.icon} size={24} color={colors.rose} /></View>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.weeks}>{item.weeks}</Text>
              </View>
            </View>
            {item.points.map((point) => (
              <View key={point} style={styles.pointRow}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.sage} />
                <Text style={styles.pointText}>{point}</Text>
              </View>
            ))}
          </View>
        ))}

        <Pressable onPress={() => router.push('/reminders')} style={styles.primaryButton}>
          <Ionicons name="alarm-outline" size={19} color={colors.surface} />
          <Text style={styles.primaryButtonText}>Open my reminders</Text>
        </Pressable>
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
  heroTitle: { fontSize: 18, lineHeight: 25, fontWeight: '800', color: colors.ink },
  body: { fontSize: 14, lineHeight: 21, color: colors.muted },
  card: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  cardTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  iconWrap: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blush },
  flex: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  weeks: { marginTop: 3, fontSize: 13, fontWeight: '700', color: colors.roseDark },
  pointRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  pointText: { flex: 1, fontSize: 14, lineHeight: 21, color: colors.muted },
  primaryButton: { minHeight: 52, paddingHorizontal: spacing.lg, borderRadius: radius.pill, backgroundColor: colors.rose, flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontSize: 15, fontWeight: '800', color: colors.surface },
  disclaimer: { marginTop: spacing.sm, textAlign: 'center', fontSize: 12, lineHeight: 18, color: colors.muted },
});
