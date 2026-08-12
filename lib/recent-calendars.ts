export interface RecentCalendar {
  id: string
  title?: string
  lastVisited: number // Epoch timestamp in ms
  isPrivate?: boolean
}

const STORAGE_KEY = 'recentCalendars'
const MAX_RECENT = 5

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

export function recordRecentCalendar(id: string, title?: string, isPrivate?: boolean) {
  if (typeof window === 'undefined' || !id) return
  try {
    const existing = getRecentCalendars().filter((item) => item.id !== id)
    const isGenericTitle = !title || title === 'My Planner' || title === 'My Weekly Schedule'
    const updated: RecentCalendar[] = [
      {
        id,
        title: isGenericTitle ? undefined : title,
        lastVisited: Date.now(),
        isPrivate: !!isPrivate,
      },
      ...existing,
    ].slice(0, MAX_RECENT)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to update recent calendars:', err)
  }
}

export function clearRecentCalendars() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
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
