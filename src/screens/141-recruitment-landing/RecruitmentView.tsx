import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle, Compass, Copy, Ruler, ShareNetwork, Storefront, Wrench } from '@phosphor-icons/react';
import { ActionBar, Badge, Button, Card, Checkbox, Chip, ErrorState, Field, Input, LoadingState, Sheet } from '@/design-system';
import { GUIDE, NAME_MIN } from '@/features/recruitment/interest';
import type { InterestRole, RecruitRole } from '@/features/recruitment/interest';
import { useRecruitment } from './useRecruitment';
import type { RecruitmentState } from './useRecruitment';
import { CARD_ROLES, RECRUIT_KEYS as K, joinPath } from './recruitment.types';

type T = ReturnType<typeof useTranslation>['t'];
const ICON: Record<InterestRole, JSX.Element> = {
  surveyor: <Ruler size={26} aria-hidden="true" color="var(--color-accent-secondary)" />,
  technician: <Wrench size={26} aria-hidden="true" color="var(--color-accent-secondary)" />,
  supplier: <Storefront size={26} aria-hidden="true" color="var(--color-accent-secondary)" />,
  undecided: <Compass size={26} aria-hidden="true" color="var(--color-accent-secondary)" />,
};
const problemKey = (code: string | null) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const LANGS: { id: 'en' | 'hi' | 'mr'; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिन्दी' },
  { id: 'mr', label: 'मराठी' },
];

/**
 * Screen 141 — Recruitment Landing / Application. The public front door for partners (surveyor, technician, supplier): what each role really
 * involves, what is earned and who provides what, a "help me choose" path for the unsure, and a first step of only a name, a phone and the
 * role(s) of interest. The detailed application is the existing onboarding wizard for that role.
 */
export function RecruitmentScreen() {
  const { t, i18n } = useTranslation();
  const s = useRecruitment();
  const shell = (body: JSX.Element) => (
    <div className="ds-screen ds-screen--narrow">
      <Header t={t} lang={i18n.language} s={s} />
      {body}
    </div>
  );
  if (s.status === 'loading' && !s.view) return shell(<LoadingState label={t(K.loading)} variant="cards" rows={3} />);
  if (s.status === 'error' && !s.view) return shell(<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />);
  if (s.result && s.who) return shell(<Done s={s} t={t} />);
  return <Landing s={s} t={t} lang={i18n.language} />;
}

function Header({ t, lang, s }: { t: T; lang: string; s: RecruitmentState }) {
  return (
    <header className="stack gap-2 mb-3" style={{ alignItems: 'center', textAlign: 'center' }}>
      <span className="t-xs t-muted" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t(K.brand)}</span>
      <div className="row gap-2 wrap" role="group" aria-label={t(K.language)} style={{ justifyContent: 'center' }}>
        {LANGS.map((l) => <span key={l.id} data-lang={l.id}><Chip pressed={lang.startsWith(l.id)} onClick={() => s.setLanguage(l.id)}>{l.label}</Chip></span>)}
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ the page */

function Landing({ s, t, lang }: { s: RecruitmentState; t: T; lang: string }) {
  const [guide, setGuide] = useState(false);
  const d = s.draft;
  const demand = s.view?.demand;
  const nameOk = d.name.replace(/[^\p{L}]/gu, '').length >= NAME_MIN;
  return (
    <div className="ds-screen ds-screen--narrow pb-action-bar">
      <Header t={t} lang={lang} s={s} />

      <section className="stack gap-2 mb-3" data-hero>
        <h1 className="ds-screen-header__title" style={{ textAlign: 'center' }}>{t(K.hero.heading)}</h1>
        <p className="t-sm" style={{ textAlign: 'center' }}>{t(K.hero.intro)}</p>
        <p className="t-xs t-muted" style={{ textAlign: 'center' }}>{t(K.hero.honest)}</p>
        {demand && demand.level !== 'normal' && <p className="t-sm" role="status" data-demand={demand.level} style={{ textAlign: 'center' }}><Badge tone="warning" dot>{t(demand.level === 'surge' ? K.demand.surge : K.demand.busy, { days: demand.expectedReplyDays })}</Badge></p>}
        {demand?.level === 'normal' && <p className="t-xs t-muted" data-demand="normal" style={{ textAlign: 'center' }}>{t(K.demand.normal, { days: demand.expectedReplyDays })}</p>}
      </section>

      <Card className="mb-3">
        <div className="stack gap-1" data-areas>
          <strong className="t-sm">{t(K.areas.heading)}</strong>
          <p className="t-sm">{s.view && s.view.areas.length > 0 ? s.view.areas.join(' · ') : t(K.areas.none)}</p>
        </div>
      </Card>

      <section className="stack gap-3 mb-3" data-roles>
        <div className="stack gap-1" style={{ borderTop: '1px solid var(--color-accent-primary)', paddingTop: 'var(--space-3)' }}>
          <strong className="t-md">{t(K.roles.heading)}</strong>
          <p className="t-xs t-muted">{t(K.roles.hint)}</p>
        </div>
        {CARD_ROLES.map((r) => {
          const on = d.roles.includes(r);
          return (
            <Card key={r}>
              <div className="stack gap-2" data-role={r} data-chosen={on ? 1 : 0}>
                <div className="row gap-3" style={{ alignItems: 'center' }}>
                  <span aria-hidden="true">{ICON[r]}</span>
                  <span className="stack" style={{ flex: 1 }}>
                    <strong className="t-md">{t(K.roles.name[r])}</strong>
                    <span className="t-sm t-muted">{t(K.roles.tagline[r])}</span>
                  </span>
                </div>
                <details data-details>
                  <summary className="t-sm" style={{ cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center' }}>{t(K.roles.details)}</summary>
                  <div className="stack gap-2" style={{ paddingTop: 'var(--space-2)' }}>
                    {(['involves', 'earns', 'gives', 'handle'] as const).map((k) => (
                      <p key={k} className="t-sm"><strong>{t(K.roles.detailLabel[k])}</strong> {t(K.roles.detail[r][k])}</p>
                    ))}
                  </div>
                </details>
                <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
                  <Button variant={on ? 'primary' : 'secondary'} data-pick={r} onClick={() => s.toggleRole(r)}>{on ? t(K.roles.chosen) : t(K.roles.choose)}</Button>
                  {r === 'undecided' && <Button variant="ghost" data-guide-open onClick={() => setGuide(true)}>{t(K.guide.open)}</Button>}
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      <Card className="mb-3">
        <div className="stack gap-3" data-form>
          <div className="stack gap-1">
            <strong className="t-md">{t(K.form.heading)}</strong>
            <p className="t-xs t-muted">{t(K.form.intro)}</p>
          </div>
          {s.restored && <p className="t-xs t-muted" data-restored>{t(K.form.draftRestored)}</p>}
          <Field label={t(K.form.name)}>{({ id }) => <Input id={id} autoComplete="name" value={d.name} onChange={(e) => s.setDraft({ name: e.target.value })} data-name />}</Field>
          {nameOk && <p className="t-xs t-success" data-name-ok><CheckCircle size={14} weight="fill" aria-hidden="true" /></p>}
          <Field label={t(K.form.phone)} hint={t(K.form.phoneHint)}>
            {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} inputMode="tel" autoComplete="tel-national" maxLength={17} value={d.phone} onChange={(e) => s.setDraft({ phone: e.target.value.replace(/[^\d+ ]/g, '') })} data-phone />}
          </Field>
          {s.phoneOk && <p className="t-xs t-success row gap-1" data-phone-ok style={{ alignItems: 'center' }}><CheckCircle size={14} weight="fill" aria-hidden="true" /> {t(K.form.phoneOk)}</p>}
          <p className="t-sm" data-selected>{d.roles.length === 0 ? t(K.form.selected, { roles: '—' }) : t(K.form.selected, { roles: d.roles.map((r) => t(K.roles.name[r])).join(', ') })}</p>
          <div data-consent><Checkbox checked={d.consent} onChange={(on) => s.setDraft({ consent: on })} label={<span className="t-sm">{t(K.form.consent)}</span>} /></div>
        </div>
      </Card>

      <Share t={t} />

      <ActionBar>
        <div className="stack gap-1" style={{ width: '100%' }}>
          {s.problem && <p className="t-xs t-error" role="alert" data-problem={s.problem}>{t(problemKey(s.problem))}</p>}
          {!s.valid && <p className="t-xs t-muted">{t(K.submit.waiting)}</p>}
          <Button style={{ width: '100%' }} disabled={!s.valid || s.busy} data-submit onClick={() => void s.submit()}>{t(K.submit.button)}</Button>
        </div>
      </ActionBar>

      <GuideSheet s={s} t={t} open={guide} onClose={() => setGuide(false)} />
    </div>
  );
}

/* ------------------------------------------------------------------ help me choose */

function GuideSheet({ s, t, open, onClose }: { s: RecruitmentState; t: T; open: boolean; onClose: () => void }) {
  const answered = GUIDE.filter((q) => !!s.answers[q.id]).length;
  const done = answered === GUIDE.length;
  return (
    <Sheet open={open} onClose={onClose} title={t(K.guide.heading)} closeLabel={t('action.close')}>
      <div className="stack gap-3" data-guide>
        <p className="t-sm">{t(K.guide.intro)}</p>
        <p className="t-xs t-muted">{t(K.guide.progress, { done: answered, total: GUIDE.length })}</p>
        {GUIDE.map((q) => (
          <div key={q.id} className="stack gap-2" data-question={q.id}>
            <strong className="t-sm">{t(K.guide.question[q.id])}</strong>
            <div className="row gap-2 wrap" role="radiogroup" aria-label={t(K.guide.question[q.id])}>
              {q.options.map((o) => <span key={o.id} data-answer={`${q.id}:${o.id}`}><Chip pressed={s.answers[q.id] === o.id} onClick={() => s.answer(q.id, o.id)}>{t(K.guide.answer[q.id][o.id])}</Chip></span>)}
            </div>
          </div>
        ))}
        {done && (
          <div className="stack gap-2" data-guide-result style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
            <p className="t-sm">{s.suggestion ? t(K.guide.pointsTo, { role: t(K.roles.name[s.suggestion]) }) : t(K.guide.pointsNowhere)}</p>
            <div className="row gap-2 wrap">
              {s.suggestion && <Button data-guide-use onClick={() => { const r = s.suggestion as RecruitRole; if (!s.draft.roles.includes(r)) s.toggleRole(r); onClose(); }}>{t(K.guide.use, { role: t(K.roles.name[s.suggestion]) })}</Button>}
              <Button variant="secondary" data-guide-keep onClick={() => { if (!s.draft.roles.includes('undecided')) s.toggleRole('undecided'); onClose(); }}>{t(K.guide.keep)}</Button>
              <Button variant="ghost" onClick={s.resetGuide}>{t(K.guide.again)}</Button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ share the page */

function Share({ t }: { t: T }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}${joinPath}?src=whatsapp`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // The link is shown, so it can still be copied by hand.
    }
  };
  const send = async () => {
    try {
      if (navigator.share) await navigator.share({ title: t(K.brand), text: t(K.share.message), url: link });
      else window.open(`https://wa.me/?text=${encodeURIComponent(`${t(K.share.message)} ${link}`)}`, '_blank', 'noopener');
    } catch {
      // Cancelled.
    }
  };
  return (
    <Card className="mb-3">
      <div className="stack gap-2" data-share>
        <strong className="t-sm">{t(K.share.heading)}</strong>
        <p className="t-xs t-muted">{t(K.share.body)}</p>
        <code className="t-xs" style={{ wordBreak: 'break-all' }}>{link}</code>
        <div className="row gap-2 wrap">
          <Button variant="secondary" icon={<Copy size={16} aria-hidden="true" />} onClick={() => void copy()} data-copy>{copied ? t(K.share.copied) : t(K.share.copy)}</Button>
          <Button variant="secondary" icon={<ShareNetwork size={16} aria-hidden="true" />} onClick={() => void send()}>{t(K.share.send)}</Button>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ after the first step */

function Done({ s, t }: { s: RecruitmentState; t: T }) {
  const r = s.result!;
  const who = s.who!;
  const demand = r.demand;
  const roles = r.items;
  return (
    <div className="stack gap-3" data-done>
      <Card>
        <div className="stack gap-2">
          <div className="row gap-2" style={{ alignItems: 'center' }}>
            <CheckCircle size={26} weight="fill" aria-hidden="true" color="var(--color-success)" />
            <strong className="t-md">{t(K.done.heading, { name: who.name.split(' ')[0] })}</strong>
          </div>
          <p className="t-sm">{t(K.done.intro)}</p>
        </div>
      </Card>
      {roles.map((i) => (
        <Card key={i.id}>
          <div className="stack gap-2" data-result={i.role} data-created={i.created ? 1 : 0}>
            <div className="row gap-3" style={{ alignItems: 'center' }}>
              <span aria-hidden="true">{ICON[i.role]}</span>
              <span className="stack" style={{ flex: 1 }}>
                <strong className="t-sm">{t(K.roles.name[i.role])}</strong>
                <span className="t-xs t-muted">{t(i.created ? K.done.created : K.done.existed)} · {t(K.done.code, { code: i.code })}</span>
              </span>
            </div>
            {i.role === 'undecided' ? (
              <p className="t-sm">{t(K.done.undecided)}</p>
            ) : (
              <Button data-continue={i.role} onClick={() => void s.continueWith(i.role as RecruitRole, i.id, who)}>{t(K.done.continue, { role: t(K.roles.name[i.role]) })} <ArrowRight size={16} aria-hidden="true" /></Button>
            )}
          </div>
        </Card>
      ))}
      <p className="t-sm" data-reply>{t(K.done.reply, { days: demand.expectedReplyDays })}</p>
      <p className="t-xs t-muted">{t(K.done.later)}</p>
      <Button variant="secondary" style={{ width: 'fit-content' }} data-another onClick={s.another}>{t(K.done.another)}</Button>
    </div>
  );
}

