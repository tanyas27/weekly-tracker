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
            className={`flex-1 py-2.5 px-4 rounded-2xl border text-center backdrop-blur-xl transition-all ${
              activeMobileDay.isToday
                ? isDark
                  ? 'bg-zinc-800/60 border-[#BDCC8D]/40 shadow-md ring-1 ring-[#BDCC8D]/30'
                  : 'bg-white/70 border-[#2D5F3E]/30 shadow-md ring-1 ring-[#2D5F3E]/20'
                : isDark
                  ? 'border-white/10 bg-zinc-900/30'
                  : 'border-white/50 bg-white/30'
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

      {/* Desktop: TIME label aligned above the grid's time gutter */}
      <div className={`hidden md:flex flex-shrink-0 w-16 sm:w-20 md:w-24 items-center justify-center rounded-2xl border py-3.5 sm:py-4 ${
        isDark
          ? 'border-zinc-800 bg-zinc-900/80 text-zinc-500'
          : 'border-black/[0.05] bg-white/90 text-zinc-400'
      }`}>
        <span className="text-[10px] font-black tracking-widest uppercase">TIME</span>
      </div>

      {/* Desktop view 7-day grid strip */}
      <div className="hidden md:flex gap-2.5 sm:gap-3 flex-1">
        {days.map((day) => (
          <div
            key={day.short}
            className={`flex-1 min-w-[68px] sm:min-w-[88px] md:min-w-[104px] py-3.5 sm:py-4 px-2 sm:px-3 rounded-2xl border transition-all text-center ${
              day.isToday
                ? isDark
                  ? 'bg-zinc-800 border-zinc-700 shadow-md ring-1 ring-[#BDCC8D]/40'
                  : 'bg-white border-[#2D5F3E]/20 shadow-md ring-1 ring-[#2D5F3E]/20'
                : isDark
                  ? 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:border-zinc-700'
                  : 'border-black/[0.05] bg-white/70 hover:bg-white hover:shadow-sm'
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
