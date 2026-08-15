import { NextRequest, NextResponse } from 'next/server';
import {
  getCalendar,
  getSession,
  getCalendarSessions,
  getTasksForSession,
  updateCalendarTitle,
} from '@/lib/db';
import { broadcastCalendarUpdate } from '@/lib/db/events';
import { verifyPasscode } from '@/lib/crypto-utils';
import { normalizeToMonday } from '@/lib/time-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ calendarId: string }> }
) {
  try {
    const { calendarId } = await params;
    const { searchParams } = new URL(request.url);

    const weekStartDate = normalizeToMonday(searchParams.get('week') || undefined);

    const calendar = await getCalendar(calendarId);

    if (!calendar) {
      return NextResponse.json(
        {
          calendar: { id: calendarId, title: 'My Weekly Schedule', isPrivate: false },
          isPrivate: false,
          isLocked: false,
          sessions: [],
          activeSession: null,
          tasks: [],
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // Zero-Payload Defense for Private Calendars
    if (calendar.is_private && calendar.passcode_hash) {
      const passcode = request.headers.get('x-calendar-passcode') || searchParams.get('passcode');
      const isValid = passcode ? verifyPasscode(passcode, calendar.passcode_hash) : false;
      if (!isValid) {
        return NextResponse.json(
          {
            calendar: { id: calendar.id, title: calendar.title },
            isPrivate: true,
            isLocked: true,
            sessions: [],
            activeSession: null,
            tasks: [],
          },
          { headers: NO_CACHE_HEADERS }
        );
      }
    }

    const activeSession = await getSession(calendarId, weekStartDate);
    const sessions = await getCalendarSessions(calendarId);
    const rawTasks = activeSession ? await getTasksForSession(activeSession.id) : [];

    const tasks = rawTasks.map((t) => ({
      id: t.id,
      name: t.name,
      startTime: t.start_time,
      endTime: t.end_time,
      startHour: Number(t.start_hour),
      duration: Number(t.duration),
      completed: t.completed,
      completedDays: t.completed_days || [],
      days: t.days || [],
      color: t.color,
    }));

    return NextResponse.json(
      {
        calendar: {
          id: calendar.id,
          title: calendar.title,
          isPrivate: calendar.is_private,
        },
        isPrivate: calendar.is_private,
        isLocked: false,
        sessions,
        activeSession,
        tasks,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error('API /api/calendars/[calendarId] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ calendarId: string }> }
) {
  try {
    const { calendarId } = await params;
    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title : typeof body.name === 'string' ? body.name : '';

    if (!title.trim()) {
      return NextResponse.json({ error: 'Calendar title is required' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const cleanTitle = title.trim().slice(0, 255);

    const calendar = await getCalendar(calendarId);

    // Verify passcode if calendar is private
    if (calendar?.is_private && calendar.passcode_hash) {
      const passcode = request.headers.get('x-calendar-passcode') || new URL(request.url).searchParams.get('passcode');
      const isValid = passcode ? verifyPasscode(passcode, calendar.passcode_hash) : false;
      if (!isValid) {
        return NextResponse.json({ error: 'Unauthorized: Passcode required' }, { status: 401, headers: NO_CACHE_HEADERS });
      }
    }

    const success = await updateCalendarTitle(calendarId, cleanTitle);
    if (!success) {
      return NextResponse.json({ error: 'Failed to update calendar title' }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    broadcastCalendarUpdate(calendarId, {
      type: 'CALENDAR_UPDATED',
      calendarId,
      title: cleanTitle,
    });

    return NextResponse.json(
      {
        success: true,
        calendar: {
          id: calendarId,
          title: cleanTitle,
          isPrivate: calendar?.is_private || false,
        },
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error('API PATCH /api/calendars/[calendarId] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
