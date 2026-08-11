import React from 'react'
import { DayInfo } from '../lib/time-utils'

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
          isDark ? 'border-slate-700/60 bg-slate-800/40 text-slate-400' : 'border-slate-200/80 bg-slate-100/60 text-slate-500'
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
            isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
          }`}
          aria-label="Previous day"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {activeMobileDay && (
          <div
            className={`flex-1 py-2.5 px-4 rounded-2xl border text-center shadow-xs backdrop-blur-md transition-all ${
              activeMobileDay.isToday
                ? isDark
                  ? 'bg-slate-700/90 border-slate-600 shadow-md ring-2 ring-sky-500/40'
                  : 'bg-white/95 border-white text-slate-900 shadow-md ring-2 ring-sky-400/40'
                : isDark
                  ? 'border-slate-700/60 bg-slate-800/60'
                  : 'border-white/70 bg-white/75'
            }`}
          >
            <div className={`text-[11px] font-extrabold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {activeMobileDay.short}
            </div>
            <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {activeMobileDay.date}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onNextMobileDay}
          className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
            isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
          }`}
          aria-label="Next day"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
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
                  ? 'bg-slate-700/90 border-slate-500 shadow-md ring-2 ring-sky-500/40'
                  : 'bg-white/95 border-white shadow-md ring-2 ring-sky-400/40'
                : isDark
                  ? 'border-slate-700/60 bg-slate-800/60 hover:border-slate-600 hover:bg-slate-800/80 hover:shadow-md'
                  : 'border-white/70 bg-white/75 hover:bg-white/95 hover:shadow-md'
            }`}
          >
            <div className={`text-xs mb-1 font-extrabold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {day.short}
            </div>
            <div className={`text-2xl sm:text-3xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {day.date}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
