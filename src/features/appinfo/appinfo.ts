import type { BrowserRequirement } from '@/data/types';

/**
 * The app's version, what changed, and general product feedback (200): the rules, pure.
 * A change that affects how someone works is flagged apart from a small fix; a suggestion that is close to one already made is grouped with it
 * instead of arriving as new; and an update is only offered to a device that can really use it.
 * THE LIMITS AND THE LIKENESS THRESHOLD BELOW ARE PLACEHOLDERS flagged to Admin on screen.
 */
export const ITEM_MIN = 15;
export const MAX_ITEMS = 12;
export const FEEDBACK_MIN = 15;
export const FEEDBACK_MAX = 800;
export const FEEDBACK_PER_DAY = 5;
export const NOTE_MIN = 10;
export const TITLE_MIN = 8;
/** Two suggestions sharing at least this part of their words are treated as the same one. */
export const SIMILAR_AT = 0.5;
/** A suggestion nobody has looked at is raised again after this many days. */
export const REVIEW_DUE_DAYS = 14;
export const CHECK_EVERY_MS = 5 * 60_000;
export const KINDS = ['idea', 'problem', 'praise'] as const;
export const AREAS = ['overall', 'speed', 'design', 'language', 'offline', 'notifications', 'reports', 'other'] as const;
export const ITEM_KINDS = ['workflow', 'new', 'improved', 'fixed'] as const;
export const BROWSERS = ['chrome', 'edge', 'firefox', 'safari'] as const;

const letters = (s: string): number => s.replace(/[^\p{L}\p{N}]/gu, '').length;
export const lettersOf = letters;

export const isValidVersion = (v: string): boolean => /^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(v.trim());
export const parseVersion = (v: string): [number, number, number] => { const p = v.trim().split('.').map((x) => Number(x) || 0); return [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0]; };
export function compareVersions(a: string, b: string): number {
  const x = parseVersion(a);
  const y = parseVersion(b);
  for (let i = 0; i < 3; i += 1) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
  return 0;
}

export interface ReleaseItemInput { kind: string; en: string; hi: string; mr: string; roles: string[]; route: string }
export interface ReleaseInput { version: string; items: ReleaseItemInput[]; requires: BrowserRequirement }
/** The first thing wrong with a release about to be published, as a code the screen has words for; null when it can go out. */
export function releaseProblem(i: ReleaseInput, latest: string | null, knownRoles: string[]): string | null {
  if (!isValidVersion(i.version)) return 'version_invalid';
  if (latest && compareVersions(i.version, latest) <= 0) return 'version_not_newer';
  if (i.items.length === 0) return 'items_required';
  if (i.items.length > MAX_ITEMS) return 'items_many';
  for (const it of i.items) {
    if (!(ITEM_KINDS as readonly string[]).includes(it.kind)) return 'kind_unknown';
    if (letters(it.en) < ITEM_MIN) return 'text_short';
    if (it.roles.length === 0) return 'roles_required';
    if (it.roles.some((r) => r !== 'all' && !knownRoles.includes(r))) return 'role_unknown';
    if (it.route && !it.route.startsWith('/')) return 'route_invalid';
  }
  for (const b of BROWSERS) { const v = i.requires[b]; if (v !== undefined && (!Number.isFinite(v) || v < 1 || v > 300)) return 'browser_invalid'; }
  return null;
}
export const itemForRoles = (itemRoles: string[], roles: string[]): boolean => itemRoles.includes('all') || itemRoles.some((r) => roles.includes(r));

const STOP = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'are', 'was', 'can', 'could', 'would', 'should', 'please', 'have', 'has', 'not', 'but', 'you', 'your', 'our', 'app', 'its', 'from', 'when', 'into', 'there', 'they', 'them', 'will', 'also', 'like', 'want', 'need', 'make', 'have', 'been', 'more', 'all']);
export const tokensOf = (s: string): string[] => [...new Set((s.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter((w) => w.length >= 3 && !STOP.has(w)))];
/** How much of the shorter suggestion's words the other one shares (0 to 1). */
export function similarity(a: string, b: string): number {
  const x = tokensOf(a);
  const y = tokensOf(b);
  if (x.length < 2 || y.length < 2) return 0;
  const ys = new Set(y);
  const shared = x.filter((w) => ys.has(w)).length;
  return shared / Math.min(x.length, y.length);
}
export const isSimilar = (a: string, b: string): boolean => similarity(a, b) >= SIMILAR_AT;

export interface FeedbackDraft { kind: string; text: string; area: string }
export function feedbackProblem(d: FeedbackDraft): string | null {
  if (!(KINDS as readonly string[]).includes(d.kind)) return 'kind_unknown';
  if (!(AREAS as readonly string[]).includes(d.area)) return 'area_unknown';
  if (letters(d.text) < FEEDBACK_MIN) return 'text_short';
  if (d.text.trim().length > FEEDBACK_MAX) return 'text_long';
  return null;
}

export interface BrowserInfo { name: 'chrome' | 'edge' | 'firefox' | 'safari' | 'other'; major: number | null }
/** What the user agent says it is. The order matters: Edge and Chrome both say Chrome, and Chrome on an iPhone says Safari. */
export function browserOf(ua: string): BrowserInfo {
  const m = (re: RegExp): number | null => { const r = re.exec(ua); return r ? Number(r[1]) : null; };
  const edge = m(/(?:Edg|EdgA|EdgiOS)\/(\d+)/);
  if (edge !== null) return { name: 'edge', major: edge };
  const fx = m(/(?:Firefox|FxiOS)\/(\d+)/);
  if (fx !== null) return { name: 'firefox', major: fx };
  const cr = m(/(?:Chrome|CriOS)\/(\d+)/);
  if (cr !== null) return { name: 'chrome', major: cr };
  const sf = m(/Version\/(\d+)[\d.]*.*Safari/);
  if (sf !== null) return { name: 'safari', major: sf };
  return { name: 'other', major: null };
}
export type Compat = 'ok' | 'too_old' | 'unknown';
/** Can this device use the version? Unknown is said as unknown: a guess is not offered as a promise. */
export function compatibilityOf(b: BrowserInfo, req: BrowserRequirement): { state: Compat; need: number | null } {
  if (b.name === 'other' || b.major === null) return { state: Object.keys(req).length === 0 ? 'ok' : 'unknown', need: null };
  const need = req[b.name] ?? null;
  if (need === null) return { state: 'ok', need: null };
  return { state: b.major >= need ? 'ok' : 'too_old', need };
}
export const deviceOf = (ua: string, width: number): 'phone' | 'tablet' | 'desktop' => (/iPad|Tablet/i.test(ua) || (width >= 600 && width < 1000 && /Mobile|Android|iPhone/i.test(ua)) ? 'tablet' : /Mobi|iPhone|Android/i.test(ua) || width < 600 ? 'phone' : 'desktop');
