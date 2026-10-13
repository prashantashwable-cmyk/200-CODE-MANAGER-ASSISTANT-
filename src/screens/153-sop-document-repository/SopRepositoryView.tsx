import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowClockwise, ArrowSquareOut, CaretLeft, ClipboardText, CloudCheck, CloudSlash, DownloadSimple, FolderSimple, Notebook, PencilSimple, Plus, ShieldCheck, Star, Trash, Truck, Warning, Wrench, Files } from '@phosphor-icons/react';
import { ActionBar, Badge, Button, Card, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, TextArea, formatDate } from '@/design-system';
import type { SopDocumentView, SopDocVersionView, SopItemView, SopSource } from '@/data/repository';
import { NOTE_MIN } from '@/features/sop/library';
import { PAGE, SOP_KEYS as K } from './sop-repository.types';
import { sopText } from './sop-text';
import { useSopRepository } from './useSopRepository';
import type { SopRepositoryState } from './useSopRepository';

type T = ReturnType<typeof useTranslation>['t'];
const SOURCE_ICON: Record<SopSource, ReactNode> = {
  installation: <Wrench size={20} aria-hidden="true" />,
  delivery: <Truck size={20} aria-hidden="true" />,
  safety: <ShieldCheck size={20} aria-hidden="true" />,
  quality: <ClipboardText size={20} aria-hidden="true" />,
  reference: <Notebook size={20} aria-hidden="true" />,
};
const problemKey = (code?: string | null) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;
const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
const today = () => new Date().toISOString().slice(0, 10);

function Footer({ children }: { children: ReactNode }) {
  return <div className="row gap-2" data-sheet-actions style={{ position: 'sticky', bottom: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: 'var(--space-2) 0', marginTop: 'var(--space-3)', justifyContent: 'flex-end' }}>{children}</div>;
}

/**
 * Screen 153 — SOP Document Repository. The one place every procedure the app enforces can be read as a document: installation, delivery, the
 * safety checks and the quality checks, each with the version in force, the dated history and what moved between versions. Nothing here is a
 * copy: it is read from the same governed templates the checklists run on. Documents can be bookmarked and saved on the phone for work without
 * signal, and a saved copy says plainly when a newer version exists.
 */
export function SopRepositoryScreen() {
  const { t } = useTranslation();
  const s = useSopRepository();
  if (s.status === 'loading' && !s.library) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="list" rows={7} /></Screen>;
  if (s.status === 'error' || !s.library) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} /></Screen>;
  if (s.docId) return <Reader s={s} t={t} />;
  return <Library s={s} t={t} />;
}

/* ------------------------------------------------------------------ the list */

function Library({ s, t }: { s: SopRepositoryState; t: T }) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [refOpen, setRefOpen] = useState<{ doc: SopDocumentView | null } | null>(null);
  const visible = s.shown.slice(0, s.page * PAGE);
  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="secondary" data-rollouts onClick={() => s.goto('/sop-rollouts')}>{t(K.rollouts)}</Button>} />
      {(!s.online || s.fromCache) && <p className="t-sm row gap-2" role="status" data-offline-banner style={{ alignItems: 'center', color: 'var(--color-warning)' }}><CloudSlash size={16} aria-hidden="true" /> {s.onlySaved ? t(K.offline.onlySaved) : s.fromCache ? t(K.offline.cached) : t(K.offline.banner)}</p>}
      {s.staleCopies.length > 0 && (
        <Card>
          <div className="row between gap-2 wrap" data-stale-banner style={{ alignItems: 'center' }}>
            <span className="row gap-2 t-sm" style={{ alignItems: 'center' }}><Warning size={18} aria-hidden="true" style={{ color: 'var(--color-warning)' }} />{t(K.offline.staleBanner, { count: s.staleCopies.length })}</span>
            <Button size="sm" variant="secondary" icon={<ArrowClockwise size={16} />} disabled={!s.online} data-update-all onClick={() => void s.updateCopies(s.staleCopies)}>{t(K.offline.updateAll)}</Button>
          </div>
        </Card>
      )}
      <Controls s={s} t={t} onNewCategory={() => setCategoryOpen(true)} onNewReference={() => setRefOpen({ doc: null })} />
      <div className="stack gap-3 mt-3" data-library>
        <p className="t-xs t-muted" role="status" data-count>{t(K.summary.count, { count: s.shown.length })}</p>
        {s.docs.length === 0 ? (
          <EmptyState icon={<Files size={28} />} title={t(K.empty.title)} body={t(K.empty.body)} />
        ) : s.shown.length === 0 ? (
          <EmptyState icon={<Files size={28} />} title={t(K.noMatch.title)} body={t(K.noMatch.body)} actionLabel={t(K.noMatch.action)} onAction={s.clear} />
        ) : (
          <>
            <div className="grid-auto" style={{ '--min': '360px', alignItems: 'start' } as React.CSSProperties}>
              {visible.map((d, i) => <DocRow key={d.id} d={d} s={s} t={t} index={i} />)}
            </div>
            {visible.length < s.shown.length && (
              <div className="stack gap-1" style={{ alignItems: 'center' }}>
                <span className="t-xs t-muted">{t(K.more.shown, { shown: visible.length, total: s.shown.length })}</span>
                <Button variant="secondary" data-more onClick={s.showMore}>{t(K.more.button, { count: Math.min(PAGE, s.shown.length - visible.length) })}</Button>
              </div>
            )}
          </>
        )}
      </div>
      <CategorySheet s={s} t={t} open={categoryOpen} onClose={() => setCategoryOpen(false)} />
      <ReferenceSheet s={s} t={t} state={refOpen} onClose={() => setRefOpen(null)} />
    </Screen>
  );
}

function Controls({ s, t, onNewCategory, onNewReference }: { s: SopRepositoryState; t: T; onNewCategory: () => void; onNewReference: () => void }) {
  return (
    <div className="stack gap-2 sticky-under-shell" style={{ background: 'var(--color-bg)', paddingBlock: 'var(--space-2)' }} data-controls>
      <Field label={t(K.search.label)}>{(p) => <Input id={p.id} type="search" value={s.q} placeholder={t(K.search.placeholder)} onChange={(e) => s.setQuery(e.target.value)} data-f="search" autoComplete="off" />}</Field>
      <div className="row gap-2" style={{ overflowX: 'auto', paddingBottom: 2 }} role="group" aria-label={t(K.filter.label)}>
        <span data-cat="" style={{ flex: '0 0 auto' }}><Chip pressed={!s.category} onClick={() => s.setCategory('')}>{t(K.category.all)} · {s.docs.length}</Chip></span>
        {s.categories.map((c) => <span key={c.id} data-cat={c.id} style={{ flex: '0 0 auto' }}><Chip pressed={s.category === c.id} onClick={() => s.setCategory(c.id)}>{sopText(t, c.name, s.lang).text} · {c.count}</Chip></span>)}
      </div>
      <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
        <span data-filter-chips className="row gap-2 wrap">
          {(['all', 'bookmarked', 'saved'] as const).map((f) => <span key={f} data-filter={f}><Chip pressed={s.filter === f} onClick={() => s.setFilter(f)}>{t(K.filter[f])}</Chip></span>)}
        </span>
        {s.canEdit && <Button size="sm" variant="ghost" icon={<FolderSimple size={16} />} data-new-category onClick={onNewCategory}>{t(K.admin.newCategory)}</Button>}
        {s.canEdit && <Button size="sm" variant="ghost" icon={<Plus size={16} />} data-new-reference onClick={onNewReference}>{t(K.admin.newReference)}</Button>}
        {s.hasFilters && <Button size="sm" variant="ghost" data-clear onClick={s.clear}>{t(K.noMatch.action)}</Button>}
      </div>
    </div>
  );
}

/** One consistent row: source icon, title, one line of where it sits and which version is in force, then its status and the bookmark. */
function DocRow({ d, s, t, index }: { d: SopDocumentView; s: SopRepositoryState; t: T; index: number }) {
  const { i18n } = useTranslation();
  const copy = s.copyOf(d);
  const on = s.bookmarked(d);
  const catName = s.categories.find((c) => c.id === d.categoryId);
  const needsSignal = s.fromCache && !s.saved[d.id];
  return (
    <Card riseIndex={Math.min(index, 8)}>
      <div className="row gap-2" data-doc={d.id} data-bookmarked={on ? '1' : '0'} data-saved={copy ? '1' : '0'} data-copy-state={copy?.state ?? ''} style={{ alignItems: 'flex-start' }}>
        <button type="button" data-open className="stack gap-2 grow" onClick={() => s.openDoc(d.id)} style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', color: 'inherit', cursor: 'pointer', minWidth: 0 }}>
          <span className="row gap-3" style={{ alignItems: 'center' }}>
            <span aria-hidden="true" style={{ color: 'var(--color-accent-secondary)' }}>{SOURCE_ICON[d.source]}</span>
            <span className="stack grow" style={{ minWidth: 0 }}>
              <strong className="t-md" style={{ overflowWrap: 'anywhere' }}>{sopText(t, d.title, s.lang).text}</strong>
              <span className="t-xs t-muted">{[catName ? sopText(t, catName.name, s.lang).text : null, t(K.row.version, { version: d.currentVersion }), t(K.row.inForce, { date: formatDate(d.effectiveDate, i18n.language) })].filter(Boolean).join(' · ')}</span>
            </span>
          </span>
          <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
            {d.upcoming && <Badge tone="accent">{t(K.row.upcoming, { version: d.upcoming.version, date: formatDate(d.upcoming.effectiveFrom, i18n.language) })}</Badge>}
            {copy && <Badge tone={copy.state === 'stale' ? 'warning' : 'success'}>{copy.state === 'stale' ? t(K.row.stale) : t(K.row.saved)}</Badge>}
            {d.referenceOnly && <Badge tone="neutral">{t(K.row.referenceOnly)}</Badge>}
            {needsSignal && <span className="t-xs t-muted">{t(K.copy.needsSignal)}</span>}
            <span className="t-xs t-muted">{t(K.row.steps, { count: d.versions.find((v) => v.version === d.currentVersion)?.itemCount ?? 0 })}</span>
          </span>
        </button>
        <button type="button" aria-pressed={on} aria-label={on ? t(K.row.unbookmark) : t(K.row.bookmark)} data-bookmark onClick={() => void s.toggleBookmark(d)} style={{ background: 'none', border: 0, padding: 'var(--space-2)', minWidth: 44, minHeight: 44, cursor: 'pointer', color: on ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)' }}>
          <Star size={22} weight={on ? 'fill' : 'regular'} aria-hidden="true" />
        </button>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ the reader */

function Reader({ s, t }: { s: SopRepositoryState; t: T }) {
  const { i18n } = useTranslation();
  const [editing, setEditing] = useState(false);
  const d = s.open;
  if (!d) {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} action={<Button size="sm" variant="ghost" icon={<CaretLeft size={14} />} onClick={s.toList}>{t(K.reader.back)}</Button>} />
        {(!s.online || s.fromCache) && <p className="t-sm row gap-2" role="status" style={{ alignItems: 'center', color: 'var(--color-warning)' }}><CloudSlash size={16} aria-hidden="true" /> {t(K.offline.banner)}</p>}
        <EmptyState icon={<Files size={28} />} title={s.exists || s.fromCache ? t(K.copy.needsSignal) : t(K.notFound.title)} body={s.exists || s.fromCache ? t(K.empty.body) : t(K.notFound.body)} actionLabel={t(K.notFound.action)} onAction={s.toList} />
      </Screen>
    );
  }
  const chosen = d.versions.find((v) => v.version === (s.versionParam ?? d.currentVersion)) ?? d.versions.find((v) => v.version === d.currentVersion) ?? d.versions[d.versions.length - 1];
  const copy = s.copyOf(d);
  const on = s.bookmarked(d);
  const title = sopText(t, d.title, s.lang).text;
  return (
    <Screen width="narrow">
      <ScreenHeader title={title} subtitle={sopText(t, d.summary, s.lang).text} action={<Button size="sm" variant="ghost" icon={<CaretLeft size={14} />} data-back onClick={s.toList}>{t(K.reader.back)}</Button>} />
      {(!s.online || s.fromCache) && <p className="t-sm row gap-2" role="status" data-offline-banner style={{ alignItems: 'center', color: 'var(--color-warning)' }}><CloudSlash size={16} aria-hidden="true" /> {s.openIsCopy ? t(K.copy.fromCopy, { date: copy ? formatDate(copy.savedAt, i18n.language) : '' }) : t(K.offline.banner)}</p>}
      <div className="stack gap-3 pb-action-bar" data-reader={d.id}>
        {copy?.state === 'stale' && (
          <Card>
            <div className="row between gap-2 wrap" data-copy-stale style={{ alignItems: 'center' }}>
              <span className="row gap-2 t-sm" style={{ alignItems: 'center' }}><Warning size={18} aria-hidden="true" style={{ color: 'var(--color-warning)' }} />{s.online ? t(K.copy.stale, { version: d.currentVersion }) : t(K.copy.staleOffline, { version: d.currentVersion })}</span>
              {s.online && <Button size="sm" variant="secondary" icon={<ArrowClockwise size={16} />} data-update-copy onClick={() => void s.updateCopies([d])}>{t(K.copy.update)}</Button>}
            </div>
          </Card>
        )}
        <VersionHeader d={d} v={chosen} s={s} t={t} lang={i18n.language} />
        {chosen.state === 'past' && <p className="t-sm" role="status" data-past style={{ color: 'var(--color-warning)' }}>{t(K.reader.pastWarning, { version: d.currentVersion })} <button type="button" className="t-sm" data-show-current onClick={() => s.setVersion(null)} style={{ background: 'none', border: 0, padding: 0, color: 'var(--color-accent-primary)', textDecoration: 'underline', cursor: 'pointer' }}>{t(K.reader.pastShowCurrent)}</button></p>}
        {chosen.state === 'upcoming' && <p className="t-sm" role="status" data-upcoming>{t(K.reader.upcomingNote, { version: chosen.version, date: formatDate(chosen.effectiveFrom, i18n.language) })}</p>}
        {d.referenceOnly && <p className="t-xs t-muted" data-reference-note>{t(K.reader.referenceNote)}</p>}
        {d.builtIn && <p className="t-xs t-muted" data-built-in>{t(K.reader.builtIn)}</p>}
        <div className="stack gap-3" data-sections>
          {chosen.sections.map((sec) => (
            <section key={sec.id} className="stack gap-2" data-section={sec.id}>
              {sec.title && <h2 className="t-lg">{sopText(t, sec.title, s.lang).text}</h2>}
              {sec.items.map((it, idx) => <ItemCard key={it.id} it={it} n={idx + 1} v={chosen} s={s} t={t} plain={d.referenceOnly} />)}
            </section>
          ))}
        </div>
        <Card>
          <div className="stack gap-2" data-governed>
            <strong className="t-sm">{t(K.reader.governedBy)}</strong>
            <p className="t-sm">{t(d.governedBy.nameKey)}</p>
            {s.canEdit && d.governedBy.route && <Button size="sm" variant="secondary" style={{ width: 'fit-content' }} icon={<ArrowSquareOut size={16} />} data-open-governing onClick={() => s.goto(d.governedBy.route as string)}>{t(K.reader.openGoverning)}</Button>}
            {d.editable && <Button size="sm" variant="secondary" style={{ width: 'fit-content' }} icon={<PencilSimple size={16} />} data-new-version onClick={() => setEditing(true)}>{t(K.admin.newVersion)}</Button>}
          </div>
        </Card>
      </div>
      <ActionBar>
        <div className="row gap-2" style={{ width: '100%' }} data-actions>
          <Button variant="secondary" icon={<Star size={18} weight={on ? 'fill' : 'regular'} />} data-bookmark-reader aria-pressed={on} onClick={() => void s.toggleBookmark(d)}>{on ? t(K.row.unbookmark) : t(K.row.bookmark)}</Button>
          {copy ? (
            <>
              {copy.state === 'stale' && s.online && <Button icon={<ArrowClockwise size={18} />} data-update-copy-bar onClick={() => void s.updateCopies([d])}>{t(K.copy.update)}</Button>}
              <Button variant="ghost" icon={<Trash size={18} />} data-remove-copy onClick={() => s.removeCopy(d)}>{t(K.copy.remove)}</Button>
              <span className="row gap-1 t-xs t-muted" style={{ alignItems: 'center' }}><CloudCheck size={16} aria-hidden="true" style={{ color: 'var(--color-success)' }} />{t(K.copy.savedOn, { date: formatDate(copy.savedAt, i18n.language) })}</span>
            </>
          ) : (
            <Button icon={<DownloadSimple size={18} />} disabled={!s.online || s.fromCache} data-save-copy onClick={() => void s.saveCopy(d)}>{t(K.copy.save)}</Button>
          )}
        </div>
      </ActionBar>
      <ReferenceSheet s={s} t={t} state={editing ? { doc: d } : null} onClose={() => setEditing(false)} />
    </Screen>
  );
}

function VersionHeader({ d, v, s, t, lang }: { d: SopDocumentView; v: SopDocVersionView; s: SopRepositoryState; t: T; lang: string }) {
  const stateLabel = { current: t(K.reader.stateCurrent), upcoming: t(K.reader.stateUpcoming), past: t(K.reader.statePast) };
  const note = sopText(t, v.changeNote, s.lang);
  return (
    <Card>
      <div className="stack gap-2" data-version-card data-version={v.version} data-state={v.state}>
        <Field label={t(K.reader.version)}>{(p) => (
          <Select id={p.id} value={String(v.version)} onChange={(e) => s.setVersion(Number(e.target.value) === d.currentVersion ? null : Number(e.target.value))} data-f="version">
            {[...d.versions].sort((a, b) => b.version - a.version).map((x) => <option key={x.version} value={x.version}>{t(K.reader.versionOption, { version: x.version, state: stateLabel[x.state] })}</option>)}
          </Select>
        )}</Field>
        <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <Badge tone={v.state === 'current' ? 'success' : v.state === 'upcoming' ? 'accent' : 'neutral'}>{stateLabel[v.state]}</Badge>
          <span className="t-sm">{t(K.reader.effective, { date: formatDate(v.effectiveFrom, lang) })}</span>
          {v.publishedByName && <span className="t-xs t-muted">{t(K.reader.publishedBy, { name: v.publishedByName })}</span>}
        </div>
        {note.text && <p className="t-sm" data-change-note><strong>{t(K.reader.changeNote)}</strong> {note.text}</p>}
        {v.changes ? (
          <p className="t-xs" data-changes>{v.changes.added + v.changes.removed + v.changes.changed === 0 ? t(K.reader.changesNone) : t(K.reader.changes, { added: v.changes.added, changed: v.changes.changed, removed: v.changes.removed })}</p>
        ) : <p className="t-xs t-muted">{t(K.reader.first)}</p>}
      </div>
    </Card>
  );
}

function ItemCard({ it, n, v, s, t, plain }: { it: SopItemView; n: number; v: SopDocVersionView; s: SopRepositoryState; t: T; plain: boolean }) {
  const label = sopText(t, it.label, s.lang);
  const detail = sopText(t, it.detail, s.lang);
  const standard = sopText(t, it.standard, s.lang);
  const isNew = v.changedIds.added.includes(it.id);
  const isChanged = v.changedIds.changed.includes(it.id);
  return (
    <Card>
      <div className="stack gap-2" data-item={it.id} data-new={isNew ? '1' : '0'} data-changed={isChanged ? '1' : '0'}>
        <div className="row gap-3" style={{ alignItems: 'baseline' }}>
          <span className="t-sm t-muted" style={{ fontVariantNumeric: 'tabular-nums', minWidth: 20 }}>{n}</span>
          <span className="stack grow">
            <strong className="t-md" style={{ overflowWrap: 'anywhere' }}>{label.text}</strong>
            {label.fallback && <span className="t-xs t-muted">{t(K.reader.english)}</span>}
          </span>
        </div>
        <div className="row gap-2 wrap">
          {isNew && <Badge tone="emerald">{t(K.reader.newItem)}</Badge>}
          {isChanged && <Badge tone="accent">{t(K.reader.changedItem)}</Badge>}
          {it.safetyCritical && <Badge tone="warning">{t(K.reader.critical)}</Badge>}
          {!plain && <Badge tone={it.mandatory ? 'accent' : 'neutral'}>{it.mandatory ? t(K.reader.required) : t(K.reader.optional)}</Badge>}
          {it.needsPhoto && <Badge tone="neutral">{t(K.reader.photo)}</Badge>}
          {it.needsVideo && <Badge tone="neutral">{t(K.reader.video)}</Badge>}
        </div>
        {detail.text && <div className="stack gap-1">{lines(detail.text).map((ln, i) => <p key={i} className="t-sm">{ln}</p>)}</div>}
        {standard.text && <p className="t-xs t-muted"><strong>{t(K.reader.standard)}</strong> {standard.text}</p>}
        {it.appliesWhen && <p className="t-xs t-muted">{t(K.reader.appliesWhen)} {sopText(t, it.appliesWhen, s.lang).text}</p>}
        {it.evidence.length > 0 && (
          <div className="stack gap-1">
            <span className="t-xs"><strong>{t(K.reader.evidence)}</strong></span>
            <ul className="stack gap-1" style={{ margin: 0, paddingLeft: 'var(--space-4)' }}>{it.evidence.map((e, i) => <li key={i} className="t-xs">{sopText(t, e, s.lang).text}</li>)}</ul>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ Admin: a new category, a reference document */

function CategorySheet({ s, t, open, onClose }: { s: SopRepositoryState; t: T; open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [hi, setHi] = useState('');
  const [mr, setMr] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (open) { setName(''); setHi(''); setMr(''); setError(null); } }, [open]);
  return (
    <Sheet open={open} onClose={onClose} title={t(K.admin.categoryTitle)} closeLabel={t(K.close)}>
      <div className="stack gap-3" data-form="category">
        <p className="t-sm">{t(K.admin.categoryBody)}</p>
        <Field label={t(K.admin.categoryName)}>{(p) => <Input id={p.id} value={name} onChange={(e) => setName(e.target.value)} data-f="name" />}</Field>
        <Field label={t(K.admin.categoryNameHi)} hint={t(K.admin.categoryOptional)}>{(p) => <Input id={p.id} value={hi} onChange={(e) => setHi(e.target.value)} data-f="nameHi" />}</Field>
        <Field label={t(K.admin.categoryNameMr)} hint={t(K.admin.categoryOptional)}>{(p) => <Input id={p.id} value={mr} onChange={(e) => setMr(e.target.value)} data-f="nameMr" />}</Field>
        {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
        <Footer>
          <Button variant="ghost" onClick={onClose}>{t(K.admin.cancel)}</Button>
          <Button disabled={letters(name) < 2 || s.busy} data-confirm-category onClick={async () => { const r = await s.addCategory({ name, nameHi: hi, nameMr: mr }); if (!r.ok) setError(r.code ?? 'generic'); else onClose(); }}>{t(K.admin.categoryAdd)}</Button>
        </Footer>
      </div>
    </Sheet>
  );
}

function ReferenceSheet({ s, t, state, onClose }: { s: SopRepositoryState; t: T; state: { doc: SopDocumentView | null } | null; onClose: () => void }) {
  const doc = state?.doc ?? null;
  // The fields are reset when the sheet is opened for a document (or a new one), never because the page behind it re-rendered.
  const openKey = state ? (doc?.id ?? 'new') : null;
  const custom = s.categories.filter((c) => !c.builtIn);
  const cur = doc ? doc.versions.find((v) => v.version === doc.currentVersion) ?? doc.versions[doc.versions.length - 1] : null;
  const initial = (lang: 'en' | 'hi' | 'mr') => (cur ? cur.sections.flatMap((x) => x.items).map((i) => (i.label[lang] ?? '')).join('\n') : '');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState({ en: '', hi: '', mr: '' });
  const [steps, setSteps] = useState({ en: '', hi: '', mr: '' });
  const [effective, setEffective] = useState(today());
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!state) return;
    setCategory(doc?.categoryId ?? custom[0]?.id ?? '');
    setTitle({ en: doc?.title.en ?? '', hi: doc?.title.hi ?? '', mr: doc?.title.mr ?? '' });
    setSteps({ en: initial('en'), hi: initial('hi'), mr: initial('mr') });
    setEffective(today());
    setNote('');
    setError(null);
  }, [openKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const versioning = !!doc;
  const noteOk = !versioning || letters(note) >= NOTE_MIN;
  const ready = !!category && letters(title.en) >= 3 && lines(steps.en).length > 0 && noteOk && !!effective;
  return (
    <Sheet open={!!state} onClose={onClose} title={versioning ? t(K.admin.refTitleVersion) : t(K.admin.refTitleNew)} closeLabel={t(K.close)}>
      <div className="stack gap-3" data-form="reference">
        <p className="t-sm">{t(K.admin.refBody)}</p>
        <p className="t-xs t-muted">{t(K.admin.enforcedNote)}</p>
        {custom.length === 0 ? <p className="t-sm" data-no-category>{t(K.admin.noCustomCategory)}</p> : (
          <>
            <Field label={t(K.admin.refCategory)}>{(p) => <Select id={p.id} value={category} disabled={versioning} onChange={(e) => setCategory(e.target.value)} data-f="category">{custom.map((c) => <option key={c.id} value={c.id}>{sopText(t, c.name, s.lang).text}</option>)}</Select>}</Field>
            <Field label={t(K.admin.docTitle)}>{(p) => <Input id={p.id} value={title.en} onChange={(e) => setTitle({ ...title, en: e.target.value })} data-f="title" />}</Field>
            <Field label={t(K.admin.docTitleHi)} hint={t(K.admin.categoryOptional)}>{(p) => <Input id={p.id} value={title.hi} onChange={(e) => setTitle({ ...title, hi: e.target.value })} data-f="titleHi" />}</Field>
            <Field label={t(K.admin.docTitleMr)} hint={t(K.admin.categoryOptional)}>{(p) => <Input id={p.id} value={title.mr} onChange={(e) => setTitle({ ...title, mr: e.target.value })} data-f="titleMr" />}</Field>
            <Field label={t(K.admin.steps)} hint={t(K.admin.stepsHint)}>{(p) => <TextArea id={p.id} rows={6} value={steps.en} onChange={(e) => setSteps({ ...steps, en: e.target.value })} data-f="steps" />}</Field>
            <Field label={t(K.admin.stepsHi)} hint={t(K.admin.stepsOtherHint)}>{(p) => <TextArea id={p.id} rows={4} value={steps.hi} onChange={(e) => setSteps({ ...steps, hi: e.target.value })} data-f="stepsHi" />}</Field>
            <Field label={t(K.admin.stepsMr)} hint={t(K.admin.stepsOtherHint)}>{(p) => <TextArea id={p.id} rows={4} value={steps.mr} onChange={(e) => setSteps({ ...steps, mr: e.target.value })} data-f="stepsMr" />}</Field>
            <Field label={t(K.admin.effective)} hint={t(K.admin.effectiveHint)}>{(p) => <Input id={p.id} type="date" min={today()} value={effective} onChange={(e) => setEffective(e.target.value)} data-f="effective" />}</Field>
            {versioning && <Field label={t(K.admin.note)} hint={t(K.admin.noteHint, { min: NOTE_MIN })}>{(p) => <TextArea id={p.id} rows={2} value={note} onChange={(e) => setNote(e.target.value)} data-f="note" />}</Field>}
          </>
        )}
        {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
        <Footer>
          <Button variant="ghost" onClick={onClose}>{t(K.admin.cancel)}</Button>
          <Button disabled={!ready || s.busy || custom.length === 0} data-confirm-reference onClick={async () => {
            const r = await s.saveReference({ docId: doc?.id, categoryId: category, title, steps: { en: lines(steps.en), hi: lines(steps.hi), mr: lines(steps.mr) }, effectiveFrom: effective, changeNote: note });
            if (!r.ok) setError(r.code ?? 'generic'); else onClose();
          }}>{t(K.admin.publish)}</Button>
        </Footer>
      </div>
    </Sheet>
  );
}
