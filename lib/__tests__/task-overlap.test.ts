import { describe, expect, it } from 'vitest'
import { computeTaskOverlapLayout } from '../task-overlap'
import type { Task } from '../../types/task'

function makeTask(id: string, startHour: number, duration: number): Task {
  return {
    id,
    name: `Task ${id}`,
    startTime: '09:00',
    endTime: '10:00',
    startHour,
    duration,
    completed: false,
    completedDays: [],
    days: ['MON'],
    color: 'bg-[#FFF9C4]',
  }
}

describe('computeTaskOverlapLayout', () => {
  it('gives a lone task the full width', () => {
    const task = makeTask('1', 9, 1)
    const layout = computeTaskOverlapLayout([task], task)
    expect(layout).toEqual({
      totalOverlaps: 1,
      overlapIndex: 0,
      colWidthPercent: 100,
      leftPercent: 0,
    })
  })

  it('splits two overlapping tasks into equal side-by-side columns', () => {
    const a = makeTask('1', 9, 1)
    const b = makeTask('2', 9.5, 1)
    const sameDayTasks = [a, b]

    expect(computeTaskOverlapLayout(sameDayTasks, a)).toEqual({
      totalOverlaps: 2,
      overlapIndex: 0,
      colWidthPercent: 50,
      leftPercent: 0,
    })
    expect(computeTaskOverlapLayout(sameDayTasks, b)).toEqual({
      totalOverlaps: 2,
      overlapIndex: 1,
      colWidthPercent: 50,
      leftPercent: 50,
    })
  })

  it('does not consider back-to-back (non-overlapping) tasks as overlapping', () => {
    const a = makeTask('1', 9, 1)
    const b = makeTask('2', 10, 1)
    const sameDayTasks = [a, b]

    expect(computeTaskOverlapLayout(sameDayTasks, a).totalOverlaps).toBe(1)
    expect(computeTaskOverlapLayout(sameDayTasks, b).totalOverlaps).toBe(1)
  })
})
