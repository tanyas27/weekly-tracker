import { EventEmitter } from 'events';

class CalendarBroadcaster extends EventEmitter {}

const globalBroadcaster =
  (globalThis as unknown as Record<string, unknown>).__calendarBroadcaster as CalendarBroadcaster ||
  new CalendarBroadcaster();
globalBroadcaster.setMaxListeners(100);
(globalThis as unknown as Record<string, unknown>).__calendarBroadcaster = globalBroadcaster;

import { publishCalendarEvent } from '@/lib/realtime/ably-server';

export function broadcastCalendarUpdate(calendarId: string, payload: unknown) {
  globalBroadcaster.emit(`update:${calendarId}`, payload);
  // Also broadcast to Ably real-time subscribers if configured
  if (payload && typeof payload === 'object') {
    publishCalendarEvent(calendarId, 'update', payload as Record<string, unknown>).catch(() => {});
  }
}

export function subscribeCalendarUpdates(calendarId: string, listener: (payload: unknown) => void) {
  const eventName = `update:${calendarId}`;
  globalBroadcaster.on(eventName, listener);
  return () => {
    globalBroadcaster.off(eventName, listener);
  };
}
