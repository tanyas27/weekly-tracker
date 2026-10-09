'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  X,
  Bell,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Smartphone,
  Monitor,
  Sun,
  Moon,
  Check,
  Layers,
  ArrowLeft,
  Info,
} from 'lucide-react'
import { DayInfo, COLORS, getWeekDays } from '@/lib/time-utils'
import { TASK_ICONS, TaskIcon } from '@/lib/task-icons'
import { TimePicker } from '@/components/TimePicker'
import { LogoBadge } from '@/components/LogoBadge'

export type ModalStyle = 'ghibli-glass' | 'sticky-note' | 'minimalist'

export default function ModalPreviewPage() {
  const [selectedStyle, setSelectedStyle] = useState<ModalStyle>('ghibli-glass')
  const [viewportMode, setViewportMode] = useState<'mobile' | 'desktop'>('mobile')
  const [isDark, setIsDark] = useState<boolean>(false)
  const [isOpen, setIsOpen] = useState<boolean>(true)

  // Sample modal form state
  const [taskName, setTaskName] = useState('Morning Forest Walk')
  const [selectedIcon, setSelectedIcon] = useState<string | null>('sparkles')
  const [selectedDays, setSelectedDays] = useState<string[]>(['MON', 'WED', 'FRI'])
  const [startTime, setStartTime] = useState('09:00')
  const [duration, setDuration] = useState(1.5)
  const [selectedColor, setSelectedColor] = useState(COLORS[0])
  const [reminderOffset, setReminderOffset] = useState<number | null | undefined>(-1)
  const [customEmoji, setCustomEmoji] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const days: DayInfo[] = getWeekDays('2026-08-10')

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <div
      className={`min-h-screen transition-colors duration-300 font-sans ${
        isDark ? 'bg-[#18181b] text-zinc-100' : 'bg-[#F4F1EA] text-[#1a2e23]'
      }`}
    >
      {/* Top Floating Control Bar */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-xl border-b px-4 py-3 transition-colors ${
          isDark ? 'bg-zinc-900/90 border-white/10' : 'bg-white/85 border-black/[0.06] shadow-xs'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/c/new"
              className={`p-2 rounded-xl border transition-all ${
                isDark ? 'bg-zinc-800 border-white/10 text-zinc-300 hover:text-white' : 'bg-white border-black/10 text-zinc-700 hover:bg-zinc-50'
              }`}
              title="Return to Calendar"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <LogoBadge size={26} />
              <div>
                <h1 className="text-sm font-bold flex items-center gap-1.5 leading-none">
                  Modal Style Playground
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                    Interactive
                  </span>
                </h1>
                <p className="text-[11px] opacity-60 mt-0.5">Test real-time responsiveness &amp; aesthetic options</p>
              </div>
            </div>
          </div>

          {/* Style Selector Tabs */}
          <div
            className={`flex items-center p-1 rounded-2xl border ${
              isDark ? 'bg-zinc-800/80 border-white/10' : 'bg-stone-100/90 border-black/5'
            }`}
          >
            <button
              type="button"
              onClick={() => setSelectedStyle('ghibli-glass')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStyle === 'ghibli-glass'
                  ? isDark
                    ? 'bg-[#BDCC8D] text-zinc-950 shadow-sm'
                    : 'bg-[#2D5F3E] text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>1. Ghibli Glass</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedStyle('sticky-note')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStyle === 'sticky-note'
                  ? isDark
                    ? 'bg-[#BDCC8D] text-zinc-950 shadow-sm'
                    : 'bg-[#2D5F3E] text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2. Sticky-Note</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedStyle('minimalist')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStyle === 'minimalist'
                  ? isDark
                    ? 'bg-[#BDCC8D] text-zinc-950 shadow-sm'
                    : 'bg-[#2D5F3E] text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>3. Minimal Accent</span>
            </button>
          </div>

          {/* Viewport & Theme Toggles */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center p-1 rounded-xl border ${
                isDark ? 'bg-zinc-800/80 border-white/10' : 'bg-stone-100/90 border-black/5'
              }`}
            >
              <button
                type="button"
                onClick={() => setViewportMode('mobile')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewportMode === 'mobile'
                    ? isDark
                      ? 'bg-zinc-700 text-white'
                      : 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
                title="Mobile 390px View"
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewportMode('desktop')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewportMode === 'desktop'
                    ? isDark
                      ? 'bg-zinc-700 text-white'
                      : 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
                title="Desktop Modal View"
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-zinc-800 border-white/10 text-yellow-400 hover:bg-zinc-700'
                  : 'bg-white border-black/10 text-zinc-700 hover:bg-zinc-50'
              }`}
              title="Toggle Light / Dark"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {!isOpen && (
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                  isDark ? 'bg-[#BDCC8D] text-zinc-950' : 'bg-[#2D5F3E] text-white'
                }`}
              >
                Reopen Modal
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Sandbox Stage */}
      <main className="p-4 sm:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-65px)] relative overflow-hidden">
        {/* Subtle Background Watermark / Preview Details */}
        <div className="max-w-xl text-center mb-6 z-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2 border border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
            <Info className="w-3.5 h-3.5" />
            <span>Interactive Live Simulation</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Scroll, pick colors, change time, and toggle styles. Notice how the bottom action buttons stay anchored and
            never get cropped!
          </p>
        </div>

        {/* Viewport Frame */}
        <div
          className={`relative transition-all duration-300 w-full flex items-center justify-center ${
            viewportMode === 'mobile' ? 'max-w-[420px] h-[780px]' : 'max-w-2xl h-[780px]'
          }`}
        >
          {/* Simulated Mobile Device Frame when in mobile mode */}
          {viewportMode === 'mobile' && (
            <div className="absolute inset-0 rounded-[3rem] border-[10px] border-zinc-900/40 dark:border-white/15 pointer-events-none shadow-2xl z-40">
              {/* Dynamic Island / Speaker notch */}
              <div className="w-28 h-4 bg-zinc-900 dark:bg-zinc-800 rounded-full mx-auto mt-2" />
            </div>
          )}

          {/* Modal Container */}
          {isOpen ? (
            <div
              className={`w-full h-full flex z-30 transition-all ${
                viewportMode === 'mobile'
                  ? 'items-end px-3 pb-5 pt-12'
                  : 'items-center justify-center p-4'
              }`}
            >
              <div
                className={`w-full flex flex-col overflow-hidden transition-all shadow-2xl ${
                  viewportMode === 'mobile'
                    ? 'rounded-t-[2.25rem] rounded-b-[1.75rem] max-h-[88dvh]'
                    : 'rounded-[2rem] max-h-[min(88dvh,740px)] max-w-lg'
                } ${
                  selectedStyle === 'ghibli-glass'
                    ? isDark
                      ? 'bg-zinc-900/85 backdrop-blur-2xl border border-white/15 shadow-black/80'
                      : 'bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_20px_70px_rgba(45,95,62,0.18)]'
                    : selectedStyle === 'sticky-note'
                    ? isDark
                      ? 'bg-zinc-900/90 backdrop-blur-xl border border-amber-900/30 shadow-black/80'
                      : 'bg-[#FCFBF7] border border-[#EBE6DC] shadow-[0_20px_60px_rgba(0,0,0,0.12)]'
                    : isDark
                    ? 'bg-zinc-900/75 backdrop-blur-3xl border border-white/10 shadow-black/80'
                    : 'bg-white/70 backdrop-blur-3xl border border-white/80 shadow-[0_16px_50px_rgba(0,0,0,0.10)]'
                }`}
              >
                {/* Mobile drag bar */}
                {viewportMode === 'mobile' && (
                  <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
                    <div
                      className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-white/20' : 'bg-black/15'}`}
                    />
                  </div>
                )}

                {/* --- ORIGINAL EXACT HEADER DESIGN --- */}
                <div className={`flex-shrink-0 px-6 pt-5 sm:pt-6 pb-5 ${selectedColor} relative overflow-hidden`}>
                  <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/20 pointer-events-none" />
                  <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-black/5 pointer-events-none" />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black tracking-[0.2em] uppercase text-gray-600/70 mb-2">
                        NEW TASK
                      </p>
                      <div className="flex items-center gap-2.5">
                        {selectedIcon && (
                          <div className="w-9 h-9 rounded-xl bg-black/10 flex items-center justify-center shrink-0 text-gray-900 shadow-inner">
                            <TaskIcon icon={selectedIcon} className="w-4 h-4" />
                          </div>
                        )}
                        <input
                          type="text"
                          value={taskName}
                          onChange={(e) => setTaskName(e.target.value)}
                          className="w-full bg-transparent outline-none text-[1.6rem] leading-tight font-bold text-gray-900 placeholder:text-gray-600/40"
                          style={{ fontFamily: 'var(--font-handwritten)' }}
                          placeholder="What needs doing?"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      aria-label="Close"
                      className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition-colors mt-0.5 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* --- SCROLLABLE BODY WITH VISIBLE CLEARANCE --- */}
                {/* Notice the key fix: flex-1, overflow-y-auto, AND pb-24 bottom padding to prevent sticky footer overlap! */}
                <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-4 space-y-4 relative pb-28">
                  {/* Compact Horizontal Scrollable Icon Tray + End Emoji Picker */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p
                        className={`text-[10px] font-black tracking-wider uppercase ${
                          isDark ? 'text-zinc-400' : 'text-zinc-500'
                        }`}
                      >
                        Activity Icon
                      </p>
                      {selectedIcon && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedIcon(null)
                            setShowEmojiPicker(false)
                          }}
                          className="text-[10px] font-bold opacity-60 hover:opacity-100 cursor-pointer"
                        >
                          Clear ({selectedIcon})
                        </button>
                      )}
                    </div>

                    {/* Single-row horizontal scroll tray with Lucide icons first, then Emoji picker at the END */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth">
                      {TASK_ICONS.map((item) => {
                        const isSelected = selectedIcon?.toLowerCase() === item.id.toLowerCase()
                        const IconComp = item.icon
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setSelectedIcon(isSelected ? null : item.id)
                              setShowEmojiPicker(false)
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0 text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? isDark
                                  ? 'bg-[#BDCC8D] text-zinc-950 font-bold shadow-md ring-2 ring-[#BDCC8D]'
                                  : 'bg-[#2D5F3E] text-white font-bold shadow-md ring-2 ring-[#2D5F3E]'
                                : isDark
                                ? 'bg-zinc-800/80 text-zinc-300 border border-zinc-700/80 hover:bg-zinc-700'
                                : 'bg-white/80 text-zinc-700 border border-zinc-200/80 hover:bg-white shadow-xs'
                            }`}
                          >
                            <IconComp className="w-3.5 h-3.5" />
                            <span>{item.label}</span>
                          </button>
                        )
                      })}

                      {/* EMOJI PICKER BUTTON AT THE END */}
                      {(() => {
                        const isCustomEmoji = selectedIcon && !TASK_ICONS.some((t) => t.id === selectedIcon.toLowerCase())
                        return (
                          <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0 text-xs font-semibold border transition-all cursor-pointer ${
                              isCustomEmoji || showEmojiPicker
                                ? isDark
                                  ? 'bg-[#BDCC8D] text-zinc-950 font-bold border-[#BDCC8D] shadow-md ring-2 ring-[#BDCC8D]/50'
                                  : 'bg-[#2D5F3E] text-white font-bold border-[#2D5F3E] shadow-md ring-2 ring-[#2D5F3E]/40'
                                : isDark
                                ? 'bg-zinc-800/90 text-zinc-200 border-zinc-700 hover:bg-zinc-700'
                                : 'bg-white/90 text-zinc-800 border-zinc-200/90 hover:bg-white shadow-xs'
                            }`}
                          >
                            <span className="text-sm leading-none">{isCustomEmoji ? selectedIcon : '😊'}</span>
                            <span>{isCustomEmoji ? 'Selected Emoji' : 'More Emojis...'}</span>
                          </button>
                        )
                      })()}
                    </div>

                    {/* Expandable 1-Click Emoji Grid (Zero typing required) */}
                    {showEmojiPicker && (
                      <div
                        className={`mt-2.5 p-3 rounded-2xl border backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
                          isDark
                            ? 'bg-zinc-800/95 border-white/10 shadow-xl'
                            : 'bg-white/95 border-emerald-900/10 shadow-[0_10px_30px_rgba(45,95,62,0.12)]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            Tap Any Emoji to Select
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowEmojiPicker(false)}
                            className="p-1 rounded-lg text-xs opacity-60 hover:opacity-100 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Grid of 1-click select emojis */}
                        <div className="grid grid-cols-10 gap-1.5 max-h-36 overflow-y-auto pr-1">
                          {[
                            '🌿', '🌱', '🌸', '🌻', '🌲', '🍄', '🍂', '☀️', '🌧️', '⭐',
                            '☕', '🍵', '🍎', '🥑', '🥐', '🧁', '🥗', '🍕', '💧', '🧘',
                            '📚', '✏️', '💻', '💡', '🎯', '🚀', '📝', '💼', '🔬', '🎨',
                            '🏃', '🚲', '🏊', '🏋️', '🎧', '🎮', '🎬', '✈️', '🐶', '🐱',
                            '✨', '🔥', '💖', '💤', '🎉', '🧸', '🧼', '🧹', '🪴', '🕊️',
                          ].map((emoji) => {
                            const isEmojiSelected = selectedIcon === emoji
                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => {
                                  setSelectedIcon(isEmojiSelected ? null : emoji)
                                }}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg transition-transform active:scale-90 cursor-pointer ${
                                  isEmojiSelected
                                    ? isDark
                                      ? 'bg-[#BDCC8D] ring-2 ring-[#BDCC8D] scale-110 shadow-sm'
                                      : 'bg-emerald-100 ring-2 ring-[#2D5F3E] scale-110 shadow-sm'
                                    : isDark
                                    ? 'hover:bg-white/10'
                                    : 'hover:bg-black/5'
                                }`}
                              >
                                {emoji}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Day Picker Pills */}
                  <div>
                    <p
                      className={`text-[10px] font-black tracking-wider uppercase mb-2 ${
                        isDark ? 'text-zinc-400' : 'text-zinc-500'
                      }`}
                    >
                      Days Assigned
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                      {days.map((day) => {
                        const isSelected = selectedDays.includes(day.short)
                        return (
                          <button
                            key={day.short}
                            type="button"
                            onClick={() =>
                              setSelectedDays(
                                isSelected
                                  ? selectedDays.filter((d) => d !== day.short)
                                  : [...selectedDays, day.short]
                              )
                            }
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                              isSelected
                                ? isDark
                                  ? 'bg-[#BDCC8D] text-zinc-950 shadow-xs'
                                  : 'bg-[#2D5F3E] text-white shadow-xs'
                                : isDark
                                ? 'bg-zinc-800/80 text-zinc-400 border border-zinc-700'
                                : 'bg-white/70 text-zinc-600 border border-zinc-200/80 hover:bg-white'
                            }`}
                          >
                            {day.short}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Time + Duration Card */}
                  <div
                    className={`rounded-2xl p-4 border transition-colors ${
                      isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-white/60 border-black/[0.06] shadow-xs'
                    }`}
                  >
                    <div className="grid grid-cols-[3fr_2fr] gap-4 items-center">
                      <div>
                        <p
                          className={`text-[9px] font-black tracking-wider uppercase mb-2 ${
                            isDark ? 'text-zinc-400' : 'text-zinc-500'
                          }`}
                        >
                          Start Time
                        </p>
                        <TimePicker value={startTime} onChange={setStartTime} isDark={isDark} />
                      </div>
                      <div>
                        <p
                          className={`text-[9px] font-black tracking-wider uppercase mb-2 ${
                            isDark ? 'text-zinc-400' : 'text-zinc-500'
                          }`}
                        >
                          Duration
                        </p>
                        <div className="flex flex-col items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setDuration(Math.min(8, +(duration + 0.25).toFixed(2)))}
                            className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <div
                            className={`w-20 h-12 flex flex-col items-center justify-center rounded-xl border font-bold text-sm ${
                              isDark ? 'bg-zinc-800 border-white/10 text-white' : 'bg-white border-black/10 text-zinc-900 shadow-xs'
                            }`}
                          >
                            <span>{duration} hrs</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDuration(Math.max(0.25, +(duration - 0.25).toFixed(2)))}
                            className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Color Palette Swatches — Matches Desktop Fill Exactly */}
                  <div>
                    <p
                      className={`text-[9px] font-black tracking-[0.18em] uppercase mb-3 ${
                        isDark ? 'text-zinc-500' : 'text-zinc-400'
                      }`}
                    >
                      Color
                    </p>
                    <div className="flex items-center justify-between gap-1 sm:gap-2">
                      {COLORS.map((color, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          aria-label={`Select color ${idx + 1}`}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full relative transition-all cursor-pointer shrink-0 ${color} ${
                            selectedColor === color
                              ? 'ring-[3px] ring-offset-2 ring-zinc-400/70 scale-110 shadow-lg'
                              : 'opacity-70 hover:opacity-100 hover:scale-110'
                          }`}
                        >
                          {selectedColor === color && (
                            <svg className="w-3.5 h-3.5 text-gray-700/80 absolute inset-0 m-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reminder Offset */}
                  <div>
                    <p
                      className={`flex items-center gap-1.5 text-[10px] font-black tracking-wider uppercase mb-2 ${
                        isDark ? 'text-zinc-400' : 'text-zinc-500'
                      }`}
                    >
                      <Bell className="w-3.5 h-3.5" /> Reminder
                    </p>
                    <select
                      value={reminderOffset ?? -1}
                      onChange={(e) => setReminderOffset(parseInt(e.target.value, 10))}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold border outline-none transition-colors ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-800 shadow-xs'
                      }`}
                    >
                      <option value={-1}>Use Global Default</option>
                      <option value={-2}>None</option>
                      <option value={0}>At task start time</option>
                      <option value={5}>5 minutes before</option>
                      <option value={15}>15 minutes before</option>
                      <option value={30}>30 minutes before</option>
                    </select>
                  </div>
                </div>

                {/* --- STICKY FOOTER (Cleanly Anchored, Zero Overlap) --- */}
                <div
                  className={`flex-shrink-0 flex items-center gap-2.5 px-6 py-4 border-t backdrop-blur-xl ${
                    isDark ? 'border-white/10 bg-zinc-950/80' : 'border-black/[0.06] bg-white/90 shadow-lg'
                  }`}
                  style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
                >
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isDark
                        ? 'border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700'
                        : 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      alert('Task Saved Successfully!')
                      setIsOpen(false)
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                      isDark
                        ? 'bg-[#BDCC8D] text-zinc-950 hover:bg-[#c9d79c] shadow-[#BDCC8D]/20'
                        : 'bg-[#2D5F3E] text-white hover:bg-[#234d32] shadow-[#2D5F3E]/25'
                    }`}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-sm font-semibold mb-3">Modal is currently closed.</p>
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer ${
                  isDark ? 'bg-[#BDCC8D] text-zinc-950' : 'bg-[#2D5F3E] text-white'
                }`}
              >
                Open Modal
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
