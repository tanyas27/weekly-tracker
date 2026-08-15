'use client'

import React from 'react'
import { DayInfo } from '../lib/time-utils'

interface DaySelectorProps {
  days: DayInfo[]
  timezone: string
  isDark: boolean
  activeMobileDay?: DayInfo
  onSelectMobileDay?: (dayShort: string) => void
  onPrevMobileDay?: () => void
  onNextMobileDay?: () => void
}

export function DaySelector({
  days,
  timezone,
  isDark,
  activeMobileDay,
  onSelectMobileDay,
  onPrevMobileDay,
  onNextMobileDay,
}: DaySelectorProps) {
  return (
    <div className="flex gap-2 sm:gap-3 items-center overflow-x-auto pb-1 pt-1">
      {/* MOBILE 7-DAY MINI HORIZONTAL TOUCH BAR (< md) */}
      <div className="md:hidden grid grid-cols-7 gap-1 w-full pt-0.5 pb-1">
        {days.map((day) => {
          const isSelected = activeMobileDay?.short === day.short
          return (
            <button
              key={day.short}
              type="button"
              onClick={() => onSelectMobileDay?.(day.short)}
              className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl border transition-all active:scale-95 cursor-pointer min-h-[50px] ${
                isSelected
                  ? isDark
                    ? 'bg-[#BDCC8D] border-[#BDCC8D] text-zinc-950 font-black shadow-md ring-2 ring-[#BDCC8D]/30 scale-[1.02]'
                    : 'bg-[#2D5F3E] border-[#2D5F3E] text-white font-black shadow-md ring-2 ring-[#2D5F3E]/30 scale-[1.02]'
                  : day.isToday
                  ? isDark
                    ? 'bg-zinc-800/80 border-[#BDCC8D]/40 text-[#BDCC8D] hover:bg-zinc-800'
                    : 'bg-emerald-50/90 border-[#2D5F3E]/30 text-[#2D5F3E] hover:bg-emerald-100/70'
                  : isDark
                  ? 'bg-zinc-900/40 border-white/5 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                  : 'bg-white/40 border-black/5 text-zinc-600 hover:bg-white/80 hover:text-zinc-900'
              }`}
              aria-label={`Select ${day.short} ${day.date}`}
              aria-pressed={isSelected}
            >
              <span
                className={`text-[9px] font-extrabold uppercase tracking-wider ${
                  isSelected
                    ? isDark ? 'text-zinc-950' : 'text-white'
                    : day.isToday
                    ? isDark ? 'text-[#BDCC8D]' : 'text-[#2D5F3E]'
                    : isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}
              >
                {day.short.slice(0, 3)}
              </span>
              <span
                className={`text-sm sm:text-base font-black leading-tight mt-0.5 ${
                  isSelected
                    ? isDark ? 'text-zinc-950' : 'text-white'
                    : isDark ? 'text-zinc-100' : 'text-[#1a2e23]'
                }`}
              >
                {day.date}
              </span>
              {day.isToday && (
                <span
                  className={`w-1 h-1 rounded-full mt-0.5 ${
                    isSelected
                      ? isDark ? 'bg-zinc-950' : 'bg-white'
                      : isDark ? 'bg-[#BDCC8D]' : 'bg-[#2D5F3E]'
                  }`}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* DESKTOP: TIME label aligned above the grid's time gutter (>= md) */}
      <div
        className={`hidden md:flex flex-shrink-0 w-16 sm:w-20 md:w-24 items-center justify-center rounded-2xl border py-3.5 sm:py-4 backdrop-blur-xl ${
          isDark
            ? 'border-white/10 bg-zinc-900/40 text-zinc-500'
            : 'border-white/50 bg-white/30 text-zinc-400'
        }`}
      >
        <span className="text-[10px] font-black tracking-widest uppercase">TIME</span>
      </div>

      {/* DESKTOP 7-DAY FULL HEADER STRIP (>= md) */}
      <div className="hidden md:flex gap-2.5 sm:gap-3 flex-1">
        {days.map((day) => (
          <div
            key={day.short}
            className={`flex-1 min-w-[68px] sm:min-w-[88px] md:min-w-[104px] py-3.5 sm:py-4 px-2 sm:px-3 rounded-2xl border transition-all text-center backdrop-blur-xl ${
              day.isToday
                ? isDark
                  ? 'bg-zinc-800/60 border-[#BDCC8D]/40 shadow-lg ring-1 ring-[#BDCC8D]/30'
                  : 'bg-white/70 border-[#2D5F3E]/30 shadow-lg ring-1 ring-[#2D5F3E]/20'
                : isDark
                ? 'border-white/10 bg-zinc-900/30 hover:bg-zinc-800/50 hover:border-white/20'
                : 'border-white/40 bg-white/25 hover:bg-white/55 hover:shadow-md'
            }`}
          >
            <div
              className={`text-xs mb-1 font-extrabold tracking-wider uppercase ${
                day.isToday
                  ? isDark ? 'text-[#BDCC8D]' : 'text-[#2D5F3E]'
                  : isDark ? 'text-zinc-400' : 'text-zinc-500'
              }`}
            >
              {day.short}
            </div>
            <div
              className={`text-2xl sm:text-3xl font-extrabold ${
                isDark ? 'text-zinc-100' : 'text-[#1a2e23]'
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
