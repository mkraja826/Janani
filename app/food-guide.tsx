import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { nutritionTopics } from '@/features/nutrition/content';
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
  const [filter, setFilter] = useState<Filter>('all');
  const topics = useMemo(
    () => filter === 'all' ? nutritionTopics : nutritionTopics.filter((topic) => topic.tags.includes(filter)),
    [filter],
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
            <Text style={styles.title}>Simple food guidance, without judgement.</Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={24} color={colors.roseDark} />
          <Text style={styles.noticeText}>This guide is general pregnancy education, not a meal prescription. Allergies, diabetes, thyroid disease, high blood pressure, anaemia, multiple pregnancy and other conditions may need individual advice from your maternity team or dietitian.</Text>
        </View>

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

        <View style={styles.futureCard}>
          <Text style={styles.futureTitle}>Personalisation comes next</Text>
          <Text style={styles.futureText}>Janani will later filter reviewed guidance using the mother's saved diet preferences, allergies and clinician instructions. Condition-aware guidance will only be enabled after its medical rules and content are reviewed.</Text>
        </View>
        <Text style={styles.disclaimer}>For urgent symptoms or concerns, contact your maternity care team rather than waiting for the app.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},
  content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.lg},
  header:{flexDirection:'row',gap:spacing.md,alignItems:'flex-start'},
  flex:{flex:1},
  back:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},
  eyebrow:{fontSize:11,letterSpacing:1.8,fontWeight:'800',color:colors.rose},
  title:{marginTop:spacing.xs,fontSize:28,lineHeight:35,fontWeight:'900',color:colors.ink},
  notice:{flexDirection:'row',gap:spacing.sm,padding:spacing.md,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},
  noticeText:{flex:1,fontSize:13,lineHeight:20,color:colors.ink},
  filters:{gap:spacing.sm,paddingRight:spacing.lg},
  filter:{paddingHorizontal:spacing.md,paddingVertical:10,borderRadius:radius.pill,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},
  filterActive:{backgroundColor:colors.rose},
  filterText:{fontSize:13,fontWeight:'700',color:colors.muted},
  filterTextActive:{color:colors.surface},
  cards:{gap:spacing.md},
  card:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},
  cardTitle:{fontSize:19,fontWeight:'900',color:colors.ink},
  summary:{marginTop:spacing.xs,fontSize:14,lineHeight:21,color:colors.muted},
  points:{marginTop:spacing.md,gap:spacing.sm},
  pointRow:{flexDirection:'row',gap:spacing.sm,alignItems:'flex-start'},
  dot:{width:7,height:7,borderRadius:4,marginTop:7,backgroundColor:colors.rose},
  point:{flex:1,fontSize:14,lineHeight:21,color:colors.ink},
  futureCard:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},
  futureTitle:{fontSize:16,fontWeight:'900',color:colors.ink},
  futureText:{marginTop:spacing.sm,fontSize:13,lineHeight:20,color:colors.muted},
  disclaimer:{textAlign:'center',fontSize:12,lineHeight:18,color:colors.muted},
});
