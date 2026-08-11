import { describe, expect, it } from 'vitest'
import {
  timeStringToDecimalHours,
  decimalHoursToTimeString,
  getTaskPosition,
  getCurrentTimePosition,
  getWeekDays,
} from '../time-utils'

describe('timeStringToDecimalHours', () => {
  it('converts an HH:MM string into fractional hours', () => {
    expect(timeStringToDecimalHours('09:30')).toBe(9.5)
    expect(timeStringToDecimalHours('00:00')).toBe(0)
    expect(timeStringToDecimalHours('23:15')).toBeCloseTo(23.25)
  })

  it('falls back to 7 for empty or malformed input', () => {
    expect(timeStringToDecimalHours('')).toBe(7)
    expect(timeStringToDecimalHours('not-a-time')).toBe(7)
  })
})

describe('decimalHoursToTimeString', () => {
  it('converts fractional hours into an HH:MM string', () => {
    expect(decimalHoursToTimeString(9.5)).toBe('09:30')
    expect(decimalHoursToTimeString(0)).toBe('00:00')
  })

  it('clamps out-of-range values to [0, 24]', () => {
    expect(decimalHoursToTimeString(-5)).toBe('00:00')
    expect(decimalHoursToTimeString(30)).toBe('24:00')
  })
})

describe('getTaskPosition', () => {
  it('computes pixel top offset and height from the 7 AM baseline', () => {
    expect(getTaskPosition(9, 1)).toEqual({ top: 160, height: 72 })
  })

  it('enforces a minimum height for very short tasks', () => {
    expect(getTaskPosition(7, 0.25)).toEqual({ top: 0, height: 46 })
  })
})

describe('getCurrentTimePosition', () => {
  it('returns the pixel offset for hours within the visible timeline', () => {
    expect(getCurrentTimePosition(7)).toBe(0)
    expect(getCurrentTimePosition(9)).toBe(160)
  })

  it('returns null outside the visible timeline (before 7 AM or after midnight)', () => {
    expect(getCurrentTimePosition(6)).toBeNull()
    expect(getCurrentTimePosition(25)).toBeNull()
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
