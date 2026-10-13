import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Camera, Check } from '@phosphor-icons/react';
import { Badge, ErrorState, LoadingState, Screen, ScreenHeader, Sheet, Button, useToast, formatINRCompact } from '@/design-system';
import { KANBAN_COLUMNS, isStale } from '@/features/crm/stageTone';
import type { Lead, LeadStage } from '@/data/types';
import { useLeadKanban } from './useLeadKanban';
import { LEAD_KANBAN_KEYS as K } from './lead-kanban.types';
import type { MoveResult } from './lead-kanban.types';

function daysInStage(lead: Lead): number {
  return Math.max(0, Math.floor((Date.now() - new Date(lead.stageEnteredAt).getTime()) / 86_400_000));
}

/**
 * Screen 043 — Lead Stage Pipeline Kanban. Drag-and-drop on wide screens;
 * tap-to-move on a phone, since native HTML5 drag has no real touch story —
 * both paths call the exact same `moveLead`, so neither is a second write path.
 */
export function LeadKanbanView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useLeadKanban();

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStage | null>(null);
  const [moveSheetLead, setMoveSheetLead] = useState<Lead | null>(null);

  if (s.status === 'loading') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={6} />
      </Screen>
    );
  }

  if (s.status === 'error') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  async function handleMove(leadId: string, toStage: LeadStage) {
    const result: MoveResult = await s.moveLead(leadId, toStage);
    if (result === 'moved') toast.push(t(K.toast.moved), 'success');
    else if (result === 'blocked_quoted') toast.push(t(K.toast.blockedQuoted), 'warning');
    else if (result === 'blocked_won') toast.push(t(K.toast.blockedWon), 'warning');
    setMoveSheetLead(null);
  }

  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
      <p className="t-xs t-muted mb-3">{t(K.dragHint)}</p>

      <div className="row gap-3" style={{ overflowX: 'auto', paddingBottom: 'var(--space-3)', alignItems: 'flex-start' }}>
        {s.columns.map((column) => (
          <div
            key={column.stage}
            className="stack gap-2 shrink-0"
            style={{ width: 260 }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStage(column.stage);
            }}
            onDragLeave={() => setDragOverStage((current) => (current === column.stage ? null : current))}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverStage(null);
              if (draggingId) void handleMove(draggingId, column.stage);
              setDraggingId(null);
            }}
          >
            <div className="ds-card" style={{ padding: 'var(--space-3)' }}>
              <div className="row between items-center">
                <span className="t-sm t-semibold">{t(`stage.${column.stage}`)}</span>
                <Badge tone="neutral">{t(K.columnCount, { count: column.leads.length })}</Badge>
              </div>
              <span className="t-xs t-muted num">{formatINRCompact(column.totalValue)}</span>
            </div>

            <div
              className="stack gap-2"
              style={{
                minHeight: 80,
                maxHeight: '65vh',
                overflowY: 'auto',
                borderRadius: 'var(--radius-card)',
                outline: dragOverStage === column.stage ? '2px dashed var(--color-accent-primary)' : 'none',
                outlineOffset: 2,
                padding: dragOverStage === column.stage ? 2 : 0,
              }}
            >
              {column.leads.map((lead) => {
                const stale = isStale(lead.stage, daysInStage(lead));
                return (
                  <div
                    key={lead.id}
                    role="button"
                    tabIndex={0}
                    draggable
                    onDragStart={() => setDraggingId(lead.id)}
                    onDragEnd={() => setDraggingId(null)}
                    onClick={() => setMoveSheetLead(lead)}
                    onKeyDown={(e) => e.key === 'Enter' && setMoveSheetLead(lead)}
                    className="ds-card"
                    style={{
                      cursor: 'grab',
                      opacity: draggingId === lead.id ? 0.5 : 1,
                      borderColor: stale ? 'var(--color-warning)' : undefined,
                    }}
                  >
                    <div className="stack gap-1">
                      <span className="t-sm t-semibold truncate">{lead.siteName}</span>
                      <span className="t-xs t-muted truncate">{lead.contactName}</span>
                      <div className="row between items-center mt-1">
                        <span className="row gap-1 items-center t-xs t-muted" aria-label={t(K.photoCount, { count: lead.photos.length })}>
                          <Camera size={13} />
                          {lead.photos.length}
                        </span>
                        <span className={`t-xs ${stale ? 't-warning' : 't-muted'}`}>{t(K.daysInStage, { count: daysInStage(lead) })}</span>
                      </div>
                      <span className="t-xs t-semibold num">{formatINRCompact(lead.estimatedValue)}</span>
                      <div className="row gap-1 wrap mt-1">
                        {stale && <Badge tone="warning">{t(K.staleTag)}</Badge>}
                        {!lead.surveyorId && <Badge tone="warning">{t(K.unassigned)}</Badge>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Sheet open={moveSheetLead !== null} onClose={() => setMoveSheetLead(null)} title={moveSheetLead ? t(K.moveSheet.title, { site: moveSheetLead.siteName }) : ''} closeLabel={t('action.close')}>
        {moveSheetLead && (
          <div className="stack gap-2">
            <span className="label">{t(K.moveSheet.moveTo)}</span>
            {KANBAN_COLUMNS.map((stage) => {
              const isCurrent = stage === moveSheetLead.stage;
              const blockedQuoted = stage === 'quoted' && !s.hasQuotation(moveSheetLead.id);
              const blockedWon = stage === 'won' && !s.hasAgreedDeal(moveSheetLead.id);
              const blocked = blockedQuoted || blockedWon;
              return (
                <div key={stage} className="stack gap-1">
                  <button
                    type="button"
                    className="row between items-center gap-3 tappable"
                    disabled={isCurrent || blocked}
                    onClick={() => void handleMove(moveSheetLead.id, stage)}
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-control)',
                      background: isCurrent ? 'var(--color-surface-alt)' : 'transparent',
                      border: '1px solid var(--color-hairline)',
                      opacity: blocked ? 0.5 : 1,
                      cursor: isCurrent || blocked ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <span className="t-sm">{t(`stage.${stage}`)}</span>
                    {isCurrent && <Check size={16} weight="bold" className="t-accent" />}
                  </button>
                  {blockedQuoted && <span className="t-xs t-error">{t(K.moveSheet.blockedQuoted)}</span>}
                  {blockedWon && <span className="t-xs t-error">{t(K.moveSheet.blockedWon)}</span>}
                </div>
              );
            })}
            <Button block variant="secondary" className="mt-2" onClick={() => navigate(`/admin/leads/${moveSheetLead.id}`)}>
              {t(K.moveSheet.openDetail)}
            </Button>
          </div>
        )}
      </Sheet>
    </Screen>
  );
}
