import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme/tokens';

const PUBLISHED_PRIVACY_URL = 'https://mkraja826.github.io/Janani/privacy/';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Header eyebrow="LEGAL" title="Privacy Policy" />
        <Text style={styles.effective}>Effective date: September 2, 2026</Text>
        <View style={styles.notice}><Ionicons name="heart-outline" size={23} color={colors.rose} /><Text style={styles.noticeText}>Janani is a pregnancy-support application. It is not a medical device and does not provide diagnosis, treatment, monitoring, or emergency services.</Text></View>

        <LegalSection title="1. Information Janani processes" body="Depending on the features you use, Janani may process account identifiers and email address; profile, family membership and mother-or-partner role information; pregnancy dates and optional body measurements; reminder content, schedules and completion history; journal entries, moods and sharing choices; partner messages and acknowledgements; Care+ questions and relevant saved pregnancy or health context; subscription entitlement and usage information; and device push tokens and technical information needed to deliver notifications and protect the service." />
        <LegalSection title="2. How information is used" body="Janani uses this information to authenticate accounts, create and protect a family space, calculate pregnancy progress, provide reminders, synchronize selected family information, deliver partner notifications, preserve journal entries, support offline synchronization, operate home-screen widgets, provide eligible Care+ features, enforce usage and subscription limits, prevent duplicate writes, and maintain service reliability and security." />
        <LegalSection title="3. Family sharing and journal choices" body="A partner can join a family only through an invitation flow. Linked family members can see shared reminders and partner messages. A journal entry is intended to be private unless its author chooses to share it with the linked partner. Review the sharing choice shown when creating or editing an entry." />
        <LegalSection title="4. Service providers and Care+ AI" body="Janani uses Supabase for authentication, database storage, realtime synchronization and server functions. Expo services may process device tokens and notification content to deliver push notifications. GitHub hosts Janani's public legal and support site. When an eligible user asks Care+, Janani's protected server function may send the question and only the relevant context needed for that request to the configured AI model provider. The AI provider may process that request under its own service terms and privacy safeguards. Janani does not sell personal information or use its legal site for advertising analytics." />
        <LegalSection title="5. Device permissions and local storage" body="Notification permission is used for care and partner alerts. Android reboot and widget functionality may be used to restore reminders and display selected care information. Janani may keep an on-device cache, widget state and pending synchronization queue. Device settings can limit permissions, and clearing app data or uninstalling removes app-controlled local storage from that device." />
        <LegalSection title="6. Security" body="Janani uses authenticated access controls, database Row Level Security, protected server functions and restricted access to device tokens. Data is sent over encrypted network connections supported by the app and its providers. No application or storage system can guarantee absolute security." />
        <LegalSection title="7. Retention, export and deletion" body="Application data is retained while needed to provide the account and family space. Signed-in users can export a JSON copy from Settings and permanently delete their account from the same screen. Deletion removes the account and associated active application data according to the user's family role. Infrastructure providers may retain limited backups or security logs for periods governed by their operational or legal requirements." />
        <LegalSection title="8. Your choices" body="You can change notification permission in device settings, choose whether individual journal entries are shared, decide whether to use Care+, export your data, leave or disconnect a family relationship where the app provides that option, manage app-store subscriptions when billing is enabled, and delete your account." />
        <LegalSection title="9. Children" body="Janani is intended for adults managing a pregnancy journey and is not directed to children." />
        <LegalSection title="10. Medical and emergency information" body="Janani does not monitor symptoms or contact emergency services. Severe pain, heavy bleeding, breathing difficulty, fainting, seizures, reduced consciousness, or any urgent concern requires immediate contact with local emergency services or a qualified maternity-care professional." />
        <LegalSection title="11. Changes to this policy" body="This policy may change as Janani changes. The effective date will be updated when a revised policy is published." />
        <LegalSection title="12. Contact and privacy requests" body="Janani's public support instructions must not be used to post sensitive information. Never publish passwords, family invite codes, pregnancy or health information, journal content, medication details, Care+ conversations, or other private information in a public issue." />

        <View style={styles.actions}>
          <Pressable onPress={() => router.push('/terms-of-service')} style={styles.action}><Ionicons name="document-text-outline" size={20} color={colors.rose} /><Text style={styles.actionText}>Terms of Service</Text><Ionicons name="chevron-forward" size={18} color={colors.muted} /></Pressable>
          <Pressable onPress={() => void Linking.openURL(PUBLISHED_PRIVACY_URL)} style={styles.action}><Ionicons name="open-outline" size={20} color={colors.rose} /><Text style={styles.actionText}>Open published web copy</Text><Ionicons name="open-outline" size={17} color={colors.muted} /></Pressable>
        </View>

        <Text style={styles.footer}>The published web copy remains the public Janani legal reference for store listings and users who are not signed in.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <View style={styles.header}><Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable><View style={styles.flex}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.title}>{title}</Text></View></View>;
}

function LegalSection({ title, body }: { title: string; body: string }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><Text selectable style={styles.body}>{body}</Text></View>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.md},header:{flexDirection:'row',alignItems:'flex-start',gap:spacing.md,marginBottom:spacing.sm},backButton:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},flex:{flex:1},eyebrow:{fontSize:11,letterSpacing:1.8,fontWeight:'800',color:colors.rose},title:{marginTop:4,fontSize:29,lineHeight:36,fontWeight:'900',color:colors.ink},effective:{fontSize:12,fontWeight:'700',color:colors.muted},notice:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},noticeText:{flex:1,fontSize:13,lineHeight:20,fontWeight:'600',color:colors.roseDark},section:{gap:spacing.sm,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},sectionTitle:{fontSize:16,fontWeight:'900',color:colors.ink},body:{fontSize:14,lineHeight:22,color:colors.muted},actions:{marginTop:spacing.sm,padding:spacing.sm,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},action:{minHeight:54,flexDirection:'row',alignItems:'center',gap:spacing.md,paddingHorizontal:spacing.md},actionText:{flex:1,fontSize:14,fontWeight:'800',color:colors.ink},footer:{paddingHorizontal:spacing.sm,textAlign:'center',fontSize:11,lineHeight:17,color:colors.muted}
});
