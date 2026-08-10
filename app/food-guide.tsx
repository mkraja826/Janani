import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { personalizeNutrition } from '@/features/nutrition/personalizationEngine';
import type { NutritionTopic } from '@/features/nutrition/content';
import { buildJananiProfile, buildNutritionContext } from '@/features/profile/jananiProfile';
import { resolveActivePregnancyId } from '@/features/pregnancy/activePregnancy';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

const fallbackGroups = [
  { id:'balanced-plate', title:'Build every plate gently', summary:'Choose a mix of vegetables, fruit, whole grains, protein foods and calcium-rich foods. Small regular meals can be easier when appetite or nausea changes.' },
  { id:'hydration', title:'Hydration matters', summary:'Sip water through the day. Follow any different fluid advice your maternity team has given you.' },
  { id:'food-safety', title:'Food safety first', summary:'Prefer freshly prepared, thoroughly cooked food and pasteurized dairy. Wash produce well and follow foods your clinician has told you to avoid.' },
];

export default function FoodGuideScreen() {
  const { session } = useAuth();
  const [topics, setTopics] = useState<Array<Pick<NutritionTopic,'id'|'title'|'summary'>>>(fallbackGroups);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const userId = session?.user.id;
        if (!userId) return;
        const pregnancyId = await resolveActivePregnancyId(userId);
        if (!pregnancyId) return;
        const context = buildNutritionContext(await buildJananiProfile(pregnancyId));
        const result = personalizeNutrition(context);
        if (!active) return;
        setTopics(result.topics.length ? result.topics : fallbackGroups);
        if (result.blockedConditions.length) setNotice('Condition-specific food personalisation is not enabled until the relevant Janani clinical rule pack is approved. Follow your maternity team or dietitian plan first.');
        else if (context.nutrition.clinicianInstructions) setNotice('Your saved clinician instructions take priority over all general Janani food guidance.');
      } catch {
        // General reviewed guidance remains available if private context is unavailable.
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [session?.user.id]);

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><Pressable accessibilityLabel="Go back" onPress={()=>router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={22} color={colors.ink}/></Pressable><View style={styles.headerCopy}><Text style={styles.eyebrow}>JANANI FOOD GUIDE</Text><Text style={styles.title}>Simple nourishment for pregnancy</Text></View></View>
    <View style={styles.hero}><Ionicons name="nutrition" size={38} color={colors.rose}/><Text style={styles.heroTitle}>Food guidance, not a prescription</Text><Text style={styles.body}>Janani filters reviewed general guidance using the pregnancy details and preferences you choose to save. It does not create medical diet rules.</Text>{loading?<ActivityIndicator color={colors.rose}/>:null}</View>
    {notice?<View style={styles.notice}><Ionicons name="shield-checkmark-outline" size={22} color={colors.roseDark}/><Text style={styles.noticeText}>{notice}</Text></View>:null}
    {topics.map((item)=><View key={item.id} style={styles.card}><View style={styles.iconWrap}><Ionicons name="leaf-outline" size={24} color={colors.rose}/></View><View style={styles.cardCopy}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.body}>{item.summary}</Text></View></View>)}
    <View style={styles.askCard}><View style={styles.askIcon}><Ionicons name="sparkles-outline" size={24} color={colors.gold}/></View><View style={styles.cardCopy}><Text style={styles.cardTitle}>Care+ meal support</Text><Text style={styles.body}>Janani Care+ can use only the relevant approved context for meal ideas. Condition-specific personalisation remains blocked until its clinical rule pack is approved.</Text><Pressable onPress={()=>router.push('/ai-companion')} style={styles.askButton}><Text style={styles.askButtonText}>Open Care+</Text><Ionicons name="arrow-forward" size={18} color={colors.surface}/></Pressable></View></View>
    <Text style={styles.disclaimer}>Janani provides supportive educational information and does not diagnose, prescribe, or replace professional medical care.</Text>
  </ScrollView></SafeAreaView>;
}

const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.md},header:{flexDirection:'row',gap:spacing.md,alignItems:'flex-start',marginBottom:spacing.sm},headerCopy:{flex:1},backButton:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},eyebrow:{fontSize:12,letterSpacing:1.8,fontWeight:'800',color:colors.rose},title:{marginTop:spacing.xs,fontSize:28,lineHeight:35,fontWeight:'900',color:colors.ink},hero:{gap:spacing.sm,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},heroTitle:{fontSize:19,fontWeight:'800',color:colors.ink},notice:{flexDirection:'row',gap:spacing.sm,padding:spacing.md,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.rose},noticeText:{flex:1,fontSize:13,lineHeight:20,color:colors.ink},card:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},askCard:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.sageSoft,borderWidth:1,borderColor:colors.border},iconWrap:{width:46,height:46,borderRadius:radius.md,alignItems:'center',justifyContent:'center',backgroundColor:colors.blush},askIcon:{width:46,height:46,borderRadius:radius.md,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface},cardCopy:{flex:1,gap:spacing.sm},cardTitle:{fontSize:17,fontWeight:'800',color:colors.ink},body:{fontSize:14,lineHeight:21,color:colors.muted},askButton:{marginTop:spacing.xs,minHeight:46,paddingHorizontal:spacing.md,borderRadius:radius.pill,backgroundColor:colors.rose,alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:spacing.sm},askButtonText:{fontSize:14,fontWeight:'800',color:colors.surface},disclaimer:{marginTop:spacing.sm,textAlign:'center',fontSize:12,lineHeight:18,color:colors.muted}});
