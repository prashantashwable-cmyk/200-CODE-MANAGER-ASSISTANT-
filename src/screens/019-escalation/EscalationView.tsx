import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Phone, ShieldWarning, Siren, Warning } from '@phosphor-icons/react';
import {
  AscensionLine,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  MapCanvas,
  Screen,
  ScreenHeader,
  TextArea,
  formatDateTime,
} from '@/design-system';
import type { AscensionStep } from '@/design-system';
import { useEscalation } from './useEscalation';
import { ESCALATION_KEYS as K, ESCALATION_STAGES, SOS_CANCEL_WINDOW_S } from './escalation.types';
import type { EscalationEntry } from './escalation.types';

/**
 * Screen 019 — Emergency / Escalation. No SOS can be missed, dismissed or
 * lost: every one has to be acknowledged and then resolved with a written
 * note, and resolved incidents stay in history permanently for safety audits.
 */
export function EscalationView() {
  const { t } = useTranslation();
  const s = useEscalation();

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
      </Screen>
    );
  }

  if (s.status === 'error') {
    return (
      <Screen>
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

  return (
    <Screen>
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(K.subtitle)}
        action={s.open.length > 0 ? <Badge tone="error" dot="live">{s.open.length}</Badge> : undefined}
      />

      <Card className="mb-3">
        <p className="t-xs t-muted">{t(K.cancelWindowNote, { seconds: SOS_CANCEL_WINDOW_S })}</p>
      </Card>

      {s.status === 'empty' ? (
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      ) : (
        <div className="stack gap-3">
          {s.open.map((entry, index) => (
            <AlertCard key={entry.alert.id} entry={entry} index={index} state={s} />
          ))}
        </div>
      )}

      {s.history.length > 0 && (
        <>
          <h2 className="t-lg mt-5 mb-2">{t(K.history)}</h2>
          <p className="t-xs t-muted mb-2">{t(K.historyNote)}</p>
          <div className="stack gap-2">
            {s.history.map((entry) => (
              <Card key={entry.alert.id}>
                <div className="row between gap-2">
                  <span className="stack gap-1 grow" style={{ minWidth: 0 }}>
                    <span className="t-sm t-medium">{t(entry.alert.titleKey)}</span>
                    <span className="t-xs t-muted clamp-2">{entry.alert.context}</span>
                    {entry.alert.resolutionNote && <span className="t-xs clamp-2">{entry.alert.resolutionNote}</span>}
                  </span>
                  <Badge tone="success">{t('status.resolved')}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </Screen>
  );
}

function AlertCard({
  entry,
  index,
  state,
}: {
  entry: EscalationEntry;
  index: number;
  state: ReturnType<typeof useEscalation>;
}) {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const [note, setNote] = useState('');
  const { alert, stage } = entry;
  const isSafety = alert.category === 'safety';
  const reachedIndex = ESCALATION_STAGES.indexOf(stage);

  const railSteps: AscensionStep[] = ESCALATION_STAGES.map((stageId, i) => ({
    id: stageId,
    label: t(K.stage[stageId]),
    meta: t(K.stageMeta[stageId]),
    status: i < reachedIndex ? 'complete' : i === reachedIndex ? 'current' : 'upcoming',
  }));

  return (
    <Card
      riseIndex={index}
      className={isSafety ? 'ds-card--selected' : undefined}
      style={isSafety ? { borderColor: 'var(--color-error)' } : undefined}
    >
      {/* A safety alert must be unmistakable, not merely present in a list. */}
      {isSafety && (
        <div className="row gap-2 mb-3 t-error t-semibold">
          <Siren size={20} weight="fill" />
          {t(K.safetyBanner)}
        </div>
      )}

      <div className="row between gap-2">
        <span className="stack gap-1 grow" style={{ minWidth: 0 }}>
          <span className="t-md t-semibold">{t(alert.titleKey)}</span>
          <span className="t-xs t-muted">{alert.context}</span>
        </span>
        <Badge tone={alert.severity === 'critical' ? 'error' : 'warning'} dot="live">
          {t(`severity.${alert.severity}`)}
        </Badge>
      </div>

      <div className="row wrap gap-2 mt-3">
        <Badge tone="neutral">{alert.code}</Badge>
        <Badge tone="neutral">{t(K.category, { category: alert.category })}</Badge>
        <Badge tone="neutral">
          {t(K.raisedAt, { time: formatDateTime(alert.raisedAt, i18n.language) })}
        </Badge>
      </div>

      {entry.clusterWith.length > 0 && (
        <Card className="mt-3">
          <p className="t-sm t-warning row gap-2">
            <Warning size={16} className="shrink-0" />
            {t(K.cluster, { count: entry.clusterWith.length + 1, codes: entry.clusterWith.join(', ') })}
          </p>
          <p className="t-xs t-muted mt-2">{t(K.clusterNote)}</p>
        </Card>
      )}

      {entry.overdueAcknowledgement && (
        <Card className="mt-3">
          <p className="t-sm t-error row gap-2">
            <ShieldWarning size={16} className="shrink-0" />
            {t(K.overdue)}
          </p>
          <p className="t-xs t-muted mt-2" data-chain>
            {entry.chain?.exhausted ? t(K.chainOut) : entry.chain && entry.chain.firedTiers > 0 ? t(K.chainProgress, { done: entry.chain.firedTiers, total: entry.chain.totalTiers, names: entry.chain.lastNames.join(', ') || '—' }) : t(K.chainNone)}
          </p>
          <Button size="sm" variant="ghost" onClick={() => nav('/escalation-matrix')}>{t(K.chainLink)}</Button>
        </Card>
      )}

      {alert.location && (
        <div className="mt-3">
          <MapCanvas
            label={t(K.mapLabel)}
            height={160}
            markers={[
              {
                id: alert.id,
                lat: alert.location.lat,
                lng: alert.location.lng,
                tone: 'error',
                glyph: '!',
                label: alert.context,
                pulsing: true,
              },
            ]}
          />
        </div>
      )}

      <div className="mt-4">
        <AscensionLine steps={railSteps} />
      </div>

      {/* The call button is front and centre, not buried in a menu. */}
      <div className="row gap-2 wrap mt-4">
        <Button
          variant="danger"
          icon={<Phone size={16} weight="fill" />}
          onClick={() => {
            window.location.href = 'tel:+919822011001';
          }}
        >
          {t(K.liveCall)}
        </Button>

        {stage === 'received' && (
          <Button
            loading={state.busyId === alert.id}
            onClick={() => void state.acknowledge(alert)}
          >
            {t(K.acknowledge)}
          </Button>
        )}
      </div>

      {stage === 'acknowledged' && (
        <div className="stack gap-2 mt-4">
          <label className="stack gap-2">
            <span className="t-sm t-semibold">{t(K.resolveNote)}</span>
            <TextArea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t(K.resolveNoteHint)}
            />
          </label>
          {note.trim().length < 4 && <p className="t-xs t-warning">{t(K.resolveRequired)}</p>}
          <div>
            <Button
              disabled={note.trim().length < 4}
              loading={state.busyId === alert.id}
              onClick={() => void state.resolve(alert, note)}
            >
              {t(K.resolve)}
            </Button>
          </div>
        </div>
      )}

      <p className="t-xs t-muted mt-3">{t(K.noDismiss)}</p>
    </Card>
  );
}
