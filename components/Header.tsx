'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
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
  Pencil,
  X,
  MoreHorizontal,
  ListTodo,
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
  calendarTitle?: string
  onUpdateCalendarTitle?: (title: string) => Promise<boolean>
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
  todoSidebarOpen?: boolean
  onToggleTodoSidebar?: () => void
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
  calendarTitle,
  onUpdateCalendarTitle,
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
  todoSidebarOpen = false,
  onToggleTodoSidebar,
}: HeaderProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [showMobileMore, setShowMobileMore] = useState(false)
  const [savedCalendars, setSavedCalendars] = useState<RecentCalendar[]>([])
  const switcherRef = useRef<HTMLDivElement>(null)

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitleValue, setEditTitleValue] = useState('')
  const [isSubmittingTitle, setIsSubmittingTitle] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      setSavedCalendars(getRecentCalendars())
    })
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

  const handleTitleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTitleValue.trim() || !onUpdateCalendarTitle) return
    setIsSubmittingTitle(true)
    const success = await onUpdateCalendarTitle(editTitleValue.trim())
    setIsSubmittingTitle(false)
    if (success !== false) {
      setIsEditingTitle(false)
    }
  }

  const currentMonday = new Date()
  const day = currentMonday.getDay()
  const diff = currentMonday.getDate() - day + (day === 0 ? -6 : 1)
  const thisWeekMondayStr = new Date(currentMonday.setDate(diff)).toISOString().split('T')[0]

  const currentCalendarInfo = savedCalendars.find((c) => c.id === calendarId)
  const calendarDisplayName =
    calendarTitle && calendarTitle.trim()
      ? calendarTitle.trim()
      : currentCalendarInfo?.title && currentCalendarInfo.title.trim()
      ? currentCalendarInfo.title.trim()
      : calendarId
      ? `Planner #${calendarId.slice(0, 6)}`
      : 'My Planner'

  const syncStatusText =
    syncStatus === 'synced' ? 'Live Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Offline'

  // Common week options computation
  const cleanSelected = selectedWeek ? normalizeToMonday(selectedWeek) : thisWeekMondayStr
  const uniqueMondays = new Set<string>()
  getAdjacentWeeks(thisWeekMondayStr, 2, 3).forEach((w) => uniqueMondays.add(w))
  uniqueMondays.add(cleanSelected)
  for (const s of sessions) {
    if (s.week_start_date) {
      uniqueMondays.add(normalizeToMonday(s.week_start_date))
    }
  }
  const sortedMondays = Array.from(uniqueMondays).sort((a, b) => b.localeCompare(a))

  // Render dropdown component
  const renderWeekSelector = () => {
    if (!selectedWeek || !onSelectWeek) return null
    return (
      <div
        className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-2xs backdrop-blur-md transition-all ${
          isDark
            ? 'bg-zinc-800/80 border-white/10 text-zinc-200'
            : 'bg-white/90 border-black/[0.06] text-[#1a2e23]'
        }`}
      >
        <Calendar className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-[#BDCC8D]' : 'text-[#2D5F3E]'}`} />
        <select
          value={cleanSelected}
          onChange={(e) => onSelectWeek(e.target.value)}
          className="bg-transparent font-semibold cursor-pointer focus:outline-none pr-4 appearance-none text-xs"
        >
          {sortedMondays.map((mondayDate) => {
            const label = formatWeekLabel(mondayDate)
            const tag = getWeekTag(mondayDate, thisWeekMondayStr)
            return (
              <option
                key={mondayDate}
                value={mondayDate}
                className={isDark ? 'bg-zinc-800 text-white' : 'bg-white text-zinc-900'}
              >
                {label}
                {tag}
              </option>
            )
          })}
        </select>
      </div>
    )
  }

  // Render Planner Switcher
  const renderPlannerSwitcher = () => (
    <div className="relative flex items-center gap-1.5" ref={switcherRef}>
      {isEditingTitle ? (
        <form
          onSubmit={handleTitleSubmit}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-md backdrop-blur-md transition-all z-20 ${
            isDark
              ? 'bg-zinc-900 border-emerald-500/50 text-zinc-100'
              : 'bg-white border-emerald-600/50 text-[#1a2e23]'
          }`}
        >
          <input
            type="text"
            value={editTitleValue}
            onChange={(e) => setEditTitleValue(e.target.value)}
            placeholder="Planner Name"
            autoFocus
            maxLength={255}
            className="px-2 py-0.5 text-xs font-bold rounded-md bg-transparent focus:outline-none w-[110px] sm:w-[150px]"
          />
          <button
            type="submit"
            disabled={isSubmittingTitle}
            className="text-xs px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold cursor-pointer hover:bg-emerald-700 disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsEditingTitle(false)}
            className="p-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      ) : (
        <>
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
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                syncStatus === 'synced'
                  ? 'bg-emerald-500'
                  : syncStatus === 'syncing'
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-rose-500'
              }`}
            />
            <span className="max-w-[100px] xs:max-w-[130px] sm:max-w-[170px] truncate">{calendarDisplayName}</span>
            <ChevronDown
              className={`w-3 h-3 opacity-60 transition-transform ${switcherOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {onUpdateCalendarTitle && (
            <button
              type="button"
              onClick={() => {
                setEditTitleValue(calendarDisplayName)
                setIsEditingTitle(true)
              }}
              className={`hidden sm:inline-flex p-1.5 rounded-full border shadow-2xs backdrop-blur-md transition-all cursor-pointer ${
                isDark
                  ? 'bg-zinc-800/80 border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20 hover:bg-zinc-700'
                  : 'bg-white/80 border-black/10 text-zinc-500 hover:text-zinc-800 hover:border-black/20 hover:bg-zinc-50'
              }`}
              title="Rename planner"
              aria-label="Rename planner"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
        </>
      )}

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
            <div className="flex items-center gap-2">
              {onUpdateCalendarTitle && (
                <button
                  type="button"
                  onClick={() => {
                    setSwitcherOpen(false)
                    setEditTitleValue(calendarDisplayName)
                    setIsEditingTitle(true)
                  }}
                  className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-[#BDCC8D] flex items-center gap-1 cursor-pointer"
                  title="Rename current planner"
                >
                  <Pencil className="w-3 h-3" /> Rename
                </button>
              )}
              <Link
                href="/?home=true"
                onClick={() => setSwitcherOpen(false)}
                className="text-[11px] font-semibold text-emerald-600 dark:text-[#BDCC8D] hover:underline flex items-center gap-1"
              >
                <Home className="w-3 h-3" /> Hub
              </Link>
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1 py-1">
            {savedCalendars.map((c) => {
              const isCurrent = c.id === calendarId
              const name =
                isCurrent && calendarTitle && calendarTitle.trim()
                  ? calendarTitle.trim()
                  : c.title && c.title.trim()
                  ? c.title.trim()
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
                    {c.isPrivate && <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
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
  )

  return (
    <div className="flex flex-col gap-2.5">
      {/* MOBILE COMPACT 2-ROW HEADER (< md) */}
      <div className="flex flex-col gap-2.5 md:hidden">
        {/* Mobile Row 1: Month Title, Switcher, Bell */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <h1
              className={`text-lg sm:text-xl font-black font-sans tracking-tight shrink-0 ${
                isDark ? 'text-zinc-100' : 'text-[#1a2e23]'
              }`}
            >
              {monthYear}
            </h1>
            {renderPlannerSwitcher()}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Mobile Notification Bell */}
            <button
              type="button"
              onClick={onOpenNotifications}
              aria-label="Open notifications"
              className={`relative w-8 h-8 flex items-center justify-center rounded-full border transition-colors ${
                isDark
                  ? 'bg-zinc-800 border-white/10 text-zinc-300'
                  : 'bg-white border-black/10 text-zinc-700'
              }`}
            >
              <Bell className="w-4 h-4 text-emerald-700 dark:text-zinc-300" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full animate-pulse">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Row 2: Week Selector, Share, More (...) Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            {renderWeekSelector()}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {calendarId && (
              <button
                type="button"
                onClick={handleShare}
                className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border shadow-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : isDark
                    ? 'bg-[#38BDF8] text-zinc-950 border-[#38BDF8]'
                    : 'bg-[#0284C7] text-white border-[#0284C7]'
                }`}
              >
                <Share2 className="w-3.5 h-3.5 shrink-0" />
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </button>
            )}

            {/* Mobile More Actions Trigger */}
            <button
              type="button"
              onClick={() => setShowMobileMore(true)}
              aria-label="More planner options"
              className={`inline-flex items-center justify-center p-2 rounded-full border shadow-2xs backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
                isDark
                  ? 'bg-zinc-800/80 border-white/10 text-zinc-300 hover:bg-zinc-700'
                  : 'bg-white/90 border-black/10 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* TABLET & DESKTOP HEADER (>= md) */}
      <div className="hidden md:flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        {/* Row 1 for Tablet (768px-1199px) / Left side on Wide Desktop (>= 1200px) */}
        <div className="flex items-center justify-between xl:justify-start gap-3 flex-wrap xl:flex-nowrap">
          <div className="flex items-center gap-3">
            <h1
              className={`text-2xl lg:text-3xl font-black font-sans tracking-tight whitespace-nowrap ${
                isDark ? 'text-zinc-100' : 'text-[#1a2e23]'
              }`}
            >
              {monthYear}
            </h1>
            {renderPlannerSwitcher()}
          </div>

          {/* On wide screens, Week Selector sits right next to planner switcher */}
          <div className="hidden xl:block">
            {renderWeekSelector()}
          </div>

          {/* On tablet/1024px (hidden on xl), Right Action buttons sit on Row 1 */}
          <div className="flex xl:hidden items-center gap-2">
            {/* Progress Ring */}
            <div className="flex items-center gap-1.5 px-1 shrink-0">
              <div className="relative w-7 h-7 flex items-center justify-center">
                <svg className="w-7 h-7 transform -rotate-90">
                  <circle
                    cx="14"
                    cy="14"
                    r="11"
                    fill="none"
                    stroke={isDark ? '#27272a' : '#e4e4e7'}
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="14"
                    cy="14"
                    r="11"
                    fill="none"
                    stroke={isDark ? '#BDCC8D' : '#2D5F3E'}
                    strokeWidth="2.5"
                    strokeDasharray={`${(progressPercentage / 100) * 69.1} 69.1`}
                    strokeLinecap="round"
                    suppressHydrationWarning
                  />
                </svg>
              </div>
              <span className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-[#1a2e23]'}`}>
                {roundedProgress}%
              </span>
            </div>

            {/* Share */}
            {calendarId && (
              <button
                type="button"
                onClick={handleShare}
                className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border shadow-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : isDark
                    ? 'bg-[#38BDF8] text-zinc-950 border-[#38BDF8] hover:bg-[#7DD3FC]'
                    : 'bg-[#0284C7] text-white border-[#0284C7] hover:bg-[#0369A1]'
                }`}
              >
                <Share2 className="w-3.5 h-3.5 shrink-0" />
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </button>
            )}

            {/* New */}
            <button
              type="button"
              onClick={handleNewCalendar}
              className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border shadow-2xs transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                isDark
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-300/80 hover:bg-emerald-100'
              }`}
              title="Create New Planner"
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>New</span>
            </button>

            {/* Bell */}
            <button
              type="button"
              onClick={onOpenNotifications}
              aria-label="Open notifications drawer"
              className={`relative w-8 h-8 flex items-center justify-center rounded-full border transition-all active:scale-95 cursor-pointer ${
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

        {/* Row 2 for Tablet (768px-1199px) / Right Cluster on Wide Desktop (>= 1200px) */}
        <div className="flex items-center justify-between xl:justify-end gap-2.5 flex-nowrap">
          {/* On tablet, Week Selector sits on the left of Row 2 */}
          <div className="block xl:hidden">
            {renderWeekSelector()}
          </div>

          {/* Quick Settings Group: Active Hours & Privacy */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenActiveHours && (
              <button
                type="button"
                onClick={onOpenActiveHours}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isDark
                    ? 'bg-zinc-800/80 border-white/10 text-zinc-300 hover:text-white hover:border-[#BDCC8D]/50 hover:bg-zinc-700'
                    : 'bg-white/90 border-black/[0.06] text-zinc-700 hover:text-[#1a2e23] hover:border-[#2D5F3E]/40 hover:bg-zinc-50'
                }`}
                title="Timeline Active Hours"
              >
                <Clock className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-[#BDCC8D]' : 'text-[#2D5F3E]'}`} />
                <span className="whitespace-nowrap">
                  {activeHours ? formatHourRangeLabel(activeHours.startHour, activeHours.endHour) : 'Active Hours'}
                </span>
              </button>
            )}

            {onOpenPrivacySettings && (
              <button
                type="button"
                onClick={onOpenPrivacySettings}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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
                    <Lock className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                    <span className="whitespace-nowrap">Private</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span className="whitespace-nowrap">Public</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* On wide screens (xl:), Progress, Share, New, Bell appear on the right */}
          <div className="hidden xl:flex items-center gap-2.5 shrink-0">
            {/* Desktop Progress Ring */}
            <div className="flex items-center gap-2 px-1 shrink-0">
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

            {calendarId && (
              <button
                type="button"
                onClick={handleShare}
                className={`inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border shadow-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white border-emerald-600'
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
              className={`inline-flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-2xs transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                isDark
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-300/80 hover:bg-emerald-100'
              }`}
              title="Create New Planner"
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>New</span>
            </button>

            {isPrivate && onLockCalendar && (
              <button
                type="button"
                onClick={onLockCalendar}
                className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-2xs transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                  isDark
                    ? 'bg-amber-950/60 text-amber-300 border-amber-800/60 hover:bg-amber-900/60'
                    : 'bg-amber-50 text-amber-900 border-amber-300/80 hover:bg-amber-100'
                }`}
                title="Lock Calendar"
              >
                <Lock className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                <span>Lock</span>
              </button>
            )}

            {/* Todo List Toggle */}
            {onToggleTodoSidebar && (
              <button
                type="button"
                onClick={onToggleTodoSidebar}
                title={`${todoSidebarOpen ? 'Hide' : 'Show'} todo list (T)`}
                className={`w-8.5 h-8.5 flex items-center justify-center rounded-full border transition-all active:scale-95 cursor-pointer ${
                  todoSidebarOpen
                    ? isDark
                      ? 'bg-amber-500/80 border-amber-400 text-zinc-950'
                      : 'bg-amber-400 border-amber-500 text-zinc-950'
                    : isDark
                    ? 'bg-zinc-800/80 border-white/10 text-amber-400 hover:bg-zinc-700'
                    : 'bg-amber-50/80 border-amber-200/80 text-amber-700 hover:bg-amber-100'
                }`}
                aria-label={`${todoSidebarOpen ? 'Hide' : 'Show'} todo list`}
              >
                <ListTodo className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onOpenNotifications}
              aria-label="Open notifications drawer"
              className={`relative w-8.5 h-8.5 flex items-center justify-center rounded-full border transition-all active:scale-95 cursor-pointer ${
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
        <div
          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-3 rounded-2xl border text-xs font-medium ${
            isDark
              ? 'bg-amber-950/40 border-amber-800/50 text-amber-300'
              : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }`}
        >
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

      {/* MOBILE MORE ACTIONS BOTTOM SHEET DRAWER */}
      {showMobileMore && isMounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center md:hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setShowMobileMore(false)}
          />

          {/* Drawer Content */}
          <div
            className={`relative w-full max-w-lg rounded-t-3xl border-t shadow-2xl p-5 pb-8 z-10 max-h-[85vh] overflow-y-auto transition-transform duration-300 animate-in slide-in-from-bottom ${
              isDark ? 'bg-zinc-900 border-white/15 text-zinc-100' : 'bg-white border-black/10 text-zinc-900'
            }`}
          >
            {/* Drawer Handle */}
            <div
              className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4 cursor-pointer"
              onClick={() => setShowMobileMore(false)}
            />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10 mb-3">
              <div>
                <h3 className="font-bold text-sm">{calendarDisplayName}</h3>
                <p className="text-[11px] opacity-60">Planner Controls &amp; Settings</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileMore(false)}
                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Weekly Progress Card in Drawer */}
            <div
              className={`p-3.5 rounded-2xl flex items-center justify-between border mb-3 ${
                isDark ? 'bg-zinc-800/60 border-white/10' : 'bg-emerald-50/60 border-emerald-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 flex items-center justify-center">
                  <svg className="w-9 h-9 transform -rotate-90">
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
                <div>
                  <div className="text-xs font-bold">Week Progress</div>
                  <div className="text-[11px] opacity-70">{roundedProgress}% Tasks Completed</div>
                </div>
              </div>
              <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                isDark ? 'bg-[#BDCC8D] text-zinc-950' : 'bg-[#2D5F3E] text-white'
              }`}>
                {roundedProgress}%
              </span>
            </div>

            {/* Action Items List */}
            <div className="space-y-2">
              {/* Todo List Option */}
              {onToggleTodoSidebar && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMore(false)
                    onToggleTodoSidebar()
                  }}
                  className={`w-full text-left p-3 rounded-2xl flex items-center justify-between transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-zinc-800/80 bg-zinc-800/40' : 'hover:bg-zinc-100 bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      todoSidebarOpen
                        ? isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-400/20 text-amber-700'
                        : isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'
                    }`}>
                      <ListTodo className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">My Journal</div>
                      <div className="text-[11px] opacity-60">
                        {todoSidebarOpen ? 'Currently open · tap to close' : 'Open todo &amp; notes list'}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                    {todoSidebarOpen ? 'Close' : 'Open'}
                  </span>
                </button>
              )}

              {/* Active Hours Option */}
              {onOpenActiveHours && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMore(false)
                    onOpenActiveHours()
                  }}
                  className={`w-full text-left p-3 rounded-2xl flex items-center justify-between transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-zinc-800/80 bg-zinc-800/40' : 'hover:bg-zinc-100 bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-[#BDCC8D]">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Timeline Active Hours</div>
                      <div className="text-[11px] opacity-60">
                        {activeHours
                          ? formatHourRangeLabel(activeHours.startHour, activeHours.endHour)
                          : 'Standard (6 AM – 11 PM)'}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-[#BDCC8D]">Edit</span>
                </button>
              )}

              {/* Privacy Settings Option */}
              {onOpenPrivacySettings && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMore(false)
                    onOpenPrivacySettings()
                  }}
                  className={`w-full text-left p-3 rounded-2xl flex items-center justify-between transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-zinc-800/80 bg-zinc-800/40' : 'hover:bg-zinc-100 bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isPrivate ? 'bg-pink-500/10 text-pink-500' : 'bg-sky-500/10 text-sky-500'
                    }`}>
                      {isPrivate ? <Lock className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold">Privacy &amp; Security</div>
                      <div className="text-[11px] opacity-60">
                        {isPrivate ? 'Private (Passcode Protected)' : 'Public Link'}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-[#BDCC8D]">Configure</span>
                </button>
              )}

              {/* Rename Planner Option */}
              {onUpdateCalendarTitle && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMore(false)
                    setEditTitleValue(calendarDisplayName)
                    setIsEditingTitle(true)
                  }}
                  className={`w-full text-left p-3 rounded-2xl flex items-center justify-between transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-zinc-800/80 bg-zinc-800/40' : 'hover:bg-zinc-100 bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500">
                      <Pencil className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Rename Planner</div>
                      <div className="text-[11px] opacity-60">Change the title of this calendar</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-[#BDCC8D]">Rename</span>
                </button>
              )}

              {/* Create New Planner Option */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileMore(false)
                  handleNewCalendar()
                }}
                className={`w-full text-left p-3 rounded-2xl flex items-center justify-between transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-zinc-800/80 bg-zinc-800/40' : 'hover:bg-zinc-100 bg-zinc-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-[#BDCC8D]">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Create New Planner</div>
                    <div className="text-[11px] opacity-60">Generate a new unique schedule</div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-[#BDCC8D]">Create</span>
              </button>

              {/* Lock Calendar Option (if private) */}
              {isPrivate && onLockCalendar && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMore(false)
                    onLockCalendar()
                  }}
                  className={`w-full text-left p-3 rounded-2xl flex items-center justify-between transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-zinc-800/80 bg-zinc-800/40' : 'hover:bg-zinc-100 bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Lock Calendar Now</div>
                      <div className="text-[11px] opacity-60">Require passcode to re-enter</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-amber-500">Lock</span>
                </button>
              )}
            </div>

            {/* Bottom Close Button */}
            <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowMobileMore(false)}
                className={`w-full py-3 rounded-2xl font-bold text-xs border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-zinc-800 border-white/10 text-zinc-300 hover:bg-zinc-700'
                    : 'bg-zinc-100 border-black/5 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
