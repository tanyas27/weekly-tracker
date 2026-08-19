import { NextRequest, NextResponse } from 'next/server';
import { getCalendar, getUnscheduledTasks } from '@/lib/db';
import { verifyPasscode } from '@/lib/crypto-utils';

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

/**
 * GET /api/calendars/[calendarId]/todos
 * Fetch all unscheduled todos for a calendar
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ calendarId: string }> }
) {
  try {
    const { calendarId } = await params;
    const auth = await checkAuth(calendarId, request);
    if (!auth.allowed) {
      return NextResponse.json({ error: 'Unauthorized: Locked calendar' }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    const todos = await getUnscheduledTasks(calendarId);
    return NextResponse.json({ todos }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('API /api/calendars/[calendarId]/todos GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
