/**
 * AIEC's brand identity and legal details (191): the one governed source every document, header and theme reads. Pure: the screen and the repository judge a change with the same rules.
 * A change is a new version that applies from a day onward; what was issued under an earlier version keeps it. Every number here is a placeholder flagged on the screen.
 */
export type HeadingFont = 'fraunces' | 'martel' | 'jakarta';
export const HEADING_FONTS: Record<HeadingFont, string> = {
  fraunces: "'Fraunces', 'Times New Roman', serif",
  martel: "'Martel', 'Noto Serif Devanagari', serif",
  jakarta: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
};
export const HEADING_FONT_IDS = Object.keys(HEADING_FONTS) as HeadingFont[];

export interface BrandTokens { accentPrimary: string; accentSecondary: string; headingFont: HeadingFont }
/** The Alabaster & Ascension values (000_DESIGN_SYSTEM.md): what the app is when nothing has been changed. */
export const DEFAULT_TOKENS: BrandTokens = { accentPrimary: '#B8873D', accentSecondary: '#0E4B3D', headingFont: 'fraunces' };

export interface BrandAddress { line1: string; city: string; state: string; pincode: string }
export interface BrandLogo { dataUrl: string; fileName: string; sizeBytes: number }
export interface BrandDraft {
  companyName: string;
  nameHi: string;
  nameMr: string;
  ownerName: string;
  logo: BrandLogo | null;
  gstin: string;
  address: BrandAddress;
  tokens: BrandTokens;
}

/** GST state codes: the first two digits of a GSTIN. */
export const STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh', '10': 'Bihar',
  '11': 'Sikkim', '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram', '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal', '20': 'Jharkhand',
  '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat', '26': 'Dadra & Nagar Haveli and Daman & Diu', '27': 'Maharashtra', '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep',
  '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman & Nicobar Islands', '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh',
};
export const STATE_NAMES: string[] = Object.values(STATE_CODES);
export const stateOfGstin = (gstin: string): string | null => STATE_CODES[gstin.trim().slice(0, 2)] ?? null;

/** Placeholders for the owner to confirm. */
export const NAME_MIN = 3;
export const NAME_MAX = 80;
export const REASON_MIN_COSMETIC = 10;
export const REASON_MIN_LEGAL = 20;
export const NOTE_MIN = 15;
export const COSMETIC_MAX_DAYS = 30;
export const LEGAL_MAX_DAYS = 90;
export const LOGO_MAX_BYTES = 300 * 1024;
export const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
export const MIN_PRIMARY_CONTRAST = 3;
export const MIN_SECONDARY_CONTRAST = 4.5;
/** Two accents closer than this read as one colour: the brand loses the pairing that makes it recognisable. */
export const MIN_ACCENT_DISTANCE = 1.4;
/** The day of the verification that follows a legal change taking effect. */
export const VERIFY_DAYS = 7;

const HEX = /^#[0-9A-Fa-f]{6}$/;
export const hexProblem = (v: string): boolean => !HEX.test(v.trim());
const channel = (c: number): number => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
export function luminance(hex: string): number {
  const h = hex.trim().replace('#', '');
  return 0.2126 * channel(parseInt(h.slice(0, 2), 16)) + 0.7152 * channel(parseInt(h.slice(2, 4), 16)) + 0.0722 * channel(parseInt(h.slice(4, 6), 16));
}
/** WCAG contrast ratio between two colours (1 to 21). */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return Math.round(((Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)) * 100) / 100;
}
const WHITE = '#FFFFFF';
export interface ContrastCheck { id: 'primary' | 'secondary' | 'distinct'; ratio: number; need: number; ok: boolean }
export function contrastChecks(t: BrandTokens): ContrastCheck[] {
  if (hexProblem(t.accentPrimary) || hexProblem(t.accentSecondary)) return [];
  const p = contrastRatio(t.accentPrimary, WHITE);
  const s = contrastRatio(t.accentSecondary, WHITE);
  const d = contrastRatio(t.accentPrimary, t.accentSecondary);
  return [
    { id: 'primary', ratio: p, need: MIN_PRIMARY_CONTRAST, ok: p >= MIN_PRIMARY_CONTRAST },
    { id: 'secondary', ratio: s, need: MIN_SECONDARY_CONTRAST, ok: s >= MIN_SECONDARY_CONTRAST },
    { id: 'distinct', ratio: d, need: MIN_ACCENT_DISTANCE, ok: d >= MIN_ACCENT_DISTANCE },
  ];
}

export const addressLine = (a: BrandAddress): string => [a.line1.trim(), a.city.trim(), `${a.state.trim()} ${a.pincode.trim()}`.trim()].filter(Boolean).join(', ');
const letters = (s: string): number => s.replace(/[^\p{L}]/gu, '').length;
export const lettersOf = letters;

export type ProfileProblem =
  | 'name_short' | 'name_long' | 'owner_short' | 'gstin_missing' | 'gstin_format' | 'gstin_state' | 'address_short' | 'city_short' | 'state_missing' | 'pincode_format'
  | 'hex_primary' | 'hex_secondary' | 'font_unknown' | 'logo_type' | 'logo_size' | 'contrast_primary' | 'contrast_secondary';
export type ProfileWarning = 'accents_similar' | 'gstin_address_state' | 'names_same_as_english';

const GSTIN_FORMAT = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
/** What stops a version being saved (blocking), and what it should be told about. */
export function profileProblems(d: BrandDraft): { blocking: ProfileProblem[]; warn: ProfileWarning[] } {
  const blocking: ProfileProblem[] = [];
  const warn: ProfileWarning[] = [];
  if (letters(d.companyName) < NAME_MIN) blocking.push('name_short');
  if (d.companyName.trim().length > NAME_MAX) blocking.push('name_long');
  if (letters(d.ownerName) < NAME_MIN) blocking.push('owner_short');
  const g = d.gstin.trim().toUpperCase();
  if (g === '') blocking.push('gstin_missing');
  else if (!GSTIN_FORMAT.test(g)) blocking.push('gstin_format');
  else if (!STATE_CODES[g.slice(0, 2)]) blocking.push('gstin_state');
  if (d.address.line1.trim().length < 6) blocking.push('address_short');
  if (letters(d.address.city) < 2) blocking.push('city_short');
  if (!STATE_NAMES.includes(d.address.state)) blocking.push('state_missing');
  if (!/^[1-9]\d{5}$/.test(d.address.pincode.trim())) blocking.push('pincode_format');
  if (hexProblem(d.tokens.accentPrimary)) blocking.push('hex_primary');
  if (hexProblem(d.tokens.accentSecondary)) blocking.push('hex_secondary');
  if (!HEADING_FONT_IDS.includes(d.tokens.headingFont)) blocking.push('font_unknown');
  if (d.logo) {
    if (!LOGO_TYPES.includes(logoMime(d.logo.dataUrl))) blocking.push('logo_type');
    if (d.logo.sizeBytes > LOGO_MAX_BYTES) blocking.push('logo_size');
  }
  for (const c of contrastChecks(d.tokens)) {
    if (c.id === 'primary' && !c.ok) blocking.push('contrast_primary');
    if (c.id === 'secondary' && !c.ok) blocking.push('contrast_secondary');
    if (c.id === 'distinct' && !c.ok) warn.push('accents_similar');
  }
  const gs = g ? stateOfGstin(g) : null;
  if (gs && STATE_NAMES.includes(d.address.state) && gs !== d.address.state) warn.push('gstin_address_state');
  if ((d.nameHi.trim() && d.nameHi.trim() === d.companyName.trim()) || (d.nameMr.trim() && d.nameMr.trim() === d.companyName.trim())) warn.push('names_same_as_english');
  return { blocking: [...new Set(blocking)], warn: [...new Set(warn)] };
}
export const logoMime = (dataUrl: string): string => /^data:([^;,]+)[;,]/.exec(dataUrl)?.[1] ?? '';

export type ChangeGroup = 'identity' | 'legal' | 'theme';
export interface FieldChange { field: string; group: ChangeGroup; from: string; to: string }
const GROUP_OF: Record<string, ChangeGroup> = { companyName: 'identity', nameHi: 'identity', nameMr: 'identity', ownerName: 'identity', logo: 'identity', gstin: 'legal', address: 'legal', accentPrimary: 'theme', accentSecondary: 'theme', headingFont: 'theme' };
/** The language-free list of what differs, in a stable order. A logo is compared by its content, never by its file name alone. */
export function changesOf(prev: BrandDraft, next: BrandDraft): FieldChange[] {
  const out: FieldChange[] = [];
  const add = (field: string, from: string, to: string) => { if (from !== to) out.push({ field, group: GROUP_OF[field], from, to }); };
  add('companyName', prev.companyName.trim(), next.companyName.trim());
  add('nameHi', prev.nameHi.trim(), next.nameHi.trim());
  add('nameMr', prev.nameMr.trim(), next.nameMr.trim());
  add('ownerName', prev.ownerName.trim(), next.ownerName.trim());
  add('logo', prev.logo ? prev.logo.fileName : '', next.logo ? next.logo.fileName : '');
  if (prev.logo && next.logo && prev.logo.fileName === next.logo.fileName && prev.logo.dataUrl !== next.logo.dataUrl) { out.push({ field: 'logo', group: 'identity', from: prev.logo.fileName, to: next.logo.fileName }); }
  add('gstin', prev.gstin.trim().toUpperCase(), next.gstin.trim().toUpperCase());
  add('address', addressLine(prev.address), addressLine(next.address));
  add('accentPrimary', prev.tokens.accentPrimary.toUpperCase(), next.tokens.accentPrimary.toUpperCase());
  add('accentSecondary', prev.tokens.accentSecondary.toUpperCase(), next.tokens.accentSecondary.toUpperCase());
  add('headingFont', prev.tokens.headingFont, next.tokens.headingFont);
  return out;
}
export type ChangeKind = 'none' | 'cosmetic' | 'legal';
/** A change to GSTIN or address is a legal event with its own care; anything else is a brand change. */
export const kindOf = (changes: FieldChange[]): ChangeKind => (changes.length === 0 ? 'none' : changes.some((c) => c.group === 'legal') ? 'legal' : 'cosmetic');

export type EffectiveProblem = 'in_the_past' | 'too_far' | 'not_a_day';
const DAY = 86_400_000;
const startOfDay = (ms: number): number => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
/** When a version may start. "Now" is always fine for a brand change; a legal change starts on a stated day, today at the earliest. A version never starts in the past: what was issued is not re-dressed. */
export function effectiveProblem(effectiveFrom: string | null, kind: ChangeKind, now: number): EffectiveProblem | null {
  if (effectiveFrom === null) return kind === 'legal' ? 'not_a_day' : null;
  const at = Date.parse(effectiveFrom);
  if (!Number.isFinite(at)) return 'not_a_day';
  if (at < startOfDay(now)) return 'in_the_past';
  if (at > now + (kind === 'legal' ? LEGAL_MAX_DAYS : COSMETIC_MAX_DAYS) * DAY) return 'too_far';
  return null;
}
export const dayStart = (yyyyMmDd: string): string => new Date(`${yyyyMmDd}T00:00:00`).toISOString();

export interface VersionLite { id: string; version: number; effectiveFrom: string; cancelled?: unknown }
/** The version in force at an instant: the latest whose day has arrived and that was not called off. */
export function versionAt<T extends VersionLite>(versions: T[], at: number): T | null {
  let best: T | null = null;
  for (const v of versions) { if (v.cancelled) continue; if (Date.parse(v.effectiveFrom) <= at && (!best || v.version > best.version)) best = v; }
  return best;
}
export type VersionStatus = 'current' | 'scheduled' | 'past' | 'cancelled';
export function statusOf(v: VersionLite, versions: VersionLite[], now: number): VersionStatus {
  if (v.cancelled) return 'cancelled';
  const cur = versionAt(versions, now);
  if (cur && cur.id === v.id) return 'current';
  return Date.parse(v.effectiveFrom) > now ? 'scheduled' : 'past';
}

/** The words of the company in the reader's language, falling back to the legal English name when no local form is set. */
export const displayName = (b: { companyName: string; nameHi?: string; nameMr?: string }, lang: string): string => (lang === 'hi' && b.nameHi ? b.nameHi : lang === 'mr' && b.nameMr ? b.nameMr : b.companyName);

/** The override stylesheet. Only the light-toned modes take it (the dark and instrument modes carry their own brightened accents); with the default tokens there is nothing to override. */
export function brandCss(t: BrandTokens): string {
  const parts: string[] = [];
  const accents = t.accentPrimary.toUpperCase() !== DEFAULT_TOKENS.accentPrimary || t.accentSecondary.toUpperCase() !== DEFAULT_TOKENS.accentSecondary;
  if (accents) {
    const block = `--color-accent-primary:${t.accentPrimary};--color-accent-secondary:${t.accentSecondary};--color-accent-primary-soft:color-mix(in srgb,${t.accentPrimary} 12%,transparent);--color-accent-secondary-soft:color-mix(in srgb,${t.accentSecondary} 10%,transparent);--color-border:color-mix(in srgb,${t.accentPrimary} 15%,transparent);--glow-accent:0 0 0 4px color-mix(in srgb,${t.accentPrimary} 18%,transparent);`;
    parts.push(`:root:not([data-theme]),:root[data-theme='light'],:root[data-theme='snow'],:root[data-theme='pure']{${block}}`);
    parts.push(`@media (prefers-color-scheme: light){:root[data-theme='system']{${block}}}`);
  }
  if (t.headingFont !== DEFAULT_TOKENS.headingFont) parts.push(`html:not([lang='hi']):not([lang='mr']){--font-display:${HEADING_FONTS[t.headingFont]};}`);
  return parts.join('\n');
}
/** The same overrides as inline custom properties, for a preview that must show the combined effect without touching the real app. */
export function previewStyle(t: BrandTokens, lang = 'en'): Record<string, string> {
  const style: Record<string, string> = {
    '--color-accent-primary': t.accentPrimary,
    '--color-accent-secondary': t.accentSecondary,
    '--color-accent-primary-soft': `color-mix(in srgb, ${t.accentPrimary} 12%, transparent)`,
    '--color-accent-secondary-soft': `color-mix(in srgb, ${t.accentSecondary} 10%, transparent)`,
    '--color-border': `color-mix(in srgb, ${t.accentPrimary} 15%, transparent)`,
  };
  // Hindi and Marathi keep their own paired heading font, as in the real app.
  if (lang !== 'hi' && lang !== 'mr') style['--font-display'] = HEADING_FONTS[t.headingFont];
  return style;
}

export const hashText = (s: string): string => { let h = 5381; for (let i = 0; i < s.length; i += 1) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(16).padStart(8, '0'); };
/** What a preview was shown for: any later edit to the draft changes it, so a publish can tell the preview is out of date. */
export const draftHash = (d: BrandDraft, effectiveFrom: string | null): string => hashText(JSON.stringify([d.companyName.trim(), d.nameHi.trim(), d.nameMr.trim(), d.ownerName.trim(), d.logo ? [d.logo.fileName, d.logo.sizeBytes, hashText(d.logo.dataUrl)] : null, d.gstin.trim().toUpperCase(), d.address.line1.trim(), d.address.city.trim(), d.address.state, d.address.pincode.trim(), d.tokens.accentPrimary.toUpperCase(), d.tokens.accentSecondary.toUpperCase(), d.tokens.headingFont, effectiveFrom]));

/** A day when the legal change took effect has a follow-up: someone checks the first documents, the GST portal and the accountant. */
export const verifyDueAt = (effectiveFrom: string): string => new Date(Date.parse(effectiveFrom) + VERIFY_DAYS * DAY).toISOString();
