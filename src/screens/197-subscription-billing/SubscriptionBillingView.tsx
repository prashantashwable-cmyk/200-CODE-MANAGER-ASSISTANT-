import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, CreditCard, TrendDown, WarningCircle } from '@phosphor-icons/react';
import { Badge, Button, Card, Chip, ErrorState, Field, Input, LoadingState, ProgressBar, Screen, ScreenHeader, Sheet, TextArea, Toggle, formatDate, formatINR, formatNumber, useToast } from '@/design-system';
import type { BillingMonthView, BillingOverview, BillingServiceDetail, BillingServiceView, TierChangePreview } from '@/data/repository';
import { NOTE_MIN, REASON_MIN, serviceDef } from '@/features/billing/billing';
import type { BillingState, TierDef } from '@/features/billing/billing';
import { lettersOf } from '@/features/security/security';
import { SUBSCRIPTION_BILLING_KEYS as K } from './subscription-billing.types';
import { useSubscriptionBilling } from './useSubscriptionBilling';
import type { BillingScreenState } from './useSubscriptionBilling';

type T = ReturnType<typeof useTranslation>['t'];
const errText = (t: T, code: string) => t(`billing.error.${code}`, { defaultValue: t(K.error.generic) });
const STATE_TONE: Record<BillingState, 'success' | 'warning' | 'error'> = { ok: 'success', renewing_soon: 'warning', card_expiring: 'warning', card_expired: 'error', payment_failed: 'error', lapsed: 'error', no_card: 'error' };
const monthLabel = (m: string, lang: string): string => formatDate(`${m}-01`, lang).replace(/^\d+\s/, '');
const dayStr = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const nameOf = (t: T, id: string): string => t(`billing.service.${id}`, { defaultValue: id });

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="stack gap-3">
      <h2 className="t-md t-semibold" style={{ borderTop: '1px solid var(--color-accent-primary)', paddingTop: 12 }}>{title}</h2>
      {hint && <p className="t-xs t-muted">{hint}</p>}
      {children}
    </section>
  );
}
function Line({ label, value }: { label: string; value: ReactNode }) {
  return <div className="row between wrap" style={{ gap: 8 }}><span className="t-sm t-muted">{label}</span><span className="t-sm num">{value}</span></div>;
}
const Problem = ({ t, code }: { t: T; code: string | null }) => (code ? <p className="t-sm t-error" role="alert" data-problem={code}>{errText(t, code)}</p> : null);

/** Screen 197 — Subscription & Billing. What AIEC pays to keep its own software running, what is driving it, and which bill could quietly go wrong. */
export function SubscriptionBillingScreen() {
  const { t, i18n } = useTranslation();
  const s = useSubscriptionBilling();
  const head = <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh onClick={() => void s.refresh()}>{t(K.refresh)}</Button>} />;
  if (s.load === 'loading' && !s.overview) return <Screen width="default">{head}<LoadingState label={t(K.loading)} variant="list" rows={4} /></Screen>;
  if (s.load === 'error' && !s.overview) return <Screen width="default">{head}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.refresh()} /></Screen>;
  const o = s.overview;
  if (!o) return null;
  const lang = i18n.language;
  const upcoming = [...o.services].sort((a, b) => (a.renewalDate < b.renewalDate ? -1 : 1));
  return (
    <Screen width="default">
      {head}
      <div className="stack gap-5">
        {s.offline && <p className="t-xs t-muted" role="status" data-offline>{t(K.offline)}</p>}
        <div className="grid-auto" data-summary style={{ ['--min' as string]: '170px' }}>
          <Card><div className="stack gap-0"><span className="t-xs t-muted">{t(K.summary.now)}</span><span className="t-lg t-semibold num" data-month-now>{formatINR(o.totals.monthNow)}</span></div></Card>
          <Card><div className="stack gap-0"><span className="t-xs t-muted">{t(K.summary.forecast)}</span><span className="t-lg t-semibold num" data-forecast>{formatINR(o.totals.forecast)}</span><span className="t-xs t-muted">{o.totals.deltaPct === null ? '' : t(K.summary.vsLast, { pct: `${o.totals.deltaPct > 0 ? '+' : ''}${o.totals.deltaPct}`, last: formatINR(o.totals.monthLast) })}</span></div></Card>
          <Card><div className="stack gap-0"><span className="t-xs t-muted">{t(K.summary.year)}</span><span className="t-lg t-semibold num">{formatINR(o.totals.yearProjected)}</span></div></Card>
          <Card><div className="stack gap-0"><span className="t-xs t-muted">{t(K.summary.saving)}</span><span className="t-lg t-semibold num" data-saving style={{ color: o.totals.potentialSaving ? 'var(--color-success)' : undefined }}>{formatINR(o.totals.potentialSaving)}</span></div></Card>
        </div>

        <Section title={t(K.attention.title)} hint={t(K.attention.hint)}>
          {o.attention.length === 0 ? <p className="t-sm" data-clear>{t(K.attention.clear)}</p> : (
            <div className="grid-auto" data-attention>
              {o.attention.map((a) => {
                const v = o.services.find((x) => x.serviceId === a.serviceId) as BillingServiceView;
                return (
                  <Card key={a.serviceId} onClick={() => s.openService(a.serviceId)}>
                    <div className="stack gap-1" data-attention-item={a.state}>
                      <span className="row between" style={{ gap: 8, alignItems: 'center' }}><span className="t-sm t-semibold">{nameOf(t, a.serviceId)}</span><Badge tone={STATE_TONE[a.state]}>{t(`billing.state.${a.state}`)}</Badge></span>
                      <span className="t-xs">{t(`billing.stateHint.${a.state}`, { date: formatDate(v.renewalDate, lang), days: v.cardDays ?? 0, last4: v.card?.last4 ?? '' })}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Section>

        <Section title={t(K.services.title)} hint={t(K.services.hint)}>
          <div className="grid-auto" data-services>
            {o.services.map((v) => <ServiceCard key={v.serviceId} v={v} t={t} lang={lang} onOpen={() => s.openService(v.serviceId)} />)}
          </div>
        </Section>

        <Section title={t(K.renewals.title)} hint={t(K.renewals.hint)}>
          <div className="stack gap-2" data-renewals>
            {upcoming.map((v) => (
              <div key={v.serviceId} className="row between wrap" style={{ gap: 8 }} data-renewal={v.serviceId}>
                <span className="t-sm">{nameOf(t, v.serviceId)}</span>
                <span className="row gap-2" style={{ alignItems: 'center' }}><span className="t-sm num">{formatDate(v.renewalDate, lang)}</span><Badge tone={v.autoRenew ? 'neutral' : 'warning'}>{v.autoRenew ? t(K.renewals.auto) : t(K.renewals.manual)}</Badge></span>
              </div>
            ))}
          </div>
        </Section>
        <p className="t-xs t-muted" data-placeholder-note>{t(K.note.placeholders)}</p>
      </div>
      <ServiceSheet s={s} t={t} lang={lang} />
    </Screen>
  );
}

function ServiceCard({ v, t, lang, onOpen }: { v: BillingServiceView; t: T; lang: string; onOpen: () => void }) {
  const near = v.usedPct !== null && v.usedPct >= 85;
  return (
    <Card onClick={onOpen}>
      <div className="stack gap-2" data-service={v.serviceId} data-state={v.state}>
        <div className="row between wrap" style={{ gap: 8, alignItems: 'flex-start' }}>
          <span className="t-sm t-semibold">{nameOf(t, v.serviceId)}</span>
          <span className="row gap-1 wrap" style={{ justifyContent: 'flex-end' }}>{v.critical && <Badge tone="neutral">{t(K.services.critical)}</Badge>}<Badge tone="accent">{t(`billing.tier.${v.serviceId}.${v.tierId}`)}</Badge></span>
        </div>
        <span className="t-sm num">{formatINR(v.forecast)} <span className="t-xs t-muted">{t(K.services.forecastWord)}</span></span>
        {v.usedPct !== null ? (
          <div className="stack gap-1"><ProgressBar value={Math.min(1, v.usedPct / 100)} tone={near ? 'warning' : 'accent'} label={t(K.services.usage)} /><span className="t-xs" style={{ color: near ? 'var(--color-warning)' : undefined }}>{t(K.services.usedOf, { used: formatNumber(v.usedNow), included: formatNumber(v.included), unit: t(`billing.metric.${v.metric}`) })}</span></div>
        ) : <span className="t-xs">{t(K.services.usedPay, { used: formatNumber(v.usedNow), unit: t(`billing.metric.${v.metric}`) })}</span>}
        <span className="row gap-1 wrap">
          <Badge tone={STATE_TONE[v.state]}>{t(`billing.state.${v.state}`)}</Badge>
          {v.spike && <Badge tone="warning">{t(K.services.spike, { ratio: v.spike.ratio })}</Badge>}
          {v.advice.direction === 'down' && <Badge tone="success">{t(K.services.couldSave, { amount: formatINR(v.advice.savingMonthly) })}</Badge>}
          {v.pending && <Badge tone="neutral">{t(K.services.changePending)}</Badge>}
        </span>
        <span className="t-xs t-muted">{t(K.services.renews, { date: formatDate(v.renewalDate, lang) })}</span>
      </div>
    </Card>
  );
}

function UsageChart({ months, t, lang, unit }: { months: BillingMonthView[]; t: T; lang: string; unit: string }) {
  const max = Math.max(1, ...months.map((m) => m.used));
  return (
    <div className="stack gap-2" data-usage-chart>
      <div className="row gap-2" style={{ alignItems: 'flex-end', height: 120 }} role="img" aria-label={t(K.usage.chartLabel, { unit })}>
        {months.map((m) => (
          <div key={m.month} className="stack gap-0" style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }} data-month={m.month} data-spike={m.spike}>
            <span className="t-xs num" style={{ fontSize: 10 }}>{formatNumber(m.used)}</span>
            <div style={{ width: '100%', maxWidth: 36, height: `${Math.max(4, (m.used / max) * 84)}%`, background: m.spike ? 'var(--color-warning)' : 'var(--color-accent-primary)', opacity: m.current ? 0.55 : 1, borderRadius: 6 }} />
          </div>
        ))}
      </div>
      <div className="row gap-2">{months.map((m) => <span key={m.month} className="t-xs t-muted" style={{ flex: 1, textAlign: 'center', fontSize: 10 }}>{monthLabel(m.month, lang).slice(0, 3)}</span>)}</div>
      <span className="t-xs t-muted">{t(K.usage.chartNote)}</span>
    </div>
  );
}

function ServiceSheet({ s, t, lang }: { s: BillingScreenState; t: T; lang: string }) {
  const toast = useToast();
  const d = s.detail && s.detail.serviceId === s.serviceId ? s.detail : null;
  const [changing, setChanging] = useState(false);
  const [tierId, setTierId] = useState('');
  const [when, setWhen] = useState<'renewal' | 'now'>('renewal');
  const [pv, setPv] = useState<TierChangePreview | null>(null);
  const [accepted, setAccepted] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [card, setCard] = useState({ last4: '', expiry: dayStr(new Date(Date.now() + 365 * 86_400_000)) });
  const [editCard, setEditCard] = useState(false);
  const [autoReason, setAutoReason] = useState('');
  const [askAuto, setAskAuto] = useState(false);
  const [renewNote, setRenewNote] = useState('');
  const [askRenew, setAskRenew] = useState(false);
  const [noteMonth, setNoteMonth] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [demo, setDemo] = useState(false);
  useEffect(() => { setChanging(false); setTierId(''); setPv(null); setAccepted([]); setReason(''); setProblem(null); setEditCard(false); setAskAuto(false); setAskRenew(false); setNoteMonth(null); setDemo(false); }, [s.serviceId]);
  useEffect(() => {
    if (!changing || !tierId || !d) { setPv(null); return undefined; }
    let live = true;
    void s.previewTier(d.serviceId, tierId, when).then((r) => { if (live && r.ok) { setPv(r.value); setAccepted([]); } });
    return () => { live = false; };
  }, [changing, tierId, when, d?.serviceId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!s.serviceId) return <Sheet open={false} onClose={() => s.openService(null)} title="" closeLabel={t(K.close)}>{null}</Sheet>;
  const def = serviceDef(s.serviceId);
  const run = async (fn: () => Promise<{ ok: true; value: unknown } | { ok: false; problem: string }>, done: string, after?: () => void): Promise<void> => { setProblem(null); const r = await fn(); if (r.ok) { toast.push(t(done)); after?.(); } else setProblem(r.problem); };
  const need = pv ? [...pv.tradeoffs, ...pv.lost.map((f) => `feature:${f}`)] : [];
  const cur = def?.tiers.find((x) => x.id === d?.tierId) as TierDef;
  const readyChange = !!pv && pv.problems.length === 0 && lettersOf(reason) >= REASON_MIN && need.every((n) => accepted.includes(n));
  return (
    <Sheet open onClose={() => s.openService(null)} title={nameOf(t, s.serviceId)} closeLabel={t(K.close)}>
      {!d || !def || !def.tiers.some((x) => x.id === d.tierId) ? (s.detailLoad === 'error' ? <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.refresh()} /> : <LoadingState label={t(K.loading)} variant="list" rows={3} />) : (
        <div className="stack gap-5" data-service-sheet={d.serviceId}>
          <div className="stack gap-1"><span className="row gap-1 wrap">{d.critical && <Badge tone="neutral">{t(K.services.critical)}</Badge>}<Badge tone="accent">{t(`billing.tier.${d.serviceId}.${d.tierId}`)}</Badge><Badge tone={STATE_TONE[d.state]}>{t(`billing.state.${d.state}`)}</Badge></span><span className="t-xs t-muted">{d.provider}</span>{d.critical && <p className="t-xs">{t(K.sheet.criticalNote)}</p>}</div>

          <Section title={t(K.sheet.planTitle)}>
            <Line label={t(K.sheet.price)} value={t(K.sheet.perMonth, { amount: formatINR(d.tierPrice) })} />
            <Line label={t(K.sheet.included)} value={d.included > 0 ? `${formatNumber(d.included)} ${t(`billing.metric.${d.metric}`)}` : t(K.sheet.none)} />
            <Line label={t(K.sheet.overage)} value={t(K.sheet.perUnit, { amount: cur.overageRate })} />
            <Line label={t(K.sheet.rate)} value={cur.ratePerMin === null ? '—' : t(K.sheet.perMin, { n: formatNumber(cur.ratePerMin as number) })} />
            <Line label={t(K.sheet.need)} value={t(K.sheet.perMin, { n: formatNumber(d.peakPerMin) })} />
            <Line label={t(K.sheet.support)} value={t(`billing.support.${cur.support}`)} />
            <Line label={t(K.sheet.features)} value={cur.features.map((f) => t(`billing.feature.${f}`)).join(', ') || '—'} />
            {d.pending && <p className="t-xs" data-pending style={{ color: 'var(--color-warning)' }}>{t(K.sheet.pending, { tier: t(`billing.tier.${d.serviceId}.${d.pending.tierId}`), date: formatDate(d.pending.at, lang) })}</p>}
          </Section>

          <Section title={t(K.usage.title)} hint={t(K.usage.hint)}>
            <UsageChart months={d.months} t={t} lang={lang} unit={t(`billing.metric.${d.metric}`)} />
            {d.appSends !== null && <p className="t-xs t-muted" data-app-sends>{t(K.usage.appSends, { count: d.appSends })}</p>}
            {d.months.filter((m) => m.spike || m.note).map((m) => (
              <Card key={m.month}>
                <div className="stack gap-1" data-spike-month={m.month}>
                  <span className="row gap-2 wrap" style={{ alignItems: 'center' }}><span className="t-sm t-semibold">{monthLabel(m.month, lang)}</span>{m.spike && <Badge tone="warning">{t(K.usage.spikeBadge, { ratio: m.ratio })}</Badge>}</span>
                  {m.drivers.length > 0 && <span className="t-xs">{t(K.usage.drivers)} {m.drivers.map((x) => `${t(`notifications.group.${x.key}`, { defaultValue: t(`billing.driver.${x.key}`, { defaultValue: x.key }) })} ${formatNumber(x.count)}`).join(' · ')}</span>}
                  {m.note ? <span className="t-xs">{m.note.text} <span className="t-muted">— {m.note.byName}</span></span> : m.spike ? <span className="t-xs t-muted">{t(K.usage.unexplained)}</span> : null}
                  {m.spike && !m.note && noteMonth !== m.month && <div><Button size="sm" variant="ghost" data-act="note-open" onClick={() => { setNoteMonth(m.month); setNoteText(''); setProblem(null); }}>{t(K.usage.addNote)}</Button></div>}
                  {noteMonth === m.month && (
                    <div className="stack gap-2" data-note-form>
                      <Field label={t(K.usage.noteLabel)} hint={`${lettersOf(noteText)}/${NOTE_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={noteText} data-f="usage-note" onChange={(e) => setNoteText(e.target.value)} />}</Field>
                      <Problem t={t} code={problem} />
                      <div className="row gap-2"><Button variant="ghost" onClick={() => setNoteMonth(null)}>{t(K.cancel)}</Button><Button data-act="note-save" disabled={lettersOf(noteText) < NOTE_MIN} loading={s.busy} onClick={() => void run(() => s.noteUsage(d.serviceId, m.month, noteText), K.usage.noteSaved, () => setNoteMonth(null))}>{t(K.usage.noteSave)}</Button></div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </Section>

          <Section title={t(K.advice.title)} hint={t(K.advice.hint)}>
            <p className="t-sm" data-advice={d.advice.direction}>{d.advice.direction === 'same' ? t(`billing.advice.same.${d.advice.why}`) : t(`billing.advice.${d.advice.direction}`, { tier: t(`billing.tier.${d.serviceId}.${d.advice.best}`), amount: formatINR(d.advice.savingMonthly) })}</p>
            <div className="stack gap-2" data-tiers>
              {d.adviceRows.map((r) => (
                <Card key={r.tierId}>
                  <div className="stack gap-1" data-tier={r.tierId}>
                    <span className="row between wrap" style={{ gap: 8, alignItems: 'center' }}><span className="t-sm t-semibold">{t(`billing.tier.${d.serviceId}.${r.tierId}`)}{r.current ? ` · ${t(K.advice.current)}` : ''}</span><span className="t-sm num">{t(K.advice.avgCost, { amount: formatINR(r.avgCost) })}</span></span>
                    {r.tradeoffs.length === 0 ? <span className="t-xs t-muted">{r.current ? t(K.advice.yourPlan) : t(K.advice.noTradeoffs)}</span> : r.tradeoffs.map((x) => <span key={x} className="t-xs" style={{ color: x === 'rate_limit_below_need' ? 'var(--color-error)' : 'var(--color-warning)' }} data-tradeoff={x}><WarningCircle size={12} aria-hidden="true" /> {t(`billing.tradeoff.${x}`, { need: formatNumber(d.peakPerMin) })}</span>)}
                    {r.lost.length > 0 && <span className="t-xs" style={{ color: 'var(--color-warning)' }}>{t(K.advice.lost, { features: r.lost.map((f) => t(`billing.feature.${f}`)).join(', ') })}</span>}
                  </div>
                </Card>
              ))}
            </div>
            {!changing ? <div><Button size="sm" variant="secondary" data-act="change-open" icon={<TrendDown size={14} />} onClick={() => { setChanging(true); setTierId(''); setProblem(null); }}>{t(K.advice.change)}</Button></div> : (
              <Card>
                <div className="stack gap-3" data-change-form>
                  <span className="t-sm t-semibold">{t(K.advice.change)}</span>
                  <div className="row gap-2 wrap" role="group">{d.tiers.filter((x) => x.id !== d.tierId || d.pending).map((x) => <Chip key={x.id} pressed={tierId === x.id} onClick={() => setTierId(x.id)}>{t(`billing.tier.${d.serviceId}.${x.id}`)}</Chip>)}</div>
                  <div className="row gap-2" role="group">{(['renewal', 'now'] as const).map((w) => <Chip key={w} pressed={when === w} onClick={() => setWhen(w)}>{t(`billing.when.${w}`, { date: formatDate(d.renewalDate, lang) })}</Chip>)}</div>
                  {pv && (
                    <div className="stack gap-2" data-preview>
                      <Line label={t(K.advice.thisMonthFrom)} value={formatINR(pv.costFrom)} />
                      <Line label={t(K.advice.thisMonthTo)} value={formatINR(pv.costTo)} />
                      <Line label={t(K.advice.avgDelta)} value={`${pv.avgDelta > 0 ? '+' : ''}${formatINR(pv.avgDelta)}`} />
                      {need.length > 0 && <p className="t-sm t-semibold" style={{ color: 'var(--color-warning)' }}>{t(K.advice.tradeoffsTitle)}</p>}
                      {need.map((n) => (
                        <label key={n} className="row gap-2" style={{ alignItems: 'flex-start', minHeight: 44 }} data-accept={n}>
                          <input type="checkbox" checked={accepted.includes(n)} onChange={(e) => setAccepted((a) => (e.target.checked ? [...a, n] : a.filter((x) => x !== n)))} />
                          <span className="t-sm">{n.startsWith('feature:') ? t(K.advice.loseFeature, { feature: t(`billing.feature.${n.slice(8)}`) }) : t(`billing.tradeoff.${n}`, { need: formatNumber(d.peakPerMin) })}</span>
                        </label>
                      ))}
                      {pv.problems.map((p) => <p key={p} className="t-sm t-error" role="alert" data-problem={p}>{errText(t, p)}</p>)}
                    </div>
                  )}
                  <Field label={t(K.advice.reason)} hint={`${lettersOf(reason)}/${REASON_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={reason} data-f="change-reason" onChange={(e) => setReason(e.target.value)} />}</Field>
                  <Problem t={t} code={problem} />
                  <div className="row gap-2"><Button variant="ghost" onClick={() => { setChanging(false); setPv(null); }}>{t(K.cancel)}</Button><Button className="grow" data-act="change-do" disabled={!readyChange} loading={s.busy} onClick={() => void run(() => s.changeTier(d.serviceId, { tierId, when, reason, accepted }), K.advice.changed, () => { setChanging(false); setPv(null); setReason(''); })}>{t(K.advice.changeGo)}</Button></div>
                </div>
              </Card>
            )}
            {d.changes.length > 0 && <div className="stack gap-1" data-changes>{d.changes.slice(0, 3).map((c) => <span key={c.id} className="t-xs t-muted">{formatDate(c.at, lang)} · {t(`billing.tier.${d.serviceId}.${c.from}`)} → {t(`billing.tier.${d.serviceId}.${c.to}`)} · {c.byName}: {c.reason}</span>)}</div>}
          </Section>

          <Section title={t(K.billing.title)}>
            {d.payBy === 'card' ? (
              <>
                <Line label={t(K.billing.card)} value={d.card ? t(K.billing.cardLine, { last4: d.card.last4, expiry: d.card.expiry }) : t(K.billing.noCard)} />
                {d.state === 'card_expiring' && d.card && <p className="t-xs" style={{ color: 'var(--color-warning)' }}>{t(K.billing.expiring, { days: Math.max(0, d.cardDays ?? 0) })}</p>}
                {!editCard ? <div><Button size="sm" variant="secondary" data-act="card-open" icon={<CreditCard size={14} />} onClick={() => { setEditCard(true); setProblem(null); }}>{t(K.billing.updateCard)}</Button></div> : (
                  <Card>
                    <div className="stack gap-3" data-card-form>
                      <Field label={t(K.billing.last4)} hint={t(K.billing.cardSafe)}>{(p) => <Input id={p.id} inputMode="numeric" maxLength={4} value={card.last4} data-f="card-last4" onChange={(e) => setCard({ ...card, last4: e.target.value.replace(/\D/g, '').slice(0, 4) })} />}</Field>
                      <Field label={t(K.billing.expiry)}>{(p) => <Input id={p.id} type="month" value={card.expiry} data-f="card-expiry" onChange={(e) => setCard({ ...card, expiry: e.target.value })} />}</Field>
                      <Problem t={t} code={problem} />
                      <div className="row gap-2"><Button variant="ghost" onClick={() => setEditCard(false)}>{t(K.cancel)}</Button><Button className="grow" data-act="card-save" disabled={card.last4.length !== 4 || !card.expiry} loading={s.busy} onClick={() => void run(() => s.updateCard(d.serviceId, card), K.billing.cardSaved, () => setEditCard(false))}>{t(K.billing.cardSave)}</Button></div>
                    </div>
                  </Card>
                )}
              </>
            ) : <p className="t-xs" data-settlement>{t(K.billing.settlement)}</p>}
            <Line label={t(K.billing.renews)} value={formatDate(d.renewalDate, lang)} />
            <Toggle checked={d.autoRenew} onChange={() => { setAskAuto(true); setProblem(null); setAutoReason(''); }} label={t(K.billing.auto)} description={d.autoRenew ? t(K.billing.autoOn) : t(K.billing.autoOff)} />
            {askAuto && (
              <div className="stack gap-2" data-auto-form>
                <Field label={t(K.billing.autoReason)} hint={`${lettersOf(autoReason)}/${REASON_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={autoReason} data-f="auto-reason" onChange={(e) => setAutoReason(e.target.value)} />}</Field>
                <Problem t={t} code={problem} />
                <div className="row gap-2"><Button variant="ghost" onClick={() => setAskAuto(false)}>{t(K.cancel)}</Button><Button data-act="auto-save" disabled={lettersOf(autoReason) < REASON_MIN} loading={s.busy} onClick={() => void run(() => s.setAutoRenew(d.serviceId, !d.autoRenew, autoReason), K.billing.autoSaved, () => setAskAuto(false))}>{t(K.billing.autoSave)}</Button></div>
              </div>
            )}
            {(d.lastInvoiceStatus === 'failed') && <div><Button size="sm" data-act="retry" loading={s.busy} onClick={() => void run(() => s.retry(d.serviceId), K.billing.retried)}>{t(K.billing.retry)}</Button></div>}
            {!d.autoRenew && !askRenew && <div><Button size="sm" variant="secondary" data-act="renewed-open" onClick={() => { setAskRenew(true); setRenewNote(''); setProblem(null); }}>{t(K.billing.markRenewed)}</Button></div>}
            {askRenew && (
              <div className="stack gap-2" data-renewed-form>
                <Field label={t(K.billing.renewNote)} hint={`${lettersOf(renewNote)}/${NOTE_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={renewNote} data-f="renew-note" onChange={(e) => setRenewNote(e.target.value)} />}</Field>
                <Problem t={t} code={problem} />
                <div className="row gap-2"><Button variant="ghost" onClick={() => setAskRenew(false)}>{t(K.cancel)}</Button><Button data-act="renewed-save" disabled={lettersOf(renewNote) < NOTE_MIN} loading={s.busy} onClick={() => void run(() => s.markRenewed(d.serviceId, renewNote), K.billing.renewedDone, () => setAskRenew(false))}>{t(K.billing.renewedSave)}</Button></div>
              </div>
            )}
            {!editCard && !askAuto && !askRenew && <Problem t={t} code={problem} />}
            <div className="stack gap-1" data-invoices>
              <span className="t-sm t-semibold">{t(K.billing.invoices)}</span>
              {d.invoices.length === 0 ? <span className="t-xs t-muted">{t(K.billing.noInvoices)}</span> : d.invoices.slice(0, 6).map((i) => (
                <div key={i.id} className="row between wrap" style={{ gap: 8 }} data-invoice={i.status}>
                  <span className="t-xs num">{i.code} · {monthLabel(i.period, lang)}</span>
                  <span className="row gap-1" style={{ alignItems: 'center' }}><span className="t-xs num">{formatINR(i.amount)}</span><Badge tone={i.status === 'paid' ? 'success' : i.status === 'failed' ? 'error' : 'warning'}>{t(`billing.invoiceStatus.${i.status}`)}</Badge>{i.failure && <span className="t-xs t-muted">{t(`billing.failure.${i.failure}`)}</span>}</span>
                </div>
              ))}
            </div>
          </Section>

          {d.payBy === 'card' && (
            <Section title={t(K.demo.title)} hint={t(K.demo.hint)}>
              {!demo ? <div><Button size="sm" variant="ghost" data-act="demo-open" onClick={() => setDemo(true)}>{t(K.demo.open)}</Button></div> : (
                <div className="row gap-2 wrap" data-demo-tools>
                  <Button size="sm" variant="secondary" data-act="demo-declined" loading={s.busy} onClick={() => void s.simulate(d.serviceId, 'declined')}>{t(K.demo.declined)}</Button>
                  <Button size="sm" variant="secondary" data-act="demo-expired" loading={s.busy} onClick={() => void s.simulate(d.serviceId, 'expired')}>{t(K.demo.expired)}</Button>
                  <Button size="sm" variant="ghost" data-act="demo-clear" loading={s.busy} onClick={() => void s.simulate(d.serviceId, 'clear')}>{t(K.demo.clear)}</Button>
                </div>
              )}
            </Section>
          )}
        </div>
      )}
    </Sheet>
  );
}
