import React from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Sparkles,
  FileText,
  Activity,
  Plus
} from 'lucide-react';
import { TimelineMilestone, UserProfile } from '../types';
import { calculatePregnancyProgress } from '../utils/pregnancy';
import { getTranslations } from '../utils/i18n';

interface CareTimelineTabProps {
  user: UserProfile;
  timeline: TimelineMilestone[];
  onToggleMilestone: (id: string) => void;
}

export const CareTimelineTab: React.FC<CareTimelineTabProps> = ({
  user,
  timeline,
  onToggleMilestone,
}) => {
  const t = getTranslations(user.language);
  const progress = calculatePregnancyProgress(user.dueDate);

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAD7D2] shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#9F4F52] tracking-wider uppercase">
            <Calendar className="w-4 h-4" />
            <span>Clinical Milestone Tracker</span>
          </div>
          <h1 className="font-serif text-3xl text-[#2E2020] font-bold mt-1">
            {t.careTimeline}
          </h1>
          <p className="text-sm text-[#735E61] mt-1">
            Recommended antenatal schedule from week 8 dating scans to week 38 birth preparation.
          </p>
        </div>

        <div className="px-4 py-2 rounded-2xl bg-[#FFF0ED] text-[#9F4F52] font-semibold text-xs border border-[#F5CAC3]">
          Current: Week {progress.gestationalWeek}
        </div>
      </div>

      {/* Timeline Steps */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-[#EBD6CF]">
        {timeline.map((item) => {
          const isPassed = item.week < progress.gestationalWeek;
          const isCurrent = item.week === progress.gestationalWeek || Math.abs(item.week - progress.gestationalWeek) <= 1;

          return (
            <div key={item.id} className="relative group">
              
              {/* Timeline Bullet Node */}
              <button
                onClick={() => onToggleMilestone(item.id)}
                className={`absolute -left-6 sm:-left-8 top-4 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  item.isCompleted
                    ? 'bg-[#3E8E5A] text-white ring-4 ring-[#EAF6ED]'
                    : isCurrent
                    ? 'bg-[#9F4F52] text-white ring-4 ring-[#FFF0ED] animate-pulse'
                    : 'bg-white border-2 border-[#D5B8B0] text-[#A88C90]'
                }`}
              >
                {item.isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <span className="text-[10px] font-bold">{item.week}</span>
                )}
              </button>

              {/* Content Card */}
              <div
                className={`p-6 rounded-3xl border bg-white space-y-2 transition-all ${
                  item.isCompleted
                    ? 'border-[#D9EADF] bg-[#FCFDFD]'
                    : isCurrent
                    ? 'border-[#E6B4AA] ring-2 ring-[#9F4F52]/15 shadow-sm'
                    : 'border-[#EAD7D2]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF0EB] text-[#7A4448]">
                      Week {item.week}
                    </span>
                    <h3 className={`font-serif text-lg font-bold ${item.isCompleted ? 'text-[#3B5745]' : 'text-[#2E2020]'}`}>
                      {item.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.dateScheduled && (
                      <span className="text-xs text-[#8A7174]">
                        Scheduled: <strong>{item.dateScheduled}</strong>
                      </span>
                    )}

                    <button
                      onClick={() => onToggleMilestone(item.id)}
                      className={`text-xs px-3 py-1 rounded-xl font-semibold cursor-pointer transition-colors ${
                        item.isCompleted
                          ? 'bg-[#EAF6ED] text-[#2D7344]'
                          : 'bg-[#F9ECE8] text-[#842D33] hover:bg-[#F2DFDA]'
                      }`}
                    >
                      {item.isCompleted ? 'Completed' : 'Mark Done'}
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#544144] leading-relaxed">
                  {item.description}
                </p>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
