import React from 'react'
import { DayInfo, TIME_SLOTS, getCurrentTimePosition } from '@/lib/time-utils'
import { computeTaskOverlapLayout } from '@/lib/task-overlap'
import { START_HOUR, SLOT_HEIGHT_PX } from '@/lib/constants'
import { Task } from '@/types/task'
import { TaskCard } from './TaskCard'

interface ScheduleGridProps {
  days: DayInfo[]
  activeMobileDay: DayInfo
  tasksByDay: Record<string, Task[]>
  currentTimeHour: number
  isDark: boolean
  onOpenAddModal: (day: string, timeSlotIndex: number) => void
  onOpenEditModal: (task: Task) => void
  onToggleComplete: (taskId: string, day: string, e: React.MouseEvent) => void
}

interface DayColumnProps {
  day: DayInfo
  tasks: Task[]
  currentTimeHour: number
  isDark: boolean
  minWidthClassName: string
  onOpenAddModal: (day: string, timeSlotIndex: number) => void
  onOpenEditModal: (task: Task) => void
  onToggleComplete: (taskId: string, day: string, e: React.MouseEvent) => void
}

// Single day's timeline column; reused for both the mobile single-day view and the desktop 7-day view.
const DayColumn = React.memo(function DayColumn({
  day,
  tasks,
  currentTimeHour,
  isDark,
  minWidthClassName,
  onOpenAddModal,
  onOpenEditModal,
  onToggleComplete
}: DayColumnProps) {
  return (
    <div
      className={`flex-1 ${minWidthClassName} border-r last:border-r-0 relative ${
        day.isToday
          ? isDark
            ? 'bg-gray-700/30 border-gray-600'
            : 'bg-blue-50/30 border-blue-100'
          : isDark
            ? 'border-gray-700'
            : 'border-gray-100'
      }`}
      style={{ height: TIME_SLOTS.length * SLOT_HEIGHT_PX }}
    >
      {TIME_SLOTS.map((_, idx) => {
        const timeHour = START_HOUR + idx
        const isCurrentHour = day.isToday && currentTimeHour >= timeHour && currentTimeHour < timeHour + 1
        return (
          <div
            key={idx}
            className={`h-20 border-b cursor-pointer transition-colors ${
              isDark
                ? `border-gray-700 hover:bg-gray-700/50 ${isCurrentHour ? 'bg-gray-700/50' : ''}`
                : `border-gray-100 hover:bg-gray-50/50 ${isCurrentHour ? 'bg-blue-50/50' : ''}`
            }`}
            onClick={() => onOpenAddModal(day.short, idx)}
          />
        )
      })}

      {tasks.map((task) => {
        const overlapLayout = computeTaskOverlapLayout(tasks, task)
        return (
          <TaskCard
            key={task.id}
            task={task}
            dayShort={day.short}
            overlapLayout={overlapLayout}
            onToggleComplete={onToggleComplete}
            onOpenEditModal={onOpenEditModal}
          />
        )
      })}
    </div>
  )
})

export function ScheduleGrid({
  days,
  activeMobileDay,
  tasksByDay,
  currentTimeHour,
  isDark,
  onOpenAddModal,
  onOpenEditModal,
  onToggleComplete
}: ScheduleGridProps) {
  const currentTimeTop = getCurrentTimePosition(currentTimeHour)

  return (
    <div
      className={`rounded-3xl shadow-lg overflow-hidden backdrop-blur-md relative z-30 ${
        isDark ? 'bg-gray-800/70 border border-white/10' : 'bg-white/40 border border-white/40'
      }`}
    >
      <div className="flex">
        {/* Timeline hours column */}
        <div className={`w-16 sm:w-20 md:w-24 flex-shrink-0 border-r ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          {TIME_SLOTS.map((time) => (
            <div
              key={time}
              className={`h-20 flex items-start justify-end pr-2 sm:pr-3 md:pr-4 pt-1 text-[10px] sm:text-xs font-medium ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {time}
            </div>
          ))}
        </div>

        {/* Schedule grid area */}
        <div className="flex-1 relative overflow-x-auto">
          {/* Real-time ticker line */}
          {currentTimeTop !== null && (
            <div
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-pink-500 z-20 pointer-events-none shadow-lg"
              style={{ top: `${currentTimeTop}px` }}
            >
              <div className="absolute left-0 w-3 h-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-full -translate-y-1/2 shadow-lg animate-pulse" />
            </div>
          )}

          {/* Mobile view single-day column */}
          <div className="flex md:hidden">
            {activeMobileDay && (
              <DayColumn
                day={activeMobileDay}
                tasks={tasksByDay[activeMobileDay.short] ?? []}
                currentTimeHour={currentTimeHour}
                isDark={isDark}
                minWidthClassName="min-w-[240px]"
                onOpenAddModal={onOpenAddModal}
                onOpenEditModal={onOpenEditModal}
                onToggleComplete={onToggleComplete}
              />
            )}
          </div>

          {/* Desktop view 7-day columns */}
          <div className="hidden md:flex">
            {days.map((day) => (
              <DayColumn
                key={day.short}
                day={day}
                tasks={tasksByDay[day.short] ?? []}
                currentTimeHour={currentTimeHour}
                isDark={isDark}
                minWidthClassName="min-w-[140px]"
                onOpenAddModal={onOpenAddModal}
                onOpenEditModal={onOpenEditModal}
                onToggleComplete={onToggleComplete}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
