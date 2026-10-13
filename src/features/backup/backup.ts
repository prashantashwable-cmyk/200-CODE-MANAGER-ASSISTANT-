/**
 * Backups and data exports (196). Pure: the screen, the heartbeat and the repository judge with the same rules. Every number is a placeholder business decision flagged on the screen.
 */
export type BackupStatus = 'success' | 'failed';
export type BackupTrigger = 'scheduled' | 'retry' | 'manual';
export type BackupFailure = 'storage_unreachable' | 'quota_exceeded' | 'timeout' | 'credentials_expired';
export const FAILURES: BackupFailure[] = ['storage_unreachable', 'quota_exceeded', 'timeout', 'credentials_expired'];

export interface BackupConfig { enabled: boolean; everyHours: 6 | 12 | 24; atHour: number; retainDays: number; verifyEach: boolean }
export const DEFAULT_BACKUP: BackupConfig = { enabled: true, everyHours: 24, atHour: 2, retainDays: 30, verifyEach: true };
export const EVERY_OPTIONS: BackupConfig['everyHours'][] = [6, 12, 24];
export const RETRY_MINUTES = 30;
export const MAX_RETRIES = 3;
export const RESTORE_TEST_DAYS = 90;
export const RESTORE_TEST_NUDGE_DAYS = 7;
export const FOLLOWUP_H = 4;
export const REASON_MIN = 10;
export const NOTE_MIN = 20;
export const RUNS_PAGE = 20;

export type BackupConfigProblem = 'every_invalid' | 'hour_invalid' | 'retain_range';
export function backupConfigProblems(c: BackupConfig): BackupConfigProblem[] {
  const out: BackupConfigProblem[] = [];
  if (!EVERY_OPTIONS.includes(c.everyHours)) out.push('every_invalid');
  if (!Number.isInteger(c.atHour) || c.atHour < 0 || c.atHour > 23) out.push('hour_invalid');
  if (!Number.isInteger(c.retainDays) || c.retainDays < 7 || c.retainDays > 365) out.push('retain_range');
  return out;
}
/** Changes that leave the business less protected: allowed, but only with an explicit confirmation. */
export function backupWeakenings(prev: BackupConfig, next: BackupConfig): string[] {
  const out: string[] = [];
  if (prev.enabled && !next.enabled) out.push('switched_off');
  if (next.everyHours > prev.everyHours) out.push('less_often');
  if (next.retainDays < prev.retainDays) out.push('shorter_keep');
  if (prev.verifyEach && !next.verifyEach) out.push('no_verify');
  return out;
}

/** The most recent moment a scheduled backup was due at or before `now` (ms). */
export function latestSlot(c: BackupConfig, now: number): number {
  const d = new Date(now);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  let best = -Infinity;
  for (let dayOffset = -1; dayOffset <= 0; dayOffset += 1) {
    for (let k = 0; k * c.everyHours < 24; k += 1) {
      const t = day + dayOffset * 86_400_000 + (c.atHour + k * c.everyHours) * 3_600_000;
      if (t <= now && t > best) best = t;
    }
  }
  return best;
}

/** The next moment a scheduled backup is due after `now` (ms). */
export function nextSlot(c: BackupConfig, now: number): number {
  const d = new Date(now);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  let best = Infinity;
  for (let dayOffset = 0; dayOffset <= 1; dayOffset += 1) {
    for (let k = 0; k * c.everyHours < 24; k += 1) {
      const t = day + dayOffset * 86_400_000 + (c.atHour + k * c.everyHours) * 3_600_000;
      if (t > now && t < best) best = t;
    }
  }
  return best;
}

export type RestoreState = 'fresh' | 'aging' | 'stale' | 'none';
/** How old the most recent restore point is, against how often a backup is meant to run. */
export function restoreStateOf(lastSuccessAt: string | null, c: BackupConfig, now: number): { state: RestoreState; ageHours: number | null } {
  if (!lastSuccessAt) return { state: 'none', ageHours: null };
  const ageHours = Math.max(0, (now - Date.parse(lastSuccessAt)) / 3_600_000);
  const state: RestoreState = ageHours <= c.everyHours + 1 ? 'fresh' : ageHours <= c.everyHours * 1.5 + 2 ? 'aging' : 'stale';
  return { state, ageHours };
}
/** A backup is overdue once the newest success is older than this: loud, not silent. */
export const staleAfterHours = (c: BackupConfig): number => c.everyHours * 1.5 + 2;

/** A fast non-cryptographic fingerprint (a real backend would use a cryptographic checksum of the stored files). */
export function checksumOf(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

/* ------------------------------------------------------------------ exports */

export type PersonalClass = 'none' | 'identity' | 'contact';
export interface ColumnDef { key: string; personal: PersonalClass }
export type DatasetId = 'leads' | 'deals' | 'payments' | 'invoices' | 'payouts' | 'tds' | 'supplier_payments' | 'suppliers' | 'people' | 'audit_log';
export interface DatasetDef { id: DatasetId; dateField: string | null; columns: ColumnDef[]; /** The screen that owns this record, for a link. */ route: string }
const c = (key: string, personal: PersonalClass = 'none'): ColumnDef => ({ key, personal });
export const DATASETS: DatasetDef[] = [
  { id: 'leads', dateField: 'createdAt', route: '/admin/leads', columns: [c('code'), c('createdAt'), c('stage'), c('source'), c('city'), c('pincode'), c('estimatedValue'), c('surveyorId'), c('builderName', 'identity'), c('contactName', 'identity'), c('contactPhone', 'contact'), c('contactEmail', 'contact'), c('address', 'contact')] },
  { id: 'deals', dateField: 'createdAt', route: '/admin/deals', columns: [c('code'), c('leadId'), c('status'), c('quotedPrice'), c('agreedPrice'), c('marginAmount'), c('gstPercent'), c('createdAt'), c('closedAt'), c('customerGstin', 'identity')] },
  { id: 'payments', dateField: 'dueDate', route: '/payments/history', columns: [c('code'), c('dealId'), c('stage'), c('amount'), c('status'), c('dueDate'), c('paidAt'), c('method'), c('amountReceived')] },
  { id: 'invoices', dateField: 'issuedAt', route: '/gst-compliance', columns: [c('code'), c('dealId'), c('type'), c('issuedAt'), c('taxableValue'), c('gstPercent'), c('gstAmount'), c('totalAmount'), c('aiecGstin'), c('customerName', 'identity'), c('customerGstin', 'identity'), c('customerAddress', 'contact')] },
  { id: 'payouts', dateField: 'earnedAt', route: '/payout-tracker', columns: [c('id'), c('userId'), c('reasonKey'), c('amount'), c('status'), c('earnedAt'), c('paidAt'), c('dealId'), c('jobId')] },
  { id: 'tds', dateField: 'deductedAt', route: '/tds-statement', columns: [c('code'), c('partnerId'), c('role'), c('section'), c('fy'), c('quarter'), c('deductedAt'), c('grossAmount'), c('rate'), c('amount'), c('panOnFile')] },
  { id: 'supplier_payments', dateField: 'dueAt', route: '/supplier-payments', columns: [c('code'), c('poId'), c('supplierId'), c('part'), c('amount'), c('status'), c('dueAt'), c('executedAt'), c('bankReference')] },
  { id: 'suppliers', dateField: null, route: '/admin/suppliers', columns: [c('id'), c('status'), c('city'), c('gstin', 'identity'), c('name', 'identity'), c('contactName', 'identity'), c('contactPhone', 'contact')] },
  { id: 'people', dateField: 'joinedAt', route: '/partner-directory', columns: [c('id'), c('role'), c('status'), c('city'), c('joinedAt'), c('name', 'identity'), c('phone', 'contact'), c('email', 'contact')] },
  { id: 'audit_log', dateField: 'at', route: '/audit-log', columns: [c('seq'), c('at'), c('sourceKey'), c('affectedRecordType'), c('affectedRecordId'), c('triggeringCondition'), c('actionTaken')] },
];
export const datasetDef = (id: string): DatasetDef | undefined => DATASETS.find((d) => d.id === id);

export type ExportPurpose = 'accountant_gst' | 'accountant_tds' | 'audit' | 'own_analysis' | 'migration';
export const PURPOSES: ExportPurpose[] = ['accountant_gst', 'accountant_tds', 'audit', 'own_analysis', 'migration'];
/** The personal-data classes each stated purpose can reasonably need. Anything beyond it needs a written justification and a confirmation. */
export const ALLOWED: Record<ExportPurpose, PersonalClass[]> = {
  accountant_gst: ['identity'], accountant_tds: ['identity'], audit: ['identity'], own_analysis: [], migration: ['identity', 'contact'],
};
export const FORMATS = ['csv', 'json'] as const;
export type ExportFormat = (typeof FORMATS)[number];
export const CHUNK_ROWS = 50;
export const KEEP_DAYS = 7;
export const EXPORT_NOTE_MIN = 10;
export const JUSTIFY_MIN = 20;
export const MAX_ROWS = 200_000;
export const EXPORTS_PAGE = 15;

export const allowedColumns = (purpose: ExportPurpose, ds: DatasetDef): string[] => ds.columns.filter((col) => col.personal === 'none' || ALLOWED[purpose].includes(col.personal)).map((col) => col.key);
/** Personal columns chosen beyond what the purpose allows. */
export const excessColumns = (purpose: ExportPurpose, ds: DatasetDef, columns: string[]): string[] => ds.columns.filter((col) => columns.includes(col.key) && col.personal !== 'none' && !ALLOWED[purpose].includes(col.personal)).map((col) => col.key);
export const personalColumns = (ds: DatasetDef, columns: string[]): string[] => ds.columns.filter((col) => columns.includes(col.key) && col.personal !== 'none').map((col) => col.key);

export type ExportProblem = 'dataset_unknown' | 'purpose_invalid' | 'format_invalid' | 'columns_empty' | 'column_unknown' | 'period_invalid' | 'purpose_note_short' | 'justification_short' | 'confirm_required' | 'too_large';
export interface ExportRequest { datasetId: string; purpose: string; purposeNote: string; format: string; columns: string[]; from: string | null; to: string | null; justification?: string; confirmed?: boolean }
export function exportProblems(r: ExportRequest, rowCount: number): ExportProblem[] {
  const out: ExportProblem[] = [];
  const ds = datasetDef(r.datasetId);
  if (!ds) { out.push('dataset_unknown'); return out; }
  if (!(PURPOSES as string[]).includes(r.purpose)) out.push('purpose_invalid');
  if (!(FORMATS as readonly string[]).includes(r.format)) out.push('format_invalid');
  if (r.columns.length === 0) out.push('columns_empty');
  else if (r.columns.some((k) => !ds.columns.some((col) => col.key === k))) out.push('column_unknown');
  const f = r.from ? Date.parse(r.from) : null;
  const t = r.to ? Date.parse(r.to) : null;
  if ((r.from && !Number.isFinite(f)) || (r.to && !Number.isFinite(t)) || (f !== null && t !== null && f > t)) out.push('period_invalid');
  if ((r.purposeNote ?? '').replace(/[^\p{L}\p{N}]/gu, '').length < EXPORT_NOTE_MIN) out.push('purpose_note_short');
  if ((PURPOSES as string[]).includes(r.purpose) && r.columns.length > 0 && !out.includes('column_unknown')) {
    const excess = excessColumns(r.purpose as ExportPurpose, ds, r.columns);
    if (excess.length > 0) {
      if ((r.justification ?? '').replace(/[^\p{L}\p{N}]/gu, '').length < JUSTIFY_MIN) out.push('justification_short');
      if (!r.confirmed) out.push('confirm_required');
    }
  }
  if (rowCount > MAX_ROWS) out.push('too_large');
  return out;
}

export const csvEscape = (v: unknown): string => {
  let s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
  // A cell that starts like a formula is neutralised so a spreadsheet never runs it.
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const fileNameOf = (datasetId: string, from: string | null, to: string | null, format: ExportFormat, code: string): string => `aiec-${datasetId}${from ? `-${from.slice(0, 10)}` : ''}${to ? `-to-${to.slice(0, 10)}` : ''}-${code.toLowerCase()}.${format}`;
