import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'janani-cache:';

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(`${PREFIX}${key}`);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Cache failures must never block care data from loading or saving.
  }
}

export async function removeCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${PREFIX}${key}`);
  } catch {
    // Best-effort cleanup only.
  }
}
