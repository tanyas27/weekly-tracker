'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import JsonLd from '@/components/JsonLd'
import { parseCalendarId } from '@/lib/calendar-id-parser'
import {
  ArrowRight,
  Clock,
  Share2,
  WifiOff,
  ShieldCheck,
  Sun,
  Moon,
  Calendar,
  Trash2,
  Lock,
  ArrowUpRight,
  CheckCircle2,
  PlusCircle,
  Copy,
  Sparkles,
  Layers,
  Search,
} from 'lucide-react'
import { LogoBadge } from '@/components/LogoBadge'
import {
  getRecentCalendars,
  removeRecentCalendar,
  clearRecentCalendars,
  formatRelativeTime,
  getLastActiveCalendarId,
  RecentCalendar,
} from '@/lib/recent-calendars'

export default function LandingPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDark, setIsDark] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [recentCalendars, setRecentCalendars] = useState<RecentCalendar[]>([])
  const [customCalendarId, setCustomCalendarId] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    queueMicrotask(() => {
      setIsMounted(true)
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        setIsDark(savedTheme === 'dark')
      } else {
        setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
      }

      const searchParams = new URLSearchParams(window.location.search)
      const isExplicitHome = searchParams.get('home') === 'true' || searchParams.get('hub') === 'true'

      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true

      const hasResumedThisSession = sessionStorage.getItem('pwa_auto_resumed') === 'true'

      const lastId = getLastActiveCalendarId()
      if (isStandalone && lastId && !isExplicitHome && !hasResumedThisSession) {
        sessionStorage.setItem('pwa_auto_resumed', 'true')
        router.replace(`/c/${lastId}`)
        return
      }

      sessionStorage.setItem('pwa_auto_resumed', 'true')
      setRecentCalendars(getRecentCalendars())
    })
  }, [router])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }

      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        inputRef.current?.focus()
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev
      localStorage.setItem('theme', next ? 'dark' : 'light')
      return next
    })
  }

  const handleClearRecent = () => {
    if (confirm('Clear all saved planners from this browser?')) {
      clearRecentCalendars()
      setRecentCalendars([])
    }
  }

  const handleRemoveSingle = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    removeRecentCalendar(id)
    setRecentCalendars(getRecentCalendars())
  }

  const handleCopyLink = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      await navigator.clipboard.writeText(`${origin}/c/${id}`)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {}
  }

  const handleOpenCustomCalendar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customCalendarId.trim()) return
    const cleanId = parseCalendarId(customCalendarId)
    router.push(`/c/${cleanId}`)
  }

  const activeCalendar = recentCalendars[0] || null
  const filteredCalendars = searchQuery.trim()
    ? recentCalendars.filter((c) => {
        const title = c.title || `Planner #${c.id.slice(0, 6)}`
        return title.toLowerCase().includes(searchQuery.toLowerCase()) || c.id.toLowerCase().includes(searchQuery.toLowerCase())
      })
    : recentCalendars

  return (
    <>
      <JsonLd />
      <div className={`min-h-screen font-sans overflow-x-hidden transition-colors duration-200 ${
        isDark ? 'bg-[#18181b] text-[#f4f4f5] selection:bg-[#BDCC8D]/30' : 'bg-[#FAF9F6] text-[#1a2e23] selection:bg-[#2D5F3E]/20'
      }`}>
        {/* Nav */}
        <nav className={`fixed top-0 inset-x-0 z-50 backdrop-blur-lg border-b transition-colors ${
          isDark ? 'bg-[#18181b]/80 border-white/10' : 'bg-[#FAF9F6]/80 border-black/[0.04]'
        }`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2">
              <LogoBadge size={28} />
              <span className={`text-lg font-handwritten font-bold ${isDark ? 'text-[#BDCC8D]' : 'text-[#2D5F3E]'}`}>
                DailyForest
              </span>
            </Link>
            <div className="flex items-center gap-3 sm:gap-4">
              {isMounted && (
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className={`p-1.5 rounded-full border transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-zinc-800 border-white/10 text-yellow-400 hover:bg-zinc-700'
                      : 'bg-white border-black/10 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              )}
              {activeCalendar ? (
                <Link
                  href={`/c/${activeCalendar.id}`}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                    isDark
                      ? 'bg-[#BDCC8D]/20 border-[#BDCC8D]/40 text-[#BDCC8D] hover:bg-[#BDCC8D]/30'
                      : 'bg-emerald-50 border-emerald-200 text-[#2D5F3E] hover:bg-emerald-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Resume Planner</span>
                </Link>
              ) : (
                <Link
                  href="/c/new"
                  className={`text-sm font-semibold transition-colors ${
                    isDark ? 'text-[#BDCC8D] hover:text-[#d3e1c5]' : 'text-[#2D5F3E] hover:text-[#234b31]'
                  }`}
                >
                  Open Planner →
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* Hero */}
        <main>
          <section className="relative pt-28 pb-10 sm:pt-36 sm:pb-16 px-5" aria-label="Hero">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className={`text-[2.75rem] sm:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight ${
                isDark ? 'text-zinc-100' : 'text-[#1a2e23]'
              }`}>
                A planner that feels
                <br />
                <span className={`font-handwritten font-normal text-[3.25rem] sm:text-[4.25rem] lg:text-[5rem] ${
                  isDark ? 'text-[#BDCC8D]' : 'text-[#2D5F3E]'
                }`}>
                  like a warm notebook
                </span>
              </h1>
              <p className={`mt-4 text-base sm:text-xl max-w-lg mx-auto leading-relaxed ${
                isDark ? 'text-zinc-400' : 'text-[#1a2e23]/60'
              }`}>
                Free daily &amp; weekly planner with live sync, time-blocking, and background push notifications.
              </p>

              {/* Spotlight Active Calendar Card (Above Fold) */}
              {isMounted && activeCalendar && (
                <div className="mt-8 max-w-xl mx-auto">
                  <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-xl backdrop-blur-xl transition-all text-left ${
                    isDark
                      ? 'bg-gradient-to-b from-zinc-900/95 to-zinc-900/80 border-[#BDCC8D]/30 shadow-black/50 ring-1 ring-[#BDCC8D]/20'
                      : 'bg-gradient-to-b from-white/95 to-emerald-50/60 border-[#2D5F3E]/20 shadow-[0_12px_40px_rgba(45,95,62,0.12)] ring-1 ring-[#2D5F3E]/10'
                  }`}>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                          isDark
                            ? 'bg-[#BDCC8D]/15 text-[#BDCC8D] border-[#BDCC8D]/30'
                            : 'bg-[#2D5F3E]/10 text-[#2D5F3E] border-[#2D5F3E]/20'
                        }`}>
                          <Sparkles className="w-3 h-3" /> Active Planner
                        </span>
                        {activeCalendar.isPrivate && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500">
                            <Lock className="w-3 h-3" /> Private
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] opacity-60 font-mono">
                        Active {formatRelativeTime(activeCalendar.lastVisited)}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className={`text-lg sm:text-xl font-black tracking-tight ${
                          isDark ? 'text-zinc-100' : 'text-[#1a2e23]'
                        }`}>
                          {activeCalendar.title && activeCalendar.title.trim()
                            ? activeCalendar.title.trim()
                            : `Planner #${activeCalendar.id.slice(0, 6)}`}
                        </h2>
                        <div className="flex items-center gap-2 mt-1 text-xs opacity-70">
                          {activeCalendar.taskCount !== undefined && (
                            <span>{activeCalendar.taskCount} task{activeCalendar.taskCount === 1 ? '' : 's'} scheduled</span>
                          )}
                          <span className="font-mono text-[11px]">ID: {activeCalendar.id.slice(0, 8)}...</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleCopyLink(activeCalendar.id, e)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isDark
                              ? 'bg-zinc-800 border-white/10 text-zinc-300 hover:bg-zinc-700'
                              : 'bg-white border-black/10 text-zinc-700 hover:bg-zinc-50 shadow-xs'
                          }`}
                          title="Copy Planner Link"
                        >
                          {copiedId === activeCalendar.id ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        <Link
                          href={`/c/${activeCalendar.id}`}
                          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer ${
                            isDark
                              ? 'bg-[#BDCC8D] text-zinc-950 hover:bg-[#c9d79c] shadow-[#BDCC8D]/20'
                              : 'bg-[#2D5F3E] text-white hover:bg-[#245033] shadow-[#2D5F3E]/20'
                          }`}
                        >
                          Resume Planner
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/c/new"
                  className={`group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-semibold text-base shadow-lg transition-all duration-200 active:scale-[0.98] whitespace-nowrap ${
                    isDark
                      ? 'bg-[#BDCC8D] text-zinc-950 shadow-[#BDCC8D]/20 hover:bg-[#c9d79c]'
                      : 'bg-[#2D5F3E] text-white shadow-[#2D5F3E]/20 hover:bg-[#245033]'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  Create new planner
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <form
                  onSubmit={handleOpenCustomCalendar}
                  className={`relative flex items-center w-full sm:w-auto p-1 rounded-full border shadow-md transition-all focus-within:ring-2 ${
                    isDark
                      ? 'bg-zinc-900/90 border-white/15 focus-within:ring-[#BDCC8D]/50'
                      : 'bg-white/90 border-black/10 focus-within:ring-[#2D5F3E]/50'
                  }`}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={customCalendarId}
                    onChange={(e) => setCustomCalendarId(e.target.value)}
                    placeholder="Enter ID or paste URL..."
                    aria-label="Enter Calendar ID or URL"
                    className={`w-full sm:w-56 px-4 py-2 text-sm bg-transparent outline-none ${
                      isDark ? 'text-zinc-100 placeholder:text-zinc-500' : 'text-[#1a2e23] placeholder:text-zinc-400'
                    }`}
                  />
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-full font-bold text-xs shadow-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                      isDark
                        ? 'bg-zinc-800 text-[#BDCC8D] hover:bg-zinc-700 border border-white/10'
                        : 'bg-emerald-50 text-[#2D5F3E] hover:bg-emerald-100 border border-emerald-200/60'
                    }`}
                  >
                    Open →
                  </button>
                </form>
              </div>
            </div>
          </section>

          {/* Prominent Calendar Hub Grid */}
          {isMounted && recentCalendars.length > 0 && (
            <section className="px-4 sm:px-6 pb-12 sm:pb-16 -mt-2 sm:-mt-4" aria-label="Calendar Hub">
              <div className="max-w-6xl mx-auto">
                <div className={`p-5 sm:p-6 rounded-3xl border shadow-lg backdrop-blur-xl transition-colors ${
                  isDark ? 'bg-zinc-900/90 border-white/10 shadow-black/40' : 'bg-white/90 border-[#2D5F3E]/10 shadow-[0_8px_30px_rgba(45,95,62,0.06)]'
                }`}>
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b ${
                    isDark ? 'border-white/10' : 'border-black/[0.05]'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl border ${
                        isDark ? 'bg-[#BDCC8D]/15 border-[#BDCC8D]/30 text-[#BDCC8D]' : 'bg-[#2D5F3E]/10 border-[#2D5F3E]/20 text-[#2D5F3E]'
                      }`}>
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className={`text-base sm:text-lg font-bold tracking-tight ${isDark ? 'text-zinc-100' : 'text-[#1a2e23]'}`}>
                          My Planners ({recentCalendars.length})
                        </h2>
                        <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          All active and recently accessed planners on this device
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {recentCalendars.length > 3 && (
                        <div className={`relative flex items-center px-2.5 py-1 rounded-xl border text-xs ${
                          isDark ? 'bg-zinc-800/80 border-white/10 text-zinc-200' : 'bg-[#FAF9F6] border-black/10 text-zinc-700'
                        }`}>
                          <Search className="w-3 h-3 opacity-50 mr-1.5" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter planners..."
                            className="bg-transparent outline-none w-28 sm:w-36 text-xs"
                          />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleClearRecent}
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-xl border transition-colors cursor-pointer ${
                          isDark
                            ? 'text-zinc-400 border-white/10 hover:bg-zinc-800 hover:text-zinc-200'
                            : 'text-zinc-500 border-black/10 hover:bg-zinc-50 hover:text-zinc-800'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {filteredCalendars.map((item, idx) => {
                      const displayName = item.title && item.title.trim()
                        ? item.title.trim()
                        : `Planner #${item.id.slice(0, 6)}`
                      const isFirst = idx === 0
                      return (
                        <div
                          key={item.id}
                          className={`group relative p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 ${
                            isDark
                              ? 'bg-zinc-800/60 hover:bg-zinc-800/90 border-white/10 hover:border-[#BDCC8D]/40 shadow-xs'
                              : 'bg-[#FAF9F6] hover:bg-white border-black/[0.06] hover:border-[#2D5F3E]/30 shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 truncate">
                              {item.isPrivate && <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                              <h3 className={`font-bold text-sm truncate ${isDark ? 'text-zinc-100' : 'text-[#1a2e23]'}`}>
                                {displayName}
                              </h3>
                            </div>
                            {isFirst && (
                              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border shrink-0 ${
                                isDark ? 'bg-[#BDCC8D]/20 text-[#BDCC8D] border-[#BDCC8D]/30' : 'bg-[#2D5F3E]/10 text-[#2D5F3E] border-[#2D5F3E]/20'
                              }`}>
                                Last Active
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] opacity-60 mb-3 font-mono">
                            <span>{item.taskCount !== undefined ? `${item.taskCount} tasks` : 'Active'}</span>
                            <span>{formatRelativeTime(item.lastVisited)}</span>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-black/[0.04] dark:border-white/5">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => handleCopyLink(item.id, e)}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  isDark ? 'border-white/10 hover:bg-zinc-700 text-zinc-300' : 'border-black/10 hover:bg-zinc-100 text-zinc-600'
                                }`}
                                title="Copy link"
                              >
                                {copiedId === item.id ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleRemoveSingle(item.id, e)}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  isDark ? 'border-white/10 hover:bg-rose-950/60 hover:text-rose-300 text-zinc-400' : 'border-black/10 hover:bg-rose-50 hover:text-rose-700 text-zinc-500'
                                }`}
                                title="Remove from list"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <Link
                              href={`/c/${item.id}`}
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                                isDark
                                  ? 'bg-[#BDCC8D]/15 border-[#BDCC8D]/30 text-[#BDCC8D] hover:bg-[#BDCC8D]/30'
                                  : 'bg-emerald-50 border-emerald-200 text-[#2D5F3E] hover:bg-emerald-100'
                              }`}
                            >
                              <span>Open</span>
                              <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Mini Planner Preview Widget */}
          <section className="px-4 sm:px-6 pb-20 sm:pb-28" aria-label="Planner Preview">
            <div className="max-w-6xl mx-auto">
              <div className={`relative rounded-2xl sm:rounded-3xl border p-5 sm:p-7 shadow-xl backdrop-blur-md transition-colors ${
                isDark
                  ? 'bg-zinc-900/90 border-white/10 shadow-black/40'
                  : 'bg-white/90 border-[#2D5F3E]/10 shadow-[0_20px_50px_rgba(45,95,62,0.08)]'
              }`}>
                {/* Header bar */}
                <div className={`flex items-center justify-between pb-5 mb-5 border-b ${
                  isDark ? 'border-white/10' : 'border-black/[0.05]'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className={`font-sans text-2xl sm:text-3xl font-black tracking-tight ${
                      isDark ? 'text-zinc-100' : 'text-[#1a2e23]'
                    }`}>August 2026</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      isDark
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Sync
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs font-medium ${
                    isDark ? 'text-zinc-400' : 'text-[#1a2e23]/60'
                  }`}>
                    <span className={`hidden sm:inline-block px-2.5 py-1 rounded-lg border ${
                      isDark ? 'bg-zinc-800/60 border-white/10' : 'bg-[#FAF9F6] border-black/[0.04]'
                    }`}>GMT+5.5</span>
                    <span className={`px-2.5 py-1 rounded-lg font-semibold ${
                      isDark ? 'bg-[#BDCC8D]/20 text-[#BDCC8D]' : 'bg-[#2D5F3E]/10 text-[#2D5F3E]'
                    }`}>Weekly Schedule</span>
                  </div>
                </div>

                {/* Days & Tasks Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {/* Mon */}
                  <div className="flex flex-col gap-2">
                    <div className={`text-center py-2 px-1 rounded-xl border ${
                      isDark ? 'bg-zinc-800/60 border-white/5' : 'bg-[#FAF9F6] border-black/[0.03]'
                    }`}>
                      <div className={`text-[10px] font-bold tracking-wider ${isDark ? 'text-zinc-400' : 'text-[#1a2e23]/40'}`}>MON</div>
                      <div className={`text-base font-extrabold ${isDark ? 'text-zinc-100' : 'text-[#1a2e23]'}`}>10</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FFF9C4] border border-yellow-200/80 shadow-sm transition-transform hover:-translate-y-0.5 cursor-pointer">
                      <div className="text-[10px] font-semibold text-yellow-900/60 mb-0.5">09:00 AM</div>
                      <div className="text-xs font-bold text-yellow-950">Deep Work &amp; Strategy</div>
                    </div>
                  </div>

                  {/* Tue */}
                  <div className="flex flex-col gap-2">
                    <div className={`text-center py-2 px-1 rounded-xl border ${
                      isDark ? 'bg-zinc-800/60 border-white/5' : 'bg-[#FAF9F6] border-black/[0.03]'
                    }`}>
                      <div className={`text-[10px] font-bold tracking-wider ${isDark ? 'text-zinc-400' : 'text-[#1a2e23]/40'}`}>TUE</div>
                      <div className={`text-base font-extrabold ${isDark ? 'text-[#BDCC8D]' : 'text-[#2D5F3E]'}`}>11</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#E1BEE7] border border-purple-200/80 shadow-sm transition-transform hover:-translate-y-0.5 cursor-pointer">
                      <div className="text-[10px] font-semibold text-purple-900/60 mb-0.5">10:30 AM</div>
                      <div className="text-xs font-bold text-purple-950">Design Sync</div>
                    </div>
                  </div>

                  {/* Wed */}
                  <div className="flex flex-col gap-2">
                    <div className={`text-center py-2 px-1 rounded-xl border ${
                      isDark ? 'bg-zinc-800/60 border-white/5' : 'bg-[#FAF9F6] border-black/[0.03]'
                    }`}>
                      <div className={`text-[10px] font-bold tracking-wider ${isDark ? 'text-zinc-400' : 'text-[#1a2e23]/40'}`}>WED</div>
                      <div className={`text-base font-extrabold ${isDark ? 'text-zinc-100' : 'text-[#1a2e23]'}`}>12</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#A5D6A7] border border-green-200/80 shadow-sm transition-transform hover:-translate-y-0.5 cursor-pointer">
                      <div className="text-[10px] font-semibold text-green-900/60 mb-0.5">01:00 PM</div>
                      <div className="text-xs font-bold text-green-950">Team Brainstorm</div>
                    </div>
                  </div>

                  {/* Thu */}
                  <div className="flex flex-col gap-2">
                    <div className={`text-center py-2 px-1 rounded-xl border ${
                      isDark ? 'bg-zinc-800/60 border-white/5' : 'bg-[#FAF9F6] border-black/[0.03]'
                    }`}>
                      <div className={`text-[10px] font-bold tracking-wider ${isDark ? 'text-zinc-400' : 'text-[#1a2e23]/40'}`}>THU</div>
                      <div className={`text-base font-extrabold ${isDark ? 'text-zinc-100' : 'text-[#1a2e23]'}`}>13</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FFCC80] border border-orange-200/80 shadow-sm transition-transform hover:-translate-y-0.5 cursor-pointer">
                      <div className="text-[10px] font-semibold text-orange-900/60 mb-0.5">03:00 PM</div>
                      <div className="text-xs font-bold text-orange-950">Focus Time</div>
                    </div>
                  </div>

                  {/* Fri */}
                  <div className="flex flex-col gap-2 col-span-2 sm:col-span-1">
                    <div className={`text-center py-2 px-1 rounded-xl border ${
                      isDark ? 'bg-zinc-800/60 border-white/5' : 'bg-[#FAF9F6] border-black/[0.03]'
                    }`}>
                      <div className={`text-[10px] font-bold tracking-wider ${isDark ? 'text-zinc-400' : 'text-[#1a2e23]/40'}`}>FRI</div>
                      <div className={`text-base font-extrabold ${isDark ? 'text-zinc-100' : 'text-[#1a2e23]'}`}>14</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#90CAF9] border border-blue-200/80 shadow-sm transition-transform hover:-translate-y-0.5 cursor-pointer">
                      <div className="text-[10px] font-semibold text-blue-900/60 mb-0.5">11:00 AM</div>
                      <div className="text-xs font-bold text-blue-950">Retrospective</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className={`border-y py-16 sm:py-20 px-4 sm:px-6 transition-colors ${
            isDark ? 'bg-zinc-900/50 border-white/10' : 'bg-white border-black/[0.04]'
          }`} aria-label="Features">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6">
                <Feature
                  isDark={isDark}
                  icon={<Clock className="w-5 h-5" />}
                  title="Time Blocking"
                  desc="Visual timeline grid allowing drag-and-drop task placement and daily overview."
                />
                <Feature
                  isDark={isDark}
                  icon={<Share2 className="w-5 h-5" />}
                  title="Shareable"
                  desc="Every planner gets a unique link. Share it with real-time SSE updates."
                />
                <Feature
                  isDark={isDark}
                  icon={<WifiOff className="w-5 h-5" />}
                  title="Works Offline"
                  desc="Install as a PWA and edit your schedule anywhere without internet."
                />
                <Feature
                  isDark={isDark}
                  icon={<ShieldCheck className="w-5 h-5" />}
                  title="Private"
                  desc="Zero trackers, zero ads. Optional passcode hashing for extra privacy."
                />
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-20 sm:py-28 px-4 sm:px-6 text-center" aria-label="Call to Action">
            <div className="max-w-xl mx-auto">
              <Image
                src="/totoro.png"
                alt="Totoro companion"
                width={80}
                height={80}
                className="mx-auto mb-6 drop-shadow-md"
              />
              <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                isDark ? 'text-zinc-100' : 'text-[#1a2e23]'
              }`}>
                Start planning in seconds
              </h2>
              <p className={`mt-3 text-base sm:text-lg ${
                isDark ? 'text-zinc-400' : 'text-[#1a2e23]/50'
              }`}>
                Free forever. Open source. No account needed.
              </p>
              <div className="mt-8">
                <Link
                  href="/c/new"
                  className={`group inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-lg shadow-lg transition-all duration-200 active:scale-[0.98] ${
                    isDark
                      ? 'bg-[#BDCC8D] text-zinc-950 shadow-[#BDCC8D]/20 hover:bg-[#c9d79c]'
                      : 'bg-[#2D5F3E] text-white shadow-[#2D5F3E]/20 hover:bg-[#245033]'
                  }`}
                >
                  Open DailyForest
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className={`border-t py-8 px-4 sm:px-6 transition-colors ${
          isDark ? 'border-white/10 bg-zinc-950' : 'border-black/[0.04] bg-[#FAF9F6]'
        }`}>
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <LogoBadge size={22} />
              <span className={`font-handwritten text-base font-semibold ${
                isDark ? 'text-[#BDCC8D]' : 'text-[#2D5F3E]'
              }`}>
                DailyForest
              </span>
            </div>
            <div className={`flex gap-5 font-medium ${isDark ? 'text-zinc-400' : 'text-[#1a2e23]/50'}`}>
              <Link href="/c/new" className={`transition-colors ${isDark ? 'hover:text-[#BDCC8D]' : 'hover:text-[#2D5F3E]'}`}>
                New Planner
              </Link>
              <a
                href="https://github.com/tanyas27/weekly-tracker"
                target="_blank"
                rel="noopener noreferrer"
                className={`transition-colors ${isDark ? 'hover:text-[#BDCC8D]' : 'hover:text-[#2D5F3E]'}`}
              >
                GitHub
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

function Feature({
  icon,
  title,
  desc,
  isDark,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  isDark: boolean
}) {
  return (
    <div className="flex flex-col items-start">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
        isDark ? 'bg-[#BDCC8D]/15 text-[#BDCC8D]' : 'bg-[#2D5F3E]/[0.07] text-[#2D5F3E]'
      }`}>
        {icon}
      </div>
      <h3 className={`text-base font-bold mb-1 ${isDark ? 'text-zinc-100' : 'text-[#1a2e23]'}`}>{title}</h3>
      <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-[#1a2e23]/50'}`}>{desc}</p>
    </div>
  )
}
