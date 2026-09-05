export type HealthConnectMetric = 'steps' | 'sleep' | 'heart_rate' | 'weight';

export type HealthConnectCapability = {
  available: boolean;
  reason?: 'android_version' | 'native_module_missing' | 'permission_required' | 'not_supported';
  supportedMetrics: HealthConnectMetric[];
};

export type HealthConnectPermissions = Record<HealthConnectMetric, boolean>;

export type HealthConnectSummary = {
  source: 'health_connect';
  generatedAt: string;
  stepsToday: number | null;
  sleepMinutesLastNight: number | null;
  restingHeartRateBpm: number | null;
  latestWeightKg: number | null;
};

export const EMPTY_HEALTH_CONNECT_SUMMARY: HealthConnectSummary = {
  source: 'health_connect',
  generatedAt: new Date(0).toISOString(),
  stepsToday: null,
  sleepMinutesLastNight: null,
  restingHeartRateBpm: null,
  latestWeightKg: null,
};
