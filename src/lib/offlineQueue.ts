import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'janani:offline-mutation-queue:v1';

export type OfflineMutation = {
  id: string;
  kind: 'reminder_status' | 'journal_save' | 'journal_delete' | 'partner_acknowledgement';
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
};

async function readQueue(): Promise<OfflineMutation[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as OfflineMutation[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: OfflineMutation[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueueMutation(
  kind: OfflineMutation['kind'],
  payload: OfflineMutation['payload'],
): Promise<OfflineMutation> {
  const mutation: OfflineMutation = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    kind,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  const queue = await readQueue();
  await writeQueue([...queue, mutation]);
  return mutation;
}

export async function flushMutationQueue(
  processor: (mutation: OfflineMutation) => Promise<boolean>,
): Promise<{ completed: number; remaining: number }> {
  const queue = await readQueue();
  const remaining: OfflineMutation[] = [];
  let completed = 0;

  for (const mutation of queue) {
    try {
      if (await processor(mutation)) completed += 1;
      else remaining.push({ ...mutation, attempts: mutation.attempts + 1 });
    } catch {
      remaining.push({ ...mutation, attempts: mutation.attempts + 1 });
    }
  }

  await writeQueue(remaining);
  return { completed, remaining: remaining.length };
}

export async function getQueuedMutationCount(): Promise<number> {
  return (await readQueue()).length;
}
