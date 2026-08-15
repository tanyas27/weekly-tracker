import { NextRequest, NextResponse } from 'next/server';
import { savePushSubscription, removePushSubscription } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, calendarId } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Invalid push subscription payload' },
        { status: 400 }
      );
    }

    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    if (!p256dh || !auth) {
      return NextResponse.json(
        { error: 'Missing p256dh or auth keys in push subscription' },
        { status: 400 }
      );
    }

    const saved = await savePushSubscription({
      calendarId: calendarId || undefined,
      endpoint,
      p256dh,
      auth,
    });

    return NextResponse.json({ success: true, record: saved });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to save push subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint parameter' },
        { status: 400 }
      );
    }

    const removed = await removePushSubscription(endpoint);
    return NextResponse.json({ success: removed });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to remove push subscription' },
      { status: 500 }
    );
  }
}
