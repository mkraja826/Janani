import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  CARE_REMINDER_CHANNEL_ID,
  MEDICATION_ALARM_CHANNEL_ID,
  prepareJananiNotificationChannels,
} from '@/features/notifications/channels';
import { toLocalDate } from '@/lib/date';
import { encryptedLocalStorage } from '@/lib/encryptedLocalStorage';

export const REMINDER_CHANNEL_ID = CARE_REMINDER_CHANNEL_ID;
const REGISTRY_PREFIX = 'janani:reminder-notifications:v2:';
const LEGACY_CLEANUP_KEY = 'janani:reminder-notifications:v2:migrated';
const REFRESH_THRESHOLD_DAYS = 7;
const scheduleLocks = new Map<string, Promise<unknown>>();
let legacyMigration: Promise<void> | null = null;

export type ReminderKind = 'medication' | 'appointment' | 'hydration' | 'nutrition' | 'custom';

export type ReminderScheduleInput = {
  id: string;
  title: string;
  instructions: string | null;
  kind: ReminderKind;
  localTime: string;
  startDate: string;
  endDate: string | null;
  daysOfWeek: number[];
};

type StoredSchedule = {
  identifiers: string[];
  signature: string;
  scheduledThrough: string;
};

type ScheduleRegistry = Record<string, StoredSchedule>;

export class NotificationPermissionError extends Error {
  constructor() {
    super('Notification permission is not enabled.');
    this.name = 'NotificationPermissionError';
  }
}

function registryKey(userId: string) {
  return `${REGISTRY_PREFIX}${userId}`;
}

function runScheduleExclusive<T>(userId: string, operation: () => Promise<T>): Promise<T> {
  const previous = scheduleLocks.get(userId) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(operation);
  scheduleLocks.set(userId, current);
  void current.finally(() => {
    if (scheduleLocks.get(userId) === current) scheduleLocks.delete(userId);
  }).catch(() => undefined);
  return current;
}

async function readRegistry(userId: string): Promise<ScheduleRegistry> {
  try {
    const raw = await encryptedLocalStorage.getItem(registryKey(userId));
    return raw ? (JSON.parse(raw) as ScheduleRegistry) : {};
  } catch {
    return {};
  }
}

async function writeRegistry(userId: string, registry: ScheduleRegistry) {
  await encryptedLocalStorage.setItem(registryKey(userId), JSON.stringify(registry));
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function scheduleSignature(input: ReminderScheduleInput) {
  return JSON.stringify({
    title: input.title,
    instructions: input.instructions,
    kind: input.kind,
    localTime: input.localTime.slice(0, 5),
    startDate: input.startDate,
    endDate: input.endDate,
    daysOfWeek: [...input.daysOfWeek].sort(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    utcOffsetMinutes: new Date().getTimezoneOffset(),
  });
}

async function cancelIdentifiers(identifiers: string[]) {
  await Promise.all(
    identifiers.map((identifier) =>
      Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined),
    ),
  );
}

export async function prepareReminderNotifications(): Promise<void> {
  await prepareJananiNotificationChannels();

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return;
  const requested = await Notifications.requestPermissionsAsync();
  if (!requested.granted) throw new NotificationPermissionError();
}

export async function migrateLegacyReminderNotifications(): Promise<void> {
  if (!legacyMigration) {
    legacyMigration = (async () => {
      const migrated = await AsyncStorage.getItem(LEGACY_CLEANUP_KEY);
      if (migrated) return;
      await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
      await AsyncStorage.setItem(LEGACY_CLEANUP_KEY, new Date().toISOString());
    })().catch((error) => {
      legacyMigration = null;
      throw error;
    });
  }
  await legacyMigration;
}

export async function scheduleReminderNotifications(
  userId: string,
  input: ReminderScheduleInput,
): Promise<number> {
  return runScheduleExclusive(userId, () => scheduleReminderNotificationsUnlocked(userId, input));
}

async function scheduleReminderNotificationsUnlocked(
  userId: string,
  input: ReminderScheduleInput,
): Promise<number> {
  await migrateLegacyReminderNotifications();
  await prepareReminderNotifications();

  const registry = await readRegistry(userId);
  const current = registry[input.id];
  const signature = scheduleSignature(input);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const refreshThreshold = toLocalDate(addDays(today, REFRESH_THRESHOLD_DAYS));
  const scheduledRequests = await Notifications.getAllScheduledNotificationsAsync()
    .catch(() => [] as Notifications.NotificationRequest[]);
  const scheduledIdentifiers = new Set(scheduledRequests.map((request) => request.identifier));

  if (
    current?.signature === signature
    && current.scheduledThrough >= refreshThreshold
    && current.identifiers.every((identifier) => scheduledIdentifiers.has(identifier))
  ) {
    return current.identifiers.length;
  }

  if (current) await cancelIdentifiers(current.identifiers);

  const start = parseDateOnly(input.startDate);
  const horizonDays = Platform.OS === 'ios' ? 14 : 60;
  const end = input.endDate ? parseDateOnly(input.endDate) : addDays(today, horizonDays - 1);
  const horizonEnd = addDays(today, horizonDays - 1);
  const finalDate = end < horizonEnd ? end : horizonEnd;
  const cursor = start > today ? new Date(start) : new Date(today);
  const [hour, minute] = input.localTime.split(':').map(Number);
  if (
    Number.isNaN(start.getTime())
    || Number.isNaN(finalDate.getTime())
    || !Number.isInteger(hour)
    || !Number.isInteger(minute)
    || hour < 0
    || hour > 23
    || minute < 0
    || minute > 59
  ) {
    throw new Error('Reminder schedule contains an invalid date or time.');
  }
  const weekdays = input.daysOfWeek.length ? new Set(input.daysOfWeek) : new Set([0, 1, 2, 3, 4, 5, 6]);
  const identifiers: string[] = [];
  const pendingAfterCancel = current
    ? scheduledRequests.filter((request) => !current.identifiers.includes(request.identifier)).length
    : scheduledRequests.length;
  const availableSlots = Platform.OS === 'ios'
    ? Math.max(0, 60 - pendingAfterCancel)
    : Number.POSITIVE_INFINITY;
  let processedThrough = addDays(cursor, -1);
  const medication = input.kind === 'medication';

  try {
    while (cursor <= finalDate && identifiers.length < availableSlots) {
      const delivery = new Date(cursor);
      delivery.setHours(hour, minute, 0, 0);
      if (weekdays.has(delivery.getDay()) && delivery.getTime() > Date.now()) {
        const identifier = await Notifications.scheduleNotificationAsync({
          content: {
            title: medication ? '💊 Medicine time' : 'A gentle Janani reminder',
            body: medication
              ? 'It’s time for your scheduled medicine. Open Janani to view the private reminder.'
              : 'Open Janani to view today’s private care reminder.',
            sound: 'default',
            priority: medication
              ? Notifications.AndroidNotificationPriority.MAX
              : Notifications.AndroidNotificationPriority.HIGH,
            data: {
              kind: medication ? 'janani-medication-alarm' : 'janani-reminder',
              reminderKind: input.kind,
              ownerUserId: userId,
              screen: '/reminders',
              reminderId: input.id,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: delivery,
            channelId: Platform.OS === 'android'
              ? medication ? MEDICATION_ALARM_CHANNEL_ID : CARE_REMINDER_CHANNEL_ID
              : undefined,
          },
        });
        identifiers.push(identifier);
      }
      processedThrough = new Date(cursor);
      cursor.setDate(cursor.getDate() + 1);
    }
    registry[input.id] = {
      identifiers,
      signature,
      scheduledThrough: toLocalDate(processedThrough),
    };
    await writeRegistry(userId, registry);
  } catch (error) {
    await cancelIdentifiers(identifiers);
    throw error;
  }

  return identifiers.length;
}

export async function cancelReminderNotifications(userId: string, reminderId: string): Promise<void> {
  await runScheduleExclusive(userId, async () => {
    const registry = await readRegistry(userId);
    const current = registry[reminderId];
    if (!current) return;
    await cancelIdentifiers(current.identifiers);
    delete registry[reminderId];
    await writeRegistry(userId, registry);
  });
}

export async function cancelStaleReminderNotifications(
  userId: string,
  activeReminderIds: Set<string>,
): Promise<void> {
  await runScheduleExclusive(userId, async () => {
    const registry = await readRegistry(userId);
    const staleIds = Object.keys(registry).filter((id) => !activeReminderIds.has(id));
    for (const id of staleIds) {
      await cancelIdentifiers(registry[id].identifiers);
      delete registry[id];
    }
    const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
    const orphaned = scheduled.filter((request) => {
      const data = request.content.data;
      return (data?.kind === 'janani-reminder' || data?.kind === 'janani-medication-alarm')
        && data.ownerUserId === userId
        && typeof data.reminderId === 'string'
        && !activeReminderIds.has(data.reminderId);
    });
    await cancelIdentifiers(orphaned.map((request) => request.identifier));
    if (staleIds.length) await writeRegistry(userId, registry);
  });
}

export async function cancelAllUserReminderNotifications(userId: string): Promise<void> {
  await runScheduleExclusive(userId, async () => {
    const registry = await readRegistry(userId);
    const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
    const ownedOrphans = scheduled.filter((request) => {
      const data = request.content.data;
      return (data?.kind === 'janani-reminder' || data?.kind === 'janani-medication-alarm')
        && data.ownerUserId === userId;
    });
    await cancelIdentifiers([
      ...Object.values(registry).flatMap((item) => item.identifiers),
      ...ownedOrphans.map((request) => request.identifier),
    ]);
    await encryptedLocalStorage.removeItem(registryKey(userId));
  });
}
