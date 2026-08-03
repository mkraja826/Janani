import AsyncStorage from '@react-native-async-storage/async-storage';
import * as aesjs from 'aes-js';
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';

const ENVELOPE_PREFIX = 'janani-v1';
const MASTER_KEY_NAME = 'janani_local_encryption_master_v1';
const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

let masterKeyPromise: Promise<Uint8Array> | null = null;

function concatenate(...parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((length, part) => length + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

async function getMasterKey(): Promise<Uint8Array> {
  if (!masterKeyPromise) {
    masterKeyPromise = (async () => {
      const existing = await SecureStore.getItemAsync(MASTER_KEY_NAME, secureStoreOptions);
      if (existing) {
        const decoded = aesjs.utils.hex.toBytes(existing);
        if (decoded.length === 64) return decoded;
      }
      const generated = globalThis.crypto.getRandomValues(new Uint8Array(64));
      await SecureStore.setItemAsync(
        MASTER_KEY_NAME,
        aesjs.utils.hex.fromBytes(generated),
        secureStoreOptions,
      );
      return generated;
    })().catch((error) => {
      masterKeyPromise = null;
      throw error;
    });
  }
  return masterKeyPromise;
}

async function encrypt(storageKey: string, value: string): Promise<string> {
  const masterKey = await getMasterKey();
  const encryptionKey = masterKey.slice(0, 32);
  const authenticationKey = masterKey.slice(32);
  const nonce = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(nonce));
  const ciphertext = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
  const authenticated = concatenate(
    aesjs.utils.utf8.toBytes(storageKey),
    nonce,
    ciphertext,
  );
  const signature = hmac(sha256, authenticationKey, authenticated);
  return [
    ENVELOPE_PREFIX,
    aesjs.utils.hex.fromBytes(nonce),
    aesjs.utils.hex.fromBytes(ciphertext),
    aesjs.utils.hex.fromBytes(signature),
  ].join('.');
}

async function decrypt(storageKey: string, envelope: string): Promise<string> {
  const [version, nonceHex, ciphertextHex, signatureHex, extra] = envelope.split('.');
  if (
    version !== ENVELOPE_PREFIX
    || !nonceHex
    || !ciphertextHex
    || !signatureHex
    || extra !== undefined
  ) {
    throw new Error('Unsupported encrypted storage envelope.');
  }
  const masterKey = await getMasterKey();
  const encryptionKey = masterKey.slice(0, 32);
  const authenticationKey = masterKey.slice(32);
  const nonce = aesjs.utils.hex.toBytes(nonceHex);
  const ciphertext = aesjs.utils.hex.toBytes(ciphertextHex);
  const signature = aesjs.utils.hex.toBytes(signatureHex);
  if (nonce.length !== 16 || signature.length !== 32) {
    throw new Error('Encrypted storage envelope is invalid.');
  }
  const expected = hmac(
    sha256,
    authenticationKey,
    concatenate(aesjs.utils.utf8.toBytes(storageKey), nonce, ciphertext),
  );
  if (!constantTimeEqual(signature, expected)) {
    throw new Error('Encrypted storage authentication failed.');
  }
  const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(nonce));
  return aesjs.utils.utf8.fromBytes(cipher.decrypt(ciphertext));
}

export const encryptedLocalStorage = {
  async getItem(key: string): Promise<string | null> {
    const stored = await AsyncStorage.getItem(key);
    if (stored === null) return null;
    if (stored.startsWith(`${ENVELOPE_PREFIX}.`)) return decrypt(key, stored);

    // Migrate legacy plaintext values the first time they are read.
    await AsyncStorage.setItem(key, await encrypt(key, stored));
    return stored;
  },

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, await encrypt(key, value));
  },

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};

export function isEncryptedLocalEnvelope(value: string): boolean {
  return value.startsWith(`${ENVELOPE_PREFIX}.`);
}
