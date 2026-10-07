import { NextRequest, NextResponse } from 'next/server'
import { getCalendar } from '@/lib/db'
import { verifyPasscode } from '@/lib/crypto-utils'
import { createCalendarTokenRequest, isAblyConfigured } from '@/lib/realtime/ably-server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const calendarId = searchParams.get('calendarId')
    const passcode = request.headers.get('x-calendar-passcode') || searchParams.get('passcode')

    if (!calendarId) {
      return NextResponse.json({ error: 'calendarId parameter is required' }, { status: 400, headers: NO_CACHE_HEADERS })
    }

    if (!isAblyConfigured()) {
      return NextResponse.json({ enabled: false, message: 'Ably realtime is not configured on this server' }, { status: 200, headers: NO_CACHE_HEADERS })
    }

    const calendar = await getCalendar(calendarId)

    // Check privacy authorization
    if (calendar && calendar.is_private && calendar.passcode_hash) {
      const isValid = passcode ? verifyPasscode(passcode, calendar.passcode_hash) : false
      if (!isValid) {
        return NextResponse.json({ error: 'Unauthorized: Passcode required for private calendar' }, { status: 401, headers: NO_CACHE_HEADERS })
      }
    }

    const tokenRequest = await createCalendarTokenRequest(calendarId)
    if (!tokenRequest) {
      return NextResponse.json({ error: 'Failed to create token request' }, { status: 500, headers: NO_CACHE_HEADERS })
    }

    return NextResponse.json(tokenRequest, { headers: NO_CACHE_HEADERS })
  } catch (error) {
    console.error('API /api/realtime/token error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: NO_CACHE_HEADERS })
  }
}
