import { NextRequest, NextResponse } from 'next/server';
import {
  getCalendar,
  getOrCreateSession,
  getCalendarSessions,
  upsertTask,
  deleteTask as dbDeleteTask,
  copySessionTasks,
  createTodo,
  updateTodo,
  promoteTodoToScheduled,
} from '@/lib/db';
import { verifyPasscode } from '@/lib/crypto-utils';
import { broadcastCalendarUpdate } from '@/lib/db/events';
import { normalizeToMonday } from '@/lib/time-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

async function checkAuth(calendarId: string, request: NextRequest) {
  const calendar = await getCalendar(calendarId);
  if (!calendar) return { allowed: true, calendar: null };

  if (calendar.is_private && calendar.passcode_hash) {
    const passcode = request.headers.get('x-calendar-passcode') || request.nextUrl.searchParams.get('passcode');
    const isValid = passcode ? verifyPasscode(passcode, calendar.passcode_hash) : false;
    if (!isValid) {
      return { allowed: false, calendar };
    }
  }
  return { allowed: true, calendar };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ calendarId: string }> }
) {
  try {
    const { calendarId } = await params;
    const auth = await checkAuth(calendarId, request);
    if (!auth.allowed) {
      return NextResponse.json({ error: 'Unauthorized: Locked calendar' }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    const body = await request.json();
    const { action, weekStartDate, task, taskId, sourceSessionId } = body;

    // Handle todo-specific actions (don't require session)
    if (action === 'create_todo') {
      if (!task || !task.name) {
        return NextResponse.json({ error: 'Todo name required' }, { status: 400, headers: NO_CACHE_HEADERS });
      }
      const newTodo = await createTodo({
        calendarId,
        name: task.name,
        color: task.color || 'bg-[#FFF9C4]',
        category: task.category,
        sortOrder: task.sortOrder,
      });
      broadcastCalendarUpdate(calendarId, { type: 'TODOS_MUTATED', calendarId });
      return NextResponse.json({ success: true, task: newTodo }, { headers: NO_CACHE_HEADERS });
    }

    if (action === 'update_todo') {
      if (!taskId) {
        return NextResponse.json({ error: 'Task ID required' }, { status: 400, headers: NO_CACHE_HEADERS });
      }
      const updatedTodo = await updateTodo({
        id: taskId,
        calendarId,
        name: task?.name,
        completed: task?.completed,
        category: task?.category,
        sortOrder: task?.sortOrder,
      });
      broadcastCalendarUpdate(calendarId, { type: 'TODOS_MUTATED', calendarId });
      return NextResponse.json({ success: true, task: updatedTodo }, { headers: NO_CACHE_HEADERS });
    }

    if (action === 'promote_todo') {
      if (!taskId || !weekStartDate) {
        return NextResponse.json({ error: 'Task ID and week required' }, { status: 400, headers: NO_CACHE_HEADERS });
      }
      const targetWeek = normalizeToMonday(weekStartDate);
      const session = await getOrCreateSession(calendarId, targetWeek);
      if (!session) {
        return NextResponse.json({ error: 'Could not resolve session' }, { status: 500, headers: NO_CACHE_HEADERS });
      }

      const promotedTask = await promoteTodoToScheduled({
        id: taskId,
        calendarId,
        sessionId: session.id,
        startTime: task.startTime,
        endTime: task.endTime,
        startHour: task.startHour,
        duration: task.duration,
        days: task.days,
      });
      broadcastCalendarUpdate(calendarId, { type: 'TASKS_MUTATED', calendarId });
      broadcastCalendarUpdate(calendarId, { type: 'TODOS_MUTATED', calendarId });
      return NextResponse.json({ success: true, task: promotedTask }, { headers: NO_CACHE_HEADERS });
    }

    // For scheduled task actions, require session
    const targetWeek = normalizeToMonday(weekStartDate);
    const session = await getOrCreateSession(calendarId, targetWeek);

    if (!session) {
      return NextResponse.json({ error: 'Could not resolve session' }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    if (action === 'copy_previous') {
      const sessions = await getCalendarSessions(calendarId);
      const prevSession = sourceSessionId
        ? sessions.find((s) => s.id === sourceSessionId)
        : sessions.find((s) => s.id !== session.id);

      if (!prevSession) {
        return NextResponse.json({ error: 'No previous session found to copy' }, { status: 400, headers: NO_CACHE_HEADERS });
      }

      const copied = await copySessionTasks(calendarId, prevSession.id, session.id);
      broadcastCalendarUpdate(calendarId, { type: 'TASKS_MUTATED', calendarId });
      return NextResponse.json({ success: true, count: copied.length }, { headers: NO_CACHE_HEADERS });
    }

    if (action === 'delete') {
      const idToDelete = taskId || task?.id;
      if (!idToDelete) {
        return NextResponse.json({ error: 'Task ID required' }, { status: 400, headers: NO_CACHE_HEADERS });
      }
      await dbDeleteTask(idToDelete, calendarId);
      broadcastCalendarUpdate(calendarId, { type: 'TASKS_MUTATED', calendarId });
      return NextResponse.json({ success: true }, { headers: NO_CACHE_HEADERS });
    }

    // Default action: upsert task
    if (!task || !task.name || !task.days || task.days.length === 0) {
      return NextResponse.json({ error: 'Invalid task data' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const savedTask = await upsertTask({
      id: task.id,
      calendarId,
      sessionId: session.id,
      name: task.name,
      startTime: task.startTime,
      endTime: task.endTime,
      startHour: task.startHour,
      duration: task.duration,
      completed: task.completed,
      completedDays: task.completedDays,
      days: task.days,
      color: task.color,
      reminderOffset: task.reminderOffset,
    });

    broadcastCalendarUpdate(calendarId, { type: 'TASKS_MUTATED', calendarId });
    return NextResponse.json({ success: true, task: savedTask }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('API /api/calendars/[calendarId]/tasks POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ calendarId: string }> }
) {
  try {
    const { calendarId } = await params;
    const auth = await checkAuth(calendarId, request);
    if (!auth.allowed) {
      return NextResponse.json({ error: 'Unauthorized: Locked calendar' }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    await dbDeleteTask(taskId, calendarId);
    broadcastCalendarUpdate(calendarId, { type: 'TASKS_MUTATED', calendarId });
    return NextResponse.json({ success: true }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('API /api/calendars/[calendarId]/tasks DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
