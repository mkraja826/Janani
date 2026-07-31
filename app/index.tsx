import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function WelcomeScreen() {
  const { session, loading } = useAuth();

  function begin(role: 'mother' | 'partner') {
    router.push(session ? { pathname: '/onboarding', params: { role } } : '/auth');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.mark}>
          <Ionicons name="heart" size={34} color={colors.rose} />
        </View>

        <View style={styles.copy}>
          <Text style={styles.eyebrow}>JANANI</Text>
          <Text style={styles.title}>You are not walking this journey alone.</Text>
          <Text style={styles.subtitle}>
            Gentle reminders, caring guidance, shared moments, and a little warmth for every day of pregnancy.
          </Text>
        </View>

        <View style={styles.card}>
          <Ionicons name="sparkles-outline" size={22} color={colors.gold} />
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle}>A note from Janani</Text>
            <Text style={styles.cardText}>
              One day at a time, child. Rest when your body asks, drink some water, and let us remember the little things together.
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {session ? (
            <Pressable accessibilityRole="button" disabled={loading} onPress={() => router.push('/home')} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Open my Janani</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.surface} />
            </Pressable>
          ) : (
            <>
              <Pressable accessibilityRole="button" disabled={loading} onPress={() => begin('mother')} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>I’m the mother</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.surface} />
              </Pressable>
              <Pressable accessibilityRole="button" disabled={loading} onPress={() => begin('partner')} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>I’m her partner</Text>
              </Pressable>
            </>
          )}
        </View>

        <Text style={styles.disclaimer}>
          Janani supports your care journey and does not replace advice from your doctor.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.lg, justifyContent: 'space-between' },
  mark: { width: 72, height: 72, borderRadius: radius.lg, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  copy: { gap: spacing.md },
  eyebrow: { fontSize: 13, letterSpacing: 3, fontWeight: '800', color: colors.rose },
  title: { fontSize: typography.display, lineHeight: 42, fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: typography.body, lineHeight: 25, color: colors.muted },
  card: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  cardCopy: { flex: 1, gap: spacing.sm },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.roseDark },
  cardText: { fontSize: 15, lineHeight: 23, color: colors.muted },
  actions: { gap: spacing.md },
  primaryButton: { minHeight: 58, paddingHorizontal: spacing.lg, borderRadius: radius.pill, backgroundColor: colors.rose, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm },
  primaryButtonText: { fontSize: 17, fontWeight: '800', color: colors.surface },
  secondaryButton: { minHeight: 58, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.rose, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { fontSize: 17, fontWeight: '700', color: colors.roseDark },
  disclaimer: { textAlign: 'center', fontSize: 12, lineHeight: 18, color: colors.muted },
});
