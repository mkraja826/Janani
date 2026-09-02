import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme/tokens';

const PUBLISHED_TERMS_URL = 'https://mkraja826.github.io/Janani/terms/';

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Header />
        <Text style={styles.effective}>Effective date: August 3, 2026</Text>
        <View style={styles.notice}><Ionicons name="medical-outline" size={23} color={colors.rose} /><Text style={styles.noticeText}><Text style={styles.noticeStrong}>Janani is not a medical device. </Text>It does not diagnose, prescribe, monitor a medical condition, or replace a doctor, hospital, emergency service, or individualized medical advice.</Text></View>

        <LegalSection title="1. Acceptance" body="By using Janani, you agree to these Terms of Use and the Privacy Policy. Do not use the service if you do not agree." />
        <LegalSection title="2. Intended use" body="Janani supports pregnancy journaling, care reminders, pregnancy-date calculations, voluntary family connection and supportive Care+ features. Its information is general and educational." />
        <LegalSection title="3. Medicines and care instructions" body="You are responsible for entering accurate reminder information. Medicine name, dose, timing and duration must follow instructions from a qualified clinician. A notification is not proof that medicine was taken or that a schedule is medically appropriate. Use an independent method for critical medical schedules." />
        <LegalSection title="4. Emergencies" body="Do not rely on Janani during an emergency. For severe pain, heavy bleeding, breathing difficulty, fainting, seizures, reduced consciousness, or any urgent concern, contact local emergency services or a qualified maternity-care professional immediately." />
        <LegalSection title="5. Accounts and family access" body="Keep account credentials and invite codes private. Link only with people you trust. Mothers may disconnect a linked partner, and partners may leave a family where those controls are available. Account deletion is permanent and has different effects for mother and partner accounts." />
        <LegalSection title="6. User content and conduct" body="You remain responsible for journal entries, reminder content and partner messages you create. Do not submit unlawful, abusive, rights-infringing or malicious content. Do not add another person's sensitive information without their permission." />
        <LegalSection title="7. Care+ and AI" body="Janani Care+ may generate supportive information from relevant context you choose to save. Care+ cannot diagnose, prescribe, change medicines, set clinical targets, confirm that you or your baby are safe, or replace individualized advice from your maternity team. Generated content can be incomplete or wrong and must not be used as emergency guidance." />
        <LegalSection title="8. Billing and subscriptions" body="When paid subscriptions are enabled, purchases, renewals, cancellations and refunds are processed through the applicable app store and are subject to that store's billing rules. Access to paid features may depend on a valid verified entitlement. Prices and included allowances may change before renewal where permitted by applicable law and store rules." />
        <LegalSection title="9. Availability" body="Notifications, realtime updates, offline synchronization, exports, widgets, Care+ and other features may be delayed or unavailable because of device settings, connectivity, operating-system restrictions, maintenance or provider outages. The service may change or be discontinued." />
        <LegalSection title="10. No warranty" body="To the maximum extent permitted by applicable law, Janani is provided without warranties of uninterrupted operation, medical accuracy, data preservation, AI accuracy, or fitness for emergency or clinical use. Nothing in these terms excludes rights that cannot lawfully be excluded." />
        <LegalSection title="11. Changes" body="These terms may be updated as the service changes. The effective date will be revised when updated terms are published." />
        <LegalSection title="12. Support" body="Do not send passwords, family invite codes, pregnancy or health information, journal content, medication details or security-sensitive information through public support channels." />

        <View style={styles.actions}>
          <Pressable onPress={() => router.push('/privacy-policy')} style={styles.action}><Ionicons name="lock-closed-outline" size={20} color={colors.rose} /><Text style={styles.actionText}>Privacy Policy</Text><Ionicons name="chevron-forward" size={18} color={colors.muted} /></Pressable>
          <Pressable onPress={() => void Linking.openURL(PUBLISHED_TERMS_URL)} style={styles.action}><Ionicons name="open-outline" size={20} color={colors.rose} /><Text style={styles.actionText}>Open published web copy</Text><Ionicons name="open-outline" size={17} color={colors.muted} /></Pressable>
        </View>

        <Text style={styles.footer}>The published web copy remains Janani's public legal reference for store listings and users who are not signed in.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header() {
  return <View style={styles.header}><Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable><View style={styles.flex}><Text style={styles.eyebrow}>LEGAL</Text><Text style={styles.title}>Terms of Service</Text><Text style={styles.subtitle}>Terms of Use & medical disclaimer</Text></View></View>;
}

function LegalSection({ title, body }: { title: string; body: string }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><Text selectable style={styles.body}>{body}</Text></View>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.md},header:{flexDirection:'row',alignItems:'flex-start',gap:spacing.md,marginBottom:spacing.sm},backButton:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},flex:{flex:1},eyebrow:{fontSize:11,letterSpacing:1.8,fontWeight:'800',color:colors.rose},title:{marginTop:4,fontSize:29,lineHeight:36,fontWeight:'900',color:colors.ink},subtitle:{marginTop:3,fontSize:13,color:colors.muted},effective:{fontSize:12,fontWeight:'700',color:colors.muted},notice:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},noticeText:{flex:1,fontSize:13,lineHeight:20,color:colors.roseDark},noticeStrong:{fontWeight:'900'},section:{gap:spacing.sm,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},sectionTitle:{fontSize:16,fontWeight:'900',color:colors.ink},body:{fontSize:14,lineHeight:22,color:colors.muted},actions:{marginTop:spacing.sm,padding:spacing.sm,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},action:{minHeight:54,flexDirection:'row',alignItems:'center',gap:spacing.md,paddingHorizontal:spacing.md},actionText:{flex:1,fontSize:14,fontWeight:'800',color:colors.ink},footer:{paddingHorizontal:spacing.sm,textAlign:'center',fontSize:11,lineHeight:17,color:colors.muted}
});
