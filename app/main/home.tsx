import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { productionConfig } from '@/config/production';
import { flushJananiOfflineQueue } from '@/features/offline/OfflineQueueSync';
import { cacheActivePregnancyId } from '@/features/pregnancy/activePregnancy';
import { getPregnancyProgress, trimesterLabel } from '@/features/pregnancy/progress';
import { type MessageKey } from '@/i18n';
import { tg } from '@/i18n/globalUi';
import { rtlLayoutFor } from '@/i18n/rtl';
import { readGlobalUiLocale } from '@/i18n/uiLocale';
import { readCache, writeCache } from '@/lib/cache';
import { supabase } from '@/lib/supabase';
import { useMembership } from '@/providers/AuthGate';
import { PendingOfflineChangesError, useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

type FamilySummary = { role: 'mother' | 'partner'; familyName: string; dueDate: string | null; inviteCode: string | null; };
const CACHE_KEY = 'home-summary-v1';

export default function HomeScreen() {
  const { session, signOut } = useAuth();
  const { markMembership } = useMembership();
  const [summary, setSummary] = useState<FamilySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [localeCode, setLocaleCode] = useState('en');
  const userId = session?.user.id;
  const tr = useCallback((key: MessageKey) => tg(localeCode, key), [localeCode]);
  const rtl = useMemo(() => rtlLayoutFor(localeCode), [localeCode]);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoadError(false);
    const cached = await readCache<FamilySummary>(userId, CACHE_KEY);
    if (cached) { setSummary(cached); setLoading(false); }
    const membership = await supabase.from('family_members').select('role,family_id').eq('user_id', userId).maybeSingle();
    if (membership.error) { if (!cached) setLoadError(true); setLoading(false); return; }
    if (!membership.data) { await markMembership(false); router.replace('/onboarding'); return; }
    const isMother = membership.data.role === 'mother';
    const [family, inviteCodeResult] = await Promise.all([
      supabase.from('families').select('name,pregnancies(id,due_date,status)').eq('id', membership.data.family_id).maybeSingle(),
      isMother ? supabase.rpc('get_mother_family_invite_code') : Promise.resolve({ data: null, error: null }),
    ]);
    if (family.error || !family.data || inviteCodeResult.error) { if (!cached) setLoadError(true); setLoading(false); return; }
    const familyData = family.data as unknown as { name:string; pregnancies:{id:string;due_date:string;status:string}[]|{id:string;due_date:string;status:string}|null };
    const pregnancies = Array.isArray(familyData.pregnancies) ? familyData.pregnancies : familyData.pregnancies ? [familyData.pregnancies] : [];
    const activePregnancy = pregnancies.find((item) => item.status === 'active');
    const pregnancy = activePregnancy ?? pregnancies[0];
    const next: FamilySummary = { role: membership.data.role as FamilySummary['role'], familyName: familyData.name ?? 'Our little family', dueDate: pregnancy?.due_date ?? null, inviteCode: isMother ? inviteCodeResult.data : null };
    setSummary(next); setLoading(false);
    await Promise.all([writeCache(userId, CACHE_KEY, next), cacheActivePregnancyId(userId, activePregnancy?.id ?? null)]);
  }, [markMembership, userId]);

  useFocusEffect(useCallback(() => {
    void readGlobalUiLocale().then(setLocaleCode).catch(() => setLocaleCode('en'));
    void load();
  }, [load]));

  async function finishSignOut(discardPending=false) {
    try { await signOut({ discardPending }); }
    catch(error) {
      if (error instanceof PendingOfflineChangesError) {
        Alert.alert('Unsynced changes', `${error.message} Stay signed in to preserve them, or explicitly discard them before signing out.`, [
          { text: 'Stay signed in', style: 'cancel' },
          { text: 'Sync first', onPress: () => { if (!userId) return; void flushJananiOfflineQueue(userId).then(() => finishSignOut(false)).catch(() => Alert.alert('Could not sync','Check your connection and try again.')); } },
          { text: 'Discard & sign out', style: 'destructive', onPress: () => void finishSignOut(true) },
        ]);
        return;
      }
      Alert.alert('Could not sign out', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  const progress = useMemo(() => summary?.dueDate ? getPregnancyProgress(summary.dueDate) : null, [summary?.dueDate]);
  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.rose}/></View>;
  if (loadError && !summary) return <View style={styles.center}><View style={styles.errorIcon}><Ionicons name="cloud-offline-outline" size={28} color={colors.roseDark}/></View><Text style={styles.errorTitle}>PregaLove could not load your family</Text><Text style={styles.errorText}>Check your connection. Your saved information has not been removed.</Text><Pressable onPress={() => { setLoading(true); void load(); }} style={({pressed}) => [styles.retryButton, pressed && styles.pressed]}><Text style={styles.retryText}>Try again</Text></Pressable></View>;

  const isMother = summary?.role === 'mother';
  const showCarePlus = isMother && productionConfig.carePlusVisible;
  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={[styles.topRow, rtl.row]}>
      <View style={styles.flex}><View style={styles.familyPill}><Ionicons name="heart-outline" size={14} color={colors.roseDark}/><Text style={styles.familyPillText}>{summary?.familyName.toUpperCase()}</Text></View><Text style={[styles.title, rtl.startText]}>{tr(isMother ? 'homeGreetingMother' : 'homeGreetingPartner')}</Text></View>
      <View style={[styles.topActions, rtl.row]}>
        <Pressable accessibilityLabel="Settings" onPress={() => router.push('/settings')} style={({pressed}) => [styles.iconButton, pressed && styles.pressed]}><Ionicons name="settings-outline" size={20} color={colors.inkSoft}/></Pressable>
        <Pressable accessibilityLabel="Sign out" onPress={() => void finishSignOut()} style={({pressed}) => [styles.iconButton, pressed && styles.pressed]}><Ionicons name="log-out-outline" size={20} color={colors.inkSoft}/></Pressable>
      </View>
    </View>

    <Pressable onPress={() => router.push('/pregnancy-guide')} style={({pressed}) => [styles.heroCard, rtl.row, pressed && styles.cardPressed]}>
      <View style={styles.heroIcon}><Ionicons name="heart" size={29} color={colors.surface}/></View>
      <View style={styles.flex}>
        <Text style={[styles.cardEyebrow, rtl.startText]}>{tr('todayWithJanani')}</Text>
        {progress ? <>
          <Text style={[styles.week, rtl.startText]}>{tr('week')} {progress.gestationalWeek}</Text>
          <Text style={[styles.cardTitle, rtl.startText]}>{trimesterLabel(progress.trimester)} · {tr('day')} {progress.gestationalDay}</Text>
          <Text style={[styles.cardMeta, rtl.startText]}>{progress.isPastDue ? 'Your due date has arrived. Keep in touch with your maternity care team.' : `${progress.daysRemaining} days until the estimated due date`}</Text>
        </> : <Text style={[styles.cardTitle, rtl.startText]}>{tr('hydrationPrompt')}</Text>}
        <View style={[styles.heroLinkRow, rtl.row]}><Text style={styles.heroLink}>{tr('openPregnancyGuide')}</Text><Ionicons name={rtl.isRtl?'arrow-back':'arrow-forward'} size={16} color={colors.roseDark}/></View>
      </View>
    </Pressable>

    {summary?.inviteCode ? <View style={styles.inviteCard}><View style={[styles.inviteTop, rtl.row]}><View style={styles.inviteIcon}><Ionicons name="people-outline" size={20} color={colors.roseDark}/></View><View style={styles.flex}><Text style={[styles.inviteLabel, rtl.startText]}>{tr('partnerInviteCode')}</Text><Text style={[styles.inviteHelp, rtl.startText]}>{tr('partnerInviteHelp')}</Text></View></View><Text selectable style={[styles.inviteCode, rtl.startText]}>{summary.inviteCode}</Text></View> : null}

    <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, rtl.startText]}>{tr('toolsTitle')}</Text><Text style={[styles.sectionCaption, rtl.startText]}>{tr('toolsCaption')}</Text></View>
    <View style={styles.toolList}>
      <Feature rtl={rtl.isRtl} icon="calendar-outline" title={tr('pregnancyGuide')} caption={tr('pregnancyGuideCaption')} onPress={() => router.push('/pregnancy-guide')} />
      <Feature rtl={rtl.isRtl} icon="medical-outline" title={tr('healthGuide')} caption={tr('healthGuideCaption')} onPress={() => router.push('/health-guide')} />
      {isMother ? <><Feature rtl={rtl.isRtl} icon="medkit-outline" title={tr('healthProfile')} caption={tr('healthProfileCaption')} onPress={() => router.push('/health-profile')} /><Feature rtl={rtl.isRtl} icon="document-text-outline" title={tr('careContext')} caption={tr('careContextCaption')} onPress={() => router.push('/care-context')} /><Feature rtl={rtl.isRtl} icon="pulse-outline" title={tr('healthTracker')} caption={tr('healthTrackerCaption')} onPress={() => router.push('/health-tracker')} /><Feature rtl={rtl.isRtl} icon="calendar-clear-outline" title={tr('careTimeline')} caption={tr('careTimelineCaption')} onPress={() => router.push('/care-timeline')} /></> : null}
      {showCarePlus ? <Feature accent rtl={rtl.isRtl} icon="sparkles-outline" title={tr('carePlus')} caption={tr(productionConfig.aiUiEnabled ? 'carePlusCaption' : 'carePlusOfflineCaption')} onPress={() => router.push('/ai-companion')} /> : null}
      <Feature rtl={rtl.isRtl} icon="alarm-outline" title={tr('reminders')} caption={tr('remindersCaption')} onPress={() => router.push('/reminders')} />
      <Feature rtl={rtl.isRtl} icon="nutrition-outline" title={tr('foodGuide')} caption={tr('foodGuideCaption')} onPress={() => router.push('/food-guide')} />
      <Feature rtl={rtl.isRtl} icon="book-outline" title={tr('journal')} caption={tr('journalCaption')} onPress={() => router.push('/journal')} />
      <Feature rtl={rtl.isRtl} icon="heart-outline" title={tr('thinkingOfYou')} caption={tr(summary?.role === 'partner' ? 'thinkingPartnerCaption' : 'thinkingMotherCaption')} onPress={() => router.push('/thinking-of-you')} />
      <Feature rtl={rtl.isRtl} icon="shield-checkmark-outline" title={tr('safetyPrivacy')} caption={tr('safetyCaption')} onPress={() => router.push('/safety-privacy')} />
      <Feature rtl={rtl.isRtl} icon="settings-outline" title={tr('settings')} caption={tr('settingsCaption')} onPress={() => router.push('/settings')} />
    </View>

    <View style={styles.backgroundFeatures}><View style={styles.backgroundBadge}><Ionicons name="leaf-outline" size={16} color={colors.sage}/></View><View style={styles.flex}><Text style={[styles.backgroundTitle, rtl.startText]}>{tr('backgroundTitle')}</Text><View style={styles.backgroundList}><BackgroundFeature rtl={rtl.isRtl} icon="notifications-outline" text={tr('backgroundNotifications')} /><BackgroundFeature rtl={rtl.isRtl} icon="cloud-offline-outline" text={tr('backgroundOffline')} /><BackgroundFeature rtl={rtl.isRtl} icon="phone-portrait-outline" text={tr('backgroundWidget')} /><BackgroundFeature rtl={rtl.isRtl} icon="people-outline" text={tr('backgroundFamily')} /></View></View></View>
    <Text style={styles.disclaimer}>PregaLove supports daily care and does not replace advice from your doctor.</Text>
  </ScrollView></SafeAreaView>;
}

function Feature({icon,title,caption,onPress,rtl,accent=false}:{icon:keyof typeof Ionicons.glyphMap;title:string;caption:string;onPress?:()=>void;rtl:boolean;accent?:boolean}) {
  const textStyle={textAlign:rtl?'right':'left',writingDirection:rtl?'rtl':'ltr'} as const;
  return <Pressable disabled={!onPress} onPress={onPress} style={({pressed}) => [styles.feature, accent && styles.featureAccent, rtl && styles.rowReverse, !onPress&&styles.featureDisabled, pressed&&styles.cardPressed]}><View style={[styles.featureIcon,accent&&styles.featureIconAccent]}><Ionicons name={icon} size={22} color={accent?colors.surface:colors.roseDark}/></View><View style={styles.flex}><Text style={[styles.featureTitle,textStyle]}>{title}</Text><Text style={[styles.featureCaption,textStyle]}>{caption}</Text></View><Ionicons name={rtl?'chevron-back':'chevron-forward'} size={18} color={colors.muted}/></Pressable>;
}
function BackgroundFeature({icon,text,rtl}:{icon:keyof typeof Ionicons.glyphMap;text:string;rtl:boolean}) { return <View style={[styles.backgroundRow,rtl&&styles.rowReverse]}><Ionicons name={icon} size={18} color={colors.sage}/><Text style={[styles.backgroundText,{textAlign:rtl?'right':'left',writingDirection:rtl?'rtl':'ltr'}]}>{text}</Text></View>; }

const styles=StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},center:{flex:1,alignItems:'center',justifyContent:'center',gap:spacing.md,padding:spacing.xl,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.xl},
  topRow:{flexDirection:'row',justifyContent:'space-between',gap:spacing.md,alignItems:'flex-start'},topActions:{flexDirection:'row',gap:spacing.sm},flex:{flex:1},familyPill:{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:10,paddingVertical:6,borderRadius:radius.pill,backgroundColor:colors.rosePale,borderWidth:1,borderColor:colors.border},familyPillText:{fontSize:10,letterSpacing:1.45,fontWeight:'900',color:colors.roseDark},title:{marginTop:spacing.md,maxWidth:305,fontSize:31,lineHeight:38,letterSpacing:-.45,fontWeight:'900',color:colors.ink},
  iconButton:{width:44,height:44,borderRadius:radius.pill,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.border,shadowColor:colors.shadow,shadowOffset:{width:0,height:3},shadowOpacity:.05,shadowRadius:8,elevation:2},pressed:{opacity:.68,transform:[{scale:.98}]},cardPressed:{opacity:.82,transform:[{scale:.995}]},
  heroCard:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:26,backgroundColor:colors.rosePale,borderWidth:1,borderColor:colors.border,shadowColor:colors.shadow,shadowOffset:{width:0,height:6},shadowOpacity:.07,shadowRadius:18,elevation:3},heroIcon:{width:56,height:56,borderRadius:20,alignItems:'center',justifyContent:'center',backgroundColor:colors.rose},cardEyebrow:{fontSize:10.5,letterSpacing:1.7,fontWeight:'900',color:colors.roseDark},week:{marginTop:spacing.sm,fontSize:32,lineHeight:38,fontWeight:'900',color:colors.ink},cardTitle:{marginTop:3,fontSize:16,lineHeight:23,fontWeight:'800',color:colors.ink},cardMeta:{marginTop:spacing.sm,fontSize:13,lineHeight:19,color:colors.muted},heroLinkRow:{marginTop:spacing.md,flexDirection:'row',alignItems:'center',gap:6},heroLink:{fontSize:13,fontWeight:'900',color:colors.roseDark},
  inviteCard:{padding:spacing.lg,borderRadius:24,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},inviteTop:{flexDirection:'row',alignItems:'center',gap:spacing.md},inviteIcon:{width:44,height:44,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:colors.roseSoft},inviteLabel:{fontSize:14,fontWeight:'900',color:colors.ink},inviteCode:{marginTop:spacing.md,fontSize:24,letterSpacing:2.7,fontWeight:'900',color:colors.roseDark},inviteHelp:{marginTop:3,fontSize:12.5,lineHeight:18,color:colors.muted},
  sectionHeader:{gap:spacing.xs},sectionTitle:{fontSize:21,fontWeight:'900',color:colors.ink},sectionCaption:{fontSize:13,lineHeight:19,color:colors.muted},toolList:{gap:spacing.sm},feature:{minHeight:82,flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.md,borderRadius:22,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},rowReverse:{flexDirection:'row-reverse'},featureAccent:{backgroundColor:colors.lavenderSoft},featureDisabled:{opacity:.6},featureIcon:{width:46,height:46,borderRadius:17,alignItems:'center',justifyContent:'center',backgroundColor:colors.roseSoft},featureIconAccent:{backgroundColor:colors.plum},featureTitle:{fontSize:15.5,fontWeight:'900',color:colors.ink},featureCaption:{marginTop:3,fontSize:12.5,lineHeight:18,color:colors.muted},
  backgroundFeatures:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:24,backgroundColor:colors.sageSoft,borderWidth:1,borderColor:colors.border},backgroundBadge:{width:42,height:42,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface},backgroundTitle:{fontSize:16,fontWeight:'900',color:colors.ink},backgroundList:{marginTop:spacing.md,gap:spacing.sm},backgroundRow:{flexDirection:'row',alignItems:'flex-start',gap:spacing.sm},backgroundText:{flex:1,fontSize:12.5,lineHeight:18,color:colors.muted},disclaimer:{textAlign:'center',fontSize:11.5,lineHeight:17,color:colors.muted},
  errorIcon:{width:58,height:58,borderRadius:20,alignItems:'center',justifyContent:'center',backgroundColor:colors.roseSoft},errorTitle:{textAlign:'center',fontSize:20,fontWeight:'900',color:colors.ink},errorText:{maxWidth:340,textAlign:'center',fontSize:14,lineHeight:21,color:colors.muted},retryButton:{minWidth:130,minHeight:50,alignItems:'center',justifyContent:'center',borderRadius:radius.pill,backgroundColor:colors.rose},retryText:{fontWeight:'900',color:colors.surface}
});
