/**
 * The final-stage payout rules, pure (140). When a project's handover certificate is issued, everyone who took part in its whole life is paid
 * their final-stage share from this one event. Attribution follows the work actually recorded, never the job's title, so someone who left the
 * job midway keeps what they did and nobody is paid for a day they were not there.
 *
 * The sizes below are only the starting (version 1) values of the commission rules (161); the rules engine is the one place a rate is read
 * from, and every function here takes the rates in force as an argument. The capture / conversion commission for the original surveyor is
 * not a number from here: it is the one 077 already recorded for the deal.
 */
export const INSTALL_POOL_PCT = 1;
/** The lead answers for the whole installation and keeps this part of the pool on top of their own work. */
export const LEAD_BONUS_SHARE = 0.25;
/** Anyone with recorded work gets at least this part of what is shared among the crew, so a short stint is never rounded to nothing. */
export const MIN_CREW_SHARE = 0.05;
/** The independent quality inspector's fee for the job, shared by those who recorded results. */
export const QC_FEE = 1500;
/** The current owner of a reassigned lead did the closing; the original surveyor keeps the capture and conversion commission (044, 080). */
export const SALES_CLOSE_PCT = 0.5;

export type PayoutRole = 'surveyor' | 'sales' | 'technician_lead' | 'technician' | 'qc_inspector';
export type ShareBasis = 'time' | 'steps' | 'equal';

export interface Contributor {
  userId: string;
  name: string;
  isLead: boolean;
  /** On-site minutes recorded for this job. */
  minutes: number;
  /** Installation steps this person finished. */
  steps: number;
}

export interface CrewLine {
  userId: string;
  amount: number;
  /** The part of the whole pool this person receives. */
  share: number;
  leadBonus: number;
}

/** Splits whole rupees by weight so the parts add up to exactly the total (largest remainder), never a rupee lost or invented. */
export function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (total <= 0 || weights.length === 0 || sum <= 0) return weights.map(() => 0);
  const raw = weights.map((w) => (total * w) / sum);
  const floor = raw.map(Math.floor);
  let left = total - floor.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const o of order) {
    if (left <= 0) break;
    floor[o.i] += 1;
    left -= 1;
  }
  return floor;
}

/** The crew's share of the installation pool: the lead's bonus first, the rest by time on site (or steps finished, or equally when nothing was recorded). */
export interface CrewRates {
  /** The part of the pool the lead keeps on top (0–1). */
  leadBonusShare: number;
  /** The least part of the crew's share anyone with recorded work receives (0–1). */
  minCrewShare: number;
}
export const DEFAULT_CREW_RATES: CrewRates = { leadBonusShare: LEAD_BONUS_SHARE, minCrewShare: MIN_CREW_SHARE };

export function crewShares(pool: number, people: Contributor[], rates: CrewRates = DEFAULT_CREW_RATES): { lines: CrewLine[]; basis: ShareBasis; notPaid: string[] } {
  if (pool <= 0 || people.length === 0) return { lines: [], basis: 'equal', notPaid: [] };
  const lead = people.find((p) => p.isLead);
  const bonus = lead ? Math.round(pool * rates.leadBonusShare) : 0;
  const rest = pool - bonus;
  const worked = people.filter((p) => p.minutes > 0 || p.steps > 0);
  const basis: ShareBasis = worked.some((p) => p.minutes > 0) ? 'time' : worked.length > 0 ? 'steps' : 'equal';
  const paid = basis === 'equal' ? people : worked;
  const notPaid = people.filter((p) => !paid.includes(p)).map((p) => p.userId);
  const weight = (p: Contributor) => (basis === 'time' ? p.minutes : basis === 'steps' ? p.steps : 1);
  const total = paid.reduce((s, p) => s + weight(p), 0);
  let shares = paid.map((p) => weight(p) / total);
  const min = rates.minCrewShare;
  const low = shares.filter((s) => s < min);
  if (low.length > 0 && low.length * min < 1) {
    const high = shares.filter((s) => s >= min).reduce((a, b) => a + b, 0);
    const scale = high > 0 ? (1 - low.length * min) / high : 1;
    shares = shares.map((s) => (s < min ? min : s * scale));
  }
  const parts = allocate(rest, shares);
  const lines = paid.map((p, i): CrewLine => {
    const b = p.isLead ? bonus : 0;
    return { userId: p.userId, amount: parts[i] + b, share: pool > 0 ? (parts[i] + b) / pool : 0, leadBonus: b };
  });
  // A lead who did no recorded work still carries the bonus.
  if (lead && !paid.includes(lead)) lines.push({ userId: lead.userId, amount: bonus, share: bonus / pool, leadBonus: bonus });
  return { lines, basis, notPaid: notPaid.filter((id) => id !== lead?.userId) };
}

export interface QcContributor {
  userId: string;
  name: string;
  /** Results this inspector recorded across the mechanical and electrical checks. */
  results: number;
}

export function qcShares(fee: number, people: QcContributor[]): { userId: string; amount: number }[] {
  if (people.length === 0) return [];
  const parts = allocate(fee, people.map((p) => Math.max(p.results, 1)));
  return people.map((p, i) => ({ userId: p.userId, amount: parts[i] }));
}

export const installPoolOf = (dealValue: number, pct: number = INSTALL_POOL_PCT): number => Math.round((dealValue * pct) / 100);
export const salesCloseOf = (dealValue: number, pct: number = SALES_CLOSE_PCT): number => Math.round((dealValue * pct) / 100);

/* ------------------------------------------------------------------ a late issue */

export const JUDGEMENT_DECISIONS = ['no_change', 'hold', 'release', 'adjust'] as const;
export type JudgementDecision = (typeof JUDGEMENT_DECISIONS)[number];
export const ISSUE_MIN = 15;
export const REASON_MIN = 20;

export type JudgementProblem = 'issue_required' | 'reason_required' | 'decision_required' | 'entries_required' | 'amount_invalid' | 'paid_entry_locked' | 'not_held' | 'already_held' | 'no_entries_expected';

const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;

/**
 * Admin's documented judgement on a defect found after payouts were triggered. There is deliberately no automatic clawback and no rule that
 * ignores the problem: every outcome needs the issue in words and Admin's reason, is kept for good, and can only touch an entry that has not
 * already been paid out (an amount already paid is never taken back here).
 */
export function judgementProblem(i: { decision: JudgementDecision | ''; issue: string; reason: string; targets: { status: string; held: boolean; amount: number; newAmount?: number }[] }): JudgementProblem | null {
  if (!i.decision) return 'decision_required';
  if (letters(i.issue) < ISSUE_MIN) return 'issue_required';
  if (letters(i.reason) < REASON_MIN) return 'reason_required';
  if (i.decision === 'no_change') return null;
  if (i.targets.length === 0) return 'entries_required';
  if (i.targets.some((t) => t.status === 'paid')) return 'paid_entry_locked';
  if (i.decision === 'hold' && i.targets.some((t) => t.held)) return 'already_held';
  if (i.decision === 'release' && i.targets.some((t) => !t.held)) return 'not_held';
  if (i.decision === 'adjust' && i.targets.some((t) => t.newAmount === undefined || !Number.isInteger(t.newAmount) || t.newAmount < 0)) return 'amount_invalid';
  return null;
}
