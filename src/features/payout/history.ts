/**
 * A partner's payout history and statements, pure (168). Everything here is a way of reading the one commission ledger: which stage an entry is at, which period a date
 * belongs to, how a statement adds up, and what the downloadable files say. Nothing is a separately calculated figure, and nothing is stored.
 *
 * Periods follow the Indian financial year (April to March) as well as calendar months, since a partner keeps their own tax records by it.
 */
import { days } from '@/features/sla/clock';
import type { ReferenceInput } from '@/features/training/reference';

export const PAGE = 20;
export const QUERY_MIN = 15;
export const ANSWER_MIN = 15;
/** Admin answers a partner's question about a payout within this long. */
export const QUERY_DUE = days(2);
/** After an answer, the heads-up stays on the partner's list this long. */
export const QUERY_REPLY_DAYS = 7;
export const MONTHS_OFFERED = 12;

export const STATUS_FILTERS = ['all', 'paid', 'inProgress', 'projected', 'reversed'] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

/** Where an entry is on its way to the partner's account, in the words a partner needs. */
export const STAGES = ['projected', 'approved', 'held', 'cleared', 'sending', 'failed', 'paid', 'forfeited', 'reversed'] as const;
export type Stage = (typeof STAGES)[number];

export function stageOf(e: { status: 'projected' | 'approved' | 'paid' | 'forfeited'; reversed: boolean; held: boolean; cleared: boolean; disbursement: 'initiated' | 'processing' | 'completed' | 'failed' | 'cancelled' | null }): Stage {
  if (e.reversed) return 'reversed';
  if (e.status === 'forfeited') return 'forfeited';
  if (e.status === 'paid') return 'paid';
  if (e.held) return 'held';
  if (e.status === 'projected') return 'projected';
  if (e.disbursement === 'initiated' || e.disbursement === 'processing') return 'sending';
  if (e.disbursement === 'failed') return 'failed';
  return e.cleared ? 'cleared' : 'approved';
}

/** Which of the status filters an entry falls under. In progress = final, not yet in the account. */
export function filterOf(stage: Stage): Exclude<StatusFilter, 'all'> {
  if (stage === 'paid') return 'paid';
  if (stage === 'projected') return 'projected';
  if (stage === 'forfeited' || stage === 'reversed') return 'reversed';
  return 'inProgress';
}

/** Earned to date counts what is final (cleared by Admin's process or paid); a projected amount is a forecast and a reversed one is not earned. */
export const countsAsEarned = (stage: Stage): boolean => stage !== 'projected' && stage !== 'forfeited' && stage !== 'reversed';

/* ------------------------------------------------------------------ periods */

export type PeriodKind = 'month' | 'fy' | 'all';
export interface Period { id: string; kind: PeriodKind; from: string; to: string }

const p2 = (n: number) => String(n).padStart(2, '0');
export const monthIdOf = (iso: string): string => { const d = new Date(iso); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}`; };
/** The financial year a date falls in is named by the year it starts (April): 2026-04-01 to 2027-03-31 is `fy-2026`. */
export const fyOf = (iso: string): string => { const d = new Date(iso); return `fy-${d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1}`; };

/** The span of a period id, as local-day [from, to) ISO bounds. `null` when the id is not one. */
export function periodOf(id: string): Period | null {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(id);
  if (m) { const y = Number(m[1]); const mo = Number(m[2]); return { id, kind: 'month', from: new Date(y, mo - 1, 1).toISOString(), to: new Date(y, mo, 1).toISOString() }; }
  const f = /^fy-(\d{4})$/.exec(id);
  if (f) { const y = Number(f[1]); return { id, kind: 'fy', from: new Date(y, 3, 1).toISOString(), to: new Date(y + 1, 3, 1).toISOString() }; }
  if (id === 'all') return { id, kind: 'all', from: new Date(2000, 0, 1).toISOString(), to: new Date(2100, 0, 1).toISOString() };
  return null;
}
export const inPeriod = (iso: string | null | undefined, p: Period): boolean => !!iso && Date.parse(iso) >= Date.parse(p.from) && Date.parse(iso) < Date.parse(p.to);

/* ------------------------------------------------------------------ statement */

export interface StatementLineInput { date: string; title: string; type: string; amount: number; status: string; reference: string }
export interface StatementInput {
  lang: string;
  brand: string;
  heading: string;
  number: string;
  numberLabel: string;
  holderLabel: string;
  holder: string;
  periodLabel: string;
  period: string;
  totals: { label: string; value: string }[];
  columns: { date: string; title: string; type: string; amount: string; status: string };
  lines: StatementLineInput[];
  money: (n: number) => string;
  dateOf: (iso: string) => string;
  generated: string;
  footer: string;
  tokens: ReferenceInput['tokens'];
}

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function statementHtml(s: StatementInput): string {
  const t = s.tokens;
  const rows = s.lines.map((l) => `<tr><td>${esc(s.dateOf(l.date))}</td><td>${esc(l.title)}${l.reference ? `<br><span class="n">${esc(l.reference)}</span>` : ''}</td><td>${esc(l.type)}</td><td class="r">${esc(s.money(l.amount))}</td><td>${esc(l.status)}</td></tr>`).join('');
  const totals = s.totals.map((x) => `<tr><th>${esc(x.label)}</th><td class="r">${esc(x.value)}</td></tr>`).join('');
  return `<!doctype html><html lang="${esc(s.lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(s.heading)}</title><style>body{font-family:sans-serif;max-width:820px;margin:24px auto;padding:0 16px;background:${t.bg};color:${t.text};line-height:1.5}.card{background:${t.surface};border:1px solid ${t.border};border-top:4px solid ${t.accent};border-radius:16px;padding:20px}h1{margin:4px 0 12px}table{border-collapse:collapse;width:100%;margin:12px 0}th{text-align:left;color:${t.muted};font-weight:normal;padding:6px 12px 6px 0}td{padding:6px 8px 6px 0;border-bottom:1px solid ${t.border};vertical-align:top}.r{text-align:right;white-space:nowrap}.n{color:${t.muted};font-size:.9em}.hd th{border-bottom:2px solid ${t.border};font-weight:bold;color:${t.text}}</style></head><body><div class="card"><p class="n">${esc(s.brand)}</p><h1>${esc(s.heading)}</h1><p><span class="n">${esc(s.holderLabel)}</span><br><strong>${esc(s.holder)}</strong></p><p><span class="n">${esc(s.periodLabel)}</span><br><strong>${esc(s.period)}</strong></p><p><span class="n">${esc(s.numberLabel)}</span><br><strong>${esc(s.number)}</strong></p><table>${totals}</table><table><tr class="hd"><th>${esc(s.columns.date)}</th><th>${esc(s.columns.title)}</th><th>${esc(s.columns.type)}</th><th class="r">${esc(s.columns.amount)}</th><th>${esc(s.columns.status)}</th></tr>${rows}</table></div><p class="n">${esc(s.generated)}</p><p class="n">${esc(s.footer)}</p></body></html>`;
}

export const csvCell = (v: string | number): string => {
  const s = String(v);
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export type QueryProblem = 'text_short' | 'not_found' | 'not_yours' | 'already_open' | 'not_open' | 'answer_short' | 'not_admin' | 'forbidden';
export const letters = (s: string): number => s.replace(/[^\p{L}\p{N}]/gu, '').length;
export const queryProblem = (text: string): QueryProblem | null => (letters(text) < QUERY_MIN ? 'text_short' : null);
export const answerProblem = (text: string): QueryProblem | null => (letters(text) < ANSWER_MIN ? 'answer_short' : null);
