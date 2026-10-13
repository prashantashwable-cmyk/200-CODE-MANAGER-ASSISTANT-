import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Buildings, CheckCircle, Clock, MapPin, NavigationArrow, Package, Phone, Truck, UsersThree, Warning } from '@phosphor-icons/react';
import { ActionBar, Badge, Button, Card, EmptyState, ErrorState, LoadingState, MapCanvas, ProgressBar, Screen, ScreenHeader, formatDate, formatDateTime, formatTime } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { JobMaterialState, JobMaterialView, JobNoteView, JobSpecView, TechnicianJobDetail } from '@/data/repository';
import { useJobDetailSiteInfo } from './useJobDetailSiteInfo';
import type { JobDetailState, SpecChange } from './useJobDetailSiteInfo';
import { JOB_KEYS as K, NOTE_STALE_DAYS, homePath, navigateUrl, sopPath } from './job-detail-site-info.types';
import type { JobSpecField } from './job-detail-site-info.types';

type T = ReturnType<typeof useTranslation>['t'];

const MATERIAL_TONE: Record<JobMaterialState, BadgeTone> = { on_site: 'success', awaiting_signature: 'accent', in_transit: 'accent', preparing: 'neutral', issue: 'error' };
const TOPIC_TONE = { access: 'accent', contact: 'neutral', safety: 'error', other: 'neutral' } as const;
const STATUS_TONE: Record<TechnicianJobDetail['job']['status'], BadgeTone> = {
  scheduled: 'accent',
  materials_pending: 'warning',
  in_progress: 'success',
  qc_pending: 'accent',
  handover_pending: 'accent',
  completed: 'neutral',
  on_hold: 'error',
};

const ageDays = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));

/** A configuration value, in the words the quotation used (`driveType.*` and `finishTier.*` are 061's). */
const specValue = (field: JobSpecField, value: string | number, t: T): string => {
  if (field === 'driveType') return t(`driveType.${value}`);
  if (field === 'finishTier') return t(`finishTier.${value}`);
  if (field === 'travelHeightM') return t(K.spec.metres, { value });
  return String(value);
};

/**
 * Screen 122 — Job Detail & Site Info. The context for one installation, read-mostly: who and where, what was sold, which parts
 * are really on site, what people wrote about the site and when, and who else is on the job. The configuration comes only from the
 * deal's accepted quotation, materials only from the delivery records, and every note carries its date so an old remark is not
 * read as current. If the configuration changes while the screen is open the change is put in front of the person to acknowledge.
 * The working record of the job lives in the SOP checklist this screen leads to.
 */
export function JobDetailSiteInfoView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const s = useJobDetailSiteInfo();
  const lang = i18n.language;

  if (s.status === 'loading' && !s.detail) {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
      </Screen>
    );
  }
  if (s.status === 'not_found') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <EmptyState icon={<Buildings size={28} />} title={t(K.notFound.title)} body={t(K.notFound.body)} actionLabel={t(K.back)} onAction={() => navigate(homePath)} />
      </Screen>
    );
  }
  if (s.status === 'error' || !s.detail) {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />
      </Screen>
    );
  }

  const d = s.detail;
  const job = d.job;
  const assistant = job.role === 'assistant';
  const blocked = job.action === 'waiting_materials' || job.action === 'on_hold';
  const changedFields = new Set<JobSpecField>((s.change?.fields ?? []).map((f) => f.field));

  return (
    <Screen width="wide" className="pb-action-bar">
      <ScreenHeader
        title={job.siteName}
        subtitle={job.code}
        action={
          <Button size="sm" variant="ghost" onClick={() => navigate(homePath)} aria-label={t(K.back)}>
            <ArrowLeft size={16} aria-hidden="true" /> {t(K.back)}
          </Button>
        }
      />

      {s.change && <ChangedBanner change={s.change} onAck={s.acknowledgeChange} t={t} />}

      <div className="main-aside">
        <div className="stack gap-3">
          <SummaryCard d={d} t={t} />
          <SpecCard spec={d.spec} changed={changedFields} t={t} lang={lang} />
          <MaterialsCard m={d.materials} t={t} lang={lang} />
          <NotesCard notes={d.notes} t={t} lang={lang} />
        </div>
        <div className="stack gap-3">
          <SiteCard d={d} t={t} />
          <CustomerCard d={d} t={t} />
          <TeamCard d={d} t={t} />
          <OnSiteCard d={d} t={t} lang={lang} onOpen={() => navigate(`/technician/jobs/${job.id}/checkin`)} />
          {d.repeat && <RepeatCard repeat={d.repeat} t={t} lang={lang} />}
        </div>
      </div>

      <ActionBar>
        {blocked && <p className="t-xs t-muted mb-2">{t(job.action === 'on_hold' ? K.action.holdHint : K.action.waitingHint)}</p>}
        <Button block disabled={blocked} onClick={() => navigate(sopPath(job.id))}>
          {blocked ? t(job.action === 'on_hold' ? K.action.hold : K.action.waiting) : t(assistant ? K.action.mine : K.action.sop)} {!blocked && <ArrowRight size={16} aria-hidden="true" />}
        </Button>
        {!blocked && (
          <div className="grid-auto mt-2" style={{ ['--min' as string]: '130px' }}>
            <Button variant="secondary" onClick={() => navigate(`/safety-checklist/${job.id}`)}>
              {t(K.action.safety)}
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/job-issues/${job.id}`)}>
              {t(K.action.issue)}
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/material-usage/${job.id}`)}>
              {t('materialLog.title')}
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/installation-timeline/${job.id}`)}>
              {t('installTimeline.title')}
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/job-team/${job.id}`)}>
              {t('jobTeam.title')}
            </Button>
          </div>
        )}
      </ActionBar>
    </Screen>
  );
}

/* ---------------------------------------------------------------- pieces */

function OnSiteCard({ d, t, lang, onOpen }: { d: TechnicianJobDetail; t: T; lang: string; onOpen: () => void }) {
  const on = d.onSite;
  return (
    <Card>
      <div className="stack gap-2">
        <h2 className="t-md t-semibold row gap-2" style={{ alignItems: 'center' }}>
          <MapPin size={18} aria-hidden="true" /> {t(K.onSite.heading)}
        </h2>
        {on.now.length === 0 ? <p className="t-sm t-muted">{t(K.onSite.none)}</p> : on.now.map((p) => <p key={p.name} className="t-sm">{t(K.onSite.now, { name: p.name, time: formatTime(p.since, lang) })}</p>)}
        {on.days > 0 && <p className="t-xs t-muted">{t(K.onSite.total, { total: `${Math.floor(on.minutes / 60)}h ${on.minutes % 60}m`, count: on.days })}</p>}
        {on.mine === 'stale' && <p className="t-sm t-warning">{t(K.onSite.stale)}</p>}
        <div>
          <Button size="sm" variant="secondary" onClick={onOpen}>
            {t(K.onSite.open)}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ChangedBanner({ change, onAck, t }: { change: SpecChange; onAck: () => void; t: T }) {
  return (
    <Card className="mb-3" style={{ borderColor: 'var(--color-warning)' }}>
      <div className="row-top gap-3">
        <Warning size={22} color="var(--color-warning)" aria-hidden="true" />
        <div className="stack gap-2 grow" role="alert">
          <strong className="t-sm">{t(K.changed.title)}</strong>
          <p className="t-sm">{t(K.changed.body, { from: change.fromVersion, to: change.toVersion })}</p>
          <ul className="stack gap-1" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {change.fields.map((f) => (
              <li key={f.field} className="t-sm">
                {t(K.changed.line, { field: t(f.field === 'capacityPersons' || f.field === 'capacityKg' ? K.spec.field.capacity : K.spec.field[f.field]), before: specValue(f.field, f.before, t), after: specValue(f.field, f.after, t) })}
              </li>
            ))}
          </ul>
          <div>
            <Button size="sm" onClick={onAck}>
              {t(K.changed.ack)}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function SummaryCard({ d, t }: { d: TechnicianJobDetail; t: T }) {
  const job = d.job;
  return (
    <Card style={{ borderColor: job.status === 'on_hold' ? 'var(--color-error)' : undefined }}>
      <div className="stack gap-2">
        <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <Badge tone={job.role === 'lead' ? 'accent' : 'neutral'}>{t(K.shared.role(job.role))}</Badge>
          <Badge tone={STATUS_TONE[job.status]}>{t(K.shared.status(job.status))}</Badge>
        </div>
        {job.role === 'assistant' && job.leadName && <p className="t-sm">{t(K.shared.assisting, { name: job.leadName })}</p>}
        {job.role === 'assistant' && job.myTasks.length > 0 && (
          <div className="stack gap-1">
            <strong className="t-sm">{t(K.shared.yourPart)}</strong>
            {job.myTasks.map((task) => (
              <span key={task.id} className="row between gap-2 t-sm">
                {t(task.labelKey)}
                <Badge tone={task.status === 'complete' ? 'success' : task.status === 'blocked' ? 'error' : 'neutral'}>{t(K.shared.stepStatus(task.status))}</Badge>
              </span>
            ))}
          </div>
        )}
        {job.role === 'lead' && job.stage && (
          <div className="stack gap-1">
            <span className="t-sm t-medium">{t(K.shared.stage, { index: job.stage.index, total: job.stage.total, step: t(job.stage.labelKey) })}</span>
            <ProgressBar value={job.progress.total ? job.progress.done / job.progress.total : 0} label={t(K.shared.progress, { done: job.progress.done, total: job.progress.total })} />
          </div>
        )}
        {job.status === 'on_hold' && job.holdReason && <p className="t-sm t-error">{t(K.shared.hold, { reason: job.holdReason })}</p>}
      </div>
    </Card>
  );
}

function SpecCard({ spec, changed, t, lang }: { spec: JobSpecView | null; changed: Set<JobSpecField>; t: T; lang: string }) {
  if (!spec) {
    return (
      <Card style={{ borderColor: 'var(--color-warning)' }}>
        <div className="row-top gap-3">
          <Warning size={22} color="var(--color-warning)" aria-hidden="true" />
          <div className="stack gap-1">
            <h2 className="t-md t-semibold">{t(K.spec.heading)}</h2>
            <strong className="t-sm">{t(K.spec.noneTitle)}</strong>
            <p className="t-sm t-muted">{t(K.spec.noneBody)}</p>
          </div>
        </div>
      </Card>
    );
  }
  const cell = (label: string, value: string, hot: boolean) => (
    <div className="stack gap-1" style={hot ? { outline: '2px solid var(--color-accent-primary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)' } : { padding: 'var(--space-2)' }}>
      <span className="t-xs t-muted">{label}</span>
      <strong className="t-md">{value}</strong>
      {hot && <Badge tone="accent">{t(K.spec.changedBadge)}</Badge>}
    </div>
  );
  return (
    <Card>
      <div className="stack gap-3">
        <div className="stack gap-1">
          <h2 className="t-md t-semibold">{t(K.spec.heading)}</h2>
          <p className="t-xs t-muted">{t(K.spec.source, { code: spec.quotationCode, version: spec.version, date: formatDate(spec.acceptedAt, lang) })}</p>
        </div>
        <div className="grid-auto" style={{ ['--min' as string]: '150px' } as CSSProperties}>
          {cell(t(K.spec.field.driveType), specValue('driveType', spec.driveType, t), changed.has('driveType'))}
          {cell(t(K.spec.field.capacity), t(K.spec.capacityValue, { persons: spec.capacityPersons, kg: spec.capacityKg }), changed.has('capacityPersons') || changed.has('capacityKg'))}
          {cell(t(K.spec.field.stopsCount), t(K.spec.stops, { count: spec.stopsCount }), changed.has('stopsCount'))}
          {cell(t(K.spec.field.travelHeightM), specValue('travelHeightM', spec.travelHeightM, t), changed.has('travelHeightM'))}
          {cell(t(K.spec.field.finishTier), specValue('finishTier', spec.finishTier, t), changed.has('finishTier'))}
        </div>
        {spec.revision && <p className="t-xs t-muted">{t(K.spec.revised, { from: spec.revision.fromVersion, count: spec.revision.changed.length })}</p>}
        {spec.customConfiguration && <Badge tone="warning">{t(K.spec.custom)}</Badge>}
        {spec.overrideNote && <p className="t-sm">{t(K.spec.override, { note: spec.overrideNote })}</p>}
      </div>
    </Card>
  );
}

function MaterialsCard({ m, t, lang }: { m: TechnicianJobDetail['materials']; t: T; lang: string }) {
  return (
    <Card>
      <div className="stack gap-3">
        <div className="row between gap-2 wrap" style={{ alignItems: 'baseline' }}>
          <h2 className="t-md t-semibold row gap-2" style={{ alignItems: 'center' }}>
            <Package size={18} aria-hidden="true" /> {t(K.materials.heading)}
          </h2>
          {m.total > 0 && <span className="t-sm t-medium">{t(K.materials.summary, { done: m.onSite, total: m.total })}</span>}
        </div>
        {m.noOrders ? (
          <p className="t-sm t-muted">{t(K.materials.noOrders)}</p>
        ) : (
          <>
            <ProgressBar value={m.total ? m.onSite / m.total : 0} tone={m.onSite === m.total ? 'success' : 'accent'} label={t(K.materials.summary, { done: m.onSite, total: m.total })} />
            <p className={`t-sm ${m.onSite === m.total ? 't-success' : 't-warning'} row gap-2`} style={{ alignItems: 'center' }}>
              {m.onSite === m.total ? <CheckCircle size={16} aria-hidden="true" /> : <Truck size={16} aria-hidden="true" />}
              {m.onSite === m.total ? (m.materialsConfirmedAt ? t(K.materials.confirmedOn, { date: formatDate(m.materialsConfirmedAt, lang) }) : t(K.materials.allOnSite)) : t(K.materials.notAll)}
            </p>
            <div className="stack">
              {m.lines.map((l) => (
                <MaterialRow key={`${l.poCode}-${l.id}`} l={l} t={t} lang={lang} />
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

function MaterialRow({ l, t, lang }: { l: JobMaterialView; t: T; lang: string }) {
  return (
    <div className="ds-listrow" style={{ alignItems: 'flex-start' }}>
      <span className="stack grow" style={{ minWidth: 0 }}>
        <strong className="t-sm">{t(`partCategory.${l.category}`, { defaultValue: t(K.materials.other) })}</strong>
        <span className="t-xs t-muted">
          {l.description} · ×{l.quantity} · {t(K.materials.order, { code: l.poCode })}
        </span>
        {l.expectedAt && l.state !== 'on_site' && <span className="t-xs t-muted">{t(K.materials.expected, { date: formatDate(l.expectedAt, lang) })}</span>}
      </span>
      <Badge tone={MATERIAL_TONE[l.state]}>{t(K.materials.state[l.state])}</Badge>
    </div>
  );
}

function NotesCard({ notes, t, lang }: { notes: JobNoteView[]; t: T; lang: string }) {
  return (
    <Card>
      <div className="stack gap-3">
        <div className="stack gap-1">
          <h2 className="t-md t-semibold">{t(K.notes.heading)}</h2>
          <p className="t-xs t-muted">{t(K.notes.intro)}</p>
        </div>
        {notes.length === 0 ? (
          <p className="t-sm t-muted">{t(K.notes.empty)}</p>
        ) : (
          <div className="stack">
            {notes.map((n) => {
              const days = ageDays(n.at);
              const stale = days > NOTE_STALE_DAYS;
              return (
                <div key={n.id} className="ds-listrow" style={{ alignItems: 'flex-start', opacity: stale ? 0.85 : 1 }}>
                  <span className="stack grow gap-1" style={{ minWidth: 0 }}>
                    <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
                      <Badge tone={TOPIC_TONE[n.topic]}>{t(K.notes.topic[n.topic])}</Badge>
                      <span className="t-xs t-muted">
                        {t(K.notes.source[n.source])} · {t(K.notes.by, { name: n.byName })}
                      </span>
                    </span>
                    <span className="t-sm">{n.text}</span>
                    <span className="t-xs t-muted row gap-1" style={{ alignItems: 'center' }}>
                      <Clock size={12} aria-hidden="true" /> {formatDate(n.at, lang)} · {days === 0 ? t(K.notes.today) : t(K.notes.age, { count: days })}
                    </span>
                    {stale && <span className="t-xs t-warning">{t(K.notes.stale, { days: NOTE_STALE_DAYS })}</span>}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

function SiteCard({ d, t }: { d: TechnicianJobDetail; t: T }) {
  const { site } = d;
  const shaft = site.shaft;
  const mm = (v: number | null) => (v === null ? '—' : t(K.site.mm, { value: v }));
  return (
    <Card>
      <div className="stack gap-3">
        <h2 className="t-md t-semibold row gap-2" style={{ alignItems: 'center' }}>
          <MapPin size={18} aria-hidden="true" /> {t(K.site.heading)}
        </h2>
        <div className="stack gap-1">
          <strong className="t-sm">{site.name}</strong>
          <span className="t-sm t-muted">{[site.address, site.city, site.pincode].filter(Boolean).join(', ')}</span>
        </div>
        <MapCanvas label={t(K.site.map)} markers={[{ id: 'site', lat: site.location.lat, lng: site.location.lng, label: site.name, tone: 'accent' }]} bounds={{ minLat: site.location.lat - 0.02, maxLat: site.location.lat + 0.02, minLng: site.location.lng - 0.03, maxLng: site.location.lng + 0.03 }} height={160} />
        <a className="ds-btn ds-btn--secondary ds-btn--block" href={navigateUrl(site.location.lat, site.location.lng)} target="_blank" rel="noreferrer">
          <NavigationArrow size={16} aria-hidden="true" /> {t(K.site.navigate)}
        </a>
        {shaft && (
          <div className="stack gap-1">
            <strong className="t-sm">{t(K.site.shaft)}</strong>
            <div className="grid-2 t-sm">
              <span>{t(K.site.width)}: <span className="num">{mm(shaft.widthMm)}</span></span>
              <span>{t(K.site.depth)}: <span className="num">{mm(shaft.depthMm)}</span></span>
              <span>{t(K.site.pit)}: <span className="num">{mm(shaft.pitMm)}</span></span>
              <span>{t(K.site.headroom)}: <span className="num">{mm(shaft.headroomMm)}</span></span>
              {shaft.floors !== null && <span>{t(K.site.floors)}: <span className="num">{shaft.floors}</span></span>}
              {shaft.machineRoom && <span>{t(K.site.machineRoom)}: {t(K.site.machineRoomValue[shaft.machineRoom as keyof typeof K.site.machineRoomValue] ?? K.site.machineRoomValue.unknown)}</span>}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function CustomerCard({ d, t }: { d: TechnicianJobDetail; t: T }) {
  const c = d.customer;
  return (
    <Card>
      <div className="stack gap-2">
        <h2 className="t-md t-semibold">{t(K.customer.heading)}</h2>
        {!c.name ? (
          <p className="t-sm t-muted">{t(K.customer.unknown)}</p>
        ) : (
          <>
            <strong className="t-sm">{c.name}</strong>
            {c.company && <span className="t-sm t-muted">{c.company}</span>}
            {c.preferredLanguage && <span className="t-xs t-muted">{t(K.customer.prefers, { language: t(K.customer.language[c.preferredLanguage]) })}</span>}
            {c.phone && (
              <a className="ds-btn ds-btn--secondary ds-btn--block" href={`tel:${c.phone}`}>
                <Phone size={16} aria-hidden="true" /> {t(K.customer.call, { phone: c.phone })}
              </a>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

function TeamCard({ d, t }: { d: TechnicianJobDetail; t: T }) {
  return (
    <Card>
      <div className="stack gap-2">
        <h2 className="t-md t-semibold row gap-2" style={{ alignItems: 'center' }}>
          <UsersThree size={18} aria-hidden="true" /> {t(K.team.heading)}
        </h2>
        {d.team.length <= 1 ? (
          <p className="t-sm t-muted">{t(K.team.alone)}</p>
        ) : (
          d.team.map((m) => (
            <div key={m.userId} className="row between gap-2" style={{ alignItems: 'center' }}>
              <span className="stack" style={{ minWidth: 0 }}>
                <strong className="t-sm">
                  {m.name} {m.isYou && <span className="t-xs t-muted">({t(K.team.you)})</span>}
                </strong>
                <span className="row gap-2 wrap t-xs t-muted">
                  <Badge tone={m.role === 'lead' ? 'accent' : 'neutral'}>{t(K.shared.role(m.role))}</Badge>
                  {m.role === 'assistant' && t(K.team.steps, { count: m.stepCount })}
                </span>
              </span>
              {!m.isYou && m.phone && (
                <a className="ds-btn ds-btn--ghost ds-btn--sm" href={`tel:${m.phone}`} aria-label={t(K.team.call, { name: m.name })}>
                  <Phone size={16} aria-hidden="true" />
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function RepeatCard({ repeat, t, lang }: { repeat: NonNullable<TechnicianJobDetail['repeat']>; t: T; lang: string }) {
  return (
    <Card>
      <div className="stack gap-2">
        <h2 className="t-md t-semibold">{t(K.repeat.heading)}</h2>
        <p className="t-sm t-muted">{t(K.repeat.body)}</p>
        <ul className="stack gap-1" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {repeat.earlierJobs.map((j) => (
            <li key={j.code} className="t-xs t-muted">
              {t(K.repeat.earlier, { code: j.code, site: j.siteName })} · {formatDateTime(j.at, lang)}
            </li>
          ))}
        </ul>
        {repeat.carried.length > 0 && (
          <div className="stack gap-1">
            <strong className="t-sm">{t(K.repeat.carried)}</strong>
            <p className="t-xs t-muted">{t(K.repeat.carriedHint)}</p>
            {repeat.carried.map((n) => (
              <p key={n.id} className="t-sm">
                “{n.text}” <span className="t-xs t-muted">· {formatDate(n.at, lang)}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

