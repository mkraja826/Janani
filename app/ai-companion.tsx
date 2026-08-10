import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { colors, radius, spacing } from '@/theme/tokens';

export default function AiCompanionScreen() {
  const [message, setMessage] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function askJanani() {
    const trimmed = message.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setAnswer(null);
    try {
      const { data, error } = await supabase.functions.invoke('janani-ai', {
        body: { message: trimmed },
      });
      if (error) throw error;
      if (!data?.answer) throw new Error('Janani did not return an answer.');
      setAnswer(String(data.answer));
    } catch (error) {
      Alert.alert(
        'Janani AI is unavailable',
        error instanceof Error ? error.message : 'Please try again in a little while.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.page}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color={colors.ink} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>JANANI COMPANION</Text>
              <Text style={styles.title}>Ask a gentle pregnancy question</Text>
            </View>
          </View>

          <View style={styles.safetyCard}>
            <Ionicons name="shield-checkmark-outline" size={25} color={colors.rose} />
            <Text style={styles.safetyText}>
              Janani AI gives general educational support only. It cannot diagnose, prescribe, interpret emergencies, or replace your doctor.
            </Text>
          </View>

          <View style={styles.inputCard}>
            <Text style={styles.label}>What would you like to ask?</Text>
            <TextInput
              multiline
              maxLength={1200}
              onChangeText={setMessage}
              placeholder="Example: What are some simple breakfast ideas during pregnancy?"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={message}
            />
            <Pressable disabled={!message.trim() || loading} onPress={() => void askJanani()} style={[styles.askButton, (!message.trim() || loading) && styles.askButtonDisabled]}>
              {loading ? <ActivityIndicator color={colors.surface} /> : <Ionicons name="sparkles-outline" size={19} color={colors.surface} />}
              <Text style={styles.askButtonText}>{loading ? 'Thinking…' : 'Ask Janani'}</Text>
            </Pressable>
          </View>

          {answer ? (
            <View style={styles.answerCard}>
              <View style={styles.answerHeader}>
                <View style={styles.answerIcon}><Ionicons name="heart" size={20} color={colors.rose} /></View>
                <Text style={styles.answerTitle}>Janani says</Text>
              </View>
              <Text selectable style={styles.answerText}>{answer}</Text>
            </View>
          ) : null}

          <Text style={styles.disclaimer}>
            If you have severe pain, heavy bleeding, trouble breathing, seizures, fainting, or feel that something is seriously wrong, seek urgent medical care rather than waiting for an AI response.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  header: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  headerCopy: { flex: 1 },
  backButton: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  eyebrow: { fontSize: 12, letterSpacing: 1.8, fontWeight: '800', color: colors.rose },
  title: { marginTop: spacing.xs, fontSize: 28, lineHeight: 35, fontWeight: '900', color: colors.ink },
  safetyCard: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.blush, borderWidth: 1, borderColor: colors.border },
  safetyText: { flex: 1, fontSize: 13, lineHeight: 20, color: colors.roseDark },
  inputCard: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 16, fontWeight: '800', color: colors.ink },
  input: { minHeight: 150, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, color: colors.ink, fontSize: 15, lineHeight: 22, textAlignVertical: 'top' },
  askButton: { minHeight: 52, borderRadius: radius.pill, backgroundColor: colors.rose, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  askButtonDisabled: { opacity: 0.55 },
  askButtonText: { fontSize: 16, fontWeight: '800', color: colors.surface },
  answerCard: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.sageSoft, borderWidth: 1, borderColor: colors.border },
  answerHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  answerIcon: { width: 36, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  answerTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
  answerText: { fontSize: 15, lineHeight: 23, color: colors.ink },
  disclaimer: { textAlign: 'center', fontSize: 12, lineHeight: 18, color: colors.muted },
});
