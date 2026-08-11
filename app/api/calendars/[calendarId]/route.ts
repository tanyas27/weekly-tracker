import { NextRequest, NextResponse } from 'next/server';
import {
  getCalendar,
  getOrCreateSession,
  getCalendarSessions,
  getTasksForSession,
} from '@/lib/db';
import { verifyPasscode } from '@/lib/crypto-utils';

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

    // Get current Monday default
    const today = new Date();
    const currentDay = today.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    const defaultMondayStr = monday.toISOString().split('T')[0];

    const weekStartDate = searchParams.get('week') || defaultMondayStr;

    const calendar = await getCalendar(calendarId);

    if (!calendar) {
      return NextResponse.json(
        {
          calendar: { id: calendarId, title: 'August 2026', isPrivate: false },
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

    const activeSession = await getOrCreateSession(calendarId, weekStartDate);
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
