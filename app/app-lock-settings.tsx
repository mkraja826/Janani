import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  disableAppLock,
  readAppLockConfig,
  saveBiometricAppLock,
  savePinAppLock,
  type AppLockConfig,
} from '@/features/security/appLock';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

const timeoutOptions: Array<{ label: string; value: AppLockConfig['timeoutSeconds'] }> = [
  { label: 'Immediately', value: 0 },
  { label: 'After 1 minute', value: 60 },
  { label: 'After 5 minutes', value: 300 },
  { label: 'After 15 minutes', value: 900 },
];

export default function AppLockSettingsScreen() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [config, setConfig] = useState<AppLockConfig | null>(null);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [timeoutSeconds, setTimeoutSeconds] = useState<AppLockConfig['timeoutSeconds']>(60);

  const load = useCallback(async () => {
    if (!userId) return;
    const next = await readAppLockConfig(userId);
    setConfig(next);
    setTimeoutSeconds(next.timeoutSeconds);
  }, [userId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  function validatedPin() {
    if (!/^\d{6}$/.test(pin)) {
      Alert.alert('Use a 6-digit PIN', 'Enter exactly six numbers.');
      return null;
    }
    if (pin !== confirmPin) {
      Alert.alert('PINs do not match', 'Re-enter the same PIN in both fields.');
      return null;
    }
    return pin;
  }

  async function enablePin() {
    if (!userId) return;
    const nextPin = validatedPin();
    if (!nextPin) return;
    setBusy(true);
    try {
      const next = await savePinAppLock(userId, nextPin, timeoutSeconds);
      setConfig(next);
      setPin('');
      setConfirmPin('');
      Alert.alert('App Lock enabled', 'PregaLove will use your 6-digit PIN to protect this account on this device.');
    } catch (error) {
      Alert.alert('Could not enable App Lock', error instanceof Error ? error.message : 'Please try again.');
    } finally { setBusy(false); }
  }

  async function enableBiometrics() {
    if (!userId) return;
    const nextPin = validatedPin();
    if (!nextPin) return;
    setBusy(true);
    try {
      const next = await saveBiometricAppLock(userId, nextPin, timeoutSeconds);
      setConfig(next);
      setPin('');
      setConfirmPin('');
      Alert.alert('Biometric App Lock enabled', 'Use your device biometrics to unlock PregaLove. Your 6-digit PIN remains available as a fallback.');
    } catch {
      Alert.alert('Biometrics unavailable', 'PregaLove could not enable device authentication. Make sure fingerprint or face unlock is set up, or use PIN-only App Lock.');
    } finally { setBusy(false); }
  }

  function turnOff() {
    if (!userId) return;
    Alert.alert('Turn off App Lock?', 'PregaLove will no longer ask for a PIN or biometrics when reopening the app.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Turn off', style: 'destructive', onPress: async () => {
        setBusy(true);
        await disableAppLock(userId);
        setConfig({ mode: 'off', timeoutSeconds, pinHash: null });
        setBusy(false);
      } },
    ]);
  }

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable>
        <View style={styles.flex}><Text style={styles.eyebrow}>SECURITY</Text><Text style={styles.title}>App Lock</Text></View>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusIcon}><Ionicons name={config?.mode === 'off' ? 'lock-open-outline' : 'lock-closed-outline'} size={24} color={colors.roseDark} /></View>
        <View style={styles.flex}><Text style={styles.statusTitle}>{config?.mode === 'biometric' ? 'Biometrics + PIN' : config?.mode === 'pin' ? 'PIN lock enabled' : 'App Lock is off'}</Text><Text style={styles.statusText}>Protect pregnancy, journal, report and partner information on this device.</Text></View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lock after leaving PregaLove</Text>
        <View style={styles.optionWrap}>{timeoutOptions.map((option) => (
          <Pressable key={option.value} onPress={() => setTimeoutSeconds(option.value)} style={[styles.option, timeoutSeconds === option.value && styles.optionSelected]}>
            <Text style={[styles.optionText, timeoutSeconds === option.value && styles.optionTextSelected]}>{option.label}</Text>
          </Pressable>
        ))}</View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{config?.mode === 'off' ? 'Create your App Lock PIN' : 'Change App Lock PIN'}</Text>
        <Text style={styles.description}>Use six numbers you can remember. PregaLove stores only a protected verifier, not the PIN itself.</Text>
        <TextInput value={pin} onChangeText={(value) => setPin(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" secureTextEntry maxLength={6} placeholder="6-digit PIN" placeholderTextColor={colors.muted} style={styles.input} />
        <TextInput value={confirmPin} onChangeText={(value) => setConfirmPin(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" secureTextEntry maxLength={6} placeholder="Confirm PIN" placeholderTextColor={colors.muted} style={styles.input} />
        <Pressable disabled={busy} onPress={() => void enablePin()} style={[styles.primaryButton, busy && styles.disabled]}><Ionicons name="keypad-outline" size={21} color={colors.surface} /><Text style={styles.primaryText}>{config?.mode === 'off' ? 'Enable PIN lock' : 'Save PIN lock'}</Text></Pressable>
        <Pressable disabled={busy} onPress={() => void enableBiometrics()} style={[styles.secondaryButton, busy && styles.disabled]}><Ionicons name="finger-print-outline" size={22} color={colors.roseDark} /><Text style={styles.secondaryText}>Use biometrics + PIN fallback</Text></Pressable>
      </View>

      {config?.mode !== 'off' ? <Pressable disabled={busy} onPress={turnOff} style={styles.turnOffButton}><Text style={styles.turnOffText}>Turn off App Lock</Text></Pressable> : null}
      <Text style={styles.footnote}>Biometric authentication is handled by your phone. PregaLove does not receive or store fingerprint or face data.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page:{flex:1,padding:spacing.lg,gap:spacing.lg,backgroundColor:colors.background},
  header:{flexDirection:'row',alignItems:'center',gap:spacing.md},
  flex:{flex:1},
  iconButton:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},
  eyebrow:{fontSize:11,fontWeight:'900',letterSpacing:1.8,color:colors.rose},
  title:{marginTop:3,fontSize:27,fontWeight:'900',color:colors.ink},
  statusCard:{flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface},
  statusIcon:{width:48,height:48,borderRadius:radius.md,alignItems:'center',justifyContent:'center',backgroundColor:colors.rosePale},
  statusTitle:{fontSize:16,fontWeight:'900',color:colors.ink},
  statusText:{marginTop:3,fontSize:12,lineHeight:17,color:colors.muted},
  section:{gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface},
  sectionTitle:{fontSize:17,fontWeight:'900',color:colors.ink},
  description:{fontSize:12,lineHeight:18,color:colors.muted},
  optionWrap:{flexDirection:'row',flexWrap:'wrap',gap:spacing.sm},
  option:{paddingHorizontal:13,paddingVertical:10,borderRadius:radius.pill,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surfaceWarm},
  optionSelected:{borderColor:colors.rose,backgroundColor:colors.rosePale},
  optionText:{fontSize:12,fontWeight:'800',color:colors.muted},
  optionTextSelected:{color:colors.roseDark},
  input:{height:52,paddingHorizontal:spacing.md,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surfaceWarm,fontSize:17,fontWeight:'800',letterSpacing:3,color:colors.ink},
  primaryButton:{minHeight:52,borderRadius:radius.pill,flexDirection:'row',gap:spacing.sm,alignItems:'center',justifyContent:'center',backgroundColor:colors.roseDark},
  primaryText:{fontSize:14,fontWeight:'900',color:colors.surface},
  secondaryButton:{minHeight:52,borderRadius:radius.pill,flexDirection:'row',gap:spacing.sm,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.rose,backgroundColor:colors.rosePale},
  secondaryText:{fontSize:14,fontWeight:'900',color:colors.roseDark},
  disabled:{opacity:.45},
  turnOffButton:{alignSelf:'center',paddingHorizontal:spacing.lg,paddingVertical:spacing.sm},
  turnOffText:{fontSize:13,fontWeight:'900',color:colors.danger},
  footnote:{fontSize:11.5,lineHeight:17,textAlign:'center',color:colors.muted},
});
