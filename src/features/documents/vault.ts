/**
 * The customer's document vault, pure (173). The vault stores nothing: every document is read from the record the screen that issued it kept, so it is exactly what was issued. This file
 * names the kinds, says how a validity is judged, and builds the standalone files a customer downloads (one document, or everything as one bundle).
 */
import { days } from '@/features/sla/clock';

export const VAULT_KINDS = ['quotation', 'agreement', 'invoice', 'receipt', 'compliance', 'warranty', 'amc', 'handover', 'delivery'] as const;
export type VaultKind = (typeof VAULT_KINDS)[number];
/** A validity is "expiring" this long before it ends (placeholder). */
export const EXPIRING_WITHIN = days(60);

export function validityState(until: string | null, now: number): 'valid' | 'expiring' | 'expired' {
  if (!until) return 'valid';
  const end = Date.parse(until);
  if (now > end + 86_400_000 - 1) return 'expired';
  return end - now <= EXPIRING_WITHIN ? 'expiring' : 'valid';
}

export interface HtmlField { label: string; value: string }
export interface HtmlSection { heading: string; fields: HtmlField[] }
export interface HtmlDocument { title: string; number: string; issued: string; status: string; validity: string | null; project: string; sections: HtmlSection[]; note: string | null }
export interface HtmlTokens { [token: string]: string }

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const css = (tk: HtmlTokens): string => `:root{${Object.entries(tk).map(([k, v]) => `${k}:${v}`).join(';')}}body{margin:0;background:var(--color-bg,#F8F6F1);color:var(--color-text-primary,#2A2723);font-family:system-ui,sans-serif;line-height:1.5}main{max-width:720px;margin:0 auto;padding:24px 16px}article{background:var(--color-surface,#fff);border:1px solid var(--color-border,#e6dfce);border-radius:16px;padding:20px;margin-bottom:24px}h1{font-size:1.4rem;margin:0 0 4px}h2{font-size:1rem;margin:20px 0 6px;border-top:1px solid var(--color-border,#e6dfce);padding-top:12px}dl{display:grid;grid-template-columns:minmax(120px,40%) 1fr;gap:4px 12px;margin:0}dt{color:var(--color-text-secondary,#6b645a)}dd{margin:0}.meta{color:var(--color-text-secondary,#6b645a);font-size:.9rem}.note{font-size:.85rem;color:var(--color-text-secondary,#6b645a);margin-top:16px}`;

function articleOf(d: HtmlDocument): string {
  return `<article><h1>${esc(d.title)}</h1><p class="meta">${esc(d.number)} · ${esc(d.issued)} · ${esc(d.status)}${d.validity ? ` · ${esc(d.validity)}` : ''}</p><p class="meta">${esc(d.project)}</p>${d.sections.map((s) => `<h2>${esc(s.heading)}</h2><dl>${s.fields.map((f) => `<dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd>`).join('')}</dl>`).join('')}${d.note ? `<p class="note">${esc(d.note)}</p>` : ''}</article>`;
}
/** One document as a standalone page that takes the active theme's tokens, saying exactly what was issued. */
export function documentHtml(d: HtmlDocument, tokens: HtmlTokens, lang: string): string {
  return `<!doctype html><html lang="${esc(lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(d.title)} ${esc(d.number)}</title><style>${css(tokens)}</style></head><body><main>${articleOf(d)}</main></body></html>`;
}
/** Everything in one file: each document in full, in the order given. */
export function bundleHtml(title: string, docs: HtmlDocument[], tokens: HtmlTokens, lang: string): string {
  return `<!doctype html><html lang="${esc(lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${css(tokens)}</style></head><body><main><h1>${esc(title)}</h1>${docs.map(articleOf).join('')}</main></body></html>`;
}
export const fileNameOf = (kind: string, code: string | null, ext: string): string => `aiec-${kind}-${(code ?? 'document').replace(/[^A-Za-z0-9._-]+/g, '-')}.${ext}`;
