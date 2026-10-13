import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { LockKey, ShieldCheck, ShieldWarning } from '@phosphor-icons/react';
import { Button, Card, Field, Input, OtpInput, TextArea, formatDate } from '@/design-system';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { SessionCheck } from '@/data/repository';
import { DEMO_SECOND_CODE, METHODS, NOTE_MIN, RECOVERY_CODE_LENGTH, lettersOf } from './security';
import type { SecondFactorMethod } from './security';
import { SESSION_POLL_MS, readAuthSessionId, writeAuthSessionId, writeSecondFactorAt } from './sessionKeys';

/**
 * The sign-in gate (195). The one place the app enforces what the security settings say about an open session: it asks the repository how this session stands every few seconds and on
 * returning to the tab, and puts a full-screen step in front of everything when something is owed (a second code, setting the second step up, "is this you?", a recovery code) or the
 * session has been ended (by Admin, by the clock, by a password change). A session that has not been recorded (a demo session) is never gated.
 * This is screen-level enforcement in the browser; the data layer's own role checks are unchanged, and a real backend would enforce the same rules on every request.
 */
export function SecurityGate() {
  const repository = useData();
  const { t, i18n } = useTranslation();
  const { user, kind, signOut } = useSession();
  const [check, setCheck] = useState<SessionCheck | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [dismissedGrace, setDismissedGrace] = useState(false);
  const live = useRef(true);
  const retries = useRef(0);

  const refresh = useCallback(async (touch: boolean) => {
    const id = readAuthSessionId();
    if (!user || kind !== 'authenticated') { setCheck(null); return; }
    if (!id) {
      // The session is recorded a moment after sign-in: look again shortly instead of waiting for the next poll.
      if (retries.current < 12) { retries.current += 1; window.setTimeout(() => { if (live.current) void refresh(touch); }, 400); }
      setCheck(null);
      return;
    }
    retries.current = 0;
    try {
      let next = await repository.checkAuthSession(id, touch);
      if (next.status === 'unknown') {
        // The store starts fresh on a reload: take the session up again rather than treat it as ended.
        const again = await repository.resumeAuthSession(user.id, id, { deviceLabel: 'this device', platform: 'other' });
        writeAuthSessionId(again.sessionId);
        next = await repository.checkAuthSession(again.sessionId, touch);
      }
      if (live.current) setCheck(next);
    } catch {
      // A failed check never locks anyone out: the last answer stands until the next one arrives.
    }
  }, [repository, user, kind]);

  useEffect(() => {
    live.current = true;
    void refresh(true);
    const visible = (): boolean => typeof document === 'undefined' || document.visibilityState === 'visible';
    const timer = window.setInterval(() => { if (visible()) void refresh(true); }, SESSION_POLL_MS);
    const onShow = () => { if (visible()) void refresh(true); };
    document.addEventListener('visibilitychange', onShow);
    return () => { live.current = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', onShow); };
  }, [refresh]);

  if (!check || !user || kind !== 'authenticated') return null;

  const after = (next: SessionCheck): void => { setCheck(next); setEnrolling(false); };

  if (check.status !== 'ok' && check.status !== 'unknown') return <Overlay step="ended"><Ended check={check} onDone={signOut} /></Overlay>;
  if (check.step === 'locked') return <Overlay step="locked"><Locked check={check} onDone={after} onSignOut={signOut} /></Overlay>;
  if (check.step === 'second_factor') return <Overlay step="second_factor"><SecondFactor check={check} onDone={after} onSignOut={signOut} /></Overlay>;
  if (check.step === 'enrol') return <Overlay step="enrol"><Enrol check={check} dismissible={false} onDone={after} onSignOut={signOut} /></Overlay>;
  if (check.step === 'waiting_admin') return <Overlay step="waiting_admin"><Waiting check={check} onSignOut={signOut} /></Overlay>;
  if (check.step === 'place') return <Overlay step="place"><Place check={check} onDone={after} onSignOut={signOut} /></Overlay>;
  if (enrolling) return <Overlay step="enrol"><Enrol check={check} dismissible onDone={after} onClose={() => setEnrolling(false)} onSignOut={signOut} /></Overlay>;
  if (check.graceEnds && !dismissedGrace) {
    return (
      <div role="status" data-sec-grace style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-accent-primary)', padding: '8px 16px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <ShieldWarning size={18} aria-hidden="true" color="var(--color-accent-primary)" />
        <span className="t-xs t-semibold">{t('secGate.grace.line', { date: formatDate(check.graceEnds, i18n.language) })}</span>
        <Button size="sm" variant="secondary" data-act="grace-setup" onClick={() => setEnrolling(true)}>{t('secGate.grace.setup')}</Button>
        <Button size="sm" variant="ghost" onClick={() => setDismissedGrace(true)}>{t('secGate.grace.later')}</Button>
      </div>
    );
  }
  return null;
}

function Overlay({ step, children }: { step: string; children: ReactNode }) {
  const { t } = useTranslation();
  // Rendered on the page itself: inside the shell's sticky top area it would sit beneath the tab bar.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={t('secGate.label')} data-sec-gate={step} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'var(--color-bg)', overflowY: 'auto', padding: '24px 16px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div style={{ width: '100%', maxWidth: 480, minWidth: 0 }} className="stack gap-4">{children}</div>
    </div>,
    document.body,
  );
}

const errText = (t: (k: string, o?: Record<string, unknown>) => string, code: string): string => t(`secGate.error.${code}`, { defaultValue: t('secGate.error.generic') });
const reasonOf = (e: unknown): string => (e instanceof Error ? e.message : 'generic');

function Heading({ icon, title, body }: { icon: ReactNode; title: string; body?: string }) {
  return (
    <div className="stack gap-2">
      <span aria-hidden="true">{icon}</span>
      <h1 className="t-lg t-semibold" style={{ fontFamily: 'var(--font-display)' }}>{title}</h1>
      {body && <p className="t-sm">{body}</p>}
    </div>
  );
}

function Ended({ check, onDone }: { check: SessionCheck; onDone: () => void }) {
  const { t } = useTranslation();
  const end = check.end;
  const key = check.status === 'revoked' && end?.by && end.by !== 'system' ? 'revoked' : check.status === 'expired' ? `expired.${end?.reason === 'too_long' ? 'too_long' : 'idle'}` : end?.reason === 'account_suspended' ? 'suspended' : check.status === 'revoked' ? 'revokedSystem' : 'signedOut';
  return (
    <>
      <Heading icon={<LockKey size={32} color="var(--color-accent-primary)" />} title={t('secGate.ended.title')} />
      <p className="t-sm" data-ended={check.status}>{t(`secGate.ended.${key}`, { by: end?.by ?? '', reason: end?.reason ?? '' })}</p>
      <Button data-act="ended-signin" onClick={onDone}>{t('secGate.ended.again')}</Button>
    </>
  );
}

function SecondFactor({ check, onDone, onSignOut }: { check: SessionCheck; onDone: (c: SessionCheck) => void; onSignOut: () => void }) {
  const repository = useData();
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const go = async (value: string): Promise<void> => {
    const id = readAuthSessionId();
    if (!id || busy) return;
    setBusy(true); setProblem(null);
    try { const next = await repository.passSecondFactor(id, value); writeSecondFactorAt(new Date().toISOString()); onDone(next); } catch (e) { setProblem(reasonOf(e)); setCode(''); if (reasonOf(e) === 'session_ended') onDone({ ...check, status: 'revoked', end: { reason: 'too many wrong codes', by: 'system', at: new Date().toISOString() } }); } finally { setBusy(false); }
  };
  return (
    <>
      <Heading icon={<ShieldCheck size={32} color="var(--color-accent-primary)" />} title={t('secGate.second.title')} body={t('secGate.second.body', { method: t(`secGate.second.methodName.${check.method ?? 'authenticator'}`) })} />
      <Card>
        <div className="stack gap-3">
          <OtpInput value={code} onChange={(v) => { setCode(v); if (v.length === 6) void go(v); }} label={t('secGate.second.label')} invalid={!!problem} autoFocus disabled={busy} />
          {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
          <p className="t-xs t-muted" data-demo-code>{t('secGate.demoNote', { code: DEMO_SECOND_CODE })}</p>
          <Button data-act="second-go" disabled={code.length !== 6} loading={busy} onClick={() => void go(code)}>{t('secGate.second.go')}</Button>
        </div>
      </Card>
      <Button variant="ghost" data-act="gate-signout" onClick={onSignOut}>{t('secGate.signOut')}</Button>
    </>
  );
}

function Enrol({ check, dismissible, onDone, onClose, onSignOut }: { check: SessionCheck; dismissible: boolean; onDone: (c: SessionCheck) => void; onClose?: () => void; onSignOut: () => void }) {
  const repository = useData();
  const { t, i18n } = useTranslation();
  const [method, setMethod] = useState<SecondFactorMethod>('authenticator');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [why, setWhy] = useState('');
  const submit = async (): Promise<void> => {
    const id = readAuthSessionId();
    if (!id) return;
    setBusy(true); setProblem(null);
    try { const next = await repository.enrolTwoFactor(id, { method, secondPhone: method === 'second_phone' ? phone : undefined, code }); writeSecondFactorAt(new Date().toISOString()); onDone(next); } catch (e) { setProblem(reasonOf(e)); } finally { setBusy(false); }
  };
  const ask = async (): Promise<void> => {
    const id = readAuthSessionId();
    if (!id) return;
    setBusy(true); setProblem(null);
    try { const next = await repository.requestTwoFactorException(id, why); onDone(next); } catch (e) { setProblem(reasonOf(e)); } finally { setBusy(false); }
  };
  return (
    <>
      <Heading icon={<ShieldCheck size={32} color="var(--color-accent-primary)" />} title={t('secGate.enrol.title')} body={t('secGate.enrol.body')} />
      {check.graceEnds && <p className="t-sm" data-grace-ends>{t('secGate.enrol.until', { date: formatDate(check.graceEnds, i18n.language) })}</p>}
      {check.exception === 'declined' && <p className="t-sm t-error" role="status" data-declined>{t('secGate.enrol.declined')}</p>}
      {!asking ? (
        <Card>
          <div className="stack gap-3">
            <div className="stack gap-2" role="radiogroup" aria-label={t('secGate.enrol.method')}>
              {METHODS.map((m) => (
                <label key={m} className="row gap-2" style={{ alignItems: 'flex-start', minHeight: 48 }}>
                  <input type="radio" name="sec-method" checked={method === m} onChange={() => setMethod(m)} data-method={m} />
                  <span className="stack gap-0"><span className="t-sm t-semibold">{t(`secGate.method.${m}.title`)}</span><span className="t-xs t-muted">{t(`secGate.method.${m}.hint`)}</span></span>
                </label>
              ))}
            </div>
            {method === 'second_phone' && <Field label={t('secGate.enrol.phone')} hint={t('secGate.enrol.phoneHint')}>{(p) => <Input id={p.id} inputMode="tel" value={phone} data-f="second-phone" onChange={(e) => setPhone(e.target.value)} />}</Field>}
            <Field label={t('secGate.enrol.code')}>{() => <OtpInput value={code} onChange={setCode} label={t('secGate.enrol.code')} />}</Field>
            <p className="t-xs t-muted" data-demo-code>{t('secGate.demoNote', { code: DEMO_SECOND_CODE })}</p>
            {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
            <Button data-act="enrol-go" disabled={code.length !== 6 || (method === 'second_phone' && phone.trim().length < 10)} loading={busy} onClick={() => void submit()}>{t('secGate.enrol.go')}</Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="stack gap-3" data-exception-form>
            <p className="t-sm">{t('secGate.exception.body')}</p>
            <Field label={t('secGate.exception.why')} hint={`${lettersOf(why)}/${NOTE_MIN}`}>{(p) => <TextArea id={p.id} rows={3} value={why} data-f="exception-why" onChange={(e) => setWhy(e.target.value)} />}</Field>
            {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
            <div className="row gap-2"><Button variant="ghost" onClick={() => { setAsking(false); setProblem(null); }}>{t('secGate.exception.back')}</Button><Button data-act="exception-send" disabled={lettersOf(why) < NOTE_MIN} loading={busy} onClick={() => void ask()}>{t('secGate.exception.send')}</Button></div>
          </div>
        </Card>
      )}
      {!asking && check.exception !== 'requested' && <Button variant="ghost" data-act="exception-open" onClick={() => { setAsking(true); setProblem(null); }}>{t('secGate.exception.open')}</Button>}
      {dismissible ? <Button variant="ghost" data-act="enrol-close" onClick={onClose}>{t('secGate.enrol.close')}</Button> : <Button variant="ghost" data-act="gate-signout" onClick={onSignOut}>{t('secGate.signOut')}</Button>}
    </>
  );
}

function Waiting({ check, onSignOut }: { check: SessionCheck; onSignOut: () => void }) {
  const { t } = useTranslation();
  return (
    <>
      <Heading icon={<ShieldWarning size={32} color="var(--color-accent-primary)" />} title={t('secGate.waiting.title')} body={check.place ? t('secGate.waiting.place', { city: check.place.city }) : t('secGate.waiting.body')} />
      <p className="t-xs t-muted">{t('secGate.waiting.note')}</p>
      <Button variant="ghost" data-act="gate-signout" onClick={onSignOut}>{t('secGate.signOut')}</Button>
    </>
  );
}

function Place({ check, onDone, onSignOut }: { check: SessionCheck; onDone: (c: SessionCheck) => void; onSignOut: () => void }) {
  const repository = useData();
  const { t } = useTranslation();
  const [busy, setBusy] = useState<'me' | 'not_me' | null>(null);
  const [confirming, setConfirming] = useState(false);
  const answer = async (a: 'me' | 'not_me'): Promise<void> => {
    const id = readAuthSessionId();
    if (!id) return;
    setBusy(a);
    try { onDone(await repository.answerPlaceCheck(id, a)); } catch { /* the next check shows where things stand */ } finally { setBusy(null); }
  };
  return (
    <>
      <Heading icon={<ShieldWarning size={32} color="var(--color-accent-primary)" />} title={t('secGate.place.title')} body={t('secGate.place.body', { city: check.place?.city ?? '' })} />
      {!confirming ? (
        <div className="stack gap-2">
          <Button data-act="place-me" loading={busy === 'me'} onClick={() => void answer('me')}>{t('secGate.place.me')}</Button>
          <Button variant="secondary" data-act="place-not-me" onClick={() => setConfirming(true)} style={{ color: 'var(--color-error)' }}>{t('secGate.place.notMe')}</Button>
        </div>
      ) : (
        <Card>
          <div className="stack gap-3" data-place-confirm>
            <p className="t-sm">{t('secGate.place.notMeBody')}</p>
            <div className="row gap-2"><Button variant="ghost" onClick={() => setConfirming(false)}>{t('secGate.place.back')}</Button><Button data-act="place-lock" loading={busy === 'not_me'} onClick={() => void answer('not_me')} style={{ background: 'var(--color-error)', color: 'var(--color-surface)' }}>{t('secGate.place.lock')}</Button></div>
          </div>
        </Card>
      )}
      <Button variant="ghost" data-act="gate-signout" onClick={onSignOut}>{t('secGate.signOut')}</Button>
    </>
  );
}

function Locked({ check, onDone, onSignOut }: { check: SessionCheck; onDone: (c: SessionCheck) => void; onSignOut: () => void }) {
  const repository = useData();
  const { t, i18n } = useTranslation();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const lock = check.lock;
  const go = async (): Promise<void> => {
    const id = readAuthSessionId();
    if (!id) return;
    setBusy(true); setProblem(null);
    try { onDone(await repository.redeemRecoveryCode(id, code)); setCode(''); } catch (e) { setProblem(reasonOf(e)); setCode(''); } finally { setBusy(false); }
  };
  return (
    <>
      <Heading icon={<LockKey size={32} color="var(--color-error)" />} title={t('secGate.locked.title')} body={t('secGate.locked.body', { reason: t(`secGate.locked.reason.${lock?.reason ?? 'admin'}`) })} />
      <Card>
        <div className="stack gap-3">
          {lock?.recovery === 'issued' ? (
            <>
              <p className="t-sm" data-recovery="issued">{t('secGate.locked.have')}</p>
              {lock.expiresAt && <p className="t-xs t-muted">{t('secGate.locked.expires', { date: formatDate(lock.expiresAt, i18n.language) })}</p>}
              <Field label={t('secGate.locked.code')}>{(p) => <Input id={p.id} inputMode="numeric" autoComplete="one-time-code" maxLength={RECOVERY_CODE_LENGTH} value={code} data-f="recovery-code" onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, RECOVERY_CODE_LENGTH))} style={{ letterSpacing: '0.3em', fontFamily: 'var(--font-mono)', textAlign: 'center' }} />}</Field>
              {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
              <Button data-act="recover-go" disabled={code.length !== RECOVERY_CODE_LENGTH} loading={busy} onClick={() => void go()}>{t('secGate.locked.go')}</Button>
            </>
          ) : (
            <p className="t-sm" data-recovery="none">{t('secGate.locked.none')}</p>
          )}
        </div>
      </Card>
      <p className="t-xs t-muted">{t('secGate.locked.why')}</p>
      <Button variant="ghost" data-act="gate-signout" onClick={onSignOut}>{t('secGate.signOut')}</Button>
    </>
  );
}
