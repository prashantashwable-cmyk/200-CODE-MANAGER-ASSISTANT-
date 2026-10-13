import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, Crown, Timer } from '@phosphor-icons/react';
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, ProgressBar, Screen, ScreenHeader, formatDate, formatINR } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { ContestDetailView, ContestLeaderboardView, ContestListItem, ContestMovementView, ContestRewardView, ContestStandingRow } from '@/data/repository';
import { CLOSING_POLL_MS, CORRECTION_NOTE_DAYS, CLOSING_SOON, LEADERBOARD_KEYS as K, LIVE_POLL_MS, PULL_DISTANCE, SHOWN_TOP, timeLeft } from './rewards-leaderboard.types';
import type { ContestMetric, ContestPhase } from './rewards-leaderboard.types';
import { useRewardsLeaderboard } from './useRewardsLeaderboard';
import type { RewardsLeaderboardState } from './useRewardsLeaderboard';

type T = ReturnType<typeof useTranslation>['t'];
const PHASE_TONE: Record<ContestPhase, BadgeTone> = { active: 'success', scheduled: 'accent', closed: 'neutral', ended_early: 'warning' };

/** A figure in the contest's own unit: a count ("5 leads") or rupees. */
const valueText = (t: T, metric: ContestMetric, v: number): string => (metric === 'revenue' ? formatINR(v) : t(K.value[metric as 'leadsCaptured'], { count: v }));
const needText = (t: T, metric: ContestMetric, n: number): string => (metric === 'revenue' ? t(K.need.revenue, { amount: formatINR(n) }) : t(K.need[metric as 'leadsCaptured'], { count: n }));
const rewardText = (t: T, r: ContestRewardView): string => (r.kind === 'cash' ? t(K.stake.cash, { amount: formatINR(r.amount ?? 0) }) : (r.label ?? ''));

function agoText(t: T, ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return s < 5 ? t(K.live.justNow) : s < 60 ? t(K.live.seconds, { count: s }) : s < 5400 ? t(K.live.minutes, { count: Math.floor(s / 60) }) : t(K.live.hours, { count: Math.floor(s / 3600) });
}

/**
 * Screen 165 — Rewards & Gamification Leaderboard. The partner's own view of the contests running now: what is at stake, how long is left, where they stand and how close the next
 * place is. It reads the same standings Admin sees (one repository computation), keeps itself current, and says plainly when a number moved because a record was corrected.
 */
export function RewardsLeaderboardScreen() {
  const { t } = useTranslation();
  const s = useRewardsLeaderboard();
  const [pull, setPull] = useState(0);
  const startY = useRef<number | null>(null);
  if (s.load === 'loading' && !s.data) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="stats" rows={3} /><div className="mt-3"><LoadingState label={t(K.loading)} variant="block" /></div></Screen>;
  if (s.load === 'error' || !s.data) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /></Screen>;
  const d = s.data;
  const admin = s.role === 'admin';
  const onTouchStart = (e: React.TouchEvent) => { if (window.scrollY <= 0) startY.current = e.touches[0].clientY; };
  const onTouchMove = (e: React.TouchEvent) => { if (startY.current !== null) setPull(Math.max(0, Math.min(PULL_DISTANCE * 1.5, e.touches[0].clientY - startY.current))); };
  const onTouchEnd = () => { if (pull >= PULL_DISTANCE) void s.refresh(); startY.current = null; setPull(0); };
  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} data-rewards-leaderboard>
      {(pull > 0 || s.refreshing) && <p className="t-xs t-muted" role="status" style={{ textAlign: 'center' }} data-pull>{s.refreshing ? t(K.refresh.busy) : pull >= PULL_DISTANCE ? t(K.refresh.release) : t(K.refresh.pull)}</p>}
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={admin ? t(K.subtitleAdmin) : t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh disabled={s.refreshing} onClick={() => void s.refresh()}>{t(K.refresh.button)}</Button>} />
        <div className="stack gap-4">
          {d.contests.length > 1 && <Picker d={d} s={s} t={t} />}
          {!d.contests.some((c) => c.phase === 'active') && <None d={d} t={t} />}
          {d.selected && <Contest v={d.selected} s={s} t={t} admin={admin} />}
          {admin && <div className="row gap-2 wrap" style={{ alignItems: 'center' }}><p className="t-xs t-muted" data-admin-note>{t(K.admin.note)}</p><Button size="sm" variant="secondary" data-open-leaderboard onClick={() => s.goTo('/admin/analytics/leaderboard')}>{t(K.admin.leaderboard)}</Button><Button size="sm" variant="secondary" data-open-setup onClick={() => s.goTo('/contest-setup')}>{t('contestSetup.link.open')}</Button></div>}
          <p className="t-xs t-muted" data-placeholder>{t(K.placeholder, { poll: LIVE_POLL_MS / 1000, closing: CLOSING_POLL_MS / 1000, hours: Math.round(CLOSING_SOON / 3_600_000), days: CORRECTION_NOTE_DAYS })}</p>
        </div>
      </Screen>
    </div>
  );
}

function Picker({ d, s, t }: { d: ContestLeaderboardView; s: RewardsLeaderboardState; t: T }) {
  const sel = d.selected?.contest.id;
  return (
    <section className="stack gap-2" data-picker>
      <h2 className="t-sm t-semibold">{t(K.pick.heading)}</h2>
      <div className="row gap-2" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
        {d.contests.map((c: ContestListItem) => (
          <button key={c.id} type="button" className="ds-chip" data-contest-chip={c.id} aria-pressed={sel === c.id} onClick={() => s.pick(c.id)} style={{ flex: '0 0 auto' }}>{c.name} · {t(K.phase[c.phase])}</button>
        ))}
      </div>
    </section>
  );
}

/** No contest is running: a friendly, honest note, with what is coming and the last result when there is one. */
function None({ d, t }: { d: ContestLeaderboardView; t: T }) {
  const { i18n } = useTranslation();
  const next = d.contests.find((c) => c.phase === 'scheduled');
  return (
    <section className="stack gap-2" data-none>
      <EmptyState title={t(K.none.title)} body={t(K.none.body)} />
      {next && <Card><p className="t-sm" data-next-contest>{t(K.none.next, { name: next.name, date: formatDate(next.startsAt, i18n.language) })}</p></Card>}
    </section>
  );
}

function Contest({ v, s, t, admin }: { v: ContestDetailView; s: RewardsLeaderboardState; t: T; admin: boolean }) {
  return (
    <div className="stack gap-4" data-contest={v.contest.id} data-phase={v.contest.phase}>
      <Hero v={v} s={s} t={t} />
      <Stake v={v} t={t} />
      {!admin && v.me && v.contest.phase !== 'scheduled' && <Me v={v} t={t} />}
      {v.contest.phase !== 'scheduled' && <Board v={v} t={t} admin={admin} />}
      {v.contest.phase === 'scheduled' && <Card><p className="t-sm" data-scheduled>{t(K.hero.scheduledBody)}</p></Card>}
      {v.contest.phase !== 'scheduled' && <Changes v={v} t={t} admin={admin} />}
      <Rules v={v} t={t} />
    </div>
  );
}

/* ------------------------------------------------------------------ The contest, its clock, and how fresh the numbers are */

function Hero({ v, s, t }: { v: ContestDetailView; s: RewardsLeaderboardState; t: T }) {
  const { i18n } = useTranslation();
  const c = v.contest;
  const left = timeLeft(c.endsAt, s.now);
  const clock = c.phase === 'active' ? (left.days > 0 ? t(K.hero.timeLeft.days, { days: left.days, hours: left.hours }) : left.hours > 0 ? t(K.hero.timeLeft.hours, { hours: left.hours, minutes: left.minutes }) : t(K.hero.timeLeft.minutes, { minutes: left.minutes })) : c.phase === 'scheduled' ? t(K.hero.starts, { date: formatDate(c.startsAt, i18n.language) }) : t(K.hero.ended, { date: formatDate(c.endedAt ?? c.endsAt, i18n.language) });
  return (
    <Card>
      <div className="stack gap-2" data-hero style={{ borderLeft: '3px solid var(--color-accent-primary)', paddingLeft: 'var(--space-3)' }}>
        <div className="row between wrap" style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
          <span className="row gap-2" style={{ alignItems: 'center' }}><Badge tone={PHASE_TONE[c.phase]}>{t(K.phase[c.phase])}</Badge><span className="t-xs t-muted">{t(K.cohort[c.cohort])} · {t(K.metric[c.metric])}</span></span>
          {c.phase === 'active' && <span className="t-xs t-muted" data-live aria-live="polite">{t(K.live.label)} · {t(K.live.updated, { when: agoText(t, s.now - s.heardAt) })}</span>}
        </div>
        <h2 className="t-lg t-semibold" style={{ fontFamily: 'var(--font-heading, inherit)' }} data-contest-name>{c.name}</h2>
        {c.description && <p className="t-sm">{c.description}</p>}
        <span className="row gap-2 t-semibold" data-clock style={{ alignItems: 'center', fontSize: 'var(--text-xl, 1.4rem)' }}><Timer size={22} aria-hidden="true" style={{ color: 'var(--color-accent-primary)' }} />{clock}</span>
        {v.closingSoon && <p className="t-sm" data-closing-soon style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 'var(--space-3)' }}>{t(K.hero.closingSoon)}</p>}
        {c.phase === 'ended_early' && c.endedReason && <p className="t-sm" data-ended-early>{t(K.hero.endedEarly, { date: formatDate(c.endedAt ?? c.endsAt, i18n.language), reason: c.endedReason })}</p>}
        {v.frozen && <p className="t-xs t-muted" data-frozen>{t(K.hero.frozen)}</p>}
        {s.stale && c.phase === 'active' && <p className="t-xs" role="status" data-stale style={{ color: 'var(--color-warning)' }}>{t(K.live.stale, { when: agoText(t, s.now - s.heardAt) })}</p>}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ What is at stake */

function Stake({ v, t }: { v: ContestDetailView; t: T }) {
  const mine = v.me?.rank ?? 0;
  return (
    <section className="stack gap-2" data-stake>
      <h2 className="t-md t-semibold">{t(K.stake.heading)}</h2>
      {v.contest.rewards.length === 0 ? <Card><p className="t-sm">{t(K.stake.none)}</p></Card> : (
        <div className="grid-auto" style={{ '--min': '180px' } as React.CSSProperties}>
          {v.contest.rewards.map((r) => (
            <Card key={r.rank}>
              <div className="stack gap-1" data-reward={r.rank} data-mine={mine === r.rank ? '1' : '0'} style={mine === r.rank ? { outline: '2px solid var(--color-accent-primary)', outlineOffset: 4, borderRadius: 'var(--radius-md)' } : undefined}>
                <span className="row gap-1 t-semibold" style={{ alignItems: 'center' }}>{r.rank === 1 && <Crown size={18} aria-hidden="true" style={{ color: 'var(--color-accent-primary)' }} />}{t(K.stake.place, { rank: r.rank })}</span>
                <span className="num t-semibold" style={{ fontSize: 'var(--text-xl, 1.4rem)' }}>{rewardText(t, r)}</span>
                {mine === r.rank && <Badge tone="accent">{t(K.stake.yours)}</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}
      <p className="t-xs t-muted">{t(K.stake.note)}</p>
    </section>
  );
}

/* ------------------------------------------------------------------ Where you stand, and how close the next place is */

function Me({ v, t }: { v: ContestDetailView; t: T }) {
  const me = v.me;
  if (!me) return null;
  const m = v.contest.metric;
  if (me.paused) return <Card><p className="t-sm" data-paused style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 'var(--space-3)' }}>{t(K.me.paused)}</p></Card>;
  const closeTo = me.above ? me.value / Math.max(1, me.value + me.above.gap) : 1;
  return (
    <section className="stack gap-2" data-me>
      <h2 className="t-md t-semibold">{t(K.me.heading)}</h2>
      <Card>
        <div className="stack gap-2">
          <div className="row between" style={{ alignItems: 'flex-end', gap: 'var(--space-3)' }}>
            <span className="row gap-2" style={{ alignItems: 'baseline' }}><span className="num t-semibold" data-my-rank style={{ fontSize: 'var(--text-3xl, 2.25rem)', lineHeight: 1 }}>{t(K.me.rank, { rank: me.rank })}</span><span className="t-sm t-muted">{t(K.me.of, { total: me.ofTotal })}</span></span>
            <span className="num t-semibold" data-my-value>{valueText(t, m, me.value)}</span>
          </div>
          {me.rank === 1 ? <p className="t-sm" data-leading>{t(K.me.leading)}</p> : me.reward ? <p className="t-sm" data-in-prize>{t(K.me.inPrize, { reward: rewardText(t, me.reward) })}</p> : null}
          {me.above && (
            <div className="stack gap-1" data-next-up>
              <span className="t-xs t-muted">{t(K.me.passHeading)}</span>
              <ProgressBar value={Math.min(0.99, closeTo)} tone="accent" label={t(K.me.progress, { rank: me.rank - 1 })} />
              <span className="t-sm" data-pass>{t(K.me.pass, { name: me.above.name, need: needText(t, m, me.above.toPass) })}</span>
              {me.above.gap === 0 && <span className="t-xs t-muted" data-tied-note>{t(K.me.tied, { name: me.above.name })}</span>}
            </div>
          )}
          {me.toPrize && me.toPrize.rank < me.rank - 1 && <p className="t-sm" data-to-prize>{t(K.me.prize, { rank: me.toPrize.rank, reward: rewardText(t, me.toPrize.reward), need: needText(t, m, me.toPrize.toPass) })}</p>}
        </div>
      </Card>
    </section>
  );
}

/* ------------------------------------------------------------------ The standings */

function Board({ v, t, admin }: { v: ContestDetailView; t: T; admin: boolean }) {
  const [all, setAll] = useState(false);
  const rows = v.rows;
  const top = rows.slice(0, SHOWN_TOP);
  const mine = rows.find((r) => r.isMe);
  const showMine = !all && mine && mine.rank > SHOWN_TOP;
  const shown = all ? rows : top;
  const between = mine ? mine.rank - SHOWN_TOP - 1 : 0;
  return (
    <section className="stack gap-2" data-board>
      <div className="row between wrap" style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
        <h2 className="t-md t-semibold">{t(K.board.heading)}</h2>
        <span className="t-xs t-muted">{t(K.metric[v.contest.metric])}</span>
      </div>
      {rows.length === 0 ? <Card><p className="t-sm">{t(K.board.empty)}</p></Card> : (
        <div className="stack gap-2" data-rows>
          {shown.map((r) => <StandingRow key={r.userId} r={r} v={v} t={t} />)}
          {showMine && mine && (
            <>
              {between > 0 && <p className="t-xs t-muted" style={{ textAlign: 'center' }} data-gap-marker>{t(K.board.between, { count: between })}</p>}
              <StandingRow r={mine} v={v} t={t} />
            </>
          )}
          {rows.length > SHOWN_TOP && <div><Button size="sm" variant="ghost" data-board-toggle onClick={() => setAll(!all)}>{all ? t(K.board.showTop, { n: SHOWN_TOP }) : t(K.board.showAll)}</Button></div>}
        </div>
      )}
      {admin && v.excludedCount > 0 && <p className="t-xs t-muted" data-excluded>{t(K.rules.excluded, { count: v.excludedCount })}</p>}
    </section>
  );
}

function StandingRow({ r, v, t }: { r: ContestStandingRow; v: ContestDetailView; t: T }) {
  const podium = r.rank <= 3;
  return (
    <Card>
      <div className="row between" data-row={r.userId} data-rank={r.rank} data-me={r.isMe ? '1' : '0'} style={{ alignItems: 'center', gap: 'var(--space-3)', ...(podium ? { borderLeft: '3px solid var(--color-accent-primary)', paddingLeft: 'var(--space-3)' } : r.isMe ? { borderLeft: '3px solid var(--color-accent-secondary)', paddingLeft: 'var(--space-3)' } : {}) }}>
        <span className="row gap-3" style={{ alignItems: 'center', minWidth: 0 }}>
          <span className="num t-semibold" style={{ minWidth: 36, fontSize: podium ? 'var(--text-xl, 1.4rem)' : undefined, color: podium ? 'var(--color-accent-primary)' : undefined }}>{r.rank}</span>
          <span className="stack" style={{ minWidth: 0 }}>
            <strong className="t-sm" style={{ overflowWrap: 'anywhere' }}>{r.isMe ? `${r.name} · ${t(K.board.you)}` : r.name}</strong>
            <span className="row gap-1 wrap t-xs t-muted">
              {r.reward && <span>{t(K.board.reward, { reward: rewardText(t, r.reward) })}</span>}
              {r.tiedWithNext && <span data-tied>{t(K.board.tied)}</span>}
              {r.correctedAt && <Badge tone="warning">{t(K.board.corrected)}</Badge>}
            </span>
          </span>
        </span>
        <span className="num t-semibold" style={{ textAlign: 'right' }}>{valueText(t, v.contest.metric, r.value)}</span>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ Corrections, in the open */

function moveText(t: T, m: ContestMovementView, admin: boolean): string {
  if (admin) {
    const base = t(m.kind === 'value' ? K.changes.admin.value : K.changes.admin.rank, { name: m.userName ?? '', from: m.from, to: m.to });
    return m.correction ? `${base} (${t(K.changes.admin.correction)})` : base;
  }
  if (m.kind === 'value') return t(m.correction ? K.changes.value.correction : K.changes.value.up, { from: m.from, to: m.to });
  return t(m.correction ? K.changes.rank.correction : m.to < m.from ? K.changes.rank.up : K.changes.rank.down, { from: m.from, to: m.to });
}

function Changes({ v, t, admin }: { v: ContestDetailView; t: T; admin: boolean }) {
  const { i18n } = useTranslation();
  return (
    <section className="stack gap-2" data-changes>
      <h2 className="t-md t-semibold">{t(K.changes.heading)}</h2>
      <Card>
        <div className="stack gap-2">
          {v.movements.length === 0 ? <p className="t-sm t-muted" data-changes-none>{t(K.changes.none)}</p> : v.movements.map((m) => (
            <p key={m.id} className="t-sm" data-change={m.kind} data-correction={m.correction ? '1' : '0'}><span className="t-xs t-muted">{formatDate(m.at, i18n.language)}</span> · {moveText(t, m, admin)}</p>
          ))}
          <p className="t-xs t-muted">{t(K.changes.note)}</p>
        </div>
      </Card>
    </section>
  );
}

/* ------------------------------------------------------------------ How it is counted */

function Rules({ v, t }: { v: ContestDetailView; t: T }) {
  const { i18n } = useTranslation();
  const c = v.contest;
  return (
    <section className="stack gap-2" data-rules>
      <h2 className="t-md t-semibold">{t(K.rules.heading)}</h2>
      <Card>
        <div className="stack gap-1">
          <p className="t-sm">{t(K.rules.window, { from: formatDate(c.startsAt, i18n.language), to: formatDate(c.endedAt ?? c.endsAt, i18n.language) })}</p>
          <p className="t-sm">{t(K.rules[c.metric])}</p>
          <p className="t-xs t-muted">{t(K.rules.tiebreak)}</p>
          <p className="t-xs t-muted">{t(K.rules.same)}</p>
        </div>
      </Card>
    </section>
  );
}
