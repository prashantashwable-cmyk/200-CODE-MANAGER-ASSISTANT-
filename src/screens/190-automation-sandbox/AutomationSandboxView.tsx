import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, Check, Flask, Plus, ShieldCheck, X } from '@phosphor-icons/react';
import { Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, Tabs, TextArea, formatDate, formatINR, useToast } from '@/design-system';
import type { SandboxPromotionPreview, SandboxPromotionRow, SandboxRuleRef, SandboxRunView, SandboxScenarioView, SandboxView } from '@/data/repository';
import { ENGINES, EXPECT_SCHEMA, FACT_SCHEMA, NOTE_MIN, customFieldsOf, REVIEW_EVERY_DAYS } from '@/features/sandbox/testing';
import type { FieldSchema } from '@/features/sandbox/testing';
import type { SubjectId } from '@/features/automation/customRules';
import { lettersOf } from '@/features/override/rules';
import { AUTOMATION_SANDBOX_KEYS as K, TABS } from './sandbox.types';
import type { SandboxTab } from './sandbox.types';
import { useSession } from '@/session/SessionProvider';
import { useAutomationSandbox } from './useAutomationSandbox';
import type { SandboxState } from './useAutomationSandbox';

type T = ReturnType<typeof useTranslation>['t'];
type Val = string | number | boolean;
const MONEY = new Set(['dealValue', 'value', 'remaining', 'total', 'surveyor', 'technicians']);
const SUBJECTS: SubjectId[] = ['lead', 'payment', 'job', 'ticket'];
const STATUS_TONE: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = { matched: 'success', differs: 'warning', new: 'neutral', untested: 'neutral', tested_passed: 'success', tested_failed: 'warning', stale: 'warning', promoted: 'success' };
const errText = (t: T, code: string) => t(`automationSandbox.error.${code}`, { defaultValue: t(K.error.generic) });
const DRAFT_KEY = (uid: string) => `aiec.sandboxDraft.${uid}`;

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="stack gap-2">
      <h2 className="t-md t-semibold" style={{ borderTop: '1px solid var(--color-accent-primary)', paddingTop: 12 }}>{title}</h2>
      {hint && <p className="t-xs t-muted">{hint}</p>}
      {children}
    </section>
  );
}

const ruleLabel = (t: T, r: Pick<SandboxRuleRef, 'engine' | 'ref' | 'label'>): string => (r.engine === 'escalation' ? t(`escalationMatrix.scenario.${r.ref}.name`, { defaultValue: r.ref }) : r.engine === 'commission' ? t(K.commissionRule) : r.label);
const scenarioName = (t: T, s: { id: string; builtIn: boolean; name: string }): string => (s.builtIn ? t(`automationSandbox.scenario.${s.id}`, { defaultValue: s.id }) : s.name);
const runScenario = (t: T, r: { scenarioId: string; scenarioName: string }): string => t(`automationSandbox.scenario.${r.scenarioId}`, { defaultValue: r.scenarioName });
const factLabel = (t: T, engine: string, subject: string | null, id: string): string => {
  if (id === 'subject') return t(K.fact.subject);
  if (engine === 'custom_rule' && subject) return t(`workflowRules.field.${subject}.${id}`, { defaultValue: id });
  return t(`automationSandbox.fact.${id}`, { defaultValue: id });
};
function valueText(t: T, engine: string, subject: string | null, field: string, v: Val): string {
  if (typeof v === 'boolean') return v ? t(K.yes) : t(K.no);
  if (field === 'subject') return t(`automationSandbox.subject.${v}`, { defaultValue: String(v) });
  if (MONEY.has(field) && typeof v === 'number') return formatINR(v);
  if (field === 'burdenPct') return `${v}%`;
  if (field === 'action') return t(`automationSandbox.action.${v}`, { defaultValue: String(v) });
  if (engine === 'escalation' && field === 'kind') return t(`escalationMatrix.scenario.${v}.name`, { defaultValue: String(v) });
  if (engine === 'commission' && field === 'source') return t(`automationSandbox.source.${v}`, { defaultValue: String(v) });
  if (field === 'surveyorTier') return t(`automationSandbox.tier.${v}`, { defaultValue: String(v) });
  if (engine === 'custom_rule' && subject && typeof v === 'string') return t(`workflowRules.choice.${subject}.${field}.${v}`, { defaultValue: v });
  return String(v);
}
const outcomeLabel = (t: T, f: string): string => t(`automationSandbox.outcome.${f}`, { defaultValue: f });
const subjectOf = (facts: Record<string, Val>): string | null => (typeof facts.subject === 'string' ? facts.subject : null);

/** Screen 190 — Automation Testing & Sandbox. A form layout: pick a rule and some typical situations, see what it would do beside what was expected, keep the scenario library honest, and take a rule that has passed live. Nothing here changes a real record. */
export function AutomationSandboxScreen() {
  const { t, i18n } = useTranslation();
  const s = useAutomationSandbox();
  const v = s.view;
  const head = <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh onClick={() => void s.refresh()}>{t(K.refresh)}</Button>} />;
  if (s.load === 'loading' && !v) return <Screen width="narrow">{head}<LoadingState label={t(K.loading)} variant="list" rows={4} /></Screen>;
  if (s.load === 'error' && !v) return <Screen width="narrow">{head}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.refresh()} /></Screen>;
  if (!v) return null;
  const sideEffects = s.results.reduce((n, r) => n + r.sideEffects, 0);
  return (
    <Screen width="narrow">
      {head}
      <div className="stack gap-4">
        {s.offline && <p className="t-xs t-muted" role="status" data-offline>{t(K.offline)}</p>}
        <Card>
          <div className="stack gap-1" data-safe>
            <span className="t-sm t-semibold row gap-2" style={{ alignItems: 'center', color: 'var(--color-success)' }}><ShieldCheck size={18} aria-hidden="true" />{t(K.safe.title)}</span>
            <span className="t-xs">{t(K.safe.body)}</span>
            {s.results.length > 0 && <span className="t-xs t-semibold" data-side-effects={sideEffects}>{t(K.safe.proof, { count: sideEffects })}</span>}
          </div>
        </Card>
        <Tabs label={t(K.tab.label)} value={s.tab} onChange={(id) => s.setTab(id as SandboxTab)} items={TABS.map((id) => ({ id, label: t(`automationSandbox.tab.${id}`) }))} />
        {s.tab === 'test' && <TestTab v={v} s={s} t={t} lang={i18n.language} />}
        {s.tab === 'library' && <LibraryTab v={v} s={s} t={t} lang={i18n.language} />}
        {s.tab === 'promote' && <PromoteTab v={v} s={s} t={t} lang={i18n.language} />}
        <p className="t-xs t-muted" data-placeholder-note>{t(K.note.placeholders)}</p>
      </div>
    </Screen>
  );
}

const applicable = (sc: SandboxScenarioView, rule: SandboxRuleRef | undefined): boolean => !!rule && sc.engine === rule.engine && (rule.engine === 'custom_rule' ? sc.subject === rule.subject : rule.engine === 'escalation' ? sc.facts.kind === rule.ref : true);

function TestTab({ v, s, t, lang }: { v: SandboxView; s: SandboxState; t: T; lang: string }) {
  const toast = useToast();
  const fromParam = v.rules.find((r) => r.ref === s.ruleParam);
  const [engine, setEngine] = useState<string>(fromParam?.engine ?? (v.rules.some((r) => r.engine === 'custom_rule') ? 'custom_rule' : 'escalation'));
  const rules = v.rules.filter((r) => r.engine === engine);
  const [ruleRef, setRuleRef] = useState<string>(fromParam?.ref ?? rules[0]?.ref ?? '');
  const rule = rules.find((r) => r.ref === ruleRef) ?? rules[0];
  const scenarios = useMemo(() => v.scenarios.filter((sc) => applicable(sc, rule)), [v.scenarios, rule]);
  const [picked, setPicked] = useState<string[]>([]);
  const [expected, setExpected] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => { setPicked(scenarios.map((sc) => sc.id)); setExpected({}); setProblem(null); }, [rule?.ref, engine]); // eslint-disable-line react-hooks/exhaustive-deps
  const schema = EXPECT_SCHEMA[engine as keyof typeof EXPECT_SCHEMA] ?? [];
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const expectedValue = (): Record<string, Val> | null => {
    const out: Record<string, Val> = {};
    for (const f of schema) {
      const raw = expected[f.id];
      if (raw === undefined || raw === '') continue;
      out[f.id] = f.kind === 'bool' ? raw === 'true' : f.kind === 'choice' ? raw : Number(raw);
    }
    return Object.keys(out).length ? out : null;
  };
  const exp = picked.length === 1 ? expectedValue() : null;
  const run = async () => {
    if (!rule) return;
    setProblem(null);
    const r = await s.run(rule.engine, rule.ref, picked, exp);
    if (r.ok) toast.push(t(K.test.done)); else setProblem(r.problem);
  };
  const mine = s.results;
  return (
    <div className="stack gap-4">
      <Section title={t(K.test.title)}>
        <div className="row gap-2 wrap" role="group" aria-label={t(K.test.title)}>
          {ENGINES.map((e) => <Chip key={e} pressed={engine === e} onClick={() => { setEngine(e); setRuleRef(v.rules.find((r) => r.engine === e)?.ref ?? ''); }}>{t(`automationSandbox.engine.${e}`)}</Chip>)}
        </div>
        {rules.length === 0 ? <p className="t-sm t-muted" data-no-rules>{t(K.test.noRules)}</p> : (
          <>
            <Field label={t(K.test.rule)}>{(p) => <Select id={p.id} value={rule?.ref ?? ''} data-f="rule" onChange={(e) => setRuleRef(e.target.value)}>{rules.map((r) => <option key={r.ref} value={r.ref}>{ruleLabel(t, r)}</option>)}</Select>}</Field>
            <div className="stack gap-1">
              <div className="row between" style={{ alignItems: 'center' }}>
                <span className="t-sm t-semibold">{t(K.test.scenarios)}</span>
                <span className="row gap-1"><Button size="sm" variant="ghost" onClick={() => setPicked(scenarios.map((sc) => sc.id))}>{t(K.test.all)}</Button><Button size="sm" variant="ghost" onClick={() => setPicked([])}>{t(K.test.none)}</Button></span>
              </div>
              {scenarios.length === 0 ? <p className="t-xs t-muted" data-no-scenarios>{t(K.test.noScenarios)}</p> : (
                <div className="stack gap-1" data-scenario-list>
                  {scenarios.map((sc) => (
                    <div key={sc.id} data-scenario={sc.id}><Checkbox checked={picked.includes(sc.id)} onChange={() => toggle(sc.id)} label={scenarioName(t, sc)} /></div>
                  ))}
                </div>
              )}
            </div>
            <div className="stack gap-2" data-expect>
              <span className="t-sm t-semibold">{t(K.test.expectTitle)}</span>
              <p className="t-xs t-muted">{picked.length === 1 ? t(K.test.expectHint) : t(K.test.expectOne)}</p>
              {picked.length === 1 && schema.map((f) => <ExpectField key={f.id} f={f} engine={engine} t={t} value={expected[f.id] ?? ''} onChange={(val) => setExpected((x) => ({ ...x, [f.id]: val }))} />)}
            </div>
            {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
            <Button data-act="run" disabled={picked.length === 0} loading={s.busy} onClick={() => void run()}><Flask size={16} /> {t(K.test.run)}</Button>
          </>
        )}
      </Section>
      <Section title={t(K.run.title)}>
        {mine.length === 0 ? <p className="t-sm t-muted" data-no-results>{t(K.run.empty)}</p> : <div className="stack gap-3" data-results>{mine.map((r) => <RunCard key={r.id} r={r} s={s} t={t} />)}</div>}
      </Section>
      <Recent v={v} t={t} lang={lang} />
    </div>
  );
}

function ExpectField({ f, engine, t, value, onChange }: { f: FieldSchema; engine: string; t: T; value: string; onChange: (v: string) => void }) {
  const label = outcomeLabel(t, f.id);
  return (
    <Field label={label}>
      {(p) => f.kind === 'number' || f.kind === 'money'
        ? <Input id={p.id} type="number" inputMode="decimal" value={value} data-f={`expect-${f.id}`} onChange={(e) => onChange(e.target.value)} />
        : (
          <Select id={p.id} value={value} data-f={`expect-${f.id}`} onChange={(e) => onChange(e.target.value)}>
            <option value="">{t(K.test.expectAny)}</option>
            {f.kind === 'bool' ? <><option value="true">{t(K.yes)}</option><option value="false">{t(K.no)}</option></> : (f.options ?? []).map((o) => <option key={o} value={o}>{valueText(t, engine, null, f.id, o)}</option>)}
          </Select>
        )}
    </Field>
  );
}

function RunCard({ r, s, t }: { r: SandboxRunView; s: SandboxState; t: T }) {
  const toast = useToast();
  const subject = subjectOf(r.facts);
  const factRows = Object.entries(r.facts);
  const cmp = r.comparisons;
  const open = (r.status === 'new' || r.status === 'differs') && !r.accepted && r.expectedFrom !== 'declared';
  const accept = async () => { const x = await s.accept(r.id); if (x.ok) toast.push(t(K.run.acceptedToast)); };
  return (
    <Card>
      <div className="stack gap-2" data-run={r.scenarioId} data-status={r.status} data-side-effects={r.sideEffects}>
        <div className="row between" style={{ alignItems: 'center', gap: 8 }}>
          <span className="t-sm t-semibold">{runScenario(t, r)}</span>
          <Badge tone={STATUS_TONE[r.status]}>{t(`automationSandbox.run.status.${r.status}`)}</Badge>
        </div>
        <span className="t-xs t-muted">{r.code} · {t(`automationSandbox.run.from.${r.expectedFrom}`)}</span>
        {cmp.length > 0 ? (
          <div className="stack gap-1" data-compare role="table">
            <div className="row t-xs t-muted" role="row" style={{ gap: 8 }}><span style={{ flex: 1.2 }} /><span style={{ flex: 1 }}>{t(K.run.expected)}</span><span style={{ flex: 1 }}>{t(K.run.actual)}</span></div>
            {cmp.map((c) => (
              <div key={c.field} className="row t-sm" role="row" data-field={c.field} data-match={c.match} style={{ gap: 8, alignItems: 'baseline' }}>
                <span style={{ flex: 1.2 }}>{outcomeLabel(t, c.field)}</span>
                <span style={{ flex: 1 }}>{c.expected === null ? '—' : valueText(t, r.engine, subject, c.field, c.expected)}</span>
                <span style={{ flex: 1, color: c.match ? 'var(--color-success)' : 'var(--color-warning)' }} className="t-semibold">{c.match ? <Check size={12} aria-hidden="true" /> : <X size={12} aria-hidden="true" />} {valueText(t, r.engine, subject, c.field, c.actual)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="stack gap-1" data-outcome>
            {Object.entries(r.actual).map(([f, val]) => <div key={f} className="row between t-sm" data-field={f}><span>{outcomeLabel(t, f)}</span><span className="t-semibold">{valueText(t, r.engine, subject, f, val)}</span></div>)}
          </div>
        )}
        {r.status === 'new' && <p className="t-xs">{t(K.run.from.none)}</p>}
        {r.status === 'differs' && <p className="t-xs" data-differs style={{ color: 'var(--color-warning)' }}>{t(r.expectedFrom === 'declared' ? K.run.differsDeclared : K.run.differsNote)}</p>}
        {r.accepted && <Badge tone="success">{t(K.run.accepted)}</Badge>}
        {open && <div><Button size="sm" variant="secondary" data-act="accept" loading={s.busy} onClick={() => void accept()}>{t(K.run.accept)}</Button></div>}
        <details>
          <summary className="t-xs t-muted">{t(K.run.facts)}</summary>
          <div className="stack gap-0">{factRows.map(([f, val]) => <div key={f} className="row between t-xs"><span>{factLabel(t, r.engine, subject, f)}</span><span>{valueText(t, r.engine, subject, f, val)}</span></div>)}</div>
        </details>
      </div>
    </Card>
  );
}

function Recent({ v, t, lang }: { v: SandboxView; t: T; lang: string }) {
  if (v.runs.length === 0) return null;
  return (
    <Section title={t(K.run.recent)}>
      <div className="stack gap-1" data-recent>
        {v.runs.slice(0, 8).map((r) => (
          <div key={r.id} className="row between t-xs" style={{ gap: 8, alignItems: 'center' }}>
            <span>{t(K.run.line, { code: r.code, rule: ruleLabel(t, { engine: r.engine, ref: r.ruleRef, label: r.ruleLabel }), scenario: runScenario(t, r) })} · {formatDate(r.at, lang)}</span>
            <Badge tone={STATUS_TONE[r.status]}>{t(`automationSandbox.run.status.${r.status}`)}</Badge>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ Library */

interface Draft { id?: string; engine: string; subject: SubjectId; name: string; values: Record<string, string> }
const schemaFor = (engine: string, subject: SubjectId): FieldSchema[] => (engine === 'custom_rule' ? customFieldsOf(subject) : FACT_SCHEMA[engine as 'escalation' | 'commission'] ?? []);
const defaultValues = (engine: string, subject: SubjectId): Record<string, string> => Object.fromEntries(schemaFor(engine, subject).map((f) => [f.id, f.kind === 'bool' ? 'false' : f.kind === 'choice' && f.options?.length ? f.options[0] : '']));
const emptyDraft = (engine = 'custom_rule'): Draft => ({ engine, subject: 'lead', name: '', values: defaultValues(engine, 'lead') });
const draftFromScenario = (sc: SandboxScenarioView): Draft => ({ id: sc.id, engine: sc.engine, subject: (sc.facts.subject as SubjectId) ?? 'lead', name: sc.name, values: Object.fromEntries(Object.entries(sc.facts).filter(([k]) => k !== 'subject').map(([k, val]) => [k, String(val)])) });
const factsOfDraft = (d: Draft): Record<string, Val> => {
  const out: Record<string, Val> = {};
  if (d.engine === 'custom_rule') out.subject = d.subject;
  for (const f of schemaFor(d.engine, d.subject)) {
    const raw = d.values[f.id] ?? '';
    if (f.kind === 'bool') out[f.id] = raw === 'true';
    else if (f.kind === 'number' || f.kind === 'money') { if (raw.trim() !== '' && Number.isFinite(Number(raw))) out[f.id] = Number(raw); }
    else if (raw.trim() !== '') out[f.id] = raw.trim();
  }
  return out;
};

function LibraryTab({ v, s, t, lang }: { v: SandboxView; s: SandboxState; t: T; lang: string }) {
  const toast = useToast();
  const uid = useSession().user?.id ?? '';
  const [engine, setEngine] = useState<string>('custom_rule');
  const [picked, setPicked] = useState<string[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const list = v.scenarios.filter((sc) => sc.engine === engine);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const review = async () => { setProblem(null); const r = await s.reviewScenarios(picked, note); if (r.ok) { setReviewing(false); setNote(''); setPicked([]); toast.push(t(K.library.reviewDone)); } else setProblem(r.problem); };
  const remove = async (id: string) => { const r = await s.deleteScenario(id); setRemoving(null); if (r.ok) toast.push(t(K.library.deleted)); else toast.push(errText(t, r.problem)); };
  return (
    <div className="stack gap-4">
      <Section title={t(K.library.title)} hint={t(K.library.hint)}>
        {v.review.dueCount > 0 && <p className="t-sm" role="status" data-review-due style={{ color: 'var(--color-warning)' }}>{t(K.library.due, { count: v.review.dueCount, days: REVIEW_EVERY_DAYS })}</p>}
        <div className="row gap-2 wrap" role="group" aria-label={t(K.library.title)}>
          {ENGINES.map((e) => <Chip key={e} pressed={engine === e} onClick={() => { setEngine(e); setPicked([]); }}>{t(`automationSandbox.engine.${e}`)}</Chip>)}
        </div>
        <div className="row gap-2 wrap">
          <Button size="sm" variant="secondary" data-act="add-scenario" icon={<Plus size={14} />} onClick={() => setEditing(loadDraft(uid, engine))}>{t(K.library.add)}</Button>
          {picked.length > 0 && <Button size="sm" data-act="review" onClick={() => { setProblem(null); setReviewing(true); }}>{t(K.library.review)} ({picked.length})</Button>}
        </div>
        {list.length === 0 ? <EmptyState title={t(K.library.empty)} body={t(K.library.hint)} actionLabel={t(K.library.add)} onAction={() => setEditing(loadDraft(uid, engine))} /> : (
          <div className="grid-auto" data-library>
            {list.map((sc) => (
              <Card key={sc.id}>
                <div className="stack gap-2" data-scenario={sc.id} data-stale={sc.stale}>
                  <div className="row between" style={{ alignItems: 'flex-start', gap: 8 }}>
                    <Checkbox checked={picked.includes(sc.id)} onChange={() => toggle(sc.id)} label={scenarioName(t, sc)} />
                    <span className="row gap-1 wrap" style={{ justifyContent: 'flex-end' }}>
                      <Badge tone="neutral">{sc.builtIn ? t(K.library.builtIn) : t(K.library.custom)}</Badge>
                      {sc.stale && <Badge tone="warning">{t(K.library.stale)}</Badge>}
                    </span>
                  </div>
                  <div className="stack gap-0">{Object.entries(sc.facts).map(([f, val]) => <div key={f} className="row between t-xs"><span className="t-muted">{factLabel(t, sc.engine, sc.subject, f)}</span><span>{valueText(t, sc.engine, sc.subject, f, val)}</span></div>)}</div>
                  <span className="t-xs t-muted">{t(K.library.reviewed, { date: formatDate(sc.reviewedAt, lang), by: sc.reviewedByName })}</span>
                  {!sc.builtIn && (
                    <div className="row gap-2">
                      <Button size="sm" variant="ghost" data-act={`edit-${sc.id}`} onClick={() => setEditing(draftFromScenario(sc))}>{t(K.library.edit)}</Button>
                      {removing === sc.id ? <Button size="sm" variant="secondary" data-act={`remove-do-${sc.id}`} loading={s.busy} onClick={() => void remove(sc.id)}>{t(K.library.delete)}?</Button> : <Button size="sm" variant="ghost" data-act={`remove-${sc.id}`} onClick={() => setRemoving(sc.id)}>{t(K.library.delete)}</Button>}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>
      <Sheet open={reviewing} onClose={() => setReviewing(false)} title={t(K.library.reviewTitle)} closeLabel={t(K.close)}>
        <div className="stack gap-3" data-review-sheet>
          <Field label={t(K.library.reviewNote)} hint={`${lettersOf(note)}/${NOTE_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={note} data-f="review-note" onChange={(e) => setNote(e.target.value)} />}</Field>
          {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
          <Button data-act="review-do" disabled={lettersOf(note) < NOTE_MIN} loading={s.busy} onClick={() => void review()}>{t(K.library.reviewDo)}</Button>
        </div>
      </Sheet>
      <ScenarioSheet draft={editing} onClose={() => setEditing(null)} s={s} t={t} />
    </div>
  );
}

function loadDraft(uid: string, engine: string): Draft {
  try { const raw = localStorage.getItem(DRAFT_KEY(uid)); if (raw) { const d = JSON.parse(raw) as Draft; if (d && d.engine === engine && !d.id) return d; } } catch { /* the draft is a convenience */ }
  return emptyDraft(engine);
}

function ScenarioSheet({ draft, onClose, s, t }: { draft: Draft | null; onClose: () => void; s: SandboxState; t: T }) {
  const toast = useToast();
  const user = useSession().user?.id ?? '';
  const [d, setD] = useState<Draft>(draft ?? emptyDraft());
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => { if (draft) { setD(draft); setProblem(null); } }, [draft]);
  useEffect(() => { if (draft && !d.id) { try { localStorage.setItem(DRAFT_KEY(user), JSON.stringify(d)); } catch { /* ignore */ } } }, [d, draft, user]);
  if (!draft) return <Sheet open={false} onClose={onClose} title="" closeLabel={t(K.close)}>{null}</Sheet>;
  const schema = schemaFor(d.engine, d.subject);
  const set = (id: string, val: string) => setD((x) => ({ ...x, values: { ...x.values, [id]: val } }));
  const save = async () => {
    setProblem(null);
    const r = await s.saveScenario({ id: d.id, engine: d.engine, name: d.name, facts: factsOfDraft(d) });
    if (r.ok) { try { localStorage.removeItem(DRAFT_KEY(user)); } catch { /* ignore */ } toast.push(t(K.library.saved)); onClose(); } else setProblem(r.problem);
  };
  return (
    <Sheet open onClose={onClose} title={t(K.library.addTitle)} closeLabel={t(K.close)}>
      <div className="stack gap-3" data-scenario-sheet>
        <Field label={t(K.library.kind)}>{(p) => <Select id={p.id} value={d.engine} disabled={!!d.id} data-f="engine" onChange={(e) => setD({ ...emptyDraft(e.target.value), name: d.name })}>{ENGINES.map((e) => <option key={e} value={e}>{t(`automationSandbox.engine.${e}`)}</option>)}</Select>}</Field>
        <Field label={t(K.library.name)}>{(p) => <Input id={p.id} value={d.name} data-f="name" onChange={(e) => setD((x) => ({ ...x, name: e.target.value }))} />}</Field>
        {d.engine === 'custom_rule' && <Field label={t(K.fact.subject)}>{(p) => <Select id={p.id} value={d.subject} disabled={!!d.id} data-f="subject" onChange={(e) => setD((x) => ({ ...x, subject: e.target.value as SubjectId, values: defaultValues('custom_rule', e.target.value as SubjectId) }))}>{SUBJECTS.map((x) => <option key={x} value={x}>{t(`automationSandbox.subject.${x}`)}</option>)}</Select>}</Field>}
        {schema.map((f) => (
          <Field key={f.id} label={factLabel(t, d.engine, d.engine === 'custom_rule' ? d.subject : null, f.id)}>
            {(p) => f.kind === 'bool'
              ? <Select id={p.id} value={d.values[f.id] ?? 'false'} data-f={`fact-${f.id}`} onChange={(e) => set(f.id, e.target.value)}><option value="true">{t(K.yes)}</option><option value="false">{t(K.no)}</option></Select>
              : f.kind === 'choice' && f.options?.length
                ? <Select id={p.id} value={d.values[f.id] ?? ''} data-f={`fact-${f.id}`} onChange={(e) => set(f.id, e.target.value)}>{f.options.map((o) => <option key={o} value={o}>{valueText(t, d.engine, d.engine === 'custom_rule' ? d.subject : null, f.id, o)}</option>)}</Select>
                : <Input id={p.id} type={f.kind === 'choice' ? 'text' : 'number'} inputMode={f.kind === 'choice' ? undefined : 'decimal'} value={d.values[f.id] ?? ''} data-f={`fact-${f.id}`} onChange={(e) => set(f.id, e.target.value)} />}
          </Field>
        ))}
        {!d.id && <p className="t-xs t-muted">{t(K.library.draftNote)}</p>}
        {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
        <Button data-act="save-scenario" loading={s.busy} onClick={() => void save()}>{t(K.library.save)}</Button>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ Go live */

function PromoteTab({ v, s, t, lang }: { v: SandboxView; s: SandboxState; t: T; lang: string }) {
  const nav = useNavigate();
  const [sheet, setSheet] = useState<string | null>(null);
  return (
    <div className="stack gap-4">
      <Section title={t(K.promote.title)} hint={t(K.promote.hint)}>
        {v.promotions.length === 0 ? <EmptyState title={t(K.promote.empty)} body={t(K.promote.hint)} actionLabel={t(K.promote.build)} onAction={() => nav('/workflow-rules')} /> : (
          <div className="stack gap-3" data-promotions>
            {v.promotions.map((p) => <PromotionCard key={p.ruleId} p={p} v={v} s={s} t={t} lang={lang} onGoLive={() => setSheet(p.ruleId)} />)}
          </div>
        )}
      </Section>
      <GoLiveSheet ruleId={sheet} promo={v.promotions.find((p) => p.ruleId === sheet)} s={s} t={t} onClose={() => setSheet(null)} />
    </div>
  );
}

function PromotionCard({ p, v, s, t, lang, onGoLive }: { p: SandboxPromotionRow; v: SandboxView; s: SandboxState; t: T; lang: string; onGoLive: () => void }) {
  const nav = useNavigate();
  const toast = useToast();
  const rule = v.rules.find((r) => r.ref === p.ruleId);
  const mine = s.results.filter((r) => r.ruleRef === p.ruleId);
  const open = mine.filter((r) => (r.status === 'new' || r.status === 'differs') && !r.accepted && r.expectedFrom !== 'declared');
  const [problem, setProblem] = useState<string | null>(null);
  const suite = async () => {
    setProblem(null);
    const ids = v.scenarios.filter((sc) => applicable(sc, rule)).map((sc) => sc.id);
    const r = await s.run('custom_rule', p.ruleId, ids, null);
    if (r.ok) toast.push(t(K.promote.suiteDone)); else setProblem(r.problem);
  };
  const acceptAll = async () => { const r = await s.acceptMany(open.map((x) => x.id)); if (r.ok) toast.push(t(K.promote.acceptedAll)); else setProblem(r.problem); };
  return (
    <Card>
      <div className="stack gap-2" data-promotion={p.ruleId} data-status={p.status}>
        <div className="row between" style={{ alignItems: 'center', gap: 8 }}>
          <span className="t-sm t-semibold">{p.label}</span>
          <Badge tone={STATUS_TONE[p.status]}>{t(`automationSandbox.promote.status.${p.status}`)}</Badge>
        </div>
        <span className="t-xs" data-progress>{t(K.promote.progress, { passed: p.passed, required: p.required })}</span>
        <span className="t-xs t-muted">{p.testedAt ? t(K.promote.tested, { date: formatDate(p.testedAt, lang) }) : t(K.promote.neverTested)}</span>
        {p.status === 'stale' && <p className="t-xs" data-stale-note style={{ color: 'var(--color-warning)' }}>{t(K.promote.staleNote)}</p>}
        {p.nudge && <p className="t-xs" data-nudge style={{ color: 'var(--color-warning)' }}>{t(K.promote.nudge)}</p>}
        {mine.length > 0 && <div className="stack gap-2" data-promo-results>{mine.map((r) => <RunCard key={r.id} r={r} s={s} t={t} />)}</div>}
        {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
        <div className="row gap-2 wrap">
          <Button size="sm" variant="secondary" data-act={`suite-${p.ruleId}`} loading={s.busy} onClick={() => void suite()}>{t(K.promote.suite)}</Button>
          {open.length > 0 && <Button size="sm" variant="secondary" data-act={`accept-all-${p.ruleId}`} loading={s.busy} onClick={() => void acceptAll()}>{t(K.promote.acceptAll)}</Button>}
          <Button size="sm" data-act={`golive-${p.ruleId}`} disabled={p.status !== 'tested_passed'} onClick={onGoLive}>{t(K.promote.go)}</Button>
          <Button size="sm" variant="ghost" onClick={() => nav(`/workflow-rules/${p.ruleId}`)}>{t(K.promote.edit)}</Button>
        </div>
      </div>
    </Card>
  );
}

function GoLiveSheet({ ruleId, promo, s, t, onClose }: { ruleId: string | null; promo: SandboxPromotionRow | undefined; s: SandboxState; t: T; onClose: () => void }) {
  const toast = useToast();
  const [pv, setPv] = useState<SandboxPromotionPreview | null>(null);
  const [fromNow, setFromNow] = useState(false);
  const [confirmMany, setConfirmMany] = useState(false);
  const [ack, setAck] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => {
    setPv(null); setFromNow(false); setConfirmMany(false); setAck(false); setProblem(null);
    if (!ruleId) return;
    let live = true;
    void s.preview(ruleId).then((r) => { if (!live) return; if (r.ok) setPv(r.value); else setProblem(r.problem); });
    return () => { live = false; };
  }, [ruleId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!ruleId || !promo) return <Sheet open={false} onClose={onClose} title="" closeLabel={t(K.close)}>{null}</Sheet>;
  const go = async () => { setProblem(null); const r = await s.promote(ruleId, { fromNow, confirmMany, acknowledgeConflicts: ack }); if (r.ok) { toast.push(t(K.promote.done)); onClose(); } else setProblem(r.problem); };
  const blocked = !pv || (pv.many && !fromNow && !confirmMany) || (pv.conflicts > 0 && !ack);
  return (
    <Sheet open onClose={onClose} title={t(K.promote.sheetTitle, { name: promo.label })} closeLabel={t(K.close)}>
      <div className="stack gap-3" data-golive-sheet>
        {pv && <p className="t-sm" data-matching={pv.matching}>{t(K.promote.matching, { count: pv.matching })}</p>}
        {pv?.many && (
          <div className="stack gap-2" data-many>
            <p className="t-sm" style={{ color: 'var(--color-warning)' }}>{t(K.promote.many)}</p>
            <Checkbox checked={fromNow} onChange={setFromNow} label={t(K.promote.fromNow)} />
            {!fromNow && <Checkbox checked={confirmMany} onChange={setConfirmMany} label={t(K.promote.confirmMany)} />}
          </div>
        )}
        {pv && pv.conflicts > 0 && (
          <div className="stack gap-2" data-conflicts>
            <p className="t-sm">{t(K.promote.conflicts, { count: pv.conflicts })}</p>
            <Checkbox checked={ack} onChange={setAck} label={t(K.promote.ack)} />
          </div>
        )}
        {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
        <Button data-act="golive-do" disabled={blocked} loading={s.busy} onClick={() => void go()}>{t(K.promote.live)}</Button>
      </div>
    </Sheet>
  );
}
