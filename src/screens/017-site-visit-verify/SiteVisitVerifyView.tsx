import { useTranslation } from 'react-i18next';
import { CheckCircle, Image as ImageIcon, Warning, XCircle } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  MapCanvas,
  ProgressBar,
  Screen,
  ScreenHeader,
  SegBar,
  formatDateTime,
  formatPercent,
  useToast,
} from '@/design-system';
import { useSiteVisitVerify } from './useSiteVisitVerify';
import { VERIFY_KEYS as K } from './site-visit-verify.types';
import type { VisitRow } from './site-visit-verify.types';

/**
 * Screen 017 — Site Visit Verification. Built so the vast majority of honest
 * visits clear with no admin taps at all, and every flagged one says exactly
 * why in a single glance.
 */
export function SiteVisitVerifyView() {
  const { t } = useTranslation();
  const toast = useToast();
  const s = useSiteVisitVerify();

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

  return (
    <Screen width="wide">
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(K.subtitle)}
        action={
          s.needsReviewCount === 0 ? undefined : (
            <Badge tone="warning">{s.needsReviewCount}</Badge>
          )
        }
      />

      <SegBar
        label={t(K.filter.all)}
        value={s.filter}
        onChange={(id) => s.setFilter(id as 'needsReview' | 'autoCleared' | 'all')}
        items={[
          { id: 'needsReview', label: `${t(K.filter.needsReview)} (${s.needsReviewCount})` },
          { id: 'autoCleared', label: `${t(K.filter.autoCleared)} (${s.autoClearedCount})` },
          { id: 'all', label: t(K.filter.all) },
        ]}
        className="mb-3"
      />

      <Card className="mb-3">
        <p className="t-xs t-muted">{t(K.autoClearedNote)}</p>
        <div className="mt-3">
          <Button
            size="sm"
            loading={s.busy}
            disabled={s.autoClearedCount === 0}
            onClick={() =>
              void s.bulkApprove().then(() => toast.push(t(K.bulkApproved), 'success'))
            }
          >
            {t(K.bulkApprove, { count: s.autoClearedCount })}
          </Button>
        </div>
      </Card>

      {s.status === 'empty' ? (
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      ) : (
        <div className="grid-auto" style={{ ['--min' as string]: '300px' }}>
          {s.rows.map((row, index) => (
            <VisitCard key={row.visit.id} row={row} index={index} onDecide={s.decide} busy={s.busy} />
          ))}
        </div>
      )}
    </Screen>
  );
}

function VisitCard({
  row,
  index,
  onDecide,
  busy,
}: {
  row: VisitRow;
  index: number;
  onDecide: ReturnType<typeof useSiteVisitVerify>['decide'];
  busy: boolean;
}) {
  const { t, i18n } = useTranslation();
  const { visit, confidence } = row;

  const tone =
    confidence.verdict === 'clean' ? 'success' : confidence.verdict === 'borderline' ? 'warning' : 'error';

  return (
    <Card riseIndex={index}>
      <div className="row between gap-2 mb-3">
        <span className="stack gap-1 grow" style={{ minWidth: 0 }}>
          <span className="t-md t-semibold truncate">{visit.siteName}</span>
          <span className="t-xs t-muted truncate">
            {t(K.field.surveyor)}: {visit.surveyorName}
          </span>
        </span>
        <Badge tone={tone} dot>
          {t(K.verdict[confidence.verdict])}
        </Badge>
      </div>

      {/* Photo storage is not connected, so these are honest placeholders. */}
      <div className="row gap-2 mb-3">
        {Array.from({ length: Math.max(1, Math.min(visit.photoCount, 4)) }, (_, i) => (
          <span
            key={i}
            className="row center grow"
            style={{
              height: 72,
              borderRadius: 'var(--radius-control)',
              background: 'var(--color-surface-alt)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
            aria-label={t(K.photoPlaceholder)}
          >
            <ImageIcon size={20} />
          </span>
        ))}
      </div>

      <MapCanvas
        label={t(K.miniMapLabel)}
        height={140}
        markers={[
          {
            id: visit.id,
            lat: visit.location.lat,
            lng: visit.location.lng,
            tone,
            glyph: '×',
            label: visit.siteName,
          },
        ]}
      />

      <div className="stack gap-2 mt-3">
        <div className="row between">
          <span className="t-xs t-muted">{t(K.confidence)}</span>
          <span className="t-xs t-semibold num">{formatPercent(confidence.score, 0)}</span>
        </div>
        <ProgressBar value={confidence.score} tone={tone} label={t(K.confidence)} />
      </div>

      <div className="grid-2 gap-2 mt-3">
        <Detail label={t(K.field.drift)} value={`${confidence.driftMetres} m`} />
        <Detail label={t(K.field.accuracy)} value={`±${confidence.accuracyMetres} m`} />
        <Detail label={t(K.field.photos)} value={String(visit.photoCount)} />
        <Detail label={t(K.field.dwell)} value={`${visit.dwellMinutes} ${t('unit.minutes')}`} />
      </div>

      <p className="t-xs t-muted mt-2 num">{formatDateTime(visit.checkInAt, i18n.language)}</p>

      {confidence.reasons.length > 0 && (
        <div className="stack gap-1 mt-3">
          {confidence.reasons.map((reason) => (
            <span key={reason} className="row gap-2 t-xs t-muted">
              <Warning size={13} className="shrink-0" />
              {t(K.reason[reason], {
                drift: confidence.driftMetres,
                accuracy: confidence.accuracyMetres,
                sigma: confidence.sigma,
                photos: visit.photoCount,
                minutes: visit.dwellMinutes,
              })}
            </span>
          ))}
        </div>
      )}

      {!visit.photoTimestampsValid && <p className="t-xs t-muted mt-2">{t(K.exifNote)}</p>}

      {visit.status === 'pending' ? (
        <div className="row gap-2 wrap mt-3">
          <Button
            size="sm"
            icon={<CheckCircle size={15} />}
            loading={busy}
            onClick={() => void onDecide(visit, 'verified')}
          >
            {t(K.approve)}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<Warning size={15} />}
            onClick={() => void onDecide(visit, 'flagged')}
          >
            {t(K.flag)}
          </Button>
          <Button
            size="sm"
            variant="quiet"
            icon={<XCircle size={15} />}
            onClick={() => void onDecide(visit, 'rejected')}
          >
            {t(K.reject)}
          </Button>
        </div>
      ) : (
        <div className="row gap-2 mt-3">
          <Badge tone={visit.status === 'verified' ? 'success' : 'error'}>
            {t(`status.${visit.status}`)}
          </Badge>
          {visit.status !== 'verified' && (
            <span className="t-xs t-muted">{t(K.surveyorTold)}</span>
          )}
        </div>
      )}
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="stack gap-1">
      <span className="t-xs t-muted">{label}</span>
      <span className="t-sm t-semibold num">{value}</span>
    </div>
  );
}
