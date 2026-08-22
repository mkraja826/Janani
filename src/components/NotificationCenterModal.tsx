import React, { useState } from 'react';
import { 
  Bell, 
  Heart, 
  Pill, 
  Droplet, 
  Calendar, 
  CheckCircle2, 
  Trash2, 
  X, 
  Sparkles, 
  Volume2, 
  ShieldCheck, 
  Smartphone, 
  Clock, 
  Send,
  Check,
  Footprints,
  Play
} from 'lucide-react';
import { InAppNotification, NotificationCategory, NotificationSettings, TabId, UserProfile } from '../types';
import { playGentleChime, ChimeType } from '../utils/audioChime';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: InAppNotification[];
  settings: NotificationSettings;
  user: UserProfile;
  onUpdateSettings: (settings: Partial<NotificationSettings>) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onDeleteNotification: (id: string) => void;
  onTriggerSimulatedNotification: (notif: Omit<InAppNotification, 'id' | 'timestamp'>) => void;
  onSelectTab: (tab: TabId) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  settings,
  user,
  onUpdateSettings,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onDeleteNotification,
  onTriggerSimulatedNotification,
  onSelectTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'inbox' | 'simulate' | 'settings'>('inbox');
  const [selectedFilter, setSelectedFilter] = useState<'all' | NotificationCategory>('all');
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });
  const [soundTestSuccess, setSoundTestSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setBrowserPermission(perm);
        if (perm === 'granted') {
          onUpdateSettings({ pushEnabled: true });
          // Send test system push notification
          new Notification('Janani Pregnancy Care', {
            body: 'Push notifications are active! You will receive gentle prenatal reminders & partner love notes.',
            icon: '/icon.png',
            badge: '/icon.png',
          });
        }
      } catch (err) {
        console.error('Error requesting notification permission:', err);
      }
    }
  };

  const handleTestSound = (type: ChimeType) => {
    playGentleChime(type, 0.5);
    setSoundTestSuccess(type);
    setTimeout(() => setSoundTestSuccess(null), 1500);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (selectedFilter === 'all') return true;
    return n.category === selectedFilter;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'medicine':
        return <Pill className="w-4 h-4 text-[#C2334D]" />;
      case 'partner':
        return <Heart className="w-4 h-4 text-[#9F4F52]" />;
      case 'hydration':
        return <Droplet className="w-4 h-4 text-[#0066CC]" />;
      case 'clinical':
        return <Calendar className="w-4 h-4 text-[#6B46C1]" />;
      default:
        return <Bell className="w-4 h-4 text-[#713B44]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      />

      <div className="relative z-10 bg-[#FFFDFB] rounded-3xl border border-[#EAD7D2] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-[#EAD7D2] bg-gradient-to-r from-[#FAF4F0] via-[#FFFDFB] to-[#FAF4F0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#9F4F52] text-white shadow-sm shadow-[#9F4F52]/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl font-bold text-[#2E2020]">Notification Hub</h3>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-bold bg-[#9F4F52] text-white px-2 py-0.5 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="text-xs text-[#7A6466]">
                Smart prenatal alarms, partner connection alerts & custom schedule controls
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#7A6466] hover:text-[#2E2020] hover:bg-[#F2DFDA] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#EAD7D2] bg-[#FAF5F2] px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('inbox')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'inbox'
                ? 'border-[#9F4F52] text-[#9F4F52]'
                : 'border-transparent text-[#7A6466] hover:text-[#2E2020]'
            }`}
          >
            Inbox & Alerts ({notifications.length})
          </button>
          <button
            onClick={() => setActiveSubTab('simulate')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'simulate'
                ? 'border-[#9F4F52] text-[#9F4F52]'
                : 'border-transparent text-[#7A6466] hover:text-[#2E2020]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#9F4F52]" />
            <span>Test Simulator</span>
          </button>
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'settings'
                ? 'border-[#9F4F52] text-[#9F4F52]'
                : 'border-transparent text-[#7A6466] hover:text-[#2E2020]'
            }`}
          >
            Preferences & Sound
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* TAB 1: INBOX */}
          {activeSubTab === 'inbox' && (
            <div className="space-y-4">
              {/* Category Filter Pills & Mass Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {(['all', 'medicine', 'partner', 'hydration', 'clinical'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedFilter(cat)}
                      className={`px-3 py-1 rounded-full capitalize text-[11px] font-medium transition-all cursor-pointer ${
                        selectedFilter === cat
                          ? 'bg-[#9F4F52] text-white shadow-xs'
                          : 'bg-[#F5ECE8] text-[#635052] hover:bg-[#EBDAD4]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllAsRead}
                      className="text-[#9F4F52] hover:underline font-medium cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={onClearAll}
                      className="text-[#9A7D80] hover:text-[#C2334D] cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List */}
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12 bg-[#FAF5F2] rounded-2xl border border-dashed border-[#EAD7D2]">
                  <Bell className="w-8 h-8 text-[#C4B2B4] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#5A4547]">No notifications in this filter</p>
                  <p className="text-xs text-[#8A7376] mt-0.5">You are up to date with all care routines!</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onMarkAsRead(n.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        n.isRead
                          ? 'bg-white border-[#EAD7D2] text-[#4F3E40] opacity-80'
                          : 'bg-[#FFF9F7] border-[#F2C5BC] shadow-xs text-[#2E2020]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-[#FAF0EB] border border-[#F2DFDA] shrink-0 mt-0.5">
                          {getCategoryIcon(n.category)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs sm:text-sm font-bold truncate">{n.title}</h4>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-[#9A8184]">{n.timestamp}</span>
                              {!n.isRead && (
                                <span className="w-2 h-2 rounded-full bg-[#9F4F52]" />
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-[#6B5558] mt-1 leading-relaxed">{n.body}</p>

                          {/* Quick Action */}
                          {n.actionLabel && (
                            <div className="mt-2.5 flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (n.actionData?.tabId) {
                                    onSelectTab(n.actionData.tabId);
                                    onClose();
                                  }
                                  onMarkAsRead(n.id);
                                }}
                                className="px-3 py-1 rounded-xl bg-[#9F4F52] hover:bg-[#85383B] text-white text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                {n.actionLabel}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteNotification(n.id);
                                }}
                                className="p-1 rounded-lg text-[#9A8184] hover:text-[#C2334D] hover:bg-[#FCEAE8] transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TEST SIMULATOR */}
          {activeSubTab === 'simulate' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FAF5F2] border border-[#EAD7D2]">
                <h4 className="text-xs font-bold text-[#9F4F52] uppercase tracking-wider mb-1">
                  Interactive Alert Dispatcher
                </h4>
                <p className="text-xs text-[#635052] leading-relaxed">
                  Trigger live maternal notifications right now to experience real-time in-app banners, sound chimes, and browser push alerts.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Medication Alarm */}
                <div className="p-3.5 rounded-2xl border border-[#F5C7CE] bg-[#FFF8F9] flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-[#C2334D]" />
                      <span className="text-xs font-bold text-[#2E2020]">Prenatal Iron & DHA</span>
                    </div>
                    <p className="text-[11px] text-[#7A6466] mt-1">
                      Critical daily iron supplement reminder with optimal absorption advice.
                    </p>
                  </div>
                  <button
                    onClick={() => onTriggerSimulatedNotification({
                      title: '💊 Prenatal Iron & Folic Acid Due',
                      body: 'Time for your 60mg Elemental Iron. Take with Vitamin C for optimal absorption.',
                      category: 'medicine',
                      isRead: false,
                      actionLabel: 'Mark Taken',
                      actionType: 'toggle-reminder',
                      actionData: { reminderId: 'rem_2' },
                      urgency: 'high',
                    })}
                    className="w-full py-2 px-3 rounded-xl bg-[#C2334D] hover:bg-[#A8253D] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Trigger Medicine Alarm</span>
                  </button>
                </div>

                {/* 2. Partner Warmth */}
                <div className="p-3.5 rounded-2xl border border-[#FAD2C7] bg-[#FFF9F7] flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-[#9F4F52]" />
                      <span className="text-xs font-bold text-[#2E2020]">Partner Thinking of You</span>
                    </div>
                    <p className="text-[11px] text-[#7A6466] mt-1">
                      Sweet affectionate nudge and voice note from partner Rohan.
                    </p>
                  </div>
                  <button
                    onClick={() => onTriggerSimulatedNotification({
                      title: '💖 Hug from Rohan',
                      body: '"Thinking of you and our baby right now. Keep resting and drink some water ❤️"',
                      category: 'partner',
                      isRead: false,
                      actionLabel: 'Send Love Back',
                      actionType: 'open-tab',
                      actionData: { tabId: 'thinking-of-you' },
                      urgency: 'normal',
                    })}
                    className="w-full py-2 px-3 rounded-xl bg-[#9F4F52] hover:bg-[#85383B] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Trigger Partner Nudge</span>
                  </button>
                </div>

                {/* 3. Hydration */}
                <div className="p-3.5 rounded-2xl border border-[#CCE5FF] bg-[#F5FAFF] flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-[#0066CC]" />
                      <span className="text-xs font-bold text-[#2E2020]">Hydration Goal (250ml)</span>
                    </div>
                    <p className="text-[11px] text-[#7A6466] mt-1">
                      Gentle afternoon reminder to maintain amniotic fluid volume.
                    </p>
                  </div>
                  <button
                    onClick={() => onTriggerSimulatedNotification({
                      title: '💧 Afternoon Hydration Check',
                      body: 'Time for 1 tall glass of cool infused water (Goal: 2.2L today).',
                      category: 'hydration',
                      isRead: false,
                      actionLabel: 'Logged Glass',
                      actionType: 'toggle-reminder',
                      actionData: { reminderId: 'rem_3' },
                      urgency: 'low',
                    })}
                    className="w-full py-2 px-3 rounded-xl bg-[#0066CC] hover:bg-[#004C99] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Trigger Hydration Alert</span>
                  </button>
                </div>

                {/* 4. Clinical Ultrasound */}
                <div className="p-3.5 rounded-2xl border border-[#E2DCFF] bg-[#FAF8FF] flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#6B46C1]" />
                      <span className="text-xs font-bold text-[#2E2020]">Antenatal Scan Milestone</span>
                    </div>
                    <p className="text-[11px] text-[#7A6466] mt-1">
                      Week 28 clinical glucose tolerance & ultrasound checkup alert.
                    </p>
                  </div>
                  <button
                    onClick={() => onTriggerSimulatedNotification({
                      title: '🩺 Week 28 Growth Scan Scheduled',
                      body: 'Dr. Sarah Mitchell at City Maternity Clinic. Remember to bring your prenatal passport!',
                      category: 'clinical',
                      isRead: false,
                      actionLabel: 'View Care Timeline',
                      actionType: 'open-tab',
                      actionData: { tabId: 'care-timeline' },
                      urgency: 'normal',
                    })}
                    className="w-full py-2 px-3 rounded-xl bg-[#6B46C1] hover:bg-[#5534A3] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Trigger Clinical Alert</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SETTINGS & SOUND PREVIEW */}
          {activeSubTab === 'settings' && (
            <div className="space-y-4">
              
              {/* Browser Push Permission Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFF5F2] to-[#FFFDFB] border border-[#EADBCE] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-5 h-5 text-[#9F4F52]" />
                    <div>
                      <h4 className="text-xs font-bold text-[#2E2020]">Device & Browser Push Notifications</h4>
                      <p className="text-[11px] text-[#7A6466]">
                        Status: <strong className="capitalize text-[#9F4F52]">{browserPermission}</strong>
                      </p>
                    </div>
                  </div>

                  {browserPermission !== 'granted' ? (
                    <button
                      onClick={handleRequestPushPermission}
                      className="px-3.5 py-1.5 rounded-xl bg-[#9F4F52] text-white text-xs font-semibold hover:bg-[#85383B] transition-colors cursor-pointer"
                    >
                      Enable Push
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Active
                    </span>
                  )}
                </div>
              </div>

              {/* Sound & Melodic Chime Test */}
              <div className="p-4 rounded-2xl bg-white border border-[#EAD7D2] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-[#9F4F52]" />
                    <span className="text-xs font-bold text-[#2E2020]">Maternal Harmonic Chimes (Web Audio)</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.soundEnabled}
                      onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#9F4F52]"></div>
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {[
                    { id: 'medicine', label: 'Medicine Alarm', icon: Pill },
                    { id: 'partner', label: 'Partner Love', icon: Heart },
                    { id: 'water', label: 'Water Drop', icon: Droplet },
                    { id: 'clinical', label: 'Milestone Bell', icon: Calendar },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleTestSound(s.id as ChimeType)}
                      className={`p-2 rounded-xl border text-center text-xs transition-all cursor-pointer ${
                        soundTestSuccess === s.id
                          ? 'border-[#9F4F52] bg-[#FAF0EB] text-[#9F4F52] font-bold scale-105'
                          : 'border-[#EAD7D2] bg-[#FAF5F2] hover:bg-[#F2E5E0] text-[#5C484B]'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5 mx-auto mb-1 text-[#9F4F52]" />
                      <span className="text-[10px] block font-medium">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Granular Channels */}
              <div className="p-4 rounded-2xl bg-white border border-[#EAD7D2] space-y-3">
                <h4 className="text-xs font-bold text-[#2E2020] uppercase tracking-wider">
                  Notification Channels & Frequency
                </h4>

                <div className="divide-y divide-[#F2E8E4] text-xs">
                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#2E2020]">High-Priority Medication Alarms</div>
                      <div className="text-[11px] text-[#7A6466]">Iron, prenatal vitamins, calcium schedules</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.medicineAlarms}
                      onChange={(e) => onUpdateSettings({ medicineAlarms: e.target.checked })}
                      className="accent-[#9F4F52] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#2E2020]">Thinking of You (Partner Nudges)</div>
                      <div className="text-[11px] text-[#7A6466]">Instant love notes and connection nudges</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.partnerNudges}
                      onChange={(e) => onUpdateSettings({ partnerNudges: e.target.checked })}
                      className="accent-[#9F4F52] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#2E2020]">Gentle Hydration Prompts</div>
                      <div className="text-[11px] text-[#7A6466]">Interval water reminders throughout the day</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.hydrationReminders}
                      onChange={(e) => onUpdateSettings({ hydrationReminders: e.target.checked })}
                      className="accent-[#9F4F52] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#2E2020]">Clinical Milestones & Scans</div>
                      <div className="text-[11px] text-[#7A6466]">Week changes, ultrasound and lab check-ins</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.clinicalMilestones}
                      onChange={(e) => onUpdateSettings({ clinicalMilestones: e.target.checked })}
                      className="accent-[#9F4F52] w-4 h-4 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Quiet Hours */}
              <div className="p-4 rounded-2xl bg-white border border-[#EAD7D2] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#9F4F52]" />
                    <span className="text-xs font-bold text-[#2E2020]">Night-time Quiet Hours (Maternal Rest)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.quietHoursEnabled}
                    onChange={(e) => onUpdateSettings({ quietHoursEnabled: e.target.checked })}
                    className="accent-[#9F4F52] w-4 h-4 cursor-pointer"
                  />
                </div>

                {settings.quietHoursEnabled && (
                  <div className="flex items-center gap-3 pt-1 text-xs">
                    <div className="flex-1">
                      <label className="text-[11px] text-[#7A6466] block mb-1">Silence From</label>
                      <input
                        type="time"
                        value={settings.quietHoursStart}
                        onChange={(e) => onUpdateSettings({ quietHoursStart: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-[#DDC6C0] bg-[#FFFDFC]"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[11px] text-[#7A6466] block mb-1">Until</label>
                      <input
                        type="time"
                        value={settings.quietHoursEnd}
                        onChange={(e) => onUpdateSettings({ quietHoursEnd: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-[#DDC6C0] bg-[#FFFDFC]"
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#EAD7D2] bg-[#FAF5F2] flex items-center justify-between text-xs text-[#7A6466]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-green-700" />
            <span>Zero-Ad, Client-Encrypted Notification Dispatch</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#2E2020] hover:bg-black text-white font-semibold cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
