import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JananiPageHeader } from '@/components/navigation/JananiPageHeader';
import {
  getCurrentAiPersonalizationConsent,
  parseAiPersonalizationConsent,
  setAiPersonalizationConsent,
  type AiPersonalizationConsent,
} from '@/features/ai/aiConsent';
import { supabase } from '@/lib/supabase';
import { colors, radius, spacing } from '@/theme/tokens';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  personalized?: boolean;
  selectedTopics?: string[];
};

const QUICK_QUESTIONS = [
  'What are some simple breakfast ideas for me today?',
  'What should I prepare for this week?',
  'Help me prepare questions for my doctor.',
];

function newMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function AiCompanionScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState<AiPersonalizationConsent | null>(null);
  const [consentAvailable, setConsentAvailable] = useState<boolean | null>(null);
  const [consentBusy, setConsentBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await getCurrentAiPersonalizationConsent();
      if (cancelled) return;
      if (result.error) {
        // Partners and accounts without a mother-owned pregnancy intentionally
        // stay in general Ask Janani mode and never receive maternal context.
        setConsentAvailable(false);
        setConsent(null);
        return;
      }
      const parsed = parseAiPersonalizationConsent(result.data);
      setConsentAvailable(Boolean(parsed));
      setConsent(parsed);
    })();
    return () => { cancelled = true; };
  }, []);

  async function saveConsent(enabled: boolean) {
    if (!consent?.pregnancyId || consentBusy) return;
    setConsentBusy(true);
    const result = await setAiPersonalizationConsent(consent.pregnancyId, enabled);
    setConsentBusy(false);
    if (result.error) {
      Alert.alert('Could not update this choice', 'Your previous privacy setting is unchanged. Please try again.');
      return;
    }
    const parsed = parseAiPersonalizationConsent(result.data);
    if (parsed) setConsent(parsed);
  }

  function requestEnablePersonalization() {
    if (!consent || consent.enabled) return;
    Alert.alert(
      'Use your Janani information?',
      'Your question is sent to the configured AI provider when you ask Janani. If you allow personalization, Janani may also send a minimized selection of your pregnancy profile, health details, medicines and values you confirmed from reports. Raw report files are not sent through chat. You can turn this off anytime.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Allow personalization', onPress: () => void saveConsent(true) },
      ],
    );
  }

  function requestDisablePersonalization() {
    if (!consent?.enabled) return;
    Alert.alert(
      'Turn off personalized answers?',
      'Future Ask Janani questions will not include your stored health profile, medicines or confirmed report values with the AI provider.',
      [
        { text: 'Keep on', style: 'cancel' },
        { text: 'Turn off', style: 'destructive', onPress: () => void saveConsent(false) },
      ],
    );
  }

  async function askJanani(text = message) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const recentHistory = messages.slice(-6).map((item) => ({
      role: item.role,
      content: item.text,
    }));
    const userMessage: ChatMessage = { id: newMessageId(), role: 'user', text: trimmed };
    setMessages((current) => [...current, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('janani-ai', {
        body: { message: trimmed, history: recentHistory },
      });
      if (error) throw error;
      if (!data?.answer) throw new Error('Janani did not return an answer.');
      const selectedTopics = Array.isArray(data.selected_topics)
        ? data.selected_topics.filter((item: unknown): item is string => typeof item === 'string').slice(0, 6)
        : [];
      setMessages((current) => [...current, {
        id: newMessageId(),
        role: 'assistant',
        text: String(data.answer),
        personalized: data.personalized === true,
        selectedTopics,
      }]);
    } catch (error) {
      Alert.alert(
        'Janani is unavailable right now',
        error instanceof Error ? error.message : 'Please try again in a little while.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          <JananiPageHeader
            eyebrow="ASK JANANI"
            title="Tell me what is on your mind"
            subtitle="Ask in your own words. Janani keeps your care team—not AI—as the medical authority."
          />

          <View style={styles.safetyCard}>
            <Ionicons name="shield-checkmark-outline" size={25} color={colors.rose} />
            <Text style={styles.safetyText}>
              Janani can support, summarize and explain. It does not diagnose conditions, prescribe treatment or change medicines your clinician gave you.
            </Text>
          </View>

          {consentAvailable === null ? (
            <View style={styles.personalizationCard}>
              <ActivityIndicator color={colors.roseDark} />
              <Text style={styles.personalizationText}>Checking your personalization choice…</Text>
            </View>
          ) : consentAvailable && consent ? (
            <View style={styles.personalizationCard}>
              <View style={styles.personalizationIcon}>
                <Ionicons name={consent.enabled ? 'heart-circle-outline' : 'sparkles-outline'} size={23} color={colors.roseDark} />
              </View>
              <View style={styles.personalizationCopy}>
                <Text style={styles.personalizationTitle}>
                  {consent.enabled ? 'Personalized answers are on' : 'Make answers more personal'}
                </Text>
                <Text style={styles.personalizationText}>
                  {consent.enabled
                    ? 'Janani can send a minimized selection of your stored profile and confirmed report values with your question. Raw report files are never sent through chat.'
                    : 'With your permission, Janani can consider selected pregnancy, health, medicine and confirmed report information instead of making you repeat it.'}
                </Text>
                <Pressable
                  disabled={consentBusy}
                  onPress={consent.enabled ? requestDisablePersonalization : requestEnablePersonalization}
                  style={styles.personalizationButton}
                >
                  {consentBusy ? <ActivityIndicator size="small" color={colors.roseDark} /> : null}
                  <Text style={styles.personalizationButtonText}>{consent.enabled ? 'Turn off' : 'Allow personalization'}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.partnerCard}>
              <Ionicons name="people-outline" size={22} color={colors.roseDark} />
              <Text style={styles.personalizationText}>
                Ask Janani stays in general support mode here. A partner account does not receive the mother&apos;s private health profile or reports.
              </Text>
            </View>
          )}

          {messages.length === 0 ? (
            <View style={styles.quickSection}>
              <Text style={styles.quickTitle}>You can ask things like</Text>
              {QUICK_QUESTIONS.map((question) => (
                <Pressable key={question} onPress={() => void askJanani(question)} style={styles.quickQuestion}>
                  <Text style={styles.quickQuestionText}>{question}</Text>
                  <Ionicons name="arrow-forward" size={17} color={colors.roseDark} />
                </Pressable>
              ))}
            </View>
          ) : null}

          {messages.map((item) => (
            <View key={item.id} style={[styles.messageRow, item.role === 'user' ? styles.userRow : styles.jananiRow]}>
              <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.jananiBubble]}>
                {item.role === 'assistant' ? (
                  <View style={styles.answerHeader}>
                    <View style={styles.answerIcon}><Ionicons name="heart" size={18} color={colors.rose} /></View>
                    <Text style={styles.answerTitle}>Janani</Text>
                    <View style={styles.modePill}>
                      <Text style={styles.modePillText}>{item.personalized ? 'Personalized' : 'General'}</Text>
                    </View>
                  </View>
                ) : null}
                <Text selectable style={styles.messageText}>{item.text}</Text>
                {item.role === 'assistant' && item.personalized && item.selectedTopics?.length ? (
                  <Text style={styles.contextHint}>Considered: {item.selectedTopics.join(' · ')}</Text>
                ) : null}
              </View>
            </View>
          ))}

          {loading ? (
            <View style={[styles.messageRow, styles.jananiRow]}>
              <View style={[styles.messageBubble, styles.jananiBubble, styles.thinkingBubble]}>
                <ActivityIndicator color={colors.rose} />
                <Text style={styles.thinkingText}>Janani is thinking…</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.inputCard}>
            <TextInput
              multiline
              maxLength={1200}
              onChangeText={setMessage}
              placeholder="Ask Janani…"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={message}
            />
            <Pressable
              disabled={!message.trim() || loading}
              onPress={() => void askJanani()}
              style={[styles.sendButton, (!message.trim() || loading) && styles.sendButtonDisabled]}
              accessibilityLabel="Send to Janani"
            >
              <Ionicons name="arrow-up" size={21} color={colors.surface} />
            </Pressable>
          </View>

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
  safetyCard: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.blush, borderWidth: 1, borderColor: colors.border },
  safetyText: { flex: 1, fontSize: 13, lineHeight: 20, color: colors.roseDark },
  personalizationCard: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'flex-start' },
  personalizationIcon: { width: 42, height: 42, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blush },
  personalizationCopy: { flex: 1, gap: spacing.xs },
  personalizationTitle: { fontSize: 15, fontWeight: '800', color: colors.ink },
  personalizationText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.muted },
  personalizationButton: { alignSelf: 'flex-start', minHeight: 38, marginTop: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.background },
  personalizationButtonText: { fontSize: 13, fontWeight: '800', color: colors.roseDark },
  partnerCard: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center' },
  quickSection: { gap: spacing.sm },
  quickTitle: { fontSize: 14, fontWeight: '800', color: colors.ink },
  quickQuestion: { minHeight: 50, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  quickQuestionText: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.ink },
  messageRow: { flexDirection: 'row' },
  userRow: { justifyContent: 'flex-end' },
  jananiRow: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '91%', padding: spacing.md, borderRadius: radius.lg, gap: spacing.sm },
  userBubble: { backgroundColor: colors.rose, borderBottomRightRadius: spacing.xs },
  jananiBubble: { backgroundColor: colors.sageSoft, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: spacing.xs },
  messageText: { fontSize: 15, lineHeight: 23, color: colors.ink },
  answerHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  answerIcon: { width: 32, height: 32, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  answerTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  modePill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.surface },
  modePillText: { fontSize: 10, fontWeight: '800', color: colors.muted, textTransform: 'uppercase' },
  contextHint: { fontSize: 11, lineHeight: 16, color: colors.muted },
  thinkingBubble: { flexDirection: 'row', alignItems: 'center' },
  thinkingText: { fontSize: 13, color: colors.muted },
  inputCard: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  input: { flex: 1, maxHeight: 130, minHeight: 48, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.ink, fontSize: 15, lineHeight: 21, textAlignVertical: 'top' },
  sendButton: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.rose, alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { opacity: 0.45 },
  disclaimer: { textAlign: 'center', fontSize: 12, lineHeight: 18, color: colors.muted },
});
