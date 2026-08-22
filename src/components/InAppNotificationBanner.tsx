import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  Heart, 
  Pill, 
  Droplet, 
  Calendar, 
  CheckCircle2, 
  X, 
  ExternalLink,
  Volume2
} from 'lucide-react';
import { InAppNotification, TabId } from '../types';
import { playGentleChime } from '../utils/audioChime';

interface InAppNotificationBannerProps {
  notification: InAppNotification | null;
  onDismiss: (id: string) => void;
  onActionClick: (notification: InAppNotification) => void;
  soundEnabled?: boolean;
}

export const InAppNotificationBanner: React.FC<InAppNotificationBannerProps> = ({
  notification,
  onDismiss,
  onActionClick,
  soundEnabled = true,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!notification) return;

    // Play gentle chime
    if (soundEnabled) {
      const chimeType = 
        notification.category === 'partner' ? 'partner' :
        notification.category === 'hydration' ? 'water' :
        notification.category === 'clinical' ? 'clinical' :
        notification.category === 'medicine' ? 'medicine' : 'medicine';
      playGentleChime(chimeType);
    }

    setProgress(100);
    const duration = 6500;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onDismiss(notification.id);
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [notification?.id]);

  if (!notification) return null;

  const getCategoryConfig = (category: InAppNotification['category']) => {
    switch (category) {
      case 'medicine':
        return {
          icon: Pill,
          badge: 'MEDICATION ALARM',
          bg: 'bg-gradient-to-r from-[#FFF5F6] to-[#FFFBFB]',
          border: 'border-[#F7C6CD]',
          iconBg: 'bg-[#FEE4E8] text-[#C2334D]',
          progressColor: 'bg-[#C2334D]',
        };
      case 'partner':
        return {
          icon: Heart,
          badge: 'THINKING OF YOU',
          bg: 'bg-gradient-to-r from-[#FFF5F0] to-[#FFFDFC]',
          border: 'border-[#FAD2C7]',
          iconBg: 'bg-[#FFE2D9] text-[#9F4F52]',
          progressColor: 'bg-[#9F4F52]',
        };
      case 'hydration':
        return {
          icon: Droplet,
          badge: 'GENTLE HYDRATION',
          bg: 'bg-gradient-to-r from-[#F0F8FF] to-[#FAFDFF]',
          border: 'border-[#CCE5FF]',
          iconBg: 'bg-[#D9EFFF] text-[#0066CC]',
          progressColor: 'bg-[#0066CC]',
        };
      case 'clinical':
        return {
          icon: Calendar,
          badge: 'CLINICAL CARE',
          bg: 'bg-gradient-to-r from-[#F5F3FF] to-[#FAF8FF]',
          border: 'border-[#E2DCFF]',
          iconBg: 'bg-[#EDE7FF] text-[#6B46C1]',
          progressColor: 'bg-[#6B46C1]',
        };
      default:
        return {
          icon: Bell,
          badge: 'CARE REMINDER',
          bg: 'bg-[#FFFDFB]',
          border: 'border-[#EAD7D2]',
          iconBg: 'bg-[#FAF0EB] text-[#713B44]',
          progressColor: 'bg-[#713B44]',
        };
    }
  };

  const config = getCategoryConfig(notification.category);
  const Icon = config.icon;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg animate-in slide-in-from-top-4 fade-in duration-300">
      <div 
        id={`inapp-notification-${notification.id}`}
        className={`relative overflow-hidden rounded-2xl border ${config.border} ${config.bg} shadow-xl p-4 transition-all hover:shadow-2xl`}
      >
        {/* Top Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-black/5">
          <div 
            className={`h-full ${config.progressColor} transition-all duration-75`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-start gap-3 mt-1">
          {/* Category Icon */}
          <div className={`p-2.5 rounded-xl shrink-0 ${config.iconBg} shadow-xs`}>
            <Icon className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/80 border border-black/5 text-[#5C4548]">
                {config.badge}
              </span>
              <span className="text-[11px] text-[#9A8184]">{notification.timestamp}</span>
            </div>

            <h4 className="text-sm font-bold text-[#2E2020] leading-snug">{notification.title}</h4>
            <p className="text-xs text-[#634E51] mt-0.5 leading-relaxed line-clamp-2">{notification.body}</p>

            {/* Direct Action Button */}
            {notification.actionLabel && (
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  id="inapp-notification-action-btn"
                  onClick={() => onActionClick(notification)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#9F4F52] hover:bg-[#85383B] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{notification.actionLabel}</span>
                </button>
                <button
                  onClick={() => onDismiss(notification.id)}
                  className="px-2.5 py-1.5 rounded-xl bg-white/70 hover:bg-white text-xs font-medium text-[#735D60] border border-black/5 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={() => onDismiss(notification.id)}
            className="absolute top-3 right-3 p-1.5 rounded-full text-[#9A8184] hover:text-[#2E2020] hover:bg-black/5 transition-colors cursor-pointer"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
