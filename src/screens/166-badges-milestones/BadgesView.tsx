import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, Copy, CurrencyInr, DownloadSimple, Flag, GraduationCap, Handshake, Hourglass, ShareNetwork, Trophy, Wrench } from '@phosphor-icons/react';
import { Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, LoadingState, ProgressBar, Screen, ScreenHeader, Sheet, formatDate, formatINR, useToast } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { BadgeCollectionView, BadgeEntryView, BadgeNextView } from '@/data/repository';
import { portfolioHtml, portfolioText } from '@/features/rewards/portfolio';
import type { PortfolioInput } from '@/features/rewards/portfolio';
import { themeTokens } from '@/features/training/reference';
import { BADGES_KEYS as K, CATEGORY_FILTERS, NEW_DAYS, PULL_DISTANCE, RARITY_BANDS, RARITY_MIN_BASE, isPrestige } from './badges-milestones.types';
import type { BadgeIcon, BadgeMetric, RarityTier } from './badges-milestones.types';
import { useBadges } from './useBadges';
import type { BadgesState } from './useBadges';

type T = ReturnType<typeof useTranslation>['t'];
const ICONS: Record<BadgeIcon | 'cert', typeof Flag> = { flag: Flag, target: Flag, handshake: Handshake, currency: CurrencyInr, wrench: Wrench, trophy: Trophy, hourglass: Hourglass, seal: GraduationCap, cert: GraduationCap };
const RARITY_TONE: Record<RarityTier, BadgeTone> = { common: 'neutral', uncommon: 'accent', rare: 'warning', epic: 'success' };

const nameOf = (t: T, e: { badgeId: string | null; moduleCode: string | null }): string => (e.badgeId ? t(`badges.badge.${e.badgeId}.name`) : t(`trainingLib.content.${(e.moduleCode ?? '').toLowerCase()}.title`, { defaultValue: e.moduleCode ?? '' }));
const descOf = (t: T, e: { badgeId: string | null }): string => (e.badgeId ? t(`badges.badge.${e.badgeId}.desc`) : t(K.criteria.cert));
const criteriaText = (t: T, metric: BadgeMetric | null, n: number): string => {
  if (!metric) return t(K.criteria.cert);
  if (metric === 'revenue') return t(K.criteria.revenue, { amount: formatINR(n) });
  return t(K.criteria[metric as 'leadsCaptured'], { count: n });
};
const leftText = (t: T, metric: BadgeMetric, remaining: number): string => (metric === 'revenue' ? t(K.next.left.revenue, { amount: formatINR(remaining) }) : t(K.next.left[metric as 'leadsCaptured'], { count: remaining }));

function Footer({ children }: { children: ReactNode }) {
  return <div className="row gap-2" data-sheet-actions style={{ position: 'sticky', bottom: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: 'var(--space-2) 0', marginTop: 'var(--space-3)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>{children}</div>;
}
function Icon({ icon, size = 28 }: { icon: BadgeIcon | 'cert'; size?: number }) {
  const C = ICONS[icon];
  return <C size={size} aria-hidden="true" style={{ color: 'var(--color-accent-primary)' }} />;
}
function RarityLine({ r, t }: { r: BadgeEntryView['rarity']; t: T }) {
  return (
    <span className="row gap-1 wrap" style={{ alignItems: 'center' }}>
      {r.tier ? <Badge tone={RARITY_TONE[r.tier]}>{t(K.card.rarity[r.tier])}</Badge> : null}
      {isPrestige(r) && <span className="t-xs t-semibold" style={{ color: 'var(--color-accent-primary)' }}>{t(K.card.prestige)}</span>}
    </span>
  );
}

/**
 * Screen 166 — Badges & Milestones. One personal collection from three different sources (work milestones, training certifications, time with AIEC), with progress toward the
 * next ones read from live numbers and rarity worked out from who actually holds each badge today. A badge already earned is honoured under the rules of its day.
 */
export function BadgesScreen() {
  const { t } = useTranslation();
  const s = useBadges();
  const [pull, setPull] = useState(0);
  const startY = useRef<number | null>(null);
  const [share, setShare] = useState(false);
  if (s.load === 'loading' && !s.data) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="stats" rows={3} /><div className="mt-3"><LoadingState label={t(K.loading)} variant="block" /></div></Screen>;
  if (s.load === 'error' || !s.data) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /></Screen>;
  const d = s.data;
  const onTouchStart = (e: React.TouchEvent) => { if (window.scrollY <= 0) startY.current = e.touches[0].clientY; };
  const onTouchMove = (e: React.TouchEvent) => { if (startY.current !== null) setPull(Math.max(0, Math.min(PULL_DISTANCE * 1.5, e.touches[0].clientY - startY.current))); };
  const onTouchEnd = () => { if (pull >= PULL_DISTANCE) void s.refresh(); startY.current = null; setPull(0); };
  const none = d.earned.length === 0;
  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} data-badges>
      {(pull > 0 || s.refreshing) && <p className="t-xs t-muted" role="status" style={{ textAlign: 'center' }} data-pull>{s.refreshing ? t(K.refresh.busy) : pull >= PULL_DISTANCE ? t(K.refresh.release) : t(K.refresh.pull)}</p>}
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh disabled={s.refreshing} onClick={() => void s.refresh()}>{t(K.refresh.button)}</Button>} />
        <div className="stack gap-4">
          {none ? <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} /> : <Hero d={d} s={s} t={t} onShare={() => setShare(true)} />}
          {none && <Next d={d} s={s} t={t} first />}
          {!none && <Collection d={d} s={s} t={t} />}
          {!none && <Next d={d} s={s} t={t} first={false} />}
          <p className="t-xs t-muted" data-placeholder>{t(K.placeholder, { common: RARITY_BANDS[0].atLeast, uncommon: RARITY_BANDS[1].atLeast, rare: RARITY_BANDS[2].atLeast, min: RARITY_MIN_BASE, days: NEW_DAYS })}</p>
        </div>
      </Screen>
      <Detail d={d} s={s} t={t} />
      <ShareSheet open={share} onClose={() => setShare(false)} d={d} s={s} t={t} />
    </div>
  );
}

/* ------------------------------------------------------------------ The headline */

function Hero({ d, s, t, onShare }: { d: BadgeCollectionView; s: BadgesState; t: T; onShare: () => void }) {
  void s;
  const rarest = d.earned.find((e) => e.id === d.summary.rarestId);
  return (
    <Card>
      <div className="stack gap-2" data-hero style={{ borderLeft: '3px solid var(--color-accent-primary)', paddingLeft: 'var(--space-3)' }}>
        <span className="num t-semibold" data-total style={{ fontSize: 'var(--text-3xl, 2.25rem)', lineHeight: 1.1 }}>{t(K.hero.total, { count: d.summary.total })}</span>
        <span className="t-sm t-muted">{t(K.hero.byCategory, { performance: d.summary.performance, training: d.summary.training, tenure: d.summary.tenure })}</span>
        {d.summary.newCount > 0 && <span className="t-sm t-semibold" data-new-count style={{ color: 'var(--color-accent-primary)' }}>{t(K.hero.new, { count: d.summary.newCount })}</span>}
        {rarest && <span className="t-sm" data-rarest>{t(K.hero.rarest, { name: nameOf(t, rarest) })}</span>}
        <div><Button size="sm" variant="secondary" icon={<ShareNetwork size={16} />} data-share-open onClick={onShare}>{t(K.share.button)}</Button></div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ The collection */

function Collection({ d, s, t }: { d: BadgeCollectionView; s: BadgesState; t: T }) {
  const counts = { all: d.earned.length, performance: d.summary.performance, training: d.summary.training, tenure: d.summary.tenure };
  const list = d.earned.filter((e) => s.category === 'all' || e.category === s.category);
  return (
    <section className="stack gap-2" data-collection>
      <h2 className="t-md t-semibold">{t(K.earnedHeading)}</h2>
      <div className="row gap-2" style={{ overflowX: 'auto', flexWrap: 'nowrap' }} data-filters>
        {CATEGORY_FILTERS.map((c) => <span key={c} data-cat-chip={c} style={{ flex: '0 0 auto' }}><Chip pressed={s.category === c} onClick={() => s.setCategory(c)}>{t(K.cat[c])} · {counts[c]}</Chip></span>)}
      </div>
      {list.length === 0 ? <Card><p className="t-sm" data-category-empty>{t(K.noneInCategory)}</p></Card> : (
        <div className="grid-auto" style={{ '--min': '260px' } as React.CSSProperties} data-grid>{list.map((e) => <BadgeCard key={e.id} e={e} s={s} t={t} />)}</div>
      )}
    </section>
  );
}

function BadgeCard({ e, s, t }: { e: BadgeEntryView; s: BadgesState; t: T }) {
  const { i18n } = useTranslation();
  return (
    <Card onClick={() => s.openBadge(e.id)}>
      <div className="stack gap-2" data-badge={e.id} data-category={e.category} data-rarity={e.rarity.tier ?? 'none'} style={{ cursor: 'pointer', ...(isPrestige(e.rarity) ? { borderTop: '3px solid var(--color-accent-primary)', paddingTop: 'var(--space-2)' } : {}) }}>
        <div className="row between" style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}>
          <Icon icon={e.icon} />
          <span className="row gap-1">{e.isNew && <Badge tone="success">{t(K.card.new)}</Badge>}<Badge tone="neutral">{t(K.cat[e.category])}</Badge></span>
        </div>
        <strong className="t-sm" style={{ overflowWrap: 'anywhere' }}>{nameOf(t, e)}</strong>
        <span className="t-xs t-muted">{t(K.card.earned, { date: formatDate(e.earnedAt, i18n.language) })}</span>
        <RarityLine r={e.rarity} t={t} />
        {e.earnedUnderEarlier && <span className="t-xs t-muted" data-earlier>{t(K.card.earlier)}</span>}
        {e.certStatus && e.certStatus !== 'valid' && <span className="t-xs" data-cert-status>{t(K.card.cert[e.certStatus])}</span>}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ What is nearest */

function Next({ d, s, t, first }: { d: BadgeCollectionView; s: BadgesState; t: T; first: boolean }) {
  return (
    <section className="stack gap-2" data-next>
      <div className="stack gap-1"><h2 className="t-md t-semibold">{first ? t(K.next.firstHeading) : t(K.next.heading)}</h2><p className="t-sm">{first ? t(K.next.firstBody) : t(K.next.body)}</p></div>
      {d.next.length === 0 ? <Card><p className="t-sm" data-next-none>{t(K.next.none)}</p></Card> : (
        <div className="grid-auto" style={{ '--min': '260px' } as React.CSSProperties}>{d.next.map((n) => <NextCard key={n.id} n={n} s={s} t={t} />)}</div>
      )}
    </section>
  );
}

function NextCard({ n, s, t }: { n: BadgeNextView; s: BadgesState; t: T }) {
  const leftLine = n.kind === 'metric' && n.metric ? leftText(t, n.metric, n.progress.remaining) : n.kind === 'test' ? t(K.next.test) : t(K.next.lessons, { done: n.progress.current, total: Math.max(0, n.progress.target - 1) });
  const route = n.route ?? (n.metric === 'contestWins' ? '/rewards-leaderboard' : null);
  return (
    <Card>
      <div className="stack gap-2" data-next-badge={n.id} data-kind={n.kind}>
        <div className="row between" style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}><Icon icon={n.icon} size={24} /><Badge tone="neutral">{t(K.cat[n.category])}</Badge></div>
        <strong className="t-sm" style={{ overflowWrap: 'anywhere' }}>{nameOf(t, n)}</strong>
        {n.metric !== 'tenureDays' && n.metric !== null && <span className="t-xs t-muted">{descOf(t, n)}</span>}
        <ProgressBar value={Math.min(0.99, n.progress.pct)} tone="accent" label={t(K.next.of, { current: n.metric === 'revenue' ? formatINR(n.progress.current) : n.progress.current, target: n.metric === 'revenue' ? formatINR(n.progress.target) : n.progress.target })} />
        <span className="t-sm" data-left>{leftLine}</span>
        <RarityLine r={n.rarity} t={t} />
        {route && <div><Button size="sm" variant="secondary" data-next-open={n.id} onClick={() => s.goTo(route)}>{n.route ? t(K.next.open) : t(K.next.contest)}</Button></div>}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ One badge */

function Detail({ d, s, t }: { d: BadgeCollectionView; s: BadgesState; t: T }) {
  const { i18n } = useTranslation();
  const e = d.earned.find((x) => x.id === s.badge) ?? null;
  return (
    <Sheet open={!!e} onClose={() => s.openBadge(null)} title={t(K.detail.title)} closeLabel={t(K.close)}>
      {e && (
        <div className="stack gap-3" data-detail={e.id}>
          <div className="row gap-3" style={{ alignItems: 'center' }}>
            <Icon icon={e.icon} size={40} />
            <span className="stack"><strong className="t-md" style={{ overflowWrap: 'anywhere' }}>{nameOf(t, e)}</strong><span className="t-xs t-muted">{t(K.cat[e.category])} · {t(K.card.earned, { date: formatDate(e.earnedAt, i18n.language) })}</span></span>
          </div>
          <p className="t-sm">{descOf(t, e)}</p>
          {e.threshold !== null && e.metric && (
            <section className="stack gap-1" data-how>
              <h3 className="t-sm t-semibold">{t(K.detail.how)}</h3>
              <p className="t-sm">{e.earnedUnderEarlier ? t(K.detail.earnedUnder, { criteria: criteriaText(t, e.metric, e.threshold) }) : criteriaText(t, e.metric, e.threshold)}</p>
              {e.earnedUnderEarlier && e.currentThreshold !== null && <p className="t-sm" data-now-asks>{t(K.detail.nowAsks, { criteria: criteriaText(t, e.metric, e.currentThreshold) })}</p>}
              {e.earnedUnderEarlier && <p className="t-xs t-muted" data-honoured>{t(K.detail.honoured)}</p>}
              <p className="t-xs t-muted">{t(K.detail.metric)}</p>
            </section>
          )}
          {e.certCode && (
            <section className="stack gap-1" data-cert>
              <p className="t-sm">{t(K.detail.cert.code, { code: e.certCode })}</p>
              {e.earnedUnderEarlier && <p className="t-xs t-muted" data-honoured>{t(K.detail.honoured)}</p>}
              <p className="t-xs t-muted">{t(K.detail.cert.note)}</p>
              <div><Button size="sm" variant="secondary" data-open-certs onClick={() => s.goTo('/certifications')}>{t(K.detail.cert.open)}</Button></div>
            </section>
          )}
          <section className="stack gap-1" data-rarity>
            <h3 className="t-sm t-semibold">{t(K.detail.rarityHeading)}</h3>
            <RarityLine r={e.rarity} t={t} />
            <p className="t-sm">{e.rarity.tier ? t(K.card.rarity.count, { holders: e.rarity.holders, base: e.rarity.base, pct: e.rarity.pct }) : t(K.card.rarity.small, { holders: e.rarity.holders, base: e.rarity.base })}</p>
            <p className="t-xs t-muted">{t(K.detail.rarityNote)}</p>
          </section>
        </div>
      )}
    </Sheet>
  );
}

/* ------------------------------------------------------------------ Sharing: the partner's own choice */

function portfolioOf(d: BadgeCollectionView, selected: string[], t: T, lang: string): PortfolioInput {
  const picked = d.earned.filter((e) => selected.includes(e.id));
  return {
    lang, brand: 'ALL INDIA ELEVATORS COMPANY', heading: t(K.share.pageHeading), holderLabel: t(K.share.holder), holder: d.person.name, footer: t(K.share.footer), tokens: themeTokens(),
    badges: picked.map((e) => ({ name: nameOf(t, e), detail: descOf(t, e), earned: t(K.share.earnedOn, { date: formatDate(e.earnedAt, lang) }), rarity: e.rarity.tier ? t(K.card.rarity[e.rarity.tier]) : null })),
  };
}

function ShareSheet({ open, onClose, d, s, t }: { open: boolean; onClose: () => void; d: BadgeCollectionView; s: BadgesState; t: T }) {
  const { i18n } = useTranslation();
  const toast = useToast();
  const chosen = s.selected;
  const input = () => portfolioOf(d, chosen, t, i18n.language);
  const download = () => {
    if (chosen.length === 0) { toast.push(t(K.share.none)); return; }
    const blob = new Blob([portfolioHtml(input())], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aiec-badges-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.push(t(K.share.downloaded));
  };
  const copy = async () => {
    if (chosen.length === 0) { toast.push(t(K.share.none)); return; }
    const text = portfolioText(input());
    try { await navigator.clipboard.writeText(text); toast.push(t(K.share.copied)); } catch { toast.push(text); }
  };
  const nativeShare = async () => {
    if (chosen.length === 0) { toast.push(t(K.share.none)); return; }
    try { await navigator.share({ title: t(K.share.pageHeading), text: portfolioText(input()) }); } catch { /* cancelled */ }
  };
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  return (
    <Sheet open={open} onClose={onClose} title={t(K.share.title)} closeLabel={t(K.close)}>
      <div className="stack gap-3" data-share-sheet>
        <p className="t-sm">{t(K.share.body)}</p>
        <div className="stack gap-2">
          {d.earned.map((e) => <div key={e.id} data-showcase={e.id}><Checkbox checked={chosen.includes(e.id)} onChange={(v) => s.toggleShown(e.id, v)} label={`${nameOf(t, e)} · ${formatDate(e.earnedAt, i18n.language)}`} /></div>)}
        </div>
        <Footer>
          <Button size="sm" variant="secondary" icon={<Copy size={16} />} data-share-copy onClick={() => void copy()}>{t(K.share.copy)}</Button>
          {canShare && <Button size="sm" variant="secondary" icon={<ShareNetwork size={16} />} data-share-native onClick={() => void nativeShare()}>{t(K.share.native)}</Button>}
          <Button size="sm" icon={<DownloadSimple size={16} />} data-share-download onClick={download}>{t(K.share.download)}</Button>
        </Footer>
      </div>
    </Sheet>
  );
}
