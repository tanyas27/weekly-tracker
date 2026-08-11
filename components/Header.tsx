import React from 'react'

interface HeaderProps {
  monthYear: string
  progressPercentage: number
  isDark: boolean
  onToggleTheme: () => void
  unreadNotificationsCount?: number
  onOpenNotifications?: () => void
}

export function Header({
  monthYear,
  progressPercentage,
  isDark,
  onToggleTheme,
  unreadNotificationsCount = 0,
  onOpenNotifications,
}: HeaderProps) {
  const roundedProgress = Math.round(progressPercentage)
  const strokeDashArray = `${(progressPercentage / 100) * 100.53} 100.53`

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
      <h1 className={`text-xl sm:text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {monthYear}
      </h1>
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 transform -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke={isDark ? '#374151' : '#E5E7EB'}
                strokeWidth="3"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke={isDark ? '#60A5FA' : '#3B82F6'}
                strokeWidth="3"
                strokeDasharray={strokeDashArray}
                strokeLinecap="round"
                suppressHydrationWarning
              />
            </svg>
          </div>
          <div>
            <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Overall progress
            </div>
            <div
              className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
              suppressHydrationWarning
            >
              {roundedProgress}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Notifications Bell Button */}
          <button
            onClick={onOpenNotifications}
            aria-label="Open notifications drawer"
            className={`relative w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
              isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-white/50 text-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm animate-pulse">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme mode"
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-white/50'
            }`}
          >
            {!isDark ? (
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4" fill="currentColor" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

