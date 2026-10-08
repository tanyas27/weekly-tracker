import { describe, expect, it } from 'vitest'
import { calculateRescheduledStartTime } from '../time-utils'
import { setActiveDragTask, getActiveDragTask } from '../drag-state'

describe('calculateRescheduledStartTime', () => {
  it('correctly maps to dropped hour regardless of previous hour', () => {
    // A 1-hour task originally at 2:00 PM (14.0) dropped onto 9:00 AM (9)
    expect(calculateRescheduledStartTime(9, 14.0, 1)).toBe('09:00')
    // A task dropped onto 6:00 AM (active hours start)
    expect(calculateRescheduledStartTime(6, 12.0, 1)).toBe('06:00')
    // A task dropped onto midnight in 24h mode
    expect(calculateRescheduledStartTime(0, 10.0, 1)).toBe('00:00')
  })

  it('preserves the original minute offset of the task', () => {
    // 9:30 AM (9.5) dropped onto the 11 AM slot becomes 11:30 AM
    expect(calculateRescheduledStartTime(11, 9.5, 1)).toBe('11:30')
    // 2:15 PM (14.25) dropped onto the 8 AM slot becomes 08:15 AM
    expect(calculateRescheduledStartTime(8, 14.25, 1)).toBe('08:15')
    // 10:45 AM (10.75) dropped onto the 3 PM slot becomes 15:45 (03:45 PM)
    expect(calculateRescheduledStartTime(15, 10.75, 1.5)).toBe('15:45')
  })

  it('clamps start time so multi-hour tasks do not exceed midnight (24:00)', () => {
    // A 2-hour task dropped onto 23:00 (11:00 PM) is capped to 22:00 (10:00 PM)
    expect(calculateRescheduledStartTime(23, 10.0, 2)).toBe('22:00')
    // A 3-hour task dropped onto 23:00 is capped to 21:00
    expect(calculateRescheduledStartTime(23, 10.0, 3)).toBe('21:00')
    // A 1.5-hour task with 30m offset dropped onto 23:00 is capped to 22:30 (ends at 24:00)
    expect(calculateRescheduledStartTime(23, 9.5, 1.5)).toBe('22:30')
  })
})

describe('drag-state store', () => {
  it('manages in-memory active drag task correctly', () => {
    expect(getActiveDragTask()).toBeNull()

    const sampleTask = {
      id: 'task-123',
      name: 'Design Review',
      duration: 1.5,
      fromDay: 'MON',
      startHour: 9.5,
    }

    setActiveDragTask(sampleTask)
    expect(getActiveDragTask()).toEqual(sampleTask)

    setActiveDragTask(null)
    expect(getActiveDragTask()).toBeNull()
  })
})
