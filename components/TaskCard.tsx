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
  onToggleComplete: (taskId: string, day: string, e: React.MouseEvent) => void
  onOpenEditModal: (task: Task) => void
}

export const TaskCard = React.memo(function TaskCard({
  task,
  dayShort,
  overlapLayout,
  onToggleComplete,
  onOpenEditModal
}: TaskCardProps) {
  const { top, height } = getTaskPosition(task.startHour, task.duration)
  const { totalOverlaps, overlapIndex, colWidthPercent, leftPercent } = overlapLayout

  const rotations = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2', 'rotate-0']
  const rotation = rotations[parseInt(task.id, 10) % rotations.length] || 'rotate-0'
  const isCompletedOnDay = task.completedDays?.includes(dayShort) ?? task.completed
  const isShort = task.duration <= 0.5 || totalOverlaps > 1

  return (
    <div
      className={`absolute ${task.color} ${isShort ? 'px-2 py-1' : 'p-2.5 sm:p-3'} cursor-pointer transition-all hover:scale-105 hover:z-50 ${rotation} overflow-hidden ${
        isCompletedOnDay ? 'opacity-60' : ''
      }`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left: `calc(${leftPercent}% + 2px)`,
        width: `calc(${colWidthPercent}% - 4px)`,
        zIndex: overlapIndex + 1,
        boxShadow: isCompletedOnDay
          ? '2px 2px 4px rgba(0,0,0,0.1)'
          : '4px 4px 8px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)'
      }}
      onMouseEnter={(e) => (e.currentTarget.style.zIndex = '100')}
      onMouseLeave={(e) => (e.currentTarget.style.zIndex = String(overlapIndex + 1))}
      onClick={() => onOpenEditModal(task)}
    >
      <div className={`flex justify-between gap-1.5 ${isShort ? 'items-center h-full' : 'items-start'}`}>
        <h3
          className={`text-xs sm:text-sm font-semibold text-gray-900 leading-tight tracking-wide break-words overflow-hidden flex-1 ${
            isShort ? 'truncate' : ''
          } ${isCompletedOnDay ? 'line-through' : ''}`}
          style={{ fontFamily: 'var(--font-handwritten)', wordBreak: 'break-word', overflowWrap: 'break-word' }}
        >
          {task.name}
        </h3>
        <button
          type="button"
          onClick={(e) => onToggleComplete(task.id, dayShort, e)}
          aria-label={isCompletedOnDay ? 'Mark task incomplete' : 'Mark task complete'}
          className={`w-4 h-4 sm:w-5 sm:h-5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            isCompletedOnDay ? 'bg-green-400 border-green-400' : 'border-gray-500 bg-transparent hover:bg-gray-100'
          }`}
        >
          {isCompletedOnDay && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
})
