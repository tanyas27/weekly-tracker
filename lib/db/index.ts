import { neon } from '@neondatabase/serverless';
import { nanoid } from 'nanoid';

export interface CalendarRow {
  id: string;
  title: string;
  is_private: boolean;
  passcode_hash: string | null;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
}

export interface SessionRow {
  id: string;
  calendar_id: string;
  week_start_date: string;
  created_at: string;
}

export interface TaskRow {
  id: string;
  calendar_id: string;
  session_id: string;
  name: string;
  start_time: string;
  end_time: string;
  start_hour: number;
  duration: number;
  completed: boolean;
  completed_days: string[];
  days: string[];
  color: string;
  updated_at: string;
}

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }
  return neon(connectionString);
}

export function sanitizeTaskName(name: string): string {
  if (!name) return '';
  return name
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

export async function getCalendar(calendarId: string): Promise<CalendarRow | null> {
  const sql = getSql();
  if (!sql) return null;
  try {
    const rows = await sql`
      SELECT id, title, is_private, passcode_hash, created_at, updated_at, last_accessed_at
      FROM calendars
      WHERE id = ${calendarId}
      LIMIT 1
    `;
    if (!rows || rows.length === 0) return null;
    return rows[0] as CalendarRow;
  } catch (error) {
    console.error('Database getCalendar error:', error);
    return null;
  }
}

export async function createCalendar(calendarId: string, title: string = 'My Weekly Schedule'): Promise<CalendarRow | null> {
  const sql = getSql();
  if (!sql) return null;
  try {
    const rows = await sql`
      INSERT INTO calendars (id, title)
      VALUES (${calendarId}, ${title})
      ON CONFLICT (id) DO UPDATE SET last_accessed_at = NOW()
      RETURNING id, title, is_private, passcode_hash, created_at, updated_at, last_accessed_at
    `;
    return (rows[0] as CalendarRow) || null;
  } catch (error) {
    console.error('Database createCalendar error:', error);
    return null;
  }
}

export async function getOrCreateSession(calendarId: string, weekStartDate: string): Promise<SessionRow | null> {
  const sql = getSql();
  if (!sql) return null;
  try {
    const rows = await sql`
      INSERT INTO sessions (calendar_id, week_start_date)
      VALUES (${calendarId}, ${weekStartDate}::date)
      ON CONFLICT (calendar_id, week_start_date) DO UPDATE SET week_start_date = EXCLUDED.week_start_date
      RETURNING id, calendar_id, week_start_date, created_at
    `;
    return (rows[0] as SessionRow) || null;
  } catch (error) {
    console.error('Database getOrCreateSession error:', error);
    return null;
  }
}

export async function getCalendarSessions(calendarId: string): Promise<SessionRow[]> {
  const sql = getSql();
  if (!sql) return [];
  try {
    const rows = await sql`
      SELECT id, calendar_id, week_start_date, created_at
      FROM sessions
      WHERE calendar_id = ${calendarId}
      ORDER BY week_start_date DESC
    `;
    return (rows as SessionRow[]) || [];
  } catch (error) {
    console.error('Database getCalendarSessions error:', error);
    return [];
  }
}

export async function getTasksForSession(sessionId: string): Promise<TaskRow[]> {
  const sql = getSql();
  if (!sql) return [];
  try {
    const rows = await sql`
      SELECT id, calendar_id, session_id, name, start_time, end_time, start_hour, duration, completed, completed_days, days, color, updated_at
      FROM tasks
      WHERE session_id = ${sessionId}::uuid
      ORDER BY start_hour ASC
    `;
    return (rows as TaskRow[]) || [];
  } catch (error) {
    console.error('Database getTasksForSession error:', error);
    return [];
  }
}

export async function upsertTask(task: {
  id?: string;
  calendarId: string;
  sessionId: string;
  name: string;
  startTime: string;
  endTime: string;
  startHour: number;
  duration: number;
  completed?: boolean;
  completedDays?: string[];
  days: string[];
  color: string;
}): Promise<TaskRow | null> {
  const sql = getSql();
  if (!sql) return null;
  try {
    const taskId = task.id || nanoid(16);
    const cleanName = sanitizeTaskName(task.name);
    const completedDays = task.completedDays || [];
    const isCompleted = task.completed ?? (completedDays.length === task.days.length && task.days.length > 0);

    const rows = await sql`
      INSERT INTO tasks (
        id, calendar_id, session_id, name, start_time, end_time, start_hour, duration, completed, completed_days, days, color, updated_at
      )
      VALUES (
        ${taskId}, ${task.calendarId}, ${task.sessionId}::uuid, ${cleanName}, ${task.startTime}, ${task.endTime},
        ${task.startHour}, ${task.duration}, ${isCompleted}, ${completedDays}, ${task.days}, ${task.color}, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        start_hour = EXCLUDED.start_hour,
        duration = EXCLUDED.duration,
        completed = EXCLUDED.completed,
        completed_days = EXCLUDED.completed_days,
        days = EXCLUDED.days,
        color = EXCLUDED.color,
        updated_at = NOW()
      RETURNING id, calendar_id, session_id, name, start_time, end_time, start_hour, duration, completed, completed_days, days, color, updated_at
    `;
    return (rows[0] as TaskRow) || null;
  } catch (error) {
    console.error('Database upsertTask error:', error);
    return null;
  }
}

export async function deleteTask(taskId: string, calendarId: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  try {
    await sql`
      DELETE FROM tasks
      WHERE id = ${taskId} AND calendar_id = ${calendarId}
    `;
    return true;
  } catch (error) {
    console.error('Database deleteTask error:', error);
    return false;
  }
}

export async function copySessionTasks(calendarId: string, sourceSessionId: string, targetSessionId: string): Promise<TaskRow[]> {
  const sql = getSql();
  if (!sql) return [];
  try {
    const sourceTasks = await getTasksForSession(sourceSessionId);
    const createdTasks: TaskRow[] = [];
    for (const st of sourceTasks) {
      const newTaskId = nanoid(16);
      const inserted = await upsertTask({
        id: newTaskId,
        calendarId,
        sessionId: targetSessionId,
        name: st.name,
        startTime: st.start_time,
        endTime: st.end_time,
        startHour: Number(st.start_hour),
        duration: Number(st.duration),
        completed: false,
        completedDays: [],
        days: st.days,
        color: st.color
      });
      if (inserted) {
        createdTasks.push(inserted);
      }
    }
    return createdTasks;
  } catch (error) {
    console.error('Database copySessionTasks error:', error);
    return [];
  }
}

export async function updateCalendarPrivacy(calendarId: string, isPrivate: boolean, passcodeHash: string | null): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  try {
    await sql`
      UPDATE calendars
      SET is_private = ${isPrivate}, passcode_hash = ${passcodeHash}, updated_at = NOW()
      WHERE id = ${calendarId}
    `;
    return true;
  } catch (error) {
    console.error('Database updateCalendarPrivacy error:', error);
    return false;
  }
}
