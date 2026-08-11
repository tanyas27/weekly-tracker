import { NextRequest, NextResponse } from 'next/server';
import {
  getCalendar,
  getOrCreateSession,
  getCalendarSessions,
  upsertTask,
  deleteTask as dbDeleteTask,
  copySessionTasks,
} from '@/lib/db';
import { verifyPasscode } from '@/lib/crypto-utils';
import { broadcastCalendarUpdate } from '@/lib/db/events';

async function checkAuth(calendarId: string, request: NextRequest) {
  const calendar = await getCalendar(calendarId);
  if (!calendar) return { allowed: true, calendar: null };

  if (calendar.is_private && calendar.passcode_hash) {
    const passcode = request.headers.get('x-calendar-passcode');
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
      return NextResponse.json({ error: 'Unauthorized: Locked calendar' }, { status: 401 });
    }

    const body = await request.json();
    const { action, weekStartDate, task, taskId, sourceSessionId } = body;

    const today = new Date();
    const currentDay = today.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    const defaultMondayStr = monday.toISOString().split('T')[0];

    const targetWeek = weekStartDate || defaultMondayStr;
    const session = await getOrCreateSession(calendarId, targetWeek);

    if (!session) {
      return NextResponse.json({ error: 'Could not resolve session' }, { status: 500 });
    }

    if (action === 'copy_previous') {
      const sessions = await getCalendarSessions(calendarId);
      const prevSession = sourceSessionId
        ? sessions.find((s) => s.id === sourceSessionId)
        : sessions.find((s) => s.id !== session.id);

      if (!prevSession) {
        return NextResponse.json({ error: 'No previous session found to copy' }, { status: 400 });
      }

      const copied = await copySessionTasks(calendarId, prevSession.id, session.id);
      broadcastCalendarUpdate(calendarId, { type: 'TASKS_MUTATED', calendarId });
      return NextResponse.json({ success: true, count: copied.length });
    }

    if (action === 'delete') {
      const idToDelete = taskId || task?.id;
      if (!idToDelete) {
        return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
      }
      await dbDeleteTask(idToDelete, calendarId);
      broadcastCalendarUpdate(calendarId, { type: 'TASKS_MUTATED', calendarId });
      return NextResponse.json({ success: true });
    }

    // Default action: upsert task
    if (!task || !task.name || !task.days || task.days.length === 0) {
      return NextResponse.json({ error: 'Invalid task data' }, { status: 400 });
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
    });

    broadcastCalendarUpdate(calendarId, { type: 'TASKS_MUTATED', calendarId });
    return NextResponse.json({ success: true, task: savedTask });
  } catch (error) {
    console.error('API /api/calendars/[calendarId]/tasks POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
      return NextResponse.json({ error: 'Unauthorized: Locked calendar' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    await dbDeleteTask(taskId, calendarId);
    broadcastCalendarUpdate(calendarId, { type: 'TASKS_MUTATED', calendarId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API /api/calendars/[calendarId]/tasks DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
