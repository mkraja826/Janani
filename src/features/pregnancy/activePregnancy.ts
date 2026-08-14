import { readCache, removeCache, writeCache } from '@/lib/cache';
import { supabase } from '@/lib/supabase';

const ACTIVE_PREGNANCY_CACHE_KEY = 'active-pregnancy-id';
const ACTIVE_PREGNANCY_SUMMARY_CACHE_KEY = 'active-pregnancy-summary-v1';

export type ActivePregnancySummary = {
  id: string;
  dueDate: string;
};

export async function cacheActivePregnancy(
  userId: string,
  pregnancy: ActivePregnancySummary | null,
): Promise<void> {
  if (pregnancy) {
    await Promise.all([
      writeCache(userId, ACTIVE_PREGNANCY_CACHE_KEY, pregnancy.id),
      writeCache(userId, ACTIVE_PREGNANCY_SUMMARY_CACHE_KEY, pregnancy),
    ]);
    return;
  }
  await Promise.all([
    removeCache(userId, ACTIVE_PREGNANCY_CACHE_KEY),
    removeCache(userId, ACTIVE_PREGNANCY_SUMMARY_CACHE_KEY),
  ]);
}

export async function cacheActivePregnancyId(
  userId: string,
  pregnancyId: string | null,
): Promise<void> {
  if (pregnancyId) {
    await writeCache(userId, ACTIVE_PREGNANCY_CACHE_KEY, pregnancyId);
    return;
  }
  await removeCache(userId, ACTIVE_PREGNANCY_CACHE_KEY);
}

export async function resolveActivePregnancy(
  userId: string,
): Promise<ActivePregnancySummary | null> {
  const { data, error } = await supabase
    .from('pregnancies')
    .select('id,due_date')
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (!error) {
    const pregnancy = data?.id && data.due_date
      ? { id: data.id, dueDate: data.due_date }
      : null;
    await cacheActivePregnancy(userId, pregnancy);
    return pregnancy;
  }

  return readCache<ActivePregnancySummary>(userId, ACTIVE_PREGNANCY_SUMMARY_CACHE_KEY);
}

export async function resolveActivePregnancyId(userId: string): Promise<string | null> {
  const pregnancy = await resolveActivePregnancy(userId);
  if (pregnancy) return pregnancy.id;
  return readCache<string>(userId, ACTIVE_PREGNANCY_CACHE_KEY);
}
