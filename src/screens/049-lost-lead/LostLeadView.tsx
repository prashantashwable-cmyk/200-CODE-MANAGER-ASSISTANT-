import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  TextArea,
  formatINRCompact,
  relativeTimeParts,
  useToast,
} from '@/design-system';
import { STAGE_TONE } from '@/features/crm/stageTone';
import { useLostLead } from './useLostLead';
import { LOST_LEAD_KEYS as K, LOST_REASON_KEYS, REVISIT_MONTH_OPTIONS } from './lost-lead.types';
import type { LostReasonKey } from './lost-lead.types';

const REVISIT_LABEL_KEY: Record<number, string> = {
  0: K.revisit.none,
  1: K.revisit.m1,
  3: K.revisit.m3,
  6: K.revisit.m6,
  12: K.revisit.m12,
};

/**
 * Screen 049 — Lost Lead Disqualification. Deliberately small and fast — a
 * fixed reason taxonomy, one optional note, an optional dated revisit
 * reminder, and one final glance at the lead before it leaves active views.
 */
export function LostLeadView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useLostLead();

  const [reasonKey, setReasonKey] = useState<LostReasonKey | ''>('');
  const [note, setNote] = useState('');
  const [revisitMonths, setRevisitMonths] = useState(0);

  if (s.status === 'loading') {
    return (
      <Screen width="narrow">
        <ScreenHeader title="" back={() => navigate(-1)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
      </Screen>
    );
  }

  if (s.status === 'not_found') {
    return (
      <Screen width="narrow">
        <ScreenHeader title="" back={() => navigate('/admin/leads')} />
        <EmptyState title={t(K.notFound.title)} body={t(K.notFound.body)} />
      </Screen>
    );
  }

  if (s.status === 'error' || !s.lead) {
    return (
      <Screen width="narrow">
        <ScreenHeader title="" back={() => navigate(-1)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  const lead = s.lead;

  if (lead.stage === 'lost') {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.alreadyLost.title)} back={() => navigate(`/admin/leads/${lead.id}`)} />
        <Card className="mb-4">
          <p className="t-sm t-muted">{t(K.alreadyLost.body)}</p>
        </Card>
        <Button
          block
          variant="secondary"
          onClick={() =>
            void s.reopen().then((ok) => toast.push(t(ok ? K.toast.reopened : K.toast.error), ok ? 'success' : 'error'))
          }
        >
          {t(K.alreadyLost.reopen)}
        </Button>
      </Screen>
    );
  }

  return (
    <Screen width="narrow">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle, { site: lead.siteName })} back={() => navigate(`/admin/leads/${lead.id}`)} />

      <h2 className="t-lg mb-2">{t(K.glance.heading)}</h2>
      <Card className="mb-4">
        <div className="stack gap-2 mb-3">
          <div className="row between">
            <span className="t-sm t-muted">{t(K.glance.stage)}</span>
            <Badge tone={STAGE_TONE[lead.stage]}>{t(`stage.${lead.stage}`)}</Badge>
          </div>
          <div className="row between">
            <span className="t-sm t-muted">{t(K.glance.value)}</span>
            <span className="t-sm t-semibold num">{formatINRCompact(lead.estimatedValue)}</span>
          </div>
          <div className="row between">
            <span className="t-sm t-muted">{t(K.glance.owner)}</span>
            <span className="t-sm">{s.ownerName || '—'}</span>
          </div>
        </div>
        <span className="t-xs t-semibold">{t(K.glance.recentActivity)}</span>
        {s.recentEvents.length === 0 ? (
          <p className="t-xs t-muted mt-1">{t(K.glance.noActivity)}</p>
        ) : (
          <div className="stack gap-1 mt-1">
            {s.recentEvents.map((event) => {
              const rel = relativeTimeParts(event.at);
              return (
                <div key={event.id} className="row between gap-2">
                  <span className="t-xs t-muted truncate">{event.detail || t(K.eventKind[event.kind])}</span>
                  <span className="t-xs t-muted shrink-0">{t(rel.key, { count: rel.count })}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="stack gap-4 mb-4">
        <div className="stack gap-1">
          <span className="label">{t(K.reasonLabel)}</span>
          <Select value={reasonKey} onChange={(e) => setReasonKey(e.target.value as LostReasonKey)}>
            <option value="">—</option>
            {LOST_REASON_KEYS.map((r) => (
              <option key={r} value={r}>
                {t(`lostReason.${r}`)}
              </option>
            ))}
          </Select>
        </div>
        <div className="stack gap-1">
          <span className="label">{t(K.noteLabel)}</span>
          <TextArea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder={t(K.notePlaceholder)} />
        </div>
        <div className="stack gap-1">
          <span className="label">{t(K.revisitLabel)}</span>
          <Select value={revisitMonths} onChange={(e) => setRevisitMonths(Number(e.target.value))}>
            {REVISIT_MONTH_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {t(REVISIT_LABEL_KEY[m])}
              </option>
            ))}
          </Select>
          {revisitMonths > 0 && <span className="t-xs t-muted">{t(K.revisitHint)}</span>}
        </div>
      </div>

      <div className="row gap-2">
        <Button
          block
          variant="danger"
          disabled={!reasonKey}
          onClick={() =>
            reasonKey &&
            void s.submit(reasonKey, note, revisitMonths).then((ok) => {
              if (ok) toast.push(t(K.toast.marked), 'success');
              else toast.push(t(K.toast.error), 'error');
            })
          }
        >
          {t(K.confirm)}
        </Button>
        <Button block variant="secondary" onClick={() => navigate(`/admin/leads/${lead.id}`)}>
          {t(K.cancel)}
        </Button>
      </div>
    </Screen>
  );
}
