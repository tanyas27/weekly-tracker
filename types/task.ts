export interface Task {
  id: string
  name: string
  startTime: string
  endTime: string
  startHour: number
  duration: number
  completed: boolean
  completedDays: string[]
  days: string[]
  color: string
  reminderOffset?: number | null
  // Todo list support fields
  isScheduled?: boolean       // false = unscheduled todo, true/undefined = scheduled calendar task
  category?: string | null    // Category/tag for organization (e.g., "Work", "Personal")
  sortOrder?: number          // Manual ordering in todo list (lower = higher priority)
}

// On-disk shape spanning the legacy single-day (`day`) to multi-day (`days`) migration.
export interface StoredTask extends Omit<Task, 'completedDays' | 'days'> {
  completedDays?: string[]
  day?: string
  days?: string[]
}

// Fields captured by the add/edit modal; derived fields (endTime, startHour, completed*) are computed on save.
export type TaskModalFormData = Pick<
  Task,
  'id' | 'name' | 'days' | 'startTime' | 'duration' | 'color' | 'reminderOffset'
>
