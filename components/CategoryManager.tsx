'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Plus, Tag } from 'lucide-react'
import { TODO_COLORS, getCategoryColor } from '@/lib/todo-utils'

interface CategoryManagerProps {
  categories: string[]
  isDark: boolean
  isOpen: boolean
  onClose: () => void
  onAddCategory: (category: string) => void
}

export function CategoryManager({
  categories,
  isDark,
  isOpen,
  onClose,
  onAddCategory,
}: CategoryManagerProps) {
  const [newCategory, setNewCategory] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleAdd = () => {
    const trimmed = newCategory.trim()
    // Security: Validate category name
    if (trimmed && trimmed.length <= 50 && !categories.includes(trimmed)) {
      onAddCategory(trimmed)
      setNewCategory('')
    } else if (trimmed.length > 50) {
      // Truncate to max length
      const truncated = trimmed.slice(0, 50)
      if (!categories.includes(truncated)) {
        onAddCategory(truncated)
      }
      setNewCategory('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`
          w-full max-w-md mx-4 p-6 rounded-2xl shadow-2xl
          ${
            isDark
              ? 'bg-zinc-900/90 border border-white/20'
              : 'bg-white/90 border border-white/60'
          }
          backdrop-blur-xl
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-gray-100">
              Manage Categories
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Add New Category */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            Add New Category
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Category name..."
              className={`
                flex-1 px-3 py-2 rounded-lg border text-sm
                ${
                  isDark
                    ? 'bg-white/10 border-white/20 text-gray-100 placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500
              `}
              maxLength={50}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newCategory.trim() || categories.includes(newCategory.trim())}
              className={`
                px-4 py-2 rounded-lg font-bold text-sm transition-all
                ${
                  newCategory.trim() && !categories.includes(newCategory.trim())
                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }
              `}
            >
              Add
            </button>
          </div>
          {newCategory.trim() && categories.includes(newCategory.trim()) && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              Category already exists
            </p>
          )}
        </div>

        {/* Existing Categories */}
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
            Existing Categories
          </label>
          {categories.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No categories yet
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categories.map((cat) => {
                const color = getCategoryColor(cat)
                return (
                  <div
                    key={cat}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border
                      ${
                        isDark
                          ? 'bg-white/5 border-white/10'
                          : 'bg-white/50 border-white/60'
                      }
                    `}
                  >
                    <div
                      className={`w-4 h-4 rounded-full ${color}`}
                      aria-label={`Category color: ${color}`}
                    />
                    <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {cat}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`
              px-6 py-2 rounded-lg font-bold text-sm transition-all
              ${
                isDark
                  ? 'bg-white/10 hover:bg-white/20 text-gray-100'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }
            `}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
