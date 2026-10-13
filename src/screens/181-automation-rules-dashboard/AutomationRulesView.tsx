import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, Pause, Play, Pulse } from '@phosphor-icons/react';
import { Badge, Button, Card, Chip, EmptyState, ErrorState, Field, LoadingState, Screen, ScreenHeader, Sheet, TextArea, Toggle, formatDate, formatDateTime, useToast } from '@/design-system';
import type { AutomationActivityView, AutomationCategoryView, AutomationOverviewView } from '@/data/repository';
import type { AutomationRule } from '@/data/types';
import { categoryName } from '@/features/automation/registry';
import { AUTOMATION_RULES_KEYS as K, MONITOR_ROUTE, REASON_MIN } from './automation-rules.types';
import { useAutomationRules } from './useAutomationRules';
import type { AutomationRulesState } from './useAutomationRules';

type T = ReturnType<typeof useTranslation>['t'];
type Health = 'healthy' | 'degraded' | 'down' | 'paused';
const TONE: Record<Health, 'success' | 'warning' | 'error' | 'neutral'> = { healthy: 'success', degraded: 'warning', down: 'error', paused: 'neutral' };
const lettersOf = (s: string): number => s.replace(/[^\p{L}]/gu, '').length;
const nameOf = (t: T, c: { id: string; name: string }): string => t(`automationRules.category.${c.id}.name`, { defaultValue: c.name });
const problemText = (t: T, code: string) => t(`automationRules.problem.${code}`, { defaultValue: t(K.problem.generic) });
const healthWord = (t: T, h: Health) => t(`automationHealth.status.${h}`);
const ago = (iso: string, now: number): string => { const m = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000)); return m < 1 ? '<1 min' : m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`; };

/** Screen 181 — Master Automation Rules Dashboard. A cross-module view built from whatever categories exist (a new one appears on its own), health from the same telemetry as the Health Monitor, a blunt pause with its effect spelled out, and a recent-activity list folded to stay readable. */
export function AutomationRulesScreen() {
  const { t, i18n } = useTranslation();
  const s = useAutomationRules();
  const nav = useNavigate();
  const v = s.view;
  const head = (
    <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<span className="row gap-2"><Button size="sm" variant="ghost" data-act="monitor" onClick={() => nav(MONITOR_ROUTE)}><Pulse size={16} /> {t(K.link.monitor)}</Button><Button size="sm" variant="ghost" data-refresh onClick={() => void s.refresh()} aria-label={t(K.refresh)}><ArrowsClockwise size={18} /></Button></span>} />
  );
  if (s.load === 'loading' && !v) return <Screen width="wide">{head}<LoadingState label={t(K.loading)} variant="cards" rows={4} /></Screen>;
  if (s.load === 'error' && !v) return <Screen width="wide">{head}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /></Screen>;
  if (!v) return null;
  const lang = i18n.language;
  return (
    <Screen width="wide">
      {head}
      <div className="stack gap-3">
        {s.offline && <p className="t-xs t-muted" role="status" data-offline>{t(K.error.body)}</p>}
        <Hero v={v} t={t} />
        <PausedBanner v={v} s={s} t={t} lang={lang} />
        <div className="grid-auto" data-categories>
          {v.categories.map((c) => <CategoryCard key={c.id} c={c} s={s} t={t} lang={lang} />)}
        </div>
        <Activity v={v} s={s} t={t} lang={lang} />
        <p className="t-xs t-muted" data-placeholder-note>{t(K.notice.placeholders)}</p>
      </div>
      <Detail s={s} t={t} lang={lang} />
    </Screen>
  );
}

function Hero({ v, t }: { v: AutomationOverviewView; t: T }) {
  const stats: [string, number, string][] = [[K.hero.stat.categories, v.totals.categories, 'categories'], [K.hero.stat.rules, v.totals.activeRules, 'rules'], [K.hero.stat.paused, v.totals.paused, 'paused'], [K.hero.stat.attention, v.totals.unhealthy, 'attention'], [K.hero.stat.actions, v.totals.actions24h, 'actions']];
  return (
    <Card>
      <div className="stack gap-3" data-hero>
        <span className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}><h2 className="t-md t-semibold">{t(K.hero.title)}</h2><Badge tone={TONE[v.overall]} data-overall={v.overall}>{healthWord(t, v.overall)}</Badge></span>
        <div className="row gap-4 wrap">{stats.map(([label, n, id]) => <span key={id} className="stack gap-0" data-stat={id}><span className="t-lg t-semibold" style={{ fontFamily: 'var(--font-mono)' }}>{n}</span><span className="t-xs t-muted">{t(label)}</span></span>)}</div>
        <p className="t-xs t-muted">{t(K.hero.same)}</p>
      </div>
    </Card>
  );
}

function PausedBanner({ v, s, t, lang }: { v: AutomationOverviewView; s: AutomationRulesState; t: T; lang: string }) {
  const paused = v.categories.filter((c) => c.paused);
  if (paused.length === 0) return null;
  return (
    <Card>
      <div className="stack gap-2" data-paused-banner style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 12 }}>
        <span className="t-sm t-semibold">{t(K.paused.title, { count: paused.length })}</span>
        {paused.map((c) => (
          <div key={c.id} className="row gap-2" data-paused-line={c.id} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="t-xs">{t(K.paused.line, { name: nameOf(t, c), date: formatDate((c.paused as { since: string }).since, lang), by: (c.paused as { byName: string }).byName })}</span>
            <Button size="sm" variant="secondary" data-act="resume-open" onClick={() => s.open(c.id)}><Play size={14} /> {t(K.paused.resume)}</Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CategoryCard({ c, s, t, lang }: { c: AutomationCategoryView; s: AutomationRulesState; t: T; lang: string }) {
  const now = Date.now();
  return (
    <Card>
      <div className="stack gap-2" data-category={c.id} data-health={c.health}>
        <button type="button" className="tappable" data-act="details" onClick={() => s.open(c.id)} style={{ display: 'block', textAlign: 'left', width: '100%', background: 'none', border: 0, padding: 0 }}>
          <span className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="t-md t-semibold">{nameOf(t, c)}</span>
            <span className="row gap-2" style={{ alignItems: 'center' }}>{!c.known && <Badge tone="accent">{t(K.card.new)}</Badge>}<Badge tone={TONE[c.health]}>{healthWord(t, c.health)}</Badge></span>
          </span>
        </button>
        <span className="t-xs t-muted">{c.known ? t(`automationRules.category.${c.id}.hint`) : t(K.category.newHint)}</span>
        <span className="t-sm">{t(K.card.rules, { count: c.ruleCount })}{c.scheduledTotal > 0 ? ` · ${t(K.card.checks, { on: c.scheduledCount, total: c.scheduledTotal })}` : ''}</span>
        <span className="t-xs t-muted">{c.lastActivity ? t(K.card.lastAction, { when: ago(c.lastActivity.at, now) }) : t(K.card.noAction)} · {t(K.card.actions, { count: c.actions24h })}</span>
        {c.failing.length > 0 && <span className="t-xs" data-failing>{t(K.card.attention)}: {c.failing.map((f) => f.name).join(', ')}</span>}
        <div className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          {c.protected
            ? <span data-protected><Badge tone="neutral">{t(K.card.protected)}</Badge></span>
            : <Toggle checked={!c.paused} onChange={() => s.open(c.id)} label={c.paused ? t(K.card.paused) : t(K.card.pause)} />}
          {c.route && <Button size="sm" variant="ghost" data-act="settings" onClick={() => s.open(c.id)}>{t(K.card.details)}</Button>}
        </div>
        <span className="sr-only">{formatDate(new Date(now).toISOString(), lang)}</span>
      </div>
    </Card>
  );
}

function Activity({ v, s, t, lang }: { v: AutomationOverviewView; s: AutomationRulesState; t: T; lang: string }) {
  const now = Date.now();
  const cats = [...new Set(v.activity.map((a) => a.category))];
  const items: AutomationActivityView[] = v.activity.filter((a) => !s.filter || a.category === s.filter);
  return (
    <section className="stack gap-2" data-activity>
      <h2 className="t-md t-semibold">{t(K.activity.title)}</h2>
      <p className="t-xs t-muted">{t(K.activity.hint)}</p>
      <div className="row gap-2 wrap" role="group" data-activity-filters>
        <span data-f="all"><Chip pressed={!s.filter} onClick={() => s.setFilter(null)}>{t(K.activity.all)}</Chip></span>
        {cats.map((c) => <span key={c} data-f={c}><Chip pressed={s.filter === c} onClick={() => s.setFilter(c)}>{t(`automationRules.category.${c}.name`, { defaultValue: categoryName(c) })}</Chip></span>)}
      </div>
      {items.length === 0 && <EmptyState title={t(K.activity.empty)} body="" />}
      {items.map((a) => (
        <Card key={a.key}>
          <div className="stack gap-0" data-activity-line={a.category} data-count={a.count}>
            <span className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="t-sm t-semibold">{t(`automationRules.category.${a.category}.name`, { defaultValue: categoryName(a.category) })}{a.count > 1 ? ` ${t(K.activity.count, { count: a.count })}` : ''}</span>
              <span className="t-xs t-muted">{t(K.activity.latest, { when: ago(a.latestAt, now) })}</span>
            </span>
            <span className="t-xs">{a.actionTaken}{a.subjectLabel ? ` · ${a.subjectLabel}` : ''}</span>
            <span className="sr-only">{formatDateTime(a.latestAt, lang)}</span>
          </div>
        </Card>
      ))}
    </section>
  );
}

function Detail({ s, t, lang }: { s: AutomationRulesState; t: T; lang: string }) {
  const toast = useToast();
  const nav = useNavigate();
  const c = s.view?.categories.find((x) => x.id === s.openId) ?? null;
  const [reason, setReason] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const checks: AutomationRule[] = c ? s.rules.filter((r) => r.scheduled && r.category === c.id) : [];
  const history = c ? s.pauses.filter((p) => p.scope === 'category' && p.target === c.id) : [];
  const now = Date.now();
  const close = () => { setReason(''); setProblem(null); s.open(null); };
  const doPause = async () => { if (!c) return; setProblem(null); const r = await s.pause(c.id, reason); if (r.ok) { toast.push(t(K.toast.paused, { name: nameOf(t, c) })); close(); } else setProblem(r.problem); };
  const doResume = async () => { if (!c) return; setProblem(null); const r = await s.resume(c.id); if (r.ok) { toast.push(t(K.toast.resumed, { name: nameOf(t, c) })); close(); } else setProblem(r.problem); };
  return (
    <Sheet open={!!c} onClose={close} title={c ? nameOf(t, c) : ''} closeLabel={t(K.close)}>
      {c && (
        <div className="stack gap-3" data-detail={c.id}>
          <span className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}><Badge tone={TONE[c.health]}>{healthWord(t, c.health)}</Badge><span className="t-xs t-muted">{c.known ? t(`automationRules.category.${c.id}.hint`) : t(K.category.newHint)}</span></span>
          {c.configured > 0 && <p className="t-sm">{t(K.detail.configured, { count: c.configured })}</p>}
          <div className="stack gap-1">
            <h3 className="t-sm t-semibold">{t(K.detail.checks)}</h3>
            {checks.length === 0 && <p className="t-xs t-muted">{t(K.detail.noChecks)}</p>}
            {checks.map((r) => (
              <div key={r.id} className="row gap-2" data-check={r.id} style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="stack gap-0"><span className="t-sm">{r.name}</span><span className="t-xs t-muted">{t(K.detail.lastRun, { when: ago(r.lastRunAt, now) })}{r.lastError ? ` · ${t(K.detail.error, { error: r.lastError })}` : ''}</span></span>
                <Badge tone={r.status === 'failing' ? 'error' : r.status === 'degraded' ? 'warning' : r.status === 'paused' ? 'neutral' : 'success'}>{healthWord(t, r.status === 'failing' ? 'down' : (r.status as Health))}</Badge>
              </div>
            ))}
          </div>
          {c.route && <Button variant="secondary" data-act="settings" onClick={() => { close(); nav(c.route as string); }}>{t(K.card.open)}</Button>}

          {c.paused
            ? (
              <div className="stack gap-2" data-resume>
                <h3 className="t-sm t-semibold">{t(K.resume.title, { name: nameOf(t, c) })}</h3>
                <p className="t-xs">{t(K.resume.body, { date: formatDate(c.paused.since, lang), by: c.paused.byName, count: c.skippedRuns })}</p>
                <p className="t-xs t-muted">{t(K.detail.reason, { reason: c.paused.reason })}</p>
                {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{problemText(t, problem)}</p>}
                <Button block data-act="resume" loading={s.busy} onClick={() => void doResume()}><Play size={18} /> {t(K.resume.confirm)}</Button>
              </div>
            )
            : c.protected
              ? <p className="t-xs t-muted" data-protected-hint>{t(K.card.protectedHint)}</p>
              : (
                <div className="stack gap-3" data-pause>
                  <h3 className="t-sm t-semibold">{t(K.pause.title, { name: nameOf(t, c) })}</h3>
                  <p className="t-xs">{t(K.pause.intro)}</p>
                  <div className="stack gap-1"><span className="t-xs t-semibold">{t(K.pause.does.title)}</span>{[K.pause.does['1'], K.pause.does['2'], K.pause.does['3']].map((k) => <p key={k} className="t-xs">• {t(k)}</p>)}</div>
                  <div className="stack gap-1"><span className="t-xs t-semibold">{t(K.pause.doesnot.title)}</span>{[K.pause.doesnot['1'], K.pause.doesnot['2'], K.pause.doesnot['3'], K.pause.doesnot['4']].map((k) => <p key={k} className="t-xs">• {t(k)}</p>)}</div>
                  <div className="stack gap-1"><span className="t-xs t-semibold">{t(K.pause.resume.title)}</span><p className="t-xs">{t(K.pause.resume['1'])}</p></div>
                  <p className="t-sm" data-affects>{t(K.pause.affects, { count: c.scheduledCount, actions: c.actions24h })}</p>
                  <Field label={t(K.pause.reason)} hint={t(K.pause.reasonHint)}>{(p) => <TextArea id={p.id} rows={3} value={reason} data-f="reason" onChange={(e) => setReason(e.target.value)} />}</Field>
                  {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{problemText(t, problem)}</p>}
                  <div className="row gap-2"><Button variant="ghost" onClick={close}>{t(K.pause.cancel)}</Button><Button className="grow" data-act="pause" disabled={lettersOf(reason) < REASON_MIN} loading={s.busy} onClick={() => void doPause()}><Pause size={18} /> {t(K.pause.confirm, { name: nameOf(t, c) })}</Button></div>
                </div>
              )}

          <div className="stack gap-1" data-history>
            <h3 className="t-sm t-semibold">{t(K.detail.history)}</h3>
            {history.length === 0 && <p className="t-xs t-muted">{t(K.detail.noHistory)}</p>}
            {history.map((p) => <p key={p.id} className="t-xs">{t(K.detail.historyLine, { kind: t(`automationRules.detail.kind.${p.kind}`), date: formatDate(p.at, lang), by: p.byName })}{p.kind === 'resumed' && p.skippedRuns ? ` · ${t(K.detail.skipped, { count: p.skippedRuns })}` : ''}{p.reason ? ` · ${t(K.detail.reason, { reason: p.reason })}` : ''}</p>)}
          </div>
        </div>
      )}
    </Sheet>
  );
}
