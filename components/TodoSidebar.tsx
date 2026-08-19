'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import { Task } from '@/types/task'
import { TodoItem } from './TodoItem'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation,
  MeasuringStrategy,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus, X, ChevronLeft, ListTodo } from 'lucide-react'
import { filterTodosByCategory, getUniqueCategories, getTodoStats } from '@/lib/todo-utils'

interface TodoSidebarProps {
  todos: Task[]
  isDark: boolean
  isOpen: boolean
  onToggle: () => void
  onAddTodo: (name: string, category?: string) => void
  onToggleComplete: (id: string) => void
  onDelete: (id: string) => void
  onUpdateName: (id: string, name: string) => void
  onUpdateCategory: (id: string, category: string | null) => void
  onReorder: (reorderedIds: string[]) => void
}

const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.25',
      },
    },
  }),
  duration: 160,
  easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
}

const measuringConfig = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
}

export function TodoSidebar({
  todos,
  isDark,
  isOpen,
  onToggle,
  onAddTodo,
  onToggleComplete,
  onDelete,
  onUpdateName,
  onUpdateCategory,
  onReorder,
}: TodoSidebarProps) {
  const [newTodoInput, setNewTodoInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [dragActiveIds, setDragActiveIds] = useState<string[] | null>(null)
  const [dragCompletedIds, setDragCompletedIds] = useState<string[] | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const categories = useMemo(() => getUniqueCategories(todos), [todos])
  const filteredTodos = useMemo(() => filterTodosByCategory(todos, selectedCategory), [todos, selectedCategory])
  const stats = useMemo(() => getTodoStats(filteredTodos), [filteredTodos])
  const activeTodos = useMemo(() => filteredTodos.filter((t) => !t.completed), [filteredTodos])
  const completedTodos = useMemo(() => filteredTodos.filter((t) => t.completed), [filteredTodos])

  // Derive visual ordering during active drag gesture without causing setState infinite render loops
  const displayActiveTodos = useMemo(() => {
    if (!dragActiveIds) return activeTodos
    const map = new Map(activeTodos.map((t) => [t.id, t]))
    const result: Task[] = []
    for (const id of dragActiveIds) {
      const item = map.get(id)
      if (item) result.push(item)
    }
    for (const item of activeTodos) {
      if (!dragActiveIds.includes(item.id)) result.push(item)
    }
    return result
  }, [activeTodos, dragActiveIds])

  const displayCompletedTodos = useMemo(() => {
    if (!dragCompletedIds) return completedTodos
    const map = new Map(completedTodos.map((t) => [t.id, t]))
    const result: Task[] = []
    for (const id of dragCompletedIds) {
      const item = map.get(id)
      if (item) result.push(item)
    }
    for (const item of completedTodos) {
      if (!dragCompletedIds.includes(item.id)) result.push(item)
    }
    return result
  }, [completedTodos, dragCompletedIds])

  const activeDragTodo = useMemo(() => {
    if (!activeDragId) return null
    return todos.find((t) => t.id === activeDragId) || null
  }, [activeDragId, todos])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Lock body scroll on mobile when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleAddTodo = () => {
    const trimmedInput = newTodoInput.trim()
    if (trimmedInput && trimmedInput.length <= 500) {
      const category = selectedCategory !== 'all' && selectedCategory !== 'uncategorized'
        ? selectedCategory : undefined
      onAddTodo(trimmedInput, category)
      setNewTodoInput('')
    } else if (trimmedInput.length > 500) {
      const truncated = trimmedInput.slice(0, 500)
      const category = selectedCategory !== 'all' && selectedCategory !== 'uncategorized'
        ? selectedCategory : undefined
      onAddTodo(truncated, category)
      setNewTodoInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddTodo() }
    else if (e.key === 'Escape') { e.preventDefault(); setNewTodoInput('') }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id)
    setActiveDragId(id)
    if (activeTodos.some((t) => t.id === id)) {
      setDragActiveIds(activeTodos.map((t) => t.id))
    } else if (completedTodos.some((t) => t.id === id)) {
      setDragCompletedIds(completedTodos.map((t) => t.id))
    }
  }

  const handleDragCancel = () => {
    setActiveDragId(null)
    setDragActiveIds(null)
    setDragCompletedIds(null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)

    setDragActiveIds((prev) => {
      if (!prev || !prev.includes(activeId) || !prev.includes(overId)) return prev
      const oldIndex = prev.indexOf(activeId)
      const newIndex = prev.indexOf(overId)
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })

    setDragCompletedIds((prev) => {
      if (!prev || !prev.includes(activeId) || !prev.includes(overId)) return prev
      const oldIndex = prev.indexOf(activeId)
      const newIndex = prev.indexOf(overId)
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    const activeId = String(active.id)
    const overId = over ? String(over.id) : null

    let finalOrder: string[] | null = null

    if (activeTodos.some((t) => t.id === activeId)) {
      finalOrder = dragActiveIds || activeTodos.map((t) => t.id)
      if (!dragActiveIds && overId && activeId !== overId) {
        const oldIndex = finalOrder.indexOf(activeId)
        const newIndex = finalOrder.indexOf(overId)
        if (oldIndex !== -1 && newIndex !== -1) {
          finalOrder = arrayMove(finalOrder, oldIndex, newIndex)
        }
      }
    } else if (completedTodos.some((t) => t.id === activeId)) {
      finalOrder = dragCompletedIds || completedTodos.map((t) => t.id)
      if (!dragCompletedIds && overId && activeId !== overId) {
        const oldIndex = finalOrder.indexOf(activeId)
        const newIndex = finalOrder.indexOf(overId)
        if (oldIndex !== -1 && newIndex !== -1) {
          finalOrder = arrayMove(finalOrder, oldIndex, newIndex)
        }
      }
    }

    setActiveDragId(null)
    setDragActiveIds(null)
    setDragCompletedIds(null)

    if (finalOrder && finalOrder.length > 0) {
      onReorder(finalOrder)
    }
  }

  return (
    <>
      {/* ── Backdrop ── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[150] transition-opacity duration-300"
          onClick={onToggle}
          aria-label="Close todo sidebar"
        />
      )}

      {/*
        ── Outer positioner ──
        MOBILE  : fixed bottom sheet — slides up/down (translateY)
        DESKTOP : fixed right panel — slides left/right (translateX)
      */}
      <div
        className={`
          fixed z-[160] transition-transform duration-300 ease-in-out
          
          /* ── Mobile: bottom sheet ── */
          bottom-0 left-0 right-0
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}

          /* ── Desktop: right sidebar ── */
          md:bottom-auto md:left-auto md:right-0 md:top-14 md:h-[calc(100vh-3.5rem)]
          ${isOpen ? 'md:translate-x-0 md:translate-y-0' : 'md:translate-x-full md:translate-y-0'}
        `}
      >
        {/*
          ── Inner panel ──
          MOBILE  : full-width, capped height, rounded top corners
          DESKTOP : fixed width, full height, square corners
        */}
        <div
          className={`
            flex flex-col backdrop-blur-2xl backdrop-saturate-200 shadow-2xl

            /* Mobile sizing & shape */
            w-full max-h-[82vh] rounded-t-2xl

            /* Desktop sizing & shape */
            md:w-[28rem] md:max-h-none md:h-full md:rounded-none

            ${isDark
              ? 'bg-[#0f1a12]/80 border-t border-[#3d5a3e]/40 md:border-t-0 md:border-l shadow-[0_0_60px_0_rgba(0,0,0,0.6)]'
              : 'bg-[#fdf8ef]/75 border-t border-[#c8b89a]/40 md:border-t-0 md:border-l shadow-[0_0_60px_0_rgba(80,60,30,0.15)]'
            }
          `}
        >
          {/* ── Mobile drag handle pill ── */}
          <div className="flex justify-center pt-3 pb-1 md:hidden flex-shrink-0">
            <div
              className={`w-10 h-1 rounded-full ${isDark ? 'bg-[#3d5a3e]/60' : 'bg-[#c8b89a]/60'}`}
            />
          </div>

          {/* ── Header ── */}
          <div
            className={`
              flex items-center justify-between px-5 py-3.5 border-b flex-shrink-0
              ${isDark ? 'border-[#3d5a3e]/40 bg-[#162318]/50' : 'border-[#c8b89a]/30 bg-[#f5ede0]/40'}
            `}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                  ${isDark
                    ? 'bg-[#2d5a2e]/60 border border-[#4a8a4b]/40'
                    : 'bg-[#d4a853]/20 border border-[#c49a42]/30'
                  }
                `}
              >
                <ListTodo className={`w-4 h-4 ${isDark ? 'text-[#a8c97a]' : 'text-[#8b6914]'}`} />
              </div>
              <div>
                <h2 className={`text-base font-bold tracking-wide leading-none ${isDark ? 'text-[#d4e8b0]' : 'text-[#3d2b0a]'}`}>
                  My Journal
                </h2>
                <p className={`text-[10px] font-medium tracking-widest uppercase mt-0.5 ${isDark ? 'text-[#6b9e5e]/80' : 'text-[#a07840]/80'}`}>
                  Daily Notes
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggle}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
                ${isDark
                  ? 'hover:bg-[#2d5a2e]/50 text-[#6b9e5e] hover:text-[#a8c97a] border border-[#3d5a3e]/30'
                  : 'hover:bg-[#d4a853]/15 text-[#a07840] hover:text-[#6b4c10] border border-[#c8b89a]/30'
                }
              `}
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Quick Add ── */}
          <div className={`p-4 border-b flex-shrink-0 ${isDark ? 'border-[#3d5a3e]/30' : 'border-[#c8b89a]/25'}`}>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newTodoInput}
                onChange={(e) => setNewTodoInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a new note…"
                className={`
                  flex-1 px-4 py-2.5 rounded-xl border text-sm font-handwritten transition-all duration-200 shadow-inner
                  ${isDark
                    ? 'bg-[#162318]/60 border-[#3d5a3e]/50 text-[#d4e8b0] placeholder-[#4a7a4b]/70 focus:border-[#6b9e5e]/70 focus:bg-[#1e2d1f]/70 focus:ring-[#4a8a4b]/20'
                    : 'bg-[#fffdf5]/70 border-[#c8b89a]/50 text-[#3d2b0a] placeholder-[#c8b89a]/80 focus:border-[#c49a42]/60 focus:bg-[#fffdf5]/90 focus:ring-[#d4a853]/20'
                  }
                  focus:outline-none focus:ring-2
                `}
                maxLength={500}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={handleAddTodo}
                disabled={!newTodoInput.trim()}
                className={`
                  px-3 rounded-xl transition-all duration-200 flex items-center justify-center
                  ${newTodoInput.trim()
                    ? isDark
                      ? 'bg-[#3d7a3e] hover:bg-[#4a8a4b] text-[#d4e8b0] shadow-md hover:shadow-lg active:scale-95 border border-[#5a9a5b]/50'
                      : 'bg-[#d4a853] hover:bg-[#c49a42] text-[#3d2b0a] shadow-md hover:shadow-lg active:scale-95 border border-[#b8891e]/30'
                    : isDark
                    ? 'bg-[#162318]/40 border border-[#3d5a3e]/30 text-[#3d5a3e]/60 cursor-not-allowed'
                    : 'bg-[#f5ede0]/60 border border-[#c8b89a]/30 text-[#c8b89a]/70 cursor-not-allowed'
                  }
                `}
                aria-label="Add todo"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── Category Filter Chips ── */}
          {categories.length > 0 && (
            <div className={`px-4 py-2.5 border-b overflow-x-auto scrollbar-hide flex-shrink-0 ${isDark ? 'border-[#3d5a3e]/30' : 'border-[#c8b89a]/25'}`}>
              <div className="flex gap-1.5 flex-nowrap">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`
                    px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all duration-200
                    ${selectedCategory === 'all'
                      ? isDark
                        ? 'bg-[#3d7a3e] text-[#d4e8b0] shadow-sm border border-[#5a9a5b]/40'
                        : 'bg-[#d4a853] text-[#3d2b0a] shadow-sm border border-[#b8891e]/30'
                      : isDark
                      ? 'bg-[#162318]/40 text-[#6b9e5e] border border-[#3d5a3e]/30 hover:bg-[#2d5a2e]/40'
                      : 'bg-[#f5ede0]/60 text-[#8b6914] border border-[#c8b89a]/40 hover:bg-[#eedfc8]/60'
                    }
                  `}
                >
                  All ({todos.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`
                      px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all duration-200
                      ${selectedCategory === cat
                        ? isDark
                          ? 'bg-[#3d7a3e] text-[#d4e8b0] shadow-sm border border-[#5a9a5b]/40'
                          : 'bg-[#d4a853] text-[#3d2b0a] shadow-sm border border-[#b8891e]/30'
                        : isDark
                        ? 'bg-[#162318]/40 text-[#6b9e5e] border border-[#3d5a3e]/30 hover:bg-[#2d5a2e]/40'
                        : 'bg-[#f5ede0]/60 text-[#8b6914] border border-[#c8b89a]/40 hover:bg-[#eedfc8]/60'
                      }
                    `}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Todo List ── */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {filteredTodos.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center gap-3">
                <div
                  className={`
                    w-24 h-28 rounded-xl flex flex-col items-center justify-center gap-1.5 relative overflow-hidden
                    ${isDark ? 'bg-[#162318]/50 border border-[#3d5a3e]/30' : 'bg-[#fffdf5]/80 border border-[#c8b89a]/40 shadow-inner'}
                  `}
                >
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-14 h-px rounded-full ${isDark ? 'bg-[#3d5a3e]/50' : 'bg-[#c8b89a]/40'}`} />
                  ))}
                  <ListTodo className={`absolute w-7 h-7 opacity-20 ${isDark ? 'text-[#a8c97a]' : 'text-[#c49a42]'}`} />
                </div>
                <p className={`text-sm font-bold font-handwritten ${isDark ? 'text-[#6b9e5e]' : 'text-[#a07840]'}`}>
                  A fresh page awaits
                </p>
                <p className={`text-xs ${isDark ? 'text-[#4a7a4b]/80' : 'text-[#c8b89a]'}`}>
                  Add your first note above
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                measuring={measuringConfig}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                <div className="space-y-2">
                  {displayActiveTodos.length > 0 && (
                    <SortableContext items={displayActiveTodos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                      {displayActiveTodos.map((todo) => (
                        <TodoItem
                          key={todo.id}
                          task={todo}
                          isDark={isDark}
                          onToggleComplete={onToggleComplete}
                          onDelete={onDelete}
                          onUpdateName={onUpdateName}
                          onUpdateCategory={onUpdateCategory}
                        />
                      ))}
                    </SortableContext>
                  )}

                  {displayCompletedTodos.length > 0 && (
                    <div className="mt-5">
                      <div className={`border-t border-dashed mb-3 ${isDark ? 'border-[#3d5a3e]/40' : 'border-[#c8b89a]/40'}`} />
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 px-1 ${isDark ? 'text-[#4a7a4b]' : 'text-[#b89a60]'}`}>
                        ✓ Done · {displayCompletedTodos.length}
                      </p>
                      <SortableContext items={displayCompletedTodos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                        {displayCompletedTodos.map((todo) => (
                          <TodoItem
                            key={todo.id}
                            task={todo}
                            isDark={isDark}
                            onToggleComplete={onToggleComplete}
                            onDelete={onDelete}
                            onUpdateName={onUpdateName}
                            onUpdateCategory={onUpdateCategory}
                          />
                        ))}
                      </SortableContext>
                    </div>
                  )}
                </div>

                <DragOverlay dropAnimation={dropAnimationConfig}>
                  {activeDragTodo ? (
                    <TodoItem
                      task={activeDragTodo}
                      isDark={isDark}
                      isDragOverlay
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>

          {/* ── Footer Stats ── */}
          <div
            className={`
              px-5 py-3 border-t text-xs flex-shrink-0
              ${isDark ? 'border-[#3d5a3e]/30 bg-[#162318]/40' : 'border-[#c8b89a]/25 bg-[#f5ede0]/40'}
            `}
          >
            <div className="flex justify-between items-center">
              <span className={`font-medium ${isDark ? 'text-[#4a7a4b]' : 'text-[#b89a60]'}`}>
                {stats.active} open · {stats.completed} done
              </span>
              {stats.total > 0 && (
                <span className={`font-bold tracking-wide ${isDark ? 'text-[#8ab86c]' : 'text-[#8b6914]'}`}>
                  {Math.round(stats.completionRate)}% complete
                </span>
              )}
            </div>
            {stats.total > 0 && (
              <div className={`mt-2 h-1 rounded-full overflow-hidden ${isDark ? 'bg-[#2d3d2e]/60' : 'bg-[#e8d9c0]/60'}`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isDark ? 'bg-[#5a9a5b]' : 'bg-[#d4a853]'}`}
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            )}
            {/* Safe area spacer for mobile home-indicator bar */}
            <div className="h-safe-bottom md:hidden" />
          </div>
        </div>

        {/* ── Desktop-only: collapsed toggle tab ── */}
        {!isOpen && (
          <button
            type="button"
            onClick={onToggle}
            className={`
              hidden md:flex
              absolute right-0 top-1/2 -translate-y-1/2
              p-2 rounded-l-xl shadow-lg transition-all duration-200 hover:-translate-x-1
              items-center justify-center
              ${isDark
                ? 'bg-[#0f1a12]/80 border-l border-t border-b border-[#3d5a3e]/50 backdrop-blur-xl'
                : 'bg-[#fdf8ef]/80 border-l border-t border-b border-[#c8b89a]/50 backdrop-blur-xl'
              }
            `}
            aria-label="Open todo sidebar"
          >
            <ChevronLeft className={`w-5 h-5 ${isDark ? 'text-[#6b9e5e]' : 'text-[#a07840]'}`} />
          </button>
        )}
      </div>
    </>
  )
}
