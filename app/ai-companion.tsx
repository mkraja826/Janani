import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { readRegionalDietContext } from '@/app/diet-region';
import { requestCarePlusAi, type CarePlusAiCategory } from '@/features/ai/carePlusAi';
import { CARE_CREDIT_COSTS, getCareCreditStatus, LOW_CREDIT_THRESHOLD, type CareCreditStatus } from '@/features/ai/careCredits';
import type { RegionalDietContext } from '@/features/diet/regionalDiet';
import { readHealthConnectSummary } from '@/features/healthConnect/healthConnectGateway';
import type { HealthConnectSummary } from '@/features/healthConnect/healthConnectTypes';
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
  const [regional, setRegional] = useState<RegionalDietContext | null>(null);
  const [health, setHealth] = useState<HealthConnectSummary | null>(null);
  const [credits, setCredits] = useState<CareCreditStatus | null>(null);
  const rtl = rtlLayoutFor(locale);

  useEffect(() => {
    void Promise.all([loadPartnerCarePlusCopy(), readGlobalUiLocale(), readRegionalDietContext(), readHealthConnectSummary(), getCareCreditStatus().catch(() => null)])
      .then(([nextCopy, nextLocale, region, nextHealth, nextCredits]) => {
        setCopy({ ...nextCopy, askCarePlus: nextCopy.askCarePlus.replace(/Janani|JANANI|జనని|जननी|ஜனனி|ಜನನಿ|ജനനി|জননী|જનની|ਜਨਨੀ|ଜନନୀ|جاناني|جانانی/g, 'PregaLove') });
        setLocale(nextLocale);
        setRegional(region);
        setHealth(nextHealth);
        if (nextCredits) setCredits(nextCredits);
      })
      .catch(() => undefined);
  }, []);

  const quickActions: Array<{ category: CarePlusAiCategory; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { category: 'daily_summary', label: copy.today, icon: 'sunny-outline' },
    { category: 'appointment_summary', label: copy.appointment, icon: 'calendar-outline' },
    { category: 'health_trend_summary', label: copy.trends, icon: 'analytics-outline' },
    { category: 'weekly_meal_ideas', label: regional ? `${copy.mealIdeas} · ${regional.regionLabel}` : copy.mealIdeas, icon: 'nutrition-outline' },
  ];

  async function submit(category: CarePlusAiCategory, text?: string) {
    if (loading) return;
    const userId = session?.user.id;
    if (!userId) return;
    if (category === 'explain_guidance' && !text?.trim()) return;
    const cost = CARE_CREDIT_COSTS[category];
    if (credits && credits.balance < cost) {
      setAnswer(`This request needs ${cost} Care Credits, but you have ${credits.balance}. Your free PregaLove features still work normally.`);
      return;
    }
    setLoading(true);
    setAnswer(null);
    try {
      const pregnancyId = await resolveActivePregnancyId(userId);
      if (!pregnancyId) throw new Error('No active pregnancy was found.');
      const regionalHint = regional ? `\nRegional food context: ${regional.regionLabel}; diet=${regional.dietPreference}; cuisine=${regional.cuisineTags.join(',')}.` : '';
      const healthBits = health ? [
        health.stepsToday != null ? `steps_today=${Math.round(health.stepsToday)}` : null,
        health.sleepMinutesLastNight != null ? `sleep_minutes_last_night=${Math.round(health.sleepMinutesLastNight)}` : null,
        health.latestHeartRateBpm != null ? `latest_heart_rate_bpm=${Math.round(health.latestHeartRateBpm)}` : null,
        health.latestWeightKg != null ? `latest_weight_kg=${Math.round(health.latestWeightKg * 10) / 10}` : null,
      ].filter(Boolean) : [];
      const healthHint = healthBits.length ? `\nHealth Connect context (supportive trend data only; do not diagnose or set medical targets): ${healthBits.join('; ')}.` : '';
      const contextHints = `${regionalHint}${healthHint}`;
      const userText = text ? `${text}${contextHints}` : contextHints || undefined;
      const result = await requestCarePlusAi({ pregnancyId, category, userText });
      if (result.text) setAnswer(result.text);
      else if (result.error === 'care_plus_required') setAnswer('Your Care+ access or Care Credit allowance is unavailable. Your free PregaLove features continue to work normally.');
      else if (result.error === 'condition_rule_pack_not_approved') setAnswer('PregaLove is not yet clinically approved to personalise this request for one or more of your saved conditions. Please follow your maternity team’s individual guidance.');
      else if (result.error === 'ai_temporarily_unavailable' || result.error === 'ai_provider_disabled') setAnswer('PregaLove Care+ is temporarily unavailable. Your saved health information and other PregaLove features are unaffected.');
      else if (result.error === 'care_plus_quota_unavailable') setAnswer('Your current Care+ AI allowance is unavailable or has been reached.');
      else setAnswer('PregaLove Care+ could not prepare this safely right now.');
    } catch (error) {
      Alert.alert('PregaLove Care+ is unavailable', error instanceof Error ? error.message : 'Please try again later.');
    } finally {
      setLoading(false);
      void getCareCreditStatus().then(setCredits).catch(() => undefined);
    }
  }

  const healthContextText = health ? [
    health.stepsToday != null ? `${Math.round(health.stepsToday).toLocaleString()} steps` : null,
    health.sleepMinutesLastNight != null ? `${Math.round(health.sleepMinutesLastNight / 60 * 10) / 10} h sleep` : null,
    health.latestHeartRateBpm != null ? `${Math.round(health.latestHeartRateBpm)} bpm` : null,
  ].filter(Boolean).join(' · ') : '';
  const lowCredits = Boolean(credits && credits.balance <= LOW_CREDIT_THRESHOLD);

  return <SafeAreaView style={styles.page}><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={[styles.header,rtl.row]}><Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={({pressed}) => [styles.backButton, pressed&&styles.pressed]}><Ionicons name={directionalIconName(locale,'arrow-back','arrow-forward') as keyof typeof Ionicons.glyphMap} size={21} color={colors.ink} /></Pressable><View style={styles.headerCopy}><View style={styles.eyebrowPill}><Ionicons name="sparkles" size={13} color={colors.roseDark}/><Text style={styles.eyebrow}>PREGALOVE CARE+</Text></View><Text style={[styles.title,rtl.startText]}>{copy.carePlusTitle}</Text></View></View>
    {credits ? <View style={[styles.creditCard, lowCredits && styles.creditCardLow]}><View style={styles.creditIcon}><Ionicons name="sparkles-outline" size={20} color={colors.roseDark}/></View><View style={styles.flex}><Text style={styles.creditTitle}>{credits.balance} Care Credits</Text><Text style={styles.creditText}>{lowCredits ? 'Running low. Expensive AI actions may need more credits.' : 'Credits are used only for premium AI actions. Core PregaLove features stay free.'}</Text></View><Pressable onPress={() => router.push('/billing')}><Text style={styles.creditLink}>Get more</Text></Pressable></View> : null}
    {regional ? <Pressable onPress={() => router.push('/diet-region')} style={[styles.contextCard,rtl.row]}><Ionicons name="location-outline" size={19} color={colors.roseDark}/><View style={styles.flex}><Text style={styles.contextTitle}>Regional context</Text><Text style={styles.contextText}>{regional.regionLabel} · {regional.dietPreference.replace('_',' ')}</Text></View><Ionicons name={rtl.isRtl?'chevron-back':'chevron-forward'} size={16} color={colors.muted}/></Pressable> : null}
    {healthContextText ? <Pressable onPress={() => router.push('/health-connect')} style={[styles.contextCard,rtl.row]}><Ionicons name="pulse-outline" size={19} color={colors.roseDark}/><View style={styles.flex}><Text style={styles.contextTitle}>Health Connect context</Text><Text style={styles.contextText}>{healthContextText}</Text></View><Ionicons name={rtl.isRtl?'chevron-back':'chevron-forward'} size={16} color={colors.muted}/></Pressable> : null}
    <View style={[styles.safetyCard,rtl.row]}><View style={styles.safetyIcon}><Ionicons name="shield-checkmark-outline" size={22} color={colors.roseDark} /></View><Text style={[styles.safetyText,rtl.startText]}>Care+ uses only relevant PregaLove context for each request. It cannot diagnose, prescribe, change medicines, set medical targets, or confirm that you or your baby are safe.</Text></View>
    <View style={styles.sectionHeader}><Text style={[styles.sectionTitle,rtl.startText]}>Quick help</Text><Text style={[styles.sectionCaption,rtl.startText]}>You can see the Care Credit cost before each AI action.</Text></View>
    <View style={[styles.quickRow,rtl.row]}>{quickActions.map((item) => <Pressable key={item.category} disabled={loading} onPress={() => void submit(item.category)} style={({pressed}) => [styles.quickAction,rtl.row,pressed&&styles.cardPressed]}><View style={styles.quickIcon}><Ionicons name={item.icon} size={20} color={colors.roseDark} /></View><View style={styles.flex}><Text style={[styles.quickText,rtl.startText]}>{item.label}</Text><Text style={styles.costText}>{CARE_CREDIT_COSTS[item.category]} credits</Text></View><Ionicons name={rtl.isRtl?'chevron-back':'chevron-forward'} size={16} color={colors.muted}/></Pressable>)}</View>
    <View style={styles.inputCard}><View style={[styles.inputLabelRow,rtl.row]}><View style={styles.askIcon}><Ionicons name="chatbubble-ellipses-outline" size={19} color={colors.roseDark}/></View><View style={styles.flex}><Text style={[styles.label,rtl.startText]}>{copy.askCarePlus}</Text><Text style={styles.costText}>{CARE_CREDIT_COSTS.explain_guidance} credits per request</Text></View></View><TextInput multiline maxLength={1200} onChangeText={setMessage} placeholder={copy.placeholder} placeholderTextColor={colors.muted} style={[styles.input,rtl.startText]} value={message} /><Pressable disabled={!message.trim() || loading} onPress={() => void submit('explain_guidance', message)} style={({pressed}) => [styles.askButton,rtl.row,(!message.trim() || loading) && styles.askButtonDisabled,pressed&&styles.pressed]}>{loading ? <ActivityIndicator color={colors.surface} /> : <Ionicons name="sparkles-outline" size={19} color={colors.surface} />}<Text style={styles.askButtonText}>{loading ? copy.preparing : copy.ask}</Text></Pressable></View>
    {answer ? <View style={styles.answerCard}><View style={[styles.answerHeader,rtl.row]}><View style={styles.answerIcon}><Ionicons name="heart" size={19} color={colors.rose} /></View><View style={styles.flex}><Text style={[styles.answerEyebrow,rtl.startText]}>CARE+ RESPONSE</Text><Text style={[styles.answerTitle,rtl.startText]}>PregaLove Care+</Text></View></View><Text selectable style={[styles.answerText,rtl.startText]}>{answer}</Text></View> : null}
    <View style={styles.disclaimerCard}><Ionicons name="alert-circle-outline" size={18} color={colors.muted}/><Text style={styles.disclaimer}>If you have severe pain, heavy bleeding, trouble breathing, seizures, fainting, or feel that something is seriously wrong, seek urgent medical care rather than waiting for an AI response.</Text></View>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({
  flex:{flex:1},page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.lg},
  header:{flexDirection:'row',gap:spacing.md,alignItems:'flex-start'},headerCopy:{flex:1},backButton:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,shadowColor:colors.shadow,shadowOffset:{width:0,height:3},shadowOpacity:.05,shadowRadius:8,elevation:2},pressed:{opacity:.7,transform:[{scale:.98}]},cardPressed:{opacity:.82,transform:[{scale:.995}]},
  eyebrowPill:{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:10,paddingVertical:6,borderRadius:radius.pill,backgroundColor:colors.lavenderSoft,borderWidth:1,borderColor:colors.border},eyebrow:{fontSize:10,letterSpacing:1.55,fontWeight:'900',color:colors.roseDark},title:{marginTop:spacing.sm,fontSize:29,lineHeight:36,letterSpacing:-.35,fontWeight:'900',color:colors.ink},
  creditCard:{flexDirection:'row',alignItems:'center',gap:spacing.sm,padding:spacing.md,borderRadius:20,backgroundColor:colors.sageSoft,borderWidth:1,borderColor:colors.border},creditCardLow:{backgroundColor:colors.blush},creditIcon:{width:40,height:40,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface},creditTitle:{fontSize:15,fontWeight:'900',color:colors.ink},creditText:{marginTop:2,fontSize:11.5,lineHeight:17,color:colors.muted},creditLink:{fontSize:12,fontWeight:'900',color:colors.roseDark},
  contextCard:{flexDirection:'row',alignItems:'center',gap:spacing.sm,padding:spacing.md,borderRadius:18,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},contextTitle:{fontSize:13,fontWeight:'900',color:colors.ink},contextText:{marginTop:2,fontSize:12,color:colors.muted},
  safetyCard:{flexDirection:'row',alignItems:'flex-start',gap:spacing.md,padding:spacing.md,borderRadius:22,backgroundColor:colors.rosePale,borderWidth:1,borderColor:colors.border},safetyIcon:{width:40,height:40,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface},safetyText:{flex:1,fontSize:12.5,lineHeight:19,color:colors.roseDark},
  sectionHeader:{gap:3},sectionTitle:{fontSize:18,fontWeight:'900',color:colors.ink},sectionCaption:{fontSize:12.5,lineHeight:18,color:colors.muted},quickRow:{flexDirection:'row',flexWrap:'wrap',gap:spacing.sm},quickAction:{width:'48.5%',minHeight:78,padding:spacing.sm,borderRadius:19,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,flexDirection:'row',gap:spacing.sm,alignItems:'center'},quickIcon:{width:38,height:38,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:colors.roseSoft},quickText:{fontSize:12.5,fontWeight:'900',color:colors.ink},costText:{marginTop:2,fontSize:10.5,fontWeight:'800',color:colors.roseDark},
  inputCard:{gap:spacing.md,padding:spacing.lg,borderRadius:24,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,shadowColor:colors.shadow,shadowOffset:{width:0,height:6},shadowOpacity:.06,shadowRadius:16,elevation:3},inputLabelRow:{flexDirection:'row',alignItems:'center',gap:spacing.sm},askIcon:{width:36,height:36,borderRadius:13,alignItems:'center',justifyContent:'center',backgroundColor:colors.roseSoft},label:{fontSize:15,fontWeight:'900',color:colors.ink},input:{minHeight:132,padding:spacing.md,borderRadius:18,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surfaceWarm,color:colors.ink,fontSize:15,lineHeight:22,textAlignVertical:'top'},askButton:{minHeight:52,borderRadius:radius.pill,backgroundColor:colors.rose,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm},askButtonDisabled:{opacity:.45},askButtonText:{fontSize:15,fontWeight:'900',color:colors.surface},
  answerCard:{gap:spacing.md,padding:spacing.lg,borderRadius:24,backgroundColor:colors.sageSoft,borderWidth:1,borderColor:colors.border},answerHeader:{flexDirection:'row',alignItems:'center',gap:spacing.sm},answerIcon:{width:38,height:38,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface},answerEyebrow:{fontSize:9.5,letterSpacing:1.3,fontWeight:'900',color:colors.sage},answerTitle:{marginTop:2,fontSize:16,fontWeight:'900',color:colors.ink},answerText:{fontSize:15,lineHeight:23,color:colors.ink},
  disclaimerCard:{flexDirection:'row',alignItems:'flex-start',gap:spacing.sm,paddingHorizontal:spacing.sm},disclaimer:{flex:1,fontSize:11.5,lineHeight:17,color:colors.muted}
});