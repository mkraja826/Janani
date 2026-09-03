import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JananiPageHeader } from '@/components/navigation/JananiPageHeader';
import { colors, spacing } from '@/theme/tokens';

export default function ReportsScreen() {
  return <SafeAreaView style={styles.page} edges={['top']}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <JananiPageHeader eyebrow="YOUR RECORDS" title="Reports" subtitle="Keep the records that matter close to your pregnancy journey." />
    <View style={styles.heroCard}><View style={styles.iconWrap}><Ionicons name="document-text-outline" size={27} color={colors.roseDark} /></View><View style={styles.statusPill}><View style={styles.statusDot}/><Text style={styles.statusText}>COMING SAFELY</Text></View><Text style={styles.heroTitle}>Your care information stays organized</Text><Text style={styles.heroText}>The current production app does not yet expose report upload in this tab. PregaLove will keep this area fail-closed until the private upload and confirmation flow is fully release-validated.</Text></View>
    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Available now</Text><Text style={styles.sectionCaption}>Use the private information already supported in the app.</Text></View>
    <Pressable onPress={() => router.push('/care-context')} style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}><View style={styles.actionIcon}><Ionicons name="clipboard-outline" size={22} color={colors.roseDark} /></View><View style={styles.flex}><Text style={styles.actionTitle}>Care Context</Text><Text style={styles.actionText}>Review the information you have chosen to keep in PregaLove.</Text></View><Ionicons name="chevron-forward" size={18} color={colors.muted} /></Pressable>
    <View style={styles.noteCard}><Ionicons name="lock-closed-outline" size={18} color={colors.sage}/><Text style={styles.noteText}>Report uploads will stay unavailable until the private storage, access and confirmation flow passes release validation.</Text></View>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.xl},flex:{flex:1},pressed:{opacity:.78,transform:[{scale:.995}]},
  heroCard:{alignItems:'flex-start',padding:spacing.lg,borderRadius:26,backgroundColor:colors.rosePale,borderWidth:1,borderColor:colors.border},iconWrap:{width:54,height:54,borderRadius:19,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface},statusPill:{marginTop:spacing.md,flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:9,paddingVertical:5,borderRadius:999,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},statusDot:{width:7,height:7,borderRadius:4,backgroundColor:colors.sage},statusText:{fontSize:9,letterSpacing:1.15,fontWeight:'900',color:colors.sage},heroTitle:{marginTop:spacing.md,fontSize:20,lineHeight:26,fontWeight:'900',color:colors.ink},heroText:{marginTop:spacing.sm,fontSize:13.5,lineHeight:21,color:colors.muted},
  sectionHeader:{gap:2},sectionTitle:{fontSize:19,fontWeight:'900',color:colors.ink},sectionCaption:{fontSize:12.5,lineHeight:18,color:colors.muted},actionCard:{minHeight:84,flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.md,borderRadius:21,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},actionIcon:{width:46,height:46,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:colors.sageSoft},actionTitle:{fontSize:15.5,fontWeight:'900',color:colors.ink},actionText:{marginTop:3,fontSize:12.5,lineHeight:18,color:colors.muted},
  noteCard:{flexDirection:'row',alignItems:'flex-start',gap:spacing.sm,padding:spacing.md,borderRadius:18,backgroundColor:colors.surfaceWarm,borderWidth:1,borderColor:colors.border},noteText:{flex:1,fontSize:12,lineHeight:18,color:colors.muted}
});
