export type HealthConnectMetric = 'steps' | 'sleep' | 'heart_rate' | 'weight';

export type HealthConnectCapability = {
  available: boolean;
  reason?: 'android_version' | 'provider_update_required' | 'native_module_missing' | 'permission_required' | 'not_supported';
  supportedMetrics: HealthConnectMetric[];
};

export type HealthConnectPermissions = Record<HealthConnectMetric, boolean>;

export type HealthConnectSummary = {
  source: 'health_connect';
  generatedAt: string;
  stepsToday: number | null;
  sleepMinutesLastNight: number | null;
  latestHeartRateBpm: number | null;
  latestWeightKg: number | null;
};

export const EMPTY_HEALTH_CONNECT_SUMMARY: HealthConnectSummary = {
  source: 'health_connect',
  generatedAt: new Date(0).toISOString(),
  stepsToday: null,
  sleepMinutesLastNight: null,
  latestHeartRateBpm: null,
  latestWeightKg: null,
};
