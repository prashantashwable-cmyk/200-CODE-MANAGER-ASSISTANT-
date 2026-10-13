import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CaretRight, DownloadSimple, Funnel, Phone, ChatCircleText, UsersThree, X } from '@phosphor-icons/react';
import { Avatar, Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, TextArea, formatDate } from '@/design-system';
import type { DirectoryRoleView, DirectoryType, PartnerDirectoryProfileView, PartnerDirectoryRowView } from '@/data/repository';
import { DIRECTORY_KEYS as K, KNOWN_SKILLS, PAGE, REASON_MIN, SORTS, STATUSES, TYPES, applicationPath, exitPath, leadAssignmentPath, messagePath, tierOptions, tierPath, territoriesPath, whatsappUrl } from './partner-directory.types';
import { usePartnerDirectory } from './usePartnerDirectory';
import type { DirectoryState } from './usePartnerDirectory';

type T = ReturnType<typeof useTranslation>['t'];
const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;
const problemKey = (code?: string | null) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const humanise = (v: string) => v.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
const tierName = (t: T, type: DirectoryType, id: string) => t(`partnerTiers.tier.${type}.${id}`, { defaultValue: humanise(id) });
const areaName = (t: T, kind: string, v: string) => (kind === 'zone' ? v : kind === 'skill' ? t(`partnerDir.skill.${(KNOWN_SKILLS as readonly string[]).includes(v) ? v : 'x'}`, { defaultValue: humanise(v) }) : t(`partCategory.${v}`, { defaultValue: humanise(v) }));
const perfText = (t: T, r: DirectoryRoleView): string => {
  if (r.type === 'surveyor') return t(K.row.perf.surveyor, { leads: r.perf.leads ?? 0, won: r.perf.won ?? 0 });
  if (r.type === 'technician') return r.perf.qcPassRate === null || r.perf.qcPassRate === undefined ? t(K.row.perf.technicianNew) : t(K.row.perf.technician, { count: r.perf.jobsCompleted ?? 0, qc: r.perf.qcPassRate });
  return r.perf.score === null || r.perf.score === undefined ? t(K.row.perf.supplierNew) : t(K.row.perf.supplier, { score: r.perf.score, rated: r.perf.rated ?? 0 });
};
const STATUS_TONE = { active: 'success', pending: 'warning', deactivated: 'neutral', rejected: 'neutral' } as const;

function Footer({ children }: { children: ReactNode }) {
  return <div className="row gap-2" data-sheet-actions style={{ position: 'sticky', bottom: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: 'var(--space-2) 0', marginTop: 'var(--space-3)', justifyContent: 'flex-end' }}>{children}</div>;
}

/**
 * Screen 149 — Partner Directory. Everyone in the network in one list: a consistent row (avatar, name and place, then one line per role the
 * person holds with tier, status, where they work and how they are doing), a sticky search and filter bar, and a quick-glance sheet with the
 * actions Admin reaches for. A person who is both a technician and a supplier's representative is one entry with two role lines.
 */
export function DirectoryScreen() {
  const { t } = useTranslation();
  const s = usePartnerDirectory();
  const v = s.view;
  if (s.status === 'loading' && !v) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="list" rows={8} /></Screen>;
  if (s.status === 'error' || !v) return <Screen width="wide"><ScreenHeader title={t(K.title)} /><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} /></Screen>;
  const shown = v.rows.length;
  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="secondary" icon={<DownloadSimple size={16} />} data-export onClick={() => void s.exportCsv({ type: (x) => t(K.typeOne[x]), status: (x) => t(K.statusOne[x]), tier: (x, id) => tierName(t, x, id), area: (k, val) => areaName(t, k, val), perf: (r) => perfText(t, r) })}>{t(K.export.button)}</Button>} />
      <Controls s={s} t={t} />
      <div className="stack gap-3 mt-3" data-directory>
        <p className="t-xs t-muted" role="status" data-count>{t(K.summary.count, { count: v.total })}</p>
        {v.total === 0 ? (
          s.hasFilters ? <EmptyState icon={<UsersThree size={28} />} title={t(K.noMatch.title)} body={t(K.noMatch.body)} actionLabel={t(K.noMatch.action)} onAction={s.clear} /> : <EmptyState icon={<UsersThree size={28} />} title={t(K.empty.title)} body={t(K.empty.body)} actionLabel={t(K.empty.action)} onAction={() => s.goto('/recruitment')} />
        ) : (
          <>
            <div className="grid-auto" style={{ '--min': '360px', alignItems: 'start' } as React.CSSProperties}>
              {v.rows.map((row, i) => <PartnerCard key={row.key} row={row} t={t} index={i} onOpen={() => s.openProfile(row.key)} />)}
            </div>
            {shown < v.total && (
              <div className="stack gap-1" style={{ alignItems: 'center' }}>
                <span className="t-xs t-muted">{t(K.more.shown, { shown, total: v.total })}</span>
                <Button variant="secondary" data-more onClick={s.showMore}>{t(K.more.button, { count: Math.min(PAGE, v.total - shown) })}</Button>
              </div>
            )}
          </>
        )}
        <p className="t-xs t-muted">{t(K.export.note)}</p>
      </div>
      <ProfileSheet s={s} t={t} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ search and filters */

function Controls({ s, t }: { s: DirectoryState; t: T }) {
  const v = s.view as NonNullable<DirectoryState['view']>;
  const [open, setOpen] = useState(false);
  return (
    <div className="stack gap-2 sticky-under-shell" style={{ background: 'var(--color-bg)', paddingBlock: 'var(--space-2)' }} data-controls>
      <Field label={t(K.search.label)}>{(p) => <Input id={p.id} type="search" value={s.text} placeholder={t(K.search.placeholder)} onChange={(e) => s.setText(e.target.value)} data-f="search" autoComplete="off" />}</Field>
      <div className="row gap-2" style={{ overflowX: 'auto', paddingBottom: 2 }} role="group" aria-label={t(K.type.all)}>
        {TYPES.map((x) => <span key={x} data-type={x} style={{ flex: '0 0 auto' }}><Chip pressed={s.type === x} onClick={() => s.setType(x)}>{t(K.type[x])} · {v.typeCounts[x]}</Chip></span>)}
        <span style={{ flex: '0 0 auto' }}><Chip pressed={open || s.activeFilters > 0} onClick={() => setOpen((o) => !o)} icon={<Funnel size={14} />}>{t(K.filters.toggle)}{s.activeFilters > 0 ? ` · ${s.activeFilters}` : ''}</Chip></span>
      </div>
      {(open || s.activeFilters > 0) && (
        <div className="grid-auto" style={{ '--min': '170px' } as React.CSSProperties} data-more-filters>
          <Field label={t(K.filters.status)}>{(p) => <Select id={p.id} value={s.statusFilter} onChange={(e) => s.setStatus(e.target.value)} data-f="status">{STATUSES.map((x) => <option key={x} value={x}>{t(K.status[x])} · {v.statusCounts[x]}</option>)}</Select>}</Field>
          <Field label={t(K.filters.tier)}>{(p) => <Select id={p.id} value={s.tier} onChange={(e) => s.setTier(e.target.value)} data-f="tier"><option value="">{t(K.filters.anyTier)}</option>{tierOptions.map((o) => <option key={o.value} value={o.value}>{t(K.typeOne[o.type])} · {tierName(t, o.type, o.id)}</option>)}</Select>}</Field>
          <Field label={t(K.filters.zone)}>{(p) => <Select id={p.id} value={s.zoneId} onChange={(e) => s.setZone(e.target.value)} data-f="zone"><option value="">{t(K.filters.anyZone)}</option>{v.zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}</Select>}</Field>
          <Field label={t(K.filters.sort)}>{(p) => <Select id={p.id} value={s.sort} onChange={(e) => s.setSort(e.target.value)} data-f="sort">{SORTS.map((x) => <option key={x} value={x}>{t(K.sort[x])}</option>)}</Select>}</Field>
        </div>
      )}
      {s.hasFilters && <Button variant="ghost" size="sm" style={{ width: 'fit-content' }} icon={<X size={14} />} data-clear onClick={s.clear}>{t(K.filters.clear)}</Button>}
    </div>
  );
}

/* ------------------------------------------------------------------ the row */

function RoleLine({ r, t, compact }: { r: DirectoryRoleView; t: T; compact?: boolean }) {
  const area = r.territory.length ? r.territory.slice(0, 3).map((x) => areaName(t, x.kind, x.value)).join(', ') + (r.territory.length > 3 ? ` +${r.territory.length - 3}` : '') : t(K.row.noTerritory);
  return (
    <div className="stack gap-1" data-role={r.type} data-status={r.status} data-tier={r.tier}>
      <span className="row gap-2 wrap" style={{ alignItems: 'center' }}>
        <Badge tone="neutral">{t(K.typeOne[r.type])}</Badge>
        <Badge tone="accent">{tierName(t, r.type, r.tier)}</Badge>
        {r.status !== 'active' && <Badge tone={STATUS_TONE[r.status]}>{t(K.statusOne[r.status])}</Badge>}
        {r.exiting && <Badge tone="warning">{t(K.row.leaving)}</Badge>}
      </span>
      <span className="t-sm">{area}</span>
      {!compact && <span className="t-xs t-muted">{perfText(t, r)} · {t(K.row.inHand[r.type], { count: r.inFlight })}</span>}
    </div>
  );
}

function PartnerCard({ row, t, index, onOpen }: { row: PartnerDirectoryRowView; t: T; index: number; onOpen: () => void }) {
  return (
    <Card riseIndex={Math.min(index, 8)} onClick={onOpen}>
      <div className="stack gap-2" data-partner={row.key}>
        <div className="row gap-3" style={{ alignItems: 'center' }}>
          <Avatar name={row.name} />
          <span className="stack grow" style={{ minWidth: 0 }}>
            <strong className="t-md" style={{ overflowWrap: 'anywhere' }}>{row.name}</strong>
            <span className="t-xs t-muted">{[row.city, row.roles.length > 1 ? t(K.row.roles, { count: row.roles.length }) : null].filter(Boolean).join(' · ')}</span>
          </span>
          <CaretRight size={14} aria-hidden="true" />
        </div>
        {row.roles.map((r) => <RoleLine key={r.partnerId} r={r} t={t} />)}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ the quick-glance sheet */

function ProfileSheet({ s, t }: { s: DirectoryState; t: T }) {
  const { i18n } = useTranslation();
  const p = s.profile;
  const [reassign, setReassign] = useState<DirectoryRoleView | null>(null);
  useEffect(() => setReassign(null), [s.profile?.row.key]);
  return (
    <Sheet open={s.profileOpen} onClose={s.closeProfile} title={p?.row.name ?? t(K.title)} closeLabel={t('action.close')}>
      {s.profileStatus === 'not_found' ? (
        <EmptyState icon={<UsersThree size={28} />} title={t(K.profile.notFound.title)} body={t(K.profile.notFound.body)} actionLabel={t(K.profile.back)} onAction={s.closeProfile} />
      ) : !p ? (
        <LoadingState label={t(K.loading)} variant="block" />
      ) : reassign ? (
        <ReassignForm s={s} t={t} p={p} role={reassign} onDone={() => setReassign(null)} />
      ) : (
        <Profile s={s} t={t} p={p} lang={i18n.language} onReassign={setReassign} />
      )}
    </Sheet>
  );
}

function Profile({ s, t, p, lang, onReassign }: { s: DirectoryState; t: T; p: PartnerDirectoryProfileView; lang: string; onReassign: (r: DirectoryRoleView) => void }) {
  const row = p.row;
  const supplier = row.roles.find((r) => r.type === 'supplier');
  const surveyor = row.roles.find((r) => r.type === 'surveyor' && r.status === 'active');
  return (
    <div className="stack gap-3" data-profile={row.key}>
      <div className="row gap-3" style={{ alignItems: 'center' }}>
        <Avatar name={row.name} size="lg" />
        <span className="stack"><strong className="t-md">{row.name}</strong><span className="t-xs t-muted">{[row.city, row.phone].filter(Boolean).join(' · ')}</span></span>
      </div>
      <div className="row gap-2 wrap" data-quick aria-label={t(K.profile.actions)}>
        {row.phone && <a className="ds-btn ds-btn--secondary ds-btn--sm" href={`tel:${row.phone}`} data-call><Phone size={16} aria-hidden="true" /> {t(K.profile.call)}</a>}
        {supplier ? <Button size="sm" variant="secondary" icon={<ChatCircleText size={16} />} data-message onClick={() => s.goto(messagePath(supplier.partnerId))}>{t(K.profile.messageSupplier)}</Button> : row.phone && <a className="ds-btn ds-btn--secondary ds-btn--sm" href={whatsappUrl(row.phone)} target="_blank" rel="noopener noreferrer" data-message><ChatCircleText size={16} aria-hidden="true" /> {t(K.profile.message)}</a>}
        {surveyor && <Button size="sm" variant="secondary" data-reassign onClick={() => onReassign(surveyor)}>{t(K.profile.reassign)}</Button>}
      </div>
      {row.roles.map((r) => (
        <Card key={r.partnerId}>
          <div className="stack gap-2" data-role-card={r.type} data-status={r.status}>
            <RoleLine r={r} t={t} />
            {r.joinedAt && <span className="t-xs t-muted">{t(K.profile.joined, { date: formatDate(r.joinedAt, lang) })}</span>}
            <div className="row gap-2 wrap">
              <Button size="sm" variant="ghost" data-view-profile={r.type} onClick={() => s.goto(r.profileRoute)}>{t(K.profile.viewProfile[r.type])}</Button>
              {r.status === 'active' && <Button size="sm" variant="ghost" data-tier-link onClick={() => s.goto(tierPath(r.partnerId))}>{t(K.profile.tierLink)}</Button>}
              {r.applicationId && <Button size="sm" variant="ghost" onClick={() => s.goto(applicationPath(r.applicationId as string))}>{t(K.profile.applicationLink)}</Button>}
            </div>
            {r.status === 'active' ? (
              <div className="stack gap-1">
                <Button size="sm" variant="secondary" style={{ width: 'fit-content' }} data-deactivate={r.partnerId} onClick={() => s.goto(exitPath(r.partnerId))}>{r.exiting ? t(K.profile.openExit) : t(K.profile.deactivate)}</Button>
                <span className="t-xs t-muted">{r.inFlight > 0 ? t(K.profile.deactivateInFlight, { count: r.inFlight, what: t(K.row.inHand[r.type], { count: r.inFlight }) }) : t(K.profile.deactivateHint)}</span>
              </div>
            ) : <span className="t-xs t-muted">{t(K.profile.notActive, { status: t(K.statusOne[r.status]) })}</span>}
          </div>
        </Card>
      ))}
      {p.changes.length > 0 && (
        <div className="stack gap-1" data-changes>
          <strong className="t-sm">{t(K.profile.changes)}</strong>
          {p.changes.map((c) => <span key={c.id} className="t-xs">{t(K.profile.changeRow, { date: formatDate(c.at, lang), name: c.byName })} “{c.reason}”</span>)}
        </div>
      )}
    </div>
  );
}

function ReassignForm({ s, t, p, role, onDone }: { s: DirectoryState; t: T; p: PartnerDirectoryProfileView; role: DirectoryRoleView; onDone: () => void }) {
  const [chosen, setChosen] = useState<string[]>(() => p.zoneOptions.filter((z) => z.assigned).map((z) => z.id));
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const toggle = (id: string, on: boolean) => setChosen((c) => (on ? [...c, id] : c.filter((x) => x !== id)));
  return (
    <div className="stack gap-3" data-form="reassign">
      <p className="t-sm">{t(K.reassign.body, { name: p.row.name })}</p>
      <div className="stack gap-1">
        <strong className="t-sm">{t(K.reassign.zones)}</strong>
        {p.zoneOptions.length === 0 ? <span className="t-xs t-muted">{t(K.reassign.noZones)}</span> : p.zoneOptions.map((z) => <div key={z.id} data-zone={z.id}><Checkbox checked={chosen.includes(z.id)} onChange={(on) => toggle(z.id, on)} label={z.name} /></div>)}
      </div>
      <p className="t-xs t-muted">{t(K.reassign.keeps, { count: role.inFlight })} <button type="button" className="t-xs" style={{ background: 'none', border: 0, padding: 0, color: 'var(--color-accent-primary)', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => s.goto(leadAssignmentPath)}>{t(K.reassign.assignLeads)}</button> · <button type="button" className="t-xs" style={{ background: 'none', border: 0, padding: 0, color: 'var(--color-accent-primary)', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => s.goto(territoriesPath)}>{t(K.reassign.territories)}</button></p>
      <Field label={t(K.reassign.reason)} hint={t(K.reassign.reasonHint, { min: REASON_MIN })}>{(f) => <TextArea id={f.id} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} data-f="reason" />}</Field>
      {error && <p className="t-xs t-error" role="alert" data-problem={error}>{t(problemKey(error))}</p>}
      <Footer>
        <Button variant="ghost" onClick={onDone}>{t(K.reassign.cancel)}</Button>
        <Button disabled={letters(reason) < REASON_MIN || s.busy} data-confirm-reassign onClick={async () => { const r = await s.reassign(role.partnerId, { zoneIds: chosen, reason }); if (!r.ok) setError(r.code ?? 'generic'); else onDone(); }}>{t(K.reassign.confirm)}</Button>
      </Footer>
    </div>
  );
}
