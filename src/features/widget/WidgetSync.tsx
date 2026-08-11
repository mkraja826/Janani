import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { getPregnancyProgress } from '@/features/pregnancy/progress';
import { getPregnancyWeekContent } from '@/features/pregnancy/weekContent';
import { canUpdateNativeWidget, clearPrivateWidgetContent, updateNativeWidget } from '@/features/widget/widgetState';
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
      const weekContent=progress?getPregnancyWeekContent(week):null;
      await updateNativeWidget({
        week_label:progress?`Week ${week} · ${progress.gestationalDay} days`:'Janani', family_label:family?.name??'Our little family',
        next_reminder:next?`${next.title} · ${next.local_time.slice(0,5)}`:'Open Janani for upcoming reminders',
        next_medicine:med?`${med.title} · ${med.local_time.slice(0,5)}`:'No medicine due soon',
        next_appointment:appt?`${appt.title} · ${appt.local_time.slice(0,5)}`:'No appointment scheduled',
        partner_message:nudge.data?'A little heart from your partner is waiting 💗':'Send a little warmth 💗',
        baby_message:weekContent?.widgetBabyMessage??'Open Janani for this week’s pregnancy journey.', wellness_message:weekContent?.widgetWellnessMessage??'Open Janani for daily wellness.',
        daily_message:weekContent?.dailyGentleMessage??'Open Janani for your pregnancy journey.',
      });
    }
    async function sync(){if(disposed)return;if(running){rerunRequested=true;return;}running=true;try{do{rerunRequested=false;await performSync();}while(rerunRequested&&!disposed);}catch{}finally{running=false;if(rerunRequested&&!disposed)void sync();}}
    void sync(); const appState=AppState.addEventListener('change',(s)=>{if(s==='active')void sync();}); const stop=onFamilyInvalidation(['families','pregnancies','reminders','partner_nudges'],()=>void sync());
    return()=>{disposed=true;appState.remove();stop();};
  },[familyId,onFamilyInvalidation,session]);
  return null;
}
