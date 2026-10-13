import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowSquareOut, Flag, MagnifyingGlass, Plus, WarningCircle } from '@phosphor-icons/react';
import {
  ActionBar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  Sheet,
  TextArea,
  formatDate,
  useToast,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import { useCompetitorBattlecards } from './useCompetitorBattlecards';
import { COMPETITOR_BATTLECARDS_KEYS as K, PRICE_POSITIONS } from './competitor-battlecards.types';

const PRICE_POSITION_TONE: Record<string, BadgeTone> = { premium: 'neutral', comparable: 'warning', budget: 'success' };

export function CompetitorBattlecardsView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useCompetitorBattlecards();

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="list" rows={4} />
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

  const current = s.current;

  return (
    <Screen className="pb-action-bar">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <Card className="mb-4">
        <p className="t-xs t-warning row gap-2 items-start">
          <WarningCircle size={14} className="shrink-0 mt-1" />
          {t(K.internalOnlyBanner)}
        </p>
      </Card>

      <div className="mb-4" style={{ position: 'relative' }}>
        <MagnifyingGlass size={16} className="t-muted" style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <Input placeholder={t(K.searchPlaceholder)} value={s.query} onChange={(e) => s.setQuery(e.target.value)} style={{ paddingLeft: 'calc(var(--space-3) * 2 + 16px)' }} />
      </div>

      {s.items.length === 0 ? (
        <EmptyState title={s.query ? t(K.noResults.title) : t(K.empty.title)} body={s.query ? t(K.noResults.body) : t(K.empty.body)} />
      ) : (
        <Card flush>
          {s.items.map((c) => (
            <div key={c.id} className="ds-listrow" role="button" tabIndex={0} onClick={() => s.openDetail(c.id)} onKeyDown={(e) => e.key === 'Enter' && s.openDetail(c.id)} style={{ cursor: 'pointer' }}>
              <span className="grow stack gap-1" style={{ minWidth: 0 }}>
                <span className="t-medium truncate row gap-2 items-center">
                  {c.name}
                  {c.flaggedForReview && <Flag size={13} className="t-warning shrink-0" aria-label={t(K.row.flagged)} />}
                </span>
                <span className="t-xs t-muted truncate">{c.priceSummary}</span>
              </span>
              <Badge tone={PRICE_POSITION_TONE[c.pricePosition]}>{t(K.pricePosition[c.pricePosition])}</Badge>
            </div>
          ))}
        </Card>
      )}

      <ActionBar>
        <Button block icon={<Plus size={16} />} onClick={s.openAdd}>
          {t(K.addCompetitor.button)}
        </Button>
      </ActionBar>

      <Sheet
        open={s.openId !== null}
        onClose={s.closeDetail}
        title={current?.name ?? ''}
        closeLabel={t('action.close')}
        footer={
          current &&
          (s.editing ? (
            <div className="row gap-2">
              <Button block variant="secondary" onClick={s.cancelEdit}>
                {t(K.editForm.cancel)}
              </Button>
              <Button block disabled={!s.draftPriceSummary.trim()} onClick={() => void s.saveEdit().then((ok) => toast.push(t(ok ? K.toast.saved : K.toast.error), ok ? 'success' : 'error'))}>
                {t(K.editForm.save)}
              </Button>
            </div>
          ) : (
            <div className="row gap-2">
              <Button block variant="secondary" icon={<Flag size={16} />} onClick={s.openFlagSheet}>
                {t(K.detail.flagForReview)}
              </Button>
              <Button block onClick={s.startEdit}>
                {t(K.detail.edit)}
              </Button>
            </div>
          ))
        }
      >
        {current && (
          <div className="stack gap-4">
            {current.flaggedForReview && (
              <Card>
                <div className="row gap-2 items-start">
                  <Flag size={16} className="t-warning shrink-0 mt-1" />
                  <div className="stack gap-1">
                    <p className="t-sm t-warning">{t(K.detail.flaggedBanner)}</p>
                    <p className="t-xs t-muted">{current.flagReason}</p>
                    {current.flaggedBy && <p className="t-xs t-muted">{t(K.detail.flaggedByLine, { name: current.flaggedBy, date: current.flaggedAt ? formatDate(current.flaggedAt, i18n.language) : '' })}</p>}
                  </div>
                </div>
              </Card>
            )}

            <div className="row gap-2 items-center">
              <Badge tone={PRICE_POSITION_TONE[current.pricePosition]}>{t(K.pricePosition[current.pricePosition])}</Badge>
              <span className="t-xs t-muted">{t(K.detail.lastReviewedLine, { name: current.lastReviewedBy, date: formatDate(current.lastReviewedAt, i18n.language) })}</span>
            </div>

            {s.editing ? (
              <>
                <div className="stack gap-1">
                  <span className="label">{t(K.editForm.priceSummaryLabel)}</span>
                  <TextArea value={s.draftPriceSummary} onChange={(e) => s.setDraftPriceSummary(e.target.value)} rows={3} />
                </div>
                <div className="stack gap-1">
                  <span className="label">{t(K.editForm.strengthsLabel)}</span>
                  <TextArea value={s.draftStrengths} onChange={(e) => s.setDraftStrengths(e.target.value)} rows={3} />
                  <span className="t-xs t-muted">{t(K.editForm.strengthsHint)}</span>
                </div>
                <div className="stack gap-1">
                  <span className="label">{t(K.editForm.differentiationLabel)}</span>
                  <TextArea value={s.draftDifferentiation} onChange={(e) => s.setDraftDifferentiation(e.target.value)} rows={4} />
                  <span className="t-xs t-muted">{t(K.editForm.differentiationHint)}</span>
                </div>
              </>
            ) : (
              <>
                <Card>
                  <p className="t-sm">{current.priceSummary}</p>
                </Card>

                {current.strengths.length > 0 && (
                  <div className="stack gap-1">
                    <span className="label">{t(K.detail.strengthsHeading)}</span>
                    <ul className="stack gap-1" style={{ paddingLeft: 'var(--space-4)' }}>
                      {current.strengths.map((str, i) => (
                        <li key={i} className="t-sm">
                          {str}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {current.differentiationPoints.length > 0 && (
                  <div className="stack gap-1">
                    <span className="label">{t(K.detail.differentiationHeading)}</span>
                    <ul className="stack gap-1" style={{ paddingLeft: 'var(--space-4)' }}>
                      {current.differentiationPoints.map((str, i) => (
                        <li key={i} className="t-sm">
                          {str}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button type="button" className="tappable t-xs t-accent row gap-1 items-center" onClick={() => navigate('/admin/deals/objection-scripts')}>
                  {t(K.detail.goToObjectionScripts)} <ArrowSquareOut size={13} />
                </button>

                <div className="stack gap-1">
                  <span className="label">{t(K.detail.versionHistoryHeading)}</span>
                  <div className="stack gap-2">
                    {[...current.versions].reverse().map((v) => (
                      <span key={v.version} className="t-xs t-muted">
                        {t(K.detail.versionRow, { version: v.version, editor: v.editedBy, date: formatDate(v.editedAt, i18n.language) })}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Sheet>

      <Sheet
        open={s.flagSheetOpen}
        onClose={s.closeFlagSheet}
        title={t(K.flagSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button block disabled={!s.flagReason.trim()} onClick={() => void s.submitFlag().then((ok) => toast.push(t(ok ? K.toast.flagged : K.toast.error), ok ? 'success' : 'error'))}>
            {t(K.flagSheet.submit)}
          </Button>
        }
      >
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(K.flagSheet.hint)}</p>
          <div className="stack gap-1">
            <span className="label">{t(K.flagSheet.reasonLabel)}</span>
            <TextArea value={s.flagReason} onChange={(e) => s.setFlagReason(e.target.value)} rows={3} />
          </div>
        </div>
      </Sheet>

      <Sheet
        open={s.addOpen}
        onClose={s.closeAdd}
        title={t(K.addCompetitor.sheetTitle)}
        closeLabel={t('action.close')}
        footer={
          <Button block disabled={!s.canSubmitNew} onClick={() => void s.submitNew().then((ok) => toast.push(t(ok ? K.toast.created : K.toast.error), ok ? 'success' : 'error'))}>
            {t(K.addCompetitor.submit)}
          </Button>
        }
      >
        <div className="stack gap-4">
          <div className="stack gap-1">
            <span className="label">{t(K.addCompetitor.nameLabel)}</span>
            <Input value={s.draftName} onChange={(e) => s.setDraftName(e.target.value)} placeholder={t(K.addCompetitor.nameLabel)} />
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.addCompetitor.pricePositionLabel)}</span>
            <Select value={s.draftPricePosition} onChange={(e) => s.setDraftPricePosition(e.target.value as never)}>
              {PRICE_POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {t(K.pricePosition[p])}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}
