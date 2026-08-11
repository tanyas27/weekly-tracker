import { useMemo } from 'react'
import { Task, StoredTask, TaskModalFormData } from '@/types/task'
import { DayInfo, COLORS, timeStringToDecimalHours, decimalHoursToTimeString } from '@/lib/time-utils'
import { useLocalStorage } from './useLocalStorage'

export type { StoredTask, TaskModalFormData }

const TASKS_STORAGE_KEY = 'weeklyTasks'

const loadTasks = (): Task[] => {
  if (typeof window === 'undefined') {
    return []
  }

  const savedTasks = localStorage.getItem(TASKS_STORAGE_KEY)
  if (!savedTasks) {
    return []
  }

  try {
    const parsedTasks = JSON.parse(savedTasks) as StoredTask[]
    return parsedTasks.map((task) => {
      const taskDays = task.days?.length ? task.days : task.day ? [task.day] : []
      const completedDays = task.completedDays ?? (task.completed ? [...taskDays] : [])
      return {
        id: task.id,
        name: task.name,
        startTime: task.startTime,
        endTime: task.endTime,
        startHour: task.startHour,
        duration: task.duration,
        completed: completedDays.length === taskDays.length && taskDays.length > 0,
        completedDays,
        days: taskDays,
        color: task.color,
        reminderOffset: task.reminderOffset
      }
    })
  } catch (error) {
    console.error('Failed to load tasks from localStorage:', error)
    return []
  }
}

const saveTasks = (tasks: Task[]): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))
}

export function useTasks(days: DayInfo[]) {
  const [tasks, setTasks] = useLocalStorage<Task[]>([], loadTasks, saveTasks)

  const toggleComplete = (taskId: string, day: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task
        const isCompletedOnDay = task.completedDays.includes(day)
        const newCompletedDays = isCompletedOnDay
          ? task.completedDays.filter((d) => d !== day)
          : [...task.completedDays, day]
        return {
          ...task,
          completedDays: newCompletedDays,
          completed: newCompletedDays.length === task.days.length && task.days.length > 0
        }
      })
    )
  }

  const saveTask = (formData: TaskModalFormData) => {
    if (!formData.name.trim() || formData.days.length === 0) return

    const startHour = timeStringToDecimalHours(formData.startTime)
    const endHour = startHour + formData.duration
    const endTime = decimalHoursToTimeString(endHour)

    if (formData.id) {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== formData.id) return task
          const updatedCompletedDays = (task.completedDays || []).filter((d) => formData.days.includes(d))
          return {
            ...task,
            name: formData.name,
            days: formData.days,
            startTime: formData.startTime,
            endTime: endTime,
            startHour: startHour,
            duration: formData.duration,
            color: formData.color || COLORS[0],
            reminderOffset: formData.reminderOffset,
            completedDays: updatedCompletedDays,
            completed: updatedCompletedDays.length === formData.days.length && formData.days.length > 0
          }
        })
      )
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        name: formData.name,
        days: formData.days,
        startTime: formData.startTime,
        endTime: endTime,
        startHour: startHour,
        duration: formData.duration,
        completed: false,
        completedDays: [],
        color: formData.color || COLORS[0],
        reminderOffset: formData.reminderOffset
      }
      setTasks((prev) => [...prev, newTask])
    }
  }

  const deleteTask = (taskId: string) => {
    if (!taskId) return
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
  }

  const totalTasks = useMemo(
    () => tasks.reduce((acc, t) => acc + (t.days.length || 1), 0),
    [tasks]
  )

  const completedTasks = useMemo(
    () =>
      tasks.reduce(
        (acc, t) =>
          acc + (t.completedDays ? t.completedDays.length : t.completed ? t.days.length : 0),
        0
      ),
    [tasks]
  )

  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  const tasksByDay = useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    for (const day of days) {
      grouped[day.short] = tasks.filter((task) => task.days.includes(day.short))
    }
    return grouped
  }, [days, tasks])

  return {
    tasks,
    setTasks,
    toggleComplete,
    saveTask,
    deleteTask,
    totalTasks,
    completedTasks,
    progressPercentage,
    tasksByDay
  }
}
