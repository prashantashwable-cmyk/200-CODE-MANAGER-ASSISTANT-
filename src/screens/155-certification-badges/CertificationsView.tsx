import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CaretLeft, CloudSlash, DownloadSimple, GraduationCap, Medal, Timer, TrendUp } from '@phosphor-icons/react';
import { Avatar, Badge, Button, Card, EmptyState, ErrorState, LoadingState, ProgressBar, Screen, ScreenHeader, Toggle, formatDate } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { CertBadgeView, CertNextStep, CertStandingRow } from '@/data/repository';
import { credentialHtml } from '@/features/training/credential';
import { themeTokens } from '@/features/training/reference';
import { CERT_KEYS as K } from './certifications.types';
import { useCertifications } from './useCertifications';
import type { CertificationsState } from './useCertifications';

type T = ReturnType<typeof useTranslation>['t'];
const STATUS_TONE: Record<CertBadgeView['status'], BadgeTone> = { valid: 'success', expiring: 'warning', grace: 'warning', expired: 'warning', superseded: 'neutral', retired: 'neutral' };
const moduleTitle = (t: T, code: string) => t(`trainingLib.content.${code.toLowerCase()}.title`, { defaultValue: code });
const KIND_ICON: Record<CertNextStep['kind'], ReactNode> = { renew: <Timer size={20} aria-hidden="true" />, test: <Medal size={20} aria-hidden="true" />, lessons: <GraduationCap size={20} aria-hidden="true" /> };

/**
 * Screen 155 — Certification Badge & Progress. A calm, encouraging record of what a partner is certified in, in the same recognition-not-surveillance tone
 * as the surveyor's performance screen: each certification with when it was earned and when it ends, what to do next, where they stand among peers
 * (never a requirement, and they can step out of it), and a credential to keep. It reads the same badges that decide eligibility for work.
 */
export function CertificationsScreen() {
  const { t } = useTranslation();
  const s = useCertifications();
  const v = s.view;
  if (s.status === 'loading' && !v) return <Screen width="default"><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="block" /></Screen>;
  if (s.status === 'error' || !v) return <Screen width="default"><ScreenHeader title={t(K.title)} /><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} /></Screen>;
  const latest = v.badges.filter((b) => b.latest);
  const history = v.badges.filter((b) => !b.latest);
  return (
    <Screen width="default">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<CaretLeft size={14} />} onClick={s.toLibrary}>{t('trainingLib.title')}</Button>} />
      {s.fromCache && <p className="t-sm row gap-2" role="status" data-offline-banner style={{ alignItems: 'center', color: 'var(--color-warning)' }}><CloudSlash size={16} aria-hidden="true" /> {t('assessment.rules.offline')}</p>}
      <div className="stack gap-4">
        <Hero s={s} t={t} />
        <NextSteps s={s} t={t} />
        <section className="stack gap-2" data-badges>
          <h2 className="t-lg">{t(K.badges.heading)}</h2>
          {latest.length === 0 ? (
            <EmptyState icon={<Medal size={28} />} title={t(K.empty.title)} body={t(K.empty.body)} actionLabel={t(K.empty.action)} onAction={s.toLibrary} />
          ) : (
            <div className="grid-auto" style={{ '--min': '320px', alignItems: 'start' } as React.CSSProperties}>
              {latest.map((b, i) => <BadgeCard key={b.id} b={b} s={s} t={t} index={i} name={v.person.name} />)}
            </div>
          )}
          {history.length > 0 && (
            <details data-history>
              <summary className="t-sm" style={{ cursor: 'pointer' }}>{t(K.badges.earlier, { count: history.length })}</summary>
              <p className="t-xs t-muted mt-2">{t(K.badges.earlierHint)}</p>
              <div className="grid-auto mt-2" style={{ '--min': '320px', alignItems: 'start' } as React.CSSProperties}>
                {history.map((b, i) => <BadgeCard key={b.id} b={b} s={s} t={t} index={i} name={v.person.name} />)}
              </div>
            </details>
          )}
        </section>
        <Standing s={s} t={t} />
      </div>
    </Screen>
  );
}

function Hero({ s, t }: { s: CertificationsState; t: T }) {
  const v = s.view as NonNullable<CertificationsState['view']>;
  const sm = v.summary;
  return (
    <Card>
      <div className="stack gap-2" data-hero>
        <span className="t-xs t-muted">{t(K.hero.heading)}</span>
        <div className="row gap-3" style={{ alignItems: 'baseline' }}>
          <span className="t-display" data-held style={{ fontSize: 'var(--text-3xl, 2.5rem)', lineHeight: 1, color: 'var(--color-accent-primary)' }}>{sm.current}</span>
          <span className="t-sm">{t(K.hero.held, { count: sm.current })}</span>
        </div>
        {sm.required > 0 ? (
          <>
            <ProgressBar value={sm.requiredHeld / sm.required} tone={sm.requiredHeld === sm.required ? 'success' : 'accent'} label={t(K.hero.heading)} />
            <span className="t-sm" data-progress>{sm.requiredHeld === sm.required ? t(K.hero.allHeld) : t(K.hero.progress, { held: sm.requiredHeld, total: sm.required })}</span>
          </>
        ) : <span className="t-sm t-muted">{t(K.hero.none)}</span>}
        <div className="row gap-2 wrap">
          {sm.expiring > 0 && <Badge tone="warning">{t(K.hero.expiring, { count: sm.expiring })}</Badge>}
          {sm.expired > 0 && <Badge tone="warning">{t(K.hero.expired, { count: sm.expired })}</Badge>}
          {sm.earlier > 0 && <Badge tone="neutral">{t(K.hero.earlier, { count: sm.earlier })}</Badge>}
        </div>
      </div>
    </Card>
  );
}

function NextSteps({ s, t }: { s: CertificationsState; t: T }) {
  const { i18n } = useTranslation();
  const steps = (s.view as NonNullable<CertificationsState['view']>).nextSteps;
  return (
    <section className="stack gap-2" data-next>
      <div className="row between gap-2" style={{ alignItems: 'center' }}>
        <h2 className="t-lg">{t(K.next.heading)}</h2>
        {steps.some((n) => n.kind === 'renew') && <Button size="sm" variant="ghost" data-refreshers onClick={() => s.goto('/refreshers')}>{t(K.badge.refreshers)}</Button>}
      </div>
      {steps.length === 0 ? <Card><p className="t-sm" data-next-none>{t(K.next.none)}</p></Card> : steps.map((n) => (
        <Card key={`${n.kind}-${n.moduleId}`}>
          <div className="row gap-3" data-next-step={n.kind} data-module={n.moduleCode} style={{ alignItems: 'center' }}>
            <span aria-hidden="true" style={{ color: 'var(--color-accent-secondary)' }}>{KIND_ICON[n.kind]}</span>
            <span className="stack grow" style={{ minWidth: 0 }}>
              <strong className="t-sm">{t(K.next.kind[n.kind], { module: moduleTitle(t, n.moduleCode) })}</strong>
              <span className="t-xs t-muted">{t(K.next.because[n.because], { date: n.expiresAt ? formatDate(n.expiresAt, i18n.language) : '' })}</span>
            </span>
            <Button size="sm" variant={n.because === 'blocks_jobs' || n.because === 'expired' ? 'primary' : 'secondary'} icon={<ArrowRight size={14} />} data-go onClick={() => s.goto(n.route)}>{t(K.next.go)}</Button>
          </div>
        </Card>
      ))}
    </section>
  );
}

function download(b: CertBadgeView, name: string, t: T, lang: string) {
  const html = credentialHtml({
    lang,
    brand: t(K.credential.brand),
    heading: t(K.credential.heading),
    holder: name,
    holderLabel: t(K.credential.holder),
    lines: [
      { label: t(K.credential.module), value: moduleTitle(t, b.moduleCode) },
      { label: t(K.credential.earned), value: formatDate(b.issuedAt, lang) },
      { label: t(K.credential.valid), value: b.expiresAt ? formatDate(b.expiresAt, lang) : t(K.credential.noExpiry) },
      { label: t(K.credential.version), value: String(b.version) },
      { label: t(K.credential.score), value: `${b.score}%` },
    ],
    code: b.code,
    codeLabel: t(K.credential.code),
    status: t(K.status[b.status]),
    footer: t(K.credential.footer),
    tokens: themeTokens(),
  });
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${b.code.toLowerCase()}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** One certification: the medal, what it is, when it was earned and when it ends, in the tone of a recognition rather than a ledger entry. */
function BadgeCard({ b, s, t, index, name }: { b: CertBadgeView; s: CertificationsState; t: T; index: number; name: string }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const muted = b.status === 'superseded' || b.status === 'retired' || !b.latest;
  return (
    <Card riseIndex={Math.min(index, 8)}>
      <div className="stack gap-2" data-badge={b.moduleCode} data-status={b.status} data-latest={b.latest ? '1' : '0'}>
        <div className="row gap-3" style={{ alignItems: 'center' }}>
          <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 48, height: 48, borderRadius: '50%', flex: '0 0 auto', border: `2px solid ${muted ? 'var(--color-border)' : b.status === 'valid' ? 'var(--color-accent-primary)' : 'var(--color-warning)'}`, color: muted ? 'var(--color-text-secondary)' : 'var(--color-accent-primary)' }}>
            <Medal size={26} weight={muted ? 'regular' : 'fill'} />
          </span>
          <span className="stack grow" style={{ minWidth: 0 }}>
            <strong className="t-md" style={{ overflowWrap: 'anywhere' }}>{moduleTitle(t, b.moduleCode)}</strong>
            <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
              <Badge tone={STATUS_TONE[b.status]}>{t(K.status[b.status])}</Badge>
              {b.gatesJobAssignment && <span className="t-xs t-muted">{t(K.badge.gates)}</span>}
            </span>
          </span>
        </div>
        <p className="t-sm">{t(K.badge.earned, { date: formatDate(b.issuedAt, lang) })} · {t(K.badge.score, { score: b.score })}</p>
        <p className="t-sm" data-validity>
          {b.expiresAt ? t(K.badge.validUntil, { date: formatDate(b.expiresAt, lang) }) : t(K.badge.noExpiry)}
          {b.daysLeft !== null && b.status !== 'superseded' && b.status !== 'retired' && b.status !== 'grace' && <span className="t-xs t-muted"> · {b.daysLeft >= 0 ? t(K.badge.daysLeft, { count: b.daysLeft }) : t(K.badge.daysAgo, { count: Math.abs(b.daysLeft) })}</span>}
        </p>
        {b.status === 'expiring' && <p className="t-xs" data-note="expiring">{t(K.badge.expiringNote)}</p>}
        {b.status === 'grace' && <p className="t-xs" data-note="grace" style={{ color: 'var(--color-warning)' }}>{t(K.badge.graceNote, { date: b.eligibleUntil ? formatDate(b.eligibleUntil, lang) : '' })}</p>}
        {b.status === 'expired' && <p className="t-xs" data-note="expired" style={{ color: 'var(--color-warning)' }}>{t(K.badge.lapsedNote)}</p>}
        {b.status === 'superseded' && <p className="t-xs t-muted" data-note="superseded">{t(K.badge.earlierStandard, { version: b.version })}</p>}
        {b.status === 'retired' && <p className="t-xs t-muted" data-note="retired">{t(K.badge.retiredStandard)}</p>}
        {b.renewedFromId && <p className="t-xs t-muted">{t(K.badge.renewed)}</p>}
        <p className="t-xs t-muted" data-code>{t(K.badge.code, { code: b.code })} · {t(K.badge.version, { version: b.version })}</p>
        <div className="row gap-2 wrap">
          <Button size="sm" variant="secondary" icon={<DownloadSimple size={16} />} data-download onClick={() => download(b, name, t, lang)}>{t(K.badge.download)}</Button>
          {b.renewable && <Button size="sm" data-renew onClick={() => s.toAssessment(b.moduleId)}>{t(K.badge.renew)}</Button>}
        </div>
      </div>
    </Card>
  );
}

/** Where the person stands among peers of their role: top few with real weight on the numeral, their own row always shown, and a way to step out of it. */
function Standing({ s, t }: { s: CertificationsState; t: T }) {
  const v = s.view as NonNullable<CertificationsState['view']>;
  const st = v.standing;
  if (!st) return null;
  return (
    <section className="stack gap-2" data-standing>
      <h2 className="t-lg">{t(K.standing.heading, { role: t(K.hero.role[st.cohort]) })}</h2>
      <p className="t-sm t-muted">{t(K.standing.body)}</p>
      {!st.enough ? (
        <Card><p className="t-sm" data-standing-none>{t(K.standing.notEnough, { count: 3 })}</p></Card>
      ) : (
        <Card>
          <div className="stack gap-1" data-standing-list>
            {st.rows.map((r, i) => <StandingRow key={`${r.rank}-${r.name ?? 'x'}-${i}`} r={r} t={t} gap={r.pinned} />)}
            <p className="t-xs t-muted" data-your-place>{t(K.standing.yourPlace, { rank: st.rank, total: st.total })} · {t(K.standing.encouragement)}</p>
          </div>
        </Card>
      )}
      <Card>
        <div data-visibility><Toggle checked={!v.hidden} disabled={s.busy} onChange={(on) => void s.setHidden(!on)} label={t(K.standing.toggle)} description={t(K.standing.toggleHint)} /></div>
      </Card>
    </section>
  );
}

function StandingRow({ r, t, gap }: { r: CertStandingRow; t: T; gap: boolean }) {
  const top = r.rank <= 3;
  const label = r.self ? t(K.standing.you) : r.name ?? t(K.standing.anon);
  return (
    <>
      {gap && <span className="t-xs t-muted" aria-hidden="true" style={{ paddingLeft: 'var(--space-4)' }}>⋮</span>}
      <div className="row gap-3" data-row-rank={r.rank} data-self={r.self ? '1' : '0'} style={{ alignItems: 'center', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md, 12px)', border: `1px solid ${top ? 'var(--color-accent-primary)' : r.self ? 'var(--color-border)' : 'transparent'}`, background: r.self ? 'var(--color-bg)' : 'transparent' }}>
        <span className="t-display" style={{ width: 36, textAlign: 'center', fontSize: top ? 'var(--text-2xl, 1.75rem)' : 'var(--text-lg)', color: top ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)', lineHeight: 1 }}>{r.rank}</span>
        <Avatar name={r.name ?? '?'} />
        <span className="stack grow" style={{ minWidth: 0 }}>
          <strong className="t-sm">{label}{r.self && r.name ? ` · ${r.name}` : ''}</strong>
          <span className="t-xs t-muted">{t(K.standing.metric, { count: r.certifications })}</span>
        </span>
        {r.recent > 0 && <span className="row gap-1 t-xs" style={{ alignItems: 'center', color: 'var(--color-success)' }}><TrendUp size={14} aria-hidden="true" />{t(K.standing.recent, { count: r.recent })}</span>}
      </div>
    </>
  );
}
