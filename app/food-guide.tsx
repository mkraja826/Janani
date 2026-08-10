import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { personalizeNutrition, type NutritionPersonalizationResult } from '@/features/nutrition/personalizationEngine';
import { buildJananiProfile } from '@/features/profile/jananiProfile';
import { resolveActivePregnancyId } from '@/features/pregnancy/activePregnancy';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

export default function FoodGuideScreen() {
  const { session } = useAuth();
  const [personalized, setPersonalized] = useState<NutritionPersonalizationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      const userId = session?.user.id;
      if (!userId) { if (active) setLoading(false); return; }
      try {
        const { data: membership } = await supabase.from('family_members').select('role').eq('user_id', userId).maybeSingle();
        if (membership?.role !== 'mother') return;
        const pregnancyId = await resolveActivePregnancyId(userId);
        if (!pregnancyId) return;
        const profile = await buildJananiProfile(pregnancyId);
        const activeConditions = profile.health.conditions.filter((x) => x.status !== 'pregnancy_history').map((x) => x.condition_code);
        const result = personalizeNutrition({
          trimester: profile.pregnancy.trimester,
          dietaryPattern: profile.nutrition.dietaryPattern,
          allergies: profile.nutrition.allergies,
          foodsAvoided: profile.nutrition.foodsAvoided,
          activeConditions,
          clinicianInstructions: profile.nutrition.clinicianInstructions,
        });
        if (active) setPersonalized(result);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [session?.user.id]);

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={22} color={colors.ink}/></Pressable><View style={styles.headerCopy}><Text style={styles.eyebrow}>JANANI FOOD GUIDE</Text><Text style={styles.title}>Simple nourishment for pregnancy</Text></View></View>
    <View style={styles.hero}><Ionicons name="nutrition" size={38} color={colors.rose}/><Text style={styles.heroTitle}>Food guidance, not a prescription</Text><Text style={styles.body}>Janani filters reviewed general guidance using pregnancy stage and saved preferences. Clinician instructions, known allergies, and medical-condition boundaries always take priority.</Text></View>

    {loading ? <ActivityIndicator color={colors.rose}/> : null}
    {personalized?.safetyNotes.length ? <View style={styles.safetyCard}><Text style={styles.safetyTitle}>Your safety filters are active</Text>{personalized.safetyNotes.map((note) => <Text key={note} style={styles.body}>• {note}</Text>)}</View> : null}
    {personalized?.blockedConditionCodes.length ? <View style={styles.warningCard}><Ionicons name="lock-closed-outline" size={22} color={colors.roseDark}/><View style={styles.cardCopy}><Text style={styles.cardTitle}>Condition-specific personalization is locked</Text><Text style={styles.body}>Janani detected saved condition context, but condition-specific food guidance stays disabled until the corresponding clinical rule pack is formally approved.</Text></View></View> : null}

    {(personalized?.topics ?? []).map((item) => <View key={item.id} style={styles.card}><View style={styles.iconWrap}><Ionicons name="leaf-outline" size={24} color={colors.rose}/></View><View style={styles.cardCopy}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.body}>{item.summary}</Text>{item.points.map((point) => <Text key={point} style={styles.point}>• {point}</Text>)}</View></View>)}

    {!loading && !personalized ? <View style={styles.card}><View style={styles.iconWrap}><Ionicons name="information-circle-outline" size={24} color={colors.rose}/></View><View style={styles.cardCopy}><Text style={styles.cardTitle}>General pregnancy food guidance</Text><Text style={styles.body}>Personalized filtering is available to the mother after a private health profile is saved. Partner accounts continue to see general educational guidance only.</Text></View></View> : null}

    <View style={styles.askCard}><View style={styles.askIcon}><Ionicons name="sparkles-outline" size={24} color={colors.gold}/></View><View style={styles.cardCopy}><Text style={styles.cardTitle}>Care+ personalization comes through one safe gateway</Text><Text style={styles.body}>The current generic AI companion has not been connected to these private health details. Janani will route personalized AI through the reviewed Care+ gateway in the next integration phase.</Text></View></View>
    <Text style={styles.disclaimer}>Janani provides supportive educational information and does not diagnose, prescribe, or replace professional medical care.</Text>
  </ScrollView></SafeAreaView>;
}

const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.md},header:{flexDirection:'row',gap:spacing.md,alignItems:'flex-start',marginBottom:spacing.sm},headerCopy:{flex:1},backButton:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},eyebrow:{fontSize:12,letterSpacing:1.8,fontWeight:'800',color:colors.rose},title:{marginTop:spacing.xs,fontSize:28,lineHeight:35,fontWeight:'900',color:colors.ink},hero:{gap:spacing.sm,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},heroTitle:{fontSize:19,fontWeight:'800',color:colors.ink},card:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},warningCard:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},safetyCard:{gap:spacing.sm,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.sageSoft,borderWidth:1,borderColor:colors.border},safetyTitle:{fontSize:16,fontWeight:'900',color:colors.ink},askCard:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.sageSoft,borderWidth:1,borderColor:colors.border},iconWrap:{width:46,height:46,borderRadius:radius.md,alignItems:'center',justifyContent:'center',backgroundColor:colors.blush},askIcon:{width:46,height:46,borderRadius:radius.md,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface},cardCopy:{flex:1,gap:spacing.sm},cardTitle:{fontSize:17,fontWeight:'800',color:colors.ink},body:{fontSize:14,lineHeight:21,color:colors.muted},point:{fontSize:13,lineHeight:20,color:colors.ink},disclaimer:{marginTop:spacing.sm,textAlign:'center',fontSize:12,lineHeight:18,color:colors.muted}});
