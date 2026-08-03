import { readCache, removeCache, writeCache } from '@/lib/cache';
import { supabase } from '@/lib/supabase';

const ACTIVE_PREGNANCY_CACHE_KEY = 'active-pregnancy-id';

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

export async function resolveActivePregnancyId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('pregnancies')
    .select('id')
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (!error) {
    if (data?.id) {
      await cacheActivePregnancyId(userId, data.id);
      return data.id;
    }
    await cacheActivePregnancyId(userId, null);
    return null;
  }

  return readCache<string>(userId, ACTIVE_PREGNANCY_CACHE_KEY);
}
