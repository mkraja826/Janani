import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { requestCarePlusAi, type CarePlusAiCategory } from '@/features/ai/carePlusAi';
import { resolveActivePregnancyId } from '@/features/pregnancy/activePregnancy';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

const quickActions: Array<{ category: CarePlusAiCategory; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { category: 'daily_summary', label: 'Today', icon: 'sunny-outline' },
  { category: 'appointment_summary', label: 'Appointment', icon: 'calendar-outline' },
  { category: 'health_trend_summary', label: 'My trends', icon: 'analytics-outline' },
  { category: 'weekly_meal_ideas', label: 'Meal ideas', icon: 'nutrition-outline' },
];

export default function AiCompanionScreen() {
  const { session } = useAuth();
  const [message, setMessage] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(category: CarePlusAiCategory, text?: string) {
    if (loading) return;
    const userId = session?.user.id;
    if (!userId) return;
    if (category === 'explain_guidance' && !text?.trim()) return;

    setLoading(true);
    setAnswer(null);
    try {
      const pregnancyId = await resolveActivePregnancyId(userId);
      if (!pregnancyId) throw new Error('No active pregnancy was found.');
      const result = await requestCarePlusAi({ pregnancyId, category, userText: text });
      if (result.text) {
        setAnswer(result.text);
      } else if (result.error === 'care_plus_required') {
        setAnswer('Janani Care+ requires an active subscription. Your free Janani features continue to work normally.');
      } else if (result.error === 'condition_rule_pack_not_approved') {
        setAnswer('Janani is not yet clinically approved to personalise this request for one or more of your saved conditions. Please follow your maternity team’s individual guidance.');
      } else if (result.error === 'ai_temporarily_unavailable' || result.error === 'ai_provider_disabled') {
        setAnswer('Janani Care+ is temporarily unavailable. Your saved health information and other Janani features are unaffected.');
      } else if (result.error === 'care_plus_quota_unavailable') {
        setAnswer('Your current Care+ AI allowance is unavailable or has been reached.');
      } else {
        setAnswer('Janani Care+ could not prepare this safely right now.');
      }
    } catch (error) {
      Alert.alert('Janani Care+ is unavailable', error instanceof Error ? error.message : 'Please try again later.');
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
              <Text style={styles.eyebrow}>JANANI CARE+</Text>
              <Text style={styles.title}>Personalised support from the information you choose to save</Text>
            </View>
          </View>

          <View style={styles.safetyCard}>
            <Ionicons name="shield-checkmark-outline" size={25} color={colors.rose} />
            <Text style={styles.safetyText}>Care+ uses only relevant Janani context for each request. It cannot diagnose, prescribe, change medicines, set medical targets, or confirm that you or your baby are safe.</Text>
          </View>

          <View style={styles.quickRow}>
            {quickActions.map((item) => (
              <Pressable key={item.category} disabled={loading} onPress={() => void submit(item.category)} style={styles.quickAction}>
                <Ionicons name={item.icon} size={21} color={colors.rose} />
                <Text style={styles.quickText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.inputCard}>
            <Text style={styles.label}>Ask Janani Care+</Text>
            <TextInput multiline maxLength={1200} onChangeText={setMessage} placeholder="Example: Help me prepare questions for my next appointment." placeholderTextColor={colors.muted} style={styles.input} value={message} />
            <Pressable disabled={!message.trim() || loading} onPress={() => void submit('explain_guidance', message)} style={[styles.askButton, (!message.trim() || loading) && styles.askButtonDisabled]}>
              {loading ? <ActivityIndicator color={colors.surface} /> : <Ionicons name="sparkles-outline" size={19} color={colors.surface} />}
              <Text style={styles.askButtonText}>{loading ? 'Preparing…' : 'Ask Care+'}</Text>
            </Pressable>
          </View>

          {answer ? <View style={styles.answerCard}><View style={styles.answerHeader}><View style={styles.answerIcon}><Ionicons name="heart" size={20} color={colors.rose} /></View><Text style={styles.answerTitle}>Janani Care+</Text></View><Text selectable style={styles.answerText}>{answer}</Text></View> : null}

          <Text style={styles.disclaimer}>If you have severe pain, heavy bleeding, trouble breathing, seizures, fainting, or feel that something is seriously wrong, seek urgent medical care rather than waiting for an AI response.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex:{flex:1},page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.lg},header:{flexDirection:'row',gap:spacing.md,alignItems:'flex-start'},headerCopy:{flex:1},backButton:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},eyebrow:{fontSize:12,letterSpacing:1.8,fontWeight:'800',color:colors.rose},title:{marginTop:spacing.xs,fontSize:28,lineHeight:35,fontWeight:'900',color:colors.ink},safetyCard:{flexDirection:'row',gap:spacing.md,padding:spacing.md,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},safetyText:{flex:1,fontSize:13,lineHeight:20,color:colors.roseDark},quickRow:{flexDirection:'row',flexWrap:'wrap',gap:spacing.sm},quickAction:{width:'48%',minHeight:58,paddingHorizontal:spacing.md,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,flexDirection:'row',gap:spacing.sm,alignItems:'center'},quickText:{fontSize:13,fontWeight:'800',color:colors.ink},inputCard:{gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},label:{fontSize:16,fontWeight:'800',color:colors.ink},input:{minHeight:140,padding:spacing.md,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.background,color:colors.ink,fontSize:15,lineHeight:22,textAlignVertical:'top'},askButton:{minHeight:52,borderRadius:radius.pill,backgroundColor:colors.rose,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm},askButtonDisabled:{opacity:.55},askButtonText:{fontSize:16,fontWeight:'800',color:colors.surface},answerCard:{gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.sageSoft,borderWidth:1,borderColor:colors.border},answerHeader:{flexDirection:'row',alignItems:'center',gap:spacing.sm},answerIcon:{width:36,height:36,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface},answerTitle:{fontSize:17,fontWeight:'800',color:colors.ink},answerText:{fontSize:15,lineHeight:23,color:colors.ink},disclaimer:{textAlign:'center',fontSize:12,lineHeight:18,color:colors.muted},
});
