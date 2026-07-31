import AsyncStorage from '@react-native-async-storage/async-storage';

const WIDGET_STATE_KEY = 'janani:widget-state:v1';

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
  await AsyncStorage.setItem(WIDGET_STATE_KEY, JSON.stringify(state));
}

export async function readWidgetState(): Promise<JananiWidgetState | null> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_STATE_KEY);
    return raw ? (JSON.parse(raw) as JananiWidgetState) : null;
  } catch {
    return null;
  }
}

export const widgetActions = {
  openReminders: 'janani://reminders',
  openThinkingOfYou: 'janani://thinking-of-you',
  sendThinkingOfYou: 'janani://thinking-of-you?action=send',
} as const;
