import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loadHealthProfile, type HealthProfile } from '@/features/health/healthProfile';
import { nutritionTopics } from '@/features/nutrition/content';
import { personalizeNutrition } from '@/features/nutrition/personalize';
import { resolveActivePregnancyId } from '@/features/pregnancy/activePregnancy';
import { getPregnancyProgress } from '@/features/pregnancy/progress';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

type Filter = 'all' | 'nausea' | 'heartburn' | 'constipation' | 'safety';
const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'nausea', label: 'Nausea' },
  { id: 'heartburn', label: 'Heartburn' },
  { id: 'constipation', label: 'Constipation' },
  { id: 'safety', label: 'Food safety' },
];

export default function FoodGuideScreen() {
  const { session } = useAuth();
  const [filter, setFilter] = useState<Filter>('all');
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [trimester, setTrimester] = useState<1 | 2 | 3 | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadContext() {
      const userId = session?.user.id;
      if (!userId) return;
      try {
        const pregnancyId = await resolveActivePregnancyId(userId);
        if (!pregnancyId) return;
        const [health, pregnancy] = await Promise.all([
          loadHealthProfile(pregnancyId).catch(() => null),
          supabase.from('pregnancies').select('due_date').eq('id', pregnancyId).maybeSingle(),
        ]);
        if (!active) return;
        setProfile(health);
        if (pregnancy.data?.due_date) {
          setTrimester(getPregnancyProgress(pregnancy.data.due_date).trimester);
        }
      } finally {
        if (active) setLoadingContext(false);
      }
    }
    void loadContext();
    return () => { active = false; };
  }, [session?.user.id]);

  const personalized = useMemo(
    () => personalizeNutrition(nutritionTopics, { trimester, profile }),
    [profile, trimester],
  );

  const topics = useMemo(
    () => filter === 'all'
      ? personalized.visibleTopics
      : personalized.visibleTopics.filter((topic) => topic.tags.includes(filter)),
    [filter, personalized.visibleTopics],
  );

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={23} color={colors.ink} />
          </Pressable>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>JANANI FOOD GUIDE</Text>
            <Text style={styles.title}>Simple food guidance, shaped around your saved context.</Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={24} color={colors.roseDark} />
          <Text style={styles.noticeText}>This remains general pregnancy education, not a meal prescription. Clinician instructions take priority over generic Janani guidance.</Text>
        </View>

        {loadingContext ? <ActivityIndicator color={colors.rose} /> : (
          <View style={styles.contextCard}>
            <Text style={styles.contextTitle}>Your nutrition context</Text>
            {trimester ? <Text style={styles.contextLine}>Trimester {trimester}</Text> : null}
            {personalized.notices.map((notice) => <Text key={notice} style={styles.contextLine}>• {notice}</Text>)}
            {!profile ? (
              <Pressable onPress={() => router.push('/health-profile')} style={styles.profileButton}>
                <Text style={styles.profileButtonText}>Complete health profile</Text>
              </Pressable>
            ) : null}
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map((item) => (
            <Pressable key={item.id} onPress={() => setFilter(item.id)} style={[styles.filter, filter === item.id && styles.filterActive]}>
              <Text style={[styles.filterText, filter === item.id && styles.filterTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.cards}>
          {topics.map((topic) => (
            <View key={topic.id} style={styles.card}>
              <Text style={styles.cardTitle}>{topic.title}</Text>
              <Text style={styles.summary}>{topic.summary}</Text>
              <View style={styles.points}>
                {topic.points.map((point) => (
                  <View key={point} style={styles.pointRow}>
                    <View style={styles.dot} />
                    <Text style={styles.point}>{point}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {personalized.blockedPersonalization ? (
          <View style={styles.safetyCard}>
            <Text style={styles.safetyTitle}>Condition-specific guidance is intentionally limited</Text>
            <Text style={styles.safetyText}>Janani has detected a saved condition that needs its own clinically reviewed nutrition rules. Until those rules are approved, the app will show general guidance only rather than guessing what is suitable for you.</Text>
          </View>
        ) : null}

        <Text style={styles.disclaimer}>For urgent symptoms or concerns, contact your maternity care team rather than waiting for the app.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.lg},header:{flexDirection:'row',gap:spacing.md,alignItems:'flex-start'},flex:{flex:1},back:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},eyebrow:{fontSize:11,letterSpacing:1.8,fontWeight:'800',color:colors.rose},title:{marginTop:spacing.xs,fontSize:28,lineHeight:35,fontWeight:'900',color:colors.ink},notice:{flexDirection:'row',gap:spacing.sm,padding:spacing.md,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},noticeText:{flex:1,fontSize:13,lineHeight:20,color:colors.ink},contextCard:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,gap:spacing.sm},contextTitle:{fontSize:16,fontWeight:'900',color:colors.ink},contextLine:{fontSize:13,lineHeight:20,color:colors.muted},profileButton:{alignSelf:'flex-start',marginTop:spacing.sm,paddingHorizontal:spacing.md,paddingVertical:10,borderRadius:radius.pill,backgroundColor:colors.rose},profileButtonText:{fontSize:13,fontWeight:'800',color:colors.surface},filters:{gap:spacing.sm,paddingRight:spacing.lg},filter:{paddingHorizontal:spacing.md,paddingVertical:10,borderRadius:radius.pill,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},filterActive:{backgroundColor:colors.rose},filterText:{fontSize:13,fontWeight:'700',color:colors.muted},filterTextActive:{color:colors.surface},cards:{gap:spacing.md},card:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},cardTitle:{fontSize:19,fontWeight:'900',color:colors.ink},summary:{marginTop:spacing.xs,fontSize:14,lineHeight:21,color:colors.muted},points:{marginTop:spacing.md,gap:spacing.sm},pointRow:{flexDirection:'row',gap:spacing.sm,alignItems:'flex-start'},dot:{width:7,height:7,borderRadius:4,marginTop:7,backgroundColor:colors.rose},point:{flex:1,fontSize:14,lineHeight:21,color:colors.ink},safetyCard:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},safetyTitle:{fontSize:16,fontWeight:'900',color:colors.ink},safetyText:{marginTop:spacing.sm,fontSize:13,lineHeight:20,color:colors.muted},disclaimer:{textAlign:'center',fontSize:12,lineHeight:18,color:colors.muted},
});
