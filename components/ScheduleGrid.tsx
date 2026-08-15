import React, { useMemo } from 'react'
import {
  DayInfo,
  ActiveHoursPreference,
  DEFAULT_ACTIVE_HOURS,
  getTimeSlotsForRange,
  getCurrentTimePosition,
} from '@/lib/time-utils'
import { computeTaskOverlapLayout } from '@/lib/task-overlap'
import { SLOT_HEIGHT_PX } from '@/lib/constants'
import { Task } from '@/types/task'
import { TaskCard } from './TaskCard'

interface ScheduleGridProps {
  days: DayInfo[]
  activeMobileDay: DayInfo
  tasksByDay: Record<string, Task[]>
  currentTimeHour: number
  isDark: boolean
  activeHours?: ActiveHoursPreference
  onOpenAddModal: (day: string, timeSlotIndex: number) => void
  onOpenEditModal: (task: Task) => void
  onToggleComplete: (taskId: string, day: string, e: React.MouseEvent) => void
  onMoveTask: (taskId: string, fromDay: string, toDay: string, slotIndex: number) => void
}

interface DayColumnProps {
  day: DayInfo
  tasks: Task[]
  currentTimeHour: number
  isDark: boolean
  minWidthClassName: string
  startHour: number
  visibleSlotCount: number
  onOpenAddModal: (day: string, timeSlotIndex: number) => void
  onOpenEditModal: (task: Task) => void
  onToggleComplete: (taskId: string, day: string, e: React.MouseEvent) => void
  onMoveTask: (taskId: string, fromDay: string, toDay: string, slotIndex: number) => void
}

// Single day's timeline column; reused for both the mobile single-day view and the desktop 7-day view.
const DayColumn = React.memo(function DayColumn({
  day,
  tasks,
  currentTimeHour,
  isDark,
  minWidthClassName,
  startHour,
  visibleSlotCount,
  onOpenAddModal,
  onOpenEditModal,
  onToggleComplete,
  onMoveTask,
}: DayColumnProps) {
  const [dragOverInfo, setDragOverInfo] = React.useState<{ slotIndex: number; duration: number; name: string } | null>(null)

  return (
    <div
      className={`flex-1 ${minWidthClassName} border-r last:border-r-0 relative transition-colors ${
        day.isToday
          ? isDark
            ? 'bg-[#BDCC8D]/[0.07] border-white/[0.08]'
            : 'bg-[#2D5F3E]/[0.05] border-white/40'
          : isDark
            ? 'border-white/[0.06]'
            : 'border-white/30'
      }`}
      style={{ height: visibleSlotCount * SLOT_HEIGHT_PX }}
    >
      {Array.from({ length: visibleSlotCount }).map((_, idx) => {
        const timeHour = startHour + idx
        const isCurrentHour = day.isToday && currentTimeHour >= timeHour && currentTimeHour < timeHour + 1
        const isDragOver = dragOverInfo?.slotIndex === idx
        return (
          <div
            key={idx}
            className={`h-20 border-b cursor-pointer transition-colors group relative ${
              isDragOver
                ? isDark ? 'bg-[#BDCC8D]/25 border-[#BDCC8D]/40' : 'bg-[#2D5F3E]/10 border-[#2D5F3E]/30'
                : isDark
                  ? `border-white/[0.05] hover:bg-white/[0.06] ${isCurrentHour ? 'bg-[#BDCC8D]/[0.10]' : ''}`
                  : `border-white/25 hover:bg-white/25 ${isCurrentHour ? 'bg-[#2D5F3E]/[0.07]' : ''}`
            }`}
            onClick={() => onOpenAddModal(day.short, idx)}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              const duration = parseFloat(e.dataTransfer.getData('taskDuration')) || 1
              const name = e.dataTransfer.getData('taskName') || ''
              setDragOverInfo({ slotIndex: idx, duration, name })
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverInfo(null)
            }}
            onDrop={(e) => {
              e.preventDefault()
              setDragOverInfo(null)
              const taskId = e.dataTransfer.getData('taskId')
              const fromDay = e.dataTransfer.getData('fromDay')
              if (taskId) onMoveTask(taskId, fromDay, day.short, idx)
            }}
          >
            {!isDragOver && (
              <span className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-[11px] font-bold ${
                isDark ? 'text-zinc-300' : 'text-zinc-500'
              }`}>
                + Add
              </span>
            )}
          </div>
        )
      })}

      {/* Optimistic Ghost Drag Card */}
      {dragOverInfo && (
        <div
          className={`absolute left-1 right-1 rounded-lg border-2 border-dashed z-40 pointer-events-none flex items-center px-3 transition-all animate-in fade-in duration-100 ${
            isDark
              ? 'border-[#BDCC8D] bg-[#BDCC8D]/20 text-[#BDCC8D] shadow-md shadow-[#BDCC8D]/10'
              : 'border-[#2D5F3E] bg-[#2D5F3E]/15 text-[#2D5F3E] shadow-md shadow-[#2D5F3E]/10'
          }`}
          style={{
            top: `${dragOverInfo.slotIndex * SLOT_HEIGHT_PX + 2}px`,
            height: `${Math.max(1, dragOverInfo.duration) * SLOT_HEIGHT_PX - 4}px`,
          }}
        >
          <span className="text-xs font-bold truncate">
            {dragOverInfo.name ? `Move "${dragOverInfo.name}"` : 'Drop task here'}
          </span>
        </div>
      )}

      {tasks.map((task) => {
        const overlapLayout = computeTaskOverlapLayout(tasks, task)
        return (
          <TaskCard
            key={task.id}
            task={task}
            dayShort={day.short}
            overlapLayout={overlapLayout}
            baselineStartHour={startHour}
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
  activeHours,
  onOpenAddModal,
  onOpenEditModal,
  onToggleComplete,
  onMoveTask,
}: ScheduleGridProps) {
  const allTasks = useMemo(() => Object.values(tasksByDay).flat(), [tasksByDay])
  const baseStart = activeHours?.startHour ?? DEFAULT_ACTIVE_HOURS.startHour
  const baseEnd = activeHours?.endHour ?? DEFAULT_ACTIVE_HOURS.endHour

  // Auto-expand timeline bounds if any scheduled task extends beyond active hours
  const { effectiveStartHour, effectiveEndHour } = useMemo(() => {
    let minH = baseStart
    let maxH = baseEnd
    for (const t of allTasks) {
      minH = Math.min(minH, Math.floor(t.startHour))
      maxH = Math.max(maxH, Math.ceil(t.startHour + t.duration))
    }
    return {
      effectiveStartHour: Math.max(0, minH),
      effectiveEndHour: Math.min(24, Math.max(minH + 1, maxH)),
    }
  }, [allTasks, baseStart, baseEnd])

  const visibleTimeSlots = useMemo(
    () => getTimeSlotsForRange(effectiveStartHour, effectiveEndHour),
    [effectiveStartHour, effectiveEndHour]
  )

  const currentTimeTop = getCurrentTimePosition(currentTimeHour, effectiveStartHour, effectiveEndHour)
  const timeGutterCls = 'w-16 sm:w-20 md:w-24 flex-shrink-0'

  return (
    <div
      id="schedule-grid-container"
      className={`rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden relative z-30 transition-colors border backdrop-blur-xl ${
        isDark
          ? 'bg-zinc-900/50 border-white/10 shadow-black/50'
          : 'bg-white/50 border-white/60 shadow-[0_8px_32px_rgba(45,95,62,0.10)]'
      }`}
    >
      {/* ── Grid body ── */}
      <div className="flex">
        {/* Timeline hours column */}
        <div className={`${timeGutterCls} border-r transition-colors ${
          isDark ? 'border-white/[0.08] bg-zinc-900/40' : 'border-white/40 bg-white/30'
        }`}>
          {visibleTimeSlots.map((time) => (
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
                startHour={effectiveStartHour}
                visibleSlotCount={visibleTimeSlots.length}
                onOpenAddModal={onOpenAddModal}
                onOpenEditModal={onOpenEditModal}
                onToggleComplete={onToggleComplete}
                onMoveTask={onMoveTask}
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
                startHour={effectiveStartHour}
                visibleSlotCount={visibleTimeSlots.length}
                onOpenAddModal={onOpenAddModal}
                onOpenEditModal={onOpenEditModal}
                onToggleComplete={onToggleComplete}
                onMoveTask={onMoveTask}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
