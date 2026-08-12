import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SUPPORTED_UI_LANGUAGES, type SupportedUiLanguage } from '@/i18n/catalog';
import { useLanguage } from '@/providers/LanguageProvider';
import { colors, radius, spacing } from '@/theme/tokens';

export default function LanguageScreen() {
  const { language, setLanguage, t } = useLanguage();
  const [busy, setBusy] = useState<SupportedUiLanguage | null>(null);

  async function choose(nextLanguage: SupportedUiLanguage) {
    if (busy || nextLanguage === language) return;
    setBusy(nextLanguage);
    const result = await setLanguage(nextLanguage);
    setBusy(null);
    if (result.error) {
      Alert.alert(t('language.errorTitle'), t('language.errorBody'));
      return;
    }
    Alert.alert(t('language.saved'), t('language.savedBody'));
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </Pressable>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>{t('language.eyebrow')}</Text>
            <Text style={styles.title}>{t('language.title')}</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="language-outline" size={27} color={colors.roseDark} />
          </View>
          <Text style={styles.heroText}>{t('language.subtitle')}</Text>
        </View>

        <View style={styles.list}>
          {SUPPORTED_UI_LANGUAGES.map((item) => {
            const selected = item.code === language;
            return (
              <Pressable
                key={item.code}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                disabled={Boolean(busy)}
                onPress={() => void choose(item.code)}
                style={({ pressed }) => [
                  styles.languageCard,
                  selected && styles.selectedCard,
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>
                <View style={styles.flex}>
                  <Text style={styles.nativeLabel}>{item.nativeLabel}</Text>
                  <Text style={styles.label}>{item.label}</Text>
                </View>
                {busy === item.code ? (
                  <ActivityIndicator color={colors.rose} />
                ) : selected ? (
                  <Ionicons name="checkmark-circle" size={23} color={colors.rose} />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={20} color={colors.roseDark} />
          <Text style={styles.noteText}>{t('language.fallback')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  flex: { flex: 1 },
  backButton: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  eyebrow: { fontSize: 11, letterSpacing: 1.7, fontWeight: '900', color: colors.rose },
  title: { marginTop: spacing.xs, fontSize: 27, lineHeight: 34, fontWeight: '900', color: colors.ink },
  hero: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.blush, borderWidth: 1, borderColor: colors.border },
  heroIcon: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  heroText: { flex: 1, fontSize: 14, lineHeight: 21, color: colors.ink },
  list: { gap: spacing.sm },
  languageCard: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  selectedCard: { backgroundColor: colors.sageSoft, borderColor: colors.rose },
  pressed: { opacity: 0.8 },
  radio: { width: 22, height: 22, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border },
  radioSelected: { borderColor: colors.rose },
  radioDot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.rose },
  nativeLabel: { fontSize: 18, fontWeight: '900', color: colors.ink },
  label: { marginTop: 2, fontSize: 12, color: colors.muted },
  note: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.sageSoft },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18, color: colors.ink },
});
