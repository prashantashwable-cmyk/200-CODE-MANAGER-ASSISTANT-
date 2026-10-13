import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { UploadSimple } from '@phosphor-icons/react';
import { Badge, Button, Card, Screen, ScreenHeader, Select, formatDateTime, useToast } from '@/design-system';
import { useLeadImportExport } from './useLeadImportExport';
import { ALL_IMPORT_FIELDS, LEAD_IMPORT_EXPORT_KEYS as K, OPTIONAL_IMPORT_FIELDS, REQUIRED_IMPORT_FIELDS } from './lead-import-export.types';
import type { ImportField } from './lead-import-export.types';

const ERROR_KEY: Record<string, string> = {
  missing_builderName: K.preview.error.missing_builderName,
  missing_contactName: K.preview.error.missing_contactName,
  missing_contactPhone: K.preview.error.missing_contactPhone,
  missing_siteName: K.preview.error.missing_siteName,
  missing_city: K.preview.error.missing_city,
  invalid_phone: K.preview.error.invalid_phone,
};

/**
 * Screen 050 — Bulk Lead Import/Export. A four-step wizard (upload → map →
 * validate → commit) that reuses the exact repository calls a field capture
 * or a Kanban stage move would use — nothing here is a second write path.
 */
export function LeadImportExportView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useLeadImportExport();
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Screen>
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      {s.step === 'upload' && (
        <>
          <Card className="mb-4">
            <div className="stack gap-3 items-start">
              <span className="t-sm t-semibold">{t(K.upload.heading)}</span>
              <p className="t-sm t-muted">{t(K.upload.body)}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void s.loadFile(file);
                  e.target.value = '';
                }}
              />
              <Button icon={<UploadSimple size={16} />} onClick={() => fileInputRef.current?.click()}>
                {t(K.upload.chooseFile)}
              </Button>
              {s.invalidFile && <p className="t-xs t-error">{t(K.upload.invalidFile)}</p>}
            </div>
          </Card>

          <h2 className="t-lg mb-2">{t(K.exportSection.heading)}</h2>
          <Card className="mb-4">
            <p className="t-sm t-muted mb-3">{t(K.exportSection.body)}</p>
            <Button
              variant="secondary"
              onClick={() => {
                void s.exportAllLeads();
                toast.push(t(K.toast.exported), 'success');
              }}
            >
              {t(K.exportSection.button)}
            </Button>
            <p className="t-xs t-muted mt-2">{t(K.exportSection.perScreenNote)}</p>
          </Card>

          <h2 className="t-lg mb-2">{t(K.history.heading)}</h2>
          {s.batches.length === 0 ? (
            <p className="t-sm t-muted">{t(K.history.empty)}</p>
          ) : (
            <Card flush>
              {s.batches.map((batch) => (
                <div key={batch.id} className="ds-listrow ds-listrow--static">
                  <span className="grow stack gap-1" style={{ minWidth: 0 }}>
                    <span className="t-sm truncate">{batch.fileName}</span>
                    <span className="t-xs t-muted truncate">{formatDateTime(batch.importedAt, i18n.language)}</span>
                  </span>
                  <span className="t-xs t-muted shrink-0">{t(K.history.row, { imported: batch.importedRows, rejected: batch.rejectedRows })}</span>
                </div>
              ))}
            </Card>
          )}
        </>
      )}

      {s.step === 'mapping' && (
        <>
          <h2 className="t-lg mb-2">{t(K.mapping.heading)}</h2>
          <p className="t-sm t-muted mb-3">{t(K.mapping.body, { count: s.rowCount })}</p>
          <Card className="mb-4">
            <div className="stack gap-3">
              {ALL_IMPORT_FIELDS.map((field: ImportField) => (
                <div key={field} className="stack gap-1">
                  <span className="label">
                    {t(K.field[field])} <span className="t-xs t-muted">({t(REQUIRED_IMPORT_FIELDS.includes(field as (typeof REQUIRED_IMPORT_FIELDS)[number]) ? K.mapping.required : K.mapping.optional)})</span>
                  </span>
                  <Select value={s.mapping[field] ?? ''} onChange={(e) => s.setMapping(field, e.target.value)}>
                    <option value="">—</option>
                    {s.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          </Card>
          <div className="row gap-2">
            <Button block disabled={!s.canProceedToPreview} onClick={() => void s.goToPreview()}>
              {t(K.mapping.continue)}
            </Button>
            <Button block variant="secondary" onClick={s.backToUpload}>
              {t(K.mapping.back)}
            </Button>
          </div>
        </>
      )}

      {s.step === 'preview' && s.preview && (
        <>
          <h2 className="t-lg mb-2">{t(K.preview.heading)}</h2>
          <div className="row gap-3 mb-4">
            <Badge tone="success">{t(K.preview.validCount, { count: s.preview.validCount })}</Badge>
            {s.preview.errorCount > 0 && <Badge tone="error">{t(K.preview.errorCount, { count: s.preview.errorCount })}</Badge>}
          </div>
          <Card flush className="mb-4">
            {s.preview.rows.map((row) => (
              <div key={row.rowNumber} className="ds-listrow ds-listrow--static">
                <span className="grow stack gap-1" style={{ minWidth: 0 }}>
                  <span className="t-sm truncate">{t(K.preview.rowLabel, { row: row.rowNumber })} — {row.values.siteName || row.values.contactName || '—'}</span>
                  {row.errors.length > 0 && (
                    <span className="t-xs t-error">{row.errors.map((e) => t(ERROR_KEY[e] ?? e)).join(', ')}</span>
                  )}
                  {row.duplicateOfLeadId && <span className="t-xs t-warning">{t(K.preview.duplicateNote)}</span>}
                </span>
                <Badge tone={row.errors.length > 0 ? 'error' : 'success'}>{row.errors.length > 0 ? '✕' : '✓'}</Badge>
              </div>
            ))}
          </Card>
          <div className="row gap-2">
            <Button
              block
              disabled={s.preview.validCount === 0}
              onClick={() =>
                void s.commit().then(() => toast.push(t(K.toast.imported), 'success'))
              }
            >
              {t(K.preview.commit)}
            </Button>
            <Button block variant="secondary" onClick={s.backToMapping}>
              {t(K.preview.back)}
            </Button>
          </div>
        </>
      )}

      {s.step === 'done' && s.committedBatch && (
        <>
          <h2 className="t-lg mb-2">{t(K.done.heading)}</h2>
          <Card className="mb-4">
            <p className="t-sm">{t(K.done.summary, { imported: s.committedBatch.importedRows, rejected: s.committedBatch.rejectedRows })}</p>
          </Card>
          <div className="row gap-2">
            <Button block onClick={() => navigate('/admin/leads')}>
              {t(K.done.viewLeads)}
            </Button>
            <Button block variant="secondary" onClick={s.reset}>
              {t(K.done.importAnother)}
            </Button>
          </div>
        </>
      )}
    </Screen>
  );
}
