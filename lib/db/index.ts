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
  return name.trim();
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

export async function getSession(calendarId: string, weekStartDate: string): Promise<SessionRow | null> {
  const sql = getSql();
  if (!sql) return null;
  try {
    const rows = await sql`
      SELECT id, calendar_id, week_start_date, created_at
      FROM sessions
      WHERE calendar_id = ${calendarId} AND week_start_date = ${weekStartDate}::date
      LIMIT 1
    `;
    if (!rows || rows.length === 0) return null;
    return rows[0] as SessionRow;
  } catch (error) {
    console.error('Database getSession error:', error);
    return null;
  }
}

export async function getOrCreateSession(calendarId: string, weekStartDate: string): Promise<SessionRow | null> {
  const sql = getSql();
  if (!sql) return null;
  try {
    await createCalendar(calendarId);
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
      SELECT s.id, s.calendar_id, s.week_start_date, s.created_at
      FROM sessions s
      WHERE s.calendar_id = ${calendarId}
        AND EXISTS (SELECT 1 FROM tasks t WHERE t.session_id = s.id)
      ORDER BY s.week_start_date DESC
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

export interface PushSubscriptionRow {
  id: string;
  calendar_id: string | null;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
  last_active_at: string;
}

let hasInitializedPushTable = false;
export async function ensurePushTableExists() {
  if (hasInitializedPushTable) return;
  const sql = getSql();
  if (!sql) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id VARCHAR(64) PRIMARY KEY,
        calendar_id VARCHAR(64) REFERENCES calendars(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_push_subs_calendar_id ON push_subscriptions(calendar_id);
    `;
    hasInitializedPushTable = true;
  } catch (error) {
    console.error('Failed to ensure push_subscriptions table:', error);
  }
}

export async function savePushSubscription(sub: {
  calendarId?: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<PushSubscriptionRow | null> {
  const sql = getSql();
  if (!sql) return null;
  try {
    await ensurePushTableExists();
    if (sub.calendarId) {
      await createCalendar(sub.calendarId);
    }
    const id = nanoid(16);
    const rows = await sql`
      INSERT INTO push_subscriptions (id, calendar_id, endpoint, p256dh, auth, updated_at, last_active_at)
      VALUES (${id}, ${sub.calendarId || null}, ${sub.endpoint}, ${sub.p256dh}, ${sub.auth}, NOW(), NOW())
      ON CONFLICT (endpoint) DO UPDATE SET
        calendar_id = COALESCE(EXCLUDED.calendar_id, push_subscriptions.calendar_id),
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        last_active_at = NOW()
      RETURNING id, calendar_id, endpoint, p256dh, auth, created_at, last_active_at
    `;
    return (rows[0] as PushSubscriptionRow) || null;
  } catch (error) {
    // If column updated_at does not exist, retry standard conflict
    try {
      const id = nanoid(16);
      const rows = await sql`
        INSERT INTO push_subscriptions (id, calendar_id, endpoint, p256dh, auth, last_active_at)
        VALUES (${id}, ${sub.calendarId || null}, ${sub.endpoint}, ${sub.p256dh}, ${sub.auth}, NOW())
        ON CONFLICT (endpoint) DO UPDATE SET
          calendar_id = COALESCE(EXCLUDED.calendar_id, push_subscriptions.calendar_id),
          p256dh = EXCLUDED.p256dh,
          auth = EXCLUDED.auth,
          last_active_at = NOW()
        RETURNING id, calendar_id, endpoint, p256dh, auth, created_at, last_active_at
      `;
      return (rows[0] as PushSubscriptionRow) || null;
    } catch (retryError) {
      console.error('Database savePushSubscription error:', retryError);
      return null;
    }
  }
}

export async function removePushSubscription(endpoint: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  try {
    await ensurePushTableExists();
    await sql`
      DELETE FROM push_subscriptions
      WHERE endpoint = ${endpoint}
    `;
    return true;
  } catch (error) {
    console.error('Database removePushSubscription error:', error);
    return false;
  }
}

export async function getSubscriptionsForCalendar(calendarId: string): Promise<PushSubscriptionRow[]> {
  const sql = getSql();
  if (!sql) return [];
  try {
    await ensurePushTableExists();
    const rows = await sql`
      SELECT id, calendar_id, endpoint, p256dh, auth, created_at, last_active_at
      FROM push_subscriptions
      WHERE calendar_id = ${calendarId}
    `;
    return (rows as PushSubscriptionRow[]) || [];
  } catch (error) {
    console.error('Database getSubscriptionsForCalendar error:', error);
    return [];
  }
}

export async function getAllPushSubscriptions(): Promise<PushSubscriptionRow[]> {
  const sql = getSql();
  if (!sql) return [];
  try {
    await ensurePushTableExists();
    const rows = await sql`
      SELECT id, calendar_id, endpoint, p256dh, auth, created_at, last_active_at
      FROM push_subscriptions
    `;
    return (rows as PushSubscriptionRow[]) || [];
  } catch (error) {
    console.error('Database getAllPushSubscriptions error:', error);
    return [];
  }
}
