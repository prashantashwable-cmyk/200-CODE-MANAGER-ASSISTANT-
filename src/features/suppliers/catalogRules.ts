import type { DriveType, SupplierCatalogItem } from '@/data/types';

/**
 * Screen 093's rules for what may enter the supplier catalog — pure, so the
 * repository enforces exactly what the screen previews.
 */

/** The component categories AIEC drafts POs by (092) — labels live in 093's
 *  shared `partCategory.*` namespace. A supplier may still list a genuinely
 *  new category; it renders as its own text. */
export const KNOWN_PART_CATEGORIES = [
  'traction_machine',
  'controller',
  'cabin',
  'door_operator',
  'guide_rails',
  'ropes',
  'vfd',
  'wiring',
  'brackets',
  'counterweight',
] as const;

export const KNOWN_DRIVE_TYPES: DriveType[] = ['hydraulic', 'geared_traction', 'gearless_traction', 'mrl', 'vacuum', 'screw_driven'];

/** Default "material price change" line: a supplier's own change beyond
 *  this share of the current price waits for Admin (Admin may reconfigure
 *  it on 093). Both directions — a slipped digit that halves a price
 *  misstates cost as badly as a hike. */
export const DEFAULT_PRICE_REVIEW_THRESHOLD_PCT = 10;

/** A price this far from the category's going rate is flagged, not refused:
 *  genuinely different parts can be priced very differently. */
const OUTLIER_LOW = 0.3;
const OUTLIER_HIGH = 3;
/** With no other listing in the category to compare against. */
const ABSOLUTE_MIN_PRICE = 500;
const ABSOLUTE_MAX_PRICE = 5_000_000;
export const MAX_LEAD_TIME_DAYS = 180;

export interface CatalogEntryInput {
  category: string;
  description: string;
  specification: string;
  driveTypes: string[];
  unitPrice: number;
  leadTimeDays: number;
}

export interface CatalogEntryCheck {
  /** Refused outright — nothing is saved. */
  errors: string[];
  /** Accepted only into Admin's review queue, never straight to live. */
  warnings: string[];
}

/** Issue keys, translated under `catalog.issue.*` by 093. */
export type CatalogIssueKey =
  | 'category_required'
  | 'description_required'
  | 'price_not_positive'
  | 'price_not_number'
  | 'lead_time_invalid'
  | 'unknown_drive_type'
  | 'duplicate_in_upload'
  | 'item_discontinued'
  | 'price_outlier_low'
  | 'price_outlier_high'
  | 'price_implausible';

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** The going rate per category across every supplier's live listings. */
export function categoryReferencePrices(items: SupplierCatalogItem[]): Map<string, number> {
  const byCategory = new Map<string, number[]>();
  for (const item of items) {
    if (item.status !== 'active') continue;
    byCategory.set(item.category, [...(byCategory.get(item.category) ?? []), item.unitPrice]);
  }
  return new Map([...byCategory].map(([category, prices]) => [category, median(prices)]));
}

export function checkCatalogEntry(entry: CatalogEntryInput, reference: Map<string, number>): CatalogEntryCheck {
  const errors: CatalogIssueKey[] = [];
  const warnings: CatalogIssueKey[] = [];
  if (!entry.category.trim()) errors.push('category_required');
  if (!entry.description.trim()) errors.push('description_required');
  if (!Number.isFinite(entry.unitPrice)) errors.push('price_not_number');
  else if (entry.unitPrice <= 0) errors.push('price_not_positive');
  if (!Number.isInteger(entry.leadTimeDays) || entry.leadTimeDays < 1 || entry.leadTimeDays > MAX_LEAD_TIME_DAYS) {
    errors.push('lead_time_invalid');
  }
  if (entry.driveTypes.some((d) => !(KNOWN_DRIVE_TYPES as string[]).includes(d))) errors.push('unknown_drive_type');

  if (Number.isFinite(entry.unitPrice) && entry.unitPrice > 0) {
    const going = reference.get(entry.category.trim());
    if (going) {
      if (entry.unitPrice < going * OUTLIER_LOW) warnings.push('price_outlier_low');
      else if (entry.unitPrice > going * OUTLIER_HIGH) warnings.push('price_outlier_high');
    } else if (entry.unitPrice < ABSOLUTE_MIN_PRICE || entry.unitPrice > ABSOLUTE_MAX_PRICE) {
      warnings.push('price_implausible');
    }
  }
  return { errors, warnings };
}

/** Whether a supplier's own price change is material enough to wait. */
export function isMaterialPriceChange(fromPrice: number, toPrice: number, thresholdPct: number): boolean {
  if (fromPrice <= 0) return true;
  return (Math.abs(toPrice - fromPrice) / fromPrice) * 100 > thresholdPct;
}

/* ------------------------------------------------------------ bulk upload */

export const CATALOG_CSV_HEADER = 'category,description,specification,drive_types,price,lead_time_days';

export interface ParsedCatalogRow {
  rowNumber: number;
  entry: CatalogEntryInput;
}

/** Splits one CSV line, honouring double-quoted fields with commas in them. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      out.push(field);
      field = '';
    } else field += ch;
  }
  out.push(field);
  return out.map((f) => f.trim());
}

/** Money as suppliers actually type it: "2,10,000", "₹ 95000", "95000.00". */
function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[₹,\s]/g, '').replace(/^rs\.?/i, '');
  return cleaned === '' ? Number.NaN : Number(cleaned);
}

/**
 * `category,description,specification,drive_types,price,lead_time_days`,
 * header optional, drive types separated by `|`. Blank lines are skipped;
 * a row's number is its line in the pasted text so a supplier can find it.
 */
export function parseCatalogCsv(text: string): ParsedCatalogRow[] {
  const rows: ParsedCatalogRow[] = [];
  text.split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) return;
    const cells = splitCsvLine(line);
    if (index === 0 && cells[0]?.toLowerCase() === 'category') return;
    const [category = '', description = '', specification = '', driveTypes = '', price = '', leadTime = ''] = cells;
    rows.push({
      rowNumber: index + 1,
      entry: {
        category: category.toLowerCase().replace(/\s+/g, '_'),
        description,
        specification,
        driveTypes: driveTypes
          .split('|')
          .map((d) => d.trim().toLowerCase())
          .filter(Boolean),
        unitPrice: parseAmount(price),
        leadTimeDays: leadTime.trim() === '' ? Number.NaN : Number(leadTime.trim()),
      },
    });
  });
  return rows;
}

/** Same supplier, category and description is the same item — an update. */
export function catalogMatchKey(category: string, description: string): string {
  return `${category.trim().toLowerCase()}|${description.trim().toLowerCase().replace(/\s+/g, ' ')}`;
}
