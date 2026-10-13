import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DownloadSimple, FloppyDisk, Trash, Warning } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Input,
  ListRow,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  formatNumber,
  formatPercent,
  useToast,
} from '@/design-system';
import { useReportBuilder } from './useReportBuilder';
import {
  DIMENSIONS,
  METRICS,
  REPORT_BUILDER_KEYS as K,
  WIDE_REPORT_ROW_WARNING,
} from './report-builder.types';
import type { MetricId, SavedReport } from './report-builder.types';

/**
 * Screen 030 — Custom Report Builder. An ad hoc business question answered
 * without waiting on custom development, live-previewed as selections change,
 * and never able to contradict what the standard dashboards already show.
 */
export function ReportBuilderView() {
  const { t } = useTranslation();
  const toast = useToast();
  const s = useReportBuilder();
  const [reportName, setReportName] = useState('');

  if (s.status === 'loading') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="block" />
      </Screen>
    );
  }

  if (s.status === 'error') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <ErrorState
          title={t(K.error.title)}
          body={t(K.error.body)}
          retryLabel={t('action.retry')}
          onRetry={() => void s.reload()}
        />
      </Screen>
    );
  }

  const isPercent: MetricId[] = ['conversionRate'];
  const isMoney: MetricId[] = ['revenue', 'avgDealSize', 'overdueAmount'];

  const formatValue = (value: number) => {
    if (isPercent.includes(s.metric)) return formatPercent(value, 0);
    if (isMoney.includes(s.metric)) return formatNumber(Math.round(value));
    return formatNumber(value);
  };

  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <Card className="mb-4">
        <div className="grid-2 gap-3">
          <label className="stack gap-2">
            <span className="t-sm t-semibold">{t(K.metric.label)}</span>
            <Select value={s.metric} onChange={(e) => s.setMetric(e.target.value as MetricId)}>
              {METRICS.map((m) => (
                <option key={m} value={m}>
                  {t(K.metric[m])}
                </option>
              ))}
            </Select>
          </label>
          <label className="stack gap-2">
            <span className="t-sm t-semibold">{t(K.dimension.label)}</span>
            <Select value={s.dimension} onChange={(e) => s.setDimension(e.target.value as typeof s.dimension)}>
              {DIMENSIONS.map((d) => (
                <option key={d} value={d}>
                  {t(K.dimension[d])}
                </option>
              ))}
            </Select>
          </label>
        </div>
        <label className="stack gap-2 mt-3">
          <span className="t-sm t-semibold">{t(K.range.label)}</span>
          <Select value={s.range} onChange={(e) => s.setRange(e.target.value as typeof s.range)}>
            <option value="last7">{t(K.range.last7)}</option>
            <option value="last30">{t(K.range.last30)}</option>
            <option value="last90">{t(K.range.last90)}</option>
            <option value="thisMonth">{t(K.range.thisMonth)}</option>
          </Select>
        </label>
      </Card>

      {!s.compatible ? (
        <Card className="mb-4">
          <p className="t-sm t-warning row gap-2">
            <Warning size={16} className="shrink-0" />
            {t(K.incompatible)}
          </p>
        </Card>
      ) : (
        <>
          {s.rows.length > WIDE_REPORT_ROW_WARNING && (
            <Card className="mb-4">
              <p className="t-sm t-warning row gap-2">
                <Warning size={16} className="shrink-0" />
                {t(K.wideWarning, { count: s.rows.length })}
              </p>
            </Card>
          )}

          <h2 className="t-lg mb-2">{t(K.preview)}</h2>
          {s.rows.length === 0 ? (
            <Card body={t(K.previewEmpty)} />
          ) : (
            <Card flush className="mb-4">
              <div className="scroll-x">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>{t(K.column.dimension)}</th>
                      <th className="ds-table__num">{t(K.column.value)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.rows.map((row) => (
                      <tr key={row.dimensionValue}>
                        <td>{row.dimensionValue}</td>
                        <td className="ds-table__num num">{formatValue(row.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <div className="row gap-2 wrap mb-4">
            <Button
              size="sm"
              variant="ghost"
              icon={<DownloadSimple size={14} />}
              onClick={() => {
                s.exportCsv();
                toast.push(t(K.exported), 'success');
              }}
            >
              {t(K.exportCsv)}
            </Button>
          </div>
          <p className="t-xs t-muted mb-4">{t(K.exportPdfNote)}</p>

          <Card className="mb-4">
            <h2 className="t-md t-semibold mb-2">{t(K.save)}</h2>
            <div className="row gap-2">
              <Input
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder={t(K.saveName)}
                className="grow"
              />
              <Button
                icon={<FloppyDisk size={16} />}
                disabled={!reportName.trim()}
                onClick={() => {
                  void s.saveCurrent(reportName.trim()).then((problem) => {
                    if (problem) {
                      toast.push(t(K.saveFailed[problem]), 'error');
                      return;
                    }
                    setReportName('');
                    toast.push(t(K.saved), 'success');
                  });
                }}
              >
                {t(K.save)}
              </Button>
            </div>
          </Card>
        </>
      )}

      {s.saved.length > 0 && (
        <>
          <h2 className="t-lg mb-2">{t(K.savedReports)}</h2>
          <Card flush>
            {s.saved.map((report) => (
              <SavedReportRow
                key={report.id}
                report={report}
                onLoad={() => s.loadSaved(report)}
                onDelete={() => void s.deleteSaved(report.id)}
              />
            ))}
          </Card>
        </>
      )}

      {s.saved.length > 0 && <p className="t-xs t-muted mt-2">{t(K.scheduleNote)}</p>}
      <p className="t-xs t-muted mt-4">{t(K.governedNote)}</p>
    </Screen>
  );
}

function SavedReportRow({
  report,
  onLoad,
  onDelete,
}: {
  report: SavedReport;
  onLoad: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  return (
    <ListRow
      title={report.name}
      subtitle={`${t(`reportBuilder.metric.${report.metric}`)} × ${t(`reportBuilder.dimension.${report.dimension}`)}`}
      trailing={
        <span className="row gap-2">
          <Button size="sm" variant="ghost" onClick={onLoad}>
            {t(K.load)}
          </Button>
          <Button size="sm" variant="quiet" icon={<Trash size={14} />} onClick={onDelete}>
            <span className="sr-only">{t(K.delete)}</span>
          </Button>
        </span>
      }
    />
  );
}
