import { NextRequest, NextResponse } from 'next/server';
import { getAllPushSubscriptions, removePushSubscription } from '@/lib/db';
import { sendWebPushNotification } from '@/lib/web-push';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

const DAY_MAP = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function getSubscriberLocalTime(tz?: string) {
  const safeTz = tz && tz.trim() ? tz.trim() : 'UTC';
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: safeTz,
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    let weekday = 'MON';
    let hour = 0;
    let minute = 0;
    for (const part of parts) {
      if (part.type === 'weekday') weekday = part.value.toUpperCase().slice(0, 3);
      if (part.type === 'hour') hour = parseInt(part.value, 10) % 24;
      if (part.type === 'minute') minute = parseInt(part.value, 10);
    }
    return {
      day: weekday,
      totalMinutes: hour * 60 + minute,
    };
  } catch {
    const d = new Date();
    return {
      day: DAY_MAP[d.getUTCDay()],
      totalMinutes: d.getUTCHours() * 60 + d.getUTCMinutes(),
    };
  }
}

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

    // Fetch active tasks for all subscribed calendars
    const calendarIds = Array.from(new Set(subscriptions.map((s) => s.calendar_id).filter(Boolean)));
    if (calendarIds.length === 0) {
      return NextResponse.json({ message: 'No subscribed calendars', dispatched: 0 });
    }

    const tasks = await sql`
      SELECT id, calendar_id, name, start_time, days, completed_days, color, reminder_offset
      FROM tasks
      WHERE calendar_id = ANY(${calendarIds})
    `;

    let dispatchedCount = 0;
    const debugDetails: Array<Record<string, unknown>> = [];

    for (const sub of subscriptions) {
      if (!sub.calendar_id) continue;
      const tzQuery = req.nextUrl.searchParams.get('tz');
      const effectiveTz = (sub.timezone && sub.timezone !== 'UTC') ? sub.timezone : (tzQuery || sub.timezone || 'UTC');
      const subLocal = getSubscriberLocalTime(effectiveTz);
      const calendarTasks = tasks.filter((t) => t.calendar_id === sub.calendar_id);

      const taskEvaluations: Array<Record<string, unknown>> = [];

      for (const task of calendarTasks) {
        if (!task.days || !task.days.includes(subLocal.day)) {
          taskEvaluations.push({ name: task.name, skipped: `Day mismatch (task on ${task.days?.join(',')}, local is ${subLocal.day})` });
          continue;
        }
        if (task.completed_days && task.completed_days.includes(subLocal.day)) {
          taskEvaluations.push({ name: task.name, skipped: 'Already completed today' });
          continue;
        }
        if (!task.start_time) {
          taskEvaluations.push({ name: task.name, skipped: 'Missing start time' });
          continue;
        }
        if (task.reminder_offset === null) {
          taskEvaluations.push({ name: task.name, skipped: 'Reminder disabled' });
          continue;
        }

        const [startH, startM] = task.start_time.split(':').map(Number);
        if (isNaN(startH) || isNaN(startM)) continue;

        const taskTotalMinutes = startH * 60 + startM;
        const diffMinutes = taskTotalMinutes - subLocal.totalMinutes;
        const leadTime = task.reminder_offset !== undefined && task.reminder_offset !== null
          ? Number(task.reminder_offset)
          : 5;

        // Notify if task enters the reminder window (0 to leadTime + 2 minutes)
        const isDue = leadTime === 0
          ? (diffMinutes >= 0 && diffMinutes <= 2)
          : (diffMinutes >= leadTime - 1 && diffMinutes <= leadTime + 2);

        taskEvaluations.push({
          name: task.name,
          startTime: task.start_time,
          leadTimeMinutes: leadTime,
          diffMinutes,
          isDue,
        });

        if (isDue) {
          const leadTimeText = diffMinutes === 0 ? 'starting now' : `in ${diffMinutes} min`;
          const res = await sendWebPushNotification(sub, {
            title: `Reminder: ${task.name}`,
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

      debugDetails.push({
        calendarId: sub.calendar_id,
        storedTimezone: sub.timezone || 'NOT_SET (using UTC)',
        effectiveTimezone: effectiveTz,
        localCalculatedTime: `${String(Math.floor(subLocal.totalMinutes / 60)).padStart(2, '0')}:${String(subLocal.totalMinutes % 60).padStart(2, '0')} (${subLocal.day})`,
        evaluatedTasks: taskEvaluations,
      });
    }

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        dispatched: dispatchedCount,
        subscriptionsChecked: subscriptions.length,
        tasksLoaded: tasks.length,
        diagnostics: debugDetails,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error('Error running reminder cron:', error);
    return NextResponse.json({ error: 'Failed to process reminders' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
