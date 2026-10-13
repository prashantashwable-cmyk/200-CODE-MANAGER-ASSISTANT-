/**
 * Screen 106's aggregation maths, pure. AIEC holds no warehouse, so
 * "stock in transit" is only ever parts ordered for a particular customer's
 * site and not yet delivered there: money committed to a supplier that has
 * not yet become a billable installation.
 */

const DAY = 86_400_000;

/** Monday of the week containing this instant, as a local `yyyy-mm-dd`. */
export function weekStartOf(iso: string | number): string {
  const d = new Date(iso);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return keyOf(d);
}

export function keyOf(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDaysToKey(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return keyOf(new Date(y, m - 1, d + n));
}

export type ArrivalWindow = 'overdue' | 'this_week' | 'next_week' | 'later';
export const ARRIVAL_WINDOWS: ArrivalWindow[] = ['overdue', 'this_week', 'next_week', 'later'];

/** Where an expected arrival falls relative to today. */
export function windowOf(arrivalIso: string, now: number): ArrivalWindow {
  const arrival = new Date(arrivalIso).getTime();
  if (arrival < now) return 'overdue';
  const thisWeek = weekStartOf(now);
  const week = weekStartOf(arrival);
  if (week === thisWeek) return 'this_week';
  return week === addDaysToKey(thisWeek, 7) ? 'next_week' : 'later';
}

export interface DelayedRow {
  category: string;
  supplierId: string;
  supplierName: string;
  poId: string;
  value: number;
}

export interface CategoryPattern {
  category: string;
  suppliers: { id: string; name: string }[];
  orderCount: number;
  value: number;
}

/**
 * A category delayed at several different suppliers at once points at the
 * supply market, not at any one of them, and wants a different answer: reset
 * customers' expectations for that part generally, rather than manage one
 * supplier. One supplier repeatedly late in a category is the scorecard's job.
 */
export function categoryPatterns(rows: DelayedRow[], minSuppliers = 2): CategoryPattern[] {
  const byCategory = new Map<string, DelayedRow[]>();
  for (const row of rows) byCategory.set(row.category, [...(byCategory.get(row.category) ?? []), row]);
  const out: CategoryPattern[] = [];
  for (const [category, list] of byCategory) {
    const suppliers = new Map(list.map((r) => [r.supplierId, r.supplierName]));
    if (suppliers.size < minSuppliers) continue;
    out.push({
      category,
      suppliers: [...suppliers.entries()].map(([id, name]) => ({ id, name })),
      orderCount: new Set(list.map((r) => r.poId)).size,
      value: list.reduce((sum, r) => sum + r.value, 0),
    });
  }
  return out.sort((a, b) => b.suppliers.length - a.suppliers.length || b.value - a.value);
}

export type ReadinessStatus = 'ready' | 'on_track' | 'conflict' | 'no_job' | 'unordered';

export interface DealReadiness {
  dealId: string;
  /** When the last part is expected. Null while something is still unordered, or a
   *  deal with nothing left to arrive is ready now. */
  readyBy: string | null;
  confidence: 'confirmed' | 'tracker' | 'estimate';
  installStart: string | null;
  status: ReadinessStatus;
}

/** Whether the parts beat the install: the one question an installation date must pass. */
export function readinessStatus(readyBy: string | null, installStart: string | null, unordered: boolean, now: number): ReadinessStatus {
  if (unordered) return 'unordered';
  if (!installStart) return readyBy && new Date(readyBy).getTime() > now ? 'no_job' : 'ready';
  if (!readyBy || new Date(readyBy).getTime() <= now) return 'ready';
  return new Date(readyBy).getTime() > new Date(installStart).getTime() ? 'conflict' : 'on_track';
}

export interface CapacityWeek {
  weekStart: string;
  /** Deals whose every part is expected on site by the end of this week. */
  readyByEnd: number;
  /** Deals that become ready during this week. */
  newlyReady: number;
  /** Installations already booked to start this week. */
  scheduledStarts: number;
  /** Of those, how many are booked before their parts would arrive. */
  conflicts: number;
}

export function capacityWeeks(deals: DealReadiness[], now: number, weeks = 6): CapacityWeek[] {
  const first = weekStartOf(now);
  const out: CapacityWeek[] = [];
  for (let i = 0; i < weeks; i += 1) {
    const weekStart = addDaysToKey(first, i * 7);
    const endMs = new Date(`${addDaysToKey(weekStart, 7)}T00:00:00`).getTime();
    const startMs = new Date(`${weekStart}T00:00:00`).getTime();
    const readyMs = (d: DealReadiness) => (d.status === 'unordered' ? Infinity : d.readyBy ? Math.max(new Date(d.readyBy).getTime(), now) : now);
    const starts = deals.filter((d) => d.installStart && new Date(d.installStart).getTime() >= startMs && new Date(d.installStart).getTime() < endMs);
    out.push({
      weekStart,
      readyByEnd: deals.filter((d) => readyMs(d) < endMs).length,
      newlyReady: deals.filter((d) => readyMs(d) >= startMs && readyMs(d) < endMs).length,
      scheduledStarts: starts.length,
      conflicts: starts.filter((d) => d.status === 'conflict').length,
    });
  }
  return out;
}

export const daysBetween = (aIso: string, bIso: string) => Math.round((new Date(bIso).getTime() - new Date(aIso).getTime()) / DAY);
