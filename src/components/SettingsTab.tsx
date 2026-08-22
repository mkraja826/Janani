import React, { useState } from 'react';
import { 
  Settings, 
  Globe, 
  Calendar, 
  Users, 
  Download, 
  Trash2, 
  Sparkles,
  Check,
  Copy,
  RefreshCw
} from 'lucide-react';
import { LanguageCode, UserProfile } from '../types';
import { getTranslations } from '../utils/i18n';

interface SettingsTabProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onExportData: () => void;
  onResetData: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  user,
  onUpdateUser,
  onExportData,
  onResetData,
}) => {
  const t = getTranslations(user.language);
  const [copied, setCopied] = useState(false);
  const [partnerInviteInput, setPartnerInviteInput] = useState('');
  const [partnerLinkedSuccess, setPartnerLinkedSuccess] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(user.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerInviteInput.trim()) return;
    onUpdateUser({
      partnerLinked: true,
      partnerName: 'Rohan (Linked)',
    });
    setPartnerLinkedSuccess(true);
    setTimeout(() => setPartnerLinkedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAD7D2] shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#9F4F52] tracking-wider uppercase">
            <Settings className="w-4 h-4" />
            <span>Preferences & Settings</span>
          </div>
          <h1 className="font-serif text-3xl text-[#2E2020] font-bold mt-1">
            {t.settings}
          </h1>
          <p className="text-sm text-[#735E61] mt-1">
            Manage your due date, family pairing, multi-language settings, and data exports.
          </p>
        </div>
      </div>

      {/* Due Date & Profile Config */}
      <div className="p-6 rounded-3xl bg-white border border-[#EAD7D2] shadow-2xs space-y-4">
        <h3 className="font-serif text-lg font-bold text-[#2E2020]">Pregnancy Due Date & Identity</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#4B393C] uppercase mb-1">
              Estimated Due Date (EDD)
            </label>
            <input
              type="date"
              value={user.dueDate}
              onChange={(e) => onUpdateUser({ dueDate: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#DDC6C0] bg-[#FFFDFC]"
            />
            <span className="text-[11px] text-[#7A6466] mt-1 block">
              Calculates your weekly developmental milestones and trimester progress.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4B393C] uppercase mb-1">
              Mother's Name
            </label>
            <input
              type="text"
              value={user.name}
              onChange={(e) => onUpdateUser({ name: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#DDC6C0] bg-[#FFFDFC]"
            />
          </div>
        </div>
      </div>

      {/* Family Invite & Partner Linking */}
      <div className="p-6 rounded-3xl bg-white border border-[#EAD7D2] shadow-2xs space-y-4">
        <div className="flex items-center gap-2 font-bold text-base text-[#2E2020]">
          <Users className="w-5 h-5 text-[#9F4F52]" />
          <span>Family Invite Code & Pairing</span>
        </div>

        <p className="text-xs text-[#635052] leading-relaxed">
          Share this unique secure code with your partner to enable shared journals, weekly developmental insights, and gentle 1-tap affectionate nudges.
        </p>

        <div className="p-4 rounded-2xl bg-[#FAF5F2] border border-[#EADBCE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs text-[#8A7174]">Your Unique Invite Code</div>
            <div className="font-mono text-xl font-bold text-[#9F4F52] tracking-wider mt-0.5">
              {user.inviteCode}
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#9F4F52] text-white text-xs font-semibold hover:bg-[#85383B] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Code Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Link Code Box */}
        <form onSubmit={handleLinkPartner} className="pt-2 flex gap-2">
          <input
            type="text"
            placeholder="Enter partner's invite code (e.g. JANI-XXXX-LOVE)"
            value={partnerInviteInput}
            onChange={(e) => setPartnerInviteInput(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-[#DDC6C0] bg-[#FFFDFC]"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#4E7D63] hover:bg-[#3E6650] text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Pair Space
          </button>
        </form>

        {partnerLinkedSuccess && (
          <div className="text-xs text-[#2D7344] font-semibold flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            <span>Successfully connected with partner!</span>
          </div>
        )}
      </div>

      {/* Notifications & Widgets Quick Config */}
      <div className="p-6 rounded-3xl bg-white border border-[#EAD7D2] shadow-2xs space-y-4">
        <h3 className="font-serif text-lg font-bold text-[#2E2020]">System Integrations & Alerts</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-[#FAF5F2] border border-[#EADBCE] space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-[#9F4F52] uppercase">
              <span>🔔 Smart Alarms & In-App Alerts</span>
            </div>
            <p className="text-xs text-[#6B5558]">
              High-priority prenatal medication alarms, gentle hydration chimes, and partner love notes.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF5F2] border border-[#EADBCE] space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-[#9F4F52] uppercase">
              <span>📱 iOS 18 & Android 15 Widgets</span>
            </div>
            <p className="text-xs text-[#6B5558]">
              Dynamic Lock Screen, StandBy, and Home Screen companion widgets with customizable palettes.
            </p>
          </div>
        </div>
      </div>

      {/* Data Management & Backup */}
      <div className="p-6 rounded-3xl bg-white border border-[#EAD7D2] shadow-2xs space-y-4">
        <h3 className="font-serif text-lg font-bold text-[#2E2020]">Data Export & Maintenance</h3>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onExportData}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FAF0EB] text-[#842D33] hover:bg-[#F2DFDA] border border-[#E8D1CB] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download All Data (JSON Export)</span>
          </button>

          <button
            onClick={onResetData}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FFF1F2] text-[#B83E48] hover:bg-[#FCE3E5] border border-[#FAD0D4] text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset to Default Demo State</span>
          </button>
        </div>
      </div>

    </div>
  );
};
