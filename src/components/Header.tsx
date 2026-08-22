import React from 'react';
import { 
  Heart, 
  Sparkles, 
  Globe, 
  ShieldCheck, 
  User, 
  Users,
  Copy,
  Check,
  Bell,
  Smartphone
} from 'lucide-react';
import { UserProfile, LanguageCode, TabId } from '../types';
import { getTranslations } from '../utils/i18n';

interface HeaderProps {
  user: UserProfile;
  activeTab: TabId;
  unreadNotificationsCount?: number;
  onOpenNotifications: () => void;
  onSelectTab: (tab: TabId) => void;
  onToggleRole: () => void;
  onLanguageChange: (lang: LanguageCode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeTab,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onSelectTab,
  onToggleRole,
  onLanguageChange,
}) => {
  const t = getTranslations(user.language);
  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(user.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const languages: { code: LanguageCode; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'te', label: 'తెలుగు' },
    { code: 'ar', label: 'العربية' },
    { code: 'fr', label: 'Français' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FFFDFB]/90 backdrop-blur-md border-b border-[#EAD7D2] px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Brand & Identity */}
        <div className="flex items-center justify-between">
          <div 
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#9F4F52] to-[#D97D81] flex items-center justify-center text-white shadow-sm shadow-[#9F4F52]/20 group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl font-bold tracking-tight text-[#2E2020]">
                  {t.appName}
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#FCECE9] text-[#9F4F52] border border-[#F5D5CF]">
                  Pregnancy Care
                </span>
              </div>
              <p className="text-xs text-[#7A6466] hidden sm:block">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Mobile Right Quick Action Group */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Mobile Notification Bell */}
            <button
              id="mobile-notification-bell-btn"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-full bg-[#FAF4F0] border border-[#EADBCE] text-[#5A4547] hover:bg-[#F2DFDA] transition-colors"
              title="Open Notifications & Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D14343] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Mobile Role Switcher */}
            <button
              onClick={onToggleRole}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F7ECE9] text-[#713B44] border border-[#E8CFC9] active:scale-95 transition-all"
              title="Switch Mother/Partner View"
            >
              {user.role === 'mother' ? (
                <>
                  <User className="w-3.5 h-3.5 text-[#9F4F52]" />
                  <span>Mother</span>
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5 text-[#4E7D63]" />
                  <span>Partner</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Controls & Family Status */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 sm:gap-3">
          
          {/* Partner Link Pill */}
          <div className="flex items-center gap-2 bg-[#FAF4F0] border border-[#EADBCE] rounded-full px-3 py-1 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#4E7D63] animate-pulse" />
            <span className="text-[#635254] font-medium hidden sm:inline">
              {user.role === 'mother' ? `Partner: ${user.partnerName}` : `Mom: ${user.name}`}
            </span>
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1 text-[#9F4F52] hover:text-[#713B44] font-mono font-medium ml-1"
              title="Copy family invite code"
            >
              <span>{user.inviteCode}</span>
              {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          {/* Desktop Notification Bell Button */}
          <button
            id="desktop-notification-bell-btn"
            onClick={onOpenNotifications}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FAF4F0] hover:bg-[#F2DFDA] text-[#5A4547] border border-[#EADBCE] transition-all cursor-pointer"
            title="Open Notification Hub & Smart Alarms"
          >
            <Bell className="w-3.5 h-3.5 text-[#9F4F52]" />
            <span>Alerts</span>
            {unreadNotificationsCount > 0 && (
              <span className="bg-[#D14343] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Desktop Widget Studio Shortcut */}
          <button
            onClick={() => onSelectTab('widgets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'widgets'
                ? 'bg-[#9F4F52] text-white shadow-xs'
                : 'bg-[#FAF4F0] hover:bg-[#F2DFDA] text-[#5A4547] border border-[#EADBCE]'
            }`}
            title="Open iOS 18 & Android 15 Widgets Studio"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#9F4F52]" />
            <span className="hidden sm:inline">Widgets</span>
          </button>

          {/* Desktop Role Switcher Button */}
          <button
            onClick={onToggleRole}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F7ECE9] hover:bg-[#F2DFDA] text-[#713B44] border border-[#E8CFC9] transition-all cursor-pointer"
            title="Switch viewing role to experience both mother and partner modes"
          >
            {user.role === 'mother' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#9F4F52]"></span>
                <span>Mode: <strong>Mother</strong></span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-[#4E7D63]"></span>
                <span>Mode: <strong>Partner (Rohan)</strong></span>
              </>
            )}
          </button>

          {/* Language Selector */}
          <div className="relative flex items-center">
            <Globe className="w-3.5 h-3.5 text-[#7A6466] absolute left-2.5 pointer-events-none" />
            <select
              value={user.language}
              onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
              aria-label="Select Language"
              className="appearance-none pl-7 pr-6 py-1 text-xs font-medium rounded-full bg-[#FAF4F0] hover:bg-[#F2E8E2] border border-[#EADBCE] text-[#4F3E40] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#9F4F52]/30"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quick AI Companion Button */}
          <button
            onClick={() => onSelectTab('ai-companion')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm cursor-pointer ${
              activeTab === 'ai-companion'
                ? 'bg-[#9F4F52] text-white'
                : 'bg-gradient-to-r from-[#FFF0ED] to-[#FCE3DF] text-[#842D33] border border-[#F5CAC3] hover:shadow'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D97D81]" />
            <span className="hidden sm:inline">Care+ AI</span>
          </button>

        </div>
      </div>
    </header>
  );
};
