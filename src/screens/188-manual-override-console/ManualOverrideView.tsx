import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Check, Prohibit, WarningOctagon } from '@phosphor-icons/react';
import { Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, TextArea, formatDateTime, formatINR, useToast } from '@/design-system';
import type { OverrideCandidate, OverrideConsoleView, OverridePreviewView } from '@/data/repository';
import type { ManualOverride } from '@/data/types';
import { OVERRIDABLE_STAGES, OVERRIDE_KINDS, PROTECTED_KINDS, REASON_MIN, STOP_MAX_DAYS, lettersOf, untilProblem } from '@/features/override/rules';
import { AUDIT_ROUTE, MANUAL_OVERRIDE_KEYS as K } from './manual-override.types';
import { useManualOverride } from './useManualOverride';
import type { ManualOverrideState } from './useManualOverride';

type T = ReturnType<typeof useTranslation>['t'];
const errText = (t: T, code: string) => t(`manualOverride.error.${code}`, { defaultValue: t(K.error.generic) });
const valueText = (t: T, token: string): string => {
  const m = /^paused until (.+)$/.exec(token);
  return m ? t(K.value.pausedUntil, { date: m[1] }) : t(`manualOverride.value.${token}`, { defaultValue: token });
};

function effectText(t: T, e: { key: string; params?: Record<string, string | number> }): string {
  const p = { ...(e.params ?? {}) } as Record<string, string | number>;
  if (e.key === 'stage') { p.from = valueText(t, String(p.from)); p.to = valueText(t, String(p.to)); }
  if (e.key === 'skipped') p.stages = String(p.stages).split(', ').map((x) => valueText(t, x)).join(', ');
  if (e.key === 'payout') { p.amount = formatINR(Number(p.amount)); p.state = valueText(t, String(p.state)); }
  if (e.key === 'owing') p.amount = formatINR(Number(p.amount));
  if (e.key === 'flagsSeen') p.flags = String(p.flags).split(', ').map((f) => t(`payoutApproval.flag.${f}`, { defaultValue: f.replace(/_/g, ' ') })).join(', ');
  return t(`manualOverride.effect.${e.key}`, p);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="stack gap-2">
      <h2 className="t-md t-semibold" style={{ borderTop: '1px solid var(--color-accent-primary)', paddingTop: 12 }}>{title}</h2>
      {children}
    </section>
  );
}

/** Screen 188 — Manual Override Console. A form: one column, labels above inputs, grouped under gold-hairline headings, checked as you type, remembered on the phone. What follows is previewed before a confirmation sheet that warns in plain words; a guardrail with no override is refused, and the attempt kept. */
export function ManualOverrideScreen() {
  const { t, i18n } = useTranslation();
  const s = useManualOverride();
  const v = s.view;
  const head = <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />;
  if (s.load === 'loading' && !v) return <Screen width="narrow">{head}<LoadingState label={t(K.loading)} variant="list" rows={4} /></Screen>;
  if (s.load === 'error' && !v) return <Screen width="narrow">{head}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.refresh()} /></Screen>;
  if (!v) return null;
  return (
    <Screen width="narrow">
      {head}
      <div className="stack gap-4">
        {s.offline && <p className="t-xs t-muted" role="status" data-offline>{t(K.offline)}</p>}
        <Card><div className="stack gap-1" data-intro><span className="t-sm t-semibold row gap-2" style={{ alignItems: 'center', color: 'var(--color-warning)' }}><WarningOctagon size={18} aria-hidden="true" />{t(K.intro.title)}</span><p className="t-xs">{t(K.intro.body)}</p></div></Card>
        <Patterns v={v} t={t} />
        <Form s={s} v={v} t={t} />
        <Absolute s={s} v={v} t={t} />
        <Recent v={v} t={t} lang={i18n.language} />
        <p className="t-xs t-muted" data-placeholder-note>{t(K.note.placeholders)}</p>
      </div>
    </Screen>
  );
}

function Patterns({ v, t }: { v: OverrideConsoleView; t: T }) {
  const nav = useNavigate();
  if (v.patterns.length === 0) return null;
  return (
    <div className="stack gap-2" data-patterns>
      {v.patterns.map((p) => (
        <Card key={p.kind}>
          <div className="stack gap-1" data-pattern={p.kind}>
            <span className="t-sm t-semibold">{t(K.pattern.title)} · {t(`manualOverride.kind.${p.kind}.name`)}</span>
            <p className="t-xs">{t(K.pattern.body, { count: p.count })}</p>
            {p.ruleRoute && <div><Button size="sm" variant="secondary" onClick={() => nav(p.ruleRoute!)}>{t(K.pattern.fix)} <ArrowRight size={14} /></Button></div>}
          </div>
        </Card>
      ))}
    </div>
  );
}

function Form({ s, v, t }: { s: ManualOverrideState; v: OverrideConsoleView; t: T }) {
  const [reviewing, setReviewing] = useState(false);
  const reasonOk = lettersOf(s.draft.reason) >= REASON_MIN;
  const untilIssue = s.kind === 'stop_reminders' && s.draft.until ? untilProblem(s.draft.until, Date.now()) : null;
  const canReview = s.ready && reasonOk && !!s.preview && !s.preview.blocked && !untilIssue;
  return (
    <>
      <Section title={t(K.step.what)}>
        <div className="stack gap-2" role="radiogroup" aria-label={t(K.step.what)} data-kinds>
          {OVERRIDE_KINDS.map((k) => (
            <button key={k} type="button" role="radio" aria-checked={s.kind === k} data-kind={k} onClick={() => s.setKind(k)} className="stack gap-1" style={{ textAlign: 'start', cursor: 'pointer', padding: 12, borderRadius: 16, border: `1px solid ${s.kind === k ? 'var(--color-accent-primary)' : 'var(--color-border)'}`, background: s.kind === k ? 'var(--color-surface)' : 'transparent', color: 'inherit' }}>
              <span className="t-sm t-semibold">{t(`manualOverride.kind.${k}.name`)}</span>
              <span className="t-xs t-muted">{t(`manualOverride.kind.${k}.body`)}</span>
              {(v.kinds.find((x) => x.kind === k)?.recent ?? 0) > 0 && <span className="t-xs t-muted">{v.kinds.find((x) => x.kind === k)?.recent} / 30</span>}
            </button>
          ))}
        </div>
      </Section>
      {s.kind && (
        <>
          <Section title={t(K.step.which)}>
            <Field label={t(K.which.search)}>{(p) => <Input id={p.id} type="search" value={s.q} data-f="search" onChange={(e) => s.setQ(e.target.value)} />}</Field>
            <Candidates s={s} t={t} />
          </Section>
          {(s.kind === 'lead_stage' || s.kind === 'stop_reminders') && (
            <Section title={t(K.step.how)}>
              {s.kind === 'lead_stage' ? (
                <div className="stack gap-2" role="group" aria-label={t(K.how.stage)} data-stages>
                  <span className="t-sm">{t(K.how.stage)}</span>
                  <div className="row gap-2 wrap">{OVERRIDABLE_STAGES.map((st) => <span key={st} data-stage={st}><Chip pressed={s.draft.stage === st} onClick={() => s.edit({ stage: st })}>{valueText(t, st)}</Chip></span>)}</div>
                  <p className="t-xs t-muted">{t(K.how.stageNote)}</p>
                </div>
              ) : (
                <Field label={t(K.how.until)} hint={t(K.how.untilHint)} error={untilIssue ? errText(t, untilIssue) : undefined}>{(p) => <Input id={p.id} type="date" value={s.draft.until} max={new Date(Date.now() + STOP_MAX_DAYS * 86_400_000).toISOString().slice(0, 10)} min={new Date().toISOString().slice(0, 10)} data-f="until" invalid={!!untilIssue} onChange={(e) => s.edit({ until: e.target.value })} />}</Field>
              )}
              {s.kind === 'stop_reminders' && s.draft.until && !untilIssue && <p className="t-xs row gap-1" data-until-ok style={{ alignItems: 'center', color: 'var(--color-success)' }}><Check size={14} aria-hidden="true" />{t(K.how.valid)}</p>}
            </Section>
          )}
          <Section title={t(K.step.why)}>
            <Field label={t(K.why.label)} hint={`${Math.min(lettersOf(s.draft.reason), 999)}/${REASON_MIN} · ${t(K.why.hint)}`}>{(p) => <TextArea id={p.id} rows={3} value={s.draft.reason} data-f="reason" onChange={(e) => s.edit({ reason: e.target.value })} />}</Field>
            {reasonOk && <p className="t-xs row gap-1" data-reason-ok style={{ alignItems: 'center', color: 'var(--color-success)' }}><Check size={14} aria-hidden="true" />{t(K.why.valid)}</p>}
            <p className="t-xs t-muted">{t(K.why.draft)}</p>
          </Section>
          <Preview preview={s.preview} ready={s.ready} t={t} />
          <div className="sticky-actions" style={{ position: 'sticky', bottom: 'calc(var(--shell-bottom-height, 0px) + 8px)', zIndex: 2 }}>
            <Button className="grow" data-act="review" disabled={!canReview} onClick={() => setReviewing(true)}>{t(K.review.button)}</Button>
          </div>
          <Review open={reviewing} onClose={() => setReviewing(false)} s={s} t={t} />
        </>
      )}
    </>
  );
}

function Candidates({ s, t }: { s: ManualOverrideState; t: T }) {
  const list: OverrideCandidate[] | null = s.candidates;
  if (list === null) return <LoadingState label={t(K.loading)} variant="list" rows={3} />;
  if (list.length === 0) return <p className="t-xs t-muted" data-none>{t(K.which.none)}</p>;
  return (
    <div className="stack gap-0" role="radiogroup" aria-label={t(K.step.which)} data-candidates>
      {list.map((c) => {
        const chosen = s.draft.targetId === c.id;
        return (
          <button key={c.id} type="button" role="radio" aria-checked={chosen} disabled={c.blocked} data-candidate={c.id} onClick={() => s.edit({ targetId: c.id })} className="row" style={{ background: chosen ? 'var(--color-surface)' : 'none', border: 0, borderBottom: '1px solid var(--color-border)', borderInlineStart: chosen ? '3px solid var(--color-accent-primary)' : '3px solid transparent', padding: '10px 8px', width: '100%', textAlign: 'start', cursor: c.blocked ? 'not-allowed' : 'pointer', color: 'inherit', opacity: c.blocked ? 0.6 : 1, gap: 8, alignItems: 'center' }}>
            <span className="stack gap-0 grow"><span className="t-sm t-semibold">{c.label}</span><span className="t-xs t-muted">{valueText(t, c.detail)}{c.days !== null ? ` · ${c.days >= 0 && s.kind !== 'commitment_waive' ? t(K.which.days, { days: c.days }) : c.days > 0 ? t(K.which.overdue, { days: c.days }) : ''}` : ''}</span></span>
            {c.blocked ? <Badge tone="error"><Prohibit size={12} /> {t(K.which.blocked)}</Badge> : c.highlight ? <Badge tone="warning">{s.kind === 'payout_clear' ? t(K.which.held) : t(K.which.stuck)}</Badge> : null}
          </button>
        );
      })}
    </div>
  );
}

function Preview({ preview, ready, t }: { preview: OverridePreviewView | null; ready: boolean; t: T }) {
  return (
    <Section title={t(K.preview.title)}>
      {!ready || !preview ? <p className="t-xs t-muted" data-preview-empty>{t(K.preview.pick)}</p> : (
        <Card>
          <div className="stack gap-2" data-preview data-blocked={preview.blocked ?? ''}>
            <span className="t-sm t-semibold">{preview.target.label}</span>
            {!preview.blocked && <span className="t-xs" style={{ fontFamily: 'var(--font-mono)' }}>{t(K.preview.change, { from: valueText(t, preview.before), to: valueText(t, preview.after) })}</span>}
            {preview.blocked ? (
              <p className="t-sm" role="alert" style={{ color: 'var(--color-error)' }}><strong>{t(K.preview.blocked)}.</strong> {errText(t, preview.blocked)}</p>
            ) : (
              <ul className="stack gap-1" style={{ margin: 0, paddingInlineStart: 18 }}>{preview.effects.map((e, i) => <li key={`${e.key}${i}`} className="t-xs" data-effect={e.key}>{effectText(t, e)}</li>)}</ul>
            )}
          </div>
        </Card>
      )}
    </Section>
  );
}

function Review({ open, onClose, s, t }: { open: boolean; onClose: () => void; s: ManualOverrideState; t: T }) {
  const toast = useToast();
  const [ack, setAck] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const p = s.preview;
  const apply = async () => { setProblem(null); const r = await s.apply(); if (r.ok) { onClose(); setAck(false); toast.push(t(K.review.done, { code: r.value.code })); } else setProblem(r.problem); };
  return (
    <Sheet open={open && !!p} onClose={() => { onClose(); setAck(false); setProblem(null); }} title={t(K.review.title)} closeLabel={t(K.close)}>
      {p && (
        <div className="stack gap-3" data-review>
          <p className="t-sm t-semibold row gap-2" style={{ alignItems: 'center', color: 'var(--color-error)' }}><WarningOctagon size={18} aria-hidden="true" />{t(K.review.warning)}</p>
          <div className="stack gap-0"><span className="t-xs t-muted">{t(K.review.target)}</span><span className="t-sm t-semibold">{p.target.label}</span><span className="t-xs" style={{ fontFamily: 'var(--font-mono)' }}>{t(K.preview.change, { from: valueText(t, p.before), to: valueText(t, p.after) })}</span></div>
          <ul className="stack gap-1" style={{ margin: 0, paddingInlineStart: 18 }}>{p.effects.map((e, i) => <li key={`${e.key}${i}`} className="t-xs">{effectText(t, e)}</li>)}</ul>
          <div className="stack gap-0"><span className="t-xs t-muted">{t(K.review.reason)}</span><span className="t-sm" style={{ overflowWrap: 'anywhere' }}>{s.draft.reason}</span></div>
          <Checkbox checked={ack} onChange={setAck} label={t(K.review.understand)} />
          {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
          <div className="row gap-2"><Button variant="ghost" onClick={() => { onClose(); setAck(false); }}>{t(K.review.back)}</Button><Button className="grow" data-act="apply" disabled={!ack} loading={s.busy} onClick={() => void apply()} style={{ color: 'var(--color-error)' }}>{t(K.review.apply)}</Button></div>
        </div>
      )}
    </Sheet>
  );
}

function Absolute({ s, v, t }: { s: ManualOverrideState; v: OverrideConsoleView; t: T }) {
  const nav = useNavigate();
  const [pk, setPk] = useState<string>(PROTECTED_KINDS[0]);
  const [target, setTarget] = useState('');
  const [reason, setReason] = useState('');
  const [result, setResult] = useState<'refused' | string | null>(null);
  const ask = async () => { setResult(null); const r = await s.tryProtected(pk, target.trim() || pk, reason); setResult(r.ok ? 'applied' : r.problem === 'no_override_path' ? 'refused' : r.problem); };
  return (
    <Section title={t(K.absolute.title)}>
      <p className="t-xs">{t(K.absolute.body)}</p>
      <div className="stack gap-2" data-absolute>
        {v.protectedKinds.map((p) => (
          <Card key={p.kind}>
            <div className="row between" data-protected={p.kind} style={{ alignItems: 'center', gap: 8 }}>
              <span className="stack gap-0"><span className="t-sm t-semibold row gap-1" style={{ alignItems: 'center' }}><Prohibit size={14} aria-hidden="true" />{t(`manualOverride.absolute.${p.kind}`)}</span>{p.attempts > 0 && <span className="t-xs t-muted">{t(K.absolute.attempts, { count: p.attempts })}</span>}</span>
              <Button size="sm" variant="ghost" onClick={() => nav(p.route)}>{t(K.absolute.fix)} <ArrowRight size={14} /></Button>
            </div>
          </Card>
        ))}
      </div>
      <details data-try>
        <summary className="t-xs" style={{ cursor: 'pointer' }}>{t(K.absolute.try)}</summary>
        <div className="stack gap-2" style={{ marginTop: 8 }}>
          <p className="t-xs t-muted">{t(K.absolute.tryHint)}</p>
          <Field label={t(K.absolute.which)}>{(p) => <Select id={p.id} value={pk} data-f="pk" onChange={(e) => setPk(e.target.value)}>{PROTECTED_KINDS.map((k) => <option key={k} value={k}>{t(`manualOverride.absolute.${k}`)}</option>)}</Select>}</Field>
          <Field label={t(K.absolute.target)}>{(p) => <Input id={p.id} value={target} data-f="ptarget" onChange={(e) => setTarget(e.target.value)} />}</Field>
          <Field label={t(K.why.label)}>{(p) => <TextArea id={p.id} rows={2} value={reason} data-f="preason" onChange={(e) => setReason(e.target.value)} />}</Field>
          <div><Button size="sm" variant="secondary" data-act="ask" loading={s.busy} onClick={() => void ask()}>{t(K.absolute.ask)}</Button></div>
          {result === 'refused' && <p className="t-sm" role="alert" data-refused style={{ color: 'var(--color-error)' }}>{t(K.absolute.refused)}</p>}
          {result && result !== 'refused' && <p className="t-sm t-error" role="alert">{errText(t, result)}</p>}
        </div>
      </details>
    </Section>
  );
}

function Recent({ v, t, lang }: { v: OverrideConsoleView; t: T; lang: string }) {
  const nav = useNavigate();
  return (
    <Section title={t(K.recent.title)}>
      {v.recent.length === 0 ? <EmptyState title={t(K.recent.empty)} body={t(K.recent.emptyBody)} /> : (
        <div className="stack gap-2" data-recent>
          {v.recent.map((o: ManualOverride) => (
            <Card key={o.id}>
              <div className="stack gap-1" data-override={o.id} data-status={o.status}>
                <div className="row between" style={{ alignItems: 'center', gap: 8 }}>
                  <span className="t-sm t-semibold">{o.code} · {t(`manualOverride.kind.${o.kind}.name`, { defaultValue: t(`manualOverride.absolute.${o.kind}`, { defaultValue: o.kind }) })}</span>
                  <Badge tone={o.status === 'applied' ? 'success' : 'error'}>{o.status === 'applied' ? t(K.recent.applied) : t(K.recent.refused)}</Badge>
                </div>
                <span className="t-xs">{o.targetLabel}</span>
                {o.status === 'applied' && <span className="t-xs" style={{ fontFamily: 'var(--font-mono)' }}>{t(K.preview.change, { from: valueText(t, o.before), to: valueText(t, o.after) })}</span>}
                {o.refusal && <span className="t-xs" style={{ color: 'var(--color-error)' }}>{errText(t, o.refusal)}</span>}
                <span className="t-xs" style={{ overflowWrap: 'anywhere' }}>{o.reason}</span>
                <span className="t-xs t-muted">{t(K.recent.by, { name: o.byName, date: formatDateTime(o.at, lang) })}</span>
                {o.status === 'applied' && <div><Button size="sm" variant="ghost" onClick={() => nav(AUDIT_ROUTE)}>{t(K.recent.audit)} <ArrowRight size={14} /></Button></div>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Section>
  );
}
