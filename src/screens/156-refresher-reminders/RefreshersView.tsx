import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, BellRinging, CaretRight, Funnel, ShieldWarning, X } from '@phosphor-icons/react';
import { Avatar, Badge, Button, Card, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, Tabs, TextArea, formatDate } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { RefresherCadenceView, RefresherRowView, RefresherTierName } from '@/data/repository';
import { MAX_EXTENSION_DAYS, MAX_GRACE_DAYS, MAX_MONTHS, NOTE_MIN, PAGE, REFRESH_KEYS as K, ROLES, TABS, TIERS, assessmentPath, directoryPath, lessonsPath } from './refreshers.types';
import { useRefreshers } from './useRefreshers';
import type { RefreshersState } from './useRefreshers';

type T = ReturnType<typeof useTranslation>['t'];
const TIER_TONE: Record<RefresherTierName, BadgeTone> = { blocked: 'error', grace: 'warning', extended: 'warning', due: 'accent', upcoming: 'neutral' };
const problemKey = (code?: string | null) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const moduleTitle = (t: T, code: string) => t(`trainingLib.content.${code.toLowerCase()}.title`, { defaultValue: code });
const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;
const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

function Footer({ children }: { children: ReactNode }) {
  return <div className="row gap-2" data-sheet-actions style={{ position: 'sticky', bottom: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: 'var(--space-2) 0', marginTop: 'var(--space-3)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>{children}</div>;
}

/** The line under a certification: what has happened and how long the holder is still eligible, in plain words. */
function statusLine(t: T, r: RefresherRowView, lang: string): string {
  const date = formatDate(r.expiresAt, lang);
  if (r.tier === 'upcoming' || r.tier === 'due') return t(K.row[r.tier], { date, count: r.daysToEnd });
  if (r.tier === 'blocked') return t(K.row.blocked, { date: formatDate(r.eligibleUntil, lang) });
  return t(K.row[r.tier], { count: Math.max(0, r.daysEligibleLeft), date: formatDate(r.eligibleUntil, lang) });
}

/**
 * Screen 156 — Refresher Training Reminder. Competence is kept up, not just earned once: this is the queue of every certification coming due, in its grace
 * period, extended for documented leave, or past it (when new work needing it is held), most urgent first and safety-critical ones ahead. Admin can remind, extend
 * for approved leave with a reason, and set the cadence as versioned settings; a partner sees their own and is one tap from refreshing.
 */
export function RefreshersScreen() {
  const { t } = useTranslation();
  const s = useRefreshers();
  const subtitle = s.isAdmin ? t(K.subtitleAdmin) : t(K.subtitleSelf);
  if (s.status === 'loading' && !s.view) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="list" rows={6} /></Screen>;
  if (s.status === 'error' || !s.view) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} /></Screen>;
  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.title)} subtitle={subtitle} />
      {s.isAdmin && <Tabs label={t(K.title)} value={s.tab} onChange={s.setTab} items={TABS.map((x) => ({ id: x, label: t(K.tab[x]) }))} />}
      {s.isAdmin && s.tab === 'cadence' ? <CadenceTab s={s} t={t} /> : s.isAdmin ? <Queue s={s} t={t} /> : <SelfList s={s} t={t} />}
      <RowSheet s={s} t={t} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ Admin's queue */

function Queue({ s, t }: { s: RefreshersState; t: T }) {
  const visible = s.shown.slice(0, s.page * PAGE);
  const c = s.counts;
  return (
    <>
      <div className="stack gap-2 sticky-under-shell" style={{ background: 'var(--color-bg)', paddingBlock: 'var(--space-2)' }} data-controls>
        <Field label={t(K.search.label)}>{(p) => <Input id={p.id} type="search" value={s.q} placeholder={t(K.search.placeholder)} onChange={(e) => s.setQuery(e.target.value)} data-f="search" autoComplete="off" />}</Field>
        <div className="row gap-2" style={{ overflowX: 'auto', paddingBottom: 2 }} role="group" aria-label={t(K.tierAll)}>
          <span data-tier-chip="" style={{ flex: '0 0 auto' }}><Chip pressed={!s.tier} onClick={() => s.setTier('')}>{t(K.tierAll)} · {s.rows.length}</Chip></span>
          {TIERS.map((x) => <span key={x} data-tier-chip={x} style={{ flex: '0 0 auto' }}><Chip pressed={s.tier === x} onClick={() => s.setTier(x)}>{t(K.tier[x])} · {c?.[x] ?? 0}</Chip></span>)}
        </div>
        <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <span data-safety><Chip pressed={s.safetyOnly} onClick={() => s.setSafety(!s.safetyOnly)} icon={<ShieldWarning size={14} />}>{t(K.filter.safety)} · {c?.safetyCritical ?? 0}</Chip></span>
          <Select value={s.role ?? ''} onChange={(e) => s.setRole(e.target.value)} aria-label={t(K.filter.role)} data-f="role" style={{ width: 'auto', minHeight: 36 }}>
            <option value="">{t(K.filter.anyRole)}</option>
            {ROLES.map((r) => <option key={r} value={r}>{t(K.role[r])}</option>)}
          </Select>
          {s.hasFilters && <Button size="sm" variant="ghost" icon={<X size={14} />} data-clear onClick={s.clear}>{t(K.filter.clear)}</Button>}
        </div>
      </div>
      <div className="stack gap-3 mt-3" data-queue>
        <p className="t-xs t-muted" role="status" data-count>{t(K.summary.count, { count: s.shown.length })}</p>
        {s.rows.length === 0 ? (
          <EmptyState icon={<ArrowsClockwise size={28} />} title={t(K.empty.title)} body={t(K.empty.body)} />
        ) : s.shown.length === 0 ? (
          <EmptyState icon={<Funnel size={28} />} title={t(K.noMatch.title)} body={t(K.noMatch.body)} actionLabel={t(K.filter.clear)} onAction={s.clear} />
        ) : (
          <>
            <div className="grid-auto" style={{ '--min': '360px', alignItems: 'start' } as React.CSSProperties}>
              {visible.map((r, i) => <RefresherRow key={r.id} r={r} s={s} t={t} index={i} showName />)}
            </div>
            {visible.length < s.shown.length && (
              <div className="stack gap-1" style={{ alignItems: 'center' }}>
                <span className="t-xs t-muted">{t(K.more.shown, { shown: visible.length, total: s.shown.length })}</span>
                <Button variant="secondary" data-more onClick={s.showMore}>{t(K.more.button, { count: Math.min(PAGE, s.shown.length - visible.length) })}</Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

/** One consistent row: avatar, who and which certification, one line of where it stands, then the state (and a mark for the safety-critical ones). */
function RefresherRow({ r, s, t, index, showName }: { r: RefresherRowView; s: RefreshersState; t: T; index: number; showName: boolean }) {
  const { i18n } = useTranslation();
  return (
    <Card riseIndex={Math.min(index, 8)} onClick={() => s.openRow(r.id)}>
      <div className="row gap-3" data-row={r.id} data-tier={r.tier} data-safety={r.safetyCritical ? '1' : '0'} style={{ alignItems: 'center' }}>
        {showName ? <Avatar name={r.name} /> : <span aria-hidden="true" style={{ color: 'var(--color-accent-secondary)' }}><ArrowsClockwise size={22} /></span>}
        <span className="stack grow" style={{ minWidth: 0 }}>
          <strong className="t-md" style={{ overflowWrap: 'anywhere' }}>{showName ? r.name : moduleTitle(t, r.moduleCode)}</strong>
          <span className="t-sm" style={{ overflowWrap: 'anywhere' }}>{showName ? t(K.row.refresher, { module: moduleTitle(t, r.moduleCode) }) : null}</span>
          <span className="t-xs t-muted">{statusLine(t, r, i18n.language)}{r.openJobs > 0 && r.tier !== 'upcoming' ? ` · ${t(K.row.openJobs, { count: r.openJobs })}` : ''}</span>
        </span>
        <span className="stack gap-1" style={{ alignItems: 'flex-end' }}>
          <Badge tone={TIER_TONE[r.tier]}>{t(K.tier[r.tier])}</Badge>
          {r.safetyCritical && <Badge tone="warning">{t(K.row.safety)}</Badge>}
        </span>
        <CaretRight size={14} aria-hidden="true" />
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ a partner's own refreshers */

function SelfList({ s, t }: { s: RefreshersState; t: T }) {
  const { i18n } = useTranslation();
  return (
    <div className="stack gap-3" data-self>
      <p className="t-sm">{t(K.self.intro)}</p>
      {s.rows.length === 0 ? (
        <EmptyState icon={<ArrowsClockwise size={28} />} title={t(K.emptySelf.title)} body={t(K.emptySelf.body)} actionLabel={t(K.emptySelf.action)} onAction={() => s.goto('/certifications')} />
      ) : (
        <div className="grid-auto" style={{ '--min': '340px', alignItems: 'start' } as React.CSSProperties}>
          {s.rows.map((r) => (
            <Card key={r.id}>
              <div className="stack gap-2" data-mine={r.id} data-tier={r.tier}>
                <div className="row between gap-2" style={{ alignItems: 'center' }}>
                  <strong className="t-md" style={{ overflowWrap: 'anywhere' }}>{moduleTitle(t, r.moduleCode)}</strong>
                  <span className="stack gap-1" style={{ alignItems: 'flex-end' }}><Badge tone={TIER_TONE[r.tier]}>{t(K.tier[r.tier])}</Badge>{r.safetyCritical && <Badge tone="warning">{t(K.row.safety)}</Badge>}</span>
                </div>
                <p className="t-sm">{statusLine(t, r, i18n.language)}</p>
                {r.tier === 'blocked' ? <p className="t-xs" style={{ color: 'var(--color-warning)' }}>{t(K.self.blockedLeft)}</p> : r.tier === 'grace' || r.tier === 'extended' ? <p className="t-xs">{t(K.self.graceLeft, { count: Math.max(0, r.daysEligibleLeft), date: formatDate(r.eligibleUntil, i18n.language) })} {r.openJobs > 0 ? t(K.self.keepsWorking) : ''}</p> : null}
                <div className="row gap-2 wrap">
                  <Button size="sm" data-start onClick={() => s.goto(assessmentPath(r.moduleId))}>{t(K.self.start)}</Button>
                  <Button size="sm" variant="secondary" data-lessons onClick={() => s.goto(lessonsPath(r.moduleId))}>{t(K.self.lessons)}</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ the row's sheet (Admin) */

function RowSheet({ s, t }: { s: RefreshersState; t: T }) {
  const { i18n } = useTranslation();
  const r = s.isAdmin ? s.open : null;
  const [extending, setExtending] = useState(false);
  const [until, setUntil] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setExtending(false); setUntil(r ? plusDays(Math.max(14, Math.min(MAX_EXTENSION_DAYS, r.daysEligibleLeft > 0 ? r.daysEligibleLeft + 30 : 30))) : ''); setReason(''); setError(null); }, [r?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const lang = i18n.language;
  return (
    <Sheet open={!!r} onClose={() => s.closeRow()} title={r ? r.name : t(K.title)} closeLabel={t(K.close)}>
      {r && (
        <div className="stack gap-3" data-detail={r.id} data-tier={r.tier}>
          <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
            <Badge tone={TIER_TONE[r.tier]}>{t(K.tier[r.tier])}</Badge>
            {r.safetyCritical && <Badge tone="warning">{t(K.row.safety)}</Badge>}
            <span className="t-sm">{moduleTitle(t, r.moduleCode)}</span>
          </div>
          <p className="t-sm" data-body>{t(K.detail[`${r.tier}Body` as 'blockedBody'], { date: formatDate(r.eligibleUntil, lang), count: Math.max(0, r.daysEligibleLeft) })}</p>
          <dl className="stack gap-1 t-sm" data-facts>
            <div className="row between"><dt className="t-muted">{t(K.detail.ends)}</dt><dd>{formatDate(r.expiresAt, lang)}</dd></div>
            <div className="row between"><dt className="t-muted">{t(K.detail.eligibleUntil)}</dt><dd>{formatDate(r.eligibleUntil, lang)}</dd></div>
            <div className="row between"><dt className="t-muted">{t(K.detail.cadence)}</dt><dd>{r.cadenceVersion}</dd></div>
            <div className="row between"><dt className="t-muted">{t(K.detail.openJobs)}</dt><dd>{r.openJobs}</dd></div>
            <div className="row between"><dt className="t-muted">{t(K.detail.lastReminder)}</dt><dd>{r.lastReminderAt ? formatDate(r.lastReminderAt, lang) : t(K.detail.never)}</dd></div>
          </dl>
          {r.extensions.length > 0 && (
            <div className="stack gap-1" data-extensions>
              <strong className="t-sm">{t(K.detail.extensions)}</strong>
              {r.extensions.map((x) => <span key={x.id} className="t-xs">{t(K.detail.extensionRow, { until: formatDate(x.until, lang), name: x.byName })} “{x.reason}”</span>)}
            </div>
          )}
          {extending ? (
            <div className="stack gap-3" data-form="extend">
              <p className="t-sm">{t(K.extend.body, { max: MAX_EXTENSION_DAYS })}</p>
              <Field label={t(K.extend.until)} hint={t(K.extend.untilHint)}>{(p) => <Input id={p.id} type="date" min={today()} value={until} onChange={(e) => setUntil(e.target.value)} data-f="until" />}</Field>
              <Field label={t(K.extend.reason)} hint={t(K.extend.reasonHint, { min: NOTE_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} data-f="reason" />}</Field>
              {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
              <Footer>
                <Button variant="ghost" onClick={() => { setExtending(false); setError(null); }}>{t(K.extend.cancel)}</Button>
                <Button disabled={!until || letters(reason) < NOTE_MIN || s.busy} data-confirm-extend onClick={async () => { const x = await s.extend(r, { until, reason }); if (!x.ok) setError(x.code ?? 'generic'); else { setExtending(false); setError(null); } }}>{t(K.extend.confirm)}</Button>
              </Footer>
            </div>
          ) : (
            <>
              {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
              <Footer>
                <Button variant="ghost" onClick={() => s.goto(directoryPath(r.name))}>{t(K.detail.partner)}</Button>
                <Button variant="secondary" icon={<BellRinging size={16} />} disabled={s.busy} data-remind onClick={async () => { const x = await s.remind(r); setError(x.ok ? null : x.code ?? 'generic'); }}>{t(K.detail.remind)}</Button>
                <Button data-extend onClick={() => setExtending(true)}>{t(K.detail.extend)}</Button>
              </Footer>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}

/* ------------------------------------------------------------------ Admin: the cadence, as versioned settings */

function CadenceTab({ s, t }: { s: RefreshersState; t: T }) {
  const [editing, setEditing] = useState<RefresherCadenceView | null>(null);
  return (
    <div className="stack gap-3 mt-3" data-cadence>
      <p className="t-sm">{t(K.cadence.intro)}</p>
      <p className="t-xs t-muted" data-placeholder-note>{t(K.cadence.placeholder)}</p>
      <div className="grid-auto" style={{ '--min': '360px', alignItems: 'start' } as React.CSSProperties}>
        {s.cadences.map((c) => <CadenceCard key={c.assessmentId} c={c} t={t} onEdit={() => setEditing(c)} />)}
      </div>
      <CadenceSheet s={s} t={t} c={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function CadenceCard({ c, t, onEdit }: { c: RefresherCadenceView; t: T; onEdit: () => void }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const line = (v: { months: number | null; graceDays: number }) => (v.months ? t(K.cadence.months, { count: v.months }) : t(K.cadence.noExpiry)) + (v.months ? ` · ${t(K.cadence.grace, { count: v.graceDays })}` : '');
  return (
    <Card>
      <div className="stack gap-2" data-cadence-card={c.moduleCode}>
        <div className="row between gap-2" style={{ alignItems: 'baseline' }}>
          <strong className="t-md">{moduleTitle(t, c.moduleCode)}</strong>
          {c.safetyCritical && <Badge tone="warning">{t(K.row.safety)}</Badge>}
        </div>
        <p className="t-sm" data-current>{t(K.cadence.inForce, { version: c.current.version })}: {line(c.current)}</p>
        {c.upcoming && <p className="t-xs" data-upcoming>{t(K.cadence.upcoming, { version: c.upcoming.version, date: formatDate(c.upcoming.effectiveFrom, lang), cadence: line(c.upcoming) })}</p>}
        <div className="stack gap-1">
          <strong className="t-xs">{t(K.cadence.versions)}</strong>
          {[...c.versions].reverse().map((v) => (
            <span key={v.version} className="t-xs t-muted" data-version={v.version}>{t(K.cadence.versionRow, { version: v.version, date: formatDate(v.effectiveFrom, lang), cadence: line(v), name: v.setByName })} “{v.reason}” · {t(K.cadence.held, { count: v.heldCount })}</span>
          ))}
        </div>
        <Button size="sm" variant="secondary" style={{ width: 'fit-content' }} data-change={c.assessmentId} onClick={onEdit}>{t(K.cadence.change)}</Button>
      </div>
    </Card>
  );
}

function CadenceSheet({ s, t, c, onClose }: { s: RefreshersState; t: T; c: RefresherCadenceView | null; onClose: () => void }) {
  const [months, setMonths] = useState('');
  const [grace, setGrace] = useState('14');
  const [effective, setEffective] = useState(today());
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (c) { setMonths(c.current.months ? String(c.current.months) : ''); setGrace(String(c.current.graceDays)); setEffective(today()); setReason(''); setError(null); } }, [c?.assessmentId]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Sheet open={!!c} onClose={onClose} title={t(K.cadence.changeTitle)} closeLabel={t(K.close)}>
      {c && (
        <div className="stack gap-3" data-form="cadence">
          <p className="t-sm">{t(K.cadence.changeBody, { module: moduleTitle(t, c.moduleCode) })}</p>
          <p className="t-xs t-muted">{t(K.cadence.keepsDates)}</p>
          {c.safetyCritical && <p className="t-xs" style={{ color: 'var(--color-warning)' }}>{t(K.cadence.safetyNote)}</p>}
          <Field label={t(K.cadence.monthsField)} hint={t(K.cadence.monthsHint, { max: MAX_MONTHS })}>{(p) => <Input id={p.id} type="number" inputMode="numeric" min={1} max={MAX_MONTHS} value={months} onChange={(e) => setMonths(e.target.value)} data-f="months" />}</Field>
          <Field label={t(K.cadence.graceField)} hint={t(K.cadence.graceHint, { max: MAX_GRACE_DAYS })}>{(p) => <Input id={p.id} type="number" inputMode="numeric" min={0} max={MAX_GRACE_DAYS} value={grace} onChange={(e) => setGrace(e.target.value)} data-f="grace" />}</Field>
          <Field label={t(K.cadence.effective)} hint={t(K.cadence.effectiveHint)}>{(p) => <Input id={p.id} type="date" min={today()} value={effective} onChange={(e) => setEffective(e.target.value)} data-f="effective" />}</Field>
          <Field label={t(K.cadence.reason)} hint={t(K.cadence.reasonHint, { min: NOTE_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} data-f="reason" />}</Field>
          {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
          <Footer>
            <Button variant="ghost" onClick={onClose}>{t(K.cadence.cancel)}</Button>
            <Button disabled={letters(reason) < NOTE_MIN || s.busy} data-confirm-cadence onClick={async () => { const r = await s.publishCadence(c, { months: months.trim() === '' ? null : Number(months), graceDays: Number(grace), effectiveFrom: effective, reason }); if (!r.ok) setError(r.code ?? 'generic'); else onClose(); }}>{t(K.cadence.publish)}</Button>
          </Footer>
        </div>
      )}
    </Sheet>
  );
}
