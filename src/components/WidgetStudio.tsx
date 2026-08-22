import React, { useState } from 'react';
import { 
  Sparkles, 
  Heart, 
  Pill, 
  Droplet, 
  Calendar, 
  CheckCircle2, 
  Smartphone, 
  ShieldCheck, 
  Copy, 
  Check, 
  Moon, 
  Sun, 
  Footprints, 
  Eye, 
  EyeOff, 
  Clock, 
  Activity, 
  Send,
  Zap,
  Sliders,
  Maximize2
} from 'lucide-react';
import { UserProfile, Reminder, PartnerNudge, TabId } from '../types';
import { calculatePregnancyProgress, getWeekDetail } from '../utils/pregnancy';
import { playGentleChime } from '../utils/audioChime';

interface WidgetStudioProps {
  user: UserProfile;
  reminders: Reminder[];
  nudges: PartnerNudge[];
  onToggleReminder?: (id: string) => void;
  onSendQuickNudge?: (message: string) => void;
  onSelectTab?: (tab: TabId) => void;
}

type WidgetTheme = 'blush' | 'lavender' | 'sage' | 'amber' | 'midnight';

export const WidgetStudio: React.FC<WidgetStudioProps> = ({
  user,
  reminders,
  nudges,
  onToggleReminder,
  onSendQuickNudge,
  onSelectTab,
}) => {
  const [selectedTheme, setSelectedTheme] = useState<WidgetTheme>('blush');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [activeWidgetTab, setActiveWidgetTab] = useState<'home-screen' | 'lock-screen' | 'partner-sync' | 'code-export'>('home-screen');
  const [waterGlasses, setWaterGlasses] = useState(5);
  const [kickCount, setKickCount] = useState(8);
  const [copiedCode, setCopiedCode] = useState(false);
  const [widgetActionToast, setWidgetActionToast] = useState<string | null>(null);

  const progress = calculatePregnancyProgress(user.dueDate);
  const weekInfo = getWeekDetail(progress.gestationalWeek);

  const nextMedication = reminders.find((r) => r.isActive && r.kind === 'medication' && r.stateToday === 'pending') || reminders.find((r) => r.isActive && r.kind === 'medication');
  const latestNudge = nudges[nudges.length - 1];

  const triggerToast = (msg: string) => {
    setWidgetActionToast(msg);
    setTimeout(() => setWidgetActionToast(null), 2500);
  };

  const handleAddWater = () => {
    const next = Math.min(8, waterGlasses + 1);
    setWaterGlasses(next);
    playGentleChime('water');
    triggerToast(`Hydration logged: ${next}/8 glasses (+250ml)`);
  };

  const handleAddKick = () => {
    const next = kickCount + 1;
    setKickCount(next);
    playGentleChime('clinical');
    triggerToast(`Fetal movement recorded! ${next} kicks counted today`);
  };

  const handleQuickWidgetNudge = () => {
    onSendQuickNudge?.('❤️ Thinking of you right now from Home Screen Widget!');
    playGentleChime('partner');
    triggerToast('Heart sent to partner from widget!');
  };

  const getThemeStyles = () => {
    switch (selectedTheme) {
      case 'lavender':
        return {
          bg: 'bg-gradient-to-br from-[#FAF7FF] via-[#F3EEFF] to-[#E9DEFF]',
          card: 'bg-white/85 text-[#2D1B4E]',
          border: 'border-[#D9CBFA]',
          accent: 'text-[#6A1B9A]',
          accentBg: 'bg-[#6A1B9A] text-white',
          pillBg: 'bg-[#EFE6FD] text-[#6A1B9A]',
          shadow: 'shadow-[#6A1B9A]/15',
        };
      case 'sage':
        return {
          bg: 'bg-gradient-to-br from-[#F5FAF6] via-[#ECF6EE] to-[#DCEDDE]',
          card: 'bg-white/85 text-[#1C3622]',
          border: 'border-[#C8E4CD]',
          accent: 'text-[#2E7D32]',
          accentBg: 'bg-[#2E7D32] text-white',
          pillBg: 'bg-[#E3F2E5] text-[#2E7D32]',
          shadow: 'shadow-[#2E7D32]/15',
        };
      case 'amber':
        return {
          bg: 'bg-gradient-to-br from-[#FFFDF5] via-[#FFF9E6] to-[#FCEEC2]',
          card: 'bg-white/85 text-[#4E3808]',
          border: 'border-[#F8E2A1]',
          accent: 'text-[#D97706]',
          accentBg: 'bg-[#D97706] text-white',
          pillBg: 'bg-[#FEF3C7] text-[#D97706]',
          shadow: 'shadow-[#D97706]/15',
        };
      case 'midnight':
        return {
          bg: 'bg-gradient-to-br from-[#1F171A] via-[#161214] to-[#0D0A0B]',
          card: 'bg-[#271E22]/90 text-[#FDF8F7]',
          border: 'border-[#423337]',
          accent: 'text-[#F4A5AC]',
          accentBg: 'bg-[#F4A5AC] text-[#2E1417]',
          pillBg: 'bg-[#3D292E] text-[#F8B7BD]',
          shadow: 'shadow-black/40',
        };
      case 'blush':
      default:
        return {
          bg: 'bg-gradient-to-br from-[#FFF9F8] via-[#FFF2F0] to-[#FCE5E2]',
          card: 'bg-white/85 text-[#2E2020]',
          border: 'border-[#F5C7C2]',
          accent: 'text-[#9F4F52]',
          accentBg: 'bg-[#9F4F52] text-white',
          pillBg: 'bg-[#FCE8E5] text-[#9F4F52]',
          shadow: 'shadow-[#9F4F52]/15',
        };
    }
  };

  const theme = getThemeStyles();

  const sampleJsonConfig = JSON.stringify(
    {
      widgetVersion: "2.1.0",
      targetPlatform: "iOS 18 WidgetKit / Android 15 Glance",
      gestationalWeek: progress.gestationalWeek,
      gestationalDay: progress.gestationalDay,
      babyFruitName: weekInfo.sizeFruit,
      babySizeCm: weekInfo.lengthCm,
      babyWeightG: weekInfo.weightG,
      daysToBirth: progress.daysRemaining,
      nextMedication: nextMedication?.title || "Prenatal Vitamins",
      nextMedicationTime: nextMedication?.localTime || "08:30",
      nextMedicationTaken: nextMedication?.stateToday === 'taken',
      waterLogged: `${waterGlasses}/8 glasses`,
      fetalKicksToday: kickCount,
      partnerMessage: latestNudge?.message || "Thinking of you ❤️",
      privacyConcealed: privacyMode,
      themePalette: selectedTheme
    },
    null,
    2
  );

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(sampleJsonConfig);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Studio Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#FFF5F2] via-[#FFFDFB] to-[#F9ECE7] border border-[#EBD6CF] p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#9F4F52]">
              <Sparkles className="w-4 h-4" />
              <span>iOS 18 & Android 15 Glanceable Widgets</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2E2020] mt-1">
              Interactive Pregnancy & Partner Widgets
            </h2>
            <p className="text-xs sm:text-sm text-[#735E61] mt-1 max-w-2xl leading-relaxed">
              Beautiful, real-time Lock Screen, StandBy, and Home Screen companion widgets. Test live buttons, customize color palettes, and preview confidential privacy modes.
            </p>
          </div>

          {/* Quick Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Privacy Toggle */}
            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                privacyMode
                  ? 'bg-[#2E2020] text-white border-black'
                  : 'bg-white text-[#635052] border-[#EAD7D2] hover:bg-[#FAF5F2]'
              }`}
              title="Toggle Lock Screen Privacy Mode"
            >
              {privacyMode ? <EyeOff className="w-3.5 h-3.5 text-[#FAD8DA]" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{privacyMode ? 'Privacy Concealed' : 'Public View'}</span>
            </button>

            {/* Theme Selector Pills */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-[#EAD7D2]">
              {(
                [
                  { id: 'blush', color: 'bg-[#9F4F52]', name: 'Blush' },
                  { id: 'lavender', color: 'bg-[#6A1B9A]', name: 'Lavender' },
                  { id: 'sage', color: 'bg-[#2E7D32]', name: 'Sage' },
                  { id: 'amber', color: 'bg-[#D97706]', name: 'Amber' },
                  { id: 'midnight', color: 'bg-[#1F171A]', name: 'OLED' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTheme(t.id)}
                  className={`w-5 h-5 rounded-full ${t.color} transition-transform cursor-pointer ${
                    selectedTheme === t.id ? 'scale-125 ring-2 ring-offset-1 ring-[#9F4F52]' : 'opacity-80 hover:opacity-100'
                  }`}
                  title={`${t.name} Palette`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-[#EBD6CF]/70 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveWidgetTab('home-screen')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeWidgetTab === 'home-screen'
                ? 'bg-[#9F4F52] text-white shadow-xs'
                : 'bg-white/70 text-[#6B5558] hover:bg-white'
            }`}
          >
            📱 Home Screen (Small, Med & Large Bento)
          </button>
          <button
            onClick={() => setActiveWidgetTab('lock-screen')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeWidgetTab === 'lock-screen'
                ? 'bg-[#9F4F52] text-white shadow-xs'
                : 'bg-white/70 text-[#6B5558] hover:bg-white'
            }`}
          >
            🔒 Lock Screen & Live Activity Pill
          </button>
          <button
            onClick={() => setActiveWidgetTab('partner-sync')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeWidgetTab === 'partner-sync'
                ? 'bg-[#9F4F52] text-white shadow-xs'
                : 'bg-white/70 text-[#6B5558] hover:bg-white'
            }`}
          >
            👫 Partner Companion Widget
          </button>
          <button
            onClick={() => setActiveWidgetTab('code-export')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeWidgetTab === 'code-export'
                ? 'bg-[#9F4F52] text-white shadow-xs'
                : 'bg-white/70 text-[#6B5558] hover:bg-white'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Widget Config JSON</span>
          </button>
        </div>
      </div>

      {/* Action Toast Feedback */}
      {widgetActionToast && (
        <div className="fixed bottom-20 right-6 z-50 animate-in slide-in-from-bottom-3 fade-in bg-[#2E2020] text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-white/10">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span>{widgetActionToast}</span>
        </div>
      )}

      {/* TAB 1: HOME SCREEN WIDGETS */}
      {activeWidgetTab === 'home-screen' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 1. SMALL 2x2 WIDGET (4 cols) */}
          <div className="lg:col-span-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#5E494C]">
              <span>Small 2x2 Widget</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#FAF5F2] border border-[#EAD7D2]">
                170 x 170
              </span>
            </div>

            {/* The Widget Canvas */}
            <div className={`p-4 rounded-[28px] border ${theme.border} ${theme.bg} ${theme.shadow} shadow-lg transition-all relative overflow-hidden aspect-square flex flex-col justify-between`}>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${theme.accentBg} animate-pulse`} />
                  <span className="text-[11px] font-bold tracking-wider uppercase opacity-80">
                    Janani
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme.pillBg}`}>
                  {privacyMode ? '••••' : `Day ${progress.gestationalDay}`}
                </span>
              </div>

              {/* Center Fruit / Week */}
              <div className="text-center my-auto">
                <div className="text-3xl font-black font-serif tracking-tight">
                  {privacyMode ? 'Week **' : `Week ${progress.gestationalWeek}`}
                </div>
                <div className="text-xs font-medium opacity-85 mt-0.5">
                  {privacyMode ? 'Baby Growth Active' : `Size: ${weekInfo.sizeFruit}`}
                </div>
                <div className="text-[10px] opacity-70 mt-0.5">
                  {privacyMode ? 'Care Track Active' : `~${weekInfo.lengthCm} • ${weekInfo.weightG}`}
                </div>
              </div>

              {/* Bottom Kick / Due Date Glance */}
              <div className="flex items-center justify-between pt-2 border-t border-black/5">
                <button
                  onClick={handleAddKick}
                  className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-xl ${theme.pillBg} hover:scale-105 active:scale-95 transition-all cursor-pointer`}
                  title="Tap to log fetal kick"
                >
                  <Footprints className="w-3 h-3" />
                  <span>{kickCount} kicks</span>
                </button>

                <span className="text-[10px] font-semibold opacity-80">
                  {progress.daysRemaining}d to EDD
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#7A6466] text-center">
              Tap the kicks pill to record baby movement directly from widget.
            </p>
          </div>

          {/* 2. MEDIUM 4x2 WIDGET (8 cols) */}
          <div className="lg:col-span-8 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#5E494C]">
              <span>Medium 4x2 Widget (Dual Pulse & Medicine Check)</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#FAF5F2] border border-[#EAD7D2]">
                360 x 170
              </span>
            </div>

            {/* The Medium Widget Canvas */}
            <div className={`p-4 sm:p-5 rounded-[28px] border ${theme.border} ${theme.bg} ${theme.shadow} shadow-lg transition-all relative overflow-hidden flex flex-col justify-between min-h-[175px]`}>
              
              {/* Top Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-black/5">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <span className="text-xs font-bold tracking-tight">Janani Pregnancy Care</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className={`px-2 py-0.5 rounded-full font-bold ${theme.pillBg}`}>
                    {progress.trimester === 3 ? '3rd Trimester' : progress.trimester === 2 ? '2nd Trimester' : '1st Trimester'}
                  </span>
                  <span className="opacity-70">{progress.daysRemaining} days to birth</span>
                </div>
              </div>

              {/* Middle Section with Dual Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
                
                {/* Left: Baby Progress & Fruit */}
                <div className={`p-2.5 rounded-2xl ${theme.card} border border-black/5 flex items-center gap-3`}>
                  <div className="w-10 h-10 rounded-xl bg-[#FAF0EB] flex items-center justify-center font-bold text-sm shrink-0 border border-black/5">
                    W{progress.gestationalWeek}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">
                      {privacyMode ? 'Private Progress' : `${weekInfo.sizeFruit} Size`}
                    </div>
                    <div className="text-[11px] opacity-75 truncate">
                      {privacyMode ? 'Protected Care' : `Sensory milestones sharpening`}
                    </div>
                  </div>
                </div>

                {/* Right: Next Medication with Interactive Check */}
                <div className={`p-2.5 rounded-2xl ${theme.card} border border-black/5 flex items-center justify-between gap-2`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-rose-50 text-[#C2334D] shrink-0">
                      <Pill className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {privacyMode ? 'Daily Supplement' : (nextMedication?.title || 'Prenatal Vitamin')}
                      </div>
                      <div className="text-[10px] opacity-75">
                        Due {nextMedication?.localTime || '08:30'} • {nextMedication?.stateToday === 'taken' ? 'Taken today ✅' : 'Pending'}
                      </div>
                    </div>
                  </div>

                  {nextMedication && (
                    <button
                      onClick={() => {
                        onToggleReminder?.(nextMedication.id);
                        playGentleChime('medicine');
                        triggerToast(nextMedication.stateToday === 'taken' ? 'Medication marked as pending' : 'Medication marked as taken! 💊');
                      }}
                      className={`p-2 rounded-xl text-xs font-bold transition-transform active:scale-90 cursor-pointer shrink-0 ${
                        nextMedication.stateToday === 'taken'
                          ? 'bg-green-600 text-white'
                          : `${theme.accentBg} hover:opacity-90`
                      }`}
                      title="Tap to toggle medication taken"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>

              {/* Bottom Partner Pulse Note */}
              <div className="flex items-center justify-between pt-2 border-t border-black/5 text-[11px]">
                <div className="flex items-center gap-1.5 opacity-90 truncate max-w-[80%]">
                  <Heart className="w-3 h-3 text-rose-500 fill-current shrink-0" />
                  <span className="truncate italic">
                    "{latestNudge ? latestNudge.message : 'Thinking of you and our baby ❤️'}"
                  </span>
                </div>
                <button
                  onClick={handleQuickWidgetNudge}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${theme.pillBg} hover:opacity-80 transition-all cursor-pointer`}
                >
                  Send ❤️
                </button>
              </div>

            </div>

            <p className="text-[11px] text-[#7A6466]">
              Interactive: Tap the checkmark button to log your medication instantly, or "Send ❤️" to nudge your partner.
            </p>
          </div>

          {/* 3. LARGE 4x4 BENTO WIDGET (12 cols) */}
          <div className="lg:col-span-12 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#5E494C]">
              <span>Large 4x4 Bento Widget (Complete Maternal Companion)</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#FAF5F2] border border-[#EAD7D2]">
                360 x 360
              </span>
            </div>

            <div className={`p-6 rounded-[32px] border ${theme.border} ${theme.bg} ${theme.shadow} shadow-xl transition-all relative overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-4`}>
              
              {/* Bento Cell 1: Baby Development & Week Arc */}
              <div className={`p-4 rounded-2xl ${theme.card} border border-black/5 flex flex-col justify-between space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    Baby Status
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme.pillBg}`}>
                    Week {progress.gestationalWeek}
                  </span>
                </div>

                <div>
                  <div className="text-2xl font-serif font-bold">
                    {privacyMode ? 'Developing Gently' : weekInfo.sizeFruit}
                  </div>
                  <p className="text-xs opacity-75 mt-1 leading-relaxed line-clamp-3">
                    {privacyMode ? 'Pregnancy advancing on schedule.' : weekInfo.babyDevelopment}
                  </p>
                </div>

                <div className="pt-2 border-t border-black/5 flex items-center justify-between text-xs font-semibold">
                  <span>{progress.daysRemaining} days left</span>
                  <span className="opacity-70">{Math.round((progress.gestationalWeek / 40) * 100)}% Progress</span>
                </div>
              </div>

              {/* Bento Cell 2: Interactive Hydration Tracker */}
              <div className={`p-4 rounded-2xl ${theme.card} border border-black/5 flex flex-col justify-between space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    Hydration Goal
                  </span>
                  <Droplet className="w-3.5 h-3.5 text-blue-500 fill-current" />
                </div>

                <div className="text-center py-1">
                  <div className="text-3xl font-black text-blue-600">
                    {waterGlasses}<span className="text-sm font-normal text-gray-500">/8 glasses</span>
                  </div>
                  <div className="text-[11px] opacity-75 mt-0.5">
                    {waterGlasses * 250} ml / 2000 ml target
                  </div>

                  {/* 8 Water Glass Pills */}
                  <div className="flex justify-center gap-1 mt-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2.5 h-4 rounded-full transition-all ${
                          i < waterGlasses ? 'bg-blue-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleAddWater}
                  className="w-full py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Droplet className="w-3 h-3" />
                  <span>Log +250ml Water</span>
                </button>
              </div>

              {/* Bento Cell 3: Partner & Clinical Scan */}
              <div className={`p-4 rounded-2xl ${theme.card} border border-black/5 flex flex-col justify-between space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    Care & Appointments
                  </span>
                  <Calendar className="w-3.5 h-3.5 opacity-70" />
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-[#FAF5F2] border border-black/5 text-xs">
                    <div className="font-bold truncate">3rd Trimester Glucose Scan</div>
                    <div className="text-[10px] opacity-75 mt-0.5">Sep 02 • Dr. Sarah Mitchell</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 text-xs">
                    <div className="flex items-center justify-between font-bold text-rose-900">
                      <span>Rohan’s Note</span>
                      <Heart className="w-3 h-3 text-rose-500 fill-current" />
                    </div>
                    <p className="text-[10px] text-rose-800 italic mt-0.5 line-clamp-1">
                      "{latestNudge ? latestNudge.message : 'Love you both ❤️'}"
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onSelectTab?.('ai-companion')}
                  className={`w-full py-1.5 rounded-xl ${theme.accentBg} text-xs font-bold transition-opacity hover:opacity-90 flex items-center justify-center gap-1 cursor-pointer`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Open Janani Care+</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* TAB 2: LOCK SCREEN & LIVE ACTIVITY */}
      {activeWidgetTab === 'lock-screen' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-[#FAF5F2] border border-[#EAD7D2] text-xs text-[#635052]">
            <span className="font-bold text-[#2E2020]">Live Activities & StandBy Mode</span>: Experience persistent, low-power lock screen widgets with dynamic fetal tracking and immediate partner resonance.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Dynamic Island Capsule */}
            <div className="p-6 rounded-3xl bg-[#0F0D0E] text-white border border-[#332A2C] shadow-2xl flex flex-col items-center justify-between space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#B39DA0]">
                Apple iOS Dynamic Island (Expanded)
              </span>

              <div className="w-full max-w-sm bg-black rounded-full p-2.5 px-4 flex items-center justify-between border border-white/10 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
                    W{progress.gestationalWeek}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-white leading-tight">Janani Pulse</div>
                    <div className="text-[10px] text-gray-400">{weekInfo.sizeFruit} • {progress.daysRemaining}d</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddKick}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-rose-300 flex items-center gap-1 px-2.5 cursor-pointer"
                  >
                    <Footprints className="w-3 h-3" />
                    <span>{kickCount}</span>
                  </button>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
              </div>

              <p className="text-[11px] text-gray-400 text-center">
                Glanceable Island pill stays at the top of the screen during kick tracking or contraction sessions.
              </p>
            </div>

            {/* Lock Screen Rectangular Widget */}
            <div className="p-6 rounded-3xl bg-[#1A1617] text-white border border-[#3B3033] shadow-2xl flex flex-col items-center justify-between space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#B39DA0]">
                Always-On Lock Screen Glance (AOD)
              </span>

              <div className="w-full max-w-sm bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                    <Heart className="w-3 h-3 text-rose-400 fill-current" />
                    <span>Janani Pregnancy</span>
                  </div>
                  <div className="text-base font-bold mt-0.5">
                    Week {progress.gestationalWeek}.{progress.gestationalDay}
                  </div>
                  <div className="text-xs text-gray-300">
                    Next: {nextMedication?.title || 'Iron Supplement'} ({nextMedication?.localTime || '08:30'})
                  </div>
                </div>

                <div className="w-12 h-12 rounded-full border-2 border-rose-400 flex flex-col items-center justify-center text-[10px] font-bold">
                  <span>{Math.round((progress.gestationalWeek / 40) * 100)}%</span>
                  <span className="text-[8px] text-gray-400">TRIM 3</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 text-center">
                Minimal monochrome display tailored for low battery draw and high contrast legibility.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: PARTNER SYNC COMPANION WIDGET */}
      {activeWidgetTab === 'partner-sync' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#F4FAF6] border border-[#D5EAD9] text-xs text-[#2D5A37]">
            <span className="font-bold">Partner Companion View</span>: Specially designed widget for Rohan's phone, giving instant maternal empathy insights without needing to constantly ask "How are you feeling?".
          </div>

          <div className="max-w-xl mx-auto p-5 sm:p-6 rounded-[28px] bg-gradient-to-br from-[#F4FAF6] via-[#FFFDFB] to-[#ECF6EE] border border-[#CDE5D2] shadow-xl space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#2E7D32]" />
                <span className="text-xs font-bold text-[#1C3622]">Rohan's Janani Companion</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E3F2E5] text-[#2E7D32]">
                Paired with Ananya
              </span>
            </div>

            {/* Mother status & Baby stage */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-white border border-[#D5EAD9]">
                <div className="text-[10px] font-bold uppercase text-[#2E7D32]">Baby Growth</div>
                <div className="text-sm font-bold text-[#1C3622] mt-0.5">Week {progress.gestationalWeek}</div>
                <div className="text-xs text-gray-600 mt-0.5">{weekInfo.sizeFruit} • {weekInfo.weightG}</div>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-[#D5EAD9]">
                <div className="text-[10px] font-bold uppercase text-[#2E7D32]">Mom's Comfort</div>
                <div className="text-sm font-bold text-[#1C3622] mt-0.5">Active & Resting ✨</div>
                <div className="text-xs text-gray-600 mt-0.5">Water: {waterGlasses}/8 glasses</div>
              </div>
            </div>

            {/* Partner Action of the Day */}
            <div className="p-3.5 rounded-2xl bg-[#EAF5EC] border border-[#CDE5D2] text-xs text-[#1C3622]">
              <div className="font-bold flex items-center gap-1.5 text-[#2E7D32]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Partner Support Recommendation</span>
              </div>
              <p className="mt-1 leading-relaxed">
                At Week {progress.gestationalWeek}, lower back fatigue is common. Offer a warm foot massage or fill her bedside water flask this evening.
              </p>
            </div>

            {/* Send Heart Button */}
            <button
              onClick={handleQuickWidgetNudge}
              className="w-full py-2.5 rounded-2xl bg-[#2E7D32] hover:bg-[#256629] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-current" />
              <span>Send Quick Warmth to Ananya</span>
            </button>

          </div>
        </div>
      )}

      {/* TAB 4: JSON CONFIG & NATIVE EXPORT */}
      {activeWidgetTab === 'code-export' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-[#2E2020]">Native Widget State Payload</h4>
              <p className="text-xs text-[#7A6466]">
                Syncs with iOS WidgetKit timeline providers and Android Glance AppWidgetProvider
              </p>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#9F4F52] text-white text-xs font-semibold hover:bg-[#85383B] transition-colors cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied to Clipboard' : 'Copy JSON'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-[#1F191B] text-[#F3E7EA] font-mono text-xs overflow-x-auto border border-black/20 shadow-inner">
            {sampleJsonConfig}
          </pre>
        </div>
      )}

    </div>
  );
};
