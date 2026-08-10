import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import { router, useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formsAccountCopy } from '@/i18n/formsAccount';
import { readGlobalUiLocale } from '@/i18n/uiLocale';
import { supabase } from '@/lib/supabase';
import { useMembership } from '@/providers/AuthGate';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

type Role = 'mother' | 'partner';
type AccountSummary = { role: Role; familyId: string; familyName: string; hasPartner: boolean };

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const { markMembership } = useMembership();
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [deleteText, setDeleteText] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [copy, setCopy] = useState(() => formsAccountCopy('en'));
  const userId = session?.user.id;

  useEffect(() => { void readGlobalUiLocale().then((locale) => setCopy(formsAccountCopy(locale))); }, []);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true); setLoadError(null);
    const { data, error } = await supabase.from('family_members').select('role,family_id,families(name,family_members(role))').eq('user_id', userId).maybeSingle();
    if (error) { setLoadError('Janani could not load your account settings. Check your connection and try again.'); setLoading(false); return; }
    if (!data) { await markMembership(false); setLoading(false); router.replace('/onboarding'); return; }
    const family = Array.isArray(data.families) ? data.families[0] : data.families;
    const members = family?.family_members; const list = Array.isArray(members) ? members : members ? [members] : [];
    setSummary({ role: data.role as Role, familyId: data.family_id, familyName: family?.name ?? 'Our little family', hasPartner: list.some((item) => item.role === 'partner') });
    setLoading(false);
  }, [markMembership, userId]);

  useFocusEffect(useCallback(() => { void load(); void readGlobalUiLocale().then((locale) => setCopy(formsAccountCopy(locale))); }, [load]));

  async function exportData() {
    if (!session) return; setBusy('export'); let exportFile: File | null = null;
    try {
      const [profile, membership, pregnancies, reminders, reminderLogs, journal, nudges, privatePregnancy] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
        supabase.from('family_members').select('role,family_id,joined_at,families(name,created_at)').eq('user_id', session.user.id).maybeSingle(),
        supabase.from('pregnancies').select('id,family_id,mother_id,due_date,status,created_at,updated_at').order('created_at'),
        supabase.from('reminders').select('*').order('created_at'),
        supabase.from('reminder_logs').select('*').order('scheduled_for'),
        supabase.from('journal_entries').select('*').order('entry_date'),
        supabase.from('partner_nudges').select('*').order('created_at'),
        summary?.role === 'mother' ? supabase.rpc('get_mother_pregnancy_private_details') : Promise.resolve({ data: [], error: null }),
      ]);
      const firstError = [profile, membership, pregnancies, reminders, reminderLogs, journal, nudges, privatePregnancy].find((item) => item.error)?.error; if (firstError) throw firstError;
      const payload = JSON.stringify({ exported_at: new Date().toISOString(), account_email: session.user.email ?? null, profile: profile.data, membership: membership.data, pregnancies: pregnancies.data ?? [], pregnancy_private_details: privatePregnancy.data ?? [], reminders: reminders.data ?? [], reminder_logs: reminderLogs.data ?? [], journal_entries: journal.data ?? [], partner_nudges: nudges.data ?? [] }, null, 2);
      if (!(await Sharing.isAvailableAsync())) throw new Error('File sharing is not available on this device.');
      exportFile = new File(Paths.cache, `janani-data-export-${Date.now()}.json`); exportFile.write(payload);
      await Sharing.shareAsync(exportFile.uri, { dialogTitle: 'Share Janani data export', mimeType: 'application/json', UTI: 'public.json' });
    } catch (error) { Alert.alert('Could not export data', error instanceof Error ? error.message : 'Please try again while connected.'); }
    finally { try { if (exportFile?.exists) exportFile.delete(); } catch {} setBusy(null); }
  }

  function confirmExport() { Alert.alert('Export sensitive Janani data?', 'The JSON file can contain pregnancy dates, reminders, journal entries, and partner messages. Share it only with a destination you trust.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Continue', onPress: () => void exportData() }]); }
  function leaveOrDisconnect() {
    if (!summary) return; const mother = summary.role === 'mother';
    Alert.alert(mother ? 'Disconnect partner?' : 'Leave this family?', mother ? 'Your pregnancy, reminders and journal stay in Janani. The current partner loses access and the invite code is replaced.' : 'You will lose access to this pregnancy family. The mother’s pregnancy data remains safe.', [{ text: 'Cancel', style: 'cancel' }, { text: mother ? 'Disconnect' : 'Leave family', style: 'destructive', onPress: async () => { setBusy('membership'); const { error } = await supabase.rpc(mother ? 'disconnect_partner' : 'leave_family'); setBusy(null); if (error) return Alert.alert('Could not update family', error.message); if (mother) { setSummary((current) => current ? { ...current, hasPartner: false } : current); Alert.alert('Partner disconnected', 'A new invite code has been created.'); } else { await markMembership(false); router.replace('/onboarding?role=partner'); } } }]);
  }
  function confirmDelete() {
    if (!summary || deleteText !== 'DELETE' || !currentPassword) { Alert.alert('Confirmation needed', 'Type DELETE exactly and enter your current password.'); return; }
    const mother = summary.role === 'mother';
    Alert.alert('Permanently delete account?', mother ? 'This permanently deletes your account and the family pregnancy space, including reminders, journal entries and partner access. Export anything you need first.' : 'This permanently deletes your account, membership and entries you authored. The mother’s pregnancy space remains.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete permanently', style: 'destructive', onPress: async () => { setBusy('delete'); const { error } = await supabase.functions.invoke('delete-account', { body: { confirmation: 'DELETE', current_password: currentPassword } }); if (error) { setBusy(null); return Alert.alert('Could not delete account', error.message); } await markMembership(false); await signOut({ discardPending: true }).catch(() => undefined); router.replace('/'); } }]);
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.rose} /></View>;
  if (loadError) return <SafeAreaView style={styles.page}><View style={styles.errorState}><Ionicons name="cloud-offline-outline" size={36} color={colors.rose} /><Text style={styles.errorTitle}>Settings are temporarily unavailable</Text><Text style={styles.errorText}>{loadError}</Text><Pressable onPress={() => void load()} style={styles.retryButton}><Text style={styles.retryText}>{copy.tryAgain}</Text></Pressable></View></SafeAreaView>;

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.iconButton}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable><View style={styles.flex}><Text style={styles.eyebrow}>{copy.settingsEyebrow}</Text><Text style={styles.title}>{copy.settingsTitle}</Text></View></View>
    <Section title={copy.yourData}><Action icon="download-outline" title="Export my Janani data" description="Share a JSON file containing your pregnancy profile, reminders, journal and partner messages." disabled={busy !== null} loading={busy === 'export'} onPress={confirmExport} /><Action icon="shield-checkmark-outline" title={copy.safetyPrivacy} description="Read how Janani handles health guidance, sharing and permissions." onPress={() => router.push('/safety-privacy')} /></Section>
    <Section title={copy.familyConnection}><View style={styles.familyCard}><Text style={styles.familyName}>{summary?.familyName ?? copy.noFamilyLinked}</Text><Text style={styles.roleText}>{summary?.role === 'mother' ? copy.motherAccount : copy.partnerAccount}</Text></View>{summary?.role === 'mother' ? <Action icon="person-remove-outline" title="Disconnect partner" description={summary.hasPartner ? 'Remove the linked partner and rotate the invite code.' : 'No partner is currently linked.'} danger disabled={!summary.hasPartner || busy !== null} loading={busy === 'membership'} onPress={leaveOrDisconnect} /> : <Action icon="exit-outline" title="Leave family" description="Remove your access without deleting the mother’s pregnancy data." danger disabled={busy !== null} loading={busy === 'membership'} onPress={leaveOrDisconnect} />}</Section>
    <Section title="Delete account" danger><Text style={styles.warning}>{summary?.role === 'mother' ? 'For a mother account, deletion also removes the family pregnancy space and its shared records.' : 'For a partner account, deletion removes your membership and the records you authored.'}</Text><Text style={styles.label}>Type DELETE to confirm</Text><TextInput value={deleteText} onChangeText={setDeleteText} autoCapitalize="characters" placeholder="DELETE" placeholderTextColor={colors.muted} style={styles.input} /><Text style={styles.label}>Enter your current password</Text><TextInput value={currentPassword} onChangeText={setCurrentPassword} autoCapitalize="none" autoComplete="current-password" secureTextEntry placeholder="Current password" placeholderTextColor={colors.muted} style={[styles.input, styles.passwordInput]} /><Pressable disabled={!summary || busy !== null || deleteText !== 'DELETE' || !currentPassword} onPress={confirmDelete} style={[styles.deleteButton, (!summary || busy !== null || deleteText !== 'DELETE' || !currentPassword) && styles.disabled]}>{busy === 'delete' ? <ActivityIndicator color={colors.surface} /> : <><Ionicons name="trash-outline" size={19} color={colors.surface} /><Text style={styles.deleteText}>Delete account permanently</Text></>}</Pressable></Section>
  </ScrollView></SafeAreaView>;
}

function Section({ title, children, danger = false }: { title: string; children: React.ReactNode; danger?: boolean }) { return <View style={[styles.section, danger && styles.dangerSection]}><Text style={[styles.sectionTitle, danger && { color: colors.danger }]}>{title}</Text>{children}</View>; }
function Action({ icon, title, description, onPress, danger = false, disabled = false, loading = false }: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string; onPress: () => void; danger?: boolean; disabled?: boolean; loading?: boolean }) { return <Pressable disabled={disabled} onPress={onPress} style={[styles.action, disabled && styles.disabled]}><View style={styles.actionIcon}><Ionicons name={icon} size={22} color={danger ? colors.danger : colors.rose} /></View><View style={styles.flex}><Text style={[styles.actionTitle, danger && { color: colors.danger }]}>{title}</Text><Text style={styles.actionDescription}>{description}</Text></View>{loading ? <ActivityIndicator color={colors.rose} /> : <Ionicons name="chevron-forward" size={19} color={colors.muted} />}</Pressable>; }
const styles = StyleSheet.create({page:{flex:1,backgroundColor:colors.background},center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:colors.background},errorState:{flex:1,alignItems:'center',justifyContent:'center',gap:spacing.md,padding:spacing.xl},errorTitle:{textAlign:'center',fontSize:20,fontWeight:'800',color:colors.ink},errorText:{maxWidth:340,textAlign:'center',fontSize:14,lineHeight:21,color:colors.muted},retryButton:{minWidth:130,minHeight:50,alignItems:'center',justifyContent:'center',borderRadius:radius.pill,backgroundColor:colors.rose},retryText:{fontWeight:'800',color:colors.surface},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.xl},header:{flexDirection:'row',alignItems:'center',gap:spacing.md},flex:{flex:1},iconButton:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},eyebrow:{fontSize:11,letterSpacing:1.8,fontWeight:'800',color:colors.rose},title:{marginTop:4,fontSize:27,lineHeight:34,fontWeight:'800',color:colors.ink},section:{gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},dangerSection:{borderColor:'#F0C8C8'},sectionTitle:{fontSize:18,fontWeight:'800',color:colors.ink},action:{flexDirection:'row',alignItems:'center',gap:spacing.md,paddingVertical:spacing.sm},actionIcon:{width:44,height:44,borderRadius:radius.md,alignItems:'center',justifyContent:'center',backgroundColor:colors.blush},actionTitle:{fontSize:15,fontWeight:'800',color:colors.ink},actionDescription:{marginTop:3,fontSize:12,lineHeight:17,color:colors.muted},familyCard:{padding:spacing.md,borderRadius:radius.md,backgroundColor:colors.blush},familyName:{fontSize:17,fontWeight:'800',color:colors.ink},roleText:{marginTop:4,fontSize:12,color:colors.muted},warning:{fontSize:13,lineHeight:20,color:colors.muted},label:{fontSize:13,fontWeight:'800',color:colors.danger},input:{minHeight:52,paddingHorizontal:spacing.md,borderRadius:radius.md,borderWidth:1,borderColor:'#E4B5B5',backgroundColor:colors.background,fontSize:16,fontWeight:'800',letterSpacing:1.5,color:colors.ink},passwordInput:{fontWeight:'400',letterSpacing:0},deleteButton:{minHeight:54,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm,borderRadius:radius.pill,backgroundColor:colors.danger},deleteText:{fontSize:15,fontWeight:'800',color:colors.surface},disabled:{opacity:.45}});
