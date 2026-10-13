import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, Bell, Warning } from '@phosphor-icons/react';
import { Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Sheet, TextArea, Toggle, formatDate, useToast } from '@/design-system';
import type { InternalNotificationsView, InternalTypeView } from '@/data/repository';
import type { InternalChannel, InternalChannelSet, InternalContent, InternalUrgency, Language } from '@/data/types';
import { BODY_MAX, CHANNELS, SAMPLE_VALUES, SUBJECT_MAX, URGENCIES, channelProblems, isBlocking, reducesReach, renderContent, segmentsOf } from '@/features/notifications/internal';
import { INTERNAL_NOTIFICATIONS_KEYS as K, TEMPLATES_ROUTE } from './notification-settings.types';
import { useNotificationSettings } from './useNotificationSettings';
import type { SettingsState, TypeDraft } from './useNotificationSettings';

type T = ReturnType<typeof useTranslation>['t'];
const LANGS: Language[] = ['en', 'hi', 'mr'];
const TONE: Record<InternalUrgency, 'error' | 'warning' | 'neutral'> = { critical: 'error', high: 'warning', routine: 'neutral' };
const nameOf = (t: T, id: string): string => t(id, { defaultValue: id.split('.').slice(-1)[0] ?? id });
const roleName = (t: T, r: string): string => t(`internalNotifications.role.${r}`, { defaultValue: r });
const channelsText = (t: T, c: InternalChannelSet): string => CHANNELS.filter((ch) => c[ch]).map((ch) => t(`internalNotifications.channel.${ch}`)).join(' · ');
const errText = (t: T, code: string) => t(`internalNotifications.error.${code}`, { defaultValue: t(K.error.generic) });
const ago = (iso: string): string => { const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000)); return m < 1 ? '<1 min' : m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`; };
const sameSet = (a: InternalChannelSet, b: InternalChannelSet): boolean => CHANNELS.every((c) => a[c] === b[c]);

/** Screen 183 — Notification Templates & Channels (staff-facing). Settings layout: sections with their current values shown, urgency deciding the channels, a role-by-channel matrix that grows with the business, trigger frequency beside the urgency, a length-checked preview per channel and a test-send. */
export function NotificationSettingsScreen() {
  const { t, i18n } = useTranslation();
  const s = useNotificationSettings();
  const nav = useNavigate();
  const v = s.view;
  const head = <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" data-refresh onClick={() => void s.refresh()} aria-label={t(K.refresh)}><ArrowsClockwise size={18} /></Button>} />;
  if (s.load === 'loading' && !v) return <Screen width="narrow">{head}<LoadingState label={t(K.loading)} variant="list" rows={5} /></Screen>;
  if (s.load === 'error' && !v) return <Screen width="narrow">{head}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /></Screen>;
  if (!v) return null;
  return (
    <Screen width="narrow">
      {head}
      <div className="stack gap-4">
        {s.offline && <p className="t-xs t-muted" role="status" data-offline>{t(K.error.body)}</p>}
        <Card>
          <div className="stack gap-2" data-apart>
            <span className="t-sm t-semibold">{t(K.apart.title)}</span>
            <p className="t-xs">{t(K.apart.body)}</p>
            <div><Button size="sm" variant="secondary" data-act="templates" onClick={() => nav(TEMPLATES_ROUTE)}>{t(K.apart.open)}</Button></div>
          </div>
        </Card>
        <Stats v={v} t={t} />
        <Defaults s={s} v={v} t={t} />
        <Types s={s} v={v} t={t} />
        <Log v={v} t={t} lang={i18n.language} />
        <p className="t-xs t-muted" data-demo-note>{t(K.demo.note)}</p>
        <p className="t-xs t-muted" data-placeholder-note>{t(K.notice.placeholders)}</p>
      </div>
      <Detail s={s} v={v} t={t} lang={i18n.language} />
    </Screen>
  );
}

function Stats({ v, t }: { v: InternalNotificationsView; t: T }) {
  const items: [string, number, string][] = [[K.stat.types, v.totals.types, 'types'], [K.stat.critical, v.totals.critical, 'critical'], [K.stat.sent, v.totals.deliveries24h, 'sent'], [K.stat.noisy, v.totals.noisy, 'noisy']];
  return <div className="row gap-4 wrap" data-stats>{items.map(([label, n, id]) => <span key={id} className="stack gap-0" data-stat={id}><span className="t-lg t-semibold" style={{ fontFamily: 'var(--font-mono)' }}>{n}</span><span className="t-xs t-muted">{t(label)}</span></span>)}</div>;
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="stack gap-2">
      <h2 className="t-md t-semibold" style={{ borderTop: '1px solid var(--color-accent-primary)', paddingTop: 12 }}>{title}</h2>
      {hint && <p className="t-xs t-muted">{hint}</p>}
      {children}
    </section>
  );
}

function Defaults({ s, v, t }: { s: SettingsState; v: InternalNotificationsView; t: T }) {
  const toast = useToast();
  const d = s.defaults ?? v.urgencyChannels;
  const dirty = URGENCIES.some((u) => !sameSet(d[u], v.urgencyChannels[u]));
  const reduces = (['critical', 'high'] as const).some((u) => reducesReach(v.urgencyChannels[u], d[u]));
  const [confirm, setConfirm] = useState(false);
  const [ack, setAck] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const set = (u: InternalUrgency, ch: InternalChannel, on: boolean) => s.editDefaults({ ...d, [u]: { ...d[u], [ch]: on } });
  const save = async () => { setProblem(null); const r = await s.saveDefaults(reduces); if (r.ok) { setConfirm(false); setAck(false); toast.push(t(K.defaults.saved)); } else setProblem(r.problem); };
  return (
    <Section title={t(K.defaults.title)} hint={t(K.defaults.body)}>
      {URGENCIES.map((u) => (
        <Card key={u}>
          <div className="stack gap-2" data-urgency={u}>
            <span className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}><Badge tone={TONE[u]}>{t(`internalNotifications.urgency.${u}`)}</Badge><span className="t-xs t-muted">{t(`internalNotifications.urgency.hint.${u}`)}</span></span>
            <span className="t-xs" data-current>{t(K.defaults.current, { channels: channelsText(t, v.urgencyChannels[u]) })}</span>
            {CHANNELS.map((ch) => <Toggle key={ch} checked={d[u][ch]} disabled={ch === 'inApp'} onChange={(on) => set(u, ch, on)} label={t(`internalNotifications.channel.${ch}`)} description={ch === 'inApp' ? t(K.channel.always) : undefined} />)}
          </div>
        </Card>
      ))}
      {dirty && <div><Button data-act="save-defaults" loading={s.busy} onClick={() => (reduces ? setConfirm(true) : void save())}>{t(K.defaults.save)}</Button></div>}
      {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
      <Sheet open={confirm} onClose={() => setConfirm(false)} title={t(K.confirm.title)} closeLabel={t(K.close)}>
        <div className="stack gap-3" data-confirm>
          <p className="t-sm">{t(K.confirm.body)}</p>
          <Checkbox checked={ack} onChange={setAck} label={t(K.confirm.check)} />
          <div className="row gap-2"><Button variant="ghost" onClick={() => setConfirm(false)}>{t(K.confirm.no)}</Button><Button className="grow" data-act="confirm-yes" disabled={!ack} loading={s.busy} onClick={() => void save()}>{t(K.confirm.yes)}</Button></div>
        </div>
      </Sheet>
    </Section>
  );
}

function Types({ s, v, t }: { s: SettingsState; v: InternalNotificationsView; t: T }) {
  const q = s.query.trim().toLowerCase();
  const shown = v.types.filter((x) => !q || nameOf(t, x.typeId).toLowerCase().includes(q) || x.typeId.toLowerCase().includes(q));
  return (
    <Section title={t(K.types.title)}>
      <Input value={s.query} placeholder={t(K.types.search)} aria-label={t(K.types.search)} data-f="search" onChange={(e) => s.setQuery(e.target.value)} />
      {shown.length === 0 && <EmptyState title={t(K.types.empty)} body="" />}
      {shown.map((x) => {
        const goes = Object.entries(x.roles).filter(([, c]) => CHANNELS.some((ch) => c[ch]));
        return (
          <button key={x.typeId} type="button" className="ds-card tappable" data-type={x.typeId} onClick={() => s.open(x.typeId)} style={{ display: 'block', textAlign: 'left', width: '100%' }}>
            <span className="stack gap-1">
              <span className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center' }}><span className="t-sm t-semibold">{nameOf(t, x.typeId)}</span><span className="row gap-2" style={{ alignItems: 'center' }}>{x.configured && <Badge tone="accent">{t(K.types.custom)}</Badge>}<Badge tone={TONE[x.urgency]}>{t(`internalNotifications.urgency.${x.urgency}`)}</Badge></span></span>
              <span className="t-xs">{!x.enabled ? t(K.types.off) : goes.length === 0 ? t(K.types.goesNowhere) : t(K.types.goesTo, { roles: goes.map(([r]) => roleName(t, r)).join(', '), channels: channelsText(t, goes[0][1]) })}</span>
              <span className="t-xs t-muted">{x.frequency.last30 > 0 ? t(K.types.frequency, { count: x.frequency.last30 }) : t(K.types.never)}{x.fatigue ? ` · ` : ''}{x.fatigue && <span style={{ color: 'var(--color-warning)' }}><Warning size={12} aria-hidden="true" /> {t(K.types.noisy)}</span>}</span>
            </span>
          </button>
        );
      })}
    </Section>
  );
}

function Log({ v, t, lang }: { v: InternalNotificationsView; t: T; lang: string }) {
  return (
    <Section title={t(K.log.title)}>
      {v.deliveries.length === 0 && <p className="t-xs t-muted">{t(K.log.empty)}</p>}
      {v.deliveries.slice(0, 12).map((d) => (
        <div key={d.id} className="row gap-2" data-delivery={d.id} style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span className="stack gap-0"><span className="t-xs">{t(K.log.line, { type: nameOf(t, d.typeId), channel: t(`internalNotifications.channel.${d.channel}`), role: roleName(t, d.role) })}{d.test ? ` · ${t(K.log.test)}` : ''}</span><span className="t-xs t-muted">{formatDate(d.at, lang)} · {ago(d.at)}</span></span>
          <Badge tone={d.status === 'sent' ? 'success' : 'warning'}>{d.status === 'sent' ? t(K.log.sent) : t(K.log.rejected)}</Badge>
        </div>
      ))}
    </Section>
  );
}

/* ------------------------------------------------------------------ one type */

function previewOf(t: T, x: InternalTypeView, d: TypeDraft, lang: Language): InternalContent {
  const own = d.content[lang];
  const values = { ...SAMPLE_VALUES, title: t(x.typeId, { lng: lang, defaultValue: SAMPLE_VALUES.title }) };
  if (own && (own.subject.trim() || own.body.trim())) return { subject: renderContent(own.subject || '{{title}}', values), body: renderContent(own.body || '{{title}} — {{context}}', values) };
  return { subject: values.title, body: `${values.title} — ${values.context} (${values.code})` };
}

function Detail({ s, v, t, lang }: { s: SettingsState; v: InternalNotificationsView; t: T; lang: string }) {
  const toast = useToast();
  const x = s.type;
  const d = s.draft;
  const [tab, setTab] = useState<Language>('en');
  const [confirm, setConfirm] = useState(false);
  const [ack, setAck] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [testRole, setTestRole] = useState('admin');
  if (!x || !d) return <Sheet open={false} onClose={s.open.bind(null, null)} title="" closeLabel={t(K.close)}>{null}</Sheet>;
  const urgency = d.urgency ?? x.defaultUrgency;
  const effRoles: Record<string, InternalChannelSet> = d.roles ?? Object.fromEntries(v.roles.map((r) => [r, r === 'admin' ? { ...v.urgencyChannels[urgency] } : { inApp: false, sms: false, email: false }]));
  const dirty = JSON.stringify(d) !== JSON.stringify({ urgency: x.urgencySource === 'configured' ? x.urgency : null, roles: x.configured ? x.roles : null, enabled: x.enabled, content: x.content });
  const adminBefore = x.roles.admin ?? { inApp: true, sms: false, email: false };
  const reduces = x.urgency === 'critical' && (!d.enabled || urgency !== 'critical' || reducesReach(adminBefore, effRoles.admin ?? adminBefore));
  const setRole = (role: string, ch: InternalChannel, on: boolean) => s.edit({ roles: { ...effRoles, [role]: { ...(effRoles[role] ?? { inApp: false, sms: false, email: false }), [ch]: on } } });
  const content = d.content[tab] ?? { subject: '', body: '' };
  const setContent = (patch: Partial<InternalContent>) => s.edit({ content: { ...d.content, [tab]: { ...content, ...patch } } });
  const save = async () => { setProblem(null); const r = await s.save(reduces); if (r.ok) { setConfirm(false); setAck(false); toast.push(t(K.detail.saved)); } else setProblem(r.problem); };
  const runTest = async (ch: InternalChannel) => { setProblem(null); const p = previewOf(t, x, d, tab); const r = await s.test(ch, testRole, p); if (!r.ok) setProblem(r.problem); };
  const prev = previewOf(t, x, d, tab);
  return (
    <Sheet open={!!x} onClose={() => { s.open(null); setConfirm(false); }} title={nameOf(t, x.typeId)} closeLabel={t(K.close)}>
      <div className="stack gap-4" data-detail={x.typeId}>
        <section className="stack gap-2" data-urgency-section>
          <h3 className="t-sm t-semibold">{t(K.detail.urgency)}</h3>
          <span className="t-xs t-muted">{t(K.detail.urgencyNow, { urgency: t(`internalNotifications.urgency.${urgency}`) })}</span>
          <div className="row gap-2 wrap" role="group">
            <span data-u="auto"><Chip pressed={d.urgency === null} onClick={() => s.edit({ urgency: null })}>{t(K.urgency.fromSeverity)}</Chip></span>
            {URGENCIES.map((u) => <span key={u} data-u={u}><Chip pressed={d.urgency === u} onClick={() => s.edit({ urgency: u })}>{t(`internalNotifications.urgency.${u}`)}</Chip></span>)}
          </div>
          <Toggle checked={d.enabled} onChange={(on) => s.edit({ enabled: on })} label={t(K.detail.enabled)} description={t(K.detail.enabledHint)} />
        </section>

        <section className="stack gap-2" data-frequency>
          <h3 className="t-sm t-semibold">{t(K.detail.frequency)}</h3>
          <p className="t-xs">{t(K.detail.frequencyLine, { last7: x.frequency.last7, last30: x.frequency.last30, last: x.frequency.lastAt ? t(K.detail.last, { when: ago(x.frequency.lastAt) }) : '' })}</p>
          {x.fatigue && <p className="t-xs" role="status" data-fatigue style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 10 }}>{t(K.detail.fatigue, { urgency: t(`internalNotifications.urgency.${x.urgency}`).toLowerCase(), last7: x.frequency.last7 })}</p>}
        </section>

        <section className="stack gap-2" data-roles>
          <h3 className="t-sm t-semibold">{t(K.detail.roles)}</h3>
          <p className="t-xs t-muted">{t(K.detail.rolesHint)}</p>
          {v.roles.map((r) => (
            <div key={r} className="stack gap-1" data-role={r}>
              <span className="t-sm">{roleName(t, r)} <span className="t-xs t-muted">· {channelsText(t, effRoles[r] ?? { inApp: false, sms: false, email: false }) || '—'}</span></span>
              <div className="row gap-3 wrap">{CHANNELS.map((ch) => <Checkbox key={ch} checked={(effRoles[r] ?? { inApp: false, sms: false, email: false })[ch]} onChange={(on) => setRole(r, ch, on)} label={t(`internalNotifications.channel.${ch}`)} />)}</div>
            </div>
          ))}
        </section>

        <section className="stack gap-2" data-wording>
          <h3 className="t-sm t-semibold">{t(K.detail.wording)}</h3>
          <p className="t-xs t-muted">{t(K.detail.wordingHint)}</p>
          <div className="row gap-2 wrap" role="group">{LANGS.map((l) => <span key={l} data-lang={l}><Chip pressed={tab === l} onClick={() => setTab(l)}>{l.toUpperCase()}</Chip></span>)}</div>
          <Field label={t(K.detail.subject)} hint={`${content.subject.length}/${SUBJECT_MAX}`}>{(p) => <Input id={p.id} value={content.subject} data-f="subject" placeholder={t(K.detail.standard)} onChange={(e) => setContent({ subject: e.target.value })} />}</Field>
          <Field label={t(K.detail.body)} hint={`${content.body.length}/${BODY_MAX}`}>{(p) => <TextArea id={p.id} rows={3} value={content.body} data-f="body" placeholder={t(K.detail.standard)} onChange={(e) => setContent({ body: e.target.value })} />}</Field>
        </section>

        <section className="stack gap-2" data-preview>
          <h3 className="t-sm t-semibold">{t(K.detail.preview)}</h3>
          {(['inApp', 'sms', 'email'] as const).map((ch) => {
            const probs = channelProblems(ch, prev);
            const seg = ch === 'sms' ? segmentsOf(prev.body || prev.subject) : null;
            return (
              <Card key={ch}>
                <div className="stack gap-1" data-channel={ch}>
                  <span className="t-xs t-semibold">{t(`internalNotifications.channel.${ch}`)}</span>
                  {ch !== 'sms' && <span className="t-sm t-semibold">{prev.subject}</span>}
                  <span className="t-xs" style={{ whiteSpace: 'pre-wrap' }}>{prev.body}</span>
                  {seg && <span className="t-xs t-muted" data-length>{t(K.detail.length, { length: seg.length, count: seg.segments })}{seg.unicode ? ` · ${t(K.detail.unicode)}` : ''}</span>}
                  {probs.map((p) => <span key={p} className="t-xs" data-problem-ch={p} style={{ color: isBlocking(p) ? 'var(--color-error)' : 'var(--color-warning)' }}><Warning size={12} aria-hidden="true" /> {t(`internalNotifications.problem.${p}`)}</span>)}
                  <div><Button size="sm" variant="secondary" data-act={`test-${ch}`} loading={s.busy} onClick={() => void runTest(ch)}><Bell size={14} /> {t(K.detail.test)}</Button></div>
                </div>
              </Card>
            );
          })}
          <p className="t-xs t-muted">{t(K.detail.testHint)}</p>
          {v.roles.length > 1 && <div className="row gap-2 wrap" role="group">{v.roles.map((r) => <span key={r} data-test-role={r}><Chip pressed={testRole === r} onClick={() => setTestRole(r)}>{roleName(t, r)}</Chip></span>)}</div>}
          {s.tested && <p className="t-sm" role="status" data-tested={s.tested.status}>{s.tested.status === 'sent' ? t(K.detail.testSent, { channel: t(`internalNotifications.channel.${s.tested.channel}`) }) : t(K.detail.testRejected, { channel: t(`internalNotifications.channel.${s.tested.channel}`), problem: t(`internalNotifications.problem.${s.tested.problem}`) })}</p>}
        </section>

        {x.history.length > 0 && (
          <section className="stack gap-1" data-history>
            <h3 className="t-sm t-semibold">{t(K.detail.history)}</h3>
            {[...x.history].reverse().map((h) => <p key={`${h.version}-${h.at}`} className="t-xs">{t(K.detail.historyLine, { version: h.version, date: formatDate(h.at, lang), by: h.byName, summary: h.summary })}</p>)}
          </section>
        )}

        {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
        <div className="row gap-2">
          {dirty && <Button variant="ghost" data-act="revert" onClick={s.revert}>{t(K.detail.revert)}</Button>}
          <Button className="grow" data-act="save" disabled={!dirty} loading={s.busy} onClick={() => (reduces ? setConfirm(true) : void save())}>{t(K.detail.save)}</Button>
        </div>

        {confirm && (
          <div className="stack gap-3" data-confirm style={{ borderTop: '1px solid var(--color-warning)', paddingTop: 12 }}>
            <span className="t-sm t-semibold">{t(K.confirm.title)}</span>
            <p className="t-sm">{t(K.confirm.body)}</p>
            <Checkbox checked={ack} onChange={setAck} label={t(K.confirm.check)} />
            <div className="row gap-2"><Button variant="ghost" onClick={() => setConfirm(false)}>{t(K.confirm.no)}</Button><Button className="grow" data-act="confirm-yes" disabled={!ack} loading={s.busy} onClick={() => void save()}>{t(K.confirm.yes)}</Button></div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
