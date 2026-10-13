import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, CaretLeft, CaretRight, ChatCircleDots, DotsSixVertical, Package, Truck, Warning } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  Sheet,
  Tabs,
  TextArea,
  formatDate,
  formatINR,
  useToast,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { SupplierOrderCard } from '@/data/repository';
import type { PoFulfilmentStage } from '@/data/types';
import { FULFILMENT_STAGES } from '@/features/suppliers/fulfilment';
import { useSupplierOrders } from './useSupplierOrders';
import type { SupplierOrdersState } from './useSupplierOrders';
import { SUPPLIER_ORDERS_KEYS as K } from './supplier-orders.types';

type T = (key: string, params?: Record<string, unknown>) => string;

const RISK_TONE: Record<SupplierOrderCard['delay']['risk'], BadgeTone> = { on_track: 'success', at_risk: 'warning', overdue: 'error' };

/**
 * Screen 095 — Supplier Order Status Tracking. Every sent PO's one true
 * fulfilment status, updated by the supplier themselves; Admin monitors and
 * steps in only when a supplier goes quiet. Delay risk is judged against
 * each supplier's own usual pace.
 */
export function SupplierOrdersView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useSupplierOrders();
  const lang = i18n.language;

  if (s.status === 'loading') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
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

  const notify = (ok: boolean) => toast.push(t(ok ? K.toast.updated : K.toast.error), ok ? 'success' : 'error');
  const onDrop = (stage: PoFulfilmentStage) =>
    void s.dropOn(stage).then((result) => {
      if (result === true || result === false) notify(result);
    });

  return (
    <Screen width="wide">
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(s.isAdmin ? K.subtitleAdmin : K.subtitleSupplier)}
        action={
          <div className="row gap-2 wrap">
            <Button size="sm" variant="secondary" icon={<Truck size={16} />} onClick={() => navigate('/shipments')}>
              {t(K.shipments)}
            </Button>
            <Button size="sm" variant="secondary" icon={<CalendarCheck size={16} />} onClick={() => navigate('/deliveries')}>
              {t(K.deliveries)}
            </Button>
          </div>
        }
      />

      {s.cards.length === 0 ? (
        <EmptyState icon={<Package size={26} />} title={t(K.empty.title)} body={t(s.isAdmin ? K.empty.bodyAdmin : K.empty.bodySupplier)} />
      ) : (
        <>
          <div className="row gap-2 wrap mb-3" style={{ alignItems: 'center' }}>
            {s.isAdmin && s.supplierOptions.length > 1 && (
              <Select style={{ width: 'auto' }} aria-label={t(K.filters.supplierAll)} value={s.supplierFilter} onChange={(e) => s.setSupplierFilter(e.target.value)}>
                <option value="">{t(K.filters.supplierAll)}</option>
                {s.supplierOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </Select>
            )}
            <Chip pressed={s.atRiskOnly} onClick={() => s.setAtRiskOnly(!s.atRiskOnly)}>
              {t(K.filters.atRiskOnly)}
            </Chip>
          </div>

          {s.wide ? (
            // Every stage side by side, drag a card's handle to move it.
            <div className="row gap-3" style={{ alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 'var(--space-3)' }}>
              {s.columns.map((col) => (
                <section
                  key={col.stage}
                  aria-label={t(K.stage[col.stage])}
                  className="stack gap-2"
                  style={{
                    // Six stages share the width; only a narrow desktop scrolls.
                    flex: '1 1 0',
                    minWidth: 180,
                    minHeight: 200,
                    padding: 'var(--space-2)',
                    borderRadius: 'var(--radius-card)',
                    background: s.dropStage === col.stage ? 'var(--color-accent-primary-soft)' : 'transparent',
                    outline: s.dropStage === col.stage ? '2px dashed var(--color-accent-primary)' : 'none',
                  }}
                  onDragOver={(e) => {
                    if (!s.dragPoId || !s.allowedStages.includes(col.stage)) return;
                    e.preventDefault();
                    if (s.dropStage !== col.stage) s.setDropStage(col.stage);
                  }}
                  onDragLeave={() => s.dropStage === col.stage && s.setDropStage(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    onDrop(col.stage);
                  }}
                >
                  <ColumnHeader stage={col.stage} count={col.cards.length} total={col.total} t={t} />
                  {s.dragPoId && s.dropStage === col.stage && <p className="t-xs t-muted">{t(K.dropHere)}</p>}
                  {col.cards.length === 0 ? (
                    <p className="t-xs t-muted">{t(K.columnEmpty)}</p>
                  ) : (
                    col.cards.map((card) => <OrderCard key={card.po.id} card={card} s={s} t={t} lang={lang} draggable />)
                  )}
                </section>
              ))}
            </div>
          ) : (
            // One stage at a time on a phone — tabs plus a position counter.
            <>
              <div>
                <Tabs
                  className="ds-tabs--scroll"
                  label={t(K.title)}
                  value={FULFILMENT_STAGES[s.stageCursor]}
                  onChange={(id) => s.setStageCursor(FULFILMENT_STAGES.indexOf(id as PoFulfilmentStage))}
                  items={s.columns.map((c) => ({ id: c.stage, label: `${t(K.stage[c.stage])} · ${c.cards.length}` }))}
                />
              </div>
              <div className="row between gap-2 mt-3 mb-2">
                <Button size="sm" variant="ghost" icon={<CaretLeft size={16} />} disabled={s.stageCursor === 0} onClick={() => s.setStageCursor(s.stageCursor - 1)}>
                  {t(K.previous)}
                </Button>
                <span className="t-xs t-muted">{t(K.stagePosition, { current: s.stageCursor + 1, total: FULFILMENT_STAGES.length })}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={s.stageCursor === FULFILMENT_STAGES.length - 1}
                  onClick={() => s.setStageCursor(s.stageCursor + 1)}
                >
                  {t(K.next)} <CaretRight size={16} />
                </Button>
              </div>
              {(() => {
                const col = s.columns[s.stageCursor];
                return (
                  <section className="stack gap-2">
                    <ColumnHeader stage={col.stage} count={col.cards.length} total={col.total} t={t} />
                    {col.cards.length === 0 ? (
                      <EmptyState title={t(K.columnEmpty)} body={t(s.isAdmin ? K.empty.bodyAdmin : K.empty.bodySupplier)} />
                    ) : (
                      col.cards.map((card) => <OrderCard key={card.po.id} card={card} s={s} t={t} lang={lang} />)
                    )}
                  </section>
                );
              })()}
            </>
          )}
        </>
      )}

      <OrderSheet s={s} t={t} lang={lang} notify={notify} />
    </Screen>
  );
}

function ColumnHeader({ stage, count, total, t }: { stage: PoFulfilmentStage; count: number; total: number; t: T }) {
  return (
    <div className="stack gap-1">
      <h2 className="t-md t-semibold">{t(K.stage[stage])}</h2>
      <span className="t-xs t-muted">{t(K.columnMeta, { count, total: formatINR(total) })}</span>
    </div>
  );
}

function OrderCard({ card, s, t, lang, draggable = false }: { card: SupplierOrderCard; s: SupplierOrdersState; t: T; lang: string; draggable?: boolean }) {
  const { delay, po } = card;
  const doneCount = card.lines.filter((l) => l.stage !== card.stage).length;
  return (
    <div
      className="ds-card"
      style={{ padding: 'var(--space-3)', opacity: s.dragPoId === po.id ? 0.5 : 1 }}
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', po.id);
        s.setDragPoId(po.id);
      }}
      onDragEnd={() => {
        s.setDragPoId(null);
        s.setDropStage(null);
      }}
    >
      <div className="row gap-2" style={{ alignItems: 'flex-start' }}>
        {draggable && (
          // A generous handle: the whole card drags, but this says so.
          <span className="shrink-0 t-muted" aria-label={t(K.dragHandle)} style={{ cursor: 'grab', padding: '4px 0' }}>
            <DotsSixVertical size={20} />
          </span>
        )}
        <button type="button" className="grow stack gap-1" style={{ minWidth: 0, textAlign: 'left', background: 'none', border: 0, padding: 0, color: 'inherit', font: 'inherit', cursor: 'pointer' }} onClick={() => s.open(po.id)}>
          <span className="t-sm t-semibold">{po.code}</span>
          <span className="row wrap gap-1">
            <Badge tone={RISK_TONE[delay.risk]}>{t(K.card.risk[delay.risk])}</Badge>
            {card.partial && <Badge tone="accent">{t(K.card.partial, { done: doneCount, total: card.lines.length })}</Badge>}
          </span>
          <span className="t-xs t-muted">
            {s.isAdmin ? card.supplierName : card.siteName || card.dealCode}
            {s.isAdmin && card.siteName ? ` · ${card.siteName}` : ''}
          </span>
          {card.stage !== 'delivered' && (
            <span className="t-xs">
              {t(K.card.inStage, { days: delay.daysInStage.toFixed(1) })} ·{' '}
              {t(delay.typicalIsDefault ? K.card.typicalDefault : K.card.typical, { days: delay.typicalDays })}
            </span>
          )}
          <span className="t-xs t-muted">
            {po.expectedDeliveryDate ? t(K.card.expected, { date: formatDate(po.expectedDeliveryDate, lang) }) : t(K.card.noExpected)}
            {card.stage !== 'delivered' && delay.projectedDelivery ? ` · ${t(K.card.projected, { date: formatDate(delay.projectedDelivery, lang) })}` : ''}
          </span>
          {s.isAdmin && !card.supplierHasLogin && (
            <span>
              <Badge tone="neutral">{t(K.card.noLogin)}</Badge>
            </span>
          )}
          <span className="num t-sm">{formatINR(card.totalValue)}</span>
        </button>
      </div>
    </div>
  );
}

function OrderSheet({ s, t, lang, notify }: { s: SupplierOrdersState; t: T; lang: string; notify: (ok: boolean) => void }) {
  const navigate = useNavigate();
  const card = s.openCard;
  const lineName = (id: string) => card?.lines.find((l) => l.line.id === id)?.line.description ?? id;
  return (
    <Sheet
      open={card !== null}
      onClose={s.close}
      title={card ? t(K.sheet.title, { code: card.po.code }) : ''}
      closeLabel={t('action.close')}
      footer={
        card && (
          <Button block disabled={!s.canSave} loading={s.saving} onClick={() => void s.save().then(notify)}>
            {s.changes.length === 0 ? t(K.sheet.nothingToSave) : t(K.sheet.save)}
          </Button>
        )
      }
    >
      {card && (
        <div className="stack gap-3">
          <p className="t-sm t-muted">
            {card.supplierName}
            {card.siteName ? ` · ${card.siteName}` : ''} · <span className="num">{formatINR(card.totalValue)}</span>
          </p>

          <label className="stack gap-1">
            <span className="t-sm t-semibold">{t(K.sheet.moveAll)}</span>
            <Select value="" onChange={(e) => s.setAllTargets(e.target.value as PoFulfilmentStage | '')}>
              <option value="">{t(K.sheet.keep)}</option>
              {s.allowedStages.map((stage) => (
                <option key={stage} value={stage}>
                  {t(K.stage[stage])}
                </option>
              ))}
            </Select>
          </label>

          <section className="stack gap-2">
            <h3 className="label">{t(K.sheet.lines)}</h3>
            {card.lines.map(({ line, stage, stageEnteredAt, production }) => (
              <div key={line.id} className="stack gap-1 hairline-top pt-2">
                <div className="row between gap-2">
                  <span className="t-sm grow" style={{ minWidth: 0 }}>
                    {line.description}
                  </span>
                  <Badge tone="neutral">{t(K.stage[stage])}</Badge>
                </div>
                <span className="t-xs t-muted">{formatDate(stageEnteredAt, lang)}</span>
                {production && (
                  // A manufacturer's part: the inside of "in production" (096).
                  <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/orders/production/${production.recordId}`)}>
                      {t('production.lineSummary', { pct: production.completionPct, stage: t(`production.stage.${production.stage}`) })}
                    </Button>
                    {production.stalled && <Badge tone="warning">{t('productionStatus.hero.stalled')}</Badge>}
                  </span>
                )}
                <Select
                  aria-label={line.description}
                  value={s.lineTargets[line.id] ?? ''}
                  disabled={!s.isAdmin && stage === 'delivered'}
                  onChange={(e) => s.setLineTarget(line.id, e.target.value as PoFulfilmentStage | '')}
                >
                  <option value="">{t(K.sheet.keep)}</option>
                  {s.allowedStages.map((option) => (
                    <option key={option} value={option}>
                      {t(K.stage[option])}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </section>

          {!s.isAdmin && <p className="t-xs t-muted">{t(K.sheet.deliveredIsAiec)}</p>}
          {s.backward && (
            <p className="t-xs t-warning row gap-1">
              <Warning size={12} className="shrink-0" /> {t(K.sheet.backwardWarning)}
            </p>
          )}
          {s.onBehalf && (
            <p className="t-xs t-warning row gap-1">
              <Warning size={12} className="shrink-0" /> {t(K.sheet.onBehalfWarning, { supplier: card.supplierName })}
            </p>
          )}
          {(s.noteNeeded || s.changes.length > 0) && (
            <label className="stack gap-1">
              <span className="t-sm t-semibold">{t(K.sheet.note)}</span>
              <TextArea
                value={s.note}
                placeholder={t(s.backward ? K.sheet.noteHintBackward : K.sheet.noteHintOnBehalf)}
                onChange={(e) => s.setNote(e.target.value)}
              />
              {s.noteNeeded && s.note.trim().length < 4 && <span className="t-xs t-warning">{t(K.sheet.noteRequired)}</span>}
            </label>
          )}

          {card.stage === 'shipped' && <p className="t-xs t-muted">{t(K.sheet.logisticsPending)}</p>}
          <div className="row wrap gap-2">
            {s.isAdmin && (
              <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/deals/${card.po.dealId}/purchase-orders`)}>
                {t(K.sheet.openPo)}
              </Button>
            )}
            {/* 099: the conversation about this order, tied to its record. */}
            {card.po.supplierId && (
              <Button size="sm" variant="ghost" icon={<ChatCircleDots size={16} />} onClick={() => navigate(`/supplier-messages?supplierId=${card.po.supplierId}&poId=${card.po.id}`)}>
                {t(K.sheet.messages)}
              </Button>
            )}
            {/* 101: when the parts actually reach the site. */}
            <Button size="sm" variant="ghost" icon={<CalendarCheck size={16} />} onClick={() => navigate(`/deliveries?poId=${card.po.id}`)}>
              {t(K.sheet.delivery)}
            </Button>
          </div>

          <section className="stack gap-2">
            <h3 className="label">{t(K.sheet.history)}</h3>
            {(card.po.statusEvents ?? []).length === 0 && <p className="t-xs t-muted">{t(K.sheet.historyEmpty)}</p>}
            {[...(card.po.statusEvents ?? [])].reverse().map((e) => (
              <div key={e.id} className="stack gap-1 hairline-top pt-2">
                <span className="t-xs">
                  {t(e.onBehalf ? K.sheet.eventOnBehalf : K.sheet.event, {
                    from: t(K.stage[e.fromStage]),
                    to: t(K.stage[e.toStage]),
                    name: e.byName,
                    date: formatDate(e.at, lang),
                  })}
                </span>
                <span className="t-xs t-muted">{e.lineItemIds.map(lineName).join(', ')}</span>
                {e.note && <span className="t-xs">“{e.note}”</span>}
              </div>
            ))}
          </section>
        </div>
      )}
    </Sheet>
  );
}
