import { NativeModules, Platform } from 'react-native';

import { encryptedLocalStorage } from '@/lib/encryptedLocalStorage';

const WIDGET_STATE_KEY = 'janani:widget-state:v1';
const widgetBridge = NativeModules.JananiWidget as {
  update?: (state: Record<string, string>) => Promise<void>;
} | undefined;

const PRIVATE_WIDGET_CLEARED_STATE = {
  week_label: 'Janani',
  family_label: 'Sign in or link a family',
  next_reminder: 'Your care details are private',
  partner_message: 'Open Janani',
};

export type JananiWidgetState = {
  familyName: string;
  role: 'mother' | 'partner';
  pregnancyWeek: number | null;
  nextReminderTitle: string | null;
  nextReminderTime: string | null;
  partnerMessage: string | null;
  updatedAt: string;
};

export async function saveWidgetState(state: JananiWidgetState): Promise<void> {
  await encryptedLocalStorage.setItem(WIDGET_STATE_KEY, JSON.stringify(state));
}

export async function readWidgetState(): Promise<JananiWidgetState | null> {
  try {
    const raw = await encryptedLocalStorage.getItem(WIDGET_STATE_KEY);
    return raw ? (JSON.parse(raw) as JananiWidgetState) : null;
  } catch {
    return null;
  }
}

export async function clearWidgetState(): Promise<void> {
  await encryptedLocalStorage.removeItem(WIDGET_STATE_KEY);
}

export function canUpdateNativeWidget(): boolean {
  return Platform.OS === 'android' && Boolean(widgetBridge?.update);
}

export async function updateNativeWidget(state: Record<string, string>): Promise<void> {
  if (!canUpdateNativeWidget() || !widgetBridge?.update) return;
  await widgetBridge.update(state);
}

export async function clearPrivateWidgetContent(): Promise<void> {
  await Promise.allSettled([
    clearWidgetState(),
    updateNativeWidget(PRIVATE_WIDGET_CLEARED_STATE),
  ]);
}

export const widgetActions = {
  openReminders: 'janani://reminders',
  openThinkingOfYou: 'janani://thinking-of-you',
  sendThinkingOfYou: 'janani://thinking-of-you?action=send',
} as const;
