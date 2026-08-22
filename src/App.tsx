import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TabId, 
  UserProfile, 
  Reminder, 
  JournalEntry, 
  PartnerNudge, 
  HealthTrackerData, 
  TimelineMilestone, 
  HealthProfile, 
  ChatMessage, 
  LanguageCode,
  InAppNotification,
  NotificationSettings
} from './types';
import { 
  INITIAL_USER_PROFILE, 
  INITIAL_REMINDERS, 
  INITIAL_JOURNAL_ENTRIES, 
  INITIAL_NUDGES, 
  INITIAL_HEALTH_DATA, 
  INITIAL_TIMELINE, 
  INITIAL_HEALTH_PROFILE, 
  INITIAL_AI_CHAT,
  INITIAL_NOTIFICATIONS,
  INITIAL_NOTIFICATION_SETTINGS
} from './data/initialState';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { HomeTab } from './components/HomeTab';
import { PregnancyGuideTab } from './components/PregnancyGuideTab';
import { RemindersTab } from './components/RemindersTab';
import { JournalTab } from './components/JournalTab';
import { ThinkingOfYouTab } from './components/ThinkingOfYouTab';
import { HealthTrackerTab } from './components/HealthTrackerTab';
import { FoodGuideTab } from './components/FoodGuideTab';
import { CareTimelineTab } from './components/CareTimelineTab';
import { HealthProfileTab } from './components/HealthProfileTab';
import { AiCompanionTab } from './components/AiCompanionTab';
import { SafetyPrivacyTab } from './components/SafetyPrivacyTab';
import { SettingsTab } from './components/SettingsTab';
import { BottomNavbar } from './components/BottomNavbar';
import { WidgetStudio } from './components/WidgetStudio';
import { InAppNotificationBanner } from './components/InAppNotificationBanner';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { playChime } from './utils/audioChime';
import { calculatePregnancyProgress } from './utils/pregnancy';

export const App: React.FC = () => {
  // State Initialization from LocalStorage or Defaults
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('janani_user');
    return saved ? JSON.parse(saved) : INITIAL_USER_PROFILE;
  });

  const [activeTab, setActiveTab] = useState<TabId>('home');

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('janani_reminders');
    return saved ? JSON.parse(saved) : INITIAL_REMINDERS;
  });

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('janani_journal');
    return saved ? JSON.parse(saved) : INITIAL_JOURNAL_ENTRIES;
  });

  const [nudges, setNudges] = useState<PartnerNudge[]>(() => {
    const saved = localStorage.getItem('janani_nudges');
    return saved ? JSON.parse(saved) : INITIAL_NUDGES;
  });

  const [healthData, setHealthData] = useState<HealthTrackerData>(() => {
    const saved = localStorage.getItem('janani_health_data');
    return saved ? JSON.parse(saved) : INITIAL_HEALTH_DATA;
  });

  const [timeline, setTimeline] = useState<TimelineMilestone[]>(() => {
    const saved = localStorage.getItem('janani_timeline');
    return saved ? JSON.parse(saved) : INITIAL_TIMELINE;
  });

  const [healthProfile, setHealthProfile] = useState<HealthProfile>(() => {
    const saved = localStorage.getItem('janani_health_profile');
    return saved ? JSON.parse(saved) : INITIAL_HEALTH_PROFILE;
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('janani_chat');
    return saved ? JSON.parse(saved) : INITIAL_AI_CHAT;
  });

  // Notification States
  const [notifications, setNotifications] = useState<InAppNotification[]>(() => {
    const saved = localStorage.getItem('janani_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('janani_notification_settings');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATION_SETTINGS;
  });

  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [activeBannerNotification, setActiveBannerNotification] = useState<InAppNotification | null>(null);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('janani_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('janani_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('janani_journal', JSON.stringify(journalEntries));
  }, [journalEntries]);

  useEffect(() => {
    localStorage.setItem('janani_nudges', JSON.stringify(nudges));
  }, [nudges]);

  useEffect(() => {
    localStorage.setItem('janani_health_data', JSON.stringify(healthData));
  }, [healthData]);

  useEffect(() => {
    localStorage.setItem('janani_timeline', JSON.stringify(timeline));
  }, [timeline]);

  useEffect(() => {
    localStorage.setItem('janani_health_profile', JSON.stringify(healthProfile));
  }, [healthProfile]);

  useEffect(() => {
    localStorage.setItem('janani_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem('janani_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('janani_notification_settings', JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  // Handlers
  const handleToggleRole = () => {
    setUser((prev) => ({
      ...prev,
      role: prev.role === 'mother' ? 'partner' : 'mother',
    }));
  };

  const handleLanguageChange = (lang: LanguageCode) => {
    setUser((prev) => ({ ...prev, language: lang }));
  };

  const handleToggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const isCurrentlyTaken = r.stateToday === 'taken';
          return {
            ...r,
            stateToday: isCurrentlyTaken ? 'pending' : 'taken',
            takenAt: isCurrentlyTaken ? undefined : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return r;
      })
    );
  };

  const handleAddReminder = (newRem: Omit<Reminder, 'id' | 'stateToday'>) => {
    const reminder: Reminder = {
      ...newRem,
      id: `rem_${Date.now()}`,
      stateToday: 'pending',
    };
    setReminders((prev) => [reminder, ...prev]);
  };

  const handleDeleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddJournalEntry = (newEntry: Omit<JournalEntry, 'id' | 'createdAt'>) => {
    const entry: JournalEntry = {
      ...newEntry,
      id: `jrn_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setJournalEntries((prev) => [entry, ...prev]);
  };

  const handleDeleteJournalEntry = (id: string) => {
    setJournalEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSendNudge = (message: string) => {
    const newNudge: PartnerNudge = {
      id: `ndg_${Date.now()}`,
      senderRole: user.role,
      senderName: user.role === 'mother' ? user.name : (user.partnerName || 'Partner'),
      message,
      createdAt: new Date().toISOString(),
      acknowledgedAt: null,
    };
    setNudges((prev) => [...prev, newNudge]);

    // Create a live in-app notification for the partner
    const notif: InAppNotification = {
      id: `notif_${Date.now()}`,
      title: user.role === 'mother' ? `Love note from ${user.name}` : `Love note from ${user.partnerName || 'Rohan'}`,
      message: `"${message}"`,
      category: 'partner',
      priority: 'high',
      createdAt: new Date().toISOString(),
      isRead: false,
      actionLabel: 'View in Thinking of You',
      actionTarget: 'thinking-of-you',
      chimeSound: 'partner',
    };

    setNotifications((prev) => [notif, ...prev]);
    setActiveBannerNotification(notif);
    if (notificationSettings.soundEnabled) {
      playChime('partner', notificationSettings.audioVolume);
    }
  };

  const handleAcknowledgeNudge = (id: string) => {
    setNudges((prev) =>
      prev.map((n) => (n.id === id ? { ...n, acknowledgedAt: new Date().toISOString() } : n))
    );
  };

  const handleToggleTimeline = (id: string) => {
    setTimeline((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))
    );
  };

  // Notification actions
  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleTriggerTestNotification = (category: InAppNotification['category'], priority: InAppNotification['priority']) => {
    const testTitles: Record<InAppNotification['category'], { title: string; message: string; sound: InAppNotification['chimeSound']; actionLabel?: string; actionTarget?: string }> = {
      medicine: {
        title: 'Time for Iron & Folic Acid Capsule',
        message: 'Take 1 tablet with a fresh glass of citrus water or lemonade for maximum absorption.',
        sound: 'medicine',
        actionLabel: 'Mark Dose Taken',
        actionTarget: 'reminders',
      },
      hydration: {
        title: 'Midday Hydration Refill 💧',
        message: 'Drink 250ml water now. Supporting healthy amniotic fluid circulation at Week 28.',
        sound: 'water',
        actionLabel: 'Check Food Guide',
        actionTarget: 'food-guide',
      },
      partner: {
        title: 'Rohan sent a heart tap ❤️',
        message: '"Thinking of you and our little baby right now. Rest well today!"',
        sound: 'partner',
        actionLabel: 'Send Love Back',
        actionTarget: 'thinking-of-you',
      },
      clinical: {
        title: '3rd Trimester Clinical Milestone',
        message: 'Upcoming: 28-Week Rh Antibody Screening & Glucose Tolerance follow-up scheduled.',
        sound: 'clinical',
        actionLabel: 'View Care Timeline',
        actionTarget: 'care-timeline',
      },
      system: {
        title: 'Widgets Synced Successfully 📱',
        message: 'Glanceable iOS 18 / Android 15 Home & Lock screen widgets updated with Week 28 metrics.',
        sound: 'success',
        actionLabel: 'Open Widget Studio',
        actionTarget: 'widgets',
      },
    };

    const config = testTitles[category];
    const newNotif: InAppNotification = {
      id: `notif_${Date.now()}`,
      title: config.title,
      message: config.message,
      category,
      priority,
      createdAt: new Date().toISOString(),
      isRead: false,
      actionLabel: config.actionLabel,
      actionTarget: config.actionTarget,
      chimeSound: config.sound,
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setActiveBannerNotification(newNotif);
    if (notificationSettings.soundEnabled && config.sound) {
      playChime(config.sound, notificationSettings.audioVolume);
    }
  };

  const handleBannerActionClick = (notification: InAppNotification) => {
    handleMarkNotificationAsRead(notification.id);
    setActiveBannerNotification(null);

    if (notification.actionTarget) {
      const validTabs: TabId[] = [
        'home',
        'pregnancy-guide',
        'reminders',
        'journal',
        'thinking-of-you',
        'health-tracker',
        'food-guide',
        'care-timeline',
        'health-profile',
        'ai-companion',
        'widgets',
        'safety-privacy',
        'settings',
      ];
      if (validTabs.includes(notification.actionTarget as TabId)) {
        setActiveTab(notification.actionTarget as TabId);
      }
    }
  };

  // AI Chat Handler with context awareness
  const handleSendAiMessage = (userText: string) => {
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);

    // Generate empathetic response based on trimester & topic
    const progress = calculatePregnancyProgress(user.dueDate);
    setTimeout(() => {
      let reply = '';
      const lower = userText.toLowerCase();

      if (lower.includes('pain') || lower.includes('back') || lower.includes('ache')) {
        reply = `Mild lower back tension is very common around Week ${progress.gestationalWeek} as the hormone relaxin softens pelvic ligaments and your center of gravity shifts. \n\nGentle tips to relieve discomfort:\n• Place a firm maternity pillow between your knees while sleeping on your left side.\n• Practice gentle pelvic tilts (cat-cow stretch on hands and knees).\n• Use a warm (not hot) compress for 15 minutes.\n\n⚠️ Note: If back pain is sharp, accompanied by cramping, vaginal bleeding, or fever, please contact your obstetrician right away.`;
      } else if (lower.includes('food') || lower.includes('iron') || lower.includes('eat') || lower.includes('nutrition')) {
        reply = `Nourishing your body at Week ${progress.gestationalWeek} is all about nutrient density! Here are great, pregnancy-safe iron & energy sources:\n\n1. Plant Proteins: Cooked lentils, chickpeas, moong dal with a squeeze of lemon (vitamin C doubles non-heme iron absorption!).\n2. Leafy Greens: Steamed spinach, methi, kale (cook well to reduce oxalates).\n3. Healthy Fats: Walnuts, soaked almonds, chia seed pudding.\n4. Hydration: Aim for 8-10 glasses of water daily to support amniotic fluid and ease circulation.`;
      } else if (lower.includes('partner') || lower.includes('support') || lower.includes('rohan')) {
        reply = `Partner support makes a profound emotional difference during pregnancy. \n\nHelpful ways for a partner to care today:\n• Offer an unprompted gentle foot or lower back massage with natural almond oil.\n• Keep hydration water bottles chilled and filled throughout the day.\n• Take charge of prenatal reminder schedules and grocery shopping.\n• Practice calming diaphragmatic breathing exercises together in the evening.`;
      } else if (lower.includes('braxton') || lower.includes('labor') || lower.includes('kick')) {
        reply = `At Week ${progress.gestationalWeek}, your uterus may begin practicing with Braxton Hicks contractions.\n\nDifferences to keep in mind:\n• Braxton Hicks: Irregular, painless or mild tightening, often eases when you change position or drink a tall glass of water.\n• True Labor Contractions: Regular, progressively get closer together, increase in intensity, and don't stop with rest.\n\nAlways contact your labor & delivery triage unit if you experience regular contractions before 37 weeks.`;
      } else {
        reply = `Thank you for sharing. At Week ${progress.gestationalWeek} (Day ${progress.gestationalDay}), your baby is growing rapidly and their senses are sharpening daily. \n\nRemember to take things at your own gentle pace, stay well hydrated, and pause for slow deep breaths whenever you need grounding. What else would you like to explore together?`;
      }

      const botMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, botMsg]);
    }, 600);
  };

  const handleExportData = () => {
    const exportBundle = {
      app: 'Janani - Pregnancy Care Companion',
      exportedAt: new Date().toISOString(),
      user,
      reminders,
      journalEntries,
      nudges,
      healthData,
      timeline,
      healthProfile,
      notifications,
      notificationSettings,
    };
    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `janani_pregnancy_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset all records to default demo data?')) {
      setUser(INITIAL_USER_PROFILE);
      setReminders(INITIAL_REMINDERS);
      setJournalEntries(INITIAL_JOURNAL_ENTRIES);
      setNudges(INITIAL_NUDGES);
      setHealthData(INITIAL_HEALTH_DATA);
      setTimeline(INITIAL_TIMELINE);
      setHealthProfile(INITIAL_HEALTH_PROFILE);
      setChatMessages(INITIAL_AI_CHAT);
      setNotifications(INITIAL_NOTIFICATIONS);
      setNotificationSettings(INITIAL_NOTIFICATION_SETTINGS);
      localStorage.clear();
    }
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#2E2020] flex flex-col font-sans selection:bg-[#FAD8DA] selection:text-[#7A2630]">
      
      {/* Dynamic In-App Notification Toast */}
      <InAppNotificationBanner
        notification={activeBannerNotification}
        onDismiss={() => setActiveBannerNotification(null)}
        onActionClick={handleBannerActionClick}
      />

      {/* Top Application Header with Notification & Mode Switches */}
      <Header
        user={user}
        activeTab={activeTab}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        onSelectTab={setActiveTab}
        onToggleRole={handleToggleRole}
        onLanguageChange={handleLanguageChange}
      />

      {/* Main Tab Navigation */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        user={user}
      />

      {/* Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-24 md:pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {activeTab === 'home' && (
              <HomeTab
                user={user}
                reminders={reminders}
                journalEntries={journalEntries}
                nudges={nudges}
                onSelectTab={setActiveTab}
                onToggleReminder={handleToggleReminder}
                onSendQuickNudge={handleSendNudge}
              />
            )}

            {activeTab === 'pregnancy-guide' && (
              <PregnancyGuideTab user={user} />
            )}

            {activeTab === 'reminders' && (
              <RemindersTab
                user={user}
                reminders={reminders}
                onToggleReminder={handleToggleReminder}
                onAddReminder={handleAddReminder}
                onDeleteReminder={handleDeleteReminder}
              />
            )}

            {activeTab === 'journal' && (
              <JournalTab
                user={user}
                entries={journalEntries}
                onAddEntry={handleAddJournalEntry}
                onDeleteEntry={handleDeleteJournalEntry}
              />
            )}

            {activeTab === 'thinking-of-you' && (
              <ThinkingOfYouTab
                user={user}
                nudges={nudges}
                onSendNudge={handleSendNudge}
                onAcknowledgeNudge={handleAcknowledgeNudge}
              />
            )}

            {activeTab === 'health-tracker' && (
              <HealthTrackerTab
                user={user}
                healthData={healthData}
                onAddBloodPressure={(rec) => setHealthData((p) => ({ ...p, bloodPressures: [ { ...rec, id: `bp_${Date.now()}` }, ...p.bloodPressures ] }))}
                onAddGlucose={(rec) => setHealthData((p) => ({ ...p, glucoses: [ { ...rec, id: `gl_${Date.now()}` }, ...p.glucoses ] }))}
                onAddWeight={(rec) => setHealthData((p) => ({ ...p, weights: [ { ...rec, id: `w_${Date.now()}` }, ...p.weights ] }))}
                onAddLab={(rec) => setHealthData((p) => ({ ...p, labs: [ { ...rec, id: `lab_${Date.now()}` }, ...p.labs ] }))}
                onAddSymptom={(rec) => setHealthData((p) => ({ ...p, symptoms: [ { ...rec, id: `sym_${Date.now()}` }, ...p.symptoms ] }))}
              />
            )}

            {activeTab === 'food-guide' && (
              <FoodGuideTab user={user} />
            )}

            {activeTab === 'care-timeline' && (
              <CareTimelineTab
                user={user}
                timeline={timeline}
                onToggleMilestone={handleToggleTimeline}
              />
            )}

            {activeTab === 'health-profile' && (
              <HealthProfileTab
                user={user}
                profile={healthProfile}
                onUpdateProfile={setHealthProfile}
              />
            )}

            {activeTab === 'ai-companion' && (
              <AiCompanionTab
                user={user}
                messages={chatMessages}
                onSendMessage={handleSendAiMessage}
              />
            )}

            {activeTab === 'widgets' && (
              <WidgetStudio
                user={user}
                reminders={reminders}
                nudges={nudges}
                onToggleReminder={handleToggleReminder}
                onSendQuickNudge={handleSendNudge}
                onSelectTab={setActiveTab}
              />
            )}

            {activeTab === 'safety-privacy' && (
              <SafetyPrivacyTab user={user} />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                user={user}
                onUpdateUser={(updated) => setUser((p) => ({ ...p, ...updated }))}
                onExportData={handleExportData}
                onResetData={handleResetData}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#EAD7D2] bg-[#FAF5F2] py-6 px-4 text-center text-xs text-[#7A6466] mb-14 sm:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-serif font-bold text-[#2E2020]">Janani</span> — Privacy-First Pregnancy Care & Partner Companion
          </div>
          <div className="text-[11px] text-[#8F777A]">
            Zero-Ad Platform • Client-Encrypted Storage • Clinical Support Companion
          </div>
        </div>
      </footer>

      {/* Persistent Bottom Navbar */}
      <BottomNavbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        user={user}
        reminders={reminders}
        nudges={nudges}
      />

      {/* Notification Center Hub Modal */}
      <NotificationCenterModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={notifications}
        settings={notificationSettings}
        onMarkAsRead={handleMarkNotificationAsRead}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onDeleteNotification={handleDeleteNotification}
        onClearAll={handleClearAllNotifications}
        onTriggerTestNotification={handleTriggerTestNotification}
        onUpdateSettings={setNotificationSettings}
      />
    </div>
  );
};
export default App;
