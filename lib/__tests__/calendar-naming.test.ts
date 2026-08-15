import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import {
  getRecentCalendars,
  recordRecentCalendar,
  clearRecentCalendars,
} from '../recent-calendars'
import { parseCalendarId } from '../calendar-id-parser'

describe('Calendar Naming Functionality', () => {
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

  it('records custom calendar names in recent calendars', () => {
    recordRecentCalendar('cal-101', 'Engineering Sprint Plan', false)

    const recents = getRecentCalendars()
    expect(recents).toHaveLength(1)
    expect(recents[0].id).toBe('cal-101')
    expect(recents[0].title).toBe('Engineering Sprint Plan')
  })

  it('updates existing calendar title when renamed', () => {
    recordRecentCalendar('cal-101', 'Old Name', false)
    recordRecentCalendar('cal-101', 'New Team Schedule', false)

    const recents = getRecentCalendars()
    expect(recents).toHaveLength(1)
    expect(recents[0].title).toBe('New Team Schedule')
  })

  it('parses custom calendar names or URLs into URL-safe calendar IDs', () => {
    expect(parseCalendarId('Design Sprint 2026')).toBe('Design-Sprint-2026')
    expect(parseCalendarId('  https://dailyforest.app/c/my-team-planner  ')).toBe('my-team-planner')
  })
})
