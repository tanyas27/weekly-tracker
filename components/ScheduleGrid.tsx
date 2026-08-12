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

interface DayHeaderCellProps {
  day: DayInfo
  isDark: boolean
  minWidthClassName?: string
}

const DayHeaderCell = React.memo(function DayHeaderCell({ day, isDark, minWidthClassName = 'flex-1 min-w-[140px]' }: DayHeaderCellProps) {
  return (
    <div
      className={`${minWidthClassName} border-r last:border-r-0 py-3 sm:py-3.5 text-center select-none transition-colors ${
        day.isToday
          ? isDark ? 'bg-[#BDCC8D]/[0.08] border-zinc-700' : 'bg-[#2D5F3E]/[0.05] border-zinc-200'
          : isDark ? 'border-zinc-800' : 'border-zinc-200'
      }`}
    >
      <div className={`text-[9px] sm:text-[10px] font-extrabold tracking-widest uppercase ${
        day.isToday ? (isDark ? 'text-[#BDCC8D]' : 'text-[#2D5F3E]') : (isDark ? 'text-zinc-500' : 'text-zinc-400')
      }`}>
        {day.short}
      </div>
      <div className={`text-xl sm:text-2xl font-extrabold leading-tight mt-0.5 ${
        day.isToday ? (isDark ? 'text-[#BDCC8D]' : 'text-[#2D5F3E]') : (isDark ? 'text-zinc-100' : 'text-[#1a2e23]')
      }`}>
        {day.date}
      </div>
      {day.isToday && (
        <div className={`mx-auto mt-1.5 w-1.5 h-1.5 rounded-full ${
          isDark ? 'bg-[#BDCC8D]' : 'bg-[#2D5F3E]'
        }`} />
      )}
    </div>
  )
})

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
      className={`flex-1 ${minWidthClassName} border-r last:border-r-0 relative transition-colors ${
        day.isToday
          ? isDark
            ? 'bg-[#BDCC8D]/[0.06] border-zinc-800/80'
            : 'bg-[#2D5F3E]/[0.04] border-black/[0.05]'
          : isDark
            ? 'border-zinc-800/80'
            : 'border-black/[0.04]'
      }`}
      style={{ height: TIME_SLOTS.length * SLOT_HEIGHT_PX }}
    >
      {TIME_SLOTS.map((_, idx) => {
        const timeHour = START_HOUR + idx
        const isCurrentHour = day.isToday && currentTimeHour >= timeHour && currentTimeHour < timeHour + 1
        return (
          <div
            key={idx}
            className={`h-20 border-b cursor-pointer transition-colors group relative ${
              isDark
                ? `border-zinc-800/60 hover:bg-[#BDCC8D]/[0.06] ${isCurrentHour ? 'bg-[#BDCC8D]/[0.09]' : ''}`
                : `border-black/[0.04] hover:bg-[#2D5F3E]/[0.04] ${isCurrentHour ? 'bg-[#2D5F3E]/[0.06]' : ''}`
            }`}
            onClick={() => onOpenAddModal(day.short, idx)}
          >
            <span className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-[11px] font-bold ${
              isDark ? 'text-zinc-300' : 'text-zinc-500'
            }`}>
              + Add
            </span>
          </div>
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
  const timeGutterCls = 'w-16 sm:w-20 md:w-24 flex-shrink-0'

  return (
    <div
      className={`rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden relative z-30 transition-colors border ${
        isDark
          ? 'bg-zinc-900 border-zinc-800/80 shadow-black/40'
          : 'bg-white border-black/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.06)]'
      }`}
    >
      {/* ── Grid body ── */}
      <div className="flex">
        {/* Timeline hours column */}
        <div className={`${timeGutterCls} border-r transition-colors ${
          isDark ? 'border-zinc-800/80 bg-zinc-900' : 'border-black/[0.05] bg-zinc-50/80'
        }`}>
          {TIME_SLOTS.map((time) => (
            <div
              key={time}
              className={`h-20 flex items-start justify-end pr-2 sm:pr-3 md:pr-4 pt-1.5 text-[10px] sm:text-[11px] font-semibold tracking-tight ${
                isDark ? 'text-zinc-500' : 'text-zinc-400'
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
              className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-[#2D5F3E] to-[#BDCC8D] z-20 pointer-events-none"
              style={{ top: `${currentTimeTop}px` }}
            >
              <div className={`absolute left-0 w-2.5 h-2.5 rounded-full -translate-y-1/2 shadow-lg animate-pulse ${
                isDark ? 'bg-[#BDCC8D]' : 'bg-[#2D5F3E]'
              }`} />
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
