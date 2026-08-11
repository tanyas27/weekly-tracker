import { NextRequest } from 'next/server';
import { getCalendar } from '@/lib/db';
import { verifyPasscode } from '@/lib/crypto-utils';
import { subscribeCalendarUpdates } from '@/lib/db/events';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ calendarId: string }> }
) {
  const { calendarId } = await params;
  const calendar = await getCalendar(calendarId);

  if (calendar && calendar.is_private && calendar.passcode_hash) {
    const passcode = request.headers.get('x-calendar-passcode') || request.nextUrl.searchParams.get('passcode');
    const isValid = passcode ? verifyPasscode(passcode, calendar.passcode_hash) : false;
    if (!isValid) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const sendPing = () => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {}
      };

      const pingInterval = setInterval(sendPing, 15000);

      const unsubscribe = subscribeCalendarUpdates(calendarId, (payload) => {
        try {
          const data = `data: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {}
      });

      request.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
