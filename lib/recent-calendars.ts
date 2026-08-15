export interface RecentCalendar {
  id: string
  title?: string
  lastVisited: number // Epoch timestamp in ms
  isPrivate?: boolean
  taskCount?: number
  completedCount?: number
  lastActiveWeek?: string
  color?: string
}

const STORAGE_KEY = 'recentCalendars'
const LAST_ACTIVE_KEY = 'dailyforest_last_active_calendar'
const MAX_RECENT = 10

export function getLastActiveCalendarId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(LAST_ACTIVE_KEY) || getRecentCalendars()[0]?.id || null
  } catch {
    return null
  }
}

export function setLastActiveCalendarId(id: string) {
  if (typeof window === 'undefined' || !id) return
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, id)
  } catch {}
}

export function getRecentCalendars(): RecentCalendar[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const items: RecentCalendar[] = JSON.parse(raw)
    return Array.isArray(items) ? items : []
  } catch {
    return []
  }
}

export function recordRecentCalendar(
  id: string,
  title?: string,
  isPrivate?: boolean,
  extra?: { taskCount?: number; completedCount?: number; lastActiveWeek?: string; color?: string }
) {
  if (typeof window === 'undefined' || !id) return
  try {
    setLastActiveCalendarId(id)
    const existingList = getRecentCalendars()
    const existing = existingList.find((item) => item.id === id)
    const remaining = existingList.filter((item) => item.id !== id)
    const resolvedTitle = title?.trim() ? title.trim() : existing?.title

    const updated: RecentCalendar[] = [
      {
        id,
        title: resolvedTitle,
        lastVisited: Date.now(),
        isPrivate: isPrivate !== undefined ? isPrivate : existing?.isPrivate,
        taskCount: extra?.taskCount !== undefined ? extra.taskCount : existing?.taskCount,
        completedCount: extra?.completedCount !== undefined ? extra.completedCount : existing?.completedCount,
        lastActiveWeek: extra?.lastActiveWeek || existing?.lastActiveWeek,
        color: extra?.color || existing?.color,
      },
      ...remaining,
    ].slice(0, MAX_RECENT)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to update recent calendars:', err)
  }
}

export function removeRecentCalendar(id: string) {
  if (typeof window === 'undefined' || !id) return
  try {
    const remaining = getRecentCalendars().filter((item) => item.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining))
    if (localStorage.getItem(LAST_ACTIVE_KEY) === id) {
      if (remaining.length > 0) {
        localStorage.setItem(LAST_ACTIVE_KEY, remaining[0].id)
      } else {
        localStorage.removeItem(LAST_ACTIVE_KEY)
      }
    }
  } catch (err) {
    console.error('Failed to remove recent calendar:', err)
  }
}

export function clearRecentCalendars() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(LAST_ACTIVE_KEY)
}

export function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return 'Recently'
  const diffMs = Date.now() - timestamp
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 45) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(timestamp).toLocaleDateString()
}
