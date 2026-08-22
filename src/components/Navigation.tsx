import React from 'react';
import { 
  Home, 
  Baby, 
  Bell, 
  BookOpen, 
  HeartHandshake, 
  Activity, 
  Apple, 
  Calendar, 
  ShieldAlert, 
  FileHeart, 
  Settings,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { TabId, UserProfile } from '../types';
import { getTranslations } from '../utils/i18n';

interface NavigationProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  user: UserProfile;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  user,
}) => {
  const t = getTranslations(user.language);

  const tabs: { id: TabId; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'pregnancy-guide', label: t.pregnancyGuide, icon: Baby },
    { id: 'reminders', label: t.reminders, icon: Bell },
    { id: 'journal', label: t.journal, icon: BookOpen },
    { id: 'thinking-of-you', label: t.thinkingOfYou, icon: HeartHandshake },
    { id: 'health-tracker', label: t.healthTracker, icon: Activity },
    { id: 'food-guide', label: t.foodGuide, icon: Apple },
    { id: 'care-timeline', label: t.careTimeline, icon: Calendar },
    { id: 'health-profile', label: t.healthProfile, icon: FileHeart },
    { id: 'ai-companion', label: 'Care+ AI', icon: Sparkles },
    { id: 'widgets', label: 'Widgets Studio', icon: Smartphone },
    { id: 'safety-privacy', label: t.safetyPrivacy, icon: ShieldAlert },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  return (
    <nav className="bg-[#FFFDFB] border-b border-[#EAD7D2] shadow-xs">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 scrollbar-none no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#9F4F52] text-white shadow-sm font-semibold'
                    : 'text-[#625052] hover:text-[#2E2020] hover:bg-[#F8EFEA]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#8E6E71]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
