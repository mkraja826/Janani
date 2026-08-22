import React from 'react';
import { 
  Heart, 
  Baby, 
  Sparkles, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle, 
  ArrowRight,
  ShieldCheck,
  Apple,
  Activity,
  BookOpen,
  Send,
  Bell
} from 'lucide-react';
import { 
  UserProfile, 
  Reminder, 
  JournalEntry, 
  PartnerNudge,
  TabId 
} from '../types';
import { calculatePregnancyProgress, getWeekDetail } from '../utils/pregnancy';
import { getTranslations } from '../utils/i18n';

interface HomeTabProps {
  user: UserProfile;
  reminders: Reminder[];
  journalEntries: JournalEntry[];
  nudges: PartnerNudge[];
  onSelectTab: (tab: TabId) => void;
  onToggleReminder: (id: string) => void;
  onSendQuickNudge: (text: string) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  user,
  reminders,
  journalEntries,
  nudges,
  onSelectTab,
  onToggleReminder,
  onSendQuickNudge,
}) => {
  const t = getTranslations(user.language);
  const progress = calculatePregnancyProgress(user.dueDate);
  const weekInfo = getWeekDetail(progress.gestationalWeek);

  const pendingReminders = reminders.filter((r) => r.isActive && r.stateToday === 'pending');
  const completedReminders = reminders.filter((r) => r.isActive && r.stateToday === 'taken');
  const latestNudge = nudges[nudges.length - 1];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Welcome Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#FFF5F2] via-[#FFFDFB] to-[#FCEFEA] border border-[#EBD6CF] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#9F4F52] uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.todayWithJanani}</span>
            </div>
            
            <h1 className="font-serif text-3xl sm:text-4xl text-[#2E2020] font-bold leading-tight">
              {user.role === 'mother' ? t.homeGreetingMother : t.homeGreetingPartner}
            </h1>
            
            <p className="text-sm sm:text-base text-[#6B5558] leading-relaxed">
              {user.role === 'mother' 
                ? `You and your baby are in Week ${progress.gestationalWeek}, Day ${progress.gestationalDay}. Keep nurturing your body with gentle care.`
                : `Ananya and baby are at Week ${progress.gestationalWeek} (${progress.trimester === 3 ? '3rd Trimester' : progress.trimester === 2 ? '2nd Trimester' : '1st Trimester'}). Rohan, here is how you can support today.`
              }
            </p>
          </div>

          {/* Trimester Badge & Countdown Pill */}
          <div className="flex flex-row lg:flex-col items-center lg:items-end gap-3 w-full lg:w-auto">
            <div className="px-4 py-2.5 rounded-2xl bg-[#9F4F52] text-white shadow-sm flex items-center gap-2 text-xs sm:text-sm font-semibold">
              <Calendar className="w-4 h-4" />
              <span>
                {progress.trimester === 1 && t.firstTrimester}
                {progress.trimester === 2 && t.secondTrimester}
                {progress.trimester === 3 && t.thirdTrimester}
              </span>
            </div>
            
            <div className="px-3.5 py-1.5 rounded-xl bg-[#FAF0EB] text-[#784448] border border-[#E8D1CB] text-xs font-medium">
              <strong>{progress.daysRemaining}</strong> {t.daysUntilDue}
            </div>
          </div>

        </div>

        {/* Progress Bar & Week Overview Card */}
        <div className="mt-8 pt-6 border-t border-[#EBD6CF]/80 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Baby Fruit Comparison */}
          <div 
            onClick={() => onSelectTab('pregnancy-guide')}
            className="flex items-center gap-4 p-4 rounded-2xl bg-[#FFFFFF] border border-[#EADBCE] hover:border-[#9F4F52] transition-colors cursor-pointer group shadow-2xs"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#FFF0ED] text-[#9F4F52] flex items-center justify-center font-serif text-2xl group-hover:scale-105 transition-transform">
              👶
            </div>
            <div>
              <div className="text-xs text-[#8A7174] font-medium">Baby size this week</div>
              <div className="text-lg font-bold text-[#2E2020]">{weekInfo.sizeFruit}</div>
              <div className="text-xs text-[#9F4F52] font-semibold flex items-center gap-1 mt-0.5">
                <span>View development</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>

          {/* Gestational Metrics */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-[#543F42]">
              <span>Progress to Due Date ({user.dueDate})</span>
              <span>{progress.progressPercent}%</span>
            </div>
            <div className="h-3 w-full bg-[#EFE3DE] rounded-full overflow-hidden p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-[#D97D81] to-[#9F4F52] rounded-full transition-all duration-500"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#8A7174]">
              <span>Week 1 (Conception)</span>
              <span>Week 40 (Full Term)</span>
            </div>
          </div>

          {/* Partner Tip of the Day */}
          <div className="p-4 rounded-2xl bg-[#FAF6F2] border border-[#E6D7CD] text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#4E7D63]">
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Partner Support Tip (Week {progress.gestationalWeek})</span>
            </div>
            <p className="text-[#594749] leading-relaxed line-clamp-2">
              "{weekInfo.partnerSupportTip}"
            </p>
          </div>

        </div>
      </div>

      {/* Main Grid: Reminders & Quick Care Connection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Today's Daily Care Reminders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#9F4F52]" />
              <h2 className="text-xl font-serif font-bold text-[#2E2020]">
                {t.reminders}
              </h2>
            </div>
            <button
              onClick={() => onSelectTab('reminders')}
              className="text-xs font-semibold text-[#9F4F52] hover:text-[#713B44] flex items-center gap-1"
            >
              <span>Manage all ({reminders.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#EAD7D2] p-5 shadow-2xs divide-y divide-[#F2E5E1]">
            {reminders.length === 0 ? (
              <div className="text-center py-6 text-sm text-[#7D686B]">
                No reminders scheduled for today.
              </div>
            ) : (
              reminders.map((reminder) => {
                const isTaken = reminder.stateToday === 'taken';
                return (
                  <div key={reminder.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                    <button
                      onClick={() => onToggleReminder(reminder.id)}
                      className="mt-0.5 flex-shrink-0 cursor-pointer text-[#9F4F52] hover:scale-110 transition-transform"
                    >
                      {isTaken ? (
                        <CheckCircle2 className="w-5 h-5 text-[#3E8E5A] fill-[#EAF6ED]" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#B89B9E]" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${isTaken ? 'line-through text-[#8F7C7E]' : 'text-[#2E2020]'}`}>
                          {reminder.title}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FAF0EB] text-[#7A4448]">
                          {reminder.localTime}
                        </span>
                      </div>
                      {reminder.instructions && (
                        <p className="text-xs text-[#735D60] mt-0.5 line-clamp-1">
                          {reminder.instructions}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => onToggleReminder(reminder.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        isTaken 
                          ? 'bg-[#EAF6ED] text-[#246A3C]' 
                          : 'bg-[#F9ECE8] text-[#842D33] hover:bg-[#F2DFDA]'
                      }`}
                    >
                      {isTaken ? t.taken : t.markTaken}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Care Tools Navigation Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            
            <button
              onClick={() => onSelectTab('pregnancy-guide')}
              className="p-4 rounded-2xl bg-white border border-[#EADBCE] hover:border-[#9F4F52] hover:shadow-xs transition-all text-left flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-xl bg-[#FFF0ED] text-[#9F4F52] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Baby className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#2E2020]">Week Guide</div>
                <div className="text-[11px] text-[#7A6466]">Week {progress.gestationalWeek} insights</div>
              </div>
            </button>

            <button
              onClick={() => onSelectTab('food-guide')}
              className="p-4 rounded-2xl bg-white border border-[#EADBCE] hover:border-[#9F4F52] hover:shadow-xs transition-all text-left flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-xl bg-[#EDF7F1] text-[#3E8E5A] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Apple className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#2E2020]">Food & Safety</div>
                <div className="text-[11px] text-[#7A6466]">Safe foods list</div>
              </div>
            </button>

            <button
              onClick={() => onSelectTab('health-tracker')}
              className="p-4 rounded-2xl bg-white border border-[#EADBCE] hover:border-[#9F4F52] hover:shadow-xs transition-all text-left flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-xl bg-[#F0F4FA] text-[#2C62B0] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#2E2020]">Health Vitals</div>
                <div className="text-[11px] text-[#7A6466]">BP, glucose, weight</div>
              </div>
            </button>

            <button
              onClick={() => onSelectTab('journal')}
              className="p-4 rounded-2xl bg-white border border-[#EADBCE] hover:border-[#9F4F52] hover:shadow-xs transition-all text-left flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-xl bg-[#FAF0F8] text-[#9A3B7E] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#2E2020]">Journal</div>
                <div className="text-[11px] text-[#7A6466]">Thoughts & kicks</div>
              </div>
            </button>

          </div>
        </div>

        {/* Right 1 Col: Thinking of You & Warmth Box */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#9F4F52] fill-current" />
              <h2 className="text-xl font-serif font-bold text-[#2E2020]">
                {t.thinkingOfYou}
              </h2>
            </div>
            <button
              onClick={() => onSelectTab('thinking-of-you')}
              className="text-xs font-semibold text-[#9F4F52] hover:text-[#713B44]"
            >
              Open space
            </button>
          </div>

          <div className="bg-gradient-to-b from-[#FFFDFB] to-[#FFF5F2] rounded-2xl border border-[#EAD7D2] p-5 shadow-2xs space-y-4">
            
            {/* Last Nudge Received */}
            {latestNudge && (
              <div className="p-3.5 rounded-xl bg-white border border-[#EFE0DC] shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#846B6E]">
                  <span className="font-semibold text-[#9F4F52]">
                    {latestNudge.senderName} ({latestNudge.senderRole})
                  </span>
                  <span>{new Date(latestNudge.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-xs text-[#3A292B] leading-relaxed font-medium">
                  "{latestNudge.message}"
                </p>
              </div>
            )}

            {/* Quick Nudge Buttons */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#635052]">
                Send a quick gentle tap:
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => onSendQuickNudge('Thinking of you and our little one right now ❤️')}
                  className="w-full text-left px-3 py-2 rounded-xl bg-white hover:bg-[#FAF0EC] border border-[#EADDD9] text-xs text-[#4F3D40] transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <span>Thinking of you right now ❤️</span>
                  <Send className="w-3 h-3 text-[#9F4F52] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <button
                  onClick={() => onSendQuickNudge('Take a deep breath and a sip of water with me 💧')}
                  className="w-full text-left px-3 py-2 rounded-xl bg-white hover:bg-[#FAF0EC] border border-[#EADDD9] text-xs text-[#4F3D40] transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <span>Take a sip of water with me 💧</span>
                  <Send className="w-3 h-3 text-[#9F4F52] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <button
                  onClick={() => onSendQuickNudge('So proud of you today! Resting with you in spirit ✨')}
                  className="w-full text-left px-3 py-2 rounded-xl bg-white hover:bg-[#FAF0EC] border border-[#EADDD9] text-xs text-[#4F3D40] transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <span>So proud of you today ✨</span>
                  <Send className="w-3 h-3 text-[#9F4F52] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>

            {/* Ask AI Card */}
            <div className="pt-3 border-t border-[#EEDCD6] space-y-2">
              <button
                onClick={() => onSelectTab('ai-companion')}
                className="w-full p-3 rounded-xl bg-gradient-to-r from-[#9F4F52] to-[#B85C67] text-white flex items-center justify-between text-xs font-semibold shadow-xs hover:opacity-95 transition-opacity cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FDEBE8]" />
                  <span>{t.askCarePlus}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#FDEBE8]" />
              </button>

              <button
                onClick={() => onSelectTab('widgets')}
                className="w-full p-2.5 rounded-xl bg-[#FAF0EB] hover:bg-[#F5E2DB] border border-[#EACEC8] text-[#842D33] flex items-center justify-between text-xs font-semibold transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span>📱</span>
                  <span>iOS & Android Widgets Studio</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-[#9F4F52]">Customize</span>
              </button>
            </div>

          </div>

          {/* Privacy & Safety Quick Badge */}
          <div 
            onClick={() => onSelectTab('safety-privacy')}
            className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E6D7CD] text-xs text-[#6B5A5C] flex items-center gap-3 cursor-pointer hover:bg-[#F5EDE7] transition-colors"
          >
            <ShieldCheck className="w-5 h-5 text-[#4E7D63] flex-shrink-0" />
            <div className="leading-snug">
              <span className="font-semibold text-[#3D2C2F] block">Zero-ad & Privacy First</span>
              <span>Encrypted local sync. Educational support disclaimer.</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
