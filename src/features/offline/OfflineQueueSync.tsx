import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import {
  cancelReminderNotifications,
  scheduleReminderNotifications,
} from '@/features/reminders/notifications';
import { isTransientError } from '@/lib/errors';
import {
  flushMutationQueue,
  type MutationProcessingResult,
  type OfflineMutation,
} from '@/lib/offlineQueue';
import {
  createSessionBoundSupabaseClient,
  supabase,
} from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import type { Database } from '@/types/database';

type ReminderCreateArgs =
  Database['public']['Functions']['create_reminder_idempotent']['Args'];
type ReminderEditArgs =
  Database['public']['Functions']['update_reminder_offline_safe']['Args'];
type JournalSaveArgs =
  Database['public']['Functions']['save_journal_entry_idempotent']['Args'];
type JournalEditArgs =
  Database['public']['Functions']['update_journal_entry_idempotent']['Args'];

const reminderKinds = new Set([
  'medication',
  'appointment',
  'hydration',
  'nutrition',
  'custom',
]);

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function mutationResult(error: unknown): MutationProcessingResult {
  if (!error) return { status: 'completed' };
  if (isTransientError(error)) return { status: 'retry' };
  const message = typeof error === 'object'
    && error !== null
    && 'message' in error
    && typeof error.message === 'string'
    ? error.message.slice(0, 300)
    : 'The server rejected this queued change.';
  return { status: 'failed', message };
}

function invalidMutation(message: string): MutationProcessingResult {
  return { status: 'failed', message };
}

type ReplayGuard = () => Promise<boolean>;
type SessionBoundClient = ReturnType<typeof createSessionBoundSupabaseClient>;

async function processMutation(
  mutation: OfflineMutation,
  client: SessionBoundClient,
  canReplay: ReplayGuard,
): Promise<MutationProcessingResult> {
  switch (mutation.kind) {
    case 'reminder_status': {
      const reminderId = mutation.payload.p_reminder_id ?? mutation.payload.reminderId;
      const scheduledFor = mutation.payload.p_scheduled_for ?? mutation.payload.scheduledFor;
      const state = mutation.payload.p_state ?? mutation.payload.state;
      if (
        typeof reminderId !== 'string'
        || typeof scheduledFor !== 'string'
        || (state !== 'taken' && state !== 'skipped')
      ) {
        return invalidMutation('A queued reminder status is incomplete and needs to be discarded.');
      }
      if (!await canReplay()) return { status: 'aborted' };
      const { error } = await client.rpc('mark_reminder_occurrence', {
        p_reminder_id: reminderId,
        p_scheduled_for: scheduledFor,
        p_state: state,
        p_note: null,
      });
      return mutationResult(error);
    }
    case 'reminder_create': {
      const payload = mutation.payload;
      if (
        typeof payload.p_client_mutation_id !== 'string'
        || !Array.isArray(payload.p_days_of_week)
        || !payload.p_days_of_week.every((day) => Number.isInteger(day) && Number(day) >= 0 && Number(day) <= 6)
        || !isNullableString(payload.p_end_date)
        || !isNullableString(payload.p_instructions)
        || typeof payload.p_kind !== 'string'
        || !reminderKinds.has(payload.p_kind)
        || typeof payload.p_local_time !== 'string'
        || typeof payload.p_pregnancy_id !== 'string'
        || typeof payload.p_start_date !== 'string'
        || typeof payload.p_title !== 'string'
      ) {
        return invalidMutation('A queued reminder is incomplete and needs to be discarded.');
      }
      const args: ReminderCreateArgs = {
        p_client_mutation_id: payload.p_client_mutation_id,
        p_days_of_week: payload.p_days_of_week as number[],
        p_end_date: payload.p_end_date,
        p_instructions: payload.p_instructions,
        p_kind: payload.p_kind as ReminderCreateArgs['p_kind'],
        p_local_time: payload.p_local_time,
        p_pregnancy_id: payload.p_pregnancy_id,
        p_start_date: payload.p_start_date,
        p_title: payload.p_title,
      };
      if (!await canReplay()) return { status: 'aborted' };
      const { data: reminderId, error } = await client.rpc(
        'create_reminder_idempotent',
        args,
      );
      if (error) return mutationResult(error);
      if (typeof reminderId !== 'string') {
        return invalidMutation('The server did not return the new reminder identifier.');
      }
      if (!await canReplay()) return { status: 'completed' };
      try {
        await scheduleReminderNotifications(mutation.userId, {
          id: reminderId,
          title: args.p_title,
          instructions: args.p_instructions,
          localTime: args.p_local_time,
          startDate: args.p_start_date,
          endDate: args.p_end_date,
          daysOfWeek: args.p_days_of_week,
        });
        if (!await canReplay()) {
          await cancelReminderNotifications(mutation.userId, reminderId);
        }
      } catch {
        // Foreground reminder synchronization will retry the local phone schedule.
      }
      return { status: 'completed' };
    }
    case 'reminder_edit': {
      const payload = mutation.payload;
      if (
        typeof payload.p_reminder_id !== 'string'
        || typeof payload.p_title !== 'string'
        || !isNullableString(payload.p_instructions)
        || typeof payload.p_local_time !== 'string'
      ) {
        return invalidMutation('A queued reminder edit is incomplete and needs to be discarded.');
      }
      const args: ReminderEditArgs = {
        p_reminder_id: payload.p_reminder_id,
        p_title: payload.p_title,
        p_instructions: payload.p_instructions,
        p_local_time: payload.p_local_time,
      };
      if (!await canReplay()) return { status: 'aborted' };
      const { data: reminderId, error } = await client.rpc(
        'update_reminder_offline_safe',
        args,
      );
      if (error) return mutationResult(error);
      if (typeof reminderId !== 'string') {
        return invalidMutation('The server did not return the edited reminder identifier.');
      }
      if (!await canReplay()) return { status: 'completed' };
      try {
        await cancelReminderNotifications(mutation.userId, reminderId);
        const reminder = await client
          .from('reminders')
          .select('id,title,instructions,local_time,start_date,end_date,days_of_week,is_active')
          .eq('id', reminderId)
          .maybeSingle();
        if (!await canReplay()) return { status: 'completed' };
        if (!reminder.error && reminder.data?.is_active) {
          await scheduleReminderNotifications(mutation.userId, {
            id: reminder.data.id,
            title: reminder.data.title,
            instructions: reminder.data.instructions,
            localTime: reminder.data.local_time,
            startDate: reminder.data.start_date,
            endDate: reminder.data.end_date,
            daysOfWeek: reminder.data.days_of_week,
          });
          if (!await canReplay()) {
            await cancelReminderNotifications(mutation.userId, reminderId);
          }
        }
      } catch {
        // Foreground reminder synchronization will retry the local phone schedule.
      }
      return { status: 'completed' };
    }
    case 'journal_save': {
      const payload = mutation.payload;
      if (
        typeof payload.p_body !== 'string'
        || typeof payload.p_client_mutation_id !== 'string'
        || typeof payload.p_entry_date !== 'string'
        || typeof payload.p_is_shared_with_partner !== 'boolean'
        || (typeof payload.p_mood !== 'number' && payload.p_mood !== null)
        || typeof payload.p_pregnancy_id !== 'string'
        || !isNullableString(payload.p_title)
      ) {
        return invalidMutation('A queued journal entry is incomplete and needs to be discarded.');
      }
      const args: JournalSaveArgs = {
        p_body: payload.p_body,
        p_client_mutation_id: payload.p_client_mutation_id,
        p_entry_date: payload.p_entry_date,
        p_is_shared_with_partner: payload.p_is_shared_with_partner,
        p_mood: payload.p_mood,
        p_pregnancy_id: payload.p_pregnancy_id,
        p_title: payload.p_title,
      };
      if (!await canReplay()) return { status: 'aborted' };
      const { error } = await client.rpc('save_journal_entry_idempotent', args);
      return mutationResult(error);
    }
    case 'journal_edit': {
      const payload = mutation.payload;
      if (
        typeof payload.p_body !== 'string'
        || typeof payload.p_client_mutation_id !== 'string'
        || typeof payload.p_entry_id !== 'string'
        || typeof payload.p_is_shared_with_partner !== 'boolean'
        || (typeof payload.p_mood !== 'number' && payload.p_mood !== null)
        || !isNullableString(payload.p_title)
      ) {
        return invalidMutation('A queued journal edit is incomplete and needs to be discarded.');
      }
      const args: JournalEditArgs = {
        p_body: payload.p_body,
        p_client_mutation_id: payload.p_client_mutation_id,
        p_entry_id: payload.p_entry_id,
        p_is_shared_with_partner: payload.p_is_shared_with_partner,
        p_mood: payload.p_mood,
        p_title: payload.p_title,
      };
      if (!await canReplay()) return { status: 'aborted' };
      const { error } = await client.rpc('update_journal_entry_idempotent', args);
      return mutationResult(error);
    }
    case 'journal_delete': {
      const id = mutation.payload.id ?? mutation.payload.entryId;
      if (typeof id !== 'string') {
        return invalidMutation('A queued journal deletion is incomplete and needs to be discarded.');
      }
      if (!await canReplay()) return { status: 'aborted' };
      const { error } = await client.from('journal_entries').delete().eq('id', id);
      return mutationResult(error);
    }
    case 'partner_nudge_send': {
      const message = mutation.payload.message;
      const clientMutationId = mutation.payload.client_mutation_id;
      if (typeof message !== 'string' || typeof clientMutationId !== 'string') {
        return invalidMutation('A queued partner message is incomplete and needs to be discarded.');
      }
      if (!await canReplay()) return { status: 'aborted' };
      const { error } = await client.functions.invoke('send-partner-nudge', {
        body: {
          message,
          client_mutation_id: clientMutationId,
        },
      });
      return mutationResult(error);
    }
    case 'partner_acknowledgement': {
      const id = mutation.payload.id ?? mutation.payload.nudgeId;
      if (typeof id !== 'string') {
        return invalidMutation('A queued partner acknowledgement is incomplete and needs to be discarded.');
      }
      if (!await canReplay()) return { status: 'aborted' };
      const { error } = await client.rpc('acknowledge_partner_nudge', { p_nudge_id: id });
      return mutationResult(error);
    }
    default:
      return invalidMutation('This queued change was created by an unsupported Janani version.');
  }
}

export async function flushJananiOfflineQueue(
  userId: string,
  isActive: () => boolean = () => true,
) {
  const { data: capturedAuth, error: captureError } = await supabase.auth.getSession();
  const capturedSession = capturedAuth.session;
  const client = !captureError && capturedSession?.user.id === userId
    ? createSessionBoundSupabaseClient(capturedSession.access_token)
    : null;
  const canReplay = async () => {
    if (!client || !isActive()) return false;
    const { data, error } = await supabase.auth.getSession();
    return !error
      && isActive()
      && data.session?.user.id === userId;
  };
  return flushMutationQueue(
    userId,
    (mutation) => client && mutation.userId === userId && isActive()
      ? processMutation(mutation, client, canReplay)
      : Promise.resolve({ status: 'aborted' }),
  );
}

export function OfflineQueueSync() {
  const { session } = useAuth();
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    const authenticatedUserId = userId;
    let disposed = false;
    let flushing = false;
    async function flush() {
      if (disposed || flushing) return;
      flushing = true;
      try {
        await flushJananiOfflineQueue(authenticatedUserId, () => !disposed);
      } finally {
        flushing = false;
      }
    }
    void flush();
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') void flush();
    });
    return () => {
      disposed = true;
      subscription.remove();
    };
  }, [userId]);
  return null;
}
