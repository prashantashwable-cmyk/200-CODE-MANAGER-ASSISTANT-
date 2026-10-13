import { formatINR } from '@/design-system';
import type { CommissionParams, CommissionRuleId } from './rules';

type T = (key: string, options?: Record<string, unknown>) => string;

/**
 * A rule's numbers as one plain sentence, in the reader's language. The words live with the commission rules screen (161), which owns the shared
 * `commissionRules.summary.*` keys; any screen that shows what a payout was worked out from reads them here.
 */
export function ruleSummary(t: T, id: CommissionRuleId | string, p: CommissionParams): string {
  switch (id) {
    case 'conversion': return t('commissionRules.summary.conversion', { pct: p.pct, floor: formatINR(p.floor ?? 0) });
    case 'sales_close': return t('commissionRules.summary.share', { pct: p.pct });
    case 'install_pool': return t('commissionRules.summary.pool', { pct: p.pct, lead: p.leadBonusPct, min: p.minCrewPct });
    case 'qc_fee': return t('commissionRules.summary.fee', { amount: formatINR(p.amount ?? 0) });
    default: return t('commissionRules.summary.fixed', { amount: formatINR(p.amount ?? 0) });
  }
}
