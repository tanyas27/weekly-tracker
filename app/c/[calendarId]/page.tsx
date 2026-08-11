'use client'

import Image from 'next/image'
import { useState, useEffect, useMemo, use } from 'react'
import {
  getWeekDays,
  getCurrentMonthYear,
  COLORS,
  BACKGROUND_IMAGE_SRC,
  TOTORO_IMAGE_SRC
} from '@/lib/time-utils'
import { Task } from '@/lib/task-overlap'
import { useCurrentTime } from '@/hooks/useCurrentTime'
import { useTasks, TaskModalFormData } from '@/hooks/useTasks'
import { useCalendarPrivacy } from '@/hooks/useCalendarPrivacy'
import { useNotifications } from '@/hooks/useNotifications'
import { Header } from '@/components/Header'
import { DaySelector } from '@/components/DaySelector'
import { ScheduleGrid } from '@/components/ScheduleGrid'
import { TaskModal } from '@/components/TaskModal'
import { PrivacyLockScreen } from '@/components/PrivacyLockScreen'
import { PrivacySettingsModal } from '@/components/PrivacySettingsModal'
import ToastContainer from '@/components/ToastContainer'
import NotificationDrawer from '@/components/NotificationDrawer'

export default function CalendarPage({ params }: { params: Promise<{ calendarId: string }> }) {
  const { calendarId } = use(params)
  
  const {
    isPrivate,
    isLocked,
    passcodeHash,
    unlockCalendar,
    lockCalendar,
    updatePrivacySettings,
    handleServerPrivacyState
  } = useCalendarPrivacy(calendarId)

  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  
  const defaultMonday = useMemo(() => {
    const today = new Date()
    const currentDay = today.getDay()
    const diff = currentDay === 0 ? -6 : 1 - currentDay
    const monday = new Date(today)
    monday.setDate(today.getDate() + diff)
    const year = monday.getFullYear()
    const month = String(monday.getMonth() + 1).padStart(2, '0')
    const date = String(monday.getDate()).padStart(2, '0')
    return `${year}-${month}-${date}`
  }, [])

  const [selectedWeek, setSelectedWeek] = useState<string>(defaultMonday)
  const days = useMemo(() => getWeekDays(selectedWeek), [selectedWeek])
  const monthYear = useMemo(() => getCurrentMonthYear(selectedWeek), [selectedWeek])
  const { currentTime } = useCurrentTime()

  const {
    tasks,
    saveTask,
    deleteTask,
    toggleComplete,
    progressPercentage,
    tasksByDay,
    sessions,
    syncStatus,
    copyPreviousWeekTasks,
    serverPrivacyState,
    isLoaded,
    refetch
  } = useTasks(days, calendarId, selectedWeek, passcodeHash)

  useEffect(() => {
    handleServerPrivacyState(serverPrivacyState.isPrivate, serverPrivacyState.isLocked)
  }, [serverPrivacyState, handleServerPrivacyState])

  const {
    settings,
    notifications,
    activeToasts,
    drawerOpen,
    unreadCount,
    permissionStatus,
    setDrawerOpen,
    dismissToast,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    updateSettings,
    requestNativePermission,
    notifyTaskCompleted,
  } = useNotifications(tasks, calendarId)

  const [mobileSelectedDay, setMobileSelectedDay] = useState<string>(() => {
    return days.find((day) => day.isToday)?.short ?? days[0]?.short ?? 'MON'
  })
  const [isDark, setIsDark] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [modalData, setModalData] = useState<TaskModalFormData>({
    id: '',
    name: '',
    days: [],
    startTime: '',
    duration: 1,
    color: COLORS[0],
    reminderOffset: undefined,
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        setIsDark(localStorage.getItem('theme') === 'dark')
        setIsMounted(true)
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      localStorage.setItem('theme', isDark ? 'dark' : 'light')
      if (isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [isDark, isMounted])

  const handleToggleComplete = (taskId: string, day: string, e: React.MouseEvent) => {
    const targetTask = tasks.find((t) => t.id === taskId)
    const isCompletedBefore = targetTask?.completedDays.includes(day)
    toggleComplete(taskId, day, e)

    if (targetTask && !isCompletedBefore) {
      notifyTaskCompleted(targetTask.name, targetTask.color)
    }
  }

  const activeMobileDay = useMemo(
    () => days.find((day) => day.short === mobileSelectedDay) ?? days.find((day) => day.isToday) ?? days[0],
    [days, mobileSelectedDay]
  )

  const activeMobileDayIndex = useMemo(
    () => Math.max(days.findIndex((day) => day.short === activeMobileDay?.short), 0),
    [activeMobileDay?.short, days]
  )

  const goToPreviousMobileDay = () => {
    if (days.length === 0) return
    const previousIndex = (activeMobileDayIndex - 1 + days.length) % days.length
    setMobileSelectedDay(days[previousIndex].short)
  }

  const goToNextMobileDay = () => {
    if (days.length === 0) return
    const nextIndex = (activeMobileDayIndex + 1) % days.length
    setMobileSelectedDay(days[nextIndex].short)
  }

  const openEditModal = (task: Task) => {
    setModalData({
      id: task.id,
      name: task.name,
      days: task.days,
      startTime: task.startTime,
      duration: task.duration,
      color: task.color,
      reminderOffset: task.reminderOffset,
    })
    setShowModal(true)
  }

  const openAddModal = (day: string, timeSlotIndex: number) => {
    const hour = 7 + timeSlotIndex
    const startTime = `${hour.toString().padStart(2, '0')}:00`
    const colorIndex = (day.charCodeAt(0) + day.charCodeAt(day.length - 1) + hour) % COLORS.length
    setModalData({
      id: '',
      name: '',
      days: [day],
      startTime: startTime,
      duration: 1,
      color: COLORS[colorIndex],
      reminderOffset: undefined,
    })
    setShowModal(true)
  }

  const handleSaveModal = () => {
    saveTask(modalData)
    setShowModal(false)
    setModalData({ id: '', name: '', days: [], startTime: '', duration: 1, color: COLORS[0], reminderOffset: undefined })
  }

  const handleDeleteModal = () => {
    if (modalData.id) {
      deleteTask(modalData.id)
      setShowModal(false)
      setModalData({ id: '', name: '', days: [], startTime: '', duration: 1, color: COLORS[0], reminderOffset: undefined })
    }
  }

  return (
    <div className={`min-h-screen p-3 sm:p-4 md:p-6 relative overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-[#E8E6DC]'}`}>
      <ToastContainer toasts={activeToasts} isDark={isDark} onDismiss={dismissToast} />

      <NotificationDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        notifications={notifications}
        settings={settings}
        permissionStatus={permissionStatus}
        isDark={isDark}
        onUpdateSettings={updateSettings}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onClearAll={clearAllNotifications}
        onRequestNativePermission={requestNativePermission}
      />

      <div className="fixed inset-0 pointer-events-none z-0">
        <Image
          src={BACKGROUND_IMAGE_SRC}
          alt=""
          fill
          priority
          sizes="100vw"
          quality={60}
          className={`w-full h-full object-cover ${isDark ? 'opacity-30' : 'opacity-70'}`}
        />
      </div>

      <div className={`hidden sm:block fixed -left-20 bottom-32 pointer-events-none z-20 ${isDark ? 'opacity-60' : 'opacity-80'}`}>
        <Image
          src={TOTORO_IMAGE_SRC}
          alt=""
          width={256}
          height={256}
          sizes="256px"
          quality={60}
          className="w-64 h-64 object-cover rounded-full"
        />
      </div>

      <div className="max-w-7xl mx-auto md:pl-4 lg:pl-8 relative z-10">
        <div
          className={`rounded-2xl sm:rounded-[28px] shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 backdrop-blur-xl relative z-30 border ${
            isDark ? 'bg-slate-800/60 border-white/10' : 'bg-white/45 border-white/60'
          }`}
        >
          <Header
            monthYear={monthYear}
            progressPercentage={progressPercentage}
            isDark={isDark}
            onToggleTheme={() => setIsDark((prev) => !prev)}
            unreadNotificationsCount={unreadCount}
            onOpenNotifications={() => setDrawerOpen(true)}
            calendarId={calendarId}
            sessions={sessions}
            selectedWeek={selectedWeek}
            onSelectWeek={setSelectedWeek}
            onCopyPreviousWeek={copyPreviousWeekTasks}
            syncStatus={syncStatus}
            taskCount={tasks.length}
            isPrivate={isPrivate || serverPrivacyState.isPrivate}
            onOpenPrivacySettings={() => setShowPrivacyModal(true)}
            onLockCalendar={lockCalendar}
          />

          {isLoaded && !((isPrivate || serverPrivacyState.isPrivate) && (isLocked || serverPrivacyState.isLocked)) && (
            <DaySelector
              days={days}
              timezone={currentTime.timezone}
              isDark={isDark}
              activeMobileDay={activeMobileDay}
              onPrevMobileDay={goToPreviousMobileDay}
              onNextMobileDay={goToNextMobileDay}
            />
          )}
        </div>

        {!isLoaded ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 rounded-3xl backdrop-blur-md bg-white/30 dark:bg-gray-800/40 border border-white/20 animate-pulse">
            <p className="text-sm font-semibold opacity-70">Loading calendar...</p>
          </div>
        ) : (isPrivate || serverPrivacyState.isPrivate) && (isLocked || serverPrivacyState.isLocked) ? (
          <PrivacyLockScreen
            calendarTitle={monthYear}
            isDark={isDark}
            onUnlock={(passcode) => unlockCalendar(passcode, (hash) => refetch(false, hash))}
          />
        ) : (
          <>
            <ScheduleGrid
              days={days}
              activeMobileDay={activeMobileDay}
              tasksByDay={tasksByDay}
              currentTimeHour={currentTime.hour}
              isDark={isDark}
              onOpenAddModal={openAddModal}
              onOpenEditModal={openEditModal}
              onToggleComplete={handleToggleComplete}
            />

            <TaskModal
              showModal={showModal}
              modalData={modalData}
              days={days}
              isDark={isDark}
              onClose={() => setShowModal(false)}
              onSave={handleSaveModal}
              onDelete={handleDeleteModal}
              setModalData={setModalData}
            />
          </>
        )}

        <PrivacySettingsModal
          isOpen={showPrivacyModal}
          isDark={isDark}
          isPrivate={isPrivate || serverPrivacyState.isPrivate}
          onClose={() => setShowPrivacyModal(false)}
          onUpdatePrivacy={async (targetIsPrivate, newPin, currPin) => {
            const res = await updatePrivacySettings(targetIsPrivate, newPin, currPin);
            if (res.success) {
              refetch(false);
            }
            return res;
          }}
          onLockCalendar={lockCalendar}
        />
      </div>
    </div>
  )
}
