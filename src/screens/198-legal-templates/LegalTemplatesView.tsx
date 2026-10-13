import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, ClipboardText, FileText, Handshake, MapPinLine, Plus, ShieldCheck, Truck, WarningCircle } from '@phosphor-icons/react';
import { Badge, Button, Card, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, Tabs, TextArea, formatDate, useToast } from '@/design-system';
import type { LegalDocDetail, LegalDocRow, LegalOverview, LegalPropagation, LegalReviewView, LegalRevisionPreview, LegalRevisionView, LegalStateRow } from '@/data/repository';
import { CATEGORIES, CLOSE_NOTE_MIN, FIX_DAYS, INDIAN_STATES, MIN_TEXT, NOTE_MIN, REASONS, REFERENCE_MIN, defaultNextDue, needsReference } from '@/features/legal/legal';
import type { LegalCategory, LegalReviewState } from '@/features/legal/legal';
import { lettersOf } from '@/features/security/security';
import { LEGAL_TEMPLATES_KEYS as K, TABS } from './legal-templates.types';
import { useLegalTemplates } from './useLegalTemplates';
import type { LegalScreenState } from './useLegalTemplates';

type T = ReturnType<typeof useTranslation>['t'];
const errText = (t: T, code: string) => t(`legal.error.${code}`, { defaultValue: t(K.error.generic) });
const REVIEW_TONE: Record<LegalReviewState, 'success' | 'warning' | 'error' | 'neutral'> = { never: 'neutral', current: 'success', due: 'warning', outdated: 'warning', issue_open: 'error' };
const CATEGORY_ICON: Record<LegalCategory, ReactNode> = { contract: <FileText size={20} />, state: <MapPinLine size={20} />, partner: <Handshake size={20} />, supplier: <Truck size={20} />, privacy: <ShieldCheck size={20} />, guidance: <ClipboardText size={20} /> };
const todayOf = (): string => new Date().toISOString().slice(0, 10);

const docTitle = (t: T, d: Pick<LegalDocRow, 'category' | 'ref' | 'refLabel'>): string => {
  switch (d.category) {
    case 'contract': return t(K.doc.contract, { name: d.refLabel });
    case 'state': return t(K.doc.state, { name: d.ref });
    case 'partner': return t(K.doc.partner, { role: t(`legal.role.${d.ref}`) });
    case 'supplier': return t(K.doc.supplier);
    case 'privacy': return t(K.doc.privacy);
    default: return t(K.doc.guidance, { name: d.ref });
  }
};
const reviewDocTitle = (t: T, r: LegalReviewView): string => {
  const ref = r.docKey.slice(r.docKey.indexOf(':') + 1);
  return docTitle(t, { category: r.category, ref, refLabel: r.refLabel });
};

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
  return <div className="row between wrap" style={{ gap: 8 }}><span className="t-sm t-muted">{label}</span><span className="t-sm">{value}</span></div>;
}
const Problem = ({ t, code }: { t: T; code: string | null }) => (code ? <p className="t-sm t-error" role="alert" data-problem={code}>{errText(t, code)}</p> : null);

function ReviewBadge({ t, state }: { t: T; state: LegalReviewState }) {
  return <Badge tone={REVIEW_TONE[state]}>{t(`legal.review.${state}`)}</Badge>;
}

/** Screen 198 — Legal & Contract Templates. One place for the wording AIEC uses, its versions, the day each takes effect and the day a professional last reviewed it. */
export function LegalTemplatesScreen() {
  const { t, i18n } = useTranslation();
  const s = useLegalTemplates();
  const [reviewing, setReviewing] = useState(false);
  const [stateForm, setStateForm] = useState<string | null>(null);
  const head = <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh onClick={() => void s.refresh()}>{t(K.refresh)}</Button>} />;
  if (s.load === 'loading' && !s.overview) return <Screen width="default">{head}<LoadingState label={t(K.loading)} variant="list" rows={5} /></Screen>;
  if (s.load === 'error' && !s.overview) return <Screen width="default">{head}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.refresh()} /></Screen>;
  const o = s.overview;
  if (!o) return null;
  const lang = i18n.language;
  return (
    <Screen width="default">
      {head}
      <div className="stack gap-5">
        {s.offline && <p className="t-xs t-muted" role="status" data-offline>{t(K.offline)}</p>}
        <Card><p className="t-sm" data-advice-note>{t(K.note.advice)}</p></Card>
        <div className="grid-auto" data-summary style={{ ['--min' as string]: '150px' }}>
          <Card><div className="stack gap-0"><span className="t-xs t-muted">{t(K.summary.docs)}</span><span className="t-lg t-semibold num" data-count="docs">{o.counts.total}</span></div></Card>
          <Card><div className="stack gap-0"><span className="t-xs t-muted">{t(K.summary.needReview)}</span><span className="t-lg t-semibold num" data-count="need">{o.counts.never + o.counts.due + o.counts.outdated}</span></div></Card>
          <Card><div className="stack gap-0"><span className="t-xs t-muted">{t(K.summary.issues)}</span><span className="t-lg t-semibold num" data-count="issues" style={{ color: o.counts.issues ? 'var(--color-error)' : undefined }}>{o.counts.issues}</span></div></Card>
          <Card><div className="stack gap-0"><span className="t-xs t-muted">{t(K.summary.scheduled)}</span><span className="t-lg t-semibold num" data-count="scheduled">{o.counts.scheduled}</span></div></Card>
        </div>

        {o.issues.length > 0 && (
          <section className="stack gap-2" data-issues role="alert">
            <h2 className="t-md t-semibold row gap-2" style={{ alignItems: 'center', color: 'var(--color-error)' }}><WarningCircle size={20} weight="fill" />{t(K.issues.title)}</h2>
            <p className="t-sm">{t(K.issues.body, { days: FIX_DAYS })}</p>
            <div className="grid-auto">
              {o.issues.map((r) => (
                <Card key={r.id} onClick={() => s.openDoc(r.docKey)}>
                  <div className="stack gap-1" data-issue={r.id} style={{ borderLeft: '3px solid var(--color-error)', paddingLeft: 10 }}>
                    <span className="t-sm t-semibold">{reviewDocTitle(t, r)}</span>
                    <span className="t-xs">{r.note}</span>
                    <span className="row gap-1 wrap"><Badge tone={r.fixLate ? 'error' : 'warning'}>{r.fixLate ? t(K.issues.late) : t(K.issues.fixBy, { date: formatDate(r.fixDueAt ?? r.recordedAt, lang) })}</Badge></span>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        <PropagationCard p={o.propagation} t={t} lang={lang} />

        <Tabs label={t(K.tab.label)} value={s.tab} onChange={(id) => s.setTab(id as (typeof TABS)[number])} items={TABS.map((id) => ({ id, label: t(`legal.tab.${id}`) }))} />
        {s.tab === 'library' && <LibraryTab o={o} s={s} t={t} lang={lang} />}
        {s.tab === 'states' && <StatesTab o={o} s={s} t={t} lang={lang} onForm={setStateForm} />}
        {s.tab === 'reviews' && <ReviewsTab o={o} s={s} t={t} lang={lang} onAdd={() => setReviewing(true)} />}
        <p className="t-xs t-muted" data-placeholder-note>{t(K.note.placeholders)}</p>
      </div>
      <DocSheet s={s} t={t} lang={lang} />
      <Sheet open={reviewing} onClose={() => setReviewing(false)} title={t(K.review.form.title)} closeLabel={t(K.close)}>
        {reviewing && <ReviewForm s={s} t={t} docs={o.docs} fixedKey={null} onDone={() => setReviewing(false)} />}
      </Sheet>
      <Sheet open={stateForm !== null} onClose={() => setStateForm(null)} title={stateForm ? t(K.states.form.titleExisting, { state: stateForm }) : t(K.states.form.title)} closeLabel={t(K.close)}>
        {stateForm !== null && <StateForm s={s} t={t} o={o} initial={stateForm} onDone={() => setStateForm(null)} />}
      </Sheet>
    </Screen>
  );
}

function PropagationCard({ p, t, lang }: { p: LegalPropagation; t: T; lang: string }) {
  const clear = p.behind === 0 && p.signedOlder === 0 && p.fallback === 0;
  return (
    <Section title={t(K.prop.title)} hint={t(K.prop.hint)}>
      <div className="stack gap-1" data-propagation data-behind={p.behind}>
        {p.behind > 0 && <p className="t-sm t-semibold" data-behind style={{ color: 'var(--color-warning)' }}>{t(K.prop.behind, { count: p.behind })}</p>}
        {p.behind === 0 && <p className="t-sm" data-clear>{t(K.prop.clear)}</p>}
        {p.signedOlder > 0 && <p className="t-xs">{t(K.prop.signedOlder, { count: p.signedOlder })}</p>}
        {p.fallback > 0 && <p className="t-xs t-muted">{t(K.prop.fallback, { count: p.fallback })}</p>}
        {!clear && p.items.length > 0 && (
          <div className="stack gap-1" data-prop-items>
            <span className="t-xs t-muted">{t(K.prop.sample)}</span>
            {p.items.map((i) => (
              <div key={i.contractId} className="row between wrap" style={{ gap: 8 }}>
                <span className="t-sm">{i.siteName} <span className="t-xs t-muted">v{i.version}</span></span>
                <span className="row gap-2" style={{ alignItems: 'center' }}><Badge tone={i.kind === 'behind' ? 'warning' : 'neutral'}>{t(`legal.prop.signature.${i.signature}`)}</Badge>{i.kind === 'behind' && <Link className="t-xs" to={`/admin/deals/${i.dealId}/contract`} data-contract-link={i.dealId}>{t(K.prop.open)}</Link>}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <span hidden>{lang}</span>
    </Section>
  );
}

/* ----------------------------------------------------------------- Library */

function DocRow({ d, t, lang, onOpen }: { d: LegalDocRow; t: T; lang: string; onOpen: () => void }) {
  const gapsLine = d.gaps.length > 0 ? (d.category === 'contract' ? t(K.row.gaps, { count: d.gaps.length }) : t(K.row.gapTemplates, { count: d.gaps.length })) : null;
  return (
    <Card onClick={onOpen}>
      <div className="row gap-3" data-doc={d.key} data-review={d.review} style={{ alignItems: 'flex-start' }}>
        <span style={{ color: 'var(--color-accent-secondary)', paddingTop: 2 }}>{CATEGORY_ICON[d.category]}</span>
        <div className="stack gap-1 grow" style={{ minWidth: 0 }}>
          <span className="row between wrap" style={{ gap: 8, alignItems: 'flex-start' }}>
            <span className="t-sm t-semibold">{docTitle(t, d)}</span>
            <span className="row gap-1 wrap" style={{ justifyContent: 'flex-end' }}><ReviewBadge t={t} state={d.review} />{d.scheduled && <Badge tone="accent" data-scheduled>{t(K.row.scheduled, { date: formatDate(d.scheduled.effectiveFrom, lang) })}</Badge>}</span>
          </span>
          <span className="t-xs t-muted">{t(K.row.version, { v: d.version })} · {t(K.row.since, { date: formatDate(d.effectiveFrom, lang) })} · {d.editable ? t(K.row.written) : t(K.row.elsewhere)}</span>
          <span className="t-xs">{d.lastReviewOn ? t(K.row.reviewedOn, { date: formatDate(d.lastReviewOn, lang) }) : t(K.row.neverReviewed)}{d.lastReviewer ? ` · ${t(K.review.by, { who: d.lastReviewer })}` : ''}</span>
          {gapsLine && <span className="t-xs" data-gap style={{ color: 'var(--color-warning)' }}>{gapsLine}</span>}
        </div>
      </div>
    </Card>
  );
}

function LibraryTab({ o, s, t, lang }: { o: LegalOverview; s: LegalScreenState; t: T; lang: string }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<LegalCategory | null>(null);
  const [rev, setRev] = useState<LegalReviewState | null>(null);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return o.docs.filter((d) => (!cat || d.category === cat) && (!rev || d.review === rev) && (!needle || `${docTitle(t, d)} ${d.refLabel} ${t(`legal.category.${d.category}`)}`.toLowerCase().includes(needle)));
  }, [o.docs, q, cat, rev, t]);
  const counts = (c: LegalCategory) => o.docs.filter((d) => d.category === c).length;
  const order: LegalReviewState[] = ['issue_open', 'due', 'outdated', 'never', 'current'];
  return (
    <div className="stack gap-3">
      <div className="stack gap-2 sticky-under-shell" style={{ background: 'var(--color-bg)', paddingBlock: 8 }}>
        <Input value={q} placeholder={t(K.library.search)} aria-label={t(K.library.search)} data-f="library-search" onChange={(e) => setQ(e.target.value)} />
        <div className="row gap-2 wrap" role="group" data-cats>
          <Chip pressed={cat === null} onClick={() => setCat(null)}>{t(K.library.all)} {o.docs.length}</Chip>
          {CATEGORIES.filter((c) => counts(c) > 0).map((c) => <span key={c} data-cat={c}><Chip pressed={cat === c} onClick={() => setCat(cat === c ? null : c)}>{t(`legal.category.${c}`)} {counts(c)}</Chip></span>)}
        </div>
        <div className="row gap-2 wrap" role="group" data-revs>
          {order.map((r) => <span key={r} data-rev={r}><Chip pressed={rev === r} onClick={() => setRev(rev === r ? null : r)}>{t(`legal.review.${r}`)} {o.docs.filter((d) => d.review === r).length}</Chip></span>)}
        </div>
      </div>
      {o.docs.length === 0 ? <EmptyState title={t(K.library.empty)} body={t(K.library.emptyHint)} actionLabel={t(K.refresh)} onAction={() => void s.refresh()} />
        : shown.length === 0 ? <EmptyState title={t(K.library.noMatch)} body={t(K.library.noMatchHint)} actionLabel={t(K.library.clear)} onAction={() => { setQ(''); setCat(null); setRev(null); }} />
        : <div className="grid-auto" data-library style={{ ['--min' as string]: '300px' }}>{shown.map((d) => <DocRow key={d.key} d={d} t={t} lang={lang} onOpen={() => s.openDoc(d.key)} />)}</div>}
    </div>
  );
}

/* ----------------------------------------------------------------- States */

function StatesTab({ o, s, t, lang, onForm }: { o: LegalOverview; s: LegalScreenState; t: T; lang: string; onForm: (state: string | '') => void }) {
  return (
    <div className="stack gap-4">
      <div className="row between wrap" style={{ gap: 8, alignItems: 'center' }}>
        <p className="t-xs t-muted grow" style={{ minWidth: 220 }}>{t(K.states.hint)}</p>
        <Button size="sm" icon={<Plus size={16} />} data-act="state-add" onClick={() => onForm('')}>{t(K.states.add)}</Button>
      </div>
      {o.states.length === 0 ? <EmptyState title={t(K.states.empty)} body={t(K.states.emptyHint)} actionLabel={t(K.states.add)} onAction={() => onForm('')} /> : (
        <div className="grid-auto" data-states style={{ ['--min' as string]: '320px' }}>
          {o.states.map((st) => <StateCard key={st.state} st={st} s={s} t={t} lang={lang} onForm={onForm} />)}
        </div>
      )}
    </div>
  );
}

function StateCard({ st, s, t, lang, onForm }: { st: LegalStateRow; s: LegalScreenState; t: T; lang: string; onForm: (state: string) => void }) {
  const missing = st.coverage.filter((c) => !c.has).length;
  return (
    <Card>
      <div className="stack gap-3" data-state={st.state} data-missing={missing}>
        <div className="row between wrap" style={{ gap: 8, alignItems: 'flex-start' }}>
          <span className="t-md t-semibold">{st.state}</span>
          <span className="row gap-1 wrap" style={{ justifyContent: 'flex-end' }}><Badge tone={missing ? 'warning' : 'success'}>{missing ? t(K.states.missing) : t(K.states.has)}</Badge><Badge tone="neutral">{t(K.states.contracts, { count: st.contracts })}</Badge></span>
        </div>
        <Line label={t(K.states.authority)} value={st.authority} />
        <div className="stack gap-1"><span className="t-xs t-muted">{t(K.states.cities)}</span><span className="t-sm" data-cities>{st.cities.join(', ')}</span></div>
        <div className="stack gap-2">
          <span className="t-xs t-muted">{t(K.states.coverage)}</span>
          {st.coverage.map((c) => (
            <div key={c.templateId} className="row between wrap" style={{ gap: 8, alignItems: 'center' }} data-coverage={c.templateId} data-has={c.has}>
              <span className="t-sm">{c.templateName}</span>
              <span className="row gap-2" style={{ alignItems: 'center' }}>
                <Badge tone={c.has ? 'success' : 'warning'}>{c.has ? t(K.states.has) : t(K.states.missing)}</Badge>
                {c.scheduled && <Badge tone="accent">{t(K.states.pending)}</Badge>}
                <Button size="sm" variant="ghost" data-act="clause" onClick={() => s.openDoc(`contract:${c.templateId}`, `${c.templateId}|${st.state}`)}>{c.has ? t(K.states.editClause) : t(K.states.addClause)}</Button>
              </span>
            </div>
          ))}
        </div>
        {missing > 0 && <p className="t-xs" style={{ color: 'var(--color-warning)' }}>{t(K.states.fallback)}</p>}
        <details data-state-events><summary className="t-xs t-muted" style={{ cursor: 'pointer' }}>{t(K.states.history)}</summary><div className="stack gap-1" style={{ paddingTop: 8 }}>{[...st.events].reverse().map((e, i) => <span key={i} className="t-xs">{formatDate(e.at, lang)} · {t(`legal.states.event.${e.kind}`)}{e.note ? `: ${e.note}` : ''} · {e.byName}</span>)}</div></details>
        <div><Button size="sm" variant="secondary" data-act="cities-add" onClick={() => onForm(st.state)}>{t(K.states.addCities)}</Button></div>
      </div>
    </Card>
  );
}

function StateForm({ s, t, o, initial, onDone }: { s: LegalScreenState; t: T; o: LegalOverview; initial: string; onDone: () => void }) {
  const toast = useToast();
  const [state, setState] = useState(initial);
  const [cities, setCities] = useState('');
  const [authority, setAuthority] = useState('');
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const exists = o.states.some((x) => x.state === state);
  const save = async () => {
    setProblem(null);
    const r = await s.saveState({ state, cities, authority, note });
    if (r.ok) { toast.push(t(K.states.form.saved)); onDone(); } else setProblem(r.problem);
  };
  return (
    <div className="stack gap-4" data-state-form>
      <Field label={t(K.states.form.state)}>{(p) => (
        <Select id={p.id} value={state} data-f="state-name" disabled={!!initial} onChange={(e) => setState(e.target.value)}>
          <option value="">—</option>
          {INDIAN_STATES.map((n) => <option key={n} value={n}>{n}</option>)}
        </Select>
      )}</Field>
      <Field label={t(K.states.form.cities)} hint={t(K.states.form.citiesHint)}>{(p) => <TextArea id={p.id} rows={3} value={cities} data-f="state-cities" onChange={(e) => setCities(e.target.value)} />}</Field>
      {!exists && <Field label={t(K.states.form.authority)}>{(p) => <Input id={p.id} value={authority} data-f="state-authority" onChange={(e) => setAuthority(e.target.value)} />}</Field>}
      {!exists && <Field label={t(K.states.form.note)}>{(p) => <Input id={p.id} value={note} data-f="state-note" onChange={(e) => setNote(e.target.value)} />}</Field>}
      {!exists && <p className="t-xs t-muted">{t(K.states.form.next)}</p>}
      <Problem t={t} code={problem} />
      <div className="row gap-2"><Button variant="ghost" onClick={onDone}>{t(K.cancel)}</Button><Button className="grow" data-act="state-save" disabled={!state || lettersOf(cities) < 2} loading={s.busy} onClick={() => void save()}>{t(K.states.form.save)}</Button></div>
    </div>
  );
}

/* ----------------------------------------------------------------- Reviews */

function ReviewCard({ r, t, lang, onOpen }: { r: LegalReviewView; t: T; lang: string; onOpen: () => void }) {
  const tone = r.status === 'issue_open' ? 'error' : r.status === 'clear' ? 'success' : 'warning';
  return (
    <Card onClick={onOpen}>
      <div className="stack gap-1" data-review-card={r.id} data-status={r.status}>
        <span className="row between wrap" style={{ gap: 8, alignItems: 'flex-start' }}><span className="t-sm t-semibold">{reviewDocTitle(t, r)}</span><Badge tone={tone}>{t(`legal.reviews.status.${r.status}`)}</Badge></span>
        <span className="t-xs">{formatDate(r.reviewedOn, lang)} · {r.reviewer}{r.firm ? ` · ${r.firm}` : ''} · {t(K.reviews.version, { v: r.versionReviewed })}</span>
        <span className="t-xs">{r.note}</span>
        <span className="t-xs t-muted">{t(K.reviews.next, { date: formatDate(r.nextDueOn, lang) })} · {t(K.reviews.recordedBy, { who: r.recordedBy })}</span>
        {r.closeNote && <span className="t-xs" data-close-note>{r.closeNote}</span>}
      </div>
    </Card>
  );
}

function ReviewsTab({ o, s, t, lang, onAdd }: { o: LegalOverview; s: LegalScreenState; t: T; lang: string; onAdd: () => void }) {
  return (
    <div className="stack gap-3">
      <div className="row between wrap" style={{ gap: 8, alignItems: 'center' }}>
        <p className="t-xs t-muted grow" style={{ minWidth: 220 }}>{t(K.reviews.hint)}</p>
        <Button size="sm" icon={<Plus size={16} />} data-act="review-add" onClick={onAdd}>{t(K.reviews.add)}</Button>
      </div>
      {o.reviews.length === 0 ? <EmptyState title={t(K.reviews.empty)} body={t(K.reviews.emptyHint)} actionLabel={t(K.reviews.add)} onAction={onAdd} />
        : <div className="grid-auto" data-reviews style={{ ['--min' as string]: '320px' }}>{o.reviews.map((r) => <ReviewCard key={r.id} r={r} t={t} lang={lang} onOpen={() => s.openDoc(r.docKey)} />)}</div>}
    </div>
  );
}

function ReviewForm({ s, t, docs, fixedKey, onDone }: { s: LegalScreenState; t: T; docs: LegalDocRow[]; fixedKey: string | null; onDone: () => void }) {
  const toast = useToast();
  const [docKey, setDocKey] = useState(fixedKey ?? '');
  const [on, setOn] = useState(todayOf());
  const [who, setWho] = useState('');
  const [firm, setFirm] = useState('');
  const [outcome, setOutcome] = useState<'clear' | 'issues_found'>('clear');
  const [note, setNote] = useState('');
  const [next, setNext] = useState(defaultNextDue(todayOf()));
  const [nextTouched, setNextTouched] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const doc = docs.find((d) => d.key === docKey);
  const save = async () => {
    setProblem(null);
    const r = await s.recordReview({ docKey, reviewedOn: on, reviewer: who, firm, outcome, note, nextDueOn: next });
    if (r.ok) { toast.push(t(outcome === 'issues_found' ? K.review.form.issueSaved : K.review.form.saved)); onDone(); } else setProblem(r.problem);
  };
  return (
    <div className="stack gap-3" data-review-form>
      {fixedKey === null && (
        <Field label={t(K.review.form.doc)}>{(p) => (
          <Select id={p.id} value={docKey} data-f="review-doc" onChange={(e) => setDocKey(e.target.value)}>
            <option value="">—</option>
            {docs.map((d) => <option key={d.key} value={d.key}>{docTitle(t, d)}</option>)}
          </Select>
        )}</Field>
      )}
      <Field label={t(K.review.form.on)}>{(p) => <Input id={p.id} type="date" max={todayOf()} value={on} data-f="review-on" onChange={(e) => { setOn(e.target.value); if (!nextTouched && e.target.value) setNext(defaultNextDue(e.target.value)); }} />}</Field>
      <Field label={t(K.review.form.who)}>{(p) => <Input id={p.id} value={who} data-f="review-who" onChange={(e) => setWho(e.target.value)} />}</Field>
      <Field label={t(K.review.form.firm)}>{(p) => <Input id={p.id} value={firm} data-f="review-firm" onChange={(e) => setFirm(e.target.value)} />}</Field>
      <div className="stack gap-1"><span className="t-sm t-semibold">{t(K.review.form.outcome)}</span><div className="row gap-2 wrap" role="group"><span data-outcome="clear"><Chip pressed={outcome === 'clear'} onClick={() => setOutcome('clear')}>{t(K.review.form.clear)}</Chip></span><span data-outcome="issues_found"><Chip pressed={outcome === 'issues_found'} onClick={() => setOutcome('issues_found')}>{t(K.review.form.issues)}</Chip></span></div></div>
      {outcome === 'issues_found' && <p className="t-sm" data-issue-note style={{ color: 'var(--color-error)' }}>{t(K.review.form.issueNote, { days: FIX_DAYS })}</p>}
      <Field label={t(K.review.form.note)} hint={`${lettersOf(note)}/${NOTE_MIN}`}>{(p) => <TextArea id={p.id} rows={3} value={note} data-f="review-note" onChange={(e) => setNote(e.target.value)} />}</Field>
      <Field label={t(K.review.form.next)}>{(p) => <Input id={p.id} type="date" value={next} data-f="review-next" onChange={(e) => { setNext(e.target.value); setNextTouched(true); }} />}</Field>
      {doc && <p className="t-xs t-muted">{t(K.review.form.versionNote, { v: doc.version })}</p>}
      <Problem t={t} code={problem} />
      <div className="row gap-2"><Button variant="ghost" onClick={onDone}>{t(K.cancel)}</Button><Button className="grow" data-act="review-save" disabled={!docKey || lettersOf(who) < 3 || lettersOf(note) < NOTE_MIN} loading={s.busy} onClick={() => void save()}>{t(K.review.form.save)}</Button></div>
    </div>
  );
}

/* ----------------------------------------------------------------- A document */

function HistoryItem({ h, t, lang, s }: { h: LegalRevisionView; t: T; lang: string; s: LegalScreenState }) {
  const toast = useToast();
  const [before, setBefore] = useState(false);
  const [asking, setAsking] = useState(false);
  const [why, setWhy] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const when = h.status === 'scheduled' ? t(K.hist.scheduled, { date: formatDate(h.effectiveFrom, lang) }) : h.status === 'cancelled' ? t(K.hist.cancelled) : t(K.hist.applied, { date: formatDate(h.effectiveFrom, lang) });
  const what = h.state ? t(K.hist.stateKind, { state: h.state }) : t(K.hist.nationalKind);
  return (
    <Card>
      <div className="stack gap-1" data-revision={h.code} data-status={h.status}>
        <span className="row between wrap" style={{ gap: 8, alignItems: 'flex-start' }}><span className="t-sm t-semibold">{h.code} · {what}</span><Badge tone={h.status === 'scheduled' ? 'accent' : h.status === 'cancelled' ? 'neutral' : 'success'}>{when}</Badge></span>
        <span className="t-xs">{t(`legal.hist.reason.${h.reason}`)} · {h.byName}{h.version ? ` · ${t(K.row.version, { v: h.version })}` : ''}</span>
        <span className="t-xs">{h.changeNote}</span>
        {h.reference && <span className="t-xs t-muted">{t(K.hist.reference, { ref: h.reference })}</span>}
        {h.cancelReason && <span className="t-xs t-muted">{h.cancelReason}</span>}
        <div><Button size="sm" variant="ghost" data-act="before-toggle" onClick={() => setBefore((b) => !b)}>{before ? t(K.hist.hideBefore) : t(K.hist.showBefore)}</Button></div>
        {before && <div className="stack gap-1" data-before><span className="t-xs t-semibold">{t(K.hist.before)}</span><p className="t-xs" style={{ whiteSpace: 'pre-wrap' }}>{h.previousText || '—'}</p><span className="t-xs t-semibold">{t(K.hist.after)}</span><p className="t-xs" style={{ whiteSpace: 'pre-wrap' }}>{h.text}</p></div>}
        {h.status === 'scheduled' && !asking && <div><Button size="sm" variant="secondary" data-act="cancel-open" onClick={() => setAsking(true)}>{t(K.hist.cancel)}</Button></div>}
        {asking && (
          <div className="stack gap-2" data-cancel-form>
            <Field label={t(K.hist.cancelReason)} hint={`${lettersOf(why)}/10`}>{(p) => <TextArea id={p.id} rows={2} value={why} data-f="cancel-reason" onChange={(e) => setWhy(e.target.value)} />}</Field>
            <Problem t={t} code={problem} />
            <div className="row gap-2"><Button variant="ghost" onClick={() => setAsking(false)}>{t(K.cancel)}</Button><Button data-act="cancel-do" disabled={lettersOf(why) < 10} loading={s.busy} onClick={async () => { setProblem(null); const r = await s.cancelRevision(h.id, why); if (r.ok) { toast.push(t(K.hist.cancelled2)); setAsking(false); } else setProblem(r.problem); }}>{t(K.hist.cancelDo)}</Button></div>
          </div>
        )}
      </div>
    </Card>
  );
}

function EditForm({ s, t, lang, d, startKey, issueOpen, onDone }: { s: LegalScreenState; t: T; lang: string; d: LegalDocDetail; startKey: string | null; issueOpen: boolean; onDone: () => void }) {
  const toast = useToast();
  const targets = useMemo(() => {
    if (d.row.category === 'contract') return [{ key: `${d.row.ref}|`, templateId: d.row.ref, state: null as string | null, text: d.text ?? '' }, ...d.clauses.map((c) => ({ key: `${c.templateId}|${c.state}`, templateId: c.templateId, state: c.state as string | null, text: c.text ?? '' }))];
    return d.clauses.map((c) => ({ key: `${c.templateId}|${c.state}`, templateId: c.templateId, state: c.state as string | null, text: c.text ?? '' }));
  }, [d]);
  const first = targets.find((x) => x.key === startKey) ?? targets[0];
  const [targetKey, setTargetKey] = useState(first?.key ?? '');
  const target = targets.find((x) => x.key === targetKey) ?? first;
  const [text, setText] = useState(first?.text ?? '');
  const [note, setNote] = useState('');
  const [reason, setReason] = useState<string>(issueOpen ? 'legal_review' : first && first.state && !first.text ? 'new_state' : 'correction');
  const [reference, setReference] = useState('');
  const [mode, setMode] = useState<'now' | 'date'>('now');
  const [date, setDate] = useState(todayOf());
  const [pv, setPv] = useState<LegalRevisionPreview | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const effectiveFrom = mode === 'now' ? todayOf() : date;
  const input = target ? { templateId: target.templateId, state: target.state, text, changeNote: note, reason, reference, effectiveFrom } : null;
  const sig = JSON.stringify(input);
  useEffect(() => { setPv(null); setConfirmed(false); setProblem(null); }, [sig]);
  if (!target || !input) return null;
  const pick = (key: string) => { const x = targets.find((y) => y.key === key); setTargetKey(key); setText(x?.text ?? ''); };
  const check = async () => { setProblem(null); const r = await s.previewRevision(input); if (r.ok) { setPv(r.value); if (r.value.problem) setProblem(r.value.problem); } else setProblem(r.problem); };
  const publish = async () => {
    if (!pv) return;
    setProblem(null);
    const r = await s.saveRevision(input, pv.token, confirmed);
    if (r.ok) { toast.push(t(pv.immediate ? K.edit.published : K.edit.scheduledDone)); onDone(); } else setProblem(r.problem);
  };
  const labelOf = (x: { templateId: string; state: string | null }): string => {
    const tpl = d.row.category === 'contract' ? d.row.refLabel : d.clauses.find((c) => c.templateId === x.templateId)?.templateName ?? x.templateId;
    return x.state ? `${tpl} · ${t(K.hist.stateKind, { state: x.state })}` : `${tpl} · ${t(K.hist.nationalKind)}`;
  };
  const ready = lettersOf(text) >= MIN_TEXT && lettersOf(note) >= NOTE_MIN && (!needsReference(reason) || lettersOf(reference) >= REFERENCE_MIN);
  return (
    <Card>
      <div className="stack gap-3" data-edit-form>
        <span className="t-sm t-semibold">{t(K.edit.title)}</span>
        <Field label={t(K.edit.target)}>{(p) => <Select id={p.id} value={target.key} data-f="edit-target" onChange={(e) => pick(e.target.value)}>{targets.map((x) => <option key={x.key} value={x.key}>{labelOf(x)}</option>)}</Select>}</Field>
        {!target.text && <p className="t-xs" data-was-empty style={{ color: 'var(--color-warning)' }}>{t(K.edit.wasEmpty)}</p>}
        <Field label={t(K.edit.text)} hint={t(K.edit.letters, { n: lettersOf(text) })}>{(p) => <TextArea id={p.id} rows={7} value={text} data-f="edit-text" onChange={(e) => setText(e.target.value)} />}</Field>
        <Field label={t(K.edit.reason)}>{(p) => <Select id={p.id} value={reason} data-f="edit-reason" onChange={(e) => setReason(e.target.value)}>{REASONS.map((r) => <option key={r} value={r}>{t(`legal.hist.reason.${r}`)}</option>)}</Select>}</Field>
        <Field label={t(K.edit.reference)} hint={t(K.edit.referenceHint)}>{(p) => <Input id={p.id} value={reference} data-f="edit-reference" onChange={(e) => setReference(e.target.value)} />}</Field>
        <Field label={t(K.edit.note)} hint={`${lettersOf(note)}/${NOTE_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={note} data-f="edit-note" onChange={(e) => setNote(e.target.value)} />}</Field>
        <div className="stack gap-1"><span className="t-sm t-semibold">{t(K.edit.when)}</span><div className="row gap-2 wrap" role="group"><span data-when="now"><Chip pressed={mode === 'now'} onClick={() => setMode('now')}>{t(K.edit.now)}</Chip></span><span data-when="date"><Chip pressed={mode === 'date'} onClick={() => setMode('date')}>{t(K.edit.onDate)}</Chip></span></div></div>
        {mode === 'date' && <Field label={t(K.edit.date)}>{(p) => <Input id={p.id} type="date" min={todayOf()} value={date} data-f="edit-date" onChange={(e) => setDate(e.target.value)} />}</Field>}
        <Problem t={t} code={problem} />
        {!pv || pv.problem ? <div><Button variant="secondary" data-act="edit-check" disabled={!ready} loading={s.busy} onClick={() => void check()}>{t(K.edit.check)}</Button></div> : (
          <div className="stack gap-2" data-preview data-behind={pv.behind} data-signed={pv.signedOlder}>
            <span className="t-sm t-semibold">{t(K.edit.impact)}</span>
            <p className="t-xs">{t(K.edit.newDocs, { date: formatDate(effectiveFrom, lang) })}</p>
            {pv.behind === 0 && pv.signedOlder === 0 && <p className="t-xs" data-impact-none>{t(K.edit.impactNone)}</p>}
            {pv.behind > 0 && <p className="t-xs" data-impact-behind style={{ color: 'var(--color-warning)' }}>{t(K.edit.impactBehind, { count: pv.behind })}</p>}
            {pv.signedOlder > 0 && <p className="t-xs" data-impact-signed>{t(K.edit.impactSigned, { count: pv.signedOlder })}</p>}
            <label className="row gap-2" style={{ alignItems: 'flex-start', minHeight: 44 }} data-confirm><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} /><span className="t-sm">{t(K.edit.confirm)}</span></label>
            <div className="row gap-2"><Button variant="ghost" onClick={onDone}>{t(K.cancel)}</Button><Button className="grow" data-act="edit-publish" disabled={!confirmed} loading={s.busy} onClick={() => void publish()}>{pv.immediate ? t(K.edit.publish) : t(K.edit.schedule)}</Button></div>
          </div>
        )}
        {(!pv || pv.problem) && <div><Button variant="ghost" onClick={onDone}>{t(K.cancel)}</Button></div>}
      </div>
    </Card>
  );
}

function IssueCard({ r, s, t, lang, d, onCorrect }: { r: LegalReviewView; s: LegalScreenState; t: T; lang: string; d: LegalDocDetail; onCorrect: () => void }) {
  const toast = useToast();
  const [closing, setClosing] = useState(false);
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  return (
    <Card>
      <div className="stack gap-2" data-issue-card={r.id} role="alert" style={{ borderLeft: '3px solid var(--color-error)', paddingLeft: 10 }}>
        <span className="row gap-2" style={{ alignItems: 'center', color: 'var(--color-error)' }}><WarningCircle size={18} weight="fill" /><span className="t-sm t-semibold">{t(K.issues.title)}</span></span>
        <span className="t-sm">{r.note}</span>
        <span className="t-xs">{t(K.issues.body, { days: FIX_DAYS })} {r.fixDueAt ? `(${t(K.issues.fixBy, { date: formatDate(r.fixDueAt, lang) })})` : ''}</span>
        <div className="row gap-2 wrap">
          {d.row.editable ? <Button size="sm" data-act="issue-correct" onClick={onCorrect}>{t(K.reviews.correct)}</Button> : <p className="t-xs">{t(K.reviews.correctElsewhere)}</p>}
          {!d.row.editable && d.row.maintainedAt && <Link className="ds-btn ds-btn--secondary ds-btn--sm" to={d.row.maintainedAt}>{t(K.sheet.openWhere)}</Link>}
          {!closing && <Button size="sm" variant="secondary" data-act="issue-close-open" onClick={() => setClosing(true)}>{t(K.reviews.close.open)}</Button>}
        </div>
        {closing && (
          <div className="stack gap-2" data-close-form>
            <p className="t-xs t-muted">{t(K.reviews.close.hint)}</p>
            <Field label={t(K.reviews.close.note)} hint={`${lettersOf(note)}/${CLOSE_NOTE_MIN}`}>{(p) => <TextArea id={p.id} rows={3} value={note} data-f="close-note" onChange={(e) => setNote(e.target.value)} />}</Field>
            <Problem t={t} code={problem} />
            <div className="row gap-2"><Button variant="ghost" onClick={() => setClosing(false)}>{t(K.cancel)}</Button><Button data-act="issue-close-do" disabled={lettersOf(note) < CLOSE_NOTE_MIN} loading={s.busy} onClick={async () => { setProblem(null); const x = await s.closeIssue(r.id)(note); if (x.ok) { toast.push(t(K.reviews.close.saved)); setClosing(false); } else setProblem(x.problem); }}>{t(K.reviews.close.save)}</Button></div>
          </div>
        )}
      </div>
    </Card>
  );
}

function DocSheet({ s, t, lang }: { s: LegalScreenState; t: T; lang: string }) {
  const d = s.detail && s.detail.row.key === s.docKey ? s.detail : null;
  const [editing, setEditing] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  useEffect(() => { setEditing(null); setRecording(false); }, [s.docKey]);
  useEffect(() => { if (d && s.editParam) { setEditing(s.editParam); s.clearEdit(); } }, [d, s.editParam]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!s.docKey) return <Sheet open={false} onClose={() => s.openDoc(null)} title="" closeLabel={t(K.close)}>{null}</Sheet>;
  const issue = d?.reviews.find((r) => r.status === 'issue_open') ?? null;
  return (
    <Sheet open onClose={() => s.openDoc(null)} title={d ? docTitle(t, d.row) : ''} closeLabel={t(K.close)}>
      {!d ? (s.detailLoad === 'error' ? <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.refresh()} /> : <LoadingState label={t(K.loading)} variant="list" rows={3} />) : (
        <div className="stack gap-5" data-doc-sheet={d.row.key}>
          <div className="stack gap-1">
            <span className="row gap-1 wrap"><ReviewBadge t={t} state={d.row.review} /><Badge tone="accent">{t(K.row.version, { v: d.row.version })}</Badge>{d.row.scheduled && <Badge tone="accent">{t(K.row.scheduled, { date: formatDate(d.row.scheduled.effectiveFrom, lang) })}</Badge>}</span>
            <span className="t-xs t-muted">{t(K.row.since, { date: formatDate(d.row.effectiveFrom, lang) })}</span>
          </div>
          {issue && <IssueCard r={issue} s={s} t={t} lang={lang} d={d} onCorrect={() => setEditing(d.row.category === 'contract' ? `${d.row.ref}|` : `${d.clauses[0]?.templateId}|${d.row.ref}`)} />}

          <Section title={t(K.sheet.where)}>
            <Line label={t(K.sheet.usedBy)} value={t(`legal.used.${d.row.usedBy}`)} />
            {d.row.editable ? <Line label="" value={<Badge tone="neutral">{t(K.row.written)}</Badge>} /> : (
              <>
                <p className="t-xs t-muted">{t(K.sheet.maintained)}</p>
                {d.row.maintainedAt && <div><Link className="ds-btn ds-btn--secondary ds-btn--sm" data-maintained-link to={d.row.maintainedAt}>{t(K.sheet.openWhere)}</Link></div>}
              </>
            )}
          </Section>

          {d.row.editable && editing !== null && <EditForm key={editing} s={s} t={t} lang={lang} d={d} startKey={editing || null} issueOpen={!!issue} onDone={() => setEditing(null)} />}

          {d.text !== null && (
            <Section title={t(K.sheet.current)}>
              <p className="t-sm" data-current-text style={{ whiteSpace: 'pre-wrap' }}>{d.text}</p>
              {editing === null && <div><Button size="sm" variant="secondary" data-act="edit-national" onClick={() => setEditing(`${d.row.ref}|`)}>{t(K.sheet.change)}</Button></div>}
            </Section>
          )}

          {d.clauses.length > 0 && (
            <Section title={t(K.sheet.clauses)} hint={t(K.sheet.clausesHint)}>
              <div className="stack gap-2" data-clauses>
                {d.clauses.map((c) => (
                  <Card key={`${c.templateId}|${c.state}`}>
                    <div className="stack gap-1" data-clause={`${c.templateId}|${c.state}`} data-has={c.text !== null}>
                      <span className="row between wrap" style={{ gap: 8, alignItems: 'center' }}><span className="t-sm t-semibold">{d.row.category === 'contract' ? c.state : c.templateName}</span><span className="row gap-1">{c.scheduled && <Badge tone="accent">{t(K.row.scheduled, { date: formatDate(c.scheduled.effectiveFrom, lang) })}</Badge>}<Button size="sm" variant="ghost" data-act="clause-edit" onClick={() => setEditing(`${c.templateId}|${c.state}`)}>{c.text ? t(K.sheet.editClause) : t(K.sheet.addClause)}</Button></span></span>
                      {c.text ? <span className="t-xs" style={{ whiteSpace: 'pre-wrap' }}>{c.text}</span> : <span className="t-xs" style={{ color: 'var(--color-warning)' }}>{t(K.sheet.clauseMissing)}</span>}
                    </div>
                  </Card>
                ))}
              </div>
            </Section>
          )}

          {d.propagation && (
            <Section title={t(K.sheet.propagation)}>
              <div className="stack gap-1" data-doc-prop data-behind={d.propagation.behind}>
                {d.propagation.behind === 0 ? <p className="t-sm">{t(K.prop.clear)}</p> : <p className="t-sm" style={{ color: 'var(--color-warning)' }}>{t(K.prop.behind, { count: d.propagation.behind })}</p>}
                {d.propagation.signedOlder > 0 && <p className="t-xs">{t(K.prop.signedOlder, { count: d.propagation.signedOlder })}</p>}
              </div>
            </Section>
          )}

          <Section title={t(K.sheet.history)}>
            {d.history.length === 0 ? <p className="t-sm t-muted">{t(K.sheet.noHistory, { v: d.row.version })}</p> : <div className="stack gap-2" data-history>{d.history.map((h) => <HistoryItem key={h.id} h={h} t={t} lang={lang} s={s} />)}</div>}
          </Section>

          <Section title={t(K.sheet.reviews)}>
            {d.reviews.length === 0 ? <p className="t-sm t-muted">{t(K.sheet.noReviews)}</p> : <div className="stack gap-2" data-doc-reviews>{d.reviews.map((r) => <ReviewCard key={r.id} r={r} t={t} lang={lang} onOpen={() => undefined} />)}</div>}
            {!recording ? <div><Button size="sm" variant="secondary" data-act="review-open" onClick={() => setRecording(true)}>{t(K.sheet.recordReview)}</Button></div> : <Card><ReviewForm s={s} t={t} docs={[d.row]} fixedKey={d.row.key} onDone={() => setRecording(false)} /></Card>}
          </Section>
        </div>
      )}
    </Sheet>
  );
}
