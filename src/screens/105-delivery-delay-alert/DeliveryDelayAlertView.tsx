import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Truck, Warning, WarningOctagon } from '@phosphor-icons/react';
import {
  ActionBar,
  Badge,
  Button,
  Card,
  Checkbox,
  Chip,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  Sheet,
  TextArea,
  formatDate,
  formatDateTime,
  useToast,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { DelayRow } from '@/data/repository';
import type { DelayRootCause, DelaySeverity } from '@/data/types';
import { useDeliveryDelayAlert } from './useDeliveryDelayAlert';
import type { ActionResult, DeliveryDelayState } from './useDeliveryDelayAlert';
import { CONTACT_CHANNELS, DELAY_FILTERS, DELIVERY_DELAY_KEYS as K, ROOT_CAUSES } from './delivery-delay-alert.types';

type T = ReturnType<typeof useTranslation>['t'];
type Report = (r: ActionResult, success?: string, params?: Record<string, unknown>, tone?: 'success' | 'warning') => void;

const SEVERITY_TONE: Record<DelaySeverity, BadgeTone> = { critical: 'error', late: 'warning', watch: 'neutral' };
const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);

/** "6 hours" / "3 days": hours below two days, days after. */
function gapText(t: T, hours: number): string {
  const h = Math.abs(Math.round(hours));
  return h < 48 ? t(K.row.hours, { count: h }) : t(K.row.days, { count: Math.round(h / 24) });
}

/**
 * Screen 105 — Delivery Delay Alert & Escalation. The delivery-shaped answer
 * to "what is about to go wrong before a customer has to tell us": ranked by
 * what it does to their installation, with the three things Admin can do
 * about it one tap away, and the cause attributed honestly.
 */
export function DeliveryDelayAlertView() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const toast = useToast();
  const s = useDeliveryDelayAlert();

  const report = (r: ActionResult, success?: string, params?: Record<string, unknown>, tone: 'success' | 'warning' = 'success') => {
    if (!r.ok) {
      toast.push(t(errorKey(r.code)), 'error');
      return;
    }
    if (success) toast.push(t(success, params), tone);
  };

  if (s.status === 'loading') {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="list" rows={5} />
      </Screen>
    );
  }
  if (s.status === 'error' || !s.board) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />
      </Screen>
    );
  }

  const nothing = s.open.length === 0 && s.recovered.length === 0;
  return (
    <Screen width="default">
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(K.subtitle)}
        action={
          s.open.length > 1 ? (
            <Button size="sm" variant={s.selecting ? 'primary' : 'secondary'} onClick={s.toggleSelecting}>
              {t(s.selecting ? K.filter.done : K.filter.select)}
            </Button>
          ) : undefined
        }
      />

      <div className="sticky-under-shell stack gap-2 mb-3">
        <Input aria-label={t(K.filter.search)} placeholder={t(K.filter.search)} value={s.query} onChange={(e) => s.setQuery(e.target.value)} />
        <div className="row gap-2 ds-tabs--scroll" style={{ overflowX: 'auto' }} role="group" aria-label={t(K.filter.label)}>
          {DELAY_FILTERS.map((f) => (
            <Chip key={f} pressed={s.filter === f} onClick={() => s.setFilter(f)}>
              {t(K.filter[f])} · {s.counts[f]}
            </Chip>
          ))}
        </div>
      </div>

      {nothing ? (
        <EmptyState icon={<CheckCircle size={32} />} title={t(K.list.emptyTitle)} body={t(K.list.emptyBody)} />
      ) : (
        <div className="stack gap-4">
          <section className="stack gap-2" aria-labelledby="open-heading">
            <div className="stack">
              <h2 id="open-heading" className="t-md t-semibold">
                {t(K.list.openHeading)}
              </h2>
              <p className="t-xs t-muted">{t(K.list.openHint)}</p>
            </div>
            {s.shown.length === 0 ? (
              <EmptyState
                icon={<CheckCircle size={28} />}
                title={t(s.open.length === 0 ? K.list.emptyTitle : K.list.emptyFilteredTitle)}
                body={t(s.open.length === 0 ? K.list.emptyBody : K.list.emptyFilteredBody)}
                actionLabel={s.open.length > 0 ? t(K.list.clearFilter) : undefined}
                onAction={
                  s.open.length > 0
                    ? () => {
                        s.setFilter('all');
                        s.setQuery('');
                      }
                    : undefined
                }
              />
            ) : (
              <Card className="ds-card--flush">
                {s.shown.map((row) => (
                  <DelayListRow key={row.caseId} row={row} s={s} t={t} lang={lang} />
                ))}
              </Card>
            )}
          </section>

          {s.recovered.length > 0 && (
            <section className="stack gap-2" aria-labelledby="recovered-heading">
              <h2 id="recovered-heading" className="t-md t-semibold">
                {t(K.list.recoveredHeading)}
              </h2>
              <Card className="ds-card--flush">
                {s.recovered.map((row) => (
                  <RecoveredRow key={row.caseId} row={row} s={s} t={t} lang={lang} />
                ))}
              </Card>
            </section>
          )}
        </div>
      )}

      {s.selecting && s.chosen.length > 0 && <BatchBar s={s} t={t} lang={lang} report={report} />}
      <DetailSheet s={s} t={t} lang={lang} report={report} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ rows */

/** The list row anatomy (leading, primary, secondary, trailing), with room to wrap:
 *  these rows carry more than one line of what matters, so they never truncate it. */
function Row({ leading, title, children, trailing, onClick }: { leading: ReactNode; title: string; children: ReactNode; trailing: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="ds-listrow" style={{ alignItems: 'flex-start' }} onClick={onClick}>
      <span className="shrink-0" style={{ minHeight: 24, display: 'inline-flex', alignItems: 'center' }}>
        {leading}
      </span>
      <span className="grow stack gap-1" style={{ minWidth: 0 }}>
        <span className="t-medium">{title}</span>
        {children}
      </span>
      <span className="shrink-0">{trailing}</span>
    </button>
  );
}

function DelayListRow({ row, s, t, lang }: { row: DelayRow; s: DeliveryDelayState; t: T; lang: string }) {
  const severity = row.severity ?? row.worstSeverity;
  const late = severity !== 'watch';
  const selected = s.selected.includes(row.caseId);
  const told = !!row.customerNotifiedAt;
  const lines: string[] = [];
  lines.push(
    late
      ? t(K.row.lateBy, { gap: gapText(t, row.gapHours ?? row.peakGapHours), eta: formatDate(row.currentEta, lang) })
      : t(K.row.trending, { eta: formatDate(row.currentEta, lang), expected: row.expectedAt ? formatDate(row.expectedAt, lang) : '' }),
  );
  if (row.impact === 'blocks_install' && row.installStart) lines.push(t(K.row.blocks, { date: formatDate(row.installStart, lang) }));
  else if (row.impact === 'tight' && row.installStart) lines.push(t(K.row.tight, { date: formatDate(row.installStart, lang) }));
  return (
    <Row
      leading={
        s.selecting ? (
          <Checkbox checked={selected} onChange={() => s.toggle(row.caseId)} label={<span className="sr-only">{t(K.row.select, { code: row.poCode })}</span>} />
        ) : late ? (
          <WarningOctagon size={24} aria-hidden="true" color="var(--color-warning)" />
        ) : (
          <Clock size={24} aria-hidden="true" color="var(--color-text-secondary)" />
        )
      }
      title={`${row.siteName} · ${row.poCode}`}
      trailing={<Badge tone={SEVERITY_TONE[severity]}>{t(K.severity[severity])}</Badge>}
      onClick={() => (s.selecting ? s.toggle(row.caseId) : s.openCase(row.caseId))}
    >
      <span className="t-xs t-muted">
        {row.supplierName} · {lines[0]}
      </span>
      {lines[1] && <span className="t-xs t-warning">{lines[1]}</span>}
      <span className="row gap-2 wrap">
        <Badge tone={told && !row.notifyStale ? 'success' : 'neutral'}>{told ? t(row.notifyStale ? K.row.retold : K.row.told) : t(K.row.notTold)}</Badge>
        <Badge tone={row.rootCause ? 'accent' : 'neutral'}>{row.rootCause ? t(K.cause[row.rootCause]) : t(K.row.untagged)}</Badge>
        {row.escalatedAt && <Badge tone="warning">{t(K.row.escalated)}</Badge>}
      </span>
    </Row>
  );
}

function RecoveredRow({ row, s, t, lang }: { row: DelayRow; s: DeliveryDelayState; t: T; lang: string }) {
  return (
    <Row
      leading={<CheckCircle size={24} aria-hidden="true" weight="fill" color="var(--color-success)" />}
      title={`${row.siteName} · ${row.poCode}`}
      trailing={<Badge tone="success">{t(K.row.recovered)}</Badge>}
      onClick={() => s.openCase(row.caseId)}
    >
      <span className="t-xs t-muted">{row.delivered ? t(K.row.delivered) : t(K.row.recoveredNote, { eta: formatDate(row.currentEta, lang) })}</span>
      {row.customerNotifiedAt && !row.delivered && <span className="t-xs t-muted">{t(K.row.recoveredTold, { date: formatDate(row.customerNotifiedAt, lang) })}</span>}
    </Row>
  );
}

/* ------------------------------------------------------------- batch bar */

function BatchBar({ s, t, lang, report }: { s: DeliveryDelayState; t: T; lang: string; report: Report }) {
  const customers = new Set(s.chosen.map((r) => r.customerName)).size;
  const [tagOpen, tellOpen] = [s.batchSheet === 'tag', s.batchSheet === 'tell'];
  return (
    <>
      <ActionBar>
        <span className="t-sm grow">{t(K.batch.selected, { count: s.chosen.length })}</span>
        <Button variant="secondary" onClick={() => s.setBatchSheet('tag')}>
          {t(K.batch.tag)}
        </Button>
        <Button onClick={() => s.setBatchSheet('tell')}>{t(K.batch.tell)}</Button>
      </ActionBar>
      <Sheet open={tagOpen} onClose={() => s.setBatchSheet(null)} title={t(K.batch.tagTitle)} closeLabel={t('action.close')}>
        <CauseForm row={s.chosen[0]} s={s} t={t} rows={s.chosen} intro={t(K.batch.tagIntro, { count: s.chosen.length })} onDone={() => s.setBatchSheet(null)} report={report} batch />
      </Sheet>
      <Sheet open={tellOpen} onClose={() => s.setBatchSheet(null)} title={t(K.batch.tellTitle)} closeLabel={t('action.close')}>
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(K.batch.tellIntro)}</p>
          <p className="t-sm">{t(K.batch.tellSummary, { orders: s.chosen.length, customers })}</p>
          {s.chosen.some((r) => !r.rootCause) && <p className="t-xs t-warning">{t(K.customer.tellAfterCause)}</p>}
          <blockquote className="t-sm" style={{ borderLeft: '3px solid var(--color-accent-primary)', paddingLeft: 'var(--space-3)' }}>
            {s.chosen[0]?.customerPreview}
          </blockquote>
          <div className="row gap-2">
            <Button loading={s.busy} onClick={() => void s.tellCustomers(s.chosen).then((r) => reportNotify(r, report, s.clearSelection, () => s.setBatchSheet(null)))}>
              {t(K.batch.tellSend, { count: customers })}
            </Button>
            <Button variant="ghost" onClick={() => s.setBatchSheet(null)}>
              {t(K.batch.cancel)}
            </Button>
          </div>
        </div>
      </Sheet>
      <span hidden>{lang}</span>
    </>
  );
}

function reportNotify(r: ActionResult, report: Report, after?: () => void, close?: () => void) {
  if (!r.ok || !r.notify) {
    report(r);
    return;
  }
  close?.();
  after?.();
  if (r.notify.notified === 0) report({ ok: true }, K.toast.nobodyTold);
  else report({ ok: true }, K.toast.told, { count: r.notify.notified });
  // Anyone not told, and why, so nobody assumes a customer heard when they did not.
  for (const reason of new Set(r.notify.skipped.map((x) => x.reason))) report({ ok: true }, K.skipped[reason], undefined, 'warning');
}

/* ------------------------------------------------------------- the sheet */

function CauseForm({ row, rows, s, t, intro, onDone, report, batch }: { row: DelayRow; rows: DelayRow[]; s: DeliveryDelayState; t: T; intro?: string; onDone?: () => void; report: Report; batch?: boolean }) {
  const d = s.causeOf(row);
  return (
    <div className="stack gap-3">
      {intro && <p className="t-sm t-muted">{intro}</p>}
      <Field label={t(K.causeSection.select)} required>
        {({ id }) => (
          <Select id={id} value={d.cause} onChange={(e) => s.patchCause(row, { cause: e.target.value as DelayRootCause })}>
            <option value="">—</option>
            {ROOT_CAUSES.map((c) => (
              <option key={c} value={c}>
                {t(K.cause[c])}
              </option>
            ))}
          </Select>
        )}
      </Field>
      {d.cause && <p className="t-xs t-muted">{t(K.causeHint[d.cause])}</p>}
      {d.cause === 'external_event' && (
        <Field label={t(K.causeSection.label)} hint={t(K.causeSection.labelHint)} required>
          {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} placeholder={t(K.causeSection.placeholder)} value={d.label} onChange={(e) => s.patchCause(row, { label: e.target.value })} />}
        </Field>
      )}
      <Field label={t(K.causeSection.note)}>
        {({ id }) => <TextArea id={id} rows={2} value={d.note} onChange={(e) => s.patchCause(row, { note: e.target.value })} />}
      </Field>
      {d.cause === 'external_event' && <p className="t-xs t-muted">{t(K.causeSection.externalNote)}</p>}
      <div>
        <Button
          disabled={!s.canTag(d)}
          loading={s.busy}
          onClick={() =>
            void s.tagCauses(rows, d).then((r) => {
              report(r, K.toast.tagged);
              if (r.ok) onDone?.();
            })
          }
        >
          {batch ? t(K.batch.tag) : t(K.causeSection.save)}
        </Button>
      </div>
    </div>
  );
}

function DetailSheet({ s, t, lang, report }: { s: DeliveryDelayState; t: T; lang: string; report: Report }) {
  const navigate = useNavigate();
  const row = s.openRow;
  return (
    <Sheet open={!!row} onClose={s.closeCase} title={row ? `${row.poCode} · ${row.siteName}` : ''} closeLabel={t('action.close')}>
      {row && <DetailBody row={row} s={s} t={t} lang={lang} report={report} navigate={navigate} />}
    </Sheet>
  );
}

function DetailBody({ row, s, t, lang, report, navigate }: { row: DelayRow; s: DeliveryDelayState; t: T; lang: string; report: Report; navigate: (to: string) => void }) {
  const isOpen = row.status === 'open';
  const severity = row.severity ?? row.worstSeverity;
  const template = t(K.contact.template, { code: row.poCode, site: row.siteName, eta: formatDate(row.currentEta, lang) });
  const contact = s.contactOf(row, template);
  return (
    <div className="stack gap-4">
      <section className="stack gap-2" aria-label={t(K.sheet.heldTo)}>
        <div className="row between gap-2 wrap">
          <Badge tone={isOpen ? SEVERITY_TONE[severity] : 'success'}>{isOpen ? t(K.severity[severity]) : t(K.row.recovered)}</Badge>
          <span className="t-xs t-muted">{t(K.sheet.openedAt, { time: formatDateTime(row.openedAt, lang) })}</span>
        </div>
        <dl className="stack gap-1 t-sm">
          {row.expectedAt && <SheetRow label={t(row.expectedSource === 'booked' ? K.sheet.heldBooked : K.sheet.heldPromised)} value={formatDateTime(row.expectedAt, lang)} />}
          <SheetRow label={t(K.sheet.nowExpected)} value={`${formatDateTime(row.currentEta, lang)} · ${t(row.etaSource === 'tracker' ? K.sheet.etaTracker : K.sheet.etaEstimate)}`} />
          {isOpen && row.gapHours != null && <SheetRow label={t(K.sheet.gap)} value={row.gapHours > 0 ? gapText(t, row.gapHours) : t(K.sheet.onTime)} />}
          <SheetRow label={t(K.sheet.stage)} value={t(`fulfilmentStage.${row.stage}`)} />
        </dl>
        {row.uncertain && <p className="t-xs t-warning">{t(K.sheet.uncertain)}</p>}
        {row.installStart && (
          <p className={`t-sm ${row.impact === 'blocks_install' ? 't-error' : row.impact === 'tight' ? 't-warning' : 't-muted'} row-top gap-2`}>
            <Warning size={16} className="shrink-0" aria-hidden="true" />
            <span>
              {t(K.sheet.install, { code: row.installCode ?? '', date: formatDate(row.installStart, lang) })} {t(row.impact === 'blocks_install' ? K.sheet.installBlocks : row.impact === 'tight' ? K.sheet.installTight : K.sheet.installFlexible)}
            </span>
          </p>
        )}
      </section>

      {isOpen ? (
        <>
          <section className="stack gap-2 hairline-top pt-3" aria-labelledby="cause-heading">
            <h3 id="cause-heading" className="t-md t-semibold">
              {t(K.causeSection.heading)}
            </h3>
            <p className="t-xs t-muted">{t(K.causeSection.intro)}</p>
            {row.rootCause && (
              <p className="t-sm">
                {t(K.causeSection.current, { cause: t(K.cause[row.rootCause]) })}
                {row.externalLabel ? `: ${row.externalLabel}` : ''}
                {row.promiseMovedFrom ? ` ${t(K.causeSection.moved, { date: formatDate(row.promiseMovedFrom, lang) })}` : ''}
              </p>
            )}
            <CauseForm row={row} rows={[row]} s={s} t={t} report={report} />
          </section>

          <section className="stack gap-2 hairline-top pt-3" aria-labelledby="contact-heading">
            <h3 id="contact-heading" className="t-md t-semibold">
              {t(K.contact.heading)}
            </h3>
            <p className="t-xs t-muted">{t(K.contact.intro, { supplier: row.supplierName })}</p>
            {row.contactedSupplierAt && <p className="t-xs t-muted">{t(K.contact.contacted, { time: formatDateTime(row.contactedSupplierAt, lang) })}</p>}
            <Field label={t(K.contact.channel)}>
              {({ id }) => (
                <Select id={id} value={contact.channel} onChange={(e) => s.patchContact(row, template, { channel: e.target.value as typeof contact.channel })}>
                  {CONTACT_CHANNELS.map((c) => (
                    <option key={c} value={c} disabled={c === 'in_app' && !row.supplierHasLogin}>
                      {t(K.contact[`channel_${c}`])}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            {!row.supplierHasLogin && <p className="t-xs t-muted">{t(K.contact.noPortal)}</p>}
            <Field label={t(contact.channel === 'in_app' ? K.contact.body : K.contact.bodyLogged)}>
              {({ id }) => <TextArea id={id} rows={3} value={contact.body} onChange={(e) => s.patchContact(row, template, { body: e.target.value })} />}
            </Field>
            <Checkbox checked={contact.expectsReply} onChange={(v) => s.patchContact(row, template, { expectsReply: v })} label={t(K.contact.expectsReply)} />
            <div className="row gap-2 wrap">
              <Button
                loading={s.busy}
                disabled={contact.body.trim().length < 4}
                onClick={() => void s.contactSupplier(row, contact).then((r) => report(r, r.logged ? K.toast.logged : K.toast.contacted))}
              >
                {t(contact.channel === 'in_app' ? K.contact.send : K.contact.log)}
              </Button>
              {row.threadId && (
                <Button variant="ghost" onClick={() => navigate(`/supplier-messages?thread=${row.threadId}`)}>
                  {t(K.contact.openThread)}
                </Button>
              )}
            </div>
          </section>

          <section className="stack gap-2 hairline-top pt-3" aria-labelledby="customer-heading">
            <h3 id="customer-heading" className="t-md t-semibold">
              {t(K.customer.heading)}
            </h3>
            <p className="t-xs t-muted">{t(K.customer.intro)}</p>
            {row.customerNotifiedAt && (
              <p className="t-sm t-success row gap-2">
                <CheckCircle size={16} weight="fill" aria-hidden="true" /> {t(K.customer.told, { time: formatDateTime(row.customerNotifiedAt, lang), eta: row.customerNotifiedEta ? formatDate(row.customerNotifiedEta, lang) : '' })}
              </p>
            )}
            {row.notifyStale && <p className="t-xs t-warning">{t(K.customer.stale)}</p>}
            {!row.rootCause && <p className="t-xs t-muted">{t(K.customer.tellAfterCause)}</p>}
            <p className="t-xs t-muted">{t(K.customer.preview, { name: row.customerName })}</p>
            <blockquote className="t-sm" style={{ borderLeft: '3px solid var(--color-accent-primary)', paddingLeft: 'var(--space-3)' }}>
              {row.customerPreview}
            </blockquote>
            {row.customerOptedOut && <p className="t-xs t-warning">{t(K.customer.optedOut)}</p>}
            <div>
              <Button
                variant={row.customerNotifiedAt && !row.notifyStale ? 'secondary' : 'primary'}
                loading={s.busy}
                disabled={row.customerOptedOut || (!!row.customerNotifiedAt && !row.notifyStale)}
                onClick={() => void s.tellCustomers([row]).then((r) => reportNotify(r, report))}
              >
                {t(row.customerNotifiedAt ? K.customer.resend : K.customer.send)}
              </Button>
            </div>
          </section>

          <section className="stack gap-2 hairline-top pt-3" aria-labelledby="escalate-heading">
            <h3 id="escalate-heading" className="t-md t-semibold">
              {t(K.escalate.heading)}
            </h3>
            <p className="t-xs t-muted">{t(K.escalate.intro)}</p>
            {row.escalatedAt ? (
              <p className="t-sm">{t(K.escalate.done, { time: formatDateTime(row.escalatedAt, lang) })}</p>
            ) : (
              <>
                <Field label={t(K.escalate.note)}>
                  {({ id }) => <TextArea id={id} rows={2} value={s.escalateNote} onChange={(e) => s.setEscalateNote(e.target.value)} />}
                </Field>
                <div>
                  <Button variant="danger" loading={s.busy} disabled={s.escalateNote.trim().length < 4} onClick={() => void s.escalate(row).then((r) => report(r, K.toast.escalated))}>
                    {t(K.escalate.submit)}
                  </Button>
                </div>
              </>
            )}
          </section>
        </>
      ) : (
        <p className="t-sm">{row.delivered ? t(K.row.delivered) : t(K.row.recoveredNote, { eta: formatDate(row.currentEta, lang) })}</p>
      )}

      <div className="row gap-2 wrap hairline-top pt-3">
        <Button size="sm" variant="ghost" icon={<Truck size={16} />} onClick={() => navigate(`/shipments?poId=${row.poId}`)}>
          {t(K.links.tracking)}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => navigate(`/deliveries?poId=${row.poId}`)}>
          {t(K.links.booking)}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => navigate(`/orders?poId=${row.poId}`)}>
          {t(K.links.order)}
        </Button>
      </div>
    </div>
  );
}

function SheetRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="row between gap-3" style={{ alignItems: 'baseline' }}>
      <dt className="t-muted">{label}</dt>
      <dd style={{ textAlign: 'right' }}>{value}</dd>
    </div>
  );
}
