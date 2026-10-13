/**
 * A lesson's quick-reference sheet, as a standalone page (152). It is built from the same key points the lesson itself carries, in the language the
 * reader chose, so it never says anything the lesson did not. Colours come from the theme tokens in force when it is saved.
 */
export interface ReferenceSection {
  title: string;
  points: string[];
}

export interface ReferenceInput {
  lang: string;
  brand: string;
  heading: string;
  subtitle: string;
  generated: string;
  footer: string;
  sections: ReferenceSection[];
  tokens: Record<'bg' | 'text' | 'muted' | 'accent' | 'border' | 'surface', string>;
}

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function referenceHtml(r: ReferenceInput): string {
  const t = r.tokens;
  const body = r.sections.map((s) => `<section><h2>${esc(s.title)}</h2><ul>${s.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></section>`).join('');
  return `<!doctype html><html lang="${esc(r.lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(r.heading)}</title><style>body{font-family:sans-serif;max-width:640px;margin:24px auto;padding:0 16px;background:${t.bg};color:${t.text};line-height:1.5}h1{border-top:3px solid ${t.accent};padding-top:12px;margin-bottom:4px}h2{font-size:1.05em;margin:20px 0 6px}section{background:${t.surface};border:1px solid ${t.border};border-radius:12px;padding:4px 16px 12px;margin:12px 0}ul{padding-left:20px;margin:0}li{margin:6px 0}.n{color:${t.muted};font-size:.9em}</style></head><body><p class="n">${esc(r.brand)}</p><h1>${esc(r.heading)}</h1><p class="n">${esc(r.subtitle)} · ${esc(r.generated)}</p>${body}<p class="n">${esc(r.footer)}</p></body></html>`;
}

/** Reads the active theme's colours from the page (falls back to plain values when there is none, e.g. in a test). */
export function themeTokens(): ReferenceInput['tokens'] {
  const css = typeof document === 'undefined' ? null : getComputedStyle(document.documentElement);
  const tok = (name: string, fallback: string) => (css?.getPropertyValue(name).trim() || fallback);
  return { bg: tok('--color-bg', '#ffffff'), surface: tok('--color-surface', '#ffffff'), text: tok('--color-text-primary', '#222222'), muted: tok('--color-text-secondary', '#555555'), accent: tok('--color-accent-primary', '#b8873d'), border: tok('--color-border', '#cccccc') };
}
