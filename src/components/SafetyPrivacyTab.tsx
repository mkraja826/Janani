import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  AlertOctagon, 
  PhoneCall, 
  CheckCircle2, 
  Heart, 
  FileLock,
  Download,
  AlertTriangle
} from 'lucide-react';
import { UserProfile } from '../types';
import { getTranslations } from '../utils/i18n';

interface SafetyPrivacyTabProps {
  user: UserProfile;
}

export const SafetyPrivacyTab: React.FC<SafetyPrivacyTabProps> = ({ user }) => {
  const t = getTranslations(user.language);

  const emergencyRedFlags = [
    {
      title: 'Persistent Severe Headache with Visual Changes',
      description: 'Blurred vision, seeing flashing lights or dark spots, accompanied by upper abdominal pain (potential preeclampsia warning).',
    },
    {
      title: 'Vaginal Bleeding or Sudden Gush of Fluid',
      description: 'Any bright red bleeding or clear fluid leak before 37 weeks requires immediate hospital labor & delivery triage.',
    },
    {
      title: 'Significant Reduction in Fetal Movement',
      description: 'Fewer than 10 kicks in 2 hours during active periods in the third trimester. Contact your triage line for a non-stress test (NST).',
    },
    {
      title: 'High Fever (&gt; 100.4°F / 38°C) with Chills',
      description: 'Maternal fever should be treated and evaluated promptly by your healthcare team.',
    },
    {
      title: 'Severe Unilateral Calf Pain or Swelling',
      description: 'Sudden warmth, redness, or localized leg tenderness to rule out deep vein thrombosis (DVT).',
    },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-gradient-to-br from-[#FFF5F2] via-[#FFFDFB] to-[#FCEFEA] p-6 sm:p-8 rounded-3xl border border-[#EAD7D2] shadow-2xs space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#9F4F52] tracking-wider uppercase">
          <ShieldCheck className="w-4 h-4" />
          <span>Patient Safety & Data Sanctuary</span>
        </div>
        <h1 className="font-serif text-3xl text-[#2E2020] font-bold">
          {t.safetyPrivacy}
        </h1>
        <p className="text-sm text-[#735E61] max-w-2xl leading-relaxed">
          Janani is designed with an uncompromising privacy architecture. Your pregnancy milestones, health data, and intimate partner notes belong solely to your family.
        </p>
      </div>

      {/* Emergency Red Flags Notice */}
      <div className="p-6 rounded-3xl bg-[#FFF6F6] border-2 border-[#F7C6CB] space-y-4 shadow-2xs">
        <div className="flex items-center gap-2.5 text-[#B83E48] font-bold text-base">
          <AlertOctagon className="w-5 h-5 flex-shrink-0" />
          <span>When to Seek Immediate Emergency Obstetric Care</span>
        </div>

        <p className="text-xs text-[#6E3C41] leading-relaxed">
          If you experience any of the following symptoms, do not wait for an app reminder or routine clinic visit. Call your OB/GYN triage line or go straight to the nearest Maternity Emergency Room:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {emergencyRedFlags.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-white border border-[#F5D2D5] space-y-1">
              <div className="text-xs font-bold text-[#962F39]">
                ⚠️ {item.title}
              </div>
              <p className="text-[11px] text-[#59393C] leading-snug">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Guarantees Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        <div className="p-6 rounded-3xl bg-white border border-[#EAD7D2] shadow-2xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-[#EDF7F1] text-[#3E8E5A] flex items-center justify-center mb-1">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-base font-bold text-[#2E2020]">Zero-Ad & Non-Monetized</h3>
          <p className="text-xs text-[#695457] leading-relaxed">
            Your pregnancy data is never tracked, packaged, or shared with third-party ad networks, insurance brokers, or data brokers.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#EAD7D2] shadow-2xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF0EB] text-[#9F4F52] flex items-center justify-center mb-1">
            <FileLock className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-base font-bold text-[#2E2020]">Local-First & Client Encrypted</h3>
          <p className="text-xs text-[#695457] leading-relaxed">
            All personal journals, vitals, and family nudges are stored safely in your personal device storage with instantaneous offline availability.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#EAD7D2] shadow-2xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-[#F0F5FA] text-[#2C62B0] flex items-center justify-center mb-1">
            <Download className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-base font-bold text-[#2E2020]">Data Export & Portability</h3>
          <p className="text-xs text-[#695457] leading-relaxed">
            Export all logs, blood pressures, and doctor notes at any time as JSON or clinical summaries to share with your healthcare team.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#EAD7D2] shadow-2xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF4F9] text-[#843270] flex items-center justify-center mb-1">
            <Heart className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-base font-bold text-[#2E2020]">Private Partner Code Linking</h3>
          <p className="text-xs text-[#695457] leading-relaxed">
            Only the person possessing your private family invite code ({user.inviteCode}) can share memories and receive your gentle nudges.
          </p>
        </div>

      </div>

    </div>
  );
};
