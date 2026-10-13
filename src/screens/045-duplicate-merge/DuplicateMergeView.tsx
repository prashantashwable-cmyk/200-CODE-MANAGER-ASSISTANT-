import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  formatDate,
  formatINRCompact,
  haversineKm,
  relativeTimeParts,
  useToast,
} from '@/design-system';
import { STAGE_TONE } from '@/features/crm/stageTone';
import type { Lead } from '@/data/types';
import { useDuplicateMerge } from './useDuplicateMerge';
import type { DuplicatePairWithLeads } from './useDuplicateMerge';
import { DUPLICATE_MERGE_KEYS as K } from './duplicate-merge.types';

function LeadColumn({
  lead,
  isKept,
  onKeep,
  t,
  nameOf,
  lang,
}: {
  lead: Lead;
  isKept: boolean;
  onKeep: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
  nameOf: (id: string) => string;
  lang: string;
}) {
  return (
    <div
      className="stack gap-2"
      style={{
        border: `1px solid ${isKept ? 'var(--color-accent-primary)' : 'var(--color-hairline)'}`,
        borderRadius: 'var(--radius-card)',
        padding: 'var(--space-3)',
      }}
    >
      <div className="row between items-center">
        <span className="t-sm t-semibold">{lead.code}</span>
        {isKept && <Badge tone="accent">{t(K.compare.primaryTag)}</Badge>}
      </div>
      <span className="t-sm">{lead.siteName}</span>
      <div className="stack gap-1">
        <span className="t-xs t-muted">
          {t(K.compare.capturedBy)}: {nameOf(lead.originalSurveyorId)}
        </span>
        <span className="t-xs t-muted">
          {t(K.compare.capturedAt)}: {formatDate(lead.createdAt, lang)}
        </span>
        <span className="row gap-2 items-center">
          <span className="t-xs t-muted">{t(K.compare.stage)}:</span>
          <Badge tone={STAGE_TONE[lead.stage]}>{t(`stage.${lead.stage}`)}</Badge>
        </span>
        <span className="t-xs t-muted">
          {t(K.compare.contact)}: {lead.contactName}
        </span>
        <span className="t-xs t-muted num">
          {t(K.compare.value)}: {formatINRCompact(lead.estimatedValue)}
        </span>
      </div>
      <Button size="sm" variant={isKept ? 'primary' : 'secondary'} onClick={onKeep}>
        {isKept ? <Check size={14} weight="bold" /> : null}
        {t(K.compare.keepThis)}
      </Button>
    </div>
  );
}

/**
 * Screen 045 — Duplicate Lead Merge/Resolution. Admin's side-by-side queue
 * for what the surveyor-facing duplicate warning (035) merely flags. The
 * commission-impact line is always visible before the merge button, never
 * behind a second click — the spec calls this friction deliberate.
 */
export function DuplicateMergeView() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const s = useDuplicateMerge();
  const [keepChoice, setKeepChoice] = useState<Record<string, string>>({});

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
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  if (s.pairs.length === 0) {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      </Screen>
    );
  }

  function keptId(pair: DuplicatePairWithLeads): string {
    return keepChoice[pair.id] ?? pair.primaryLeadId;
  }

  async function handleMerge(pair: DuplicatePairWithLeads) {
    const ok = await s.resolveMerge(pair.id, keptId(pair));
    toast.push(t(ok ? K.toast.merged : K.toast.error), ok ? 'success' : 'error');
  }

  async function handleNotDuplicate(pair: DuplicatePairWithLeads) {
    const ok = await s.resolveNotDuplicate(pair.id);
    toast.push(t(ok ? K.toast.notDuplicate : K.toast.error), ok ? 'success' : 'error');
  }

  return (
    <Screen>
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
      <h2 className="t-lg mb-3">{t(K.queueHeading, { count: s.pairs.length })}</h2>

      <div className="stack gap-4">
        {s.pairs.map((pair) => {
          const kept = keptId(pair);
          const other = kept === pair.primaryLeadId ? pair.secondary : pair.primary;
          const keptLead = kept === pair.primaryLeadId ? pair.primary : pair.secondary;
          const distanceM = Math.round(haversineKm(pair.primary.location, pair.secondary.location) * 1000);

          const detected = relativeTimeParts(pair.detectedAt);
          const detectedText = t(detected.key, { count: detected.count });

          return (
            <Card key={pair.id}>
              <div className="row between items-center mb-3">
                <span className="t-xs t-muted">{t(K.detectedAgo, { time: detectedText })}</span>
                <span className="t-xs t-muted">{t(K.compare.distance, { metres: distanceM })}</span>
              </div>

              <div className="grid-2 gap-3 mb-3">
                <LeadColumn
                  lead={pair.primary}
                  isKept={kept === pair.primaryLeadId}
                  onKeep={() => setKeepChoice((c) => ({ ...c, [pair.id]: pair.primaryLeadId }))}
                  t={t}
                  nameOf={s.nameOf}
                  lang={i18n.language}
                />
                <LeadColumn
                  lead={pair.secondary}
                  isKept={kept === pair.secondaryLeadId}
                  onKeep={() => setKeepChoice((c) => ({ ...c, [pair.id]: pair.secondaryLeadId }))}
                  t={t}
                  nameOf={s.nameOf}
                  lang={i18n.language}
                />
              </div>

              <div className="stack gap-1 mb-3" style={{ background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-control)', padding: 'var(--space-3)' }}>
                <span className="t-xs t-semibold">{t(K.impact.heading)}</span>
                <p className="t-xs t-muted">
                  {t(K.impact.summary, { keeper: s.nameOf(keptLead.originalSurveyorId), keptCode: keptLead.code, loser: s.nameOf(other.originalSurveyorId) })}
                </p>
              </div>

              <div className="row wrap gap-2">
                <Button size="sm" onClick={() => void handleMerge(pair)}>
                  {t(K.actions.merge)}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void handleNotDuplicate(pair)}>
                  {t(K.actions.notDuplicate)}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </Screen>
  );
}
