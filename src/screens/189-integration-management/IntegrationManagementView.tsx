import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowsClockwise, Check, Copy, Flask, ShieldCheck, ShieldWarning, WarningOctagon } from '@phosphor-icons/react';
import { Badge, Button, Card, Checkbox, Chip, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Sheet, TextArea, formatDate, formatDateTime, useToast } from '@/design-system';
import type { IntegrationManagementView, IntegrationSetupView } from '@/data/repository';
import { ROTATION_MS, SECRET_MIN, credentialProblem, REASON_MIN } from '@/features/integrations/management';
import { lettersOf } from '@/features/override/rules';
import { INTEGRATION_MANAGEMENT_KEYS as K } from './integration-management.types';
import { useIntegrationManagement } from './useIntegrationManagement';
import type { IntegrationState } from './useIntegrationManagement';

type T = ReturnType<typeof useTranslation>['t'];
const STATUS_TONE: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = { operational: 'success', degraded: 'warning', down: 'error', rotating: 'neutral', not_configured: 'neutral' };
const errText = (t: T, code: string) => t(`integrationManagement.error.${code}`, { defaultValue: t(K.error.generic) });
const name = (t: T, id: string): string => t(`integrationManagement.integration.${id}`);
const ago = (iso: string, now: number): string => { const m = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000)); return m < 1 ? '<1 min' : m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`; };
const timeOf = (iso: string, lang: string): string => new Date(iso).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="stack gap-2">
      <h2 className="t-md t-semibold" style={{ borderTop: '1px solid var(--color-accent-primary)', paddingTop: 12 }}>{title}</h2>
      {hint && <p className="t-xs t-muted">{hint}</p>}
      {children}
    </section>
  );
}

/** Screen 189 — API & Integration Management. Settings layout: each connection's current value on show (status, test or live, last success, which credential and how old), a hard-to-miss test-mode marker, a rotation that reads as "rotating" rather than a failure, a confirmed change of mode and a check that demo traffic is isolated. */
export function IntegrationManagementScreen() {
  const { t, i18n } = useTranslation();
  const s = useIntegrationManagement();
  const v = s.view;
  const head = <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh onClick={() => void s.refresh()}>{t(K.refresh)}</Button>} />;
  if (s.load === 'loading' && !v) return <Screen width="default">{head}<LoadingState label={t(K.loading)} variant="list" rows={5} /></Screen>;
  if (s.load === 'error' && !v) return <Screen width="default">{head}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.refresh()} /></Screen>;
  if (!v) return null;
  const now = Date.parse(v.at);
  const testCount = v.integrations.filter((i) => i.mode === 'sandbox').length;
  return (
    <Screen width="default">
      {head}
      <div className="stack gap-4">
        {s.offline && <p className="t-xs t-muted" role="status" data-offline>{t(K.offline)}</p>}
        {v.sandboxInProduction.length > 0 && (
          <div role="alert" data-sandbox-warning style={{ border: '2px solid var(--color-error)', borderRadius: 16, padding: 16, background: 'var(--color-surface)' }}>
            <p className="t-sm t-semibold row gap-2" style={{ alignItems: 'center', color: 'var(--color-error)' }}><WarningOctagon size={20} aria-hidden="true" />{t(K.banner.title)}</p>
            <p className="t-xs">{t(K.banner.body, { names: v.sandboxInProduction.map((id) => name(t, id)).join(', ') })}</p>
          </div>
        )}
        <Environment v={v} s={s} t={t} testCount={testCount} />
        <Section title={t(K.integrations.title)}>
          <div className="grid-auto" data-integrations>{v.integrations.map((i) => <Integration key={i.id} i={i} v={v} s={s} t={t} now={now} lang={i18n.language} />)}</div>
        </Section>
        <Isolation v={v} s={s} t={t} lang={i18n.language} />
        <History v={v} t={t} lang={i18n.language} />
        <p className="t-xs t-muted" data-placeholder-note>{t(K.note.placeholders)}</p>
      </div>
      <Detail v={v} s={s} t={t} now={now} lang={i18n.language} />
    </Screen>
  );
}

function Environment({ v, s, t, testCount }: { v: IntegrationManagementView; s: IntegrationState; t: T; testCount: number }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [ack, setAck] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const to = v.environment === 'demo' ? 'production' : 'demo';
  const go = async () => { setProblem(null); const r = await s.setEnvironment(to, reason, ack); if (r.ok) { setOpen(false); setReason(''); setAck(false); toast.push(t(K.mode.done)); } else setProblem(r.problem); };
  return (
    <Card>
      <div className="stack gap-2" data-environment={v.environment}>
        <span className="t-xs t-muted">{t(K.env.title)}</span>
        <span className="t-sm t-semibold">{v.environment === 'demo' ? t(K.env.demo) : t(K.env.production)}</span>
        <span className="t-xs" data-test-count>{t(K.env.testCount, { count: testCount, total: v.integrations.length })}</span>
        <div><Button size="sm" variant="secondary" data-act="env" onClick={() => setOpen(true)}>{to === 'production' ? t(K.env.toProduction) : t(K.env.toDemo)}</Button></div>
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title={t(K.env.switch)} closeLabel={t(K.close)}>
        <div className="stack gap-3" data-env-sheet>
          <p className="t-sm" style={{ color: to === 'production' ? 'var(--color-error)' : undefined }}>{to === 'production' ? t(K.env.warnProduction) : t(K.env.warnDemo)}</p>
          <Field label={t(K.mode.reason)} hint={`${lettersOf(reason)}/${REASON_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={reason} data-f="env-reason" onChange={(e) => setReason(e.target.value)} />}</Field>
          <Checkbox checked={ack} onChange={setAck} label={t(K.mode.understand)} />
          {problem && <p className="t-sm t-error" role="alert">{errText(t, problem)}</p>}
          <Button data-act="env-apply" disabled={!ack || lettersOf(reason) < REASON_MIN} loading={s.busy} onClick={() => void go()} style={to === 'production' ? { color: 'var(--color-error)' } : undefined}>{to === 'production' ? t(K.env.toProduction) : t(K.env.toDemo)}</Button>
        </div>
      </Sheet>
    </Card>
  );
}

function Integration({ i, v, s, t, now, lang }: { i: IntegrationSetupView; v: IntegrationManagementView; s: IntegrationState; t: T; now: number; lang: string }) {
  const nav = useNavigate();
  const toast = useToast();
  const active = i.slots[i.mode];
  const sandbox = i.mode === 'sandbox';
  return (
    <Card>
      <div className="stack gap-2" data-integration={i.id} data-status={i.status} data-mode={i.mode}>
        <div className="row between" style={{ alignItems: 'center', gap: 8 }}>
          <span className="t-sm t-semibold">{name(t, i.id)}</span>
          <Badge tone={STATUS_TONE[i.status]}>{t(`integrationManagement.status.${i.status}`)}</Badge>
        </div>
        <span className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          {sandbox ? <span data-test-mode><Badge tone="warning"><Flask size={12} /> {t(K.mode.sandbox)}</Badge></span> : <Badge tone="success">{t(K.mode.live)}</Badge>}
          <span className="t-xs t-muted">{i.lastSuccessAt ? t(K.card.lastSuccess, { ago: ago(i.lastSuccessAt, now) }) : t(K.card.noSuccess)}</span>
        </span>
        {i.status === 'degraded' && <p className="t-xs" data-degraded style={{ color: 'var(--color-warning)' }}>{t(K.card.degradedNote)}</p>}
        <div className="stack gap-0" data-credential>
          <span className="t-xs t-muted">{t(K.card.credential)} · {t(i.mode === 'sandbox' ? K.slot.sandbox : K.slot.live)}</span>
          {active ? (
            <>
              <span className="t-sm" style={{ fontFamily: 'var(--font-mono)' }} data-masked>{active.keyId} · {active.masked}</span>
              <span className="t-xs" style={i.dueForRotation ? { color: 'var(--color-warning)' } : undefined}>{t(K.card.rotated, { days: i.ageDays ?? 0 })}{i.dueForRotation ? ` · ${t(K.card.due)}` : ''}</span>
            </>
          ) : <span className="t-xs t-muted">{t(K.card.noCredential)}</span>}
        </div>
        {active?.rotation && <p className="t-xs" role="status" data-rotating>{t(K.card.rotatingNote, { time: timeOf(active.rotation.endsAt, lang) })}</p>}
        <div className="row gap-2 wrap">
          {i.probed ? <Button size="sm" variant="secondary" data-act={`test-${i.id}`} loading={s.busy} onClick={async () => { const r = await s.test(i.id); if (r.ok) toast.push(t(K.card.tested)); }}>{t(K.card.test)}</Button> : <span className="t-xs t-muted">{t(K.card.derived)}</span>}
          <Button size="sm" variant="secondary" data-act={`open-${i.id}`} onClick={() => s.open(i.id)}>{t(K.card.rotate)}</Button>
        </div>
        <div className="row gap-2 wrap">
          <Button size="sm" variant="ghost" onClick={() => nav(`/system-health?integration=${i.id}`)}>{t(K.card.healthLink)} <ArrowRight size={14} /></Button>
        </div>
      </div>
    </Card>
  );
}

function Detail({ v, s, t, now, lang }: { v: IntegrationManagementView; s: IntegrationState; t: T; now: number; lang: string }) {
  const i = v.integrations.find((x) => x.id === s.openId);
  const toast = useToast();
  const [slot, setSlot] = useState<'sandbox' | 'live'>('sandbox');
  const [keyId, setKeyId] = useState('');
  const [secret, setSecret] = useState('');
  const [reason, setReason] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [mode, setMode] = useState<null | 'sandbox' | 'live'>(null);
  const [modeReason, setModeReason] = useState('');
  const [modeAck, setModeAck] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  useEffect(() => { setSlot(i?.mode ?? 'sandbox'); setKeyId(''); setSecret(''); setReason(''); setProblem(null); setMode(null); setModeReason(''); setModeAck(false); setCancelling(false); setCancelReason(''); }, [s.openId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!i) return <Sheet open={false} onClose={() => s.open(null)} title="" closeLabel={t(K.close)}>{null}</Sheet>;
  const chosen = i.slots[slot];
  const secretIssue = secret ? credentialProblem({ secret, keyId, current: null }) : null;
  const secretOk = !!secret && !secretIssue;
  const canRotate = secretOk && lettersOf(reason) >= REASON_MIN && !chosen?.rotation;
  const rotate = async () => { setProblem(null); const r = await s.rotate(i.id, { slot, keyId, secret, reason }); setSecret(''); if (r.ok) { setKeyId(''); setReason(''); toast.push(t(K.rotate.done)); } else setProblem(r.problem); };
  const activeRotation = i.slots.sandbox?.rotation ? 'sandbox' : i.slots.live?.rotation ? 'live' : null;
  const applyMode = async () => { if (!mode) return; setProblem(null); const r = await s.setMode(i.id, mode, modeReason, modeAck); if (r.ok) { setMode(null); setModeReason(''); setModeAck(false); toast.push(t(K.mode.done)); } else setProblem(r.problem); };
  const cancel = async () => { if (!activeRotation) return; setProblem(null); const r = await s.cancelRotation(i.id, activeRotation, cancelReason); if (r.ok) { setCancelling(false); setCancelReason(''); } else setProblem(r.problem); };
  return (
    <Sheet open onClose={() => s.open(null)} title={name(t, i.id)} closeLabel={t(K.close)}>
      <div className="stack gap-4" data-detail={i.id}>
        <Section title={t(K.card.slots)} hint={t(K.slot.demoNote)}>
          {(['sandbox', 'live'] as const).map((sl) => {
            const c = i.slots[sl];
            return (
              <div key={sl} className="row between" data-slot={sl} style={{ alignItems: 'center', gap: 8 }}>
                <span className="stack gap-0"><span className="t-sm t-semibold">{t(sl === 'sandbox' ? K.slot.sandbox : K.slot.live)}{i.mode === sl ? ` · ${t(K.slot.inUse)}` : ''}</span><span className="t-xs" style={{ fontFamily: 'var(--font-mono)' }}>{c ? `${c.keyId} · ${c.masked}` : t(K.slot.none)}</span>{c && <span className="t-xs t-muted">{t(K.card.rotated, { days: Math.max(0, Math.floor((now - Date.parse(c.rotatedAt)) / 86_400_000)) })}</span>}</span>
                <Chip pressed={slot === sl} onClick={() => setSlot(sl)}>{c ? t(K.card.rotate) : t(K.slot.add)}</Chip>
              </div>
            );
          })}
        </Section>
        <Section title={t(K.rotate.title, { name: name(t, i.id) })}>
          {chosen?.rotation ? (
            <div className="stack gap-2" data-rotation-active>
              <p className="t-sm" role="status">{t(K.card.rotatingNote, { time: timeOf(chosen.rotation.endsAt, lang) })}</p>
              {!cancelling ? <div><Button size="sm" variant="secondary" data-act="cancel-rotation" onClick={() => setCancelling(true)}>{t(K.card.cancelRotation)}</Button></div> : (
                <div className="stack gap-2" data-cancel>
                  <p className="t-xs">{t(K.rotate.cancelBody)}</p>
                  <Field label={t(K.rotate.cancelReason)}>{(p) => <TextArea id={p.id} rows={2} value={cancelReason} data-f="cancel-reason" onChange={(e) => setCancelReason(e.target.value)} />}</Field>
                  <Button size="sm" data-act="cancel-do" disabled={lettersOf(cancelReason) < REASON_MIN} loading={s.busy} onClick={() => void cancel()}>{t(K.rotate.cancelDo)}</Button>
                </div>
              )}
            </div>
          ) : (
            <div className="stack gap-3" data-rotate-form>
              <Field label={t(K.rotate.keyId)}>{(p) => <Input id={p.id} value={keyId} data-f="keyid" autoComplete="off" onChange={(e) => setKeyId(e.target.value)} />}</Field>
              <Field label={t(K.rotate.secret)} hint={t(K.rotate.secretHint)} error={secretIssue ? errText(t, secretIssue) : undefined}>{(p) => <Input id={p.id} type="password" value={secret} data-f="secret" autoComplete="new-password" spellCheck={false} invalid={!!secretIssue} onChange={(e) => setSecret(e.target.value)} />}</Field>
              {secretOk && <p className="t-xs row gap-1" data-secret-ok style={{ alignItems: 'center', color: 'var(--color-success)' }}><Check size={14} aria-hidden="true" />{t(K.rotate.valid)} ({secret.length}/{SECRET_MIN}+)</p>}
              <Field label={t(K.rotate.reason)} hint={`${lettersOf(reason)}/${REASON_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={reason} data-f="rotate-reason" onChange={(e) => setReason(e.target.value)} />}</Field>
              <p className="t-xs t-muted">{chosen ? t(K.rotate.window, { minutes: Math.round(ROTATION_MS / 60_000) }) : t(K.rotate.first)}</p>
              {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
              <Button data-act="rotate" disabled={!canRotate} loading={s.busy} onClick={() => void rotate()}>{t(K.rotate.save)}</Button>
            </div>
          )}
        </Section>
        <Section title={t(K.card.switchMode)}>
          <p className="t-xs">{i.mode === 'sandbox' ? t(K.mode.sandboxName) : t(K.mode.liveName)}</p>
          {mode === null ? <div><Button size="sm" variant="secondary" data-act="mode" onClick={() => setMode(i.mode === 'sandbox' ? 'live' : 'sandbox')}>{i.mode === 'sandbox' ? t(K.mode.toLive) : t(K.mode.toSandbox)}</Button></div> : (
            <div className="stack gap-2" data-mode-form>
              <p className="t-sm" style={{ color: mode === 'sandbox' ? 'var(--color-error)' : 'var(--color-warning)' }}>{mode === 'live' ? t(K.mode.warnLive) : t(K.mode.warnSandbox)}</p>
              <Field label={t(K.mode.reason)} hint={`${lettersOf(modeReason)}/${REASON_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={modeReason} data-f="mode-reason" onChange={(e) => setModeReason(e.target.value)} />}</Field>
              <Checkbox checked={modeAck} onChange={setModeAck} label={t(K.mode.understand)} />
              {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
              <div className="row gap-2"><Button variant="ghost" onClick={() => setMode(null)}>{t(K.close)}</Button><Button className="grow" data-act="mode-apply" disabled={!modeAck || lettersOf(modeReason) < REASON_MIN} loading={s.busy} onClick={() => void applyMode()}>{t(K.mode.apply)}</Button></div>
            </div>
          )}
        </Section>
        <div className="stack gap-1" data-webhook>
          <span className="t-xs t-muted">{t(K.card.webhook)}</span>
          <span className="t-xs" style={{ fontFamily: 'var(--font-mono)', overflowWrap: 'anywhere' }}>{i.webhookUrl}</span>
          <div><Button size="sm" variant="ghost" onClick={async () => { try { await navigator.clipboard.writeText(i.webhookUrl); toast.push(t(K.card.copied)); } catch { toast.push(i.webhookUrl); } }}><Copy size={14} /> {t(K.card.copy)}</Button></div>
        </div>
      </div>
    </Sheet>
  );
}

function Isolation({ v, s, t, lang }: { v: IntegrationManagementView; s: IntegrationState; t: T; lang: string }) {
  const c = v.isolation;
  return (
    <Section title={t(K.isolation.title)} hint={t(K.isolation.body)}>
      <Card>
        <div className="stack gap-2" data-isolation={c ? (c.ok ? 'ok' : 'fail') : 'unchecked'}>
          {c && <span className="t-sm t-semibold row gap-2" style={{ alignItems: 'center', color: c.ok ? 'var(--color-success)' : 'var(--color-error)' }}>{c.ok ? <ShieldCheck size={18} aria-hidden="true" /> : <ShieldWarning size={18} aria-hidden="true" />}{c.ok ? t(K.isolation.ok) : t(K.isolation.fail)}</span>}
          {c && <span className="t-xs t-muted">{t(K.isolation.checked, { date: formatDateTime(c.at, lang) })}</span>}
          {c && <ul className="stack gap-1" style={{ margin: 0, paddingInlineStart: 18 }}>{c.rows.map((r) => <li key={r.id} className="t-xs" data-iso-row={r.id}>{name(t, r.id)}: {t(K.isolation.row, { demo: `${r.demoMode} (${r.demoKeyId ?? '—'})`, prod: `${r.productionMode} (${r.productionKeyId ?? '—'})` })}</li>)}</ul>}
          <div><Button size="sm" variant="secondary" data-act="verify" loading={s.busy} onClick={() => void s.verifyIsolation()}>{t(K.isolation.verify)}</Button></div>
        </div>
      </Card>
    </Section>
  );
}

function History({ v, t, lang }: { v: IntegrationManagementView; t: T; lang: string }) {
  return (
    <Section title={t(K.history.title)}>
      {v.changes.length === 0 ? <p className="t-xs t-muted">{t(K.history.empty)}</p> : (
        <div className="stack gap-1" data-history>{v.changes.map((c) => <p key={c.id} className="t-xs">{t(K.history.line, { date: formatDate(c.at, lang), by: c.byName, summary: `${c.integrationId === 'app' ? '' : `${name(t, c.integrationId)}: `}${c.summary}${c.reason ? ` — ${c.reason}` : ''}` })}</p>)}</div>
      )}
    </Section>
  );
}
