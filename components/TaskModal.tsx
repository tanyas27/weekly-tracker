import React from 'react'
import { Bell } from 'lucide-react'
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
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      if (e.repeat) return
      onSave()
    }
  }

  if (!showModal) return null

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className={`rounded-2xl md:rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 backdrop-blur-2xl backdrop-saturate-150 border ${
          isDark ? 'bg-gray-800/75 border-white/10' : 'bg-white/50 border-white/40'
        }`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h2
          className={`text-xl sm:text-2xl font-bold tracking-tight mb-4 pb-3 border-b ${
            isDark ? 'text-gray-100 border-white/10' : 'text-gray-900 border-white/30'
          }`}
        >
          {modalData.id ? 'Edit Task' : 'Add New Task'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Task Name
            </label>
            <input
              type="text"
              value={modalData.name}
              onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg backdrop-blur-sm focus:ring-2 focus:border-transparent outline-none transition-colors ${
                isDark
                  ? 'border-white/10 bg-gray-900/40 text-white placeholder:text-gray-500 focus:ring-[#8BB783]'
                  : 'border-white/40 bg-white/50 text-gray-900 placeholder:text-gray-500 focus:ring-[#57907C]'
              }`}
              placeholder="Enter task name (Press Cmd/Ctrl+Enter to save)"
              autoFocus
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Days
            </label>
            <div className="flex flex-nowrap gap-2 sm:gap-3 overflow-x-auto px-1 pb-2 pt-1">
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
                          ? prev.days.filter((selectedDay) => selectedDay !== day.short)
                          : [...prev.days, day.short]
                      }))
                    }}
                    aria-pressed={isSelected}
                    aria-label={`Toggle ${day.short}`}
                    className={`relative flex-shrink-0 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide overflow-hidden transition-all hover:scale-105 ${
                      isSelected
                        ? isDark
                          ? 'bg-[#BDCC8D] text-gray-900 shadow-[0_4px_12px_rgba(139,183,131,0.4),inset_0_1px_1px_rgba(255,255,255,0.5)]'
                          : 'bg-[#8BB783] text-gray-900 shadow-[0_4px_12px_rgba(87,144,124,0.45),inset_0_1px_1px_rgba(255,255,255,0.6)]'
                        : isDark
                          ? 'bg-gray-800/40 border border-gray-700 text-gray-300 shadow-[0_2px_6px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.08)]'
                          : 'bg-white/40 border border-white/50 text-gray-700 shadow-[0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.6)]'
                    }`}
                  >
                    {/* Glossy droplet highlight */}
                    <span
                      className={`pointer-events-none absolute top-1 left-2.5 w-1.5 h-1.5 rounded-full blur-[0.5px] ${
                        isSelected ? 'bg-white/70' : isDark ? 'bg-white/20' : 'bg-white/60'
                      }`}
                    />
                    <span className="relative z-10">{day.short}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Start Time
              </label>
              <TimePicker
                value={modalData.startTime}
                onChange={(startTime) => setModalData({ ...modalData, startTime })}
                isDark={isDark}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setModalData({ ...modalData, color })}
                    aria-label={`Select color ${idx + 1}`}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 shadow-sm transition-all ${color} ${
                      modalData.color === color
                        ? 'border-white scale-110 shadow-md'
                        : 'border-transparent hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Duration (hrs)
              </label>
              <input
                type="number"
                min="0.25"
                max="8"
                step="0.25"
                value={modalData.duration}
                onChange={(e) =>
                  setModalData({ ...modalData, duration: parseFloat(e.target.value) || 0.25 })
                }
                className={`w-full px-4 py-2 border rounded-lg backdrop-blur-sm focus:ring-2 focus:border-transparent outline-none transition-colors ${
                  isDark
                    ? 'border-white/10 bg-gray-900/40 text-white focus:ring-[#8BB783]'
                    : 'border-white/40 bg-white/50 text-gray-900 focus:ring-[#57907C]'
                }`}
              />
            </div>

            <div className="col-span-2">
              <label className={`block text-sm font-medium mb-2 flex items-center gap-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <span>Reminder</span>
                <Bell className="w-3.5 h-3.5 text-gray-500" />
              </label>
              <select
                value={
                  modalData.reminderOffset === null
                    ? -2
                    : modalData.reminderOffset !== undefined
                    ? modalData.reminderOffset
                    : -1
                }
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setModalData({
                    ...modalData,
                    reminderOffset: val === -2 ? null : val === -1 ? undefined : val,
                  });
                }}
                className={`w-full px-4 py-2 border rounded-lg backdrop-blur-sm focus:ring-2 focus:border-transparent outline-none transition-colors ${
                  isDark
                    ? 'border-white/10 bg-gray-900/40 text-white focus:ring-[#8BB783]'
                    : 'border-white/40 bg-white/50 text-gray-900 focus:ring-[#57907C]'
                }`}
              >
                <option value={-1}>Use Global Default</option>
                <option value={-2}>None (No notification for this task)</option>
                <option value={0}>At task start time (0 min)</option>
                <option value={5}>5 minutes before</option>
                <option value={10}>10 minutes before</option>
                <option value={15}>15 minutes before</option>
                <option value={30}>30 minutes before</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            {modalData.id && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg border backdrop-blur-sm font-medium transition-colors ${
                isDark
                  ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  : 'bg-white/40 border-white/40 text-gray-700 hover:bg-white/60'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold shadow-md transition-colors ${
                isDark
                  ? 'bg-[#BDCC8D] text-gray-900 hover:bg-[#D3E1C5]'
                  : 'bg-[#8BB783] text-gray-900 hover:bg-[#75AC83]'
              }`}
            >
              {modalData.id ? 'Save' : 'Add Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
