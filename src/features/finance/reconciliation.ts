/**
 * Screen 120's rules, pure. Reconciliation compares what the bank says happened with what the app recorded, and it is deliberately
 * the last line of financial control: it never trusts the app's own bookkeeping to check itself. It says what it could not check as
 * clearly as what it did: with no bank data it reports "could not run", never a clean pass. What could go wrong is sorted by how
 * serious it is, so a bank fee does not raise the same alarm as a payment made twice.
 */
import type { ReconExceptionKind, ReconReason, ReconRunStatus } from '@/data/types';
import { days, hours } from '@/features/sla/clock';

/** The daily run. Local time, early enough that yesterday's statement is in. */
export const RUN_HOUR = 2;
/** After a run could not run, it tries again this often until the bank answers. */
export const RETRY_AFTER = hours(1);
/** A run looks at this much of the statement and the records. */
export const WINDOW = days(30);
/** A payment the app recorded this recently may simply not be on the statement yet. Not a mismatch until then. */
export const PENDING_GRACE = days(2);
/** How far apart the two sides' dates may be and still describe the same movement. */
export const DATE_TOLERANCE = days(3);
/** Two bank lines this close together with the same amount and counterparty are one payment shown twice. */
export const DUPLICATE_WINDOW = days(2);
/** Below this a difference is rounding, and is matched. */
export const ROUNDING = 1;
/** A difference or charge up to this is a "small expected difference": listed, but not an alarm. */
export const SMALL_DIFFERENCE = 1_000;
/** The most a rounding difference can be. */
export const ROUNDING_MAX = 50;
export const NOTE_MIN = 8;
/** A serious or large difference explained by hand needs a real explanation. */
export const SERIOUS_NOTE_MIN = 20;
/** How long each kind of open exception may wait for Admin. */
export const REVIEW_DUE: Record<Severity, number> = { critical: days(1), high: days(3), low: days(7) };
/** The bank connection is expected back within this. */
export const FEED_RESTORE_DUE = days(1);

const CHARGE_PATTERN = /\b(charge|charges|fee|fees|gst on|sms|maintenance|penal|commission)\b/i;

export type Severity = 'critical' | 'high' | 'low';

export const SERIOUS_KINDS: ReconExceptionKind[] = ['duplicate_debit', 'duplicate_credit', 'recorded_twice'];
export const KINDS: ReconExceptionKind[] = ['duplicate_debit', 'duplicate_credit', 'recorded_twice', 'unrecorded_credit', 'unrecorded_debit', 'missing_in_bank', 'amount_differs', 'bank_charge'];
export const REASONS: ReconReason[] = ['bank_fee', 'rounding', 'verified'];

export interface BankLine {
  id: string;
  postedAt: string;
  direction: 'debit' | 'credit';
  amount: number;
  reference: string | null;
  narration: string;
  counterparty: string;
}

export interface LedgerLine {
  id: string;
  direction: 'in' | 'out';
  amount: number;
  date: string;
  reference: string | null;
  counterparty: string;
}

export interface RawException {
  key: string;
  kind: ReconExceptionKind;
  direction: 'in' | 'out';
  amount: number;
  difference: number | null;
  bankId: string | null;
  ledgerId: string | null;
  reference: string | null;
  counterparty: string;
  occurredAt: string;
}

export interface Outcome {
  matches: { bankId: string; ledgerId: string; difference: number }[];
  exceptions: RawException[];
  pending: string[];
}

const ms = (iso: string) => new Date(iso).getTime();
export const normRef = (r: string | null): string | null => {
  const n = (r ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return n || null;
};
const sameSide = (b: BankLine, l: LedgerLine) => (b.direction === 'debit') === (l.direction === 'out');

export function severityOf(kind: ReconExceptionKind, amount: number, difference: number | null): Severity {
  if (SERIOUS_KINDS.includes(kind)) return 'critical';
  if (kind === 'bank_charge') return 'low';
  if (kind === 'amount_differs') return Math.abs(difference ?? amount) <= SMALL_DIFFERENCE ? 'low' : 'high';
  return 'high';
}

/** Compares one window of the statement with the records. Every line ends up matched, pending or an exception; nothing is dropped. */
export function reconcile(bank: BankLine[], ledger: LedgerLine[], now: number): Outcome {
  const out: Outcome = { matches: [], exceptions: [], pending: [] };
  const usedBank = new Set<string>();
  const usedLedger = new Set<string>();
  const bankSorted = [...bank].sort((a, b) => ms(a.postedAt) - ms(b.postedAt));
  const ledgerSorted = [...ledger].sort((a, b) => ms(a.date) - ms(b.date));
  const raise = (e: Omit<RawException, 'difference'> & { difference?: number | null }) => out.exceptions.push({ difference: null, ...e });

  // The app recording one bank movement twice is caught first, so the second copy is not matched to anything.
  const seenRef = new Map<string, LedgerLine>();
  for (const l of ledgerSorted) {
    const ref = normRef(l.reference);
    if (!ref) continue;
    const key = `${l.direction}:${ref}`;
    const first = seenRef.get(key);
    if (!first) {
      seenRef.set(key, l);
      continue;
    }
    usedLedger.add(l.id);
    raise({ key: `ledger:dup:${l.id}`, kind: 'recorded_twice', direction: l.direction, amount: l.amount, bankId: null, ledgerId: l.id, reference: l.reference, counterparty: l.counterparty, occurredAt: l.date });
  }

  const take = (b: BankLine, l: LedgerLine) => {
    usedBank.add(b.id);
    usedLedger.add(l.id);
    out.matches.push({ bankId: b.id, ledgerId: l.id, difference: b.amount - l.amount });
  };

  // 1. The reference names the movement. Same reference, same direction: the same thing, whatever the amount.
  for (const l of ledgerSorted) {
    if (usedLedger.has(l.id)) continue;
    const ref = normRef(l.reference);
    if (!ref) continue;
    const b = bankSorted.find((x) => !usedBank.has(x.id) && sameSide(x, l) && normRef(x.reference) === ref);
    if (b) take(b, l);
  }
  // 2. No reference to go by: the amount, the direction and a date close enough, when only one line fits.
  for (const l of ledgerSorted) {
    if (usedLedger.has(l.id)) continue;
    const fits = bankSorted.filter((x) => !usedBank.has(x.id) && sameSide(x, l) && Math.abs(x.amount - l.amount) <= ROUNDING && Math.abs(ms(x.postedAt) - ms(l.date)) <= DATE_TOLERANCE);
    if (fits.length === 0) continue;
    fits.sort((a, b) => Math.abs(ms(a.postedAt) - ms(l.date)) - Math.abs(ms(b.postedAt) - ms(l.date)));
    take(fits[0], l);
  }
  // 3. Still nothing: a single line on each side, close in date and a small amount apart, is one movement with a fee or a
  //    rounding taken out of it. It is listed as a difference, never quietly accepted.
  for (const l of ledgerSorted) {
    if (usedLedger.has(l.id)) continue;
    const fits = bankSorted.filter((x) => !usedBank.has(x.id) && sameSide(x, l) && Math.abs(x.amount - l.amount) <= SMALL_DIFFERENCE && Math.abs(ms(x.postedAt) - ms(l.date)) <= DATE_TOLERANCE);
    const rivals = ledgerSorted.filter((y) => !usedLedger.has(y.id) && y.id !== l.id && y.direction === l.direction && Math.abs(y.amount - l.amount) <= SMALL_DIFFERENCE && Math.abs(ms(y.date) - ms(l.date)) <= DATE_TOLERANCE);
    if (fits.length === 1 && rivals.length === 0) take(fits[0], l);
  }

  // A matched pair whose amounts differ by more than rounding is an exception of its own.
  for (const m of out.matches) {
    if (Math.abs(m.difference) <= ROUNDING) continue;
    const b = bank.find((x) => x.id === m.bankId)!;
    const l = ledger.find((x) => x.id === m.ledgerId)!;
    raise({ key: `pair:${m.bankId}:${m.ledgerId}`, kind: 'amount_differs', direction: l.direction, amount: l.amount, difference: m.difference, bankId: b.id, ledgerId: l.id, reference: b.reference ?? l.reference, counterparty: l.counterparty, occurredAt: b.postedAt });
  }

  // Bank lines nothing matched.
  const matchedBank = bankSorted.filter((b) => usedBank.has(b.id));
  for (const b of bankSorted) {
    if (usedBank.has(b.id)) continue;
    const direction = b.direction === 'debit' ? 'out' : 'in';
    const ref = normRef(b.reference);
    const twin = matchedBank.find(
      (m) => m.direction === b.direction && m.amount === b.amount && ((ref && normRef(m.reference) === ref) || (m.counterparty === b.counterparty && Math.abs(ms(m.postedAt) - ms(b.postedAt)) <= DUPLICATE_WINDOW)),
    );
    if (twin) {
      // Shown beside the one record the app has for it.
      const original = out.matches.find((m) => m.bankId === twin.id)?.ledgerId ?? null;
      raise({ key: `bank:${b.id}`, kind: b.direction === 'debit' ? 'duplicate_debit' : 'duplicate_credit', direction, amount: b.amount, bankId: b.id, ledgerId: original, reference: b.reference, counterparty: b.counterparty, occurredAt: b.postedAt });
    } else if (b.direction === 'credit') {
      raise({ key: `bank:${b.id}`, kind: 'unrecorded_credit', direction, amount: b.amount, bankId: b.id, ledgerId: null, reference: b.reference, counterparty: b.counterparty, occurredAt: b.postedAt });
    } else if (CHARGE_PATTERN.test(b.narration) || CHARGE_PATTERN.test(b.counterparty)) {
      raise({ key: `bank:${b.id}`, kind: 'bank_charge', direction, amount: b.amount, bankId: b.id, ledgerId: null, reference: b.reference, counterparty: b.counterparty, occurredAt: b.postedAt });
    } else {
      raise({ key: `bank:${b.id}`, kind: 'unrecorded_debit', direction, amount: b.amount, bankId: b.id, ledgerId: null, reference: b.reference, counterparty: b.counterparty, occurredAt: b.postedAt });
    }
  }

  // Records the bank does not show: too new to say, or missing.
  for (const l of ledgerSorted) {
    if (usedLedger.has(l.id)) continue;
    if (now - ms(l.date) < PENDING_GRACE) out.pending.push(l.id);
    else raise({ key: `ledger:${l.id}`, kind: 'missing_in_bank', direction: l.direction, amount: l.amount, bankId: null, ledgerId: l.id, reference: l.reference, counterparty: l.counterparty, occurredAt: l.date });
  }
  return out;
}

/** Worst thing still open decides the run: nothing open passes, only small differences is "review", anything else fails. */
export function runStatusOf(open: { kind: ReconExceptionKind; amount: number; difference: number | null }[]): ReconRunStatus {
  if (open.length === 0) return 'passed';
  return open.some((e) => severityOf(e.kind, e.amount, e.difference) !== 'low') ? 'failed' : 'review';
}

export type ReconcileProblem = 'note_required' | 'category_not_for_kind' | 'too_large_for_category' | 'serious_needs_confirmation';

/** Whether a difference may be explained by hand as this, and what it needs. A small expected difference is a fee or rounding; a
 *  serious one (a payment made twice) can never be waved through as one, only verified with a real explanation and a confirmation. */
export function reconcileProblem(e: { kind: ReconExceptionKind; amount: number; difference: number | null }, category: ReconReason, note: string, confirmed: boolean): ReconcileProblem | null {
  const size = Math.abs(e.difference ?? e.amount);
  const serious = SERIOUS_KINDS.includes(e.kind);
  const need = category === 'verified' || serious ? SERIOUS_NOTE_MIN : NOTE_MIN;
  if (note.trim().length < need) return 'note_required';
  if (category === 'bank_fee') {
    if (e.kind !== 'bank_charge' && e.kind !== 'amount_differs') return 'category_not_for_kind';
    if (size > SMALL_DIFFERENCE) return 'too_large_for_category';
  }
  if (category === 'rounding') {
    if (e.kind !== 'amount_differs') return 'category_not_for_kind';
    if (size > ROUNDING_MAX) return 'too_large_for_category';
  }
  if (serious && category !== 'verified') return 'category_not_for_kind';
  if (serious && !confirmed) return 'serious_needs_confirmation';
  return null;
}

/** The categories open to this exception, so the screen only offers what will be accepted. */
export function reasonsFor(e: { kind: ReconExceptionKind; amount: number; difference: number | null }): ReconReason[] {
  return REASONS.filter((c) => reconcileProblem(e, c, 'x'.repeat(SERIOUS_NOTE_MIN), true) === null);
}

/** The most recent daily slot at or before `now`. */
export function latestSlot(now: number): number {
  const d = new Date(now);
  const slot = new Date(d.getFullYear(), d.getMonth(), d.getDate(), RUN_HOUR, 0, 0, 0).getTime();
  return slot <= now ? slot : slot - days(1);
}

export const nextSlot = (now: number): number => latestSlot(now) + days(1);
