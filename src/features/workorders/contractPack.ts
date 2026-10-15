import type { WorkOrderView } from './types';
import { readinessKeys } from './workOrder';

/** A translator the caller supplies, so the pack reads in the reader's language and tests can pass a plain function. */
export type Tr = (key: string, vars?: Record<string, string | number>) => string;

export const escapeHtml = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/**
 * The Contract Pack for one work order: what was agreed, what is released when, who accepted and how. A standalone page, read from the order itself
 * so it cannot differ from what the screens show. Acceptance is the in-app kind and is said to be so; the pack is not a legal e-signature.
 */
export function contractPackHtml(w: WorkOrderView, t: Tr, lang: string, generatedAt: string): string {
  const e = escapeHtml;
  const date = (iso?: string) => (iso ? new Intl.DateTimeFormat(lang, { dateStyle: 'medium' }).format(new Date(iso)) : t('workOrders.pack.pending'));
  const rows = w.milestones.map((m) => `<tr><td>${e(m.label)}</td><td>${e(t(`workOrders.gate.${m.gate}`))}</td><td class="n">${m.pct}%</td><td class="n">${inr(m.amountInr)}</td></tr>`).join('');
  const total = w.milestones.reduce((a, m) => a + m.amountInr, 0);
  return `<!doctype html><html lang="${e(lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(w.code)}</title>
<style>body{font:16px/1.5 system-ui,sans-serif;margin:0 auto;max-width:720px;padding:16px;color:#111}h1{font-size:1.4rem}table{border-collapse:collapse;width:100%}td,th{border:1px solid #bbb;padding:6px;text-align:left}.n{text-align:right}.note{border-left:4px solid #b8860b;padding:6px 10px;background:#faf6e8}</style></head><body>
<h1>${e(t('workOrders.pack.title'))} · ${e(w.code)}</h1>
<p>${e(t('workOrders.pack.site'))}: <strong>${e(w.siteName)}</strong><br>${e(t('workOrders.pack.partner'))}: <strong>${e(w.partnerName)}</strong> (${e(t(`workOrders.kinds.${w.kind}`))})<br>${e(t('workOrders.pack.scope'))}: ${e(w.description)}</p>
<p>${e(t('workOrders.pack.price'))}: <strong>${inr(w.priceInr)}</strong>${total === w.priceInr ? '' : ` (${e(t('workOrders.pack.mismatch'))})`}</p>
<table><thead><tr><th>${e(t('workOrders.tplLabel'))}</th><th>${e(t('workOrders.tplGate'))}</th><th class="n">%</th><th class="n">₹</th></tr></thead><tbody>${rows}</tbody></table>
<p>${e(t('workOrders.pack.template', { version: w.templateVersion ?? 1 }))}</p>
${readinessKeys(w.kind).length ? `<h2>${e(t('workOrders.readiness.title'))}</h2><ul>${readinessKeys(w.kind).map((k) => `<li>${e(t(k))}</li>`).join('')}</ul><p class="note">${e(t('workOrders.readiness.disclaimer'))}</p>` : ''}
<h2>${e(t('workOrders.pack.acceptance'))}</h2>
<p>${e(t('workOrders.pack.customer'))}: ${e(date(w.customerAcceptedAt))}<br>${e(t('workOrders.pack.partnerAccepted'))}: ${e(date(w.partnerAcceptedAt))}</p>
<p class="note">${e(w.acceptance === 'esigned' ? t('workOrders.pack.esigned') : t('workOrders.pack.inApp'))}</p>
<p class="note">${e(t('workOrders.disclosure'))}</p>
<p>${e(t('workOrders.pack.generated', { date: date(generatedAt) }))}</p>
</body></html>`;
}
