import React, { useEffect, useRef } from 'react'
import { X, Keyboard, Plus, HelpCircle } from 'lucide-react'

interface ShortcutsHelpModalProps {
  isOpen: boolean
  isDark: boolean
  onClose: () => void
}

export function ShortcutsHelpModal({ isOpen, isDark, onClose }: ShortcutsHelpModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null
      modalRef.current?.focus()
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  const shortcuts = [
    { key: 'N or C', label: 'New Calendar Entry', icon: Plus },
    { key: '?', label: 'Toggle Shortcuts Help', icon: HelpCircle },
    { key: 'Esc', label: 'Close Active Modal', icon: X },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-dialog-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md p-6 rounded-3xl shadow-2xl border transition-colors outline-none ${
          isDark
            ? 'bg-zinc-900 border-white/10 text-zinc-100 shadow-black/60'
            : 'bg-white border-black/10 text-[#1a2e23] shadow-xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-zinc-800 border-white/10 text-[#BDCC8D]' : 'bg-[#2D5F3E]/10 border-[#2D5F3E]/20 text-[#2D5F3E]'
            }`}>
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 id="shortcuts-dialog-title" className="text-lg font-bold tracking-tight">
                Keyboard Shortcuts
              </h2>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Quick accessibility commands
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts help"
            className={`p-2 rounded-full border transition-colors cursor-pointer ${
              isDark
                ? 'bg-zinc-800 border-white/10 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                : 'bg-zinc-100 border-black/5 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="space-y-3">
          {shortcuts.map((s, idx) => {
            const Icon = s.icon
            return (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${
                  isDark
                    ? 'bg-zinc-800/60 border-white/5'
                    : 'bg-[#FAF9F6] border-black/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isDark ? 'text-[#BDCC8D]' : 'text-[#2D5F3E]'}`} />
                  <span className="text-xs sm:text-sm font-semibold">{s.label}</span>
                </div>
                <kbd className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border shadow-2xs ${
                  isDark
                    ? 'bg-zinc-800 border-white/15 text-zinc-200'
                    : 'bg-white border-black/10 text-zinc-800'
                }`}>
                  {s.key}
                </kbd>
              </div>
            )
          })}
        </div>

        {/* Footer tip */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              isDark
                ? 'bg-[#BDCC8D] text-zinc-950 hover:bg-[#c9d79c]'
                : 'bg-[#2D5F3E] text-white hover:bg-[#234b31]'
            }`}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
