export type PregnancyRegion = {
  country?: string | null;
  state?: string | null;
  city?: string | null;
  cuisineRegion?: string | null;
};

export type PregnancyHealthContext = {
  conditions: string[];
  allergies: string[];
  medications: string[];
  dietaryPreference?: string | null;
};

export type PregnancyDeviceContext = {
  healthConnectAvailable: boolean;
  healthConnectConnected: boolean;
  latestWeightKg?: number | null;
  restingHeartRate?: number | null;
  sleepMinutes?: number | null;
  steps?: number | null;
};

export type PregnancyScheduleContext = {
  medicinesDueToday: number;
  appointmentsDueSoon: number;
  remindersDueToday: number;
};

export type PregnancyContext = {
  userId: string;
  role: 'mother' | 'partner';
  dueDate?: string | null;
  gestationalWeek?: number | null;
  gestationalDay?: number | null;
  trimester?: 1 | 2 | 3 | null;
  region: PregnancyRegion;
  health: PregnancyHealthContext;
  devices: PregnancyDeviceContext;
  schedule: PregnancyScheduleContext;
  locale: string;
};

export function createEmptyPregnancyContext(userId: string, role: PregnancyContext['role']): PregnancyContext {
  return {
    userId,
    role,
    dueDate: null,
    gestationalWeek: null,
    gestationalDay: null,
    trimester: null,
    region: {},
    health: { conditions: [], allergies: [], medications: [], dietaryPreference: null },
    devices: { healthConnectAvailable: false, healthConnectConnected: false },
    schedule: { medicinesDueToday: 0, appointmentsDueSoon: 0, remindersDueToday: 0 },
    locale: 'en',
  };
}
