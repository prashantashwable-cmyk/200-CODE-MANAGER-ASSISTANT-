import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, DeviceMobile, LockKey, Plus, ShieldWarning, SignOut, WarningCircle } from '@phosphor-icons/react';
import { Badge, Button, Card, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, Tabs, TextArea, Toggle, formatDate, formatDateTime, relativeTimeParts, useToast } from '@/design-system';
import type { AccountSecurityView, AuthSessionView, RecoveryIssued, SecurityConfigPreview, SecurityOverview } from '@/data/repository';
import type { SecurityEvent, TwoFactorException } from '@/data/types';
import { EVENT_GROUPS, EXCEPTION_MAX_DAYS, NOTE_MIN, REASON_MIN, SEC_ROLES, lettersOf, weakenings } from '@/features/security/security';
import type { SecRole, SecurityConfig, TwoFactorState } from '@/features/security/security';
import { SECURITY_SESSION_KEYS as K } from './security-session.types';
import { TABS, useSecuritySession } from './useSecuritySession';
import type { SecurityState, SecurityTab } from './useSecuritySession';

type T = ReturnType<typeof useTranslation>['t'];
const errText = (t: T, code: string) => t(`security.error.${code}`, { defaultValue: t(K.error.generic) });
const TF_TONE: Record<TwoFactorState, 'success' | 'warning' | 'error' | 'neutral'> = { enrolled: 'success', grace: 'warning', excepted: 'warning', blocked: 'error', not_required: 'neutral' };
const SEV_TONE: Record<SecurityEvent['severity'], 'neutral' | 'accent' | 'warning' | 'error'> = { info: 'neutral', notice: 'accent', warning: 'warning', critical: 'error' };
const ago = (t: T, iso: string): string => { const p = relativeTimeParts(iso); return t(p.key, { count: p.count }); };
const todayPlus = (days: number): string => { const d = new Date(Date.now() + days * 86_400_000); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="stack gap-3">
      <h2 className="t-md t-semibold" style={{ borderTop: '1px solid var(--color-accent-primary)', paddingTop: 12 }}>{title}</h2>
      {hint && <p className="t-xs t-muted">{hint}</p>}
      {children}
    </section>
  );
}
function Line({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return <div className="row between wrap" style={{ gap: 8 }}><span className="t-sm t-muted">{label}</span><span className={`t-sm ${strong ? 't-semibold' : ''}`}>{value}</span></div>;
}
const Problem = ({ t, code }: { t: T; code: string | null }) => (code ? <p className="t-sm t-error" role="alert" data-problem={code}>{errText(t, code)}</p> : null);

/** Screen 195 — Security & Session Management. A settings layout in five parts: where things stand, every account's sessions and second step, the sign-in event log, second-step exceptions, and the rules in force. */
export function SecuritySessionScreen() {
  const { t, i18n } = useTranslation();
  const s = useSecuritySession();
  const head = <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh onClick={() => void s.refresh()}>{t(K.refresh)}</Button>} />;
  if (s.load === 'loading' && !s.overview) return <Screen width="default">{head}<LoadingState label={t(K.loading)} variant="list" rows={4} /></Screen>;
  if (s.load === 'error' && !s.overview) return <Screen width="default">{head}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.refresh()} /></Screen>;
  const o = s.overview;
  return (
    <Screen width="default">
      {head}
      <div className="stack gap-4">
        {s.offline && <p className="t-xs t-muted" role="status" data-offline>{t(K.offline)}</p>}
        {o && (
          <div className="grid-auto" data-summary style={{ ['--min' as string]: '150px' }}>
            <Card><div className="stack gap-0"><span className="t-xs t-muted">{t(K.summary.sessions)}</span><span className="t-lg t-semibold num" data-sessions>{o.counts.activeSessions}</span></div></Card>
            <Card><div className="stack gap-0"><span className="t-xs t-muted">{t(K.summary.failures)}</span><span className="t-lg t-semibold num" data-failures>{o.counts.failures24h}</span></div></Card>
            <Card><div className="stack gap-0"><span className="t-xs t-muted">{t(K.summary.attention)}</span><span className="t-lg t-semibold num" data-attention style={{ color: o.attention.length ? 'var(--color-warning)' : undefined }}>{o.attention.length}</span></div></Card>
            <Card><div className="stack gap-0"><span className="t-xs t-muted">{t(K.summary.locked)}</span><span className="t-lg t-semibold num" data-locked style={{ color: o.counts.locked ? 'var(--color-error)' : undefined }}>{o.counts.locked}</span></div></Card>
          </div>
        )}
        <Tabs label={t(K.tab.label)} value={s.tab} onChange={(id) => s.setTab(id as SecurityTab)} items={TABS.map((id) => ({ id, label: t(`security.tab.${id}`) }))} />
        {s.tab === 'overview' && o && <OverviewTab s={s} o={o} t={t} lang={i18n.language} />}
        {s.tab === 'accounts' && <AccountsTab s={s} t={t} lang={i18n.language} />}
        {s.tab === 'events' && <EventsTab s={s} t={t} lang={i18n.language} />}
        {s.tab === 'exceptions' && <ExceptionsTab s={s} t={t} lang={i18n.language} />}
        {s.tab === 'policy' && o && <PolicyTab s={s} o={o} t={t} lang={i18n.language} />}
        <p className="t-xs t-muted" data-placeholder-note>{t(K.note.placeholders)}</p>
      </div>
      <AccountSheet s={s} t={t} lang={i18n.language} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ overview */

function OverviewTab({ s, o, t, lang }: { s: SecurityState; o: SecurityOverview; t: T; lang: string }) {
  const c = o.config;
  return (
    <div className="stack gap-5">
      <Section title={t(K.overview.attention)} hint={t(K.overview.attentionHint)}>
        {o.attention.length === 0 ? <p className="t-sm" data-clear>{t(K.overview.clear)}</p> : (
          <div className="grid-auto" data-attention-list>
            {o.attention.map((a) => (
              <Card key={`${a.kind}:${a.id}`} onClick={() => (a.kind === 'request' || a.kind === 'exception_ending' ? s.setTab('exceptions') : s.openAccount(a.userId))}>
                <div className="stack gap-1" data-attention-item={a.kind}>
                  <span className="row between" style={{ gap: 8, alignItems: 'center' }}><span className="t-sm t-semibold">{a.name}</span><Badge tone={a.kind === 'locked' || a.kind === 'failures' ? 'error' : 'warning'}>{t(`security.attention.${a.kind}`)}</Badge></span>
                  <span className="t-xs t-muted">{t(`security.attention.${a.kind}Hint`, { date: formatDate(a.at, lang), ago: ago(t, a.at) })}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>
      <Section title={t(K.overview.second)} hint={t(K.overview.secondHint)}>
        <div className="grid-auto" data-roles>
          {o.roles.map((r) => (
            <Card key={r.role}>
              <div className="stack gap-2" data-role={r.role}>
                <span className="row between" style={{ gap: 8, alignItems: 'center' }}><span className="t-sm t-semibold">{t(`security.role.${r.role}`)}</span><Badge tone={r.required ? 'success' : 'neutral'}>{r.required ? t(K.overview.required) : t(K.overview.optional)}</Badge></span>
                <Line label={t(K.overview.setUp)} value={t(K.overview.xOfY, { x: r.enrolled, y: r.total })} strong />
                {r.required && r.inGrace > 0 && <Line label={t(K.overview.inGrace)} value={t(K.overview.people, { count: r.inGrace })} />}
                {r.excepted > 0 && <Line label={t(K.overview.excepted)} value={t(K.overview.people, { count: r.excepted })} />}
                {r.blocked > 0 && <Line label={t(K.overview.blocked)} value={<span style={{ color: 'var(--color-error)' }}>{t(K.overview.people, { count: r.blocked })}</span>} />}
                {r.required && r.since && <span className="t-xs t-muted">{t(K.overview.since, { date: formatDate(r.since, lang), days: r.graceDays })}</span>}
              </div>
            </Card>
          ))}
        </div>
      </Section>
      <Section title={t(K.overview.rules)} hint={t(K.overview.rulesHint, { version: o.version, date: formatDate(o.effectiveFrom, lang) })}>
        <Card>
          <div className="stack gap-2" data-rules-now>
            <Line label={t(K.policy.signIn.title)} value={t(K.policy.signIn.summary, { n: c.signIn.maxFailed, w: c.signIn.failedWindowMin, p: c.signIn.lockoutMin })} />
            <Line label={t(K.policy.password.title)} value={t(K.policy.password.summary, { n: c.password.minLength })} />
            <Line label={t(K.policy.sessions.admin)} value={t(K.policy.sessions.summary, { idle: c.sessions.admin.idleMinutes, hours: c.sessions.admin.maxHours })} />
            <div><Button size="sm" variant="secondary" onClick={() => s.setTab('policy')}>{t(K.overview.change)}</Button></div>
          </div>
        </Card>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ accounts */

function AccountsTab({ s, t }: { s: SecurityState; t: T; lang: string }) {
  const STATES = ['all', 'attention', 'no2fa', 'locked', 'flagged'] as const;
  return (
    <div className="stack gap-3">
      <div className="stack gap-2 sticky-under-shell" style={{ background: 'var(--color-bg)', paddingBlock: 8 }}>
        <Input value={s.af.q} placeholder={t(K.accounts.search)} aria-label={t(K.accounts.search)} data-f="account-search" onChange={(e) => s.setAf({ ...s.af, q: e.target.value })} />
        <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <Select value={s.af.role ?? 'all'} aria-label={t(K.accounts.allRoles)} data-f="account-role" onChange={(e) => s.setAf({ ...s.af, role: e.target.value as SecRole | 'all' })} style={{ width: 'auto', minWidth: 140 }}>
            <option value="all">{t(K.accounts.allRoles)}</option>
            {SEC_ROLES.map((r) => <option key={r} value={r}>{t(`security.role.${r}`)}</option>)}
          </Select>
          {STATES.map((st) => <Chip key={st} pressed={s.af.state === st} onClick={() => s.setAf({ ...s.af, state: st })}>{t(`security.accounts.state.${st}`)}</Chip>)}
          <span className="t-xs t-muted" data-count={s.total}>{t(K.accounts.count, { count: s.total })}</span>
        </div>
      </div>
      {s.listLoad === 'loading' && s.rows.length === 0 ? <LoadingState label={t(K.loading)} variant="list" rows={4} /> : s.listLoad === 'error' && s.rows.length === 0 ? <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.retryList()} /> : s.rows.length === 0 ? (
        <EmptyState title={t(K.accounts.empty)} body={t(K.accounts.emptyHint)} actionLabel={t(K.accounts.clear)} onAction={() => s.setAf({ q: '', role: 'all', state: 'all' })} />
      ) : (
        <div className="grid-auto" data-accounts>
          {s.rows.map((r) => (
            <Card key={r.userId} onClick={() => s.openAccount(r.userId)}>
              <div className="stack gap-2" data-account={r.userId}>
                <div className="row between" style={{ alignItems: 'center', gap: 8 }}><span className="t-sm t-semibold">{r.name}</span><span className="t-xs t-muted num">{r.phoneMasked}</span></div>
                <span className="row gap-1 wrap">
                  <Badge tone="neutral">{t(`security.role.${r.role}`)}</Badge>
                  <Badge tone={TF_TONE[r.twoFactor]}>{t(`security.tf.${r.twoFactor}`)}</Badge>
                  {r.locked && <Badge tone="error">{t(K.accounts.locked)}</Badge>}
                  {r.flagged > 0 && <Badge tone="warning">{t(K.accounts.flagged, { count: r.flagged })}</Badge>}
                </span>
                <span className="t-xs t-muted">{t(K.accounts.sessions, { count: r.active })}{r.lastActiveAt ? ` · ${t(K.accounts.lastSeen, { when: ago(t, r.lastActiveAt) })}` : ''}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
      {s.rows.length < s.total && <div><Button variant="secondary" data-act="accounts-more" onClick={() => void s.moreRows()}>{t(K.accounts.more)}</Button></div>}
    </div>
  );
}

type Pending = { kind: 'revoke' | 'others' | 'lost' | 'place_me' | 'place_not' | 'cancel_recovery' | 'grant'; sessionId?: string } | null;

function SessionCard({ x, t, lang, onRevoke, onPlace }: { x: AuthSessionView; t: T; lang: string; onRevoke: () => void; onPlace: (v: 'me' | 'not_me') => void }) {
  const live = x.status === 'active';
  return (
    <Card>
      <div className="stack gap-2" data-session={x.id} data-status={x.status} data-place={x.place}>
        <div className="row between wrap" style={{ gap: 8, alignItems: 'center' }}>
          <span className="row gap-2" style={{ alignItems: 'center' }}><DeviceMobile size={18} aria-hidden="true" color="var(--color-accent-secondary)" /><span className="t-sm t-semibold">{x.deviceLabel}</span></span>
          <span className="row gap-1 wrap">
            {x.isCurrent && <Badge tone="accent">{t(K.session.thisDevice)}</Badge>}
            <Badge tone={live ? 'success' : 'neutral'}>{t(`security.session.status.${x.status}`)}</Badge>
            {x.simulated && <Badge tone="neutral">{t(K.session.simulated)}</Badge>}
          </span>
        </div>
        <span className="t-xs t-muted">{x.city ?? t(K.session.noPlace)}{x.ipMasked ? ` · ${x.ipMasked}` : ''} · {t(K.session.opened, { date: formatDateTime(x.openedAt, lang) })}</span>
        <span className="t-xs t-muted">{live ? t(K.session.active, { when: ago(t, x.lastActiveAt) }) : t(K.session.ended, { when: x.endedAt ? formatDateTime(x.endedAt, lang) : '', by: x.endedBy ?? '', reason: x.endReason ? t(`security.session.reason.${x.endReason}`, { defaultValue: x.endReason }) : '' })}</span>
        {x.place === 'new' && live && <p className="t-xs" data-new-place style={{ color: 'var(--color-warning)' }}><ShieldWarning size={12} aria-hidden="true" /> {t(K.session.newPlace, { city: x.city ?? '' })}</p>}
        {x.place === 'confirmed' && <span className="t-xs t-muted">{t(K.session.confirmed, { by: x.placeBy ?? '' })}</span>}
        {x.place === 'denied' && <span className="t-xs" style={{ color: 'var(--color-error)' }}>{t(K.session.denied, { by: x.placeBy ?? '' })}</span>}
        {live && (
          <div className="row gap-2 wrap">
            {x.place === 'new' && <><Button size="sm" variant="secondary" data-act="place-me" onClick={() => onPlace('me')}>{t(K.session.itsThem)}</Button><Button size="sm" variant="ghost" data-act="place-not" onClick={() => onPlace('not_me')} style={{ color: 'var(--color-error)' }}>{t(K.session.notThem)}</Button></>}
            <Button size="sm" variant="ghost" data-act="revoke" icon={<SignOut size={14} />} onClick={onRevoke} style={{ color: 'var(--color-error)' }}>{t(K.session.revoke)}</Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function AccountSheet({ s, t, lang }: { s: SecurityState; t: T; lang: string }) {
  const toast = useToast();
  const a = s.account;
  const [pending, setPending] = useState<Pending>(null);
  const [note, setNote] = useState('');
  const [until, setUntil] = useState(todayPlus(30));
  const [problem, setProblem] = useState<string | null>(null);
  const [method, setMethod] = useState<'call_back_known' | 'in_person' | 'video_call' | 'reference'>('call_back_known');
  const [rnote, setRnote] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [issued, setIssued] = useState<RecoveryIssued | null>(null);
  const [demo, setDemo] = useState(false);
  const [dCity, setDCity] = useState('Lucknow');
  const [dDevice, setDDevice] = useState('Chrome · Android');
  useEffect(() => { setPending(null); setNote(''); setProblem(null); setRnote(''); setNewPhone(''); setIssued(null); setDemo(false); }, [s.accountId]);
  if (!s.accountId) return <Sheet open={false} onClose={() => s.openAccount(null)} title="" closeLabel={t(K.close)}>{null}</Sheet>;
  const title = a ? a.name : t(K.loading);
  const reset = () => { setPending(null); setNote(''); setProblem(null); };
  const need = pending?.kind === 'lost' || pending?.kind === 'grant' ? NOTE_MIN : REASON_MIN;
  const confirmPending = async (): Promise<void> => {
    if (!a || !pending) return;
    setProblem(null);
    const r = pending.kind === 'revoke' ? await s.revoke(pending.sessionId as string, note)
      : pending.kind === 'others' ? await s.revokeOthers(a.userId, note, s.currentSessionId)
      : pending.kind === 'lost' ? await s.lost({ accountId: a.userId, note })
      : pending.kind === 'place_me' ? await s.confirmPlace(pending.sessionId as string, 'me', note)
      : pending.kind === 'place_not' ? await s.confirmPlace(pending.sessionId as string, 'not_me', note)
      : pending.kind === 'cancel_recovery' ? await s.cancelRecovery(a.recovery?.id as string, note)
      : await s.grant({ accountId: a.userId, until: new Date(`${until}T23:59:00`).toISOString(), reason: note });
    if (r.ok) { toast.push(t(`security.done.${pending.kind}`)); reset(); } else setProblem(r.problem);
  };
  const startRecovery = async (): Promise<void> => {
    if (!a) return;
    setProblem(null);
    const r = await s.startRecovery({ accountId: a.userId, method, note: rnote, newPhone: newPhone.trim() || undefined });
    if (r.ok) { setIssued(r.value); setRnote(''); setNewPhone(''); } else setProblem(r.problem);
  };
  const live = a ? a.sessions.filter((x) => x.status === 'active') : [];
  const danger = pending?.kind === 'revoke' || pending?.kind === 'others' || pending?.kind === 'lost' || pending?.kind === 'place_not';
  return (
    <Sheet open onClose={() => s.openAccount(null)} title={title} closeLabel={t(K.close)}>
      {!a ? (s.accountLoad === 'error' ? <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.refresh()} /> : <LoadingState label={t(K.loading)} variant="list" rows={3} />) : (
        <div className="stack gap-5" data-account-sheet={a.userId}>
          <div className="stack gap-1">
            <span className="row gap-1 wrap"><Badge tone="neutral">{t(`security.role.${a.role}`)}</Badge><Badge tone={TF_TONE[a.twoFactor]}>{t(`security.tf.${a.twoFactor}`)}</Badge>{a.locked && <Badge tone="error">{t(K.accounts.locked)}</Badge>}{a.isSelf && <Badge tone="accent">{t(K.account.you)}</Badge>}</span>
            <span className="t-xs t-muted num">{a.phoneMasked}{a.city ? ` · ${a.city}` : ''}</span>
          </div>

          {a.lock && a.locked && (
            <Section title={t(K.account.lockTitle)}>
              <p className="t-sm" data-lock style={{ color: 'var(--color-error)' }}><LockKey size={14} aria-hidden="true" /> {t(K.account.lockLine, { reason: t(`security.lock.reason.${a.lock.reason}`), date: formatDateTime(a.lock.since, lang), by: a.lock.byName })}</p>
              <p className="t-xs t-muted">{a.lock.note}</p>
              {a.recovery && a.recovery.status === 'issued' ? (
                <div className="stack gap-2" data-recovery="issued">
                  <p className="t-sm">{t(K.account.recoveryIssued, { code: a.recovery.code, date: formatDateTime(a.recovery.expiresAt, lang) })}</p>
                  {a.recovery.newPhoneMasked && <p className="t-xs t-muted">{t(K.account.newNumber, { old: a.recovery.oldPhoneMasked, next: a.recovery.newPhoneMasked })}</p>}
                  <div><Button size="sm" variant="ghost" data-act="cancel-recovery" style={{ color: 'var(--color-error)' }} onClick={() => { setProblem(null); setPending({ kind: 'cancel_recovery' }); }}>{t(K.account.cancelRecovery)}</Button></div>
                </div>
              ) : null}
              {!issued && (!a.recovery || a.recovery.status !== 'issued') && (
                <Card>
                  <div className="stack gap-3" data-recovery-form>
                    <span className="t-sm t-semibold">{t(K.account.recoveryTitle)}</span>
                    <p className="t-xs">{t(K.account.recoveryHint)}</p>
                    <Field label={t(K.account.method)}>{(p) => <Select id={p.id} value={method} data-f="recovery-method" onChange={(e) => setMethod(e.target.value as typeof method)}>{(['call_back_known', 'in_person', 'video_call', 'reference'] as const).map((m) => <option key={m} value={m}>{t(`security.method.${m}`)}</option>)}</Select>}</Field>
                    <Field label={t(K.account.recoveryNote)} hint={`${lettersOf(rnote)}/${NOTE_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={rnote} data-f="recovery-note" onChange={(e) => setRnote(e.target.value)} />}</Field>
                    <Field label={t(K.account.newPhone)} hint={t(K.account.newPhoneHint)}>{(p) => <Input id={p.id} inputMode="tel" value={newPhone} data-f="recovery-phone" onChange={(e) => setNewPhone(e.target.value)} />}</Field>
                    {!pending && <Problem t={t} code={problem} />}
                    <Button data-act="recovery-start" disabled={lettersOf(rnote) < NOTE_MIN} loading={s.busy} onClick={() => void startRecovery()}>{t(K.account.recoveryStart)}</Button>
                  </div>
                </Card>
              )}
              {issued && (
                <Card>
                  <div className="stack gap-2" data-issued-code>
                    <span className="t-sm t-semibold">{t(K.account.codeTitle)}</span>
                    <span className="t-lg t-semibold num" style={{ letterSpacing: '0.2em', fontFamily: 'var(--font-mono)' }} data-plain-code>{issued.plain}</span>
                    <p className="t-xs">{t(K.account.codeOnce, { date: formatDateTime(issued.expiresAt, lang) })}</p>
                    {issued.newPhoneMasked && <p className="t-xs t-muted">{t(K.account.codePhone, { phone: issued.newPhoneMasked })}</p>}
                    <div><Button size="sm" variant="secondary" onClick={() => setIssued(null)}>{t(K.account.codeDone)}</Button></div>
                  </div>
                </Card>
              )}
            </Section>
          )}

          <Section title={t(K.account.sessionsTitle, { count: live.length })} hint={t(K.account.sessionsHint)}>
            {a.sessions.length === 0 ? <p className="t-sm">{t(K.account.noSessions)}</p> : <div className="stack gap-2" data-sessions-list>{a.sessions.map((x) => <SessionCard key={x.id} x={x} t={t} lang={lang} onRevoke={() => { setProblem(null); setPending({ kind: 'revoke', sessionId: x.id }); }} onPlace={(v) => { setProblem(null); setPending({ kind: v === 'me' ? 'place_me' : 'place_not', sessionId: x.id }); }} />)}</div>}
            {live.length > (a.isSelf ? 1 : 0) && <div><Button size="sm" variant="secondary" data-act="revoke-others" icon={<SignOut size={14} />} style={{ color: 'var(--color-error)' }} onClick={() => { setProblem(null); setPending({ kind: 'others' }); }}>{a.isSelf ? t(K.account.signOutOthers) : t(K.account.signOutAll)}</Button></div>}
          </Section>

          {pending && (
            <Card>
              <div className="stack gap-3" data-confirm={pending.kind}>
                <span className="t-sm t-semibold" style={{ color: danger ? 'var(--color-error)' : undefined }}>{t(`security.confirm.${pending.kind}.title`)}</span>
                <p className="t-xs">{t(`security.confirm.${pending.kind}.body`, { name: a.name })}</p>
                {pending.kind === 'grant' && <Field label={t(K.exceptions.until)} hint={t(K.exceptions.untilHint, { days: EXCEPTION_MAX_DAYS })}>{(p) => <Input id={p.id} type="date" min={todayPlus(1)} max={todayPlus(EXCEPTION_MAX_DAYS)} value={until} data-f="grant-until" onChange={(e) => setUntil(e.target.value)} />}</Field>}
                <Field label={t(`security.confirm.${pending.kind}.why`)} hint={`${lettersOf(note)}/${need}`}>{(p) => <TextArea id={p.id} rows={2} value={note} data-f="confirm-note" onChange={(e) => setNote(e.target.value)} />}</Field>
                <Problem t={t} code={problem} />
                <div className="row gap-2"><Button variant="ghost" onClick={reset}>{t(K.cancel)}</Button><Button className="grow" data-act="confirm-do" disabled={lettersOf(note) < need} loading={s.busy} onClick={() => void confirmPending()} style={danger ? { background: 'var(--color-error)', color: 'var(--color-surface)' } : undefined}>{t(`security.confirm.${pending.kind}.go`)}</Button></div>
              </div>
            </Card>
          )}

          <Section title={t(K.account.secondTitle)}>
            <Line label={t(K.account.secondState)} value={<Badge tone={TF_TONE[a.twoFactor]}>{t(`security.tf.${a.twoFactor}`)}</Badge>} />
            {a.enrolment && <Line label={t(K.account.secondMethod)} value={`${t(`security.tfMethod.${a.enrolment.method}`)}${a.enrolment.secondPhoneMasked ? ` · ${a.enrolment.secondPhoneMasked}` : ''} · ${formatDate(a.enrolment.enrolledAt, lang)}`} />}
            {a.graceEnds && <Line label={t(K.account.graceEnds)} value={formatDate(a.graceEnds, lang)} />}
            {a.exceptions.slice(0, 3).map((x) => <p key={x.id} className="t-xs t-muted" data-exception={x.status}>{x.code} · {t(`security.exStatus.${x.status}`)}{x.until ? ` · ${t(K.exceptions.untilLine, { date: formatDate(x.until, lang) })}` : ''}</p>)}
            {(a.twoFactor === 'grace' || a.twoFactor === 'blocked') && !pending && <div><Button size="sm" variant="secondary" data-act="grant-open" onClick={() => { setProblem(null); setPending({ kind: 'grant' }); }}>{t(K.account.grant)}</Button></div>}
          </Section>

          <Section title={t(K.account.deviceTitle)}>
            {a.isSelf ? <p className="t-xs t-muted">{t(K.account.deviceSelf)}</p> : a.locked ? <p className="t-xs t-muted">{t(K.account.alreadyLocked)}</p> : (
              <>
                <p className="t-xs">{t(K.account.deviceHint)}</p>
                <div><Button size="sm" variant="secondary" data-act="lost-open" icon={<WarningCircle size={14} />} style={{ color: 'var(--color-error)' }} onClick={() => { setProblem(null); setPending({ kind: 'lost' }); }}>{t(K.account.lost)}</Button></div>
              </>
            )}
          </Section>

          <Section title={t(K.account.eventsTitle)}>
            {a.events.length === 0 ? <p className="t-sm">{t(K.events.empty)}</p> : <div className="stack gap-1" data-account-events>{a.events.slice(0, 8).map((e) => <EventLine key={e.id} e={e} t={t} lang={lang} />)}</div>}
            <div><Button size="sm" variant="ghost" onClick={() => { s.setEvAccount(a.userId); s.setTab('events'); }}>{t(K.account.allEvents)}</Button></div>
          </Section>

          {!a.isSelf && (
            <Section title={t(K.demo.title)} hint={t(K.demo.hint)}>
              {!demo ? <div><Button size="sm" variant="ghost" data-act="demo-open" onClick={() => setDemo(true)}>{t(K.demo.open)}</Button></div> : (
                <Card>
                  <div className="stack gap-3" data-demo-tools>
                    <Field label={t(K.demo.city)}>{(p) => <Input id={p.id} value={dCity} data-f="demo-city" onChange={(e) => setDCity(e.target.value)} />}</Field>
                    <Field label={t(K.demo.device)}>{(p) => <Input id={p.id} value={dDevice} data-f="demo-device" onChange={(e) => setDDevice(e.target.value)} />}</Field>
                    <div className="row gap-2 wrap">
                      <Button size="sm" variant="secondary" data-act="demo-signin" icon={<Plus size={14} />} loading={s.busy} onClick={() => void s.simulate({ accountId: a.userId, city: dCity.trim() || null, device: dDevice, outcome: 'success' })}>{t(K.demo.signIn)}</Button>
                      <Button size="sm" variant="secondary" data-act="demo-fail" loading={s.busy} onClick={() => void s.simulate({ accountId: a.userId, city: null, device: dDevice, outcome: 'failure' })}>{t(K.demo.fail)}</Button>
                    </div>
                    {a.failures.paused && a.failures.until && <p className="t-xs" data-paused style={{ color: 'var(--color-warning)' }}>{t(K.demo.paused, { when: formatDateTime(a.failures.until, lang) })}</p>}
                  </div>
                </Card>
              )}
            </Section>
          )}
        </div>
      )}
    </Sheet>
  );
}

function EventLine({ e, t, lang }: { e: SecurityEvent; t: T; lang: string }) {
  return (
    <div className="stack gap-0" data-event={e.kind} data-flagged={!!e.flagged && !e.resolved}>
      <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
        <Badge tone={SEV_TONE[e.severity]}>{t(`security.eventKind.${e.kind}`, { defaultValue: e.kind })}</Badge>
        <span className="t-xs t-muted">{formatDateTime(e.at, lang)}</span>
        {e.flagged && !e.resolved && <Badge tone="warning">{t(K.events.open)}</Badge>}
        {e.resolved && <span className="t-xs t-muted">{t(K.events.resolved, { by: e.resolved.byName })}</span>}
      </span>
      <span className="t-xs">{[e.userName !== '—' ? e.userName : '', e.deviceLabel, e.city].filter(Boolean).join(' · ')}{e.detail ? ` · ${e.detail}` : ''}{e.byName ? ` · ${e.byName}` : ''}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ events */

function EventsTab({ s, t, lang }: { s: SecurityState; t: T; lang: string }) {
  const groups = ['all', ...Object.keys(EVENT_GROUPS)];
  const ev = s.events;
  const SEVS = ['all', 'info', 'notice', 'warning', 'critical'] as const;
  return (
    <div className="stack gap-3">
      <div className="stack gap-2 sticky-under-shell" style={{ background: 'var(--color-bg)', paddingBlock: 8 }}>
        <Input value={s.ef.q} placeholder={t(K.events.search)} aria-label={t(K.events.search)} data-f="event-search" onChange={(e) => s.setEf({ ...s.ef, q: e.target.value })} />
        <div className="row gap-2 wrap">{groups.map((g) => <Chip key={g} pressed={s.ef.group === g} onClick={() => s.setEf({ ...s.ef, group: g })}>{t(`security.events.group.${g}`)}{ev ? ` ${ev.counts.byGroup[g] ?? 0}` : ''}</Chip>)}</div>
        <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <Select value={s.ef.severity ?? 'all'} aria-label={t(K.events.severity)} data-f="event-severity" onChange={(e) => s.setEf({ ...s.ef, severity: e.target.value as typeof SEVS[number] })} style={{ width: 'auto', minWidth: 140 }}>{SEVS.map((v) => <option key={v} value={v}>{v === 'all' ? t(K.events.anySeverity) : t(`security.events.sev.${v}`)}</option>)}</Select>
          <Chip pressed={s.ef.flagged} onClick={() => s.setEf({ ...s.ef, flagged: !s.ef.flagged })}>{t(K.events.flaggedOnly)}{ev ? ` ${ev.counts.flagged}` : ''}</Chip>
          {s.evAccount && <Chip pressed onClick={() => s.setEvAccount(null)}>{t(K.events.oneAccount)} ×</Chip>}
        </div>
      </div>
      {s.evLoad === 'loading' && !ev ? <LoadingState label={t(K.loading)} variant="list" rows={4} /> : s.evLoad === 'error' && !ev ? <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.retryEvents()} /> : !ev || ev.rows.length === 0 ? <EmptyState title={t(K.events.empty)} body={t(K.events.emptyHint)} actionLabel={t(K.accounts.clear)} onAction={() => s.setEf({ group: 'all', severity: 'all', flagged: false, q: '' })} /> : (
        <div className="stack gap-3" data-events>
          <span className="t-xs t-muted" data-count={ev.total}>{t(K.events.count, { count: ev.total })}</span>
          {ev.rows.map((e) => (
            <Card key={e.id} onClick={e.userId ? () => s.openAccount(e.userId as string) : undefined}><EventLine e={e} t={t} lang={lang} /></Card>
          ))}
          {ev.rows.length < ev.total && <div><Button variant="secondary" data-act="events-more" onClick={() => void s.moreEvents()}>{t(K.events.more)}</Button></div>}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ exceptions */

function ExceptionCard({ x, s, t, lang }: { x: TwoFactorException; s: SecurityState; t: T; lang: string }) {
  const toast = useToast();
  const [mode, setMode] = useState<null | 'grant' | 'decline' | 'end'>(null);
  const [note, setNote] = useState('');
  const [until, setUntil] = useState(todayPlus(30));
  const [problem, setProblem] = useState<string | null>(null);
  const need = mode === 'grant' ? NOTE_MIN : REASON_MIN;
  const go = async (): Promise<void> => {
    setProblem(null);
    const r = mode === 'end' ? await s.endException(x.id, note) : await s.decide(x.id, mode === 'grant' ? { decision: 'grant', until: new Date(`${until}T23:59:00`).toISOString(), note } : { decision: 'decline', note });
    if (r.ok) { toast.push(t(`security.done.ex_${mode}`)); setMode(null); setNote(''); } else setProblem(r.problem);
  };
  const live = x.status === 'active';
  return (
    <Card>
      <div className="stack gap-2" data-exception={x.id} data-status={x.status} style={s.exceptionId === x.id ? { outline: '2px solid var(--color-accent-primary)', borderRadius: 16 } : undefined}>
        <div className="row between wrap" style={{ gap: 8, alignItems: 'center' }}><span className="t-sm t-semibold">{x.userName}</span><span className="row gap-1 wrap"><Badge tone="neutral">{t(`security.role.${x.role}`)}</Badge><Badge tone={x.status === 'active' ? 'warning' : x.status === 'requested' ? 'accent' : 'neutral'}>{t(`security.exStatus.${x.status}`)}</Badge></span></div>
        <span className="t-xs t-muted">{x.code} · {t(K.exceptions.asked, { date: formatDate(x.requestedAt, lang), by: x.requestedBy === 'person' ? t(K.exceptions.byPerson) : x.requestedBy })}</span>
        <p className="t-sm">{x.reason}</p>
        {x.decisionNote && <p className="t-xs t-muted">{t(K.exceptions.decided, { by: x.decidedByName ?? '', date: x.decidedAt ? formatDate(x.decidedAt, lang) : '' })}: {x.decisionNote}</p>}
        {live && x.until && <p className="t-xs" data-until>{t(K.exceptions.untilLine, { date: formatDate(x.until, lang) })} · {t(K.exceptions.controls)}</p>}
        {x.endNote && <p className="t-xs t-muted">{x.endNote}</p>}
        {x.status === 'requested' && !mode && <div className="row gap-2 wrap"><Button size="sm" data-act="ex-grant" onClick={() => setMode('grant')}>{t(K.exceptions.grant)}</Button><Button size="sm" variant="secondary" data-act="ex-decline" onClick={() => setMode('decline')}>{t(K.exceptions.decline)}</Button></div>}
        {live && !mode && <div><Button size="sm" variant="ghost" data-act="ex-end" style={{ color: 'var(--color-error)' }} onClick={() => setMode('end')}>{t(K.exceptions.end)}</Button></div>}
        {mode && (
          <div className="stack gap-2" data-ex-form={mode}>
            {mode === 'grant' && <Field label={t(K.exceptions.until)} hint={t(K.exceptions.untilHint, { days: EXCEPTION_MAX_DAYS })}>{(p) => <Input id={p.id} type="date" min={todayPlus(1)} max={todayPlus(EXCEPTION_MAX_DAYS)} value={until} data-f="ex-until" onChange={(e) => setUntil(e.target.value)} />}</Field>}
            <Field label={t(`security.exceptions.why.${mode}`)} hint={`${lettersOf(note)}/${need}`}>{(p) => <TextArea id={p.id} rows={2} value={note} data-f="ex-note" onChange={(e) => setNote(e.target.value)} />}</Field>
            <Problem t={t} code={problem} />
            <div className="row gap-2"><Button variant="ghost" onClick={() => { setMode(null); setProblem(null); }}>{t(K.cancel)}</Button><Button data-act="ex-do" disabled={lettersOf(note) < need} loading={s.busy} onClick={() => void go()}>{t(`security.exceptions.go.${mode}`)}</Button></div>
          </div>
        )}
      </div>
    </Card>
  );
}

function ExceptionsTab({ s, t, lang }: { s: SecurityState; t: T; lang: string }) {
  const ex = s.exceptions;
  return (
    <div className="stack gap-3">
      <Section title={t(K.exceptions.title)} hint={t(K.exceptions.hint)}>
        <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <Chip pressed={!s.showAllEx} onClick={() => s.setShowAllEx(false)}>{t(K.exceptions.open)}{ex ? ` ${ex.counts.requested + ex.counts.active}` : ''}</Chip>
          <Chip pressed={s.showAllEx} onClick={() => s.setShowAllEx(true)}>{t(K.exceptions.all)}</Chip>
        </div>
        {!ex ? <LoadingState label={t(K.loading)} variant="list" rows={2} /> : ex.rows.length === 0 ? <EmptyState title={t(K.exceptions.empty)} body={t(K.exceptions.emptyHint)} /> : <div className="grid-auto" data-exceptions>{ex.rows.map((x) => <ExceptionCard key={x.id} x={x} s={s} t={t} lang={lang} />)}</div>}
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ policy */

const clone = (c: SecurityConfig): SecurityConfig => JSON.parse(JSON.stringify(c)) as SecurityConfig;
const DRAFT = (uid: string): string => `aiec.securityDraft.${uid}`;

function NumberField({ label, value, onChange, min, max, suffix, f }: { label: string; value: number; onChange: (n: number) => void; min: number; max: number; suffix?: string; f: string }) {
  return <Field label={label} hint={suffix}>{(p) => <Input id={p.id} type="number" min={min} max={max} value={String(value)} data-f={f} onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))} />}</Field>;
}

function PolicyTab({ s, o, t, lang }: { s: SecurityState; o: SecurityOverview; t: T; lang: string }) {
  const toast = useToast();
  const uid = 'draft';
  const [cfg, setCfg] = useState<SecurityConfig>(() => {
    try { const raw = localStorage.getItem(DRAFT(uid)); if (raw) return JSON.parse(raw) as SecurityConfig; } catch { /* no draft */ }
    return clone(o.config);
  });
  const [pv, setPv] = useState<SecurityConfigPreview | null>(null);
  const [reason, setReason] = useState('');
  const [ack, setAck] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const cur = o.config;
  const changed = JSON.stringify(cfg) !== JSON.stringify(cur);
  const weak = changed ? weakenings(cur, cfg) : [];
  useEffect(() => { try { if (changed) localStorage.setItem(DRAFT(uid), JSON.stringify(cfg)); else localStorage.removeItem(DRAFT(uid)); } catch { /* storage may be unavailable */ } }, [cfg, changed]);
  useEffect(() => {
    if (!changed) { setPv(null); return undefined; }
    let live = true;
    const id = window.setTimeout(() => { void s.previewConfig(cfg).then((r) => { if (live) { if (r.ok) { setPv(r.value); setProblem(null); } else setProblem(r.problem); } }); }, 300);
    return () => { live = false; window.clearTimeout(id); };
  }, [cfg, changed]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (fn: (c: SecurityConfig) => void): void => { setCfg((c) => { const n = clone(c); fn(n); return n; }); setAck(false); };
  const needAck = !!pv && pv.weakenings.length > 0;
  const ready = !!pv && pv.problems.length === 0 && lettersOf(reason) >= NOTE_MIN && (!needAck || ack);
  const save = async (): Promise<void> => {
    if (!pv) return;
    setProblem(null);
    const r = await s.saveConfig({ config: cfg, reason, confirmWeaken: ack, token: pv.token });
    if (r.ok) { toast.push(t(K.policy.saved)); setReason(''); setAck(false); setPv(null); setCfg(clone(r.value.config)); } else setProblem(r.problem);
  };
  const discard = (): void => { setCfg(clone(cur)); setPv(null); setReason(''); setAck(false); setProblem(null); };
  return (
    <div className="stack gap-5">
      <p className="t-xs" data-in-force>{t(K.policy.inForce, { version: o.version, date: formatDate(o.effectiveFrom, lang), by: o.byName })}</p>
      <Section title={t(K.policy.second.title)} hint={t(K.policy.second.hint)}>
        <div className="grid-auto" data-policy-roles>
          {SEC_ROLES.map((r) => (
            <Card key={r}>
              <div className="stack gap-2" data-policy-role={r} data-differs={JSON.stringify(cfg.twoFactor[r]) !== JSON.stringify(cur.twoFactor[r])}>
                <span className="t-sm t-semibold">{t(`security.role.${r}`)}</span>
                <Toggle checked={cfg.twoFactor[r].required} disabled={r === 'admin'} onChange={(v) => set((c) => { c.twoFactor[r].required = v; })} label={t(K.policy.second.required)} description={r === 'admin' ? t(K.policy.second.adminLocked) : cfg.twoFactor[r].required ? t(K.policy.second.on) : t(K.policy.second.off)} />
                {cfg.twoFactor[r].required && <NumberField label={t(K.policy.second.grace)} value={cfg.twoFactor[r].graceDays} min={0} max={r === 'admin' ? 7 : 30} suffix={t(K.policy.second.graceHint)} f={`grace-${r}`} onChange={(n) => set((c) => { c.twoFactor[r].graceDays = n; })} />}
              </div>
            </Card>
          ))}
        </div>
      </Section>
      <Section title={t(K.policy.password.title)} hint={t(K.policy.password.hint)}>
        <Card>
          <div className="stack gap-3" data-policy-password>
            <p className="t-sm" data-pw-now>{t(K.policy.password.now, { n: cfg.password.minLength, upper: cfg.password.requireUpper ? t(K.policy.yes) : t(K.policy.no), digit: cfg.password.requireDigit ? t(K.policy.yes) : t(K.policy.no), symbol: cfg.password.requireSymbol ? t(K.policy.yes) : t(K.policy.no) })}</p>
            <NumberField label={t(K.policy.password.min)} value={cfg.password.minLength} min={8} max={64} f="pw-min" onChange={(n) => set((c) => { c.password.minLength = n; })} />
            <Toggle checked={cfg.password.requireUpper} onChange={(v) => set((c) => { c.password.requireUpper = v; })} label={t(K.policy.password.upper)} />
            <Toggle checked={cfg.password.requireDigit} onChange={(v) => set((c) => { c.password.requireDigit = v; })} label={t(K.policy.password.digit)} />
            <Toggle checked={cfg.password.requireSymbol} onChange={(v) => set((c) => { c.password.requireSymbol = v; })} label={t(K.policy.password.symbol)} />
            <NumberField label={t(K.policy.password.rotate)} value={cfg.password.rotateDays} min={0} max={365} suffix={t(K.policy.password.rotateHint)} f="pw-rotate" onChange={(n) => set((c) => { c.password.rotateDays = n; })} />
            <NumberField label={t(K.policy.password.reuse)} value={cfg.password.reuseBlock} min={0} max={10} f="pw-reuse" onChange={(n) => set((c) => { c.password.reuseBlock = n; })} />
            <p className="t-xs t-muted">{t(K.policy.password.scope)}</p>
          </div>
        </Card>
      </Section>
      <Section title={t(K.policy.signIn.title)} hint={t(K.policy.signIn.hint)}>
        <Card>
          <div className="stack gap-3" data-policy-signin>
            <p className="t-sm" data-signin-now>{t(K.policy.signIn.summary, { n: cfg.signIn.maxFailed, w: cfg.signIn.failedWindowMin, p: cfg.signIn.lockoutMin })}</p>
            <NumberField label={t(K.policy.signIn.max)} value={cfg.signIn.maxFailed} min={3} max={10} f="si-max" onChange={(n) => set((c) => { c.signIn.maxFailed = n; })} />
            <NumberField label={t(K.policy.signIn.window)} value={cfg.signIn.failedWindowMin} min={5} max={60} suffix={t(K.policy.minutes)} f="si-window" onChange={(n) => set((c) => { c.signIn.failedWindowMin = n; })} />
            <NumberField label={t(K.policy.signIn.pause)} value={cfg.signIn.lockoutMin} min={5} max={1440} suffix={t(K.policy.minutes)} f="si-pause" onChange={(n) => set((c) => { c.signIn.lockoutMin = n; })} />
          </div>
        </Card>
      </Section>
      <Section title={t(K.policy.sessions.title)} hint={t(K.policy.sessions.hint)}>
        <div className="grid-auto" data-policy-sessions>
          {SEC_ROLES.map((r) => (
            <Card key={r}>
              <div className="stack gap-2" data-policy-session={r}>
                <span className="t-sm t-semibold">{t(`security.role.${r}`)}</span>
                <span className="t-xs" data-session-now={r}>{t(K.policy.sessions.summary, { idle: cfg.sessions[r].idleMinutes, hours: cfg.sessions[r].maxHours })}</span>
                <NumberField label={t(K.policy.sessions.idle)} value={cfg.sessions[r].idleMinutes} min={5} max={43200} suffix={t(K.policy.minutes)} f={`idle-${r}`} onChange={(n) => set((c) => { c.sessions[r].idleMinutes = n; })} />
                <NumberField label={t(K.policy.sessions.max)} value={cfg.sessions[r].maxHours} min={1} max={2160} suffix={t(K.policy.hours)} f={`max-${r}`} onChange={(n) => set((c) => { c.sessions[r].maxHours = n; })} />
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {changed && (
        <Card>
          <div className="stack gap-3" data-policy-review>
            <span className="t-sm t-semibold">{t(K.policy.review.title)}</span>
            <Problem t={t} code={problem} />
            {pv?.problems.map((p) => <p key={p} className="t-sm t-error" role="alert" data-problem={p}>{errText(t, p)}</p>)}
            {pv?.roleEffects.map((e) => <p key={e.role} className="t-sm" data-effect={e.role}>{t(K.policy.review.newlyRequired, { role: t(`security.role.${e.role}`), people: e.people, notEnrolled: e.notEnrolled, date: e.blockedAfter ? formatDate(e.blockedAfter, lang) : '' })}</p>)}
            {pv && pv.sessionsEnding > 0 && <p className="t-sm" data-sessions-ending style={{ color: 'var(--color-warning)' }}>{t(K.policy.review.sessionsEnding, { count: pv.sessionsEnding })}</p>}
            {(pv?.weakenings ?? weak).length > 0 && (
              <div className="stack gap-1" data-weakenings>
                <span className="t-sm t-semibold" style={{ color: 'var(--color-warning)' }}>{t(K.policy.review.weaker)}</span>
                {(pv?.weakenings ?? weak).map((w) => { const [kind, role] = w.split(':'); return <span key={w} className="t-xs" data-weak={w}>{t(`security.weak.${kind}`, { role: role ? t(`security.role.${role}`) : '' })}</span>; })}
              </div>
            )}
            <Field label={t(K.policy.review.reason)} hint={`${lettersOf(reason)}/${NOTE_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={reason} data-f="policy-reason" onChange={(e) => setReason(e.target.value)} />}</Field>
            {needAck && <label className="row gap-2" style={{ alignItems: 'flex-start', minHeight: 44 }}><input type="checkbox" checked={ack} data-f="policy-ack" onChange={(e) => setAck(e.target.checked)} /><span className="t-sm">{t(K.policy.review.confirm)}</span></label>}
            <div className="row gap-2"><Button variant="ghost" data-act="policy-discard" onClick={discard}>{t(K.policy.review.discard)}</Button><Button className="grow" data-act="policy-publish" disabled={!ready} loading={s.busy} onClick={() => void save()}>{t(K.policy.review.publish)}</Button></div>
          </div>
        </Card>
      )}

      <Section title={t(K.policy.history)}>
        <div className="stack gap-2" data-policy-versions>
          {o.history.map((v) => (
            <Card key={v.id}>
              <div className="stack gap-1" data-policy-version={v.version}>
                <span className="row between" style={{ gap: 8 }}><span className="t-sm t-semibold">{t(K.policy.version, { version: v.version })}</span><span className="t-xs t-muted">{formatDate(v.effectiveFrom, lang)} · {v.byName}</span></span>
                <span className="t-xs">{v.reason}</span>
                {v.weakened.length > 0 && <span className="t-xs" style={{ color: 'var(--color-warning)' }}>{t(K.policy.review.weakerLine, { count: v.weakened.length })}</span>}
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
