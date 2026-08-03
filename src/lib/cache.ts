import AsyncStorage from '@react-native-async-storage/async-storage';

import { encryptedLocalStorage } from '@/lib/encryptedLocalStorage';

const PREFIX = 'janani-cache:v2:';
const LEGACY_PREFIX = 'janani-cache:';

function scopedKey(userId: string, key: string) {
  if (!userId) throw new Error('A signed-in user is required for local care data.');
  return `${PREFIX}${userId}:${key}`;
}

export async function readCache<T>(userId: string, key: string): Promise<T | null> {
  try {
    const value = await encryptedLocalStorage.getItem(scopedKey(userId, key));
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export async function writeCache<T>(userId: string, key: string, value: T): Promise<void> {
  try {
    await encryptedLocalStorage.setItem(scopedKey(userId, key), JSON.stringify(value));
  } catch {
    // Cache failures must never block care data from loading or saving.
  }
}

export async function removeCache(userId: string, key: string): Promise<void> {
  try {
    await encryptedLocalStorage.removeItem(scopedKey(userId, key));
  } catch {
    // Best-effort cleanup only.
  }
}

export async function clearUserCache(userId: string): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const userPrefix = `${PREFIX}${userId}:`;
    const ownedKeys = keys.filter((key) => key.startsWith(userPrefix));
    if (ownedKeys.length) await AsyncStorage.multiRemove(ownedKeys);
  } catch {
    // Best-effort privacy cleanup only.
  }
}

export async function clearUnscopedLegacyCaches(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const legacyKeys = keys.filter(
      (key) => key.startsWith(LEGACY_PREFIX) && !key.startsWith(PREFIX),
    );
    if (legacyKeys.length) await AsyncStorage.multiRemove(legacyKeys);
  } catch {
    // Old unscoped data cannot be assigned safely, so cleanup is best effort.
  }
}
