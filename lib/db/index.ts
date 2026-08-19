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
  session_id: string | null; // Nullable for global todos
  name: string;
  start_time: string | null; // Nullable for todos
  end_time: string | null; // Nullable for todos
  start_hour: number | null; // Nullable for todos
  duration: number | null; // Nullable for todos
  completed: boolean;
  completed_days: string[];
  days: string[];
  color: string;
  reminder_offset?: number | null;
  updated_at: string;
  // Todo support fields
  is_scheduled?: boolean;
  category?: string | null;
  sort_order?: number | null;
}

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }
  return neon(connectionString);
}

let hasInitializedTasksTable = false;
export async function ensureTasksSchema() {
  if (hasInitializedTasksTable) return;
  const sql = getSql();
  if (!sql) return;
  try {
    await sql`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_offset INTEGER;
    `;
    hasInitializedTasksTable = true;
  } catch (error) {
    console.error('Failed to ensure tasks schema:', error);
  }
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
    await ensureTasksSchema();
    const rows = await sql`
      SELECT id, calendar_id, session_id, name, start_time, end_time, start_hour, duration, completed, completed_days, days, color, reminder_offset, updated_at, is_scheduled, category, sort_order
      FROM tasks
      WHERE session_id = ${sessionId}::uuid
        AND (is_scheduled IS NULL OR is_scheduled = TRUE)
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
  reminderOffset?: number | null;
}): Promise<TaskRow | null> {
  const sql = getSql();
  if (!sql) return null;
  try {
    await ensureTasksSchema();
    const taskId = task.id || nanoid(16);
    const cleanName = sanitizeTaskName(task.name);
    const completedDays = task.completedDays || [];
    const isCompleted = task.completed ?? (completedDays.length === task.days.length && task.days.length > 0);
    const reminderOffset = task.reminderOffset !== undefined ? task.reminderOffset : null;

    const rows = await sql`
      INSERT INTO tasks (
        id, calendar_id, session_id, name, start_time, end_time, start_hour, duration, completed, completed_days, days, color, reminder_offset, updated_at, is_scheduled
      )
      VALUES (
        ${taskId}, ${task.calendarId}, ${task.sessionId}::uuid, ${cleanName}, ${task.startTime}, ${task.endTime},
        ${task.startHour}, ${task.duration}, ${isCompleted}, ${completedDays}, ${task.days}, ${task.color}, ${reminderOffset}, NOW(), TRUE
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
        reminder_offset = EXCLUDED.reminder_offset,
        updated_at = NOW()
      RETURNING id, calendar_id, session_id, name, start_time, end_time, start_hour, duration, completed, completed_days, days, color, reminder_offset, updated_at, is_scheduled, category, sort_order
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
      // Skip unscheduled todos when copying
      if (!st.start_time || !st.end_time || st.start_hour === null || st.duration === null) {
        continue;
      }

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
        color: st.color,
        reminderOffset: st.reminder_offset !== undefined && st.reminder_offset !== null ? Number(st.reminder_offset) : undefined,
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

export async function updateCalendarTitle(calendarId: string, title: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  try {
    const cleanTitle = title.trim();
    if (!cleanTitle) return false;
    await sql`
      INSERT INTO calendars (id, title)
      VALUES (${calendarId}, ${cleanTitle})
      ON CONFLICT (id) DO UPDATE SET title = ${cleanTitle}, updated_at = NOW()
    `;
    return true;
  } catch (error) {
    console.error('Database updateCalendarTitle error:', error);
    return false;
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
  timezone?: string;
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
        timezone TEXT DEFAULT 'UTC',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    await sql`
      ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
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
  timezone?: string;
}): Promise<PushSubscriptionRow | null> {
  const sql = getSql();
  if (!sql) return null;
  try {
    await ensurePushTableExists();
    if (sub.calendarId) {
      await createCalendar(sub.calendarId);
    }
    const id = nanoid(16);
    const userTz = sub.timezone || 'UTC';
    const rows = await sql`
      INSERT INTO push_subscriptions (id, calendar_id, endpoint, p256dh, auth, timezone, last_active_at)
      VALUES (${id}, ${sub.calendarId || null}, ${sub.endpoint}, ${sub.p256dh}, ${sub.auth}, ${userTz}, NOW())
      ON CONFLICT (endpoint) DO UPDATE SET
        calendar_id = COALESCE(EXCLUDED.calendar_id, push_subscriptions.calendar_id),
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        timezone = COALESCE(EXCLUDED.timezone, push_subscriptions.timezone),
        last_active_at = NOW()
      RETURNING id, calendar_id, endpoint, p256dh, auth, timezone, created_at, last_active_at
    `;
    return (rows[0] as PushSubscriptionRow) || null;
  } catch (err) {
    console.error('Database savePushSubscription error:', err);
    return null;
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
      SELECT id, calendar_id, endpoint, p256dh, auth, timezone, created_at, last_active_at
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
      SELECT id, calendar_id, endpoint, p256dh, auth, timezone, created_at, last_active_at
      FROM push_subscriptions
    `;
    return (rows as PushSubscriptionRow[]) || [];
  } catch (error) {
    console.error('Database getAllPushSubscriptions error:', error);
    return [];
  }
}

// ============================================================================
// TODO LIST SUPPORT FUNCTIONS
// ============================================================================

/**
 * Get all unscheduled todos for a calendar (global, not tied to a specific week)
 */
export async function getUnscheduledTasks(calendarId: string): Promise<TaskRow[]> {
  const sql = getSql();
  if (!sql) return [];
  try {
    const rows = await sql`
      SELECT id, calendar_id, session_id, name, start_time, end_time, start_hour, duration,
             completed, completed_days, days, color, updated_at, is_scheduled, category, sort_order
      FROM tasks
      WHERE calendar_id = ${calendarId}
        AND is_scheduled = FALSE
      ORDER BY sort_order ASC NULLS LAST, updated_at DESC
    `;
    return (rows as TaskRow[]) || [];
  } catch (error) {
    console.error('Database getUnscheduledTasks error:', error);
    return [];
  }
}

/**
 * Create a new unscheduled todo
 */
export async function createTodo(task: {
  calendarId: string;
  name: string;
  color: string;
  category?: string | null;
  sortOrder?: number;
}): Promise<TaskRow | null> {
  const sql = getSql();
  if (!sql) return null;
  try {
    const todoId = nanoid(16);
    const cleanName = sanitizeTaskName(task.name);

    const rows = await sql`
      INSERT INTO tasks (
        id, calendar_id, session_id, name, is_scheduled, category, sort_order,
        color, completed, completed_days, days, updated_at
      )
      VALUES (
        ${todoId}, ${task.calendarId}, NULL, ${cleanName}, FALSE, ${task.category || null},
        ${task.sortOrder !== undefined ? task.sortOrder : null},
        ${task.color}, FALSE, ${[]}, ${[]}, NOW()
      )
      RETURNING id, calendar_id, session_id, name, start_time, end_time, start_hour, duration,
                completed, completed_days, days, color, updated_at, is_scheduled, category, sort_order
    `;
    return (rows[0] as TaskRow) || null;
  } catch (error) {
    console.error('Database createTodo error:', error);
    return null;
  }
}

/**
 * Update an existing todo (name, category, completion, etc.)
 */
export async function updateTodo(task: {
  id: string;
  calendarId: string;
  name?: string;
  completed?: boolean;
  category?: string | null;
  sortOrder?: number | null;
}): Promise<TaskRow | null> {
  const sql = getSql();
  if (!sql) return null;
  try {
    // Build update object based on provided fields
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (task.name !== undefined) {
      updates.name = sanitizeTaskName(task.name);
    }
    if (task.completed !== undefined) {
      updates.completed = task.completed;
    }
    if (task.category !== undefined) {
      updates.category = task.category;
    }
    if (task.sortOrder !== undefined) {
      updates.sort_order = task.sortOrder;
    }

    if (Object.keys(updates).length === 1) {
      // Only updated_at, no real changes - just fetch current
      const rows = await sql`
        SELECT id, calendar_id, session_id, name, start_time, end_time, start_hour, duration,
               completed, completed_days, days, color, updated_at, is_scheduled, category, sort_order
        FROM tasks
        WHERE id = ${task.id} AND calendar_id = ${task.calendarId}
      `;
      return (rows[0] as TaskRow) || null;
    }

    // Use conditional update based on which fields are provided
    let rows;
    if (task.name !== undefined && task.completed === undefined && task.category === undefined && task.sortOrder === undefined) {
      rows = await sql`
        UPDATE tasks
        SET name = ${updates.name}, updated_at = NOW()
        WHERE id = ${task.id} AND calendar_id = ${task.calendarId}
        RETURNING id, calendar_id, session_id, name, start_time, end_time, start_hour, duration,
                  completed, completed_days, days, color, updated_at, is_scheduled, category, sort_order
      `;
    } else if (task.completed !== undefined && task.name === undefined && task.category === undefined && task.sortOrder === undefined) {
      rows = await sql`
        UPDATE tasks
        SET completed = ${updates.completed}, updated_at = NOW()
        WHERE id = ${task.id} AND calendar_id = ${task.calendarId}
        RETURNING id, calendar_id, session_id, name, start_time, end_time, start_hour, duration,
                  completed, completed_days, days, color, updated_at, is_scheduled, category, sort_order
      `;
    } else if (task.category !== undefined && task.name === undefined && task.completed === undefined && task.sortOrder === undefined) {
      rows = await sql`
        UPDATE tasks
        SET category = ${updates.category}, updated_at = NOW()
        WHERE id = ${task.id} AND calendar_id = ${task.calendarId}
        RETURNING id, calendar_id, session_id, name, start_time, end_time, start_hour, duration,
                  completed, completed_days, days, color, updated_at, is_scheduled, category, sort_order
      `;
    } else if (task.sortOrder !== undefined && task.name === undefined && task.completed === undefined && task.category === undefined) {
      rows = await sql`
        UPDATE tasks
        SET sort_order = ${updates.sort_order}, updated_at = NOW()
        WHERE id = ${task.id} AND calendar_id = ${task.calendarId}
        RETURNING id, calendar_id, session_id, name, start_time, end_time, start_hour, duration,
                  completed, completed_days, days, color, updated_at, is_scheduled, category, sort_order
      `;
    } else {
      // Multiple fields - update all provided ones
      rows = await sql`
        UPDATE tasks
        SET name = COALESCE(${task.name !== undefined ? updates.name : null}, name),
            completed = COALESCE(${task.completed !== undefined ? updates.completed : null}, completed),
            category = ${task.category !== undefined ? updates.category : sql`category`},
            sort_order = ${task.sortOrder !== undefined ? updates.sort_order : sql`sort_order`},
            updated_at = NOW()
        WHERE id = ${task.id} AND calendar_id = ${task.calendarId}
        RETURNING id, calendar_id, session_id, name, start_time, end_time, start_hour, duration,
                  completed, completed_days, days, color, updated_at, is_scheduled, category, sort_order
      `;
    }

    return (rows[0] as TaskRow) || null;
  } catch (error) {
    console.error('Database updateTodo error:', error);
    return null;
  }
}

/**
 * Promote a todo to a scheduled task by adding time information
 */
export async function promoteTodoToScheduled(task: {
  id: string;
  calendarId: string;
  sessionId: string;
  startTime: string;
  endTime: string;
  startHour: number;
  duration: number;
  days: string[];
}): Promise<TaskRow | null> {
  const sql = getSql();
  if (!sql) return null;
  try {
    const rows = await sql`
      UPDATE tasks
      SET
        is_scheduled = TRUE,
        session_id = ${task.sessionId}::uuid,
        start_time = ${task.startTime},
        end_time = ${task.endTime},
        start_hour = ${task.startHour},
        duration = ${task.duration},
        days = ${task.days},
        completed_days = ${[]},
        updated_at = NOW()
      WHERE id = ${task.id} AND calendar_id = ${task.calendarId}
      RETURNING id, calendar_id, session_id, name, start_time, end_time, start_hour, duration,
                completed, completed_days, days, color, updated_at, is_scheduled, category, sort_order
    `;
    return (rows[0] as TaskRow) || null;
  } catch (error) {
    console.error('Database promoteTodoToScheduled error:', error);
    return null;
  }
}

/**
 * Bulk update sort orders for manual reordering
 */
export async function bulkUpdateSortOrder(
  calendarId: string,
  ordering: Array<{ id: string; sortOrder: number }>
): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  try {
    // Build CASE statement for efficient bulk update
    const caseStatements = ordering
      .map((item, idx) => `WHEN id = '${item.id}' THEN ${item.sortOrder}`)
      .join(' ');

    const ids = ordering.map(item => item.id);

    if (ids.length === 0) return true;

    await sql`
      UPDATE tasks
      SET sort_order = CASE ${sql.unsafe(caseStatements)} END,
          updated_at = NOW()
      WHERE calendar_id = ${calendarId}
        AND id = ANY(${ids})
    `;

    return true;
  } catch (error) {
    console.error('Database bulkUpdateSortOrder error:', error);
    return false;
  }
}
