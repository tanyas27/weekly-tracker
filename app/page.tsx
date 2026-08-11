'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'
import {
  ArrowRight,
  Clock,
  Share2,
  WifiOff,
  ShieldCheck,
  TreePine,
  Sun,
  Moon,
  Calendar,
  Trash2,
  Lock,
  ArrowUpRight,
} from 'lucide-react'
import {
  getRecentCalendars,
  clearRecentCalendars,
  formatRelativeTime,
  RecentCalendar,
} from '@/lib/recent-calendars'

export default function LandingPage() {
  const [isDark, setIsDark] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [recentCalendars, setRecentCalendars] = useState<RecentCalendar[]>([])

  useEffect(() => {
    setIsMounted(true)
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setIsDark(savedTheme === 'dark')
    } else {
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
    setRecentCalendars(getRecentCalendars())
  }, [])

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev
      localStorage.setItem('theme', next ? 'dark' : 'light')
      return next
    })
  }

  const handleClearRecent = () => {
    clearRecentCalendars()
    setRecentCalendars([])
  }

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
          <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-5">
            <Link href="/" className="flex items-center gap-2">
              <TreePine className={`w-5 h-5 ${isDark ? 'text-[#BDCC8D]' : 'text-[#2D5F3E]'}`} />
              <span className={`text-lg font-handwritten font-bold ${isDark ? 'text-[#BDCC8D]' : 'text-[#2D5F3E]'}`}>
                DailyForest
              </span>
            </Link>
            <div className="flex items-center gap-4">
              {isMounted && (
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className={`p-1.5 rounded-full border transition-colors ${
                    isDark
                      ? 'bg-zinc-800 border-white/10 text-yellow-400 hover:bg-zinc-700'
                      : 'bg-white border-black/10 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              )}
              <Link
                href="/c/new"
                className={`text-sm font-semibold transition-colors ${
                  isDark ? 'text-[#BDCC8D] hover:text-[#d3e1c5]' : 'text-[#2D5F3E] hover:text-[#234b31]'
                }`}
              >
                Open Planner →
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <main>
          <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20 px-5" aria-label="Hero">
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
              <p className={`mt-5 text-lg sm:text-xl max-w-lg mx-auto leading-relaxed ${
                isDark ? 'text-zinc-400' : 'text-[#1a2e23]/60'
              }`}>
                Free daily &amp; weekly planner. Time-block your schedule, share calendars, and work offline — beautifully.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/c/new"
                  className={`group inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-base shadow-lg transition-all duration-200 active:scale-[0.98] ${
                    isDark
                      ? 'bg-[#BDCC8D] text-zinc-950 shadow-[#BDCC8D]/20 hover:bg-[#c9d79c]'
                      : 'bg-[#2D5F3E] text-white shadow-[#2D5F3E]/20 hover:bg-[#245033]'
                  }`}
                >
                  Create your planner
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <span className={`text-sm ${isDark ? 'text-zinc-500' : 'text-[#1a2e23]/40'}`}>
                  No sign-up needed
                </span>
              </div>
            </div>
          </section>

          {/* Recent Planners / Open Recent */}
          {isMounted && recentCalendars.length > 0 && (
            <section className="px-5 pb-12 sm:pb-16 -mt-2 sm:-mt-4" aria-label="Recent Planners">
              <div className="max-w-3xl mx-auto">
                <div className={`p-4 sm:p-5 rounded-2xl border shadow-md backdrop-blur-md transition-colors ${
                  isDark ? 'bg-zinc-900/90 border-white/10 shadow-black/40' : 'bg-white/90 border-[#2D5F3E]/10 shadow-[0_8px_30px_rgba(45,95,62,0.06)]'
                }`}>
                  <div className={`flex items-center justify-between pb-3 mb-3 border-b ${
                    isDark ? 'border-white/10' : 'border-black/[0.05]'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Calendar className={`w-4 h-4 ${isDark ? 'text-[#BDCC8D]' : 'text-[#2D5F3E]'}`} />
                      <h2 className={`text-xs font-bold tracking-wider uppercase ${isDark ? 'text-zinc-300' : 'text-[#1a2e23]'}`}>
                        Recent Planners
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearRecent}
                      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border transition-colors ${
                        isDark
                          ? 'text-zinc-400 border-white/10 hover:bg-zinc-800 hover:text-zinc-200'
                          : 'text-zinc-500 border-black/10 hover:bg-zinc-50 hover:text-zinc-800'
                      }`}
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {recentCalendars.map((item) => {
                      const displayName = item.title && item.title !== 'My Planner' && item.title !== 'My Weekly Schedule'
                        ? item.title
                        : `Planner #${item.id.slice(0, 6)}`
                      return (
                        <Link
                          key={item.id}
                          href={`/c/${item.id}`}
                          className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:-translate-y-0.5 ${
                            isDark
                              ? 'bg-zinc-800/80 border-white/10 text-zinc-200 hover:bg-zinc-800 hover:border-[#BDCC8D]/50'
                              : 'bg-[#FAF9F6] border-black/[0.06] text-[#1a2e23] hover:bg-white hover:border-[#2D5F3E]/30 shadow-xs'
                          }`}
                        >
                          {item.isPrivate && <Lock className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                          <span>{displayName}</span>
                          <span className="text-[10px] opacity-40 font-mono">• {formatRelativeTime(item.lastVisited)}</span>
                          <ArrowUpRight className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                            isDark ? 'text-[#BDCC8D]' : 'text-[#2D5F3E]'
                          }`} />
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Mini Planner Preview Widget */}
          <section className="px-5 pb-20 sm:pb-28" aria-label="Planner Preview">
            <div className="max-w-4xl mx-auto">
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
                    <span className={`font-handwritten text-2xl sm:text-3xl font-bold ${
                      isDark ? 'text-[#BDCC8D]' : 'text-[#2D5F3E]'
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
          <section className={`border-y py-16 sm:py-20 px-5 transition-colors ${
            isDark ? 'bg-zinc-900/50 border-white/10' : 'bg-white border-black/[0.04]'
          }`} aria-label="Features">
            <div className="max-w-5xl mx-auto">
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
          <section className="py-20 sm:py-28 px-5 text-center" aria-label="Call to Action">
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
        <footer className={`border-t py-8 px-5 transition-colors ${
          isDark ? 'border-white/10 bg-zinc-950' : 'border-black/[0.04] bg-[#FAF9F6]'
        }`}>
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <TreePine className={`w-4 h-4 ${isDark ? 'text-[#BDCC8D]' : 'text-[#2D5F3E]'}`} />
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
