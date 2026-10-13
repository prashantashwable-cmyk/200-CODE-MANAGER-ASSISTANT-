import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Package, Truck, Warning, WarningOctagon } from '@phosphor-icons/react';
import {
  AscensionLine,
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
  TextArea,
  formatDate,
  formatDateTime,
  formatINR,
  useToast,
} from '@/design-system';
import type { AscensionStep, BadgeTone } from '@/design-system';
import type { DiscrepancyReportView, ReportImpactLevel } from '@/data/repository';
import type { ReportResolution } from '@/data/types';
import { useDamagedPartsReport } from './useDamagedPartsReport';
import type { ActionResult, DamagedPartsState } from './useDamagedPartsReport';
import { CAUSES, CONTACT_CHANNELS, DAMAGED_PARTS_KEYS as K, REPORT_FILTERS } from './damaged-parts-report.types';

type T = ReturnType<typeof useTranslation>['t'];
type Report = (r: ActionResult, success?: string, params?: Record<string, unknown>) => void;

const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const IMPACT_TONE: Record<ReportImpactLevel, BadgeTone> = { none: 'neutral', unknown: 'warning', ok: 'success', tight: 'warning', blocks: 'error' };
const RESOLUTION_TONE: Record<ReportResolution, BadgeTone> = { reported: 'error', replacement_requested: 'warning', replacement_shipped: 'accent', resolved: 'success', credited: 'success' };

/**
 * Screen 108 — Damaged/Missing Parts Report. One report per delivery, raised by
 * the checklist (103). Here the technician says what happened, Admin says whose
 * it is, the supplier is told with the photos, and the road to a replacement or a
 * credit is tracked, with what it does to the customer's installation in view.
 */
export function DamagedPartsReportView() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const s = useDamagedPartsReport();

  const report: Report = (r, success, params) => {
    if (!r.ok) {
      const skipKey = r.skipped === 'opted_out' ? K.toast.optedOut : r.skipped === 'already_told' ? K.toast.alreadyTold : r.skipped === 'no_contact' ? K.toast.noContact : null;
      toast.push(t(skipKey ?? errorKey(r.code)), skipKey ? 'warning' : 'error');
      return;
    }
    if (success) toast.push(t(success, params), 'success');
  };

  if (s.status === 'loading') {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="list" rows={4} />
      </Screen>
    );
  }
  if (s.status === 'error') {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />
      </Screen>
    );
  }

  if (s.reportParam) {
    if (!s.current) {
      return (
        <Screen width="narrow">
          <ScreenHeader title={t(K.title)} back={s.closeReport} backLabel={t('action.back')} />
          <EmptyState icon={<Package size={32} />} title={t(K.list.notFound)} body={t(K.list.emptyBody)} actionLabel={t(K.list.backToList)} onAction={s.closeReport} />
        </Screen>
      );
    }
    return <ReportDetail r={s.current} s={s} t={t} lang={i18n.language} report={report} />;
  }

  return <ReportBoard s={s} t={t} lang={i18n.language} />;
}

/* ------------------------------------------------------------------ board */

function ReportBoard({ s, t, lang }: { s: DamagedPartsState; t: T; lang: string }) {
  const nothing = s.reports.length === 0;
  return (
    <Screen width="default">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
      <div className="sticky-under-shell stack gap-2 mb-3">
        <Input aria-label={t(K.filter.search)} placeholder={t(K.filter.search)} value={s.query} onChange={(e) => s.setQuery(e.target.value)} />
        <div className="row gap-2 ds-tabs--scroll" style={{ overflowX: 'auto' }} role="group" aria-label={t(K.filter.label)}>
          {REPORT_FILTERS.map((f) => (
            <Chip key={f} pressed={s.filter === f} onClick={() => s.setFilter(f)}>
              {t(K.filter[f])} · {s.counts[f]}
            </Chip>
          ))}
        </div>
      </div>
      {nothing ? (
        <EmptyState icon={<CheckCircle size={32} />} title={t(K.list.emptyTitle)} body={t(K.list.emptyBody)} />
      ) : s.shown.length === 0 ? (
        <EmptyState
          icon={<CheckCircle size={28} />}
          title={t(K.list.emptyFilteredTitle)}
          body={t(K.list.emptyFilteredBody)}
          actionLabel={t(K.list.clearFilter)}
          onAction={() => {
            s.setFilter('open');
            s.setQuery('');
          }}
        />
      ) : (
        <div className="grid-auto">
          {s.shown.map((r) => (
            <button key={r.id} type="button" className="ds-card ds-card--interactive" style={{ textAlign: 'start', width: '100%' }} onClick={() => s.openReport(r.id)}>
              <div className="stack gap-2">
                <div className="row between gap-2 wrap">
                  <strong className="t-md">{r.code}</strong>
                  <div className="row gap-1 wrap">
                    {r.rush && r.status === 'open' && (
                      <Badge tone="error">
                        <WarningOctagon size={12} aria-hidden="true" /> {t(K.list.rush)}
                      </Badge>
                    )}
                    <Badge tone={RESOLUTION_TONE[r.resolution]}>{t(K.resolution[r.resolution])}</Badge>
                  </div>
                </div>
                <span className="t-sm">
                  {r.siteName} · {r.poCode}
                </span>
                <span className="t-xs t-muted">
                  {r.supplierName} · {t(K.list.parts, { count: r.items.length })} · {formatINR(r.affectedValue)}
                </span>
                <div className="row gap-1 wrap">
                  {r.status === 'open' && !r.attribution && <Badge tone="warning">{t(K.list.unjudged)}</Badge>}
                  {r.status === 'open' && r.impact.level !== 'none' && <Badge tone={IMPACT_TONE[r.impact.level]}>{t(K.impact[r.impact.level])}</Badge>}
                </div>
                <span className="t-xs t-muted">{t(K.list.raised, { when: formatDateTime(r.createdAt, lang) })}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </Screen>
  );
}

/* ----------------------------------------------------------------- detail */

function ReportDetail({ r, s, t, lang, report }: { r: DiscrepancyReportView; s: DamagedPartsState; t: T; lang: string; report: Report }) {
  const navigate = useNavigate();
  return (
    <Screen width="narrow">
      <ScreenHeader
        title={r.code}
        subtitle={`${r.siteName} · ${r.poCode}`}
        back={s.closeReport}
        backLabel={t('action.back')}
        action={
          <div className="row gap-1 wrap">
            {r.rush && r.status === 'open' && <Badge tone="error">{t(K.list.rush)}</Badge>}
            <Badge tone={RESOLUTION_TONE[r.resolution]}>{t(K.resolution[r.resolution])}</Badge>
          </div>
        }
      />
      <div className="stack gap-3">
        <Card>
          <dl className="stack gap-1 t-sm">
            <Row label={t(K.detail.site)} value={`${r.siteName} · ${r.customerName}`} />
            <Row label={t(K.detail.order)} value={r.poCode} />
            <Row label={t(K.detail.supplier)} value={r.supplierName} />
            <Row label={t(K.detail.reporter)} value={`${r.reporterName}, ${formatDateTime(r.createdAt, lang)}`} />
            <Row label={t(K.detail.affected)} value={formatINR(r.affectedValue)} />
          </dl>
          {!r.checklistCompleted && <p className="t-xs t-muted mt-2">{t(K.detail.deliveryOpen)}</p>}
          <div className="row gap-2 wrap mt-2">
            <Button size="sm" variant="secondary" onClick={() => navigate(`/delivery-checklist?poId=${r.poId}`)}>
              {t(K.detail.seeChecklist)}
            </Button>
            {s.isAdmin && r.threadId && (
              <Button size="sm" variant="secondary" onClick={() => navigate(`/supplier-messages?thread=${r.threadId}`)}>
                {t(K.detail.seeThread)}
              </Button>
            )}
          </div>
        </Card>

        <section className="stack gap-2" aria-labelledby="items-h">
          <h2 id="items-h" className="t-md t-semibold">
            {t(K.detail.itemsHeading)}
          </h2>
          {r.items.map((i) => (
            <Card key={i.lineItemId}>
              <div className="stack gap-2">
                <div className="row between gap-2 wrap">
                  <strong className="t-sm">{i.description}</strong>
                  <div className="row gap-1 wrap">
                    {i.kinds.map((k) => (
                      <Badge key={k} tone="warning">
                        {t(K.kind[k])}
                      </Badge>
                    ))}
                  </div>
                </div>
                <span className="t-xs t-muted">
                  {t(K.detail.expected, { count: i.expectedQty })} · {t(K.detail.received, { count: i.receivedQty })} · {formatINR(i.value)}
                </span>
                <p className="t-sm">{i.note ?? t(K.detail.noNote)}</p>
                {i.photos.length > 0 ? (
                  <div className="row gap-2 wrap" aria-label={t(K.detail.photos)}>
                    {i.photos.map((p) =>
                      p.previewUrl ? (
                        <img key={p.id} src={p.previewUrl} alt={t(K.detail.photoAlt, { name: p.fileName })} style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                      ) : (
                        <Badge key={p.id} tone="neutral">
                          {p.fileName}
                        </Badge>
                      ),
                    )}
                  </div>
                ) : (
                  <span className="t-xs t-muted">{t(K.detail.noPhotos)}</span>
                )}
              </div>
            </Card>
          ))}
        </section>

        <WhatHappened r={r} s={s} t={t} report={report} />
        <Judgement r={r} s={s} t={t} lang={lang} report={report} />
        {s.isAdmin && <SupplierSection r={r} s={s} t={t} lang={lang} report={report} />}
        {s.isAdmin && <ResolutionTracker r={r} s={s} t={t} lang={lang} report={report} />}
        <ImpactCard r={r} s={s} t={t} lang={lang} report={report} />
        <Timeline r={r} t={t} lang={lang} />
      </div>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="row between gap-2" style={{ alignItems: 'baseline' }}>
      <dt className="t-muted">{label}</dt>
      <dd style={{ textAlign: 'end', margin: 0 }}>{value}</dd>
    </div>
  );
}

/* --------------------------------------------- what happened (technician) */

function WhatHappened({ r, s, t, report }: { r: DiscrepancyReportView; s: DamagedPartsState; t: T; report: Report }) {
  const d = s.happenedOf(r);
  const editable = r.canEditDetails;
  const cannotSave = d.causes.length === 0 && d.note.trim() === '';
  return (
    <Card>
      <div className="stack gap-3">
        <div className="stack">
          <h2 className="t-md t-semibold">{t(K.happened.heading)}</h2>
          <p className="t-xs t-muted">{t(editable ? K.happened.hint : K.happened.readOnly)}</p>
        </div>
        {editable ? (
          <>
            <fieldset className="stack gap-1" style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="t-sm t-semibold mb-1">{t(K.happened.causes)}</legend>
              {CAUSES.map((c) => (
                <Checkbox
                  key={c}
                  label={
                    <span className="stack">
                      <span className="t-sm">{t(K.cause[c])}</span>
                      <span className="t-xs t-muted">{t(K.causeHint[c])}</span>
                    </span>
                  }
                  checked={d.causes.includes(c)}
                  onChange={(on) => s.patchHappened(r, { causes: on ? [...d.causes, c] : d.causes.filter((x) => x !== c) })}
                />
              ))}
            </fieldset>
            <Field label={t(K.happened.note)} hint={t(K.happened.noteHint)}>
{({ id }) => (
<TextArea id={id} rows={3} value={d.note} onChange={(e) => s.patchHappened(r, { note: e.target.value })} />
)}
</Field>
            <Checkbox label={<span className="stack"><span className="t-sm">{t(K.happened.rush)}</span><span className="t-xs t-muted">{t(K.happened.rushHint)}</span></span>} checked={d.rush} onChange={(on) => s.patchHappened(r, { rush: on })} />
            {d.rush && (
              <Field label={t(K.happened.neededBy)}>
{({ id }) => (
<Input id={id} type="date" value={d.neededBy} onChange={(e) => s.patchHappened(r, { neededBy: e.target.value })} />
)}
</Field>
            )}
            <Button
              disabled={s.busy || !s.happenedDirty(r) || cannotSave}
              onClick={async () => report(await s.saveHappened(r), r.rush || !d.rush ? K.toast.saved : K.toast.rush)}
            >
              {t(K.happened.save)}
            </Button>
          </>
        ) : (
          <div className="stack gap-2 t-sm">
            <div className="row gap-1 wrap">
              {r.possibleCauses.length > 0 ? r.possibleCauses.map((c) => <Badge key={c}>{t(K.cause[c])}</Badge>) : <span className="t-muted">{t(K.happened.noneGiven)}</span>}
            </div>
            {r.causeNote && <p>{r.causeNote}</p>}
            {r.rush && <Badge tone="error">{t(K.list.rush)}</Badge>}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------ Admin's judgement */

function Judgement({ r, s, t, lang, report }: { r: DiscrepancyReportView; s: DamagedPartsState; t: T; lang: string; report: Report }) {
  const d = s.judgeOf(r);
  const changing = s.changingJudgement === r.id;
  const decided = !!r.attribution && !changing;
  return (
    <Card>
      <div className="stack gap-3">
        <div className="stack">
          <h2 className="t-md t-semibold">{t(K.judge.heading)}</h2>
          <p className="t-xs t-muted">{t(K.judge.hint)}</p>
        </div>
        {r.possibleCauses.length === 1 && !r.attribution && <p className="t-sm">{t(K.judge.suspected, { cause: t(K.cause[r.possibleCauses[0]]) })}</p>}
        {r.needsJudgement && r.possibleCauses.length > 1 && !r.attribution && (
          <div className="row gap-2" role="note" style={{ alignItems: 'flex-start' }}>
            <Warning size={18} aria-hidden="true" />
            <div className="stack">
              <strong className="t-sm">{t(K.judge.banner)}</strong>
              <span className="t-xs t-muted">{t(K.judge.bannerBody)}</span>
            </div>
          </div>
        )}
        {decided ? (
          <div className="stack gap-2">
            <div className="row gap-2 wrap">
              <Badge tone={r.attribution === 'supplier' ? 'error' : 'neutral'}>{t(K.cause[r.attribution!])}</Badge>
              <span className="t-xs t-muted">{t(K.judge.decided, { name: r.attributedByName ?? '', when: r.attributedAt ? formatDate(r.attributedAt, lang) : '' })}</span>
            </div>
            <p className="t-sm">{r.attributionNote}</p>
            <p className="t-xs t-muted">{t(r.attribution === 'supplier' ? K.judge.supplierCounts : K.judge.notCounted)}</p>
            {s.isAdmin && r.status === 'open' && (
              <Button size="sm" variant="secondary" onClick={() => s.setChangingJudgement(r.id)}>
                {t(K.judge.change)}
              </Button>
            )}
          </div>
        ) : s.isAdmin && r.status === 'open' ? (
          !r.checklistCompleted ? (
            <p className="t-sm t-muted">{t(K.judge.needsSigned)}</p>
          ) : (
            <div className="stack gap-2">
              <Field label={t(K.judge.pick)} required>
{({ id }) => (
<Select id={id} value={d.attribution} onChange={(e) => s.patchJudge(r, { attribution: e.target.value as typeof d.attribution })}>
                  <option value="">{t(K.judge.pick)}</option>
                  {CAUSES.map((c) => (
                    <option key={c} value={c}>
                      {t(K.cause[c])}
                    </option>
                  ))}
                </Select>
)}
</Field>
              <Field label={t(K.judge.note)} hint={t(K.judge.noteHint)} required>
{({ id }) => (
<TextArea id={id} rows={3} value={d.note} onChange={(e) => s.patchJudge(r, { note: e.target.value })} />
)}
</Field>
              <div className="row gap-2 wrap">
                <Button disabled={s.busy || !d.attribution || d.note.trim().length < 4} onClick={async () => report(await s.saveJudgement(r), K.toast.judged)}>
                  {t(K.judge.save)}
                </Button>
                {changing && (
                  <Button variant="secondary" onClick={() => s.setChangingJudgement(null)}>
                    {t('action.cancel')}
                  </Button>
                )}
              </div>
            </div>
          )
        ) : (
          <p className="t-sm t-muted">{t(K.judge.waitingForAdmin)}</p>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------- the supplier */

function SupplierSection({ r, s, t, lang, report }: { r: DiscrepancyReportView; s: DamagedPartsState; t: T; lang: string; report: Report }) {
  const navigate = useNavigate();
  const channel = r.supplierHasLogin ? 'in_app' : 'phone';
  return (
    <Card>
      <div className="stack gap-2">
        <h2 className="t-md t-semibold">{t(K.supplierSection.heading)}</h2>
        <p className="t-sm">
          {r.routedToSupplierAt ? t(K.supplierSection.sentAt, { supplier: r.supplierName, when: formatDateTime(r.routedToSupplierAt, lang) }) : t(K.supplierSection.notSent, { supplier: r.supplierName })}
        </p>
        {!r.supplierHasLogin && <p className="t-xs t-muted">{t(K.supplierSection.noLogin)}</p>}
        {r.status === 'open' && (
          <div className="row gap-2 wrap">
            {r.supplierHasLogin ? (
              <Button size="sm" variant={r.routedToSupplierAt ? 'secondary' : 'primary'} disabled={s.busy} onClick={async () => report(await s.sendToSupplier(r, 'in_app'), K.toast.sent)}>
                {t(K.supplierSection.sendInApp)}
              </Button>
            ) : null}
            <LogCall r={r} s={s} t={t} report={report} defaultChannel={channel === 'phone' ? 'phone' : 'email'} />
            {r.threadId && (
              <Button size="sm" variant="secondary" onClick={() => navigate(`/supplier-messages?thread=${r.threadId}`)}>
                {t(K.supplierSection.open)}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function LogCall({ r, s, t, report, defaultChannel }: { r: DiscrepancyReportView; s: DamagedPartsState; t: T; report: Report; defaultChannel: 'phone' | 'email' }) {
  // A call or email just made is logged, not sent: the same evidence goes into the thread as a record.
  return (
    <div className="row gap-1 wrap" style={{ alignItems: 'center' }}>
      <Select aria-label={t(K.supplierSection.channel)} defaultValue={defaultChannel} id={`ch-${r.id}`}>
        {CONTACT_CHANNELS.map((c) => (
          <option key={c} value={c}>
            {t(K.supplierSection.channelName[c])}
          </option>
        ))}
      </Select>
      <Button
        size="sm"
        variant="secondary"
        disabled={s.busy}
        onClick={async () => {
          const el = document.getElementById(`ch-${r.id}`) as HTMLSelectElement | null;
          report(await s.sendToSupplier(r, (el?.value as (typeof CONTACT_CHANNELS)[number]) ?? defaultChannel), K.toast.logged);
        }}
      >
        {t(K.supplierSection.logCall)}
      </Button>
    </div>
  );
}

/* --------------------------------------------------------- resolution road */

function ResolutionTracker({ r, s, t, lang, report }: { r: DiscrepancyReportView; s: DamagedPartsState; t: T; lang: string; report: Report }) {
  const d = s.trackOf(r);
  const idx = (['reported', 'replacement_requested', 'replacement_shipped'] as ReportResolution[]).indexOf(r.resolution);
  const closed = r.status === 'resolved';
  const steps: AscensionStep[] = [
    { id: 'reported', label: t(K.resolution.reported), status: 'complete' },
    { id: 'replacement_requested', label: t(K.resolution.replacement_requested), meta: r.replacementEta ? t(K.track.replacementBy, { date: formatDate(r.replacementEta, lang) }) : undefined, status: closed || idx >= 1 ? 'complete' : idx === 0 ? 'current' : 'upcoming' },
    { id: 'replacement_shipped', label: t(K.resolution.replacement_shipped), status: closed || idx >= 2 ? 'complete' : idx === 1 ? 'current' : 'upcoming' },
    {
      id: 'end',
      label: closed ? t(K.resolution[r.resolution]) : t(K.track.endHeading),
      meta: r.resolution === 'credited' && r.creditAmount ? t(K.track.creditedAmount, { amount: formatINR(r.creditAmount) }) : undefined,
      status: closed ? 'complete' : idx === 2 ? 'current' : 'upcoming',
    },
  ];
  const next: ReportResolution[] =
    r.resolution === 'reported' ? ['replacement_requested', 'credited'] : r.resolution === 'replacement_requested' ? ['replacement_shipped', 'resolved', 'credited'] : ['resolved', 'credited'];
  const needsEta = (x: ReportResolution) => x === 'replacement_requested' || x === 'replacement_shipped';
  return (
    <Card>
      <div className="stack gap-3">
        <div className="stack">
          <h2 className="t-md t-semibold">{t(K.track.heading)}</h2>
          <p className="t-xs t-muted">{t(K.track.hint)}</p>
        </div>
        <AscensionLine steps={steps} />
        {closed || !r.checklistCompleted ? (
          <p className="t-sm t-muted">{t(closed ? K.track.closed : K.judge.needsSigned)}</p>
        ) : (
          <div className="stack gap-2">
            <Field label={t(K.track.eta)} hint={t(K.track.etaHint)}>
{({ id }) => (
<Input id={id} type="date" value={d.eta} onChange={(e) => s.patchTrack(r, { eta: e.target.value })} />
)}
</Field>
            <Field label={t(K.track.credit)} hint={t(K.track.creditHint, { max: formatINR(r.affectedValue) })}>
{({ id }) => (
<Input id={id} type="number" inputMode="decimal" min={0} value={d.credit} onChange={(e) => s.patchTrack(r, { credit: e.target.value })} />
)}
</Field>
            <Field label={t(K.track.note)}>
{({ id }) => (
<Input id={id} value={d.note} onChange={(e) => s.patchTrack(r, { note: e.target.value })} />
)}
</Field>
            <p className="t-xs t-muted">{t(K.track.next)}</p>
            <div className="row gap-2 wrap">
              {next.map((x) => (
                <Button
                  key={x}
                  size="sm"
                  variant={x === next[0] ? 'primary' : 'secondary'}
                  disabled={s.busy || (needsEta(x) && !d.eta && !r.replacementEta) || (x === 'credited' && !(Number(d.credit) > 0))}
                  onClick={async () => report(await s.advance(r, x), K.toast.moved, { status: t(K.resolution[x]) })}
                >
                  {t(K.track.action[x as keyof typeof K.track.action])}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------ the installation */

function ImpactCard({ r, s, t, lang, report }: { r: DiscrepancyReportView; s: DamagedPartsState; t: T; lang: string; report: Report }) {
  if (r.status !== 'open' && !r.customerNotifiedAt) return null;
  const level = r.impact.level;
  return (
    <Card>
      <div className="stack gap-2">
        <div className="row between gap-2 wrap">
          <h2 className="t-md t-semibold">{t(K.impactSection.heading)}</h2>
          <Badge tone={IMPACT_TONE[level]}>{t(K.impact[level])}</Badge>
        </div>
        <p className="t-sm">{t(K.impactBody[level])}</p>
        {r.impact.installStart && (
          <span className="t-xs t-muted">
            <Clock size={12} aria-hidden="true" /> {t(K.impactSection.installStarts, { date: formatDate(r.impact.installStart, lang), code: r.impact.installCode ?? '' })}
            {r.replacementEta ? ` · ${t(K.impactSection.replacementBy, { date: formatDate(r.replacementEta, lang) })}` : ''}
          </span>
        )}
        {s.isAdmin && r.status === 'open' && (
          <>
            {r.customerNotifiedAt ? (
              <Badge tone="success">{t(K.impactSection.told, { when: formatDateTime(r.customerNotifiedAt, lang) })}</Badge>
            ) : (
              <div className="stack gap-2">
                <p className="t-xs t-muted">{r.replacementEta ? t(K.impactSection.preview) : t(K.impactSection.needEta)}</p>
                {r.replacementEta && (
                  <blockquote className="t-sm" style={{ margin: 0, paddingInlineStart: 'var(--space-3)', borderInlineStart: '3px solid var(--color-border-strong)' }}>
                    {r.customerPreview}
                  </blockquote>
                )}
                {r.customerOptedOut && <span className="t-xs t-muted">{t(K.impactSection.optedOut)}</span>}
                <Button size="sm" disabled={s.busy || !r.replacementEta} onClick={async () => report(await s.tellCustomer(r), K.toast.customerTold)}>
                  <Truck size={14} aria-hidden="true" /> {t(K.impactSection.send)}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------ the record */

function Timeline({ r, t, lang }: { r: DiscrepancyReportView; t: T; lang: string }) {
  const steps: AscensionStep[] = [...r.events]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .map((e) => {
      const isResolution = e.kind === 'resolution';
      const [key, ...rest] = (e.note ?? '').split(': ');
      const label = isResolution && key in K.resolution ? t(K.resolution[key as ReportResolution]) : t(K.timeline[e.kind]);
      const note = isResolution ? rest.join(': ') : (e.note ?? '');
      return { id: e.id, label, meta: `${t(K.timeline.by, { name: e.byName })} · ${formatDateTime(e.at, lang)}${note ? ` · ${note}` : ''}`, status: 'complete' as const };
    });
  return (
    <section className="stack gap-2" aria-labelledby="timeline-h">
      <h2 id="timeline-h" className="t-md t-semibold">
        {t(K.timeline.heading)}
      </h2>
      <AscensionLine steps={steps} className="ds-ascension--multiline" />
    </section>
  );
}
