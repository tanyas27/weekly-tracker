import React from 'react'
import { Bell, ChevronUp, ChevronDown } from 'lucide-react'
import { DayInfo, COLORS } from '../lib/time-utils'
import { TaskModalFormData } from '../hooks/useTasks'
import { TimePicker } from './TimePicker'

interface TaskModalProps {
  showModal: boolean
  modalData: TaskModalFormData
  days: DayInfo[]
  isDark: boolean
  onClose: () => void
  onSave: () => void
  onDelete: () => void
  setModalData: React.Dispatch<React.SetStateAction<TaskModalFormData>>
}

export function TaskModal({
  showModal,
  modalData,
  days,
  isDark,
  onClose,
  onSave,
  onDelete,
  setModalData
}: TaskModalProps) {
  const modalRef = React.useRef<HTMLDivElement>(null)
  const previousFocusRef = React.useRef<HTMLElement | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (showModal) {
      previousFocusRef.current = document.activeElement as HTMLElement | null
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus()
    }
  }, [showModal])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      if (e.repeat) return
      onSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  if (!showModal) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        tabIndex={-1}
        className={`w-full sm:max-w-lg max-h-[92vh] sm:max-h-[min(90vh,780px)] flex flex-col rounded-t-[2rem] sm:rounded-[1.75rem] shadow-2xl border overflow-hidden backdrop-blur-3xl transition-all ${
          isDark
            ? 'bg-zinc-900/80 border-white/10 shadow-black/70'
            : 'bg-white/70 border-white/80 shadow-[0_24px_80px_rgba(0,0,0,0.20)]'
        }`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-0 sm:hidden flex-shrink-0">
          <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-white/20' : 'bg-black/15'}`} />
        </div>

        {/* Colored header — takes the selected task color */}
        <div className={`flex-shrink-0 px-6 pt-5 sm:pt-6 pb-5 ${modalData.color} relative overflow-hidden`}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/20 pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-black/5 pointer-events-none" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black tracking-[0.2em] uppercase text-gray-600/70 mb-2">
                {modalData.id ? 'Edit task' : 'New task'}
              </p>
              <input
                ref={inputRef}
                id="task-modal-title"
                type="text"
                value={modalData.name}
                onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                className="w-full bg-transparent outline-none text-[1.6rem] leading-tight font-bold text-gray-900 placeholder:text-gray-600/40"
                style={{ fontFamily: 'var(--font-handwritten)' }}
                placeholder="What needs doing?"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition-colors mt-0.5"
            >
              <svg className="w-3.5 h-3.5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-5 sm:px-7 py-5 space-y-5">

            {/* Days */}
            <div>
              <p className={`text-[9px] font-black tracking-[0.18em] uppercase mb-3 ${
                isDark ? 'text-zinc-500' : 'text-zinc-400'
              }`}>Days</p>
              <div className="flex gap-1.5 flex-wrap">
                {days.map((day) => {
                  const isSelected = modalData.days.includes(day.short)
                  return (
                    <button
                      key={day.short}
                      type="button"
                      onClick={() => {
                        setModalData((prev) => ({
                          ...prev,
                          days: prev.days.includes(day.short)
                            ? prev.days.filter((d) => d !== day.short)
                            : [...prev.days, day.short],
                        }))
                      }}
                      aria-pressed={isSelected}
                      aria-label={`Toggle ${day.short}`}
                      className={`px-3.5 py-2 rounded-full text-xs font-bold tracking-wide transition-all active:scale-95 ${
                        isSelected
                          ? isDark
                            ? 'bg-[#BDCC8D] text-zinc-900 shadow-sm'
                            : 'bg-[#2D5F3E] text-white shadow-sm'
                          : isDark
                            ? 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-200'
                            : 'bg-white/60 text-zinc-500 border border-zinc-200/80 hover:bg-white hover:text-zinc-700'
                      }`}
                    >
                      {day.short}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time + Duration in a frosted section card */}
            <div className={`rounded-2xl p-5 border ${
              isDark ? 'bg-white/[0.04] border-white/[0.07]' : 'bg-white/50 border-white/80'
            }`}>
              <div className="grid grid-cols-[3fr_2fr] gap-8 items-start">
                <div>
                  <p className={`text-[9px] font-black tracking-[0.18em] uppercase mb-3 ${
                    isDark ? 'text-zinc-500' : 'text-zinc-400'
                  }`}>Start Time</p>
                  <TimePicker
                    value={modalData.startTime}
                    onChange={(startTime) => setModalData({ ...modalData, startTime })}
                    isDark={isDark}
                  />
                </div>
                <div>
                  <p className={`text-[9px] font-black tracking-[0.18em] uppercase mb-3 ${
                    isDark ? 'text-zinc-500' : 'text-zinc-400'
                  }`}>Duration</p>
                  {/* Duration stepper with hrs label on the right */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setModalData({ ...modalData, duration: Math.min(8, +(modalData.duration + 0.5).toFixed(2)) })}
                        className={`w-8 h-5 flex items-center justify-center rounded-md transition-colors ${
                          isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                        }`}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <div className={`w-16 h-14 flex items-center justify-center rounded-xl border-2 ${
                        isDark ? 'border-white/10 bg-gray-900/40 text-white' : 'border-white/40 bg-white/50 text-gray-900'
                      }`}>
                        <span className="text-2xl font-extrabold leading-none">
                          {Number.isInteger(modalData.duration) ? modalData.duration : modalData.duration.toFixed(1)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModalData({ ...modalData, duration: Math.max(0.25, +(modalData.duration - 0.5).toFixed(2)) })}
                        className={`w-8 h-5 flex items-center justify-center rounded-md transition-colors ${
                          isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    <span className={`text-sm font-bold tracking-wide ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>hrs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Color */}
            <div>
              <p className={`text-[9px] font-black tracking-[0.18em] uppercase mb-3 ${
                isDark ? 'text-zinc-500' : 'text-zinc-400'
              }`}>Color</p>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setModalData({ ...modalData, color })}
                    aria-label={`Select color ${idx + 1}`}
                    className={`w-8 h-8 rounded-full relative transition-all ${color} ${
                      modalData.color === color
                        ? 'ring-[3px] ring-offset-2 ring-zinc-400/70 scale-110 shadow-lg'
                        : 'opacity-70 hover:opacity-100 hover:scale-110'
                    }`}
                  >
                    {modalData.color === color && (
                      <svg className="w-3.5 h-3.5 text-gray-700/80 absolute inset-0 m-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Reminder */}            <div>
              <p className={`flex items-center gap-1.5 text-[9px] font-black tracking-[0.18em] uppercase mb-2.5 ${
                isDark ? 'text-zinc-500' : 'text-zinc-400'
              }`}>
                <Bell className="w-3 h-3" /> Reminder
              </p>
              <select
                value={
                  modalData.reminderOffset === null
                    ? -2
                    : modalData.reminderOffset !== undefined
                    ? modalData.reminderOffset
                    : -1
                }
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10)
                  setModalData({ ...modalData, reminderOffset: val === -2 ? null : val === -1 ? undefined : val })
                }}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 ${
                  isDark
                    ? 'border-zinc-700/60 bg-zinc-800/50 text-zinc-200 focus:ring-[#BDCC8D]/30'
                    : 'border-zinc-200/60 bg-white/60 text-zinc-800 focus:ring-[#2D5F3E]/20'
                }`}
              >
                <option value={-1}>Use Global Default</option>
                <option value={-2}>None</option>
                <option value={0}>At task start time</option>
                <option value={5}>5 minutes before</option>
                <option value={10}>10 minutes before</option>
                <option value={15}>15 minutes before</option>
                <option value={30}>30 minutes before</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex-shrink-0 flex items-center gap-2.5 px-5 sm:px-6 py-4 border-t ${
          isDark ? 'border-white/[0.07] bg-zinc-900/20' : 'border-white/60 bg-white/20'
        }`}>
          {modalData.id && (
            <button
              type="button"
              onClick={onDelete}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all active:scale-95 ${
                isDark
                  ? 'border-rose-800/60 bg-rose-950/40 text-rose-400 hover:bg-rose-900/60'
                  : 'border-rose-200 bg-rose-50/80 text-rose-600 hover:bg-rose-100'
              }`}
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all active:scale-95 ${
              isDark
                ? 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700'
                : 'border-zinc-200/80 bg-white/50 text-zinc-600 hover:bg-white/80'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 ${
              isDark
                ? 'bg-[#BDCC8D] text-zinc-900 hover:bg-[#c9d79c] shadow-[#BDCC8D]/20'
                : 'bg-[#2D5F3E] text-white hover:bg-[#245033] shadow-[#2D5F3E]/25'
            }`}
          >
            {modalData.id ? 'Save Changes' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  )
}
