'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppNotification, NotificationSettings } from '@/types/notification';
import type { Task } from '@/types/task';
import {
  DEFAULT_SETTINGS,
  getStoredSettings,
  saveStoredSettings,
  getStoredNotifications,
  saveStoredNotifications,
  getStoredSentReminderKeys,
  saveStoredSentReminderKeys,
  getStoredDailySummaryDate,
  saveStoredDailySummaryDate,
} from '@/lib/notification-storage';
import { playGhibliChime, playCompletionChime } from '@/lib/sound-utils';
import { REMINDER_POLL_INTERVAL_MS } from '@/lib/constants';
import { shouldSendDailySummary, getDueReminders, formatReminderTimeText } from '@/lib/reminder-engine';
import { useLocalStorage } from './useLocalStorage';

const DAY_MAP = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];


export function useNotifications(tasks: Task[]) {
  const [settings, setSettings] = useLocalStorage(DEFAULT_SETTINGS, getStoredSettings, saveStoredSettings);
  const [notifications, setNotifications] = useLocalStorage<AppNotification[]>(
    [],
    getStoredNotifications,
    saveStoredNotifications
  );
  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');

  // Track sent reminders and daily summary date persistently
  const sentRemindersRef = useRef<Set<string>>(new Set());
  const dailySummarySentRef = useRef<string | null>(null);

  // Load ref-backed state and detect notification permission after mount
  useEffect(() => {
    sentRemindersRef.current = new Set(getStoredSentReminderKeys());
    dailySummarySentRef.current = getStoredDailySummaryDate();
    // Deliberate post-mount sync from the browser Notification API (unavailable during SSR).
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPermissionStatus(Notification.permission);
    } else if (typeof window !== 'undefined') {
      setPermissionStatus('unsupported');
    }
  }, []);



  // Persist settings changes
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, [setSettings]);

  // Persist notification changes
  const addNotification = useCallback(
    (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
      const cleanTitle = notification.title.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]/gu, '').trim();
      const cleanMessage = notification.message.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]/gu, '').trim();

      const newNotif: AppNotification = {
        ...notification,
        title: cleanTitle,
        message: cleanMessage,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
      };

      setNotifications((prev) => [newNotif, ...prev]);

      // Add to active toast queue
      setActiveToasts((prev) => [newNotif, ...prev]);

      // Sound chime
      if (settings.soundEnabled) {
        if (notification.type === 'completion') {
          playCompletionChime();
        } else {
          playGhibliChime();
        }
      }

      // Native Browser push/notification
      if (
        settings.nativeNotificationsEnabled &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
          });
        } catch (err) {
          console.error('Failed to trigger native notification', err);
        }
      }
    },
    [settings.soundEnabled, settings.nativeNotificationsEnabled, setNotifications]
  );

  const dismissToast = useCallback((id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, [setNotifications]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [setNotifications]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, [setNotifications]);

  const requestNativePermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermissionStatus('unsupported');
      alert('Browser notifications are not supported in this browser.');
      return;
    }
    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);
    if (permission === 'granted') {
      updateSettings({ nativeNotificationsEnabled: true });
    } else {
      updateSettings({ nativeNotificationsEnabled: false });
    }
  }, [updateSettings]);

  // Completion toast trigger
  const notifyTaskCompleted = useCallback(
    (taskName: string, taskColor?: string) => {
      if (!settings.enabled) return;
      addNotification({
        title: 'Task Completed!',
        message: `Awesome work completing "${taskName}"!`,
        type: 'completion',
        taskColor: taskColor || 'bg-[#A5D6A7]',
      });
    },
    [addNotification, settings.enabled]
  );

  // Background check interval for scheduled task reminders and daily summary
  useEffect(() => {
    if (!settings.enabled) return;

    const checkReminders = () => {
      const now = new Date();
      const currentDayShort = DAY_MAP[now.getDay()];

      // 1. Daily morning summary check
      if (settings.dailySummaryEnabled) {
        const summaryCheck = shouldSendDailySummary(tasks, currentDayShort, now, dailySummarySentRef.current);
        if (summaryCheck.send) {
          const currentDateStr = now.toDateString();
          dailySummarySentRef.current = currentDateStr;
          saveStoredDailySummaryDate(currentDateStr);
          addNotification({
            title: "Today's Schedule Summary",
            message: `You have ${summaryCheck.taskCount} task${summaryCheck.taskCount > 1 ? 's' : ''} scheduled for ${currentDayShort}!`,
            type: 'summary',
          });
        }
      }

      // 2. Pre-task start reminders check
      const dueReminders = getDueReminders(tasks, currentDayShort, now, settings.defaultLeadTime, sentRemindersRef.current);
      for (const { task, reminderKey, leadTime } of dueReminders) {
        sentRemindersRef.current.add(reminderKey);
        saveStoredSentReminderKeys(Array.from(sentRemindersRef.current));

        addNotification({
          title: `Reminder: ${task.name}`,
          message: `Scheduled for ${task.startTime} (${formatReminderTimeText(leadTime)})`,
          type: 'reminder',
          taskId: task.id,
          taskColor: task.color,
        });
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, REMINDER_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [tasks, settings, addNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    settings,
    notifications,
    activeToasts,
    drawerOpen,
    unreadCount,
    permissionStatus,
    setDrawerOpen,
    dismissToast,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    updateSettings,
    requestNativePermission,
    notifyTaskCompleted,
  };
}
