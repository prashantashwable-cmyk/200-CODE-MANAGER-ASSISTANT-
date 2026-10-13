import { addDaysKey, dateKey, parseKey } from '@/features/logistics/deliverySlots';

/**
 * Pure calendar geometry shared by every calendar-layout screen. Dates are
 * `yyyy-mm-dd` keys; weeks start on Monday, as they do on an Indian site.
 */

export type CalendarMode = 'month' | 'week' | 'agenda';
export const CALENDAR_MODES: CalendarMode[] = ['week', 'month', 'agenda'];

export interface CalendarEvent {
  id: string;
  /** `yyyy-mm-dd`. */
  date: string;
  label: string;
  /** Colour from the app's status palette, so a colour learned elsewhere means the same here. */
  tone: 'success' | 'warning' | 'error' | 'accent' | 'emerald' | 'neutral';
}

/** The Monday on or before a date. */
export function startOfWeek(key: string): string {
  const d = parseKey(key);
  const back = (d.getDay() + 6) % 7;
  return addDaysKey(key, -back);
}

export function weekDays(key: string): string[] {
  const start = startOfWeek(key);
  return Array.from({ length: 7 }, (_, i) => addDaysKey(start, i));
}

/** Always six full weeks, so the grid doesn't jump height between months. */
export function monthGrid(key: string): string[] {
  const first = dateKey(new Date(parseKey(key).getFullYear(), parseKey(key).getMonth(), 1));
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDaysKey(start, i));
}

export function sameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

/** Step the visible range by one page of the current mode. */
export function shiftCursor(key: string, mode: CalendarMode, direction: 1 | -1): string {
  if (mode === 'month') {
    const d = parseKey(key);
    return dateKey(new Date(d.getFullYear(), d.getMonth() + direction, 1));
  }
  return addDaysKey(key, (mode === 'week' ? 7 : 14) * direction);
}

export function groupByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) map.set(e.date, [...(map.get(e.date) ?? []), e]);
  return map;
}
