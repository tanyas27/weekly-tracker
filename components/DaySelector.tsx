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
    <div className="md:hidden flex gap-2 items-center overflow-x-auto pb-0.5 pt-1">
      {/* MOBILE 7-DAY MINI HORIZONTAL TOUCH BAR (< md) */}
      <div className="grid grid-cols-7 gap-1 w-full pt-0.5 pb-0.5">
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
    </div>
  )
}
