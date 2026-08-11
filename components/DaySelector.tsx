import React from 'react'
import { DayInfo } from '../lib/time-utils'

interface DaySelectorProps {
  days: DayInfo[]
  timezone: string
  isDark: boolean
  activeMobileDay: DayInfo
  onPrevMobileDay: () => void
  onNextMobileDay: () => void
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
    <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-6 overflow-x-auto pb-2">
      <div
        className={`flex-shrink-0 w-16 h-20 sm:w-20 sm:h-24 rounded-xl sm:rounded-2xl border flex items-center justify-center backdrop-blur-sm ${
          isDark ? 'border-gray-700 bg-gray-800/30' : 'border-white/30 bg-white/30'
        }`}
      >
        <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {timezone}
        </div>
      </div>

      {/* Mobile view day switcher */}
      <div className="md:hidden flex items-center gap-2 flex-1 min-w-0">
        <button
          type="button"
          onClick={onPrevMobileDay}
          className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
            isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Previous day"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {activeMobileDay && (
          <div
            className={`flex-1 min-w-[120px] px-4 py-2 rounded-xl border text-center shadow-sm backdrop-blur-sm ${
              activeMobileDay.isToday
                ? isDark
                  ? 'bg-gray-700/70 border-gray-600 shadow-lg'
                  : 'bg-white/60 border-white/50 text-gray-900 shadow-lg'
                : isDark
                  ? 'border-gray-700 bg-gray-800/50'
                  : 'border-white/30 bg-white/30'
            }`}
          >
            <div
              className={`text-xs mb-1 font-medium ${
                activeMobileDay.isToday
                  ? isDark
                    ? 'text-gray-300'
                    : 'text-gray-700'
                  : isDark
                    ? 'text-gray-400'
                    : 'text-gray-700'
              }`}
            >
              {activeMobileDay.short}
            </div>
            <div
              className={`text-xl font-semibold ${
                activeMobileDay.isToday ? (isDark ? 'text-white' : 'text-gray-900') : isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              {activeMobileDay.date}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onNextMobileDay}
          className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
            isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Next day"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Desktop view 7-day grid strip */}
      <div className="hidden md:flex gap-2 sm:gap-3 flex-1">
        {days.map((day) => (
          <div
            key={day.short}
            className={`flex-1 min-w-[72px] sm:min-w-[96px] md:min-w-[120px] px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 rounded-xl sm:rounded-2xl border transition-all text-center shadow-sm backdrop-blur-sm ${
              day.isToday
                ? isDark
                  ? 'bg-gray-700/70 border-gray-600 shadow-lg'
                  : 'bg-white/60 border-white/50 text-gray-900 shadow-lg'
                : isDark
                  ? 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:shadow-md'
                  : 'border-white/30 bg-white/30 hover:bg-white/40 hover:shadow-md'
            }`}
          >
            <div
              className={`text-xs mb-1 font-medium ${
                day.isToday ? (isDark ? 'text-gray-300' : 'text-gray-700') : isDark ? 'text-gray-400' : 'text-gray-700'
              }`}
            >
              {day.short}
            </div>
            <div
              className={`text-xl sm:text-2xl md:text-3xl font-semibold ${
                day.isToday ? (isDark ? 'text-white' : 'text-gray-900') : isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              {day.date}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
