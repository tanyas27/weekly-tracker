import { NextRequest, NextResponse } from 'next/server';
import { sendWebPushNotification } from '@/lib/web-push';
import { getSubscriptionsForCalendar, removePushSubscription } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { calendarId, subscription } = body;

    let targetSubscriptions: Array<{ endpoint: string; p256dh: string; auth: string }> = [];

    if (subscription && subscription.endpoint && subscription.keys) {
      targetSubscriptions.push({
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      });
    } else if (calendarId) {
      const subs = await getSubscriptionsForCalendar(calendarId);
      targetSubscriptions = subs;
    }

    if (targetSubscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No push subscriptions found to send test notification' },
        { status: 404 }
      );
    }

    const results = await Promise.all(
      targetSubscriptions.map(async (sub) => {
        const res = await sendWebPushNotification(sub, {
          title: '🌲 DailyForest Test Notification',
          body: 'Background notifications are working perfectly! You will receive task reminders even with the app closed.',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          data: {
            url: calendarId ? `/c/${calendarId}` : '/',
            calendarId: calendarId || undefined,
          },
        });

        // Clean up expired or unsubscribed endpoints (410 Gone / 404 Not Found)
        if (res.statusCode === 410 || res.statusCode === 404) {
          await removePushSubscription(sub.endpoint);
        }

        return res;
      })
    );

    const successful = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: successful > 0,
      sentCount: successful,
      totalTargets: targetSubscriptions.length,
      results,
    });
  } catch (error) {
    console.error('Error sending test push notification:', error);
    return NextResponse.json(
      { error: 'Failed to send test push notification' },
      { status: 500 }
    );
  }
}
