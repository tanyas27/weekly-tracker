import { describe, expect, it } from 'vitest'
import { shouldSendDailySummary, getDueReminders, formatReminderTimeText } from '../reminder-engine'
import type { Task } from '../../types/task'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: '1',
    name: 'Write report',
    startTime: '09:00',
    endTime: '10:00',
    startHour: 9,
    duration: 1,
    completed: false,
    completedDays: [],
    days: ['MON'],
    color: 'bg-[#FFF9C4]',
    ...overrides,
  }
}

describe('shouldSendDailySummary', () => {
  it('does not send before 7 AM', () => {
    const now = new Date('2026-08-11T06:59:00')
    const result = shouldSendDailySummary([makeTask()], 'MON', now, null)
    expect(result.send).toBe(false)
  })

  it('does not send twice on the same date', () => {
    const now = new Date('2026-08-11T08:00:00')
    const result = shouldSendDailySummary([makeTask()], 'MON', now, now.toDateString())
    expect(result.send).toBe(false)
  })

  it('sends after 7 AM when there are tasks scheduled for today', () => {
    const now = new Date('2026-08-11T08:00:00')
    const result = shouldSendDailySummary([makeTask()], 'MON', now, null)
    expect(result).toEqual({ send: true, taskCount: 1 })
  })

  it('does not send when no tasks are scheduled for today', () => {
    const now = new Date('2026-08-11T08:00:00')
    const result = shouldSendDailySummary([makeTask({ days: ['TUE'] })], 'MON', now, null)
    expect(result.send).toBe(false)
  })
})

describe('getDueReminders', () => {
  it('surfaces a task within its lead-time window', () => {
    const now = new Date('2026-08-11T08:50:00') // 10 min before 09:00 start
    const task = makeTask()
    const due = getDueReminders([task], 'MON', now, 10, new Set())
    expect(due).toHaveLength(1)
    expect(due[0].task.id).toBe('1')
    expect(due[0].leadTime).toBe(10)
  })

  it('skips tasks with reminders explicitly disabled', () => {
    const now = new Date('2026-08-11T08:50:00')
    const task = makeTask({ reminderOffset: null })
    expect(getDueReminders([task], 'MON', now, 10, new Set())).toHaveLength(0)
  })

  it('skips tasks already completed for the day', () => {
    const now = new Date('2026-08-11T08:50:00')
    const task = makeTask({ completedDays: ['MON'] })
    expect(getDueReminders([task], 'MON', now, 10, new Set())).toHaveLength(0)
  })

  it('skips reminders already sent', () => {
    const now = new Date('2026-08-11T08:50:00')
    const task = makeTask()
    const reminderKey = `${task.id}_MON_${now.toDateString()}_${task.startTime}_10`
    expect(getDueReminders([task], 'MON', now, 10, new Set([reminderKey]))).toHaveLength(0)
  })

  it('fires reminder when event time is updated to a later time after earlier reminder was sent', () => {
    const now = new Date('2026-08-11T13:50:00') // 10 min before new 14:00 slot
    const oldReminderKey = `1_MON_${now.toDateString()}_09:00_10`
    const updatedTask = makeTask({ startTime: '14:00', endTime: '15:00', startHour: 14 })
    const due = getDueReminders([updatedTask], 'MON', now, 10, new Set([oldReminderKey]))
    expect(due).toHaveLength(1)
    expect(due[0].task.startTime).toBe('14:00')
  })

  it('ignores tasks not scheduled for the given day', () => {
    const now = new Date('2026-08-11T08:50:00')
    const task = makeTask({ days: ['TUE'] })
    expect(getDueReminders([task], 'MON', now, 10, new Set())).toHaveLength(0)
  })
})

describe('formatReminderTimeText', () => {
  it('describes an immediate reminder', () => {
    expect(formatReminderTimeText(0)).toBe('is starting now!')
  })

  it('pluralizes minutes correctly', () => {
    expect(formatReminderTimeText(1)).toBe('starts in 1 minute!')
    expect(formatReminderTimeText(10)).toBe('starts in 10 minutes!')
  })
})
