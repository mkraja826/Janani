import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type Role = 'mother' | 'partner';
type DateField = 'due' | 'lmp' | null;
const dateOnly = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;

export default function OnboardingScreen() {
  const params = useLocalSearchParams<{ role?: Role }>();
  const [role, setRole] = useState<Role>(params.role === 'partner' ? 'partner' : 'mother');
  const [fullName, setFullName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [lmp, setLmp] = useState<Date | null>(null);
  const [dateField, setDateField] = useState<DateField>(null);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState(false);

  const helper = useMemo(() => role === 'mother'
    ? 'Create your private family space. Janani will give you a code to share with your partner.'
    : 'Enter the code shared by the mother to join the same private pregnancy journey.', [role]);

  async function continueOnboarding() {
    if (!fullName.trim()) return Alert.alert('Tell Janani your name', 'This helps the app speak to you warmly.');
    if (role === 'mother' && !dueDate) return Alert.alert('Due date needed', 'Choose the expected due date.');
    if (role === 'partner' && inviteCode.trim().length < 6) return Alert.alert('Invite code needed', 'Enter the code shared from the mother’s Janani app.');

    setBusy(true);
    const result = role === 'mother'
      ? await supabase.rpc('create_mother_family', {
          p_full_name: fullName.trim(), p_family_name: familyName.trim() || 'Our little family',
          p_due_date: dateOnly(dueDate!), p_last_menstrual_period: lmp ? dateOnly(lmp) : null,
          p_height_cm: height ? Number(height) : null, p_pre_pregnancy_weight_kg: weight ? Number(weight) : null,
        })
      : await supabase.rpc('join_family_as_partner', { p_full_name: fullName.trim(), p_invite_code: inviteCode.trim().toUpperCase() });
    setBusy(false);
    if (result.error) return Alert.alert('Could not complete setup', result.error.message);
    const createdCode = role === 'mother' ? result.data?.[0]?.invite_code : undefined;
    if (createdCode) return Alert.alert('Your family is ready', `Partner invite code: ${createdCode}`, [{ text: 'Open Janani', onPress: () => router.replace('/home') }]);
    router.replace('/home');
  }

  const pickerValue = dateField === 'lmp' ? lmp ?? new Date() : dueDate ?? new Date(Date.now() + 120 * 86400000);
  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}><Text style={styles.eyebrow}>YOUR SAFE FAMILY SPACE</Text><Text style={styles.title}>{role === 'mother' ? 'Let us prepare for your little one.' : 'Walk beside her, every day.'}</Text><Text style={styles.subtitle}>{helper}</Text></View>
      <View style={styles.roleRow}><RoleCard selected={role === 'mother'} icon="woman-outline" label="Mother" onPress={() => setRole('mother')} /><RoleCard selected={role === 'partner'} icon="people-outline" label="Partner" onPress={() => setRole('partner')} /></View>
      <View style={styles.form}>
        <Field label="Your name" value={fullName} onChangeText={setFullName} placeholder="How should Janani call you?" />
        {role === 'mother' ? <>
          <Field label="Family name" value={familyName} onChangeText={setFamilyName} placeholder="Our little family" />
          <DateButton label="Expected due date" value={dueDate} placeholder="Choose due date" onPress={() => setDateField('due')} />
          <DateButton label="Last menstrual period (optional)" value={lmp} placeholder="Choose date" onPress={() => setDateField('lmp')} />
          <View style={styles.inlineFields}><View style={styles.flex}><Field label="Height cm" value={height} onChangeText={setHeight} placeholder="165" keyboardType="decimal-pad" /></View><View style={styles.flex}><Field label="Weight kg" value={weight} onChangeText={setWeight} placeholder="60" keyboardType="decimal-pad" /></View></View>
        </> : <Field label="Family invite code" value={inviteCode} onChangeText={setInviteCode} placeholder="Example: A1B2C3D4" autoCapitalize="characters" />}
      </View>
      {dateField && <DateTimePicker value={pickerValue} mode="date" maximumDate={dateField === 'lmp' ? new Date() : undefined} minimumDate={dateField === 'due' ? new Date() : undefined} onChange={(_, value) => { if (Platform.OS === 'android') setDateField(null); if (!value) return; dateField === 'due' ? setDueDate(value) : setLmp(value); }} />}
      <Pressable disabled={busy} onPress={continueOnboarding} style={[styles.primary, busy && styles.disabled]}><Text style={styles.primaryText}>{busy ? 'Preparing your space…' : role === 'mother' ? 'Create our family space' : 'Join her journey'}</Text>{!busy && <Ionicons name="arrow-forward" size={20} color={colors.surface} />}</Pressable>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function RoleCard({ selected, icon, label, onPress }: { selected: boolean; icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.roleCard, selected && styles.roleCardSelected]}><Ionicons name={icon} size={24} color={selected ? colors.rose : colors.muted} /><Text style={[styles.roleLabel, selected && styles.roleLabelSelected]}>{label}</Text></Pressable>; }
function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) { const { label, ...inputProps } = props; return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...inputProps} placeholderTextColor={colors.muted} style={styles.input} /></View>; }
function DateButton({ label, value, placeholder, onPress }: { label: string; value: Date | null; placeholder: string; onPress: () => void }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><Pressable onPress={onPress} style={styles.dateButton}><Text style={value ? styles.dateValue : styles.datePlaceholder}>{value ? value.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' }) : placeholder}</Text><Ionicons name="calendar-outline" size={20} color={colors.rose} /></Pressable></View>; }

const styles = StyleSheet.create({page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingTop:spacing.xl*1.5,paddingBottom:spacing.xl,gap:spacing.xl},header:{gap:spacing.md},eyebrow:{fontSize:12,letterSpacing:2.4,fontWeight:'800',color:colors.rose},title:{fontSize:typography.display,lineHeight:42,fontWeight:'800',color:colors.ink},subtitle:{fontSize:typography.body,lineHeight:24,color:colors.muted},roleRow:{flexDirection:'row',gap:spacing.md},roleCard:{flex:1,minHeight:92,borderRadius:radius.lg,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center',gap:spacing.sm},roleCardSelected:{borderColor:colors.rose,backgroundColor:colors.blush},roleLabel:{fontWeight:'700',color:colors.muted},roleLabelSelected:{color:colors.roseDark},form:{gap:spacing.md},field:{gap:spacing.sm},label:{fontSize:14,fontWeight:'700',color:colors.ink},input:{minHeight:54,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,paddingHorizontal:spacing.md,backgroundColor:colors.surface,color:colors.ink,fontSize:16},dateButton:{minHeight:54,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderWidth:1,borderColor:colors.border,borderRadius:radius.md,paddingHorizontal:spacing.md,backgroundColor:colors.surface},dateValue:{fontSize:16,color:colors.ink},datePlaceholder:{fontSize:16,color:colors.muted},inlineFields:{flexDirection:'row',gap:spacing.md},flex:{flex:1},primary:{minHeight:60,borderRadius:radius.pill,backgroundColor:colors.rose,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm},primaryText:{color:colors.surface,fontSize:17,fontWeight:'800'},disabled:{opacity:.6}});
