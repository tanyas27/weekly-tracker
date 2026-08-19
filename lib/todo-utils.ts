import type { Task } from '@/types/task';

// Default pastel colors palette (matching existing COLORS from the calendar)
export const TODO_COLORS = [
  'bg-[#FFF9C4]', // Light yellow
  'bg-[#FFE082]', // Yellow
  'bg-[#FFCC80]', // Peach
  'bg-[#FFAB91]', // Salmon pink
  'bg-[#E1BEE7]', // Light purple
  'bg-[#F48FB1]', // Pink
  'bg-[#90CAF9]', // Light blue
  'bg-[#B39DDB]', // Purple
  'bg-[#64B5F6]', // Blue
  'bg-[#A5D6A7]', // Green
  'bg-[#C5E1A5]', // Light green
  'bg-[#E6EE9C]', // Yellow-green
] as const;

// Category color mapping (deterministic hash-based color assignment)
export function getCategoryColor(category: string | null | undefined): string {
  if (!category) return TODO_COLORS[0];

  // Simple hash function for consistent color assignment
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % TODO_COLORS.length;
  return TODO_COLORS[index];
}

// Extract background color hex from Tailwind class (e.g., "bg-[#FFF9C4]" → "#FFF9C4")
export function extractColorHex(colorClass: string): string {
  const match = colorClass.match(/bg-\[(.+?)\]/);
  return match ? match[1] : '#FFF9C4';
}

// Get contrasting text color for category badges
export function getContrastingTextColor(bgColorClass: string): string {
  const hex = extractColorHex(bgColorClass);

  // Convert hex to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return dark or light text based on background luminance
  return luminance > 0.6 ? 'text-gray-900' : 'text-gray-100';
}

// Sort todos by sortOrder, then by creation time (ID)
export function sortTodos(todos: Task[]): Task[] {
  return [...todos].sort((a, b) => {
    // Primary sort: sortOrder (nulls last)
    const aOrder = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.sortOrder ?? Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    // Secondary sort: by ID (creation order)
    return a.id.localeCompare(b.id);
  });
}

// Group todos by category
export function groupTodosByCategory(todos: Task[]): Map<string, Task[]> {
  const groups = new Map<string, Task[]>();

  for (const todo of todos) {
    const category = todo.category || 'Uncategorized';

    if (!groups.has(category)) {
      groups.set(category, []);
    }

    groups.get(category)!.push(todo);
  }

  // Sort each group's todos
  for (const [category, categoryTodos] of groups) {
    groups.set(category, sortTodos(categoryTodos));
  }

  return groups;
}

// Get all unique categories from todos
export function getUniqueCategories(todos: Task[]): string[] {
  const categories = new Set<string>();

  for (const todo of todos) {
    if (todo.category) {
      categories.add(todo.category);
    }
  }

  return Array.from(categories).sort();
}

// Filter todos by category
export function filterTodosByCategory(
  todos: Task[],
  category: string | null
): Task[] {
  if (!category || category === 'all') {
    return todos;
  }

  return todos.filter(todo =>
    category === 'uncategorized'
      ? !todo.category
      : todo.category === category
  );
}

// Generate next sort order for new todo (insert at top)
export function getNextSortOrder(existingTodos: Task[]): number {
  if (existingTodos.length === 0) return 0;

  const minOrder = Math.min(
    ...existingTodos.map(t => t.sortOrder ?? 0)
  );

  return minOrder - 1;
}

// Recompute sort orders after reorder (0, 1, 2, 3...)
export function recomputeSortOrders(orderedTodoIds: string[], allTodos: Task[]): Array<{ id: string; sortOrder: number }> {
  return orderedTodoIds.map((id, index) => ({
    id,
    sortOrder: index,
  }));
}

// Statistics helpers
export function getTodoStats(todos: Task[]) {
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const active = total - completed;

  return {
    total,
    completed,
    active,
    completionRate: total > 0 ? (completed / total) * 100 : 0,
  };
}

// Validate todo data
export function isValidTodo(task: Partial<Task>): boolean {
  return !!(
    task.name &&
    task.name.trim().length > 0 &&
    task.isScheduled === false
  );
}

// Check if a task is a todo (unscheduled)
export function isTodo(task: Task): boolean {
  return task.isScheduled === false;
}

// Check if a task is scheduled
export function isScheduledTask(task: Task): boolean {
  return task.isScheduled !== false; // true or undefined (backwards compat)
}
