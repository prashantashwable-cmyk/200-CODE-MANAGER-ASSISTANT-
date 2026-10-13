/**
 * The warranty and AMC registration's rules, pure (139). Three layers are kept distinct everywhere they are shown: the manufacturer's warranty
 * on parts (read from each installed part's own supplier agreement, so a substituted part carries its own terms, not the planned part's), AIEC's
 * own service warranty on the installation, and the optional AMC. Nothing is generic boilerplate: the terms are read from what was sold and what
 * was installed at this site.
 *
 * The service-warranty length, the visits each AMC tier includes, and the reminder cadence are AIEC's own placeholder business decisions, kept
 * here in one place. AMC prices are never set here: they are read from the Pricing Rules' AMC tiers.
 */
export type AmcTierId = 'basic' | 'standard' | 'comprehensive';
export const TIERS: AmcTierId[] = ['basic', 'standard', 'comprehensive'];

/** AIEC's own warranty on the workmanship of the installation. A placeholder until AIEC decides. */
export const SERVICE_WARRANTY_MONTHS = 12;
/** Routine visits a year each tier includes. Placeholders: only the price and response time are configured centrally. */
export const INCLUDED_VISITS: Record<AmcTierId, number> = { basic: 2, standard: 4, comprehensive: 12 };
export const MAX_EXTRA_VISITS = 12;
export const NOTE_MIN = 15;

/** Days before an end date that a customer is reminded, and when a declined or postponed AMC is gently raised again. */
export const WARRANTY_ENDING_DAYS = [60, 30];
export const AMC_RENEWAL_DAYS = [60, 30, 7];
export const REENGAGE_AFTER_DAYS: Record<'later' | 'declined', number[]> = { later: [90, 180], declined: [180] };

const DAY = 86_400_000;

/** yyyy-mm-dd plus whole months, clamped to the end of a shorter month. */
export function addMonths(key: string, months: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const total = (m - 1) + months;
  const year = y + Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`;
}
/** The last covered day: the day before the same date N months on. */
export function endOfTerm(startKey: string, months: number): string {
  return addDays(addMonths(startKey, months), -1);
}
export function addDays(key: string, n: number): string {
  return new Date(new Date(`${key}T12:00:00Z`).getTime() + n * DAY).toISOString().slice(0, 10);
}

/** An AMC with extra visits costs pro rata on its own tier's price, so nothing is improvised per customer. */
export function amcPrice(tier: { annualPrice: number }, tierId: AmcTierId, extraVisits: number): number {
  return tier.annualPrice + Math.round((extraVisits * tier.annualPrice) / INCLUDED_VISITS[tierId]);
}

export interface ReminderDef {
  kind: 'warranty_ending' | 'amc_renewal' | 'amc_reengage';
  dueAt: string;
}

/** Every reminder a registration sets up by itself: only those still in the future are scheduled. */
export function reminderPlan(i: { registeredAt: string; serviceEnd: string; amc: { status: 'active' | 'later' | 'declined'; endsOn?: string } | null }): ReminderDef[] {
  const out: ReminderDef[] = [];
  const at = (key: string, daysBefore: number): string => new Date(`${addDays(key, -daysBefore)}T09:00:00Z`).toISOString();
  if (!i.amc || i.amc.status !== 'active') for (const d of WARRANTY_ENDING_DAYS) out.push({ kind: 'warranty_ending', dueAt: at(i.serviceEnd, d) });
  if (i.amc?.status === 'active' && i.amc.endsOn) for (const d of AMC_RENEWAL_DAYS) out.push({ kind: 'amc_renewal', dueAt: at(i.amc.endsOn, d) });
  if (i.amc && i.amc.status !== 'active') for (const d of REENGAGE_AFTER_DAYS[i.amc.status]) out.push({ kind: 'amc_reengage', dueAt: new Date(new Date(i.registeredAt).getTime() + d * DAY).toISOString() });
  return out.filter((r) => r.dueAt > i.registeredAt);
}

export type WarrantyProblem = 'not_ready' | 'already_registered' | 'not_registered' | 'tier_required' | 'extra_visits_invalid' | 'customization_note_required' | 'not_admin' | 'invalid_state' | 'not_found' | 'forbidden' | 'choice_required' | 'no_amc_tiers';

export function amcProblem(i: { choice: 'enrol' | 'later' | 'declined' | null; tier?: string; extraVisits: number; note?: string; isAdmin: boolean; tierExists: boolean }): WarrantyProblem | null {
  if (!i.choice) return 'choice_required';
  if (i.choice !== 'enrol') return null;
  if (!i.tier || !i.tierExists) return 'tier_required';
  if (!Number.isInteger(i.extraVisits) || i.extraVisits < 0 || i.extraVisits > MAX_EXTRA_VISITS) return 'extra_visits_invalid';
  if (i.extraVisits > 0 && !i.isAdmin) return 'not_admin';
  if (i.extraVisits > 0 && (i.note ?? '').trim().length < NOTE_MIN) return 'customization_note_required';
  return null;
}
