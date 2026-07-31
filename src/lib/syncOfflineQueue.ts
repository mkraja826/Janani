import type { OfflineMutation } from '@/lib/offlineQueue';
import { flushMutationQueue } from '@/lib/offlineQueue';
import { supabase } from '@/lib/supabase';

async function processMutation(mutation: OfflineMutation): Promise<boolean> {
  switch (mutation.kind) {
    case 'reminder_status': {
      const { reminderId, scheduledFor, state } = mutation.payload as {
        reminderId: string;
        scheduledFor: string;
        state: 'taken' | 'skipped';
      };
      const { error } = await supabase.rpc('mark_reminder_occurrence', {
        p_reminder_id: reminderId,
        p_scheduled_for: scheduledFor,
        p_state: state,
        p_note: null,
      });
      return !error;
    }
    case 'journal_delete': {
      const { entryId } = mutation.payload as { entryId: string };
      const { error } = await supabase.from('journal_entries').delete().eq('id', entryId);
      return !error;
    }
    case 'partner_acknowledgement': {
      const { nudgeId } = mutation.payload as { nudgeId: string };
      const { error } = await supabase.rpc('acknowledge_partner_nudge', { p_nudge_id: nudgeId });
      return !error;
    }
    case 'journal_save':
      // Journal create/edit replay needs an idempotency key before it can be retried safely.
      return false;
    default:
      return false;
  }
}

export async function syncOfflineMutations() {
  return flushMutationQueue(processMutation);
}
