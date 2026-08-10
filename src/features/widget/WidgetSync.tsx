import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { getPregnancyProgress } from '@/features/pregnancy/progress';
import { canUpdateNativeWidget, clearPrivateWidgetContent, updateNativeWidget } from '@/features/widget/widgetState';
import { uiTranslationLanguageFor } from '@/i18n/localeRegistry';
import { systemCopy } from '@/i18n/systemSurfaces';
import { readGlobalUiLocale } from '@/i18n/uiLocale';
import { toLocalDate } from '@/lib/date';
import { supabase } from '@/lib/supabase';
import { useMembership } from '@/providers/AuthGate';
import { useAuth } from '@/providers/AuthProvider';

export function WidgetSync() {
  const { session } = useAuth();
  const { familyId, onFamilyInvalidation } = useMembership();
  const syncGeneration = useRef(0);
  useEffect(() => {
    const generation = ++syncGeneration.current;
    if (!session) { void clearPrivateWidgetContent(); return; }
    if (!familyId || !canUpdateNativeWidget()) return;
    const userId=session.user.id; let disposed=false,running=false,rerunRequested=false;
    const current=()=>!disposed&&syncGeneration.current===generation;
    async function performSync(){
      const locale=await readGlobalUiLocale();
      const localized=systemCopy(uiTranslationLanguageFor(locale));
      const membership=await supabase.from('family_members').select('role,families(name,pregnancies(due_date,status))').eq('user_id',userId).maybeSingle(); if(!current())return;
      const family=Array.isArray(membership.data?.families)?membership.data?.families[0]:membership.data?.families;
      const ps=family?.pregnancies; const list=Array.isArray(ps)?ps:ps?[ps]:[]; const pregnancy=list.find((x)=>x.status==='active')??list[0]; const progress=pregnancy?.due_date?getPregnancyProgress(pregnancy.due_date):null;
      const date=toLocalDate();
      const reminders=await supabase.from('reminders').select('id,title,kind,local_time,days_of_week').eq('is_active',true).lte('start_date',date).or(`end_date.is.null,end_date.gte.${date}`).order('local_time').limit(50); if(!current())return;
      const now=new Date(),time=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      const valid=(x:any)=>(x.days_of_week.length===0||x.days_of_week.includes(now.getDay()))&&x.local_time.slice(0,5)>=time;
      const next=reminders.data?.find(valid); const med=reminders.data?.find((x:any)=>x.kind==='medication'&&valid(x)); const appt=reminders.data?.find((x:any)=>x.kind==='appointment'&&valid(x));
      const nudge=await supabase.from('partner_nudges').select('id').neq('sender_id',userId).order('created_at',{ascending:false}).limit(1).maybeSingle(); if(!current())return;
      const week=progress?.gestationalWeek??0;
      const babyMessages=localized.babyMessages;
      const wellnessMessages=localized.wellnessMessages;
      await updateNativeWidget({
        week_label:progress?`${localized.week} ${week} · ${progress.gestationalDay} ${localized.days}`:'Janani', family_label:family?.name??localized.familyFallback,
        next_reminder:next?`${next.title} · ${next.local_time.slice(0,5)}`:localized.upcomingReminders,
        next_medicine:med?`${med.title} · ${med.local_time.slice(0,5)}`:localized.noMedicine,
        next_appointment:appt?`${appt.title} · ${appt.local_time.slice(0,5)}`:localized.noAppointment,
        partner_message:nudge.data?localized.partnerWaiting:localized.sendWarmth,
        baby_message:babyMessages[week%babyMessages.length], wellness_message:wellnessMessages[week%wellnessMessages.length],
        daily_message:progress?localized.dailyJourney(week):localized.openJourney,
        widget_today_title:localized.widgetTodayTitle,
        widget_medicine_title:localized.widgetMedicineTitle,
        widget_love_title:localized.widgetLoveTitle,
        widget_appointment_title:localized.widgetAppointmentTitle,
        widget_wellness_title:localized.widgetWellnessTitle,
        widget_care_fallback:localized.widgetCareFallback,
        widget_medicine_fallback:localized.widgetMedicineFallback,
        widget_appointment_fallback:localized.widgetAppointmentFallback,
        widget_baby_fallback:localized.widgetBabyFallback,
        widget_wellness_fallback:localized.widgetWellnessFallback,
      });
    }
    async function sync(){if(disposed)return;if(running){rerunRequested=true;return;}running=true;try{do{rerunRequested=false;await performSync();}while(rerunRequested&&!disposed);}catch{}finally{running=false;if(rerunRequested&&!disposed)void sync();}}
    void sync(); const appState=AppState.addEventListener('change',(s)=>{if(s==='active')void sync();}); const stop=onFamilyInvalidation(['families','pregnancies','reminders','partner_nudges'],()=>void sync());
    return()=>{disposed=true;appState.remove();stop();};
  },[familyId,onFamilyInvalidation,session]);
  return null;
}
