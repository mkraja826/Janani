export type Role = 'mother' | 'partner';

export type LanguageCode = 'en' | 'es' | 'hi' | 'ta' | 'te' | 'ar' | 'fr';

export type TabId = 
  | 'home'
  | 'pregnancy-guide'
  | 'reminders'
  | 'journal'
  | 'thinking-of-you'
  | 'health-tracker'
  | 'food-guide'
  | 'care-timeline'
  | 'health-profile'
  | 'ai-companion'
  | 'widgets'
  | 'safety-privacy'
  | 'settings';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  familyName: string;
  dueDate: string; // YYYY-MM-DD
  inviteCode: string;
  partnerLinked: boolean;
  partnerName?: string;
  language: LanguageCode;
  createdAt: string;
}

export interface PregnancyProgress {
  gestationalWeek: number;
  gestationalDay: number;
  trimester: 1 | 2 | 3;
  daysRemaining: number;
  isPastDue: boolean;
  progressPercent: number;
}

export type ReminderKind = 'medication' | 'appointment' | 'hydration' | 'nutrition' | 'custom';

export interface Reminder {
  id: string;
  title: string;
  instructions: string | null;
  kind: ReminderKind;
  localTime: string; // HH:mm
  startDate: string;
  endDate: string | null;
  daysOfWeek: number[]; // 0=Sun, 1=Mon...
  isActive: boolean;
  stateToday: 'pending' | 'taken' | 'skipped';
  takenAt?: string;
}

export interface JournalEntry {
  id: string;
  authorRole: Role;
  authorName: string;
  title: string | null;
  body: string;
  mood: number | null; // 1 to 5
  entryDate: string; // YYYY-MM-DD
  isSharedWithPartner: boolean;
  createdAt: string;
}

export interface PartnerNudge {
  id: string;
  senderRole: Role;
  senderName: string;
  message: string;
  createdAt: string;
  acknowledgedAt: string | null;
}

export type TrackerKind = 'weight' | 'blood_pressure' | 'glucose' | 'lab' | 'symptom';

export interface WeightRecord {
  id: string;
  weightKg: number;
  recordedAt: string;
  note?: string;
}

export interface BloodPressureRecord {
  id: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  symptoms?: string[];
  recordedAt: string;
  note?: string;
}

export interface GlucoseRecord {
  id: string;
  valueMgDl: number;
  context: 'fasting' | 'before_meal' | 'after_meal' | 'random' | 'other';
  minutesAfterMeal?: number;
  recordedAt: string;
  note?: string;
}

export interface LabRecord {
  id: string;
  testName: string;
  resultValue: string;
  unit?: string;
  referenceRange?: string;
  testedOn: string;
  note?: string;
}

export interface SymptomRecord {
  id: string;
  symptom: string;
  severity: number; // 1 to 5
  durationMinutes?: number;
  contactedCare: boolean;
  startedAt: string;
  note?: string;
}

export interface HealthTrackerData {
  weights: WeightRecord[];
  bloodPressures: BloodPressureRecord[];
  glucoses: GlucoseRecord[];
  labs: LabRecord[];
  symptoms: SymptomRecord[];
}

export interface TimelineMilestone {
  id: string;
  week: number;
  title: string;
  category: 'checkup' | 'scan' | 'lab' | 'milestone';
  description: string;
  isCompleted: boolean;
  dateScheduled?: string;
  clinicianNotes?: string;
}

export interface HealthProfile {
  bloodType: string;
  rhFactor: 'positive' | 'negative' | 'unknown';
  allergies: string[];
  dietaryPattern: 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian';
  preexistingConditions: string[];
  pregnancyConditions: string[];
  currentMedications: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  obstetricianName: string;
  hospitalName: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  category?: string;
}

export type NotificationCategory = 'medicine' | 'hydration' | 'partner' | 'clinical' | 'milestone' | 'general';

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  timestamp: string;
  isRead: boolean;
  actionLabel?: string;
  actionType?: 'toggle-reminder' | 'open-tab' | 'quick-nudge' | 'dismiss';
  actionData?: {
    tabId?: TabId;
    reminderId?: string;
    nudgeText?: string;
  };
  urgency?: 'low' | 'normal' | 'high';
}

export interface NotificationSettings {
  pushEnabled: boolean;
  inAppBannerEnabled: boolean;
  soundEnabled: boolean;
  medicineAlarms: boolean;
  hydrationReminders: boolean;
  partnerNudges: boolean;
  clinicalMilestones: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // e.g. "22:00"
  quietHoursEnd: string;   // e.g. "07:00"
}
