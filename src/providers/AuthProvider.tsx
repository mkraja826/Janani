import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import {
  registerDevicePushToken,
  unregisterDevicePushToken,
} from '@/features/notifications/pushRegistration';
import { cancelAllUserReminderNotifications } from '@/features/reminders/notifications';
import { clearPrivateWidgetContent } from '@/features/widget/widgetState';
import { clearUnscopedLegacyCaches, clearUserCache } from '@/lib/cache';
import {
  clearUserOfflineQueue,
  getOfflineQueueStatus,
  migrateLegacyOfflineQueue,
} from '@/lib/offlineQueue';
import { supabase } from '@/lib/supabase';

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  signOut: (options?: { discardPending?: boolean }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export class PendingOfflineChangesError extends Error {
  constructor(public readonly count: number) {
    super(`${count} offline change${count === 1 ? '' : 's'} still need to sync.`);
    this.name = 'PendingOfflineChangesError';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const previousUserId = useRef<string | null>(null);
  const userId = session?.user.id;

  useEffect(() => {
    let mounted = true;
    let authRevision = 0;
    void clearUnscopedLegacyCaches();

    async function applySession(nextSession: Session | null, revision: number) {
      if (nextSession) {
        // v1 was unscoped, so wait until Auth identifies its owner before moving it.
        await migrateLegacyOfflineQueue(nextSession.user.id).catch(() => undefined);
      }
      if (!mounted || revision !== authRevision) return;
      setSession(nextSession);
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted || authRevision !== 0) return;
      authRevision += 1;
      void applySession(data.session, authRevision);
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      authRevision += 1;
      void applySession(nextSession, authRevision);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const currentUserId = userId ?? null;
    const priorUserId = previousUserId.current;
    previousUserId.current = currentUserId;
    if (priorUserId === currentUserId) return;
    if (!priorUserId && currentUserId) {
      void registerDevicePushToken(currentUserId).catch(() => undefined);
      return;
    }
    if (!priorUserId) return;
    void (async () => {
      await unregisterDevicePushToken(priorUserId).catch(() => undefined);
      await Promise.allSettled([
        cancelAllUserReminderNotifications(priorUserId),
        clearUserCache(priorUserId),
      clearPrivateWidgetContent(),
      ]);
      if (currentUserId) {
        await registerDevicePushToken(currentUserId).catch(() => undefined);
      }
    })();
  }, [userId]);

  useEffect(() => {
    if (AppState.currentState === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    return () => {
      subscription.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      signOut: async (options) => {
        const userId = session?.user.id;
        if (userId) {
          if (!options?.discardPending) {
            const queue = await getOfflineQueueStatus(userId);
            if (queue.count > 0) {
              throw new PendingOfflineChangesError(queue.count);
            }
          }
          await unregisterDevicePushToken(userId).catch(() => undefined);
          await Promise.allSettled([
            cancelAllUserReminderNotifications(userId),
            clearUserCache(userId),
            clearUserOfflineQueue(userId),
            clearPrivateWidgetContent(),
          ]);
        }
        const { error } = await supabase.auth.signOut();
        if (error) {
          const local = await supabase.auth.signOut({ scope: 'local' });
          if (local.error) throw local.error;
        }
      },
    }),
    [loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
