import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, WarningCircle } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  Sheet,
  formatDateTime,
  useToast,
} from '@/design-system';
import { useCallLog } from './useCallLog';
import { CALL_LOG_KEYS as K, DISPOSITION_OPTIONS } from './call-log.types';
import type { CallLogRow } from './useCallLog';

const OUTCOME_TONE: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  connected_interested: 'success',
  connected_not_interested: 'neutral',
  no_answer: 'warning',
  wrong_number: 'error',
  pocket_dial: 'neutral',
};

function formatDuration(sec: number): string {
  if (sec <= 0) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function CallLogView() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const s = useCallLog();

  const [manualLeadId, setManualLeadId] = useState<string | null>(null);
  const [manualOutcome, setManualOutcome] = useState('');
  const [manualDuration, setManualDuration] = useState(0);
  const [manualConsent, setManualConsent] = useState(false);

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="list" rows={6} />
      </Screen>
    );
  }

  if (s.status === 'error') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <h2 className="t-lg mb-2">{t(K.callSection.heading)}</h2>
      <Card className="mb-4">
        <div className="stack gap-3">
          <Select value={s.pickedLeadId} onChange={(e) => s.setPickedLeadId(e.target.value)}>
            <option value="">{t(K.callSection.pickLead)}</option>
            {s.leadOptions.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.siteName} — {lead.contactName}
              </option>
            ))}
          </Select>
          <div className="row wrap gap-2">
            <Button icon={<Phone size={16} />} disabled={!s.pickedLeadId} onClick={() => void s.callNow().then((call) => call && toast.push(t(K.toast.logged), 'success'))}>
              {t(K.callSection.callNow)}
            </Button>
            <Button variant="secondary" disabled={!s.pickedLeadId} onClick={() => setManualLeadId(s.pickedLeadId)}>
              {t(K.callSection.logManually)}
            </Button>
          </div>
        </div>
      </Card>

      {s.rows.length === 0 ? (
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      ) : (
        <div className="stack gap-2">
          {s.rows.map((row: CallLogRow) => (
            <Card key={row.call.id}>
              <div className="row between items-start gap-3 mb-2">
                <div className="stack gap-1" style={{ minWidth: 0 }}>
                  <span className="t-sm t-semibold truncate">{row.lead?.siteName ?? '—'}</span>
                  <span className="t-xs t-muted truncate">
                    {row.lead?.contactName} · {formatDateTime(row.call.at, i18n.language)}
                  </span>
                </div>
                {row.call.outcome ? (
                  <Badge tone={OUTCOME_TONE[row.call.outcome]}>{t(K.outcome[row.call.outcome])}</Badge>
                ) : (
                  <Badge tone="warning">{t(K.needsDisposition)}</Badge>
                )}
              </div>
              <div className="row gap-3 mb-2">
                <span className="t-xs t-muted">{t(K.durationLabel, { duration: formatDuration(row.call.durationSec) })}</span>
                {row.call.loggedBy === 'manual' && <span className="t-xs t-muted">{t(K.loggedByManual)}</span>}
              </div>
              {row.needsDispositionReminder && (
                <p className="t-xs t-warning row gap-1 items-center mb-2">
                  <WarningCircle size={13} />
                  {t(K.dispositionReminder)}
                </p>
              )}
              {row.suggestChannelSwitch && (
                <p className="t-xs t-warning row gap-1 items-center mb-2">
                  <WarningCircle size={13} />
                  {t(K.switchChannelSuggestion)}
                </p>
              )}
              {row.call.outcome === null && (
                <div className="stack gap-1">
                  <span className="t-xs t-muted">{t(K.dispositionPrompt)}</span>
                  <div className="row wrap gap-2">
                    {DISPOSITION_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className="ds-chip"
                        onClick={() => void s.disposition(row.call.id, opt, row.call.durationSec).then((ok) => toast.push(t(ok ? K.toast.dispositioned : K.toast.error), ok ? 'success' : 'error'))}
                      >
                        {t(K.outcome[opt])}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Sheet
        open={manualLeadId !== null}
        onClose={() => setManualLeadId(null)}
        title={t(K.manualSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button
            block
            disabled={!manualOutcome}
            onClick={() =>
              manualLeadId &&
              void s.logManualCall(manualLeadId, manualOutcome as never, manualDuration, manualConsent).then((ok) => {
                toast.push(t(ok ? K.toast.logged : K.toast.error), ok ? 'success' : 'error');
                if (ok) {
                  setManualLeadId(null);
                  setManualOutcome('');
                  setManualDuration(0);
                  setManualConsent(false);
                }
              })
            }
          >
            {t(K.manualSheet.confirm)}
          </Button>
        }
      >
        <div className="stack gap-3">
          <div className="stack gap-1">
            <span className="label">{t(K.manualSheet.outcomeLabel)}</span>
            <Select value={manualOutcome} onChange={(e) => setManualOutcome(e.target.value)}>
              <option value="">—</option>
              {DISPOSITION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {t(K.outcome[opt])}
                </option>
              ))}
            </Select>
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.manualSheet.durationLabel)}</span>
            <Input type="number" min={0} value={manualDuration} onChange={(e) => setManualDuration(Number(e.target.value))} />
          </div>
          <Checkbox checked={manualConsent} onChange={setManualConsent} label={t(K.manualSheet.consentLabel)} />
        </div>
      </Sheet>
    </Screen>
  );
}
