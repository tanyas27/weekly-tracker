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
  normalizeToMonday,
  getAdjacentWeeks,
  getWeekTag,
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

describe('normalizeToMonday', () => {
  it('normalizes any mid-week date string to the Monday of that week', () => {
    // 2026-08-06 is Thursday -> Monday is 2026-08-03
    expect(normalizeToMonday('2026-08-06')).toBe('2026-08-03')
    // 2026-08-07 is Friday -> Monday is 2026-08-03
    expect(normalizeToMonday('2026-08-07')).toBe('2026-08-03')
    // 2026-08-09 is Sunday -> Monday is 2026-08-03
    expect(normalizeToMonday('2026-08-09')).toBe('2026-08-03')
    // 2026-08-10 is Monday -> Monday is 2026-08-10
    expect(normalizeToMonday('2026-08-10')).toBe('2026-08-10')
    // 2026-08-15 is Saturday -> Monday is 2026-08-10
    expect(normalizeToMonday('2026-08-15')).toBe('2026-08-10')
  })
})

describe('getAdjacentWeeks', () => {
  it('generates a range of past and upcoming week Mondays', () => {
    const weeks = getAdjacentWeeks('2026-08-10', 1, 2)
    // 1 past week (Aug 3), current week (Aug 10), 2 future weeks (Aug 17, Aug 24)
    expect(weeks).toEqual([
      '2026-08-03',
      '2026-08-10',
      '2026-08-17',
      '2026-08-24',
    ])
  })
})

describe('getWeekTag', () => {
  it('identifies Current, Next Week, In 2 Weeks, and Last Week', () => {
    const current = '2026-08-10'
    expect(getWeekTag('2026-08-10', current)).toBe(' (Current)')
    expect(getWeekTag('2026-08-17', current)).toBe(' (Next Week)')
    expect(getWeekTag('2026-08-24', current)).toBe(' (In 2 Weeks)')
    expect(getWeekTag('2026-08-03', current)).toBe(' (Last Week)')
  })
})

describe('getWeekDays', () => {
  it('returns 7 days starting on Monday, with exactly one marked as today', () => {
    const days = getWeekDays()
    expect(days).toHaveLength(7)
    expect(days[0].short).toBe('MON')
    expect(days.filter((d) => d.isToday)).toHaveLength(1)
  })

  it('correctly anchors to Monday even when passed an arbitrary mid-week date', () => {
    const days = getWeekDays('2026-08-06') // Thursday
    expect(days).toHaveLength(7)
    expect(days[0].short).toBe('MON')
    expect(days[0].date).toBe(3) // Monday Aug 3
    expect(days[6].short).toBe('SUN')
    expect(days[6].date).toBe(9) // Sunday Aug 9
  })
})
