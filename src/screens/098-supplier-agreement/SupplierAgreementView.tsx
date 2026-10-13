import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowsClockwise, CalendarCheck, ChartLineUp, Clock, CurrencyInr, FileText, NotePencil, SealCheck, ShieldCheck, Warning } from '@phosphor-icons/react';
import {
  ActionBar,
  AscensionLine,
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  Sheet,
  Tabs,
  TextArea,
  formatDate,
  useToast,
} from '@/design-system';
import type { AscensionStep, BadgeTone } from '@/design-system';
import type { SupplierAgreementStatus, SupplierAgreementTerms } from '@/data/types';
import { DocumentSlot } from '@/features/onboarding/DocumentSlot';
import { TERM_LIMITS } from '@/features/suppliers/agreement';
import { performanceFor } from '@/features/suppliers/supplierMatching';
import { useSupplierAgreement } from './useSupplierAgreement';
import type { FormIssue, SupplierAgreementState } from './useSupplierAgreement';
import { AGREEMENT_TABS, SUPPLIER_AGREEMENT_KEYS as K } from './supplier-agreement.types';
import type { TermsDraft } from './supplier-agreement.types';

type T = ReturnType<typeof useTranslation>['t'];

const STATUS_TONE: Record<SupplierAgreementStatus, BadgeTone> = { none: 'neutral', active: 'success', expiring: 'warning', lapsed: 'warning' };

/** How a term reads in the history and the "what changes" preview. */
function termValue(key: keyof SupplierAgreementTerms, value: SupplierAgreementTerms[keyof SupplierAgreementTerms], t: T): string {
  switch (key) {
    case 'deliverySlaDays':
      return t(K.terms.slaValue, { days: value });
    case 'paymentTermsDays':
      return t(K.terms.paymentValue, { days: value });
    case 'minQualityScore':
      return t(K.terms.qualityValue, { score: Number(value).toFixed(1) });
    case 'warrantyMonths':
      return t(K.terms.warrantyValue, { months: value });
    default:
      return String(value);
  }
}

export function SupplierAgreementView() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();
  const toast = useToast();
  const s = useSupplierAgreement();
  const notify = (ok: boolean, key: string) => toast.push(t(ok ? key : K.toast.error), ok ? 'success' : 'error');

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} />
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
  if (s.status === 'not_found') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} back={s.isAdmin ? () => navigate(-1) : undefined} />
        <EmptyState title={t(K.notFound.title)} body={t(K.notFound.body)} />
      </Screen>
    );
  }
  if (s.status === 'pick') {
    // Admin's renewals board — whatever needs attention first.
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitleAdmin)} />
        <h2 className="t-lg mb-2">{t(K.pick.heading)}</h2>
        <Card className="ds-card--flush">
          {s.summaries.map((row) => (
            <button key={row.supplier.id} type="button" className="ds-listrow" style={{ alignItems: 'flex-start' }} onClick={() => s.pickSupplier(row.supplier.id)}>
              <span className="ds-avatar shrink-0" aria-hidden="true">
                <FileText size={20} />
              </span>
              <span className="grow stack gap-1" style={{ minWidth: 0 }}>
                <span className="t-medium">{row.supplier.name}</span>
                {row.terms && (
                  <span className="t-xs t-muted">
                    {t(K.pick.summary, { sla: row.terms.deliverySlaDays, pay: row.terms.paymentTermsDays, quality: row.terms.minQualityScore.toFixed(1) })}
                    {row.ordersInFlight > 0 ? ` · ${t(K.pick.inFlight, { count: row.ordersInFlight })}` : ''}
                  </span>
                )}
                <span className="row wrap gap-1">
                  <StatusBadge status={row.status} daysToExpiry={row.daysToExpiry} t={t} />
                  {row.awaitingAcknowledgement && <Badge tone="emerald">{t(K.pick.awaitingAck)}</Badge>}
                </span>
              </span>
            </button>
          ))}
        </Card>
      </Screen>
    );
  }

  const view = s.view!;
  const { current } = view;
  const primary = s.isAdmin
    ? view.status === 'none'
      ? { label: t(K.action.recordInitial), kind: 'initial' as const, icon: <NotePencil size={18} /> }
      : (view.status === 'expiring' || view.status === 'lapsed') && !view.renewalOnFile
        ? { label: t(K.action.recordRenewal), kind: 'renewal' as const, icon: <ArrowsClockwise size={18} /> }
        : { label: t(K.action.recordAmendment), kind: 'amendment' as const, icon: <NotePencil size={18} /> }
    : null;

  return (
    <Screen>
      <ScreenHeader
        title={view.supplier.name}
        subtitle={t(s.isAdmin ? K.subtitleAdmin : K.subtitleSupplier)}
        back={s.isAdmin ? () => navigate(-1) : undefined}
        action={
          // Mid-term changes stay available while renewal is the main ask —
          // but a lapsed agreement has nothing left to amend.
          s.isAdmin && primary?.kind === 'renewal' && view.status === 'expiring' ? (
            <Button size="sm" variant="ghost" icon={<NotePencil size={16} />} onClick={() => s.openForm('amendment')}>
              {t(K.action.recordAmendment)}
            </Button>
          ) : undefined
        }
      />

      {/* Hero — where the agreement stands, and what that means right now. */}
      <Card className="mb-3">
        <div className="row between gap-2 wrap">
          <StatusBadge status={view.status} daysToExpiry={view.daysToExpiry} t={t} />
          {current && <span className="t-xs t-muted">{t(K.hero.version, { version: current.version, date: formatDate(current.effectiveFrom, lang) })}</span>}
        </div>
        {current ? (
          <div className="stack gap-1 mt-3">
            <span className="row gap-2 t-sm">
              <CalendarCheck size={16} aria-hidden="true" />
              {t(view.status === 'lapsed' ? K.hero.expiredOn : K.hero.expires, { date: formatDate(current.expiresOn, lang) })}
              {view.status !== 'lapsed' && view.daysToExpiry !== null && <span className="t-muted">· {t(K.hero.daysLeft, { count: view.daysToExpiry })}</span>}
            </span>
            <span className="row gap-2 t-xs t-muted">
              <FileText size={14} aria-hidden="true" />
              {t(K.hero.document, { name: current.documentName })}
            </span>
          </div>
        ) : (
          <p className="t-sm mt-3">{t(K.hero.none)}</p>
        )}
        {view.status === 'lapsed' && (
          <p className="t-sm t-warning row-top gap-2 mt-3">
            <Warning size={16} className="shrink-0" aria-hidden="true" /> {t(K.hero.lapsed)}
          </p>
        )}
        {view.status === 'expiring' && (
          <p className="t-sm t-warning row-top gap-2 mt-3">
            <Clock size={16} className="shrink-0" aria-hidden="true" /> {t(K.hero.expiring)}
          </p>
        )}
        {view.renewalOnFile && view.upcoming && (
          <p className="t-sm t-success row-top gap-2 mt-3">
            <SealCheck size={16} className="shrink-0" aria-hidden="true" /> {t(K.hero.renewed, { date: formatDate(view.upcoming.effectiveFrom, lang) })}
          </p>
        )}
        {view.upcoming && !view.renewalOnFile && (
          <p className="t-sm row-top gap-2 mt-3">
            <Clock size={16} className="shrink-0" aria-hidden="true" /> {t(K.hero.upcoming, { version: view.upcoming.version, date: formatDate(view.upcoming.effectiveFrom, lang) })}
          </p>
        )}
      </Card>

      {current && <TermsSection s={s} t={t} />}

      <Tabs
        className="mb-3"
        label={view.supplier.name}
        value={s.tab}
        onChange={(id) => s.setTab(id as typeof s.tab)}
        items={AGREEMENT_TABS.map((tab) => ({ id: tab, label: tab === 'orders' ? `${t(K.tab.orders)} · ${view.orders.length}` : `${t(K.tab.history)} · ${view.versions.length}` }))}
      />
      {s.tab === 'orders' ? <OrdersSection s={s} t={t} lang={lang} /> : <HistorySection s={s} t={t} lang={lang} />}

      {primary && (
        <ActionBar>
          <Button block icon={primary.icon} onClick={() => s.openForm(primary.kind)}>
            {primary.label}
          </Button>
        </ActionBar>
      )}
      {!s.isAdmin && s.awaitingAck && (
        <ActionBar>
          <div className="stack gap-2 grow">
            <p className="t-xs t-muted">{t(K.action.acknowledgeHint, { version: s.awaitingAck.version })}</p>
            <Button block icon={<SealCheck size={18} />} loading={s.acknowledging} onClick={() => void s.acknowledge().then((ok) => notify(ok, K.toast.acknowledged))}>
              {t(K.action.acknowledge, { version: s.awaitingAck.version })}
            </Button>
          </div>
        </ActionBar>
      )}

      {s.isAdmin && <RecordSheet s={s} t={t} notify={notify} />}
    </Screen>
  );
}

function StatusBadge({ status, daysToExpiry, t }: { status: SupplierAgreementStatus; daysToExpiry: number | null; t: T }) {
  return <Badge tone={STATUS_TONE[status]}>{t(K.status[status], { count: Math.max(0, daysToExpiry ?? 0) })}</Badge>;
}

/* ------------------------------------------------------------------ terms */

function TermsSection({ s, t }: { s: SupplierAgreementState; t: T }) {
  const navigate = useNavigate();
  const view = s.view!;
  const terms = view.current!.terms;
  const quality = view.supplier.qualityScore;
  const rated = !performanceFor(view.supplier).isDefault;
  const qualityMet = quality >= terms.minQualityScore;
  return (
    <section className="mb-3" aria-labelledby="agreement-terms">
      <h2 id="agreement-terms" className="t-md t-semibold mb-2">
        {t(K.terms.heading)}
      </h2>
      <div className="grid-auto gap-3" style={{ ['--min' as string]: '240px' }}>
        <Card>
          <span className="t-xs t-muted row gap-1">
            <Clock size={14} aria-hidden="true" /> {t(K.terms.sla)}
          </span>
          <p className="num t-lg t-semibold mt-1">{termValue('deliverySlaDays', terms.deliverySlaDays, t)}</p>
          <p className="t-xs t-muted mt-1">{t(K.terms.slaUse)}</p>
        </Card>
        <Card>
          <span className="t-xs t-muted row gap-1">
            <CurrencyInr size={14} aria-hidden="true" /> {t(K.terms.payment)}
          </span>
          <p className="num t-lg t-semibold mt-1">{termValue('paymentTermsDays', terms.paymentTermsDays, t)}</p>
          <p className="t-xs t-muted mt-1">{t(K.terms.paymentUse)}</p>
        </Card>
        <Card>
          <span className="t-xs t-muted row gap-1">
            <SealCheck size={14} aria-hidden="true" /> {t(K.terms.quality)}
          </span>
          <p className="num t-lg t-semibold mt-1">{termValue('minQualityScore', terms.minQualityScore, t)}</p>
          <p className="t-xs mt-1">{terms.qualityStandards}</p>
          <div className="row between wrap gap-2 mt-2">
            {rated ? (
              <Badge tone={qualityMet ? 'success' : 'warning'}>
                {t(qualityMet ? K.terms.qualityMet : K.terms.qualityBelow, { score: quality.toFixed(1) })}
              </Badge>
            ) : (
              <span className="t-xs t-muted">{t(K.terms.qualityUnrated)}</span>
            )}
            <Button
              size="sm"
              variant="ghost"
              icon={<ChartLineUp size={16} />}
              onClick={() => navigate(s.isAdmin ? `/scorecard?supplierId=${view.supplier.id}` : '/scorecard')}
            >
              {t(K.terms.viewScorecard)}
            </Button>
          </div>
        </Card>
      </div>
      {/* The no-liability model, made concrete for this supplier. */}
      <Card className="mt-3">
        <h3 className="t-sm t-semibold row gap-2">
          <ShieldCheck size={16} aria-hidden="true" /> {t(K.liability.heading)}
        </h3>
        <p className="num t-md t-semibold mt-1">{termValue('warrantyMonths', terms.warrantyMonths, t)}</p>
        <p className="t-sm mt-1">{t(K.liability.clause, { supplier: view.supplier.name, months: terms.warrantyMonths })}</p>
      </Card>
    </section>
  );
}

/* ----------------------------------------------------------------- orders */

function OrdersSection({ s, t, lang }: { s: SupplierAgreementState; t: T; lang: string }) {
  const view = s.view!;
  if (view.orders.length === 0) return <EmptyState title={t(K.orders.empty)} body={t(K.orders.emptyBody)} />;
  return (
    <div className="stack gap-2">
      {view.status === 'lapsed' && view.orders.some((o) => o.stage !== 'delivered') && <p className="t-xs t-muted">{t(K.orders.lapsedNote)}</p>}
      <Card className="ds-card--flush">
        {view.orders.map((o) => (
          <div key={o.poId} className="ds-listrow" style={{ alignItems: 'flex-start' }}>
            <span className="grow stack gap-1" style={{ minWidth: 0 }}>
              <span className="t-medium">{o.code}</span>
              <span className="t-xs t-muted">
                {o.version !== null
                  ? t(K.orders.underVersion, { version: o.version, sla: o.deliverySlaDays, pay: o.paymentTermsDays })
                  : t(K.orders.noSnapshot)}
              </span>
              <span className="t-xs">
                {o.promisedDelivery ? t(K.orders.promised, { date: formatDate(o.promisedDelivery, lang) }) : ''}
                {o.paymentDueDate
                  ? ` · ${t(K.orders.paymentDue, { date: formatDate(o.paymentDueDate, lang) })}`
                  : o.paymentTermsDays !== null
                    ? ` · ${t(K.orders.paymentOnDelivery, { days: o.paymentTermsDays })}`
                    : ''}
              </span>
              <span className="row wrap gap-1">
                <Badge tone={o.stage === 'delivered' ? 'success' : 'emerald'}>{t(`fulfilmentStage.${o.stage}`)}</Badge>
                {o.underPriorTerms && <Badge tone="neutral">{t(K.orders.priorTerms)}</Badge>}
              </span>
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------- history */

function HistorySection({ s, t, lang }: { s: SupplierAgreementState; t: T; lang: string }) {
  const view = s.view!;
  if (view.versions.length === 0) return <EmptyState title={t(K.history.empty)} body={t(K.hero.none)} />;
  // In the order it happened, the way every timeline in the app reads.
  const steps: AscensionStep[] = [...view.versions].reverse().map(({ version: v, changed, isCurrent, isUpcoming }) => ({
    id: v.id,
    label: t(K.history.step, { version: v.version, kind: t(K.history.kind[v.kind]) }),
    meta: [
      t(K.history.effective, { from: formatDate(v.effectiveFrom, lang), to: formatDate(v.expiresOn, lang) }),
      ...changed.map((key) => t(K.form.change, { term: t(K.termName[key]), to: termValue(key, v.terms[key], t) })),
      v.reason ?? '',
      t(K.history.recorded, { name: v.recordedBy, date: formatDate(v.recordedAt, lang), document: v.documentName }),
      v.acknowledgedAt ? t(K.history.acknowledged, { name: v.acknowledgedBy ?? '', date: formatDate(v.acknowledgedAt, lang) }) : t(K.history.awaitingAck),
    ]
      .filter(Boolean)
      .join('\n'),
    status: isUpcoming ? 'upcoming' : isCurrent ? 'current' : 'complete',
    trailing: isCurrent ? <Badge tone="success">{t(K.history.current)}</Badge> : isUpcoming ? <Badge tone="emerald">{t(K.history.upcoming)}</Badge> : undefined,
  }));
  return (
    <Card>
      <AscensionLine steps={steps} className="ds-ascension--multiline" />
    </Card>
  );
}

/* ------------------------------------------------------------ record sheet */

const ISSUE_FIELD: Partial<Record<FormIssue, keyof TermsDraft>> = {
  sla_range: 'deliverySlaDays',
  payment_range: 'paymentTermsDays',
  quality_range: 'minQualityScore',
  warranty_range: 'warrantyMonths',
  standards_required: 'qualityStandards',
};

function RecordSheet({ s, t, notify }: { s: SupplierAgreementState; t: T; notify: (ok: boolean, key: string) => void }) {
  const view = s.view!;
  const kind = s.formKind;
  const issueFor = (field: keyof TermsDraft) => {
    const issue = s.formIssues.find((i) => ISSUE_FIELD[i] === field);
    return issue ? t(K.form.issue[issue], TERM_LIMITS[field as keyof typeof TERM_LIMITS] ?? {}) : undefined;
  };
  const dateIssue = s.formIssues.find((i) => i === 'expiry_before_start' || i === 'starts_before_previous');
  const inFlight = view.orders.filter((o) => o.stage !== 'delivered').length;
  const title = kind === 'initial' ? K.form.titleInitial : kind === 'renewal' ? K.form.titleRenewal : K.form.titleAmendment;
  const numberField = (field: keyof TermsDraft, label: string, step = '1') => (
    <Field label={label} error={issueFor(field)} required>
      {({ id, describedBy, invalid }) => (
        <Input
          id={id}
          aria-describedby={describedBy}
          invalid={invalid}
          type="number"
          inputMode="decimal"
          step={step}
          mono
          value={s.termsDraft[field]}
          onChange={(e) => s.setTerm(field, e.target.value)}
        />
      )}
    </Field>
  );

  return (
    <Sheet
      open={kind !== null}
      onClose={s.closeForm}
      title={t(title)}
      closeLabel={t('action.close')}
      footer={
        <Button block disabled={!s.canSave} loading={s.saving} onClick={() => void s.saveForm().then((ok) => notify(ok, K.toast.recorded))}>
          {t(K.form.save)}
        </Button>
      }
    >
      <div className="stack gap-3">
        <div className="grid-2 gap-2">
          <Field label={t(K.form.effectiveFrom)} error={dateIssue ? t(K.form.issue[dateIssue]) : undefined} required>
            {({ id, describedBy, invalid }) => (
              <Input id={id} aria-describedby={describedBy} invalid={invalid} type="date" value={s.effectiveFrom} onChange={(e) => s.setEffectiveFrom(e.target.value)} />
            )}
          </Field>
          <Field label={t(K.form.expiresOn)} required>
            {({ id }) => <Input id={id} type="date" value={s.expiresOn} onChange={(e) => s.setExpiresOn(e.target.value)} />}
          </Field>
        </div>
        {kind === 'amendment' && <p className="t-xs t-muted">{t(K.form.effectiveHint)}</p>}

        <div className="grid-2 gap-2">
          {numberField('deliverySlaDays', t(K.form.slaDays))}
          {numberField('paymentTermsDays', t(K.form.paymentDays))}
          {numberField('minQualityScore', t(K.form.minQuality), '0.1')}
          {numberField('warrantyMonths', t(K.form.warrantyMonths))}
        </div>
        <Field label={t(K.form.standards)} error={issueFor('qualityStandards')} required>
          {({ id, describedBy, invalid }) => (
            <TextArea id={id} aria-describedby={describedBy} aria-invalid={invalid || undefined} rows={2} value={s.termsDraft.qualityStandards} onChange={(e) => s.setTerm('qualityStandards', e.target.value)} />
          )}
        </Field>

        {kind !== 'initial' && (
          <Card className="stack gap-1">
            <span className="t-sm t-semibold">{t(K.form.changes)}</span>
            {s.formChanges.length === 0 ? (
              <span className="t-xs t-muted">{t(K.form.noChanges)}</span>
            ) : (
              s.formChanges.map((c) => (
                <span key={c.key} className="t-xs">
                  {t(K.form.change, { term: t(K.termName[c.key]), to: `${termValue(c.key, c.from, t)} → ${termValue(c.key, c.to, t)}` })}
                </span>
              ))
            )}
            {inFlight > 0 && <span className="t-xs t-muted mt-1">{t(K.form.inFlightNote, { count: inFlight })}</span>}
          </Card>
        )}

        {s.needsReason && (
          <Field label={t(K.form.reason)} hint={t(K.form.reasonHint)} required>
            {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={s.reason} onChange={(e) => s.setReason(e.target.value)} />}
          </Field>
        )}

        <DocumentSlot
          label={t(K.form.document)}
          hint={t(K.form.documentHint)}
          required
          value={s.document}
          onChange={s.setDocument}
          accept="application/pdf,image/*"
          skipQualityCheck
        />

        <Checkbox checked={s.passThrough} onChange={s.setPassThrough} label={t(K.form.passThrough, { supplier: view.supplier.name })} />
      </div>
    </Sheet>
  );
}
