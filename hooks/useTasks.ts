import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Task, StoredTask, TaskModalFormData } from '@/types/task'
import { DayInfo, COLORS, timeStringToDecimalHours, decimalHoursToTimeString } from '@/lib/time-utils'
import { recordRecentCalendar } from '@/lib/recent-calendars'
import { sortTodos, groupTodosByCategory, getNextSortOrder } from '@/lib/todo-utils'

export type { StoredTask, TaskModalFormData }

export interface SessionInfo {
  id: string;
  calendar_id: string;
  week_start_date: string;
  created_at: string;
}

const TASKS_STORAGE_KEY = 'weeklyTasks'

const loadTasksFromLocalStorage = (): Task[] => {
  if (typeof window === 'undefined') return []
  const savedTasks = localStorage.getItem(TASKS_STORAGE_KEY)
  if (!savedTasks) return []

  try {
    const parsedTasks = JSON.parse(savedTasks) as StoredTask[]
    return parsedTasks.map((task) => {
      const taskDays = task.days?.length ? task.days : task.day ? [task.day] : []
      const completedDays = task.completedDays ?? (task.completed ? [...taskDays] : [])
      return {
        id: task.id,
        name: task.name,
        startTime: task.startTime || '',
        endTime: task.endTime || '',
        startHour: task.startHour || 0,
        duration: task.duration || 0,
        completed: completedDays.length === taskDays.length && taskDays.length > 0,
        completedDays,
        days: taskDays,
        color: task.color,
        reminderOffset: task.reminderOffset,
        isScheduled: task.isScheduled !== false,
        category: task.category ?? null,
        sortOrder: task.sortOrder,
      }
    })
  } catch (error) {
    console.error('Failed to load tasks from localStorage:', error)
    return []
  }
}

const saveTasksToLocalStorage = (tasks: Task[]): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))
}

export function useTasks(
  days: DayInfo[],
  calendarId?: string,
  selectedWeek?: string,
  passcodeHash?: string
) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced')
  const [isLoaded, setIsLoaded] = useState(false)
  const [calendarTitle, setCalendarTitle] = useState<string>('My Planner')
  const [serverPrivacyState, setServerPrivacyState] = useState<{ isPrivate: boolean; isLocked: boolean }>({
    isPrivate: false,
    isLocked: false,
  })

  const passcodeRef = useRef(passcodeHash)
  useEffect(() => {
    passcodeRef.current = passcodeHash
  }, [passcodeHash])

  // Track optimistic tasks and todos that are in-flight (not yet confirmed by server)
  const pendingOptimisticTasksRef = useRef<Map<string, Task>>(new Map())

  const getPasscode = useCallback(
    (customPasscode?: string) => {
      if (customPasscode) return customPasscode
      if (passcodeRef.current) return passcodeRef.current
      if (typeof window !== 'undefined' && calendarId) {
        return localStorage.getItem(`calendar_passcode_${calendarId}`) || ''
      }
      return ''
    },
    [calendarId]
  )

  const fetchCalendarData = useCallback(
    async (showSyncing = true, customPasscode?: string) => {
      if (!calendarId) {
        setTasks(loadTasksFromLocalStorage())
        if (typeof window !== 'undefined') {
          const localTitle = localStorage.getItem('localCalendarTitle')
          if (localTitle) setCalendarTitle(localTitle)
        }
        setIsLoaded(true)
        return
      }

      if (showSyncing) setSyncStatus('syncing')

      try {
        const headers: Record<string, string> = {}
        const pass = getPasscode(customPasscode)
        if (pass) {
          headers['x-calendar-passcode'] = pass
        }

        const params = new URLSearchParams()
        if (selectedWeek) params.set('week', selectedWeek)
        if (pass) params.set('passcode', pass)
        const queryStr = params.toString() ? `?${params.toString()}` : ''

        const res = await fetch(`/api/calendars/${calendarId}${queryStr}`, { headers, cache: 'no-store' })

        if (!res.ok) {
          if (res.status === 401) {
            setServerPrivacyState({ isPrivate: true, isLocked: true })
            setIsLoaded(true)
            setSyncStatus('synced')
            return
          }
          throw new Error(`HTTP error ${res.status}`)
        }

        const data = await res.json()

        if (data.isLocked) {
          if (data.calendar?.title) setCalendarTitle(data.calendar.title)
          setServerPrivacyState({ isPrivate: true, isLocked: true })
          setTasks([])
          setSessions(data.sessions || [])
          setIsLoaded(true)
          setSyncStatus('synced')
          return
        }

        if (data.calendar?.title) {
          setCalendarTitle(data.calendar.title)
          recordRecentCalendar(calendarId, data.calendar.title, Boolean(data.isPrivate), {
            taskCount: (data.tasks || []).length,
            completedCount: (data.tasks || []).filter((t: Task) => t.completed).length,
            lastActiveWeek: selectedWeek,
          })
        }

        setServerPrivacyState({ isPrivate: Boolean(data.isPrivate), isLocked: false })
        setSessions(data.sessions || [])

        // Normalize scheduled tasks from server
        const normalizedScheduledTasks: Task[] = (data.tasks || []).map((t: any) => ({
          id: t.id,
          name: t.name,
          startTime: t.startTime ?? t.start_time ?? '',
          endTime: t.endTime ?? t.end_time ?? '',
          startHour: t.startHour !== undefined ? Number(t.startHour) : t.start_hour !== null && t.start_hour !== undefined ? Number(t.start_hour) : 0,
          duration: t.duration !== undefined ? Number(t.duration) : t.duration !== null && t.duration !== undefined ? Number(t.duration) : 0,
          completed: Boolean(t.completed),
          completedDays: t.completedDays ?? t.completed_days ?? [],
          days: t.days ?? [],
          color: t.color,
          reminderOffset: t.reminderOffset ?? (t.reminder_offset !== null && t.reminder_offset !== undefined ? Number(t.reminder_offset) : undefined),
          isScheduled: t.isScheduled !== false && t.is_scheduled !== false,
          category: t.category ?? null,
          sortOrder: t.sortOrder ?? (t.sort_order !== null && t.sort_order !== undefined ? Number(t.sort_order) : undefined),
        }))

        // Fetch todos separately (global across all weeks)
        let allTasks = [...normalizedScheduledTasks]
        try {
          const todosRes = await fetch(`/api/calendars/${calendarId}/todos${queryStr}`, { headers, cache: 'no-store' })
          if (todosRes.ok) {
            const todosData = await todosRes.json()
            if (todosData.todos && Array.isArray(todosData.todos)) {
              const normalizedTodos: Task[] = todosData.todos.map((t: any) => ({
                id: t.id,
                name: t.name,
                startTime: t.startTime ?? t.start_time ?? '',
                endTime: t.endTime ?? t.end_time ?? '',
                startHour: t.startHour !== undefined ? Number(t.startHour) : t.start_hour !== null && t.start_hour !== undefined ? Number(t.start_hour) : 0,
                duration: t.duration !== undefined ? Number(t.duration) : t.duration !== null && t.duration !== undefined ? Number(t.duration) : 0,
                completed: Boolean(t.completed),
                completedDays: t.completedDays ?? t.completed_days ?? [],
                days: t.days ?? [],
                color: t.color,
                reminderOffset: t.reminderOffset ?? (t.reminder_offset !== null && t.reminder_offset !== undefined ? Number(t.reminder_offset) : undefined),
                isScheduled: false,
                category: t.category ?? null,
                sortOrder: t.sortOrder ?? (t.sort_order !== null && t.sort_order !== undefined ? Number(t.sort_order) : undefined),
              }))
              // Merge scheduled tasks with todos
              allTasks = [...allTasks, ...normalizedTodos]
            }
          }
        } catch (err) {
          console.error('Failed to fetch todos:', err)
        }

        // Re-append any optimistic tasks or todos that are still in-flight and not yet
        // reflected in the server response — prevents background polling/SSE from
        // wiping them out before the create/update API call completes.
        if (pendingOptimisticTasksRef.current.size > 0) {
          const serverIds = new Set(allTasks.map((t: Task) => t.id))
          pendingOptimisticTasksRef.current.forEach((optimisticItem, tempId) => {
            if (!serverIds.has(tempId)) {
              allTasks = [...allTasks, optimisticItem]
            }
          })
        }

        setTasks(allTasks)
        saveTasksToLocalStorage(allTasks)
        setIsLoaded(true)
        setSyncStatus('synced')
      } catch (error) {
        console.error('Failed to fetch calendar data:', error)
        setSyncStatus('offline')
        setTasks(loadTasksFromLocalStorage())
        setIsLoaded(true)
      }
    },
    [calendarId, selectedWeek, getPasscode]
  )

  useEffect(() => {
    queueMicrotask(() => {
      fetchCalendarData()
    })
  }, [fetchCalendarData])

  // Real-time SSE stream subscription & hybrid polling fallback
  useEffect(() => {
    if (!calendarId) return

    let eventSource: EventSource | null = null

    try {
      const pass = passcodeRef.current
      const streamUrl = `/api/calendars/${calendarId}/stream${pass ? `?passcode=${encodeURIComponent(pass)}` : ''}`
      eventSource = new EventSource(streamUrl)

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (
            payload.type === 'TASKS_MUTATED' ||
            payload.type === 'TODOS_MUTATED' ||
            payload.type === 'PRIVACY_UPDATED' ||
            payload.type === 'CALENDAR_UPDATED'
          ) {
            fetchCalendarData(false)
          }
        } catch {}
      }

      eventSource.onerror = () => {
        setSyncStatus('synced') // Fallback to periodic sync on serverless connection drops
      }

      eventSource.onopen = () => {
        setSyncStatus('synced')
      }
    } catch {
      queueMicrotask(() => {
        setSyncStatus('synced')
      })
    }

    // Hybrid background polling loop (every 3.5 seconds) to ensure real-time multi-device sync across serverless processes
    const pollInterval = setInterval(() => {
      fetchCalendarData(false)
    }, 3500)

    // Sync on tab focus / visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchCalendarData(false)
      }
    }

    // Sync on cross-tab storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('weekly_tracker_tasks_')) {
        fetchCalendarData(false)
      }
    }

    window.addEventListener('focus', handleVisibilityChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      if (eventSource) {
        eventSource.close()
      }
      clearInterval(pollInterval)
      window.removeEventListener('focus', handleVisibilityChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [calendarId, fetchCalendarData])

  const saveTask = useCallback(
    async (formData: TaskModalFormData) => {
      if (!formData.name.trim() || formData.days.length === 0) return

      const startHour = timeStringToDecimalHours(formData.startTime)
      const endHour = startHour + formData.duration
      const endTime = decimalHoursToTimeString(endHour)

      let updatedTask: Task

      if (formData.id) {
        const existingTask = tasks.find((t) => t.id === formData.id)
        const updatedCompletedDays = (existingTask?.completedDays || []).filter((d) => formData.days.includes(d))
        updatedTask = {
          id: formData.id,
          name: formData.name,
          days: formData.days,
          startTime: formData.startTime,
          endTime,
          startHour,
          duration: formData.duration,
          color: formData.color || COLORS[0],
          reminderOffset: formData.reminderOffset,
          completedDays: updatedCompletedDays,
          completed: updatedCompletedDays.length === formData.days.length && formData.days.length > 0,
          isScheduled: true,
          category: existingTask?.category ?? null,
          sortOrder: existingTask?.sortOrder,
        }

        pendingOptimisticTasksRef.current.set(updatedTask.id, updatedTask)
        setTasks((prev) => prev.map((t) => (t.id === formData.id ? updatedTask : t)))
      } else {
        updatedTask = {
          id: Date.now().toString(),
          name: formData.name,
          days: formData.days,
          startTime: formData.startTime,
          endTime,
          startHour,
          duration: formData.duration,
          completed: false,
          completedDays: [],
          color: formData.color || COLORS[0],
          reminderOffset: formData.reminderOffset,
          isScheduled: true,
          category: null,
        }

        pendingOptimisticTasksRef.current.set(updatedTask.id, updatedTask)
        setTasks((prev) => [...prev, updatedTask])
      }

      if (calendarId) {
        setSyncStatus('syncing')
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          const pass = getPasscode()
          if (pass) {
            headers['x-calendar-passcode'] = pass
          }

          const url = `/api/calendars/${calendarId}/tasks${pass ? `?passcode=${encodeURIComponent(pass)}` : ''}`
          const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              action: 'upsert',
              weekStartDate: selectedWeek,
              task: updatedTask,
            }),
            cache: 'no-store',
          })

          pendingOptimisticTasksRef.current.delete(updatedTask.id)

          if (res.ok) {
            const data = await res.json()
            if (data.task) {
              setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? { ...updatedTask, ...data.task } : t)))
            }
            setSyncStatus('synced')
          } else {
            setSyncStatus('error')
          }
        } catch {
          pendingOptimisticTasksRef.current.delete(updatedTask.id)
          setSyncStatus('offline')
        }
      } else {
        pendingOptimisticTasksRef.current.delete(updatedTask.id)
        setTasks((currentTasks) => {
          saveTasksToLocalStorage(currentTasks)
          return currentTasks
        })
      }
    },
    [calendarId, selectedWeek, tasks, getPasscode]
  )

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!taskId) return

      setTasks((prev) => prev.filter((t) => t.id !== taskId))

      if (calendarId) {
        setSyncStatus('syncing')
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          const pass = getPasscode()
          if (pass) {
            headers['x-calendar-passcode'] = pass
          }

          const url = `/api/calendars/${calendarId}/tasks${pass ? `?passcode=${encodeURIComponent(pass)}` : ''}`
          const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              action: 'delete',
              taskId,
            }),
            cache: 'no-store',
          })

          if (res.ok) {
            setSyncStatus('synced')
          } else {
            setSyncStatus('error')
          }
        } catch {
          setSyncStatus('offline')
        }
      } else {
        setTasks((currentTasks) => {
          saveTasksToLocalStorage(currentTasks)
          return currentTasks
        })
      }
    },
    [calendarId, getPasscode]
  )

  const toggleComplete = useCallback(
    (taskId: string, day: string, e: React.MouseEvent) => {
      e.stopPropagation()
      setTasks((prev) => {
        const nextTasks = prev.map((task) => {
          if (task.id !== taskId) return task
          const isCompletedOnDay = task.completedDays.includes(day)
          const newCompletedDays = isCompletedOnDay
            ? task.completedDays.filter((d) => d !== day)
            : [...task.completedDays, day]
          const updated = {
            ...task,
            completedDays: newCompletedDays,
            completed: newCompletedDays.length === task.days.length && task.days.length > 0,
          }

          if (calendarId) {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' }
            const pass = getPasscode()
            if (pass) {
              headers['x-calendar-passcode'] = pass
            }
            const url = `/api/calendars/${calendarId}/tasks${pass ? `?passcode=${encodeURIComponent(pass)}` : ''}`
            fetch(url, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                action: 'upsert',
                weekStartDate: selectedWeek,
                task: updated,
              }),
              cache: 'no-store',
            }).catch(() => {})
          }

          return updated
        })

        if (!calendarId) {
          saveTasksToLocalStorage(nextTasks)
        }

        return nextTasks
      })
    },
    [calendarId, selectedWeek, getPasscode]
  )

  const copyPreviousWeekTasks = useCallback(async () => {
    if (!calendarId) return
    setSyncStatus('syncing')
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const pass = getPasscode()
      if (pass) {
        headers['x-calendar-passcode'] = pass
      }

      const url = `/api/calendars/${calendarId}/tasks${pass ? `?passcode=${encodeURIComponent(pass)}` : ''}`
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'copy_previous',
          weekStartDate: selectedWeek,
        }),
        cache: 'no-store',
      })

      if (res.ok) {
        fetchCalendarData(true)
      } else {
        setSyncStatus('error')
      }
    } catch {
      setSyncStatus('offline')
    }
  }, [calendarId, fetchCalendarData, selectedWeek, getPasscode])

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

  const unlockServerState = useCallback(() => {
    setServerPrivacyState((prev) => ({ ...prev, isLocked: false }))
  }, [])

  // Todo-related derived state
  const unscheduledTasks = useMemo(
    () => sortTodos(tasks.filter((t) => t.isScheduled === false)),
    [tasks]
  )

  const scheduledTasks = useMemo(
    () => tasks.filter((t) => t.isScheduled !== false),
    [tasks]
  )

  const tasksByCategory = useMemo(
    () => groupTodosByCategory(unscheduledTasks),
    [unscheduledTasks]
  )

  // Todo operations
  const addTodo = useCallback(
    async (name: string, category?: string) => {
      if (!name.trim()) return null

      const sortOrder = getNextSortOrder(unscheduledTasks)
      const newTodo: Task = {
        id: Date.now().toString(),
        name: name.trim(),
        startTime: '',
        endTime: '',
        startHour: 0,
        duration: 0,
        completed: false,
        completedDays: [],
        days: [],
        color: COLORS[0],
        isScheduled: false,
        category: category || null,
        sortOrder,
      }

      // Register as optimistic before updating state so the polling loop
      // can preserve it if fetchCalendarData fires before the API responds.
      pendingOptimisticTasksRef.current.set(newTodo.id, newTodo)

      setTasks((prev) => [...prev, newTodo])

      if (calendarId) {
        setSyncStatus('syncing')
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          const pass = getPasscode()
          if (pass) {
            headers['x-calendar-passcode'] = pass
          }

          const url = `/api/calendars/${calendarId}/tasks${pass ? `?passcode=${encodeURIComponent(pass)}` : ''}`
          const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              action: 'create_todo',
              task: newTodo,
            }),
            cache: 'no-store',
          })

          pendingOptimisticTasksRef.current.delete(newTodo.id)

          if (res.ok) {
            const data = await res.json()
            if (data.task) {
              setTasks((prev) => prev.map((t) => (t.id === newTodo.id ? { ...newTodo, ...data.task } : t)))
            }
            setSyncStatus('synced')
            return data.task || newTodo
          } else {
            setSyncStatus('error')
          }
        } catch {
          pendingOptimisticTasksRef.current.delete(newTodo.id)
          setSyncStatus('offline')
        }
      } else {
        // No calendarId (local mode) — no server call needed, remove immediately
        pendingOptimisticTasksRef.current.delete(newTodo.id)
        setTasks((currentTasks) => {
          saveTasksToLocalStorage(currentTasks)
          return currentTasks
        })
      }

      return newTodo
    },
    [calendarId, unscheduledTasks, getPasscode]
  )

  const toggleTodoComplete = useCallback(
    async (todoId: string) => {
      const todo = tasks.find((t) => t.id === todoId)
      if (!todo || todo.isScheduled !== false) return

      const updatedTodo = { ...todo, completed: !todo.completed }
      setTasks((prev) => prev.map((t) => (t.id === todoId ? updatedTodo : t)))

      if (calendarId) {
        setSyncStatus('syncing')
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          const pass = getPasscode()
          if (pass) {
            headers['x-calendar-passcode'] = pass
          }

          const url = `/api/calendars/${calendarId}/tasks${pass ? `?passcode=${encodeURIComponent(pass)}` : ''}`
          const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              action: 'update_todo',
              taskId: todoId,
              task: { completed: updatedTodo.completed },
            }),
            cache: 'no-store',
          })

          if (res.ok) {
            setSyncStatus('synced')
          } else {
            setSyncStatus('error')
          }
        } catch {
          setSyncStatus('offline')
        }
      }
    },
    [calendarId, tasks, getPasscode]
  )

  const promoteTodoToScheduled = useCallback(
    async (todoId: string, scheduleData: { startTime: string; duration: number; days: string[] }) => {
      const todo = tasks.find((t) => t.id === todoId)
      if (!todo || todo.isScheduled !== false) return null

      const startHour = timeStringToDecimalHours(scheduleData.startTime)
      const endTime = decimalHoursToTimeString(startHour + scheduleData.duration)

      const promotedTask: Task = {
        ...todo,
        startTime: scheduleData.startTime,
        endTime,
        startHour,
        duration: scheduleData.duration,
        days: scheduleData.days,
        isScheduled: true,
        completedDays: [],
        completed: false,
      }

      setTasks((prev) => prev.map((t) => (t.id === todoId ? promotedTask : t)))

      if (calendarId && selectedWeek) {
        setSyncStatus('syncing')
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          const pass = getPasscode()
          if (pass) {
            headers['x-calendar-passcode'] = pass
          }

          const url = `/api/calendars/${calendarId}/tasks${pass ? `?passcode=${encodeURIComponent(pass)}` : ''}`
          const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              action: 'promote_todo',
              taskId: todoId,
              weekStartDate: selectedWeek,
              task: {
                startTime: scheduleData.startTime,
                endTime,
                startHour,
                duration: scheduleData.duration,
                days: scheduleData.days,
              },
            }),
            cache: 'no-store',
          })

          if (res.ok) {
            setSyncStatus('synced')
            return promotedTask
          } else {
            setSyncStatus('error')
          }
        } catch {
          setSyncStatus('offline')
        }
      }

      return promotedTask
    },
    [calendarId, selectedWeek, tasks, getPasscode]
  )

  const reorderTodos = useCallback(
    async (reorderedIds: string[]) => {
      const ordering = reorderedIds.map((id, index) => ({ id, sortOrder: index }))

      setTasks((prev) =>
        prev.map((t) => {
          const newOrder = ordering.find((o) => o.id === t.id)
          return newOrder ? { ...t, sortOrder: newOrder.sortOrder } : t
        })
      )

      if (calendarId) {
        setSyncStatus('syncing')
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          const pass = getPasscode()
          if (pass) {
            headers['x-calendar-passcode'] = pass
          }

          const url = `/api/calendars/${calendarId}/todos/reorder${pass ? `?passcode=${encodeURIComponent(pass)}` : ''}`
          const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ todoIds: reorderedIds }),
            cache: 'no-store',
          })

          if (res.ok) {
            setSyncStatus('synced')
          } else {
            setSyncStatus('error')
          }
        } catch {
          setSyncStatus('offline')
        }
      }
    },
    [calendarId, getPasscode]
  )

  const updateTodoCategory = useCallback(
    async (todoId: string, category: string | null) => {
      setTasks((prev) => prev.map((t) => (t.id === todoId ? { ...t, category } : t)))

      if (calendarId) {
        setSyncStatus('syncing')
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          const pass = getPasscode()
          if (pass) {
            headers['x-calendar-passcode'] = pass
          }

          const url = `/api/calendars/${calendarId}/tasks${pass ? `?passcode=${encodeURIComponent(pass)}` : ''}`
          const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              action: 'update_todo',
              taskId: todoId,
              task: { category },
            }),
            cache: 'no-store',
          })

          if (res.ok) {
            setSyncStatus('synced')
          } else {
            setSyncStatus('error')
          }
        } catch {
          setSyncStatus('offline')
        }
      }
    },
    [calendarId, getPasscode]
  )

  const updateCalendarTitle = useCallback(
    async (newTitle: string): Promise<boolean> => {
      const cleanTitle = newTitle.trim().slice(0, 255)
      if (!cleanTitle) return false

      setCalendarTitle(cleanTitle)

      if (calendarId) {
        recordRecentCalendar(calendarId, cleanTitle, serverPrivacyState.isPrivate, {
          taskCount: totalTasks,
          completedCount: completedTasks,
          lastActiveWeek: selectedWeek,
        })

        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          const pass = getPasscode()
          if (pass) {
            headers['x-calendar-passcode'] = pass
          }

          const url = `/api/calendars/${calendarId}${pass ? `?passcode=${encodeURIComponent(pass)}` : ''}`
          const res = await fetch(url, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ title: cleanTitle }),
            cache: 'no-store',
          })

          if (res.ok) {
            const data = await res.json()
            if (data.calendar?.title) {
              setCalendarTitle(data.calendar.title)
            }
            return true
          }
          return false
        } catch (err) {
          console.error('Failed to update calendar title:', err)
          return false
        }
      } else {
        if (typeof window !== 'undefined') {
          localStorage.setItem('localCalendarTitle', cleanTitle)
        }
        return true
      }
    },
    [calendarId, getPasscode, serverPrivacyState.isPrivate, totalTasks, completedTasks, selectedWeek]
  )

  return {
    tasks,
    setTasks,
    toggleComplete,
    saveTask,
    deleteTask,
    totalTasks,
    completedTasks,
    progressPercentage,
    tasksByDay,
    sessions,
    syncStatus,
    copyPreviousWeekTasks,
    serverPrivacyState,
    unlockServerState,
    isLoaded,
    refetch: fetchCalendarData,
    calendarTitle,
    setCalendarTitle,
    updateCalendarTitle,
    // Todo operations
    unscheduledTasks,
    scheduledTasks,
    tasksByCategory,
    addTodo,
    toggleTodoComplete,
    promoteTodoToScheduled,
    reorderTodos,
    updateTodoCategory,
  }
}
