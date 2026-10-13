/**
 * Merge-field rendering, shared by the Templates Library editor preview
 * (051), the Sequence Builder's test-send (052), and the Bot simulator
 * (056) — one rendering rule so a preview never disagrees with what an
 * actual send would produce.
 *
 * A field with no real value for a given lead renders as a sensible
 * fallback phrase rather than a broken blank — the spec's explicit
 * "no unresolved token ever reaches a customer" requirement.
 */

export const MERGE_FIELD_FALLBACKS: Record<string, string> = {
  customerName: 'there',
  buildingName: 'your building',
  quoteAmount: 'your quote',
  installStep: 'the current stage',
  visitDate: 'the scheduled date',
  etaTime: 'shortly',
  shipmentLabel: 'delivery',
  etaDate: 'shortly',
  originalDate: 'the date we promised',
  delayReason: 'a disruption',
};

const TOKEN_PATTERN = /\{\{(\w+)\}\}/g;

export function extractMergeFields(body: string): string[] {
  const found = new Set<string>();
  for (const match of body.matchAll(TOKEN_PATTERN)) found.add(match[1]);
  return [...found];
}

export function renderTemplateBody(body: string, values: Partial<Record<string, string>>): string {
  return body.replace(TOKEN_PATTERN, (_, key: string) => {
    const value = values[key];
    if (value && value.trim().length > 0) return value;
    return MERGE_FIELD_FALLBACKS[key] ?? `[${key}]`;
  });
}
