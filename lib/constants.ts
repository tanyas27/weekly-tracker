/**
 * Shared numeric/config constants that were previously duplicated as inline
 * literals across lib/time-utils.ts, components/ScheduleGrid.tsx,
 * hooks/useNotifications.ts and lib/notification-storage.ts.
 */

// Schedule grid: the timeline starts at 12 AM (00:00), 24 hourly rows, 80px tall.
export const START_HOUR = 0
export const SLOT_HEIGHT_PX = 80

// Notifications: how often the reminder/daily-summary check runs, and storage caps.
export const REMINDER_POLL_INTERVAL_MS = 20000
export const MAX_STORED_NOTIFICATIONS = 50
export const MAX_STORED_REMINDER_KEYS = 100
