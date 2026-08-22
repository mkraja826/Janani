import React, { useState } from 'react';
import { 
  FileHeart, 
  Phone, 
  Hospital, 
  UserCheck, 
  ShieldAlert, 
  Edit3, 
  Check, 
  Droplet,
  Pill,
  Heart
} from 'lucide-react';
import { HealthProfile, UserProfile } from '../types';
import { getTranslations } from '../utils/i18n';

interface HealthProfileTabProps {
  user: UserProfile;
  profile: HealthProfile;
  onUpdateProfile: (updated: HealthProfile) => void;
}

export const HealthProfileTab: React.FC<HealthProfileTabProps> = ({
  user,
  profile,
  onUpdateProfile,
}) => {
  const t = getTranslations(user.language);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<HealthProfile>({ ...profile });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(form);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* Header Overview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAD7D2] shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#9F4F52] tracking-wider uppercase">
            <FileHeart className="w-4 h-4" />
            <span>Antenatal Emergency & Clinical Profile</span>
          </div>
          <h1 className="font-serif text-3xl text-[#2E2020] font-bold mt-1">
            {t.healthProfile}
          </h1>
          <p className="text-sm text-[#735E61] mt-1">
            Crucial medical details for obstetricians, labor attendants, and emergency responders.
          </p>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#9F4F52] hover:bg-[#85383B] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
        >
          {isEditing ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
          <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-3xl border border-[#EAD7D2] space-y-4 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#4B393C] uppercase mb-1">Blood Type</label>
              <select
                value={form.bloodType}
                onChange={(e) => setForm({ ...form, bloodType: e.target.value as any })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#DDC6C0] bg-[#FFFDFC]"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4B393C] uppercase mb-1">Rh Factor</label>
              <select
                value={form.rhFactor}
                onChange={(e) => setForm({ ...form, rhFactor: e.target.value as any })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#DDC6C0] bg-[#FFFDFC]"
              >
                <option value="positive">Rh Positive (+)</option>
                <option value="negative">Rh Negative (-)</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4B393C] uppercase mb-1">Obstetrician / Care Provider</label>
            <input
              type="text"
              value={form.obstetricianName || ''}
              onChange={(e) => setForm({ ...form, obstetricianName: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#DDC6C0] bg-[#FFFDFC]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4B393C] uppercase mb-1">Delivery Hospital & Unit</label>
            <input
              type="text"
              value={form.hospitalName || ''}
              onChange={(e) => setForm({ ...form, hospitalName: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#DDC6C0] bg-[#FFFDFC]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#4B393C] uppercase mb-1">Emergency Contact Name</label>
              <input
                type="text"
                value={form.emergencyContactName || ''}
                onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#DDC6C0] bg-[#FFFDFC]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4B393C] uppercase mb-1">Emergency Phone Number</label>
              <input
                type="text"
                value={form.emergencyContactPhone || ''}
                onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#DDC6C0] bg-[#FFFDFC]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-[#6B5558] hover:bg-[#F7EEEA] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#9F4F52] hover:bg-[#85383B] text-white shadow-xs cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Blood & Clinical Summary Card */}
          <div className="p-6 rounded-3xl bg-white border border-[#EAD7D2] shadow-2xs space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm text-[#2E2020]">
              <Droplet className="w-5 h-5 text-[#9F4F52]" />
              <span>Blood Group & Compatibility</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFF0ED] border border-[#F5CAC3] flex items-center justify-between">
              <div>
                <div className="text-xs text-[#7A5458]">Maternal Blood Group</div>
                <div className="font-serif text-3xl font-bold text-[#9F4F52]">
                  {profile.bloodType} {profile.rhFactor === 'positive' ? 'Rh+' : profile.rhFactor === 'negative' ? 'Rh-' : ''}
                </div>
              </div>
              <div className="text-right text-xs text-[#6B4E52]">
                {profile.rhFactor === 'negative' ? (
                  <span className="font-bold text-[#B83E48] bg-[#FCECEC] px-2.5 py-1 rounded-full">
                    Anti-D prophylaxis indicated
                  </span>
                ) : (
                  <span className="font-semibold text-[#2D7344] bg-[#EDF7F1] px-2.5 py-1 rounded-full">
                    Rh Compatible
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2 text-xs text-[#4F3E40]">
              <div className="flex justify-between py-1.5 border-b border-[#F2E5E1]">
                <span className="text-[#846E70]">Known Allergies:</span>
                <span className="font-semibold text-[#2E2020]">{profile.allergies.join(', ') || 'None noted'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F2E5E1]">
                <span className="text-[#846E70]">Dietary Pattern:</span>
                <span className="font-semibold capitalize text-[#2E2020]">{profile.dietaryPattern}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#846E70]">Monitored Conditions:</span>
                <span className="font-semibold text-[#2E2020]">{profile.pregnancyConditions.join(', ') || 'None'}</span>
              </div>
            </div>
          </div>

          {/* Emergency & Labor Contacts */}
          <div className="p-6 rounded-3xl bg-white border border-[#EAD7D2] shadow-2xs space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm text-[#2E2020]">
              <Hospital className="w-5 h-5 text-[#4E7D63]" />
              <span>Care Provider & Emergency</span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-[#FAF6F3] border border-[#EADBCE]">
                <div className="text-[11px] font-bold text-[#8A7174] uppercase">Obstetrician</div>
                <div className="font-semibold text-[#2E2020] text-sm mt-0.5">{profile.obstetricianName || 'Dr. Sarah Mitchell, MD'}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF6F3] border border-[#EADBCE]">
                <div className="text-[11px] font-bold text-[#8A7174] uppercase">Labor & Delivery Unit</div>
                <div className="font-semibold text-[#2E2020] text-sm mt-0.5">{profile.hospitalName || 'St. Jude Maternity Pavilion'}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FDECE8] border border-[#F5C2BA] flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-[#842D33] uppercase">Emergency Partner Contact</div>
                  <div className="font-bold text-[#2E2020] text-sm">{profile.emergencyContactName || 'Rohan Sharma'}</div>
                  <div className="text-xs text-[#7A4448] font-mono">{profile.emergencyContactPhone || '+1 (555) 389-4421'}</div>
                </div>
                <a
                  href={`tel:${profile.emergencyContactPhone || ''}`}
                  className="p-2.5 rounded-xl bg-[#9F4F52] text-white hover:bg-[#85383B] transition-colors"
                  title="Call emergency contact"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Current Active Prescriptions */}
          <div className="md:col-span-2 p-6 rounded-3xl bg-white border border-[#EAD7D2] shadow-2xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-[#2E2020]">
              <Pill className="w-5 h-5 text-[#9F4F52]" />
              <span>Current Daily Medications & Supplements</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile.currentMedications.map((med, idx) => (
                <span
                  key={idx}
                  className="px-3.5 py-1.5 rounded-xl bg-[#FAF0EB] border border-[#EADBCE] text-xs font-semibold text-[#5C3F43]"
                >
                  {med}
                </span>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
