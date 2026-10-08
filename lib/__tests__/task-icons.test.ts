import { describe, expect, it } from 'vitest'
import { getTaskIcon, TASK_ICONS } from '../task-icons'

describe('Task Icons Registry', () => {
  it('contains the curated set of 20 icons with unique IDs and labels', () => {
    expect(TASK_ICONS.length).toBe(20)

    const ids = TASK_ICONS.map((i) => i.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(TASK_ICONS.length)

    for (const item of TASK_ICONS) {
      expect(item.id).toBeTruthy()
      expect(item.label).toBeTruthy()
      expect(typeof item.icon).toBe('object') // Lucide components are React elements/forwardRefs
    }
  })

  it('retrieves the correct Lucide icon for valid IDs', () => {
    expect(getTaskIcon('laptop')).toBeTruthy()
    expect(getTaskIcon('dumbbell')).toBeTruthy()
    expect(getTaskIcon('coffee')).toBeTruthy()
    expect(getTaskIcon('book-open')).toBeTruthy()
    expect(getTaskIcon('heart')).toBeTruthy()
    expect(getTaskIcon('sparkles')).toBeTruthy()
    expect(getTaskIcon('bike')).toBeTruthy()
  })

  it('returns null gracefully for invalid, empty, or unknown IDs', () => {
    expect(getTaskIcon(undefined)).toBeNull()
    expect(getTaskIcon(null)).toBeNull()
    expect(getTaskIcon('')).toBeNull()
    expect(getTaskIcon('unknown-non-existent-icon')).toBeNull()
  })
})
