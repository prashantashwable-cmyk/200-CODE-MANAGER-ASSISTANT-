import { useCallback, useEffect, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { ImportPreview } from '@/data/repository';
import type { LeadImportBatch } from '@/data/types';
import type { ImportField, ImportStep } from './lead-import-export.types';
import { REQUIRED_IMPORT_FIELDS } from './lead-import-export.types';
import { parseCsv, toCsv } from './csv';

interface LeadImportExportState {
  step: ImportStep;
  fileName: string;
  headers: string[];
  rowCount: number;
  mapping: Partial<Record<ImportField, string>>;
  setMapping: (field: ImportField, header: string) => void;
  canProceedToPreview: boolean;
  loadFile: (file: File) => Promise<void>;
  invalidFile: boolean;
  goToPreview: () => Promise<void>;
  preview: ImportPreview | null;
  commit: () => Promise<void>;
  committedBatch: LeadImportBatch | null;
  reset: () => void;
  backToUpload: () => void;
  backToMapping: () => void;
  batches: LeadImportBatch[];
  exportAllLeads: () => Promise<void>;
}

/**
 * Owns the import wizard's client-side state (file → column mapping →
 * validated preview → commit) and the plain "export everything" action.
 * Every row goes through `previewLeadImport`/`commitLeadImport` — the same
 * required-field and duplicate checks a field capture goes through, so a
 * migrated spreadsheet can't sneak in data the app wouldn't otherwise accept.
 */
export function useLeadImportExport(): LeadImportExportState {
  const repository = useData();
  const { user } = useSession();

  const [step, setStep] = useState<ImportStep>('upload');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMappingState] = useState<Partial<Record<ImportField, string>>>({});
  const [invalidFile, setInvalidFile] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [committedBatch, setCommittedBatch] = useState<LeadImportBatch | null>(null);
  const [batches, setBatches] = useState<LeadImportBatch[]>([]);

  const loadBatches = useCallback(async () => {
    setBatches(await repository.listImportBatches());
  }, [repository]);

  useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  const loadFile = useCallback(async (file: File) => {
    const text = await file.text();
    const { headers: parsedHeaders, rows } = parseCsv(text);
    if (parsedHeaders.length === 0 || rows.length === 0) {
      setInvalidFile(true);
      return;
    }
    setInvalidFile(false);
    setFileName(file.name);
    setHeaders(parsedHeaders);
    setRawRows(rows);
    setMappingState({});
    setStep('mapping');
  }, []);

  function setMapping(field: ImportField, header: string) {
    setMappingState((cur) => ({ ...cur, [field]: header }));
  }

  const canProceedToPreview = REQUIRED_IMPORT_FIELDS.every((f) => mapping[f]);

  function mappedRows(): Record<string, string>[] {
    return rawRows.map((row) => {
      const out: Record<string, string> = {};
      for (const [field, header] of Object.entries(mapping)) {
        if (header) out[field] = row[header] ?? '';
      }
      return out;
    });
  }

  const goToPreview = useCallback(async () => {
    const result = await repository.previewLeadImport(mappedRows());
    setPreview(result);
    setStep('preview');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repository, rawRows, mapping]);

  const commit = useCallback(async () => {
    if (!user) return;
    const batch = await repository.commitLeadImport(mappedRows(), fileName, user.name);
    setCommittedBatch(batch);
    setStep('done');
    await loadBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repository, rawRows, mapping, fileName, user, loadBatches]);

  const reset = useCallback(() => {
    setStep('upload');
    setFileName('');
    setHeaders([]);
    setRawRows([]);
    setMappingState({});
    setInvalidFile(false);
    setPreview(null);
    setCommittedBatch(null);
  }, []);

  const exportAllLeads = useCallback(async () => {
    const leads = await repository.listLeads();
    const exportHeaders = ['code', 'stage', 'builderName', 'contactName', 'contactPhone', 'city', 'estimatedValue', 'source'];
    const rows = leads.map((l) => ({
      code: l.code,
      stage: l.stage,
      builderName: l.builderName,
      contactName: l.contactName,
      contactPhone: l.contactPhone,
      city: l.city,
      estimatedValue: String(l.estimatedValue),
      source: l.source,
    }));
    const blob = new Blob([toCsv(exportHeaders, rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aiec-all-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [repository]);

  return {
    step,
    fileName,
    headers,
    rowCount: rawRows.length,
    mapping,
    setMapping,
    canProceedToPreview,
    loadFile,
    invalidFile,
    goToPreview,
    preview,
    commit,
    committedBatch,
    reset,
    backToUpload: () => setStep('upload'),
    backToMapping: () => setStep('mapping'),
    batches,
    exportAllLeads,
  };
}
