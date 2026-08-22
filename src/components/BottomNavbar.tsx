import React, { useState } from 'react';
import { 
  Home, 
  Baby, 
  Bell, 
  BookOpen, 
  HeartHandshake, 
  Activity, 
  Apple, 
  Calendar, 
  FileHeart, 
  Sparkles, 
  ShieldAlert, 
  Settings, 
  LayoutGrid,
  X,
  ChevronRight,
  Smartphone
} from 'lucide-react';
import { TabId, UserProfile, Reminder, PartnerNudge } from '../types';
import { getTranslations } from '../utils/i18n';

interface BottomNavbarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  user: UserProfile;
  reminders?: Reminder[];
  nudges?: PartnerNudge[];
}

export const BottomNavbar: React.FC<BottomNavbarProps> = ({
  activeTab,
  onSelectTab,
  user,
  reminders = [],
  nudges = [],
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const t = getTranslations(user.language);

  const pendingRemindersCount = reminders.filter((r) => r.stateToday === 'pending').length;
  const unacknowledgedNudgesCount = nudges.filter((n) => !n.acknowledgedAt && n.senderRole !== user.role).length;

  const primaryNavItems: { id: TabId; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'pregnancy-guide', label: t.pregnancyGuide, icon: Baby },
    { id: 'reminders', label: t.reminders, icon: Bell, badge: pendingRemindersCount },
    { id: 'journal', label: t.journal, icon: BookOpen },
    { id: 'thinking-of-you', label: t.thinkingOfYou, icon: HeartHandshake, badge: unacknowledgedNudgesCount },
  ];

  const allMoreTabs: { id: TabId; label: string; category: string; description: string; icon: React.FC<{ className?: string }>; color: string }[] = [
    { id: 'health-tracker', label: t.healthTracker, category: 'Clinical Vitals', description: 'Log blood pressure, glucose, weight & labs', icon: Activity, color: 'bg-[#FDF2F4] text-[#A63842]' },
    { id: 'food-guide', label: t.foodGuide, category: 'Nutrition', description: 'Safe meals, hydration goals & avoid list', icon: Apple, color: 'bg-[#F4F9F4] text-[#2E7D32]' },
    { id: 'care-timeline', label: t.careTimeline, category: 'Antenatal Care', description: 'Scans, screenings & doctor visit checklists', icon: Calendar, color: 'bg-[#F0F7FF] text-[#1976D2]' },
    { id: 'health-profile', label: t.healthProfile, category: 'Medical Vault', description: 'Blood group, emergency contacts & OB/GYN', icon: FileHeart, color: 'bg-[#FFF8E1] text-[#E65100]' },
    { id: 'ai-companion', label: 'Care+ AI Companion', category: 'Support', description: 'Trimester-tailored empathetic clinical guidance', icon: Sparkles, color: 'bg-[#F6EEFF] text-[#6A1B9A]' },
    { id: 'widgets', label: 'Widgets Studio', category: 'iOS & Android', description: 'Interactive Lock Screen, Standby & Bento widgets', icon: Smartphone, color: 'bg-[#FFF0F2] text-[#9F4F52]' },
    { id: 'safety-privacy', label: t.safetyPrivacy, category: 'Security', description: 'Zero-ad policy, data export & encryption', icon: ShieldAlert, color: 'bg-[#E8F5E9] text-[#2E7D32]' },
    { id: 'settings', label: t.settings, category: 'Preferences', description: 'Role toggle, language, due date & partner code', icon: Settings, color: 'bg-[#F5F5F5] text-[#424242]' },
  ];

  const isMoreTabActive = allMoreTabs.some((item) => item.id === activeTab);

  const handleSelectTab = (tab: TabId) => {
    onSelectTab(tab);
    setIsMoreOpen(false);
  };

  return (
    <>
      {/* Bottom Navbar Container */}
      <div 
        id="bottom-navbar"
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDFB]/95 backdrop-blur-md border-t border-[#EAD7D2] shadow-lg pb-safe"
      >
        <div className="max-w-md md:max-w-xl lg:max-w-2xl mx-auto px-3 py-1.5 flex items-center justify-between">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`bottom-nav-${item.id}`}
                onClick={() => handleSelectTab(item.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-2 min-w-[56px] rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-[#9F4F52] font-semibold scale-105'
                    : 'text-[#846E71] hover:text-[#2E2020] hover:bg-[#FBF1EC]'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className="absolute -top-1 -right-2 bg-[#D14343] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-[#FFFDFB] animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5 max-w-[62px] truncate text-center leading-tight">
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 bg-[#9F4F52] rounded-full mt-0.5" />
                )}
              </button>
            );
          })}

          {/* More Tools Button */}
          <button
            id="bottom-nav-more"
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={`relative flex flex-col items-center justify-center py-1 px-2 min-w-[56px] rounded-xl transition-all cursor-pointer ${
              isMoreTabActive || isMoreOpen
                ? 'text-[#9F4F52] font-semibold scale-105 bg-[#FBF1EC]'
                : 'text-[#846E71] hover:text-[#2E2020] hover:bg-[#FBF1EC]'
            }`}
          >
            <LayoutGrid className={`w-5 h-5 ${isMoreTabActive || isMoreOpen ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
            <span className="text-[10px] mt-0.5 leading-tight">More</span>
            {isMoreTabActive && (
              <span className="w-1.5 h-1.5 bg-[#9F4F52] rounded-full mt-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded More Drawer / Sheet */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="fixed inset-0"
            onClick={() => setIsMoreOpen(false)}
          />
          <div className="relative z-10 bg-[#FFFDFB] rounded-t-3xl border-t border-[#EAD7D2] shadow-2xl max-h-[80vh] overflow-y-auto max-w-xl w-full mx-auto p-5 pb-10">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-[#E2D2CD] rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#2E2020]">All Care Features</h3>
                <p className="text-xs text-[#7A6466]">Explore all clinical modules, tools & settings</p>
              </div>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-2 rounded-full bg-[#F5ECE8] text-[#625052] hover:bg-[#EAD7D2] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {allMoreTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`more-menu-${tab.id}`}
                    onClick={() => handleSelectTab(tab.id)}
                    className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'border-[#9F4F52] bg-[#FAF1EE] shadow-xs'
                        : 'border-[#EAD7D2] bg-white hover:border-[#D6BDB6] hover:bg-[#FDF9F7]'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${tab.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#2E2020] truncate">{tab.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#B59D9F] shrink-0" />
                      </div>
                      <span className="text-[10px] font-medium text-[#9F4F52] uppercase tracking-wider block mt-0.5">{tab.category}</span>
                      <p className="text-[11px] text-[#7A6466] line-clamp-1 mt-0.5">{tab.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
