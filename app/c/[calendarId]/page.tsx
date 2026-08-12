'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useMemo, use } from 'react'
import { TreePine, Sun, Moon } from 'lucide-react'
import {
  getWeekDays,
  getCurrentMonthYear,
  COLORS,
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
import { ShortcutsHelpModal } from '@/components/ShortcutsHelpModal'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { recordRecentCalendar } from '@/lib/recent-calendars'

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
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  
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
    unlockServerState,
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
        if (calendarId) {
          recordRecentCalendar(calendarId, 'My Planner', isPrivate)
        }
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [calendarId, isPrivate])

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
    if (!showModal) return
    setShowModal(false)
    saveTask(modalData)
    setModalData({ id: '', name: '', days: [], startTime: '', duration: 1, color: COLORS[0], reminderOffset: undefined })
  }

  const handleDeleteModal = () => {
    if (modalData.id) {
      deleteTask(modalData.id)
      setShowModal(false)
      setModalData({ id: '', name: '', days: [], startTime: '', duration: 1, color: COLORS[0], reminderOffset: undefined })
    }
  }

  useKeyboardShortcuts({
    onNewTask: () => {
      const todayObj = days.find((d) => d.isToday) || days[0]
      const currentHour = currentTime.hour >= 7 && currentTime.hour <= 23 ? currentTime.hour : 9
      const timeSlotIndex = Math.max(0, currentHour - 7)
      openAddModal(todayObj ? todayObj.short : 'MON', timeSlotIndex)
    },
    onToggleHelp: () => setShowShortcutsHelp((prev) => !prev),
    onEscape: () => {
      if (showModal) setShowModal(false)
      else if (showShortcutsHelp) setShowShortcutsHelp(false)
      else if (showPrivacyModal) setShowPrivacyModal(false)
    },
    disabled: (isPrivate || serverPrivacyState.isPrivate) && (isLocked && serverPrivacyState.isLocked),
  })

  return (
    <div className={`min-h-screen pt-24 sm:pt-28 md:pt-32 pb-12 px-3 sm:px-4 md:px-6 relative transition-colors overflow-hidden ${
      isDark ? 'bg-[#121214] text-zinc-100' : 'bg-[#FAF9F6] text-[#1a2e23]'
    }`}>
      {/* Background Ambient Radial Glow Mesh */}
      <div className={`fixed inset-0 pointer-events-none z-0 ${
        isDark
          ? 'bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(45,95,62,0.25),rgba(18,18,20,0))]'
          : 'bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(45,95,62,0.12),rgba(250,249,246,0))]'
      }`} />

      {/* Totoro Companion Artwork */}
      <div className={`hidden lg:block fixed -left-16 bottom-16 pointer-events-none z-0 transition-opacity ${
        isDark ? 'opacity-40' : 'opacity-70'
      }`}>
        <Image
          src={TOTORO_IMAGE_SRC}
          alt=""
          width={220}
          height={220}
          sizes="220px"
          quality={75}
          className="w-56 h-56 object-cover rounded-full shadow-2xl"
        />
      </div>

      {/* Top Navbar matching DailyForest homepage */}
      <nav className={`fixed top-0 inset-x-0 z-50 backdrop-blur-lg border-b transition-colors ${
        isDark ? 'bg-[#18181b]/80 border-white/10' : 'bg-[#FAF9F6]/80 border-black/[0.04]'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className={`p-1.5 rounded-xl border transition-colors ${
              isDark ? 'bg-zinc-800 border-white/10' : 'bg-white border-black/[0.04]'
            }`}>
              <TreePine className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                isDark ? 'text-[#BDCC8D]' : 'text-[#2D5F3E]'
              }`} />
            </div>
            <span className={`text-lg font-handwritten font-bold ${
              isDark ? 'text-[#BDCC8D]' : 'text-[#2D5F3E]'
            }`}>
              DailyForest
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {isMounted && (
              <button
                type="button"
                onClick={() => setIsDark((prev) => !prev)}
                aria-label="Toggle theme"
                className={`p-2 rounded-full border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-zinc-800 border-white/10 text-yellow-400 hover:bg-zinc-700'
                    : 'bg-white border-black/10 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
            <Link
              href="/"
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                isDark
                  ? 'border-white/10 bg-zinc-800/80 text-[#BDCC8D] hover:bg-zinc-700'
                  : 'border-black/[0.04] bg-white text-[#2D5F3E] hover:bg-zinc-50'
              }`}
            >
              ← Home
            </Link>
          </div>
        </div>
      </nav>

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

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header & Date Selector Card */}
        <div
          className={`rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 backdrop-blur-xl relative z-30 border transition-colors ${
            isDark
              ? 'bg-zinc-900/90 border-white/10 shadow-black/40'
              : 'bg-white/90 border-[#2D5F3E]/10 shadow-[0_12px_36px_rgba(45,95,62,0.06)]'
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

          {isLoaded && !((isPrivate || serverPrivacyState.isPrivate) && (isLocked && serverPrivacyState.isLocked)) && (
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

        {/* Timeline Grid Container */}
        {!isLoaded ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 rounded-3xl backdrop-blur-md bg-white/50 dark:bg-zinc-900/50 border border-black/5 dark:border-white/10 animate-pulse">
            <p className="text-sm font-semibold opacity-70">Loading calendar...</p>
          </div>
        ) : (isPrivate || serverPrivacyState.isPrivate) && (isLocked && serverPrivacyState.isLocked) ? (
          <PrivacyLockScreen
            calendarTitle={monthYear}
            isDark={isDark}
            onUnlock={async (passcode) => {
              const res = await unlockCalendar(passcode)
              if (res.success) {
                unlockServerState()
                refetch(false, passcode)
              }
              return res
            }}
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

        <ShortcutsHelpModal
          isOpen={showShortcutsHelp}
          isDark={isDark}
          onClose={() => setShowShortcutsHelp(false)}
        />
      </div>
    </div>
  )
}
