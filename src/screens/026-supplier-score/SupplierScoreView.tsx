import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Warning } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  ListRow,
  LoadingState,
  ProgressBar,
  Screen,
  ScreenHeader,
  formatINRCompact,
  formatPercent,
} from '@/design-system';
import { useSupplierScore } from './useSupplierScore';
import { SUPPLIER_SCORE_KEYS as K, WEIGHT_KEYS } from './supplier-score.types';
import type { SupplierScoreRow } from './supplier-score.types';

/**
 * Screen 026 — Supplier Performance Scorecard. Which suppliers are becoming a
 * liability is visible before it causes a customer-facing delay, and every
 * score traces back to the orders that produced it.
 */
export function SupplierScoreView() {
  const { t } = useTranslation();
  const s = useSupplierScore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [weightsOpen, setWeightsOpen] = useState(false);

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

  const watchlisted = s.active.filter((r) => r.onWatchlist);

  return (
    <Screen width="wide">
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(K.subtitle)}
        action={
          <Button size="sm" variant="ghost" onClick={() => setWeightsOpen((v) => !v)}>
            {t(K.weightsHeading)}
          </Button>
        }
      />

      {weightsOpen && (
        <Card className="mb-4">
          <div className="stack gap-4">
            {WEIGHT_KEYS.map((key) => (
              <div key={key} className="stack gap-1">
                <div className="row between">
                  <span className="t-sm t-medium">{t(K.weight[key])}</span>
                  <span className="t-sm num">{formatPercent(s.weights[key], 0)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(s.weights[key] * 100)}
                  onChange={(e) => s.setWeight(key, Number(e.target.value) / 100)}
                  className="full-w"
                />
              </div>
            ))}
          </div>
          <p className="t-xs t-muted mt-3">{t(K.placeholderNote)}</p>
        </Card>
      )}

      {watchlisted.length > 0 && (
        <Card className="mb-4">
          <h2 className="t-md t-semibold row gap-2 t-warning">
            <Warning size={18} />
            {t(K.watchlist)}
          </h2>
          <p className="t-xs t-muted mt-2">{t(K.watchlistAuto)}</p>
          <div className="row wrap gap-2 mt-3">
            {watchlisted.map((row) => (
              <Badge key={row.supplier.id} tone="warning">
                {row.supplier.name}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      <div className="stack gap-3">
        {s.active.map((row) => (
          <SupplierCard
            key={row.supplier.id}
            row={row}
            expanded={expanded === row.supplier.id}
            onToggle={() => setExpanded((cur) => (cur === row.supplier.id ? null : row.supplier.id))}
            onToggleWatchlist={() => void s.toggleWatchlist(row.supplier.id)}
          />
        ))}
      </div>

      {s.pending.length > 0 && (
        <>
          <h2 className="t-lg mt-5 mb-2">{t(K.pendingHeading)}</h2>
          <Card flush>
            {s.pending.map((supplier) => (
              <ListRow key={supplier.id} title={supplier.name} subtitle={supplier.city} trailing={<Badge tone="neutral">{t('status.pending_approval')}</Badge>} />
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

function SupplierCard({
  row,
  expanded,
  onToggle,
  onToggleWatchlist,
}: {
  row: SupplierScoreRow;
  expanded: boolean;
  onToggle: () => void;
  onToggleWatchlist: () => void;
}) {
  const { t } = useTranslation();
  const { supplier } = row;
  const tone = row.overallScore >= 0.75 ? 'success' : row.overallScore >= 0.6 ? 'warning' : 'error';

  return (
    <Card selected={row.onWatchlist}>
      <div className="row between gap-3">
        <span className="stack gap-1 grow" style={{ minWidth: 0 }}>
          <span className="t-md t-semibold truncate">{supplier.name}</span>
          <span className="t-xs t-muted">{supplier.city}</span>
        </span>
        <span className="stack items-end gap-1 shrink-0">
          <span className="t-lg t-semibold num">{formatPercent(row.overallScore, 0)}</span>
          {row.isEarlyData && <Badge tone="neutral">{t(K.earlyData)}</Badge>}
        </span>
      </div>

      <div className="mt-3">
        <ProgressBar value={row.overallScore} tone={tone} label={t(K.overallScore)} />
      </div>

      {row.isEarlyData && <p className="t-xs t-muted mt-2">{t(K.earlyDataNote)}</p>}

      <div className="row gap-2 wrap mt-3">
        <Button size="sm" variant="ghost" onClick={onToggle}>
          {t(K.viewOrders)}
        </Button>
        <Button size="sm" variant="quiet" onClick={onToggleWatchlist}>
          {row.onWatchlist ? t(K.watchlistRemove) : t(K.watchlistAdd)}
        </Button>
      </div>

      {expanded && (
        <div className="stack gap-3 mt-4 hairline-top" style={{ paddingTop: 'var(--space-3)' }}>
          <div className="grid-2 gap-3">
            <Metric label={t(K.metric.onTime)} value={formatPercent(supplier.onTimeRate, 0)} />
            <Metric label={t(K.metric.quality)} value={`${supplier.qualityScore.toFixed(1)} / 5`} />
            <Metric label={t(K.metric.price)} value={formatPercent(row.priceScore, 0)} placeholder />
            <Metric label={t(K.metric.responsiveness)} value={formatPercent(row.responsivenessScore, 0)} placeholder />
          </div>

          <div className="row between">
            <span className="t-xs t-muted">{t(K.openOrders)}</span>
            <span className="t-sm t-semibold num">{supplier.openOrders}</span>
          </div>
          <div className="row between">
            <span className="t-xs t-muted">{t(K.totalValue)}</span>
            <span className="t-sm t-semibold num">{formatINRCompact(supplier.totalOrderValue)}</span>
          </div>

          {/* A single resolved incident stays visible for context rather than
              silently tanking the score with no explanation. */}
          {supplier.onTimeRate < 0.85 && (
            <p className="t-xs t-muted">{t(K.incidentNote)}</p>
          )}

          <p className="t-xs t-muted">{t(K.disputeNote)}</p>
        </div>
      )}
    </Card>
  );
}

function Metric({ label, value, placeholder }: { label: string; value: string; placeholder?: boolean }) {
  return (
    <div className="stack gap-1">
      <span className="t-xs t-muted">
        {label}
        {placeholder && ' *'}
      </span>
      <span className="t-sm t-semibold num">{value}</span>
    </div>
  );
}
