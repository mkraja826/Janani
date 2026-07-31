const DAY_MS = 24 * 60 * 60 * 1000;

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export type PregnancyProgress = {
  gestationalWeek: number;
  gestationalDay: number;
  trimester: 1 | 2 | 3;
  daysRemaining: number;
  isPastDue: boolean;
};

export function getPregnancyProgress(dueDate: string, now = new Date()): PregnancyProgress {
  const due = parseDateOnly(dueDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysRemaining = Math.ceil((due.getTime() - today.getTime()) / DAY_MS);
  const elapsedDays = Math.max(0, 280 - daysRemaining);
  const gestationalWeek = Math.min(42, Math.floor(elapsedDays / 7));
  const gestationalDay = elapsedDays % 7;
  const trimester: 1 | 2 | 3 = gestationalWeek < 14 ? 1 : gestationalWeek < 28 ? 2 : 3;

  return {
    gestationalWeek,
    gestationalDay,
    trimester,
    daysRemaining: Math.max(0, daysRemaining),
    isPastDue: daysRemaining < 0,
  };
}

export function trimesterLabel(trimester: 1 | 2 | 3): string {
  return trimester === 1 ? 'First trimester' : trimester === 2 ? 'Second trimester' : 'Third trimester';
}
