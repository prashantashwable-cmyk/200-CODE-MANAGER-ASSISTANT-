import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, Bell, CreditCard, Gift, FileText, Headset, Lifebuoy, Wrench } from '@phosphor-icons/react';
import { AscensionLine, Badge, Button, Card, Chip, EmptyState, ErrorState, LoadingState, ProgressBar, Screen, ScreenHeader, formatDate, formatINR } from '@/design-system';
import type { AscensionStep } from '@/design-system';
import type { CustomerConcern, CustomerProjectHome, CustomerStageKey } from '@/data/repository';
import { HOME_KEYS as K, STAGE_ORDER, checkoutPath, documentsPath, paymentsPath, servicePath, statusPath } from './customer-home.types';
import { useCustomerHome } from './useCustomerHome';
import type { CustomerHomeState } from './useCustomerHome';

type T = ReturnType<typeof useTranslation>['t'];
const greetingKey = (): 'morning' | 'afternoon' | 'evening' => { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'; };

/** Screen 171 — Customer Home Dashboard. Warm and honest: a project's stage, what is next, anything worth knowing said calmly, and a way to reach AIEC. After handover the same screen frames service instead. */
export function CustomerHomeScreen() {
  const { t } = useTranslation();
  const s = useCustomerHome();
  const v = s.view;
  if (s.load === 'loading' && !v) return <Screen width="default"><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="stats" rows={3} /></Screen>;
  if (s.load === 'error' && !v) return <Screen width="default"><ScreenHeader title={t(K.title)} /><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /></Screen>;
  if (!v) return null;
  const c = v.current;
  const header = <ScreenHeader title={t(K.greeting[greetingKey()], { name: v.firstName })} subtitle={c?.siteName ?? v.companyName ?? undefined} action={<span className="row gap-2" style={{ alignItems: 'center' }}>{v.unread > 0 && <Badge tone="accent"><Bell size={12} aria-hidden="true" /> {t(K.unread, { count: v.unread })}</Badge>}<Button size="sm" variant="ghost" data-refresh onClick={() => void s.refresh()}><ArrowsClockwise size={14} aria-hidden="true" /> {t(K.refresh)}</Button></span>} />;
  if (!c) {
    return (
      <Screen width="default">
        {header}
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
        <Contact s={s} t={t} />
        <Road t={t} from={0} />
      </Screen>
    );
  }
  return (
    <Screen width="default">
      {header}
      {v.projects.length > 1 && (
        <div className="mb-3 stack gap-1" data-switcher>
          <span className="t-xs t-muted">{t(K.switcher.label)}</span>
          <div className="row gap-2" style={{ overflowX: 'auto', paddingBottom: 4 }}>
            {v.projects.map((p) => <span key={p.key} data-project={p.key} data-mode={p.mode} style={{ flex: '0 0 auto' }}><Chip pressed={p.key === c.key} onClick={() => s.pick(p.key)}>{p.siteName} · {t(K.switcher.mode[p.mode])}</Chip></span>)}
          </div>
        </div>
      )}
      {s.offline && <p className="t-xs t-muted mb-2" data-offline>{t(K.error.body)}</p>}
      <div className="main-aside">
        <div className="stack gap-3" data-main>
          <Hero c={c} t={t} />
          {c.concerns.some((x) => x.kind !== 'payment_overdue') && <Concerns c={c} s={s} t={t} />}
          <Next c={c} s={s} t={t} />
          {s.feedbackDue > 0 && <Card><div className="row gap-2" data-feedback-ask style={{ justifyContent: 'space-between', alignItems: 'center' }}><span className="t-sm">{t('feedback.ask.title')}</span><Button size="sm" variant="secondary" onClick={() => s.goTo('/feedback')}>{t('feedback.link.open')}</Button></div></Card>}
          {c.mode === 'service' && <Service c={c} s={s} t={t} />}
          {c.early && c.mode !== 'service' && <Road t={t} from={Math.max(0, STAGE_ORDER.indexOf((c.stage ?? 'agreed') as CustomerStageKey))} />}
        </div>
        <div className="stack gap-3" data-aside>
          <Tiles c={c} s={s} t={t} supportPhone={v.supportPhone} />
          {c.payments.total > 0 && <PaySummary c={c} s={s} t={t} />}
          <Contact s={s} t={t} />
        </div>
      </div>
    </Screen>
  );
}

function Hero({ c, t }: { c: CustomerProjectHome; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const paused = c.concerns.some((x) => x.kind === 'paused');
  const headline = c.mode === 'service' ? t(K.hero.service, { site: c.siteName }) : paused ? t(K.hero.paused, { site: c.siteName }) : c.mode === 'starting' && c.stage === 'agreed' ? t(K.hero.starting, { site: c.siteName }) : t(K.hero.stage[(c.stage ?? 'agreed') as CustomerStageKey], { site: c.siteName });
  const steps: AscensionStep[] = c.stages.map((st) => ({ id: st.key, label: t(K.stage[st.key]), meta: st.status === 'done' ? (st.doneAt ? t(K.stage.doneOn, { date: formatDate(st.doneAt, lang) }) : undefined) : st.status === 'current' && c.mode !== 'service' ? t(K.stage.now) : undefined, status: st.status === 'done' ? 'complete' : st.status === 'current' && c.mode !== 'service' ? 'current' : 'upcoming' }));
  return (
    <Card>
      <div className="stack gap-3" data-hero data-mode={c.mode} data-stage={c.stage ?? 'done'}>
        <h2 className="t-lg" style={{ fontFamily: 'var(--font-heading, inherit)' }}>{headline}</h2>
        {c.mode !== 'service' && c.percent !== null && (
          <div className="stack gap-1" data-progress={c.percent}>
            <span className="row gap-2" style={{ justifyContent: 'space-between' }}><span className="t-xs t-muted">{t(K.progress.label)}</span><span className="t-xs num">{t(K.progress.value, { percent: c.percent })}</span></span>
            <ProgressBar value={c.percent / 100} label={t(K.progress.label)} />
          </div>
        )}
        {c.mode !== 'service' && c.timelineHidden && c.jobId && <p className="t-sm t-muted" data-hidden>{t(K.progress.hidden)}</p>}
        {c.expectedAt && c.mode !== 'service' && <p className="t-sm" data-expected>{t(K.expected, { date: formatDate(c.expectedAt, lang) })}</p>}
        <AscensionLine steps={steps} orientation="vertical" />
        {c.lastUpdateAt && <p className="t-xs t-muted">{t(K.lastUpdate, { date: formatDate(c.lastUpdateAt, lang) })}</p>}
      </div>
    </Card>
  );
}

function concernText(t: T, x: CustomerConcern): string {
  return x.kind === 'payment_overdue' ? '' : t(K.concern[x.kind], { days: x.days ?? 0, amount: formatINR(x.amount ?? 0) });
}

function Concerns({ c, s, t }: { c: CustomerProjectHome; s: CustomerHomeState; t: T }) {
  return (
    <Card>
      <div className="stack gap-2" data-concerns>
        <h2 className="t-md t-semibold">{t(K.concern.heading)}</h2>
        {c.concerns.filter((x) => x.kind !== 'payment_overdue').map((x) => (
          <div key={x.kind} className="stack gap-1" data-concern={x.kind} style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 'var(--space-3)' }}>
            <p className="t-sm">{concernText(t, x)}</p>
            {x.reason && <p className="t-sm t-muted">{t(`installTimeline.reason.customer.${x.reason}`)}</p>}
            <span className="row gap-2 wrap">
              {(x.kind === 'delay' || x.kind === 'paused') && <Button size="sm" variant="ghost" onClick={() => s.goTo(statusPath(c.key))}>{t(K.openStatus)}</Button>}
              {x.kind === 'payment_disputed' && <Button size="sm" variant="ghost" onClick={() => s.goTo(paymentsPath(c.dealId))}>{t(K.concern.viewPayments)}</Button>}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Next({ c, s, t }: { c: CustomerProjectHome; s: CustomerHomeState; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const n = c.next;
  if (!n) return null;
  return (
    <Card>
      <div className="stack gap-2" data-next={n.kind} data-overdue={n.overdue}>
        <h2 className="t-md t-semibold">{t(K.next.heading)}</h2>
        {n.kind === 'payment' ? (
          <>
            <p className="t-sm">{n.overdue ? t(K.next.paymentOverdue, { amount: formatINR(n.amount ?? 0), date: formatDate(n.dueAt as string, lang) }) : t(K.next.paymentDue, { amount: formatINR(n.amount ?? 0), date: formatDate(n.dueAt as string, lang) })}</p>
            {n.overdue && <p className="t-xs t-muted">{t(K.next.paidAlready)}</p>}
            {n.paymentId && <div><Button size="sm" data-pay={n.paymentId} onClick={() => s.goTo(checkoutPath(n.paymentId as string))}>{t(K.next.payNow, { amount: formatINR(n.amount ?? 0) })}</Button></div>}
          </>
        ) : n.stage === 'service' ? (
          <p className="t-sm">{c.service?.amcStatus === 'active' && c.service.amcEndsOn ? t(K.next.service.amc, { date: formatDate(c.service.amcEndsOn, lang) }) : n.dueAt ? t(K.next.service.warranty, { date: formatDate(n.dueAt, lang) }) : t(K.next.service.none)}</p>
        ) : (
          <p className="t-sm">{t(K.next.milestone[n.stage as CustomerStageKey])}{n.dueAt ? ` · ${t(K.next.on, { date: formatDate(n.dueAt, lang) })}` : ''}</p>
        )}
      </div>
    </Card>
  );
}

function Service({ c, s, t }: { c: CustomerProjectHome; s: CustomerHomeState; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const v = c.service;
  return (
    <Card>
      <div className="stack gap-2" data-service>
        <h2 className="t-md t-semibold row gap-1" style={{ alignItems: 'center' }}><Wrench size={18} aria-hidden="true" />{t(K.service.heading)}</h2>
        <p className="t-sm">{v?.warrantyEndsOn ? t(K.service.warranty, { date: formatDate(v.warrantyEndsOn, lang) }) : t(K.service.warrantyNone)}</p>
        <p className="t-sm">{v?.amcStatus === 'active' && v.amcEndsOn ? t(K.service.amc.active, { date: formatDate(v.amcEndsOn, lang) }) : v?.amcStatus === 'later' ? t(K.service.amc.later) : v?.amcStatus === 'declined' ? t(K.service.amc.declined) : ''}</p>
        {c.jobId && <div><Button size="sm" variant="secondary" data-open-service onClick={() => s.goTo(servicePath(c.jobId as string))}>{t(K.service.open)}</Button></div>}
      </div>
    </Card>
  );
}

function Road({ t, from }: { t: T; from: number }) {
  return (
    <Card>
      <div className="stack gap-2 mt-3" data-road>
        <h2 className="t-md t-semibold">{t(K.early.heading)}</h2>
        <p className="t-sm t-muted">{t(K.early.intro)}</p>
        <ol className="stack gap-2" style={{ paddingLeft: 'var(--space-5, 20px)' }}>
          {STAGE_ORDER.slice(from).map((k) => <li key={k} data-road-step={k} className="t-sm"><strong>{t(K.stage[k])}.</strong> {t(K.early.step[k])}</li>)}
        </ol>
      </div>
    </Card>
  );
}

function Tile({ icon, title, hint, onClick, href, disabled, id }: { icon: ReactNode; title: string; hint: string; onClick?: () => void; href?: string; disabled?: boolean; id: string }) {
  const body = (
    <span className="row gap-3" style={{ alignItems: 'center' }}>
      <span aria-hidden="true" style={{ color: 'var(--color-accent-secondary)' }}>{icon}</span>
      <span className="stack gap-0" style={{ textAlign: 'left' }}><strong className="t-sm">{title}</strong><span className="t-xs t-muted">{hint}</span></span>
    </span>
  );
  const style = { display: 'block', width: '100%', minHeight: 56, padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md, 12px)', background: 'var(--color-surface)', color: 'inherit', textDecoration: 'none', opacity: disabled ? 0.6 : 1 } as const;
  if (href) return <a data-tile={id} href={href} className="tappable" style={style}>{body}</a>;
  return <button type="button" data-tile={id} className="tappable" disabled={disabled} onClick={onClick} style={style}>{body}</button>;
}

function Tiles({ c, s, t, supportPhone }: { c: CustomerProjectHome; s: CustomerHomeState; t: T; supportPhone: string | null }) {
  const handed = c.mode === 'service';
  return (
    <div className="stack gap-2" data-tiles>
      <Tile id="status" icon={<Lifebuoy size={22} />} title={t(K.tile.status.title)} hint={t(K.tile.status.hint)} onClick={() => s.goTo(statusPath(c.key))} />
      <Tile id="payments" icon={<CreditCard size={22} />} title={t(K.tile.payments.title)} hint={c.payments.total > 0 ? t(K.tile.payments.hint, { received: formatINR(c.payments.received), total: formatINR(c.payments.total) }) : ''} onClick={() => s.goTo(paymentsPath(c.dealId))} />
      <Tile id="documents" icon={<FileText size={22} />} title={t(K.tile.documents.title)} hint={t(K.tile.documents.hint)} onClick={() => s.goTo(documentsPath)} />
      <Tile id="support" icon={<Headset size={22} />} title={t(K.tile.support.title)} hint={t(K.tile.support.hint)} onClick={() => s.goTo('/support-chat')} />
      {handed && c.jobId && <Tile id="service" icon={<Wrench size={22} />} title={t(K.tile.service.title)} hint={t(K.tile.service.hint)} onClick={() => s.goTo(servicePath(c.jobId as string))} />}
      {handed && c.jobId && <Tile id="maintenance" icon={<Wrench size={22} />} title={t('maintenance.link.open')} hint={t('maintenance.purpose.routine.body')} onClick={() => s.goTo(`/maintenance?job=${c.jobId}`)} />}
      <Tile id="notifications" icon={<Bell size={22} />} title={t('notifications.link.open')} hint={(s.view?.unread ?? 0) > 0 ? t('notifications.link.unread', { count: (s.view?.unread ?? 0) }) : t('notifications.link.hint')} onClick={() => s.goTo('/notifications')} />
      <Tile id="referral" icon={<Gift size={22} />} title={t('referral.link.open')} hint={t('referral.link.hint')} onClick={() => s.goTo('/referrals')} />
    </div>
  );
}

function PaySummary({ c, s, t }: { c: CustomerProjectHome; s: CustomerHomeState; t: T }) {
  const pct = c.payments.total > 0 ? Math.round((c.payments.received / c.payments.total) * 100) : 0;
  return (
    <Card>
      <div className="stack gap-2" data-pay-summary>
        <h2 className="t-md t-semibold">{t(K.pay.heading)}</h2>
        <ProgressBar value={pct / 100} label={t(K.pay.heading)} />
        <p className="t-sm num">{t(K.pay.line, { received: formatINR(c.payments.received), total: formatINR(c.payments.total) })}</p>
        <div><Button size="sm" variant="ghost" onClick={() => s.goTo(paymentsPath(c.dealId))}>{t(K.pay.open)}</Button></div>
      </div>
    </Card>
  );
}

function Contact({ s, t }: { s: CustomerHomeState; t: T }) {
  const phone = s.view?.supportPhone;
  return (
    <Card>
      <div className="stack gap-2" data-contact>
        <h2 className="t-md t-semibold">{t(K.contact.heading)}</h2>
        <p className="t-sm t-muted">{t(K.contact.body)}</p>
        {phone && <div><a className="ds-btn ds-btn--secondary" href={`tel:${phone}`} data-call>{t(K.contact.call)}</a></div>}
      </div>
    </Card>
  );
}
