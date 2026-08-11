import type { Task } from '@/types/task'

export type { Task }

export interface TaskOverlapLayout {
  totalOverlaps: number
  overlapIndex: number
  colWidthPercent: number
  leftPercent: number
}

/**
 * Computes overlap width and left percentage offset for tasks scheduled at overlapping times.
 */
export function computeTaskOverlapLayout(sameDayTasks: Task[], task: Task): TaskOverlapLayout {
  const taskEnd = task.startHour + task.duration

  const overlappingGroup = sameDayTasks
    .filter((t) => {
      const tEnd = t.startHour + t.duration
      return t.startHour < taskEnd && tEnd > task.startHour
    })
    .sort((a, b) => a.startHour - b.startHour || a.id.localeCompare(b.id))

  const totalOverlaps = overlappingGroup.length || 1
  const overlapIndex = Math.max(overlappingGroup.findIndex((t) => t.id === task.id), 0)
  const colWidthPercent = 100 / totalOverlaps
  const leftPercent = overlapIndex * colWidthPercent

  return {
    totalOverlaps,
    overlapIndex,
    colWidthPercent,
    leftPercent
  }
}
