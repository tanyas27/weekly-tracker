import { NextRequest, NextResponse } from 'next/server';
import { getCalendar, bulkUpdateSortOrder } from '@/lib/db';
import { verifyPasscode } from '@/lib/crypto-utils';
import { broadcastCalendarUpdate } from '@/lib/db/events';

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
 * POST /api/calendars/[calendarId]/todos/reorder
 * Bulk update sort orders for manual todo reordering
 */
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
    const { todoIds } = body;

    if (!Array.isArray(todoIds) || todoIds.length === 0) {
      return NextResponse.json({ error: 'todoIds array required' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    // Map IDs to sort orders (array index = sort order)
    const ordering = todoIds.map((id: string, index: number) => ({
      id,
      sortOrder: index,
    }));

    const success = await bulkUpdateSortOrder(calendarId, ordering);

    if (!success) {
      return NextResponse.json({ error: 'Failed to update sort order' }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    broadcastCalendarUpdate(calendarId, { type: 'TODOS_MUTATED', calendarId });
    return NextResponse.json({ success: true }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('API /api/calendars/[calendarId]/todos/reorder POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
