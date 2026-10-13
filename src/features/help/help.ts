import type { HelpReason } from '@/data/types';

/**
 * Help, FAQ and support (199): the rules, pure. An article is role-tagged by free strings (so a role added later needs no change), versioned,
 * looked at again on its own rhythm, and judged by what people say about it; a search that finds nothing is a content gap, not a failure.
 * THE REVIEW RHYTHM, THE SAMPLE SIZES AND THE LIMITS BELOW ARE PLACEHOLDER DECISIONS flagged to Admin on screen.
 */
export const HELP_CATEGORIES = ['getting_started', 'account', 'leads_quotes', 'earnings', 'payments', 'projects', 'service', 'documents', 'orders', 'training', 'admin'] as const;
export type HelpCategoryId = (typeof HELP_CATEGORIES)[number];
export const ALL_ROLES = 'all';
export const BUILT_IN_HELP_ROLES = ['admin', 'surveyor', 'technician', 'customer', 'supplier'] as const;
export const HELP_REASONS: HelpReason[] = ['wrong', 'outdated', 'unclear', 'missing_steps', 'other'];

/** An article is looked at again after this long. */
export const REVIEW_EVERY_DAYS = 180;
/** Fewer answers than this are individual notes, not a rate. */
export const MIN_RESPONSES = 5;
/** Below this share of "helpful", with enough answers, an article needs another look. */
export const LOW_RATE = 0.5;
/** This many "wrong" or "out of date" answers on the current version put an article in front of Admin. */
export const REPORT_MIN = 3;
export const TITLE_MIN = 8;
export const BODY_MIN = 40;
export const BODY_MAX = 4000;
export const NOTE_MIN = 10;
export const COMMENT_MAX = 500;
export const SUGGEST_MIN = 15;
export const SUGGEST_MAX = 400;
export const SUGGEST_PER_DAY = 3;
export const MISS_MIN_LETTERS = 3;
export const MISS_MAX_LENGTH = 60;
/** A search that found nothing this many times is listed as a gap. */
export const MISS_LIST_MIN = 2;
export const SUGGESTION_DUE_DAYS = 14;
export const MAX_ROUTES = 5;
export const PAGE = 20;

const letters = (s: string): number => s.replace(/[^\p{L}\p{N}]/gu, '').length;
export const lettersOf = letters;

export interface ArticleDraft { category: string; roles: string[]; relatedRoutes: string[]; title: { en: string; hi: string; mr: string }; body: { en: string; hi: string; mr: string }; changeNote: string }
/** The first thing wrong with an article about to be saved, as a code the screen has words for; null when it can be saved. */
export function articleProblem(d: ArticleDraft, knownRoles: string[], needsNote: boolean): string | null {
  if (!(HELP_CATEGORIES as readonly string[]).includes(d.category)) return 'category_unknown';
  if (d.roles.length === 0) return 'roles_required';
  if (d.roles.some((r) => r !== ALL_ROLES && !knownRoles.includes(r))) return 'role_unknown';
  if (letters(d.title.en) < TITLE_MIN) return 'title_short';
  if (letters(d.body.en) < BODY_MIN) return 'body_short';
  if (d.body.en.length > BODY_MAX || d.body.hi.length > BODY_MAX || d.body.mr.length > BODY_MAX) return 'body_long';
  // A translation is all or nothing per language: half an article in Hindi is worse than the English one.
  for (const l of ['hi', 'mr'] as const) {
    const t = letters(d.title[l]) > 0;
    const b = letters(d.body[l]) > 0;
    if (t !== b) return 'translation_partial';
  }
  if (d.relatedRoutes.length > MAX_ROUTES) return 'routes_many';
  if (d.relatedRoutes.some((r) => !r.startsWith('/'))) return 'route_invalid';
  if (needsNote && letters(d.changeNote) < NOTE_MIN) return 'note_short';
  return null;
}

export const isForRole = (articleRoles: string[], roles: string[]): boolean => articleRoles.includes(ALL_ROLES) || articleRoles.some((r) => roles.includes(r));

/** Does this path match a route pattern of the app (`:param` segments, a trailing `?` for an optional one)? */
export function routeMatches(path: string, pattern: string): boolean {
  const clean = path.split('?')[0].replace(/\/+$/, '') || '/';
  const parts = pattern.split('/').filter(Boolean);
  const segs = clean.split('/').filter(Boolean);
  const required = parts.filter((p) => !p.endsWith('?')).length;
  if (segs.length < required || segs.length > parts.length) return false;
  return parts.every((p, i) => (i >= segs.length ? p.endsWith('?') : p.startsWith(':') || p === segs[i]));
}
/** Screens the app routes by hand, outside the discovered route table. */
export const HAND_ROUTED = ['/settings'];
export const routeKnown = (path: string, catalogue: string[]): boolean => [...catalogue, ...HAND_ROUTED].some((p) => routeMatches(path, p));

export const normalizeQuery = (q: string): string => q.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
/** What may be remembered about a search: short, and nothing that looks like a phone number or an address. */
export function loggableQuery(q: string): boolean {
  const n = normalizeQuery(q);
  return letters(n) >= MISS_MIN_LETTERS && n.length <= MISS_MAX_LENGTH && !/\d{6,}/.test(n.replace(/[\s-]/g, '')) && !n.includes('@');
}

/** How well an article answers a search: words in the title count most; every word has to be found somewhere. */
export function matchScore(title: string, body: string, q: string): number {
  const tokens = normalizeQuery(q).split(' ').filter(Boolean);
  if (tokens.length === 0) return 0;
  const t = title.toLocaleLowerCase();
  const b = body.toLocaleLowerCase();
  let score = 0;
  for (const tok of tokens) {
    const inTitle = t.includes(tok);
    const inBody = b.includes(tok);
    if (!inTitle && !inBody) return 0;
    score += (inTitle ? 3 : 0) + (inBody ? 1 : 0);
  }
  return score;
}

export function rateOf(helpful: number, total: number): { rate: number | null; small: boolean } {
  if (total === 0) return { rate: null, small: true };
  return { rate: helpful / total, small: total < MIN_RESPONSES };
}

export type HelpFlag = 'review_due' | 'broken_link' | 'reported' | 'low_rate' | 'draft';
export interface FlagFacts { status: string; reviewedAt: string; reviewEveryDays: number; brokenLinks: number; reports: number; helpful: number; total: number }
export function flagsOf(f: FlagFacts, now: number): HelpFlag[] {
  const out: HelpFlag[] = [];
  if (f.status === 'draft') out.push('draft');
  if (f.status !== 'published') return out;
  if (now - Date.parse(f.reviewedAt) > f.reviewEveryDays * 86_400_000) out.push('review_due');
  if (f.brokenLinks > 0) out.push('broken_link');
  if (f.reports >= REPORT_MIN) out.push('reported');
  const r = rateOf(f.helpful, f.total);
  if (!r.small && r.rate !== null && r.rate < LOW_RATE) out.push('low_rate');
  return out;
}

export type SupportKind = 'chat' | 'ticket' | 'call' | 'messages' | 'safety';
export interface SupportPath { kind: SupportKind; route: string | null }
/** The ways to reach a person from help, by role: what the app already has for that role, never a made-up channel. */
export function supportPathsFor(role: string): SupportPath[] {
  switch (role) {
    case 'customer': return [{ kind: 'chat', route: '/support-chat' }, { kind: 'ticket', route: '/service-requests?tab=new' }, { kind: 'call', route: null }];
    case 'supplier': return [{ kind: 'messages', route: '/supplier-messages' }, { kind: 'call', route: null }];
    case 'technician': return [{ kind: 'safety', route: '/job-issues' }, { kind: 'call', route: null }];
    case 'surveyor': return [{ kind: 'call', route: null }];
    default: return [];
  }
}
