import { START_HOUR, SLOT_HEIGHT_PX } from './constants'

export interface DayInfo {
  short: string
  date: number
  fullDate: Date
  isToday: boolean
}

export const TIME_SLOTS = [
  '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM', '12:00 AM'
]

export const COLORS = [
  'bg-[#FFF9C4]',  // Light yellow
  'bg-[#FFE082]',  // Yellow
  'bg-[#FFCC80]',  // Peach
  'bg-[#E1BEE7]',  // Light purple
  'bg-[#F48FB1]',  // Pink
  'bg-[#90CAF9]',  // Light blue
  'bg-[#B39DDB]',  // Purple
  'bg-[#64B5F6]',  // Blue
  'bg-[#A5D6A7]',  // Green
  'bg-[#C5E1A5]',  // Light green
  'bg-[#E6EE9C]',  // Yellow-green
]

export const BACKGROUND_IMAGE_SRC = '/bcg.avif'
export const TOTORO_IMAGE_SRC = '/totoro.png'

/**
 * Converts a time string like "09:30" into fractional hours (9.5).
 */
export function timeStringToDecimalHours(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 7
  const [hoursStr, minutesStr] = timeStr.split(':')
  const hours = parseInt(hoursStr, 10) || 0
  const minutes = parseInt(minutesStr, 10) || 0
  return hours + minutes / 60
}

/**
 * Converts fractional hours (9.5) into a formatted time string ("09:30").
 */
export function decimalHoursToTimeString(decimalHours: number): string {
  const normalizedHours = Math.max(0, Math.min(24, decimalHours))
  const hours = Math.floor(normalizedHours)
  const minutes = Math.round((normalizedHours - hours) * 60)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

/**
 * Calculates top offset (in px) and height (in px) for a task box given 80px hourly slots starting at 7 AM.
 */
export function getTaskPosition(startHour: number, duration: number) {
  const startOffset = (startHour - START_HOUR) * SLOT_HEIGHT_PX
  const height = Math.max(duration * SLOT_HEIGHT_PX - 8, 46)
  return { top: startOffset, height }
}

/**
 * Calculates top offset (in px) for the real-time horizontal bar line.
 */
export function getCurrentTimePosition(currentHour: number): number | null {
  if (currentHour < 7 || currentHour > 24) return null
  return (currentHour - START_HOUR) * SLOT_HEIGHT_PX
}

/**
 * Returns 7 DayInfo objects starting from Monday of the current week (or specified week start date).
 */
export function getWeekDays(startWeekDate?: string): DayInfo[] {
  const today = new Date()
  let monday: Date

  if (startWeekDate) {
    const parts = startWeekDate.split('-').map(Number)
    if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      monday = new Date(parts[0], parts[1] - 1, parts[2])
    } else {
      const currentDay = today.getDay()
      const diff = currentDay === 0 ? -6 : 1 - currentDay
      monday = new Date(today)
      monday.setDate(today.getDate() + diff)
    }
  } else {
    const currentDay = today.getDay()
    const diff = currentDay === 0 ? -6 : 1 - currentDay
    monday = new Date(today)
    monday.setDate(today.getDate() + diff)
  }

  const days: DayInfo[] = []
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    const dayIndex = date.getDay()
    const isToday = date.toDateString() === today.toDateString()

    days.push({
      short: dayNames[dayIndex],
      date: date.getDate(),
      fullDate: date,
      isToday
    })
  }

  return days
}

export function getCurrentMonthYear(startWeekDate?: string): string {
  if (startWeekDate) {
    const parts = startWeekDate.split('-').map(Number)
    if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      const date = new Date(parts[0], parts[1] - 1, parts[2])
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
  }
  const now = new Date()
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function getTimezone(): string {
  const offset = -new Date().getTimezoneOffset() / 60
  return `GMT${offset >= 0 ? '+' : ''}${offset}`
}

export function getCurrentHour(): number {
  const now = new Date()
  return now.getHours() + now.getMinutes() / 60
}
