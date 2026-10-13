import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, Copy, Gift, PaperPlaneTilt, ShareNetwork, WhatsappLogo } from '@phosphor-icons/react';
import { ActionBar, AscensionLine, Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Sheet, TextArea, formatDate, formatINR, useToast } from '@/design-system';
import type { AscensionStep } from '@/design-system';
import type { ReferralDeskView, ReferralRowView, ReferralStatus } from '@/data/repository';
import { PHONE_DIGITS, REFERRAL_KEYS as K, whatsappShare } from './referral-program.types';
import { useReferralLanding, useReferrals } from './useReferrals';
import type { FormDraft, LandingState, ReferralsState } from './useReferrals';

type T = ReturnType<typeof useTranslation>['t'];
const LANGS: { id: 'en' | 'hi' | 'mr'; label: string }[] = [{ id: 'en', label: 'English' }, { id: 'hi', label: 'हिन्दी' }, { id: 'mr', label: 'मराठी' }];
const TONE: Record<ReferralStatus, 'success' | 'warning' | 'neutral' | 'accent'> = { invited: 'accent', surveying: 'accent', surveyed: 'accent', converted: 'success', waiting: 'warning', closed: 'neutral', known: 'neutral' };
const ORDER: ReferralStatus[] = ['invited', 'surveying', 'surveyed', 'converted'];
const digitsOf = (s: string): string => s.replace(/\D/g, '');
const lettersOf = (s: string): number => s.replace(/[^\p{L}]/gu, '').length;
const formOk = (d: FormDraft): boolean => lettersOf(d.name) >= 2 && digitsOf(d.phone).length >= PHONE_DIGITS && d.consent;
const problemText = (t: T, code: string) => t(`referral.problem.${code}`, { defaultValue: t(K.problem.generic) });

/** Screen 179 — Referral Program. A personal code and link, plain terms, every referral and where it stands (read from the lead it created), and the reward as it moves through the same payout steps as every other payment. */
export function ReferralScreen() {
  const { t, i18n } = useTranslation();
  const s = useReferrals();
  const d = s.desk;
  const head = (extra?: ReactNode) => (
    <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<span className="row gap-2">{extra}<Button size="sm" variant="ghost" data-refresh onClick={() => void s.refresh()} aria-label={t(K.refresh)}><ArrowsClockwise size={18} /></Button></span>} />
  );
  if (s.load === 'loading' && !d) return <Screen width="narrow">{head()}<LoadingState label={t(K.loading)} variant="cards" rows={3} /></Screen>;
  if (s.load === 'error' && !d) return <Screen width="narrow">{head()}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /></Screen>;
  if (!d) return null;
  return (
    <Screen width="narrow">
      {head()}
      <div className="stack gap-3 pb-action-bar">
        {s.offline && <p className="t-xs t-muted" role="status" data-offline>{t(K.error.body)}</p>}
        <Hero d={d} link={s.link} t={t} />
        <Stats d={d} t={t} />
        <Earned d={d} t={t} />
        <Terms d={d} t={t} lang={i18n.language} />
        <List d={d} s={s} t={t} lang={i18n.language} />
        <p className="t-xs t-muted" data-placeholder-note>{t(K.notice.placeholders)}</p>
      </div>
      <ActionBar>
        <Button className="grow" block data-act="invite" onClick={() => s.openInvite(true)}><PaperPlaneTilt size={18} /> {t(K.invite.open)}</Button>
      </ActionBar>
      <Detail s={s} t={t} lang={i18n.language} />
      <Invite s={s} t={t} />
    </Screen>
  );
}

function Hero({ d, link, t }: { d: ReferralDeskView; link: string; t: T }) {
  const toast = useToast();
  const message = t(K.share.message, { link });
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const copy = async () => { try { await navigator.clipboard.writeText(link); toast.push(t(K.share.copied)); } catch { toast.push(link); } };
  const share = async () => { try { await navigator.share({ title: t(K.share.pageHeading), text: message, url: link }); } catch { /* cancelled */ } };
  return (
    <Card>
      <div className="stack gap-3" data-hero>
        <span className="row gap-2" style={{ alignItems: 'center' }}><Gift size={22} aria-hidden="true" /><span className="t-sm t-semibold">{t(K.hero.reward, { amount: formatINR(d.terms.amount) })}</span></span>
        <div className="stack gap-1">
          <span className="t-xs t-muted">{t(K.hero.codeLabel)}</span>
          <span className="t-lg t-semibold" data-code style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>{d.code}</span>
        </div>
        <div className="stack gap-1">
          <span className="t-xs t-muted">{t(K.hero.linkLabel)}</span>
          <span className="t-sm" data-link style={{ wordBreak: 'break-all' }}>{link}</span>
        </div>
        <div className="row gap-2 wrap">
          <a className="ds-btn ds-btn--primary" data-act="whatsapp" href={whatsappShare(message)} target="_blank" rel="noopener noreferrer"><WhatsappLogo size={18} /> {t(K.share.whatsapp)}</a>
          <Button variant="secondary" data-act="copy" onClick={() => void copy()}><Copy size={18} /> {t(K.share.copy)}</Button>
          {canShare && <Button variant="ghost" data-act="share" onClick={() => void share()}><ShareNetwork size={18} /> {t(K.share.more)}</Button>}
        </div>
      </div>
    </Card>
  );
}

function Stats({ d, t }: { d: ReferralDeskView; t: T }) {
  const items: [string, number, string][] = [[K.stats.sent, d.totals.sent, 'sent'], [K.stats.surveyed, d.totals.surveyed, 'surveyed'], [K.stats.converted, d.totals.converted, 'converted'], [K.stats.waiting, d.totals.waiting, 'waiting']];
  return (
    <div className="grid-auto" data-stats style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
      {items.map(([label, n, id]) => <Card key={id}><div className="stack gap-0" data-stat={id}><span className="t-lg t-semibold" style={{ fontFamily: 'var(--font-mono)' }}>{n}</span><span className="t-xs t-muted">{t(label)}</span></div></Card>)}
    </div>
  );
}

function Earned({ d, t }: { d: ReferralDeskView; t: T }) {
  if (d.earned.issued === 0) return null;
  const items: [string, number, string][] = [[K.earned.issued, d.earned.issued, 'issued'], [K.earned.inProgress, d.earned.inProgress, 'inProgress'], [K.earned.paid, d.earned.paid, 'paid']];
  return (
    <Card>
      <div className="stack gap-2" data-earned>
        <h2 className="t-md t-semibold">{t(K.earned.title)}</h2>
        <div className="row gap-4 wrap">{items.map(([label, n, id]) => <span key={id} className="stack gap-0" data-earned-item={id}><span className="t-md t-semibold" style={{ fontFamily: 'var(--font-mono)' }}>{formatINR(n)}</span><span className="t-xs t-muted">{t(label)}</span></span>)}</div>
      </div>
    </Card>
  );
}

function Terms({ d, t, lang }: { d: ReferralDeskView; t: T; lang: string }) {
  return (
    <Card>
      <div className="stack gap-2" data-terms>
        <h2 className="t-md t-semibold">{t(K.terms.title)}</h2>
        <p className="t-sm" data-terms-you>{t(K.terms.you, { amount: formatINR(d.terms.amount) })}</p>
        <p className="t-sm">{t(K.terms.friend)}</p>
        <p className="t-sm">{t(K.terms.when)}</p>
        <p className="t-sm">{t(K.terms.known)}</p>
        <p className="t-xs t-muted">{t(K.terms.version, { date: formatDate(d.terms.since, lang) })}</p>
      </div>
    </Card>
  );
}

const hintOf = (t: T, r: ReferralRowView, lang: string): string => {
  if (r.status === 'waiting') return r.waitingUntil ? t(K.hint.waiting, { date: formatDate(r.waitingUntil, lang) }) : t(K.hint.waitingNoDate);
  if (r.status === 'known') return t(K.hint.known, { date: r.knownSince ? formatDate(r.knownSince, lang) : '' });
  return t(`referral.hint.${r.status}`);
};

function List({ d, s, t, lang }: { d: ReferralDeskView; s: ReferralsState; t: T; lang: string }) {
  return (
    <section className="stack gap-2" data-list>
      <h2 className="t-md t-semibold">{t(K.list.title)}</h2>
      {d.rows.length === 0 && <EmptyState title={t(K.list.empty.title)} body={t(K.list.empty.body)} />}
      {d.rows.map((r) => (
        <button key={r.id} type="button" className="ds-card tappable" data-row={r.id} data-status={r.status} onClick={() => s.openRow(r.id)} style={{ display: 'block', textAlign: 'left', width: '100%' }}>
          <span className="stack gap-1">
            <span className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center' }}><span className="t-sm t-semibold">{r.name}</span><Badge tone={TONE[r.status]}>{t(`referral.status.${r.status}`)}</Badge></span>
            <span className="t-xs t-muted">{[r.city, t(`referral.row.via.${r.via}`), formatDate(r.createdAt, lang)].filter(Boolean).join(' · ')}</span>
            <span className="t-xs">{hintOf(t, r, lang)}</span>
            {r.reward && <span className="t-xs t-semibold" data-reward={r.reward.stage}>{formatINR(r.reward.amount)} · {t(`referral.reward.${r.reward.stage}`)}</span>}
          </span>
        </button>
      ))}
    </section>
  );
}

function Detail({ s, t, lang }: { s: ReferralsState; t: T; lang: string }) {
  const r = s.row;
  const idx = r ? ORDER.indexOf(r.status) : -1;
  const steps: AscensionStep[] = r && r.status !== 'known'
    ? [
        ...ORDER.slice(0, 4).map((id, i): AscensionStep => ({ id, label: t(`referral.detail.step.${id}`), status: r.status === 'waiting' || r.status === 'closed' ? (i === 0 ? 'complete' : 'upcoming') : i < idx || (r.status === 'converted' && i === 3) ? 'complete' : i === idx ? 'current' : 'upcoming' })),
        { id: 'reward', label: t(K.detail.step.reward), meta: r.reward ? `${formatINR(r.reward.amount)} · ${t(`referral.reward.${r.reward.stage}`)}` : undefined, status: r.reward?.stage === 'paid' ? 'complete' : r.reward ? 'current' : 'upcoming' },
      ]
    : [];
  return (
    <Sheet open={!!r} onClose={() => s.openRow(null)} title={r?.name ?? ''} closeLabel={t(K.close)}>
      {r && (
        <div className="stack gap-3" data-detail={r.id}>
          <span className="row gap-2" style={{ alignItems: 'center' }}><Badge tone={TONE[r.status]}>{t(`referral.status.${r.status}`)}</Badge><span className="t-xs t-muted">{t(K.detail.reference, { code: r.code })}</span></span>
          <p className="t-sm">{hintOf(t, r, lang)}</p>
          {steps.length > 0 && <AscensionLine steps={steps} />}
        </div>
      )}
    </Sheet>
  );
}

function FormFields({ d, set, t, own, prefix }: { d: FormDraft; set: (n: Partial<FormDraft>) => void; t: T; own: boolean; prefix: 'form' | 'landing' }) {
  const L = (own: string, other: string) => (prefix === 'form' ? own : other);
  return (
    <div className="stack gap-3">
      <Field label={L(t(K.form.name), t(K.landing.yourName))} required>{(p) => <Input id={p.id} value={d.name} autoComplete="name" data-f="name" onChange={(e) => set({ name: e.target.value })} />}</Field>
      <Field label={L(t(K.form.phone), t(K.landing.yourPhone))} required>{(p) => <Input id={p.id} value={d.phone} inputMode="numeric" autoComplete="tel" data-f="phone" onChange={(e) => set({ phone: e.target.value })} />}</Field>
      <Field label={L(t(K.form.city), t(K.landing.yourCity))} hint={own ? t(K.form.cityHint) : undefined}>{(p) => <Input id={p.id} value={d.city} data-f="city" onChange={(e) => set({ city: e.target.value })} />}</Field>
      <Field label={L(t(K.form.note), t(K.landing.yourNote))}>{(p) => <TextArea id={p.id} rows={3} value={d.note} data-f="note" onChange={(e) => set({ note: e.target.value })} />}</Field>
      <div data-f="consent"><Checkbox checked={d.consent} onChange={(v) => set({ consent: v })} label={own ? t(K.form.consent) : t(K.form.consentOwn)} /></div>
    </div>
  );
}

function Invite({ s, t }: { s: ReferralsState; t: T }) {
  const [problem, setProblem] = useState<string | null>(null);
  const done = s.sent;
  const submit = async () => { setProblem(null); const r = await s.send(); if (!r.ok) setProblem(r.problem); };
  return (
    <Sheet open={s.invite} onClose={() => s.openInvite(false)} title={t(K.invite.title)} closeLabel={t(K.close)}>
      {done ? (
        <div className="stack gap-3" data-sent={done.outcome}>
          <p className="t-sm" role="status">{done.outcome === 'known' ? t(K.sent.knownBody, { hint: t(K.sent.knownShort) }) : t(K.sent.received)}</p>
          <div className="row gap-2"><Button variant="secondary" data-act="another" onClick={s.another}>{t(K.sent.another)}</Button><Button data-act="done" onClick={() => s.openInvite(false)}>{t(K.close)}</Button></div>
        </div>
      ) : (
        <div className="stack gap-3" data-invite-form>
          <p className="t-sm t-muted">{t(K.invite.body)}</p>
          <FormFields d={s.draft} set={s.setDraft} t={t} own prefix="form" />
          {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{problemText(t, problem)}</p>}
          <div className="row gap-2"><Button variant="ghost" onClick={() => s.openInvite(false)}>{t(K.form.cancel)}</Button><Button className="grow" data-act="send" disabled={!formOk(s.draft)} loading={s.sending} onClick={() => void submit()}>{t(K.form.send)}</Button></div>
        </div>
      )}
    </Sheet>
  );
}

/* ------------------------------------------------------------------ the page a referred person lands on */

function LandingShell({ s, t, lang, children }: { s: LandingState; t: T; lang: string; children: ReactNode }) {
  return (
    <div className="ds-screen ds-screen--narrow">
      <header className="stack gap-2 mb-3" style={{ alignItems: 'center', textAlign: 'center' }}>
        <span className="t-xs t-muted" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t(K.landing.brand)}</span>
        <div className="row gap-2 wrap" role="group" style={{ justifyContent: 'center' }}>
          {LANGS.map((l) => <span key={l.id} data-lang={l.id}><Chip pressed={lang.startsWith(l.id)} onClick={() => s.setLanguage(l.id)}>{l.label}</Chip></span>)}
        </div>
      </header>
      {children}
    </div>
  );
}

export function ReferralLandingScreen() {
  const { t, i18n } = useTranslation();
  const s = useReferralLanding();
  const lang = i18n.language;
  if (s.load === 'loading') return <LandingShell s={s} t={t} lang={lang}><LoadingState label={t(K.loading)} variant="cards" rows={2} /></LandingShell>;
  if (s.load === 'error') return <LandingShell s={s} t={t} lang={lang}><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} /></LandingShell>;
  if (!s.view?.valid) return <LandingShell s={s} t={t} lang={lang}><EmptyState title={t(K.landing.invalid.title)} body={t(K.landing.invalid.body)} /></LandingShell>;
  const first = s.view.referrerFirstName ?? '';
  if (s.done) return <LandingShell s={s} t={t} lang={lang}><Card><p className="t-md" role="status" data-landing-done={s.done.outcome}>{s.done.outcome === 'known' ? t(K.landing.doneKnown) : t(K.landing.done)}</p></Card></LandingShell>;
  return (
    <LandingShell s={s} t={t} lang={lang}>
      <div className="stack gap-3 pb-action-bar" data-landing>
        <section className="stack gap-2">
          <h1 className="ds-screen-header__title" style={{ textAlign: 'center' }}>{t(K.landing.title, { name: first })}</h1>
          <p className="t-sm" style={{ textAlign: 'center' }}>{t(K.landing.body)}</p>
        </section>
        <Card><FormFields d={s.draft} set={s.setDraft} t={t} own={false} prefix="landing" /></Card>
        {s.problem && <p className="t-sm t-error" role="alert" data-problem={s.problem}>{problemText(t, s.problem)}</p>}
      </div>
      <ActionBar>
        <Button className="grow" block data-act="landing-send" disabled={!(lettersOf(s.draft.name) >= 2 && digitsOf(s.draft.phone).length >= PHONE_DIGITS && s.draft.consent)} loading={s.sending} onClick={() => void s.submit()}>{t(K.landing.send)}</Button>
      </ActionBar>
    </LandingShell>
  );
}
