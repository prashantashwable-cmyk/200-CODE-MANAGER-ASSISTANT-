import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CaretRight, Check, Medal, Warning, X } from '@phosphor-icons/react';
import { AscensionLine, Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, StatTile, Tabs, TextArea, formatDate } from '@/design-system';
import type { AscensionStep } from '@/design-system';
import type { PartnerTierDetailView, PartnerTierRowView, TierLadderRowView } from '@/data/repository';
import type { TierCriteriaVersion } from '@/data/types';
import type { CriterionResult } from '@/features/partners/tiers';
import { DEFER_MAX_DAYS, EFFECTIVE_MAX_DAYS, FIELD_ROLES, FILTERS, OUTCOMES, REASON_MIN, ROLE_FILTERS, TABS, TIER_KEYS as K, draftKey, criteriaDraftKey, PAYMENT_TERMS_PATH } from './partner-tiers.types';
import type { Filter, Metric, RoleFilter, Tab, TierRole } from './partner-tiers.types';
import { usePartnerTiers } from './usePartnerTiers';
import type { PartnerTiersState } from './usePartnerTiers';

type T = ReturnType<typeof useTranslation>['t'];
type Tiers = TierCriteriaVersion['tiers'];
const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;
const problemKey = (code?: string | null) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const tierName = (t: T, role: TierRole, tier: string) => (K.tier[role][tier] ? t(K.tier[role][tier]) : tier);
const PERCENT: Metric[] = ['qcPassRate', 'score'];
const metricValue = (t: T, m: string, n: number) => t(PERCENT.includes(m as Metric) ? K.value.percent : K.value.number, { n });
const dayKey = (offsetDays: number) => {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const readJson = <V,>(key: string): V | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as V) : null;
  } catch {
    return null;
  }
};
const writeJson = (key: string, value: unknown | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Kept only while the page is open.
  }
};

function Footer({ children }: { children: ReactNode }) {
  return <div className="row gap-2" data-sheet-actions style={{ position: 'sticky', bottom: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: 'var(--space-2) 0', marginTop: 'var(--space-3)', justifyContent: 'flex-end' }}>{children}</div>;
}

/**
 * Screen 148 — Partner Tier & Category Assignment. The list of every partner with the tier they hold and whether the record says they have
 * earned the next; one partner's page for the ladder, the criteria as they actually read, the history and every decision on it; and the
 * criteria themselves, versioned.
 */
export function PartnerTiersScreen() {
  const { t } = useTranslation();
  const s = usePartnerTiers();
  const wide = s.partnerId || s.tab === 'criteria';
  const body = (() => {
    if (s.status === 'loading' && !s.board && !s.detail && !s.criteria) return <><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="list" rows={6} /></>;
    if (s.status === 'not_found') return <><ScreenHeader title={t(K.title)} /><EmptyState icon={<Medal size={28} />} title={t(K.notFound.title)} body={t(K.notFound.body)} actionLabel={t(K.back)} onAction={s.back} /></>;
    if (s.status === 'error' && !s.board && !s.detail && !s.criteria) return <><ScreenHeader title={t(K.title)} /><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} /></>;
    if (s.partnerId && s.detail) return <Detail s={s} d={s.detail} t={t} />;
    if (s.partnerId) return <LoadingState label={t(K.loading)} variant="list" rows={6} />;
    return (
      <>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <Tabs label={t(K.tabs.label)} value={s.tab} onChange={(id) => s.setTab(id as Tab)} items={TABS.map((id) => ({ id, label: t(K.tabs[id]) }))} />
        <div className="mt-3">{s.tab === 'criteria' ? (s.criteria ? <CriteriaTab s={s} t={t} /> : <LoadingState label={t(K.loading)} variant="list" rows={4} />) : s.board ? <Board s={s} t={t} /> : <LoadingState label={t(K.loading)} variant="list" rows={6} />}</div>
      </>
    );
  })();
  return <Screen width={wide ? 'default' : 'wide'}>{body}</Screen>;
}

/* ------------------------------------------------------------------ the list */

function flagsOf(r: PartnerTierRowView): ('promotion' | 'incident' | 'deferred' | 'review' | 'dispute')[] {
  return [r.promotionDue ? 'promotion' : null, r.incident ? 'incident' : null, r.deferred ? 'deferred' : null, r.reviewDue ? 'review' : null, r.disputeOpen ? 'dispute' : null].filter(Boolean) as ('promotion' | 'incident' | 'deferred' | 'review' | 'dispute')[];
}
const matchesFilter = (r: PartnerTierRowView, f: Filter) => f === 'all' || (f === 'promotion' && r.promotionDue) || (f === 'incident' && r.incident) || (f === 'review' && r.reviewDue) || (f === 'dispute' && r.disputeOpen);

function Board({ s, t }: { s: PartnerTiersState; t: T }) {
  const { i18n } = useTranslation();
  const b = s.board as NonNullable<PartnerTiersState['board']>;
  if (b.rows.length === 0) return <EmptyState icon={<Medal size={28} />} title={t(K.board.empty.title)} body={t(K.board.empty.body)} />;
  const q = s.query.trim().toLowerCase();
  const rows = b.rows.filter((r) => matchesFilter(r, s.filter) && (s.roleFilter === 'all' || r.role === s.roleFilter) && (!q || r.name.toLowerCase().includes(q)));
  const stat = (id: Filter, label: string, n: number) => (
    <Card key={id} onClick={() => s.setFilter(s.filter === id ? 'all' : id)}>
      <div data-stat={id}><StatTile label={label} value={<span className="num">{n}</span>} /></div>
    </Card>
  );
  return (
    <div className="stack gap-3" data-board>
      <div className="grid-auto" style={{ '--min': '130px' } as React.CSSProperties}>
        <Card><div data-stat="total"><StatTile label={t(K.board.stats.total)} value={<span className="num">{b.counts.total}</span>} /></div></Card>
        {stat('promotion', t(K.board.stats.promotion), b.counts.promotionDue)}
        {stat('incident', t(K.board.stats.incident), b.counts.incident)}
        {stat('review', t(K.board.stats.review), b.counts.review)}
        {stat('dispute', t(K.board.stats.dispute), b.counts.dispute)}
      </div>
      <div className="stack gap-2 sticky-under-shell" style={{ background: 'var(--color-bg)', paddingBlock: 'var(--space-2)' }}>
        <div className="grid-auto" style={{ '--min': '200px' } as React.CSSProperties}>
          <Field label={t(K.board.search)}>{(p) => <Input id={p.id} type="search" value={s.query} placeholder={t(K.board.searchPlaceholder)} onChange={(e) => s.setQuery(e.target.value)} data-f="search" />}</Field>
          <Field label={t(K.board.roleFilter.label)}>{(p) => <Select id={p.id} value={s.roleFilter} onChange={(e) => s.setRoleFilter(e.target.value as RoleFilter)} data-f="role">{ROLE_FILTERS.map((r) => <option key={r} value={r}>{t(K.board.roleFilter[r])}</option>)}</Select>}</Field>
        </div>
        <div className="row gap-2 wrap" role="group" aria-label={t(K.board.filter.label)}>
          {FILTERS.map((f) => <span key={f} data-filter={f}><Chip pressed={s.filter === f} onClick={() => s.setFilter(f)}>{t(K.board.filter[f])}</Chip></span>)}
        </div>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<Medal size={28} />} title={t(K.board.noMatch.title)} body={t(K.board.noMatch.body)} actionLabel={t(K.board.noMatch.clear)} onAction={() => { s.setFilter('all'); s.setRoleFilter('all'); s.setQuery(''); }} />
      ) : (
        <div className="grid-auto" style={{ '--min': '320px', alignItems: 'start' } as React.CSSProperties}>
          {rows.map((r, i) => (
            <Card key={r.id} riseIndex={i} onClick={() => s.open(r.id)}>
              <div className="stack gap-2" data-partner={r.id} data-tier={r.tier}>
                <div className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="stack" style={{ minWidth: 0 }}><strong className="t-md">{r.name}</strong><span className="t-xs t-muted">{t(K.role[r.role])}</span></span>
                  <span className="row gap-2" style={{ alignItems: 'center' }}><Badge tone="accent">{tierName(t, r.role, r.tier)}</Badge><CaretRight size={14} aria-hidden="true" /></span>
                </div>
                {r.since && <span className="t-xs t-muted">{t(K.board.since, { date: formatDate(r.since, i18n.language) })}</span>}
                {r.eligibleTier !== r.tier && r.promotionDue && <span className="t-sm">{t(K.board.eligible, { tier: tierName(t, r.role, r.eligibleTier) })}</span>}
                {r.pending && <span className="t-sm" data-pending>{t(K.board.pending, { tier: tierName(t, r.role, r.pending.tier), date: formatDate(r.pending.effectiveFrom, i18n.language) })}</span>}
                {flagsOf(r).length > 0 && (
                  <span className="row gap-2 wrap">{flagsOf(r).map((f) => <span key={f} data-flag={f}><Badge tone={f === 'incident' || f === 'dispute' ? 'warning' : f === 'promotion' ? 'emerald' : 'neutral'}>{t(K.board.flag[f])}</Badge></span>)}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ one partner */

function CriterionLine({ r, t }: { r: CriterionResult; t: T }) {
  return (
    <li className="row gap-2" data-criterion={r.metric} data-ok={r.ok ? 1 : 0} style={{ alignItems: 'flex-start' }}>
      {r.ok ? <Check size={16} aria-hidden="true" color="var(--color-success)" /> : <X size={16} aria-hidden="true" color="var(--color-error)" />}
      <span className="t-sm"><strong>{t(K.metric[r.metric])}</strong> · {t(r.kind === 'min' ? K.criterion.min : K.criterion.max, { n: metricValue(t, r.metric, r.required) })} · <span className={r.ok ? 't-muted' : 't-semibold'}>{t(K.criterion.met, { n: metricValue(t, r.metric, r.actual) })}</span></span>
    </li>
  );
}

function effectsText(t: T, role: TierRole, e: TierLadderRowView['effects']): string {
  if (role === 'supplier') return t(K.effect.supplier);
  if (role === 'surveyor') return e.commissionPlusPct ? t(K.effect.commission, { pct: e.commissionPlusPct }) : t(K.effect.commissionNone);
  return e.canLead === false ? t(K.effect.cannotLead) : t(K.effect.canLead);
}

function Detail({ s, d, t }: { s: PartnerTiersState; d: PartnerTierDetailView; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const r = d.row;
  const role = r.role;
  const [sheet, setSheet] = useState<'change' | 'defer' | 'dispute' | 'keep' | { decide: string } | null>(null);
  const openDispute = d.disputes.find((x) => x.status === 'open');
  const ladderSteps: AscensionStep[] = d.ladder.map((l, i) => {
    const curIdx = d.ladder.findIndex((x) => x.current);
    return { id: l.id, label: tierName(t, role, l.id), meta: role === 'supplier' ? undefined : effectsText(t, role, l.effects), status: l.current ? 'current' : i < curIdx ? 'complete' : 'upcoming', trailing: l.eligible && i > curIdx ? <Badge tone="emerald">{t(K.detail.eligible)}</Badge> : undefined };
  });
  return (
    <div className="stack gap-4" data-detail={r.id} data-tier={r.tier}>
      <div className="stack gap-2">
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} style={{ width: 'fit-content' }} data-back onClick={s.back}>{t(K.back)}</Button>
        <ScreenHeader title={d.partner.name} subtitle={`${t(K.role[role])} · ${tierName(t, role, r.tier)}`} />
        <span className="t-xs t-muted">{[d.partner.city, r.since ? t(K.detail.since, { date: formatDate(r.since, lang) }) : null, d.partner.joinedAt ? t(K.detail.joined, { date: formatDate(d.partner.joinedAt, lang) }) : null].filter(Boolean).join(' · ')}</span>
      </div>

      {r.pending && <Card><p className="t-sm" role="status" data-pending>{t(K.detail.pendingChange, { tier: tierName(t, role, r.pending.tier), date: formatDate(r.pending.effectiveFrom, lang) })}</p></Card>}
      {d.incidents.length > 0 && (
        <Card>
          <div className="stack gap-2" role="note" data-incident>
            <strong className="t-sm row gap-2" style={{ alignItems: 'center' }}><Warning size={16} aria-hidden="true" color="var(--color-warning)" />{t(K.detail.incidentTitle)}</strong>
            <p className="t-sm">{t(K.detail.incidentBody)}</p>
            <ul className="stack gap-1" style={{ margin: 0, paddingLeft: 'var(--space-4)' }}>{d.incidents.map((x) => <li key={x.code} className="t-xs">{t(K.detail.incidentRow, { code: x.code, date: formatDate(x.at, lang) })}</li>)}</ul>
          </div>
        </Card>
      )}
      {d.deferral && <Card><div className="stack gap-1" data-deferred><strong className="t-sm">{t(K.detail.deferredTitle)}</strong><p className="t-sm">{t(K.detail.deferredBody, { date: formatDate(d.deferral.until, lang), name: d.deferral.byName })}</p><p className="t-sm t-muted">“{d.deferral.reason}”</p></div></Card>}
      {d.review && (
        <Card>
          <div className="stack gap-2" data-review>
            <strong className="t-sm">{t(K.detail.reviewTitle)}</strong>
            <p className="t-sm">{t(K.detail.reviewBody, { date: formatDate(d.review.dueBy, lang) })}</p>
            <Button size="sm" variant="secondary" style={{ width: 'fit-content' }} data-keep onClick={() => setSheet('keep')}>{t(K.review.keep)}</Button>
          </div>
        </Card>
      )}
      {r.promotionDue && !d.deferral && d.incidents.length === 0 && !r.pending && <Card><div className="stack gap-1" data-promotion><strong className="t-sm">{t(K.detail.promotionTitle)}</strong><p className="t-sm">{t(K.detail.promotionBody, { tier: tierName(t, role, r.eligibleTier) })}</p></div></Card>}

      <div className="row gap-2 wrap" data-actions aria-label={t(K.detail.actions)}>
        <Button data-open-change onClick={() => setSheet('change')}>{t(K.change.button)}</Button>
        {(r.promotionDue || r.deferred || r.incident) && role !== 'supplier' && <Button variant="secondary" data-open-defer onClick={() => setSheet('defer')}>{t(K.defer.button)}</Button>}
        {!openDispute && <Button variant="ghost" data-open-dispute onClick={() => setSheet('dispute')}>{t(K.dispute.button)}</Button>}
      </div>

      <div className="grid-auto" style={{ '--min': '340px', alignItems: 'start' } as React.CSSProperties}>
        <Card>
          <div className="stack gap-3" data-ladder>
            <div className="stack"><h2 className="t-md t-semibold">{t(K.detail.ladder)}</h2><p className="t-xs t-muted">{t(K.detail.ladderHint, { version: d.criteria.version, date: formatDate(d.criteria.effectiveFrom, lang) })}</p></div>
            <AscensionLine steps={ladderSteps} />
            {role === 'supplier' && d.paymentDefaults && (
              <div className="stack gap-1" data-supplier-defaults>
                <strong className="t-sm">{t(K.detail.supplierDefaults)}</strong>
                <span className="t-sm">{t(K.detail.termType[d.paymentDefaults.termType])} · {t(K.detail.upfront, { pct: d.paymentDefaults.upfrontPct })} · {t(K.detail.retention, { pct: d.paymentDefaults.retentionPct })}</span>
                <p className="t-xs t-muted">{t(K.detail.supplierNote)}</p>
                <Button size="sm" variant="ghost" style={{ width: 'fit-content' }} data-open-terms onClick={() => s.goto(PAYMENT_TERMS_PATH)}>{t(K.detail.openTerms)}</Button>
              </div>
            )}
          </div>
        </Card>
        <Card>
          <div className="stack gap-3" data-criteria>
            <h2 className="t-md t-semibold">{t(K.criteria.heading)}</h2>
            {d.ladder.map((l) => (
              <div key={l.id} className="stack gap-1" data-tier-criteria={l.id}>
                <span className="row gap-2" style={{ alignItems: 'center' }}><strong className="t-sm">{tierName(t, role, l.id)}</strong>{l.current && <Badge tone="accent">{t(K.detail.current)}</Badge>}{l.eligible && !l.current && d.ladder.indexOf(l) > d.ladder.findIndex((x) => x.current) && <Badge tone="emerald">{t(K.detail.eligible)}</Badge>}</span>
                {l.criteria.length === 0 ? <span className="t-xs t-muted">{t(K.criterion.none)}</span> : <ul className="stack gap-1" style={{ listStyle: 'none', margin: 0, padding: 0 }}>{l.criteria.map((c) => <CriterionLine key={c.metric} r={c} t={t} />)}</ul>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="stack gap-3" data-disputes>
          <h2 className="t-md t-semibold">{t(K.detail.disputes)}</h2>
          {d.disputes.length === 0 ? <p className="t-sm t-muted">{t(K.detail.noDisputes)}</p> : d.disputes.map((x) => (
            <div key={x.id} className="stack gap-1" data-dispute={x.id} data-status={x.status}>
              <span className="row gap-2" style={{ alignItems: 'center' }}><Badge tone={x.status === 'open' ? 'warning' : 'neutral'}>{x.status === 'open' ? t(K.detail.disputeOpen) : t(K.detail.outcome[x.decision?.outcome ?? 'tier_stands'])}</Badge><span className="t-xs t-muted">{t(K.detail.disputeRaised, { date: formatDate(x.raisedAt, lang), name: x.raisedByName })}</span></span>
              <p className="t-sm">“{x.grounds}”</p>
              <span className="t-xs t-muted">{t(K.detail.disputeSnapshot, { version: x.criteriaVersion, tier: tierName(t, role, x.tierAtRaise) })}</span>
              {x.decision && <p className="t-sm" data-decision>{t(K.detail.disputeDecided, { name: x.decision.byName, date: formatDate(x.decision.at, lang) })} “{x.decision.note}”</p>}
              {x.status === 'open' && <Button size="sm" style={{ width: 'fit-content' }} data-open-decide={x.id} onClick={() => setSheet({ decide: x.id })}>{t(K.dispute.decide)}</Button>}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="stack gap-3" data-history>
          <h2 className="t-md t-semibold">{t(K.detail.history)}</h2>
          {d.history.length === 0 ? <p className="t-sm t-muted">{t(K.detail.historyEmpty)}</p> : d.history.map((h) => (
            <div key={h.id} className="stack gap-1" data-history-item={h.kind}>
              <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
                <Badge tone={h.kind === 'demotion' ? 'warning' : h.kind === 'promotion' ? 'emerald' : 'neutral'}>{t(K.detail.kind[h.kind])}</Badge>
                <strong className="t-sm">{h.from ? t(K.detail.historyRow, { from: tierName(t, role, h.from), to: tierName(t, role, h.to) }) : t(K.detail.historyInitial, { to: tierName(t, role, h.to) })}</strong>
              </span>
              <span className="t-xs t-muted">{t(K.detail.effectiveOn, { date: formatDate(h.effectiveFrom, lang) })} · {t(K.detail.by, { name: h.byName })}{h.criteriaVersion ? ` · ${t(K.detail.criteriaAtTime, { version: h.criteriaVersion })}` : ''}</span>
              {h.reason && <span className="t-sm">“{h.reason}”</span>}
              {h.met.length > 0 && <ul className="stack gap-1" style={{ listStyle: 'none', margin: 0, padding: 0 }}>{h.met.map((m, i) => <CriterionLine key={`${m.metric}-${i}`} r={m as CriterionResult} t={t} />)}</ul>}
              {h.incidentAcknowledged && <span className="t-xs t-muted">{t(K.detail.ackShown)}</span>}
            </div>
          ))}
        </div>
      </Card>

      <ChangeSheet s={s} d={d} t={t} open={sheet === 'change'} onClose={() => setSheet(null)} />
      <DeferSheet s={s} t={t} open={sheet === 'defer'} onClose={() => setSheet(null)} />
      <DisputeSheet s={s} t={t} open={sheet === 'dispute'} onClose={() => setSheet(null)} />
      <KeepSheet s={s} t={t} open={sheet === 'keep'} onClose={() => setSheet(null)} />
      <DecideSheet s={s} d={d} t={t} disputeId={typeof sheet === 'object' && sheet ? sheet.decide : null} onClose={() => setSheet(null)} />
    </div>
  );
}

/* ------------------------------------------------------------------ the forms */

function Problem({ code, t }: { code: string | null; t: T }) {
  return code ? <p className="t-xs t-error" role="alert" data-problem={code}>{t(problemKey(code))}</p> : null;
}

interface ChangeDraft {
  tier: string;
  date: string;
  reason: string;
  exception: boolean;
  incident: boolean;
}

function ChangeSheet({ s, d, t, open, onClose }: { s: PartnerTiersState; d: PartnerTierDetailView; t: T; open: boolean; onClose: () => void }) {
  const { i18n } = useTranslation();
  const role = d.row.role;
  const key = draftKey(s.userId, d.row.id);
  const blank: ChangeDraft = { tier: '', date: dayKey(0), reason: '', exception: false, incident: false };
  const [f, setF] = useState<ChangeDraft>(blank);
  const [kept, setKept] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    const stored = readJson<ChangeDraft>(key);
    setKept(!!stored && (!!stored.tier || !!stored.reason));
    setF(stored ?? blank);
    setError(null);
  }, [open, key]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (patch: Partial<ChangeDraft>) => setF((c) => { const n = { ...c, ...patch }; writeJson(key, n); return n; });
  const target = d.ladder.find((l) => l.id === f.tier);
  const curIdx = d.ladder.findIndex((l) => l.current);
  const tgtIdx = d.ladder.findIndex((l) => l.id === f.tier);
  const up = tgtIdx > curIdx;
  const earlier = d.ladder.slice(1, tgtIdx + 1).flatMap((l) => l.criteria);
  const unmet = up ? earlier.filter((c) => !c.ok) : [];
  const incident = up && d.incidents.length > 0;
  const supplier = role === 'supplier';
  const ready = !!f.tier && letters(f.reason) >= REASON_MIN && (unmet.length === 0 || f.exception) && (!incident || f.incident) && !!f.date;
  return (
    <Sheet open={open} onClose={onClose} title={t(K.change.heading, { name: d.partner.name })} closeLabel={t('action.close')}>
      <div className="stack gap-3" data-form="change">
        <p className="t-sm">{supplier ? t(K.change.bodySupplier) : t(K.change.body)}</p>
        {kept && <p className="t-xs t-muted" data-draft-kept>{t(K.change.draftKept)}</p>}
        <Field label={t(K.change.tier)}>
          {(p) => (
            <Select id={p.id} value={f.tier} onChange={(e) => set({ tier: e.target.value, exception: false, incident: false })} data-f="tier">
              <option value="">{t(K.change.tierPlaceholder)}</option>
              {d.ladder.filter((l) => !l.current).map((l) => <option key={l.id} value={l.id}>{tierName(t, role, l.id)}</option>)}
            </Select>
          )}
        </Field>
        {target && (
          <div className="stack gap-1" data-preview>
            <strong className="t-sm">{t(K.change.preview)}</strong>
            <span className="t-sm">{effectsText(t, role, target.effects)}</span>
            {!up && <p className="t-xs t-muted" data-down>{t(K.change.down)}</p>}
            {up && (unmet.length === 0 ? <span className="t-xs t-muted">{t(K.change.allMet)}</span> : <><span className="t-xs">{t(K.change.unmet)}</span><ul className="stack gap-1" style={{ listStyle: 'none', margin: 0, padding: 0 }}>{unmet.map((c, i) => <CriterionLine key={`${c.metric}-${i}`} r={c} t={t} />)}</ul></>)}
          </div>
        )}
        <Field label={t(K.change.date)} hint={supplier ? t(K.change.dateSupplier) : t(K.change.dateHint, { days: EFFECTIVE_MAX_DAYS })}>
          {(p) => <Input id={p.id} type="date" value={f.date} min={dayKey(0)} max={dayKey(EFFECTIVE_MAX_DAYS)} disabled={supplier} onChange={(e) => set({ date: e.target.value })} data-f="date" />}
        </Field>
        <Field label={t(K.change.reason)} hint={t(K.change.reasonHint, { min: REASON_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={f.reason} onChange={(e) => set({ reason: e.target.value })} data-f="reason" />}</Field>
        {up && unmet.length > 0 && <div data-f="exception"><Checkbox checked={f.exception} onChange={(v) => set({ exception: v })} label={t(K.change.exception)} /><p className="t-xs t-muted">{t(K.change.exceptionHint)}</p></div>}
        {incident && <div data-f="incident"><Checkbox checked={f.incident} onChange={(v) => set({ incident: v })} label={t(K.change.incident)} /><p className="t-xs t-muted">{t(K.change.incidentHint)}</p></div>}
        <Problem code={error} t={t} />
        <Footer>
          <Button variant="ghost" onClick={onClose}>{t(K.action.cancel)}</Button>
          <Button disabled={!ready || s.busy} data-confirm-change onClick={async () => {
            const r = await s.assign({ tier: f.tier, reason: f.reason, effectiveFrom: f.date, ...(f.exception ? { exception: true } : {}), ...(f.incident ? { incidentAcknowledged: true } : {}) });
            if (!r.ok) return setError(r.code ?? 'generic');
            writeJson(key, null);
            onClose();
          }}>{t(K.change.confirm)}</Button>
        </Footer>
      </div>
      <span hidden>{i18n.language}</span>
    </Sheet>
  );
}

function DeferSheet({ s, t, open, onClose }: { s: PartnerTiersState; t: T; open: boolean; onClose: () => void }) {
  const [until, setUntil] = useState(dayKey(14));
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (open) { setError(null); setReason(''); setUntil(dayKey(14)); } }, [open]);
  return (
    <Sheet open={open} onClose={onClose} title={t(K.defer.heading)} closeLabel={t('action.close')}>
      <div className="stack gap-3" data-form="defer">
        <p className="t-sm">{t(K.defer.body)}</p>
        <Field label={t(K.defer.until)} hint={t(K.defer.untilHint, { days: DEFER_MAX_DAYS })}>{(p) => <Input id={p.id} type="date" value={until} min={dayKey(1)} max={dayKey(DEFER_MAX_DAYS)} onChange={(e) => setUntil(e.target.value)} data-f="until" />}</Field>
        <Field label={t(K.defer.reason)} hint={t(K.defer.reasonHint, { min: REASON_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} data-f="reason" />}</Field>
        <Problem code={error} t={t} />
        <Footer><Button variant="ghost" onClick={onClose}>{t(K.action.cancel)}</Button><Button disabled={letters(reason) < REASON_MIN || !until || s.busy} data-confirm-defer onClick={async () => { const r = await s.defer({ until, reason }); if (!r.ok) setError(r.code ?? 'generic'); else onClose(); }}>{t(K.defer.confirm)}</Button></Footer>
      </div>
    </Sheet>
  );
}

function DisputeSheet({ s, t, open, onClose }: { s: PartnerTiersState; t: T; open: boolean; onClose: () => void }) {
  const [grounds, setGrounds] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (open) { setError(null); setGrounds(''); } }, [open]);
  return (
    <Sheet open={open} onClose={onClose} title={t(K.dispute.heading)} closeLabel={t('action.close')}>
      <div className="stack gap-3" data-form="dispute">
        <p className="t-sm">{t(K.dispute.body)}</p>
        <Field label={t(K.dispute.grounds)} hint={t(K.dispute.groundsHint, { min: REASON_MIN })}>{(p) => <TextArea id={p.id} rows={4} value={grounds} onChange={(e) => setGrounds(e.target.value)} data-f="grounds" />}</Field>
        <Problem code={error} t={t} />
        <Footer><Button variant="ghost" onClick={onClose}>{t(K.action.cancel)}</Button><Button disabled={letters(grounds) < REASON_MIN || s.busy} data-confirm-dispute onClick={async () => { const r = await s.raiseDispute(grounds); if (!r.ok) setError(r.code ?? 'generic'); else onClose(); }}>{t(K.dispute.confirm)}</Button></Footer>
      </div>
    </Sheet>
  );
}

function KeepSheet({ s, t, open, onClose }: { s: PartnerTiersState; t: T; open: boolean; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (open) { setError(null); setReason(''); } }, [open]);
  return (
    <Sheet open={open} onClose={onClose} title={t(K.review.keepHeading)} closeLabel={t('action.close')}>
      <div className="stack gap-3" data-form="keep">
        <p className="t-sm">{t(K.review.keepBody)}</p>
        <Field label={t(K.review.reason)} hint={t(K.review.reasonHint, { min: REASON_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} data-f="reason" />}</Field>
        <Problem code={error} t={t} />
        <Footer><Button variant="ghost" onClick={onClose}>{t(K.action.cancel)}</Button><Button disabled={letters(reason) < REASON_MIN || s.busy} data-confirm-keep onClick={async () => { const r = await s.keepGrandfathered(reason); if (!r.ok) setError(r.code ?? 'generic'); else onClose(); }}>{t(K.review.confirm)}</Button></Footer>
      </div>
    </Sheet>
  );
}

function DecideSheet({ s, d, t, disputeId, onClose }: { s: PartnerTiersState; d: PartnerTierDetailView; t: T; disputeId: string | null; onClose: () => void }) {
  const [outcome, setOutcome] = useState<(typeof OUTCOMES)[number]>('tier_stands');
  const [note, setNote] = useState('');
  const [tier, setTier] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (disputeId) { setError(null); setNote(''); setTier(''); setOutcome('tier_stands'); } }, [disputeId]);
  const dispute = d.disputes.find((x) => x.id === disputeId);
  const role = d.row.role;
  return (
    <Sheet open={!!disputeId} onClose={onClose} title={t(K.dispute.decideHeading)} closeLabel={t('action.close')}>
      <div className="stack gap-3" data-form="decide">
        {dispute && <p className="t-sm">“{dispute.grounds}”</p>}
        <p className="t-xs t-muted">{t(K.dispute.decideBody)}</p>
        <Field label={t(K.dispute.outcome)}>
          {(p) => <Select id={p.id} value={outcome} onChange={(e) => setOutcome(e.target.value as (typeof OUTCOMES)[number])} data-f="outcome">{OUTCOMES.map((o) => <option key={o} value={o}>{t(K.detail.outcome[o])}</option>)}</Select>}
        </Field>
        <p className="t-xs t-muted">{t(K.dispute.outcomeHint[outcome])}</p>
        {outcome === 'tier_changed' && (
          <Field label={t(K.dispute.newTier)}>{(p) => <Select id={p.id} value={tier} onChange={(e) => setTier(e.target.value)} data-f="tier"><option value="">{t(K.change.tierPlaceholder)}</option>{d.ladder.filter((l) => !l.current).map((l) => <option key={l.id} value={l.id}>{tierName(t, role, l.id)}</option>)}</Select>}</Field>
        )}
        <Field label={t(K.dispute.note)} hint={t(K.dispute.noteHint, { min: REASON_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={note} onChange={(e) => setNote(e.target.value)} data-f="note" />}</Field>
        <Problem code={error} t={t} />
        <Footer><Button variant="ghost" onClick={onClose}>{t(K.action.cancel)}</Button><Button disabled={letters(note) < REASON_MIN || (outcome === 'tier_changed' && !tier) || s.busy} data-confirm-decide onClick={async () => { const r = await s.decideDispute(disputeId as string, { outcome, note, ...(outcome === 'tier_changed' ? { tier } : {}) }); if (!r.ok) setError(r.code ?? 'generic'); else onClose(); }}>{t(K.dispute.confirmDecide)}</Button></Footer>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ the criteria */

function CriteriaTab({ s, t }: { s: PartnerTiersState; t: T }) {
  const c = s.criteria as NonNullable<PartnerTiersState['criteria']>;
  return (
    <div className="stack gap-4" data-criteria-tab>
      <p className="t-sm">{t(K.criteria.hint)}</p>
      <div className="grid-auto" style={{ '--min': '340px', alignItems: 'start' } as React.CSSProperties}>
        {c.roles.map((r) => <RoleCriteria key={r.role} s={s} role={r.role} current={r.current} versions={r.versions} t={t} />)}
      </div>
      <Card>
        <div className="stack gap-2" data-supplier-criteria>
          <h2 className="t-md t-semibold">{t(K.criteria.supplierHeading)}</h2>
          <p className="t-sm">{t(K.criteria.supplierBody, { orders: c.supplier.minOrders, score: c.supplier.minScore })}</p>
          <Button size="sm" variant="secondary" style={{ width: 'fit-content' }} data-open-terms onClick={() => s.goto(PAYMENT_TERMS_PATH)}>{t(K.criteria.openTerms)}</Button>
        </div>
      </Card>
    </div>
  );
}

function RoleCriteria({ s, role, current, versions, t }: { s: PartnerTiersState; role: 'surveyor' | 'technician'; current: TierCriteriaVersion; versions: TierCriteriaVersion[]; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const key = criteriaDraftKey(s.userId, role);
  const clone = (tiers: Tiers): Tiers => JSON.parse(JSON.stringify(tiers)) as Tiers;
  const [tiers, setTiers] = useState<Tiers>(() => readJson<Tiers>(key) ?? clone(current.tiers));
  const [publishing, setPublishing] = useState(false);
  const [date, setDate] = useState(dayKey(0));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    // A new version has just been published: the editor starts again from it.
    setTiers(readJson<Tiers>(key) ?? clone(current.tiers));
  }, [current.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = JSON.stringify(tiers) !== JSON.stringify(current.tiers);
  const edit = (fn: (next: Tiers) => void) => setTiers((prev) => { const next = clone(prev); fn(next); writeJson(key, JSON.stringify(next) === JSON.stringify(current.tiers) ? null : next); return next; });
  const num = (v: string) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : 0; };
  const ids = FIELD_ROLES.includes(role) ? tiers.map((x) => x.id) : [];
  return (
    <Card>
      <div className="stack gap-3" data-role-criteria={role} data-dirty={dirty ? 1 : 0}>
        <div className="stack"><h2 className="t-md t-semibold">{t(K.role[role])}</h2><span className="t-xs t-muted">{t(K.criteria.version, { version: current.version })} · {t(K.criteria.from, { date: formatDate(current.effectiveFrom, lang) })}</span></div>
        {ids.map((id, ti) => {
          const tier = tiers[ti];
          return (
            <div key={id} className="stack gap-2" data-edit-tier={id} style={{ borderTop: ti ? '1px solid var(--color-border)' : undefined, paddingTop: ti ? 'var(--space-2)' : 0 }}>
              <strong className="t-sm">{tierName(t, role, id)}</strong>
              {tier.criteria.length === 0 && <span className="t-xs t-muted">{t(K.criteria.firstTier)}</span>}
              {tier.criteria.map((cr, ci) => (
                <Field key={cr.metric} label={`${t(K.metric[cr.metric])} · ${t(cr.min !== undefined ? K.criteria.atLeast : K.criteria.atMost)}`}>
                  {(p) => <Input id={p.id} type="number" min={0} inputMode="decimal" value={String(cr.min ?? cr.max ?? 0)} onChange={(e) => edit((n) => { if (n[ti].criteria[ci].min !== undefined) n[ti].criteria[ci].min = num(e.target.value); else n[ti].criteria[ci].max = num(e.target.value); })} data-f={`${id}.${cr.metric}`} />}
                </Field>
              ))}
              {role === 'surveyor' && ti > 0 && <Field label={t(K.criteria.commissionPlus)}>{(p) => <Input id={p.id} type="number" min={0} step="0.05" inputMode="decimal" value={String(tier.effects.commissionPlusPct ?? 0)} onChange={(e) => edit((n) => { n[ti].effects.commissionPlusPct = num(e.target.value); })} data-f={`${id}.commission`} />}</Field>}
              {role === 'technician' && <div data-f={`${id}.canLead`}><Checkbox checked={tier.effects.canLead !== false} onChange={(v) => edit((n) => { n[ti].effects.canLead = v; })} label={t(K.criteria.canLead)} /></div>}
            </div>
          );
        })}
        {dirty && <p className="t-xs t-muted" data-edited>{t(K.criteria.edited)}</p>}
        <div className="row gap-2 wrap">
          <Button size="sm" disabled={!dirty} data-open-publish={role} onClick={() => { setError(null); setPublishing(true); }}>{t(K.criteria.publish)}</Button>
          <Button size="sm" variant="ghost" disabled={!dirty} data-reset={role} onClick={() => { writeJson(key, null); setTiers(clone(current.tiers)); }}>{t(K.criteria.reset)}</Button>
        </div>
        <div className="stack gap-1" data-versions>
          <strong className="t-sm">{t(K.criteria.history)}</strong>
          {versions.map((v) => (
            <span key={v.id} className="t-xs t-muted" data-version={v.version}>{t(K.criteria.version, { version: v.version })} · {t(K.criteria.from, { date: formatDate(v.effectiveFrom, lang) })}{v.id === current.id ? ` · ${t(K.criteria.inForce)}` : ''} · {v.changeNote}</span>
          ))}
        </div>
      </div>
      <Sheet open={publishing} onClose={() => setPublishing(false)} title={t(K.criteria.publishHeading, { role: t(K.role[role]) })} closeLabel={t('action.close')}>
        <div className="stack gap-3" data-form="publish">
          <p className="t-sm">{t(K.criteria.publishBody)}</p>
          <p className="t-xs t-muted">{t(K.criteria.reviewNote)}</p>
          <Field label={t(K.criteria.effective)} hint={t(K.criteria.effectiveHint)}>{(p) => <Input id={p.id} type="date" min={dayKey(0)} value={date} onChange={(e) => setDate(e.target.value)} data-f="effective" />}</Field>
          <Field label={t(K.criteria.note)} hint={t(K.criteria.noteHint, { min: REASON_MIN })}>{(p) => <TextArea id={p.id} rows={3} value={note} onChange={(e) => setNote(e.target.value)} data-f="note" />}</Field>
          <Problem code={error} t={t} />
          <Footer><Button variant="ghost" onClick={() => setPublishing(false)}>{t(K.action.cancel)}</Button><Button disabled={letters(note) < REASON_MIN || !date || s.busy} data-confirm-publish onClick={async () => { const r = await s.publish(role, { tiers, effectiveFrom: date, changeNote: note }); if (!r.ok) setError(r.code ?? 'generic'); else { setPublishing(false); setNote(''); } }}>{t(K.criteria.confirm)}</Button></Footer>
        </div>
      </Sheet>
    </Card>
  );
}
