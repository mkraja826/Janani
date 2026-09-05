import { NativeModules, Platform } from 'react-native';

import { EMPTY_HEALTH_CONNECT_SUMMARY, type HealthConnectCapability, type HealthConnectPermissions, type HealthConnectSummary } from './healthConnectTypes';

const NO_PERMISSIONS: HealthConnectPermissions = { steps: false, sleep: false, heart_rate: false, weight: false };

type NativeHealthConnect = {
  getCapability(): Promise<HealthConnectCapability>;
  getPermissions(): Promise<HealthConnectPermissions>;
  requestPermissions(): Promise<HealthConnectPermissions>;
  readSummary(): Promise<HealthConnectSummary>;
};

function nativeBridge(): NativeHealthConnect | null {
  if (Platform.OS !== 'android') return null;
  return (NativeModules.JananiHealthConnect as NativeHealthConnect | undefined) ?? null;
}

export async function getHealthConnectCapability(): Promise<HealthConnectCapability> {
  const bridge = nativeBridge();
  if (!bridge) {
    return {
      available: false,
      reason: Platform.OS === 'android' ? 'native_module_missing' : 'not_supported',
      supportedMetrics: Platform.OS === 'android' ? ['steps', 'sleep', 'heart_rate', 'weight'] : [],
    };
  }
  try { return await bridge.getCapability(); }
  catch { return { available: false, reason: 'not_supported', supportedMetrics: [] }; }
}

export async function getHealthConnectPermissions(): Promise<HealthConnectPermissions> {
  const bridge = nativeBridge();
  if (!bridge) return NO_PERMISSIONS;
  try { return await bridge.getPermissions(); } catch { return NO_PERMISSIONS; }
}

export async function requestHealthConnectPermissions(): Promise<HealthConnectPermissions> {
  const bridge = nativeBridge();
  if (!bridge) return NO_PERMISSIONS;
  try { return await bridge.requestPermissions(); } catch { return NO_PERMISSIONS; }
}

export async function readHealthConnectSummary(): Promise<HealthConnectSummary> {
  const bridge = nativeBridge();
  if (!bridge) return { ...EMPTY_HEALTH_CONNECT_SUMMARY, generatedAt: new Date().toISOString() };
  try { return await bridge.readSummary(); }
  catch { return { ...EMPTY_HEALTH_CONNECT_SUMMARY, generatedAt: new Date().toISOString() }; }
}
