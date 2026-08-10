import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import {
  cancelReminderNotifications,
  cancelStaleReminderNotifications,
  migrateLegacyReminderNotifications,
  scheduleReminderNotifications,
  type ReminderScheduleInput,
} from '@/features/reminders/notifications';
import { supabase } from '@/lib/supabase';
import { useMembership } from '@/providers/AuthGate';
import { useAuth } from '@/providers/AuthProvider';

type ReminderRow = {
  id: string;
  title: string;
  instructions: string | null;
  kind: 'medication' | 'appointment' | 'hydration' | 'nutrition' | 'custom';
  local_time: string;
  start_date: string;
  end_date: string | null;
  days_of_week: number[];
};

const ACTIVE_RECONCILIATION_INTERVAL_MS = 60_000;

export function ReminderScheduleSync() {
  const { session } = useAuth();
  const { onFamilyInvalidation } = useMembership();
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;
    const authenticatedUserId = userId;
    let running = false;
    let rerunRequested = false;
    let disposed = false;
    let reconciliationTimer: ReturnType<typeof setInterval> | null = null;

    async function sync() {
      if (disposed) return;
      if (running) {
        rerunRequested = true;
        return;
      }
      running = true;
      try {
        do {
          rerunRequested = false;
          await migrateLegacyReminderNotifications();
          const { data, error } = await supabase
            .from('reminders')
            .select('id,title,instructions,kind,local_time,start_date,end_date,days_of_week')
            .eq('is_active', true)
            .order('local_time');
          if (error || disposed) return;

          const reminders = (data ?? []) as ReminderRow[];
          const activeIds = new Set(reminders.map((reminder) => reminder.id));
          await cancelStaleReminderNotifications(authenticatedUserId, activeIds);
          if (disposed) return;
          for (const reminder of reminders) {
            if (disposed) return;
            const input: ReminderScheduleInput = {
              id: reminder.id,
              title: reminder.title,
              instructions: reminder.instructions,
              kind: reminder.kind,
              localTime: reminder.local_time,
              startDate: reminder.start_date,
              endDate: reminder.end_date,
              daysOfWeek: reminder.days_of_week,
            };
            await scheduleReminderNotifications(authenticatedUserId, input).catch(() => undefined);
            if (disposed) {
              await cancelReminderNotifications(authenticatedUserId, reminder.id);
              return;
            }
          }
        } while (rerunRequested && !disposed);
      } finally {
        running = false;
        if (rerunRequested && !disposed) void sync();
      }
    }

    function updateActiveReconciliation(state: AppStateStatus) {
      if (reconciliationTimer) {
        clearInterval(reconciliationTimer);
        reconciliationTimer = null;
      }
      if (state !== 'active' || disposed) return;
      void sync();
      reconciliationTimer = setInterval(() => {
        void sync();
      }, ACTIVE_RECONCILIATION_INTERVAL_MS);
    }

    updateActiveReconciliation(AppState.currentState);
    const appState = AppState.addEventListener('change', (state: AppStateStatus) => {
      updateActiveReconciliation(state);
    });
    const stopInvalidations = onFamilyInvalidation(
      ['reminders'],
      () => void sync(),
    );

    return () => {
      disposed = true;
      if (reconciliationTimer) clearInterval(reconciliationTimer);
      appState.remove();
      stopInvalidations();
    };
  }, [onFamilyInvalidation, userId]);

  return null;
}
