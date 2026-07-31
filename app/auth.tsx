import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-up');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || password.length < 6) {
      Alert.alert('A small check', 'Enter a valid email and a password with at least 6 characters.');
      return;
    }

    setBusy(true);
    const action = mode === 'sign-up'
      ? supabase.auth.signUp({ email: email.trim(), password })
      : supabase.auth.signInWithPassword({ email: email.trim(), password });
    const { error } = await action;
    setBusy(false);

    if (error) {
      Alert.alert('Could not continue', error.message);
      return;
    }

    if (mode === 'sign-up') {
      Alert.alert('Check your email', 'Open the confirmation email, then return to Janani and sign in.');
      setMode('sign-in');
      return;
    }

    router.replace('/onboarding');
  }

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <View style={styles.icon}><Ionicons name="heart" size={28} color={colors.rose} /></View>
        <Text style={styles.eyebrow}>WELCOME TO JANANI</Text>
        <Text style={styles.title}>{mode === 'sign-up' ? 'Let us begin gently.' : 'Welcome back, child.'}</Text>
        <Text style={styles.subtitle}>Your pregnancy journey and family moments remain private to your linked family.</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="Email address"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          autoCapitalize="none"
          secureTextEntry
          placeholder="Password"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
        <Pressable disabled={busy} onPress={submit} style={[styles.primary, busy && styles.disabled]}>
          <Text style={styles.primaryText}>{busy ? 'Please wait…' : mode === 'sign-up' ? 'Create my account' : 'Sign in'}</Text>
        </Pressable>
        <Pressable onPress={() => setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up')} style={styles.switchButton}>
          <Text style={styles.switchText}>{mode === 'sign-up' ? 'Already registered? Sign in' : 'New to Janani? Create an account'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.background, gap: spacing.xl },
  header: { gap: spacing.md },
  icon: { width: 60, height: 60, borderRadius: radius.lg, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 12, letterSpacing: 2.5, fontWeight: '800', color: colors.rose },
  title: { fontSize: typography.display, lineHeight: 42, fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: typography.body, lineHeight: 24, color: colors.muted },
  form: { gap: spacing.md },
  input: { minHeight: 56, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.lg, backgroundColor: colors.surface, color: colors.ink, fontSize: 16 },
  primary: { minHeight: 58, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.rose },
  primaryText: { color: colors.surface, fontSize: 17, fontWeight: '800' },
  disabled: { opacity: 0.6 },
  switchButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  switchText: { color: colors.roseDark, fontWeight: '700' },
});
