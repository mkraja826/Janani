import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme/tokens';

export default function PartnerUsScreen() {
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>YOU TWO</Text>
        <Text style={styles.title}>Support, preparation and connection</Text>
        <Text style={styles.intro}>Keep the shared parts of pregnancy simple. Her private health information stays hers unless she chooses to share it.</Text>

        <Action icon="heart-outline" title="Thinking of You" text="Send a small message or gesture of support." onPress={() => router.push('/thinking-of-you')} />
        <Action icon="alarm-outline" title="Shared reminders" text="Check practical reminders and upcoming tasks." onPress={() => router.push('/reminders')} />
        <Action icon="calendar-outline" title="Care timeline" text="Review upcoming pregnancy milestones and preparation." onPress={() => router.push('/care-timeline')} />
        <Action icon="people-outline" title="Partner & family" text="Manage your family connection and account settings." onPress={() => router.push('/settings')} />

        <View style={styles.note}>
          <Ionicons name="lock-closed-outline" size={22} color={colors.roseDark} />
          <View style={styles.flex}><Text style={styles.noteTitle}>Her privacy stays in her control</Text><Text style={styles.noteText}>Medical reports, journal entries and personal health measurements should not become visible just because a partner account is linked.</Text></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Action({ icon, title, text, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.card}>
    <View style={styles.icon}><Ionicons name={icon} size={22} color={colors.roseDark} /></View>
    <View style={styles.flex}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardText}>{text}</Text></View>
    <Ionicons name="chevron-forward" size={18} color={colors.muted} />
  </Pressable>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.md},eyebrow:{fontSize:11,letterSpacing:2,fontWeight:'900',color:colors.rose},title:{marginTop:2,fontSize:31,lineHeight:38,fontWeight:'900',color:colors.ink},intro:{marginBottom:spacing.sm,fontSize:14,lineHeight:22,color:colors.muted},card:{flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},icon:{width:46,height:46,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:colors.rosePale},flex:{flex:1},cardTitle:{fontSize:16,fontWeight:'800',color:colors.ink},cardText:{marginTop:4,fontSize:13,lineHeight:19,color:colors.muted},note:{marginTop:spacing.sm,flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.rosePale,borderWidth:1,borderColor:colors.border},noteTitle:{fontSize:15,fontWeight:'800',color:colors.ink},noteText:{marginTop:4,fontSize:12.5,lineHeight:18,color:colors.muted},
});
