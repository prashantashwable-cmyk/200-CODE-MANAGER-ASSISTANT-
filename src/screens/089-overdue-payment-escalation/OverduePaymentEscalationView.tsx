import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowSquareOut, CheckCircle, HandPalm, Megaphone, Phone, ShieldCheck, ShieldWarning } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Chip,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  Sheet,
  TextArea,
  formatINR,
  useToast,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import { useOverduePaymentEscalation } from './useOverduePaymentEscalation';
import { CALL_OUTCOME_OPTIONS, OVERDUE_PAYMENT_ESCALATION_KEYS as K, TIER_FILTERS } from './overdue-payment-escalation.types';

const TIER_TONE: Record<string, BadgeTone> = { call: 'neutral', formal_notice: 'warning', installation_hold: 'error' };

export function OverduePaymentEscalationView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useOverduePaymentEscalation();

  if (s.status === 'loading') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="list" rows={4} />
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

  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <div className="row wrap gap-2 mb-4">
        <Chip pressed={s.tierFilter === null} onClick={() => s.setTierFilter(null)}>
          {t(K.filters.all)}
        </Chip>
        {TIER_FILTERS.map((tier) => (
          <Chip key={tier} pressed={s.tierFilter === tier} onClick={() => s.setTierFilter(s.tierFilter === tier ? null : tier)}>
            {t(K.tier[tier])}
          </Chip>
        ))}
      </div>

      {s.rows.length === 0 ? (
        <EmptyState
          icon={<CheckCircle size={26} />}
          title={t(s.tierFilter ? K.noResults.title : K.empty.title)}
          body={t(s.tierFilter ? K.noResults.body : K.empty.body)}
        />
      ) : (
        <div className="stack gap-3">
          {s.rows.map((row) => (
            <Card key={row.payment.id} onClick={() => s.openDetail(row)}>
              <div className="row between items-start gap-3">
                <div className="stack gap-1" style={{ minWidth: 0 }}>
                  <span className="t-medium truncate">{row.siteName}</span>
                  <span className="t-xs t-muted truncate">
                    {row.dealCode} · {row.customerName}
                  </span>
                  {row.goodStanding && (
                    <span className="t-xs t-success row gap-1 items-center">
                      <ShieldCheck size={13} /> {t(K.row.goodStanding)}
                    </span>
                  )}
                  {row.safetyStepInProgress && (
                    <span className="t-xs t-warning row gap-1 items-center">
                      <ShieldWarning size={13} /> {t(K.row.safetyWarning)}
                    </span>
                  )}
                </div>
                <div className="stack gap-1 items-end shrink-0">
                  <span className="num t-semibold t-sm">{formatINR(row.overdueAmount)}</span>
                  <Badge tone={TIER_TONE[row.tier]}>{t(K.tier[row.tier])}</Badge>
                  <span className="t-xs t-muted">{t(K.row.overdueDays, { days: row.overdueDays })}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Sheet
        open={s.openRow !== null}
        onClose={s.closeDetail}
        title={s.openRow?.siteName ?? ''}
        closeLabel={t('action.close')}
        footer={
          s.openRow && (
            <div className="stack gap-2">
              <div className="row gap-2">
                <Button block variant="secondary" icon={<Phone size={16} />} onClick={s.openCallSheet}>
                  {t(K.detail.logCall)}
                </Button>
                <Button
                  block
                  variant="secondary"
                  icon={<Megaphone size={16} />}
                  loading={s.sendingNotice}
                  onClick={() => void s.sendNotice().then((ok) => toast.push(t(ok ? K.toast.noticeSent : K.toast.error), ok ? 'success' : 'error'))}
                >
                  {t(K.detail.sendNotice)}
                </Button>
              </div>
              <Button block variant="danger" icon={<HandPalm size={16} />} disabled={s.openRow.activeJobs.length === 0} onClick={s.openHoldSheet}>
                {t(K.detail.flagHold)}
              </Button>
            </div>
          )
        }
      >
        {s.openRow && (
          <div className="stack gap-3">
            <div className="row between t-sm">
              <span className="t-muted">{t(K.detail.overdueAmountLabel)}</span>
              <span className="num t-semibold">{formatINR(s.openRow.overdueAmount)}</span>
            </div>
            <div className="row between t-sm">
              <span className="t-muted">{t(K.detail.overdueDaysLabel)}</span>
              <span>{t(K.row.overdueDays, { days: s.openRow.overdueDays })}</span>
            </div>
            <div className="row between t-sm">
              <span className="t-muted">{t(K.detail.tierLabel)}</span>
              <Badge tone={TIER_TONE[s.openRow.tier]}>{t(K.tier[s.openRow.tier])}</Badge>
            </div>
            {s.openRow.goodStanding && (
              <Card>
                <p className="t-sm t-success row gap-1 items-center">
                  <ShieldCheck size={14} /> {t(K.detail.goodStandingNote)}
                </p>
              </Card>
            )}
            <div className="row between t-sm hairline-top pt-2">
              <span className="t-muted">{t(K.detail.activeJobsLabel)}</span>
              <span>{s.openRow.activeJobs.length > 0 ? s.openRow.activeJobs.length : t(K.detail.noActiveJobs)}</span>
            </div>
            {s.openRow.safetyStepInProgress && (
              <p className="t-xs t-warning row gap-1 items-center">
                <ShieldWarning size={13} /> {t(K.row.safetyWarning)}
              </p>
            )}
            <button type="button" className="tappable t-sm t-emerald row gap-1 items-center" onClick={() => navigate(`/admin/leads/${s.openRow?.leadId}`)}>
              {t(K.detail.viewHistory)} <ArrowSquareOut size={14} />
            </button>
          </div>
        )}
      </Sheet>

      <Sheet
        open={s.callSheetOpen}
        onClose={s.closeCallSheet}
        title={t(K.callSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button
            block
            disabled={!s.callOutcome}
            loading={s.submittingCall}
            onClick={() => void s.submitCall().then((ok) => toast.push(t(ok ? K.toast.callLogged : K.toast.error), ok ? 'success' : 'error'))}
          >
            {t(K.callSheet.submit)}
          </Button>
        }
      >
        <div className="stack gap-3">
          <div className="stack gap-1">
            <span className="label">{t(K.callSheet.outcomeLabel)}</span>
            <Select value={s.callOutcome} onChange={(e) => s.setCallOutcome(e.target.value as never)}>
              <option value="">—</option>
              {CALL_OUTCOME_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {t(K.outcome[opt])}
                </option>
              ))}
            </Select>
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.callSheet.durationLabel)}</span>
            <Input type="number" min={0} value={s.callDuration} onChange={(e) => s.setCallDuration(Number(e.target.value))} />
          </div>
          <Checkbox checked={s.callConsent} onChange={s.setCallConsent} label={t(K.callSheet.consentLabel)} />
        </div>
      </Sheet>

      <Sheet
        open={s.holdSheetOpen}
        onClose={s.closeHoldSheet}
        title={t(K.holdSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button
            block
            variant="danger"
            disabled={!s.holdReason.trim() || !s.holdAcknowledged}
            loading={s.submittingHold}
            onClick={() => void s.submitHold().then((ok) => toast.push(t(ok ? K.toast.holdFlagged : K.toast.error), ok ? 'success' : 'error'))}
          >
            {t(K.holdSheet.submit)}
          </Button>
        }
      >
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(K.holdSheet.hint)}</p>
          {s.openRow?.safetyStepInProgress && (
            <Card style={{ borderColor: 'var(--color-error)' }}>
              <p className="t-sm t-error row gap-1 items-center">
                <ShieldWarning size={16} className="shrink-0" /> {t(K.holdSheet.elevatedWarning)}
              </p>
            </Card>
          )}
          <div className="stack gap-1">
            <span className="label">{t(K.holdSheet.reasonLabel)}</span>
            <TextArea value={s.holdReason} onChange={(e) => s.setHoldReason(e.target.value)} rows={3} />
          </div>
          <Checkbox checked={s.holdAcknowledged} onChange={s.setHoldAcknowledged} label={t(K.holdSheet.acknowledgeLabel)} />
        </div>
      </Sheet>
    </Screen>
  );
}
