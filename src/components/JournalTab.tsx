import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Lock, 
  Users, 
  Smile, 
  Calendar, 
  Heart, 
  Trash2, 
  Sparkles,
  X,
  Share2
} from 'lucide-react';
import { JournalEntry, Role, UserProfile } from '../types';
import { getTranslations } from '../utils/i18n';

interface JournalTabProps {
  user: UserProfile;
  entries: JournalEntry[];
  onAddEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
  onDeleteEntry: (id: string) => void;
}

export const JournalTab: React.FC<JournalTabProps> = ({
  user,
  entries,
  onAddEntry,
  onDeleteEntry,
}) => {
  const t = getTranslations(user.language);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterSharedOnly, setFilterSharedOnly] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mood, setMood] = useState<number>(5);
  const [isSharedWithPartner, setIsSharedWithPartner] = useState(true);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);

  const moods = [
    { score: 5, emoji: '✨', label: 'Glowing & Joyful' },
    { score: 4, emoji: '🌿', label: 'Calm & Peaceful' },
    { score: 3, emoji: '😴', label: 'Restful & Tired' },
    { score: 2, emoji: '💭', label: 'Emotional / Sensitive' },
    { score: 1, emoji: '🤕', label: 'Physical Discomfort' },
  ];

  const prompts = [
    'How did baby move or respond today?',
    'What was the kindest thing your partner did this week?',
    'What are you most looking forward to when meeting baby?',
    'What helped you relax and feel grounded today?',
  ];

  const filteredEntries = entries.filter((e) => {
    if (filterSharedOnly) return e.isSharedWithPartner;
    // If not shared, visible only if authored by current role
    if (!e.isSharedWithPartner && e.authorRole !== user.role) return false;
    return true;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    onAddEntry({
      authorRole: user.role,
      authorName: user.role === 'mother' ? user.name : (user.partnerName || 'Partner'),
      title: title.trim() ? title.trim() : null,
      body: body.trim(),
      mood,
      entryDate,
      isSharedWithPartner,
    });

    setTitle('');
    setBody('');
    setMood(5);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* Header & Write Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAD7D2] shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#9F4F52] tracking-wider uppercase">
            <BookOpen className="w-4 h-4" />
            <span>Private & Shared Memories</span>
          </div>
          <h1 className="font-serif text-3xl text-[#2E2020] font-bold mt-1">
            {t.journal}
          </h1>
          <p className="text-sm text-[#735E61] mt-1">
            Capture gentle moments, baby kicks, reflections, or private thoughts safely.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#9F4F52] hover:bg-[#85383B] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.newEntry}</span>
        </button>
      </div>

      {/* Filter and Role Indicator */}
      <div className="flex items-center justify-between gap-3 bg-[#FAF5F2] p-3 rounded-2xl border border-[#EADBCE]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterSharedOnly(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              !filterSharedOnly ? 'bg-white text-[#2E2020] shadow-2xs' : 'text-[#7A6466] hover:text-[#2E2020]'
            }`}
          >
            All Accessible Entries ({filteredEntries.length})
          </button>
          <button
            onClick={() => setFilterSharedOnly(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              filterSharedOnly ? 'bg-white text-[#2E2020] shadow-2xs' : 'text-[#7A6466] hover:text-[#2E2020]'
            }`}
          >
            Shared Family Only
          </button>
        </div>

        <div className="text-xs text-[#7A6466] font-medium hidden sm:block">
          Writing as: <strong className="text-[#9F4F52] capitalize">{user.role}</strong>
        </div>
      </div>

      {/* Entries List */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-[#EAD7D2] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF2EE] text-[#9F4F52] flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#2E2020]">Your journal is ready</h3>
            <p className="text-xs text-[#7A6466] max-w-sm mx-auto">
              Write down a reflection, a moment from an ultrasound, or how baby reacted to music today.
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const moodObj = moods.find((m) => m.score === entry.mood);
            const isOwner = entry.authorRole === user.role;

            return (
              <div
                key={entry.id}
                className="bg-white p-6 rounded-3xl border border-[#EAD7D2] hover:border-[#D6B5AD] transition-all space-y-3 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {moodObj && (
                      <div className="w-10 h-10 rounded-2xl bg-[#FAF0EC] flex items-center justify-center text-xl" title={moodObj.label}>
                        {moodObj.emoji}
                      </div>
                    )}
                    <div>
                      <h3 className="font-serif text-lg font-bold text-[#2E2020]">
                        {entry.title || 'Journal Reflection'}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-[#8A7275] mt-0.5">
                        <span>{entry.entryDate}</span>
                        <span>•</span>
                        <span className="font-semibold text-[#543F42]">By {entry.authorName} ({entry.authorRole})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {entry.isSharedWithPartner ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-[#3E8E5A] bg-[#EDF7F1] px-2.5 py-1 rounded-full">
                        <Users className="w-3 h-3" />
                        <span>Shared</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-[#9F4F52] bg-[#FAF0EB] px-2.5 py-1 rounded-full">
                        <Lock className="w-3 h-3" />
                        <span>Private</span>
                      </span>
                    )}

                    {isOwner && (
                      <button
                        onClick={() => onDeleteEntry(entry.id)}
                        className="p-1.5 text-[#A68F92] hover:text-[#B83E48] rounded-lg hover:bg-[#FCECEC] transition-colors cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-[#453335] leading-relaxed whitespace-pre-line pt-1">
                  {entry.body}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* New Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EAD7D2] max-w-lg w-full p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-[#2E2020]">
                {t.newEntry}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#F5ECE8] text-[#7A6466] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Inspiration Prompts */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-[#7A6466] uppercase tracking-wider">
                Writing prompt ideas:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {prompts.map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setTitle(p)}
                    className="text-left text-[11px] px-2.5 py-1 rounded-lg bg-[#FAF2EE] hover:bg-[#F2E5E0] text-[#694F52] cursor-pointer"
                  >
                    "{p}"
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4B393C] uppercase tracking-wider mb-1">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Baby kicked during evening prayer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#DDC6C0] focus:outline-none focus:ring-2 focus:ring-[#9F4F52]/30 bg-[#FFFDFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4B393C] uppercase tracking-wider mb-1">
                  How are you feeling today?
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {moods.map((m) => (
                    <button
                      type="button"
                      key={m.score}
                      onClick={() => setMood(m.score)}
                      className={`p-2 rounded-xl text-center flex flex-col items-center transition-all cursor-pointer ${
                        mood === m.score
                          ? 'bg-[#9F4F52] text-white shadow-xs'
                          : 'bg-[#FAF5F2] hover:bg-[#F2E6E1] text-[#4A383B]'
                      }`}
                    >
                      <span className="text-xl">{m.emoji}</span>
                      <span className="text-[10px] font-semibold mt-1 truncate max-w-full">
                        {m.label.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4B393C] uppercase tracking-wider mb-1">
                  Reflection / Thoughts *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Pour your thoughts, milestones, or memories here..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#DDC6C0] focus:outline-none focus:ring-2 focus:ring-[#9F4F52]/30 bg-[#FFFDFC]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-bold text-[#4B393C] uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#DDC6C0] focus:outline-none focus:ring-2 focus:ring-[#9F4F52]/30 bg-[#FFFDFC]"
                  />
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isSharedWithPartner}
                      onChange={(e) => setIsSharedWithPartner(e.target.checked)}
                      className="w-4 h-4 rounded text-[#9F4F52] focus:ring-[#9F4F52]/30"
                    />
                    <span className="text-xs font-semibold text-[#4A383B]">
                      Share with partner
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-[#6B5558] hover:bg-[#F7EEEA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#9F4F52] hover:bg-[#85383B] text-white shadow-xs cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
