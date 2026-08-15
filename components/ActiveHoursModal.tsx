'use client'

import React, { useState } from 'react'
import { Clock, Check, X, Sparkles, Sun, Sunrise, Briefcase, Moon, Globe } from 'lucide-react'
import {
  ActiveHoursPreference,
  formatHourLabel,
} from '@/lib/time-utils'

interface ActiveHoursModalProps {
  isOpen: boolean
  isDark: boolean
  currentPreference: ActiveHoursPreference
  onClose: () => void
  onSave: (pref: ActiveHoursPreference) => void
}

interface PresetOption {
  id: string
  label: string
  desc: string
  icon: React.ReactNode
  startHour: number
  endHour: number
}

const PRESETS: PresetOption[] = [
  {
    id: 'standard',
    label: 'Standard Day',
    desc: '6:00 AM – 11:00 PM',
    icon: <Sun className="w-4 h-4 text-amber-500" />,
    startHour: 6,
    endHour: 23,
  },
  {
    id: 'early_bird',
    label: 'Early Bird',
    desc: '4:00 AM – 10:00 PM',
    icon: <Sunrise className="w-4 h-4 text-orange-500" />,
    startHour: 4,
    endHour: 22,
  },
  {
    id: 'workday',
    label: 'Workday / Focus',
    desc: '8:00 AM – 7:00 PM',
    icon: <Briefcase className="w-4 h-4 text-emerald-500" />,
    startHour: 8,
    endHour: 19,
  },
  {
    id: 'night_owl',
    label: 'Night Owl',
    desc: '9:00 AM – 12:00 AM',
    icon: <Moon className="w-4 h-4 text-indigo-400" />,
    startHour: 9,
    endHour: 24,
  },
  {
    id: 'full_24',
    label: 'Full 24 Hours',
    desc: '12:00 AM – 12:00 AM',
    icon: <Globe className="w-4 h-4 text-sky-500" />,
    startHour: 0,
    endHour: 24,
  },
]

export function ActiveHoursModal({
  isOpen,
  isDark,
  currentPreference,
  onClose,
  onSave,
}: ActiveHoursModalProps) {
  const [startHour, setStartHour] = useState(currentPreference.startHour)
  const [endHour, setEndHour] = useState(currentPreference.endHour)

  if (!isOpen) return null

  const handleApplyPreset = (preset: PresetOption) => {
    setStartHour(preset.startHour)
    setEndHour(preset.endHour)
    onSave({ startHour: preset.startHour, endHour: preset.endHour })
    onClose()
  }

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (startHour >= endHour) return
    onSave({ startHour, endHour })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border backdrop-blur-2xl transition-all ${
          isDark
            ? 'bg-zinc-900/95 border-white/15 text-zinc-100 shadow-black/70'
            : 'bg-white/95 border-[#2D5F3E]/20 text-[#1a2e23] shadow-[0_16px_50px_rgba(45,95,62,0.15)]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-[#BDCC8D]/15 border-[#BDCC8D]/30 text-[#BDCC8D]' : 'bg-[#2D5F3E]/10 border-[#2D5F3E]/20 text-[#2D5F3E]'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Timeline Active Hours</h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Hide unused early morning or late night empty rows
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-full border transition-colors cursor-pointer ${
              isDark ? 'border-white/10 hover:bg-zinc-800 text-zinc-400' : 'border-black/10 hover:bg-zinc-100 text-zinc-600'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="mb-6">
          <label className={`block text-xs font-bold uppercase tracking-wider mb-2.5 ${
            isDark ? 'text-zinc-400' : 'text-zinc-600'
          }`}>
            Quick Schedule Presets
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESETS.map((preset) => {
              const isSelected = startHour === preset.startHour && endHour === preset.endHour
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-[#BDCC8D]/20 border-[#BDCC8D]/50 text-white font-bold ring-1 ring-[#BDCC8D]/30'
                        : 'bg-emerald-50 border-emerald-300 text-[#2D5F3E] font-bold ring-1 ring-[#2D5F3E]/20'
                      : isDark
                      ? 'bg-zinc-800/60 border-white/10 hover:bg-zinc-800 hover:border-white/20'
                      : 'bg-[#FAF9F6] border-black/[0.06] hover:bg-white hover:border-[#2D5F3E]/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="shrink-0">{preset.icon}</div>
                    <div className="truncate">
                      <div className="text-xs font-bold truncate">{preset.label}</div>
                      <div className={`text-[10px] font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {preset.desc}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-500 shrink-0 ml-1" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom Start & End Range */}
        <form onSubmit={handleSaveCustom} className="space-y-4">
          <label className={`block text-xs font-bold uppercase tracking-wider ${
            isDark ? 'text-zinc-400' : 'text-zinc-600'
          }`}>
            Custom Hours Range
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Start Hour
              </span>
              <select
                value={startHour}
                onChange={(e) => {
                  const newStart = Number(e.target.value)
                  setStartHour(newStart)
                  if (newStart >= endHour) {
                    setEndHour(Math.min(24, newStart + 1))
                  }
                }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold border backdrop-blur-md outline-none transition-all cursor-pointer ${
                  isDark
                    ? 'bg-zinc-800 border-white/15 text-zinc-100 focus:ring-2 focus:ring-[#BDCC8D]/50'
                    : 'bg-white border-black/10 text-zinc-900 focus:ring-2 focus:ring-[#2D5F3E]/30'
                }`}
              >
                {Array.from({ length: 24 }).map((_, h) => (
                  <option key={h} value={h} className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}>
                    {formatHourLabel(h)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                End Hour
              </span>
              <select
                value={endHour}
                onChange={(e) => setEndHour(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold border backdrop-blur-md outline-none transition-all cursor-pointer ${
                  isDark
                    ? 'bg-zinc-800 border-white/15 text-zinc-100 focus:ring-2 focus:ring-[#BDCC8D]/50'
                    : 'bg-white border-black/10 text-zinc-900 focus:ring-2 focus:ring-[#2D5F3E]/30'
                }`}
              >
                {Array.from({ length: 25 })
                  .map((_, h) => h)
                  .filter((h) => h > startHour)
                  .map((h) => (
                    <option key={h} value={h} className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}>
                      {h === 24 ? '12:00 AM (Next Day)' : formatHourLabel(h)}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className={`p-3 rounded-xl border text-[11px] flex items-start gap-2 ${
            isDark ? 'bg-zinc-800/40 border-white/10 text-zinc-400' : 'bg-emerald-50/60 border-emerald-200/60 text-[#2D5F3E]'
          }`}>
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Smart Auto-Expand:</strong> If you ever add or move a task outside your active hours, DailyForest will automatically expand the timeline to ensure your events are never hidden.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/5 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                isDark ? 'border-white/10 text-zinc-400 hover:bg-zinc-800' : 'border-black/10 text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer ${
                isDark
                  ? 'bg-[#BDCC8D] text-zinc-950 hover:bg-[#c9d79c]'
                  : 'bg-[#2D5F3E] text-white hover:bg-[#245033]'
              }`}
            >
              Save Active Hours
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
