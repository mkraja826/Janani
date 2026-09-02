import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JananiPageHeader } from '@/components/navigation/JananiPageHeader';
import { colors, radius, spacing } from '@/theme/tokens';

export default function ReportsScreen() {
  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <JananiPageHeader
          eyebrow="YOUR RECORDS"
          title="Reports"
          subtitle="Keep the records that matter close to your pregnancy journey."
        />

        <View style={styles.heroCard}>
          <View style={styles.iconWrap}>
            <Ionicons name="document-text-outline" size={30} color={colors.roseDark} />
          </View>
          <Text style={styles.heroTitle}>Your care information stays organized</Text>
          <Text style={styles.heroText}>
            The current production app does not yet expose report upload in this tab. PregaLove will keep this area fail-closed until the private upload and confirmation flow is fully release-validated.
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/care-context')}
          style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="clipboard-outline" size={23} color={colors.roseDark} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.actionTitle}>Care Context</Text>
            <Text style={styles.actionText}>Review the information you have chosen to keep in PregaLove.</Text>
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
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.blush,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  heroTitle: { marginTop: spacing.md, fontSize: 19, fontWeight: '900', color: colors.ink },
  heroText: { marginTop: spacing.sm, fontSize: 14, lineHeight: 21, color: colors.muted },
  actionCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sageSoft,
  },
  actionTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  actionText: { marginTop: 3, fontSize: 12, lineHeight: 18, color: colors.muted },
});
