import type { Task } from '@/types/task'

export interface DueReminder {
  task: Task
  reminderKey: string
  leadTime: number
}

export interface DailySummaryCheck {
  send: boolean
  taskCount: number
}

/**
 * Pure scheduling logic for task reminders and the daily summary notification, extracted
 * from hooks/useNotifications.ts so the "when should X fire" math can be unit tested without
 * mounting React or touching localStorage/Notification APIs.
 */

/** Whether the daily morning summary should fire right now (once/day, after 7 AM, only if today has tasks). */
export function shouldSendDailySummary(
  tasks: Task[],
  currentDayShort: string,
  now: Date,
  lastSentDateStr: string | null
): DailySummaryCheck {
  const currentDateStr = now.toDateString()
  if (lastSentDateStr === currentDateStr || now.getHours() < 7) {
    return { send: false, taskCount: 0 }
  }
  const taskCount = tasks.filter((t) => t.days.includes(currentDayShort)).length
  return { send: taskCount > 0, taskCount }
}

/** Tasks whose pre-start reminder window is currently open and hasn't already been sent. */
export function getDueReminders(
  tasks: Task[],
  currentDayShort: string,
  now: Date,
  defaultLeadTime: number,
  sentReminderKeys: ReadonlySet<string>
): DueReminder[] {
  const currentDateStr = now.toDateString()
  const currentMinutesFromMidnight = now.getHours() * 60 + now.getMinutes()

  const due: DueReminder[] = []
  for (const task of tasks) {
    if (!task.days.includes(currentDayShort)) continue
    if (task.reminderOffset === null) continue // Notification explicitly disabled for this task

    const [startHStr, startMStr] = (task.startTime || '07:00').split(':')
    const startHour = parseInt(startHStr, 10) || 7
    const startMin = parseInt(startMStr, 10) || 0
    const taskStartTotalMinutes = startHour * 60 + startMin

    const leadTime = task.reminderOffset !== undefined ? task.reminderOffset : defaultLeadTime
    const targetTriggerMinute = taskStartTotalMinutes - leadTime
    const reminderKey = `${task.id}_${currentDayShort}_${currentDateStr}_${leadTime}`

    const isDue =
      currentMinutesFromMidnight >= targetTriggerMinute &&
      currentMinutesFromMidnight <= taskStartTotalMinutes + 5 &&
      !task.completedDays.includes(currentDayShort) &&
      !sentReminderKeys.has(reminderKey)

    if (isDue) {
      due.push({ task, reminderKey, leadTime })
    }
  }
  return due
}

/** Human-readable lead-time phrase used in reminder notification copy. */
export function formatReminderTimeText(leadTime: number): string {
  return leadTime === 0 ? 'is starting now!' : `starts in ${leadTime} minute${leadTime > 1 ? 's' : ''}!`
}
