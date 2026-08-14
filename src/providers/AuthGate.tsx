import { Redirect, usePathname } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  type FamilyInvalidationEntity,
  subscribeToFamilyInvalidations,
} from '@/features/family/familyInvalidation';
import { cancelAllUserReminderNotifications } from '@/features/reminders/notifications';
import { clearPrivateWidgetContent } from '@/features/widget/widgetState';
import { clearUserCache, readCache, writeCache } from '@/lib/cache';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

const MEMBERSHIP_CACHE_KEY = 'has-family-membership-v1';

type MembershipState = 'loading' | 'member' | 'none' | 'error';
type MembershipCache = boolean | { familyId: string };
type InvalidationListener = {
  entities: ReadonlySet<FamilyInvalidationEntity>;
  callback: (entity: FamilyInvalidationEntity) => void;
};

type MembershipContextValue = {
  familyId: string | null;
  membership: MembershipState;
  refreshMembership: () => Promise<boolean | null>;
  markMembership: (exists: boolean, familyId?: string) => Promise<void>;
  onFamilyInvalidation: (
    entities: readonly FamilyInvalidationEntity[],
    callback: (entity: FamilyInvalidationEntity) => void,
  ) => () => void;
};

const MembershipContext = createContext<MembershipContextValue | null>(null);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const pathname = usePathname();
  const [membership, setMembership] = useState<MembershipState>('loading');
  const [membershipUserId, setMembershipUserId] = useState<string | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const requestVersion = useRef(0);
  const membershipOwner = useRef<string | null>(null);
  const confirmedFamilyId = useRef<string | null>(null);
  const invalidationListeners = useRef(new Set<InvalidationListener>());
  const userId = session?.user.id;

  const refreshMembership = useCallback(async (): Promise<boolean | null> => {
    const resolvedUserId = userId;
    const version = ++requestVersion.current;
    if (!resolvedUserId) {
      membershipOwner.current = null;
      confirmedFamilyId.current = null;
      setMembership('loading');
      setMembershipUserId(null);
      setFamilyId(null);
      return null;
    }
    const previousFamilyId = membershipOwner.current === resolvedUserId
      ? confirmedFamilyId.current
      : null;
    if (membershipOwner.current !== resolvedUserId) {
      confirmedFamilyId.current = null;
      setMembership('loading');
      setFamilyId(null);
    }
    membershipOwner.current = resolvedUserId;
    setMembershipUserId(resolvedUserId);

    const cached = await readCache<MembershipCache>(resolvedUserId, MEMBERSHIP_CACHE_KEY);
    if (version !== requestVersion.current) return null;
    const cachedFamilyId = cached && typeof cached === 'object' && typeof cached.familyId === 'string'
      ? cached.familyId
      : null;
    if (cachedFamilyId) {
      confirmedFamilyId.current = cachedFamilyId;
      setMembership('member');
      setFamilyId(cachedFamilyId);
    } else if (cached === false) {
      confirmedFamilyId.current = null;
      setMembership('none');
      setFamilyId(null);
    } else {
      setMembership('loading');
      setFamilyId(null);
    }

    const { data, error } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', resolvedUserId)
      .maybeSingle();
    if (version !== requestVersion.current) return null;
    if (error) {
      setMembership(cachedFamilyId ? 'member' : cached === false ? 'none' : 'error');
      return null;
    }

    const exists = Boolean(data);
    const nextFamilyId = data?.family_id ?? null;
    const priorFamilyId = cachedFamilyId ?? previousFamilyId;
    const familyChanged = Boolean(
      priorFamilyId
      && nextFamilyId
      && priorFamilyId !== nextFamilyId,
    );
    // Keep privacy cleanup retryable. Native notification/widget cleanup is
    // best-effort, so repeat it on every authoritative membershipless check
    // instead of treating a cached `false` value as proof that cleanup finished.
    const confirmedLoss = !exists;
    if (confirmedLoss || familyChanged) {
      setMembership(exists ? 'loading' : 'none');
      setFamilyId(null);
      await Promise.allSettled([
        clearUserCache(resolvedUserId),
        cancelAllUserReminderNotifications(resolvedUserId),
        clearPrivateWidgetContent(),
      ]);
      if (version !== requestVersion.current) return null;
    } else if (cached === true) {
      await clearUserCache(resolvedUserId);
    }
    setMembership(exists ? 'member' : 'none');
    setFamilyId(nextFamilyId);
    confirmedFamilyId.current = nextFamilyId;
    await writeCache(
      resolvedUserId,
      MEMBERSHIP_CACHE_KEY,
      nextFamilyId ? { familyId: nextFamilyId } : false,
    );
    return exists;
  }, [userId]);

  const markMembership = useCallback(async (exists: boolean, nextFamilyId?: string) => {
    if (!userId) return;
    requestVersion.current += 1;
    membershipOwner.current = userId;
    setMembershipUserId(userId);
    const familyChanged = Boolean(
      familyId
      && nextFamilyId
      && familyId !== nextFamilyId,
    );
    if (!exists || familyChanged) {
      setMembership(exists ? 'loading' : 'none');
      setFamilyId(null);
      await Promise.allSettled([
        clearUserCache(userId),
        cancelAllUserReminderNotifications(userId),
        clearPrivateWidgetContent(),
      ]);
    }
    setMembership(exists ? 'member' : 'none');
    setFamilyId(exists ? nextFamilyId ?? familyId : null);
    confirmedFamilyId.current = exists ? nextFamilyId ?? familyId : null;
    await writeCache(
      userId,
      MEMBERSHIP_CACHE_KEY,
      exists && nextFamilyId ? { familyId: nextFamilyId } : exists,
    );
  }, [familyId, userId]);

  const onFamilyInvalidation = useCallback((
    entities: readonly FamilyInvalidationEntity[],
    callback: (entity: FamilyInvalidationEntity) => void,
  ) => {
    const listener: InvalidationListener = {
      entities: new Set(entities),
      callback,
    };
    invalidationListeners.current.add(listener);
    return () => {
      invalidationListeners.current.delete(listener);
    };
  }, []);

  useEffect(() => {
    void refreshMembership();
    return () => {
      requestVersion.current += 1;
    };
  }, [refreshMembership]);

  useEffect(() => {
    let reconciliationTimer: ReturnType<typeof setInterval> | null = null;
    let reconciling = false;

    async function reconcile() {
      if (!userId || reconciling) return;
      reconciling = true;
      try {
        await refreshMembership();
      } finally {
        reconciling = false;
      }
    }

    function updateReconciliation(state: string) {
      if (reconciliationTimer) {
        clearInterval(reconciliationTimer);
        reconciliationTimer = null;
      }
      if (state !== 'active' || !userId) return;
      reconciliationTimer = setInterval(() => {
        void reconcile();
      }, 60_000);
    }

    updateReconciliation(AppState.currentState);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void reconcile();
      updateReconciliation(state);
    });
    return () => {
      if (reconciliationTimer) clearInterval(reconciliationTimer);
      subscription.remove();
    };
  }, [refreshMembership, userId]);

  useEffect(() => {
    const accessToken = session?.access_token;
    const activeFamilyId = membershipUserId === userId ? familyId : null;
    if (!accessToken) {
      // Return Realtime to Supabase's session callback so an explicit JWT never
      // remains pinned after sign-out.
      void supabase.realtime.setAuth().catch(() => undefined);
      return;
    }
    if (!activeFamilyId) return;
    let issueRefreshTimer: ReturnType<typeof setTimeout> | null = null;
    let lastIssueRefreshAt = 0;
    const stopInvalidations = subscribeToFamilyInvalidations({
      familyId: activeFamilyId,
      accessToken,
      onInvalidate: (entity) => {
        for (const listener of invalidationListeners.current) {
          if (listener.entities.has(entity)) listener.callback(entity);
        }
      },
      onConnectionIssue: () => {
        if (issueRefreshTimer) return;
        const cooldownRemaining = Math.max(
          0,
          15_000 - (Date.now() - lastIssueRefreshAt),
        );
        issueRefreshTimer = setTimeout(() => {
          issueRefreshTimer = null;
          lastIssueRefreshAt = Date.now();
          void refreshMembership();
        }, Math.max(500, cooldownRemaining));
      },
    });
    return () => {
      if (issueRefreshTimer) clearTimeout(issueRefreshTimer);
      stopInvalidations();
    };
  }, [familyId, membershipUserId, refreshMembership, session?.access_token, userId]);

  useEffect(() => onFamilyInvalidation(
    ['family_members', 'families'],
    () => {
      void refreshMembership();
    },
  ), [onFamilyInvalidation, refreshMembership]);

  const currentMembership = membershipUserId === userId ? membership : 'loading';
  const currentFamilyId = membershipUserId === userId ? familyId : null;
  const context = useMemo<MembershipContextValue>(() => ({
    familyId: currentFamilyId,
    membership: currentMembership,
    refreshMembership,
    markMembership,
    onFamilyInvalidation,
  }), [currentFamilyId, currentMembership, markMembership, onFamilyInvalidation, refreshMembership]);

  let content = children;
  if (loading) {
    content = <LoadingGate />;
  } else {
    const publicPath = pathname === '/' || pathname === '/auth' || pathname === '/auth/callback';
    if (!session) {
      if (!publicPath) content = <Redirect href="/auth" />;
    } else if (!publicPath && currentMembership === 'loading') {
      content = <LoadingGate />;
    } else if (!publicPath && currentMembership === 'error') {
      content = <MembershipErrorGate onRetry={refreshMembership} />;
    } else if (currentMembership === 'none' && pathname !== '/' && pathname !== '/onboarding') {
      content = <Redirect href="/onboarding" />;
    } else if (currentMembership === 'member' && (pathname === '/auth' || pathname === '/onboarding')) {
      content = <Redirect href="/home" />;
    }
  }

  return <MembershipContext.Provider value={context}>{content}</MembershipContext.Provider>;
}

export function useMembership() {
  const context = useContext(MembershipContext);
  if (!context) throw new Error('useMembership must be used inside AuthGate');
  return context;
}

function LoadingGate() {
  return <View style={styles.loading}><ActivityIndicator color={colors.rose} /></View>;
}

function MembershipErrorGate({ onRetry }: { onRetry: () => Promise<boolean | null> }) {
  const [retrying, setRetrying] = useState(false);
  async function retry() {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  }
  return (
    <View style={styles.loading}>
      <Text style={styles.errorTitle}>Janani could not verify your family</Text>
      <Text style={styles.errorText}>Check your connection and try again. Your saved data has not been removed.</Text>
      <Pressable disabled={retrying} onPress={() => void retry()} style={styles.retryButton}>
        {retrying
          ? <ActivityIndicator color={colors.surface} />
          : <Text style={styles.retryText}>Try again</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorTitle: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
  },
  errorText: {
    maxWidth: 340,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
  },
  retryButton: {
    minWidth: 130,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.rose,
  },
  retryText: {
    fontWeight: '800',
    color: colors.surface,
  },
});
