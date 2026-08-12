export type DailyReminderKind = 'medication' | 'appointment' | 'hydration' | 'nutrition' | 'custom';
export type DailyReminderState = 'pending' | 'taken' | 'skipped' | 'missed';

export type DailyReminder = {
  id: string;
  title: string;
  kind: DailyReminderKind;
  local_time: string;
  is_active: boolean;
};

export type DailyReminderLog = {
  reminder_id: string;
  state: DailyReminderState;
};

export type DailyPriority = {
  reminder: DailyReminder;
  state: DailyReminderState;
  timing: 'overdue' | 'now' | 'upcoming';
};

export type DailyCareSnapshot = {
  total: number;
  taken: number;
  skipped: number;
  missed: number;
  remaining: number;
  priority: DailyPriority | null;
};

function minutesFromLocalTime(localTime: string): number {
  const [hour = 0, minute = 0] = localTime.split(':').map(Number);
  return hour * 60 + minute;
}

function minutesNow(now: Date): number {
  return now.getHours() * 60 + now.getMinutes();
}

export function buildDailyCareSnapshot(
  reminders: DailyReminder[],
  logs: DailyReminderLog[],
  now = new Date(),
): DailyCareSnapshot {
  const active = reminders.filter((reminder) => reminder.is_active);
  const states = new Map(logs.map((log) => [log.reminder_id, log.state]));
  const stateFor = (id: string): DailyReminderState => states.get(id) ?? 'pending';

  const taken = active.filter((reminder) => stateFor(reminder.id) === 'taken').length;
  const skipped = active.filter((reminder) => stateFor(reminder.id) === 'skipped').length;
  const missed = active.filter((reminder) => stateFor(reminder.id) === 'missed').length;
  const unresolved = active
    .filter((reminder) => !['taken', 'skipped'].includes(stateFor(reminder.id)))
    .sort((a, b) => minutesFromLocalTime(a.local_time) - minutesFromLocalTime(b.local_time));

  const currentMinutes = minutesNow(now);
  const overdue = unresolved.filter((reminder) => minutesFromLocalTime(reminder.local_time) < currentMinutes - 30);
  const currentOrUpcoming = unresolved.filter((reminder) => minutesFromLocalTime(reminder.local_time) >= currentMinutes - 30);
  const nextReminder = overdue[0] ?? currentOrUpcoming[0] ?? null;

  let priority: DailyPriority | null = null;
  if (nextReminder) {
    const reminderMinutes = minutesFromLocalTime(nextReminder.local_time);
    const difference = reminderMinutes - currentMinutes;
    const timing: DailyPriority['timing'] = difference < -30
      ? 'overdue'
      : Math.abs(difference) <= 30
        ? 'now'
        : 'upcoming';
    priority = {
      reminder: nextReminder,
      state: stateFor(nextReminder.id),
      timing,
    };
  }

  return {
    total: active.length,
    taken,
    skipped,
    missed,
    remaining: unresolved.length,
    priority,
  };
}

export function formatReminderTime(localTime: string): string {
  const [hour = 0, minute = 0] = localTime.split(':').map(Number);
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function priorityTimingLabel(priority: DailyPriority): string {
  const time = formatReminderTime(priority.reminder.local_time);
  if (priority.state === 'missed') return `Missed · ${time}`;
  if (priority.timing === 'overdue') return `Earlier today · ${time}`;
  if (priority.timing === 'now') return `Around now · ${time}`;
  return `Next at ${time}`;
}

export function greetingForNow(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
