import { EventEmitter } from 'events';

class CalendarBroadcaster extends EventEmitter {}

const globalBroadcaster =
  (globalThis as unknown as Record<string, unknown>).__calendarBroadcaster as CalendarBroadcaster ||
  new CalendarBroadcaster();
globalBroadcaster.setMaxListeners(100);
(globalThis as unknown as Record<string, unknown>).__calendarBroadcaster = globalBroadcaster;

export function broadcastCalendarUpdate(calendarId: string, payload: unknown) {
  globalBroadcaster.emit(`update:${calendarId}`, payload);
}

export function subscribeCalendarUpdates(calendarId: string, listener: (payload: unknown) => void) {
  const eventName = `update:${calendarId}`;
  globalBroadcaster.on(eventName, listener);
  return () => {
    globalBroadcaster.off(eventName, listener);
  };
}
