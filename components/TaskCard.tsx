import React from 'react'
import { Task } from '@/types/task'
import { getTaskPosition } from '@/lib/time-utils'

interface TaskCardProps {
  task: Task
  dayShort: string
  overlapLayout: {
    totalOverlaps: number
    overlapIndex: number
    colWidthPercent: number
    leftPercent: number
  }
  baselineStartHour?: number
  onToggleComplete: (taskId: string, day: string, e: React.MouseEvent) => void
  onOpenEditModal: (task: Task) => void
}


export const TaskCard = React.memo(function TaskCard({
  task,
  dayShort,
  overlapLayout,
  baselineStartHour = 0,
  onToggleComplete,
  onOpenEditModal
}: TaskCardProps) {
  const { top, height } = getTaskPosition(task.startHour, task.duration, baselineStartHour)
  const { totalOverlaps, overlapIndex, colWidthPercent, leftPercent } = overlapLayout

  const rotations = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2', 'rotate-0']
  const rotation = rotations[parseInt(task.id, 10) % rotations.length] || 'rotate-0'
  const isCompletedOnDay = task.completedDays?.includes(dayShort) ?? task.completed
  const isShort = task.duration <= 0.5 || totalOverlaps > 1

  return (
    <div
      draggable
      className={`absolute ${task.color} cursor-grab active:cursor-grabbing transition-all hover:scale-[1.03] hover:z-50 ${rotation} overflow-hidden rounded-[3px] ${
        isCompletedOnDay ? 'opacity-55' : ''
      }`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left: `calc(${leftPercent}% + 3px)`,
        width: `calc(${colWidthPercent}% - 6px)`,
        zIndex: overlapIndex + 1,
        padding: isShort ? '4px 6px' : '6px 8px',
        boxShadow: isCompletedOnDay
          ? '1px 2px 4px rgba(0,0,0,0.08)'
          : '3px 3px 8px rgba(0,0,0,0.14), 0 1px 3px rgba(0,0,0,0.08)',
      }}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('taskId', task.id)
        e.dataTransfer.setData('fromDay', dayShort)
        e.dataTransfer.setData('taskDuration', String(task.duration))
        e.dataTransfer.setData('taskName', task.name)
      }}
      onMouseEnter={(e) => (e.currentTarget.style.zIndex = '100')}
      onMouseLeave={(e) => (e.currentTarget.style.zIndex = String(overlapIndex + 1))}
      onClick={() => onOpenEditModal(task)}
    >
      <div className={`flex justify-between gap-1 ${isShort ? 'items-center h-full' : 'items-start'}`}>
        <div className="flex-1 min-w-0 overflow-hidden">
          <h3
            className={`text-[11px] sm:text-xs font-bold text-gray-900 leading-tight break-words ${
              isShort ? 'truncate' : ''
            } ${isCompletedOnDay ? 'line-through opacity-70' : ''}`}
            style={{ fontFamily: 'var(--font-handwritten)', wordBreak: 'break-word', overflowWrap: 'break-word' }}
          >
            {task.name}
          </h3>
        </div>
        <button
          type="button"
          onClick={(e) => onToggleComplete(task.id, dayShort, e)}
          aria-label={isCompletedOnDay ? 'Mark task incomplete' : 'Mark task complete'}
          className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all mt-0.5 ${
            isCompletedOnDay
              ? 'bg-emerald-500 border-emerald-500 shadow-sm'
              : 'border-gray-400/60 bg-white/40 hover:border-emerald-500 hover:bg-emerald-50'
          }`}
        >
          {isCompletedOnDay && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
})
