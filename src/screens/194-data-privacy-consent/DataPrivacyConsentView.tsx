import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, Check, DownloadSimple, LockSimple, Plus, ShieldCheck, WarningCircle, X } from '@phosphor-icons/react';
import { Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, Tabs, TextArea, formatDate, useToast } from '@/design-system';
import type { AccessPackageView, DataRequestView, DeletionPlanResult, PrivacyPolicyView, RetentionPreview, RetentionView, SubjectRowView } from '@/data/repository';
import { ACK_DAYS, CATEGORIES, NOTE_MIN, REFUSE_MIN, REQUEST_CHANNELS, REQUEST_TYPES, VERIFY_METHODS, categoryDef, lettersOf, purposesFor } from '@/features/privacy/privacy';
import type { ConsentStatus, Purpose, RequestChannel, RequestStatus, RequestType, RetentionRules, SubjectKind, VerifyMethod } from '@/features/privacy/privacy';
import { DATA_PRIVACY_CONSENT_KEYS as K } from './data-privacy-consent.types';
import { TABS, useDataPrivacyConsent } from './useDataPrivacyConsent';
import type { PrivacyState, PrivacyTab } from './useDataPrivacyConsent';

type T = ReturnType<typeof useTranslation>['t'];
const errText = (t: T, code: string) => t(`privacy.error.${code}`, { defaultValue: t(K.error.generic) });
const STATUS_TONE: Record<ConsentStatus, 'success' | 'warning' | 'neutral'> = { granted: 'success', withdrawn: 'warning', not_recorded: 'neutral' };
const SLA_TONE: Record<string, 'success' | 'warning' | 'error'> = { on_track: 'success', close: 'warning', late: 'error' };
const RSTATUS_TONE: Record<RequestStatus, 'accent' | 'success' | 'warning' | 'neutral'> = { received: 'accent', in_progress: 'accent', completed: 'success', partially_completed: 'warning', refused: 'neutral', withdrawn: 'neutral' };
const todayStr = (): string => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const catName = (t: T, id: string): string => t(`privacy.category.${id}`, { defaultValue: id });

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="stack gap-3">
      <h2 className="t-md t-semibold" style={{ borderTop: '1px solid var(--color-accent-primary)', paddingTop: 12 }}>{title}</h2>
      {hint && <p className="t-xs t-muted">{hint}</p>}
      {children}
    </section>
  );
}

/** Screen 194 — Data Privacy & Consent Management. A settings layout in four parts: who has agreed to what, the requests people make about their own data (with a clock), how long each kind of data is kept, and the privacy policy in force. */
export function DataPrivacyConsentScreen() {
  const { t, i18n } = useTranslation();
  const s = useDataPrivacyConsent();
  const head = <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh onClick={() => void s.refresh()}>{t(K.refresh)}</Button>} />;
  if (s.load === 'loading' && !s.register) return <Screen width="default">{head}<LoadingState label={t(K.loading)} variant="list" rows={4} /></Screen>;
  if (s.load === 'error' && !s.register) return <Screen width="default">{head}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.refresh()} /></Screen>;
  const c = s.counts;
  return (
    <Screen width="default">
      {head}
      <div className="stack gap-4">
        {s.offline && <p className="t-xs t-muted" role="status" data-offline>{t(K.offline)}</p>}
        <div className="grid-auto" data-summary>
          <Card><span className="t-sm t-semibold" data-subjects>{t(K.summary.subjects, { count: s.register?.subjects ?? 0 })}</span></Card>
          <Card><div className="stack gap-0" data-open-requests={c?.open ?? 0}><span className="t-sm t-semibold">{t(K.summary.requests, { count: c?.open ?? 0 })}</span>{(c?.late ?? 0) > 0 && <span className="t-xs" style={{ color: 'var(--color-error)' }}>{t(K.summary.late, { count: c!.late })}</span>}</div></Card>
          <Card><span className="t-sm t-semibold row gap-2" style={{ alignItems: 'center' }}><ShieldCheck size={16} aria-hidden="true" color="var(--color-success)" />{s.policy?.current ? t(K.summary.policy, { version: s.policy.current.version }) : t(K.policy.none)}</span></Card>
        </div>
        <Tabs label={t(K.tab.label)} value={s.tab} onChange={(id) => s.setTab(id as PrivacyTab)} items={TABS.map((id) => ({ id, label: t(`privacy.tab.${id}`) }))} />
        {s.tab === 'register' && <RegisterTab s={s} t={t} lang={i18n.language} />}
        {s.tab === 'requests' && <RequestsTab s={s} t={t} lang={i18n.language} />}
        {s.tab === 'retention' && <RetentionTab s={s} t={t} lang={i18n.language} />}
        {s.tab === 'policy' && <PolicyTab s={s} t={t} lang={i18n.language} />}
        <p className="t-xs t-muted" data-placeholder-note>{t(K.note.placeholders)}</p>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ consent register */

function ConsentChip({ status, label }: { status: ConsentStatus; label: string }) {
  return <Badge tone={STATUS_TONE[status]} className="ds-badge--wrap">{status === 'granted' ? <Check size={11} aria-hidden="true" /> : status === 'withdrawn' ? <X size={11} aria-hidden="true" /> : null}{label}</Badge>;
}

function RegisterTab({ s, t, lang }: { s: PrivacyState; t: T; lang: string }) {
  const reg = s.register;
  const more = reg ? s.rows.length < reg.total : false;
  const [creating, setCreating] = useState<SubjectRowView | null>(null);
  return (
    <Section title={t(K.register.title)} hint={t(K.register.hint)}>
      {reg && (
        <div className="stack gap-2" data-by-purpose>
          <span className="t-sm t-semibold">{t(K.register.byPurpose)}</span>
          <div className="grid-auto">
            {reg.summary.map((x) => (
              <Card key={x.purpose}><div className="stack gap-0" data-purpose={x.purpose}><span className="t-sm t-semibold">{t(`privacy.purpose.${x.purpose}`)}</span><span className="t-xs t-muted">{t(K.register.tally, { granted: x.granted, withdrawn: x.withdrawn, none: x.notRecorded })}</span></div></Card>
            ))}
          </div>
        </div>
      )}
      <div className="stack gap-2 sticky-under-shell" style={{ background: 'var(--color-bg)', paddingBlock: 8 }}>
        <Input value={s.rf.q ?? ''} placeholder={t(K.register.search)} aria-label={t(K.register.search)} data-f="register-search" onChange={(e) => s.setRf({ ...s.rf, q: e.target.value })} />
        <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <Select value={s.rf.kind ?? 'all'} aria-label={t(K.register.allKinds)} data-f="register-kind" onChange={(e) => s.setRf({ ...s.rf, kind: e.target.value as SubjectKind | 'all' })} style={{ width: 'auto', minWidth: 140 }}>
            <option value="all">{t(K.register.allKinds)}</option>
            {(reg?.kinds ?? []).map((k) => <option key={k.kind} value={k.kind}>{t(`privacy.kind.${k.kind}`)} ({k.count})</option>)}
          </Select>
          <Select value={s.rf.purpose ?? ''} aria-label={t(K.register.allPurposes)} data-f="register-purpose" onChange={(e) => s.setRf({ ...s.rf, purpose: (e.target.value || null) as Purpose | null })} style={{ width: 'auto', minWidth: 160 }}>
            <option value="">{t(K.register.allPurposes)}</option>
            {(['sms', 'whatsapp', 'recruitment_contact', 'location_tracking'] as Purpose[]).map((p) => <option key={p} value={p}>{t(`privacy.purpose.${p}`)}</option>)}
          </Select>
          {(['granted', 'withdrawn', 'not_recorded'] as ConsentStatus[]).map((st) => <Chip key={st} pressed={s.rf.status === st} onClick={() => s.setRf({ ...s.rf, status: s.rf.status === st ? null : st })}>{t(`privacy.status.${st}`)}</Chip>)}
        </div>
        {reg && <span className="t-xs t-muted" data-count={reg.total}>{t(K.register.count, { count: reg.total })}</span>}
      </div>
      {s.rows.length === 0 ? <EmptyState title={t(K.register.empty)} body={t(K.register.hint)} actionLabel={t(K.refresh)} onAction={() => void s.refresh()} /> : (
        <div className="grid-auto" data-register>
          {s.rows.map((r) => (
            <Card key={r.id} onClick={() => s.openSubject(r.id)}>
              <div className="stack gap-2" data-subject={r.id}>
                <div className="row between" style={{ alignItems: 'center', gap: 8 }}><span className="t-sm t-semibold">{r.name}</span><span className="t-xs t-muted num">{r.phoneMasked}</span></div>
                <span className="row gap-1 wrap">{r.kinds.map((k) => <Badge key={k} tone="neutral">{t(`privacy.kind.${k}`)}</Badge>)}{r.openRequests > 0 && <Badge tone="warning">{t(K.summary.requests, { count: r.openRequests })}</Badge>}</span>
                <span className="row gap-1 wrap">{r.consents.map((c) => <ConsentChip key={c.purpose} status={c.status} label={t(`privacy.purpose.${c.purpose}`)} />)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
      {more && <div><Button variant="secondary" data-act="register-more" onClick={() => void s.moreRows()}>{t(K.register.more)}</Button></div>}
      <SubjectSheet s={s} t={t} lang={lang} onNewRequest={(r) => setCreating(r)} />
      <NewRequestSheet s={s} t={t} start={creating} onClose={() => setCreating(null)} />
    </Section>
  );
}

function SubjectSheet({ s, t, lang, onNewRequest }: { s: PrivacyState; t: T; lang: string; onNewRequest: (r: SubjectRowView) => void }) {
  const toast = useToast();
  const d = s.subject;
  const [purpose, setPurpose] = useState<Purpose | ''>('');
  const [status, setStatus] = useState<'granted' | 'withdrawn'>('withdrawn');
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => { setPurpose(''); setNote(''); setProblem(null); setStatus('withdrawn'); }, [s.subjectId]);
  if (!s.subjectId || !d) return <Sheet open={false} onClose={() => s.openSubject(null)} title="" closeLabel={t(K.close)}>{null}</Sheet>;
  const apply = async () => { if (!purpose) return; setProblem(null); const r = await s.recordConsent(d.id, purpose, status, note); if (r.ok) { setNote(''); setPurpose(''); toast.push(t(K.subject.recorded)); } else setProblem(r.problem); };
  const held = Object.entries(d.counts).filter(([, n]) => n > 0);
  return (
    <Sheet open onClose={() => s.openSubject(null)} title={d.name} closeLabel={t(K.close)}>
      <div className="stack gap-4" data-subject-sheet={d.id}>
        <div className="stack gap-1"><span className="t-xs t-muted num">{d.phone}</span><span className="row gap-1 wrap">{d.kinds.map((k) => <Badge key={k} tone="neutral">{t(`privacy.kind.${k}`)}</Badge>)}</span></div>
        <div className="stack gap-1" data-consents><span className="t-sm t-semibold">{t(K.subject.consent)}</span>
          {d.consents.map((c) => (
            <div key={c.purpose} className="row between" data-consent={c.purpose} data-status={c.status} style={{ alignItems: 'center', gap: 8 }}>
              <span className="t-sm">{t(`privacy.purpose.${c.purpose}`)}</span>
              <span className="stack gap-0" style={{ alignItems: 'flex-end' }}><ConsentChip status={c.status} label={t(`privacy.status.${c.status}`)} />{c.at && <span className="t-xs t-muted">{formatDate(c.at, lang)}{c.source ? ` · ${t(`privacy.source.${c.source}`, { defaultValue: c.source })}` : ''}</span>}</span>
            </div>
          ))}
        </div>
        <div className="stack gap-2" data-change>
          <span className="t-sm t-semibold">{t(K.subject.change)}</span>
          <Select value={purpose} aria-label={t(K.subject.consent)} data-f="consent-purpose" onChange={(e) => setPurpose(e.target.value as Purpose | '')}><option value="">—</option>{purposesFor(d.kinds).map((p) => <option key={p} value={p}>{t(`privacy.purpose.${p}`)}</option>)}</Select>
          <div className="row gap-2" role="group"><Chip pressed={status === 'withdrawn'} onClick={() => setStatus('withdrawn')}>{t(K.subject.withdraw)}</Chip><Chip pressed={status === 'granted'} onClick={() => setStatus('granted')}>{t(K.subject.grant)}</Chip></div>
          {purpose === 'location_tracking' && status === 'withdrawn' && <p className="t-xs">{t(K.subject.locationNote)}</p>}
          <Field label={t(K.subject.note)} hint={`${lettersOf(note)}/${NOTE_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={note} data-f="consent-note" onChange={(e) => setNote(e.target.value)} />}</Field>
          {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
          <Button size="sm" data-act="consent-apply" disabled={!purpose || lettersOf(note) < NOTE_MIN} loading={s.busy} onClick={() => void apply()}>{t(K.subject.apply)}</Button>
        </div>
        <div className="stack gap-1" data-holds><span className="t-sm t-semibold">{t(K.subject.holds)}</span>{held.length === 0 ? <span className="t-xs t-muted">{t(K.subject.none)}</span> : held.map(([k, n]) => <div key={k} className="row between t-xs"><span>{catName(t, k)}</span><span className="num">{n}</span></div>)}</div>
        {d.history.length > 0 && <div className="stack gap-1"><span className="t-sm t-semibold">{t(K.subject.history)}</span>{d.history.map((h) => <span key={h.id} className="t-xs t-muted">{formatDate(h.at, lang)} · {t(`privacy.purpose.${h.purpose}`)} · {t(`privacy.status.${h.status}`)} · {h.byName}: {h.note}</span>)}</div>}
        <div className="stack gap-2"><span className="t-sm t-semibold">{t(K.subject.requests)}</span>
          {d.requests.map((r) => <div key={r.id}><Button size="sm" variant="ghost" onClick={() => s.openRequest(r.id)}>{r.code} · {t(`privacy.type.short.${r.type}`)} · {t(`privacy.rstatus.${r.status}`)}</Button></div>)}
          <div><Button size="sm" variant="secondary" data-act="subject-new-request" icon={<Plus size={14} />} onClick={() => onNewRequest(d)}>{t(K.subject.newRequest)}</Button></div>
        </div>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ requests */

function SlaBadge({ r, t }: { r: DataRequestView; t: T }) {
  if (!['received', 'in_progress'].includes(r.status)) return <Badge tone={RSTATUS_TONE[r.status]}>{t(`privacy.rstatus.${r.status}`)}</Badge>;
  return <Badge tone={SLA_TONE[r.sla.state]}>{r.sla.state === 'late' ? t(K.sla.over, { count: Math.abs(r.sla.daysLeft) }) : t(K.sla.left, { count: Math.max(0, r.sla.daysLeft) })}</Badge>;
}

function RequestsTab({ s, t, lang }: { s: PrivacyState; t: T; lang: string }) {
  const [creating, setCreating] = useState(false);
  return (
    <Section title={t(K.requests.title)} hint={t(K.requests.hint)}>
      <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
        {(['open', 'closed', 'all'] as const).map((st) => <Chip key={st} pressed={s.rq.status === st} onClick={() => s.setRq({ ...s.rq, status: st })}>{t(`privacy.requests.${st}`)}</Chip>)}
        <Select value={s.rq.type} aria-label={t(K.requests.what)} data-f="request-type" onChange={(e) => s.setRq({ ...s.rq, type: e.target.value as RequestType | 'all' })} style={{ width: 'auto', minWidth: 160 }}><option value="all">{t(K.requests.all)}</option>{REQUEST_TYPES.map((x) => <option key={x} value={x}>{t(`privacy.type.short.${x}`)}</option>)}</Select>
        <Button size="sm" variant="secondary" icon={<Plus size={14} />} data-act="new-request" onClick={() => setCreating(true)}>{t(K.requests.new)}</Button>
      </div>
      {!s.requests ? <LoadingState label={t(K.loading)} variant="list" rows={3} /> : s.requests.rows.length === 0 ? <EmptyState title={t(K.requests.empty)} body={t(K.requests.hint)} actionLabel={t(K.requests.new)} onAction={() => setCreating(true)} /> : (
        <div className="grid-auto" data-requests>
          {s.requests.rows.map((r) => (
            <Card key={r.id} onClick={() => s.openRequest(r.id)}>
              <div className="stack gap-2" data-request={r.id} data-status={r.status} data-sla={r.sla.state}>
                <div className="row between" style={{ alignItems: 'center', gap: 8 }}><span className="t-sm t-semibold">{r.subjectName}</span><SlaBadge r={r} t={t} /></div>
                <span className="t-xs">{t(`privacy.type.${r.type}`)}</span>
                <span className="t-xs t-muted">{t(K.requests.line, { code: r.code, date: formatDate(r.receivedAt, lang), channel: t(`privacy.channel.${r.channel}`) })}</span>
                {['received', 'in_progress'].includes(r.status) && <span className="t-xs">{t(K.requests.due, { date: formatDate(r.dueAt, lang) })}</span>}
                {r.ackLate && <span className="t-xs row gap-1" style={{ color: 'var(--color-warning)', alignItems: 'center' }}><WarningCircle size={12} aria-hidden="true" />{t(K.sla.ackLate, { days: ACK_DAYS })}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}
      <NewRequestSheet s={s} t={t} start={null} open={creating} onClose={() => setCreating(false)} />
      <RequestSheet s={s} t={t} lang={lang} />
    </Section>
  );
}

function NewRequestSheet({ s, t, start, open, onClose }: { s: PrivacyState; t: T; start: SubjectRowView | null; open?: boolean; onClose: () => void }) {
  const toast = useToast();
  const isOpen = open ?? !!start;
  const [q, setQ] = useState('');
  const [found, setFound] = useState<SubjectRowView[]>([]);
  const [who, setWho] = useState<SubjectRowView | null>(null);
  const [type, setType] = useState<RequestType>('access');
  const [channel, setChannel] = useState<RequestChannel>('phone');
  const [day, setDay] = useState('');
  const [purpose, setPurpose] = useState<Purpose | ''>('');
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => { if (isOpen) { setWho(start); setQ(''); setFound([]); setType('access'); setChannel('phone'); setDay(''); setPurpose(''); setNote(''); setProblem(null); } }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!q.trim()) { setFound([]); return; } let on = true; const id = window.setTimeout(() => { void s.searchSubjects(q).then((r) => { if (on) setFound(r); }); }, 250); return () => { on = false; window.clearTimeout(id); }; }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  const purposes = who ? purposesFor(who.kinds) : [];
  const create = async () => {
    if (!who) return;
    setProblem(null);
    const r = await s.createRequest({ subjectId: who.id, type, channel, receivedAt: day ? new Date(`${day}T12:00:00`).toISOString() : null, note, ...(type === 'consent_withdrawal' && purpose ? { purpose } : {}) });
    if (r.ok) { onClose(); toast.push(t(K.requests.created)); s.openRequest(r.value.id); } else setProblem(r.problem);
  };
  return (
    <Sheet open={isOpen} onClose={onClose} title={t(K.requests.newTitle)} closeLabel={t(K.close)}>
      <div className="stack gap-3" data-new-request>
        {!start && (who ? <p className="t-sm" data-who>{who.name} <span className="t-xs t-muted">{who.phoneMasked}</span> <Button size="sm" variant="ghost" onClick={() => setWho(null)}>{t(K.close)}</Button></p> : (
          <>
            <Field label={t(K.requests.find)}>{(p) => <Input id={p.id} value={q} data-f="request-find" onChange={(e) => setQ(e.target.value)} />}</Field>
            <div className="stack gap-1" data-found>{found.map((f) => <Button key={f.id} size="sm" variant="secondary" data-pick={f.id} onClick={() => setWho(f)}>{f.name} · {f.phoneMasked} · {f.kinds.map((k) => t(`privacy.kind.${k}`)).join(', ')}</Button>)}</div>
          </>
        ))}
        {start && <p className="t-sm">{start.name}</p>}
        <Field label={t(K.requests.what)}>{(p) => <Select id={p.id} value={type} data-f="request-new-type" onChange={(e) => setType(e.target.value as RequestType)}>{REQUEST_TYPES.map((x) => <option key={x} value={x}>{t(`privacy.type.${x}`)}</option>)}</Select>}</Field>
        {type === 'consent_withdrawal' && <Field label={t(K.requests.which)}>{(p) => <Select id={p.id} value={purpose} data-f="request-purpose" onChange={(e) => setPurpose(e.target.value as Purpose | '')}><option value="">—</option>{purposes.map((x) => <option key={x} value={x}>{t(`privacy.purpose.${x}`)}</option>)}</Select>}</Field>}
        <Field label={t(K.requests.via)}>{(p) => <Select id={p.id} value={channel} data-f="request-channel" onChange={(e) => setChannel(e.target.value as RequestChannel)}>{REQUEST_CHANNELS.map((x) => <option key={x} value={x}>{t(`privacy.channel.${x}`)}</option>)}</Select>}</Field>
        <Field label={t(K.requests.received)}>{(p) => <Input id={p.id} type="date" max={todayStr()} value={day} data-f="request-day" onChange={(e) => setDay(e.target.value)} />}</Field>
        <Field label={t(K.requests.note)} hint={`${lettersOf(note)}/${NOTE_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={note} data-f="request-note" onChange={(e) => setNote(e.target.value)} />}</Field>
        {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
        <Button data-act="request-create" disabled={!who || lettersOf(note) < NOTE_MIN || (type === 'consent_withdrawal' && !purpose)} loading={s.busy} onClick={() => void create()}>{t(K.requests.create)}</Button>
      </div>
    </Sheet>
  );
}

function downloadPackage(pkg: AccessPackageView, t: T, kind: 'json' | 'html') {
  const esc = (x: string) => x.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
  const body = kind === 'json' ? JSON.stringify(pkg, null, 2) : `<!doctype html><html><head><meta charset="utf-8"><title>${esc(pkg.subjectName)}</title><style>body{font-family:sans-serif;max-width:820px;margin:24px auto;padding:0 16px}h2{border-top:2px solid #b8873d;padding-top:8px}td{padding:4px 8px;border-bottom:1px solid #ddd;vertical-align:top}</style></head><body><h1>${esc(pkg.subjectName)}</h1><p>${esc(pkg.generatedAt)}</p>${pkg.sections.map((x) => `<h2>${esc(catName(t, x.category))}</h2><table>${x.rows.map((r) => `<tr><td>${esc(r.label)}</td><td>${esc(r.detail)}</td></tr>`).join('')}</table>`).join('')}</body></html>`;
  const url = URL.createObjectURL(new Blob([body], { type: kind === 'json' ? 'application/json' : 'text/html' }));
  const a = document.createElement('a');
  a.href = url; a.download = `aiec-data-copy-${pkg.generatedAt.slice(0, 10)}.${kind}`; a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function RequestSheet({ s, t, lang }: { s: PrivacyState; t: T; lang: string }) {
  const toast = useToast();
  const r = s.request;
  const [method, setMethod] = useState<VerifyMethod>('call_back');
  const [vnote, setVnote] = useState('');
  const [plan, setPlan] = useState<DeletionPlanResult | null>(null);
  const [pkg, setPkg] = useState<AccessPackageView | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [via, setVia] = useState<RequestChannel>('phone');
  const [rnote, setRnote] = useState('');
  const [cnote, setCnote] = useState('');
  const [refusing, setRefusing] = useState<'refuse' | 'withdraw' | null>(null);
  const [why, setWhy] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => { setMethod('call_back'); setVnote(''); setPlan(null); setPkg(null); setConfirm(false); setVia('phone'); setRnote(''); setCnote(''); setRefusing(null); setWhy(''); setProblem(null); }, [s.requestId]);
  useEffect(() => { if (r?.plan && !plan && r.status !== 'completed' && r.status !== 'partially_completed') setPlan({ rows: r.plan.rows as unknown as DeletionPlanResult['rows'], outcome: r.plan.rows.some((x) => x.action === 'retain') ? 'partially_completed' : 'completed' }); }, [r?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!s.requestId || !r) return <Sheet open={false} onClose={() => s.openRequest(null)} title="" closeLabel={t(K.close)}>{null}</Sheet>;
  const open = ['received', 'in_progress'].includes(r.status);
  const verifiedLine = r.verified ? t(K.request.verified, { date: formatDate(r.verified.at, lang), by: r.verified.byName, method: t(`privacy.verify.${r.verified.method}`) }) : null;
  const verify = async () => { setProblem(null); const x = await s.verify(r.id, method, vnote); if (!x.ok) setProblem(x.problem); };
  const draw = async () => { setProblem(null); const x = await s.plan(r.id); if (x.ok) setPlan(x.value); else setProblem(x.problem); };
  const prepare = async () => { setProblem(null); const x = await s.accessPackage(r.id); if (x.ok) setPkg(x.value); else setProblem(x.problem); };
  const fulfil = async () => { setProblem(null); const x = await s.fulfil(r.id, { confirm, responseVia: via, responseNote: rnote, ...(r.type === 'correction' ? { correctionNote: cnote } : {}) }); if (x.ok) toast.push(t(K.request.fulfilled)); else setProblem(x.problem); };
  const close = async () => { if (!refusing) return; setProblem(null); const x = refusing === 'refuse' ? await s.refuse(r.id, why) : await s.withdraw(r.id, why); if (x.ok) { setRefusing(null); toast.push(refusing === 'refuse' ? t(K.request.refused) : t(K.request.withdrawn)); } else setProblem(x.problem); };
  const ready = lettersOf(rnote) >= NOTE_MIN && (r.type !== 'deletion' || (!!plan && confirm)) && (r.type !== 'correction' || lettersOf(cnote) >= NOTE_MIN);
  return (
    <Sheet open onClose={() => s.openRequest(null)} title={`${r.code} · ${r.subjectName}`} closeLabel={t(K.close)}>
      <div className="stack gap-4" data-request-sheet={r.id} data-status={r.status}>
        <div className="stack gap-1"><span className="row gap-1 wrap"><Badge tone="neutral">{t(`privacy.type.${r.type}`)}</Badge><SlaBadge r={r} t={t} /><Badge tone={RSTATUS_TONE[r.status]}>{t(`privacy.rstatus.${r.status}`)}</Badge></span>
          <span className="t-xs t-muted">{t(K.requests.line, { code: r.code, date: formatDate(r.receivedAt, lang), channel: t(`privacy.channel.${r.channel}`) })}</span>
          <span className="t-xs">{r.note}</span>
          {r.type === 'consent_withdrawal' && r.purpose && <span className="t-xs">{t(K.request.consentWill, { purpose: t(`privacy.purpose.${r.purpose}`) })}</span>}
          {r.ackLate && <span className="t-xs" style={{ color: 'var(--color-warning)' }}>{t(K.sla.ackLate, { days: ACK_DAYS })}</span>}
        </div>
        {open && (
          <div className="stack gap-2" data-step-verify>
            <span className="t-sm t-semibold">{t(K.request.step.verify)}</span>
            {verifiedLine ? <span className="t-xs" data-verified style={{ color: 'var(--color-success)' }}><Check size={12} aria-hidden="true" /> {verifiedLine}</span> : (
              <>
                <p className="t-xs">{t(K.request.verifyHint)}</p>
                <Field label={t(K.request.method)}>{(p) => <Select id={p.id} value={method} data-f="verify-method" onChange={(e) => setMethod(e.target.value as VerifyMethod)}>{VERIFY_METHODS.map((m) => <option key={m} value={m}>{t(`privacy.verify.${m}`)}</option>)}</Select>}</Field>
                <Field label={t(K.request.verifyNote)} hint={`${lettersOf(vnote)}/${NOTE_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={vnote} data-f="verify-note" onChange={(e) => setVnote(e.target.value)} />}</Field>
                <div><Button size="sm" data-act="verify-do" disabled={lettersOf(vnote) < NOTE_MIN} loading={s.busy} onClick={() => void verify()}>{t(K.request.verifyDo)}</Button></div>
              </>
            )}
          </div>
        )}
        {open && r.verified && r.type === 'deletion' && (
          <div className="stack gap-2" data-step-plan>
            <span className="t-sm t-semibold">{t(K.request.step.plan)}</span>
            <p className="t-xs">{t(K.request.planHint)}</p>
            {!plan && <div><Button size="sm" variant="secondary" data-act="plan-do" loading={s.busy} onClick={() => void draw()}>{t(K.request.planDo)}</Button></div>}
            {plan && <PlanTable rows={plan.rows} outcome={plan.outcome} t={t} lang={lang} />}
          </div>
        )}
        {open && r.verified && r.type === 'access' && (
          <div className="stack gap-2" data-step-package>
            <span className="t-sm t-semibold">{t(K.request.step.carry)}</span>
            <p className="t-xs">{t(K.request.packageHint)}</p>
            {!pkg && <div><Button size="sm" variant="secondary" data-act="package-do" loading={s.busy} onClick={() => void prepare()}>{t(K.request.packageDo)}</Button></div>}
            {pkg && (
              <div className="stack gap-1" data-package>
                {pkg.sections.map((x) => <div key={x.category} className="row between t-xs"><span>{catName(t, x.category)}</span><span className="num">{x.rows.length}</span></div>)}
                <div className="row gap-2"><Button size="sm" variant="secondary" icon={<DownloadSimple size={14} />} data-act="package-json" onClick={() => downloadPackage(pkg, t, 'json')}>JSON</Button><Button size="sm" variant="secondary" icon={<DownloadSimple size={14} />} data-act="package-html" onClick={() => downloadPackage(pkg, t, 'html')}>{t(K.request.download)}</Button></div>
              </div>
            )}
          </div>
        )}
        {open && r.verified && (
          <div className="stack gap-2" data-step-fulfil>
            {r.type !== 'access' && <span className="t-sm t-semibold">{t(K.request.step.carry)}</span>}
            {r.type === 'correction' && <Field label={t(K.request.correctionNote)} hint={`${lettersOf(cnote)}/${NOTE_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={cnote} data-f="correction-note" onChange={(e) => setCnote(e.target.value)} />}</Field>}
            {r.type === 'deletion' && plan && <Checkbox checked={confirm} onChange={setConfirm} label={t(K.request.confirmPlan)} />}
            <Field label={t(K.request.responseVia)}>{(p) => <Select id={p.id} value={via} data-f="response-via" onChange={(e) => setVia(e.target.value as RequestChannel)}>{REQUEST_CHANNELS.map((x) => <option key={x} value={x}>{t(`privacy.channel.${x}`)}</option>)}</Select>}</Field>
            <Field label={t(K.request.responseNote)} hint={`${lettersOf(rnote)}/${NOTE_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={rnote} data-f="response-note" onChange={(e) => setRnote(e.target.value)} />}</Field>
            {problem && !refusing && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
            <Button data-act="fulfil" disabled={!ready} loading={s.busy} onClick={() => void fulfil()}>{t(K.request.fulfil)}</Button>
          </div>
        )}
        {!open && (
          <div className="stack gap-1" data-result>
            <span className="t-sm t-semibold">{t(K.request.result)}</span>
            {r.refusal && <span className="t-xs">{t(K.request.refusedWhy, { why: r.refusal })}</span>}
            {r.result?.erased.map((e) => <span key={e.category} className="t-xs" data-erased={e.category}>{t(K.request.erased)}: {catName(t, e.category)} ({e.count})</span>)}
            {r.result?.retained && r.result.retained.length > 0 && <div className="stack gap-1" data-retained><span className="t-xs t-semibold">{t(K.request.kept)}</span>{r.result.retained.map((e) => <span key={e.category} className="t-xs">{catName(t, e.category)} ({e.count}): {t(`privacy.reason.${e.reason}`, { defaultValue: e.reason })}{e.until ? ` ${t(K.plan.until, { date: formatDate(e.until, lang) })}` : ''}</span>)}</div>}
            {r.result?.correctionNote && <span className="t-xs">{r.result.correctionNote}</span>}
            {r.result?.accessCategories && <span className="t-xs">{Object.entries(r.result.accessCategories).map(([k, n]) => `${catName(t, k)} ${n}`).join(' · ')}</span>}
            {r.response && <span className="t-xs t-muted">{t(K.request.answered, { date: formatDate(r.response.at, lang), via: t(`privacy.channel.${r.response.via}`, { defaultValue: r.response.via }), note: r.response.note })}</span>}
          </div>
        )}
        <div className="stack gap-1" data-timeline><span className="t-sm t-semibold">{t(K.request.timeline)}</span>{r.events.map((e) => <span key={e.id} className="t-xs t-muted">{formatDate(e.at, lang)} · {t(`privacy.event.${e.kind}`)} · {e.byName}{e.note ? `: ${e.note}` : ''}</span>)}</div>
        {open && (
          <div className="stack gap-2" data-close-options>
            {refusing === null ? <div className="row gap-2 wrap"><Button size="sm" variant="ghost" data-act="refuse-open" onClick={() => { setProblem(null); setRefusing('refuse'); }} style={{ color: 'var(--color-error)' }}>{t(K.request.refuse)}</Button><Button size="sm" variant="ghost" data-act="withdraw-open" onClick={() => { setProblem(null); setRefusing('withdraw'); }}>{t(K.request.withdraw)}</Button></div> : (
              <div className="stack gap-2" data-close-form>
                {refusing === 'refuse' && <p className="t-xs">{t(K.request.refuseHint)}</p>}
                <Field label={refusing === 'refuse' ? t(K.request.refuseReason) : t(K.request.withdrawNote)} hint={`${lettersOf(why)}/${refusing === 'refuse' ? REFUSE_MIN : NOTE_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={why} data-f="close-why" onChange={(e) => setWhy(e.target.value)} />}</Field>
                {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
                <div className="row gap-2"><Button size="sm" variant="ghost" onClick={() => setRefusing(null)}>{t(K.close)}</Button><Button size="sm" data-act="close-do" disabled={lettersOf(why) < (refusing === 'refuse' ? REFUSE_MIN : NOTE_MIN)} loading={s.busy} onClick={() => void close()} style={refusing === 'refuse' ? { color: 'var(--color-error)' } : undefined}>{refusing === 'refuse' ? t(K.request.refuseDo) : t(K.request.withdrawDo)}</Button></div>
              </div>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}

function PlanTable({ rows, outcome, t, lang }: { rows: DeletionPlanResult['rows']; outcome: DeletionPlanResult['outcome']; t: T; lang: string }) {
  return (
    <div className="stack gap-2" data-plan data-outcome={outcome}>
      {rows.map((p) => (
        <div key={p.category} className="stack gap-0" data-plan-row={p.category} data-action={p.action}>
          <div className="row between" style={{ alignItems: 'center', gap: 8 }}><span className="t-xs t-semibold">{catName(t, p.category)} · {t(K.plan.count, { count: p.count })}</span><Badge tone={p.action === 'retain' ? 'warning' : 'success'}>{p.action === 'retain' && <LockSimple size={11} aria-hidden="true" />}{t(`privacy.plan.${p.action}`)}</Badge></div>
          <span className="t-xs t-muted">{t(`privacy.reason.${p.reason}`, { defaultValue: p.reason })}{p.until ? ` · ${t(K.plan.until, { date: formatDate(p.until, lang) })}` : ''}</span>
        </div>
      ))}
      <p className="t-xs" data-outcome-text>{outcome === 'completed' ? t(K.plan.outcomeCompleted) : t(K.plan.outcomePartial)}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ retention */

function RetentionTab({ s, t, lang }: { s: PrivacyState; t: T; lang: string }) {
  const toast = useToast();
  const v: RetentionView | null = s.retention;
  const [rules, setRules] = useState<RetentionRules | null>(null);
  const [pv, setPv] = useState<RetentionPreview | null>(null);
  const [mode, setMode] = useState<'now' | 'day'>('now');
  const [day, setDay] = useState(todayStr());
  const [reason, setReason] = useState('');
  const [ack, setAck] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => { if (v && !rules) setRules(Object.fromEntries(v.categories.map((c) => [c.id, { ...c.rule }]))); }, [v]); // eslint-disable-line react-hooks/exhaustive-deps
  const effectiveFrom = mode === 'now' ? null : new Date(`${day}T00:00:00`).toISOString();
  const current = v ? Object.fromEntries(v.categories.map((c) => [c.id, c.rule])) : {};
  const changed = !!rules && !!v && v.categories.some((c) => rules[c.id].days !== c.rule.days || rules[c.id].action !== c.rule.action);
  useEffect(() => {
    if (!rules || !changed) { setPv(null); return; }
    let on = true;
    const id = window.setTimeout(() => { void s.previewRetention(rules, effectiveFrom).then((r) => { if (!on) return; if (r.ok) { setPv(r.value); setProblem(null); } else setProblem(r.problem); }); }, 350);
    return () => { on = false; window.clearTimeout(id); };
  }, [rules, changed, effectiveFrom]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!v || !rules) return <LoadingState label={t(K.loading)} variant="list" rows={3} />;
  const set = (id: string, patch: Partial<RetentionRules[string]>) => { setAck(false); setRules((r) => (r ? { ...r, [id]: { ...r[id], ...patch } } : r)); };
  const allowed = (id: string): RetentionRules[string]['action'][] => { const def = categoryDef(id)!; return def.statutoryYears !== null ? ['retain', 'review'] : def.enforced ? ['erase', 'anonymise', 'review', 'retain'] : ['review', 'retain']; };
  const needAck = !!pv && pv.actionable + pv.forReview > 0;
  const ready = !!pv && pv.problems.length === 0 && !pv.effectiveProblem && lettersOf(reason) >= 20 && (!needAck || ack);
  const save = async () => { if (!pv) return; setProblem(null); const r = await s.saveRetention({ rules, effectiveFrom, reason, confirmExisting: ack, token: pv.token }); if (r.ok) { setReason(''); setAck(false); setPv(null); setRules(Object.fromEntries(r.value.categories.map((c) => [c.id, { ...c.rule }]))); toast.push(t(K.retention.saved)); } else setProblem(r.problem); };
  return (
    <Section title={t(K.retention.title)} hint={t(K.retention.hint)}>
      <p className="t-xs" data-in-force>{t(K.retention.inForce, { version: v.current.version, date: formatDate(v.current.effectiveFrom, lang) })}</p>
      {v.scheduled && <p className="t-sm" data-scheduled style={{ color: 'var(--color-warning)' }}>{t(K.retention.scheduled, { version: v.scheduled.version, date: formatDate(v.scheduled.effectiveFrom, lang) })}</p>}
      <div className="grid-auto" data-categories>
        {v.categories.map((c) => {
          const r = rules[c.id];
          const cur = current[c.id];
          const differs = r.days !== cur.days || r.action !== cur.action;
          return (
            <Card key={c.id}>
              <div className="stack gap-2" data-category={c.id} data-differs={differs}>
                <div className="row between wrap" style={{ alignItems: 'center', gap: 8 }}><span className="t-sm t-semibold">{catName(t, c.id)}</span><Badge tone={c.enforced ? 'success' : 'neutral'}>{c.enforced ? t(K.retention.auto) : t(K.retention.person)}</Badge></div>
                {c.statutoryYears !== null && <span className="t-xs row gap-1" style={{ alignItems: 'center' }}><LockSimple size={12} aria-hidden="true" />{t(K.retention.statutory, { years: c.statutoryYears })}</span>}
                <Field label={t(K.retention.period)} hint={t(K.retention.forever)}>{(p) => <Input id={p.id} type="number" min={1} value={r.days === null ? '' : String(r.days)} data-f={`days-${c.id}`} onChange={(e) => set(c.id, { days: e.target.value === '' ? null : Number(e.target.value) })} />}</Field>
                <Field label={t(K.retention.action)}>{(p) => <Select id={p.id} value={r.action} data-f={`action-${c.id}`} onChange={(e) => set(c.id, { action: e.target.value as RetentionRules[string]['action'] })}>{allowed(c.id).map((a) => <option key={a} value={a}>{t(`privacy.action.${a}`)}</option>)}</Select>}</Field>
                <span className="t-xs t-muted">{t(K.retention.past, { count: c.dueNow, held: c.held })}</span>
              </div>
            </Card>
          );
        })}
      </div>
      {changed && (
        <Card>
          <div className="stack gap-3" data-retention-review>
            <span className="t-sm t-semibold">{t(K.retention.effect)}</span>
            {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
            {pv?.problems.map((p) => <p key={p} className="t-sm t-error" role="alert" data-problem={p}>{errText(t, p)}</p>)}
            {pv && pv.rows.filter((r) => r.current.days !== r.proposed.days || r.current.action !== r.proposed.action).map((r) => (
              <div key={r.category} className="stack gap-0" data-effect={r.category}><span className="t-xs t-semibold">{catName(t, r.category)}</span><span className="t-xs t-muted">{t(K.retention.before, { count: r.dueNowCurrent })} · {t(K.retention.after, { count: r.dueNowProposed })}</span></div>
            ))}
            {pv && (pv.actionable > 0 ? <p className="t-sm" data-actionable style={{ color: 'var(--color-warning)' }}>{t(K.retention.actionable, { count: pv.actionable })}</p> : null)}
            {pv && pv.forReview > 0 && <p className="t-sm" data-for-review>{t(K.retention.forReview, { count: pv.forReview })}</p>}
            {pv && pv.actionable + pv.forReview === 0 && <p className="t-xs" data-no-impact>{t(K.retention.noImpact)}</p>}
            <p className="t-xs t-muted">{t(K.retention.lengthen)}</p>
            <div className="row gap-2" role="group"><Chip pressed={mode === 'now'} onClick={() => setMode('now')}>{t(K.policy.now)}</Chip><Chip pressed={mode === 'day'} onClick={() => setMode('day')}>{t(K.policy.onDay)}</Chip></div>
            {mode === 'day' && <Field label={t(K.retention.when)} error={pv?.effectiveProblem ? errText(t, pv.effectiveProblem) : undefined}>{(p) => <Input id={p.id} type="date" min={todayStr()} value={day} data-f="retention-day" onChange={(e) => setDay(e.target.value)} />}</Field>}
            <Field label={t(K.retention.reason)} hint={`${lettersOf(reason)}/20`}>{(p) => <TextArea id={p.id} rows={2} value={reason} data-f="retention-reason" onChange={(e) => setReason(e.target.value)} />}</Field>
            {needAck && <Checkbox checked={ack} onChange={setAck} label={t(K.retention.confirm)} />}
            <div className="row gap-2"><Button variant="ghost" data-act="retention-discard" onClick={() => { setRules(Object.fromEntries(v.categories.map((c) => [c.id, { ...c.rule }]))); setPv(null); setReason(''); setAck(false); }}>{t(K.retention.discard)}</Button><Button className="grow" data-act="retention-save" disabled={!ready} loading={s.busy} onClick={() => void save()}>{t(K.retention.save)}</Button></div>
          </div>
        </Card>
      )}
      <div className="stack gap-2" data-runs><span className="t-sm t-semibold">{t(K.retention.runs)}</span>
        {v.runs.length === 0 ? <span className="t-xs t-muted">{t(K.retention.noRuns)}</span> : v.runs.map((r) => (
          <Card key={r.id}><div className="stack gap-0" data-run={r.id}><span className="t-xs t-semibold">{t(K.retention.run, { code: r.code, date: formatDate(r.at, lang), version: r.policyVersion })}</span>{r.actions.map((a) => <span key={a.category} className="t-xs">{t(K.retention.runLine, { action: t(`privacy.action.${a.action}`, { defaultValue: a.action }), count: a.count, category: catName(t, a.category) })}</span>)}{r.capped && <span className="t-xs" style={{ color: 'var(--color-warning)' }}>{t(K.retention.runMore, { count: r.remaining })}</span>}</div></Card>
        ))}
      </div>
      <div className="stack gap-1"><span className="t-sm t-semibold">{t(K.retention.versions)}</span>{v.versions.map((x) => <span key={x.id} className="t-xs t-muted">{t(K.retention.versionLine, { version: x.version, date: formatDate(x.effectiveFrom, lang), by: x.byName })} · {x.reason}</span>)}</div>
    </Section>
  );
}

/* ------------------------------------------------------------------ policy */

function PolicyTab({ s, t, lang }: { s: PrivacyState; t: T; lang: string }) {
  const toast = useToast();
  const pol: PrivacyPolicyView | null = s.policy;
  const [read, setRead] = useState<'en' | 'hi' | 'mr'>('en');
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState({ en: '', hi: '', mr: '' });
  const [summary, setSummary] = useState('');
  const [material, setMaterial] = useState(true);
  const [mode, setMode] = useState<'now' | 'day'>('now');
  const [day, setDay] = useState(todayStr());
  const [problem, setProblem] = useState<string | null>(null);
  const [how, setHow] = useState<RequestChannel>('whatsapp');
  const [note, setNote] = useState('');
  const cur = pol?.current ?? null;
  useEffect(() => { if (editing && cur) setText({ en: cur.text.en, hi: cur.text.hi, mr: cur.text.mr }); }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setRead(lang === 'hi' || lang === 'mr' ? lang : 'en'); }, [lang]);
  const shown = useMemo(() => (cur ? (cur.text[read].trim() ? cur.text[read] : cur.text.en) : ''), [cur, read]);
  if (!pol) return <LoadingState label={t(K.loading)} variant="list" rows={3} />;
  const publish = async () => { setProblem(null); const r = await s.publishPolicy({ text, summary, material, effectiveFrom: mode === 'now' ? null : new Date(`${day}T00:00:00`).toISOString() }); if (r.ok) { setEditing(false); setSummary(''); toast.push(t(K.policy.published)); } else setProblem(r.problem); };
  const notice = async () => { if (!pol.noticeOpen) return; setProblem(null); const r = await s.recordNotice(pol.noticeOpen.versionId, how, note); if (r.ok) { setNote(''); toast.push(t(K.policy.noticeDone)); } else setProblem(r.problem); };
  return (
    <Section title={t(K.policy.title)} hint={t(K.policy.hint)}>
      {cur ? <p className="t-xs" data-policy-current={cur.version}>{t(K.policy.current, { version: cur.version, date: formatDate(cur.effectiveFrom, lang) })}</p> : <p className="t-sm">{t(K.policy.none)}</p>}
      {pol.scheduled && <p className="t-sm" data-scheduled style={{ color: 'var(--color-warning)' }}>{t(K.policy.scheduled, { version: pol.scheduled.version, date: formatDate(pol.scheduled.effectiveFrom, lang) })}</p>}
      {pol.noticeOpen && (
        <Card>
          <div className="stack gap-2" data-notice-open>
            <span className="t-sm t-semibold" style={{ color: 'var(--color-warning)' }}>{t(K.policy.notice)} · {t(K.policy.noticeOwed)}</span>
            <p className="t-xs">{t(K.policy.noticeHint, { customers: pol.reach.customers, partners: pol.reach.partners })}</p>
            <Field label={t(K.policy.noticeHow)}>{(p) => <Select id={p.id} value={how} data-f="notice-how" onChange={(e) => setHow(e.target.value as RequestChannel)}>{REQUEST_CHANNELS.map((x) => <option key={x} value={x}>{t(`privacy.channel.${x}`)}</option>)}</Select>}</Field>
            <Field label={t(K.policy.noticeNote)} hint={`${lettersOf(note)}/${NOTE_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={note} data-f="notice-note" onChange={(e) => setNote(e.target.value)} />}</Field>
            {problem && !editing && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
            <div><Button size="sm" data-act="notice-do" disabled={lettersOf(note) < NOTE_MIN} loading={s.busy} onClick={() => void notice()}>{t(K.policy.noticeDo)}</Button></div>
          </div>
        </Card>
      )}
      {cur && (
        <Card>
          <div className="stack gap-2" data-policy-text>
            <div className="row gap-2" role="group" aria-label={t(K.policy.language)}>{(['en', 'hi', 'mr'] as const).map((l) => <Chip key={l} pressed={read === l} onClick={() => setRead(l)}>{l === 'en' ? 'English' : l === 'hi' ? 'हिंदी' : 'मराठी'}</Chip>)}</div>
            <p className="t-sm" lang={read} style={{ whiteSpace: 'pre-wrap' }}>{shown}</p>
            {!cur.text[read].trim() && <p className="t-xs t-muted">{t(K.policy.missing)}</p>}
          </div>
        </Card>
      )}
      {!editing ? <div><Button size="sm" variant="secondary" data-act="policy-edit" onClick={() => { setProblem(null); setEditing(true); }}>{t(K.policy.edit)}</Button></div> : (
        <Card>
          <div className="stack gap-3" data-policy-form>
            <Field label={t(K.policy.textEn)}>{(p) => <TextArea id={p.id} rows={6} value={text.en} data-f="policy-en" onChange={(e) => setText({ ...text, en: e.target.value })} />}</Field>
            <Field label={t(K.policy.textHi)}>{(p) => <TextArea id={p.id} rows={5} lang="hi" value={text.hi} data-f="policy-hi" onChange={(e) => setText({ ...text, hi: e.target.value })} />}</Field>
            <Field label={t(K.policy.textMr)}>{(p) => <TextArea id={p.id} rows={5} lang="mr" value={text.mr} data-f="policy-mr" onChange={(e) => setText({ ...text, mr: e.target.value })} />}</Field>
            <Field label={t(K.policy.summary)} hint={`${lettersOf(summary)}/20`}>{(p) => <TextArea id={p.id} rows={2} value={summary} data-f="policy-summary" onChange={(e) => setSummary(e.target.value)} />}</Field>
            <Checkbox checked={material} onChange={setMaterial} label={t(K.policy.material)} />
            <div className="row gap-2" role="group"><Chip pressed={mode === 'now'} onClick={() => setMode('now')}>{t(K.policy.now)}</Chip><Chip pressed={mode === 'day'} onClick={() => setMode('day')}>{t(K.policy.onDay)}</Chip></div>
            {mode === 'day' && <Field label={t(K.retention.when)}>{(p) => <Input id={p.id} type="date" min={todayStr()} value={day} data-f="policy-day" onChange={(e) => setDay(e.target.value)} />}</Field>}
            {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
            <div className="row gap-2"><Button variant="ghost" onClick={() => setEditing(false)}>{t(K.close)}</Button><Button className="grow" data-act="policy-publish" disabled={lettersOf(summary) < 20 || text.en.trim().length < 200} loading={s.busy} onClick={() => void publish()}>{t(K.policy.publish)}</Button></div>
          </div>
        </Card>
      )}
      <div className="stack gap-2" data-policy-versions><span className="t-sm t-semibold">{t(K.policy.versions)}</span>
        {pol.versions.map((v) => (
          <Card key={v.id}><div className="stack gap-1" data-policy-version={v.version}>
            <div className="row between" style={{ alignItems: 'center', gap: 8 }}><span className="t-xs t-semibold">{t(K.policy.versionLine, { version: v.version, date: formatDate(v.effectiveFrom, lang), by: v.byName })}</span>{v.material && <Badge tone="warning">{t(K.policy.materialBadge)}</Badge>}</div>
            <span className="t-xs">{v.summary}</span>
            {v.material && (v.noticeAt ? <span className="t-xs t-muted">{t(K.policy.noticeLine, { date: formatDate(v.noticeAt, lang), by: v.noticeBy ?? '', how: t(`privacy.channel.${v.noticeHow ?? 'phone'}`), note: v.noticeNote ?? '' })}</span> : <span className="t-xs" style={{ color: 'var(--color-warning)' }}>{t(K.policy.noticeOwed)}</span>)}
          </div></Card>
        ))}
      </div>
    </Section>
  );
}
