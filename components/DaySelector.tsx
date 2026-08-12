import React from 'react'
import { DayInfo } from '../lib/time-utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DaySelectorProps {
  days: DayInfo[]
  timezone: string
  isDark: boolean
  activeMobileDay?: DayInfo
  onPrevMobileDay?: () => void
  onNextMobileDay?: () => void
}

export function DaySelector({
  days,
  timezone,
  isDark,
  activeMobileDay,
  onPrevMobileDay,
  onNextMobileDay
}: DaySelectorProps) {
  return (
    <div className="flex gap-2 sm:gap-3 items-center overflow-x-auto pb-1 pt-2">
      {/* Timezone pill */}
      <div
        className={`flex-shrink-0 px-3 py-3 sm:py-4 rounded-2xl border flex items-center justify-center backdrop-blur-md transition-all shadow-2xs ${
          isDark
            ? 'border-white/10 bg-zinc-800/60 text-zinc-400'
            : 'border-black/[0.05] bg-white/80 text-[#1a2e23]/60'
        }`}
      >
        <div className="text-xs font-bold tracking-tight text-center whitespace-nowrap">
          {timezone}
        </div>
      </div>

      {/* Mobile view day switcher (< TUE 11 >) */}
      <div className="md:hidden flex items-center gap-2 flex-1 min-w-0">
        <button
          type="button"
          onClick={onPrevMobileDay}
          className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
            isDark
              ? 'border-white/10 text-zinc-300 hover:bg-zinc-800'
              : 'border-black/10 text-zinc-700 hover:bg-zinc-100'
          }`}
          aria-label="Previous day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {activeMobileDay && (
          <div
            className={`flex-1 py-2.5 px-4 rounded-2xl border text-center shadow-xs backdrop-blur-md transition-all ${
              activeMobileDay.isToday
                ? isDark
                  ? 'bg-zinc-800/90 border-[#BDCC8D]/50 shadow-md ring-2 ring-[#BDCC8D]/30'
                  : 'bg-white/95 border-[#2D5F3E]/40 text-[#1a2e23] shadow-md ring-2 ring-[#2D5F3E]/20'
                : isDark
                  ? 'border-white/10 bg-zinc-900/60'
                  : 'border-black/[0.04] bg-white/75'
            }`}
          >
            <div className={`text-[11px] font-extrabold tracking-wider uppercase ${
              activeMobileDay.isToday
                ? isDark ? 'text-[#BDCC8D]' : 'text-[#2D5F3E]'
                : isDark ? 'text-zinc-400' : 'text-zinc-500'
            }`}>
              {activeMobileDay.short}
            </div>
            <div className={`text-2xl font-black ${isDark ? 'text-zinc-100' : 'text-[#1a2e23]'}`}>
              {activeMobileDay.date}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onNextMobileDay}
          className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
            isDark
              ? 'border-white/10 text-zinc-300 hover:bg-zinc-800'
              : 'border-black/10 text-zinc-700 hover:bg-zinc-100'
          }`}
          aria-label="Next day"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Desktop view 7-day grid strip */}
      <div className="hidden md:flex gap-2.5 sm:gap-3 flex-1">
        {days.map((day) => (
          <div
            key={day.short}
            className={`flex-1 min-w-[68px] sm:min-w-[88px] md:min-w-[104px] py-3.5 sm:py-4 px-2 sm:px-3 rounded-2xl border transition-all text-center backdrop-blur-md ${
              day.isToday
                ? isDark
                  ? 'bg-zinc-800/90 border-[#BDCC8D]/50 shadow-md ring-2 ring-[#BDCC8D]/30'
                  : 'bg-white/95 border-[#2D5F3E]/40 shadow-md ring-2 ring-[#2D5F3E]/20'
                : isDark
                  ? 'border-white/10 bg-zinc-900/60 hover:border-white/20 hover:bg-zinc-800/80 hover:shadow-md'
                  : 'border-black/[0.04] bg-white/75 hover:bg-white/95 hover:shadow-md'
            }`}
          >
            <div className={`text-xs mb-1 font-extrabold tracking-wider uppercase ${
              day.isToday
                ? isDark ? 'text-[#BDCC8D]' : 'text-[#2D5F3E]'
                : isDark ? 'text-zinc-400' : 'text-zinc-500'
            }`}>
              {day.short}
            </div>
            <div className={`text-2xl sm:text-3xl font-extrabold ${isDark ? 'text-zinc-100' : 'text-[#1a2e23]'}`}>
              {day.date}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
