import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CaretDown, CaretUp } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  ProgressBar,
  Screen,
  ScreenHeader,
  formatDate,
  formatINRCompact,
  useToast,
} from '@/design-system';
import { STAGE_TONE } from '@/features/crm/stageTone';
import { useLeadScoring } from './useLeadScoring';
import { LEAD_SCORING_KEYS as K, RESHUFFLE_WARNING_THRESHOLD, SCORE_FACTOR_KEYS } from './lead-scoring.types';

/**
 * Screen 046 — Lead Scoring & Prioritization. The list is just `listLeads`
 * sorted by score — the same number the Lead Inbox and Follow-Up Scheduler
 * default-sort by, so priority never quietly means something different from
 * one screen to the next.
 */
export function LeadScoringView() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const s = useLeadScoring();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [confirmingLargeChange, setConfirmingLargeChange] = useState(false);

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

  function toggle(id: string) {
    setExpanded((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (s.pendingShift > RESHUFFLE_WARNING_THRESHOLD && !confirmingLargeChange) {
      setConfirmingLargeChange(true);
      return;
    }
    const ok = await s.saveWeights();
    toast.push(t(ok ? K.toast.saved : K.toast.error), ok ? 'success' : 'error');
    setConfirmingLargeChange(false);
  }

  const total = SCORE_FACTOR_KEYS.reduce((sum, key) => sum + s.draft[key], 0);

  return (
    <Screen>
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <h2 className="t-lg mb-2">{t(K.weighting.heading)}</h2>
      <p className="t-sm t-muted mb-3">{t(K.weighting.body)}</p>
      <Card className="mb-5">
        <div className="stack gap-3">
          {SCORE_FACTOR_KEYS.map((key) => (
            <div key={key} className="row between items-center gap-3">
              <span className="t-sm grow">{t(K.factor[key])}</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={s.draft[key]}
                onChange={(e) => s.setDraftWeight(key, Number(e.target.value))}
                style={{ width: 80 }}
                mono
              />
              <span className="t-xs t-muted">%</span>
            </div>
          ))}
          <p className={`t-xs ${total === 100 ? 't-muted' : 't-warning'}`}>{t(K.weighting.totalNote, { total })}</p>

          {confirmingLargeChange && <p className="t-xs t-error">{t(K.weighting.reshuffleWarning)}</p>}

          <div className="row gap-2">
            <Button size="sm" disabled={!s.draftDirty} onClick={() => void handleSave()}>
              {confirmingLargeChange ? t(K.weighting.confirmApply) : t(K.weighting.save)}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={!s.draftDirty}
              onClick={() => {
                s.resetDraft();
                setConfirmingLargeChange(false);
              }}
            >
              {t(K.weighting.reset)}
            </Button>
          </div>
          <span className="t-xs t-muted">{t(K.weighting.updatedAt, { date: formatDate(s.profile.updatedAt, i18n.language) })}</span>
        </div>
      </Card>

      {s.leads.length === 0 ? (
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      ) : (
        <div className="stack gap-2">
          {s.leads.map((lead) => {
            const isOpen = expanded.has(lead.id);
            return (
              <Card key={lead.id}>
                <button
                  type="button"
                  className="row between items-center gap-3"
                  style={{ width: '100%', background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'inherit', textAlign: 'left' }}
                  onClick={() => toggle(lead.id)}
                  aria-label={t(isOpen ? K.hideBreakdown : K.showBreakdown)}
                >
                  <div className="stack gap-1" style={{ minWidth: 0 }}>
                    <span className="t-sm t-semibold truncate">{lead.siteName}</span>
                    <span className="t-xs t-muted truncate">
                      {lead.builderName} · {formatINRCompact(lead.estimatedValue)}
                    </span>
                  </div>
                  <span className="row gap-2 items-center shrink-0">
                    <Badge tone={STAGE_TONE[lead.stage]}>{t(`stage.${lead.stage}`)}</Badge>
                    <span className="t-lg t-semibold num">{lead.score ?? '—'}</span>
                    {isOpen ? <CaretUp size={16} /> : <CaretDown size={16} />}
                  </span>
                </button>

                {isOpen && (
                  <div className="stack gap-2 mt-3">
                    {lead.scoreFactorBreakdown && lead.scoreFactorBreakdown.length > 0 ? (
                      lead.scoreFactorBreakdown.map((factor) => (
                        <div key={factor.key} className="stack gap-1">
                          <div className="row between">
                            <span className="t-xs">{t(K.factor[factor.key])}</span>
                            <span className="t-xs t-muted num">+{factor.contribution}</span>
                          </div>
                          <ProgressBar value={factor.value} />
                        </div>
                      ))
                    ) : (
                      <span className="t-xs t-muted">{t(K.breakdownNote)}</span>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </Screen>
  );
}
