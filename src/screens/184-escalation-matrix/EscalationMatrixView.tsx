import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, Phone, Plus, ShieldWarning, Trash } from '@phosphor-icons/react';
import { AscensionLine, Badge, Button, Card, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, TextArea, Toggle, formatDate, useToast } from '@/design-system';
import type { AscensionStep } from '@/design-system';
import type { EscalationMatrixView, EscalationRunView } from '@/data/repository';
import type { EscalationChainTier, EscalationChannel, EscalationDrill, EscalationRailState } from '@/data/types';
import { BACKUP_KEYS, ESC_CHANNELS, MAX_BACKUPS, MAX_REPEATS, MAX_TIERS, NOTE_MIN, PRIMARY, chainProblems, formatMinutes, offsetsOf, phoneProblem } from '@/features/escalation/matrix';
import { ALERTS_ROUTE, ESCALATION_MATRIX_KEYS as K } from './escalation-matrix.types';
import { useEscalationMatrix } from './useEscalationMatrix';
import type { MatrixState } from './useEscalationMatrix';

type T = ReturnType<typeof useTranslation>['t'];
const RAILS: EscalationRailState[] = ['working', 'failing', 'silent'];
const stepTone = (s: string): 'success' | 'warning' | 'error' | 'neutral' => (s === 'confirmed' ? 'success' : s === 'pending' ? 'neutral' : s === 'failed' || s === 'no_response' ? 'error' : 'warning');
const errText = (t: T, code: string) => t(`escalationMatrix.error.${code}`, { defaultValue: t(K.error.generic) });
const minutesText = (t: T, m: number): string => { const f = formatMinutes(m); return `${f.value} ${t(`escalationMatrix.unit.${f.unit}`)}`; };
const nameOfScenario = (t: T, id: string): string => t(`escalationMatrix.scenario.${id}.name`);
const timeOf = (iso: string, lang: string): string => new Date(iso).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });

/** Who a target key means right now: the Admin, a named backup, or an empty backup place. */
function whoText(t: T, v: EscalationMatrixView, key: string): string {
  if (key === PRIMARY) return t(K.target.primary);
  const slot = v.backups.find((b) => b.key === key);
  return slot?.contact?.name ?? `${t(K.target.backup, { n: slot?.slot ?? key.split(':')[1] })} (${t(K.chain.unfilled)})`;
}
const channelsText = (t: T, cs: EscalationChannel[]): string => cs.map((c) => t(`escalationMatrix.channel.${c}`)).join(' · ');

/** Screen 184 — Escalation Matrix Configuration. Settings layout: sections with their current values shown, a chain per scenario drawn on the Ascension Line, a real backup path and drills that prove it works. */
export function EscalationMatrixScreen() {
  const { t, i18n } = useTranslation();
  const s = useEscalationMatrix();
  const v = s.view;
  const head = <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" data-refresh onClick={() => void s.refresh()} aria-label={t(K.refresh)}><ArrowsClockwise size={18} /></Button>} />;
  if (s.load === 'loading' && !v) return <Screen width="default">{head}<LoadingState label={t(K.loading)} variant="list" rows={5} /></Screen>;
  if (s.load === 'error' && !v) return <Screen width="default">{head}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.refresh()} /></Screen>;
  if (!v) return null;
  const noBackup = v.backups.every((b) => !b.contact);
  return (
    <Screen width="default">
      {head}
      <div className="stack gap-4">
        {s.offline && <p className="t-xs t-muted" role="status" data-offline>{t(K.offline)}</p>}
        {noBackup && (
          <Card>
            <div className="stack gap-1" data-no-backup>
              <span className="t-sm t-semibold row gap-2" style={{ alignItems: 'center', color: 'var(--color-warning)' }}><ShieldWarning size={18} aria-hidden="true" />{t(K.noBackup.title)}</span>
              <p className="t-xs">{t(K.noBackup.body)}</p>
            </div>
          </Card>
        )}
        <Stats v={v} t={t} />
        <Contacts s={s} v={v} t={t} />
        <Scenarios s={s} v={v} t={t} lang={i18n.language} />
        <Runs s={s} v={v} t={t} lang={i18n.language} />
        <Drills s={s} v={v} t={t} lang={i18n.language} />
        <p className="t-xs t-muted" data-placeholder-note>{t(K.placeholders.body)}</p>
      </div>
      <ContactSheet s={s} v={v} t={t} />
      <ScenarioSheet s={s} v={v} t={t} lang={i18n.language} />
      <DrillSheet s={s} v={v} t={t} lang={i18n.language} />
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

function Stats({ v, t }: { v: EscalationMatrixView; t: T }) {
  const items: [string, string, string][] = [
    [K.summary.vital, t(K.summary.vitalValue, { have: v.totals.vitalWithBackup, total: v.totals.vital }), 'vital'],
    [K.summary.drills, String(v.totals.overdueDrills), 'drills'],
    [K.summary.gaps, String(v.totals.openGaps), 'gaps'],
    [K.summary.running, String(v.totals.runningNow), 'running'],
  ];
  return <div className="row gap-4 wrap" data-stats>{items.map(([label, n, id]) => <span key={id} className="stack gap-0" data-stat={id}><span className="t-lg t-semibold" style={{ fontFamily: 'var(--font-mono)' }}>{n}</span><span className="t-xs t-muted">{t(label)}</span></span>)}</div>;
}

/* ------------------------------------------------------------------ the people */

function RailControls({ s, target, t }: { s: MatrixState; target: string; t: T }) {
  const v = s.view;
  const rail = target === PRIMARY ? v?.primary.rail : v?.backups.find((b) => b.key === target)?.contact?.rail;
  if (!rail) return null;
  return (
    <details data-demo-rail={target}>
      <summary className="t-xs t-muted" style={{ cursor: 'pointer' }}>{t(K.backups.demoTitle)}</summary>
      <div className="stack gap-2" style={{ marginTop: 8 }}>
        <p className="t-xs t-muted">{t(K.backups.demoHint)}</p>
        {(['sms', 'call'] as const).map((ch) => (
          <div key={ch} className="row gap-2 wrap" style={{ alignItems: 'center' }} role="group" aria-label={t(`escalationMatrix.backups.${ch}`)}>
            <span className="t-xs" style={{ minWidth: 72 }}>{t(`escalationMatrix.backups.${ch}`)}</span>
            {RAILS.map((r) => <span key={r} data-rail={`${target}:${ch}:${r}`}><Chip pressed={rail[ch] === r} onClick={() => void s.setRail(target, ch, r)}>{t(`escalationMatrix.rail.${r}`)}</Chip></span>)}
          </div>
        ))}
      </div>
    </details>
  );
}

function Contacts({ s, v, t }: { s: MatrixState; v: EscalationMatrixView; t: T }) {
  return (
    <Section title={t(K.backups.title)} hint={t(K.backups.hint)}>
      <div className="grid-auto" data-contacts>
        <Card>
          <div className="stack gap-1" data-contact="primary">
            <span className="t-xs t-muted">{t(K.backups.primary)}</span>
            <span className="t-sm t-semibold">{v.primary.name}</span>
            <span className="t-xs row gap-1" style={{ alignItems: 'center', fontFamily: 'var(--font-mono)' }}><Phone size={14} aria-hidden="true" />{v.primary.phone}</span>
            <span className="t-xs t-muted">{t(K.backups.primaryHint)}</span>
            <RailControls s={s} target={PRIMARY} t={t} />
          </div>
        </Card>
        {v.backups.map((b) => (
          <Card key={b.key}>
            <div className="stack gap-1" data-contact={b.key}>
              <span className="t-xs t-muted">{t(K.backups.slot, { n: b.slot })}</span>
              {b.contact ? (
                <>
                  <span className="t-sm t-semibold">{b.contact.name}</span>
                  <span className="t-xs row gap-1" style={{ alignItems: 'center', fontFamily: 'var(--font-mono)' }}><Phone size={14} aria-hidden="true" />{b.contact.phone}</span>
                  <span className="t-xs t-muted">{b.contact.userId ? t(K.backups.hasAccount) : t(K.backups.phoneOnly)}{b.contact.note ? ` · ${b.contact.note}` : ''}</span>
                  <div className="row gap-2"><Button size="sm" variant="secondary" data-act={`edit-contact-${b.slot}`} onClick={() => s.openContact(b.slot)}>{t(K.backups.edit)}</Button></div>
                  <RailControls s={s} target={b.key} t={t} />
                </>
              ) : (
                <>
                  <span className="t-sm t-muted">{t(K.backups.notSet)}</span>
                  <div className="row gap-2"><Button size="sm" variant="secondary" data-act={`edit-contact-${b.slot}`} onClick={() => s.openContact(b.slot)}><Plus size={14} /> {t(K.backups.set)}</Button></div>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}

function ContactSheet({ s, v, t }: { s: MatrixState; v: EscalationMatrixView; t: T }) {
  const toast = useToast();
  const slot = s.contact;
  const current = v.backups.find((b) => b.slot === slot)?.contact ?? null;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [userId, setUserId] = useState('');
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  useEffect(() => { setName(current?.name ?? ''); setPhone(current?.phone ?? ''); setUserId(current?.userId ?? ''); setNote(current?.note ?? ''); setProblem(null); setAsking(false); }, [slot]); // eslint-disable-line react-hooks/exhaustive-deps
  const open = slot >= 1 && slot <= MAX_BACKUPS;
  const bad = phone.trim() !== '' && phoneProblem(phone);
  const save = async () => { setProblem(null); const r = await s.saveBackup(slot, { name, phone, userId: userId || undefined, note }); if (r.ok) { s.openContact(null); toast.push(t(K.contact.save)); } else setProblem(r.problem); };
  const remove = async () => { const r = await s.saveBackup(slot, null); if (r.ok) s.openContact(null); else setProblem(r.problem); };
  return (
    <Sheet open={open} onClose={() => s.openContact(null)} title={t(K.contact.title, { n: slot })} closeLabel={t(K.close)}>
      <div className="stack gap-3" data-contact-sheet>
        <Field label={t(K.contact.name)}>{(p) => <Input id={p.id} value={name} data-f="name" onChange={(e) => setName(e.target.value)} />}</Field>
        <Field label={t(K.contact.phone)} hint={t(K.contact.phoneHint)} error={bad ? t(K.error.invalid_phone) : undefined}>{(p) => <Input id={p.id} inputMode="tel" value={phone} data-f="phone" invalid={bad} onChange={(e) => setPhone(e.target.value)} />}</Field>
        <Field label={t(K.contact.account)} hint={t(K.contact.accountHint)}>{(p) => (
          <Select id={p.id} value={userId} data-f="account" onChange={(e) => setUserId(e.target.value)}>
            <option value="">{t(K.contact.accountNone)}</option>
            {s.people.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        )}</Field>
        <Field label={t(K.contact.note)} hint={t(K.contact.noteHint)}>{(p) => <TextArea id={p.id} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
        {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
        <div className="row gap-2">
          <Button variant="ghost" onClick={() => s.openContact(null)}>{t(K.contact.cancel)}</Button>
          <Button className="grow" data-act="save-contact" disabled={name.trim().length < 2 || phone.trim() === '' || bad} loading={s.busy} onClick={() => void save()}>{t(K.contact.save)}</Button>
        </div>
        {current && !asking && <div><Button size="sm" variant="ghost" data-act="remove-contact" onClick={() => setAsking(true)} style={{ color: 'var(--color-error)' }}><Trash size={14} /> {t(K.contact.remove)}</Button></div>}
        {current && asking && (
          <div className="stack gap-2" data-confirm-remove>
            <p className="t-sm" style={{ color: 'var(--color-error)' }}>{t(K.contact.removeAsk, { name: current.name })}</p>
            <div className="row gap-2"><Button variant="ghost" onClick={() => setAsking(false)}>{t(K.contact.removeNo)}</Button><Button variant="secondary" data-act="confirm-remove" loading={s.busy} onClick={() => void remove()} style={{ color: 'var(--color-error)' }}>{t(K.contact.removeYes)}</Button></div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ scenarios */

/** The chain as the Ascension Line: one node per step, an empty backup place shown as blocked. */
function chainSteps(t: T, v: EscalationMatrixView, tiers: EscalationChainTier[], offsets: number[], statusOf?: (i: number) => AscensionStep['status']): AscensionStep[] {
  return tiers.map((tier, i) => {
    const unfilled = tier.targets.some((k) => k !== PRIMARY && !v.backups.find((b) => b.key === k)?.contact);
    const timing = i === 0 ? t(K.chain.now) : `${t(K.chain.after, { value: formatMinutes(tier.afterMinutes).value, unit: t(`escalationMatrix.unit.${formatMinutes(tier.afterMinutes).unit}`) })} · ${t(K.chain.total, { value: formatMinutes(offsets[i]).value, unit: t(`escalationMatrix.unit.${formatMinutes(offsets[i]).unit}`) })}`;
    return { id: tier.id, label: tier.targets.map((k) => whoText(t, v, k)).join(' + '), meta: `${channelsText(t, tier.channels)} · ${timing}${unfilled ? ` · ${t(K.chain.unfilledNote)}` : ''}`, status: statusOf ? statusOf(i) : unfilled ? 'blocked' : 'upcoming' };
  });
}

function lastResortText(t: T, tiers: EscalationChainTier[], last: { repeatEveryMinutes: number; repeats: number }): string {
  return last.repeats > 0 ? t(K.lastResort.repeat, { count: last.repeats, every: minutesText(t, last.repeatEveryMinutes) }) : t(K.lastResort.none);
}

function Scenarios({ s, v, t, lang }: { s: MatrixState; v: EscalationMatrixView; t: T; lang: string }) {
  return (
    <Section title={t(K.scenarios.title)} hint={t(K.scenarios.hint)}>
      <div className="stack gap-3" data-scenarios>
        {v.scenarios.map((x) => {
          const status = x.runningDrillId ? t(K.drillStatus.running) : x.lastDrill ? (x.lastDrill.status === 'passed' ? t(K.drillStatus.passed, { date: formatDate(x.lastDrill.at, lang) }) : t(K.drillStatus.gaps, { date: formatDate(x.lastDrill.at, lang), count: x.lastDrill.gaps })) : t(K.drillStatus.never);
          return (
            <Card key={x.id}>
              <div className="stack gap-2" data-scenario={x.id}>
                <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
                  <span className="t-md t-semibold">{nameOfScenario(t, x.id)}</span>
                  {x.vital && <Badge tone="neutral">{t(K.vital)}</Badge>}
                  {!x.enabled && <Badge tone="warning">{t(K.off)}</Badge>}
                </div>
                <p className="t-xs t-muted">{t(`escalationMatrix.scenario.${x.id}.covers`)} · {t(`escalationMatrix.trigger.${x.trigger}`)}</p>
                <AscensionLine steps={chainSteps(t, v, x.tiers, x.offsets)} className="ds-ascension--multiline" />
                <p className="t-xs" data-last-resort>{t(K.lastResort.title)}: {lastResortText(t, x.tiers, x.lastResort)} {t(K.lastResort.limit)}</p>
                {x.unfilled.length > 0 && <p className="t-xs" data-unfilled style={{ color: 'var(--color-warning)' }}>{t(K.unfilledWarn, { count: new Set(x.unfilled.map((g) => g.tierIndex)).size })}</p>}
                <div className="stack gap-1" data-drill-status>
                  <span className="t-xs" style={x.openGap ? { color: 'var(--color-error)' } : undefined}>{status}</span>
                  {x.openGap && <span className="t-xs" style={{ color: 'var(--color-error)' }}>{t(K.openGap)}</span>}
                  {!x.runningDrillId && <span className="t-xs" style={x.drillOverdue ? { color: 'var(--color-warning)' } : { color: 'var(--color-text-secondary)' }}>{x.drillOverdue ? t(K.drillStatus.overdue) : t(K.drillStatus.due, { date: formatDate(x.drillDueAt, lang) })}</span>}
                </div>
                <div className="row gap-2 wrap">
                  {x.runningDrillId ? <Button size="sm" data-act={`see-drill-${x.id}`} onClick={() => s.openDrill(x.runningDrillId)}>{t(K.actions.seeDrill)}</Button> : <Button size="sm" data-act={`test-${x.id}`} loading={s.busy} onClick={() => void s.startDrill(x.id)}>{t(K.actions.test)}</Button>}
                  <Button size="sm" variant="secondary" data-act={`edit-${x.id}`} onClick={() => s.openScenario(x.id)}>{t(K.actions.edit)}</Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}

function ScenarioSheet({ s, v, t, lang }: { s: MatrixState; v: EscalationMatrixView; t: T; lang: string }) {
  const toast = useToast();
  const x = s.scenario;
  const d = s.draft;
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => { setProblem(null); }, [s.scenarioId]);
  if (!x || !d) return <Sheet open={false} onClose={() => s.openScenario(null)} title="" closeLabel={t(K.close)}>{null}</Sheet>;
  const tiers = d.tiers as EscalationChainTier[];
  const check = chainProblems({ tiers, lastResort: d.lastResort, vital: x.vital, singlePointNote: d.singlePointNote });
  const onlyYou = new Set(tiers.flatMap((r) => r.targets)).size <= 1 && tiers.every((r) => r.targets.every((k) => k === PRIMARY));
  const dirty = JSON.stringify(d) !== JSON.stringify({ enabled: x.enabled, trigger: x.trigger, tiers: x.tiers, lastResort: x.lastResort, singlePointNote: x.singlePointNote });
  const setTier = (i: number, next: Partial<EscalationChainTier>) => s.edit({ tiers: tiers.map((r, j) => (j === i ? { ...r, ...next } : r)) });
  const toggle = <V,>(list: V[], item: V): V[] => (list.includes(item) ? list.filter((z) => z !== item) : [...list, item]);
  const offsets = offsetsOf(tiers);
  const save = async () => { setProblem(null); const r = await s.save(); if (r.ok) toast.push(t(K.edit.saved)); else setProblem(r.problem); };
  return (
    <Sheet open onClose={() => s.openScenario(null)} title={t(K.edit.title, { name: nameOfScenario(t, x.id) })} closeLabel={t(K.close)}>
      <div className="stack gap-4" data-scenario-sheet={x.id}>
        <p className="t-xs t-muted">{t(K.edit.sheetHint)}</p>
        <Toggle checked={d.enabled} disabled={x.vital} onChange={(on) => s.edit({ enabled: on })} label={t(K.edit.enabled)} description={x.vital ? t(K.edit.vitalOn) : t(K.edit.enabledHint)} />
        <div className="stack gap-1" role="group" aria-label={t(K.edit.stops)}>
          <span className="t-sm t-semibold">{t(K.edit.stops)}</span>
          <div className="row gap-2 wrap">{(['unacknowledged', 'unresolved'] as const).map((tr) => <span key={tr} data-trigger={tr}><Chip pressed={d.trigger === tr} onClick={() => s.edit({ trigger: tr })}>{t(`escalationMatrix.trigger.${tr}`)}</Chip></span>)}</div>
        </div>
        <div className="stack gap-3">
          <span className="t-sm t-semibold">{t(K.edit.steps)}</span>
          {tiers.map((tier, i) => (
            <Card key={tier.id}>
              <div className="stack gap-2" data-tier={i}>
                <div className="row between" style={{ alignItems: 'center' }}>
                  <span className="t-sm t-semibold">{t(K.chain.step, { n: i + 1 })}</span>
                  {tiers.length > 1 && <Button size="sm" variant="ghost" data-act={`remove-tier-${i}`} aria-label={t(K.edit.removeStep)} onClick={() => s.edit({ tiers: tiers.filter((_r, j) => j !== i).map((r, j) => ({ ...r, id: `t${j + 1}`, afterMinutes: j === 0 ? 0 : r.afterMinutes })) })}><Trash size={16} /></Button>}
                </div>
                <div className="stack gap-1" role="group" aria-label={t(K.edit.who)}>
                  <span className="t-xs t-muted">{t(K.edit.who)}</span>
                  <div className="row gap-2 wrap">{[PRIMARY, ...BACKUP_KEYS].map((k) => <span key={k} data-target={`${i}:${k}`}><Chip pressed={tier.targets.includes(k)} onClick={() => setTier(i, { targets: toggle(tier.targets, k) })}>{whoText(t, v, k)}</Chip></span>)}</div>
                </div>
                <div className="stack gap-1" role="group" aria-label={t(K.edit.how)}>
                  <span className="t-xs t-muted">{t(K.edit.how)}</span>
                  <div className="row gap-2 wrap">{ESC_CHANNELS.map((c) => <span key={c} data-channel={`${i}:${c}`}><Chip pressed={tier.channels.includes(c)} onClick={() => setTier(i, { channels: ESC_CHANNELS.filter((z) => (z === c ? !tier.channels.includes(c) : tier.channels.includes(z))) })}>{t(`escalationMatrix.channel.${c}`)}</Chip></span>)}</div>
                </div>
                {i === 0 ? <p className="t-xs t-muted">{t(K.edit.delayFirst)}</p> : (
                  <Field label={t(K.edit.delay)} hint={`${t(K.chain.total, { value: formatMinutes(offsets[i]).value, unit: t(`escalationMatrix.unit.${formatMinutes(offsets[i]).unit}`) })}`}>{(p) => <Input id={p.id} type="number" inputMode="numeric" min={1} max={1440} value={String(tier.afterMinutes)} data-f={`delay-${i}`} onChange={(e) => setTier(i, { afterMinutes: Number(e.target.value) })} />}</Field>
                )}
              </div>
            </Card>
          ))}
          {tiers.length < MAX_TIERS && <div><Button size="sm" variant="secondary" data-act="add-tier" onClick={() => s.edit({ tiers: [...tiers, { id: `t${tiers.length + 1}`, targets: [BACKUP_KEYS[0]], channels: ['sms'], afterMinutes: 10 }] })}><Plus size={14} /> {t(K.edit.addStep)}</Button></div>}
        </div>
        <div className="stack gap-2">
          <span className="t-sm t-semibold">{t(K.edit.repeatTitle)}</span>
          <div className="grid-2">
            <Field label={t(K.edit.repeatEvery)}>{(p) => <Input id={p.id} type="number" inputMode="numeric" min={1} max={1440} value={String(d.lastResort.repeatEveryMinutes)} data-f="repeat-every" onChange={(e) => s.edit({ lastResort: { ...d.lastResort, repeatEveryMinutes: Number(e.target.value) } })} />}</Field>
            <Field label={t(K.edit.repeatTimes)} hint={`0 – ${MAX_REPEATS}`}>{(p) => <Input id={p.id} type="number" inputMode="numeric" min={0} max={MAX_REPEATS} value={String(d.lastResort.repeats)} data-f="repeat-times" onChange={(e) => s.edit({ lastResort: { ...d.lastResort, repeats: Number(e.target.value) } })} />}</Field>
          </div>
          <p className="t-xs t-muted">{lastResortText(t, tiers, d.lastResort)} {t(K.lastResort.limit)}</p>
        </div>
        {onlyYou && (
          <div className="stack gap-2" data-single-point>
            <span className="t-sm t-semibold" style={{ color: 'var(--color-warning)' }}>{t(K.edit.singleTitle)}</span>
            <p className="t-xs">{t(K.edit.singleBody)}</p>
            <Field label={t(K.edit.singleNote)} hint={t(K.edit.singleHint)}>{(p) => <TextArea id={p.id} rows={2} value={d.singlePointNote} data-f="single-note" onChange={(e) => s.edit({ singlePointNote: e.target.value })} />}</Field>
          </div>
        )}
        <div className="stack gap-1" data-problems>{check.blocking.filter((c) => !(c === 'single_person' && onlyYou)).map((c) => <p key={c} className="t-xs t-error" role="alert" data-problem={c}>{errText(t, `chain_${c}`)}</p>)}</div>
        {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
        <div className="row gap-2">
          {dirty && <Button variant="ghost" data-act="revert" onClick={s.revert}>{t(K.edit.revert)}</Button>}
          <Button className="grow" data-act="save" disabled={!dirty || check.blocking.length > 0} loading={s.busy} onClick={() => void save()}>{t(K.edit.save)}</Button>
        </div>
        {x.history.length > 0 && (
          <section className="stack gap-1" data-history>
            <h3 className="t-sm t-semibold">{t(K.history.title)}</h3>
            {[...x.history].reverse().map((h) => <p key={`${h.version}-${h.at}`} className="t-xs">{t(K.history.line, { version: h.version, date: formatDate(h.at, lang), by: h.byName, summary: h.summary })}</p>)}
          </section>
        )}
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ live escalations and drills */

function Runs({ s, v, t, lang }: { s: MatrixState; v: EscalationMatrixView; t: T; lang: string }) {
  const nav = useNavigate();
  return (
    <Section title={t(K.runs.title)}>
      {v.runs.length === 0 ? <EmptyState title={t(K.runs.empty)} body={t(K.runs.emptyHint)} /> : (
        <div className="stack gap-2" data-runs>
          {v.runs.map((r) => <RunCard key={r.id} r={r} v={v} t={t} lang={lang} open={s.runId === r.id} onToggle={() => s.openRun(s.runId === r.id ? null : r.id)} onAlerts={() => nav(ALERTS_ROUTE)} />)}
        </div>
      )}
    </Section>
  );
}

function RunCard({ r, v, t, lang, open, onToggle, onAlerts }: { r: EscalationRunView; v: EscalationMatrixView; t: T; lang: string; open: boolean; onToggle: () => void; onAlerts: () => void }) {
  const tone = r.status === 'exhausted' ? 'error' : r.status === 'running' ? 'warning' : 'neutral';
  const steps = chainSteps(t, v, r.tiers, offsetsOf(r.tiers), (i) => (i < r.firedTiers ? 'complete' : i === r.firedTiers && r.status === 'running' ? 'current' : 'upcoming'));
  return (
    <Card>
      <div className="stack gap-2" data-run={r.id}>
        <button type="button" className="row between" style={{ background: 'none', border: 0, padding: 0, textAlign: 'start', cursor: 'pointer', color: 'inherit', alignItems: 'center', gap: 8 }} aria-expanded={open} onClick={onToggle}>
          <span className="stack gap-0"><span className="t-sm t-semibold">{r.alertCode} · {nameOfScenario(t, r.scenarioId)}</span><span className="t-xs t-muted">{t(K.runs.progress, { done: r.firedTiers, total: r.tiers.length })}{r.nextAt && r.status === 'running' ? ` · ${t(K.runs.next, { time: timeOf(r.nextAt, lang) })}` : ''}{r.stoppedBy ? ` · ${t(`escalationMatrix.runs.stoppedBy.${r.stoppedBy}`)}` : ''}</span></span>
          <Badge tone={tone}>{t(`escalationMatrix.runs.${r.status}`)}</Badge>
        </button>
        {r.status === 'exhausted' && <p className="t-xs" data-exhausted style={{ color: 'var(--color-error)' }}>{t(K.runs.exhaustedNote)}</p>}
        {open && (
          <div className="stack gap-2" data-run-detail>
            <AscensionLine steps={steps} className="ds-ascension--multiline" />
            <ul className="stack gap-1" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {r.deliveries.map((d) => <li key={d.id} className="t-xs" data-delivery>{timeOf(d.at, lang)} · {d.name || whoText(t, v, d.target)} · {t(`escalationMatrix.channel.${d.channel}`)} · {t(`escalationMatrix.runs.${d.status}`)}{d.reason ? ` (${t(`escalationMatrix.runs.skipReason.${d.reason}`)})` : ''}{d.repeat > 0 ? ` · ${t(K.runs.repeat, { n: d.repeat })}` : ''}</li>)}
            </ul>
            <div><Button size="sm" variant="ghost" onClick={onAlerts}>{t(K.runs.alert)}</Button></div>
          </div>
        )}
      </div>
    </Card>
  );
}

function Drills({ s, v, t, lang }: { s: MatrixState; v: EscalationMatrixView; t: T; lang: string }) {
  return (
    <Section title={t(K.drills.title)}>
      {v.drills.length === 0 ? <EmptyState title={t(K.drills.empty)} body={t(K.drills.emptyBody)} /> : (
        <div className="stack gap-2" data-drills>
          {v.drills.map((d) => (
            <Card key={d.id}>
              <div className="row between" data-drill-row={d.id} style={{ alignItems: 'center', gap: 8 }}>
                <span className="stack gap-0"><span className="t-sm t-semibold">{d.code} · {nameOfScenario(t, d.scenarioId)}</span><span className="t-xs t-muted">{t(K.drill.by, { name: d.byName, date: formatDate(d.startedAt, lang) })}</span></span>
                <span className="row gap-2" style={{ alignItems: 'center' }}><Badge tone={d.status === 'passed' ? 'success' : d.status === 'running' ? 'neutral' : 'error'}>{t(`escalationMatrix.drill.${d.status}`)}</Badge><Button size="sm" variant="ghost" onClick={() => s.openDrill(d.id)}>{t(K.drills.open)}</Button></span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Section>
  );
}

function DrillSheet({ s, v, t, lang }: { s: MatrixState; v: EscalationMatrixView; t: T; lang: string }) {
  const toast = useToast();
  const d: EscalationDrill | null = s.drill;
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => { setNote(''); setProblem(null); }, [s.drillId]);
  if (!d) return <Sheet open={false} onClose={() => s.openDrill(null)} title="" closeLabel={t(K.close)}>{null}</Sheet>;
  const gaps = d.steps.filter((x) => x.status !== 'confirmed' && x.status !== 'pending');
  const kinds = [...new Set(gaps.map((g) => g.status))];
  const accept = async () => { setProblem(null); const r = await s.acceptGap(d.id, note); if (r.ok) toast.push(t(K.drill.acceptSave)); else setProblem(r.problem); };
  const again = async () => { setProblem(null); const r = await s.startDrill(d.scenarioId); if (!r.ok) setProblem(r.problem); };
  return (
    <Sheet open onClose={() => s.openDrill(null)} title={t(K.drill.title, { code: d.code })} closeLabel={t(K.close)}>
      <div className="stack gap-3" data-drill-sheet={d.id} data-status={d.status}>
        <span className="row gap-2" style={{ alignItems: 'center' }}><span className="t-sm t-semibold">{nameOfScenario(t, d.scenarioId)}</span><Badge tone={d.status === 'passed' ? 'success' : d.status === 'running' ? 'neutral' : 'error'}>{t(`escalationMatrix.drill.${d.status}`)}</Badge></span>
        <p className="t-xs t-muted">{t(K.drill.hint)}</p>
        {d.status === 'running' && <p className="t-xs" role="status">{t(K.drill.waiting)}</p>}
        <ul className="stack gap-2" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {d.steps.map((x) => (
            <li key={x.id} className="row between" data-step={x.id} data-step-status={x.status} style={{ gap: 8, alignItems: 'center' }}>
              <span className="stack gap-0"><span className="t-xs">{t(K.drill.stepLine, { n: x.tierIndex + 1, who: x.name || whoText(t, v, x.target), channel: t(`escalationMatrix.channel.${x.channel}`) })}</span></span>
              <span className="row gap-2" style={{ alignItems: 'center' }}>
                <Badge tone={stepTone(x.status)}>{t(`escalationMatrix.step.${x.status}`)}</Badge>
                {x.status === 'pending' && <Button size="sm" variant="secondary" data-act={`confirm-${x.id}`} loading={s.busy} onClick={() => void s.confirmStep(d.id, x.id)}>{t(K.drill.confirm)}</Button>}
              </span>
            </li>
          ))}
        </ul>
        {d.status === 'passed' && <p className="t-sm" data-passed style={{ color: 'var(--color-success)' }}>{t(K.drill.passedBody)}</p>}
        {d.status === 'gaps' && (
          <div className="stack gap-3" data-gaps>
            <span className="t-sm t-semibold" style={{ color: 'var(--color-error)' }}>{t(K.drill.gapsTitle, { count: new Set(gaps.map((g) => `${g.tierIndex}:${g.target}:${g.status}`)).size })}</span>
            <p className="t-xs">{t(K.drill.gapsBody)}</p>
            <ul className="stack gap-1" style={{ margin: 0, paddingInlineStart: 18 }}>{kinds.map((kd) => <li key={kd} className="t-xs" data-fix={kd}>{t(`escalationMatrix.fix.${kd}`)}</li>)}</ul>
            {d.accepted ? <p className="t-xs t-muted" data-accepted>{t(K.drill.accepted, { name: d.accepted.byName, date: formatDate(d.accepted.at, lang), note: d.accepted.note })}</p> : (
              <div className="stack gap-2" data-accept>
                <span className="t-sm t-semibold">{t(K.drill.accept)}</span>
                <p className="t-xs t-muted">{t(K.drill.acceptHint)}</p>
                <Field label={t(K.drill.acceptNote)} hint={`${note.trim().length}/${NOTE_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={note} data-f="accept-note" onChange={(e) => setNote(e.target.value)} />}</Field>
                <div><Button size="sm" variant="secondary" data-act="accept-gap" disabled={note.trim().length < NOTE_MIN} loading={s.busy} onClick={() => void accept()} style={{ color: 'var(--color-error)' }}>{t(K.drill.acceptSave)}</Button></div>
              </div>
            )}
          </div>
        )}
        {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
        {d.status !== 'running' && <div><Button data-act="drill-again" loading={s.busy} onClick={() => void again()}>{t(K.drill.again)}</Button></div>}
      </div>
    </Sheet>
  );
}
