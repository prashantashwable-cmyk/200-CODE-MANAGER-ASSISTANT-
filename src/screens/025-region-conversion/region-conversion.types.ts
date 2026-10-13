/** Screen 025 — Conversion Rate by Surveyor/Region. Types and keys only. */

export type MatrixStatus = 'loading' | 'ready' | 'empty' | 'error';

export type Axis = 'surveyorRows' | 'regionRows';

/** Below this lead count in a cell, colour-coding it would overstate confidence. */
export const SIGNIFICANCE_THRESHOLD = 5;

export interface MatrixCell {
  surveyorId: string;
  surveyorName: string;
  region: string;
  leadCount: number;
  dealCount: number;
  rate: number;
  /** True when the cell has no leads at all — a clean blank, not a claimed 0%. */
  isBlank: boolean;
  significant: boolean;
}

export interface MatrixModel {
  surveyors: string[];
  regions: string[];
  cellsBySurveyor: Map<string, Map<string, MatrixCell>>;
}

export const REGION_CONVERSION_KEYS = {
  title: 'regionConversion.title',
  subtitle: 'regionConversion.subtitle',
  loading: 'regionConversion.loading',
  axis: { surveyorRows: 'regionConversion.axis.surveyorRows', regionRows: 'regionConversion.axis.regionRows' },
  flip: 'regionConversion.flip',
  legend: 'regionConversion.legend',
  significanceNote: 'regionConversion.significanceNote',
  lowSampleLabel: 'regionConversion.lowSampleLabel',
  blankNote: 'regionConversion.blankNote',
  cellSummary: 'regionConversion.cellSummary',
  sheetTitle: 'regionConversion.sheetTitle',
  noLeads: 'regionConversion.noLeads',
  historicalNote: 'regionConversion.historicalNote',
  sortBy: 'regionConversion.sortBy',
  sort: { name: 'regionConversion.sort.name', rate: 'regionConversion.sort.rate', volume: 'regionConversion.sort.volume' },
  empty: { title: 'regionConversion.empty.title', body: 'regionConversion.empty.body' },
  error: { title: 'regionConversion.error.title', body: 'regionConversion.error.body' },
} as const;
