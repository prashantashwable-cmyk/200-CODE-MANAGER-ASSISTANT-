import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCircle, ShieldCheck, Wrench } from '@phosphor-icons/react';
import { ActionBar, Badge, Button, Card, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, TextArea, formatDate, formatINR } from '@/design-system';
import type { WarrantyView } from '@/data/repository';
import { MAX_EXTRA_VISITS, NOTE_MIN, amcPrice, endOfTerm, reminderPlan } from '@/features/qc/warranty';
import type { AmcTierId } from '@/features/qc/warranty';
import { useWarranty } from './useWarranty';
import type { ActionResult, WarrantyState } from './useWarranty';
import { CHOICES, WARRANTY_KEYS as K, boardPath, certificatePath, walkthroughPath } from './warranty.types';
import type { Choice } from './warranty.types';

type T = ReturnType<typeof useTranslation>['t'];
const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;

/**
 * Screen 139 — Warranty & AMC Registration. A form: the warranty is shown as three separate layers (the maker's warranty part by part, AIEC's
 * own service warranty, and the optional AMC), read from what was sold and installed at this site, then the AMC choice is recorded and every
 * reminder is set up by itself. Available once the handover walkthrough is done, because the warranty starts on the handover day.
 */
export function WarrantyScreen() {
  const { t } = useTranslation();
  const s = useWarranty();
  const wrap = (body: JSX.Element) => (
    <Screen width="narrow">
      <ScreenHeader title={t(K.title)} />
      {body}
    </Screen>
  );
  // A customer with a single installation is taken straight to it.
  useEffect(() => {
    if (!s.jobId && s.board && s.board.viewer === 'customer' && s.board.rows.length === 1) s.goto(`${boardPath}/${s.board.rows[0].jobId}`, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.board, s.jobId]);
  if (s.status === 'not_found') return wrap(<EmptyState icon={<ShieldCheck size={28} />} title={t(K.notFound.title)} body={t(K.notFound.body)} actionLabel={t(K.notFound.action)} onAction={() => s.goto(boardPath)} />);
  if (s.status === 'loading' && !s.view && !s.board) return wrap(<LoadingState label={t(K.loading)} variant="list" rows={4} />);
  if (s.status === 'error' || (!s.view && !s.board)) return wrap(<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />);
  if (!s.jobId && s.board) return <Board s={s} t={t} />;
  return s.view ? <Form s={s} v={s.view} t={t} /> : null;
}

function Board({ s, t }: { s: WarrantyState; t: T }) {
  const b = s.board!;
  return (
    <Screen width="narrow">
      <ScreenHeader title={t(K.title)} subtitle={t(K.board.heading)} />
      {b.rows.length === 0 ? (
        <EmptyState icon={<ShieldCheck size={32} />} title={t(K.board.emptyTitle)} body={t(K.board.emptyBody)} />
      ) : (
        <Card>
          <div className="stack">
            {b.rows.map((r) => (
              <button key={r.jobId} type="button" onClick={() => s.goto(`${boardPath}/${r.jobId}`)} data-job={r.jobId} className="row gap-3" style={{ minHeight: 64, alignItems: 'center', textAlign: 'left', background: 'none', border: 0, borderBottom: '1px solid var(--color-border)', padding: 'var(--space-2) 0', cursor: 'pointer', color: 'inherit' }}>
                <span className="stack" style={{ flex: 1 }}>
                  <strong className="t-sm">{r.siteName}</strong>
                  <span className="t-xs t-muted">{r.code}{r.amcStatus ? ` · ${t(K.amcStatus[r.amcStatus])}` : ''}</span>
                </span>
                <Badge tone={r.status === 'registered' ? 'success' : r.status === 'ready' ? 'accent' : 'neutral'} dot>{t(K.status[r.status])}</Badge>
              </button>
            ))}
          </div>
        </Card>
      )}
    </Screen>
  );
}

function Problem({ code, t }: { code: string | null; t: T }) {
  return code ? <p className="t-xs t-error" role="alert" data-problem={code}>{t(errorKey(code))}</p> : null;
}

/* ------------------------------------------------------------------ the form */

function Form({ s, v, t }: { s: WarrantyState; v: WarrantyView; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const staff = v.viewer === 'admin';
  const [error, setError] = useState<string | null>(null);
  const d = s.draft;
  const tier = v.amcTiers.find((x) => x.tier === d.tier);
  const extra = Number(d.extra) || 0;
  const extraBad = !Number.isInteger(extra) || extra < 0 || extra > MAX_EXTRA_VISITS;
  const noteNeeded = extra > 0 && letters(d.note) < NOTE_MIN;
  const valid = !!d.choice && (d.choice !== 'enrol' || (!!tier && !extraBad && !noteNeeded));
  const head = (
    <ScreenHeader
      title={t(K.title)}
      subtitle={`${v.job.siteName} · ${v.job.code}`}
      action={<span data-status={v.status}><Badge tone={v.status === 'registered' ? 'success' : v.status === 'ready' ? 'accent' : 'neutral'} dot>{t(K.status[v.status])}</Badge></span>}
    />
  );
  if (v.status === 'not_ready' || !v.terms) {
    return (
      <Screen width="narrow">
        {head}
        <EmptyState icon={<ShieldCheck size={28} />} title={t(K.notReady.title)} body={t(staff ? K.notReady.body : K.notReady.customerBody)} actionLabel={staff ? t(K.notReady.action) : undefined} onAction={staff ? () => s.goto(walkthroughPath(v.job.id)) : undefined} />
      </Screen>
    );
  }
  const terms = v.terms;
  const finish = t(`finishTier.${terms.basis.finishTier}`, { defaultValue: terms.basis.finishTier });
  const drive = t(`driveType.${terms.basis.driveType}`, { defaultValue: terms.basis.driveType });
  const previewReminders = v.status === 'ready' && d.choice && v.amcBegins ? reminderPlan({ registeredAt: new Date().toISOString(), serviceEnd: terms.service.endsOn, amc: { status: d.choice === 'enrol' ? 'active' : d.choice, endsOn: endOfTerm(v.amcBegins, 12) } }) : [];
  return (
    <Screen width="narrow" className={v.actions.register ? 'pb-action-bar' : undefined}>
      {head}

      <Card className="mb-3">
        <div className="stack gap-2" data-hero>
          <div className="row gap-2" style={{ alignItems: 'center' }}>
            <ShieldCheck size={22} aria-hidden="true" />
            <strong className="t-md">{v.startsOn ? t(K.hero.starts, { date: formatDate(v.startsOn, lang) }) : t(K.hero.intro)}</strong>
          </div>
          <p className="t-xs t-muted">{v.frozen && v.registration ? t(K.hero.frozen, { date: formatDate(v.registration.registeredAt, lang) }) : t(K.hero.preview)}</p>
          <p className="t-xs t-muted">{t(K.basis, { code: terms.basis.quotationCode, version: terms.basis.version, drive, finish })}</p>
        </div>
      </Card>

      <Card className="mb-3">
        <div className="stack gap-3" data-layers>
          <strong className="t-md">{t(K.layers.heading)}</strong>
          {([['manufacturer', <ShieldCheck key="m" size={20} />], ['service', <Wrench key="s" size={20} />], ['amc', <Bell key="a" size={20} />]] as const).map(([id, icon]) => (
            <div key={id} className="row gap-3" data-layer={id} style={{ alignItems: 'flex-start' }}>
              <span aria-hidden="true">{icon}</span>
              <span className="stack"><strong className="t-sm">{t(K.layers[id])}</strong><span className="t-xs t-muted">{t(K.layers[`${id}Body` as 'manufacturerBody' | 'serviceBody' | 'amcBody'])}</span></span>
            </div>
          ))}
          <p className="t-xs t-muted"><strong>{t(K.layers.notCovered)}.</strong> {t(K.layers.notCoveredBody)}</p>
        </div>
      </Card>

      <Card className="mb-3">
        <div className="stack gap-2" data-parts>
          <strong className="t-md">{t(K.parts.heading)}</strong>
          <p className="t-xs t-muted">{t(K.parts.intro)}</p>
          {terms.parts.length === 0 ? <p className="t-sm">{t(K.parts.none)}</p> : terms.parts.map((p, i) => (
            <div key={`${p.category}-${i}`} className="stack" data-part={p.category} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
              <div className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="stack" style={{ flex: 1 }}>
                  <strong className="t-sm">{t(K.parts.line, { quantity: p.quantity, description: p.description })}</strong>
                  <span className="t-xs t-muted">{t(`partCategory.${p.category}`, { defaultValue: p.category })}{p.supplierName ? ` · ${t(K.parts.by, { name: p.supplierName })}` : ''}</span>
                </span>
                <span className="t-xs" style={{ textAlign: 'right', maxWidth: '40%' }}>
                  {p.months !== null && p.endsOn ? <>{t(K.parts.months, { count: p.months })}<br />{t(K.parts.until, { date: formatDate(p.endsOn, lang) })}</> : t(K.parts.receipt)}
                </span>
              </div>
              {p.substituted && <span className="t-xs t-muted"><Badge tone="warning">{t(K.parts.substituted)}</Badge> {t(K.parts.substitutedHint)}</span>}
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-3">
        <div className="stack gap-1" data-service>
          <strong className="t-md">{t(K.service.heading)}</strong>
          <p className="t-sm">{t(K.service.line, { count: terms.service.months, date: formatDate(terms.service.endsOn, lang) })}</p>
          {staff && <p className="t-xs t-muted">{t(K.service.note)}</p>}
        </div>
      </Card>

      {v.status === 'ready' ? <Choose s={s} v={v} t={t} tier={tier?.tier} extra={extra} extraBad={extraBad} noteNeeded={noteNeeded} staff={staff} /> : <Registered s={s} v={v} t={t} staff={staff} />}

      {(v.status === 'registered' || previewReminders.length > 0) && (
        <Card className="mb-3">
          <div className="stack gap-2" data-reminders>
            <strong className="t-md">{t(K.reminders.heading)}</strong>
            <p className="t-xs t-muted">{t(K.reminders.intro)}</p>
            {v.status === 'registered'
              ? v.reminders.length === 0
                ? <p className="t-sm">{t(K.reminders.none)}</p>
                : v.reminders.map((r) => (
                    <div key={r.id} className="row gap-2" data-reminder={r.kind} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="t-sm">{t(K.reminders.kind[r.kind])}</span>
                      <span className="t-xs t-muted">{r.sentAt ? t(K.reminders.sent, { date: formatDate(r.sentAt, lang) }) : r.skipped ? t(K.reminders.skipped[r.skipped as 'opted_out']) : t(K.reminders.scheduled, { date: formatDate(r.dueAt, lang) })}</span>
                    </div>
                  ))
              : previewReminders.map((r) => <p key={`${r.kind}${r.dueAt}`} className="t-sm" data-preview-reminder>{t(K.reminders.previewLine, { kind: t(K.reminders.kind[r.kind]), date: formatDate(r.dueAt, lang) })}</p>)}
          </div>
        </Card>
      )}

      {staff && <Button variant="secondary" style={{ width: 'fit-content' }} data-all onClick={() => s.goto(boardPath)}>{t(K.back)}</Button>}

      {v.actions.register && (
        <ActionBar>
          <div className="stack gap-1" style={{ width: '100%' }}>
            <Problem code={error} t={t} />
            {s.restored && <p className="t-xs t-muted" data-restored>{t(K.register.draftRestored)}</p>}
            {!valid && <p className="t-xs t-muted">{t(K.register.waiting)}</p>}
            <Button disabled={!valid || s.busy} style={{ width: '100%' }} data-register onClick={async () => { const r: ActionResult = await s.register(); setError(r.ok ? null : (r.code ?? 'generic')); }}>{t(K.register.button)}</Button>
          </div>
        </ActionBar>
      )}
    </Screen>
  );
}

/* ------------------------------------------------------------------ the AMC options */

interface ChooseProps {
  s: WarrantyState;
  v: WarrantyView;
  t: T;
  tier: AmcTierId | undefined;
  extra: number;
  extraBad: boolean;
  noteNeeded: boolean;
  staff: boolean;
}

function Choose({ s, v, t, tier, extra, extraBad, noteNeeded, staff }: ChooseProps) {
  const { i18n } = useTranslation();
  const d = s.draft;
  const t0 = v.amcTiers.find((x) => x.tier === tier);
  // What was said at the walkthrough is the starting point, never applied by itself.
  const said = v.walkthroughAmc;
  return (
    <Card className="mb-3">
      <div className="stack gap-3" data-amc>
        <strong className="t-md">{t(K.amc.heading)}</strong>
        <p className="t-sm">{t(K.amc.intro)}</p>
        {v.amcBegins && <p className="t-xs t-muted">{t(K.amc.begins, { date: formatDate(v.amcBegins, i18n.language) })}</p>}
        {said && <p className="t-xs t-muted" data-walkthrough-said>{t(K.amc.walkthrough, { choice: t(K.amc.choice[said.choice]) })}</p>}
        <TierList v={v} t={t} />
        <div className="stack gap-2" role="radiogroup" aria-label={t(K.amc.heading)}>
          {CHOICES.map((c) => (
            <div key={c} className="stack gap-1">
              <span data-choice={c}><Chip pressed={d.choice === c} onClick={() => s.setDraft({ choice: c as Choice })}>{t(K.amc.choice[c])}</Chip></span>
              {d.choice === c && <span className="t-xs t-muted">{t(K.amc.choiceHint[c])}</span>}
            </div>
          ))}
        </div>
        {d.choice === 'enrol' && (
          <>
            <div className="stack gap-1">
              <span className="t-xs t-muted">{t(K.amc.tierLabel)}</span>
              <div className="row gap-2 wrap" role="radiogroup" aria-label={t(K.amc.tierLabel)}>
                {v.amcTiers.map((x) => <span key={x.tier} data-tier={x.tier}><Chip pressed={d.tier === x.tier} onClick={() => s.setDraft({ tier: x.tier })}>{t(K.amc.tier[x.tier])}</Chip></span>)}
              </div>
            </div>
            {staff && <Custom s={s} t={t} extraBad={extraBad} noteNeeded={noteNeeded} extra={extra} tier={t0} tierId={tier} />}
            {t0 && tier && <p className="t-sm" data-price><strong className="num">{formatINR(amcPrice(t0, tier, extra))}</strong> · {t(K.amc.price)}</p>}
          </>
        )}
      </div>
    </Card>
  );
}

function TierList({ v, t }: { v: WarrantyView; t: T }) {
  return (
    <div className="stack gap-2" data-tiers>
      {v.amcTiers.map((x) => (
        <div key={x.tier} className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
          <span className="stack"><strong className="t-sm">{t(K.amc.tier[x.tier])}</strong><span className="t-xs t-muted">{t(K.amc.tierLine, { hours: x.responseTimeHours, visits: x.includedVisits })}</span></span>
          <span className="num t-md">{formatINR(x.annualPrice)}</span>
        </div>
      ))}
    </div>
  );
}

function Custom({ s, t, extra, extraBad, noteNeeded, tier, tierId }: { s: WarrantyState; t: T; extra: number; extraBad: boolean; noteNeeded: boolean; tier: { annualPrice: number } | undefined; tierId: AmcTierId | undefined }) {
  const d = s.draft;
  return (
    <div className="stack gap-2" data-custom>
      <strong className="t-sm">{t(K.amc.customHeading)}</strong>
      <p className="t-xs t-muted">{t(K.amc.customHint)}</p>
      <Field label={t(K.amc.extra)} hint={t(K.amc.extraHint)} {...(extraBad ? { error: t(K.problem.extra_visits_invalid) } : {})}>
        {({ id }) => <Input id={id} inputMode="numeric" value={d.extra} onChange={(e) => s.setDraft({ extra: e.target.value.replace(/[^0-9]/g, '') })} />}
      </Field>
      {extra > 0 && tier && tierId && !extraBad && <p className="t-xs" data-extra-price>{t(K.amc.priceExtra, { base: formatINR(tier.annualPrice), count: extra, total: formatINR(amcPrice(tier, tierId, extra)) })}</p>}
      <Field label={t(K.amc.note)} hint={extra > 0 ? t(K.amc.noteAdminHint) : t(K.amc.noteHint)}>
        {({ id }) => <TextArea id={id} rows={2} value={d.note} onChange={(e) => s.setDraft({ note: e.target.value })} />}
      </Field>
      {extra > 0 && !noteNeeded && <p className="t-xs t-muted">{t(K.amc.noteOk)}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ after registering */

function Registered({ s, v, t, staff }: { s: WarrantyState; v: WarrantyView; t: T; staff: boolean }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const amc = v.amc;
  const [choice, setChoice] = useState<AmcTierId | ''>('');
  const [extra, setExtra] = useState('0');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const n = Number(extra) || 0;
  const bad = !Number.isInteger(n) || n < 0 || n > MAX_EXTRA_VISITS;
  const needNote = n > 0 && letters(note) < NOTE_MIN;
  const picked = v.amcTiers.find((x) => x.tier === choice);
  return (
    <Card className="mb-3">
      <div className="stack gap-3" data-registered>
        <div className="row gap-2" style={{ alignItems: 'center' }}>
          <CheckCircle size={22} weight="fill" aria-hidden="true" color="var(--color-success)" />
          <strong className="t-md">{t(K.registered.heading)}</strong>
        </div>
        <Button variant="secondary" style={{ width: 'fit-content' }} data-certificate-link onClick={() => s.goto(certificatePath(v.job.id))}>{t(K.registered.certificate)}</Button>
        {v.registration && <p className="t-xs t-muted">{t(K.registered.line, { name: v.registration.registeredByName, date: formatDate(v.registration.registeredAt, lang) })}</p>}
        {amc?.status === 'active' && amc.tier ? (
          <div className="stack gap-2" data-amc-active>
            <p className="t-sm"><strong>{t(K.registered.amcActive, { tier: t(K.amc.tier[amc.tier]) })}</strong> · {t(K.amc.tierLine, { hours: amc.responseTimeHours ?? 0, visits: (amc.includedVisits ?? 0) + amc.extraVisits })}</p>
            {amc.terms.map((x) => <p key={x.n} className="t-xs" data-term={x.n}>{t(K.registered.term, { n: x.n, from: formatDate(x.startsOn, lang), to: formatDate(x.endsOn, lang), price: formatINR(x.price) })}</p>)}
            {amc.extraVisits > 0 && <p className="t-xs t-muted">{t(K.registered.custom, { count: amc.extraVisits, note: amc.note ?? '' })}</p>}
            {v.actions.renew ? (
              <>
                <Problem code={error} t={t} />
                <Button disabled={s.busy} style={{ width: 'fit-content' }} data-renew onClick={async () => { const r = await s.renew(); setError(r.ok ? null : (r.code ?? 'generic')); }}>{t(K.registered.renew)}</Button>
              </>
            ) : v.renewFrom && <p className="t-xs t-muted">{t(K.registered.renewFrom, { date: formatDate(v.renewFrom, lang) })}</p>}
          </div>
        ) : (
          <div className="stack gap-2" data-amc-open>
            <p className="t-sm">{t(amc?.status === 'later' ? K.registered.later : K.registered.declined)}</p>
            {v.actions.enrol && (
              <>
                <strong className="t-sm">{t(K.registered.reconsider)}</strong>
                <p className="t-xs t-muted">{t(K.registered.reconsiderBody)}</p>
                <TierList v={v} t={t} />
                <div className="row gap-2 wrap" role="radiogroup" aria-label={t(K.amc.tierLabel)}>
                  {v.amcTiers.map((x) => <span key={x.tier} data-tier={x.tier}><Chip pressed={choice === x.tier} onClick={() => setChoice(x.tier)}>{t(K.amc.tier[x.tier])}</Chip></span>)}
                </div>
                {staff && (
                  <div className="stack gap-2" data-custom>
                    <Field label={t(K.amc.extra)} hint={t(K.amc.extraHint)} {...(bad ? { error: t(K.problem.extra_visits_invalid) } : {})}>{({ id }) => <Input id={id} inputMode="numeric" value={extra} onChange={(e) => setExtra(e.target.value.replace(/[^0-9]/g, ''))} />}</Field>
                    <Field label={t(K.amc.note)} hint={n > 0 ? t(K.amc.noteAdminHint) : t(K.amc.noteHint)}>{({ id }) => <TextArea id={id} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
                  </div>
                )}
                {picked && !bad && <p className="t-sm" data-price><strong className="num">{formatINR(amcPrice(picked, picked.tier, n))}</strong> · {t(K.amc.price)}</p>}
                <Problem code={error} t={t} />
                <Button disabled={!choice || bad || needNote || s.busy} style={{ width: 'fit-content' }} data-enrol onClick={async () => { const r = await s.enrol(choice as AmcTierId, n, note); setError(r.ok ? null : (r.code ?? 'generic')); }}>{t(K.registered.enrolGo)}</Button>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
