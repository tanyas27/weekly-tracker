'use client'

import Image from 'next/image'
import { useState, useMemo, useCallback } from 'react'
import {
  getWeekDays,
  COLORS,
  BACKGROUND_IMAGE_SRC,
  TOTORO_IMAGE_SRC
} from '@/lib/time-utils'
import { Task } from '@/types/task'
import { START_HOUR } from '@/lib/constants'
import { useCurrentTime } from '@/hooks/useCurrentTime'
import { useTasks, TaskModalFormData } from '@/hooks/useTasks'
import { useNotifications } from '@/hooks/useNotifications'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { Header } from '@/components/Header'
import { DaySelector } from '@/components/DaySelector'
import { ScheduleGrid } from '@/components/ScheduleGrid'
import { TaskModal } from '@/components/TaskModal'
import ToastContainer from '@/components/ToastContainer'
import NotificationDrawer from '@/components/NotificationDrawer'

export default function Home() {
  const [days] = useState(() => getWeekDays())
  const { currentTime, monthYear } = useCurrentTime()
  const { tasks, saveTask, deleteTask, toggleComplete, progressPercentage, tasksByDay } = useTasks(days)

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
  } = useNotifications(tasks)

  const [mobileSelectedDay, setMobileSelectedDay] = useState<string>(() => {
    const week = getWeekDays()
    return week.find((day) => day.isToday)?.short ?? week[0]?.short ?? 'MON'
  })
  const [isDark, setIsDark] = useLocalStorage(
    false,
    () => localStorage.getItem('theme') === 'dark',
    (value) => localStorage.setItem('theme', value ? 'dark' : 'light')
  )

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

  const handleToggleComplete = useCallback(
    (taskId: string, day: string, e: React.MouseEvent) => {
      const targetTask = tasks.find((t) => t.id === taskId)
      const isCompletedBefore = targetTask?.completedDays.includes(day)
      toggleComplete(taskId, day, e)

      // Trigger celebration toast if marking as completed (not uncompleting)
      if (targetTask && !isCompletedBefore) {
        notifyTaskCompleted(targetTask.name, targetTask.color)
      }
    },
    [tasks, toggleComplete, notifyTaskCompleted]
  )

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

  const openEditModal = useCallback((task: Task) => {
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
  }, [])

  const openAddModal = useCallback((day: string, timeSlotIndex: number) => {
    const hour = START_HOUR + timeSlotIndex
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
  }, [])

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
      {/* Toast Notifications */}
      <ToastContainer toasts={activeToasts} isDark={isDark} onDismiss={dismissToast} />

      {/* Notification Center Drawer */}
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

      {/* Background artwork */}
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
          className={`rounded-2xl md:rounded-3xl shadow-lg p-4 sm:p-5 md:p-6 mb-4 md:mb-6 backdrop-blur-md relative z-30 ${
            isDark ? 'bg-gray-800/70 border border-white/10' : 'bg-white/40 border border-white/40'
          }`}
        >
          <Header
            monthYear={monthYear}
            progressPercentage={progressPercentage}
            isDark={isDark}
            onToggleTheme={() => setIsDark((prev) => !prev)}
            unreadNotificationsCount={unreadCount}
            onOpenNotifications={() => setDrawerOpen(true)}
          />

          <DaySelector
            days={days}
            timezone={currentTime.timezone}
            isDark={isDark}
            activeMobileDay={activeMobileDay}
            onPrevMobileDay={goToPreviousMobileDay}
            onNextMobileDay={goToNextMobileDay}
          />
        </div>

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
      </div>
    </div>
  )
}
