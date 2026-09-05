import { Platform } from 'react-native';

import { EMPTY_HEALTH_CONNECT_SUMMARY, type HealthConnectCapability, type HealthConnectPermissions, type HealthConnectSummary } from './healthConnectTypes';

const NO_PERMISSIONS: HealthConnectPermissions = { steps: false, sleep: false, heart_rate: false, weight: false };

/**
 * v14 capability gate. The JS experience is ready before a native Health Connect
 * bridge is enabled. This prevents the app from claiming access it does not have
 * and lets us preserve API-24 compatibility until the native integration choice is final.
 */
export async function getHealthConnectCapability(): Promise<HealthConnectCapability> {
  if (Platform.OS !== 'android') return { available: false, reason: 'not_supported', supportedMetrics: [] };
  if (typeof Platform.Version === 'number' && Platform.Version < 26) {
    return { available: false, reason: 'android_version', supportedMetrics: [] };
  }
  return { available: false, reason: 'native_module_missing', supportedMetrics: ['steps', 'sleep', 'heart_rate', 'weight'] };
}

export async function getHealthConnectPermissions(): Promise<HealthConnectPermissions> {
  return NO_PERMISSIONS;
}

export async function requestHealthConnectPermissions(): Promise<HealthConnectPermissions> {
  return NO_PERMISSIONS;
}

export async function readHealthConnectSummary(): Promise<HealthConnectSummary> {
  return { ...EMPTY_HEALTH_CONNECT_SUMMARY, generatedAt: new Date().toISOString() };
}
