'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task } from '@/types/task'
import { getCategoryColor } from '@/lib/todo-utils'
import { GripVertical, Trash2, X } from 'lucide-react'

interface TodoItemProps {
  task: Task
  isDark: boolean
  onToggleComplete?: (id: string) => void
  onDelete?: (id: string) => void
  onUpdateName?: (id: string, name: string) => void
  onUpdateCategory?: (id: string, category: string | null) => void
  isDragOverlay?: boolean
}

export function TodoItem({
  task,
  isDark,
  onToggleComplete,
  onDelete,
  onUpdateName,
  onUpdateCategory,
  isDragOverlay = false,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(task.name)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: isDragOverlay || isEditing,
  })

  // When isDragging is true in DragOverlay mode, transform MUST be undefined for the list placeholder
  // so it does not translate with the cursor or cause double-offset jumping!
  const style: React.CSSProperties = isDragOverlay
    ? {}
    : {
        transform: isDragging ? undefined : CSS.Translate.toString(transform),
        transition: isDragging ? undefined : transition,
      }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleDoubleClick = () => {
    if (!task.completed && !isDragOverlay) {
      setIsEditing(true)
      setEditValue(task.name)
    }
  }

  const handleSaveEdit = () => {
    const trimmedValue = editValue.trim()
    if (trimmedValue && trimmedValue.length <= 500) {
      if (trimmedValue !== task.name && onUpdateName) {
        onUpdateName(task.id, trimmedValue)
      }
      setIsEditing(false)
    } else if (!trimmedValue) {
      setEditValue(task.name)
      setIsEditing(false)
    } else {
      const truncated = trimmedValue.slice(0, 500)
      setEditValue(truncated)
      if (onUpdateName) {
        onUpdateName(task.id, truncated)
      }
      setIsEditing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setEditValue(task.name)
      setIsEditing(false)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsConfirmingDelete(true)
  }

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(task.id)
    }
  }

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsConfirmingDelete(false)
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleComplete) {
      onToggleComplete(task.id)
    }
  }

  const categoryColor = task.category ? getCategoryColor(task.category) : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative flex items-center gap-3 px-3.5 py-3 rounded-xl border backdrop-blur-md overflow-hidden select-none
        transition-[background-color,border-color,box-shadow,opacity] duration-150
        ${
          isDragOverlay
            ? isDark
              ? 'bg-[#1a2e1a] border-[#5a9a5b] shadow-2xl scale-[1.02] rotate-[1.5deg] z-50 cursor-grabbing'
              : 'bg-[#fffdf5] border-[#d4a853] shadow-2xl scale-[1.02] rotate-[1.5deg] z-50 cursor-grabbing'
            : isDragging
            ? isDark
              ? 'opacity-25 border-dashed border-[#5a9a5b]/60 bg-[#162318]/20 shadow-none'
              : 'opacity-25 border-dashed border-[#d4a853]/60 bg-[#f5ede0]/20 shadow-none'
            : task.completed
            ? isDark
              ? 'bg-[#162318]/30 border-[#3d5a3e]/20 opacity-55 shadow-sm hover:shadow-md'
              : 'bg-[#f5ede0]/40 border-[#c8b89a]/20 opacity-55 shadow-sm hover:shadow-md'
            : isDark
            ? 'bg-[#1a2e1a]/50 border-[#3d5a3e]/40 hover:bg-[#1e3420]/60 hover:border-[#4a7a4b]/50 shadow-sm hover:shadow-md'
            : 'bg-[#fffdf5]/65 border-[#d4b896]/50 hover:bg-[#fffdf5]/85 hover:border-[#c49a42]/50 shadow-sm hover:shadow-md'
        }
      `}
    >
      {/* Inline delete confirmation overlay */}
      {isConfirmingDelete && !isDragOverlay && (
        <div
          className={`
            absolute inset-0 z-10 flex items-center justify-between px-3.5 gap-2 rounded-xl
            ${isDark
              ? 'bg-[#2a1010]/90 border border-red-900/40 backdrop-blur-md'
              : 'bg-[#fff5f5]/95 border border-red-200/60 backdrop-blur-md'
            }
          `}
        >
          <span className={`text-xs font-medium flex-1 truncate ${isDark ? 'text-red-300/90' : 'text-red-700/90'}`}>
            Delete this note?
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={handleCancelDelete}
              className={`
                flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150
                ${isDark
                  ? 'bg-[#2d3d2e]/70 border border-[#3d5a3e]/50 text-[#6b9e5e] hover:bg-[#2d5a2e]/60'
                  : 'bg-[#f5ede0]/80 border border-[#c8b89a]/50 text-[#8b6914] hover:bg-[#eedfc8]/70'
                }
              `}
            >
              <X className="w-3 h-3" />
              Keep
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className={`
                flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150
                ${isDark
                  ? 'bg-red-900/50 border border-red-700/40 text-red-300 hover:bg-red-800/60'
                  : 'bg-red-500/15 border border-red-300/50 text-red-600 hover:bg-red-500/25'
                }
              `}
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Drag Handle */}
      <button
        type="button"
        style={{ touchAction: 'none' }}
        className={`
          cursor-grab active:cursor-grabbing transition-colors flex-shrink-0 p-1 -m-1 rounded touch-none
          ${isDragOverlay ? 'cursor-grabbing' : ''}
          ${isDark ? 'text-[#3d5a3e]/60 hover:text-[#6b9e5e]' : 'text-[#c8b89a]/70 hover:text-[#a07840]'}
        `}
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-3.5 h-3.5 pointer-events-none" />
      </button>

      {/* Checkbox */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={isDragOverlay}
        className={`
          flex-shrink-0 w-5 h-5 rounded-full border-[2px] flex items-center justify-center transition-all duration-200
          ${
            task.completed
              ? isDark
                ? 'bg-[#4a8a4b] border-[#5a9a5b] shadow-[0_0_8px_rgba(90,154,91,0.4)]'
                : 'bg-[#d4a853] border-[#c49a42] shadow-[0_0_8px_rgba(212,168,83,0.4)]'
              : isDark
              ? 'border-[#4a7a4b]/60 bg-transparent hover:border-[#6b9e5e] hover:bg-[#2d5a2e]/30'
              : 'border-[#c8b89a]/80 bg-transparent hover:border-[#d4a853] hover:bg-[#d4a853]/10'
          }
        `}
        aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {task.completed && (
          <svg className={`w-2.5 h-2.5 ${isDark ? 'text-[#d4e8b0]' : 'text-[#3d2b0a]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Todo Name (Editable) */}
      <div className="flex-1 min-w-0">
        {isEditing && !isDragOverlay ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            className={`
              w-full px-2 py-1 rounded-lg border text-sm font-handwritten transition-all duration-200
              ${
                isDark
                  ? 'bg-[#162318]/70 border-[#5a9a5b]/50 text-[#d4e8b0] focus:ring-[#4a8a4b]/30'
                  : 'bg-[#fffdf5]/90 border-[#d4a853]/50 text-[#3d2b0a] focus:ring-[#d4a853]/25'
              }
              focus:outline-none focus:ring-2 shadow-inner
            `}
            maxLength={500}
            autoComplete="off"
            spellCheck={false}
          />
        ) : (
          <div
            onDoubleClick={handleDoubleClick}
            className={`
              text-sm font-handwritten cursor-text px-2 py-1 rounded-lg transition-colors duration-150
              ${
                task.completed
                  ? isDark
                    ? 'line-through text-[#4a7a4b]/70'
                    : 'line-through text-[#c8b89a]'
                  : isDark
                  ? 'text-[#c8dea8] hover:bg-[#2d5a2e]/30'
                  : 'text-[#3d2b0a] hover:bg-[#d4a853]/10'
              }
              break-words leading-snug
            `}
            title="Double-click to edit"
          >
            {task.name}
          </div>
        )}
      </div>

      {/* Category Badge */}
      {task.category && categoryColor && (
        <span
          className={`
            px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0
            ${isDark
              ? 'bg-[#162318]/60 border-[#3d5a3e]/50 text-[#6b9e5e]'
              : 'bg-[#f5ede0]/80 border-[#c8b89a]/50 text-[#8b6914]'
            }
          `}
        >
          <span
            className="w-1.5 h-1.5 rounded-full inline-block mr-1 align-middle"
            style={{ backgroundColor: categoryColor.replace('bg-[', '').replace(']', '') }}
          />
          {task.category}
        </span>
      )}

      {/* Delete Button */}
      {!isDragOverlay && (
        <button
          type="button"
          onClick={handleDeleteClick}
          className={`
            flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-150
            w-6 h-6 rounded-lg flex items-center justify-center
            ${
              isDark
                ? 'hover:bg-red-900/30 text-[#4a7a4b]/70 hover:text-red-400'
                : 'hover:bg-red-50/80 text-[#c8b89a]/80 hover:text-red-500'
            }
          `}
          aria-label="Delete todo"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
