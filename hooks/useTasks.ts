import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Task, StoredTask, TaskModalFormData } from '@/types/task'
import { DayInfo, COLORS, timeStringToDecimalHours, decimalHoursToTimeString } from '@/lib/time-utils'
import { recordRecentCalendar } from '@/lib/recent-calendars'

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
        startTime: task.startTime,
        endTime: task.endTime,
        startHour: task.startHour,
        duration: task.duration,
        completed: completedDays.length === taskDays.length && taskDays.length > 0,
        completedDays,
        days: taskDays,
        color: task.color,
        reminderOffset: task.reminderOffset,
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
        setTasks(data.tasks || [])
        saveTasksToLocalStorage(data.tasks || [])
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
          if (payload.type === 'TASKS_MUTATED' || payload.type === 'PRIVACY_UPDATED' || payload.type === 'CALENDAR_UPDATED') {
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
        }

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
        }

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
  }
}
