import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, CheckCircle, Circle, FileText, HandHeart, Lock } from '@phosphor-icons/react';
import { ActionBar, AscensionLine, Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, SignaturePad, TextArea, formatDate, formatDateTime, formatINR } from '@/design-system';
import type { WalkthroughView } from '@/data/repository';
import { NAME_MIN, QUESTION_MIN } from '@/features/qc/walkthrough';
import { useWalkthrough } from './useWalkthrough';
import type { ActionResult, WalkState } from './useWalkthrough';
import { DOCS, GROUPS, MODES, SCORES, STEPS, WALK_KEYS as K, boardPath, checklistPath, warrantyPath } from './walkthrough.types';
import type { StepId } from './walkthrough.types';

type T = ReturnType<typeof useTranslation>['t'];
const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);

/**
 * Screen 138 — Customer Handover Walkthrough. A wizard for the final, human handover: arrange it, show the customer their lift, hand over the
 * documents, and let the customer confirm for themselves. One group of decisions per step, Back and Next always visible, any completed step
 * can be revisited, and a review step shows everything at a glance. Reachable only after Ready for Handover.
 */
export function WalkthroughScreen() {
  const { t } = useTranslation();
  const s = useWalkthrough();
  const wrap = (body: JSX.Element) => (
    <Screen width="narrow">
      <ScreenHeader title={t(K.title)} />
      {body}
    </Screen>
  );
  // A customer with a single handover is taken straight to it.
  useEffect(() => {
    if (!s.jobId && s.board && s.board.viewer === 'customer' && s.board.rows.length === 1) s.goto(`${boardPath}/${s.board.rows[0].jobId}`, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.board, s.jobId]);
  if (s.status === 'not_found') return wrap(<EmptyState icon={<HandHeart size={28} />} title={t(K.notFound.title)} body={t(K.notFound.body)} actionLabel={t(K.notFound.action)} onAction={() => s.goto(boardPath)} />);
  if (s.status === 'loading' && !s.view && !s.board) return wrap(<LoadingState label={t(K.loading)} variant="list" rows={4} />);
  if (s.status === 'error' || (!s.view && !s.board)) return wrap(<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />);
  if (!s.jobId && s.board) return <Board s={s} t={t} />;
  return s.view ? <Wizard s={s} v={s.view} t={t} /> : null;
}

function Board({ s, t }: { s: WalkState; t: T }) {
  const { i18n } = useTranslation();
  const b = s.board!;
  return (
    <Screen width="narrow">
      <ScreenHeader title={t(K.title)} subtitle={t(K.board.heading)} />
      {b.rows.length === 0 ? (
        <EmptyState icon={<HandHeart size={32} />} title={t(K.board.emptyTitle)} body={t(K.board.emptyBody)} />
      ) : (
        <Card>
          <div className="stack">
            {b.rows.map((r) => (
              <button key={r.jobId} type="button" onClick={() => s.goto(`${boardPath}/${r.jobId}`)} className="row gap-3" data-job={r.jobId} style={{ minHeight: 64, alignItems: 'center', textAlign: 'left', background: 'none', border: 0, borderBottom: '1px solid var(--color-border)', padding: 'var(--space-2) 0', cursor: 'pointer', color: 'inherit' }}>
                <span className="stack" style={{ flex: 1 }}>
                  <strong className="t-sm">{r.siteName}</strong>
                  <span className="t-xs t-muted">{r.code}{r.mode ? ` · ${t(K.mode[r.mode])}` : ''}{r.scheduledFor ? ` · ${formatDate(r.scheduledFor.date, i18n.language)}` : ''}</span>
                </span>
                <Badge tone={r.status === 'signed_off' ? 'success' : r.status === 'locked' ? 'neutral' : 'accent'} dot>{t(K.status[r.status])}</Badge>
              </button>
            ))}
          </div>
        </Card>
      )}
    </Screen>
  );
}

/* ------------------------------------------------------------------ the wizard */

function Wizard({ s, v, t }: { s: WalkState; v: WalkthroughView; t: T }) {
  const staff = v.viewer !== 'customer';
  const a = v.actions;
  const arranged = !!v.mode && !!v.conductor;
  const conducted = !!v.conducted;
  const signed = !!v.signoff;
  const scriptDone = v.script.filter((i) => i.mandatory).every((i) => i.done);
  const docsDone = v.documents.every((d) => d.provided);
  const complete: Record<StepId, boolean> = {
    arrange: arranged,
    demonstrate: staff ? scriptDone : conducted,
    documents: staff ? docsDone : conducted,
    signoff: signed,
    amc: !!v.amc,
    feedback: !!v.feedback,
    review: signed,
  };
  const enabled: Record<StepId, boolean> = { arrange: true, demonstrate: arranged || conducted, documents: arranged || conducted, signoff: arranged || conducted, amc: conducted, feedback: signed, review: true };
  const firstOpen = (['arrange', 'demonstrate', 'documents', 'signoff', 'amc', 'feedback'] as StepId[]).find((x) => !complete[x] && enabled[x]) ?? 'review';
  // Where the person lands is worked out once; after that only they move between steps, so saving a step never jumps them away.
  const [landing] = useState<StepId>(() => (!staff && !signed && conducted ? 'signoff' : firstOpen));
  const step = s.stepParam && enabled[s.stepParam] ? s.stepParam : landing;
  const idx = STEPS.indexOf(step);
  const lineRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    lineRef.current?.querySelector('.ds-ascension__step--current')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [step]);
  if (v.status === 'locked') {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} subtitle={`${v.job.siteName} · ${v.job.code}`} />
        <EmptyState icon={<Lock size={28} />} title={t(K.locked.title)} body={t(staff ? K.locked.body : K.locked.customerBody)} actionLabel={staff ? t(K.locked.action) : undefined} onAction={staff ? () => s.goto(checklistPath(v.job.id)) : undefined} />
      </Screen>
    );
  }
  return (
    <Screen width="narrow" className="pb-action-bar">
      <ScreenHeader
        title={t(K.title)}
        subtitle={`${v.job.siteName} · ${v.job.code}`}
        action={<span data-status={v.status}><Badge tone={signed ? 'success' : 'accent'} dot>{t(K.status[v.status])}</Badge></span>}
      />
      <Card className="mb-3">
        <div ref={lineRef} style={{ overflowX: 'auto' }} data-line>
        <AscensionLine
          orientation="horizontal"
          steps={STEPS.map((id) => ({ id, label: t(K.step[id]), status: complete[id] && id !== 'review' ? 'complete' : id === step ? 'current' : 'upcoming', ...(enabled[id] ? { onClick: () => s.setStep(id) } : {}) }))}
        />
        </div>
      </Card>
      <div data-step={step}>
        {step === 'arrange' && <ArrangeStep s={s} v={v} t={t} />}
        {step === 'demonstrate' && <DemoStep s={s} v={v} t={t} />}
        {step === 'documents' && <DocsStep s={s} v={v} t={t} />}
        {step === 'signoff' && <SignStep s={s} v={v} t={t} />}
        {step === 'amc' && <AmcStep s={s} v={v} t={t} />}
        {step === 'feedback' && <FeedbackStep s={s} v={v} t={t} />}
        {step === 'review' && <ReviewStep s={s} v={v} t={t} />}
      </div>
      <ActionBar>
        <div className="row gap-2" style={{ justifyContent: 'space-between', width: '100%' }}>
          <Button variant="secondary" disabled={idx === 0} icon={<ArrowLeft size={18} aria-hidden="true" />} onClick={() => s.setStep(STEPS[idx - 1])} data-nav="back">{t(K.back)}</Button>
          <Button disabled={idx === STEPS.length - 1 || !enabled[STEPS[idx + 1]]} onClick={() => s.setStep(STEPS[idx + 1])} data-nav="next">{t(K.next)} <ArrowRight size={18} aria-hidden="true" /></Button>
        </div>
      </ActionBar>
    </Screen>
  );
}

function Problem({ code, t }: { code: string | null; t: T }) {
  return code ? <p className="t-xs t-error" role="alert">{t(errorKey(code))}</p> : null;
}

/* ------------------------------------------------------------------ arrange */

function ArrangeStep({ s, v, t }: { s: WalkState; v: WalkthroughView; t: T }) {
  const { i18n } = useTranslation();
  const a = v.actions;
  const d = s.draft;
  const [error, setError] = useState<string | null>(null);
  const mode = (d.mode || v.mode || '') as (typeof MODES)[number] | '';
  const conductorId = d.conductorId || v.conductor?.id || '';
  const date = d.date || v.scheduledFor?.date || '';
  const window = d.date ? d.window : (v.scheduledFor?.window ?? d.window);
  const rep = { name: d.repName || v.representative?.name || '', phone: d.repPhone || v.representative?.phone || '', relation: d.repRelation || v.representative?.relationship || '' };
  const repOk = mode !== 'site_representative' || (rep.name.trim().length >= NAME_MIN && rep.phone.replace(/\D/g, '').length >= 10);
  const ok = !!mode && !!conductorId && repOk;
  return (
    <Card>
      <div className="stack gap-3" data-arrange>
        <strong className="t-md">{t(K.arrange.heading)}</strong>
        <p className="t-sm">{t(K.arrange.intro)}</p>
        {v.mode ? (
          <div className="stack gap-1" data-arranged>
            <p className="t-sm" style={{ fontWeight: 600 }}>{t(K.arrange.summary, { mode: t(K.mode[v.mode]) })}</p>
            {v.conductor && <p className="t-sm">{t(K.arrange.with, { name: v.conductor.name })}</p>}
            {v.scheduledFor && <p className="t-sm">{t(K.arrange.when, { date: formatDate(v.scheduledFor.date, i18n.language), window: t(K.arrange[v.scheduledFor.window]) })}</p>}
            {v.representative && <p className="t-sm">{t(K.arrange.repHeading)}: {v.representative.name} · {v.representative.phone}</p>}
          </div>
        ) : (
          <p className="t-sm t-muted">{t(K.arrange.notArranged)}</p>
        )}
        {a.arrange && (
          <>
            {s.restored && <p className="t-xs t-muted" role="status">{t(K.arrange.draftRestored)}</p>}
            <div className="stack gap-2" role="radiogroup" aria-label={t(K.arrange.mode)}>
              <strong className="t-xs">{t(K.arrange.mode)}</strong>
              {MODES.map((m) => (
                <div key={m} className="stack gap-1">
                  <Chip pressed={mode === m} onClick={() => s.setDraft({ mode: m })}>{t(K.mode[m])}</Chip>
                  {mode === m && <span className="t-xs t-muted">{t(K.modeHint[m])}</span>}
                </div>
              ))}
            </div>
            <Field label={t(K.arrange.conductor)} required>
              {({ id }) => (
                <Select id={id} value={conductorId} onChange={(e) => s.setDraft({ conductorId: e.target.value })} data-conductor>
                  <option value="">{t(K.arrange.choose)}</option>
                  {v.conductors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              )}
            </Field>
            <Field label={t(K.arrange.date)} hint={t(K.arrange.dateHint)}>
              {({ id }) => <Input id={id} type="date" value={date} onChange={(e) => s.setDraft({ date: e.target.value, window })} data-date />}
            </Field>
            {date && (
              <div className="row gap-2" role="radiogroup" aria-label={t(K.arrange.window)}>
                {(['morning', 'afternoon'] as const).map((w) => <Chip key={w} pressed={window === w} onClick={() => s.setDraft({ date, window: w })}>{t(K.arrange[w])}</Chip>)}
              </div>
            )}
            {mode && mode !== 'in_person' && <p className="t-xs t-muted">{t(K.arrange.remoteNote)}</p>}
            {mode === 'site_representative' && (
              <div className="stack gap-2" data-rep>
                <strong className="t-xs">{t(K.arrange.repHeading)}</strong>
                <span className="t-xs t-muted">{t(K.arrange.repHint)}</span>
                <Field label={t(K.arrange.repName)} required>{({ id }) => <Input id={id} value={rep.name} onChange={(e) => s.setDraft({ repName: e.target.value })} data-rep-name />}</Field>
                <Field label={t(K.arrange.repPhone)} required>{({ id }) => <Input id={id} inputMode="tel" value={rep.phone} onChange={(e) => s.setDraft({ repPhone: e.target.value })} data-rep-phone />}</Field>
                <Field label={t(K.arrange.repRelation)}>{({ id }) => <Input id={id} value={rep.relation} onChange={(e) => s.setDraft({ repRelation: e.target.value })} />}</Field>
              </div>
            )}
            <Problem code={error} t={t} />
            <Button disabled={!ok || s.busy} style={{ width: 'fit-content' }} data-save-arrange onClick={async () => {
              const r = await s.arrange({ mode: mode as (typeof MODES)[number], conductorId, ...(date ? { date, window } : {}), ...(mode === 'site_representative' ? { representative: { name: rep.name, phone: rep.phone, relationship: rep.relation } } : {}) });
              if (r.ok) {
                setError(null);
                s.clearDraft(['mode', 'date', 'conductorId', 'repName', 'repPhone', 'repRelation']);
              } else setError(r.code ?? 'generic');
            }}>{t(K.arrange.save)}</Button>
          </>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ demonstrate */

function DemoStep({ s, v, t }: { s: WalkState; v: WalkthroughView; t: T }) {
  const { i18n } = useTranslation();
  const a = v.actions;
  const mandatory = v.script.filter((i) => i.mandatory);
  const doneCount = mandatory.filter((i) => i.done).length;
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="stack gap-3" data-demo>
      <Card>
        <div className="stack gap-2">
          <strong className="t-md">{t(K.demo.heading)}</strong>
          <p className="t-sm">{t(a.tick || v.viewer !== 'customer' ? K.demo.intro : K.demo.customerIntro)}</p>
          <p className="t-sm" style={{ fontWeight: 600 }}>{t(K.demo.progress, { done: doneCount, total: mandatory.length })}</p>
          {!v.mode && v.viewer !== 'customer' && <p className="t-xs t-muted">{t(K.demo.arrangeFirst)}</p>}
        </div>
      </Card>
      {GROUPS.map((g) => {
        const items = v.script.filter((i) => i.group === g);
        if (items.length === 0) return null;
        return (
          <Card key={g}>
            <div className="stack gap-3" data-group={g}>
              <strong className="t-sm">{t(K.demo.group[g])}</strong>
              {items.map((i) => (
                <div key={i.id} className="stack gap-1" data-item={i.id} data-done={i.done ? 'yes' : 'no'} style={{ minHeight: 56 }}>
                  {a.tick ? (
                    <Checkbox checked={!!i.done} disabled={s.busy} onChange={(x) => void s.tick(i.id, x).then((r) => setError(r.ok ? null : (r.code ?? 'generic')))} label={<span className="t-sm">{t(K.demo.item[i.id as keyof typeof K.demo.item])} <span className="t-xs t-muted">· {t(i.mandatory ? K.demo.required : K.demo.optional)}</span></span>} />
                  ) : (
                    <p className="t-sm row gap-2" style={{ alignItems: 'center' }}>{i.done ? <CheckCircle size={20} weight="fill" aria-hidden="true" color="var(--color-success)" /> : <Circle size={20} aria-hidden="true" />} {t(K.demo.item[i.id as keyof typeof K.demo.item])}</p>
                  )}
                  <span className="t-xs t-muted">{t(K.demo.hint[i.id as keyof typeof K.demo.hint])}</span>
                  {i.done && <span className="t-xs t-muted">{t(K.demo.shown, { name: i.done.byName, when: formatDateTime(i.done.at, i18n.language) })}</span>}
                </div>
              ))}
            </div>
          </Card>
        );
      })}
      <Problem code={error} t={t} />
    </div>
  );
}

/* ------------------------------------------------------------------ documents */

function DocsStep({ s, v, t }: { s: WalkState; v: WalkthroughView; t: T }) {
  const { i18n } = useTranslation();
  const a = v.actions;
  const [error, setError] = useState<string | null>(null);
  return (
    <Card>
      <div className="stack gap-3" data-docs>
        <strong className="t-md">{t(K.docs.heading)}</strong>
        <p className="t-sm">{t(K.docs.intro)}</p>
        {!v.mode && v.viewer !== 'customer' && <p className="t-xs t-muted">{t(K.docs.arrangeFirst)}</p>}
        {DOCS.map((kind) => {
          const d = v.documents.find((x) => x.kind === kind)!;
          return (
            <div key={kind} className="stack gap-2" data-doc={kind} data-provided={d.provided ? 'yes' : 'no'} style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
              <p className="t-sm row gap-2" style={{ alignItems: 'center' }}><FileText size={20} aria-hidden="true" /> <strong>{t(K.docs.name[kind])}</strong></p>
              {kind === 'emergency_contacts' && <span className="t-xs t-muted">{t(K.docs.emergencyAbout)}</span>}
              {d.provided ? (
                <p className="t-xs" style={{ color: 'var(--color-success)' }}>{t(d.provided.how === 'printed' ? K.docs.givenPrinted : K.docs.givenDigital, { name: d.provided.byName, when: formatDateTime(d.provided.at, i18n.language) })}</p>
              ) : !d.ready ? (
                <div className="stack gap-1">
                  <p className="t-xs" style={{ color: 'var(--color-error)' }}>{t(K.docs.notReady)}</p>
                  {v.viewer !== 'customer' && <Button size="sm" variant="secondary" style={{ width: 'fit-content' }} onClick={() => s.goto(checklistPath(v.job.id))}>{t(K.docs.fix)}</Button>}
                </div>
              ) : a.provide ? (
                <div className="row gap-2 wrap">
                  <Button size="sm" disabled={s.busy} onClick={() => void s.provide(kind, 'printed').then((r) => setError(r.ok ? null : (r.code ?? 'generic')))} data-provide={`${kind}:printed`}>{t(K.docs.printed)}</Button>
                  <Button size="sm" variant="secondary" disabled={s.busy} onClick={() => void s.provide(kind, 'digital').then((r) => setError(r.ok ? null : (r.code ?? 'generic')))} data-provide={`${kind}:digital`}>{t(K.docs.digital)}</Button>
                </div>
              ) : (
                <p className="t-xs t-muted">{t(K.docs.given)}</p>
              )}
            </div>
          );
        })}
        <Problem code={error} t={t} />
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ sign-off */

function SignStep({ s, v, t }: { s: WalkState; v: WalkthroughView; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const a = v.actions;
  const staff = v.viewer !== 'customer';
  const [understood, setUnderstood] = useState(false);
  const [signer, setSigner] = useState('');
  const [signature, setSignature] = useState('');
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<ActionResult>) => {
    const r = await fn();
    setError(r.ok ? null : (r.code ?? 'generic'));
    return r.ok;
  };
  return (
    <div className="stack gap-3" data-sign>
      <Card>
        <div className="stack gap-2">
          <strong className="t-md">{t(K.sign.heading)}</strong>
          <p className="t-sm">{t(K.sign.intro)}</p>
          <p className="t-xs t-muted">{t(K.sign.distinct)}</p>
        </div>
      </Card>
      {staff && a.conduct && !v.conducted && (
        <Card>
          <div className="stack gap-2" data-conduct>
            <p className="t-sm">{t(K.sign.conductHint)}</p>
            {v.conductProblem && <p className="t-xs t-muted">• {t(K.sign.blocked[v.conductProblem as keyof typeof K.sign.blocked] ?? K.problem.generic)}</p>}
            <Button className="ds-btn--big" disabled={!!v.conductProblem || s.busy} onClick={() => void run(s.conduct)} data-conduct-go>{t(K.sign.conduct)}</Button>
          </div>
        </Card>
      )}
      {v.conducted && (
        <Card>
          <div className="stack gap-2">
            <p className="t-sm row gap-2" style={{ alignItems: 'center' }}><CheckCircle size={20} weight="fill" aria-hidden="true" color="var(--color-success)" /> {t(K.sign.conducted, { name: v.conducted.byName, when: formatDateTime(v.conducted.at, lang) })}</p>
            {v.signoffDue && !v.signoff && <p className="t-xs t-muted">{t(K.sign.due, { when: formatDateTime(v.signoffDue, lang) })}</p>}
            {v.mode !== 'in_person' && !v.signoff && <p className="t-xs t-muted">{t(K.sign.remote)}</p>}
          </div>
        </Card>
      )}
      {!v.conducted && !staff && <Card><p className="t-sm t-muted">{t(K.sign.waiting)}</p></Card>}
      {v.signoff && (
        <Card>
          <div className="stack gap-1" data-signed>
            <p className="t-sm row gap-2" style={{ alignItems: 'center' }}><CheckCircle size={20} weight="fill" aria-hidden="true" color="var(--color-success)" /> {t(v.signoff.mode === 'on_device' ? K.sign.signedDevice : K.sign.signed, { name: v.signoff.signerName, when: formatDateTime(v.signoff.at, lang), by: v.signoff.recordedByName })}</p>
            {v.signoff.note && <p className="t-xs t-muted">{v.signoff.note}</p>}
            {v.signoff.signature && <img src={v.signoff.signature} alt="" style={{ maxWidth: 240, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />}
          </div>
        </Card>
      )}
      {a.sign && (
        <Card>
          <div className="stack gap-3" data-sign-form="own">
            <Checkbox checked={understood} onChange={setUnderstood} label={<span className="t-sm">{t(K.sign.understood)}</span>} />
            <Field label={t(K.sign.note)}>{({ id }) => <TextArea id={id} rows={2} value={s.draft.note} onChange={(e) => s.setDraft({ note: e.target.value })} />}</Field>
            <Problem code={error} t={t} />
            <Button className="ds-btn--big" disabled={!understood || s.busy} onClick={async () => { if (await run(() => s.signOff({ understood, ...(s.draft.note.trim() ? { note: s.draft.note } : {}) }))) s.clearDraft(['note']); }} data-sign-go>{t(K.sign.confirm)}</Button>
          </div>
        </Card>
      )}
      {a.signOnDevice && (
        <Card>
          <div className="stack gap-3" data-sign-form="device">
            <strong className="t-sm">{t(K.sign.deviceHeading)}</strong>
            <p className="t-xs t-muted">{t(K.sign.deviceHint)}</p>
            <Field label={t(K.sign.signer)} required>{({ id }) => <Input id={id} value={signer} onChange={(e) => setSigner(e.target.value)} data-signer />}</Field>
            <div className="stack gap-1">
              <span className="t-xs t-semibold">{t(K.sign.signature)}</span>
              <SignaturePad value={signature} onChange={setSignature} clearLabel={t(K.sign.clear)} />
            </div>
            <Checkbox checked={understood} onChange={setUnderstood} label={<span className="t-sm">{t(K.sign.understood)}</span>} />
            <Problem code={error} t={t} />
            <Button className="ds-btn--big" disabled={!understood || signer.trim().length < NAME_MIN || !signature || s.busy} onClick={async () => { if (await run(() => s.signOff({ understood, signerName: signer, signature }))) { setSignature(''); setSigner(''); } }} data-sign-device-go>{t(K.sign.record)}</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ AMC */

function AmcStep({ s, v, t }: { s: WalkState; v: WalkthroughView; t: T }) {
  const [choice, setChoice] = useState<'enrol' | 'later' | 'declined' | ''>(v.amc?.choice ?? '');
  const [tier, setTier] = useState<string>(v.amc?.tier ?? '');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const ok = !!choice && (choice !== 'enrol' || !!tier);
  return (
    <Card>
      <div className="stack gap-3" data-amc>
        <strong className="t-md">{t(K.amc.heading)}</strong>
        <p className="t-sm">{t(K.amc.intro)}</p>
        {v.amc && <p className="t-sm" data-amc-saved>{t(v.amc.tier ? K.amc.savedTier : K.amc.saved, { choice: t(K.amc.choice[v.amc.choice]), tier: v.amc.tier ? t(K.amc.tier[v.amc.tier]) : '' })}</p>}
        {!v.actions.amc ? <p className="t-xs t-muted">{t(K.amc.waiting)}</p> : (
          <>
            <div className="stack gap-2" data-tiers>
              {v.amcTiers.map((x) => (
                <div key={x.tier} className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
                  <span className="stack"><strong className="t-sm">{t(K.amc.tier[x.tier])}</strong><span className="t-xs t-muted">{t(K.amc.tierLine, { hours: x.responseTimeHours })}</span></span>
                  <span className="num t-md">{formatINR(x.annualPrice)}</span>
                </div>
              ))}
            </div>
            <div className="stack gap-2" role="radiogroup" aria-label={t(K.amc.heading)}>
              {(['enrol', 'later', 'declined'] as const).map((c) => (
                <div key={c} className="stack gap-1">
                  <Chip pressed={choice === c} onClick={() => setChoice(c)}>{t(K.amc.choice[c])}</Chip>
                  {choice === c && <span className="t-xs t-muted">{t(K.amc.choiceHint[c])}</span>}
                </div>
              ))}
            </div>
            {choice === 'enrol' && (
              <div className="row gap-2 wrap" role="radiogroup" aria-label={t(K.amc.heading)}>
                {v.amcTiers.map((x) => <Chip key={x.tier} pressed={tier === x.tier} onClick={() => setTier(x.tier)}>{t(K.amc.tier[x.tier])}</Chip>)}
              </div>
            )}
            <Field label={t(K.amc.note)}>{({ id }) => <TextArea id={id} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
            <Problem code={error} t={t} />
            <Button disabled={!ok || s.busy} style={{ width: 'fit-content' }} data-save-amc onClick={async () => { const r = await s.amc({ choice: choice as 'enrol' | 'later' | 'declined', ...(choice === 'enrol' ? { tier: tier as 'basic' | 'standard' | 'comprehensive' } : {}), ...(note.trim() ? { note } : {}) }); setError(r.ok ? null : (r.code ?? 'generic')); }}>{t(K.amc.save)}</Button>
            <p className="t-xs t-muted">{t(K.amc.after)}</p>
          </>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ feedback */

function FeedbackStep({ s, v, t }: { s: WalkState; v: WalkthroughView; t: T }) {
  const [score, setScore] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  return (
    <Card>
      <div className="stack gap-3" data-feedback>
        <strong className="t-md">{t(K.feedback.heading)}</strong>
        <p className="t-sm">{t(K.feedback.intro)}</p>
        {v.feedback ? (
          <div className="stack gap-1" data-feedback-given>
            <p className="t-sm">{t(K.feedback.given, { score: v.feedback.score })}</p>
            {v.feedback.comment && <p className="t-xs t-muted">{v.feedback.comment}</p>}
            <p className="t-xs t-muted">{t(K.feedback.thanks)}</p>
            {v.negativeSignal && <Badge tone="warning">{t(K.feedback.signal)}</Badge>}
          </div>
        ) : !v.actions.feedback ? (
          <p className="t-xs t-muted">{t(K.feedback.waiting)}</p>
        ) : (
          <>
            <div className="row gap-2 wrap" role="radiogroup" aria-label={t(K.feedback.heading)}>
              {SCORES.map((n) => <Chip key={n} pressed={score === n} onClick={() => setScore(n)}>{n} · {t(K.feedback.score[String(n) as '1'])}</Chip>)}
            </div>
            <Field label={t(K.feedback.comment)}>{({ id }) => <TextArea id={id} rows={3} value={s.draft.comment} onChange={(e) => s.setDraft({ comment: e.target.value })} data-comment />}</Field>
            <Problem code={error} t={t} />
            <Button disabled={!score || s.busy} style={{ width: 'fit-content' }} data-send-feedback onClick={async () => { const r = await s.feedback({ score, ...(s.draft.comment.trim() ? { comment: s.draft.comment } : {}) }); setError(r.ok ? null : (r.code ?? 'generic')); if (r.ok) s.clearDraft(['comment']); }}>{t(K.feedback.send)}</Button>
          </>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ review */

function ReviewStep({ s, v, t }: { s: WalkState; v: WalkthroughView; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const mandatory = v.script.filter((i) => i.mandatory);
  const [error, setError] = useState<string | null>(null);
  const row = (label: string, value: string, done: boolean) => (
    <div className="row gap-2" style={{ alignItems: 'flex-start' }}>
      {done ? <CheckCircle size={20} weight="fill" aria-hidden="true" color="var(--color-success)" /> : <Circle size={20} aria-hidden="true" />}
      <div className="stack"><span className="t-xs t-muted">{label}</span><span className="t-sm">{value}</span></div>
    </div>
  );
  return (
    <div className="stack gap-3" data-review>
      <Card>
        <div className="stack gap-3">
          <strong className="t-md">{t(K.review.heading)}</strong>
          <p className="t-sm">{t(K.review.intro)}</p>
          {row(t(K.review.arranged), v.mode ? `${t(K.mode[v.mode])}${v.conductor ? ` · ${v.conductor.name}` : ''}${v.scheduledFor ? ` · ${formatDate(v.scheduledFor.date, lang)}` : ''}` : t(K.review.notYet), !!v.mode)}
          {row(t(K.review.shown), t(K.demo.progress, { done: mandatory.filter((i) => i.done).length, total: mandatory.length }), mandatory.every((i) => i.done))}
          {row(t(K.review.docs), `${v.documents.filter((d) => d.provided).length} / ${v.documents.length}`, v.documents.every((d) => d.provided))}
          {row(t(K.review.conducted), v.conducted ? `${v.conducted.byName} · ${formatDateTime(v.conducted.at, lang)}` : t(K.review.notYet), !!v.conducted)}
          {row(t(K.review.signed), v.signoff ? `${v.signoff.signerName} · ${formatDateTime(v.signoff.at, lang)}` : t(K.review.notYet), !!v.signoff)}
          {row(t(K.review.amc), v.amc ? `${t(K.amc.choice[v.amc.choice])}${v.amc.tier ? ` · ${t(K.amc.tier[v.amc.tier])}` : ''}` : t(K.review.none), !!v.amc)}
          {row(t(K.review.feedback), v.feedback ? `${v.feedback.score} / 5` : t(K.review.none), !!v.feedback)}
        </div>
      </Card>
      {v.conducted && <Button variant="secondary" style={{ width: 'fit-content' }} data-warranty-link onClick={() => s.goto(warrantyPath(v.job.id))}>{t(K.review.warranty)}</Button>}
      <Card>
        <div className="stack gap-3" data-questions>
          <strong className="t-md">{t(K.ask.heading)}</strong>
          <p className="t-sm">{t(K.ask.intro)}</p>
          {v.followUps.length === 0 && <p className="t-xs t-muted">{t(K.ask.none)}</p>}
          {v.followUps.map((q) => <Question key={q.id} q={q} s={s} v={v} t={t} lang={lang} />)}
          {v.actions.ask && (
            <div className="stack gap-2">
              <Field label={t(K.ask.label)} hint={t(K.ask.hint, { count: QUESTION_MIN })}>{({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={s.draft.question} onChange={(e) => s.setDraft({ question: e.target.value })} data-question />}</Field>
              <Problem code={error} t={t} />
              <Button disabled={s.draft.question.trim().length < QUESTION_MIN || s.busy} style={{ width: 'fit-content' }} data-send-question onClick={async () => { const r = await s.ask(s.draft.question); setError(r.ok ? null : (r.code ?? 'generic')); if (r.ok) s.clearDraft(['question']); }}>{t(K.ask.send)}</Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function Question({ q, s, v, t, lang }: { q: WalkthroughView['followUps'][number]; s: WalkState; v: WalkthroughView; t: T; lang: string }) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="stack gap-1" data-question-row={q.id} style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
      <p className="t-sm">{q.text}</p>
      <span className="t-xs t-muted">{q.byName} · {formatDateTime(q.at, lang)}</span>
      {q.answer ? <p className="t-xs" style={{ color: 'var(--color-success)' }}>{t(K.ask.answered, { name: q.answer.byName })}: {q.answer.text}</p> : <p className="t-xs t-muted">{t(K.ask.waiting)}</p>}
      {!q.answer && v.viewer === 'admin' && (
        <div className="stack gap-2">
          <TextArea aria-label={t(K.ask.answer)} rows={2} value={text} onChange={(e) => setText(e.target.value)} data-answer />
          {error && <p className="t-xs t-error" role="alert">{t(errorKey(error))}</p>}
          <Button size="sm" disabled={text.trim().length < 5 || s.busy} style={{ width: 'fit-content' }} data-send-answer onClick={async () => { const r = await s.answer(q.id, text); setError(r.ok ? null : (r.code ?? 'generic')); if (r.ok) setText(''); }}>{t(K.ask.answerGo)}</Button>
        </div>
      )}
    </div>
  );
}
