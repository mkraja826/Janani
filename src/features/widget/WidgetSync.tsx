import { useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';

import { getPregnancyProgress } from '@/features/pregnancy/progress';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

const widgetBridge = NativeModules.JananiWidget as { update?: (state: Record<string, string>) => Promise<void> } | undefined;

export function WidgetSync() {
  const { session } = useAuth();

  useEffect(() => {
    const updateWidget = widgetBridge?.update;
    if (!session || Platform.OS !== 'android' || !updateWidget) return;

    async function sync() {
      const membership = await supabase.from('family_members').select('role,families(name,pregnancies(due_date,status))').eq('user_id', session.user.id).maybeSingle();
      const family = Array.isArray(membership.data?.families) ? membership.data?.families[0] : membership.data?.families;
      const pregnancies = family?.pregnancies;
      const pregnancyList = Array.isArray(pregnancies) ? pregnancies : pregnancies ? [pregnancies] : [];
      const pregnancy = pregnancyList.find((item) => item.status === 'active') ?? pregnancyList[0];
      const progress = pregnancy?.due_date ? getPregnancyProgress(pregnancy.due_date) : null;

      const now = new Date();
      const date = now.toISOString().slice(0, 10);
      const reminder = await supabase.from('reminders').select('title,local_time').eq('is_active', true).lte('start_date', date).or(`end_date.is.null,end_date.gte.${date}`).order('local_time').limit(1).maybeSingle();
      const nudge = await supabase.from('partner_nudges').select('message').neq('sender_id', session.user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();

      await updateWidget({
        week_label: progress ? `Week ${progress.gestationalWeek} · ${progress.gestationalDay} days` : 'Janani',
        family_label: family?.name ?? 'Our little family',
        next_reminder: reminder.data ? `${reminder.data.local_time.slice(0, 5)} · ${reminder.data.title}` : 'No care reminder scheduled',
        partner_message: nudge.data?.message ?? 'Send a little warmth',
      });
    }

    sync().catch(() => undefined);
    const channel = supabase.channel('janani-widget-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders' }, () => sync())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_nudges' }, () => sync())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pregnancies' }, () => sync())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session]);

  return null;
}
