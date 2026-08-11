import React, { useState } from 'react'

interface PrivacyLockScreenProps {
  calendarTitle?: string
  isDark: boolean
  onUnlock: (passcode: string) => Promise<{ success: boolean; error?: string }>
}

export function PrivacyLockScreen({ calendarTitle, isDark, onUnlock }: PrivacyLockScreenProps) {
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passcode.trim()) return

    setLoading(true)
    setError(null)

    const res = await onUnlock(passcode.trim())
    setLoading(false)

    if (!res.success) {
      setError(res.error || 'Incorrect passcode')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-6 sm:py-12 px-3 sm:px-6 min-h-[45vh] w-full">
      <div
        className={`w-full max-w-sm sm:max-w-md p-6 sm:p-8 rounded-[28px] backdrop-blur-2xl shadow-2xl border transition-all ${
          isDark
            ? 'bg-slate-800/95 border-slate-700/90 text-white'
            : 'bg-white/95 border-white/90 text-slate-900'
        }`}
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-100/90 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs border border-amber-200/70 dark:border-amber-800/40">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <div>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight">Private Calendar</h2>
            <p className={`text-xs sm:text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {calendarTitle ? `"${calendarTitle}" is password protected.` : 'This schedule is password protected.'}
              <br />
              Enter passcode to view tasks.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4 pt-2">
            <div>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter Passcode"
                autoFocus
                className={`w-full px-4 py-3 text-center text-lg font-mono tracking-widest rounded-2xl border focus:outline-none focus:ring-2 transition-all ${
                  isDark
                    ? 'bg-slate-900/60 border-slate-700 text-white focus:ring-amber-500/50'
                    : 'bg-white border-slate-300 text-slate-900 focus:ring-amber-500/50'
                }`}
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs text-center font-bold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !passcode.trim()}
              className="w-full py-3 px-6 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold text-sm rounded-full shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Verifying...' : 'Unlock Calendar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
