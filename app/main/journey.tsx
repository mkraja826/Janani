import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JananiPageHeader } from '@/components/navigation/JananiPageHeader';
import { colors, spacing } from '@/theme/tokens';

export default function JourneyScreen() {
  return <SafeAreaView style={styles.page} edges={['top']}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <JananiPageHeader eyebrow="YOUR JOURNEY" title="Every week becomes a memory" subtitle="Follow your pregnancy week by week and keep the moments you want to remember." />
    <Pressable onPress={() => router.push('/pregnancy-guide')} style={({ pressed }) => [styles.heroCard, pressed && styles.pressed]}><View style={styles.heroIcon}><Ionicons name="heart" size={27} color={colors.surface} /></View><View style={styles.flex}><Text style={styles.cardEyebrow}>PREGNANCY</Text><Text style={styles.cardTitle}>Week-by-week guide</Text><Text style={styles.cardText}>See your pregnancy progress and trimester guidance already available in PregaLove.</Text><View style={styles.linkRow}><Text style={styles.linkText}>Open pregnancy guide</Text><Ionicons name="arrow-forward" size={16} color={colors.roseDark}/></View></View></Pressable>
    <Pressable onPress={() => router.push('/journal')} style={({ pressed }) => [styles.journalCard, pressed && styles.pressed]}><View style={styles.journalIcon}><Ionicons name="book-outline" size={24} color={colors.roseDark} /></View><View style={styles.flex}><Text style={styles.cardEyebrow}>YOUR MEMORIES</Text><Text style={styles.cardTitle}>Pregnancy journal</Text><Text style={styles.cardText}>Keep notes, feelings and memories in your private PregaLove space.</Text></View><Ionicons name="chevron-forward" size={18} color={colors.muted} /></Pressable>
    <View style={styles.noteCard}><Ionicons name="sparkles-outline" size={19} color={colors.gold}/><Text style={styles.noteText}>There is no pressure to document every day. Keep only the moments that matter to you.</Text></View>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.xl},flex:{flex:1},pressed:{opacity:.8,transform:[{scale:.995}]},
  heroCard:{flexDirection:'row',alignItems:'flex-start',gap:spacing.md,padding:spacing.lg,borderRadius:26,backgroundColor:colors.rosePale,borderWidth:1,borderColor:colors.border,shadowColor:colors.shadow,shadowOffset:{width:0,height:6},shadowOpacity:.07,shadowRadius:18,elevation:3},heroIcon:{width:54,height:54,borderRadius:19,alignItems:'center',justifyContent:'center',backgroundColor:colors.rose},
  journalCard:{flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.lg,borderRadius:22,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},journalIcon:{width:48,height:48,borderRadius:17,alignItems:'center',justifyContent:'center',backgroundColor:colors.lavenderSoft},
  cardEyebrow:{fontSize:9.5,letterSpacing:1.45,fontWeight:'900',color:colors.roseDark},cardTitle:{marginTop:4,fontSize:18,fontWeight:'900',color:colors.ink},cardText:{marginTop:spacing.xs,fontSize:13,lineHeight:20,color:colors.muted},linkRow:{marginTop:spacing.md,flexDirection:'row',alignItems:'center',gap:6},linkText:{fontSize:12.5,fontWeight:'900',color:colors.roseDark},
  noteCard:{flexDirection:'row',alignItems:'flex-start',gap:spacing.sm,padding:spacing.md,borderRadius:18,backgroundColor:colors.surfaceWarm,borderWidth:1,borderColor:colors.border},noteText:{flex:1,fontSize:12.5,lineHeight:19,color:colors.muted}
});
