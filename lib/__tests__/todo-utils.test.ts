import { describe, it, expect } from 'vitest';
import {
  sortTodos,
  groupTodosByCategory,
  getUniqueCategories,
  filterTodosByCategory,
  getTodoStats,
  getNextSortOrder,
} from '../todo-utils';
import { taskRowToTask, TaskRow } from '../db';
import type { Task } from '../../types/task';

describe('todo-utils', () => {
  const sampleTodos: Task[] = [
    {
      id: 'todo-2',
      name: 'Second Todo',
      startTime: '',
      endTime: '',
      startHour: 0,
      duration: 0,
      completed: false,
      completedDays: [],
      days: [],
      color: 'bg-[#FFF9C4]',
      isScheduled: false,
      category: 'Work',
      sortOrder: 1,
    },
    {
      id: 'todo-1',
      name: 'First Todo',
      startTime: '',
      endTime: '',
      startHour: 0,
      duration: 0,
      completed: true,
      completedDays: [],
      days: [],
      color: 'bg-[#FFE082]',
      isScheduled: false,
      category: 'Personal',
      sortOrder: 0,
    },
    {
      id: 'todo-3',
      name: 'Third Todo',
      startTime: '',
      endTime: '',
      startHour: 0,
      duration: 0,
      completed: false,
      completedDays: [],
      days: [],
      color: 'bg-[#FFCC80]',
      isScheduled: false,
      category: null,
      sortOrder: 2,
    },
  ];

  it('correctly sorts todos by sortOrder and id', () => {
    const sorted = sortTodos(sampleTodos);
    expect(sorted[0].id).toBe('todo-1');
    expect(sorted[1].id).toBe('todo-2');
    expect(sorted[2].id).toBe('todo-3');
  });

  it('groups todos by category', () => {
    const grouped = groupTodosByCategory(sampleTodos);
    expect(grouped.get('Work')?.length).toBe(1);
    expect(grouped.get('Personal')?.length).toBe(1);
    expect(grouped.get('Uncategorized')?.length).toBe(1);
  });

  it('extracts unique categories', () => {
    const categories = getUniqueCategories(sampleTodos);
    expect(categories).toContain('Work');
    expect(categories).toContain('Personal');
    expect(categories.length).toBe(2);
  });

  it('filters todos by category', () => {
    expect(filterTodosByCategory(sampleTodos, 'all').length).toBe(3);
    expect(filterTodosByCategory(sampleTodos, 'Work').length).toBe(1);
    expect(filterTodosByCategory(sampleTodos, 'uncategorized').length).toBe(1);
  });

  it('calculates todo stats accurately', () => {
    const stats = getTodoStats(sampleTodos);
    expect(stats.total).toBe(3);
    expect(stats.completed).toBe(1);
    expect(stats.active).toBe(2);
  });

  it('calculates next sort order properly (insert at top)', () => {
    expect(getNextSortOrder(sampleTodos)).toBe(-1);
    expect(getNextSortOrder([])).toBe(0);
  });
});

describe('taskRowToTask mapping', () => {
  it('correctly converts snake_case TaskRow to camelCase Task', () => {
    const row: TaskRow = {
      id: 't-123',
      calendar_id: 'cal-abc',
      session_id: null,
      name: 'Buy milk',
      start_time: null,
      end_time: null,
      start_hour: null,
      duration: null,
      completed: false,
      completed_days: [],
      days: [],
      color: 'bg-[#FFF9C4]',
      updated_at: '2026-08-19T00:00:00Z',
      is_scheduled: false,
      category: 'Groceries',
      sort_order: 5,
    };

    const task = taskRowToTask(row);
    expect(task.id).toBe('t-123');
    expect(task.name).toBe('Buy milk');
    expect(task.isScheduled).toBe(false);
    expect(task.category).toBe('Groceries');
    expect(task.sortOrder).toBe(5);
    expect(task.startTime).toBe('');
    expect(task.endTime).toBe('');
    expect(task.startHour).toBe(0);
    expect(task.duration).toBe(0);
  });

  it('correctly converts scheduled task row to Task with isScheduled: true', () => {
    const row: TaskRow = {
      id: 't-456',
      calendar_id: 'cal-abc',
      session_id: 'sess-123',
      name: 'Team Standup',
      start_time: '09:00',
      end_time: '10:00',
      start_hour: 9,
      duration: 1,
      completed: true,
      completed_days: ['MON'],
      days: ['MON', 'WED'],
      color: 'bg-[#FFE082]',
      updated_at: '2026-08-19T00:00:00Z',
      is_scheduled: true,
      category: 'Work',
      sort_order: null,
    };

    const task = taskRowToTask(row);
    expect(task.id).toBe('t-456');
    expect(task.name).toBe('Team Standup');
    expect(task.isScheduled).toBe(true);
    expect(task.startTime).toBe('09:00');
    expect(task.endTime).toBe('10:00');
    expect(task.startHour).toBe(9);
    expect(task.duration).toBe(1);
    expect(task.completed).toBe(true);
  });
});
