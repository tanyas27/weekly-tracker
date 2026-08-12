import { useEffect } from 'react'

interface UseKeyboardShortcutsProps {
  onNewTask: () => void
  onToggleHelp: () => void
  onEscape?: () => void
  disabled?: boolean
}

export function useKeyboardShortcuts({
  onNewTask,
  onToggleHelp,
  onEscape,
  disabled = false,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    if (disabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keystrokes when typing inside text inputs, textareas, or contenteditable elements
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

      // Check key
      const key = e.key

      if (key === 'n' || key === 'N' || key === 'c' || key === 'C') {
        e.preventDefault()
        onNewTask()
      } else if (key === '?' || (e.shiftKey && key === '/')) {
        e.preventDefault()
        onToggleHelp()
      } else if (key === 'Escape' && onEscape) {
        e.preventDefault()
        onEscape()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onNewTask, onToggleHelp, onEscape, disabled])
}
