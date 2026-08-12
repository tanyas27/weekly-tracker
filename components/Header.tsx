import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'
import { Share2, PlusCircle, Lock, Calendar, Globe, Bell } from 'lucide-react'

export interface SessionInfo {
  id: string;
  calendar_id: string;
  week_start_date: string;
  created_at: string;
}

interface HeaderProps {
  monthYear: string
  progressPercentage: number
  isDark: boolean
  onToggleTheme: () => void
  unreadNotificationsCount?: number
  onOpenNotifications?: () => void
  calendarId?: string
  sessions?: SessionInfo[]
  selectedWeek?: string
  onSelectWeek?: (week: string) => void
  onCopyPreviousWeek?: () => void
  syncStatus?: 'synced' | 'syncing' | 'offline' | 'error'
  taskCount?: number
  isPrivate?: boolean
  onOpenPrivacySettings?: () => void
  onLockCalendar?: () => void
}

function formatWeekLabel(rawDateStr: string): string {
  if (!rawDateStr) return '';
  const dateOnly = rawDateStr.split('T')[0];
  const parts = dateOnly.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return rawDateStr;
  const startDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 6);
  const formatOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' };
  return `${startDate.toLocaleDateString('en-US', formatOpts)} – ${endDate.toLocaleDateString('en-US', formatOpts)}`;
}

export function Header({
  monthYear,
  progressPercentage,
  isDark,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  calendarId,
  sessions = [],
  selectedWeek,
  onSelectWeek,
  onCopyPreviousWeek,
  syncStatus = 'synced',
  taskCount = 0,
  isPrivate = false,
  onOpenPrivacySettings,
  onLockCalendar,
}: HeaderProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const roundedProgress = Math.round(progressPercentage)
  const strokeDashArray = `${(progressPercentage / 100) * 100.53} 100.53`

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handleNewCalendar = () => {
    const newCalendarId = nanoid(21)
    router.push(`/c/${newCalendarId}`)
  }

  const currentMonday = new Date()
  const day = currentMonday.getDay()
  const diff = currentMonday.getDate() - day + (day === 0 ? -6 : 1)
  const thisWeekMondayStr = new Date(currentMonday.setDate(diff)).toISOString().split('T')[0]

  return (
    <div className="flex flex-col gap-3.5 mb-4 sm:mb-6">
      {/* Top Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Left Side: Month Title & Status Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            {/* Month Title (Original Bold Sans-Serif Font) */}
            <h1 className={`text-2xl sm:text-3xl md:text-4xl font-black font-sans tracking-tight whitespace-nowrap ${
              isDark ? 'text-zinc-100' : 'text-[#1a2e23]'
            }`}>
              {monthYear}
            </h1>

            {/* Mobile Notification Bell */}
            <div className="flex items-center gap-1.5 lg:hidden">
              <button
                type="button"
                onClick={onOpenNotifications}
                aria-label="Open notifications"
                className={`relative w-8 h-8 flex items-center justify-center rounded-full border transition-colors ${
                  isDark
                    ? 'bg-zinc-800 border-white/10 text-zinc-300 hover:bg-zinc-700'
                    : 'bg-white border-black/10 text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full animate-pulse">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Week Selector Dropdown & Status Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Week Selector Dropdown Pill */}
            {selectedWeek && onSelectWeek && (() => {
              const cleanSelected = selectedWeek.split('T')[0];
              const hasSelectedInSessions = sessions.some(
                (s) => s.week_start_date && s.week_start_date.split('T')[0] === cleanSelected
              );

              const allSessions = hasSelectedInSessions
                ? sessions
                : [
                    {
                      id: 'current-selected-week',
                      calendar_id: calendarId || '',
                      week_start_date: cleanSelected,
                      created_at: new Date().toISOString(),
                    },
                    ...sessions,
                  ];

              return (
                <div className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-2xs backdrop-blur-md transition-all ${
                  isDark
                    ? 'bg-zinc-800/80 border-white/10 text-zinc-200'
                    : 'bg-white/90 border-black/[0.04] text-[#1a2e23]'
                }`}>
                  <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-[#BDCC8D]' : 'text-[#2D5F3E]'}`} />
                  <select
                    value={cleanSelected}
                    onChange={(e) => onSelectWeek(e.target.value)}
                    className="bg-transparent font-semibold cursor-pointer focus:outline-none pr-4 appearance-none text-xs"
                  >
                    {allSessions.map((s) => {
                      const cleanDate = s.week_start_date.split('T')[0];
                      const label = formatWeekLabel(cleanDate);
                      const isCurrent = cleanDate === thisWeekMondayStr;
                      return (
                        <option key={s.id} value={cleanDate} className={isDark ? 'bg-zinc-800 text-white' : 'bg-white text-zinc-900'}>
                          {label} {isCurrent ? '(Current)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              );
            })()}

            {/* Live Sync Status Pill */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md shadow-2xs cursor-default select-none ${
              syncStatus === 'synced'
                ? isDark
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                : syncStatus === 'syncing'
                ? isDark ? 'bg-amber-950/60 border-amber-800/60 text-amber-300' : 'bg-amber-50 border-amber-200/80 text-amber-800'
                : isDark ? 'bg-rose-950/60 border-rose-800/60 text-rose-300' : 'bg-rose-50 border-rose-200/80 text-rose-800'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                syncStatus === 'syncing' ? 'bg-amber-500 animate-ping' : syncStatus === 'synced' ? 'bg-emerald-500' : 'bg-rose-500'
              }`} />
              <span>{syncStatus === 'synced' ? 'Live Sync' : syncStatus === 'syncing' ? 'Syncing...' : 'Offline'}</span>
            </div>

            {/* Privacy Status Button Pill */}
            {onOpenPrivacySettings && (
              <button
                type="button"
                onClick={onOpenPrivacySettings}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md shadow-2xs transition-all cursor-pointer ${
                  isPrivate
                    ? isDark
                      ? 'bg-pink-950/60 border-pink-800/60 text-pink-300 hover:bg-pink-900/60'
                      : 'bg-pink-50 border-pink-200/80 text-pink-700 hover:bg-pink-100'
                    : isDark
                      ? 'bg-sky-950/60 border-sky-800/60 text-sky-300 hover:bg-sky-900/60'
                      : 'bg-sky-50 border-sky-200/60 text-sky-700 hover:bg-sky-100'
                }`}
              >
                {isPrivate ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-pink-500" />
                    <span>Private</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5 text-sky-500" />
                    <span>Public</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Progress Ring + Actions + Desktop Notification Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Progress Indicator */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
              <svg className="w-9 h-9 sm:w-10 sm:h-10 transform -rotate-90">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke={isDark ? '#27272a' : '#e4e4e7'}
                  strokeWidth="3.5"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke={isDark ? '#BDCC8D' : '#2D5F3E'}
                  strokeWidth="3.5"
                  strokeDasharray={strokeDashArray}
                  strokeLinecap="round"
                  suppressHydrationWarning
                />
              </svg>
            </div>
            <div>
              <div className={`text-[10px] font-bold tracking-wider uppercase ${isDark ? 'text-zinc-400' : 'text-[#1a2e23]/50'}`}>
                PROGRESS
              </div>
              <div
                className={`text-base sm:text-lg font-extrabold tracking-tight ${isDark ? 'text-zinc-100' : 'text-[#1a2e23]'}`}
                suppressHydrationWarning
              >
                {roundedProgress}%
              </div>
            </div>
          </div>

          {/* Vertical Separator Line (Desktop Only) */}
          <div className={`h-6 w-px mx-1 hidden lg:block ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            {/* Share Button (Primary Action) */}
            {calendarId && (
              <button
                type="button"
                onClick={handleShare}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 sm:px-4.5 py-1.5 rounded-full text-xs font-bold border shadow-md transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20'
                    : isDark
                    ? 'bg-[#38BDF8] text-zinc-950 border-[#38BDF8] hover:bg-[#7DD3FC] shadow-sky-400/25'
                    : 'bg-[#0284C7] text-white border-[#0284C7] hover:bg-[#0369A1] shadow-sky-600/25'
                }`}
              >
                <Share2 className="w-3.5 h-3.5 shrink-0" />
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </button>
            )}

            {/* New Calendar Button (Emerald Accent) */}
            <button
              type="button"
              onClick={handleNewCalendar}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold border shadow-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                isDark
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-300/80 hover:bg-emerald-100'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>New Calendar</span>
            </button>

            {/* Lock Button (Amber Security Pill) */}
            {isPrivate && onLockCalendar && (
              <button
                type="button"
                onClick={onLockCalendar}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                  isDark
                    ? 'bg-amber-950/60 text-amber-300 border-amber-800/60 hover:bg-amber-900/60'
                    : 'bg-amber-50 text-amber-900 border-amber-300/80 hover:bg-amber-100'
                }`}
              >
                <Lock className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                <span>Lock</span>
              </button>
            )}

            {/* Desktop Notification Bell */}
            <div className="hidden lg:flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenNotifications}
                aria-label="Open notifications drawer"
                className={`relative w-9 h-9 flex items-center justify-center rounded-full border transition-all active:scale-95 cursor-pointer ${
                  isDark
                    ? 'bg-zinc-800/80 border-white/10 text-zinc-300 hover:bg-zinc-700'
                    : 'bg-emerald-50/80 border-emerald-200/80 text-emerald-900 hover:bg-emerald-100'
                }`}
              >
                <Bell className="w-4 h-4 text-emerald-700 dark:text-zinc-300" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full animate-pulse shadow-xs">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Copy Previous Week Banner */}
      {taskCount === 0 && onCopyPreviousWeek && sessions.length > 1 && (
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-3 rounded-2xl border text-xs font-medium ${
          isDark
            ? 'bg-amber-950/40 border-amber-800/50 text-amber-300'
            : 'bg-amber-50/80 border-amber-200 text-amber-900'
        }`}>
          <span>This week schedule is empty. Would you like to import task timings from last week?</span>
          <button
            type="button"
            onClick={onCopyPreviousWeek}
            className={`px-3.5 py-1.5 rounded-full font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap ${
              isDark
                ? 'bg-[#BDCC8D] text-zinc-950 hover:bg-[#c9d79c]'
                : 'bg-[#2D5F3E] text-white hover:bg-[#245033]'
            }`}
          >
            Import Previous Tasks
          </button>
        </div>
      )}
    </div>
  )
}
