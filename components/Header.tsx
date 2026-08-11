import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'

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
  onToggleTheme,
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
      {/* Header Container: single line on desktop, responsive stacked rows on mobile */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        
        {/* Left Side: Title & Badges Group */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
          {/* Title & Mobile-Only Top Right Controls (Bell + Theme) */}
          <div className="flex items-center justify-between sm:justify-start gap-2.5">
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight font-sans whitespace-nowrap ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {monthYear}
            </h1>

            {/* Mobile-Only Header Icons (Top Right) */}
            <div className="flex items-center gap-1.5 lg:hidden">
              <button
                onClick={onOpenNotifications}
                aria-label="Open notifications drawer"
                className={`relative w-8 h-8 flex items-center justify-center rounded-full transition-all cursor-pointer ${
                  isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-white/80 text-slate-700'
                }`}
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-sky-500 text-white text-[9px] font-extrabold flex items-center justify-center rounded-full shadow-xs animate-pulse">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>

              <button
                onClick={onToggleTheme}
                aria-label="Toggle theme mode"
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all cursor-pointer ${
                  isDark ? 'hover:bg-slate-700 text-yellow-400' : 'hover:bg-white/80 text-slate-700'
                }`}
              >
                {!isDark ? (
                  <svg className="w-4.5 h-4.5 text-slate-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                  </svg>
                ) : (
                  <svg className="w-4.5 h-4.5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <circle cx="12" cy="12" r="4" fill="currentColor" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Week Selector Dropdown & Status Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Week Selector Dropdown Pill */}
            {selectedWeek && onSelectWeek && (
              <div className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-2xs backdrop-blur-md transition-all ${
                isDark ? 'bg-slate-800/80 border-slate-700/80 text-slate-200' : 'bg-slate-100/90 border-slate-200/90 text-slate-800'
              }`}>
                <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <select
                  value={selectedWeek.split('T')[0]}
                  onChange={(e) => onSelectWeek(e.target.value)}
                  className="bg-transparent font-semibold cursor-pointer focus:outline-none pr-4 appearance-none text-xs"
                >
                  {sessions.map((s) => {
                    const cleanDate = s.week_start_date.split('T')[0];
                    const label = formatWeekLabel(cleanDate);
                    const isCurrent = cleanDate === thisWeekMondayStr;
                    return (
                      <option key={s.id} value={cleanDate} className={isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}>
                        {label} {isCurrent ? '(Current)' : ''}
                      </option>
                    );
                  })}
                </select>
                <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute right-2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            )}

            {/* Live Sync Status Pill */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md shadow-2xs cursor-default select-none ${
              syncStatus === 'synced'
                ? isDark ? 'bg-sky-950/70 border-sky-800/70 text-sky-300' : 'bg-sky-100/90 border-sky-300/70 text-sky-800'
                : syncStatus === 'syncing'
                ? isDark ? 'bg-amber-950/70 border-amber-800/70 text-amber-300' : 'bg-amber-100/90 border-amber-300/70 text-amber-800'
                : isDark ? 'bg-rose-950/70 border-rose-800/70 text-rose-300' : 'bg-rose-100/90 border-rose-300/70 text-rose-800'
            }`}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                syncStatus === 'syncing' ? 'bg-amber-500 animate-ping' : syncStatus === 'synced' ? 'bg-sky-500' : 'bg-rose-500'
              }`} />
              <span>{syncStatus === 'synced' ? 'Live Sync' : syncStatus === 'syncing' ? 'Syncing...' : 'Offline'}</span>
            </div>

            {/* Privacy Status Button Pill */}
            {onOpenPrivacySettings && (
              <button
                onClick={onOpenPrivacySettings}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md shadow-2xs transition-all cursor-pointer ${
                  isPrivate
                    ? isDark ? 'bg-amber-950/70 border-amber-800/70 text-amber-300 hover:bg-amber-900/70' : 'bg-amber-100/90 border-amber-300/80 text-amber-900 hover:bg-amber-200/90'
                    : isDark ? 'bg-emerald-950/70 border-emerald-800/70 text-emerald-300 hover:bg-emerald-900/70' : 'bg-emerald-100/90 border-emerald-300/80 text-emerald-900 hover:bg-emerald-200/90'
                }`}
              >
                {isPrivate ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Private</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8" />
                    </svg>
                    <span>Public</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Progress Indicator + Action Buttons + Desktop-Only Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Progress Ring & Typography */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
              <svg className="w-9 h-9 sm:w-10 sm:h-10 transform -rotate-90">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke={isDark ? '#334155' : '#E2E8F0'}
                  strokeWidth="3.5"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke={isDark ? '#38BDF8' : '#2563EB'}
                  strokeWidth="3.5"
                  strokeDasharray={strokeDashArray}
                  strokeLinecap="round"
                  suppressHydrationWarning
                />
              </svg>
            </div>
            <div>
              <div className={`text-[10px] font-extrabold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                PROGRESS
              </div>
              <div
                className={`text-base sm:text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}
                suppressHydrationWarning
              >
                {roundedProgress}%
              </div>
            </div>
          </div>

          {/* Vertical Separator Line (Desktop Only) */}
          <div className="h-6 w-px bg-slate-300/80 dark:bg-slate-700/80 mx-1 hidden lg:block" />

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            {/* Share Button */}
            {calendarId && (
              <button
                onClick={handleShare}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold border shadow-xs transition-all whitespace-nowrap cursor-pointer ${
                  copied
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : isDark
                    ? 'border-slate-700 bg-slate-800/90 text-slate-100 hover:bg-slate-700'
                    : 'border-slate-200/90 bg-white/95 text-slate-800 hover:bg-slate-50'
                }`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </button>
            )}

            {/* New Calendar Button */}
            <button
              onClick={handleNewCalendar}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold border shadow-xs transition-all whitespace-nowrap cursor-pointer ${
                isDark
                  ? 'border-slate-700 bg-slate-800/90 text-slate-100 hover:bg-slate-700'
                  : 'border-slate-200/90 bg-white/95 text-slate-800 hover:bg-slate-50'
              }`}
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>New Calendar</span>
            </button>

            {/* Lock Button */}
            {isPrivate && onLockCalendar && (
              <button
                onClick={onLockCalendar}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-2xs transition-all whitespace-nowrap cursor-pointer ${
                  isDark ? 'border-amber-800/70 bg-amber-950/70 text-amber-300 hover:bg-amber-900/70' : 'border-amber-300/80 bg-amber-100/90 text-amber-900 hover:bg-amber-200/90'
                }`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Lock</span>
              </button>
            )}

            {/* Desktop-Only Notifications Bell & Theme Toggle */}
            <div className="hidden lg:flex items-center gap-1.5">
              <button
                onClick={onOpenNotifications}
                aria-label="Open notifications drawer"
                className={`relative w-9 h-9 flex items-center justify-center rounded-full transition-all cursor-pointer ${
                  isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-white/80 text-slate-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-sky-500 text-white text-[10px] font-extrabold flex items-center justify-center rounded-full shadow-xs animate-pulse">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>

              <button
                onClick={onToggleTheme}
                aria-label="Toggle theme mode"
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all cursor-pointer ${
                  isDark ? 'hover:bg-slate-700 text-yellow-400' : 'hover:bg-white/80 text-slate-700'
                }`}
              >
                {!isDark ? (
                  <svg className="w-5 h-5 text-slate-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <circle cx="12" cy="12" r="4" fill="currentColor" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Copy Previous Week Banner */}
      {taskCount === 0 && onCopyPreviousWeek && sessions.length > 1 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-xs font-medium">
          <span>This week schedule is empty. Would you like to import task timings from last week?</span>
          <button
            onClick={onCopyPreviousWeek}
            className="px-3.5 py-1.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            Import Previous Tasks
          </button>
        </div>
      )}
    </div>
  )
}
