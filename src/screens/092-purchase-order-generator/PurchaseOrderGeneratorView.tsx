import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PaperPlaneTilt, UserSwitch, Warning } from '@phosphor-icons/react';
import { canIssueNewPo } from '@/features/suppliers/agreement';
import type { SupplierAgreementStatus } from '@/data/types';
import { Badge, Button, Card, EmptyState, ErrorState, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, formatINR, useToast } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import { usePurchaseOrderGenerator } from './usePurchaseOrderGenerator';
import { PURCHASE_ORDER_GENERATOR_KEYS as K } from './purchase-order-generator.types';

const STATUS_TONE: Record<string, BadgeTone> = {
  triggered: 'neutral',
  failed: 'error',
  draft: 'neutral',
  pending_approval: 'warning',
  approved: 'success',
  sent: 'success',
};

const agreementBlocks = (status: SupplierAgreementStatus) => !canIssueNewPo(status);

export function PurchaseOrderGeneratorView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = usePurchaseOrderGenerator();

  if (s.status === 'loading') {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} back={() => navigate(-1)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={2} />
      </Screen>
    );
  }

  if (s.status === 'error' || !s.view) {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} back={() => navigate(-1)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  const { view } = s;

  return (
    <Screen width="narrow">
      <ScreenHeader title={view.siteName} subtitle={view.dealCode} back={() => navigate(-1)} />

      {view.purchaseOrders.length === 0 ? (
        view.draftHold ? (
          // 094's rules are holding drafting — say which rule, and offer the
          // explicit override rather than drafting silently anyway.
          <EmptyState
            title={t(K.hold[view.draftHold].title)}
            body={t(K.hold[view.draftHold].body)}
            actionLabel={t(K.hold.draftNow)}
            onAction={() => void s.draftNow().then((ok) => toast.push(t(ok ? K.toast.drafted : K.toast.error), ok ? 'success' : 'error'))}
          />
        ) : (
          <EmptyState title={t(K.notReady.title)} body={t(K.notReady.body)} />
        )
      ) : (
        <div className="stack gap-4">
          {view.purchaseOrders.map((poView) => (
            <Card key={poView.po.id}>
              <div className="row between items-start gap-3 mb-3">
                <div className="stack gap-1">
                  <span className="t-medium">{poView.po.code}</span>
                  <span className="t-xs t-muted">
                    {t(K.po.supplierLabel)}: {poView.supplierName}
                  </span>
                </div>
                <Badge tone={STATUS_TONE[poView.po.status]}>{t(K.status[poView.po.status])}</Badge>
              </div>

              {!poView.supplierEligible && poView.po.status !== 'sent' && (
                <p className="t-xs t-error row gap-1 items-center mb-2">
                  <Warning size={12} /> {t(K.po.notEligible)}
                </p>
              )}
              {/* 098: new POs go out only under an agreement in force. */}
              {poView.supplierEligible && agreementBlocks(poView.agreementStatus) && poView.po.status !== 'sent' && (
                <div className="row between gap-2 wrap mb-2">
                  <p className="t-xs t-warning row-top gap-1 grow" style={{ minWidth: 200 }}>
                    <Warning size={12} className="shrink-0" /> {t(K.po.agreementBlocked)}
                  </p>
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/agreement?supplierId=${poView.po.supplierId}`)}>
                    {t(K.po.viewAgreement)}
                  </Button>
                </div>
              )}

              <div className="stack gap-3 hairline-top pt-3">
                {poView.lines.map((line) => {
                  const draft = s.lineDrafts[line.id] ?? { quantity: String(line.quantity), agreedUnitPrice: String(line.agreedUnitPrice) };
                  const priceChanged = line.currentCatalogUnitPrice !== null && line.currentCatalogUnitPrice !== line.catalogUnitPriceAtDraft;
                  // Why this supplier won this line — frozen at draft time (094).
                  const match = poView.po.selection?.find((r) => r.category === line.category);
                  const chosen = match?.candidates.find((c) => c.supplierId === match.chosenSupplierId);
                  const runnerUp = match?.candidates.find((c) => c.supplierId !== match.chosenSupplierId);
                  return (
                    <div key={line.id} className="stack gap-2 hairline-top pt-3">
                      <span className="t-sm t-medium">{line.description}</span>
                      <div className="grid-2 gap-2">
                        <div className="stack gap-1">
                          <span className="t-xs t-muted">{t(K.line.quantityLabel)}</span>
                          <Input
                            type="number"
                            min={1}
                            value={draft.quantity}
                            disabled={poView.po.status === 'sent'}
                            onChange={(e) => s.setLineDraft(line.id, 'quantity', e.target.value)}
                            onBlur={() => void s.commitLine(poView.po.id, line.id)}
                          />
                        </div>
                        <div className="stack gap-1">
                          <span className="t-xs t-muted">{t(K.line.agreedPriceLabel)}</span>
                          <Input
                            type="number"
                            min={0}
                            value={draft.agreedUnitPrice}
                            disabled={poView.po.status === 'sent'}
                            onChange={(e) => s.setLineDraft(line.id, 'agreedUnitPrice', e.target.value)}
                            onBlur={() => void s.commitLine(poView.po.id, line.id)}
                          />
                        </div>
                      </div>
                      <span className="t-xs t-muted">
                        {t(K.line.catalogPriceLabel)}: {formatINR(line.catalogUnitPriceAtDraft)}
                      </span>
                      {match && chosen && (
                        <span className="t-xs t-muted">
                          {match.reason === 'assigned_supplier'
                            ? t(K.line.whyAssigned)
                            : runnerUp
                              ? t(K.line.whyBest, { score: chosen.total.toFixed(2), next: runnerUp.supplierName, nextScore: runnerUp.total.toFixed(2) })
                              : t(K.line.whyOnly)}
                        </span>
                      )}
                      {match?.driveTypeFallback && (
                        <p className="t-xs t-warning row gap-1 items-center">
                          <Warning size={11} /> {t(K.line.driveTypeFallback)}
                        </p>
                      )}
                      {priceChanged && (
                        <p className="t-xs t-warning row gap-1 items-center">
                          <Warning size={11} /> {t(K.line.priceChanged, { price: formatINR(line.currentCatalogUnitPrice ?? 0) })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="row between t-sm hairline-top pt-3 mt-3">
                <span className="t-muted">{t(K.po.totalLabel)}</span>
                <span className="num t-semibold">{formatINR(poView.totalAmount)}</span>
              </div>

              <div className="stack gap-1 mt-3">
                <span className="t-xs t-muted">{t(K.po.deliveryLabel)}</span>
                <Input
                  type="date"
                  value={s.deliveryDrafts[poView.po.id] ?? ''}
                  disabled={poView.po.status === 'sent'}
                  onChange={(e) => s.setDeliveryDraft(poView.po.id, e.target.value)}
                  onBlur={() => void s.commitDelivery(poView.po.id)}
                />
              </div>

              {poView.requiresApproval &&
                poView.approvalReasons.map((reason) => (
                  <p key={reason} className="t-xs t-warning row gap-1 items-center mt-3">
                    <Warning size={12} /> {t(reason === 'over_value_threshold' ? K.po.approvalOverValue : K.po.approvalNeeded)}
                  </p>
                ))}

              {poView.po.status !== 'sent' && (
                <div className="row gap-2 mt-3">
                  <Button block variant="secondary" icon={<UserSwitch size={16} />} onClick={() => s.openReassign(poView.po.id)}>
                    {t(K.po.reassign)}
                  </Button>
                  {poView.requiresApproval && (
                    <Button block variant="secondary" loading={s.approvingPoId === poView.po.id} onClick={() => void s.approvePricing(poView.po.id).then((ok) => toast.push(t(ok ? K.toast.approved : K.toast.error), ok ? 'success' : 'error'))}>
                      {t(K.po.approvePricing)}
                    </Button>
                  )}
                </div>
              )}

              {poView.po.status !== 'sent' ? (
                <Button
                  block
                  className="mt-2"
                  icon={<PaperPlaneTilt size={16} />}
                  disabled={!poView.supplierEligible || poView.requiresApproval || agreementBlocks(poView.agreementStatus)}
                  loading={s.sendingPoId === poView.po.id}
                  onClick={() => void s.sendPO(poView.po.id).then((ok) => toast.push(t(ok ? K.toast.sent : K.toast.error), ok ? 'success' : 'error'))}
                >
                  {t(K.po.send)}
                </Button>
              ) : (
                <div className="row between gap-2 mt-2">
                  <p className="t-xs t-success">{t(K.po.sentNote, { by: poView.po.sentBy ?? '' })}</p>
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/orders?poId=${poView.po.id}`)}>
                    {t(K.po.track)}
                  </Button>
                </div>
              )}
            </Card>
          ))}
          <div>
            <Button size="sm" variant="ghost" onClick={() => navigate('/admin/suppliers/po-rules')}>
              {t(K.rulesLink)}
            </Button>
          </div>
        </div>
      )}

      <Sheet
        open={s.reassignOpenPoId !== null}
        onClose={s.closeReassign}
        title={t(K.reassignSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button block disabled={!s.reassignSupplierId} loading={s.submittingReassign} onClick={() => void s.submitReassign().then((ok) => toast.push(t(ok ? K.toast.reassigned : K.toast.error), ok ? 'success' : 'error'))}>
            {t(K.reassignSheet.submit)}
          </Button>
        }
      >
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(K.reassignSheet.hint)}</p>
          <div className="stack gap-1">
            <span className="label">{t(K.reassignSheet.supplierLabel)}</span>
            <Select value={s.reassignSupplierId} onChange={(e) => s.setReassignSupplierId(e.target.value)}>
              <option value="">—</option>
              {view.eligibleSuppliers.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.name} ({sup.city})
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}
