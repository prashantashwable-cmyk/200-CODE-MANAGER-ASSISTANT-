/** Screen 030 — Custom Report Builder. Types and translation keys only. */

export type BuilderStatus = 'loading' | 'ready' | 'error';

/**
 * Metrics and dimensions are pulled from the same governed data model every
 * other analytics screen reads — there is no separate metric registry a
 * custom report could drift from.
 */
export type MetricId = 'leadCount' | 'dealCount' | 'revenue' | 'conversionRate' | 'avgDealSize' | 'overdueAmount';

export type DimensionId = 'stage' | 'surveyor' | 'city' | 'month' | 'supplier';

export const METRICS: MetricId[] = [
  'leadCount',
  'dealCount',
  'revenue',
  'conversionRate',
  'avgDealSize',
  'overdueAmount',
];

export const DIMENSIONS: DimensionId[] = ['stage', 'surveyor', 'city', 'month', 'supplier'];

/** A metric and dimension that cannot be sliced together — a technician-only
 *  metric sliced by supplier makes no sense, so the spec asks it be refused. */
const INCOMPATIBLE: Partial<Record<MetricId, DimensionId[]>> = {
  overdueAmount: ['surveyor'],
};

export function isCompatible(metric: MetricId, dimension: DimensionId): boolean {
  return !INCOMPATIBLE[metric]?.includes(dimension);
}

export type RangePreset = 'last7' | 'last30' | 'last90' | 'thisMonth' | 'custom';

export interface ReportRow {
  dimensionValue: string;
  value: number;
}

/** A saved definition, kept in the repository for the person who saved it. */
export interface SavedReport {
  id: string;
  name: string;
  metric: MetricId;
  dimension: DimensionId;
  range: RangePreset;
}

/** More than this many rows is a warning, not a block — but it says so first. */
export const WIDE_REPORT_ROW_WARNING = 20;

export const REPORT_BUILDER_KEYS = {
  title: 'reportBuilder.title',
  subtitle: 'reportBuilder.subtitle',
  loading: 'reportBuilder.loading',
  metric: {
    label: 'reportBuilder.metric.label',
    leadCount: 'reportBuilder.metric.leadCount',
    dealCount: 'reportBuilder.metric.dealCount',
    revenue: 'reportBuilder.metric.revenue',
    conversionRate: 'reportBuilder.metric.conversionRate',
    avgDealSize: 'reportBuilder.metric.avgDealSize',
    overdueAmount: 'reportBuilder.metric.overdueAmount',
  },
  dimension: {
    label: 'reportBuilder.dimension.label',
    stage: 'reportBuilder.dimension.stage',
    surveyor: 'reportBuilder.dimension.surveyor',
    city: 'reportBuilder.dimension.city',
    month: 'reportBuilder.dimension.month',
    supplier: 'reportBuilder.dimension.supplier',
  },
  range: {
    label: 'reportBuilder.range.label',
    last7: 'reportBuilder.range.last7',
    last30: 'reportBuilder.range.last30',
    last90: 'reportBuilder.range.last90',
    thisMonth: 'reportBuilder.range.thisMonth',
  },
  incompatible: 'reportBuilder.incompatible',
  wideWarning: 'reportBuilder.wideWarning',
  preview: 'reportBuilder.preview',
  previewEmpty: 'reportBuilder.previewEmpty',
  save: 'reportBuilder.save',
  saveName: 'reportBuilder.saveName',
  saved: 'reportBuilder.saved',
  savedReports: 'reportBuilder.savedReports',
  load: 'reportBuilder.load',
  delete: 'reportBuilder.delete',
  saveFailed: { name_taken: 'reportBuilder.saveFailed.name_taken', too_many: 'reportBuilder.saveFailed.too_many', generic: 'reportBuilder.saveFailed.generic' },
  scheduleNote: 'reportBuilder.scheduleNote',
  exportCsv: 'reportBuilder.exportCsv',
  exportPdfNote: 'reportBuilder.exportPdfNote',
  exported: 'reportBuilder.exported',
  governedNote: 'reportBuilder.governedNote',
  column: { dimension: 'reportBuilder.column.dimension', value: 'reportBuilder.column.value' },
  error: { title: 'reportBuilder.error.title', body: 'reportBuilder.error.body' },
} as const;
