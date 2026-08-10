import { NativeModules, Platform } from 'react-native';
import { encryptedLocalStorage } from '@/lib/encryptedLocalStorage';
const WIDGET_STATE_KEY='janani:widget-state:v1';
const widgetBridge=NativeModules.JananiWidget as {update?:(state:Record<string,string>)=>Promise<void>}|undefined;
const PRIVATE_WIDGET_CLEARED_STATE={week_label:'Janani',family_label:'Sign in or link a family',next_reminder:'Your care details are private',next_medicine:'Open Janani to view medicines',next_appointment:'Open Janani to view appointments',partner_message:'Open Janani',baby_message:'Your pregnancy journey stays private',wellness_message:'Open Janani for daily wellness',daily_message:'Your care details are private'};
export type JananiWidgetState={familyName:string;role:'mother'|'partner';pregnancyWeek:number|null;nextReminderTitle:string|null;nextReminderTime:string|null;partnerMessage:string|null;updatedAt:string};
export async function saveWidgetState(state:JananiWidgetState){await encryptedLocalStorage.setItem(WIDGET_STATE_KEY,JSON.stringify(state));}
export async function readWidgetState():Promise<JananiWidgetState|null>{try{const raw=await encryptedLocalStorage.getItem(WIDGET_STATE_KEY);return raw?JSON.parse(raw) as JananiWidgetState:null;}catch{return null;}}
export async function clearWidgetState(){await encryptedLocalStorage.removeItem(WIDGET_STATE_KEY);}
export function canUpdateNativeWidget(){return Platform.OS==='android'&&Boolean(widgetBridge?.update);}
export async function updateNativeWidget(state:Record<string,string>){if(!canUpdateNativeWidget()||!widgetBridge?.update)return;await widgetBridge.update(state);}
export async function clearPrivateWidgetContent(){await Promise.allSettled([clearWidgetState(),updateNativeWidget(PRIVATE_WIDGET_CLEARED_STATE)]);}
export const widgetActions={openReminders:'janani://reminders',openThinkingOfYou:'janani://thinking-of-you',sendThinkingOfYou:'janani://thinking-of-you?action=send',openPregnancyGuide:'janani://pregnancy-guide',openFoodGuide:'janani://food-guide'} as const;
