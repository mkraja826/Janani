import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function WelcomeScreen() {
  const { session, loading } = useAuth();

  function begin(role: 'mother' | 'partner') {
    router.push(session ? { pathname: '/onboarding', params: { role } } : { pathname: '/auth', params: { role } });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.brandRow}>
          <View style={styles.mark}><Ionicons name="heart" size={32} color={colors.rose} /></View>
          <View><Text style={styles.eyebrow}>PREGALOVE</Text><Text style={styles.brandCaption}>Your pregnancy, gently organized.</Text></View>
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>Tell PregaLove once. We’ll help with the little things every day.</Text>
          <Text style={styles.subtitle}>
            Set up your pregnancy by talking or typing naturally. PregaLove can organize reminders, food guidance, appointments and daily care around you.
          </Text>
        </View>

        <View style={styles.aiCard}>
          <View style={styles.aiIcon}><Ionicons name="sparkles" size={24} color={colors.surface} /></View>
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle}>AI-assisted setup</Text>
            <Text style={styles.cardText}>Say things like “I’m 14 weeks, vegetarian, have thyroid, and take calcium after dinner.” You review everything before it is saved.</Text>
          </View>
        </View>

        <View style={styles.promiseRow}>
          <Promise icon="checkmark-circle-outline" text="Less typing" />
          <Promise icon="shield-checkmark-outline" text="You confirm important changes" />
          <Promise icon="heart-outline" text="Medical decisions stay with your care team" />
        </View>

        <View style={styles.actions}>
          {session ? (
            <Pressable accessibilityRole="button" disabled={loading} onPress={() => router.push('/home')} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Open today</Text><Ionicons name="arrow-forward" size={20} color={colors.surface} />
            </Pressable>
          ) : (
            <>
              <Pressable accessibilityRole="button" disabled={loading} onPress={() => begin('mother')} style={styles.primaryButton}>
                <Ionicons name="sparkles-outline" size={19} color={colors.surface} /><Text style={styles.primaryButtonText}>Set up my pregnancy</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={loading} onPress={() => begin('partner')} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>I’m supporting my partner</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function Promise({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return <View style={styles.promise}><Ionicons name={icon} size={18} color={colors.sage} /><Text style={styles.promiseText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.lg, justifyContent: 'space-between', gap: spacing.lg },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  mark: { width: 58, height: 58, borderRadius: radius.lg, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 13, letterSpacing: 3, fontWeight: '900', color: colors.rose },
  brandCaption: { marginTop: 3, fontSize: 12, color: colors.muted },
  copy: { gap: spacing.md },
  title: { fontSize: typography.display, lineHeight: 42, fontWeight: '900', color: colors.ink },
  subtitle: { fontSize: typography.body, lineHeight: 25, color: colors.muted },
  aiCard: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  aiIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.rose, alignItems: 'center', justifyContent: 'center' },
  cardCopy: { flex: 1, gap: spacing.sm },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
  cardText: { fontSize: 14, lineHeight: 21, color: colors.muted },
  promiseRow: { gap: spacing.sm },
  promise: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  promiseText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.inkSoft },
  actions: { gap: spacing.md },
  primaryButton: { minHeight: 58, paddingHorizontal: spacing.lg, borderRadius: radius.pill, backgroundColor: colors.rose, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm },
  primaryButtonText: { fontSize: 17, fontWeight: '800', color: colors.surface },
  secondaryButton: { minHeight: 58, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.rose, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { fontSize: 16, fontWeight: '700', color: colors.roseDark },
});
