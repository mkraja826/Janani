import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { colors, radius, spacing, typography } from '@/theme/tokens';

function authParamsFromUrl(url: string) {
  const [beforeHash, hash = ''] = url.split('#', 2);
  const query = beforeHash.includes('?') ? beforeHash.split('?', 2)[1] : '';
  return new URLSearchParams([query, hash].filter(Boolean).join('&'));
}

export default function AuthCallbackScreen() {
  const [message, setMessage] = useState('Confirming your email…');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    async function finishAuthentication(url: string | null) {
      try {
        if (url) {
          const params = authParamsFromUrl(url);
          const authError = params.get('error_description') || params.get('error');
          if (authError) throw new Error(decodeURIComponent(authError.replace(/\+/g, ' ')));

          const code = params.get('code');
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) throw error;
          } else if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) throw error;
          }
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const session = data.session;

        if (!session) {
          if (!active) return;
          setMessage('Your email is confirmed. Please sign in to continue.');
          setFailed(true);
          return;
        }

        const { data: membership, error: membershipError } = await supabase
          .from('family_members')
          .select('family_id')
          .eq('user_id', session.user.id)
          .maybeSingle();
        if (membershipError) throw membershipError;
        if (!active) return;

        if (membership) {
          router.replace('/home');
          return;
        }

        const role = session.user.user_metadata?.intended_role === 'partner' ? 'partner' : 'mother';
        router.replace({ pathname: '/onboarding', params: { role } });
      } catch (error) {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : 'Janani could not finish email confirmation.');
        setFailed(true);
      }
    }

    void Linking.getInitialURL().then(finishAuthentication);
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void finishAuthentication(url);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        {!failed && <ActivityIndicator size="large" color={colors.rose} />}
        <Text style={styles.title}>{failed ? 'Email confirmed' : 'One gentle moment'}</Text>
        <Text style={styles.message}>{message}</Text>
        {failed && (
          <Pressable onPress={() => router.replace('/auth')} style={styles.button}>
            <Text style={styles.buttonText}>Continue to sign in</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.ink,
  },
  message: {
    maxWidth: 340,
    fontSize: typography.body,
    lineHeight: 24,
    textAlign: 'center',
    color: colors.muted,
  },
  button: {
    minHeight: 54,
    minWidth: 190,
    marginTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.rose,
  },
  buttonText: {
    fontWeight: '800',
    color: colors.surface,
  },
});
