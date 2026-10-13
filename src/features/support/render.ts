import { formatDate, formatINR } from '@/design-system';

/** An assistant reply is a key with plain numbers and ISO dates; this is the one place they become the customer's language (`amount` as rupees, `date` and `until` as dates). */
export function botParams(params: Record<string, string | number> | null | undefined, lang: string): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params ?? {})) {
    if (k === 'amount' && typeof v === 'number') out[k] = formatINR(v);
    else if ((k === 'date' || k === 'until') && typeof v === 'string' && v) out[k] = formatDate(v, lang);
    else out[k] = v;
  }
  return out;
}
