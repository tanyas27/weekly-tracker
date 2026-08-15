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

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useNotifications(tasks: Task[], calendarId?: string) {
  const [settings, setSettings] = useLocalStorage(DEFAULT_SETTINGS, getStoredSettings, saveStoredSettings);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Track sent reminders and daily summary date persistently
  const sentRemindersRef = useRef<Set<string>>(new Set());
  const dailySummarySentRef = useRef<string | null>(null);

  // Sync Push subscription helper
  const syncPushSubscription = useCallback(async (currentCalendarId?: string) => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub && Notification.permission === 'granted') {
        const res = await fetch('/api/notifications/vapid-key');
        if (res.ok) {
          const { publicKey } = await res.json();
          if (publicKey) {
            const applicationServerKey = urlBase64ToUint8Array(publicKey);
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey,
            });
          }
        }
      }

      if (sub) {
        setIsPushSubscribed(true);
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: sub.toJSON(),
            calendarId: currentCalendarId || undefined,
          }),
        });
        return true;
      }
    } catch (err) {
      console.warn('Push sync notice:', err);
    }
    return false;
  }, []);

  // Load ref-backed state and detect notification permission after mount & calendarId change
  useEffect(() => {
    queueMicrotask(() => {
      setNotifications(getStoredNotifications(calendarId));
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermissionStatus(Notification.permission);
        if (Notification.permission === 'granted') {
          syncPushSubscription(calendarId);
        }
      } else if (typeof window !== 'undefined') {
        setPermissionStatus('unsupported');
      }
    });
    sentRemindersRef.current = new Set(getStoredSentReminderKeys(calendarId));
    dailySummarySentRef.current = getStoredDailySummaryDate();
  }, [calendarId, syncPushSubscription]);

  // Persist notification changes helper
  const updateNotifications = useCallback(
    (updater: (prev: AppNotification[]) => AppNotification[]) => {
      setNotifications((prev) => {
        const next = updater(prev);
        saveStoredNotifications(next, calendarId);
        return next;
      });
    },
    [calendarId]
  );

  // Persist settings changes
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, [setSettings]);

  // Add notification
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

      updateNotifications((prev) => [newNotif, ...prev]);

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
    [settings.soundEnabled, settings.nativeNotificationsEnabled, updateNotifications]
  );

  const dismissToast = useCallback((id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    updateNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, [updateNotifications]);

  const markAllAsRead = useCallback(() => {
    updateNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [updateNotifications]);

  const clearAllNotifications = useCallback(() => {
    updateNotifications(() => []);
  }, [updateNotifications]);

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
      await syncPushSubscription(calendarId);
    } else {
      updateSettings({ nativeNotificationsEnabled: false });
      setIsPushSubscribed(false);
    }
  }, [updateSettings, syncPushSubscription, calendarId]);

  // Test Notification Trigger (sends real Web Push if supported)
  const sendTestNotification = useCallback(async () => {
    setIsSendingTest(true);
    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          const res = await fetch('/api/notifications/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              calendarId,
              subscription: sub.toJSON(),
            }),
          });
          if (res.ok) {
            setIsSendingTest(false);
            return;
          }
        }
      }

      // Fallback to in-app / native Notification
      addNotification({
        title: '🌲 DailyForest Test Reminder',
        message: 'Your notification system is working! You will receive task reminders right on time.',
        type: 'reminder',
      });
    } catch (err) {
      console.error('Test notification failed:', err);
      addNotification({
        title: '🌲 DailyForest Test Reminder',
        message: 'Your notification system is working! You will receive task reminders right on time.',
        type: 'reminder',
      });
    } finally {
      setIsSendingTest(false);
    }
  }, [calendarId, addNotification]);

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

  // Background check interval for scheduled task reminders and daily summary (when active)
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
        saveStoredSentReminderKeys(Array.from(sentRemindersRef.current), calendarId);

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
  }, [tasks, settings, addNotification, calendarId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    settings,
    notifications,
    activeToasts,
    drawerOpen,
    unreadCount,
    permissionStatus,
    isPushSubscribed,
    isSendingTest,
    setDrawerOpen,
    dismissToast,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    updateSettings,
    requestNativePermission,
    sendTestNotification,
    notifyTaskCompleted,
  };
}
