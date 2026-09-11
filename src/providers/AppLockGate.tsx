import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  authenticateWithBiometrics,
  readAppLockConfig,
  type AppLockConfig,
  verifyAppLockPin,
} from '@/features/security/appLock';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

export function AppLockGate({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [config, setConfig] = useState<AppLockConfig | null>(null);
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const backgroundAt = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    setConfig(null);
    setPin('');
    setError(null);
    if (!userId) {
      setLocked(false);
      return () => { active = false; };
    }
    void readAppLockConfig(userId).then((next) => {
      if (!active) return;
      setConfig(next);
      setLocked(next.mode !== 'off');
    });
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (!config || config.mode === 'off') return;
      if (state !== 'active') {
        backgroundAt.current = Date.now();
        return;
      }
      const leftAt = backgroundAt.current;
      backgroundAt.current = null;
      if (leftAt === null) return;
      if (config.timeoutSeconds === 0 || Date.now() - leftAt >= config.timeoutSeconds * 1000) {
        setPin('');
        setError(null);
        setLocked(true);
      }
    });
    return () => subscription.remove();
  }, [config]);

  function unlockWithPin() {
    if (!userId || !config) return;
    if (verifyAppLockPin(userId, pin, config)) {
      setPin('');
      setError(null);
      setLocked(false);
      return;
    }
    setError('That PIN is not correct.');
  }

  async function unlockWithBiometrics() {
    if (!userId || !config || config.mode !== 'biometric') return;
    setBiometricBusy(true);
    setError(null);
    const ok = await authenticateWithBiometrics(userId);
    setBiometricBusy(false);
    if (ok) {
      setLocked(false);
      return;
    }
    setError('Biometric unlock was not completed. Use your PIN instead.');
  }

  if (!session || !config || config.mode === 'off' || !locked) return children;

  return (
    <View style={styles.page}>
      <View style={styles.iconWrap}><Ionicons name="lock-closed" size={30} color={colors.roseDark} /></View>
      <Text style={styles.eyebrow}>PREGALOVE APP LOCK</Text>
      <Text style={styles.title}>Unlock PregaLove</Text>
      <Text style={styles.description}>Your pregnancy and family information stays hidden until you unlock the app.</Text>

      {config.mode === 'biometric' ? (
        <Pressable disabled={biometricBusy} onPress={() => void unlockWithBiometrics()} style={styles.biometricButton}>
          <Ionicons name="finger-print-outline" size={22} color={colors.surface} />
          <Text style={styles.biometricText}>{biometricBusy ? 'Checking…' : 'Use biometrics'}</Text>
        </Pressable>
      ) : null}

      <View style={styles.pinCard}>
        <Text style={styles.pinLabel}>{config.mode === 'biometric' ? 'Or use your 6-digit PIN' : 'Enter your 6-digit PIN'}</Text>
        <TextInput
          value={pin}
          onChangeText={(value) => { setPin(value.replace(/\D/g, '').slice(0, 6)); setError(null); }}
          onSubmitEditing={unlockWithPin}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          textContentType="oneTimeCode"
          placeholder="••••••"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable disabled={pin.length !== 6} onPress={unlockWithPin} style={[styles.unlockButton, pin.length !== 6 && styles.disabled]}>
          <Text style={styles.unlockText}>Unlock</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page:{flex:1,alignItems:'center',justifyContent:'center',padding:spacing.xl,backgroundColor:colors.background},
  iconWrap:{width:68,height:68,borderRadius:34,alignItems:'center',justifyContent:'center',backgroundColor:colors.rosePale,borderWidth:1,borderColor:colors.border},
  eyebrow:{marginTop:spacing.lg,fontSize:11,fontWeight:'900',letterSpacing:1.8,color:colors.rose},
  title:{marginTop:6,fontSize:28,lineHeight:34,fontWeight:'900',textAlign:'center',color:colors.ink},
  description:{maxWidth:360,marginTop:spacing.sm,fontSize:14,lineHeight:21,textAlign:'center',color:colors.muted},
  biometricButton:{width:'100%',maxWidth:360,minHeight:54,marginTop:spacing.xl,borderRadius:radius.pill,flexDirection:'row',gap:spacing.sm,alignItems:'center',justifyContent:'center',backgroundColor:colors.roseDark},
  biometricText:{fontSize:15,fontWeight:'900',color:colors.surface},
  pinCard:{width:'100%',maxWidth:360,marginTop:spacing.lg,padding:spacing.lg,borderRadius:radius.lg,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface},
  pinLabel:{fontSize:13,fontWeight:'800',textAlign:'center',color:colors.ink},
  input:{height:58,marginTop:spacing.md,paddingHorizontal:spacing.lg,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surfaceWarm,fontSize:24,fontWeight:'900',letterSpacing:8,textAlign:'center',color:colors.ink},
  error:{marginTop:spacing.sm,fontSize:12,lineHeight:17,textAlign:'center',color:colors.danger},
  unlockButton:{minHeight:50,marginTop:spacing.md,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.rose},
  disabled:{opacity:.45},
  unlockText:{fontSize:15,fontWeight:'900',color:colors.surface},
});
