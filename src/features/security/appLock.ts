import * as SecureStore from 'expo-secure-store';
import { sha256 } from '@noble/hashes/sha256';

export type AppLockMode = 'off' | 'pin' | 'biometric';

export type AppLockConfig = {
  mode: AppLockMode;
  timeoutSeconds: 0 | 60 | 300 | 900;
  pinHash: string | null;
};

const DEFAULT_CONFIG: AppLockConfig = {
  mode: 'off',
  timeoutSeconds: 60,
  pinHash: null,
};

function configKey(userId: string) {
  return `pregalove.app-lock.config.${userId}`;
}

function biometricKey(userId: string) {
  return `pregalove.app-lock.biometric.${userId}`;
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function pinDigest(userId: string, pin: string) {
  return toHex(sha256(`PregaLove|app-lock|${userId}|${pin}`));
}

export async function readAppLockConfig(userId: string): Promise<AppLockConfig> {
  try {
    const raw = await SecureStore.getItemAsync(configKey(userId));
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<AppLockConfig>;
    const mode: AppLockMode = parsed.mode === 'pin' || parsed.mode === 'biometric' ? parsed.mode : 'off';
    const timeoutSeconds = parsed.timeoutSeconds === 0 || parsed.timeoutSeconds === 60 || parsed.timeoutSeconds === 300 || parsed.timeoutSeconds === 900
      ? parsed.timeoutSeconds
      : 60;
    return {
      mode,
      timeoutSeconds,
      pinHash: typeof parsed.pinHash === 'string' ? parsed.pinHash : null,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function savePinAppLock(userId: string, pin: string, timeoutSeconds: AppLockConfig['timeoutSeconds']) {
  if (!/^\d{6}$/.test(pin)) throw new Error('Use a 6-digit PIN.');
  const config: AppLockConfig = {
    mode: 'pin',
    timeoutSeconds,
    pinHash: pinDigest(userId, pin),
  };
  await SecureStore.setItemAsync(configKey(userId), JSON.stringify(config), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  await SecureStore.deleteItemAsync(biometricKey(userId)).catch(() => undefined);
  return config;
}

export async function saveBiometricAppLock(userId: string, pin: string, timeoutSeconds: AppLockConfig['timeoutSeconds']) {
  if (!/^\d{6}$/.test(pin)) throw new Error('Use a 6-digit fallback PIN.');
  const config: AppLockConfig = {
    mode: 'biometric',
    timeoutSeconds,
    pinHash: pinDigest(userId, pin),
  };
  await SecureStore.setItemAsync(biometricKey(userId), 'pregalove-biometric-unlock', {
    requireAuthentication: true,
    authenticationPrompt: 'Enable biometric unlock for PregaLove',
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  await SecureStore.setItemAsync(configKey(userId), JSON.stringify(config), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return config;
}

export async function disableAppLock(userId: string) {
  await Promise.allSettled([
    SecureStore.deleteItemAsync(configKey(userId)),
    SecureStore.deleteItemAsync(biometricKey(userId)),
  ]);
}

export function verifyAppLockPin(userId: string, pin: string, config: AppLockConfig) {
  if (!config.pinHash || !/^\d{6}$/.test(pin)) return false;
  return pinDigest(userId, pin) === config.pinHash;
}

export async function authenticateWithBiometrics(userId: string) {
  try {
    const value = await SecureStore.getItemAsync(biometricKey(userId), {
      requireAuthentication: true,
      authenticationPrompt: 'Unlock PregaLove',
    });
    return value === 'pregalove-biometric-unlock';
  } catch {
    return false;
  }
}
