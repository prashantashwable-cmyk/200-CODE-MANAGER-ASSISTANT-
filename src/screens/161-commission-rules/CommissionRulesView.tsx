import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, Plus, ShieldWarning, Trash } from '@phosphor-icons/react';
import { Badge, Button, Card, Checkbox, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, Tabs, TextArea, Toggle, formatDate, formatINR, useToast } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { CommissionChangePreview, CommissionRuleView, CommissionRulesView, CommissionSimulationView } from '@/data/repository';
import type { Check, CommissionParams, CommissionRuleId, ParamKey, SimInput, SimLine } from '@/features/commission/rules';
import { conversionPctOf, mergeChecks, newChecks, resultChecks, sameParams } from '@/features/commission/rules';
import { BURDEN_WARN_PCT, COMMISSION_KEYS as K, MAX_CREW, MAX_INSPECTORS, NOTICE_DAYS, NOTICE_MAX, PULL_DISTANCE, REASON_MIN, SIGNIFICANT_CHANGE, TIERS_PATH, TOP_PARTY_WARN_SHARE, VIEWS } from './commission-rules.types';
import { ruleSummary } from '@/features/commission/ruleSummary';
import { useCommissionRules } from './useCommissionRules';
import type { CommissionRulesState } from './useCommissionRules';

type T = ReturnType<typeof useTranslation>['t'];
const problemKey = (code?: string | null) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;
const isoDay = (offset: number) => { const d = new Date(); d.setDate(d.getDate() + offset); const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const GROUPS = ['surveyor', 'technician', 'inspector'] as const;
const LEDGER_TONE: Record<CommissionRuleView['ledger'], BadgeTone> = { ledger: 'success', cost_report: 'neutral', pending: 'accent' };

export const summaryOf = (t: T, id: CommissionRuleId, p: CommissionParams): string => ruleSummary(t, id, p);
const ruleName = (t: T, id: string) => t(`commissionRules.rule.${id}.name`);

function Footer({ children }: { children: ReactNode }) {
  return <div className="row gap-2" data-sheet-actions style={{ position: 'sticky', bottom: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: 'var(--space-2) 0', marginTop: 'var(--space-3)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>{children}</div>;
}

function checkText(t: T, c: Check): string {
  const facts = { ...c.facts, days: NOTICE_DAYS, limit: BURDEN_WARN_PCT };
  return t(K.check[c.kind], facts);
}
const where = (t: T, c: Check) => c.scenarios.map((id) => t(K.scenario[id])).join(' · ');

/**
 * Screen 161 — Commission Rules Engine. The single root every commission amount is read from. A settings screen: each rule shows its value beside its name, a change
 * is a new version that applies from its own day (never to what has already been earned), and a deal can be tried against the rules, and against a proposed change, before
 * a single partner is affected.
 */
export function CommissionRulesScreen() {
  const { t } = useTranslation();
  const s = useCommissionRules();
  const [pull, setPull] = useState(0);
  const startY = useRef<number | null>(null);
  if (s.status === 'loading' && !s.data) return <Screen width="default"><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="stats" rows={3} /><div className="mt-3"><LoadingState label={t(K.loading)} variant="block" /></div></Screen>;
  if (s.status === 'error' || !s.data) return <Screen width="default"><ScreenHeader title={t(K.title)} /><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /></Screen>;
  const data = s.data;
  const onTouchStart = (e: React.TouchEvent) => { if (window.scrollY <= 0) startY.current = e.touches[0].clientY; };
  const onTouchMove = (e: React.TouchEvent) => { if (startY.current !== null) setPull(Math.max(0, Math.min(PULL_DISTANCE * 1.5, e.touches[0].clientY - startY.current))); };
  const onTouchEnd = () => { if (pull >= PULL_DISTANCE) void s.refresh(); startY.current = null; setPull(0); };
  const open = s.openRuleId ? data.rules.find((r) => r.id === s.openRuleId) ?? null : null;
  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} data-commission-rules={s.view}>
      {(pull > 0 || s.refreshing) && <p className="t-xs t-muted" role="status" style={{ textAlign: 'center' }} data-pull>{s.refreshing ? t(K.refresh.busy) : pull >= PULL_DISTANCE ? t(K.refresh.release) : t(K.refresh.pull)}</p>}
      <Screen width="default">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh disabled={s.refreshing} onClick={() => void s.refresh()}>{t(K.refresh.button)}</Button>} />
        <Tabs label={t(K.title)} value={s.view} onChange={(v) => s.setView(v as (typeof VIEWS)[number])} items={VIEWS.map((v) => ({ id: v, label: t(K.tab[v]) }))} />
        <div className="stack gap-4 mt-3">
          {s.view === 'rules' && <RulesView data={data} s={s} t={t} />}
          {s.view === 'simulate' && <SimulatorView data={data} s={s} t={t} />}
          {s.view === 'history' && <HistoryView data={data} t={t} />}
          <p className="t-xs t-muted" data-placeholder>{t(K.placeholder, { burden: BURDEN_WARN_PCT, share: Math.round(TOP_PARTY_WARN_SHARE * 100), change: Math.round(SIGNIFICANT_CHANGE * 100), days: NOTICE_DAYS })}</p>
        </div>
      </Screen>
      <ChangeSheet rule={open} s={s} t={t} />
    </div>
  );
}

/* ------------------------------------------------------------------ Rules */

function RulesView({ data, s, t }: { data: CommissionRulesView; s: CommissionRulesState; t: T }) {
  const { i18n } = useTranslation();
  return (
    <>
      <p className="t-sm">{t(K.rules.intro)}</p>
      {GROUPS.map((g) => (
        <section key={g} className="stack gap-2" data-group={g}>
          <h2 className="t-md t-semibold">{t(K.group[g])}</h2>
          <div className="grid-auto" style={{ '--min': '320px' } as React.CSSProperties}>
            {data.rules.filter((r) => r.group === g).map((r) => <RuleCard key={r.id} r={r} s={s} t={t} lang={i18n.language} />)}
          </div>
        </section>
      ))}
      <TierCard data={data} s={s} t={t} />
      <StackCard data={data} t={t} />
      <TraceCard data={data} t={t} />
    </>
  );
}

function RuleCard({ r, s, t, lang }: { r: CommissionRuleView; s: CommissionRulesState; t: T; lang: string }) {
  return (
    <Card>
      <div className="stack gap-2" data-rule={r.id} data-version={r.current.version}>
        <div className="stack gap-1" style={{ alignItems: 'flex-start' }}>
          <strong className="t-md" style={{ overflowWrap: 'anywhere' }}>{t(`commissionRules.rule.${r.id}.name`)}</strong>
          <Badge tone={LEDGER_TONE[r.ledger]}>{t(K.ledger[r.ledger])}</Badge>
        </div>
        <p className="t-sm t-muted">{t(`commissionRules.rule.${r.id}.what`)}</p>
        <p className="t-xs"><span className="t-muted">{t(K.trigger.label)}</span> {t(K.trigger[r.trigger])}</p>
        <div className="stack gap-1" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
          <span className="t-semibold num" data-current>{summaryOf(t, r.id, r.current.params)}</span>
          <span className="t-xs t-muted">{t(K.card.version, { version: r.current.version, date: formatDate(r.current.effectiveFrom, lang) })}</span>
          {r.ledger === 'pending' && <span className="t-xs t-muted">{t(K.ledger.pendingBody)}</span>}
          {r.tierAware && <span className="t-xs t-muted">{t(K.card.tierAware)}</span>}
          {r.negotiable.length > 0 && <span className="t-xs t-muted">{t(K.card.negotiable)}</span>}
        </div>
        {r.upcoming && (
          <div className="stack gap-1" data-upcoming style={{ borderLeft: '3px solid var(--color-accent-primary)', paddingLeft: 'var(--space-3)' }}>
            <strong className="t-sm">{t(K.card.upcomingTitle, { date: formatDate(r.upcoming.effectiveFrom, lang) })}</strong>
            <span className="t-sm num">{summaryOf(t, r.id, r.upcoming.params)}</span>
            <span className="t-xs t-muted">{r.upcoming.notice ? t(K.card.noticeSent, { date: formatDate(r.upcoming.notice.sentAt, lang) }) : t(K.card.noticeNone)}</span>
          </div>
        )}
        <div><Button size="sm" variant="secondary" data-change={r.id} onClick={() => s.openRule(r.id)}>{t(K.card.change)}</Button></div>
      </div>
    </Card>
  );
}

function TierCard({ data, s, t }: { data: CommissionRulesView; s: CommissionRulesState; t: T }) {
  const conv = data.rules.find((r) => r.id === 'conversion') as CommissionRuleView;
  return (
    <Card>
      <div className="stack gap-2" data-tiers>
        <h2 className="t-md t-semibold">{t(K.rules.tierHeading)}</h2>
        <p className="t-sm">{t(K.rules.tierBody)}</p>
        {(['surveyor', 'technician'] as const).map((role) => (
          <div key={role} className="stack gap-1" data-tier-role={role}>
            <strong className="t-sm">{t(K.group[role])}</strong>
            {data.tiers.filter((x) => x.role === role).map((x) => (
              <div key={x.tier} className="row between wrap" style={{ gap: 'var(--space-2)' }} data-tier={`${role}:${x.tier}`}>
                <span className="t-sm">{t(`partnerTiers.tier.${role}.${x.tier}`, { defaultValue: x.tier })}</span>
                <span className="t-sm num t-muted">{role === 'surveyor' ? t(K.rules.tierConversion, { pct: conversionPctOf(conv.current.params, x.plusPct ?? 0), base: conv.current.params.pct, plus: `${x.plusPct ?? 0}` }) : x.canLead ? t(K.rules.tierLead) : t(K.rules.tierNoLead)}</span>
              </div>
            ))}
          </div>
        ))}
        <div><Button size="sm" variant="ghost" data-tiers-link onClick={() => s.goTo(TIERS_PATH)}>{t(K.rules.tierLink)}</Button></div>
      </div>
    </Card>
  );
}

function StackCard({ data, t }: { data: CommissionRulesView; t: T }) {
  return (
    <Card>
      <div className="stack gap-2" data-stacking>
        <h2 className="t-md t-semibold">{t(K.rules.stackHeading)}</h2>
        <p className="t-sm">{t(K.rules.stackBody)}</p>
        {data.stacking.map((g) => (
          <div key={g.id} className="stack gap-1" data-stack={g.id}>
            <p className="t-sm">{t(K.stack[g.id])}</p>
            <span className="t-xs t-muted">{g.rules.map((id) => ruleName(t, id)).join(' › ')}</span>
          </div>
        ))}
        <p className="t-sm t-muted">{t(K.stack.rest)}</p>
      </div>
    </Card>
  );
}

function TraceCard({ data, t }: { data: CommissionRulesView; t: T }) {
  const tr = data.trace;
  return (
    <Card>
      <div className="stack gap-2" data-trace>
        <h2 className="t-md t-semibold">{t(K.rules.traceHeading)}</h2>
        <p className="t-sm">{t(K.rules.traceBody, { traced: tr.stamped + tr.inferred, total: tr.total, recorded: tr.stamped, inferred: tr.inferred })}</p>
        {tr.notFromRule.map((x) => <p key={x.reasonKey} className="t-xs t-muted" data-not-from-rule={x.reasonKey}>{t(K.rules.notFromRule, { count: x.count, amount: formatINR(x.amount), what: t(x.reasonKey, { defaultValue: x.reasonKey }) })}</p>)}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ Change a rule */

function ChangeSheet({ rule, s, t }: { rule: CommissionRuleView | null; s: CommissionRulesState; t: T }) {
  const { i18n } = useTranslation();
  const toast = useToast();
  const base = rule ? (rule.upcoming ?? rule.current).params : {};
  const [vals, setVals] = useState<Record<string, string>>({});
  const [effective, setEffective] = useState(isoDay(1));
  const [reason, setReason] = useState('');
  const [notify, setNotify] = useState(false);
  const [notifyTouched, setNotifyTouched] = useState(false);
  const [message, setMessage] = useState('');
  const [acks, setAcks] = useState<string[]>([]);
  const [preview, setPreview] = useState<CommissionChangePreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewProblem, setPreviewProblem] = useState<string | null>(null);
  const [stage, setStage] = useState<'edit' | 'confirm'>('edit');
  const [error, setError] = useState<string | null>(null);
  const id = rule?.id;
  useEffect(() => {
    if (!rule) return;
    const p = (rule.upcoming ?? rule.current).params as Record<string, number | undefined>;
    setVals(Object.fromEntries(rule.paramDefs.map((d) => [d.key, String(p[d.key] ?? '')])));
    setEffective(isoDay(1)); setReason(''); setNotify(false); setNotifyTouched(false); setMessage(''); setAcks([]); setPreview(null); setPreviewProblem(null); setStage('edit'); setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  const params = useMemo<CommissionParams>(() => {
    const out: CommissionParams = {};
    for (const d of rule?.paramDefs ?? []) { const n = Number(vals[d.key]); if (vals[d.key] !== undefined && vals[d.key] !== '' && Number.isFinite(n)) (out as Record<string, number>)[d.key] = n; }
    return out;
  }, [vals, rule]);
  const inRange = !!rule && rule.paramDefs.every((d) => params[d.key] !== undefined && (params[d.key] as number) >= d.min && (params[d.key] as number) <= d.max);
  const changed = !!rule && !sameParams(params, base);
  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(effective) && effective >= isoDay(0) && (!rule || effective > (rule.upcoming ?? rule.current).effectiveFrom || !changed);
  const key = JSON.stringify([id, params, effective]);
  useEffect(() => {
    if (!rule || !inRange || !changed || !dateOk) { setPreview(null); setPreviewProblem(null); return; }
    let live = true;
    setPreviewing(true);
    const h = window.setTimeout(async () => {
      const r = await s.preview(rule.id, params, effective);
      if (!live) return;
      setPreviewing(false);
      if (r.ok && r.value) { setPreview(r.value); setPreviewProblem(null); if (!notifyTouched) setNotify(r.value.significant); } else { setPreview(null); setPreviewProblem(r.code ?? 'generic'); }
    }, 300);
    return () => { live = false; window.clearTimeout(h); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const needed = useMemo(() => (preview ? [...preview.newChecks.map((c) => c.kind as string), ...(preview.noticeShort ? ['notice_short'] : [])] : []), [preview]);
  const allSeen = needed.every((k2) => acks.includes(k2));
  const ready = !!rule && inRange && changed && dateOk && letters(reason) >= REASON_MIN && !!preview && !previewing && allSeen && message.length <= NOTICE_MAX;
  const nextVersion = rule ? Math.max(...rule.versions.map((v) => v.version)) + 1 : 0;
  const publish = async () => {
    if (!rule) return;
    const r = await s.publish(rule.id, { params, effectiveFrom: effective, reason, notice: notify ? { message } : null, acknowledged: acks.filter((a) => needed.includes(a)) });
    if (!r.ok) { setError(r.code ?? 'generic'); setStage('edit'); return; }
    toast.push(t(K.change.published, { version: nextVersion, name: ruleName(t, rule.id), date: formatDate(effective, i18n.language) }));
    s.openRule(null);
  };
  const all: Check[] = preview ? [...preview.newChecks, ...(preview.noticeShort ? [{ kind: 'notice_short' as const, scenarios: [], facts: {} }] : [])] : [];
  return (
    <Sheet open={!!rule} onClose={() => s.openRule(null)} title={rule ? t(K.change.title, { name: ruleName(t, rule.id) }) : ''} closeLabel={t(K.close)}>
      {rule && stage === 'edit' && (
        <div className="stack gap-3" data-form="change">
          <p className="t-sm t-muted">{t(K.change.now, { summary: summaryOf(t, rule.id, rule.current.params) })}</p>
          {rule.paramDefs.map((d) => (
            <Field key={d.key} label={t(K.param[d.key as ParamKey])} hint={t(K.param.range, { min: d.min, max: d.max })}>
              {(p) => <Input id={p.id} inputMode="decimal" value={vals[d.key] ?? ''} onChange={(e) => setVals({ ...vals, [d.key]: e.target.value.replace(/[^\d.]/g, '') })} data-f={d.key} />}
            </Field>
          ))}
          <Field label={t(K.change.effective)} hint={t(K.change.effectiveHint)}>{(p) => <Input id={p.id} type="date" min={isoDay(0)} value={effective} onChange={(e) => setEffective(e.target.value)} data-f="effective" />}</Field>
          {previewing && <p className="t-xs t-muted" role="status" data-previewing>{t(K.change.previewBusy)}</p>}
          {previewProblem && <p className="t-xs t-error" role="alert" data-problem={previewProblem}>{t(problemKey(previewProblem), { min: REASON_MIN })}</p>}
          {preview && (
            <div className="stack gap-2" data-preview>
              <h3 className="t-sm t-semibold">{t(K.change.previewHeading)}</h3>
              <p className="t-sm" data-significance={preview.significant ? 'big' : 'small'}>{preview.significant ? t(K.change.significant, { pct: Math.round(preview.size * 100) }) : t(K.change.small, { pct: Math.round(preview.size * 100) })}</p>
              <div className="stack gap-2" data-scenarios>
                <span className="t-xs t-muted">{t(K.change.scenarios)}</span>
                {preview.scenarios.map((sc) => {
                  const d = sc.after.total - sc.before.total;
                  return (
                    <div key={sc.id} className="stack gap-1" data-scenario={sc.id}>
                      <span className="t-sm">{t(K.scenario[sc.id])}</span>
                      <span className="t-xs num t-muted">{t(K.change.colNow)} {formatINR(sc.before.total)} · {t(K.change.colNew)} {formatINR(sc.after.total)} · {t(K.change.colChange)} {d > 0 ? '+' : ''}{formatINR(d)}</span>
                    </div>
                  );
                })}
              </div>
              <h3 className="t-sm t-semibold">{t(K.change.checksHeading)}</h3>
              {all.length === 0 && <p className="t-sm" data-no-checks>{t(K.change.noChecks)}</p>}
              {all.map((c) => (
                <div key={c.kind} className="stack gap-1" data-check={c.kind} style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 'var(--space-3)' }}>
                  <span className="row gap-2" style={{ alignItems: 'flex-start' }}><ShieldWarning size={16} aria-hidden="true" style={{ color: 'var(--color-warning)', flex: '0 0 auto', marginTop: 2 }} /><span className="t-sm">{checkText(t, c)}</span></span>
                  {c.scenarios.length > 0 && <span className="t-xs t-muted">{t(K.change.checkIn, { where: where(t, c) })}</span>}
                  <Checkbox checked={acks.includes(c.kind)} onChange={(on) => setAcks(on ? [...acks, c.kind] : acks.filter((a) => a !== c.kind))} label={t(K.change.ack)} data-ack={c.kind} />
                </div>
              ))}
            </div>
          )}
          <Field label={t(K.change.reason)} hint={t(K.change.reasonHint, { min: REASON_MIN })}>{(p) => <TextArea id={p.id} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} data-f="reason" />}</Field>
          {preview && preview.audience > 0 && (
            <div className="stack gap-2" data-notify>
              <Toggle checked={notify} onChange={(v) => { setNotify(v); setNotifyTouched(true); }} label={t(K.change.notify)} description={t(K.change.notifyBody, { count: preview.audience })} />
              {notify && <Field label={t(K.change.message)} hint={t(K.change.messageHint, { max: NOTICE_MAX })}>{(p) => <TextArea id={p.id} rows={2} value={message} maxLength={NOTICE_MAX} onChange={(e) => setMessage(e.target.value)} data-f="message" />}</Field>}
            </div>
          )}
          {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error), { min: REASON_MIN })}</p>}
          <Footer>
            <Button variant="ghost" onClick={() => s.openRule(null)}>{t(K.cancel)}</Button>
            <Button data-review disabled={!ready || s.busy} onClick={() => { setError(null); setStage('confirm'); }}>{t(K.change.review)}</Button>
          </Footer>
        </div>
      )}
      {rule && stage === 'confirm' && (
        <div className="stack gap-3" data-form="confirm">
          <div className="stack gap-2" style={{ border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
            <strong className="t-md">{t(K.change.confirmHeading)}</strong>
            <p className="t-sm" data-confirm-body>{t(K.change.confirmBody, { date: formatDate(effective, i18n.language), name: ruleName(t, rule.id), summary: summaryOf(t, rule.id, params), count: notify ? (preview?.audience ?? 0) : 0 })}</p>
          </div>
          <Footer>
            <Button variant="ghost" onClick={() => setStage('edit')}>{t(K.back)}</Button>
            <Button data-publish disabled={s.busy} onClick={() => void publish()}>{t(K.change.publish, { version: nextVersion })}</Button>
          </Footer>
        </div>
      )}
    </Sheet>
  );
}

/* ------------------------------------------------------------------ Simulator */

interface CrewRow { lead: boolean; minutes: string }
const lineKey = (l: SimLine) => `${l.stage}:${l.ruleId}:${l.partyId}`;

function SimulatorView({ data, s, t }: { data: CommissionRulesView; s: CommissionRulesState; t: T }) {
  const surveyorTiers = data.tiers.filter((x) => x.role === 'surveyor');
  const [dealValue, setDealValue] = useState('2500000');
  const [source, setSource] = useState<'field' | 'referral'>('field');
  const [tier, setTier] = useState(surveyorTiers[1]?.tier ?? surveyorTiers[0]?.tier ?? 'new');
  const [closedBy, setClosedBy] = useState<'none' | 'same' | 'other'>('none');
  const [crew, setCrew] = useState<CrewRow[]>([{ lead: true, minutes: '480' }, { lead: false, minutes: '480' }, { lead: false, minutes: '240' }]);
  const [inspectors, setInspectors] = useState('1');
  const [compare, setCompare] = useState<CommissionRuleId | ''>('');
  const [cvals, setCvals] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CommissionSimulationView | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const cmpRule = compare ? data.rules.find((r) => r.id === compare) ?? null : null;
  const input: SimInput = useMemo(() => ({
    dealValue: Number(dealValue) || 0,
    source,
    surveyorTier: tier,
    closer: closedBy !== 'none',
    closerIsOriginal: closedBy === 'same',
    crew: crew.map((c, i) => ({ id: `tech-${i + 1}`, isLead: c.lead, minutes: Number(c.minutes) || 0 })),
    inspectors: Number(inspectors) || 0,
  }), [dealValue, source, tier, closedBy, crew, inspectors]);
  const proposal = useMemo(() => {
    if (!cmpRule) return null;
    const p: CommissionParams = {};
    for (const d of cmpRule.paramDefs) { const n = Number(cvals[d.key]); (p as Record<string, number>)[d.key] = Number.isFinite(n) && cvals[d.key] !== '' ? n : (cmpRule.current.params as Record<string, number>)[d.key]; }
    return sameParams(p, cmpRule.current.params) ? null : [{ ruleId: cmpRule.id, params: p }];
  }, [cmpRule, cvals]);
  const key = JSON.stringify([input, proposal]);
  useEffect(() => {
    let live = true;
    setBusy(true);
    const h = window.setTimeout(async () => {
      const r = await s.simulate(input, proposal);
      if (!live) return;
      setBusy(false);
      if (r.ok && r.value) { setResult(r.value); setProblem(null); } else setProblem(r.code ?? 'generic');
    }, 250);
    return () => { live = false; window.clearTimeout(h); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const setLead = (i: number) => setCrew(crew.map((c, j) => ({ ...c, lead: j === i })));
  const cur = result?.current;
  const prop = result?.proposed ?? null;
  const proposedChecks = cur && prop ? newChecks(resultChecks('typical', prop), resultChecks('typical', cur)) : [];
  return (
    <div className="stack gap-4" data-simulator>
      <div className="stack gap-1"><h2 className="t-md t-semibold">{t(K.sim.heading)}</h2><p className="t-sm">{t(K.sim.body)}</p></div>
      <Card>
        <div className="stack gap-3" data-sim-form>
          <div className="grid-auto" style={{ '--min': '220px' } as React.CSSProperties}>
            <Field label={t(K.sim.value)}>{(p) => <Input id={p.id} inputMode="numeric" value={dealValue} onChange={(e) => setDealValue(e.target.value.replace(/\D/g, '').slice(0, 10))} data-f="dealValue" />}</Field>
            <Field label={t(K.sim.source)}>{(p) => <Select id={p.id} value={source} onChange={(e) => setSource(e.target.value as 'field' | 'referral')} data-f="source"><option value="field">{t(K.sim.sourceField)}</option><option value="referral">{t(K.sim.sourceReferral)}</option></Select>}</Field>
            <Field label={t(K.sim.tier)}>{(p) => <Select id={p.id} value={tier} onChange={(e) => setTier(e.target.value)} data-f="tier">{surveyorTiers.map((x) => <option key={x.tier} value={x.tier}>{t(`partnerTiers.tier.surveyor.${x.tier}`, { defaultValue: x.tier })}</option>)}</Select>}</Field>
            <Field label={t(K.sim.closedBy)}>{(p) => <Select id={p.id} value={closedBy} onChange={(e) => setClosedBy(e.target.value as 'none' | 'same' | 'other')} data-f="closedBy"><option value="none">{t(K.sim.closedNone)}</option><option value="same">{t(K.sim.closedSame)}</option><option value="other">{t(K.sim.closedOther)}</option></Select>}</Field>
          </div>
          <div className="stack gap-2" data-crew>
            <strong className="t-sm">{t(K.sim.crew)}</strong>
            {crew.map((c, i) => (
              <div key={i} className="row gap-2 wrap" style={{ alignItems: 'flex-end' }} data-crew-row={i + 1}>
                <span className="t-sm" style={{ minWidth: 110 }}>{t(K.sim.crewName, { n: i + 1 })}</span>
                <Checkbox checked={c.lead} onChange={() => setLead(i)} label={t(K.sim.crewLead)} />
                <Field label={t(K.sim.crewMinutes)}>{(p) => <Input id={p.id} inputMode="numeric" value={c.minutes} style={{ width: 110 }} onChange={(e) => setCrew(crew.map((x, j) => (j === i ? { ...x, minutes: e.target.value.replace(/\D/g, '').slice(0, 6) } : x)))} data-f={`minutes-${i + 1}`} />}</Field>
                {crew.length > 0 && <Button size="sm" variant="ghost" aria-label={t(K.sim.crewRemove, { n: i + 1 })} icon={<Trash size={16} />} onClick={() => setCrew(crew.filter((_, j) => j !== i))} data-crew-remove={i + 1} />}
              </div>
            ))}
            {crew.length < MAX_CREW && <div><Button size="sm" variant="secondary" icon={<Plus size={16} />} data-crew-add onClick={() => setCrew([...crew, { lead: crew.length === 0, minutes: '240' }])}>{t(K.sim.crewAdd)}</Button></div>}
          </div>
          <Field label={t(K.sim.inspectors)}>{(p) => <Select id={p.id} value={inspectors} onChange={(e) => setInspectors(e.target.value)} data-f="inspectors" style={{ maxWidth: 160 }}>{Array.from({ length: MAX_INSPECTORS + 1 }, (_, n) => <option key={n} value={String(n)}>{n}</option>)}</Select>}</Field>
          <div className="stack gap-2" data-compare>
            <Field label={t(K.sim.compare)} hint={compare ? t(K.sim.compareHint) : undefined}>{(p) => (
              <Select id={p.id} value={compare} onChange={(e) => { const v = e.target.value as CommissionRuleId | ''; setCompare(v); const r = v ? data.rules.find((x) => x.id === v) : null; setCvals(r ? Object.fromEntries(r.paramDefs.map((d) => [d.key, String((r.current.params as Record<string, number | undefined>)[d.key] ?? '')])) : {}); }} data-f="compare">
                <option value="">{t(K.sim.compareNone)}</option>
                {data.rules.map((r) => <option key={r.id} value={r.id}>{ruleName(t, r.id)}</option>)}
              </Select>
            )}</Field>
            {cmpRule && <div className="grid-auto" style={{ '--min': '200px' } as React.CSSProperties}>{cmpRule.paramDefs.map((d) => <Field key={d.key} label={t(K.param[d.key as ParamKey])} hint={t(K.param.range, { min: d.min, max: d.max })}>{(p) => <Input id={p.id} inputMode="decimal" value={cvals[d.key] ?? ''} onChange={(e) => setCvals({ ...cvals, [d.key]: e.target.value.replace(/[^\d.]/g, '') })} data-f={`compare-${d.key}`} />}</Field>)}</div>}
          </div>
        </div>
      </Card>
      {problem && <p className="t-xs t-error" role="alert" data-problem={problem}>{t(problemKey(problem), { min: REASON_MIN })}</p>}
      {!cur && !problem && <LoadingState label={t(K.sim.busy)} variant="block" />}
      {cur && (
        <Card>
          <div className="stack gap-3" data-sim-result style={busy ? { opacity: 0.6 } : undefined}>
            <h2 className="t-md t-semibold">{t(K.sim.results)}</h2>
            {cur.lines.length === 0 && !prop && <EmptyState title={t(K.sim.noLines)} body={t(K.sim.noLines)} />}
            {(['capture', 'deal_won', 'handover'] as const).map((stage) => {
              const keys = [...new Set([...cur.lines.filter((l) => l.stage === stage).map(lineKey), ...(prop?.lines.filter((l) => l.stage === stage).map(lineKey) ?? [])])];
              if (keys.length === 0) return null;
              return (
                <div key={stage} className="stack gap-1" data-stage={stage}>
                  <strong className="t-sm">{t(K.sim.stage[stage])}</strong>
                  <div className="row between t-xs t-muted"><span /><span className="row gap-4"><span style={{ minWidth: 90, textAlign: 'right' }}>{t(K.sim.colNow)}</span>{prop && <span style={{ minWidth: 90, textAlign: 'right' }}>{t(K.sim.colProposed)}</span>}</span></div>
                  {keys.map((k2) => {
                    const a = cur.lines.find((l) => lineKey(l) === k2);
                    const b = prop?.lines.find((l) => lineKey(l) === k2);
                    const any = (a ?? b) as SimLine;
                    return (
                      <div key={k2} className="row between wrap" style={{ gap: 'var(--space-2)' }} data-line={k2}>
                        <span className="t-sm">{t(K.sim.line, { party: t(K.sim.party[any.party]), rule: ruleName(t, any.ruleId), version: a?.version ?? any.version })}</span>
                        <span className="row gap-4 num t-sm"><span style={{ minWidth: 90, textAlign: 'right' }}>{a ? formatINR(a.amount) : '—'}</span>{prop && <span style={{ minWidth: 90, textAlign: 'right' }}>{b ? formatINR(b.amount) : '—'}</span>}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            <div className="row between" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }} data-total>
              <strong className="t-sm">{t(K.sim.total)}</strong>
              <span className="row gap-4 num t-semibold"><span style={{ minWidth: 90, textAlign: 'right' }}>{formatINR(cur.total)}</span>{prop && <span style={{ minWidth: 90, textAlign: 'right' }}>{formatINR(prop.total)}</span>}</span>
            </div>
            <p className="t-sm" data-burden>{t(K.sim.burden, { pct: cur.burdenPct })}{prop ? ` → ${t(K.sim.burden, { pct: prop.burdenPct })}` : ''}</p>
            {cur.topParty && <p className="t-xs t-muted">{t(K.sim.top, { amount: formatINR(cur.topParty.amount) })}</p>}
            {cur.floorApplied && <p className="t-xs t-muted" data-floor>{t(K.sim.floorNote)}</p>}
            {cur.dropped.length > 0 && (
              <div className="stack gap-1" data-dropped>
                <strong className="t-sm">{t(K.sim.dropped)}</strong>
                {cur.dropped.map((d) => <p key={`${d.stage}:${d.ruleId}:${d.partyId}`} className="t-xs">{t(K.sim.droppedRow, { rule: ruleName(t, d.ruleId), because: ruleName(t, d.because) })}</p>)}
              </div>
            )}
            {prop && proposedChecks.length > 0 && (
              <div className="stack gap-1" data-proposed-checks>
                <strong className="t-sm">{t(K.sim.proposedChecks)}</strong>
                {mergeChecks(proposedChecks).map((c) => <p key={c.kind} className="t-xs" style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 'var(--space-3)' }}>{checkText(t, c)}</p>)}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ History */

function HistoryView({ data, t }: { data: CommissionRulesView; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const TONE: Record<'current' | 'past' | 'upcoming', BadgeTone> = { current: 'success', past: 'neutral', upcoming: 'accent' };
  return (
    <div className="stack gap-3" data-history>
      <p className="t-sm">{t(K.history.intro)}</p>
      {data.rules.map((r) => (
        <Card key={r.id}>
          <details data-history-rule={r.id} open={r.versions.length > 1}>
            <summary className="row between" style={{ cursor: 'pointer', gap: 'var(--space-2)' }}><strong className="t-md">{ruleName(t, r.id)}</strong><span className="t-xs t-muted">{t(K.history.versions, { count: r.versions.length })}</span></summary>
            <div className="stack gap-3 mt-2">
              {r.versions.map((v) => (
                <div key={v.version} className="stack gap-1" data-version-row={v.version} style={{ borderLeft: '3px solid var(--color-border)', paddingLeft: 'var(--space-3)' }}>
                  <span className="row gap-2 wrap" style={{ alignItems: 'center' }}><strong className="t-sm">{t(K.card.version, { version: v.version, date: formatDate(v.effectiveFrom, lang) })}</strong><Badge tone={TONE[v.state]}>{t(K.history.state[v.state])}</Badge></span>
                  <span className="t-sm num">{summaryOf(t, r.id, v.params)}</span>
                  <span className="t-xs t-muted">{v.version === 1 ? t(K.history.start) : v.reason}</span>
                  {v.version > 1 && <span className="t-xs t-muted">{t(K.history.by, { name: v.setByName, date: formatDate(v.at, lang) })}</span>}
                  {v.version > 1 && <span className="t-xs t-muted">{v.notice ? (v.notice.message ? t(K.history.notice, { date: formatDate(v.notice.sentAt, lang), count: v.notice.recipients, message: v.notice.message }) : t(K.history.noticeBare, { date: formatDate(v.notice.sentAt, lang), count: v.notice.recipients })) : t(K.history.noticeNone)}</span>}
                  {v.acknowledged.length > 0 && <span className="t-xs t-muted">{t(K.history.seen, { what: v.acknowledged.map((a) => t(`commissionRules.checkName.${a}`, { defaultValue: a })).join(' · ') })}</span>}
                  <span className="t-xs t-muted">{t(K.history.entries, { count: v.entries.count, amount: formatINR(v.entries.amount) })}</span>
                </div>
              ))}
            </div>
          </details>
        </Card>
      ))}
    </div>
  );
}
