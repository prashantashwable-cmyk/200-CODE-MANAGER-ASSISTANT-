import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, Camera, CheckCircle, FileText, Phone, Siren, WarningCircle } from '@phosphor-icons/react';
import { ActionBar, AscensionLine, Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, TextArea, formatDate, useToast } from '@/design-system';
import type { AscensionStep } from '@/design-system';
import type { TicketLift, TicketRow, TicketTechnician, TicketView } from '@/data/repository';
import type { TicketCategory, TicketEvent, TicketResponsibility, TicketUrgency, VisitOutcome } from '@/data/types';
import { CATEGORIES, CLAIM_NOTE_MIN, IMPACTS, MAX_ATTACHMENTS, MAX_DESCRIPTION, MIN_NOTE, OUTCOMES, RESPONSIBILITIES, STAGES, WINDOWS, filingProblem, lettersOf, minLettersFor, responseTargetOf, stageIndexOf, triageOf } from '@/features/service/tickets';
import { TICKET_KEYS as K, FORM_CATEGORIES, durationOf } from './service-tickets.types';
import { useServiceTickets } from './useServiceTickets';
import type { Attachment, ServiceTicketsState } from './useServiceTickets';

type T = ReturnType<typeof useTranslation>['t'];
const toneOfStatus = (s: string) => (s === 'resolved' ? 'success' : s === 'withdrawn' ? 'neutral' : s === 'in_progress' || s === 'assigned' ? 'accent' : 'neutral');
const urgencyTone = (u: string) => (u === 'emergency' ? 'error' : u === 'high' ? 'warning' : 'neutral');
const durationText = (t: T, ms: number) => { const d = durationOf(ms); return t(`serviceTickets.time.${d.unit}`, { count: d.count }); };
const telOf = (p: string | null) => (p ? `tel:${p.replace(/[^\d+]/g, '')}` : undefined);
const windowWord = (t: T, w: string) => t(`serviceTickets.detail.visit.window.${w}`);

/** Screen 175 — Service requests. One ticket record read three ways: the customer asks and follows it; Admin triages, books a visit and decides a warranty claim from the installation's own record; the technician does the visit. */
export function ServiceTicketsScreen() {
  const { t } = useTranslation();
  const s = useServiceTickets();
  const head = (sub: string, extra?: ReactNode) => (
    <ScreenHeader title={t(K.title)} subtitle={sub} action={<span className="row gap-2">{extra}<Button size="sm" variant="ghost" data-refresh onClick={() => void s.refresh()}><ArrowsClockwise size={14} aria-hidden="true" /> {t(K.refresh)}</Button></span>} />
  );
  if (s.ticketId) return <TicketScreen s={s} t={t} head={head} />;
  if (s.role === 'customer') return <CustomerDesk s={s} t={t} head={head} />;
  if (s.role === 'admin') return <AdminBoard s={s} t={t} head={head} />;
  return <TechVisits s={s} t={t} head={head} />;
}
type Head = (sub: string, extra?: ReactNode) => ReactNode;
interface P { s: ServiceTicketsState; t: T; head: Head }

function Choice({ selected, onClick, title, body, tag }: { selected: boolean; onClick: () => void; title: string; body?: string; tag?: string }) {
  return (
    <button type="button" role="radio" aria-checked={selected} data-choice={tag} className={`ds-card ${selected ? 'ds-card--selected' : ''}`.trim()} style={{ display: 'block', textAlign: 'left', width: '100%', minHeight: 'var(--tap-target)', cursor: 'pointer', font: 'inherit', color: 'inherit' }} onClick={onClick}>
      <span className="stack gap-1"><span className="t-sm t-semibold">{title}</span>{body && <span className="t-xs t-muted">{body}</span>}</span>
    </button>
  );
}
const problemText = (t: T, code: string) => t(`serviceTickets.problem.${code}`, { defaultValue: t(K.problem.generic) });
function Problem({ code, t }: { code: string | null; t: T }) {
  return code ? <p className="t-sm" role="alert" data-problem={code} style={{ color: 'var(--color-error)' }}>{problemText(t, code)}</p> : null;
}

/* ------------------------------------------------------------------ the customer's desk */

function CustomerDesk({ s, t, head }: P) {
  const { i18n } = useTranslation();
  const d = s.desk;
  if (s.load === 'loading' && !d) return <Screen width="narrow">{head(t(K.subtitle.customer))}<LoadingState label={t(K.loading)} variant="list" rows={3} /></Screen>;
  if (s.load === 'error' && !d) return <Screen width="narrow">{head(t(K.subtitle.customer))}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /></Screen>;
  if (!d) return null;
  const open = d.tickets.filter((x) => x.status === 'submitted' || x.status === 'assigned' || x.status === 'in_progress');
  const tab = s.tab || (open.length > 0 ? 'mine' : 'new');
  return (
    <Screen width="narrow">
      {head(t(K.subtitle.customer))}
      {s.offline && <p className="t-xs t-muted mb-2" data-offline>{t(K.offline)}</p>}
      {s.queued > 0 && <p className="t-sm mb-2" data-queued>{t(K.form.queued)}</p>}
      <EmergencyCard s={s} t={t} d={d} />
      <div className="mb-3" style={{ display: 'flex', gap: 8 }} role="tablist" aria-label={t(K.title)}>
        <Chip pressed={tab === 'new'} onClick={() => s.setTab('new')}>{t(K.tab.new)}</Chip>
        <Chip pressed={tab === 'mine'} onClick={() => s.setTab('mine')}>{t(K.tab.mine)}{d.tickets.length ? ` · ${d.tickets.length}` : ''}</Chip>
      </div>
      {tab === 'mine' ? (
        d.tickets.length === 0
          ? <EmptyState title={t(K.mine.empty.title)} body={t(K.mine.empty.body)} actionLabel={t(K.mine.new)} onAction={() => s.setTab('new')} />
          : <div className="stack gap-2" data-mine>{d.tickets.map((r) => <TicketCard key={r.id} r={r} s={s} t={t} lang={i18n.language} />)}</div>
      ) : <NewRequest s={s} t={t} d={d} />}
    </Screen>
  );
}

function EmergencyCard({ s, t, d }: { s: ServiceTicketsState; t: T; d: NonNullable<ServiceTicketsState['desk']> }) {
  const [sheet, setSheet] = useState(false);
  const handed = d.lifts.filter((l) => l.handedOver);
  const [lift, setLift] = useState(handed[0]?.key ?? '');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ code: string | null; queued: boolean } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const send = async () => {
    setBusy(true); setProblem(null);
    const r = await s.emergency(lift);
    setBusy(false);
    if (!r.ok) setProblem(r.problem); else setDone({ code: r.ticket?.ticket.code ?? null, queued: !!r.queued });
  };
  return (
    <Card>
      <div className="stack gap-2" data-emergency style={{ borderLeft: '4px solid var(--color-error)', paddingLeft: 12 }}>
        <h2 className="t-md t-semibold row gap-2" style={{ alignItems: 'center' }}><Siren size={20} aria-hidden="true" /> {t(K.emergency.title)}</h2>
        <p className="t-sm">{t(K.emergency.body)}</p>
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          {d.emergencyPhone && <a className="ds-btn ds-btn--primary" data-act="call-now" href={telOf(d.emergencyPhone)}><Phone size={16} aria-hidden="true" /> {t(K.emergency.call)} · {d.emergencyPhone}</a>}
          <Button variant="secondary" data-act="alert" onClick={() => { setDone(null); setProblem(null); setSheet(true); }}>{t(K.emergency.alert)}</Button>
        </div>
        <p className="t-xs t-muted">{t(K.emergency.note)}</p>
      </div>
      <Sheet open={sheet} onClose={() => setSheet(false)} title={t(K.emergency.sheet.title)} closeLabel={t(K.close)}>
        {done ? (
          <div className="stack gap-3" data-emergency-sent>
            <p className="t-md t-semibold row gap-2" style={{ alignItems: 'center' }}><CheckCircle size={20} aria-hidden="true" /> {done.queued ? t(K.emergency.queued) : t(K.emergency.sent.title)}</p>
            {!done.queued && done.code && <p className="t-sm">{t(K.emergency.sent.body, { code: done.code })}</p>}
            {d.emergencyPhone && <a className="ds-btn ds-btn--primary" href={telOf(d.emergencyPhone)}><Phone size={16} aria-hidden="true" /> {t(K.emergency.call)}</a>}
          </div>
        ) : handed.length === 0 ? (
          <div className="stack gap-3"><p className="t-sm">{t(K.emergency.noLift)}</p>{d.emergencyPhone && <a className="ds-btn ds-btn--primary" href={telOf(d.emergencyPhone)}><Phone size={16} aria-hidden="true" /> {t(K.emergency.call)}</a>}</div>
        ) : (
          <div className="stack gap-3">
            <p className="t-sm">{t(K.emergency.sheet.body)}</p>
            {handed.length > 1 && <Field label={t(K.emergency.sheet.lift)}>{(p) => <Select id={p.id} value={lift} onChange={(e) => setLift(e.target.value)}>{handed.map((l) => <option key={l.key} value={l.key}>{l.siteName} · {l.code}</option>)}</Select>}</Field>}
            {problem && <p className="t-sm" role="alert" data-problem="emergency" style={{ color: 'var(--color-error)' }}>{t(K.emergency.failed)}</p>}
            <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
              {d.emergencyPhone && <a className="ds-btn ds-btn--primary" href={telOf(d.emergencyPhone)}><Phone size={16} aria-hidden="true" /> {t(K.emergency.call)}</a>}
              <Button variant="secondary" data-act="send-alert" loading={busy} onClick={() => void send()}>{t(K.emergency.sheet.send)}</Button>
            </div>
          </div>
        )}
      </Sheet>
    </Card>
  );
}

function TicketCard({ r, s, t, lang }: { r: TicketRow; s: ServiceTicketsState; t: T; lang: string }) {
  return (
    <Card>
      <button type="button" data-ticket={r.id} className="stack gap-1" style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', color: 'inherit', cursor: 'pointer', width: '100%' }} onClick={() => s.open(r.id)}>
        <span className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="t-sm t-semibold">{r.code} · {r.summary || t(`serviceTickets.cat.${r.category}.title`)}</span>
          <Badge tone={toneOfStatus(r.status)}>{t(`serviceTickets.status.${r.status}`)}</Badge>
        </span>
        <span className="t-xs t-muted">{r.siteName} · {formatDate(r.createdAt, lang)}</span>
        <span className="row gap-1" style={{ flexWrap: 'wrap' }}>
          {r.unread && <Badge tone="accent" data-unread>{t(K.row.newReply)}</Badge>}
          {r.visit && r.visit.status !== 'missed' && <Badge tone="neutral">{t(K.row.visit, { date: formatDate(r.visit.date, lang) })}</Badge>}
          {r.late ? <Badge tone="warning">{t(K.row.late)}</Badge> : !r.firstResponseAt && (r.status === 'submitted') && <span className="t-xs t-muted">{t(K.row.replyBy, { date: formatDate(r.responseDueAt, lang) })}</span>}
        </span>
      </button>
    </Card>
  );
}

/* ------------------------------------------------------------------ the form */

function NewRequest({ s, t, d }: { s: ServiceTicketsState; t: T; d: NonNullable<ServiceTicketsState['desk']> }) {
  const toast = useToast();
  const { i18n } = useTranslation();
  const dr = s.draft;
  const fileRef = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const physical = dr.category === 'safety' || dr.category === 'fault';
  // A bill or a general question is about a project, not one lift: one choice per project.
  const lifts = physical ? d.lifts.filter((l) => l.handedOver) : d.lifts.filter((l, i, all) => all.findIndex((x) => x.dealId === l.dealId) === i);
  const lift: TicketLift | null = lifts.find((l) => l.key === dr.liftKey) ?? (lifts.length === 1 ? lifts[0] : null);
  useEffect(() => { if (lifts.length === 1 && dr.liftKey !== lifts[0].key) s.setDraft({ liftKey: lifts[0].key }); else if (dr.liftKey && !lifts.some((l) => l.key === dr.liftKey)) s.setDraft({ liftKey: '' }); }, [dr.category, lifts.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const effective = { ...dr, liftKey: lift?.key ?? '' };
  const fp = dr.category ? filingProblem({ category: dr.category, jobId: physical ? lift?.jobId ?? null : null, description: dr.description, impact: dr.impact, attachments: s.files.length }) : 'category_required';
  const letters = lettersOf(dr.description);
  const triage = dr.category ? triageOf({ category: dr.category, impact: dr.impact, text: dr.description, claim: dr.claim, coverage: lift?.coverage.state ?? 'unknown' }) : null;
  const target = triage ? responseTargetOf(triage.urgency, triage.route, lift?.coverage ?? null) : null;
  const hintWords = dr.category && dr.category !== 'safety' && triage?.words.length ? triage.words : [];
  const showLift = !!dr.category && (lifts.length > 1 || (lifts.length === 0 && physical));
  const needLift = dr.category === 'billing' || dr.category === 'general' ? lifts.length > 0 : true;
  const submit = async () => {
    setProblem(null);
    const r = await s.submit();
    if (!r.ok) setProblem(r.problem); else toast.push(t(K.form.sent.title), 'success');
  };
  const pick = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const failed = await s.addFiles(Array.from(list).slice(0, MAX_ATTACHMENTS));
    if (failed) toast.push(t(K.form.media.failed), 'error');
    if (fileRef.current) fileRef.current.value = '';
  };
  if (s.sent) {
    const sent = s.sent.ticket;
    return (
      <Card>
        <div className="stack gap-2" data-sent>
          <h2 className="t-md t-semibold row gap-2" style={{ alignItems: 'center' }}><CheckCircle size={20} aria-hidden="true" /> {t(K.form.sent.title)}</h2>
          <p className="t-sm">{t(K.form.sent.body, { code: sent.code, time: durationText(t, Date.parse(sent.responseDueAt) - Date.parse(sent.createdAt)) })}</p>
          <div className="row gap-2"><Button data-act="open-sent" onClick={() => { s.clearSent(); s.open(sent.id); }}>{t(K.form.sent.open)}</Button><Button variant="ghost" onClick={() => s.clearSent()}>{t(K.mine.new)}</Button></div>
        </div>
      </Card>
    );
  }
  return (
    <div className="stack gap-3" data-form>
      <Card>
        <div className="stack gap-2">
          <h2 className="t-md t-semibold">{t(K.form.section.about)}</h2>
          <div className="stack gap-2" role="radiogroup" aria-label={t(K.form.section.about)}>
            {FORM_CATEGORIES.map((c) => <Choice key={c} tag={c} selected={dr.category === c} onClick={() => s.setDraft({ category: c as TicketCategory })} title={t(`serviceTickets.cat.${c}.title`)} body={t(`serviceTickets.cat.${c}.body`)} />)}
          </div>
        </div>
      </Card>
      {dr.category && (
        <Card>
          <div className="stack gap-3">
            {showLift && (
              <div className="stack gap-2" data-section="where">
                <h2 className="t-md t-semibold">{t(K.form.section.where)}</h2>
                {lifts.length === 0 ? <p className="t-sm t-muted" data-no-lift>{t(K.form.lift.none)}</p> : (
                  <Field label={t(K.form.lift.label)}>{(p) => <Select id={p.id} value={effective.liftKey} data-f="lift" onChange={(e) => s.setDraft({ liftKey: e.target.value })}><option value="">—</option>{lifts.map((l) => <option key={l.key} value={l.key}>{l.siteName} · {l.code}{l.handedOver ? '' : ` (${t(K.form.lift.inProgress)})`}</option>)}</Select>}</Field>
                )}
              </div>
            )}
            {lift && physical && <p className="t-xs t-muted" data-coverage={lift.coverage.state}>{t(`serviceTickets.coverage.${lift.coverage.state}`, { date: formatDate(lift.coverage.state === 'on_amc' ? lift.coverage.amcEndsOn ?? '' : lift.coverage.warrantyEndsOn ?? '', i18n.language) })}</p>}
            {dr.category === 'fault' && (
              <div className="stack gap-2" data-section="impact">
                <h2 className="t-md t-semibold">{t(K.form.section.impact)}</h2>
                <div className="stack gap-2" role="radiogroup" aria-label={t(K.form.section.impact)}>{IMPACTS.map((i) => <Choice key={i} tag={i} selected={dr.impact === i} onClick={() => s.setDraft({ impact: i })} title={t(`serviceTickets.impact.${i}`)} />)}</div>
              </div>
            )}
            <div className="stack gap-2" data-section="details">
              <h2 className="t-md t-semibold">{t(K.form.section.details)}</h2>
              <Field label={t(K.form.description.label)} hint={t(K.form.description.hint)}>
                {(p) => <TextArea id={p.id} rows={5} maxLength={MAX_DESCRIPTION} value={dr.description} data-f="description" onChange={(e) => s.setDraft({ description: e.target.value })} />}
              </Field>
              <p className="t-xs t-muted" data-count>{letters >= minLettersFor(dr.category) ? <span><CheckCircle size={12} aria-hidden="true" /> {t(K.form.description.ok)}</span> : dr.description.length > 0 ? t(K.form.description.short, { min: minLettersFor(dr.category) }) : ''}</p>
              {hintWords.length > 0 && (
                <div className="stack gap-2" data-safety-hint role="alert" style={{ borderLeft: '4px solid var(--color-warning)', paddingLeft: 12 }}>
                  <p className="t-sm t-semibold row gap-2" style={{ alignItems: 'center' }}><WarningCircle size={18} aria-hidden="true" /> {t(K.form.safetyHint.title)}</p>
                  <p className="t-sm">{t(K.form.safetyHint.body)}</p>
                  <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                    {d.emergencyPhone && <a className="ds-btn ds-btn--primary ds-btn--sm" href={telOf(d.emergencyPhone)}><Phone size={14} aria-hidden="true" /> {t(K.emergency.call)}</a>}
                    <Button size="sm" variant="secondary" data-act="treat-safety" onClick={() => s.setDraft({ category: 'safety' })}>{t(K.form.safetyHint.treat)}</Button>
                  </div>
                </div>
              )}
            </div>
            <div className="stack gap-2" data-section="media">
              <h2 className="t-md t-semibold">{t(K.form.section.media)}</h2>
              <p className="t-xs t-muted">{t(K.form.media.hint, { max: MAX_ATTACHMENTS })}</p>
              <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                {s.files.map((f, i) => (
                  <span key={i} className="stack gap-1" data-file style={{ width: 88 }}>
                    <img src={f.previewUrl} alt={f.fileName} style={{ width: 88, height: 66, objectFit: 'cover', borderRadius: 'var(--radius-sm, 8px)' }} />
                    <span className="t-xs t-muted">{f.kind === 'video' ? t(K.form.media.video, { seconds: Math.round(f.durationS ?? 0) }) : ''}</span>
                    <Button size="sm" variant="ghost" onClick={() => s.removeFile(i)}>{t(K.form.media.remove)}</Button>
                  </span>
                ))}
              </div>
              {s.files.length < MAX_ATTACHMENTS && <div><input ref={fileRef} type="file" accept="image/*,video/*" multiple hidden data-f="files" onChange={(e) => void pick(e.target.files)} /><Button size="sm" variant="secondary" data-act="attach" onClick={() => fileRef.current?.click()}><Camera size={16} aria-hidden="true" /> {t(K.form.media.add)}</Button></div>}
              {s.files.some((f) => f.kind === 'video') && <p className="t-xs t-muted">{t(K.form.media.videoNote)}</p>}
            </div>
            {physical && (
              <div className="stack gap-1" data-section="claim">
                <h2 className="t-md t-semibold">{t(K.form.section.claim)}</h2>
                <Checkbox checked={dr.claim} onChange={(v) => s.setDraft({ claim: v })} label={t(K.form.claim.label)} />
                <p className="t-xs t-muted">{t(K.form.claim.hint)}</p>
              </div>
            )}
          </div>
        </Card>
      )}
      {dr.category && triage && target !== null && (
        <Card>
          <div className="stack gap-1" data-estimate={triage.route}>
            <h2 className="t-md t-semibold">{t(K.estimate.title)}</h2>
            <p className="t-sm">{t(K.estimate.reply, { time: durationText(t, target) })}</p>
            {lift?.coverage.responseHours && triage.urgency !== 'low' && triage.route !== 'accounts' && <p className="t-xs t-muted">{t(K.estimate.amc, { time: durationText(t, lift.coverage.responseHours * 3_600_000) })}</p>}
            <p className="t-sm t-muted">{t(`serviceTickets.estimate.route.${triage.route}`)}</p>
            {triage.confidence === 'needs_human' && <p className="t-xs t-muted">{t(K.estimate.human)}</p>}
          </div>
        </Card>
      )}
      <p className="t-xs t-muted">{t(K.form.draftKept)}</p>
      <Problem code={problem} t={t} />
      <ActionBar>
        <Button className="grow" block data-act="submit" disabled={!!fp || (!!dr.category && !lift && needLift)} loading={s.sending} onClick={() => void submit()}>{s.sending ? t(K.form.sending) : t(K.form.submit)}</Button>
      </ActionBar>
    </div>
  );
}

/* ------------------------------------------------------------------ one ticket */

function TicketScreen({ s, t, head }: P) {
  const { i18n } = useTranslation();
  const v = s.ticket;
  const back = <Button size="sm" variant="ghost" data-back onClick={() => s.list()}>{t(K.back)}</Button>;
  if (s.ticketState === 'loading' && !v) return <Screen width="narrow">{head('', back)}<LoadingState label={t(K.loading)} variant="list" rows={3} /></Screen>;
  if (s.ticketState === 'missing' || !v) return <Screen width="narrow">{head('', back)}{s.ticketState === 'error' ? <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /> : <EmptyState title={t(K.notFound)} body="" actionLabel={t(K.back)} onAction={() => s.list()} />}</Screen>;
  const tk = v.ticket;
  const lang = i18n.language;
  return (
    <Screen width={v.role === 'admin' ? 'default' : 'narrow'}>
      {head(`${tk.code} · ${tk.siteName}`, back)}
      <div className={v.role === 'admin' ? 'main-aside' : 'stack gap-3'}>
        <div className="stack gap-3" data-main>
          <Summary v={v} s={s} t={t} lang={lang} />
          {v.role === 'customer' && <CustomerTicket v={v} s={s} t={t} lang={lang} />}
          {v.role === 'technician' && <TechTicket v={v} s={s} t={t} lang={lang} />}
          {v.role === 'admin' && <AdminMain v={v} s={s} t={t} lang={lang} />}
          <Timeline v={v} t={t} lang={lang} />
        </div>
        {v.role === 'admin' && <div className="stack gap-3" data-aside><AdminAside v={v} s={s} t={t} lang={lang} /></div>}
      </div>
    </Screen>
  );
}

function Summary({ v, t, lang }: { v: TicketView; s: ServiceTicketsState; t: T; lang: string }) {
  const tk = v.ticket;
  const idx = stageIndexOf(tk.status);
  const steps: AscensionStep[] = STAGES.map((st, i) => ({ id: st, label: t(`serviceTickets.status.${st}`), status: tk.status === 'withdrawn' ? 'upcoming' : i < idx || (st === 'resolved' && tk.status === 'resolved') ? 'complete' : i === idx ? 'current' : 'upcoming' }));
  const customerSide = v.role === 'customer';
  return (
    <Card>
      <div className="stack gap-2" data-summary>
        <span className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <Badge tone={toneOfStatus(tk.status)}>{t(`serviceTickets.status.${tk.status}`)}</Badge>
          <Badge tone={urgencyTone(tk.urgency)}>{t(`serviceTickets.urgency.${tk.urgency}`)}</Badge>
          <Badge tone="neutral">{t(`serviceTickets.cat.${tk.category}.title`)}</Badge>
        </span>
        {tk.description ? <p className="t-sm" style={{ overflowWrap: 'anywhere' }}>{tk.description}</p> : null}
        {tk.status !== 'withdrawn' && <AscensionLine steps={steps} />}
        {tk.category === 'emergency' && customerSide && <p className="t-sm t-semibold" data-emergency-note>{t(K.detail.emergency)}</p>}
        {tk.status === 'submitted' && !tk.firstResponseAt && (tk.late
          ? <p className="t-sm" data-late>{customerSide ? t(K.detail.reply.late) : t(K.row.late)}</p>
          : <p className="t-sm t-muted" data-reply-by>{t(K.detail.reply.by, { date: formatDate(tk.responseDueAt, lang) })}</p>)}
        {tk.firstResponseAt && customerSide && <p className="t-xs t-muted">{t(K.detail.reply.done, { date: formatDate(tk.firstResponseAt, lang) })}</p>}
        {tk.attachments.length > 0 && (
          <div className="stack gap-1" data-attachments>
            <span className="t-xs t-muted">{t(K.detail.attachments)}</span>
            <div className="row gap-2" style={{ flexWrap: 'wrap' }}>{tk.attachments.map((a) => <img key={a.id} src={a.previewUrl} alt={a.fileName} style={{ width: 96, height: 72, objectFit: 'cover', borderRadius: 'var(--radius-sm, 8px)' }} />)}</div>
          </div>
        )}
        {customerSide && tk.jobId && <p className="t-xs t-muted" data-coverage={tk.coverage.state}>{t(`serviceTickets.coverage.${tk.coverage.state}`, { date: formatDate(tk.coverage.state === 'on_amc' ? tk.coverage.amcEndsOn ?? '' : tk.coverage.warrantyEndsOn ?? '', lang) })}</p>}
      </div>
    </Card>
  );
}

function eventText(t: T, e: TicketEvent, lang: string): string {
  const p = e.params ?? {};
  if (e.kind === 'assigned' || e.kind === 'reassigned') return t(`serviceTickets.event.${e.kind}`, { name: p.name ?? '', date: p.date ? formatDate(p.date, lang) : '', window: windowWord(t, p.window ?? 'morning') });
  if (e.kind === 'visit_done') return t(K.event.visit_done, { outcome: t(`serviceTickets.outcome.${p.outcome ?? 'fixed'}`) });
  if (e.kind === 'claim_decided' && e.audience === 'customer') return p.chargeable === 'true' ? t(K.detail.claim.chargeable) : t(K.detail.claim.covered);
  if (e.kind === 'claim_decided') return `${t(K.event.claim_decided)}: ${t(`serviceTickets.resp.${p.responsibility ?? 'normal_wear'}`)}`;
  if (e.kind === 'resolved' && p.outcome) return `${t(K.event.resolved)}: ${t(`serviceTickets.outcome.${p.outcome}`)}`;
  return t(`serviceTickets.event.${e.kind}`, { defaultValue: e.kind });
}

function Timeline({ v, t, lang }: { v: TicketView; t: T; lang: string }) {
  const admin = v.role === 'admin';
  const events = [...v.events].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <Card>
      <div className="stack gap-2" data-timeline>
        <h2 className="t-md t-semibold">{admin ? t(K.adm.timeline) : t(K.detail.updates)}</h2>
        {events.map((e) => (
          <div key={e.id} className="stack gap-0" data-event={e.kind}>
            <span className="t-sm">{eventText(t, e, lang)}{e.audience === 'internal' && <span> <Badge tone="neutral">{t(K.adm.internalTag)}</Badge></span>}</span>
            {e.note && (e.kind === 'reply' || e.kind === 'info' || e.kind === 'internal_note' || e.kind === 'withdrawn' || e.kind === 'reopened' || (e.kind === 'resolved' && admin)) ? <span className="t-sm t-muted" style={{ overflowWrap: 'anywhere' }}>{e.note}</span> : null}
            <span className="t-xs t-muted">{e.byName} · {formatDate(e.at, lang)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ customer, on one ticket */

function CustomerTicket({ v, s, t, lang }: { v: TicketView; s: ServiceTicketsState; t: T; lang: string }) {
  const tk = v.ticket;
  const toast = useToast();
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [sheet, setSheet] = useState<'withdraw' | 'reopen' | null>(null);
  const [reason, setReason] = useState('');
  const open = tk.status === 'submitted' || tk.status === 'assigned' || tk.status === 'in_progress';
  const visit = tk.visit;
  const d = tk.claim.decided;
  const phone = s.desk?.supportPhone ?? null;
  const run = async (fn: () => Promise<{ ok: true } | { ok: false; problem: string }>, done: () => void) => { setProblem(null); const r = await fn(); if (!r.ok) setProblem(r.problem); else done(); };
  return (
    <>
      {visit && visit.status !== 'missed' && (
        <Card>
          <div className="stack gap-1" data-visit={visit.status}>
            <h2 className="t-md t-semibold">{t(K.detail.visit.title)}</h2>
            <p className="t-sm">{visit.status === 'done' ? t(K.detail.visit.done) : visit.status === 'in_progress' ? t(K.detail.visit.started, { name: visit.technicianName }) : t(K.detail.visit.body, { name: visit.technicianName, date: formatDate(visit.date, lang), window: windowWord(t, visit.window) })}</p>
          </div>
        </Card>
      )}
      {visit?.status === 'missed' && open && <Card><p className="t-sm" data-visit="missed">{t(K.detail.visit.missed)}</p></Card>}
      {(tk.claim.review || d) && (
        <Card>
          <div className="stack gap-1" data-claim>
            <h2 className="t-md t-semibold">{t(K.detail.claim.title)}</h2>
            {d ? <><p className="t-sm">{d.chargeable ? t(K.detail.claim.chargeable) : t(K.detail.claim.covered)}</p><p className="t-xs t-muted">{t(`serviceTickets.resp.${d.responsibility}`)}</p></> : <p className="t-sm">{t(K.detail.claim.pending)}</p>}
          </div>
        </Card>
      )}
      {open && (
        <Card>
          <div className="stack gap-2" data-add-info>
            <h2 className="t-md t-semibold">{t(K.detail.info.title)}</h2>
            <TextArea rows={3} value={note} placeholder={t(K.detail.info.placeholder)} aria-label={t(K.detail.info.title)} data-f="info" onChange={(e) => setNote(e.target.value)} />
            <Problem code={problem} t={t} />
            <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
              <Button size="sm" data-act="send-info" disabled={lettersOf(note) < 3} onClick={() => void run(() => s.addInfo(note, []), () => { setNote(''); toast.push(t(K.detail.info.send), 'success'); })}>{t(K.detail.info.send)}</Button>
              {tk.canWithdraw && <Button size="sm" variant="ghost" data-act="withdraw" onClick={() => { setProblem(null); setSheet('withdraw'); }}>{t(K.detail.withdraw.open)}</Button>}
              {phone && <a className="ds-btn ds-btn--ghost ds-btn--sm" href={telOf(phone)}><Phone size={14} aria-hidden="true" /> {t(K.detail.call)}</a>}
            </div>
          </div>
        </Card>
      )}
      {(tk.canReopen || (tk.status === 'resolved' && tk.visit?.status === 'done')) && <Card><div className="row gap-2" style={{ flexWrap: 'wrap' }}>{tk.canReopen && <Button variant="secondary" data-act="reopen" onClick={() => { setProblem(null); setSheet('reopen'); }}>{t(K.detail.reopen.open)}</Button>}{tk.status === 'resolved' && tk.visit?.status === 'done' && <Button variant="ghost" data-act="rate" onClick={() => s.goTo(`/feedback?request=visit:${tk.id}`)}>{t('feedback.link.open')}</Button>}</div></Card>}
      <Sheet open={sheet === 'withdraw'} onClose={() => setSheet(null)} title={t(K.detail.withdraw.title)} closeLabel={t(K.close)}>
        <div className="stack gap-3"><p className="t-sm">{t(K.detail.withdraw.body)}</p><Field label={t(K.detail.withdraw.reason)}>{(p) => <TextArea id={p.id} rows={3} value={reason} data-f="reason" onChange={(e) => setReason(e.target.value)} />}</Field><Problem code={problem} t={t} />
          <div className="row gap-2"><Button data-act="confirm-withdraw" disabled={lettersOf(reason) < 3} onClick={() => void run(() => s.withdraw(reason), () => { setSheet(null); setReason(''); })}>{t(K.detail.withdraw.confirm)}</Button><Button variant="ghost" onClick={() => setSheet(null)}>{t(K.detail.withdraw.keep)}</Button></div></div>
      </Sheet>
      <Sheet open={sheet === 'reopen'} onClose={() => setSheet(null)} title={t(K.detail.reopen.title)} closeLabel={t(K.close)}>
        <div className="stack gap-3"><p className="t-sm">{t(K.detail.reopen.body, { date: tk.reopenUntil ? formatDate(tk.reopenUntil, lang) : '' })}</p><TextArea rows={3} value={reason} aria-label={t(K.detail.reopen.title)} data-f="reopen-note" onChange={(e) => setReason(e.target.value)} /><Problem code={problem} t={t} />
          <Button data-act="confirm-reopen" disabled={lettersOf(reason) < 3} onClick={() => void run(() => s.reopen(reason), () => { setSheet(null); setReason(''); })}>{t(K.detail.reopen.confirm)}</Button></div>
      </Sheet>
    </>
  );
}

/* ------------------------------------------------------------------ the technician */

function TechVisits({ s, t, head }: P) {
  const { i18n } = useTranslation();
  const rows = s.visits;
  if (s.load === 'loading' && !rows) return <Screen width="narrow">{head(t(K.subtitle.technician))}<LoadingState label={t(K.loading)} variant="list" rows={3} /></Screen>;
  if (s.load === 'error' && !rows) return <Screen width="narrow">{head(t(K.subtitle.technician))}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /></Screen>;
  if (!rows || rows.length === 0) return <Screen width="narrow">{head(t(K.subtitle.technician))}<EmptyState title={t(K.tech.empty.title)} body={t(K.tech.empty.body)} /></Screen>;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const key = (d: string) => new Date(`${d}T00:00:00`).getTime();
  const done = rows.filter((r) => r.status === 'resolved' || r.visit?.status === 'done');
  const active = rows.filter((r) => !done.includes(r));
  const todays = active.filter((r) => r.visit && key(r.visit.date) <= today.getTime());
  const later = active.filter((r) => !todays.includes(r));
  const group = (title: string, list: TicketRow[], tag: string) => list.length === 0 ? null : (
    <div className="stack gap-2" data-group={tag}><h2 className="t-md t-semibold">{title}</h2>{list.map((r) => (
      <Card key={r.id}><button type="button" data-ticket={r.id} className="stack gap-1" style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', color: 'inherit', cursor: 'pointer', width: '100%' }} onClick={() => s.open(r.id)}>
        <span className="row gap-2" style={{ justifyContent: 'space-between' }}><span className="t-sm t-semibold">{r.code} · {r.siteName}</span><Badge tone={urgencyTone(r.urgency)}>{t(`serviceTickets.urgency.${r.urgency}`)}</Badge></span>
        <span className="t-sm" style={{ overflowWrap: 'anywhere' }}>{r.summary}</span>
        {r.visit && <span className="t-xs t-muted">{t(K.tech.row.when, { date: formatDate(r.visit.date, i18n.language), window: windowWord(t, r.visit.window) })} · {r.customerName}</span>}
      </button></Card>))}</div>
  );
  return <Screen width="narrow">{head(t(K.subtitle.technician))}<div className="stack gap-3">{group(t(K.tech.section.today), todays, 'today')}{group(t(K.tech.section.upcoming), later, 'upcoming')}{group(t(K.tech.section.done), done, 'done')}</div></Screen>;
}

function TechTicket({ v, s, t, lang }: { v: TicketView; s: ServiceTicketsState; t: T; lang: string }) {
  const tk = v.ticket;
  const toast = useToast();
  const [outcome, setOutcome] = useState<VisitOutcome | null>(null);
  const [notes, setNotes] = useState('');
  const [parts, setParts] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const visit = tk.visit;
  const flagged = tk.urgency === 'high' || tk.urgency === 'emergency' || !!v.ticket.triage?.words.length;
  const run = async (fn: () => Promise<{ ok: true } | { ok: false; problem: string }>, done?: () => void) => { setProblem(null); const r = await fn(); if (!r.ok) setProblem(r.problem); else done?.(); };
  const canWork = !!visit && (visit.status === 'planned' || visit.status === 'in_progress') && (tk.status === 'assigned' || tk.status === 'in_progress');
  return (
    <>
      {flagged && <Card><p className="t-sm t-semibold" data-safety style={{ borderLeft: '4px solid var(--color-warning)', paddingLeft: 12 }}>{t(K.tech.safety)}</p></Card>}
      <Card>
        <div className="stack gap-1" data-contact>
          <h2 className="t-md t-semibold">{t(K.tech.customer)}</h2>
          <p className="t-sm">{v.customerName}</p>
          <p className="t-sm t-muted">{tk.address}</p>
          {visit && <p className="t-sm">{t(K.tech.row.when, { date: formatDate(visit.date, lang), window: windowWord(t, visit.window) })}</p>}
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            {v.contactPhone && <a className="ds-btn ds-btn--secondary ds-btn--sm" href={telOf(v.contactPhone)}><Phone size={14} aria-hidden="true" /> {t(K.adm.call)}</a>}
            {v.location && <a className="ds-btn ds-btn--ghost ds-btn--sm" href={`https://www.google.com/maps/dir/?api=1&destination=${v.location.lat},${v.location.lng}`} target="_blank" rel="noreferrer">{t(K.adm.navigate)}</a>}
          </div>
        </div>
      </Card>
      {visit?.status === 'planned' && canWork && (
        <ActionBar>
          {!visit.onTheWayAt && visit.date === new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10) && <Button variant="secondary" data-act="on-the-way" onClick={() => void run(() => s.onTheWay(), () => toast.push(t(K.tech.onTheWayDone), 'success'))}>{t(K.tech.onTheWay)}</Button>}
          <Button className="grow" block data-act="start-visit" onClick={() => void run(() => s.startVisit())}>{t(K.tech.start)}</Button>
        </ActionBar>
      )}
      {canWork && visit?.status === 'in_progress' && (
        <Card>
          <div className="stack gap-3" data-complete>
            <h2 className="t-md t-semibold">{t(K.tech.complete)}</h2>
            <div className="stack gap-2" role="radiogroup" aria-label={t(K.tech.form.outcome)}>{OUTCOMES.map((o) => <Choice key={o} tag={o} selected={outcome === o} onClick={() => setOutcome(o)} title={t(`serviceTickets.outcome.${o}`)} body={o === 'unsafe_shut_down' ? t(K.tech.unsafe) : undefined} />)}</div>
            <Field label={t(K.tech.form.notes, { min: MIN_NOTE })}>{(p) => <TextArea id={p.id} rows={4} value={notes} data-f="notes" onChange={(e) => setNotes(e.target.value)} />}</Field>
            {outcome === 'needs_parts' && <Field label={t(K.tech.form.parts)}>{(p) => <TextArea id={p.id} rows={2} value={parts} data-f="parts" onChange={(e) => setParts(e.target.value)} />}</Field>}
            <Problem code={problem} t={t} />
            <Button data-act="finish-visit" disabled={!outcome || lettersOf(notes) < MIN_NOTE} onClick={() => void run(() => s.completeVisit(outcome as VisitOutcome, notes, parts), () => toast.push(t(K.tech.done), 'success'))}>{t(K.tech.form.save)}</Button>
          </div>
        </Card>
      )}
      {visit?.status === 'planned' && <Problem code={problem} t={t} />}
    </>
  );
}

/* ------------------------------------------------------------------ Admin */

function AdminBoard({ s, t, head }: P) {
  const { i18n } = useTranslation();
  const b = s.board;
  const filters = ['open', 'triage', 'safety', 'claims', 'late', 'resolved', 'all'] as const;
  return (
    <Screen width="default">
      {head(t(K.subtitle.admin))}
      <div className="stack gap-2 mb-3 sticky-under-shell" data-filters>
        <Input value={s.q} placeholder={t(K.board.search)} aria-label={t(K.board.search)} data-f="q" onChange={(e) => s.setQ(e.target.value)} />
        <div className="row gap-2" style={{ overflowX: 'auto', paddingBottom: 4 }}>
          {filters.map((f) => <span key={f} data-filter={f} style={{ flex: '0 0 auto' }}><Chip pressed={s.filter === f} onClick={() => s.setFilter(f)}>{t(`serviceTickets.board.filter.${f}`)}{b ? ` · ${b.counts[f]}` : ''}</Chip></span>)}
        </div>
      </div>
      <p className="t-xs t-muted mb-2">{t(K.notice.placeholders)}</p>
      {s.load === 'loading' && !b ? <LoadingState label={t(K.loading)} variant="list" rows={4} />
        : s.load === 'error' && !b ? <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} />
        : !b || b.rows.length === 0 ? <EmptyState title={t(K.board.empty.title)} body={t(K.board.empty.body)} />
        : <div className="grid-auto" data-board>{b.rows.map((r) => (
          <Card key={r.id}><button type="button" data-ticket={r.id} className="stack gap-1" style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', color: 'inherit', cursor: 'pointer', width: '100%' }} onClick={() => s.open(r.id)}>
            <span className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center' }}><span className="t-sm t-semibold">{r.code}</span><Badge tone={urgencyTone(r.urgency)}>{t(`serviceTickets.urgency.${r.urgency}`)}</Badge></span>
            <span className="t-sm" style={{ overflowWrap: 'anywhere' }}>{r.summary || t(`serviceTickets.cat.${r.category}.title`)}</span>
            <span className="t-xs t-muted">{r.customerName} · {r.siteName} · {formatDate(r.createdAt, i18n.language)}</span>
            <span className="row gap-1" style={{ flexWrap: 'wrap' }}>
              <Badge tone={toneOfStatus(r.status)}>{t(`serviceTickets.status.${r.status}`)}</Badge>
              <Badge tone="neutral">{t(`serviceTickets.route.${r.route}`)}</Badge>
              {r.needsTriage && <Badge tone="warning">{t(K.adm.triage.human)}</Badge>}
              {r.claimReview && <Badge tone="accent">{t(K.board.filter.claims)}</Badge>}
              {r.late && <Badge tone="warning">{t(K.row.late)}</Badge>}
            </span>
          </button></Card>))}</div>}
    </Screen>
  );
}

const urgencies: TicketUrgency[] = ['emergency', 'high', 'normal', 'low'];
function AdminMain({ v, s, t, lang }: { v: TicketView; s: ServiceTicketsState; t: T; lang: string }) {
  const tk = v.ticket;
  const toast = useToast();
  const open = tk.status === 'submitted' || tk.status === 'assigned' || tk.status === 'in_progress';
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState('');
  const [resolveNote, setResolveNote] = useState('');
  const [sheet, setSheet] = useState<'resolve' | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const run = async (fn: () => Promise<{ ok: true } | { ok: false; problem: string }>, done?: () => void) => { setProblem(null); const r = await fn(); if (!r.ok) setProblem(r.problem); else done?.(); };
  const tr = tk.triage;
  return (
    <>
      <Card>
        <div className="stack gap-1" data-customer>
          <h2 className="t-md t-semibold">{t(K.adm.customer)}</h2>
          <p className="t-sm">{v.customerName} · {tk.address}</p>
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            {v.contactPhone && <a className="ds-btn ds-btn--secondary ds-btn--sm" href={telOf(v.contactPhone)}><Phone size={14} aria-hidden="true" /> {v.contactPhone}</a>}
            {v.location && <a className="ds-btn ds-btn--ghost ds-btn--sm" href={`https://www.google.com/maps/dir/?api=1&destination=${v.location.lat},${v.location.lng}`} target="_blank" rel="noreferrer">{t(K.adm.navigate)}</a>}
          </div>
          {tk.jobId && <p className="t-xs t-muted" data-coverage={tk.coverage.state}>{t(`serviceTickets.coverage.${tk.coverage.state}`, { date: formatDate(tk.coverage.state === 'on_amc' ? tk.coverage.amcEndsOn ?? '' : tk.coverage.warrantyEndsOn ?? '', lang) })}</p>}
        </div>
      </Card>
      {tr && <TriageCard v={v} s={s} t={t} />}
      {open && <VisitCard v={v} s={s} t={t} lang={lang} />}
      {(tk.claim.raised || tk.claim.review) && <ClaimCard v={v} s={s} t={t} lang={lang} />}
      <Card>
        <div className="stack gap-2" data-reply>
          <h2 className="t-md t-semibold">{t(K.adm.reply.title)}</h2>
          <TextArea rows={3} value={reply} placeholder={t(K.adm.reply.placeholder)} aria-label={t(K.adm.reply.title)} data-f="reply" onChange={(e) => setReply(e.target.value)} />
          <Button size="sm" data-act="send-reply" disabled={lettersOf(reply) < 3 || tk.status === 'withdrawn'} onClick={() => void run(() => s.reply(reply, false), () => { setReply(''); toast.push(t(K.adm.reply.send), 'success'); })}>{t(K.adm.reply.send)}</Button>
          <TextArea rows={2} value={internal} placeholder={t(K.adm.internal.title)} aria-label={t(K.adm.internal.title)} data-f="internal" onChange={(e) => setInternal(e.target.value)} />
          <Button size="sm" variant="secondary" data-act="send-internal" disabled={lettersOf(internal) < 3} onClick={() => void run(() => s.reply(internal, true), () => setInternal(''))}>{t(K.adm.internal.send)}</Button>
          <Problem code={problem} t={t} />
        </div>
      </Card>
      <Card>
        <div className="row gap-2" style={{ flexWrap: 'wrap' }} data-actions>
          {(tk.status === 'submitted' || tk.status === 'assigned') && <Button size="sm" variant="secondary" data-act="start" onClick={() => void run(() => s.start())}>{t(K.adm.actions.start)}</Button>}
          {open && <Button size="sm" data-act="resolve" onClick={() => { setProblem(null); setSheet('resolve'); }}>{t(K.adm.actions.resolve)}</Button>}
          {tk.canReopen && <Button size="sm" variant="secondary" data-act="admin-reopen" onClick={() => void run(() => s.reopen(t(K.adm.reopen)))}>{t(K.adm.reopen)}</Button>}
        </div>
      </Card>
      <Sheet open={sheet === 'resolve'} onClose={() => setSheet(null)} title={t(K.adm.actions.resolve)} closeLabel={t(K.close)}>
        <div className="stack gap-3"><Field label={t(K.adm.resolve.note, { min: MIN_NOTE })}>{(p) => <TextArea id={p.id} rows={4} value={resolveNote} data-f="resolve-note" onChange={(e) => setResolveNote(e.target.value)} />}</Field><Problem code={problem} t={t} />
          <Button data-act="confirm-resolve" disabled={lettersOf(resolveNote) < MIN_NOTE} onClick={() => void run(() => s.resolve(resolveNote), () => { setSheet(null); setResolveNote(''); })}>{t(K.adm.resolve.confirm)}</Button></div>
      </Sheet>
    </>
  );
}

function TriageCard({ v, s, t }: { v: TicketView; s: ServiceTicketsState; t: T }) {
  const tk = v.ticket;
  const tr = v.ticket.triage as NonNullable<TicketView['ticket']['triage']>;
  const [edit, setEdit] = useState(false);
  const [cat, setCat] = useState<TicketCategory>(tk.category);
  const [urg, setUrg] = useState<TicketUrgency>(tk.urgency);
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const open = tk.status === 'submitted' || tk.status === 'assigned' || tk.status === 'in_progress';
  const save = async () => { setProblem(null); const r = await s.triage(cat, urg, note); if (!r.ok) setProblem(r.problem); else { setEdit(false); setNote(''); } };
  return (
    <Card>
      <div className="stack gap-2" data-triage={tr.confidence}>
        <h2 className="t-md t-semibold">{t(K.adm.triage.title)}</h2>
        <span className="row gap-1" style={{ flexWrap: 'wrap' }}>
          <Badge tone={tr.confidence === 'confident' ? 'success' : 'warning'}>{tr.confidence === 'confident' ? t(K.adm.triage.confident) : t(K.adm.triage.human)}</Badge>
          <Badge tone="neutral">{t(`serviceTickets.route.${tk.route}`)}</Badge>
          <Badge tone={urgencyTone(tk.urgency)}>{t(`serviceTickets.urgency.${tk.urgency}`)}</Badge>
        </span>
        {tr.reason && <p className="t-sm" data-reason={tr.reason}>{t(`serviceTickets.reason.${tr.reason}`, { words: tr.words.join(', ') })}</p>}
        {tr.humanBy && <p className="t-xs t-muted">{t(K.adm.triage.confirmed, { name: tr.humanBy })}</p>}
        {open && !edit && <div><Button size="sm" variant="secondary" data-act="triage-edit" onClick={() => setEdit(true)}>{t(K.adm.triage.change)}</Button></div>}
        {open && edit && (
          <div className="stack gap-2" data-triage-form>
            <Field label={t(K.adm.triage.category)}>{(p) => <Select id={p.id} value={cat} data-f="category" onChange={(e) => setCat(e.target.value as TicketCategory)}>{CATEGORIES.map((c) => <option key={c} value={c}>{t(`serviceTickets.cat.${c}.title`)}</option>)}</Select>}</Field>
            <Field label={t(K.adm.triage.urgency)}>{(p) => <Select id={p.id} value={urg} data-f="urgency" onChange={(e) => setUrg(e.target.value as TicketUrgency)}>{urgencies.map((u) => <option key={u} value={u}>{t(`serviceTickets.urgency.${u}`)}</option>)}</Select>}</Field>
            <Field label={t(K.adm.triage.note, { min: MIN_NOTE })} hint={t(K.adm.triage.hint)}>{(p) => <TextArea id={p.id} rows={2} value={note} data-f="triage-note" onChange={(e) => setNote(e.target.value)} />}</Field>
            <Problem code={problem} t={t} />
            <Button size="sm" data-act="triage-save" disabled={lettersOf(note) < MIN_NOTE} onClick={() => void save()}>{t(K.adm.triage.save)}</Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function VisitCard({ v, s, t, lang }: { v: TicketView; s: ServiceTicketsState; t: T; lang: string }) {
  const tk = v.ticket;
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(tk.visit?.date && tk.visit.date >= today ? tk.visit.date : today);
  const [window, setWindow] = useState<'morning' | 'afternoon'>(tk.visit?.window ?? 'morning');
  const [tech, setTech] = useState('');
  const [note, setNote] = useState('');
  const [techs, setTechs] = useState<TicketTechnician[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [edit, setEdit] = useState(!tk.visit);
  const { technicians } = s;
  useEffect(() => { let on = true; void technicians(date).then((l) => { if (on) setTechs(l); }); return () => { on = false; }; }, [technicians, date]);
  const chosen = techs.find((x) => x.id === tech);
  const book = async () => { setProblem(null); const r = await s.assign(tech, date, window, note); if (!r.ok) setProblem(r.problem); else { setEdit(false); setNote(''); } };
  if (!tk.jobId) return <Card><p className="t-sm t-muted" data-no-lift>{t(K.adm.noLift)}</p></Card>;
  if (tk.visit?.status === 'in_progress') return <Card><div className="stack gap-1" data-visit="in_progress"><h2 className="t-md t-semibold">{t(K.adm.visit.title)}</h2><p className="t-sm">{t(K.adm.visit.current, { name: tk.visit.technicianName, date: formatDate(tk.visit.date, lang), window: windowWord(t, tk.visit.window) })}</p></div></Card>;
  return (
    <Card>
      <div className="stack gap-2" data-visit-card>
        <h2 className="t-md t-semibold">{t(K.adm.visit.title)}</h2>
        {tk.visit && <p className="t-sm" data-current-visit>{t(K.adm.visit.current, { name: tk.visit.technicianName, date: formatDate(tk.visit.date, lang), window: windowWord(t, tk.visit.window) })}</p>}
        {!edit && <div><Button size="sm" variant="secondary" data-act="visit-edit" onClick={() => setEdit(true)}>{t(K.adm.visit.rebook)}</Button></div>}
        {edit && (
          <div className="stack gap-2" data-visit-form>
            <Field label={t(K.adm.visit.date)}>{(p) => <Input id={p.id} type="date" min={today} value={date} data-f="visit-date" onChange={(e) => setDate(e.target.value)} />}</Field>
            <Field label={t(K.adm.visit.window)}>{(p) => <Select id={p.id} value={window} data-f="visit-window" onChange={(e) => setWindow(e.target.value as 'morning' | 'afternoon')}>{WINDOWS.map((w) => <option key={w} value={w}>{t(`serviceTickets.window.${w}`)}</option>)}</Select>}</Field>
            <Field label={t(K.adm.visit.tech)}>{(p) => <Select id={p.id} value={tech} data-f="visit-tech" onChange={(e) => setTech(e.target.value)}><option value="">—</option>{techs.map((x) => <option key={x.id} value={x.id} disabled={!x.eligible}>{x.name} · {t(K.adm.visit.load, { visits: x.visitsThatDay, jobs: x.jobsThatDay })}{x.eligible ? '' : ` · ${t(K.adm.visit.notEligible)}`}</option>)}</Select>}</Field>
            {chosen && !chosen.eligible && <p className="t-xs t-muted">{t(K.adm.visit.notEligible)}</p>}
            <Field label={t(K.adm.visit.note)}>{(p) => <TextArea id={p.id} rows={2} value={note} data-f="visit-note" onChange={(e) => setNote(e.target.value)} />}</Field>
            <Problem code={problem} t={t} />
            <Button size="sm" data-act="book-visit" disabled={!tech || !chosen?.eligible} onClick={() => void book()}>{t(K.adm.visit.book)}</Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function ClaimCard({ v, s, t, lang }: { v: TicketView; s: ServiceTicketsState; t: T; lang: string }) {
  const tk = v.ticket;
  const [resp, setResp] = useState<TicketResponsibility | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const d = tk.claim.decided;
  const save = async () => { setProblem(null); const r = await s.decide(resp as TicketResponsibility, note, reviewed); if (!r.ok) setProblem(r.problem); };
  return (
    <Card>
      <div className="stack gap-2" data-claim-card>
        <h2 className="t-md t-semibold">{t(K.adm.claim.title)}</h2>
        {d ? (
          <div className="stack gap-1" data-claim-decided>
            <p className="t-sm">{t(K.adm.claim.decided, { responsibility: t(`serviceTickets.resp.${d.responsibility}`) })}</p>
            {d.note && <p className="t-sm t-muted">{d.note}</p>}
            <p className="t-xs t-muted">{t(K.adm.claim.decidedBy, { name: d.byName ?? '', date: formatDate(d.at, lang) })}</p>
          </div>
        ) : (
          <>
            <p className="t-sm">{t(K.adm.claim.body)}</p>
            <div className="stack gap-2" role="radiogroup" aria-label={t(K.adm.claim.responsibility)}>{RESPONSIBILITIES.map((r) => <Choice key={r} tag={r} selected={resp === r} onClick={() => setResp(r)} title={t(`serviceTickets.resp.${r}`)} />)}</div>
            <Checkbox checked={reviewed} onChange={setReviewed} label={t(K.adm.claim.reviewed)} />
            <Field label={t(K.adm.claim.note, { min: CLAIM_NOTE_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={note} data-f="claim-note" onChange={(e) => setNote(e.target.value)} />}</Field>
            <Problem code={problem} t={t} />
            <Button size="sm" data-act="claim-save" disabled={!resp || !reviewed || lettersOf(note) < CLAIM_NOTE_MIN} onClick={() => void save()}>{t(K.adm.claim.save)}</Button>
          </>
        )}
      </div>
    </Card>
  );
}

function AdminAside({ v, t }: { v: TicketView; s: ServiceTicketsState; t: T; lang: string }) {
  const ev = v.evidence;
  return (
    <Card>
      <div className="stack gap-2" data-evidence>
        <h2 className="t-md t-semibold row gap-2" style={{ alignItems: 'center' }}><FileText size={18} aria-hidden="true" /> {t(K.adm.evidence.title)}</h2>
        <p className="t-xs t-muted">{t(K.adm.evidence.body)}</p>
        {!ev || ev.length === 0 ? <p className="t-sm t-muted">{t(K.ev.none)}</p> : ev.map((x) => (
          <div key={x.key} className="row gap-2" data-ev={x.key} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stack gap-0"><span className="t-sm">{t(`serviceTickets.ev.${x.key}`, { count: x.count ?? 0, total: x.total ?? 0 })}</span>{x.flag && <span className="t-xs" style={{ color: 'var(--color-warning)' }}>{t(K.ev.flag)}</span>}</span>
            <a className="ds-btn ds-btn--ghost ds-btn--sm" href={x.route}>{t(K.ev.open)}</a>
          </div>
        ))}
      </div>
    </Card>
  );
}
