'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { nanoid } from 'nanoid'
import {
  Share2,
  PlusCircle,
  Lock,
  Calendar,
  Globe,
  Bell,
  ChevronDown,
  Check,
  Home,
  Clock,
} from 'lucide-react'
import { getRecentCalendars, RecentCalendar, formatRelativeTime } from '@/lib/recent-calendars'
import {
  ActiveHoursPreference,
  formatHourRangeLabel,
  normalizeToMonday,
  getAdjacentWeeks,
  getWeekTag,
} from '@/lib/time-utils'

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
  activeHours?: ActiveHoursPreference
  onOpenActiveHours?: () => void
}

function formatWeekLabel(rawDateStr: string): string {
  if (!rawDateStr) return '';
  const cleanMondayStr = normalizeToMonday(rawDateStr);
  const [y, m, d] = cleanMondayStr.split('-').map(Number);
  const startDate = new Date(y, m - 1, d);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  const formatOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
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
  activeHours,
  onOpenActiveHours,
}: HeaderProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [savedCalendars, setSavedCalendars] = useState<RecentCalendar[]>([])
  const switcherRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSavedCalendars(getRecentCalendars())
  }, [calendarId, switcherOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setSwitcherOpen(false)
      }
    }
    if (switcherOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [switcherOpen])

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

  const currentCalendarInfo = savedCalendars.find((c) => c.id === calendarId)
  const calendarDisplayName =
    currentCalendarInfo?.title && currentCalendarInfo.title !== 'My Planner' && currentCalendarInfo.title !== 'My Weekly Schedule'
      ? currentCalendarInfo.title
      : calendarId
      ? `Planner #${calendarId.slice(0, 6)}`
      : 'Planner'

  const syncStatusText =
    syncStatus === 'synced' ? 'Live Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Offline'

  return (
    <div className="flex flex-col gap-3 mb-3 sm:mb-5">
      {/* Main Unified Header Container */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        
        {/* Left Cluster: Month Title, Planner Switcher, Week Selector */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Month Title */}
          <h1 className={`text-xl sm:text-2xl md:text-3xl font-black font-sans tracking-tight whitespace-nowrap ${
            isDark ? 'text-zinc-100' : 'text-[#1a2e23]'
          }`}>
            {monthYear}
          </h1>

          {/* Quick Calendar Switcher Pill with embedded sync dot */}
          <div className="relative" ref={switcherRef}>
            <button
              type="button"
              onClick={() => setSwitcherOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-2xs backdrop-blur-md transition-all cursor-pointer ${
                isDark
                  ? 'bg-zinc-800/90 border-white/15 text-zinc-200 hover:border-[#BDCC8D]/50'
                  : 'bg-white/90 border-black/10 text-[#1a2e23] hover:border-[#2D5F3E]/40'
              }`}
              aria-label="Switch planner"
              aria-expanded={switcherOpen}
              title={`Status: ${syncStatusText}`}
            >
              {/* Subtle Embedded Sync Indicator Dot */}
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  syncStatus === 'synced'
                    ? 'bg-emerald-500'
                    : syncStatus === 'syncing'
                    ? 'bg-amber-500 animate-ping'
                    : 'bg-rose-500'
                }`}
              />
              <span className="max-w-[100px] sm:max-w-[130px] truncate">{calendarDisplayName}</span>
              <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${switcherOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Switcher Dropdown Menu */}
            {switcherOpen && (
              <div
                className={`absolute left-0 top-full mt-2 w-64 p-2 rounded-2xl border shadow-xl backdrop-blur-xl z-50 transition-all ${
                  isDark
                    ? 'bg-zinc-900/95 border-white/15 shadow-black/60 text-zinc-100'
                    : 'bg-white/95 border-black/10 shadow-emerald-950/10 text-zinc-900'
                }`}
              >
                <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-black/5 dark:border-white/10 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    My Planners
                  </span>
                  <Link
                    href="/"
                    onClick={() => setSwitcherOpen(false)}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-[#BDCC8D] hover:underline flex items-center gap-1"
                  >
                    <Home className="w-3 h-3" /> Hub
                  </Link>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1 py-1">
                  {savedCalendars.map((c) => {
                    const isCurrent = c.id === calendarId
                    const name =
                      c.title && c.title !== 'My Planner' && c.title !== 'My Weekly Schedule'
                        ? c.title
                        : `Planner #${c.id.slice(0, 6)}`
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSwitcherOpen(false)
                          if (!isCurrent) {
                            router.push(`/c/${c.id}`)
                          }
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isCurrent
                            ? isDark
                              ? 'bg-emerald-950/60 text-emerald-300 font-bold'
                              : 'bg-emerald-50 text-[#2D5F3E] font-bold'
                            : isDark
                            ? 'hover:bg-zinc-800 text-zinc-300'
                            : 'hover:bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {c.isPrivate && <Lock className="w-3 h-3 text-amber-500 shrink-0" />}
                          <span className="truncate">{name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] opacity-40">{formatRelativeTime(c.lastVisited)}</span>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="pt-1.5 border-t border-black/5 dark:border-white/10 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSwitcherOpen(false)
                      handleNewCalendar()
                    }}
                    className={`w-full text-center py-1.5 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      isDark
                        ? 'bg-zinc-800 border-white/10 text-[#BDCC8D] hover:bg-zinc-700'
                        : 'bg-emerald-50 border-emerald-200/80 text-[#2D5F3E] hover:bg-emerald-100'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Create New Planner
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Week Selector Dropdown Pill */}
          {selectedWeek && onSelectWeek && (() => {
            const cleanSelected = normalizeToMonday(selectedWeek);

            // Collect standard upcoming (+1, +2, +3 weeks), past weeks, and any existing saved sessions
            const uniqueMondays = new Set<string>();
            getAdjacentWeeks(thisWeekMondayStr, 2, 3).forEach((w) => uniqueMondays.add(w));
            uniqueMondays.add(cleanSelected);

            for (const s of sessions) {
              if (s.week_start_date) {
                uniqueMondays.add(normalizeToMonday(s.week_start_date));
              }
            }

            // Sort weeks chronologically descending (newest upcoming weeks first)
            const sortedMondays = Array.from(uniqueMondays).sort((a, b) => b.localeCompare(a));

            return (
              <div className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-2xs backdrop-blur-md transition-all ${
                isDark
                  ? 'bg-zinc-800/80 border-white/10 text-zinc-200'
                  : 'bg-white/90 border-black/[0.06] text-[#1a2e23]'
              }`}>
                <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-[#BDCC8D]' : 'text-[#2D5F3E]'}`} />
                <select
                  value={cleanSelected}
                  onChange={(e) => onSelectWeek(e.target.value)}
                  className="bg-transparent font-semibold cursor-pointer focus:outline-none pr-4 appearance-none text-xs"
                >
                  {sortedMondays.map((mondayDate) => {
                    const label = formatWeekLabel(mondayDate);
                    const tag = getWeekTag(mondayDate, thisWeekMondayStr);
                    return (
                      <option key={mondayDate} value={mondayDate} className={isDark ? 'bg-zinc-800 text-white' : 'bg-white text-zinc-900'}>
                        {label}{tag}
                      </option>
                    );
                  })}
                </select>
              </div>
            );
          })()}
        </div>

        {/* Right Cluster: Active Hours, Privacy, Progress, Share & Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap">
          
          {/* Quick Settings Group: Active Hours & Privacy */}
          <div className="flex items-center gap-1.5">
            {onOpenActiveHours && (
              <button
                type="button"
                onClick={onOpenActiveHours}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md shadow-2xs transition-all cursor-pointer ${
                  isDark
                    ? 'bg-zinc-800/80 border-white/10 text-zinc-300 hover:text-white hover:border-[#BDCC8D]/50 hover:bg-zinc-700'
                    : 'bg-white/90 border-black/[0.06] text-zinc-700 hover:text-[#1a2e23] hover:border-[#2D5F3E]/40 hover:bg-zinc-50'
                }`}
                title="Timeline Active Hours"
              >
                <Clock className={`w-3.5 h-3.5 ${isDark ? 'text-[#BDCC8D]' : 'text-[#2D5F3E]'}`} />
                <span className="hidden sm:inline">
                  {activeHours ? formatHourRangeLabel(activeHours.startHour, activeHours.endHour) : 'Active Hours'}
                </span>
              </button>
            )}

            {onOpenPrivacySettings && (
              <button
                type="button"
                onClick={onOpenPrivacySettings}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md shadow-2xs transition-all cursor-pointer ${
                  isPrivate
                    ? isDark
                      ? 'bg-pink-950/40 border-pink-800/50 text-pink-300 hover:bg-pink-900/60'
                      : 'bg-pink-50 border-pink-200/80 text-pink-700 hover:bg-pink-100'
                    : isDark
                      ? 'bg-zinc-800/80 border-white/10 text-zinc-300 hover:text-white hover:bg-zinc-700'
                      : 'bg-white/90 border-black/[0.06] text-zinc-700 hover:text-[#1a2e23] hover:bg-zinc-50'
                }`}
                title={isPrivate ? 'Private Planner Settings' : 'Public Planner Settings'}
              >
                {isPrivate ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-pink-500" />
                    <span className="hidden sm:inline">Private</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5 text-sky-500" />
                    <span className="hidden sm:inline">Public</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Progress Ring */}
          <div className="flex items-center gap-2 px-1">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-9 sm:h-9 transform -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke={isDark ? '#27272a' : '#e4e4e7'}
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke={isDark ? '#BDCC8D' : '#2D5F3E'}
                  strokeWidth="3"
                  strokeDasharray={strokeDashArray}
                  strokeLinecap="round"
                  suppressHydrationWarning
                />
              </svg>
            </div>
            <div className="text-xs font-bold leading-tight">
              <span className={`block text-[9px] font-bold tracking-wider uppercase ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                DONE
              </span>
              <span className={isDark ? 'text-zinc-100' : 'text-[#1a2e23]'}>{roundedProgress}%</span>
            </div>
          </div>

          {/* Action Buttons: Share & New & Bell */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {calendarId && (
              <button
                type="button"
                onClick={handleShare}
                className={`inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold border shadow-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20'
                    : isDark
                    ? 'bg-[#38BDF8] text-zinc-950 border-[#38BDF8] hover:bg-[#7DD3FC]'
                    : 'bg-[#0284C7] text-white border-[#0284C7] hover:bg-[#0369A1]'
                }`}
              >
                <Share2 className="w-3.5 h-3.5 shrink-0" />
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNewCalendar}
              className={`inline-flex items-center justify-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-2xs transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                isDark
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-300/80 hover:bg-emerald-100'
              }`}
              title="Create New Planner"
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">New</span>
            </button>

            {isPrivate && onLockCalendar && (
              <button
                type="button"
                onClick={onLockCalendar}
                className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-2xs transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                  isDark
                    ? 'bg-amber-950/60 text-amber-300 border-amber-800/60 hover:bg-amber-900/60'
                    : 'bg-amber-50 text-amber-900 border-amber-300/80 hover:bg-amber-100'
                }`}
                title="Lock Calendar"
              >
                <Lock className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                <span className="hidden sm:inline">Lock</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenNotifications}
              aria-label="Open notifications drawer"
              className={`relative w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center rounded-full border transition-all active:scale-95 cursor-pointer ${
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
