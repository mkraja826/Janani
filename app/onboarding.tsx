import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cacheActivePregnancyId } from '@/features/pregnancy/activePregnancy';
import { tg } from '@/i18n/globalUi';
import { directionalIconName, rtlLayoutFor } from '@/i18n/rtl';
import { readGlobalUiLocale } from '@/i18n/uiLocale';
import { supabase } from '@/lib/supabase';
import { useMembership } from '@/providers/AuthGate';
import { PendingOfflineChangesError, useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type Role = 'mother' | 'partner';
type DateField = 'due' | 'lmp' | null;
const dateOnly = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;

export default function OnboardingScreen() {
  const params = useLocalSearchParams<{ role?: Role }>();
  const { session, signOut } = useAuth();
  const { markMembership } = useMembership();
  const intendedRole = params.role === 'partner' || session?.user.user_metadata?.intended_role === 'partner' ? 'partner' : 'mother';
  const [role, setRole] = useState<Role>(intendedRole);
  const [fullName, setFullName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [lmp, setLmp] = useState<Date | null>(null);
  const [dateField, setDateField] = useState<DateField>(null);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [locale, setLocale] = useState('en');
  const tr = (key: Parameters<typeof tg>[1]) => tg(locale, key);
  const rtl = useMemo(() => rtlLayoutFor(locale), [locale]);

  useEffect(() => { void readGlobalUiLocale().then(setLocale).catch(() => setLocale('en')); }, []);

  const helper = useMemo(() => role === 'mother' ? tr('onboardingMotherHelper') : tr('onboardingPartnerHelper'), [role, locale]);

  async function continueOnboarding() {
    const name = fullName.trim();
    const normalizedFamilyName = familyName.trim() || 'Our little family';
    const normalizedInviteCode = inviteCode.trim().toUpperCase();
    const heightCm = height.trim() ? Number(height) : null;
    const weightKg = weight.trim() ? Number(weight) : null;

    if (name.length < 2 || name.length > 80) return Alert.alert('Tell Janani your name', 'Enter a name between 2 and 80 characters.');
    if (role === 'mother' && !dueDate) return Alert.alert('Due date needed', 'Choose the expected due date.');
    if (role === 'mother' && normalizedFamilyName.length > 80) return Alert.alert('Family name is too long', 'Keep the family name within 80 characters.');
    if (role === 'mother' && lmp && dueDate && lmp > dueDate) return Alert.alert('Check the dates', 'The last menstrual period must be before the expected due date.');
    if (role === 'mother' && heightCm !== null && (!Number.isFinite(heightCm) || heightCm < 80 || heightCm > 250)) return Alert.alert('Check height', 'Enter a height between 80 and 250 cm, or leave it blank.');
    if (role === 'mother' && weightKg !== null && (!Number.isFinite(weightKg) || weightKg < 25 || weightKg > 300)) return Alert.alert('Check weight', 'Enter a weight between 25 and 300 kg, or leave it blank.');
    if (role === 'partner' && !/^[A-F0-9]{20}$/.test(normalizedInviteCode)) return Alert.alert('Invite code needed', 'Enter the 20-character code shared from the mother’s Janani app.');

    setBusy(true);
    try {
      const result = role === 'mother'
        ? await supabase.rpc('create_mother_family', { p_full_name: name, p_family_name: normalizedFamilyName, p_due_date: dateOnly(dueDate!), p_last_menstrual_period: lmp ? dateOnly(lmp) : null, p_height_cm: heightCm, p_pre_pregnancy_weight_kg: weightKg })
        : await supabase.rpc('join_family_as_partner', { p_full_name: name, p_invite_code: normalizedInviteCode });
      if (result.error) { Alert.alert('Could not complete setup', result.error.message); return; }
      const firstRow = Array.isArray(result.data) ? result.data[0] : result.data;
      const pregnancyId = firstRow && typeof firstRow === 'object' && 'pregnancy_id' in firstRow && typeof firstRow.pregnancy_id === 'string' ? firstRow.pregnancy_id : undefined;
      if (session && pregnancyId) await cacheActivePregnancyId(session.user.id, pregnancyId);
      const createdFamilyId = firstRow && typeof firstRow === 'object' && 'family_id' in firstRow && typeof firstRow.family_id === 'string' ? firstRow.family_id : undefined;
      await markMembership(true, createdFamilyId);
      const createdCode = role === 'mother' && firstRow && typeof firstRow === 'object' && 'invite_code' in firstRow && typeof firstRow.invite_code === 'string' ? firstRow.invite_code : undefined;
      if (createdCode) {
        Alert.alert(tr('familyReady'), `${tr('partnerInviteCode')}: ${createdCode}`, [{ text: tr('openJanani'), onPress: () => router.replace('/home') }]);
        return;
      }
      router.replace('/home');
    } catch { Alert.alert('Could not complete setup', 'Check your connection and try again.'); }
    finally { setBusy(false); }
  }

  async function performSignOut(discardPending = false) {
    setSigningOut(true);
    try { await signOut({ discardPending }); }
    catch (error) {
      if (error instanceof PendingOfflineChangesError) {
        Alert.alert('Unsynced changes', `${error.count} offline change${error.count === 1 ? '' : 's'} will be lost if you sign out now.`, [
          { text: 'Keep me signed in', style: 'cancel' },
          { text: 'Discard and sign out', style: 'destructive', onPress: () => void performSignOut(true) },
        ]);
      } else Alert.alert('Could not sign out', 'Check your connection and try again.');
    } finally { setSigningOut(false); }
  }

  function confirmAccountDeletion() {
    if (deleteText !== 'DELETE' || !currentPassword) { Alert.alert('Confirmation needed', 'Type DELETE exactly and enter your current password.'); return; }
    Alert.alert('Permanently delete account?', 'This permanently deletes your Janani account. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete permanently', style: 'destructive', onPress: () => void deleteAccount() },
    ]);
  }

  async function deleteAccount() {
    setDeletingAccount(true);
    const password = currentPassword;
    try {
      const { error } = await supabase.functions.invoke('delete-account', { body: { confirmation: 'DELETE', current_password: password } });
      if (error) { setCurrentPassword(''); Alert.alert('Could not delete account', error.message); return; }
      setCurrentPassword(''); setDeleteText('');
      await signOut({ discardPending: true }).catch(async () => { await supabase.auth.signOut({ scope: 'local' }); });
      router.replace('/');
    } catch { setCurrentPassword(''); Alert.alert('Could not delete account', 'Check your connection and try again.'); }
    finally { setDeletingAccount(false); }
  }

  const pickerValue = dateField === 'lmp' ? lmp ?? new Date() : dueDate ?? new Date(Date.now() + 120 * 86400000);
  return <SafeAreaView style={styles.safeArea}><KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={[styles.header, rtl.startAligned]}><Text style={[styles.eyebrow, rtl.startText]}>{tr('onboardingEyebrow')}</Text><Text style={[styles.title, rtl.startText]}>{role === 'mother' ? tr('onboardingMotherTitle') : tr('onboardingPartnerTitle')}</Text><Text style={[styles.subtitle, rtl.startText]}>{helper}</Text></View>
    <View style={[styles.roleRow, rtl.row]}><RoleCard selected={role === 'mother'} icon="woman-outline" label={tr('mother')} onPress={() => setRole('mother')} /><RoleCard selected={role === 'partner'} icon="people-outline" label={tr('partner')} onPress={() => setRole('partner')} /></View>
    <View style={styles.form}>
      <Field rtl={rtl.isRtl} label={tr('yourName')} value={fullName} onChangeText={setFullName} placeholder={tr('yourNamePlaceholder')} />
      {role === 'mother' ? <>
        <Field rtl={rtl.isRtl} label={tr('familyName')} value={familyName} onChangeText={setFamilyName} placeholder={tr('familyNamePlaceholder')} />
        <DateButton rtl={rtl.isRtl} label={tr('expectedDueDate')} value={dueDate} placeholder={tr('chooseDueDate')} onPress={() => setDateField('due')} />
        <DateButton rtl={rtl.isRtl} label={tr('lastMenstrualPeriod')} value={lmp} placeholder={tr('chooseDate')} onPress={() => setDateField('lmp')} />
        <View style={[styles.inlineFields, rtl.row]}><View style={styles.flex}><Field rtl={rtl.isRtl} label={tr('heightCm')} value={height} onChangeText={setHeight} placeholder="165" keyboardType="decimal-pad" /></View><View style={styles.flex}><Field rtl={rtl.isRtl} label={tr('weightKg')} value={weight} onChangeText={setWeight} placeholder="60" keyboardType="decimal-pad" /></View></View>
      </> : <Field rtl={rtl.isRtl} label={tr('familyInviteCode')} value={inviteCode} onChangeText={setInviteCode} placeholder={tr('inviteCodePlaceholder')} autoCapitalize="characters" autoCorrect={false} maxLength={20} />}
    </View>
    {dateField && <DateTimePicker value={pickerValue} mode="date" maximumDate={dateField === 'lmp' ? new Date() : undefined} minimumDate={dateField === 'due' ? new Date() : undefined} onChange={(_, value) => { if (Platform.OS === 'android') setDateField(null); if (!value) return; if (dateField === 'due') setDueDate(value); else setLmp(value); }} />}
    <Pressable disabled={busy || signingOut || deletingAccount} onPress={continueOnboarding} style={[styles.primary, rtl.row, (busy || signingOut || deletingAccount) && styles.disabled]}><Text style={styles.primaryText}>{busy ? tr('preparingSpace') : role === 'mother' ? tr('createFamilySpace') : tr('joinJourney')}</Text>{!busy && <Ionicons name={directionalIconName(locale, 'arrow-forward', 'arrow-back') as keyof typeof Ionicons.glyphMap} size={20} color={colors.surface} />}</Pressable>
    <View style={styles.accountActions}><Text style={[styles.accountHelp, rtl.text]}>{tr('notReadyYet')}</Text><Pressable disabled={busy || signingOut || deletingAccount} onPress={() => void performSignOut()} style={[styles.secondary, rtl.row, (busy || signingOut || deletingAccount) && styles.disabled]}><Ionicons name="log-out-outline" size={19} color={colors.roseDark} /><Text style={styles.secondaryText}>{signingOut ? tr('signingOut') : tr('signOut')}</Text></Pressable></View>
    <View style={deletionStyles.section}><Text style={[deletionStyles.title, rtl.startText]}>Delete this account</Text><Text style={[deletionStyles.help, rtl.startText]}>If you do not want to create or join a family, you can permanently remove this account now.</Text><TextInput autoCapitalize="characters" autoCorrect={false} placeholder="Type DELETE" placeholderTextColor={colors.muted} style={[deletionStyles.input, rtl.startText]} value={deleteText} onChangeText={setDeleteText} /><TextInput autoCapitalize="none" autoComplete="current-password" secureTextEntry placeholder="Current password" placeholderTextColor={colors.muted} style={[deletionStyles.input, rtl.startText]} value={currentPassword} onChangeText={setCurrentPassword} /><Pressable disabled={busy || signingOut || deletingAccount} onPress={confirmAccountDeletion} style={[deletionStyles.button, rtl.row, (busy || signingOut || deletingAccount) && styles.disabled]}><Ionicons name="trash-outline" size={18} color={colors.surface} /><Text style={deletionStyles.buttonText}>{deletingAccount ? 'Deleting account…' : 'Delete account permanently'}</Text></Pressable></View>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

function RoleCard({ selected, icon, label, onPress }: { selected: boolean; icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.roleCard, selected && styles.roleCardSelected]}><Ionicons name={icon} size={24} color={selected ? colors.rose : colors.muted} /><Text style={[styles.roleLabel, selected && styles.roleLabelSelected]}>{label}</Text></Pressable>; }
function Field(props: React.ComponentProps<typeof TextInput> & { label: string; rtl: boolean }) { const { label, rtl, ...inputProps } = props; const logical = { textAlign: rtl ? 'right' as const : 'left' as const, writingDirection: rtl ? 'rtl' as const : 'ltr' as const }; return <View style={styles.field}><Text style={[styles.label, logical]}>{label}</Text><TextInput {...inputProps} placeholderTextColor={colors.muted} style={[styles.input, logical]} /></View>; }
function DateButton({ label, value, placeholder, onPress, rtl }: { label: string; value: Date | null; placeholder: string; onPress: () => void; rtl: boolean }) { const logical = { textAlign: rtl ? 'right' as const : 'left' as const, writingDirection: rtl ? 'rtl' as const : 'ltr' as const }; return <View style={styles.field}><Text style={[styles.label, logical]}>{label}</Text><Pressable onPress={onPress} style={[styles.dateButton, { flexDirection: rtl ? 'row-reverse' : 'row' }]}><Text style={[value ? styles.dateValue : styles.datePlaceholder, logical]}>{value ? value.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' }) : placeholder}</Text><Ionicons name="calendar-outline" size={20} color={colors.rose} /></Pressable></View>; }

const styles = StyleSheet.create({safeArea:{flex:1,backgroundColor:colors.background},page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingTop:spacing.xl*1.5,paddingBottom:spacing.xl,gap:spacing.xl},header:{gap:spacing.md},eyebrow:{fontSize:12,letterSpacing:2.4,fontWeight:'800',color:colors.rose},title:{fontSize:typography.display,lineHeight:42,fontWeight:'800',color:colors.ink},subtitle:{fontSize:typography.body,lineHeight:24,color:colors.muted},roleRow:{flexDirection:'row',gap:spacing.md},roleCard:{flex:1,minHeight:92,borderRadius:radius.lg,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center',gap:spacing.sm},roleCardSelected:{borderColor:colors.rose,backgroundColor:colors.blush},roleLabel:{fontWeight:'700',color:colors.muted},roleLabelSelected:{color:colors.roseDark},form:{gap:spacing.md},field:{gap:spacing.sm},label:{fontSize:14,fontWeight:'700',color:colors.ink},input:{minHeight:54,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,paddingHorizontal:spacing.md,backgroundColor:colors.surface,color:colors.ink,fontSize:16},dateButton:{minHeight:54,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderWidth:1,borderColor:colors.border,borderRadius:radius.md,paddingHorizontal:spacing.md,backgroundColor:colors.surface},dateValue:{fontSize:16,color:colors.ink,flexShrink:1},datePlaceholder:{fontSize:16,color:colors.muted,flexShrink:1},inlineFields:{flexDirection:'row',gap:spacing.md},flex:{flex:1},primary:{minHeight:60,borderRadius:radius.pill,backgroundColor:colors.rose,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm},primaryText:{color:colors.surface,fontSize:17,fontWeight:'800'},disabled:{opacity:.6},accountActions:{alignItems:'center',gap:spacing.sm,paddingTop:spacing.md,borderTopWidth:1,borderTopColor:colors.border},accountHelp:{fontSize:13,textAlign:'center',color:colors.muted},secondary:{minHeight:48,minWidth:180,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm,borderRadius:radius.pill,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface},secondaryText:{fontWeight:'800',color:colors.roseDark}});
const deletionStyles = StyleSheet.create({section:{gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,borderWidth:1,borderColor:'#F0C8C8',backgroundColor:colors.surface},title:{fontSize:18,fontWeight:'800',color:colors.danger},help:{fontSize:13,lineHeight:20,color:colors.muted},input:{minHeight:52,paddingHorizontal:spacing.md,borderRadius:radius.md,borderWidth:1,borderColor:'#E4B5B5',backgroundColor:colors.background,fontSize:16,color:colors.ink},button:{minHeight:54,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm,borderRadius:radius.pill,backgroundColor:colors.danger},buttonText:{fontSize:15,fontWeight:'800',color:colors.surface}});
