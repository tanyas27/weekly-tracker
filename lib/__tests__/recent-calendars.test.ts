import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import {
  getRecentCalendars,
  recordRecentCalendar,
  removeRecentCalendar,
  clearRecentCalendars,
  getLastActiveCalendarId,
  formatRelativeTime,
} from '../recent-calendars'

describe('recent-calendars utility', () => {
  let mockStore: Record<string, string> = {}

  beforeAll(() => {
    const mockLocalStorage: Storage = {
      length: 0,
      clear: () => {
        mockStore = {}
      },
      getItem: (key: string) => mockStore[key] || null,
      key: (index: number) => Object.keys(mockStore)[index] || null,
      removeItem: (key: string) => {
        delete mockStore[key]
      },
      setItem: (key: string, value: string) => {
        mockStore[key] = value
      },
    }

    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: mockLocalStorage },
      writable: true,
      configurable: true,
    })
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    })
  })

  afterAll(() => {
    // @ts-expect-error cleanup
    delete globalThis.window
    // @ts-expect-error cleanup
    delete globalThis.localStorage
  })

  beforeEach(() => {
    mockStore = {}
  })

  it('records and retrieves recent calendars with metadata', () => {
    recordRecentCalendar('cal-1', 'Personal Habits', false, {
      taskCount: 5,
      completedCount: 2,
    })

    const recents = getRecentCalendars()
    expect(recents).toHaveLength(1)
    expect(recents[0].id).toBe('cal-1')
    expect(recents[0].title).toBe('Personal Habits')
    expect(recents[0].taskCount).toBe(5)
    expect(recents[0].completedCount).toBe(2)
  })

  it('maintains last active calendar ID', () => {
    recordRecentCalendar('cal-alpha', 'Alpha Cal')
    expect(getLastActiveCalendarId()).toBe('cal-alpha')

    recordRecentCalendar('cal-beta', 'Beta Cal')
    expect(getLastActiveCalendarId()).toBe('cal-beta')
  })

  it('removes a single calendar and updates active calendar ID', () => {
    recordRecentCalendar('cal-1', 'Cal 1')
    recordRecentCalendar('cal-2', 'Cal 2')

    removeRecentCalendar('cal-2')
    const recents = getRecentCalendars()
    expect(recents).toHaveLength(1)
    expect(recents[0].id).toBe('cal-1')
    expect(getLastActiveCalendarId()).toBe('cal-1')
  })

  it('clears all recent calendars and active ID', () => {
    recordRecentCalendar('cal-1', 'Cal 1')
    clearRecentCalendars()
    expect(getRecentCalendars()).toEqual([])
    expect(getLastActiveCalendarId()).toBeNull()
  })

  it('formats relative time accurately', () => {
    const now = Date.now()
    expect(formatRelativeTime(now - 10000)).toBe('Just now')
    expect(formatRelativeTime(now - 5 * 60 * 1000)).toBe('5m ago')
    expect(formatRelativeTime(now - 2 * 60 * 60 * 1000)).toBe('2h ago')
    expect(formatRelativeTime(now - 3 * 24 * 60 * 60 * 1000)).toBe('3d ago')
  })
})
