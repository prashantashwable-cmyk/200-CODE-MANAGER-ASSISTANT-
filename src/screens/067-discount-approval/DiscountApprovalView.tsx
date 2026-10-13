import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowClockwise, Lightning, WarningCircle } from '@phosphor-icons/react';
import {
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
  Tabs,
  TextArea,
  Toggle,
  formatDate,
  formatINR,
  useToast,
} from '@/design-system';
import type { DiscountRequest, DiscountRequestStatus } from '@/data/types';
import { useDiscountApproval } from './useDiscountApproval';
import { DISCOUNT_APPROVAL_KEYS as K, REQUEST_STATUS_FILTERS } from './discount-approval.types';

const STATUS_TONE: Record<DiscountRequestStatus, 'success' | 'error' | 'accent'> = {
  approved: 'success',
  rejected: 'error',
  pending: 'accent',
};

export function DiscountApprovalView() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const s = useDiscountApproval();
  const [rejectTarget, setRejectTarget] = useState<DiscountRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [counterSuggestionPct, setCounterSuggestionPct] = useState('');

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="list" rows={5} />
      </Screen>
    );
  }

  if (s.status === 'error' || !s.pricingConfig) {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  const pricing = s.pricingConfig;
  const belowFloor = s.marginPreview !== null && s.marginPreview < pricing.minimumMarginFloorPct;
  const canSubmit = Boolean(s.form.quotationId) && s.form.discountPct !== '' && s.form.reasonNote.trim() !== '' && !belowFloor;

  const closeRejectSheet = () => {
    setRejectTarget(null);
    setRejectionReason('');
    setCounterSuggestionPct('');
  };

  return (
    <Screen>
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <h2 className="t-lg mb-2">{t(K.requestForm.heading)}</h2>
      <Card className="mb-4">
        <div className="stack gap-3">
          <div className="stack gap-1">
            <span className="label">{t(K.requestForm.pickQuotation)}</span>
            <Select value={s.form.quotationId} onChange={(e) => s.setForm({ quotationId: e.target.value })}>
              <option value="">—</option>
              {s.eligibleQuotations.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.code} · {formatINR(q.cost.finalPrice)}
                </option>
              ))}
            </Select>
          </div>

          <div className="stack gap-1">
            <span className="label">{t(K.requestForm.discountLabel)}</span>
            <Input
              type="number"
              step="0.5"
              min={0}
              max={100}
              value={s.form.discountPct}
              invalid={belowFloor}
              onChange={(e) => s.setForm({ discountPct: e.target.value })}
            />
          </div>

          {s.marginPreview !== null && (
            <div className={`row gap-1 items-center t-xs ${belowFloor ? 't-error' : 't-muted'}`}>
              {belowFloor && <WarningCircle size={13} />}
              <span>{t(K.requestForm.marginPreview, { pct: s.marginPreview })}</span>
            </div>
          )}

          <div className="stack gap-1">
            <span className="label">{t(K.requestForm.reasonLabel)}</span>
            <TextArea rows={2} value={s.form.reasonNote} onChange={(e) => s.setForm({ reasonNote: e.target.value })} />
          </div>

          <Toggle
            checked={s.form.urgent}
            onChange={(next) => s.setForm({ urgent: next })}
            label={t(K.requestForm.urgentLabel)}
            description={t(K.requestForm.urgentHint)}
          />

          <Button
            disabled={!canSubmit}
            loading={s.submitting}
            onClick={() =>
              void s.submitRequest().then((result) => {
                if (!result.ok) {
                  toast.push(t(K.toast.error), 'error');
                } else {
                  toast.push(t(result.autoApproved ? K.toast.autoApproved : K.toast.submitted), 'success');
                }
              })
            }
          >
            {t(K.requestForm.submit)}
          </Button>
        </div>
      </Card>

      <Tabs
        label={t(K.title)}
        value={s.statusFilter}
        onChange={(id) => s.setStatusFilter(id as typeof s.statusFilter)}
        items={REQUEST_STATUS_FILTERS.map((f) => ({ id: f, label: t(K.statusFilter[f]) }))}
        className="mb-3"
      />

      {s.filteredRequests.length === 0 ? (
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      ) : (
        <div className="stack gap-2">
          {s.filteredRequests.map((request) => {
            const quotation = s.quotationOf(request.quotationId);
            const autoApproved = request.approverId === 'system-auto';
            return (
              <Card key={request.id}>
                <div className="row between items-start gap-3 mb-2">
                  <div className="stack gap-1" style={{ minWidth: 0 }}>
                    <span className="t-sm t-semibold truncate">{s.quotationLabel(request.quotationId)}</span>
                    <span className="t-xs t-muted">{t(K.requestedBy, { name: s.nameOf(request.requestedByUserId), date: formatDate(request.createdAt, i18n.language) })}</span>
                  </div>
                  <div className="row gap-1 items-center">
                    {request.urgent && (
                      <Badge tone="warning">
                        <Lightning size={11} /> {t(K.urgentBadge)}
                      </Badge>
                    )}
                    <Badge tone={STATUS_TONE[request.status]}>{t(K.statusBadge[request.status])}</Badge>
                  </div>
                </div>

                {request.resubmissionOfId && (
                  <p className="t-xs t-warning row gap-1 items-center mb-1">
                    <ArrowClockwise size={12} />
                    {t(K.resubmissionFlag)}
                  </p>
                )}

                <div className="row between t-xs t-muted mb-1">
                  <span>{quotation ? formatINR(quotation.cost.finalPrice) : '—'}</span>
                  <span>{t(K.resultingMargin, { pct: request.resultingMarginPct })}</span>
                </div>

                {request.reasonNote && <p className="t-xs t-muted mb-2">{request.reasonNote}</p>}

                {request.status !== 'pending' && (
                  <p className="t-xs t-muted mb-1">
                    {t(K.decidedBy, { name: s.nameOf(request.approverId ?? ''), date: request.decidedAt ? formatDate(request.decidedAt, i18n.language) : '' })}
                    {autoApproved ? ` — ${t(K.autoApprovedBadge)}` : ''}
                  </p>
                )}
                {request.status === 'rejected' && request.rejectionReason && (
                  <p className="t-xs t-error mb-1">{t(K.rejectionReasonShown, { reason: request.rejectionReason })}</p>
                )}
                {request.status === 'rejected' && request.counterSuggestionPct !== undefined && (
                  <p className="t-xs t-muted mb-1">{t(K.counterSuggestionShown, { pct: request.counterSuggestionPct })}</p>
                )}

                {request.status === 'pending' && (
                  <div className="row gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={s.deciding === request.id}
                      onClick={() => void s.approve(request.id).then((ok) => toast.push(t(ok ? K.toast.approved : K.toast.error), ok ? 'success' : 'error'))}
                    >
                      {t(K.actions.approve)}
                    </Button>
                    <Button size="sm" variant="ghost" disabled={s.deciding === request.id} onClick={() => setRejectTarget(request)}>
                      {t(K.actions.reject)}
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Sheet
        open={rejectTarget !== null}
        onClose={closeRejectSheet}
        title={t(K.rejectSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button
            block
            disabled={!rejectionReason.trim()}
            loading={rejectTarget !== null && s.deciding === rejectTarget.id}
            onClick={() => {
              if (!rejectTarget) return;
              const pct = counterSuggestionPct === '' ? undefined : Number(counterSuggestionPct);
              void s.reject(rejectTarget.id, rejectionReason.trim(), pct).then((ok) => {
                toast.push(t(ok ? K.toast.rejected : K.toast.error), ok ? 'success' : 'error');
                if (ok) closeRejectSheet();
              });
            }}
          >
            {t(K.rejectSheet.submit)}
          </Button>
        }
      >
        <div className="stack gap-3">
          <div className="stack gap-1">
            <span className="label">{t(K.rejectSheet.reasonLabel)}</span>
            <TextArea rows={3} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.rejectSheet.counterLabel)}</span>
            <Input type="number" step="0.5" min={0} max={100} value={counterSuggestionPct} onChange={(e) => setCounterSuggestionPct(e.target.value)} />
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}
