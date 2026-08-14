import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { tg } from '@/i18n/globalUi';
import { rtlLayoutFor } from '@/i18n/rtl';
import { readGlobalUiLocale } from '@/i18n/uiLocale';
import { supabase } from '@/lib/supabase';
import { useMembership } from '@/providers/AuthGate';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const EMAIL_CONFIRMATION_REDIRECT = 'janani://auth/callback';
const AUTH_REQUEST_TIMEOUT_MS = 20_000;

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs = AUTH_REQUEST_TIMEOUT_MS): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('AUTH_REQUEST_TIMEOUT'));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export default function AuthScreen() {
  const params = useLocalSearchParams<{ role?: 'mother' | 'partner' }>();
  const { markMembership } = useMembership();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-up');
  const [busy, setBusy] = useState(false);
  const [locale, setLocale] = useState('en');
  const tr = (key: Parameters<typeof tg>[1]) => tg(locale, key);
  const rtl = useMemo(() => rtlLayoutFor(locale), [locale]);

  useEffect(() => { void readGlobalUiLocale().then(setLocale).catch(() => setLocale('en')); }, []);

  async function submit() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || !password) {
      Alert.alert('A small check', 'Enter a valid email and password.');
      return;
    }
    if (mode === 'sign-up' && (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password))) {
      Alert.alert('Choose a stronger password', 'Use at least 8 characters with both a letter and a number.');
      return;
    }

    setBusy(true);
    try {
      const action = mode === 'sign-up'
        ? supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              data: { intended_role: params.role === 'partner' ? 'partner' : 'mother' },
              emailRedirectTo: EMAIL_CONFIRMATION_REDIRECT,
            },
          })
        : supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      const { data, error } = await withTimeout(action);

      if (error) { Alert.alert('Could not continue', error.message); return; }
      if (mode === 'sign-up' && !data.session) {
        Alert.alert('Check your email', 'Open the confirmation email. Janani will finish signing you in after you confirm your address.');
        setMode('sign-in');
        return;
      }

      const user = data.user;
      if (!user) { Alert.alert('Could not continue', 'Janani could not verify this account. Please sign in again.'); return; }
      const { data: membership, error: membershipError } = await withTimeout(
        supabase
          .from('family_members')
          .select('family_id')
          .eq('user_id', user.id)
          .maybeSingle(),
      );
      if (membershipError) { Alert.alert('Could not verify your family', 'Check your connection and try again.'); return; }
      if (membership) {
        await markMembership(true, membership.family_id);
        router.replace('/home');
        return;
      }
      await markMembership(false);
      const role = params.role === 'partner' || user.user_metadata?.intended_role === 'partner' ? 'partner' : 'mother';
      router.replace({ pathname: '/onboarding', params: { role } });
    } catch (error) {
      if (error instanceof Error && error.message === 'AUTH_REQUEST_TIMEOUT') {
        Alert.alert('Connection timed out', 'Janani could not reach the sign-in service. Check your internet connection and try again.');
        return;
      }
      Alert.alert('Could not continue', error instanceof Error ? error.message : 'Something went wrong while signing in. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return <SafeAreaView style={styles.safeArea}>
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, rtl.startAligned]}>
        <View style={styles.icon}><Ionicons name="heart" size={28} color={colors.rose} /></View>
        <Text style={[styles.eyebrow, rtl.startText]}>{tr('authWelcome')}</Text>
        <Text style={[styles.title, rtl.startText]}>{mode === 'sign-up' ? tr('authCreateTitle') : tr('authSignInTitle')}</Text>
        <Text style={[styles.subtitle, rtl.startText]}>{tr('authSubtitle')}</Text>
      </View>
      <View style={styles.form}>
        <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder={tr('emailAddress')} placeholderTextColor={colors.muted} style={[styles.input, rtl.startText]} value={email} onChangeText={setEmail} />
        <TextInput autoCapitalize="none" autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'} secureTextEntry placeholder={tr('password')} placeholderTextColor={colors.muted} style={[styles.input, rtl.startText]} value={password} onChangeText={setPassword} />
        <Pressable disabled={busy} onPress={submit} style={[styles.primary, busy && styles.disabled]}><Text style={styles.primaryText}>{busy ? tr('pleaseWait') : mode === 'sign-up' ? tr('createAccount') : tr('signIn')}</Text></Pressable>
        <Pressable onPress={() => setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up')} style={styles.switchButton}><Text style={[styles.switchText, rtl.text]}>{mode === 'sign-up' ? tr('alreadyRegistered') : tr('newToJanani')}</Text></Pressable>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({safeArea:{flex:1,backgroundColor:colors.background},page:{flex:1,justifyContent:'center',padding:spacing.lg,backgroundColor:colors.background,gap:spacing.xl},header:{gap:spacing.md},icon:{width:60,height:60,borderRadius:radius.lg,backgroundColor:colors.blush,alignItems:'center',justifyContent:'center'},eyebrow:{fontSize:12,letterSpacing:2.5,fontWeight:'800',color:colors.rose},title:{fontSize:typography.display,lineHeight:42,fontWeight:'800',color:colors.ink},subtitle:{fontSize:typography.body,lineHeight:24,color:colors.muted},form:{gap:spacing.md},input:{minHeight:56,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,paddingHorizontal:spacing.lg,backgroundColor:colors.surface,color:colors.ink,fontSize:16},primary:{minHeight:58,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.rose},primaryText:{color:colors.surface,fontSize:17,fontWeight:'800'},disabled:{opacity:.6},switchButton:{minHeight:44,alignItems:'center',justifyContent:'center'},switchText:{color:colors.roseDark,fontWeight:'700'}});
