import { encryptedLocalStorage } from '@/lib/encryptedLocalStorage';
import { randomUuid } from '@/lib/uuid';

const QUEUE_PREFIX = 'janani:offline-mutation-queue:v2:';
const LEGACY_QUEUE_KEY = 'janani:offline-mutation-queue:v1';
const listeners = new Map<string, Set<(status: OfflineQueueStatus) => void>>();
const queueLocks = new Map<string, Promise<unknown>>();

export type OfflineQueueStatus = {
  count: number;
  failedCount: number;
  firstFailure: string | null;
};

export type MutationProcessingResult =
  | { status: 'completed' }
  | { status: 'retry' }
  | { status: 'aborted' }
  | { status: 'failed'; message: string };

export type OfflineMutation = {
  id: string;
  userId: string;
  kind:
    | 'reminder_status'
    | 'reminder_create'
    | 'reminder_edit'
    | 'journal_save'
    | 'journal_edit'
    | 'journal_delete'
    | 'partner_nudge_send'
    | 'partner_acknowledgement';
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
  failedAt?: string;
  failureMessage?: string;
};

const mutationKinds = new Set<OfflineMutation['kind']>([
  'reminder_status',
  'reminder_create',
  'reminder_edit',
  'journal_save',
  'journal_edit',
  'journal_delete',
  'partner_nudge_send',
  'partner_acknowledgement',
]);

function queueKey(userId: string) {
  if (!userId) throw new Error('A signed-in user is required for offline changes.');
  return `${QUEUE_PREFIX}${userId}`;
}

function runExclusive<T>(userId: string, operation: () => Promise<T>): Promise<T> {
  const previous = queueLocks.get(userId) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(operation);
  queueLocks.set(userId, current);
  void current.finally(() => {
    if (queueLocks.get(userId) === current) queueLocks.delete(userId);
  }).catch(() => undefined);
  return current;
}

async function readQueueUnsafe(userId: string): Promise<OfflineMutation[]> {
  const raw = await encryptedLocalStorage.getItem(queueKey(userId));
  const queue = raw ? (JSON.parse(raw) as unknown) : [];
  if (!Array.isArray(queue)) throw new Error('Offline queue is not a list.');
  return (queue as OfflineMutation[]).filter((mutation) => mutation.userId === userId);
}

async function writeQueueUnsafe(userId: string, queue: OfflineMutation[]): Promise<void> {
  await encryptedLocalStorage.setItem(queueKey(userId), JSON.stringify(queue));
  const status = summarizeQueue(queue);
  listeners.get(userId)?.forEach((listener) => listener(status));
}

function parseLegacyQueue(raw: string, userId: string): OfflineMutation[] {
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) throw new Error('Legacy offline queue is not a list.');

  return parsed.map((item) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      throw new Error('Legacy offline queue contains an invalid change.');
    }
    const mutation = item as Record<string, unknown>;
    if (
      typeof mutation.kind !== 'string'
      || !mutationKinds.has(mutation.kind as OfflineMutation['kind'])
      || typeof mutation.payload !== 'object'
      || mutation.payload === null
      || Array.isArray(mutation.payload)
      || typeof mutation.createdAt !== 'string'
      || (mutation.userId !== undefined && mutation.userId !== userId)
    ) {
      throw new Error('Legacy offline queue contains an invalid change.');
    }

    const migrated: OfflineMutation = {
      id: typeof mutation.id === 'string' && mutation.id ? mutation.id : randomUuid(),
      userId,
      kind: mutation.kind as OfflineMutation['kind'],
      payload: mutation.payload as Record<string, unknown>,
      createdAt: mutation.createdAt,
      attempts: Number.isInteger(mutation.attempts) && Number(mutation.attempts) >= 0
        ? Number(mutation.attempts)
        : 0,
    };
    if (typeof mutation.failedAt === 'string') migrated.failedAt = mutation.failedAt;
    if (typeof mutation.failureMessage === 'string') {
      migrated.failureMessage = mutation.failureMessage;
    }
    return migrated;
  });
}

function summarizeQueue(queue: OfflineMutation[]): OfflineQueueStatus {
  const failed = queue.filter((mutation) => Boolean(mutation.failedAt));
  return {
    count: queue.length,
    failedCount: failed.length,
    firstFailure: failed[0]?.failureMessage ?? null,
  };
}

export function subscribeToOfflineQueueStatus(
  userId: string,
  listener: (status: OfflineQueueStatus) => void,
): () => void {
  const userListeners = listeners.get(userId) ?? new Set<(status: OfflineQueueStatus) => void>();
  userListeners.add(listener);
  listeners.set(userId, userListeners);
  getOfflineQueueStatus(userId).then(listener).catch(() => listener({
    count: 1,
    failedCount: 1,
    firstFailure: 'Saved offline changes could not be read. You may keep them for recovery or explicitly discard them.',
  }));
  return () => {
    const current = listeners.get(userId);
    current?.delete(listener);
    if (current?.size === 0) listeners.delete(userId);
  };
}

export async function enqueueMutation(
  userId: string,
  kind: OfflineMutation['kind'],
  payload: OfflineMutation['payload'],
): Promise<OfflineMutation> {
  const mutation: OfflineMutation = {
    id: randomUuid(),
    userId,
    kind,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  return runExclusive(userId, async () => {
    const queue = await readQueueUnsafe(userId);
    await writeQueueUnsafe(userId, [...queue, mutation]);
    return mutation;
  });
}

export async function flushMutationQueue(
  userId: string,
  processor: (mutation: OfflineMutation) => Promise<MutationProcessingResult>,
): Promise<{ completed: number; remaining: number; failed: number }> {
  return runExclusive(userId, async () => {
    const queue = await readQueueUnsafe(userId);
    const remaining: OfflineMutation[] = [];
    let completed = 0;

    for (let index = 0; index < queue.length; index += 1) {
      const mutation = queue[index];
      if (mutation.failedAt) {
        remaining.push(...queue.slice(index));
        break;
      }
      try {
        const result = await processor(mutation);
        if (result.status === 'aborted') {
          remaining.push(...queue.slice(index));
          break;
        }
        if (result.status === 'completed') {
          completed += 1;
          continue;
        }
        if (result.status === 'failed') {
          remaining.push({
            ...mutation,
            attempts: mutation.attempts + 1,
            failedAt: new Date().toISOString(),
            failureMessage: result.message,
          });
        } else {
          remaining.push({ ...mutation, attempts: mutation.attempts + 1 });
        }
      } catch {
        remaining.push({ ...mutation, attempts: mutation.attempts + 1 });
      }
      remaining.push(...queue.slice(index + 1));
      break;
    }

    await writeQueueUnsafe(userId, remaining);
    return {
      completed,
      remaining: remaining.length,
      failed: remaining.filter((mutation) => Boolean(mutation.failedAt)).length,
    };
  });
}

export async function getOfflineQueueStatus(userId: string): Promise<OfflineQueueStatus> {
  return runExclusive(userId, async () => summarizeQueue(await readQueueUnsafe(userId)));
}

export async function retryFailedOfflineMutations(userId: string): Promise<void> {
  await runExclusive(userId, async () => {
    const queue = await readQueueUnsafe(userId);
    await writeQueueUnsafe(
      userId,
      queue.map(({ failedAt: _failedAt, failureMessage: _failureMessage, ...mutation }) => mutation),
    );
  });
}

export async function discardFirstFailedOfflineMutation(userId: string): Promise<void> {
  await runExclusive(userId, async () => {
    try {
      const queue = await readQueueUnsafe(userId);
      const failedIndex = queue.findIndex((mutation) => Boolean(mutation.failedAt));
      if (failedIndex >= 0) queue.splice(failedIndex, 1);
      await writeQueueUnsafe(userId, queue);
    } catch {
      await encryptedLocalStorage.removeItem(queueKey(userId));
      listeners.get(userId)?.forEach((listener) => listener({
        count: 0,
        failedCount: 0,
        firstFailure: null,
      }));
    }
  });
}

export async function clearUserOfflineQueue(userId: string): Promise<void> {
  await runExclusive(userId, async () => {
    await encryptedLocalStorage.removeItem(queueKey(userId));
    listeners.get(userId)?.forEach((listener) => listener({
      count: 0,
      failedCount: 0,
      firstFailure: null,
    }));
  });
}

export async function migrateLegacyOfflineQueue(userId: string): Promise<void> {
  await runExclusive(userId, async () => {
    const raw = await encryptedLocalStorage.getItem(LEGACY_QUEUE_KEY);
    if (raw === null) return;

    const legacyQueue = parseLegacyQueue(raw, userId);
    const currentQueue = await readQueueUnsafe(userId);
    const currentIds = new Set(currentQueue.map((mutation) => mutation.id));
    const migrated = legacyQueue.filter((mutation) => !currentIds.has(mutation.id));
    if (migrated.length) {
      await writeQueueUnsafe(userId, [...currentQueue, ...migrated]);
    }

    // Remove the unscoped copy only after every entry is safely present in v2.
    await encryptedLocalStorage.removeItem(LEGACY_QUEUE_KEY);
  });
}
