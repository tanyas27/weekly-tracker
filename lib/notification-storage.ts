import { AppNotification, NotificationSettings } from '@/types/notification';
import { MAX_STORED_NOTIFICATIONS, MAX_STORED_REMINDER_KEYS } from './constants';

const SETTINGS_KEY = 'weeklyTracker_notificationSettings';
const NOTIFICATIONS_KEY = 'weeklyTracker_notifications';
const SENT_REMINDERS_KEY = 'weeklyTracker_sentReminders';
const DAILY_SUMMARY_KEY = 'weeklyTracker_dailySummaryDate';

export const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  soundEnabled: true,
  defaultLeadTime: 10,
  dailySummaryEnabled: true,
  nativeNotificationsEnabled: false,
};

export function getStoredSettings(): NotificationSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to parse notification settings', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: NotificationSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save notification settings', err);
  }
}

function stripEmojis(str: string): string {
  if (!str) return str;
  return str.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]/gu, '').trim();
}

export function getStoredNotifications(calendarId?: string): AppNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = calendarId ? `${NOTIFICATIONS_KEY}_${calendarId}` : NOTIFICATIONS_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: AppNotification[] = JSON.parse(raw);
    return parsed.map((n) => ({
      ...n,
      title: stripEmojis(n.title),
      message: stripEmojis(n.message),
    }));
  } catch (err) {
    console.error('Failed to parse stored notifications', err);
    return [];
  }
}

export function saveStoredNotifications(notifications: AppNotification[], calendarId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = calendarId ? `${NOTIFICATIONS_KEY}_${calendarId}` : NOTIFICATIONS_KEY;
    const sliced = notifications.slice(0, MAX_STORED_NOTIFICATIONS);
    localStorage.setItem(key, JSON.stringify(sliced));
  } catch (err) {
    console.error('Failed to save stored notifications', err);
  }
}

export function getStoredSentReminderKeys(calendarId?: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = calendarId ? `${SENT_REMINDERS_KEY}_${calendarId}` : SENT_REMINDERS_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredSentReminderKeys(keys: string[], calendarId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = calendarId ? `${SENT_REMINDERS_KEY}_${calendarId}` : SENT_REMINDERS_KEY;
    localStorage.setItem(key, JSON.stringify(keys.slice(-MAX_STORED_REMINDER_KEYS)));
  } catch (err) {
    console.error('Failed to save sent reminder keys', err);
  }
}

export function getStoredDailySummaryDate(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(DAILY_SUMMARY_KEY);
}

export function saveStoredDailySummaryDate(dateStr: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DAILY_SUMMARY_KEY, dateStr);
  } catch (err) {
    console.error('Failed to save daily summary date', err);
  }
}
