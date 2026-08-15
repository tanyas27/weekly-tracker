import { START_HOUR, SLOT_HEIGHT_PX } from './constants'

export interface DayInfo {
  short: string
  date: number
  fullDate: Date
  isToday: boolean
}

export const TIME_SLOTS = [
  '12:00 AM', '01:00 AM', '02:00 AM', '03:00 AM', '04:00 AM', '05:00 AM',
  '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM',
]

export interface ActiveHoursPreference {
  startHour: number // e.g. 4 (4 AM) or 6 (6 AM)
  endHour: number   // e.g. 23 (11 PM)
}

export const DEFAULT_ACTIVE_HOURS: ActiveHoursPreference = {
  startHour: 6,
  endHour: 23,
}

export const ACTIVE_HOURS_STORAGE_KEY = 'dailyforest_active_hours'

export function getStoredActiveHours(): ActiveHoursPreference {
  if (typeof window === 'undefined') return DEFAULT_ACTIVE_HOURS
  try {
    const raw = localStorage.getItem(ACTIVE_HOURS_STORAGE_KEY)
    if (!raw) return DEFAULT_ACTIVE_HOURS
    const parsed = JSON.parse(raw)
    if (typeof parsed?.startHour === 'number' && typeof parsed?.endHour === 'number') {
      return {
        startHour: Math.max(0, Math.min(23, parsed.startHour)),
        endHour: Math.max(parsed.startHour + 1, Math.min(24, parsed.endHour)),
      }
    }
  } catch {}
  return DEFAULT_ACTIVE_HOURS
}

export function saveStoredActiveHours(pref: ActiveHoursPreference) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(ACTIVE_HOURS_STORAGE_KEY, JSON.stringify(pref))
  } catch {}
}

export function formatHourLabel(hour: number): string {
  const normalized = ((hour % 24) + 24) % 24
  const period = normalized >= 12 ? 'PM' : 'AM'
  const h12 = normalized % 12 === 0 ? 12 : normalized % 12
  return `${h12.toString().padStart(2, '0')}:00 ${period}`
}

export function formatHourRangeLabel(startHour: number, endHour: number): string {
  const formatH = (h: number) => {
    const norm = ((h % 24) + 24) % 24
    const period = norm >= 12 ? 'PM' : 'AM'
    const h12 = norm % 12 === 0 ? 12 : norm % 12
    return `${h12} ${period}`
  }
  return `${formatH(startHour)} – ${formatH(endHour)}`
}

export function getTimeSlotsForRange(startHour: number, endHour: number): string[] {
  const slots: string[] = []
  const start = Math.max(0, Math.min(23, startHour))
  const end = Math.max(start + 1, Math.min(24, endHour))
  for (let h = start; h < end; h++) {
    slots.push(formatHourLabel(h))
  }
  return slots
}

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
 * Converts a time string like "09:30" or "04:00" into fractional hours (9.5 or 4.0).
 */
export function timeStringToDecimalHours(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0
  const [hoursStr, minutesStr] = timeStr.split(':')
  const parsedH = parseInt(hoursStr, 10)
  const parsedM = parseInt(minutesStr, 10)
  const hours = isNaN(parsedH) ? 0 : parsedH
  const minutes = isNaN(parsedM) ? 0 : parsedM
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
 * Calculates top offset (in px) and height (in px) for a task box given 80px hourly slots starting at baselineStartHour.
 */
export function getTaskPosition(startHour: number, duration: number, baselineStartHour: number = START_HOUR) {
  const startOffset = (startHour - baselineStartHour) * SLOT_HEIGHT_PX
  const height = Math.max(duration * SLOT_HEIGHT_PX - 8, 46)
  return { top: startOffset, height }
}

/**
 * Calculates top offset (in px) for the real-time horizontal bar line.
 */
export function getCurrentTimePosition(
  currentHour: number,
  baselineStartHour: number = START_HOUR,
  baselineEndHour: number = 24
): number | null {
  if (currentHour < baselineStartHour || currentHour > baselineEndHour) return null
  return (currentHour - baselineStartHour) * SLOT_HEIGHT_PX
}

/**
 * Normalizes any date string or Date object to the Monday (YYYY-MM-DD) of that week.
 */
export function normalizeToMonday(dateInput?: string | Date): string {
  let date: Date
  if (typeof dateInput === 'string' && dateInput.trim()) {
    const cleanStr = dateInput.split('T')[0]
    const parts = cleanStr.split('-').map(Number)
    if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      date = new Date(parts[0], parts[1] - 1, parts[2])
    } else {
      date = new Date()
    }
  } else if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    date = new Date(dateInput)
  } else {
    date = new Date()
  }

  const currentDay = date.getDay() // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diff = currentDay === 0 ? -6 : 1 - currentDay
  date.setDate(date.getDate() + diff)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Returns 7 DayInfo objects starting from Monday of the current week (or specified week start date).
 */
export function getWeekDays(startWeekDate?: string): DayInfo[] {
  const today = new Date()
  const mondayStr = normalizeToMonday(startWeekDate)
  const [y, m, d] = mondayStr.split('-').map(Number)
  const monday = new Date(y, m - 1, d)

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
      isToday,
    })
  }

  return days
}

export function getCurrentMonthYear(startWeekDate?: string): string {
  if (startWeekDate) {
    const mondayStr = normalizeToMonday(startWeekDate)
    const [y, m, d] = mondayStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }
  const now = new Date()
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/**
 * Returns a list of normalized Monday dates spanning adjacent past and upcoming weeks.
 */
export function getAdjacentWeeks(baseMondayInput?: string | Date, pastCount = 2, futureCount = 3): string[] {
  const baseMondayStr = normalizeToMonday(baseMondayInput)
  const [y, m, d] = baseMondayStr.split('-').map(Number)
  const baseDate = new Date(y, m - 1, d)

  const weeks: string[] = []
  for (let i = -pastCount; i <= futureCount; i++) {
    const target = new Date(baseDate)
    target.setDate(baseDate.getDate() + i * 7)
    weeks.push(normalizeToMonday(target))
  }
  return weeks
}

/**
 * Returns a descriptive tag comparing a target week Monday to the current week Monday.
 */
export function getWeekTag(mondayDate: string, currentMondayDate: string): string {
  const [y1, m1, d1] = normalizeToMonday(mondayDate).split('-').map(Number)
  const [y2, m2, d2] = normalizeToMonday(currentMondayDate).split('-').map(Number)
  const date1 = new Date(y1, m1 - 1, d1)
  const date2 = new Date(y2, m2 - 1, d2)
  const diffDays = Math.round((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return ' (Current)'
  if (diffDays === 7) return ' (Next Week)'
  if (diffDays === 14) return ' (In 2 Weeks)'
  if (diffDays === 21) return ' (In 3 Weeks)'
  if (diffDays === -7) return ' (Last Week)'
  return ''
}

export function getTimezone(): string {
  const offset = -new Date().getTimezoneOffset() / 60
  return `GMT${offset >= 0 ? '+' : ''}${offset}`
}

export function getCurrentHour(): number {
  const now = new Date()
  return now.getHours() + now.getMinutes() / 60
}
