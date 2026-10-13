/**
 * A partner's badges as a standalone page they can keep or show (166). It lists only what the partner chose to show, each with the date it was earned, and says plainly that
 * these are AIEC's own recognition and not a government licence. Colours come from the theme tokens in force when it is saved.
 */
import type { ReferenceInput } from '@/features/training/reference';

export interface PortfolioBadge { name: string; detail: string; earned: string; rarity: string | null }
export interface PortfolioInput {
  lang: string;
  brand: string;
  heading: string;
  holderLabel: string;
  holder: string;
  badges: PortfolioBadge[];
  footer: string;
  tokens: ReferenceInput['tokens'];
}

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function portfolioHtml(p: PortfolioInput): string {
  const t = p.tokens;
  const cards = p.badges.map((b) => `<div class="b"><strong>${esc(b.name)}</strong><span class="n">${esc(b.detail)}</span><span class="n">${esc(b.earned)}${b.rarity ? ` · ${esc(b.rarity)}` : ''}</span></div>`).join('');
  return `<!doctype html><html lang="${esc(p.lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.heading)}</title><style>body{font-family:sans-serif;max-width:720px;margin:24px auto;padding:0 16px;background:${t.bg};color:${t.text};line-height:1.5}h1{margin:4px 0 4px}.n{color:${t.muted};font-size:.9em;display:block}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin:16px 0}.b{background:${t.surface};border:1px solid ${t.border};border-top:4px solid ${t.accent};border-radius:16px;padding:14px}</style></head><body><p class="n">${esc(p.brand)}</p><h1>${esc(p.heading)}</h1><p><span class="n">${esc(p.holderLabel)}</span><strong>${esc(p.holder)}</strong></p><div class="g">${cards}</div><p class="n">${esc(p.footer)}</p></body></html>`;
}

/** The same list as plain text, for a message. */
export function portfolioText(p: PortfolioInput): string {
  return [p.heading, `${p.holderLabel}: ${p.holder}`, '', ...p.badges.map((b) => `• ${b.name} (${b.earned}${b.rarity ? `, ${b.rarity}` : ''})`), '', p.footer].join('\n');
}
