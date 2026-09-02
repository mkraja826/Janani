import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { requestCarePlusAi, type CarePlusAiCategory } from '@/features/ai/carePlusAi';
import { loadPartnerCarePlusCopy, type PartnerCarePlusCopy } from '@/features/localization/partnerCarePlusLocale';
import { resolveActivePregnancyId } from '@/features/pregnancy/activePregnancy';
import { directionalIconName, rtlLayoutFor } from '@/i18n/rtl';
import { readGlobalUiLocale } from '@/i18n/uiLocale';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

const fallbackCopy: PartnerCarePlusCopy = { connectionEyebrow:'A SMALL CONNECTION',connectionTitle:'Thinking of you',connectionHeroTitle:'Sometimes one little tap says enough.',connectionHeroText:'Send a gentle note to your partner without needing to start a conversation.',recentWarmth:'Recent warmth',noWarmth:'Your shared moments will appear here.',fromPartner:'From your partner',sentByYou:'Sent by you',heartBack:'Send a heart back',savedMessages:'Showing the last saved messages. New updates will appear when you reconnect.',thinking:'Thinking of you',notAlone:'You are not alone',rest:'Please take a little rest',proud:'I am proud of you',carePlusTitle:'Personalised support from the information you choose to save',today:'Today',appointment:'Appointment',trends:'My trends',mealIdeas:'Meal ideas',askCarePlus:'Ask PregaLove Care+',ask:'Ask Care+',preparing:'Preparing…',placeholder:'Example: Help me prepare questions for my next appointment.' };

export default function AiCompanionScreen() {
  const { session } = useAuth();
  const [copy, setCopy] = useState<PartnerCarePlusCopy>(fallbackCopy);
  const [locale, setLocale] = useState('en');
  const [message, setMessage] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const rtl = rtlLayoutFor(locale);

  useEffect(() => { void Promise.all([loadPartnerCarePlusCopy(), readGlobalUiLocale()]).then(([nextCopy, nextLocale]) => { setCopy({ ...nextCopy, askCarePlus: nextCopy.askCarePlus.replace(/Janani|JANANI|జనని|जननी|ஜனனி|ಜನನಿ|ജനനി|জননী|જનની|ਜਨਨੀ|ଜନନୀ|جاناني|جانانی/g, 'PregaLove') }); setLocale(nextLocale); }); }, []);

  const quickActions: Array<{ category: CarePlusAiCategory; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { category: 'daily_summary', label: copy.today, icon: 'sunny-outline' },
    { category: 'appointment_summary', label: copy.appointment, icon: 'calendar-outline' },
    { category: 'health_trend_summary', label: copy.trends, icon: 'analytics-outline' },
    { category: 'weekly_meal_ideas', label: copy.mealIdeas, icon: 'nutrition-outline' },
  ];

  async function submit(category: CarePlusAiCategory, text?: string) {
    if (loading) return; const userId = session?.user.id; if (!userId) return; if (category === 'explain_guidance' && !text?.trim()) return;
    setLoading(true); setAnswer(null);
    try { const pregnancyId = await resolveActivePregnancyId(userId); if (!pregnancyId) throw new Error('No active pregnancy was found.'); const result = await requestCarePlusAi({ pregnancyId, category, userText: text });
      if (result.text) setAnswer(result.text); else if (result.error === 'care_plus_required') setAnswer('PregaLove Care+ requires an active subscription. Your free PregaLove features continue to work normally.'); else if (result.error === 'condition_rule_pack_not_approved') setAnswer('PregaLove is not yet clinically approved to personalise this request for one or more of your saved conditions. Please follow your maternity team’s individual guidance.'); else if (result.error === 'ai_temporarily_unavailable' || result.error === 'ai_provider_disabled') setAnswer('PregaLove Care+ is temporarily unavailable. Your saved health information and other PregaLove features are unaffected.'); else if (result.error === 'care_plus_quota_unavailable') setAnswer('Your current Care+ AI allowance is unavailable or has been reached.'); else setAnswer('PregaLove Care+ could not prepare this safely right now.');
    } catch (error) { Alert.alert('PregaLove Care+ is unavailable', error instanceof Error ? error.message : 'Please try again later.'); } finally { setLoading(false); }
  }

  return <SafeAreaView style={styles.page}><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={[styles.header,rtl.row]}><Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}><Ionicons name={directionalIconName(locale,'arrow-back','arrow-forward') as keyof typeof Ionicons.glyphMap} size={22} color={colors.ink} /></Pressable><View style={styles.headerCopy}><Text style={[styles.eyebrow,rtl.startText]}>PREGALOVE CARE+</Text><Text style={[styles.title,rtl.startText]}>{copy.carePlusTitle}</Text></View></View>
    <View style={[styles.safetyCard,rtl.row]}><Ionicons name="shield-checkmark-outline" size={25} color={colors.rose} /><Text style={[styles.safetyText,rtl.startText]}>Care+ uses only relevant PregaLove context for each request. It cannot diagnose, prescribe, change medicines, set medical targets, or confirm that you or your baby are safe.</Text></View>
    <View style={[styles.quickRow,rtl.row]}>{quickActions.map((item) => <Pressable key={item.category} disabled={loading} onPress={() => void submit(item.category)} style={[styles.quickAction,rtl.row]}><Ionicons name={item.icon} size={21} color={colors.rose} /><Text style={[styles.quickText,rtl.startText]}>{item.label}</Text></Pressable>)}</View>
    <View style={styles.inputCard}><Text style={[styles.label,rtl.startText]}>{copy.askCarePlus}</Text><TextInput multiline maxLength={1200} onChangeText={setMessage} placeholder={copy.placeholder} placeholderTextColor={colors.muted} style={[styles.input,rtl.startText]} value={message} /><Pressable disabled={!message.trim() || loading} onPress={() => void submit('explain_guidance', message)} style={[styles.askButton,rtl.row,(!message.trim() || loading) && styles.askButtonDisabled]}>{loading ? <ActivityIndicator color={colors.surface} /> : <Ionicons name="sparkles-outline" size={19} color={colors.surface} />}<Text style={styles.askButtonText}>{loading ? copy.preparing : copy.ask}</Text></Pressable></View>
    {answer ? <View style={styles.answerCard}><View style={[styles.answerHeader,rtl.row]}><View style={styles.answerIcon}><Ionicons name="heart" size={20} color={colors.rose} /></View><Text style={[styles.answerTitle,rtl.startText]}>PregaLove Care+</Text></View><Text selectable style={[styles.answerText,rtl.startText]}>{answer}</Text></View> : null}
    <Text style={styles.disclaimer}>If you have severe pain, heavy bleeding, trouble breathing, seizures, fainting, or feel that something is seriously wrong, seek urgent medical care rather than waiting for an AI response.</Text>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({flex:{flex:1},page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.lg},header:{flexDirection:'row',gap:spacing.md,alignItems:'flex-start'},headerCopy:{flex:1},backButton:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},eyebrow:{fontSize:12,letterSpacing:1.8,fontWeight:'800',color:colors.rose},title:{marginTop:spacing.xs,fontSize:28,lineHeight:35,fontWeight:'900',color:colors.ink},safetyCard:{flexDirection:'row',gap:spacing.md,padding:spacing.md,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},safetyText:{flex:1,fontSize:13,lineHeight:20,color:colors.roseDark},quickRow:{flexDirection:'row',flexWrap:'wrap',gap:spacing.sm},quickAction:{width:'48%',minHeight:58,paddingHorizontal:spacing.md,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,flexDirection:'row',gap:spacing.sm,alignItems:'center'},quickText:{fontSize:13,fontWeight:'800',color:colors.ink},inputCard:{gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},label:{fontSize:16,fontWeight:'800',color:colors.ink},input:{minHeight:140,padding:spacing.md,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.background,color:colors.ink,fontSize:15,lineHeight:22,textAlignVertical:'top'},askButton:{minHeight:52,borderRadius:radius.pill,backgroundColor:colors.rose,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm},askButtonDisabled:{opacity:.55},askButtonText:{fontSize:16,fontWeight:'800',color:colors.surface},answerCard:{gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.sageSoft,borderWidth:1,borderColor:colors.border},answerHeader:{flexDirection:'row',alignItems:'center',gap:spacing.sm},answerIcon:{width:36,height:36,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface},answerTitle:{fontSize:17,fontWeight:'800',color:colors.ink},answerText:{fontSize:15,lineHeight:23,color:colors.ink},disclaimer:{textAlign:'center',fontSize:12,lineHeight:18,color:colors.muted}});
