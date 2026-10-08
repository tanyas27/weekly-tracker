export interface ActiveDragTaskState {
  id: string
  name: string
  duration: number
  fromDay: string
  startHour: number
  icon?: string | null
}

let currentDragTask: ActiveDragTaskState | null = null

export function setActiveDragTask(task: ActiveDragTaskState | null) {
  currentDragTask = task
}

export function getActiveDragTask(): ActiveDragTaskState | null {
  return currentDragTask
}
