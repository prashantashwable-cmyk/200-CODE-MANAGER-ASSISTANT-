/**
 * A certification as a standalone page the partner can keep or show (155). It states what was earned, when, how long it is valid, and the credential number
 * AIEC can confirm; it never claims to be a government licence or a qualification AIEC does not grant. Colours come from the theme tokens in force when saved.
 */
import type { ReferenceInput } from '@/features/training/reference';

export interface CredentialInput {
  lang: string;
  brand: string;
  heading: string;
  holder: string;
  holderLabel: string;
  lines: { label: string; value: string }[];
  code: string;
  codeLabel: string;
  status: string;
  footer: string;
  tokens: ReferenceInput['tokens'];
}

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function credentialHtml(c: CredentialInput): string {
  const t = c.tokens;
  const rows = c.lines.map((l) => `<tr><th>${esc(l.label)}</th><td>${esc(l.value)}</td></tr>`).join('');
  return `<!doctype html><html lang="${esc(c.lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(c.heading)}</title><style>body{font-family:sans-serif;max-width:640px;margin:24px auto;padding:0 16px;background:${t.bg};color:${t.text};line-height:1.5}.card{background:${t.surface};border:1px solid ${t.border};border-top:4px solid ${t.accent};border-radius:16px;padding:20px}h1{margin:4px 0 12px}table{border-collapse:collapse;width:100%;margin:12px 0}th{text-align:left;color:${t.muted};font-weight:normal;padding:6px 12px 6px 0;width:38%}td{padding:6px 0}.n{color:${t.muted};font-size:.9em}.code{font-family:monospace;font-size:1.1em;letter-spacing:.04em}.status{display:inline-block;border:1px solid ${t.accent};border-radius:999px;padding:2px 12px;margin-top:4px}</style></head><body><div class="card"><p class="n">${esc(c.brand)}</p><h1>${esc(c.heading)}</h1><p><span class="n">${esc(c.holderLabel)}</span><br><strong>${esc(c.holder)}</strong></p><table>${rows}</table><p><span class="n">${esc(c.codeLabel)}</span><br><span class="code">${esc(c.code)}</span></p><span class="status">${esc(c.status)}</span></div><p class="n">${esc(c.footer)}</p></body></html>`;
}
