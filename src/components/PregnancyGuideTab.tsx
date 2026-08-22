import React, { useState } from 'react';
import { 
  Baby, 
  Sparkles, 
  Heart, 
  Apple, 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight,
  Info,
  Calendar,
  Activity
} from 'lucide-react';
import { UserProfile } from '../types';
import { calculatePregnancyProgress, getWeekDetail, WEEK_DETAILS } from '../utils/pregnancy';
import { getTranslations } from '../utils/i18n';

interface PregnancyGuideTabProps {
  user: UserProfile;
}

export const PregnancyGuideTab: React.FC<PregnancyGuideTabProps> = ({ user }) => {
  const t = getTranslations(user.language);
  const progress = calculatePregnancyProgress(user.dueDate);
  const [selectedWeek, setSelectedWeek] = useState<number>(progress.gestationalWeek);

  const availableWeeks = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40];
  const weekInfo = getWeekDetail(selectedWeek);

  const handlePrev = () => {
    if (selectedWeek > 4) setSelectedWeek((w) => Math.max(4, w - 2));
  };

  const handleNext = () => {
    if (selectedWeek < 40) setSelectedWeek((w) => Math.min(40, w + 2));
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      
      {/* Header Overview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAD7D2] shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#9F4F52] tracking-wider uppercase">
            <Baby className="w-4 h-4" />
            <span>{t.pregnancyGuide}</span>
          </div>
          <h1 className="font-serif text-3xl text-[#2E2020] font-bold mt-1">
            Week {selectedWeek} Development
          </h1>
          <p className="text-sm text-[#735E61] mt-1">
            {selectedWeek >= 28 ? 'Third Trimester (Nearing the arrival)' : selectedWeek >= 14 ? 'Second Trimester (Growth & energy)' : 'First Trimester (Foundation & organogenesis)'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={selectedWeek <= 4}
            className="p-2.5 rounded-xl border border-[#E0CDC6] bg-[#FAF5F2] hover:bg-[#F2E5DF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Previous week milestone"
          >
            <ChevronLeft className="w-5 h-5 text-[#594245]" />
          </button>
          
          <div className="px-4 py-2 rounded-xl bg-[#FFF0ED] text-[#9F4F52] font-serif font-bold text-lg border border-[#F5CAC3]">
            W{selectedWeek}
          </div>

          <button
            onClick={handleNext}
            disabled={selectedWeek >= 40}
            className="p-2.5 rounded-xl border border-[#E0CDC6] bg-[#FAF5F2] hover:bg-[#F2E5DF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Next week milestone"
          >
            <ChevronRight className="w-5 h-5 text-[#594245]" />
          </button>
        </div>
      </div>

      {/* Week Selector Pills Bar */}
      <div className="bg-white p-3 rounded-2xl border border-[#EAD7D2] shadow-2xs overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 min-w-max">
          {availableWeeks.map((w) => {
            const isCurrent = w === progress.gestationalWeek;
            const isSelected = w === selectedWeek;
            return (
              <button
                key={w}
                onClick={() => setSelectedWeek(w)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#9F4F52] text-white shadow-xs'
                    : isCurrent
                    ? 'bg-[#FDECE8] text-[#9F4F52] border border-[#F5C2BA]'
                    : 'bg-[#FAF5F2] text-[#635052] hover:bg-[#F0E4DE]'
                }`}
              >
                <span>Week {w}</span>
                {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-[#9F4F52] inline-block" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Baby Comparison & Measurements Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Visual Fruit / Size Badge */}
        <div className="md:col-span-1 bg-gradient-to-br from-[#FFF5F2] to-[#FDEBE6] p-6 rounded-3xl border border-[#EAD0C7] flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-24 h-24 rounded-3xl bg-white shadow-sm flex items-center justify-center text-5xl">
            {weekInfo.sizeFruit.includes('Poppy') ? '🌱' :
             weekInfo.sizeFruit.includes('Raspberry') ? '🍇' :
             weekInfo.sizeFruit.includes('Plum') ? '🍑' :
             weekInfo.sizeFruit.includes('Avocado') ? '🥑' :
             weekInfo.sizeFruit.includes('Banana') ? '🍌' :
             weekInfo.sizeFruit.includes('Corn') ? '🌽' :
             weekInfo.sizeFruit.includes('Eggplant') ? '🍆' :
             weekInfo.sizeFruit.includes('Squash') ? '🎃' :
             weekInfo.sizeFruit.includes('Papaya') ? '🥭' : '🍉'}
          </div>
          
          <div>
            <div className="text-xs uppercase font-bold tracking-wider text-[#9F4F52]">Baby is the size of a</div>
            <div className="font-serif text-2xl font-bold text-[#2E2020] mt-0.5">{weekInfo.sizeFruit}</div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full pt-3 border-t border-[#EBD4CB]/80">
            <div className="p-2.5 rounded-xl bg-white/80 border border-[#ECD9D1]">
              <div className="text-[11px] text-[#7A6466]">Avg Length</div>
              <div className="font-bold text-[#382628] text-sm">{weekInfo.lengthCm}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 border border-[#ECD9D1]">
              <div className="text-[11px] text-[#7A6466]">Avg Weight</div>
              <div className="font-bold text-[#382628] text-sm">{weekInfo.weightG}</div>
            </div>
          </div>
        </div>

        {/* Detailed Baby Growth & Milestones */}
        <div className="md:col-span-2 bg-white p-6 sm:p-7 rounded-3xl border border-[#EAD7D2] shadow-2xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-base text-[#2E2020]">
            <Sparkles className="w-5 h-5 text-[#9F4F52]" />
            <span>Fetal Anatomy & Growth at Week {selectedWeek}</span>
          </div>

          <p className="text-sm text-[#4F3C3F] leading-relaxed">
            {weekInfo.babyDevelopment}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            
            <div className="p-4 rounded-2xl bg-[#FAF6F3] border border-[#E8DCD5] space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs text-[#8A3848]">
                <Activity className="w-4 h-4" />
                <span>Maternal Physiological Changes</span>
              </div>
              <p className="text-xs text-[#5E4A4D] leading-relaxed">
                {weekInfo.maternalChanges}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F9F6] border border-[#D7E8DE] space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs text-[#2F6B48]">
                <Apple className="w-4 h-4" />
                <span>Essential Nutrient Focus</span>
              </div>
              <p className="text-xs text-[#3E5C4B] leading-relaxed">
                {weekInfo.keyNutritionTip}
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Partner Support & Emotional Bonding Section */}
      <div className="bg-gradient-to-r from-[#FAF6F3] via-white to-[#FDF8F5] p-6 sm:p-7 rounded-3xl border border-[#EAD7D2] shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[#4E7D63]">
          <Heart className="w-5 h-5 fill-current" />
          <span>Partner Empathy & Actionable Care (Week {selectedWeek})</span>
        </div>
        
        <p className="text-sm text-[#4A383B] leading-relaxed">
          "{weekInfo.partnerSupportTip}"
        </p>

        <div className="pt-2 text-xs text-[#7A6466] flex items-center gap-1.5">
          <Info className="w-4 h-4 text-[#9F4F52]" />
          <span>Partners who actively engage in antenatal milestones help reduce maternal stress and strengthen parent-infant bonding.</span>
        </div>
      </div>

    </div>
  );
};
