export type NotificationType = 'reminder' | 'completion' | 'summary';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string; // ISO string or readable time
  type: NotificationType;
  read: boolean;
  taskId?: string;
  taskColor?: string;
}

export type ReminderLeadTime = 0 | 5 | 10 | 15 | 30; // Minutes before task start

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  defaultLeadTime: ReminderLeadTime;
  dailySummaryEnabled: boolean;
  nativeNotificationsEnabled: boolean;
}
