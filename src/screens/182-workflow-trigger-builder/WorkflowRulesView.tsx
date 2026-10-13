import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, CheckCircle, Copy, FloppyDisk, Lightning, Pause, Plus, Warning, X } from '@phosphor-icons/react';
import { ActionBar, Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, TextArea, formatDate, formatINR, useToast } from '@/design-system';
import type { CustomRuleView, CustomRulesView } from '@/data/repository';
import { FIELDS, MANY_AT, MAX_CONDITIONS, NOTE_MAX, OPS, SUBJECT_IDS, STARTERS, defaultCondition, fieldDef, parseNumber } from '@/features/automation/customRules';
import type { Condition, FieldDef, Op, RecordValues, RuleDraft, SubjectId } from '@/features/automation/customRules';
import { WORKFLOW_RULES_KEYS as K } from './workflow-rules.types';
import { useWorkflowRules } from './useWorkflowRules';
import type { WorkflowState } from './useWorkflowRules';

type T = ReturnType<typeof useTranslation>['t'];
const TONE: Record<string, 'success' | 'warning' | 'neutral' | 'accent'> = { active: 'success', draft: 'accent', paused: 'warning', retired: 'neutral' };
const problemText = (t: T, code: string) => t(`workflowRules.problem.${code}`, { defaultValue: t(K.problem.generic) });
const ago = (iso: string): string => { const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000)); return m < 1 ? '<1 min' : m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`; };

const valueText = (t: T, subject: SubjectId, c: Condition): string => {
  const def = fieldDef(subject, c.field);
  if (!def) return c.value;
  if (def.kind === 'money') return formatINR(parseNumber(c.value) ?? 0);
  if (def.kind === 'number') return `${c.value}${def.unit ? ` ${t(`workflowRules.unit.${def.unit}`)}` : ''}`;
  if (def.kind === 'choice') return t(`workflowRules.choice.${subject}.${c.field}.${c.value}`, { defaultValue: c.value });
  if (def.kind === 'bool') return c.value === 'yes' ? t(K.yes) : t(K.no);
  return c.value;
};
function sentenceOf(t: T, d: RuleDraft, templates: { groupId: string; name: string }[]): string | null {
  const done = d.conditions.filter((c) => c.value.trim() !== '' || fieldDef(d.subject, c.field)?.kind === 'bool');
  if (done.length === 0) return null;
  const conds = done.map((c) => t(K.summary.condition, { field: t(`workflowRules.field.${d.subject}.${c.field}`), op: t(`workflowRules.op.${c.op}`), value: valueText(t, d.subject, c) })).join(` ${d.logic === 'all' ? t(K.summary.and) : t(K.summary.or)} `);
  const then = d.action.kind === 'alert' ? t(K.summary.then.alert, { severity: t(`workflowRules.severity.${d.action.severity ?? 'medium'}`).toLowerCase() }) : d.action.kind === 'task' ? t(K.summary.then.task, { days: d.action.dueInDays ?? '…' }) : t(K.summary.then.message, { template: templates.find((x) => x.groupId === d.action.templateGroupId)?.name ?? '…' });
  return `${t(K.summary.watch, { subject: t(`workflowRules.subject.${d.subject}`) })}, ${t(K.summary.when)} ${conds}, ${t(K.summary.thenWord)} ${then}.`;
}

/** Screen 182 — Workflow Trigger Builder. A library of custom rules and a form that builds one in plain words, with live checks, an overlap warning, a test before activation, and retirement that keeps the whole history. */
export function WorkflowRulesScreen() {
  const { t, i18n } = useTranslation();
  const s = useWorkflowRules();
  const v = s.view;
  const head = (extra?: ReactNode) => (
    <ScreenHeader title={s.editing ? t(s.ruleId === 'new' ? K.builder.new : K.title) : t(K.title)} subtitle={t(K.subtitle)} action={<span className="row gap-2">{extra}<Button size="sm" variant="ghost" data-refresh onClick={() => void s.refresh()} aria-label={t(K.refresh)}><ArrowsClockwise size={18} /></Button></span>} />
  );
  if (s.load === 'loading' && !v) return <Screen width="narrow">{head()}<LoadingState label={t(K.loading)} variant="cards" rows={3} /></Screen>;
  if (s.load === 'error' && !v) return <Screen width="narrow">{head()}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /></Screen>;
  if (!v) return null;
  if (s.editing) {
    if (s.ruleId !== 'new' && !s.rule) return <Screen width="narrow">{head()}<EmptyState title={t(K.notFound)} body="" actionLabel={t(K.back)} onAction={s.toList} /></Screen>;
    return <Builder s={s} v={v} t={t} lang={i18n.language} head={head} />;
  }
  return <Library s={s} v={v} t={t} lang={i18n.language} head={head} />;
}

/* ------------------------------------------------------------------ the library */

function Library({ s, v, t, lang, head }: { s: WorkflowState; v: CustomRulesView; t: T; lang: string; head: (extra?: ReactNode) => ReactNode }) {
  const toast = useToast();
  const [retiring, setRetiring] = useState<CustomRuleView | null>(null);
  const [reason, setReason] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const counts = { active: 0, draft: 0, paused: 0, retired: 0 } as Record<string, number>;
  for (const r of v.rules) counts[r.status] += 1;
  const shown = v.rules.filter((r) => s.filter === 'all' || r.status === s.filter);
  const retire = async () => { if (!retiring) return; setProblem(null); const r = await s.retire(reason.trim()); if (r.ok) { setRetiring(null); setReason(''); } else setProblem(r.problem); };
  return (
    <Screen width="narrow">
      {head(<Button size="sm" data-act="new" onClick={() => s.newRule()}><Plus size={16} /> {t(K.new)}</Button>)}
      <div className="stack gap-3">
        {s.offline && <p className="t-xs t-muted" role="status" data-offline>{t(K.error.body)}</p>}
        <Card><div className="stack gap-1"><span className="t-sm t-semibold">{t(K.why.title)}</span><p className="t-xs">{t(K.why.body)}</p></div></Card>
        <div className="row gap-2 wrap" role="group" data-filters>
          {(['active', 'draft', 'paused', 'retired', 'all'] as const).map((f) => <span key={f} data-f={f}><Chip pressed={s.filter === f} onClick={() => s.setFilter(f)}>{t(`workflowRules.filter.${f}`)}{f !== 'all' && counts[f] > 0 ? ` · ${counts[f]}` : ''}</Chip></span>)}
        </div>
        <section className="stack gap-2" data-library>
          <h2 className="t-md t-semibold">{t(K.library.title)}</h2>
          {v.rules.length === 0 && <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />}
          {v.rules.length > 0 && shown.length === 0 && <p className="t-sm t-muted">{t(K.empty.filtered)}</p>}
          {shown.map((r) => (
            <Card key={r.id}>
              <div className="stack gap-2" data-rule={r.id} data-status={r.status}>
                <button type="button" className="tappable" data-act="open" onClick={() => s.openRule(r.id)} style={{ display: 'block', textAlign: 'left', width: '100%', background: 'none', border: 0, padding: 0 }}>
                  <span className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center' }}><span className="t-sm t-semibold">{r.name}</span><Badge tone={TONE[r.status]}>{t(`workflowRules.status.${r.status}`)}</Badge></span>
                </button>
                <p className="t-xs">{sentenceOf(t, { name: r.name, subject: r.subject, logic: r.logic, conditions: r.conditions, action: r.action }, v.templates)}</p>
                <span className="t-xs t-muted">{r.code} · {t(K.card.fired, { count: r.firedTotal })} · {r.firings[0] ? t(K.card.lastActed, { when: ago(r.firings[0].at) }) : t(K.card.neverActed)}{r.status !== 'retired' ? ` · ${t(K.card.matching, { count: r.matchedNow })}` : ''}</span>
                {r.conflicts.length > 0 && r.status !== 'retired' && <span className="t-xs" data-conflict><Warning size={12} aria-hidden="true" /> {t(K.card.conflict)}</span>}
                <div className="row gap-2 wrap">
                  <Button size="sm" variant="secondary" data-act="open" onClick={() => s.openRule(r.id)}>{t(K.card.open)}</Button>
                  <Button size="sm" variant="ghost" data-act="copy" onClick={() => void s.copy(r.id).then((x) => { if (!x.ok) toast.push(problemText(t, x.problem)); })}><Copy size={14} /> {t(K.card.copy)}</Button>
                  {r.status === 'active' && <Button size="sm" variant="ghost" data-act="pause" onClick={() => void s.pauseId(r.id)}><Pause size={14} /> {t(K.card.pause)}</Button>}
                  {r.status !== 'retired' && <Button size="sm" variant="ghost" data-act="retire" onClick={() => setRetiring(r)}>{t(K.card.retire)}</Button>}
                </div>
              </div>
            </Card>
          ))}
        </section>
        <section className="stack gap-2" data-starters>
          <h2 className="t-md t-semibold">{t(K.starters.title)}</h2>
          {STARTERS.map((st) => (
            <Card key={st.id}>
              <div className="stack gap-1" data-starter={st.id}>
                <span className="t-sm t-semibold">{t(`workflowRules.starter.${st.id}.name`)}</span>
                <span className="t-xs t-muted">{t(`workflowRules.starter.${st.id}.hint`)}</span>
                <div><Button size="sm" variant="secondary" data-act="use" onClick={() => s.newRule(st.id)}>{t(K.starters.use)}</Button></div>
              </div>
            </Card>
          ))}
        </section>
        <p className="t-xs t-muted" data-placeholder-note>{t(K.notice.placeholders)}</p>
        <span className="sr-only">{formatDate(v.at, lang)}</span>
      </div>
      <Sheet open={!!retiring} onClose={() => { setRetiring(null); setProblem(null); }} title={t(K.retire.title)} closeLabel={t(K.close)}>
        <div className="stack gap-3" data-retire>
          <p className="t-sm">{retiring?.name}</p>
          <p className="t-xs">{t(K.retire.body)}</p>
          <Field label={t(K.retire.reason)}>{(p) => <TextArea id={p.id} rows={3} value={reason} data-f="reason" onChange={(e) => setReason(e.target.value)} />}</Field>
          {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{problemText(t, problem)}</p>}
          <Button block data-act="retire-confirm" disabled={reason.replace(/[^\p{L}]/gu, '').length < 10} loading={s.busy} onClick={() => void retire()}>{t(K.retire.confirm)}</Button>
        </div>
      </Sheet>
    </Screen>
  );
}

/* ------------------------------------------------------------------ the builder */

function ConditionRow({ c, subject, i, set, remove, t, canRemove }: { c: Condition; subject: SubjectId; i: number; set: (c: Condition) => void; remove: () => void; t: T; canRemove: boolean }) {
  const def = fieldDef(subject, c.field) as FieldDef;
  const ops: Op[] = OPS[def.kind];
  const setField = (id: string) => { const d = fieldDef(subject, id) as FieldDef; set({ field: id, op: OPS[d.kind][0], value: d.kind === 'bool' ? 'yes' : '' }); };
  return (
    <div className="stack gap-2" data-condition={i} style={{ borderLeft: '2px solid var(--color-accent-primary)', paddingLeft: 12 }}>
      <Field label={t(K.builder.field)}>{(p) => <Select id={p.id} value={c.field} data-f="field" onChange={(e) => setField(e.target.value)}>{FIELDS[subject].map((f) => <option key={f.id} value={f.id}>{t(`workflowRules.field.${subject}.${f.id}`)}</option>)}</Select>}</Field>
      <div className="row gap-2" style={{ alignItems: 'flex-end' }}>
        <div className="grow"><Field label={t(K.builder.op)}>{(p) => <Select id={p.id} value={c.op} data-f="op" onChange={(e) => set({ ...c, op: e.target.value as Op })}>{ops.map((o) => <option key={o} value={o}>{t(`workflowRules.op.${o}`)}</option>)}</Select>}</Field></div>
        <div className="grow"><Field label={t(K.builder.value)}>{(p) => def.kind === 'choice'
          ? <Select id={p.id} value={c.value} data-f="value" onChange={(e) => set({ ...c, value: e.target.value })}><option value="" /> {(def.choices ?? []).map((x) => <option key={x} value={x}>{t(`workflowRules.choice.${subject}.${c.field}.${x}`)}</option>)}</Select>
          : def.kind === 'bool'
            ? <Select id={p.id} value={c.value} data-f="value" onChange={(e) => set({ ...c, value: e.target.value })}><option value="yes">{t(K.yes)}</option><option value="no">{t(K.no)}</option></Select>
            : <Input id={p.id} value={c.value} inputMode={def.kind === 'text' ? 'text' : 'numeric'} data-f="value" onChange={(e) => set({ ...c, value: e.target.value })} />}</Field></div>
        {canRemove && <Button size="sm" variant="ghost" data-act="remove" onClick={remove} aria-label={t(K.builder.removeCondition)}><X size={16} /></Button>}
      </div>
    </div>
  );
}

function Divider({ children }: { children: ReactNode }) {
  return <h2 className="t-md t-semibold" style={{ borderTop: '1px solid var(--color-accent-primary)', paddingTop: 12 }}>{children}</h2>;
}

function Builder({ s, v, t, lang, head }: { s: WorkflowState; v: CustomRulesView; t: T; lang: string; head: (extra?: ReactNode) => ReactNode }) {
  const toast = useToast();
  const d = s.draft;
  const rule = s.rule;
  const [problem, setProblem] = useState<string | null>(null);
  const [tab, setTab] = useState<'real' | 'sample'>('real');
  const [sample, setSample] = useState<RecordValues>({});
  const [activating, setActivating] = useState(false);
  const [mode, setMode] = useState<'fromNow' | 'now'>('fromNow');
  const [confirmMany, setConfirmMany] = useState(false);
  const [ack, setAck] = useState(false);
  const [retiring, setRetiring] = useState(false);
  const [reason, setReason] = useState('');
  const set = (patch: Partial<RuleDraft>) => s.setDraft({ ...d, ...patch });
  const setCondition = (i: number, c: Condition) => set({ conditions: d.conditions.map((x, j) => (j === i ? c : x)) });
  const sentence = sentenceOf(t, d, v.templates);
  const readOnly = s.locked;
  const saved = !!rule;
  const testCurrent = !!rule && rule.testCurrent && !s.sim;
  const tested = !!rule && (rule.testCurrent || (s.sim?.mode === 'real' && s.sim.hash === rule.simulated?.hash));
  const matchedNow = rule?.matchedNow ?? 0;
  const many = matchedNow >= MANY_AT;
  const canActivate = saved && s.problems.length === 0 && rule?.testCurrent === true && (rule.status === 'draft' || rule.status === 'paused');
  const run = async () => { setProblem(null); const r = await s.test(tab === 'sample' ? sample : null); if (!r.ok) setProblem(r.problem); };
  const save = async () => { setProblem(null); const r = await s.save(); if (r.ok) toast.push(t(K.builder.saved)); else setProblem(r.problem); };
  const activate = async () => {
    setProblem(null);
    const r = await s.activate({ fromNow: mode === 'fromNow', confirmMany: confirmMany, acknowledgeConflicts: ack });
    if (r.ok) { setActivating(false); toast.push(t(K.activate.done)); } else setProblem(r.problem);
  };
  const retire = async () => { setProblem(null); const r = await s.retire(reason.trim()); if (r.ok) { setRetiring(false); } else setProblem(r.problem); };
  return (
    <Screen width="narrow">
      {head(<Button size="sm" variant="ghost" data-act="back" onClick={s.toList}>{t(K.back)}</Button>)}
      <div className="stack gap-3 pb-action-bar" data-builder>
        {rule && <span className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}><Badge tone={TONE[rule.status]}>{t(`workflowRules.status.${rule.status}`)}</Badge><span className="t-xs t-muted">{rule.code} · {t(K.builder.edit, { version: rule.version })}</span></span>}
        {s.restored && <p className="t-xs t-muted" role="status" data-restored>{t(K.draft.restored)}</p>}
        {rule?.status === 'retired' && <Card><p className="t-xs" data-retired-note>{t(K.builder.retiredNote, { date: formatDate(rule.retiredAt ?? rule.updatedAt, lang), reason: rule.retiredReason ?? '' })}</p></Card>}
        {rule?.status === 'active' && <Card><p className="t-xs" data-readonly>{t(K.builder.readOnly, { status: t(`workflowRules.status.${rule.status}`).toLowerCase() })}</p></Card>}

        <Divider>{t(K.builder.about)}</Divider>
        <Field label={t(K.builder.name)} hint={t(K.builder.nameHint)}>{(p) => <Input id={p.id} value={d.name} disabled={readOnly} data-f="name" onChange={(e) => set({ name: e.target.value })} />}</Field>
        <div className="stack gap-2" role="radiogroup" aria-label={t(K.builder.watch)}>
          <span className="t-sm t-semibold">{t(K.builder.watch)}</span>
          {SUBJECT_IDS.map((sid) => (
            <button key={sid} type="button" role="radio" aria-checked={d.subject === sid} disabled={readOnly || (saved && d.subject !== sid && false)} data-subject={sid} className={`ds-card ${d.subject === sid ? 'ds-card--selected' : ''}`.trim()} style={{ display: 'block', textAlign: 'left', width: '100%' }} onClick={() => { if (d.subject !== sid) s.setDraft({ ...d, subject: sid, conditions: [defaultCondition(sid)], action: d.action.kind === 'message' && sid === 'job' ? { kind: 'alert', severity: 'medium' } : d.action }); }}>
              <span className="stack gap-0"><span className="t-sm t-semibold">{t(`workflowRules.subject.name.${sid}`)}</span><span className="t-xs t-muted">{t(`workflowRules.subject.hint.${sid}`)}</span></span>
            </button>
          ))}
        </div>

        <Divider>{t(K.builder.when)}</Divider>
        <p className="t-xs t-muted">{t(K.builder.whenHint)}</p>
        {d.conditions.length > 1 && (
          <div className="row gap-2 wrap" role="group" data-logic>
            <span data-logic-opt="all"><Chip pressed={d.logic === 'all'} onClick={() => !readOnly && set({ logic: 'all' })}>{t(K.builder.all)}</Chip></span>
            <span data-logic-opt="any"><Chip pressed={d.logic === 'any'} onClick={() => !readOnly && set({ logic: 'any' })}>{t(K.builder.any)}</Chip></span>
          </div>
        )}
        {d.conditions.map((c, i) => <div key={i} style={readOnly ? { pointerEvents: 'none', opacity: 0.7 } : undefined}><ConditionRow c={c} subject={d.subject} i={i} set={(x) => setCondition(i, x)} remove={() => set({ conditions: d.conditions.filter((_, j) => j !== i) })} t={t} canRemove={d.conditions.length > 1} /></div>)}
        {!readOnly && d.conditions.length < MAX_CONDITIONS && <div><Button variant="secondary" size="sm" data-act="add-condition" onClick={() => set({ conditions: [...d.conditions, defaultCondition(d.subject)] })}><Plus size={14} /> {t(K.builder.addCondition)}</Button></div>}
        {s.complexity !== 'simple' && <p className="t-xs" role="status" data-complexity={s.complexity}>{t(`workflowRules.complexity.${s.complexity}`)}</p>}

        <Divider>{t(K.builder.then)}</Divider>
        <p className="t-xs t-muted">{t(K.builder.thenHint)}</p>
        <div className="stack gap-2" role="radiogroup" style={readOnly ? { pointerEvents: 'none', opacity: 0.7 } : undefined}>
          {(['alert', 'task', 'message'] as const).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={d.action.kind === k} data-action={k} className={`ds-card ${d.action.kind === k ? 'ds-card--selected' : ''}`.trim()} style={{ display: 'block', textAlign: 'left', width: '100%' }} onClick={() => set({ action: k === 'alert' ? { kind: 'alert', severity: d.action.severity ?? 'medium', note: d.action.note } : k === 'task' ? { kind: 'task', dueInDays: d.action.dueInDays ?? 2, note: d.action.note } : { kind: 'message', templateGroupId: d.action.templateGroupId, note: d.action.note } })}>
              <span className="stack gap-0"><span className="t-sm t-semibold">{t(`workflowRules.action.${k}`)}</span><span className="t-xs t-muted">{t(`workflowRules.action.${k}Hint`)}</span></span>
            </button>
          ))}
        </div>
        <div style={readOnly ? { pointerEvents: 'none', opacity: 0.7 } : undefined} className="stack gap-3">
          {d.action.kind === 'alert' && <div className="row gap-2 wrap" role="group" aria-label={t(K.builder.severity)} data-severity>{(['low', 'medium', 'high'] as const).map((sv) => <span key={sv} data-sev={sv}><Chip pressed={d.action.severity === sv} onClick={() => set({ action: { ...d.action, severity: sv } })}>{t(`workflowRules.severity.${sv}`)}</Chip></span>)}</div>}
          {d.action.kind === 'task' && <Field label={t(K.builder.dueIn)}>{(p) => <Input id={p.id} inputMode="numeric" value={String(d.action.dueInDays ?? '')} data-f="days" onChange={(e) => set({ action: { ...d.action, dueInDays: e.target.value === '' ? undefined : Number(e.target.value.replace(/\D/g, '')) } })} />}</Field>}
          {d.action.kind === 'message' && <Field label={t(K.builder.template)}>{(p) => <Select id={p.id} value={d.action.templateGroupId ?? ''} data-f="template" onChange={(e) => set({ action: { ...d.action, templateGroupId: e.target.value || undefined } })}><option value="">{t(K.builder.templatePick)}</option>{v.templates.map((x) => <option key={x.groupId} value={x.groupId}>{x.name}</option>)}</Select>}</Field>}
          <Field label={t(K.builder.note)} hint={t(K.builder.noteHint)}>{(p) => <TextArea id={p.id} rows={2} value={d.action.note ?? ''} data-f="note" maxLength={NOTE_MAX + 50} onChange={(e) => set({ action: { ...d.action, note: e.target.value } })} />}</Field>
        </div>

        <Divider>{t(K.builder.summary)}</Divider>
        <Card>
          <div className="stack gap-2" data-summary>
            <p className="t-sm">{sentence ?? t(K.summary.empty)}</p>
            <p className="t-xs t-muted">{t(K.summary.once)}</p>
          </div>
        </Card>
        <Card>
          <div className="stack gap-2" data-checks>
            <span className="t-sm t-semibold">{t(K.builder.checks)}</span>
            {s.problems.length === 0 && s.conflicts.length === 0 && <p className="t-xs t-muted"><CheckCircle size={14} aria-hidden="true" /> {t(K.builder.checksOk)}</p>}
            {s.problems.map((p) => <p key={p} className="t-xs" data-check={p}>• {t(`workflowRules.check.${p}`)}</p>)}
            {s.conflicts.map((c, i) => (
              <div key={`${c.kind}-${c.target}-${i}`} className="stack gap-1" data-conflict={c.kind}>
                <p className="t-xs"><Warning size={12} aria-hidden="true" /> {c.kind === 'specialised' ? t(`workflowRules.conflict.specialised.${c.target}`) : t(K.conflict.duplicate, { code: v.rules.find((r) => r.id === c.ruleId)?.code ?? '' })}</p>
                {c.route && <a className="t-xs" href={c.route}>{t(K.conflict.open)}</a>}
              </div>
            ))}
          </div>
        </Card>

        <Divider>{t(K.test.title)}</Divider>
        <p className="t-xs t-muted">{t(K.test.intro)}</p>
        <div className="row gap-2 wrap" role="group" data-test-tabs>
          <span data-tab="real"><Chip pressed={tab === 'real'} onClick={() => setTab('real')}>{t(K.test.real)}</Chip></span>
          <span data-tab="sample"><Chip pressed={tab === 'sample'} onClick={() => setTab('sample')}>{t(K.test.sampleTab)}</Chip></span>
        </div>
        {tab === 'sample' && (
          <div className="stack gap-2" data-sample>
            <p className="t-xs t-muted">{t(K.test.sampleFill)}</p>
            {[...new Set(d.conditions.map((c) => c.field))].map((fid) => {
              const def = fieldDef(d.subject, fid) as FieldDef;
              return (
                <Field key={fid} label={t(`workflowRules.field.${d.subject}.${fid}`)}>{(p) => def.kind === 'choice'
                  ? <Select id={p.id} value={String(sample[fid] ?? '')} data-s={fid} onChange={(e) => setSample({ ...sample, [fid]: e.target.value })}><option value="" />{(def.choices ?? []).map((x) => <option key={x} value={x}>{t(`workflowRules.choice.${d.subject}.${fid}.${x}`)}</option>)}</Select>
                  : def.kind === 'bool'
                    ? <Select id={p.id} value={String(sample[fid] ?? '')} data-s={fid} onChange={(e) => setSample({ ...sample, [fid]: e.target.value })}><option value="" /><option value="yes">{t(K.yes)}</option><option value="no">{t(K.no)}</option></Select>
                    : <Input id={p.id} value={String(sample[fid] ?? '')} inputMode={def.kind === 'text' ? 'text' : 'numeric'} data-s={fid} onChange={(e) => setSample({ ...sample, [fid]: def.kind === 'text' ? e.target.value : (e.target.value === '' ? '' : Number(e.target.value.replace(/[^\d.]/g, ''))) })} />}</Field>
              );
            })}
          </div>
        )}
        <Button variant="secondary" data-act="test" disabled={s.problems.length > 0 || (!saved && tab === 'real' && false)} loading={s.busy} onClick={() => void run()}><Lightning size={16} /> {t(K.test.run)}</Button>
        {s.sim && (
          <Card>
            <div className="stack gap-2" data-sim={s.sim.mode}>
              {s.sim.mode === 'real'
                ? (
                  <>
                    <p className="t-sm" data-sim-result>{t(K.test.result, { matched: s.sim.matched, total: s.sim.total, act: s.sim.wouldAct })}</p>
                    {s.sim.matched === 0 && <p className="t-xs t-muted">{t(K.test.noMatch)}</p>}
                    {s.sim.sample.length > 0 && <div className="stack gap-1"><span className="t-xs t-semibold">{t(K.test.sampleList)}</span>{s.sim.sample.map((x) => <p key={x.id} className="t-xs" data-sim-item>{x.label} <span className="t-muted">· {x.detail}</span></p>)}</div>}
                    {!saved && <p className="t-xs t-muted">{t(K.builder.saveFirst)}</p>}
                  </>
                )
                : (
                  <>
                    <p className="t-sm" data-sim-result>{s.sim.result?.matches ? t(K.test.sample.yes) : t(K.test.sample.no)}</p>
                    {s.sim.result && !s.sim.result.matches && s.sim.result.failed.length > 0 && <p className="t-xs t-muted">{t(K.test.sample.missed, { conditions: s.sim.result.failed.map((i) => `${t(`workflowRules.field.${d.subject}.${d.conditions[i]?.field}`)}`).join(', ') })}</p>}
                  </>
                )}
            </div>
          </Card>
        )}
        {rule && !s.sim && (rule.simulated ? <p className="t-xs t-muted" data-tested>{testCurrent ? t(K.test.current, { date: formatDate(rule.simulated.at, lang), matched: rule.simulated.matched }) : t(K.test.stale)}</p> : null)}
        {rule && s.sim?.mode === 'real' && tested && <p className="t-xs t-muted" data-tested>{t(K.test.current, { date: formatDate(s.sim.at, lang), matched: s.sim.matched })}</p>}

        {rule && (
          <>
            <Divider>{t(K.firings.title)}</Divider>
            {rule.firings.length === 0 ? <p className="t-xs t-muted">{t(K.firings.empty)}</p> : rule.firings.slice(0, 6).map((f) => <p key={`${f.at}-${f.subjectId}`} className="t-xs" data-firing>{formatDate(f.at, lang)} · {f.label}</p>)}
            <Divider>{t(K.history.title)}</Divider>
            <div className="stack gap-1" data-history>{[...rule.events].reverse().map((e, i) => <p key={`${e.at}-${i}`} className="t-xs">{t(K.history.line, { kind: t(`workflowRules.history.kind.${e.kind}`), date: formatDate(e.at, lang), by: e.byName })}{e.detail ? ` · ${e.detail}` : ''}</p>)}</div>
            {rule.status !== 'retired' && <div className="row gap-2 wrap">{rule.status === 'active' && <Button variant="secondary" size="sm" data-act="pause" onClick={() => void s.pause()}><Pause size={14} /> {t(K.card.pause)}</Button>}<Button variant="ghost" size="sm" data-act="retire" onClick={() => setRetiring(true)}>{t(K.card.retire)}</Button><Button variant="ghost" size="sm" data-act="copy" onClick={() => void s.copy(rule.id)}><Copy size={14} /> {t(K.card.copy)}</Button></div>}
            {rule.status === 'retired' && <div><Button variant="secondary" size="sm" data-act="copy" onClick={() => void s.copy(rule.id)}><Copy size={14} /> {t(K.card.copy)}</Button></div>}
          </>
        )}
        {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{problemText(t, problem)}</p>}
        {rule?.status === 'draft' && !rule.testCurrent && s.problems.length === 0 && <p className="t-xs t-muted" data-hint>{t(K.builder.testFirst)}</p>}
      </div>

      {!readOnly && (
        <ActionBar>
          <Button variant="secondary" data-act="save" disabled={s.problems.length > 0} loading={s.busy} onClick={() => void save()}><FloppyDisk size={18} /> {t(K.builder.saveDraft)}</Button>
          <Button className="grow" data-act="activate" disabled={!canActivate} onClick={() => { setProblem(null); setMode(many ? 'fromNow' : 'fromNow'); setConfirmMany(false); setAck(false); setActivating(true); }}>{t(K.builder.activate)}</Button>
        </ActionBar>
      )}

      <Sheet open={activating} onClose={() => setActivating(false)} title={t(K.activate.title)} closeLabel={t(K.close)}>
        <div className="stack gap-3" data-activate>
          <p className="t-sm">{sentence}</p>
          <p className="t-sm" data-activate-count>{t(K.activate.body, { count: matchedNow })}</p>
          <div className="stack gap-2" role="radiogroup">
            <button type="button" role="radio" aria-checked={mode === 'fromNow'} data-mode="fromNow" className={`ds-card ${mode === 'fromNow' ? 'ds-card--selected' : ''}`.trim()} style={{ display: 'block', textAlign: 'left', width: '100%' }} onClick={() => setMode('fromNow')}><span className="stack gap-0"><span className="t-sm t-semibold">{t(K.activate.fromNow)}</span><span className="t-xs t-muted">{t(K.activate.fromNowHint)}</span></span></button>
            <button type="button" role="radio" aria-checked={mode === 'now'} data-mode="now" className={`ds-card ${mode === 'now' ? 'ds-card--selected' : ''}`.trim()} style={{ display: 'block', textAlign: 'left', width: '100%' }} onClick={() => setMode('now')}><span className="stack gap-0"><span className="t-sm t-semibold">{t(K.activate.now, { count: matchedNow })}</span><span className="t-xs t-muted">{t(K.activate.nowHint)}</span></span></button>
          </div>
          {mode === 'now' && many && <div data-many><Checkbox checked={confirmMany} onChange={setConfirmMany} label={t(K.activate.many)} /></div>}
          {s.conflicts.length > 0 && <div data-ack><Checkbox checked={ack} onChange={setAck} label={t(K.activate.ack)} /></div>}
          {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{problemText(t, problem)}</p>}
          <div className="row gap-2"><Button variant="ghost" onClick={() => setActivating(false)}>{t(K.activate.cancel)}</Button><Button className="grow" data-act="activate-confirm" disabled={(mode === 'now' && many && !confirmMany) || (s.conflicts.length > 0 && !ack)} loading={s.busy} onClick={() => void activate()}>{t(K.activate.confirm)}</Button></div>
        </div>
      </Sheet>
      <Sheet open={retiring} onClose={() => setRetiring(false)} title={t(K.retire.title)} closeLabel={t(K.close)}>
        <div className="stack gap-3" data-retire>
          <p className="t-xs">{t(K.retire.body)}</p>
          <Field label={t(K.retire.reason)}>{(p) => <TextArea id={p.id} rows={3} value={reason} data-f="reason" onChange={(e) => setReason(e.target.value)} />}</Field>
          {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{problemText(t, problem)}</p>}
          <Button block data-act="retire-confirm" disabled={reason.replace(/[^\p{L}]/gu, '').length < 10} loading={s.busy} onClick={() => void retire()}>{t(K.retire.confirm)}</Button>
        </div>
      </Sheet>
    </Screen>
  );
}
