import React, { useState } from 'react'

interface PrivacySettingsModalProps {
  isOpen: boolean
  isDark: boolean
  isPrivate: boolean
  onClose: () => void
  onUpdatePrivacy: (
    targetIsPrivate: boolean,
    newPin?: string,
    currPin?: string
  ) => Promise<{ success: boolean; error?: string }>
  onLockCalendar: () => void
}

export function PrivacySettingsModal({
  isOpen,
  isDark,
  isPrivate,
  onClose,
  onUpdatePrivacy,
  onLockCalendar,
}: PrivacySettingsModalProps) {
  const [targetIsPrivate, setTargetIsPrivate] = useState(isPrivate)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await onUpdatePrivacy(targetIsPrivate, newPin, currentPin)
    setLoading(false)

    if (res.success) {
      onClose()
    } else {
      setError(res.error || 'Failed to update privacy settings')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-md p-6 sm:p-7 rounded-[28px] shadow-2xl border transition-all ${
          isDark
            ? 'bg-gray-800/95 border-gray-700/80 text-white'
            : 'bg-white/95 border-white/80 text-gray-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-amber-100/90 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs border border-amber-200/70 dark:border-amber-800/40">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">Calendar Privacy Settings</h3>
              <p className={`text-xs mt-0.5 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Control visibility and access permissions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'
            }`}
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          {/* Toggle Box */}
          <div className={`p-4 sm:p-5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
            isDark ? 'bg-gray-700/40 border-gray-600/50' : 'bg-gray-100/70 border-gray-200/80'
          }`}>
            <div className="space-y-0.5">
              <div className="text-sm font-extrabold flex items-center gap-2">
                {targetIsPrivate ? (
                  <>
                    <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Private Calendar</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8" />
                    </svg>
                    <span>Public (Shared) Calendar</span>
                  </>
                )}
              </div>
              <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {targetIsPrivate
                  ? 'Requires a passcode to view and edit tasks.'
                  : 'Anyone with the URL link can view and edit tasks.'}
              </div>
            </div>

            {/* Pill Toggle Switch */}
            <button
              type="button"
              onClick={() => setTargetIsPrivate((prev) => !prev)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                targetIsPrivate ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              aria-label="Toggle calendar privacy"
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  targetIsPrivate ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Current Passcode Field */}
          {isPrivate && (
            <div>
              <label className={`block text-[11px] font-extrabold tracking-wider uppercase mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                CURRENT PASSCODE
              </label>
              <input
                type="password"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="Enter current passcode"
                className={`w-full px-4 py-3 text-sm rounded-2xl border focus:outline-none focus:ring-2 font-mono tracking-wider transition-all ${
                  isDark
                    ? 'bg-gray-900/60 border-gray-700 text-white focus:ring-amber-500/50'
                    : 'bg-white border-gray-200 text-gray-900 focus:ring-amber-500/50'
                }`}
              />
            </div>
          )}

          {/* New Passcode Field */}
          {targetIsPrivate && (
            <div>
              <label className={`block text-[11px] font-extrabold tracking-wider uppercase mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {isPrivate ? 'NEW PASSCODE (OPTIONAL)' : 'SET PASSCODE (MIN 4 CHARS)'}
              </label>
              <input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder={isPrivate ? 'Leave blank to keep existing' : 'Enter 4+ digit passcode'}
                className={`w-full px-4 py-3 text-sm rounded-2xl border focus:outline-none focus:ring-2 font-mono tracking-wider transition-all ${
                  isDark
                    ? 'bg-gray-900/60 border-gray-700 text-white focus:ring-amber-500/50'
                    : 'bg-white border-gray-200 text-gray-900 focus:ring-amber-500/50'
                }`}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs text-center font-bold">
              {error}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-3 pt-3">
            {isPrivate ? (
              <button
                type="button"
                onClick={() => {
                  onLockCalendar()
                  onClose()
                }}
                className="px-4 py-2 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-300 bg-rose-100/90 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 rounded-full hover:bg-rose-200/80 transition-all cursor-pointer shadow-xs"
              >
                Lock Calendar Now
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#F59E0B] hover:bg-[#D97706] rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
