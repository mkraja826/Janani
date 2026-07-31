import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';

const PRIVACY_URL = 'https://mkraja826.github.io/Janani/privacy/';
const TERMS_URL = 'https://mkraja826.github.io/Janani/terms/';

export default function SafetyPrivacyScreen() {
  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>TRUST & SAFETY</Text>
          <Text style={styles.title}>How Janani protects your journey</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <InfoCard icon="medical-outline" title="Support, not medical care" body="Janani provides supportive reminders and educational information. It does not diagnose, prescribe, monitor a medical condition, or replace a doctor or emergency service." />
        <InfoCard icon="lock-closed-outline" title="Journal privacy" body="Journal entries are private by default. Your linked partner can read an entry only after you explicitly choose to share it." />
        <InfoCard icon="people-outline" title="Private family linking" body="A partner joins through a family invitation. Mothers may disconnect a linked partner, and partners may leave the family independently." />
        <InfoCard icon="server-outline" title="Data Janani uses" body="Janani may store account details, pregnancy dates, reminders, journal entries, partner messages, completion history, and device notification tokens needed to provide the service." />
        <InfoCard icon="notifications-outline" title="Device permissions" body="Notification permission is used for reminders and partner alerts. You can change this permission at any time in Android settings." />
        <InfoCard icon="trash-outline" title="Account deletion" body="Account deletion is available in Settings. A mother account deletion removes the linked family pregnancy space; partner account deletion preserves the mother's pregnancy space." />

        <View style={styles.linkCard}>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} style={styles.linkButton}>
            <Ionicons name="document-text-outline" size={20} color={colors.rose} />
            <Text style={styles.linkText}>Open Privacy Policy</Text>
            <Ionicons name="open-outline" size={17} color={colors.muted} />
          </Pressable>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)} style={styles.linkButton}>
            <Ionicons name="shield-outline" size={20} color={colors.rose} />
            <Text style={styles.linkText}>Open Terms & Medical Disclaimer</Text>
            <Ionicons name="open-outline" size={17} color={colors.muted} />
          </Pressable>
        </View>

        <View style={styles.urgentCard}>
          <Ionicons name="alert-circle-outline" size={24} color={colors.danger} />
          <View style={styles.flex}>
            <Text style={styles.urgentTitle}>Urgent symptoms need urgent care</Text>
            <Text style={styles.urgentText}>For severe pain, heavy bleeding, breathing difficulty, fainting, seizures, or any emergency concern, contact local emergency services or a qualified maternity-care professional immediately.</Text>
          </View>
        </View>

        <Text style={styles.footer}>Legal pages last updated August 1, 2026.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoCard({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  return <View style={styles.card}><View style={styles.cardIcon}><Ionicons name={icon} size={22} color={colors.rose} /></View><View style={styles.flex}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardBody}>{body}</Text></View></View>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},header:{flexDirection:'row',alignItems:'flex-start',gap:spacing.md,padding:spacing.lg},iconButton:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},flex:{flex:1},eyebrow:{fontSize:11,letterSpacing:1.8,fontWeight:'800',color:colors.rose},title:{marginTop:4,fontSize:27,lineHeight:34,fontWeight:'800',color:colors.ink},content:{paddingHorizontal:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.md},card:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},cardIcon:{width:44,height:44,borderRadius:radius.md,alignItems:'center',justifyContent:'center',backgroundColor:colors.blush},cardTitle:{fontSize:16,fontWeight:'800',color:colors.ink},cardBody:{marginTop:spacing.sm,fontSize:14,lineHeight:21,color:colors.muted},linkCard:{padding:spacing.sm,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},linkButton:{minHeight:54,flexDirection:'row',alignItems:'center',gap:spacing.md,paddingHorizontal:spacing.md},linkText:{flex:1,fontSize:14,fontWeight:'800',color:colors.ink},urgentCard:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:'#FFF1F1',borderWidth:1,borderColor:'#F1CACA'},urgentTitle:{fontSize:16,fontWeight:'800',color:colors.danger},urgentText:{marginTop:spacing.sm,fontSize:14,lineHeight:21,color:colors.muted},footer:{marginTop:spacing.sm,textAlign:'center',fontSize:11,color:colors.muted}
});
