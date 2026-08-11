import { NextRequest, NextResponse } from 'next/server';
import { getCalendar, createCalendar, updateCalendarPrivacy } from '@/lib/db';
import { hashPasscode, verifyPasscode } from '@/lib/crypto-utils';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/rate-limiter';
import { broadcastCalendarUpdate } from '@/lib/db/events';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ calendarId: string }> }
) {
  try {
    const { calendarId } = await params;
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown-client';
    const rateLimitKey = `${calendarId}:${clientIp}`;

    const limitCheck = checkRateLimit(rateLimitKey);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed attempts. Locked out for ${limitCheck.retryAfterSeconds} seconds.`,
          retryAfterSeconds: limitCheck.retryAfterSeconds,
        },
        { status: 429, headers: NO_CACHE_HEADERS }
      );
    }

    let calendar = await getCalendar(calendarId);
    if (!calendar) {
      calendar = await createCalendar(calendarId);
    }

    const body = await request.json();
    const { action, passcode, currentPasscode, isPrivate, newPasscode } = body;

    if (action === 'verify') {
      if (!calendar || !calendar.is_private || !calendar.passcode_hash) {
        return NextResponse.json({ success: true, verified: true }, { headers: NO_CACHE_HEADERS });
      }

      if (!passcode) {
        recordFailedAttempt(rateLimitKey);
        return NextResponse.json({ success: false, error: 'Passcode required' }, { status: 400, headers: NO_CACHE_HEADERS });
      }

      const isValid = verifyPasscode(passcode, calendar.passcode_hash);
      if (isValid) {
        resetRateLimit(rateLimitKey);
        return NextResponse.json({ success: true, verified: true }, { headers: NO_CACHE_HEADERS });
      } else {
        recordFailedAttempt(rateLimitKey);
        return NextResponse.json({ success: false, error: 'Invalid passcode' }, { status: 401, headers: NO_CACHE_HEADERS });
      }
    }

    if (action === 'update') {
      if (calendar && calendar.is_private && calendar.passcode_hash) {
        if (!currentPasscode || !verifyPasscode(currentPasscode, calendar.passcode_hash)) {
          recordFailedAttempt(rateLimitKey);
          return NextResponse.json({ success: false, error: 'Current passcode is incorrect' }, { status: 401, headers: NO_CACHE_HEADERS });
        }
      }

      const targetIsPrivate = Boolean(isPrivate);
      let newHash: string | null = null;

      if (targetIsPrivate) {
        if (!newPasscode || newPasscode.trim().length < 4) {
          return NextResponse.json(
            { success: false, error: 'New passcode must be at least 4 characters' },
            { status: 400, headers: NO_CACHE_HEADERS }
          );
        }
        newHash = hashPasscode(newPasscode.trim());
      }

      await updateCalendarPrivacy(calendarId, targetIsPrivate, newHash);
      broadcastCalendarUpdate(calendarId, { type: 'PRIVACY_UPDATED', calendarId, isPrivate: targetIsPrivate });
      resetRateLimit(rateLimitKey);
      return NextResponse.json({ success: true, isPrivate: targetIsPrivate }, { headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('API /api/calendars/[calendarId]/privacy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
