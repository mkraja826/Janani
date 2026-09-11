import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme/tokens';

const actions = [
  ['water-outline', 'Help her stay hydrated', 'Keep water nearby and ask what feels comfortable today.'],
  ['restaurant-outline', 'Make food easier', 'Offer a simple meal or snack that she is comfortable eating.'],
  ['bed-outline', 'Protect some rest', 'Take over one practical task so she can rest without feeling rushed.'],
] as const;

export default function PartnerCareScreen() {
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>CARE FOR HER</Text>
        <Text style={styles.title}>What you can do today ❤️</Text>
        <Text style={styles.intro}>Small, practical support matters. Ask what she needs, help with the day, and keep medical decisions with her and her care team.</Text>

        <View style={styles.section}>
          {actions.map(([icon, title, text]) => (
            <View key={title} style={styles.card}>
              <View style={styles.icon}><Ionicons name={icon} size={22} color={colors.roseDark} /></View>
              <View style={styles.flex}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardText}>{text}</Text></View>
            </View>
          ))}
        </View>

        <View style={styles.safetyCard}>
          <Ionicons name="shield-checkmark-outline" size={24} color={colors.roseDark} />
          <View style={styles.flex}>
            <Text style={styles.cardTitle}>If something feels wrong</Text>
            <Text style={styles.cardText}>Encourage her to contact her doctor, maternity team, or emergency service when symptoms feel urgent or unusual. PregaLove does not diagnose emergencies.</Text>
          </View>
        </View>

        <Pressable onPress={() => router.push('/pregnancy-guide')} style={styles.actionButton}><Ionicons name="book-outline" size={19} color={colors.surface} /><Text style={styles.actionText}>See this week’s pregnancy guide</Text></Pressable>
        <Pressable onPress={() => router.push('/reminders')} style={styles.secondaryButton}><Ionicons name="alarm-outline" size={19} color={colors.roseDark} /><Text style={styles.secondaryText}>Shared reminders</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.lg},eyebrow:{fontSize:11,letterSpacing:2,fontWeight:'900',color:colors.rose},title:{fontSize:31,lineHeight:38,fontWeight:'900',color:colors.ink},intro:{fontSize:14,lineHeight:22,color:colors.muted},section:{gap:spacing.md},card:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},icon:{width:46,height:46,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:colors.rosePale},flex:{flex:1},cardTitle:{fontSize:16,fontWeight:'800',color:colors.ink},cardText:{marginTop:4,fontSize:13,lineHeight:19,color:colors.muted},safetyCard:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.rosePale,borderWidth:1,borderColor:colors.border},actionButton:{minHeight:52,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm,borderRadius:radius.pill,backgroundColor:colors.rose},actionText:{fontWeight:'800',color:colors.surface},secondaryButton:{minHeight:52,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm,borderRadius:radius.pill,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},secondaryText:{fontWeight:'800',color:colors.roseDark},
});
