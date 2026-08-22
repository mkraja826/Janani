import React, { useState } from 'react';
import { 
  Bell, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Trash2, 
  Pill, 
  Droplet, 
  Calendar, 
  Sparkles,
  X
} from 'lucide-react';
import { Reminder, ReminderKind, UserProfile } from '../types';
import { getTranslations } from '../utils/i18n';

interface RemindersTabProps {
  user: UserProfile;
  reminders: Reminder[];
  onToggleReminder: (id: string) => void;
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'stateToday'>) => void;
  onDeleteReminder: (id: string) => void;
}

export const RemindersTab: React.FC<RemindersTabProps> = ({
  user,
  reminders,
  onToggleReminder,
  onAddReminder,
  onDeleteReminder,
}) => {
  const t = getTranslations(user.language);
  const [filter, setFilter] = useState<'all' | ReminderKind>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [kind, setKind] = useState<ReminderKind>('medication');
  const [localTime, setLocalTime] = useState('09:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const filteredReminders = reminders.filter((r) => {
    if (filter === 'all') return true;
    return r.kind === filter;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddReminder({
      title: title.trim(),
      instructions: instructions.trim() ? instructions.trim() : null,
      kind,
      localTime,
      startDate: new Date().toISOString().split('T')[0],
      endDate: null,
      daysOfWeek: selectedDays,
      isActive: true,
    });

    setTitle('');
    setInstructions('');
    setKind('medication');
    setLocalTime('09:00');
    setIsModalOpen(false);
  };

  const getKindIcon = (k: ReminderKind) => {
    switch (k) {
      case 'medication': return Pill;
      case 'hydration': return Droplet;
      case 'appointment': return Calendar;
      default: return Bell;
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAD7D2] shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#9F4F52] tracking-wider uppercase">
            <Bell className="w-4 h-4" />
            <span>Daily Care Schedule</span>
          </div>
          <h1 className="font-serif text-3xl text-[#2E2020] font-bold mt-1">
            {t.reminders}
          </h1>
          <p className="text-sm text-[#735E61] mt-1">
            Gentle, non-intrusive alerts for prenatal vitamins, hydration, and doctor visits.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#9F4F52] hover:bg-[#85383B] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addReminder}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['all', 'medication', 'hydration', 'appointment', 'custom'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
              filter === cat
                ? 'bg-[#9F4F52] text-white shadow-2xs'
                : 'bg-white text-[#685255] border border-[#E8D6D1] hover:bg-[#FAF4F0]'
            }`}
          >
            {cat === 'all' ? 'All Reminders' : cat}
          </button>
        ))}
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {filteredReminders.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-[#EAD7D2] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF2EE] text-[#9F4F52] flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#2E2020]">No reminders found</h3>
            <p className="text-xs text-[#7A6466] max-w-sm mx-auto">
              You have no active reminders in this category. Tap "Add Reminder" to schedule prenatal vitamins or water checks.
            </p>
          </div>
        ) : (
          filteredReminders.map((reminder) => {
            const Icon = getKindIcon(reminder.kind);
            const isTaken = reminder.stateToday === 'taken';

            return (
              <div
                key={reminder.id}
                className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 bg-white ${
                  isTaken ? 'border-[#D9EADF] bg-[#FCFDFD]' : 'border-[#EAD7D2] hover:border-[#D6B5AD]'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => onToggleReminder(reminder.id)}
                    className="mt-0.5 flex-shrink-0 cursor-pointer text-[#9F4F52] hover:scale-110 transition-transform"
                  >
                    {isTaken ? (
                      <CheckCircle2 className="w-6 h-6 text-[#3E8E5A] fill-[#EAF6ED]" />
                    ) : (
                      <Circle className="w-6 h-6 text-[#B89B9E]" />
                    )}
                  </button>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-base font-bold ${isTaken ? 'line-through text-[#8F7C7E]' : 'text-[#2E2020]'}`}>
                        {reminder.title}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FAF0EB] text-[#7A4448]">
                        {reminder.localTime}
                      </span>
                      <span className="text-[10px] uppercase font-medium px-2 py-0.5 rounded-full bg-[#F3EDE8] text-[#695658]">
                        {reminder.kind}
                      </span>
                    </div>

                    {reminder.instructions && (
                      <p className="text-xs text-[#6E595C] leading-relaxed">
                        {reminder.instructions}
                      </p>
                    )}

                    {/* Active Days */}
                    <div className="flex items-center gap-1 pt-1">
                      {dayNames.map((d, i) => {
                        const active = reminder.daysOfWeek.includes(i);
                        return (
                          <span
                            key={d}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              active ? 'bg-[#EEDBCE] text-[#593E41]' : 'text-[#C7B5B8]'
                            }`}
                          >
                            {d[0]}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onToggleReminder(reminder.id)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                      isTaken
                        ? 'bg-[#EAF6ED] text-[#246A3C]'
                        : 'bg-[#F9ECE8] text-[#842D33] hover:bg-[#F2DFDA]'
                    }`}
                  >
                    {isTaken ? t.taken : t.markTaken}
                  </button>

                  <button
                    onClick={() => onDeleteReminder(reminder.id)}
                    className="p-1.5 text-[#A68F92] hover:text-[#B83E48] rounded-lg hover:bg-[#FCECEC] transition-colors cursor-pointer"
                    title="Delete reminder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Reminder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EAD7D2] max-w-md w-full p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-[#2E2020]">
                {t.addReminder}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#F5ECE8] text-[#7A6466] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4B393C] uppercase tracking-wider mb-1">
                  Reminder Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Iron Supplement, Evening Walk, Doctor Checkup"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#DDC6C0] focus:outline-none focus:ring-2 focus:ring-[#9F4F52]/30 bg-[#FFFDFC]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#4B393C] uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as ReminderKind)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#DDC6C0] focus:outline-none focus:ring-2 focus:ring-[#9F4F52]/30 bg-[#FFFDFC]"
                  >
                    <option value="medication">Medication / Vitamin</option>
                    <option value="hydration">Hydration / Water</option>
                    <option value="appointment">Appointment</option>
                    <option value="nutrition">Nutrition Snack</option>
                    <option value="custom">Custom Reminder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4B393C] uppercase tracking-wider mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    required
                    value={localTime}
                    onChange={(e) => setLocalTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#DDC6C0] focus:outline-none focus:ring-2 focus:ring-[#9F4F52]/30 bg-[#FFFDFC]"
                  >
                  </input>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4B393C] uppercase tracking-wider mb-1">
                  Gentle Instructions / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Take with orange juice, avoid dairy within 2 hours"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#DDC6C0] focus:outline-none focus:ring-2 focus:ring-[#9F4F52]/30 bg-[#FFFDFC]"
                />
              </div>

              {/* Day selection */}
              <div>
                <label className="block text-xs font-bold text-[#4B393C] uppercase tracking-wider mb-1.5">
                  Repeat On
                </label>
                <div className="flex gap-1.5">
                  {dayNames.map((d, index) => {
                    const isSelected = selectedDays.includes(index);
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => {
                          if (isSelected) {
                            if (selectedDays.length > 1) {
                              setSelectedDays(selectedDays.filter((i) => i !== index));
                            }
                          } else {
                            setSelectedDays([...selectedDays, index].sort());
                          }
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#9F4F52] text-white'
                            : 'bg-[#F4ECE8] text-[#7A6466] hover:bg-[#EADBCE]'
                        }`}
                      >
                        {d[0]}
                      </button>
                    );
                  })}
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
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
