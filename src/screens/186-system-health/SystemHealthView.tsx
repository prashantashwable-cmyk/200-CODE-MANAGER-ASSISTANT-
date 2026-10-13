import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowSquareOut, ArrowsClockwise, Robot, ShieldWarning } from '@phosphor-icons/react';
import { Badge, Button, Card, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Sheet, TextArea, formatDate, useToast } from '@/design-system';
import type { SystemHealthIntegrationView, SystemHealthView } from '@/data/repository';
import type { IntegrationConfig } from '@/data/types';
import { NOTE_MIN } from '@/features/health/system';
import { BOT_ROUTE, SYSTEM_HEALTH_KEYS as K } from './system-health.types';
import { useSystemHealth } from './useSystemHealth';
import type { SystemHealthState } from './useSystemHealth';

type T = ReturnType<typeof useTranslation>['t'];
const TONE: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = { operational: 'success', degraded: 'warning', down: 'error', unknown: 'neutral' };
const STATUSES: IntegrationConfig['reported']['status'][] = ['operational', 'degraded', 'down', 'unknown'];
const DEMOS: IntegrationConfig['demo'][] = ['working', 'degraded', 'failing'];
const errText = (t: T, code: string) => t(`systemHealth.error.${code}`, { defaultValue: t(K.error.generic) });
const ago = (iso: string, now: number): string => { const m = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000)); return m < 1 ? '<1 min' : m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`; };
const providerName = (t: T, id: string): string => t(`systemHealth.integration.${id}`);

/** Screen 186 — System Health & Bot Monitoring. Technical status per connection judged on AIEC's own calls (the provider's word recorded beside it, never trusted over ours), a shared-cause note, follow-up left behind by an outage, the automation engine, the bot and a log of incidents. */
export function SystemHealthScreen() {
  const { t, i18n } = useTranslation();
  const s = useSystemHealth();
  const v = s.view;
  const head = <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh onClick={() => void s.refresh()}>{t(K.refresh)}</Button>} />;
  if (s.load === 'loading' && !v) return <Screen width="wide">{head}<LoadingState label={t(K.loading)} variant="stats" rows={4} /><div className="mt-3"><LoadingState label={t(K.loading)} variant="block" /></div></Screen>;
  if (s.load === 'error' && !v) return <Screen width="wide">{head}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.refresh()} /></Screen>;
  if (!v) return null;
  const now = Date.parse(v.at);
  return (
    <Screen width="wide">
      {head}
      <div className="stack gap-4">
        {s.offline && <p className="t-xs t-muted" role="status" data-offline>{t(K.offline)}</p>}
        <Totals v={v} t={t} />
        {v.shared && <Shared v={v} t={t} />}
        <FollowUps v={v} s={s} t={t} />
        <Section title={t(K.integrations.title)} hint={t(K.integrations.hint)}>
          <div className="grid-auto" data-integrations>
            {v.integrations.map((i) => <Integration key={i.id} i={i} v={v} s={s} t={t} now={now} />)}
          </div>
        </Section>
        <Bot v={v} t={t} />
        <Incidents v={v} t={t} lang={i18n.language} />
        <p className="t-xs t-muted" data-placeholder-note>{t(K.note.placeholders)}</p>
      </div>
      <RecordSheet v={v} s={s} t={t} />
    </Screen>
  );
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

function Totals({ v, t }: { v: SystemHealthView; t: T }) {
  const items: [string, number, string][] = [[K.summary.operational, v.totals.operational, 'operational'], [K.summary.degraded, v.totals.degraded, 'degraded'], [K.summary.down, v.totals.down, 'down'], [K.summary.followUps, v.totals.followUps, 'followUps']];
  return <div className="row gap-4 wrap" data-stats>{items.map(([label, n, id]) => <span key={id} className="stack gap-0" data-stat={id}><span className="t-lg t-semibold" style={{ fontFamily: 'var(--font-mono)' }}>{n}</span><span className="t-xs t-muted">{t(label)}</span></span>)}</div>;
}

function Shared({ v, t }: { v: SystemHealthView; t: T }) {
  if (!v.shared) return null;
  return (
    <Card>
      <div className="stack gap-1" data-shared={v.shared.likely}>
        <span className="t-sm t-semibold row gap-2" style={{ alignItems: 'center', color: 'var(--color-warning)' }}><ShieldWarning size={18} aria-hidden="true" />{t(K.shared.title)}</span>
        <p className="t-xs">{v.shared.ids.map((id) => providerName(t, id)).join(' · ')}</p>
        <p className="t-xs">{v.shared.likely === 'ours' ? t(K.shared.ours) : t(K.shared.mixed)}</p>
      </div>
    </Card>
  );
}

function FollowUps({ v, s, t }: { v: SystemHealthView; s: SystemHealthState; t: T }) {
  const nav = useNavigate();
  const toast = useToast();
  const owed = v.integrations.filter((i) => i.followUp);
  const [note, setNote] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<string | null>(null);
  if (owed.length === 0) return null;
  return (
    <Section title={t(K.followUp.title)}>
      <div className="stack gap-2" data-followups>
        {owed.map((i) => {
          const f = i.followUp!;
          const n = note[f.incidentId] ?? '';
          return (
            <Card key={f.incidentId}>
              <div className="stack gap-2" data-followup={f.incidentId}>
                <p className="t-sm">{t(`systemHealth.followUp.${f.kind}`, { provider: providerName(t, i.id), count: f.count })}</p>
                {f.route && <div><Button size="sm" variant="secondary" onClick={() => nav(f.route!)}>{t(K.followUp.open)} <ArrowRight size={14} /></Button></div>}
                <Field label={t(K.followUp.note)} hint={`${n.trim().length}/${NOTE_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={n} data-f="followup-note" onChange={(e) => setNote({ ...note, [f.incidentId]: e.target.value })} />}</Field>
                {problem && <p className="t-xs t-error" role="alert">{errText(t, problem)}</p>}
                <div><Button size="sm" data-act={`close-followup-${f.incidentId}`} disabled={n.trim().length < NOTE_MIN} loading={s.busy} onClick={async () => { setProblem(null); const r = await s.closeFollowUp(f.incidentId, n); if (r.ok) toast.push(t(K.followUp.done)); else setProblem(r.problem); }}>{t(K.followUp.done)}</Button></div>
              </div>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}

function Integration({ i, v, s, t, now }: { i: SystemHealthIntegrationView; v: SystemHealthView; s: SystemHealthState; t: T; now: number }) {
  const { i18n } = useTranslation();
  const nav = useNavigate();
  const [urlOpen, setUrlOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const saveUrl = async () => { setProblem(null); const r = await s.saveUrl(i.id, url.trim() || null); if (r.ok) setUrlOpen(false); else setProblem(r.problem); };
  return (
    <Card>
      <div className="stack gap-2" data-integration={i.id} data-status={i.status}>
        <div className="row between" style={{ alignItems: 'center', gap: 8 }}>
          <span className="stack gap-0"><span className="t-sm t-semibold">{providerName(t, i.id)}</span><span className="t-xs t-muted">{t(K.card.byOurs)}</span></span>
          <Badge tone={TONE[i.status]}>{t(`systemHealth.status.${i.status}`)}</Badge>
        </div>
        <span className="t-xs" data-rate>{i.calls > 0 ? t(K.card.rate, { errors: i.errors, calls: i.calls }) : t(K.card.noCalls)}{i.uptimePct !== null ? ` · ${t(K.card.uptime, { pct: i.uptimePct })}` : ''}</span>
        <span className="t-xs t-muted">{i.monitor === 'probe' ? (i.lastProbeAt ? t(K.card.lastCheck, { ago: ago(i.lastProbeAt, now) }) : t(K.card.noCalls)) : t(K.card.neverChecked)}</span>
        <span className="t-xs t-muted">{i.lastIncidentAt ? t(K.card.lastIncident, { date: formatDate(i.lastIncidentAt, i18n.language) }) : t(K.card.noIncident)}</span>
        {i.cause && <p className="t-xs" data-cause={i.cause} style={{ color: i.cause === 'ours' ? 'var(--color-warning)' : undefined }}>{t(`systemHealth.cause.${i.cause}`)}</p>}
        {i.id !== 'engine' && <div className="stack gap-0" data-provider-says>
          <span className="t-xs">{t(K.card.providerSays, { status: t(`systemHealth.status.${i.reported.status}`) })}</span>
          <span className="t-xs t-muted">{i.reported.at && i.reported.byName ? t(K.card.providerRecorded, { name: i.reported.byName, ago: ago(i.reported.at, now) }) : t(K.card.providerNone)}</span>
          {(i.agreement === 'provider_better' || i.agreement === 'provider_worse') && <span className="t-xs" data-agreement={i.agreement} style={{ color: 'var(--color-warning)' }}>{t(`systemHealth.agreement.${i.agreement}`)}</span>}
        </div>}
        {i.id === 'engine' && <Engine v={v} t={t} now={now} />}
        <div className="row gap-2 wrap">
          {i.monitor === 'probe' && <Button size="sm" variant="secondary" data-act={`check-${i.id}`} loading={s.busy} onClick={() => void s.check(i.id)}>{t(K.card.check)}</Button>}
          {i.id !== 'engine' && <Button size="sm" variant="secondary" data-act={`record-${i.id}`} onClick={() => s.openRecord(i.id)}>{t(K.card.record)}</Button>}
          {i.route && <Button size="sm" variant="ghost" onClick={() => nav(i.route!)}>{t(K.card.openScreen)} <ArrowRight size={14} /></Button>}
        </div>
        {i.id !== 'engine' && <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          {i.statusPage ? <a href={i.statusPage} target="_blank" rel="noopener noreferrer" className="t-xs row gap-1" style={{ alignItems: 'center', color: 'var(--color-accent-secondary)' }} data-status-page><ArrowSquareOut size={12} aria-hidden="true" />{t(K.card.statusPage)}</a> : null}
          <button type="button" className="t-xs" data-act={`url-${i.id}`} onClick={() => { setUrl(i.statusPage ?? ''); setUrlOpen(!urlOpen); }} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'var(--color-text-secondary)', textDecoration: 'underline' }}>{i.statusPage ? t(K.record.saveUrl) : t(K.card.statusPageSet)}</button>
        </div>}
        {urlOpen && (
          <div className="stack gap-2" data-url-form>
            <Field label={t(K.record.url)} hint={t(K.record.urlHint)} error={problem ? errText(t, problem) : undefined}>{(p) => <Input id={p.id} inputMode="url" value={url} data-f="url" invalid={!!problem} onChange={(e) => setUrl(e.target.value)} />}</Field>
            <div><Button size="sm" data-act={`save-url-${i.id}`} loading={s.busy} onClick={() => void saveUrl()}>{t(K.record.saveUrl)}</Button></div>
          </div>
        )}
        {i.monitor === 'probe' && (
          <details data-demo={i.id}>
            <summary className="t-xs t-muted" style={{ cursor: 'pointer' }}>{t(K.demo.title)}</summary>
            <div className="stack gap-2" style={{ marginTop: 8 }}>
              <p className="t-xs t-muted">{t(K.demo.hint)}</p>
              <div className="row gap-2 wrap">{DEMOS.map((d) => <span key={d} data-demo-state={`${i.id}:${d}`}><Chip pressed={i.demo === d} onClick={() => void s.setDemo(i.id, d)}>{t(`systemHealth.demo.${d}`)}</Chip></span>)}</div>
            </div>
          </details>
        )}
      </div>
    </Card>
  );
}

function Engine({ v, t, now }: { v: SystemHealthView; t: T; now: number }) {
  const e = v.engine;
  return (
    <div className="stack gap-1" data-engine>
      {e.lastBeatAt && <span className="t-xs">{t(K.engine.beat, { ago: ago(e.lastBeatAt, now), count: e.beatsLastHour })}</span>}
      <span className="t-xs">{t(K.engine.gap, { min: e.longestGapMin })} · {t(K.engine.steps, { count: e.steps })}</span>
      <span className="t-xs">{e.failing.length === 0 ? t(K.engine.none) : `${t(K.engine.failing)}: ${e.failing.map((f) => f.name).join(', ')}`}</span>
      <span className="t-xs t-muted">{t(K.engine.note)}</span>
    </div>
  );
}

function Bot({ v, t }: { v: SystemHealthView; t: T }) {
  const nav = useNavigate();
  const b = v.bot;
  return (
    <Section title={t(K.bot.title)} hint={t(K.bot.hint, { days: b.windowDays })}>
      <Card>
        <div className="stack gap-2" data-bot>
          <div className="row gap-4 wrap">
            <span className="stack gap-0" data-bot-stat="replies"><span className="t-lg t-semibold" style={{ fontFamily: 'var(--font-mono)' }}>{b.replies}</span><span className="t-xs t-muted">{t(K.bot.replies)}</span></span>
            <span className="stack gap-0" data-bot-stat="handoffs"><span className="t-lg t-semibold" style={{ fontFamily: 'var(--font-mono)' }}>{b.handoffs}</span><span className="t-xs t-muted">{t(K.bot.handoffs)}</span></span>
          </div>
          <span className="t-xs" data-handoff-rate>{t(K.bot.rate)}: {b.handoffRate !== null ? t(K.bot.rateValue, { rate: b.handoffRate, expected: b.expectedRate }) : t(K.bot.rateNone, { sample: b.sample })}</span>
          {b.drift && <p className="t-xs" data-drift style={{ color: 'var(--color-warning)' }}>{t(K.bot.drift)}</p>}
          {b.failedSends > 0 && <span className="t-xs">{t(K.bot.failed, { count: b.failedSends })}</span>}
          <span className="t-xs t-muted"><Robot size={12} aria-hidden="true" /> {t(K.bot.threshold, { pct: Math.round(b.confidenceThreshold * 100) })}</span>
          <div><Button size="sm" variant="ghost" onClick={() => nav(BOT_ROUTE)}>{t(K.bot.open)} <ArrowRight size={14} /></Button></div>
        </div>
      </Card>
    </Section>
  );
}

function Incidents({ v, t, lang }: { v: SystemHealthView; t: T; lang: string }) {
  return (
    <Section title={t(K.incidents.title)}>
      {v.incidents.length === 0 ? <EmptyState title={t(K.incidents.empty)} body={t(K.incidents.emptyBody)} /> : (
        <div className="stack gap-2" data-incidents>
          {v.incidents.map((x) => (
            <Card key={x.id}>
              <div className="stack gap-1" data-incident={x.id} data-status={x.status}>
                <div className="row between" style={{ alignItems: 'center', gap: 8 }}>
                  <span className="t-sm t-semibold">{x.code} · {providerName(t, x.integrationId)}</span>
                  <Badge tone={x.status === 'open' ? 'warning' : 'success'}>{x.status === 'open' ? t(K.incidents.open) : t(K.incidents.recovered)}</Badge>
                </div>
                <span className="t-xs">{x.endedAt ? t(K.incidents.lineEnded, { cause: t(`systemHealth.incidents.cause.${x.cause}`), from: formatDate(x.startedAt, lang), to: formatDate(x.endedAt, lang) }) : t(K.incidents.line, { cause: t(`systemHealth.incidents.cause.${x.cause}`), from: formatDate(x.startedAt, lang) })} · {t(K.incidents.peak, { status: t(`systemHealth.status.${x.peakStatus}`) })}</span>
                {!x.onsetKnown && <span className="t-xs t-muted">{t(K.incidents.notSeen)}</span>}
                {x.followUp && <span className="t-xs" style={x.followUp.done ? undefined : { color: 'var(--color-warning)' }}>{x.followUp.done ? t(K.followUp.closed, { note: x.followUp.done.note }) : t(K.incidents.followUpOwed, { count: x.followUp.count })}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Section>
  );
}

function RecordSheet({ v, s, t }: { v: SystemHealthView; s: SystemHealthState; t: T }) {
  const toast = useToast();
  const i = v.integrations.find((x) => x.id === s.recordId);
  const [status, setStatus] = useState<IntegrationConfig['reported']['status']>('unknown');
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => { setStatus(i?.reported.status ?? 'unknown'); setNote(i?.reported.note ?? ''); setProblem(null); }, [s.recordId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!i) return <Sheet open={false} onClose={() => s.openRecord(null)} title="" closeLabel={t(K.close)}>{null}</Sheet>;
  return (
    <Sheet open onClose={() => s.openRecord(null)} title={t(K.record.title, { provider: providerName(t, i.id) })} closeLabel={t(K.close)}>
      <div className="stack gap-3" data-record-sheet={i.id}>
        <p className="t-xs t-muted">{t(K.record.hint)}</p>
        <div className="row gap-2 wrap" role="group">{STATUSES.map((st) => <span key={st} data-reported={st}><Chip pressed={status === st} onClick={() => setStatus(st)}>{t(`systemHealth.status.${st}`)}</Chip></span>)}</div>
        <Field label={t(K.record.note)}>{(p) => <TextArea id={p.id} rows={2} value={note} data-f="record-note" onChange={(e) => setNote(e.target.value)} />}</Field>
        {problem && <p className="t-sm t-error" role="alert">{errText(t, problem)}</p>}
        <Button data-act="save-record" loading={s.busy} onClick={async () => { setProblem(null); const r = await s.record(i.id, status, note); if (r.ok) { s.openRecord(null); toast.push(t(K.record.save)); } else setProblem(r.problem); }}>{t(K.record.save)}</Button>
      </div>
    </Sheet>
  );
}
