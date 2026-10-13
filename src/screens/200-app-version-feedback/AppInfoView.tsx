import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, ArrowUp, Lightbulb, Plus, Warning } from '@phosphor-icons/react';
import { Badge, Button, Card, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, TextArea, formatDate, useToast } from '@/design-system';
import type { AppInfoView, ProductFeedbackInboxRow, ProductFeedbackView, ReleaseItemView, ReleaseView } from '@/data/repository';
import type { HelpText, ReleaseItemKind } from '@/data/types';
import { AREAS, FEEDBACK_MAX, FEEDBACK_MIN, ITEM_KINDS, ITEM_MIN, KINDS, NOTE_MIN, BROWSERS, TITLE_MIN, lettersOf } from '@/features/appinfo/appinfo';
import { SERVICES, creditsOf } from '@/features/appinfo/credits';
import { APP_INFO_KEYS as K, ADMIN_TABS, TABS } from './app-version-feedback.types';
import { useAppInfo } from './useAppInfo';
import type { AppInfoState } from './useAppInfo';

type T = ReturnType<typeof useTranslation>['t'];
const errText = (t: T, code: string) => t(`appInfo.error.${code}`, { defaultValue: t(K.error.generic) });
const KIND_TONE: Record<ReleaseItemKind, 'warning' | 'accent' | 'success' | 'neutral'> = { workflow: 'warning', new: 'accent', improved: 'success', fixed: 'neutral' };
const pick = (text: HelpText, lang: string): { value: string; translated: boolean } => {
  const v = (text as unknown as Record<string, string | undefined>)[lang];
  return v ? { value: v, translated: true } : { value: text.en, translated: lang === 'en' };
};
const roleLabel = (t: T, id: string, names?: Record<string, string>): string => names?.[id] ?? t(`appInfo.role.${id}`, { defaultValue: id });

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="stack gap-3">
      <h2 className="t-md t-semibold" style={{ borderTop: '1px solid var(--color-accent-primary)', paddingTop: 12 }}>{title}</h2>
      {hint && <p className="t-xs t-muted">{hint}</p>}
      {children}
    </section>
  );
}
const Problem = ({ t, code }: { t: T; code: string | null }) => (code ? <p className="t-sm t-error" role="alert" data-problem={code}>{errText(t, code)}</p> : null);

/** Screen 200 — App Version, Changelog & Feedback. What changed in plain words, an update that is honest about the device, and ideas about the app itself. */
export function AppInfoScreen() {
  const { t, i18n } = useTranslation();
  const s = useAppInfo();
  const head = <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh onClick={() => void s.check()}>{t(K.refresh)}</Button>} />;
  if (s.load === 'loading' && !s.info) return <Screen width="default">{head}<LoadingState label={t(K.loading)} variant="list" rows={4} /></Screen>;
  if (s.load === 'error' && !s.info) return <Screen width="default">{head}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.refresh()} /></Screen>;
  const info = s.info;
  if (!info) return null;
  const lang = i18n.language;
  const tabs = s.isAdmin ? ADMIN_TABS : TABS;
  return (
    <Screen width="default">
      {head}
      <div className="stack gap-4">
        {s.offline && <p className="t-xs t-muted" role="status" data-offline>{t(K.offline)}</p>}
        <UpdateCard s={s} info={info} t={t} lang={lang} />
        <div className="tabs-scroll"><div role="tablist" aria-label={t(K.tab.label)} className="ds-tabs ds-tabs--scroll">{tabs.map((id) => <button key={id} type="button" role="tab" aria-selected={s.tab === id} className="ds-tabs__tab" data-tab={id} onClick={() => s.setTab(id)}>{t(`appInfo.tab.${id}`)}</button>)}</div></div>
        {s.tab === 'whatsnew' && <WhatsNewTab s={s} info={info} t={t} lang={lang} />}
        {s.tab === 'ideas' && <IdeasTab s={s} t={t} lang={lang} />}
        {s.tab === 'about' && <AboutTab s={s} info={info} t={t} lang={lang} />}
        {s.tab === 'inbox' && s.isAdmin && <InboxTab s={s} t={t} lang={lang} />}
        {s.tab === 'release' && s.isAdmin && <ReleaseTab s={s} info={info} t={t} lang={lang} />}
        <p className="t-xs t-muted" data-placeholder-note>{t(K.note.placeholders)}</p>
      </div>
    </Screen>
  );
}

/* ----------------------------------------------------------------- Update */

function UpdateCard({ s, info, t, lang }: { s: AppInfoState; info: AppInfoView; t: T; lang: string }) {
  const toast = useToast();
  const when = s.checkedAt ? new Date(s.checkedAt).toLocaleTimeString(lang === 'en' ? 'en-IN' : lang, { hour: '2-digit', minute: '2-digit' }) : '';
  if (!info.updateAvailable) {
    return <p className="t-xs t-muted" data-uptodate>{t(K.update.upToDate, { running: s.running })} · {t(K.update.checked, { time: when })}</p>;
  }
  const newer = info.releases.filter((r) => r.newer);
  const mine = newer.flatMap((r) => r.items.filter((i) => i.relevant)).sort((a, b) => (a.kind === 'workflow' ? 0 : 1) - (b.kind === 'workflow' ? 0 : 1));
  const tooOld = s.compat?.state === 'too_old';
  return (
    <Card>
      <div className="stack gap-3" data-update data-compat={s.compat?.state ?? 'unknown'} style={{ borderLeft: '3px solid var(--color-accent-primary)', paddingLeft: 12 }}>
        <span className="row gap-2" style={{ alignItems: 'center' }}><ArrowUp size={20} /><span className="t-md t-semibold">{t(K.update.title, { latest: info.latest })}</span></span>
        <span className="t-xs t-muted">{t(K.update.running, { running: s.running })}</span>
        {info.whatsNew.items === 0 ? <p className="t-sm" data-nothing>{t(K.update.none)}</p> : (
          <div className="stack gap-1" data-whatsnew-summary>
            <span className="t-sm t-semibold">{t(K.update.forYou, { count: info.whatsNew.items })}{info.whatsNew.workflow > 0 ? ` · ${t(K.update.workflow, { count: info.whatsNew.workflow })}` : ''}</span>
            {mine.slice(0, 3).map((i) => <ItemLine key={i.id} i={i} t={t} lang={lang} compact />)}
          </div>
        )}
        {tooOld && <p className="t-sm" data-too-old style={{ color: 'var(--color-warning)' }}>{t(K.update.compatTooOld, { browser: s.browser.name, major: s.browser.major ?? '', need: s.compat?.need ?? '', running: s.running })}</p>}
        {s.compat?.state === 'unknown' && <p className="t-sm" data-compat-unknown>{t(K.update.compatUnknown, { running: s.running })}</p>}
        <div className="row gap-2 wrap">
          <Button data-act="update-now" disabled={tooOld} loading={s.busy} onClick={async () => { const ok = await s.update(); if (ok) toast.push(t(K.update.done, { version: info.latest })); }}>{t(K.update.now)}</Button>
          <Button variant="secondary" data-act="update-see" onClick={() => s.setTab('whatsnew')}>{t(K.update.see)}</Button>
        </div>
        <p className="t-xs t-muted">{t(K.update.stub)}</p>
      </div>
    </Card>
  );
}

/* ----------------------------------------------------------------- What is new */

function ItemLine({ i, t, lang, compact }: { i: ReleaseItemView; t: T; lang: string; compact?: boolean }) {
  const txt = pick(i.text, lang);
  const workflow = i.kind === 'workflow';
  return (
    <div className="stack gap-1" data-item={i.kind} data-relevant={i.relevant} style={workflow ? { borderLeft: '3px solid var(--color-warning)', paddingLeft: 10 } : undefined}>
      <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
        <Badge tone={KIND_TONE[i.kind]}>{t(`appInfo.kind.${i.kind}`)}</Badge>
        {!compact && <span className="t-xs t-muted">{i.roles.map((r) => t(`appInfo.role.${r}`, { defaultValue: r })).join(', ')}</span>}
      </span>
      <span className="t-sm" style={workflow ? { fontWeight: 600 } : undefined}>{txt.value}</span>
      {!txt.translated && !compact && <span className="t-xs t-muted">{t(K.untranslated)}</span>}
      {i.route && !compact && <div><Link className="ds-btn ds-btn--ghost ds-btn--sm" to={i.route} data-item-link={i.route}>{t(K.whatsnew.open)}</Link></div>}
    </div>
  );
}

function ReleaseCard({ r, only, t, lang }: { r: ReleaseView; only: boolean; t: T; lang: string }) {
  const items = (only ? r.items.filter((i) => i.relevant) : r.items).slice().sort((a, b) => (a.kind === 'workflow' ? 0 : 1) - (b.kind === 'workflow' ? 0 : 1));
  return (
    <Card>
      <div className="stack gap-3" data-release={r.version} data-newer={r.newer}>
        <div className="row between wrap" style={{ gap: 8, alignItems: 'center' }}>
          <span className="t-md t-semibold">{t(K.whatsnew.version, { v: r.version })}</span>
          <span className="row gap-1 wrap">{r.newer && <Badge tone="accent">{t(K.whatsnew.newer)}</Badge>}{r.current && <Badge tone="success">{t(K.whatsnew.youAreHere)}</Badge>}<span className="t-xs t-muted">{formatDate(r.releasedAt, lang)}</span></span>
        </div>
        {items.length === 0 ? <p className="t-sm t-muted">{t(K.whatsnew.noneForRole)}</p> : <div className="stack gap-3">{items.map((i) => <ItemLine key={i.id} i={i} t={t} lang={lang} />)}</div>}
      </div>
    </Card>
  );
}

function WhatsNewTab({ s, info, t, lang }: { s: AppInfoState; info: AppInfoView; t: T; lang: string }) {
  const [only, setOnly] = useState(!s.isAdmin);
  return (
    <div className="stack gap-3">
      <div className="row between wrap" style={{ gap: 8, alignItems: 'center' }}>
        <h2 className="t-md t-semibold">{t(K.whatsnew.title)}</h2>
        {!s.isAdmin && <div className="row gap-2" role="group"><span data-only="mine"><Chip pressed={only} onClick={() => setOnly(true)}>{t(K.whatsnew.mine)}</Chip></span><span data-only="all"><Chip pressed={!only} onClick={() => setOnly(false)}>{t(K.whatsnew.all)}</Chip></span></div>}
      </div>
      {info.releases.length === 0 ? <EmptyState title={t(K.whatsnew.empty)} body={t(K.whatsnew.emptyHint)} /> : <div className="grid-auto" data-releases style={{ ['--min' as string]: '320px' }}>{info.releases.map((r) => <ReleaseCard key={r.id} r={r} only={only && !s.isAdmin} t={t} lang={lang} />)}</div>}
    </div>
  );
}

/* ----------------------------------------------------------------- Ideas */

function FeedbackCard({ f, t, lang, onVote }: { f: ProductFeedbackView; t: T; lang: string; onVote?: () => void }) {
  return (
    <Card>
      <div className="stack gap-1" data-idea={f.id} data-status={f.status}>
        <span className="row between wrap" style={{ gap: 8, alignItems: 'flex-start' }}><span className="t-sm t-semibold">{f.mine ? f.text : f.publicTitle ?? f.text}</span><Badge tone={f.status === 'done' ? 'success' : f.status === 'planned' ? 'accent' : 'neutral'}>{t(`appInfo.ideas.status.${f.status}`)}</Badge></span>
        <span className="t-xs t-muted">{f.code} · {formatDate(f.at, lang)} · {t(K.ideas.votes, { count: f.votes })}</span>
        {f.publicNote && <span className="t-xs">{f.publicNote}</span>}
        {f.note && f.mine && <span className="t-xs">{f.note}</span>}
        {onVote && !f.mine && <div><Button size="sm" variant={f.iVoted ? 'primary' : 'secondary'} data-act="me-too" onClick={onVote}>{f.iVoted ? t(K.ideas.meTooDone) : t(K.ideas.meToo)}</Button></div>}
      </div>
    </Card>
  );
}

function IdeasTab({ s, t, lang }: { s: AppInfoState; t: T; lang: string }) {
  const toast = useToast();
  const [problem, setProblem] = useState<string | null>(null);
  const d = s.draft;
  const send = async () => {
    setProblem(null);
    const r = await s.submit({ kind: d.kind, text: d.text, area: d.area });
    if (r.ok) { toast.push(t(r.value.status === 'new' ? K.ideas.sent : K.ideas.sentGrouped)); s.clearDraft(); } else setProblem(r.problem);
  };
  return (
    <div className="stack gap-5">
      <Section title={t(K.ideas.title)} hint={t(K.ideas.hint)}>
        <div><Link className="ds-btn ds-btn--ghost ds-btn--sm" to="/help" data-help-link>{t(K.ideas.helpLink)}</Link></div>
        <div className="stack gap-3" data-idea-form>
          <div className="row gap-2 wrap" role="group">{KINDS.map((k) => <span key={k} data-kind={k}><Chip pressed={d.kind === k} onClick={() => s.setDraft({ ...d, kind: k })}>{t(`appInfo.ideas.kind.${k}`)}</Chip></span>)}</div>
          <Field label={t(K.ideas.areaLabel)}>{(p) => <Select id={p.id} value={d.area} data-f="idea-area" onChange={(e) => s.setDraft({ ...d, area: e.target.value })}>{AREAS.map((a) => <option key={a} value={a}>{t(`appInfo.ideas.area.${a}`)}</option>)}</Select>}</Field>
          <Field label={t(K.ideas.text)} hint={`${lettersOf(d.text)}/${FEEDBACK_MIN} · ${d.text.length}/${FEEDBACK_MAX}`}>{(p) => <TextArea id={p.id} rows={4} value={d.text} data-f="idea-text" onChange={(e) => s.setDraft({ ...d, text: e.target.value.slice(0, FEEDBACK_MAX) })} />}</Field>
          <p className="t-xs t-muted">{t(K.ideas.draftKept)}</p>
          {s.similar && (s.similar.published.length > 0 || s.similar.others > 0) && (
            <div className="stack gap-2" data-similar>
              {s.similar.published.length > 0 && <span className="t-sm t-semibold">{t(K.ideas.similarTitle)}</span>}
              {s.similar.published.map((f) => <FeedbackCard key={f.id} f={f} t={t} lang={lang} onVote={() => void s.vote(f.id)} />)}
              {s.similar.others > 0 && <p className="t-xs" data-similar-others>{t(K.ideas.similarOthers, { count: s.similar.others })}</p>}
            </div>
          )}
          <Problem t={t} code={problem} />
          <div><Button data-act="idea-send" disabled={lettersOf(d.text) < FEEDBACK_MIN} loading={s.busy} icon={<Lightbulb size={16} />} onClick={() => void send()}>{t(K.ideas.send)}</Button></div>
        </div>
      </Section>
      <Section title={t(K.ideas.mine)}>
        {s.boardLoad === 'loading' && !s.board ? <LoadingState label={t(K.loading)} variant="list" rows={2} /> : s.board && s.board.mine.length === 0 ? <p className="t-sm t-muted" data-mine-empty>{t(K.ideas.mineEmpty)}</p> : <div className="grid-auto" data-mine style={{ ['--min' as string]: '300px' }}>{s.board?.mine.map((f) => <FeedbackCard key={f.id} f={f} t={t} lang={lang} />)}</div>}
      </Section>
      <Section title={t(K.ideas.roadmap)} hint={t(K.ideas.roadmapHint)}>
        {s.board && s.board.roadmap.length === 0 ? <p className="t-sm t-muted">{t(K.ideas.roadmapEmpty)}</p> : <div className="grid-auto" data-roadmap style={{ ['--min' as string]: '300px' }}>{s.board?.roadmap.map((f) => <FeedbackCard key={f.id} f={f} t={t} lang={lang} onVote={() => void s.vote(f.id)} />)}</div>}
      </Section>
    </div>
  );
}

/* ----------------------------------------------------------------- About */

function AboutTab({ s, info, t, lang }: { s: AppInfoState; info: AppInfoView; t: T; lang: string }) {
  const credits = creditsOf();
  const req = Object.entries(info.requires).map(([b, v]) => `${b} ${v}`).join(', ');
  const group = (runtime: boolean) => credits.filter((c) => c.runtime === runtime);
  return (
    <div className="stack gap-5">
      <Section title={t(K.about.title)}>
        <div className="stack gap-2" data-about>
          <div className="row between wrap" style={{ gap: 8 }}><span className="t-sm t-muted">{t(K.about.version)}</span><span className="t-sm num" data-running>{s.running}</span></div>
          <div className="row between wrap" style={{ gap: 8 }}><span className="t-sm t-muted">{t(K.about.latest)}</span><span className="t-sm num" data-latest>{info.latest}</span></div>
          <div className="row between wrap" style={{ gap: 8 }}><span className="t-sm t-muted">{t(K.about.checked)}</span><span className="t-sm">{s.checkedAt ? new Date(s.checkedAt).toLocaleString(lang === 'en' ? 'en-IN' : lang) : '—'}</span></div>
          <div className="row between wrap" style={{ gap: 8 }}><span className="t-sm t-muted">{t(K.about.deviceLabel)}</span><span className="t-sm" data-device>{t(K.about.deviceLine, { device: t(`appInfo.about.device.${s.device}`), browser: s.browser.name, major: s.browser.major ?? '' })}</span></div>
        </div>
        <div className="stack gap-1" data-compat-card data-state={s.compat?.state}>
          <span className="t-sm t-semibold row gap-2" style={{ alignItems: 'center' }}>{s.compat?.state === 'too_old' && <Warning size={16} />}{t(K.about.compatLabel)}</span>
          <span className="t-sm">{t(`appInfo.about.compat.${s.compat?.state ?? 'unknown'}`)}</span>
          <span className="t-xs t-muted">{req ? t(K.about.compatNeeds, { list: req }) : t(K.about.compatNone)}</span>
        </div>
      </Section>
      <Section title={t(K.about.credits)} hint={t(K.about.creditsHint)}>
        {([true, false] as const).map((rt) => (
          <div key={String(rt)} className="stack gap-2" data-credits={rt ? 'runtime' : 'tooling'}>
            <span className="t-sm t-semibold">{rt ? t(K.about.runtime) : t(K.about.tooling)}</span>
            <div className="grid-auto" style={{ ['--min' as string]: '240px' }}>
              {group(rt).map((c) => <div key={c.name} className="row between wrap" style={{ gap: 8 }} data-credit={c.name}><span className="t-sm">{c.name} <span className="t-xs t-muted num">{c.version}</span></span><span className="t-xs t-muted">{t(`appInfo.about.credit.${c.purpose}`)}</span></div>)}
            </div>
          </div>
        ))}
        <div className="stack gap-1" data-services><span className="t-sm t-semibold">{t(K.about.creditServices)}</span>{SERVICES.map((x) => <span key={x} className="t-xs">{t(`appInfo.about.credit.${x}`)}</span>)}</div>
      </Section>
    </div>
  );
}

/* ----------------------------------------------------------------- Admin: inbox */

function InboxCard({ r, s, t, lang }: { r: ProductFeedbackInboxRow; s: AppInfoState; t: T; lang: string }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'planned' | 'done' | 'declined' | 'duplicate'>('planned');
  const [note, setNote] = useState('');
  const [publish, setPublish] = useState(false);
  const [title, setTitle] = useState('');
  const [pnote, setPnote] = useState('');
  const [dup, setDup] = useState('');
  const [cluster, setCluster] = useState(true);
  const [problem, setProblem] = useState<string | null>(null);
  const others = (s.inbox?.rows ?? []).filter((x) => x.id !== r.id);
  const canPublish = status === 'planned' || status === 'done';
  return (
    <Card>
      <div className="stack gap-2" data-inbox={r.id} data-status={r.status} data-members={r.members.length}>
        <span className="row between wrap" style={{ gap: 8, alignItems: 'flex-start' }}><span className="t-sm t-semibold">{r.text}</span><Badge tone={r.status === 'new' ? 'warning' : r.status === 'done' ? 'success' : 'neutral'}>{t(`appInfo.ideas.status.${r.status}`)}</Badge></span>
        <span className="t-xs t-muted">{r.code} · {t(`appInfo.ideas.kind.${r.kind}`)} · {t(`appInfo.ideas.area.${r.area}`)} · {formatDate(r.at, lang)} · {t(K.inbox.from, { role: roleLabel(t, r.role), v: r.version })}</span>
        <span className="row gap-1 wrap">{r.members.length > 0 && <Badge tone="accent">{t(K.inbox.similar, { count: r.members.length })}</Badge>}<Badge tone="neutral">{t(K.inbox.votes, { count: r.votes })}</Badge></span>
        {r.members.length > 0 && <div className="stack gap-1" data-cluster>{r.members.map((m) => <span key={m.id} className="t-xs t-muted">{m.code} · {roleLabel(t, m.role)} · {m.text}</span>)}</div>}
        {r.note && <span className="t-xs">{r.note}</span>}
        {r.status === 'new' && !open && <div><Button size="sm" variant="secondary" data-act="inbox-open" onClick={() => setOpen(true)}>{t(K.inbox.answer)}</Button></div>}
        {open && (
          <div className="stack gap-2" data-inbox-form>
            <div className="row gap-2 wrap" role="group">{(['planned', 'done', 'declined', 'duplicate'] as const).map((x) => <span key={x} data-st={x}><Chip pressed={status === x} onClick={() => setStatus(x)}>{t(`appInfo.ideas.status.${x}`)}</Chip></span>)}</div>
            <Field label={t(K.inbox.note)} hint={`${lettersOf(note)}/${NOTE_MIN}`}>{(p) => <Input id={p.id} value={note} data-f="inbox-note" onChange={(e) => setNote(e.target.value)} />}</Field>
            {status === 'duplicate' && <Field label={t(K.inbox.duplicateOf)}>{(p) => <Select id={p.id} value={dup} data-f="inbox-dup" onChange={(e) => setDup(e.target.value)}><option value="">—</option>{others.map((o) => <option key={o.id} value={o.id}>{o.code} · {o.text.slice(0, 50)}</option>)}</Select>}</Field>}
            {canPublish && <label className="row gap-2" style={{ alignItems: 'center', minHeight: 44 }}><input type="checkbox" checked={publish} data-f="inbox-publish" onChange={(e) => setPublish(e.target.checked)} /><span className="t-sm">{t(K.inbox.publish)}</span></label>}
            {canPublish && publish && (
              <>
                <Field label={t(K.inbox.publicTitle)} hint={`${lettersOf(title)}/${TITLE_MIN}`}>{(p) => <Input id={p.id} value={title} data-f="inbox-title" onChange={(e) => setTitle(e.target.value)} />}</Field>
                <Field label={t(K.inbox.publicNote)}>{(p) => <Input id={p.id} value={pnote} data-f="inbox-pnote" onChange={(e) => setPnote(e.target.value)} />}</Field>
              </>
            )}
            {r.members.length > 0 && <label className="row gap-2" style={{ alignItems: 'center', minHeight: 44 }}><input type="checkbox" checked={cluster} onChange={(e) => setCluster(e.target.checked)} /><span className="t-sm">{t(K.inbox.applyCluster)}</span></label>}
            <Problem t={t} code={problem} />
            <div className="row gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>{t(K.cancel)}</Button><Button data-act="inbox-save" disabled={lettersOf(note) < NOTE_MIN} loading={s.busy} onClick={async () => { setProblem(null); const x = await s.handle(r.id, { status, note, publish: canPublish && publish, publicTitle: title, publicNote: pnote, duplicateOf: dup || null, applyToCluster: cluster }); if (x.ok) { toast.push(t(K.inbox.saved)); setOpen(false); } else setProblem(x.problem); }}>{t(K.inbox.save)}</Button></div>
          </div>
        )}
      </div>
    </Card>
  );
}

function InboxTab({ s, t, lang }: { s: AppInfoState; t: T; lang: string }) {
  const v = s.inbox;
  const filters = ['open', 'planned', 'done', 'declined', 'duplicate', 'all'] as const;
  return (
    <div className="stack gap-3">
      <Section title={t(K.inbox.title)} hint={t(K.inbox.hint)}>
        <div className="row gap-2 wrap" role="group" data-filters>
          {filters.map((f) => <span key={f} data-filter={f}><Chip pressed={s.inboxFilter.status === f} onClick={() => s.setInboxFilter({ ...s.inboxFilter, status: f })}>{f === 'open' ? t(K.inbox.filter.open) : f === 'all' ? t(K.inbox.filter.all) : t(`appInfo.ideas.status.${f}`)} {v ? (f === 'open' ? v.counts.new : f === 'all' ? Object.values(v.counts).reduce((a, b) => a + b, 0) : v.counts[f]) : ''}</Chip></span>)}
        </div>
        {!v ? (s.inboxLoad === 'error' ? <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.refresh()} /> : <LoadingState label={t(K.loading)} variant="list" rows={3} />)
          : v.rows.length === 0 ? <EmptyState title={t(K.inbox.empty)} body={t(K.inbox.emptyHint)} />
          : <div className="grid-auto" data-inbox-list style={{ ['--min' as string]: '320px' }}>{v.rows.map((r) => <InboxCard key={r.id} r={r} s={s} t={t} lang={lang} />)}</div>}
      </Section>
    </div>
  );
}

/* ----------------------------------------------------------------- Admin: release */

interface Draft { kind: ReleaseItemKind; en: string; hi: string; mr: string; roles: string[]; route: string }
const nextPatch = (v: string): string => { const p = v.split('.').map((x) => Number(x) || 0); return `${p[0] ?? 0}.${p[1] ?? 0}.${(p[2] ?? 0) + 1}`; };

function ReleaseTab({ s, info, t, lang }: { s: AppInfoState; info: AppInfoView; t: T; lang: string }) {
  const toast = useToast();
  const a = info.adoption;
  const [version, setVersion] = useState(nextPatch(info.latest));
  useEffect(() => { setVersion(nextPatch(info.latest)); }, [info.latest]);
  const blank = (): Draft => ({ kind: 'new', en: '', hi: '', mr: '', roles: ['all'], route: '' });
  const [items, setItems] = useState<Draft[]>([blank()]);
  const [req, setReq] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<string | null>(null);
  const setItem = (i: number, p: Partial<Draft>) => setItems((x) => x.map((it, n) => (n === i ? { ...it, ...p } : it)));
  const roles = ['all', ...info.roles];
  const ready = lettersOf(version) > 0 && items.every((i) => lettersOf(i.en) >= ITEM_MIN && i.roles.length > 0);
  return (
    <div className="stack gap-5">
      <Section title={t(K.adoption.title)} hint={t(K.adoption.hint)}>
        {!a || a.reported === 0 ? <p className="t-sm t-muted">{t(K.adoption.none)}</p> : (
          <div className="stack gap-3" data-adoption>
            <div className="grid-auto" style={{ ['--min' as string]: '140px' }}>
              <Card><div className="stack gap-0"><span className="t-xs t-muted">{t(K.adoption.reported)}</span><span className="t-lg t-semibold num" data-n="reported">{a.reported}</span></div></Card>
              <Card><div className="stack gap-0"><span className="t-xs t-muted">{t(K.adoption.onLatest)}</span><span className="t-lg t-semibold num" data-n="latest">{a.onLatest}</span></div></Card>
              <Card><div className="stack gap-0"><span className="t-xs t-muted">{t(K.adoption.behind)}</span><span className="t-lg t-semibold num" data-n="behind">{a.behind}</span></div></Card>
              <Card><div className="stack gap-0"><span className="t-xs t-muted">{t(K.adoption.unsupported)}</span><span className="t-lg t-semibold num" data-n="unsupported">{a.unsupported}</span></div></Card>
            </div>
            <div className="stack gap-1">{a.byVersion.map((v) => <span key={v.version} className="t-sm" data-version-row={v.version}><b className="num">{v.version}</b> · {v.count} · <span className="t-xs t-muted">{Object.entries(v.roles).map(([r, n]) => `${roleLabel(t, r, info.roleNames)} ${n}`).join(', ')}</span></span>)}</div>
          </div>
        )}
      </Section>
      <Section title={t(K.release.title)} hint={t(K.release.hint)}>
        <div className="stack gap-4" data-release-form>
          <Field label={t(K.release.version)} hint={t(K.release.versionHint, { latest: info.latest })}>{(p) => <Input id={p.id} value={version} data-f="release-version" onChange={(e) => setVersion(e.target.value)} />}</Field>
          {items.map((it, i) => (
            <Card key={i}>
              <div className="stack gap-3" data-item-draft={i}>
                <div className="stack gap-1"><span className="t-xs t-muted">{t(K.release.itemKind)}</span><div className="row gap-2 wrap" role="group">{ITEM_KINDS.map((k) => <span key={k} data-ikind={k}><Chip pressed={it.kind === k} onClick={() => setItem(i, { kind: k })}>{t(`appInfo.kind.${k}`)}</Chip></span>)}</div></div>
                <div className="stack gap-1"><span className="t-xs t-muted">{t(K.release.itemRoles)}</span><div className="row gap-2 wrap" role="group">{roles.map((r) => <span key={r} data-irole={r}><Chip pressed={it.roles.includes(r)} onClick={() => setItem(i, { roles: it.roles.includes(r) ? it.roles.filter((x) => x !== r) : [...it.roles, r] })}>{roleLabel(t, r, info.roleNames)}</Chip></span>)}</div></div>
                <Field label={t(K.release.itemEn)} hint={`${lettersOf(it.en)}/${ITEM_MIN}`}>{(p) => <TextArea id={p.id} rows={2} value={it.en} data-f={`item-en-${i}`} onChange={(e) => setItem(i, { en: e.target.value })} />}</Field>
                <Field label={t(K.release.itemHi)}>{(p) => <TextArea id={p.id} rows={2} value={it.hi} onChange={(e) => setItem(i, { hi: e.target.value })} />}</Field>
                <Field label={t(K.release.itemMr)}>{(p) => <TextArea id={p.id} rows={2} value={it.mr} onChange={(e) => setItem(i, { mr: e.target.value })} />}</Field>
                <Field label={t(K.release.itemRoute)}>{(p) => <Input id={p.id} value={it.route} data-f={`item-route-${i}`} onChange={(e) => setItem(i, { route: e.target.value })} />}</Field>
                {items.length > 1 && <div><Button size="sm" variant="ghost" onClick={() => setItems((x) => x.filter((_, n) => n !== i))}>{t(K.release.removeItem)}</Button></div>}
              </div>
            </Card>
          ))}
          <div><Button size="sm" variant="secondary" icon={<Plus size={16} />} data-act="item-add" onClick={() => setItems((x) => [...x, blank()])}>{t(K.release.addItem)}</Button></div>
          <div className="stack gap-2"><span className="t-sm t-semibold">{t(K.release.requires)}</span><span className="t-xs t-muted">{t(K.release.requiresHint)}</span><div className="row gap-2 wrap">{BROWSERS.map((b) => <Field key={b} label={b}>{(p) => <Input id={p.id} inputMode="numeric" style={{ width: 96 }} value={req[b] ?? ''} data-f={`req-${b}`} onChange={(e) => setReq({ ...req, [b]: e.target.value.replace(/\D/g, '') })} />}</Field>)}</div></div>
          <Problem t={t} code={problem} />
          <div><Button data-act="release-publish" disabled={!ready} loading={s.busy} onClick={async () => {
            setProblem(null);
            const requires = Object.fromEntries(Object.entries(req).filter(([, v]) => v).map(([b, v]) => [b, Number(v)]));
            const r = await s.publish({ version, items, requires });
            if (r.ok) { toast.push(t(K.release.published, { v: r.value.version })); setItems([blank()]); setReq({}); } else setProblem(r.problem);
          }}>{t(K.release.publish)}</Button></div>
        </div>
      </Section>
      <span hidden>{lang}</span>
    </div>
  );
}
