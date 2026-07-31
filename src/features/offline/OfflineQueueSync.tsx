import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { scheduleDailyReminder } from '@/features/reminders/notifications';
import { flushMutationQueue, type OfflineMutation } from '@/lib/offlineQueue';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

async function processMutation(mutation: OfflineMutation): Promise<boolean> {
  switch (mutation.kind) {
    case 'reminder_status': {
      const { error } = await supabase.rpc('mark_reminder_occurrence', mutation.payload);
      return !error;
    }
    case 'reminder_create': {
      const { data: reminderId, error } = await supabase.rpc('create_reminder_idempotent', mutation.payload);
      if (error || typeof reminderId !== 'string') return false;

      const title = mutation.payload.p_title;
      const instructions = mutation.payload.p_instructions;
      const localTime = mutation.payload.p_local_time;
      if (typeof title === 'string' && typeof localTime === 'string') {
        try {
          const identifier = await scheduleDailyReminder(
            title,
            typeof instructions === 'string' ? instructions : null,
            localTime.slice(0, 5),
          );
          if (identifier) {
            await supabase.from('reminders').update({ notification_identifier: identifier }).eq('id', reminderId);
          }
        } catch {
          // The shared reminder is authoritative; notification setup can be repaired later.
        }
      }
      return true;
    }
    case 'journal_save': {
      const { error } = await supabase.rpc('save_journal_entry_idempotent', mutation.payload);
      return !error;
    }
    case 'journal_edit': {
      const { error } = await supabase.rpc('update_journal_entry_idempotent', mutation.payload);
      return !error;
    }
    case 'journal_delete': {
      const id = mutation.payload.id;
      if (typeof id !== 'string') return true;
      const { error } = await supabase.from('journal_entries').delete().eq('id', id);
      return !error;
    }
    case 'partner_acknowledgement': {
      const id = mutation.payload.id;
      if (typeof id !== 'string') return true;
      const { error } = await supabase.rpc('acknowledge_partner_nudge', { p_nudge_id: id });
      return !error;
    }
    default:
      return true;
  }
}

export function OfflineQueueSync() {
  const { session } = useAuth();

  useEffect(() => {
    if (!session) return;
    let flushing = false;

    async function flush() {
      if (flushing) return;
      flushing = true;
      try {
        await flushMutationQueue(processMutation);
      } finally {
        flushing = false;
      }
    }

    flush().catch(() => undefined);
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') flush().catch(() => undefined);
    });

    return () => subscription.remove();
  }, [session]);

  return null;
}
