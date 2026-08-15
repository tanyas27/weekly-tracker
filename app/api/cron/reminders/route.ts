import { NextRequest, NextResponse } from 'next/server';
import { getAllPushSubscriptions, removePushSubscription } from '@/lib/db';
import { sendWebPushNotification } from '@/lib/web-push';
import { neon } from '@neondatabase/serverless';

const DAY_MAP = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    // Optional cron secret verification if CRON_SECRET is set
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptions = await getAllPushSubscriptions();
    if (subscriptions.length === 0) {
      return NextResponse.json({ message: 'No push subscriptions found', dispatched: 0 });
    }

    const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
    if (!sql) {
      return NextResponse.json({ error: 'Database connection unavailable' }, { status: 500 });
    }

    const now = new Date();
    const currentDay = DAY_MAP[now.getDay()];
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTotalMinutes = currentHours * 60 + currentMinutes;

    // Fetch active tasks for all subscribed calendars
    const calendarIds = Array.from(new Set(subscriptions.map((s) => s.calendar_id).filter(Boolean)));
    if (calendarIds.length === 0) {
      return NextResponse.json({ message: 'No subscribed calendars', dispatched: 0 });
    }

    const tasks = await sql`
      SELECT id, calendar_id, name, start_time, days, completed_days, color
      FROM tasks
      WHERE calendar_id = ANY(${calendarIds})
    `;

    let dispatchedCount = 0;

    for (const task of tasks) {
      if (!task.days || !task.days.includes(currentDay)) continue;
      if (task.completed_days && task.completed_days.includes(currentDay)) continue;
      if (!task.start_time) continue;

      const [startH, startM] = task.start_time.split(':').map(Number);
      if (isNaN(startH) || isNaN(startM)) continue;

      const taskTotalMinutes = startH * 60 + startM;
      const diffMinutes = taskTotalMinutes - currentTotalMinutes;

      // Notify if task starts in ~5 minutes (0 to 6 minutes window) or right now
      if (diffMinutes >= 0 && diffMinutes <= 6) {
        const matchingSubs = subscriptions.filter((s) => s.calendar_id === task.calendar_id);
        for (const sub of matchingSubs) {
          const leadTimeText = diffMinutes === 0 ? 'starting now' : `in ${diffMinutes} min`;
          const res = await sendWebPushNotification(sub, {
            title: `⏰ Reminder: ${task.name}`,
            body: `Scheduled for ${task.start_time} (${leadTimeText})`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            data: {
              url: `/c/${task.calendar_id}`,
              calendarId: task.calendar_id,
              taskId: task.id,
            },
          });

          if (res.success) {
            dispatchedCount++;
          } else if (res.statusCode === 410 || res.statusCode === 404) {
            await removePushSubscription(sub.endpoint);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      dispatched: dispatchedCount,
      subscriptionsChecked: subscriptions.length,
    });
  } catch (error) {
    console.error('Error running reminder cron:', error);
    return NextResponse.json({ error: 'Failed to process reminders' }, { status: 500 });
  }
}
