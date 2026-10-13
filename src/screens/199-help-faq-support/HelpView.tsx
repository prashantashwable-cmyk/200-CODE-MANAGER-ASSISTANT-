import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, ChatCircleDots, Compass, Coins, CreditCard, FileText, Funnel, Gear, GraduationCap, Lifebuoy, Phone, Plus, ShieldCheck, Truck, UserCircle, Warning, Wrench } from '@phosphor-icons/react';
import { Badge, Button, Card, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, Tabs, TextArea, formatDate, useToast } from '@/design-system';
import type { HelpAdminRow, HelpAdminView, HelpArticleView, HelpRowView, HelpSupportPath } from '@/data/repository';
import type { HelpText } from '@/data/types';
import { ALL_ROLES, BODY_MIN, COMMENT_MAX, HELP_CATEGORIES, HELP_REASONS, MIN_RESPONSES, NOTE_MIN, SUGGEST_MIN, TITLE_MIN, lettersOf } from '@/features/help/help';
import type { HelpFlag, SupportKind } from '@/features/help/help';
import { HELP_KEYS as K, TABS } from './help-faq-support.types';
import { useHelp } from './useHelp';
import type { HelpScreenState } from './useHelp';

type T = ReturnType<typeof useTranslation>['t'];
const errText = (t: T, code: string) => t(`help.error.${code}`, { defaultValue: t(K.error.generic) });
const CATEGORY_ICON: Record<string, ReactNode> = { getting_started: <Compass size={20} />, account: <UserCircle size={20} />, leads_quotes: <Funnel size={20} />, earnings: <Coins size={20} />, payments: <CreditCard size={20} />, projects: <Wrench size={20} />, service: <ShieldCheck size={20} />, documents: <FileText size={20} />, orders: <Truck size={20} />, training: <GraduationCap size={20} />, admin: <Gear size={20} /> };
const FLAG_TONE: Record<HelpFlag, 'warning' | 'error' | 'neutral'> = { review_due: 'warning', broken_link: 'warning', reported: 'error', low_rate: 'warning', draft: 'neutral' };
const pick = (text: HelpText, lang: string): { value: string; translated: boolean } => {
  const v = (text as unknown as Record<string, string | undefined>)[lang];
  return v ? { value: v, translated: true } : { value: text.en, translated: lang === 'en' };
};
const roleLabel = (t: T, id: string, names?: Record<string, string>): string => (names?.[id] ?? t(`help.role.${id}`, { defaultValue: id }));

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

/** Screen 199 — Help, FAQ & Support. The first line of self-service for every role, with a way to say whether it helped and a way to reach a person. */
export function HelpScreen() {
  const { t, i18n } = useTranslation();
  const s = useHelp();
  const [suggesting, setSuggesting] = useState(false);
  const head = <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh onClick={() => void s.refresh()}>{t(K.refresh)}</Button>} />;
  const lang = i18n.language;
  return (
    <Screen width="default">
      {head}
      <div className="stack gap-4">
        {s.offline && <p className="t-xs t-muted" role="status" data-offline>{t(K.offline)}</p>}
        {s.isAdmin && <Tabs label={t(K.tab.label)} value={s.tab} onChange={(id) => s.setTab(id as (typeof TABS)[number])} items={TABS.map((id) => ({ id, label: t(`help.tab.${id}`) }))} />}
        {s.tab === 'help' && <ReaderTab s={s} t={t} lang={lang} onSuggest={() => setSuggesting(true)} />}
        {s.tab === 'manage' && <ManageTab s={s} t={t} lang={lang} />}
        {s.tab === 'gaps' && <GapsTab s={s} t={t} lang={lang} />}
        <p className="t-xs t-muted" data-placeholder-note>{t(K.note.placeholders)}</p>
      </div>
      <ArticleSheet s={s} t={t} lang={lang} onSuggest={() => setSuggesting(true)} />
      <Sheet open={suggesting} onClose={() => setSuggesting(false)} title={t(K.suggest.title)} closeLabel={t(K.close)}>
        {suggesting && <SuggestForm s={s} t={t} onDone={() => setSuggesting(false)} />}
      </Sheet>
    </Screen>
  );
}

/* ----------------------------------------------------------------- Reader */

function ArticleRow({ r, t, lang, onOpen }: { r: HelpRowView; t: T; lang: string; onOpen: () => void }) {
  return (
    <Card onClick={onOpen}>
      <div className="row gap-3" data-article={r.id} style={{ alignItems: 'flex-start' }}>
        <span style={{ color: 'var(--color-accent-secondary)', paddingTop: 2 }}>{CATEGORY_ICON[r.category] ?? <Lifebuoy size={20} />}</span>
        <div className="stack gap-1 grow" style={{ minWidth: 0 }}>
          <span className="t-sm t-semibold">{pick(r.title, lang).value}</span>
          <span className="t-xs">{pick(r.snippet, lang).value}</span>
          <span className="row gap-1 wrap"><Badge tone="neutral">{t(`help.category.${r.category}`)}</Badge></span>
        </div>
      </div>
    </Card>
  );
}

function SupportCard({ paths, phone, articleId, s, t, onSuggest }: { paths: HelpSupportPath[]; phone: string | null; articleId: string | null; s: HelpScreenState; t: T; onSuggest: () => void }) {
  const icon = (k: SupportKind) => (k === 'call' ? <Phone size={16} /> : k === 'safety' ? <Warning size={16} /> : <ChatCircleDots size={16} />);
  return (
    <Card>
      <div className="stack gap-3" data-support>
        <span className="t-md t-semibold">{t(K.support.title)}</span>
        {s.isAdmin ? <p className="t-sm" data-admin-note>{t(K.support.adminNote)}</p> : <p className="t-xs t-muted">{t(K.support.hint)}</p>}
        <div className="row gap-2 wrap">
          {paths.map((p) => p.kind === 'call'
            ? (phone ? <a key={p.kind} className="ds-btn ds-btn--secondary ds-btn--sm" href={`tel:${phone}`} data-path="call" onClick={() => s.escalate(articleId, 'call')}>{icon('call')}{t(K.support.call)}</a> : <span key={p.kind} className="t-xs t-muted">{t(K.support.noPhone)}</span>)
            : <Link key={p.kind} className="ds-btn ds-btn--secondary ds-btn--sm" to={p.route as string} data-path={p.kind} onClick={() => s.escalate(articleId, p.kind)}>{icon(p.kind)}{t(`help.support.${p.kind}`)}</Link>)}
          <Button size="sm" variant="ghost" data-act="suggest-open" icon={<Plus size={16} />} onClick={onSuggest}>{t(K.suggest.button)}</Button>
        </div>
        {paths.some((p) => p.kind === 'call' || p.kind === 'safety') && <p className="t-xs" data-urgent style={{ color: 'var(--color-warning)' }}>{t(K.support.urgent)}</p>}
      </div>
    </Card>
  );
}

function ReaderTab({ s, t, lang, onSuggest }: { s: HelpScreenState; t: T; lang: string; onSuggest: () => void }) {
  const v = s.search;
  const shownRole = s.viewAs ?? s.role;
  const roleIds = ['admin', 'customer', 'surveyor', 'technician', 'supplier'];
  return (
    <div className="stack gap-4">
      {s.isAdmin && (
        <div className="stack gap-1" data-view-as>
          <span className="t-xs t-muted">{t(K.reader.viewAs)}</span>
          <div className="row gap-2 wrap" role="group">
            <Chip pressed={!s.viewAs} onClick={() => s.setViewAs(null)}>{t(K.role.admin)}</Chip>
            {roleIds.filter((r) => r !== 'admin').map((r) => <span key={r} data-as={r}><Chip pressed={s.viewAs === r} onClick={() => s.setViewAs(r)}>{t(`help.role.${r}`)}</Chip></span>)}
            <span data-as="*"><Chip pressed={s.viewAs === '*'} onClick={() => s.setViewAs('*')}>{t(K.reader.everyRole)}</Chip></span>
          </div>
          <span className="t-xs t-muted">{t(K.reader.viewAsHint)}</span>
        </div>
      )}
      <div className="stack gap-2 sticky-under-shell" style={{ background: 'var(--color-bg)', paddingBlock: 8 }}>
        <p className="t-xs t-muted" data-viewing>{t(K.reader.viewing, { role: shownRole === '*' ? t(K.reader.everyRole) : t(`help.role.${shownRole}`, { defaultValue: shownRole }) })}</p>
        <Input value={s.q} placeholder={t(K.reader.search)} aria-label={t(K.reader.search)} data-f="help-search" onChange={(e) => s.setQ(e.target.value)} />
        {v && v.categories.length > 1 && (
          <div className="row gap-2 wrap" role="group" data-cats>
            <Chip pressed={!s.category} onClick={() => s.setCategory(null)}>{t(K.reader.all)}</Chip>
            {v.categories.map((c) => <span key={c.id} data-cat={c.id}><Chip pressed={s.category === c.id} onClick={() => s.setCategory(s.category === c.id ? null : c.id)}>{t(`help.category.${c.id}`)} {c.count}</Chip></span>)}
          </div>
        )}
      </div>
      {s.searchLoad === 'loading' && !v ? <LoadingState label={t(K.loading)} variant="list" rows={4} />
        : s.searchLoad === 'error' && !v ? <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.refresh()} />
        : v && v.total === 0 ? (
          <div className="stack gap-3" data-empty>
            <EmptyState title={s.q.trim() ? t(K.reader.noMatch, { q: s.q.trim() }) : t(K.reader.empty)} body={s.q.trim() ? t(K.reader.noMatchHint) : t(K.reader.emptyHint)} actionLabel={s.q.trim() ? t(K.reader.clear) : undefined} onAction={() => s.setQ('')} />
          </div>
        ) : v && (
          <div className="stack gap-3">
            <span className="t-xs t-muted" data-total>{t(K.reader.count, { count: v.total })}</span>
            <div className="grid-auto" data-list style={{ ['--min' as string]: '300px' }}>{v.rows.map((r) => <ArticleRow key={r.id} r={r} t={t} lang={lang} onOpen={() => s.openArticle(r.id)} />)}</div>
            {v.rows.length < v.total && <div><Button variant="secondary" data-act="more" onClick={s.showMore}>{t(K.reader.more)}</Button></div>}
          </div>
        )}
      {v && <SupportCard paths={v.paths} phone={v.officePhone} articleId={null} s={s} t={t} onSuggest={onSuggest} />}
    </div>
  );
}

function SuggestForm({ s, t, onDone }: { s: HelpScreenState; t: T; onDone: () => void }) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [searched, setSearched] = useState(s.q.trim());
  const [problem, setProblem] = useState<string | null>(null);
  return (
    <div className="stack gap-3" data-suggest-form>
      <p className="t-sm">{t(K.suggest.hint)}</p>
      <Field label={t(K.suggest.label)} hint={`${lettersOf(text)}/${SUGGEST_MIN}`}>{(p) => <TextArea id={p.id} rows={3} value={text} data-f="suggest-text" onChange={(e) => setText(e.target.value)} />}</Field>
      <Field label={t(K.gaps.searched, { q: '' }).replace(/[:：]\s*$/, '')}>{(p) => <Input id={p.id} value={searched} data-f="suggest-searched" onChange={(e) => setSearched(e.target.value)} />}</Field>
      <Problem t={t} code={problem} />
      <div className="row gap-2"><Button variant="ghost" onClick={onDone}>{t(K.cancel)}</Button><Button className="grow" data-act="suggest-send" disabled={lettersOf(text) < SUGGEST_MIN} loading={s.busy} onClick={async () => { setProblem(null); const r = await s.suggest(text, searched); if (r.ok) { toast.push(t(K.suggest.sent)); onDone(); } else setProblem(r.problem); }}>{t(K.suggest.send)}</Button></div>
    </div>
  );
}

/* ----------------------------------------------------------------- An article */

function Feedback({ a, s, t }: { a: HelpArticleView; s: HelpScreenState; t: T }) {
  const toast = useToast();
  const [changing, setChanging] = useState(false);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const mine = a.myFeedback;
  const send = async (h: boolean) => {
    setProblem(null);
    const r = await s.rate(a.row.id, { helpful: h, reason: h ? null : reason, comment: h ? '' : comment });
    if (r.ok) { setChanging(false); setHelpful(null); toast.push(t(h ? K.article.thanks : K.article.thanksNo)); } else setProblem(r.problem);
  };
  if (mine && !changing) {
    return (
      <div className="stack gap-2" data-feedback-done={mine.helpful ? 'yes' : 'no'}>
        <p className="t-sm">{t(mine.helpful ? K.article.yourAnswerYes : K.article.yourAnswerNo)}</p>
        <div><Button size="sm" variant="ghost" data-act="rate-change" onClick={() => { setChanging(true); setHelpful(null); }}>{t(K.article.change)}</Button></div>
      </div>
    );
  }
  return (
    <div className="stack gap-3" data-feedback>
      <span className="t-sm t-semibold">{t(K.article.helpfulQ)}</span>
      <div className="row gap-2 wrap">
        <Button size="sm" variant="secondary" data-act="rate-yes" loading={s.busy && helpful === true} onClick={() => { setHelpful(true); void send(true); }}>{t(K.article.yes)}</Button>
        <Button size="sm" variant={helpful === false ? 'primary' : 'secondary'} data-act="rate-no" onClick={() => setHelpful(false)}>{t(K.article.no)}</Button>
      </div>
      {helpful === false && (
        <div className="stack gap-2" data-reasons>
          <span className="t-sm">{t(K.article.reasonQ)}</span>
          <div className="row gap-2 wrap" role="group">{HELP_REASONS.map((r) => <span key={r} data-reason={r}><Chip pressed={reason === r} onClick={() => setReason(r)}>{t(`help.article.reason.${r}`)}</Chip></span>)}</div>
          <Field label={t(K.article.comment)} hint={`${comment.length}/${COMMENT_MAX}`}>{(p) => <TextArea id={p.id} rows={2} value={comment} data-f="rate-comment" onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX))} />}</Field>
          <Problem t={t} code={problem} />
          <div><Button size="sm" data-act="rate-send" disabled={!reason} loading={s.busy} onClick={() => void send(false)}>{t(K.article.send)}</Button></div>
        </div>
      )}
      {helpful !== false && <Problem t={t} code={problem} />}
    </div>
  );
}

function ArticleSheet({ s, t, lang, onSuggest }: { s: HelpScreenState; t: T; lang: string; onSuggest: () => void }) {
  const a = s.article && s.article.row.id === s.articleId ? s.article : null;
  const [editing, setEditing] = useState(false);
  useEffect(() => { setEditing(false); }, [s.articleId]);
  if (!s.articleId) return <Sheet open={false} onClose={() => s.openArticle(null)} title="" closeLabel={t(K.close)}>{null}</Sheet>;
  const isNew = s.articleId === 'new';
  const title = isNew ? t(K.editor.titleNew) : a ? pick(a.title, lang).value : '';
  return (
    <Sheet open onClose={() => s.openArticle(null)} title={title} closeLabel={t(K.close)}>
      {isNew ? <EditorForm s={s} t={t} a={null} onDone={() => undefined} />
        : !a ? (s.articleLoad === 'error' ? <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.refresh()} /> : <LoadingState label={t(K.loading)} variant="list" rows={3} />)
        : editing && a.admin ? <EditorForm s={s} t={t} a={a} onDone={() => setEditing(false)} />
        : <ReadArticle a={a} s={s} t={t} lang={lang} onSuggest={onSuggest} onEdit={() => setEditing(true)} />}
    </Sheet>
  );
}

function ReadArticle({ a, s, t, lang, onSuggest, onEdit }: { a: HelpArticleView; s: HelpScreenState; t: T; lang: string; onSuggest: () => void; onEdit: () => void }) {
  const body = pick(a.body, lang);
  const ti = pick(a.title, lang);
  const showNo = s.articleLoad === 'ready' && a.myFeedback && !a.myFeedback.helpful;
  return (
    <div className="stack gap-5" data-article-sheet={a.row.id}>
      <div className="stack gap-1">
        <span className="row gap-1 wrap"><Badge tone="neutral">{t(`help.category.${a.row.category}`)}</Badge>{a.admin && a.admin.status !== 'published' && <Badge tone="neutral">{t(`help.manage.status.${a.admin.status}`)}</Badge>}</span>
        <span className="t-xs t-muted">{t(K.article.lastChecked, { date: formatDate(a.row.reviewedAt, lang) })} · {t(K.article.version, { v: a.row.version })}</span>
      </div>
      <h3 className="t-lg t-semibold" data-article-title>{ti.value}</h3>
      {!body.translated && <p className="t-xs t-muted" data-untranslated>{t(K.article.noTranslation)}</p>}
      <p className="t-sm" data-article-body style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{body.value}</p>
      {a.relatedRoutes.length > 0 && (
        <Section title={t(K.article.screens)}>
          <div className="row gap-2 wrap" data-related>
            {a.relatedRoutes.map((r) => (r.known === false ? (s.isAdmin ? <Badge key={r.path} tone="warning">{r.path}</Badge> : null) : <Link key={r.path} className="ds-btn ds-btn--secondary ds-btn--sm" to={r.path} data-related-link={r.path}>{t(K.article.open)} {r.path}</Link>))}
          </div>
        </Section>
      )}
      <Feedback key={`${a.row.id}-${a.myFeedback?.helpful}`} a={a} s={s} t={t} />
      {(showNo || (a.myFeedback && !a.myFeedback.helpful)) && <SupportCard paths={a.paths} phone={a.officePhone} articleId={a.row.id} s={s} t={t} onSuggest={onSuggest} />}
      {a.admin && <AdminBlock a={a} s={s} t={t} lang={lang} onEdit={onEdit} />}
    </div>
  );
}

function AdminBlock({ a, s, t, lang, onEdit }: { a: HelpArticleView; s: HelpScreenState; t: T; lang: string; onEdit: () => void }) {
  const toast = useToast();
  const ad = a.admin as NonNullable<HelpArticleView['admin']>;
  const st = ad.stats;
  const total = st.helpful + st.notHelpful;
  const [note, setNote] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const next = ad.status === 'published' ? 'retired' : 'published';
  return (
    <div className="stack gap-5" data-admin-block>
      <Section title={t(K.detail.stats)}>
        <div className="stack gap-1" data-stats>
          <span className="t-sm">{t(K.detail.helpful)}: <b className="num" data-n="helpful">{st.helpful}</b> · {t(K.detail.notHelpful)}: <b className="num" data-n="not">{st.notHelpful}</b></span>
          {total < MIN_RESPONSES && <span className="t-xs t-muted">{t(K.detail.few)}</span>}
          {Object.entries(st.reasons).length > 0 && <span className="t-xs">{Object.entries(st.reasons).map(([r, n]) => `${t(`help.article.reason.${r}`)} ${n}`).join(' · ')}</span>}
          <span className="t-xs">{t(K.detail.reports)}: <b className="num" data-n="reports">{st.reports}</b></span>
          <span className="t-xs">{t(K.detail.escalations)}: <b className="num">{st.escalations}</b></span>
          <span className="row gap-1 wrap">{ad.flags.map((f) => <Badge key={f} tone={FLAG_TONE[f]}>{t(`help.manage.flag.${f}`)}</Badge>)}</span>
          {ad.brokenLinks.length > 0 && <span className="t-xs" style={{ color: 'var(--color-warning)' }}>{t(K.manage.row.broken, { paths: ad.brokenLinks.join(', ') })}</span>}
        </div>
        {st.comments.length > 0 && <div className="stack gap-1" data-comments><span className="t-xs t-muted">{t(K.detail.comments)}</span>{st.comments.map((c, i) => <span key={i} className="t-xs">{formatDate(c.at, lang)} · {t(`help.role.${c.role}`, { defaultValue: c.role })} · v{c.version}: {c.text}</span>)}</div>}
      </Section>
      <Section title={t(K.detail.roles)}>
        <div className="row gap-1 wrap">{a.row.roles.map((r) => <Badge key={r} tone="accent">{t(`help.role.${r}`, { defaultValue: r })}</Badge>)}</div>
        <p className="t-xs t-muted">{t(K.detail.checkedBy, { who: ad.reviewedBy, note: ad.reviewNote })}</p>
        {ad.retiredNote && <p className="t-xs">{t(K.detail.retiredNote, { note: ad.retiredNote })}</p>}
        <div><Button size="sm" variant="secondary" data-act="edit-open" onClick={onEdit}>{t(K.detail.edit)}</Button></div>
      </Section>
      <Section title={t(K.detail.reviewTitle)} hint={t(K.detail.reviewHint)}>
        <Field label={t(K.detail.reviewNote)} hint={`${lettersOf(note)}/${NOTE_MIN}`}>{(p) => <Input id={p.id} value={note} data-f="review-note" onChange={(e) => setNote(e.target.value)} />}</Field>
        <Problem t={t} code={problem} />
        <div><Button size="sm" data-act="review-save" disabled={lettersOf(note) < NOTE_MIN} loading={s.busy} onClick={async () => { setProblem(null); const r = await s.reviewArticle(a.row.id, note); if (r.ok) { toast.push(t(K.detail.reviewed)); setNote(''); } else setProblem(r.problem); }}>{t(K.detail.reviewSave)}</Button></div>
      </Section>
      <Section title={t(K.detail.versions)}>
        <div className="stack gap-1" data-versions>{ad.versions.map((v) => <span key={v.version} className="t-xs">{t(K.article.version, { v: v.version })} · {formatDate(v.at, lang)} · {v.byName}: {v.changeNote}</span>)}</div>
      </Section>
      <Section title={ad.status === 'published' ? t(K.detail.retire) : t(K.detail.publish)}>
        <Field label={t(K.detail.statusNote)} hint={`${lettersOf(statusNote)}/${NOTE_MIN}`}>{(p) => <Input id={p.id} value={statusNote} data-f="status-note" onChange={(e) => setStatusNote(e.target.value)} />}</Field>
        <div><Button size="sm" variant="secondary" data-act="status-do" disabled={lettersOf(statusNote) < NOTE_MIN} loading={s.busy} onClick={async () => { setProblem(null); const r = await s.setStatus(a.row.id, next, statusNote); if (r.ok) { toast.push(t(K.detail.statusSaved)); setStatusNote(''); } else setProblem(r.problem); }}>{ad.status === 'published' ? t(K.detail.retire) : t(K.detail.publish)}</Button></div>
      </Section>
    </div>
  );
}

function EditorForm({ s, t, a, onDone }: { s: HelpScreenState; t: T; a: HelpArticleView | null; onDone: () => void }) {
  const toast = useToast();
  const roles = s.admin?.roles ?? ['admin', 'surveyor', 'technician', 'customer', 'supplier'];
  const names = s.admin?.roleNames;
  const ad = a?.admin ?? null;
  const [category, setCategory] = useState(a?.row.category ?? HELP_CATEGORIES[0]);
  const [tagged, setTagged] = useState<string[]>(a?.row.roles ?? []);
  const [routes, setRoutes] = useState((ad?.relatedRoutes ?? []).join('\n'));
  const tx = (x: HelpText | undefined, l: 'en' | 'hi' | 'mr') => (x as unknown as Record<string, string | undefined> | undefined)?.[l] ?? '';
  const [title, setTitle] = useState({ en: tx(a?.title, 'en'), hi: tx(a?.title, 'hi'), mr: tx(a?.title, 'mr') });
  const [body, setBody] = useState({ en: tx(a?.body, 'en'), hi: tx(a?.body, 'hi'), mr: tx(a?.body, 'mr') });
  const [note, setNote] = useState('');
  const [publish, setPublish] = useState(true);
  const [problem, setProblem] = useState<string | null>(null);
  const toggle = (r: string) => setTagged((x) => (x.includes(r) ? x.filter((y) => y !== r) : [...x, r]));
  const save = async () => {
    setProblem(null);
    const r = await s.saveArticle({ id: a?.row.id ?? null, category, roles: tagged, relatedRoutes: routes.split('\n').map((x) => x.trim()).filter(Boolean), title, body, changeNote: note, publish });
    if (r.ok) { toast.push(t(K.editor.saved)); onDone(); } else setProblem(r.problem);
  };
  const langs = [['en', K.editor.titleEn, K.editor.bodyEn], ['hi', K.editor.titleHi, K.editor.bodyHi], ['mr', K.editor.titleMr, K.editor.bodyMr]] as const;
  return (
    <div className="stack gap-4" data-editor>
      {a && <p className="t-xs t-muted">{t(K.editor.newVersion)}</p>}
      <Field label={t(K.editor.category)}>{(p) => <Select id={p.id} value={category} data-f="editor-category" onChange={(e) => setCategory(e.target.value)}>{HELP_CATEGORIES.map((c) => <option key={c} value={c}>{t(`help.category.${c}`)}</option>)}</Select>}</Field>
      <div className="stack gap-1"><span className="t-sm t-semibold">{t(K.editor.roles)}</span><div className="row gap-2 wrap" role="group" data-tags>{[ALL_ROLES, ...roles].map((r) => <span key={r} data-tag={r}><Chip pressed={tagged.includes(r)} onClick={() => toggle(r)}>{roleLabel(t, r, names)}</Chip></span>)}</div><span className="t-xs t-muted">{t(K.editor.rolesHint)}</span></div>
      <Field label={t(K.editor.routes)} hint={t(K.editor.routesHint)}>{(p) => <TextArea id={p.id} rows={2} value={routes} data-f="editor-routes" onChange={(e) => setRoutes(e.target.value)} />}</Field>
      {langs.map(([l, tk, bk]) => (
        <div key={l} className="stack gap-2" data-lang={l}>
          <Field label={t(tk)} hint={l === 'en' ? `${lettersOf(title.en)}/${TITLE_MIN}` : undefined}>{(p) => <Input id={p.id} value={title[l]} data-f={`editor-title-${l}`} onChange={(e) => setTitle({ ...title, [l]: e.target.value })} />}</Field>
          <Field label={t(bk)} hint={l === 'en' ? `${lettersOf(body.en)}/${BODY_MIN}` : undefined}>{(p) => <TextArea id={p.id} rows={4} value={body[l]} data-f={`editor-body-${l}`} onChange={(e) => setBody({ ...body, [l]: e.target.value })} />}</Field>
        </div>
      ))}
      <p className="t-xs t-muted">{t(K.editor.translationHint)}</p>
      <Field label={t(K.editor.note)} hint={`${lettersOf(note)}/${NOTE_MIN}`}>{(p) => <Input id={p.id} value={note} data-f="editor-note" onChange={(e) => setNote(e.target.value)} />}</Field>
      {!a && <label className="row gap-2" style={{ alignItems: 'center', minHeight: 44 }}><input type="checkbox" checked={publish} data-f="editor-publish" onChange={(e) => setPublish(e.target.checked)} /><span className="t-sm">{t(K.editor.publish)}</span></label>}
      <Problem t={t} code={problem} />
      <div className="row gap-2"><Button variant="ghost" onClick={() => (a ? onDone() : s.openArticle(null))}>{t(K.cancel)}</Button><Button className="grow" data-act="editor-save" loading={s.busy} onClick={() => void save()}>{t(K.editor.save)}</Button></div>
    </div>
  );
}

/* ----------------------------------------------------------------- Admin: articles */

function ManageRow({ r, t, lang, catalogue, onOpen }: { r: HelpAdminRow; t: T; lang: string; catalogue: boolean; onOpen: () => void }) {
  const total = r.helpful + r.notHelpful;
  void catalogue;
  return (
    <Card onClick={onOpen}>
      <div className="row gap-3" data-manage-row={r.id} data-flags={r.flags.join(',')} style={{ alignItems: 'flex-start' }}>
        <span style={{ color: 'var(--color-accent-secondary)', paddingTop: 2 }}>{CATEGORY_ICON[r.category] ?? <Lifebuoy size={20} />}</span>
        <div className="stack gap-1 grow" style={{ minWidth: 0 }}>
          <span className="row between wrap" style={{ gap: 8, alignItems: 'flex-start' }}>
            <span className="t-sm t-semibold">{pick(r.title, lang).value}</span>
            <span className="row gap-1 wrap" style={{ justifyContent: 'flex-end' }}>{r.flags.map((f) => <Badge key={f} tone={FLAG_TONE[f]}>{t(`help.manage.flag.${f}`)}</Badge>)}</span>
          </span>
          <span className="t-xs t-muted">{r.code} · {t(K.article.version, { v: r.version })} · {r.roles.map((x) => t(`help.role.${x}`, { defaultValue: x })).join(', ')} · {t(K.manage.row.reviewedOn, { date: formatDate(r.reviewedAt, lang) })}</span>
          <span className="t-xs">{total === 0 ? t(K.manage.row.noAnswers) : total < MIN_RESPONSES ? t(K.manage.row.few, { total }) : t(K.manage.row.helpful, { helpful: r.helpful, total })}{r.reports > 0 ? ` · ${t(K.manage.row.reports, { count: r.reports })}` : ''}{r.escalations > 0 ? ` · ${t(K.manage.row.escalated, { count: r.escalations })}` : ''}</span>
          {r.status === 'published' && <span className="t-xs t-muted">{r.reviewDueInDays >= 0 ? t(K.manage.row.dueIn, { days: r.reviewDueInDays }) : t(K.manage.row.overdue, { days: -r.reviewDueInDays })}</span>}
          {r.brokenLinks.length > 0 && <span className="t-xs" style={{ color: 'var(--color-warning)' }}>{t(K.manage.row.broken, { paths: r.brokenLinks.join(', ') })}</span>}
        </div>
      </div>
    </Card>
  );
}

function ManageTab({ s, t, lang }: { s: HelpScreenState; t: T; lang: string }) {
  const v: HelpAdminView | null = s.admin;
  if (!v) return s.adminLoad === 'error' ? <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.refresh()} /> : <LoadingState label={t(K.loading)} variant="list" rows={4} />;
  const c = v.counts;
  const flags: (HelpFlag | 'attention')[] = ['attention', 'review_due', 'broken_link', 'reported', 'low_rate'];
  const num: Record<string, number> = { attention: c.attention, review_due: c.reviewDue, broken_link: c.brokenLinks, reported: c.reported, low_rate: c.lowRate };
  return (
    <div className="stack gap-4">
      <div className="row between wrap" style={{ gap: 8, alignItems: 'center' }}>
        <p className="t-xs t-muted grow" style={{ minWidth: 220 }}>{t(K.manage.hint)}</p>
        <Button size="sm" icon={<Plus size={16} />} data-act="article-new" onClick={() => s.openArticle('new')}>{t(K.manage.new)}</Button>
      </div>
      {!v.catalogueKnown && <p className="t-xs t-muted" data-catalogue-unknown>{t(K.manage.catalogueUnknown)}</p>}
      <div className="stack gap-2 sticky-under-shell" style={{ background: 'var(--color-bg)', paddingBlock: 8 }}>
        <Input value={s.manage.q} placeholder={t(K.manage.search)} aria-label={t(K.manage.search)} data-f="manage-search" onChange={(e) => s.setManage({ ...s.manage, q: e.target.value })} />
        <div className="row gap-2 wrap" role="group" data-flag-chips>
          <Chip pressed={s.flag === 'all'} onClick={() => s.setFlag(null)}>{t(K.manage.counts.published)} {c.published}</Chip>
          {flags.map((f) => <span key={f} data-flag={f}><Chip pressed={s.flag === f} onClick={() => s.setFlag(s.flag === f ? null : f)}>{t(`help.manage.flag.${f}`)} {num[f]}</Chip></span>)}
        </div>
        <div className="row gap-2 wrap">
          <Select value={s.manage.status} aria-label={t(K.manage.status.all)} data-f="manage-status" onChange={(e) => s.setManage({ ...s.manage, status: e.target.value as 'all' })} style={{ width: 'auto', minWidth: 140 }}>{(['all', 'published', 'draft', 'retired'] as const).map((x) => <option key={x} value={x}>{t(`help.manage.status.${x}`)}</option>)}</Select>
          <Select value={s.manage.category ?? ''} aria-label={t(K.editor.category)} data-f="manage-category" onChange={(e) => s.setManage({ ...s.manage, category: e.target.value || null })} style={{ width: 'auto', minWidth: 160 }}><option value="">{t(K.reader.all)}</option>{HELP_CATEGORIES.map((x) => <option key={x} value={x}>{t(`help.category.${x}`)}</option>)}</Select>
          <Select value={s.manage.role ?? ''} aria-label={t(K.detail.roles)} data-f="manage-role" onChange={(e) => s.setManage({ ...s.manage, role: e.target.value || null })} style={{ width: 'auto', minWidth: 140 }}><option value="">{t(K.reader.all)}</option>{[ALL_ROLES, ...v.roles].map((x) => <option key={x} value={x}>{roleLabel(t, x, v.roleNames)}</option>)}</Select>
        </div>
      </div>
      {v.rows.length === 0 ? <EmptyState title={t(K.manage.empty)} body={t(K.manage.emptyHint)} actionLabel={t(K.manage.new)} onAction={() => s.openArticle('new')} /> : (
        <div className="stack gap-3">
          <div className="grid-auto" data-manage style={{ ['--min' as string]: '320px' }}>{v.rows.map((r) => <ManageRow key={r.id} r={r} t={t} lang={lang} catalogue={v.catalogueKnown} onOpen={() => s.openArticle(r.id)} />)}</div>
          {v.rows.length < v.total && <div><Button variant="secondary" data-act="manage-more" onClick={s.moreManage}>{t(K.reader.more)}</Button></div>}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- Admin: gaps */

function SuggestionCard({ g, s, t, lang, articles }: { g: HelpAdminView['suggestions'][number]; s: HelpScreenState; t: T; lang: string; articles: { id: string; title: string }[] }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'planned' | 'done' | 'declined'>('planned');
  const [note, setNote] = useState('');
  const [aid, setAid] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  return (
    <Card>
      <div className="stack gap-1" data-suggestion={g.id} data-status={g.status}>
        <span className="row between wrap" style={{ gap: 8, alignItems: 'flex-start' }}><span className="t-sm t-semibold">{g.text}</span><Badge tone={g.status === 'new' ? 'warning' : 'neutral'}>{t(`help.gaps.status.${g.status}`)}</Badge></span>
        <span className="t-xs t-muted">{g.code} · {formatDate(g.at, lang)} · {t(K.gaps.from, { role: t(`help.role.${g.role}`, { defaultValue: g.role }) })}</span>
        {g.searchedFor && <span className="t-xs">{t(K.gaps.searched, { q: g.searchedFor })}</span>}
        {g.note && <span className="t-xs">{g.note}{g.handledBy ? ` · ${g.handledBy}` : ''}</span>}
        {g.status === 'new' && !open && <div><Button size="sm" variant="secondary" data-act="sg-open" onClick={() => setOpen(true)}>{t(K.gaps.handle)}</Button></div>}
        {open && (
          <div className="stack gap-2" data-sg-form>
            <div className="row gap-2 wrap" role="group">{(['planned', 'done', 'declined'] as const).map((x) => <span key={x} data-sg-status={x}><Chip pressed={status === x} onClick={() => setStatus(x)}>{t(`help.gaps.status.${x}`)}</Chip></span>)}</div>
            {(status === 'done' || status === 'planned') && <Field label={t(K.gaps.article)}>{(p) => <Select id={p.id} value={aid} data-f="sg-article" onChange={(e) => setAid(e.target.value)}><option value="">—</option>{articles.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</Select>}</Field>}
            <Field label={t(K.gaps.note)} hint={`${lettersOf(note)}/${NOTE_MIN}`}>{(p) => <Input id={p.id} value={note} data-f="sg-note" onChange={(e) => setNote(e.target.value)} />}</Field>
            <Problem t={t} code={problem} />
            <div className="row gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>{t(K.cancel)}</Button><Button data-act="sg-save" disabled={lettersOf(note) < NOTE_MIN} loading={s.busy} onClick={async () => { setProblem(null); const r = await s.handleSuggestion(g.id, status, note, aid || null); if (r.ok) { toast.push(t(K.gaps.saved)); setOpen(false); } else setProblem(r.problem); }}>{t(K.gaps.save)}</Button></div>
          </div>
        )}
      </div>
    </Card>
  );
}

function MissCard({ m, s, t, lang }: { m: HelpAdminView['misses'][number]; s: HelpScreenState; t: T; lang: string }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  return (
    <Card>
      <div className="stack gap-1" data-miss={m.key}>
        <span className="row between wrap" style={{ gap: 8 }}><span className="t-sm t-semibold">{m.sample}</span><Badge tone="warning">{t(K.gaps.missCount, { count: m.count })}</Badge></span>
        <span className="t-xs t-muted">{Object.entries(m.roles).map(([r, n]) => `${t(`help.role.${r}`, { defaultValue: r })} ${n}`).join(' · ')} · {formatDate(m.lastAt, lang)}</span>
        {!open ? <div><Button size="sm" variant="secondary" data-act="miss-open" onClick={() => setOpen(true)}>{t(K.gaps.missDone)}</Button></div> : (
          <div className="stack gap-2" data-miss-form>
            <Field label={t(K.gaps.note)} hint={`${lettersOf(note)}/${NOTE_MIN}`}>{(p) => <Input id={p.id} value={note} data-f="miss-note" onChange={(e) => setNote(e.target.value)} />}</Field>
            <Problem t={t} code={problem} />
            <div className="row gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>{t(K.cancel)}</Button><Button data-act="miss-save" disabled={lettersOf(note) < NOTE_MIN} loading={s.busy} onClick={async () => { setProblem(null); const r = await s.handleMiss(m.key, note); if (r.ok) { toast.push(t(K.gaps.saved)); setOpen(false); } else setProblem(r.problem); }}>{t(K.gaps.save)}</Button></div>
          </div>
        )}
      </div>
    </Card>
  );
}

function GapsTab({ s, t, lang }: { s: HelpScreenState; t: T; lang: string }) {
  const v = s.admin;
  if (!v) return s.adminLoad === 'error' ? <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.refresh()} /> : <LoadingState label={t(K.loading)} variant="list" rows={4} />;
  const articles = v.rows.map((r) => ({ id: r.id, title: pick(r.title, lang).value }));
  return (
    <div className="stack gap-5">
      <p className="t-xs t-muted">{t(K.gaps.hint)}</p>
      <Section title={t(K.gaps.suggestions)}>
        {v.suggestions.length === 0 ? <p className="t-sm t-muted" data-sg-empty>{t(K.gaps.suggestionsEmpty)}</p> : <div className="grid-auto" data-suggestions style={{ ['--min' as string]: '300px' }}>{v.suggestions.map((g) => <SuggestionCard key={g.id} g={g} s={s} t={t} lang={lang} articles={articles} />)}</div>}
      </Section>
      <Section title={t(K.gaps.misses)} hint={t(K.gaps.missesHint)}>
        {v.misses.length === 0 ? <p className="t-sm t-muted" data-miss-empty>{t(K.gaps.missesEmpty)}</p> : <div className="grid-auto" data-misses style={{ ['--min' as string]: '280px' }}>{v.misses.map((m) => <MissCard key={m.key} m={m} s={s} t={t} lang={lang} />)}</div>}
      </Section>
      <Section title={t(K.gaps.coverage)} hint={t(K.gaps.coverageHint)}>
        <div className="grid-auto" data-coverage style={{ ['--min' as string]: '240px' }}>
          {v.roleCoverage.map((c) => (
            <Card key={c.role}>
              <div className="stack gap-1" data-cov={c.role} data-gap={c.users > 0 && c.articles === 0}>
                <span className="t-sm t-semibold">{roleLabel(t, c.role, v.roleNames)}</span>
                <span className="t-xs">{t(K.gaps.coverageLine, { users: c.users, articles: c.articles })}</span>
                {c.users > 0 && c.articles === 0 && <span className="t-xs" style={{ color: 'var(--color-warning)' }}>{t(K.gaps.coverageNone)}</span>}
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
