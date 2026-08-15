import { describe, expect, it } from 'vitest'
import {
  timeStringToDecimalHours,
  decimalHoursToTimeString,
  getTaskPosition,
  getCurrentTimePosition,
  getWeekDays,
  TIME_SLOTS,
  getTimeSlotsForRange,
  formatHourLabel,
  formatHourRangeLabel,
  DEFAULT_ACTIVE_HOURS,
} from '../time-utils'

describe('timeStringToDecimalHours', () => {
  it('converts an HH:MM string into fractional hours', () => {
    expect(timeStringToDecimalHours('09:30')).toBe(9.5)
    expect(timeStringToDecimalHours('04:00')).toBe(4)
    expect(timeStringToDecimalHours('00:00')).toBe(0)
    expect(timeStringToDecimalHours('23:15')).toBeCloseTo(23.25)
  })

  it('falls back to 0 for empty or malformed input', () => {
    expect(timeStringToDecimalHours('')).toBe(0)
    expect(timeStringToDecimalHours('not-a-time')).toBe(0)
  })
})

describe('decimalHoursToTimeString', () => {
  it('converts fractional hours into an HH:MM string', () => {
    expect(decimalHoursToTimeString(9.5)).toBe('09:30')
    expect(decimalHoursToTimeString(4)).toBe('04:00')
    expect(decimalHoursToTimeString(0)).toBe('00:00')
  })

  it('clamps out-of-range values to [0, 24]', () => {
    expect(decimalHoursToTimeString(-5)).toBe('00:00')
    expect(decimalHoursToTimeString(30)).toBe('24:00')
  })
})

describe('getTaskPosition', () => {
  it('computes pixel top offset and height from baseline start hour', () => {
    // 4 AM with 0 baseline (4 hours * 80px = 320px)
    expect(getTaskPosition(4, 1, 0)).toEqual({ top: 320, height: 72 })
    // 9 AM with 6 AM baseline ((9 - 6) * 80px = 240px)
    expect(getTaskPosition(9, 1, 6)).toEqual({ top: 240, height: 72 })
  })

  it('enforces a minimum height for very short tasks', () => {
    expect(getTaskPosition(0, 0.25, 0)).toEqual({ top: 0, height: 46 })
  })
})

describe('getCurrentTimePosition', () => {
  it('returns the pixel offset for hours within the visible timeline range', () => {
    expect(getCurrentTimePosition(6, 6, 23)).toBe(0)
    expect(getCurrentTimePosition(8, 6, 23)).toBe(160)
  })

  it('returns null outside the visible timeline range', () => {
    expect(getCurrentTimePosition(4, 6, 23)).toBeNull()
    expect(getCurrentTimePosition(25, 6, 23)).toBeNull()
  })
})

describe('getTimeSlotsForRange & formatting', () => {
  it('generates correct time slots for active hours range', () => {
    const slots = getTimeSlotsForRange(6, 23)
    expect(slots).toHaveLength(17)
    expect(slots[0]).toBe('06:00 AM')
    expect(slots[slots.length - 1]).toBe('10:00 PM')
  })

  it('formats human-readable hour range labels', () => {
    expect(formatHourRangeLabel(6, 23)).toBe('6 AM – 11 PM')
    expect(formatHourRangeLabel(4, 22)).toBe('4 AM – 10 PM')
    expect(formatHourRangeLabel(8, 19)).toBe('8 AM – 7 PM')
  })

  it('has valid default active hours', () => {
    expect(DEFAULT_ACTIVE_HOURS.startHour).toBe(6)
    expect(DEFAULT_ACTIVE_HOURS.endHour).toBe(23)
  })
})

describe('TIME_SLOTS', () => {
  it('includes 24 hours starting from 12:00 AM and includes 04:00 AM', () => {
    expect(TIME_SLOTS).toHaveLength(24)
    expect(TIME_SLOTS[0]).toBe('12:00 AM')
    expect(TIME_SLOTS[4]).toBe('04:00 AM')
    expect(TIME_SLOTS[23]).toBe('11:00 PM')
  })
})

describe('getWeekDays', () => {
  it('returns 7 days starting on Monday, with exactly one marked as today', () => {
    const days = getWeekDays()
    expect(days).toHaveLength(7)
    expect(days[0].short).toBe('MON')
    expect(days.filter((d) => d.isToday)).toHaveLength(1)
  })
})
