import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { getPregnancyProgress } from '@/features/pregnancy/progress';
import { trimesterLabel } from '@/features/pregnancy/progress';
import { colors, radius, spacing } from '@/theme/tokens';

type PregnancyProgress = ReturnType<typeof getPregnancyProgress>;

type Props = {
  familyName: string;
  progress: PregnancyProgress | null;
};

export function PartnerHome({ familyName, progress }: Props) {
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>TODAY FOR HER</Text>
            <Text style={styles.title}>Here’s how you can help today ❤️</Text>
            <Text style={styles.subtitle}>Small, practical support matters more than getting everything perfect.</Text>
          </View>
          <Pressable accessibilityLabel="Settings" onPress={() => router.push('/settings')} style={styles.iconButton}>
            <Ionicons name="settings-outline" size={21} color={colors.inkSoft} />
          </Pressable>
        </View>

        <Pressable onPress={() => router.push('/pregnancy-guide')} style={styles.pregnancyCard}>
          <View style={styles.pregnancyIcon}><Ionicons name="heart" size={26} color={colors.surface} /></View>
          <View style={styles.flex}>
            {progress ? <>
              <Text style={styles.week}>Week {progress.gestationalWeek} + {progress.gestationalDay} days</Text>
              <Text style={styles.meta}>{trimesterLabel(progress.trimester)}</Text>
              <Text style={styles.caption}>{progress.isPastDue ? 'The estimated due date has arrived.' : `${progress.daysRemaining} days until the estimated due date`}</Text>
            </> : <>
              <Text style={styles.week}>{familyName || 'Your family journey'}</Text>
              <Text style={styles.caption}>Pregnancy details will appear here when they are available to you.</Text>
            </>}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.roseDark} />
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>For her today</Text>
          <Text style={styles.sectionCaption}>Three simple things you can do without guessing what she needs.</Text>
        </View>

        <View style={styles.actionList}>
          <ActionRow icon="water-outline" title="Help with water and meals" caption="Keep water nearby and ask what food feels comfortable today." />
          <ActionRow icon="home-outline" title="Take one task off her plate" caption="Handle a household or practical task so she has more room to rest." />
          <ActionRow icon="chatbubble-ellipses-outline" title="Ask, don’t assume" caption="A simple “How are you feeling, and what would help?” can be enough." />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your responsibility</Text>
          <Text style={styles.sectionCaption}>Stay ahead of the practical things you can own.</Text>
        </View>

        <View style={styles.responsibilityGrid}>
          <QuickCard icon="calendar-outline" title="Appointments" caption="Keep plans and transport ready" onPress={() => router.push('/care-timeline')} />
          <QuickCard icon="alarm-outline" title="Shared reminders" caption="See family reminders you can help with" onPress={() => router.push('/reminders')} />
        </View>

        <Pressable onPress={() => router.push('/thinking-of-you')} style={styles.thinkingCard}>
          <View style={styles.thinkingIcon}><Ionicons name="heart" size={24} color={colors.surface} /></View>
          <View style={styles.flex}>
            <Text style={styles.thinkingTitle}>Thinking of You</Text>
            <Text style={styles.thinkingText}>Send a small supportive message and let her know you’re with her.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.roseDark} />
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Coming up</Text>
          <Text style={styles.sectionCaption}>Use Journey for this week’s pregnancy changes and what you can prepare for next.</Text>
        </View>
        <Pressable onPress={() => router.push('/main/journey')} style={styles.wideCard}>
          <View style={styles.wideIcon}><Ionicons name="book-outline" size={22} color={colors.roseDark} /></View>
          <View style={styles.flex}>
            <Text style={styles.wideTitle}>This week together</Text>
            <Text style={styles.wideText}>Understand what may be changing and how to support her without overwhelming her.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.roseDark} />
        </Pressable>

        <View style={styles.forYouCard}>
          <View style={styles.forYouHeader}>
            <Ionicons name="shield-checkmark-outline" size={21} color={colors.roseDark} />
            <Text style={styles.forYouTitle}>For you, too</Text>
          </View>
          <Text style={styles.forYouText}>Supporting someone through pregnancy can be tiring. Sleep, eat, ask for help when you need it, and keep yourself steady enough to be there for your family.</Text>
        </View>

        <View style={styles.safetyCard}>
          <Ionicons name="medical-outline" size={20} color={colors.roseDark} />
          <Text style={styles.safetyText}>If she feels something is urgent, severe or unusual, support her in contacting her maternity care team or seeking urgent medical care. PregaLove does not diagnose symptoms.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionRow({ icon, title, caption }: { icon: keyof typeof Ionicons.glyphMap; title: string; caption: string }) {
  return <View style={styles.actionRow}>
    <View style={styles.actionIcon}><Ionicons name={icon} size={21} color={colors.roseDark} /></View>
    <View style={styles.flex}>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionCaption}>{caption}</Text>
    </View>
  </View>;
}

function QuickCard({ icon, title, caption, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; caption: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.quickCard}>
    <View style={styles.quickIcon}><Ionicons name={icon} size={21} color={colors.roseDark} /></View>
    <Text style={styles.quickTitle}>{title}</Text>
    <Text style={styles.quickCaption}>{caption}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},
  content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.xl},
  flex:{flex:1},
  topRow:{flexDirection:'row',alignItems:'flex-start',gap:spacing.md},
  eyebrow:{fontSize:11,letterSpacing:2.1,fontWeight:'900',color:colors.rose},
  title:{marginTop:6,fontSize:30,lineHeight:37,fontWeight:'900',color:colors.ink},
  subtitle:{marginTop:7,fontSize:13,lineHeight:19,color:colors.muted},
  iconButton:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},
  pregnancyCard:{flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.lg,borderRadius:26,backgroundColor:colors.rosePale,borderWidth:1,borderColor:colors.border},
  pregnancyIcon:{width:52,height:52,borderRadius:18,alignItems:'center',justifyContent:'center',backgroundColor:colors.rose},
  week:{fontSize:21,lineHeight:27,fontWeight:'900',color:colors.ink},
  meta:{marginTop:2,fontSize:14,fontWeight:'800',color:colors.roseDark},
  caption:{marginTop:5,fontSize:13,lineHeight:19,color:colors.muted},
  sectionHeader:{gap:4},
  sectionTitle:{fontSize:21,fontWeight:'900',color:colors.ink},
  sectionCaption:{fontSize:13,lineHeight:19,color:colors.muted},
  actionList:{gap:spacing.sm},
  actionRow:{flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.md,borderRadius:20,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},
  actionIcon:{width:44,height:44,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:colors.blush},
  actionTitle:{fontSize:15,fontWeight:'900',color:colors.ink},
  actionCaption:{marginTop:3,fontSize:12.5,lineHeight:18,color:colors.muted},
  responsibilityGrid:{flexDirection:'row',gap:spacing.md},
  quickCard:{flex:1,minHeight:142,padding:spacing.md,borderRadius:22,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},
  quickIcon:{width:42,height:42,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:colors.blush},
  quickTitle:{marginTop:spacing.md,fontSize:15,fontWeight:'900',color:colors.ink},
  quickCaption:{marginTop:4,fontSize:12,lineHeight:17,color:colors.muted},
  thinkingCard:{flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.lg,borderRadius:24,backgroundColor:colors.rosePale,borderWidth:1,borderColor:colors.border},
  thinkingIcon:{width:48,height:48,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:colors.rose},
  thinkingTitle:{fontSize:17,fontWeight:'900',color:colors.ink},
  thinkingText:{marginTop:4,fontSize:12.5,lineHeight:18,color:colors.muted},
  wideCard:{flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.lg,borderRadius:22,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},
  wideIcon:{width:46,height:46,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:colors.blush},
  wideTitle:{fontSize:16,fontWeight:'900',color:colors.ink},
  wideText:{marginTop:4,fontSize:12.5,lineHeight:18,color:colors.muted},
  forYouCard:{padding:spacing.lg,borderRadius:22,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},
  forYouHeader:{flexDirection:'row',alignItems:'center',gap:8},
  forYouTitle:{fontSize:16,fontWeight:'900',color:colors.ink},
  forYouText:{marginTop:spacing.sm,fontSize:12.5,lineHeight:19,color:colors.muted},
  safetyCard:{flexDirection:'row',alignItems:'flex-start',gap:spacing.sm,padding:spacing.md,borderRadius:18,backgroundColor:colors.blush},
  safetyText:{flex:1,fontSize:11.5,lineHeight:18,color:colors.muted},
});
