import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RegionalDietContext } from './regionalDiet';

const STORAGE_KEY = 'pregalove:regional-diet-context:v1';

export async function readRegionalDietContext(): Promise<RegionalDietContext | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RegionalDietContext;
  } catch {
    return null;
  }
}

export async function writeRegionalDietContext(context: RegionalDietContext): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(context));
}
