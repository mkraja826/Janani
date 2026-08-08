import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { requestCarePlusAi, type CarePlusAiCategory } from '@/features/ai/carePlusAi';
import { supabase } from '@/lib/supabase';
import { colors, radius, spacing } from '@/theme/tokens';

const actions: { category: CarePlusAiCategory; title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { category: 'daily_summary', title: 'Today’s summary', subtitle: 'A short personalised wellbeing overview', icon: 'sunny-outline' },
  { category: 'weekly_meal_ideas', title: 'Weekly meal ideas', subtitle: 'Uses approved nutrition guidance only', icon: 'nutrition-outline' },
  { category: 'appointment_summary', title: 'Prepare for an appointment', subtitle: 'Organise notes and questions', icon: 'calendar-outline' },
  { category: 'health_trend_summary', title: 'Explain my trends', subtitle: 'Summarise logs without diagnosing', icon: 'analytics-outline' },
];

export default function CarePlusAssistantScreen() {
  const [selected, setSelected] = useState<CarePlusAiCategory>('explain_guidance');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function resolvePregnancyId() {
    const { data: membership, error: membershipError } = await supabase.from('family_members').select('family_id,role').eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '').maybeSingle();
    if (membershipError || !membership || membership.role !== 'mother') throw new Error('Care+ is available to the mother profile only.');
    const { data, error } = await supabase.from('pregnancies').select('id,status').eq('family_id', membership.family_id).order('created_at', { ascending: false });
    if (error) throw error;
    const rows = data ?? [];
    const pregnancy = rows.find((item) => item.status === 'active') ?? rows[0];
    if (!pregnancy) throw new Error('No pregnancy profile is available.');
    return pregnancy.id;
  }

  async function submit(category = selected) {
    if (category === 'explain_guidance' && !question.trim()) {
      Alert.alert('Add a question', 'Write what you would like Janani to explain.');
      return;
    }
    setLoading(true); setAnswer(null);
    try {
      const pregnancyId = await resolvePregnancyId();
      const result = await requestCarePlusAi({ pregnancyId, category, userText: question });
      if (result.text) setAnswer(result.text);
      else if (result.error === 'ai_temporarily_unavailable' || result.error === 'ai_provider_disabled') setAnswer('Care+ AI is still in protected beta. Your health records and free Janani features continue to work normally.');
      else if (result.error === 'condition_rule_pack_not_approved') setAnswer('Janani is not yet approved to personalise this request for one or more of your saved conditions. Please use your maternity team’s individual guidance.');
      else if (result.error === 'care_plus_required') setAnswer('This feature requires an active Janani Care+ entitlement.');
      else setAnswer('Care+ could not prepare this safely right now. Please try again later.');
    } catch (error) {
      setAnswer(error instanceof Error ? error.message : 'Care+ could not respond right now.');
    } finally { setLoading(false); }
  }

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><Pressable accessibilityLabel="Back" onPress={()=>router.back()} style={styles.back}><Ionicons name="chevron-back" size={23} color={colors.ink}/></Pressable><View style={styles.flex}><Text style={styles.eyebrow}>CARE+ BETA</Text><Text style={styles.title}>Ask for support, not a diagnosis.</Text></View></View>
    <View style={styles.notice}><Ionicons name="shield-checkmark-outline" size={24} color={colors.roseDark}/><Text style={styles.noticeText}>Care+ cannot diagnose, change medication, prescribe doses, or confirm that a mother or baby is safe. The beta remains server-disabled until its safety evaluation is approved.</Text></View>
    <View style={styles.actions}>{actions.map((item)=><Pressable key={item.category} style={styles.action} onPress={()=>{setSelected(item.category);void submit(item.category);}} disabled={loading}><Ionicons name={item.icon} size={24} color={colors.rose}/><View style={styles.flex}><Text style={styles.actionTitle}>{item.title}</Text><Text style={styles.actionSubtitle}>{item.subtitle}</Text></View><Ionicons name="chevron-forward" size={20} color={colors.muted}/></Pressable>)}</View>
    <View style={styles.askCard}><Text style={styles.sectionTitle}>Explain something</Text><TextInput value={question} onChangeText={setQuestion} multiline maxLength={1200} placeholder="Example: Help me prepare questions for my next appointment." placeholderTextColor={colors.muted} style={styles.input}/><Pressable style={styles.primary} onPress={()=>{setSelected('explain_guidance');void submit('explain_guidance');}} disabled={loading}>{loading?<ActivityIndicator color={colors.surface}/>:<Text style={styles.primaryText}>Ask Janani Care+</Text>}</Pressable></View>
    {answer?<View style={styles.answer}><Text style={styles.answerLabel}>JANANI</Text><Text style={styles.answerText}>{answer}</Text></View>:null}
    <Text style={styles.disclaimer}>For urgent symptoms or concerning readings, contact your maternity care team directly.</Text>
  </ScrollView></SafeAreaView>;
}

const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.lg},header:{flexDirection:'row',gap:spacing.md,alignItems:'flex-start'},back:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},flex:{flex:1},eyebrow:{fontSize:11,letterSpacing:1.8,fontWeight:'800',color:colors.rose},title:{marginTop:spacing.xs,fontSize:28,lineHeight:35,fontWeight:'900',color:colors.ink},notice:{flexDirection:'row',gap:spacing.sm,padding:spacing.md,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},noticeText:{flex:1,fontSize:13,lineHeight:20,color:colors.ink},actions:{gap:spacing.sm},action:{flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.md,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},actionTitle:{fontSize:15,fontWeight:'800',color:colors.ink},actionSubtitle:{marginTop:2,fontSize:12,lineHeight:17,color:colors.muted},askCard:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},sectionTitle:{fontSize:17,fontWeight:'900',color:colors.ink},input:{marginTop:spacing.md,minHeight:110,padding:spacing.md,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,color:colors.ink,textAlignVertical:'top',backgroundColor:colors.background},primary:{marginTop:spacing.md,minHeight:50,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.rose},primaryText:{fontWeight:'800',color:colors.surface},answer:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},answerLabel:{fontSize:11,letterSpacing:1.5,fontWeight:'900',color:colors.roseDark},answerText:{marginTop:spacing.sm,fontSize:14,lineHeight:22,color:colors.ink},disclaimer:{textAlign:'center',fontSize:12,lineHeight:18,color:colors.muted}});
