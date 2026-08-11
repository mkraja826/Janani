import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
          subtitle="Your pregnancy reports will live here so Janani can use confirmed information without asking you to enter the same details again."
        />

        <View style={styles.heroCard}>
          <View style={styles.iconWrap}>
            <Ionicons name="document-text-outline" size={30} color={colors.roseDark} />
          </View>
          <Text style={styles.heroTitle}>Your health timeline starts here</Text>
          <Text style={styles.heroText}>
            Blood tests, prescriptions, written scan reports and other pregnancy records will be organized here in the next report-intelligence milestone.
          </Text>
        </View>

        <View style={styles.emptyState}>
          <Ionicons name="cloud-upload-outline" size={34} color={colors.sage} />
          <Text style={styles.emptyTitle}>No reports added yet</Text>
          <Text style={styles.emptyText}>
            Report upload is intentionally not enabled in this shell milestone. We will add private image/PDF upload, extraction and confirmation as a separate safety-reviewed build.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xl },
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
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  emptyTitle: { marginTop: spacing.md, fontSize: 16, fontWeight: '800', color: colors.ink },
  emptyText: { marginTop: spacing.sm, maxWidth: 340, textAlign: 'center', fontSize: 13, lineHeight: 20, color: colors.muted },
});
