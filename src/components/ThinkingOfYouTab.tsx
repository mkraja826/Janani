import React, { useState } from 'react';
import { 
  Heart, 
  HeartHandshake, 
  Send, 
  Sparkles, 
  Clock, 
  CheckCheck,
  Smile,
  Droplet,
  Coffee,
  Sun,
  Moon
} from 'lucide-react';
import { PartnerNudge, UserProfile } from '../types';
import { getTranslations } from '../utils/i18n';

interface ThinkingOfYouTabProps {
  user: UserProfile;
  nudges: PartnerNudge[];
  onSendNudge: (message: string) => void;
  onAcknowledgeNudge: (id: string) => void;
}

export const ThinkingOfYouTab: React.FC<ThinkingOfYouTabProps> = ({
  user,
  nudges,
  onSendNudge,
  onAcknowledgeNudge,
}) => {
  const t = getTranslations(user.language);
  const [customMessage, setCustomMessage] = useState('');
  const [heartAnim, setHeartAnim] = useState(false);

  const presetNudges = [
    { text: 'Thinking of you and our little one right now ❤️', icon: '❤️' },
    { text: 'Take a slow deep breath and sip some fresh water with me 💧', icon: '💧' },
    { text: 'Rest your feet up, love. You are doing something wonderful 🌸', icon: '🌸' },
    { text: 'Baby is kicking and saying hello right now! ✨', icon: '👶' },
    { text: 'Bringing you something nourishing and comforting soon 🍲', icon: '🍲' },
    { text: 'Sending you so much strength and a big warm hug 🫂', icon: '🫂' },
  ];

  const handleSendPreset = (text: string) => {
    onSendNudge(text);
    triggerHeart();
  };

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMessage.trim()) return;
    onSendNudge(customMessage.trim());
    setCustomMessage('');
    triggerHeart();
  };

  const triggerHeart = () => {
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 1200);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* Header Overview */}
      <div className="bg-gradient-to-br from-[#FFF5F2] via-[#FFFDFB] to-[#FCEFEA] p-6 sm:p-8 rounded-3xl border border-[#EAD7D2] shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#9F4F52] tracking-wider uppercase">
              <HeartHandshake className="w-4 h-4" />
              <span>Pressure-Free Connection</span>
            </div>
            <h1 className="font-serif text-3xl text-[#2E2020] font-bold">
              {t.thinkingOfYou}
            </h1>
            <p className="text-sm text-[#735E61] max-w-xl leading-relaxed">
              A quiet, affectionate bridge between mother and partner. Send a gentle ping of love, encouragement, or baby movements without demanding an immediate reply.
            </p>
          </div>

          {/* Connected Partner Pill */}
          <div className="p-4 rounded-2xl bg-white border border-[#EADBCE] text-center shadow-2xs min-w-[180px]">
            <div className="text-xs text-[#8A7174]">Connected with</div>
            <div className="font-serif text-lg font-bold text-[#2E2020] mt-0.5">
              {user.role === 'mother' ? user.partnerName : user.name}
            </div>
            <div className="text-[11px] font-semibold text-[#4E7D63] flex items-center justify-center gap-1 mt-1">
              <span className="w-2 h-2 rounded-full bg-[#4E7D63] animate-pulse" />
              <span>Space Linked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Tap Affection Buttons */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#EAD7D2] shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm text-[#2E2020]">
            <Sparkles className="w-4 h-4 text-[#9F4F52]" />
            <span>Send a quick warm nudge (1-Tap):</span>
          </div>
          {heartAnim && (
            <span className="text-xs font-bold text-[#9F4F52] animate-bounce">
              ❤️ Warmth Sent!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {presetNudges.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSendPreset(item.text)}
              className="p-4 rounded-2xl bg-[#FAF5F2] hover:bg-[#F4ECE8] border border-[#EADBCE] hover:border-[#9F4F52] text-left transition-all flex items-start gap-3 group cursor-pointer"
            >
              <span className="text-2xl group-hover:scale-125 transition-transform">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#382628] leading-snug">
                  {item.text}
                </p>
                <span className="text-[10px] text-[#9F4F52] font-semibold mt-1 inline-block opacity-0 group-hover:opacity-100 transition-opacity">
                  Tap to send →
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Custom Nudge Input */}
        <form onSubmit={handleSendCustom} className="pt-3 border-t border-[#EFE0DC] flex gap-2">
          <input
            type="text"
            placeholder="Write a custom loving note or quick update..."
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="flex-1 px-4 py-2.5 text-sm rounded-2xl border border-[#DDC6C0] focus:outline-none focus:ring-2 focus:ring-[#9F4F52]/30 bg-[#FFFDFC]"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-2xl bg-[#9F4F52] hover:bg-[#85383B] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>

      {/* History of Warmth & Moments */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#EAD7D2] shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-[#2E2020]">
            {t.recentMoments}
          </h2>
          <span className="text-xs text-[#8A7174]">
            {nudges.length} total nudges exchanged
          </span>
        </div>

        <div className="space-y-3">
          {nudges.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#7A6466]">
              {t.noMomentsYet}
            </div>
          ) : (
            [...nudges].reverse().map((nudge) => {
              const isMe = nudge.senderRole === user.role;
              return (
                <div
                  key={nudge.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                    isMe
                      ? 'bg-[#FAF7F5] border-[#EADBCE] ml-4 sm:ml-12'
                      : 'bg-[#FFF8F6] border-[#F0D5CF] mr-4 sm:mr-12'
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-[#9F4F52]">
                        {nudge.senderName} ({nudge.senderRole})
                      </span>
                      <span className="text-[#8F797C]">•</span>
                      <span className="text-[#8F797C]">
                        {new Date(nudge.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-sm text-[#2E2020] font-medium leading-relaxed">
                      "{nudge.message}"
                    </p>

                    {nudge.acknowledgedAt && (
                      <div className="text-[11px] text-[#4E7D63] flex items-center gap-1 font-semibold pt-1">
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Received with warmth</span>
                      </div>
                    )}
                  </div>

                  {!isMe && !nudge.acknowledgedAt && (
                    <button
                      onClick={() => onAcknowledgeNudge(nudge.id)}
                      className="px-3 py-1.5 rounded-xl bg-[#9F4F52] text-white text-xs font-semibold hover:bg-[#85383B] transition-colors cursor-pointer flex-shrink-0 flex items-center gap-1"
                    >
                      <Heart className="w-3 h-3 fill-current" />
                      <span>{t.sendHeartBack}</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};
