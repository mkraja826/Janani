import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { getPregnancyProgress } from '@/features/pregnancy/progress';
import {
  canUpdateNativeWidget,
  clearPrivateWidgetContent,
  updateNativeWidget,
} from '@/features/widget/widgetState';
import { toLocalDate } from '@/lib/date';
import { supabase } from '@/lib/supabase';
import { useMembership } from '@/providers/AuthGate';
import { useAuth } from '@/providers/AuthProvider';

export function WidgetSync() {
  const { session } = useAuth();
  const { familyId, onFamilyInvalidation } = useMembership();
  const syncGeneration = useRef(0);

  useEffect(() => {
    const generation = ++syncGeneration.current;
    if (!session) {
      void clearPrivateWidgetContent();
      return;
    }
    if (!familyId || !canUpdateNativeWidget()) return;

    const userId = session.user.id;
    let disposed = false;
    let running = false;
    let rerunRequested = false;
    const isCurrent = () => !disposed && syncGeneration.current === generation;

    async function performSync() {
      const membership = await supabase
        .from('family_members')
        .select('role,families(name,pregnancies(due_date,status))')
        .eq('user_id', userId)
        .maybeSingle();
      if (!isCurrent()) return;

      const family = Array.isArray(membership.data?.families)
        ? membership.data?.families[0]
        : membership.data?.families;
      const pregnancies = family?.pregnancies;
      const pregnancyList = Array.isArray(pregnancies) ? pregnancies : pregnancies ? [pregnancies] : [];
      const pregnancy = pregnancyList.find((item) => item.status === 'active') ?? pregnancyList[0];
      const progress = pregnancy?.due_date ? getPregnancyProgress(pregnancy.due_date) : null;

      const date = toLocalDate();
      const reminders = await supabase
        .from('reminders')
        .select('id,local_time,days_of_week')
        .eq('is_active', true)
        .lte('start_date', date)
        .or(`end_date.is.null,end_date.gte.${date}`)
        .order('local_time')
        .limit(50);
      if (!isCurrent()) return;
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const nextReminder = reminders.data?.find((item) => (
        (item.days_of_week.length === 0 || item.days_of_week.includes(now.getDay()))
        && item.local_time.slice(0, 5) >= currentTime
      ));
      const nudge = await supabase
        .from('partner_nudges')
        .select('id')
        .neq('sender_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!isCurrent()) return;

      await updateNativeWidget({
        week_label: progress ? `Week ${progress.gestationalWeek} · ${progress.gestationalDay} days` : 'Janani',
        family_label: family?.name ?? 'Our little family',
        next_reminder: nextReminder
          ? `Care reminder around ${nextReminder.local_time.slice(0, 5)}`
          : 'Open Janani for upcoming reminders',
        partner_message: nudge.data ? 'A private partner message is waiting' : 'Send a little warmth',
      });
    }

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
          await performSync();
        } while (rerunRequested && !disposed);
      } catch {
        // A later foreground or Realtime event will retry without exposing private data.
      } finally {
        running = false;
        if (rerunRequested && !disposed) void sync();
      }
    }

    void sync();
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void sync();
    });
    const stopInvalidations = onFamilyInvalidation(
      ['families', 'pregnancies', 'reminders', 'partner_nudges'],
      () => void sync(),
    );

    return () => {
      disposed = true;
      appState.remove();
      stopInvalidations();
    };
  }, [familyId, onFamilyInvalidation, session]);

  return null;
}
