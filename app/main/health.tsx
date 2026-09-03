import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JananiPageHeader } from '@/components/navigation/JananiPageHeader';
import { colors, radius, spacing } from '@/theme/tokens';

export default function HealthScreen() {
  return <SafeAreaView style={styles.page} edges={['top']}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <JananiPageHeader eyebrow="YOUR HEALTH" title="Your health, kept together" subtitle="Review the information you choose to save, track changes, and keep your daily care tools close." />
    <View style={styles.introCard}><View style={styles.introIcon}><Ionicons name="heart" size={24} color={colors.surface} /></View><View style={styles.flex}><Text style={styles.introEyebrow}>PRIVATE BY DEFAULT</Text><Text style={styles.introTitle}>One place for your health</Text><Text style={styles.introText}>Your saved profile and tracker entries are self-reported information for support and organization. PregaLove does not use them as a diagnosis.</Text></View></View>
    <View style={styles.section}><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Health tools</Text><Text style={styles.sectionCaption}>Open only what you need today.</Text></View>
      <ActionCard caption="Review the health information you have chosen to save" icon="person-circle-outline" onPress={() => router.push('/health-profile')} title="Health profile" />
      <ActionCard caption="Record and review your maternal wellness entries" icon="pulse-outline" onPress={() => router.push('/health-tracker')} title="Health tracker" />
      <ActionCard caption="Maternal-care information already available in PregaLove" icon="medical-outline" onPress={() => router.push('/health-guide')} title="Health guide" />
      <ActionCard caption="Medicines, supplements and care schedules" icon="alarm-outline" onPress={() => router.push('/reminders')} title="Reminders" />
      <ActionCard caption="Pregnancy nutrition guidance already in PregaLove" icon="nutrition-outline" onPress={() => router.push('/food-guide')} title="Food guide" />
    </View>
  </ScrollView></SafeAreaView>;
}

function ActionCard({ icon, title, caption, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; caption: string; onPress: () => void; }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}><View style={styles.actionIcon}><Ionicons name={icon} size={21} color={colors.roseDark} /></View><View style={styles.flex}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionCaption}>{caption}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.muted} /></Pressable>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.xl},flex:{flex:1},
  introCard:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:24,backgroundColor:colors.sageSoft,borderWidth:1,borderColor:colors.border},introIcon:{width:50,height:50,borderRadius:18,alignItems:'center',justifyContent:'center',backgroundColor:colors.sage},introEyebrow:{fontSize:9.5,letterSpacing:1.35,fontWeight:'900',color:colors.sage},introTitle:{marginTop:4,fontSize:18,fontWeight:'900',color:colors.ink},introText:{marginTop:spacing.xs,fontSize:13,lineHeight:20,color:colors.muted},
  section:{gap:spacing.sm},sectionHeader:{marginBottom:spacing.xs,gap:2},sectionTitle:{fontSize:19,fontWeight:'900',color:colors.ink},sectionCaption:{fontSize:12.5,color:colors.muted},actionCard:{minHeight:82,flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.md,borderRadius:21,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},pressed:{opacity:.78,transform:[{scale:.995}]},actionIcon:{width:44,height:44,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:colors.roseSoft},actionTitle:{fontSize:15.5,fontWeight:'900',color:colors.ink},actionCaption:{marginTop:3,fontSize:12.5,lineHeight:18,color:colors.muted}
});
