import AsyncStorage from '@react-native-async-storage/async-storage';
import * as aesjs from 'aes-js';
import * as SecureStore from 'expo-secure-store';

import {
  encryptedLocalStorage,
  isEncryptedLocalEnvelope,
} from '@/lib/encryptedLocalStorage';

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

class EncryptedAuthStorage {
  async getItem(key: string): Promise<string | null> {
    const stored = await AsyncStorage.getItem(key);
    if (!stored) return null;
    if (isEncryptedLocalEnvelope(stored)) {
      try {
        return await encryptedLocalStorage.getItem(key);
      } catch {
        await this.removeItem(key);
        return null;
      }
    }

    try {
      // Migrate the prior Janani AES-CTR format, whose per-record key used the
      // Supabase storage key in SecureStore.
      const legacyKeyHex = await SecureStore.getItemAsync(key, secureStoreOptions);
      if (legacyKeyHex) {
        const cipher = new aesjs.ModeOfOperation.ctr(
          aesjs.utils.hex.toBytes(legacyKeyHex),
          new aesjs.Counter(1),
        );
        const plaintext = aesjs.utils.utf8.fromBytes(
          cipher.decrypt(aesjs.utils.hex.toBytes(stored)),
        );
        await encryptedLocalStorage.setItem(key, plaintext);
        await SecureStore.deleteItemAsync(key, secureStoreOptions);
        return plaintext;
      }

      // Migrate Supabase's original plaintext AsyncStorage adapter.
      await encryptedLocalStorage.setItem(key, stored);
      return stored;
    } catch {
      await this.removeItem(key);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    await encryptedLocalStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await Promise.all([
      encryptedLocalStorage.removeItem(key),
      SecureStore.deleteItemAsync(key, secureStoreOptions).catch(() => undefined),
    ]);
  }
}

export const encryptedAuthStorage = new EncryptedAuthStorage();
