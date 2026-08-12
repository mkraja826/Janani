import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getCurrentOwnPartnerSharing,
  getCurrentPartnerSupportContext,
  parsePartnerSharing,
  parsePartnerSupportContext,
  setCurrentOwnPartnerSharing,
  type PartnerSharing,
  type PartnerSupportContext,
} from '@/features/partner/partnerSupport';
import { JANANI_COPY } from '@/features/tone/toneSystem';
import { supabase } from '@/lib/supabase';
import { colors, radius, spacing } from '@/theme/tokens';

type Role = 'mother' | 'partner';

export default function PartnerFamilyScreen() {
  const [role, setRole] = useState<Role | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [sharing, setSharing] = useState<PartnerSharing | null>(null);
  const [partnerContext, setPartnerContext] = useState<PartnerSupportContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoadError(false);
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (authError || !userId) {
      setLoadError(true);
      setLoading(false);
      return;
    }
    const membership = await supabase
      .from('family_members')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    if (membership.error || !membership.data) {
      setLoadError(true);
      setLoading(false);
      return;
    }
    const nextRole = membership.data.role as Role;
    setRole(nextRole);

    if (nextRole === 'mother') {
      const [invite, sharingResult] = await Promise.all([
        supabase.rpc('get_mother_family_invite_code'),
        getCurrentOwnPartnerSharing(),
      ]);
      if (invite.error || sharingResult.error) {
        setLoadError(true);
      } else {
        setInviteCode(typeof invite.data === 'string' ? invite.data : null);
        setSharing(parsePartnerSharing(sharingResult.data));
        setPartnerContext(null);
      }
    } else {
      const result = await getCurrentPartnerSupportContext();
      if (result.error) setLoadError(true);
      else {
        setPartnerContext(parsePartnerSupportContext(result.data));
        setSharing(null);
        setInviteCode(null);
      }
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function updateSharing(next: Pick<PartnerSharing, 'sharePregnancyProgress' | 'shareCareTimeline'>) {
    if (!sharing || busy) return;
    const previous = sharing;
    setSharing({ ...sharing, ...next });
    setBusy(true);
    const result = await setCurrentOwnPartnerSharing({
      sharePregnancyProgress: next.sharePregnancyProgress,
      shareCareTimeline: next.shareCareTimeline,
    });
    setBusy(false);
    if (result.error) {
      setSharing(previous);
      Alert.alert('Could not change sharing', 'Your previous privacy choice is still in place. Please try again.');
      return;
    }
    const parsed = parsePartnerSharing(result.data);
    if (parsed) setSharing(parsed);
  }

  async function shareInvite() {
    if (!inviteCode) return;
    await Share.share({
      message: `Join our Janani family with invite code ${inviteCode}. Only use this code if you are the partner I invited.`,
    });
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.rose} /></View>;

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </Pressable>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>PARTNER & FAMILY</Text>
            <Text style={styles.title}>{role === 'mother' ? 'You decide what is shared' : JANANI_COPY.partner.title}</Text>
          </View>
        </View>

        {loadError ? (
          <View style={styles.errorCard}>
            <Ionicons name="cloud-offline-outline" size={24} color={colors.roseDark} />
            <Text style={styles.errorTitle}>Partner & Family could not load</Text>
            <Text style={styles.body}>Your current sharing choices have not changed.</Text>
            <Pressable onPress={() => { setLoading(true); void load(); }} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>Try again</Text>
            </Pressable>
          </View>
        ) : role === 'mother' && sharing ? (
          <>
            <View style={styles.heroCard}>
              <View style={styles.heroIcon}><Ionicons name="people-outline" size={28} color={colors.roseDark} /></View>
              <Text style={styles.heroTitle}>Your partner can support you without automatically seeing your health details.</Text>
              <Text style={styles.body}>Health conditions, reports and private medical context stay mother-only. The switches below control the two partner views Janani can share.</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What your partner can see</Text>
              <SharingRow
                icon="calendar-number-outline"
                title="Pregnancy progress"
                description="Share the current pregnancy week, trimester and due-date progress. This is on by default and can be turned off anytime."
                value={sharing.sharePregnancyProgress}
                disabled={busy}
                onChange={(value) => void updateSharing({
                  sharePregnancyProgress: value,
                  shareCareTimeline: sharing.shareCareTimeline,
                })}
              />
              <SharingRow
                icon="calendar-outline"
                title="Upcoming care timeline"
                description="Share only appointment type and time. Doctor notes, tests, reports and medical details remain private."
                value={sharing.shareCareTimeline}
                disabled={busy}
                onChange={(value) => void updateSharing({
                  sharePregnancyProgress: sharing.sharePregnancyProgress,
                  shareCareTimeline: value,
                })}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Invite your partner</Text>
              <Text style={styles.body}>Share this code only with the person you want connected to this pregnancy space.</Text>
              <View style={styles.codeCard}>
                <Text selectable style={styles.inviteCode}>{inviteCode ?? '—'}</Text>
              </View>
              <Pressable disabled={!inviteCode} onPress={() => void shareInvite()} style={styles.primaryButton}>
                <Ionicons name="share-social-outline" size={19} color={colors.surface} />
                <Text style={styles.primaryText}>Share invite code</Text>
              </Pressable>
            </View>
          </>
        ) : partnerContext ? (
          <>
            <View style={styles.heroCard}>
              <View style={styles.heroIcon}><Ionicons name="heart-outline" size={28} color={colors.roseDark} /></View>
              <Text style={styles.heroTitle}>{partnerContext.familyName}</Text>
              <Text style={styles.body}>{JANANI_COPY.partner.subtitle} Her Health profile and reports are not part of this partner view.</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Shared with you</Text>
              <StatusRow
                icon="calendar-number-outline"
                title="Pregnancy progress"
                enabled={partnerContext.pregnancyProgressShared}
                enabledText="Shared"
                disabledText="Private right now"
              />
              <StatusRow
                icon="calendar-outline"
                title="Upcoming care timeline"
                enabled={partnerContext.careTimelineShared}
                enabledText="Shared"
                disabledText="Private right now"
              />
            </View>

            <Pressable onPress={() => router.push('/thinking-of-you')} style={styles.primaryButton}>
              <Ionicons name="heart" size={19} color={colors.surface} />
              <Text style={styles.primaryText}>Send Thinking of You</Text>
            </Pressable>
          </>
        ) : null}

        <Pressable onPress={() => router.push('/settings')} style={styles.secondaryButton}>
          <Ionicons name="settings-outline" size={18} color={colors.roseDark} />
          <Text style={styles.secondaryText}>{role === 'mother' ? 'Family connection settings' : 'Manage my family connection'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SharingRow({ icon, title, description, value, disabled, onChange }: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  value: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.sharingRow}>
      <View style={styles.rowIcon}><Ionicons name={icon} size={21} color={colors.roseDark} /></View>
      <View style={styles.flex}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Switch value={value} disabled={disabled} onValueChange={onChange} />
    </View>
  );
}

function StatusRow({ icon, title, enabled, enabledText, disabledText }: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  enabled: boolean;
  enabledText: string;
  disabledText: string;
}) {
  return (
    <View style={styles.statusRow}>
      <View style={styles.rowIcon}><Ionicons name={icon} size={21} color={colors.roseDark} /></View>
      <View style={styles.flex}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDescription}>{enabled ? enabledText : disabledText}</Text>
      </View>
      <Ionicons name={enabled ? 'checkmark-circle' : 'lock-closed-outline'} size={21} color={enabled ? colors.sage : colors.muted} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  iconButton: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  flex: { flex: 1 },
  eyebrow: { fontSize: 11, letterSpacing: 1.8, fontWeight: '800', color: colors.rose },
  title: { marginTop: 4, fontSize: 27, lineHeight: 34, fontWeight: '900', color: colors.ink },
  heroCard: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.blush },
  heroIcon: { width: 62, height: 62, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  heroTitle: { textAlign: 'center', fontSize: 20, lineHeight: 27, fontWeight: '900', color: colors.ink },
  body: { textAlign: 'center', fontSize: 13, lineHeight: 20, color: colors.muted },
  section: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.ink },
  sharingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  rowIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blush },
  rowTitle: { fontSize: 14, fontWeight: '800', color: colors.ink },
  rowDescription: { marginTop: 3, fontSize: 12, lineHeight: 17, color: colors.muted },
  codeCard: { padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  inviteCode: { textAlign: 'center', fontSize: 25, letterSpacing: 4, fontWeight: '900', color: colors.roseDark },
  primaryButton: { minHeight: 52, paddingHorizontal: spacing.lg, borderRadius: radius.pill, backgroundColor: colors.rose, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  primaryText: { fontSize: 14, fontWeight: '800', color: colors.surface },
  secondaryButton: { minHeight: 50, paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  secondaryText: { fontSize: 14, fontWeight: '800', color: colors.roseDark },
  errorCard: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  errorTitle: { fontSize: 18, fontWeight: '900', color: colors.ink },
});
