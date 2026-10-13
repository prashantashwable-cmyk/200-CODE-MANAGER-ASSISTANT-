import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowClockwise, CheckCircle, Pause, Play, Warning, WarningOctagon } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  formatDateTime,
  formatPercent,
} from '@/design-system';
import { useAutomationHealth } from './useAutomationHealth';
import { AUTOMATION_HEALTH_KEYS as K } from './automation-health.types';
import type { AutomationRow, ComponentHealth } from './automation-health.types';

const HEALTH_TONE: Record<ComponentHealth, 'success' | 'warning' | 'error' | 'neutral'> = {
  healthy: 'success',
  degraded: 'warning',
  down: 'error',
  paused: 'neutral',
};

/**
 * Screen 027 — Automation Health Monitor. The single most important screen
 * for the "one person monitors, the system runs itself" model: the whole
 * pipeline's health is confirmable in under a minute, and no failure can go
 * unnoticed for more than one monitoring cycle.
 */
export function AutomationHealthView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const s = useAutomationHealth();

  if (s.status === 'loading') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={4} />
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

  if (s.status === 'empty') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      </Screen>
    );
  }

  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <Card className="mb-4">
        <div className="row gap-3">
          <span
            className="ds-state__icon shrink-0"
            style={{
              background:
                s.overall === 'healthy'
                  ? 'var(--color-success-soft)'
                  : s.overall === 'down'
                    ? 'var(--color-error-soft)'
                    : 'var(--color-warning-soft)',
              color:
                s.overall === 'healthy'
                  ? 'var(--color-success)'
                  : s.overall === 'down'
                    ? 'var(--color-error)'
                    : 'var(--color-warning)',
            }}
          >
            {s.overall === 'healthy' ? <CheckCircle size={24} weight="fill" /> : <WarningOctagon size={24} weight="fill" />}
          </span>
          <div className="stack gap-1">
            <span className="t-md t-semibold">{t(K.overallHeading)}</span>
            <Badge tone={HEALTH_TONE[s.overall]}>{t(K.status[s.overall])}</Badge>
          </div>
        </div>
      </Card>

      <div className="stack gap-3">
        {s.rows.map((row, index) => (
          <AutomationCard
            key={row.rule.id}
            row={row}
            index={index}
            retrying={s.retryingId === row.rule.id}
            onRetry={() => void s.retry(row.rule)}
            onTogglePause={() => void s.togglePause(row.rule)}
          />
        ))}
      </div>

      <Card className="mt-4">
        <p className="t-sm t-muted">{t(K.fullCheckNote)}</p>
        <div className="mt-2">
          <Button size="sm" variant="ghost" onClick={() => navigate('/admin/alerts')}>
            {t(K.fullCheckLink)}
          </Button>
        </div>
      </Card>
    </Screen>
  );
}

function AutomationCard({
  row,
  index,
  retrying,
  onRetry,
  onTogglePause,
}: {
  row: AutomationRow;
  index: number;
  retrying: boolean;
  onRetry: () => void;
  onTogglePause: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { rule } = row;

  return (
    <Card riseIndex={index} selected={row.health === 'down'}>
      <div className="row between gap-3">
        <span className="stack gap-1 grow" style={{ minWidth: 0 }}>
          <span className="t-md t-semibold truncate">{rule.name}</span>
          <span className="t-xs t-muted">
            {t(K.uptime, { pct: formatPercent(row.uptimePct, 0) })}
          </span>
        </span>
        <Badge tone={HEALTH_TONE[row.health]} dot={row.health === 'down' ? 'live' : true}>
          {t(K.status[row.health])}
        </Badge>
      </div>

      <div className="row wrap gap-4 mt-3 t-xs t-muted">
        <span>
          {t(K.runsToday)}: <span className="num">{rule.runsToday}</span>
        </span>
        <span className={rule.failuresToday > 0 ? 't-error' : undefined}>
          {t(K.failuresToday)}: <span className="num">{rule.failuresToday}</span>
        </span>
        <span>
          {t(K.avgLatency)}: <span className="num">{rule.avgLatencyMs} ms</span>
        </span>
        <span>{t(K.lastRun, { time: formatDateTime(rule.lastRunAt, i18n.language) })}</span>
      </div>

      {row.health === 'paused' && rule.status !== 'paused' && (
        <p className="t-xs t-warning mt-2">{t(K.pausedNeedsAttention)}</p>
      )}

      {row.failures.length > 0 && (
        <div className="stack gap-2 mt-3 hairline-top" style={{ paddingTop: 'var(--space-3)' }}>
          <span className="label">{t(K.failureLog)}</span>
          {row.failures.slice(0, 3).map((failure) => (
            <div key={failure.id} className="row gap-2">
              <Warning size={14} className="t-warning shrink-0" style={{ marginTop: 2 }} />
              <span className="t-xs t-muted grow">
                {failure.reasonText
                  ? t(K.reason.recorded, { count: failure.count, text: failure.reasonText })
                  : t(K.reason.unrecorded, { count: failure.count })}
                {failure.isStuckLoop && (
                  <span className="t-error"> · {t(K.stuckLoop)}</span>
                )}
              </span>
            </div>
          ))}
          {row.failures.some((f) => f.isStuckLoop) && (
            <p className="t-xs t-error">{t(K.stuckLoopNote)}</p>
          )}
        </div>
      )}

      <div className="row gap-2 wrap mt-3">
        {rule.failuresToday > 0 && (
          <Button size="sm" icon={<ArrowClockwise size={14} />} loading={retrying} onClick={onRetry}>
            {retrying ? t(K.retrying) : t(K.retry)}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          icon={rule.enabled ? <Pause size={14} /> : <Play size={14} />}
          onClick={onTogglePause}
        >
          {rule.enabled ? t(K.pause) : t(K.resume)}
        </Button>
      </div>
    </Card>
  );
}
