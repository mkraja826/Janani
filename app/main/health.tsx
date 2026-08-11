import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JananiPageHeader } from '@/components/navigation/JananiPageHeader';
import { colors, radius, spacing } from '@/theme/tokens';

export default function HealthScreen() {
  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <JananiPageHeader
          eyebrow="YOUR HEALTH"
          title="Help Janani understand you"
          subtitle="Your pregnancy, medicines and health details will gradually come together here so Janani can make more relevant suggestions."
        />

        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Ionicons name="heart-outline" size={25} color={colors.roseDark} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.introTitle}>One place for your health</Text>
            <Text style={styles.introText}>For now, your existing health guide and reminders stay available while we build the new structured mother profile.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health tools</Text>
          <ActionCard
            caption="BP, diabetes, thyroid and maternal-care guidance"
            icon="medical-outline"
            onPress={() => router.push('/health-guide')}
            title="Health guide"
          />
          <ActionCard
            caption="Medicines, supplements and care schedules"
            icon="alarm-outline"
            onPress={() => router.push('/reminders')}
            title="Reminders"
          />
          <ActionCard
            caption="Pregnancy nutrition guidance already in Janani"
            icon="nutrition-outline"
            onPress={() => router.push('/food-guide')}
            title="Food guide"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionCard({ icon, title, caption, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  caption: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={22} color={colors.roseDark} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionCaption}>{caption}</Text>
      </View>
      <Ionicons name="chevron-forward" size={19} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xl },
  flex: { flex: 1 },
  introCard: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.sageSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  introIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  introTitle: { fontSize: 17, fontWeight: '900', color: colors.ink },
  introText: { marginTop: spacing.xs, fontSize: 13, lineHeight: 20, color: colors.muted },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.ink },
  actionCard: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.78 },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blush,
  },
  actionTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  actionCaption: { marginTop: 3, fontSize: 12, lineHeight: 18, color: colors.muted },
});
