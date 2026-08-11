import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JananiPageHeader } from '@/components/navigation/JananiPageHeader';
import { colors, radius, spacing } from '@/theme/tokens';

export default function JourneyScreen() {
  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <JananiPageHeader
          eyebrow="YOUR JOURNEY"
          title="Every week becomes a memory"
          subtitle="Follow your pregnancy week by week and keep the moments you want to remember."
        />

        <Pressable onPress={() => router.push('/pregnancy-guide')} style={({ pressed }) => [styles.heroCard, pressed && styles.pressed]}>
          <View style={styles.heroIcon}>
            <Ionicons name="heart-circle-outline" size={30} color={colors.roseDark} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.cardEyebrow}>PREGNANCY</Text>
            <Text style={styles.cardTitle}>Week-by-week guide</Text>
            <Text style={styles.cardText}>See pregnancy progress and trimester care already available in Janani.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>

        <Pressable onPress={() => router.push('/journal')} style={({ pressed }) => [styles.journalCard, pressed && styles.pressed]}>
          <View style={styles.journalIcon}>
            <Ionicons name="book-outline" size={26} color={colors.roseDark} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.cardTitle}>Pregnancy journal</Text>
            <Text style={styles.cardText}>Keep notes, feelings and memories in your private Janani space.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xl },
  flex: { flex: 1 },
  pressed: { opacity: 0.8 },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.blush,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  journalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  journalIcon: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sageSoft,
  },
  cardEyebrow: { fontSize: 11, letterSpacing: 1.5, fontWeight: '800', color: colors.roseDark },
  cardTitle: { marginTop: 2, fontSize: 17, fontWeight: '900', color: colors.ink },
  cardText: { marginTop: spacing.xs, fontSize: 13, lineHeight: 19, color: colors.muted },
});
