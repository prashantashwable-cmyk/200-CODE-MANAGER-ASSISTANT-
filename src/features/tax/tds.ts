/**
 * Tax deducted at source on what AIEC pays its partners, pure (169). AIEC is the deducting entity for payments to independent partners (not salaried employees), so each payout
 * can carry a deduction; this file decides how much, for which period it belongs, when it is due to be deposited and filed, and what a certificate says. The app provides clean,
 * reconciled data: the actual deposit and filing stay an accountant's external work, which Admin records here.
 *
 * EVERY rate, threshold and date below is a PLACEHOLDER for AIEC's accountant to confirm (rates and limits change by Finance Act). Rates are versioned and can be scheduled for a
 * future date, the way the GST rate is; a deduction keeps the rate it was made at.
 */
import { isValidPan } from '@/features/onboarding/validators';
import type { ReferenceInput } from '@/features/training/reference';

export const SECTIONS = ['194H', '194C', '194Q'] as const;
export type TdsSection = (typeof SECTIONS)[number];
export type TdsRole = 'surveyor' | 'technician' | 'supplier';

/** The section a partner's payments fall under, by what they do for AIEC (placeholder mapping). */
export const SECTION_OF_ROLE: Record<TdsRole, TdsSection> = { surveyor: '194H', technician: '194C', supplier: '194Q' };
/** Whether AIEC deducts at the moment of payout. A supplier's payment is watched, not deducted, until supplier payments carry deductions (said on screen). */
export const DEDUCTS_AT_PAYOUT: Record<TdsRole, boolean> = { surveyor: true, technician: true, supplier: false };

/** A rate used when no PAN is on file: the higher rate that applies (placeholder, percent). */
export const NO_PAN_RATE = 20;
export const PAN_MASK_KEEP = 4;

export interface TdsRateInput { rate: number; threshold: number; effectiveFrom: string; reason: string }
export interface TdsRateVersion { section: TdsSection; version: number; rate: number; threshold: number; effectiveFrom: string }

/** Starting values (placeholders, effective from the start of the financial year): commission 2%, contract work 1%, goods 0.1% on a large annual total. */
export const DEFAULT_RATES: Record<TdsSection, { rate: number; threshold: number }> = { '194H': { rate: 2, threshold: 20_000 }, '194C': { rate: 1, threshold: 100_000 }, '194Q': { rate: 0.1, threshold: 5_000_000 } };

export const RATE_MAX = 30;
export const REASON_MIN = 20;
export const MAX_AHEAD_DAYS = 400;

export type RateProblem = 'rate_invalid' | 'threshold_invalid' | 'date_invalid' | 'date_past' | 'date_far' | 'reason_short' | 'before_current';
export function rateProblem(i: TdsRateInput, now: number, latestEffectiveFrom: string | null): RateProblem | null {
  if (!Number.isFinite(i.rate) || i.rate < 0 || i.rate > RATE_MAX) return 'rate_invalid';
  if (!Number.isFinite(i.threshold) || i.threshold < 0 || !Number.isInteger(i.threshold)) return 'threshold_invalid';
  const t = Date.parse(i.effectiveFrom);
  if (!Number.isFinite(t)) return 'date_invalid';
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  if (t < today.getTime()) return 'date_past';
  if (t > now + MAX_AHEAD_DAYS * 86_400_000) return 'date_far';
  if (latestEffectiveFrom && t < Date.parse(latestEffectiveFrom)) return 'before_current';
  if (i.reason.replace(/[^\p{L}\p{N}]/gu, '').length < REASON_MIN) return 'reason_short';
  return null;
}

/** The version applying to a payment made on `at`: the latest whose day had arrived. */
export function versionAt<T extends { effectiveFrom: string; version: number }>(versions: T[], at: number): T | null {
  return [...versions].filter((v) => Date.parse(v.effectiveFrom) <= at).sort((a, b) => b.version - a.version)[0] ?? null;
}

/* ------------------------------------------------------------------ financial year and quarters */

export const fyIdOf = (iso: string | number): string => { const d = new Date(iso); return `fy-${d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1}`; };
export const fyStartYear = (fy: string): number => Number(fy.slice(3));
export const fyLabel = (fy: string): string => { const y = fyStartYear(fy); return `${y}-${String((y + 1) % 100).padStart(2, '0')}`; };
export type Quarter = 1 | 2 | 3 | 4;
/** Q1 April-June, Q2 July-September, Q3 October-December, Q4 January-March. */
export const quarterOf = (iso: string | number): Quarter => { const m = new Date(iso).getMonth(); return (m >= 3 && m <= 5 ? 1 : m >= 6 && m <= 8 ? 2 : m >= 9 ? 3 : 4) as Quarter; };
export const quarterRange = (fy: string, q: Quarter): { from: string; to: string } => {
  const y = fyStartYear(fy);
  const startMonth = [3, 6, 9, 0][q - 1];
  const startYear = q === 4 ? y + 1 : y;
  return { from: new Date(startYear, startMonth, 1).toISOString(), to: new Date(startYear, startMonth + 3, 1).toISOString() };
};
export const fyRange = (fy: string): { from: string; to: string } => ({ from: new Date(fyStartYear(fy), 3, 1).toISOString(), to: new Date(fyStartYear(fy) + 1, 3, 1).toISOString() });
export const inRange = (iso: string | null | undefined, r: { from: string; to: string }): boolean => !!iso && Date.parse(iso) >= Date.parse(r.from) && Date.parse(iso) < Date.parse(r.to);

/** Deposit is due by the 7th of the month after the deduction (placeholder; the accountant confirms, and March has its own date). */
export function depositDueOf(deductedAt: string): string {
  const d = new Date(deductedAt);
  const march = d.getMonth() === 2;
  return (march ? new Date(d.getFullYear(), 3, 30) : new Date(d.getFullYear(), d.getMonth() + 1, 7)).toISOString();
}
/** The quarterly return is due: Q1 31 July, Q2 31 October, Q3 31 January, Q4 31 May (placeholder). */
export function returnDueOf(fy: string, q: Quarter): string {
  const y = fyStartYear(fy);
  return (q === 1 ? new Date(y, 6, 31) : q === 2 ? new Date(y, 9, 31) : q === 3 ? new Date(y + 1, 0, 31) : new Date(y + 1, 4, 31)).toISOString();
}

/* ------------------------------------------------------------------ the deduction */

export interface DeductionInput {
  /** What this payout is worth. */
  gross: number;
  /** What the partner was paid earlier this financial year, counted toward the limit, whether or not tax was deducted on it. */
  grossBefore: number;
  /** Tax already deducted this financial year. */
  deductedBefore: number;
  baseRate: number;
  threshold: number;
  panOnFile: boolean;
}
export interface Deduction { rate: number; amount: number; belowThreshold: boolean; cumulativeGross: number; catchUp: number }
/**
 * Tax is deducted once the year's total passes the limit, and then on the whole total (so the payout that crosses it carries the earlier payments' share too). Below the limit it is
 * a genuine zero, not a blank. Without a PAN the higher rate applies.
 */
export function deductionFor(i: DeductionInput): Deduction {
  const rate = i.panOnFile ? i.baseRate : Math.max(i.baseRate, NO_PAN_RATE);
  const cumulativeGross = i.grossBefore + i.gross;
  const belowThreshold = cumulativeGross <= i.threshold;
  const owed = belowThreshold ? 0 : Math.round((rate / 100) * cumulativeGross);
  const amount = Math.max(0, Math.min(i.gross, owed - i.deductedBefore));
  const catchUp = belowThreshold ? 0 : Math.max(0, amount - Math.round((rate / 100) * i.gross));
  return { rate, amount, belowThreshold, cumulativeGross, catchUp };
}

/** Shares a deduction across the entries it came from, in whole rupees that add up exactly (largest remainder). */
export function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, w) => a + w, 0);
  if (sum <= 0 || total <= 0) return weights.map(() => 0);
  const raw = weights.map((w) => (w / sum) * total);
  const base = raw.map(Math.floor);
  let rest = total - base.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ i, f: r - Math.floor(r) })).sort((a, b) => b.f - a.f);
  for (const o of order) { if (rest <= 0) break; base[o.i] += 1; rest -= 1; }
  return base;
}

export const maskPan = (pan: string): string => (pan.length < 6 ? pan : `${pan.slice(0, 2)}${'X'.repeat(pan.length - 2 - PAN_MASK_KEEP)}${pan.slice(-PAN_MASK_KEEP)}`);
export type PanProblem = 'pan_invalid';
export const panProblem = (pan: string): PanProblem | null => (isValidPan(pan) ? null : 'pan_invalid');

export type ChallanProblem = 'bsr_invalid' | 'serial_invalid' | 'date_invalid' | 'amount_invalid' | 'ack_invalid';
export const challanProblem = (c: { bsr: string; serial: string; date: string; amount: number }, now: number): ChallanProblem | null => {
  if (!/^\d{7}$/.test(c.bsr.trim())) return 'bsr_invalid';
  if (!/^\d{3,5}$/.test(c.serial.trim())) return 'serial_invalid';
  if (!Number.isFinite(Date.parse(c.date)) || Date.parse(c.date) > now + 86_400_000) return 'date_invalid';
  if (!Number.isFinite(c.amount) || c.amount <= 0 || !Number.isInteger(c.amount)) return 'amount_invalid';
  return null;
};
export const ackProblem = (ack: string): ChallanProblem | null => (/^[A-Za-z0-9]{8,20}$/.test(ack.trim()) ? null : 'ack_invalid');

/* ------------------------------------------------------------------ certificate */

export interface CertificateInput {
  lang: string;
  brand: string;
  heading: string;
  holderLabel: string;
  holder: string;
  panLabel: string;
  pan: string;
  deductorLabel: string;
  deductor: string;
  lines: { label: string; value: string }[];
  table: { head: string[]; rows: string[][] };
  numberLabel: string;
  number: string;
  statusNote: string;
  footer: string;
  tokens: ReferenceInput['tokens'];
}
const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export function certificateHtml(c: CertificateInput): string {
  const t = c.tokens;
  const rows = c.lines.map((l) => `<tr><th>${esc(l.label)}</th><td>${esc(l.value)}</td></tr>`).join('');
  const head = `<tr class="hd">${c.table.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>`;
  const body = c.table.rows.map((r) => `<tr>${r.map((x) => `<td>${esc(x)}</td>`).join('')}</tr>`).join('');
  return `<!doctype html><html lang="${esc(c.lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(c.heading)}</title><style>body{font-family:sans-serif;max-width:820px;margin:24px auto;padding:0 16px;background:${t.bg};color:${t.text};line-height:1.5}.card{background:${t.surface};border:1px solid ${t.border};border-top:4px solid ${t.accent};border-radius:16px;padding:20px}h1{margin:4px 0 12px}table{border-collapse:collapse;width:100%;margin:12px 0}th{text-align:left;color:${t.muted};font-weight:normal;padding:6px 12px 6px 0}td{padding:6px 8px 6px 0;border-bottom:1px solid ${t.border};vertical-align:top}.hd th{border-bottom:2px solid ${t.border};font-weight:bold;color:${t.text}}.n{color:${t.muted};font-size:.9em}</style></head><body><div class="card"><p class="n">${esc(c.brand)}</p><h1>${esc(c.heading)}</h1><p><span class="n">${esc(c.deductorLabel)}</span><br><strong>${esc(c.deductor)}</strong></p><p><span class="n">${esc(c.holderLabel)}</span><br><strong>${esc(c.holder)}</strong><br><span class="n">${esc(c.panLabel)}</span> ${esc(c.pan)}</p><p><span class="n">${esc(c.numberLabel)}</span><br><strong>${esc(c.number)}</strong></p><table>${rows}</table><table>${head}${body}</table><p class="n">${esc(c.statusNote)}</p></div><p class="n">${esc(c.footer)}</p></body></html>`;
}

export const csvCell = (v: string | number): string => {
  const s = String(v);
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
