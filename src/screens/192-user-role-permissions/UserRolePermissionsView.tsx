import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, Check, LockSimple, Plus, ShieldCheck, ShieldWarning, X } from '@phosphor-icons/react';
import { Badge, Button, Card, Checkbox, Chip, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, Select, Sheet, Tabs, TextArea, formatDate, useToast } from '@/design-system';
import type { MatrixRowView, PermissionOverview, PermissionRoleView, PermissionUserRow, RoleChangePreview, UserAccessView } from '@/data/repository';
import type { PermissionChange } from '@/data/types';
import { CUSTOM_BASES, OVERRIDE_MAX_DAYS, REASON_MIN_OVERRIDE, REASON_MIN_ROLE, lettersOf } from '@/features/access/permissions';
import type { Risk } from '@/features/access/permissions';
import { USER_ROLE_PERMISSIONS_KEYS as K } from './user-role-permissions.types';
import { TABS, useUserRolePermissions } from './useUserRolePermissions';
import type { PermissionTab, PermissionsState } from './useUserRolePermissions';

type T = ReturnType<typeof useTranslation>['t'];
const RISK_TONE: Record<Risk, 'success' | 'warning' | 'error'> = { low: 'success', medium: 'warning', high: 'error' };
const errText = (t: T, code: string) => t(`accessControl.error.${code}`, { defaultValue: t(K.error.generic) });
const roleName = (t: T, r: Pick<PermissionRoleView, 'id' | 'name' | 'nameHi' | 'nameMr' | 'builtIn'>, lang: string): string => (r.builtIn ? t(`role.${r.id}`, { defaultValue: r.id }) : lang === 'hi' && r.nameHi ? r.nameHi : lang === 'mr' && r.nameMr ? r.nameMr : r.name);
const screenName = (t: T, key: string, id: string): string => `${t(key, { defaultValue: id })}`;
const moduleName = (t: T, m: number): string => (m === 0 ? t(K.matrix.foundation) : t(K.matrix.module, { n: m }));
const stateText = (t: T, allowed: boolean): string => t(allowed ? K.state.allowed : K.state.denied);

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="stack gap-3">
      <h2 className="t-md t-semibold" style={{ borderTop: '1px solid var(--color-accent-primary)', paddingTop: 12 }}>{title}</h2>
      {hint && <p className="t-xs t-muted">{hint}</p>}
      {children}
    </section>
  );
}

/** Screen 192 — User & Role Permission Management. A settings layout: a plain summary first, then four tabs (the screens against the roles, the roles themselves, each person, and the audit trail). Every change needs a reason, anything that gives an outside role or a non-Admin an Admin screen needs a tick, and the locked screens cannot be removed. */
export function UserRolePermissionsScreen() {
  const { t, i18n } = useTranslation();
  const s = useUserRolePermissions();
  const o = s.overview;
  const head = <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" icon={<ArrowsClockwise size={16} />} data-refresh onClick={() => void s.refresh()}>{t(K.refresh)}</Button>} />;
  if (s.load === 'loading' && !o) return <Screen width="default">{head}<LoadingState label={t(K.loading)} variant="list" rows={4} /></Screen>;
  if (s.load === 'error' && !o) return <Screen width="default">{head}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t(K.error.retry)} onRetry={() => void s.refresh()} /></Screen>;
  if (!o) return null;
  return (
    <Screen width="default">
      {head}
      <div className="stack gap-4">
        {s.offline && <p className="t-xs t-muted" role="status" data-offline>{t(K.offline)}</p>}
        <Summary o={o} t={t} />
        <Tabs label={t(K.tab.label)} value={s.tab} onChange={(id) => s.setTab(id as PermissionTab)} items={TABS.map((id) => ({ id, label: t(`accessControl.tab.${id}`) }))} />
        {s.tab === 'matrix' && <MatrixTab s={s} t={t} lang={i18n.language} />}
        {s.tab === 'roles' && <RolesTab s={s} t={t} lang={i18n.language} roles={o.roles} />}
        {s.tab === 'users' && <UsersTab s={s} t={t} lang={i18n.language} />}
        {s.tab === 'audit' && <AuditTab s={s} t={t} lang={i18n.language} />}
        <p className="t-xs t-muted" data-enforcement-note>{t(K.note.enforcement)}</p>
        <p className="t-xs t-muted" data-placeholder-note>{t(K.note.placeholders)}</p>
      </div>
    </Screen>
  );
}

function Summary({ o, t }: { o: PermissionOverview; t: T }) {
  return (
    <div className="stack gap-3">
      <div className="grid-auto" data-summary>
        <Card><div className="stack gap-0" data-admins={o.admins.active}><span className="t-sm t-semibold">{t(K.summary.admins, { count: o.admins.active })}</span></div></Card>
        <Card><div className="stack gap-0" data-overrides={o.overrides.active}><span className="t-sm t-semibold">{t(K.summary.overrides, { count: o.overrides.active })}</span>{o.overrides.dueForReview > 0 && <span className="t-xs" style={{ color: 'var(--color-warning)' }}>{t(K.summary.due, { count: o.overrides.dueForReview })}</span>}</div></Card>
        <Card><div className="stack gap-0"><span className="t-sm t-semibold">{t(K.summary.screens, { count: o.screens })}</span></div></Card>
      </div>
      <p className="t-xs row gap-2" style={{ alignItems: 'flex-start' }} data-safeguard><ShieldCheck size={16} aria-hidden="true" color="var(--color-success)" style={{ flex: '0 0 auto', marginTop: 2 }} />{t(K.summary.safeguard)}</p>
      {o.creep.length > 0 && (
        <Card>
          <div className="stack gap-1" data-creep>
            <span className="t-sm t-semibold row gap-2" style={{ alignItems: 'center', color: 'var(--color-warning)' }}><ShieldWarning size={16} aria-hidden="true" />{t(K.creep.title)}</span>
            {o.creep.map((c) => <span key={`${c.kind}-${c.roleId ?? c.userId}`} className="t-xs" data-creep-kind={c.kind}>{t(`accessControl.creep.${c.kind}`, { name: c.name, count: c.count })}</span>)}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ the screens against the roles */

function MatrixTab({ s, t, lang }: { s: PermissionsState; t: T; lang: string }) {
  const m = s.matrix;
  const [change, setChange] = useState<{ row: MatrixRowView; roleId: string } | null>(null);
  const roles = m?.roles ?? [];
  const more = m ? s.rows.length < m.total : false;
  return (
    <Section title={t(K.matrix.title)} hint={t(K.matrix.hint)}>
      <div className="stack gap-2 sticky-under-shell" style={{ background: 'var(--color-bg)', paddingBlock: 8 }}>
        <Input value={s.mf.q} placeholder={t(K.matrix.search)} aria-label={t(K.matrix.search)} data-f="matrix-search" onChange={(e) => s.setMf({ ...s.mf, q: e.target.value })} />
        <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <Select value={s.mf.module === null ? '' : String(s.mf.module)} aria-label={t(K.matrix.allModules)} data-f="matrix-module" onChange={(e) => s.setMf({ ...s.mf, module: e.target.value === '' ? null : Number(e.target.value) })} style={{ width: 'auto', minWidth: 160 }}>
            <option value="">{t(K.matrix.allModules)}</option>
            {(m?.facets.modules ?? []).map((x) => <option key={x.module} value={x.module}>{moduleName(t, x.module)} ({x.count})</option>)}
          </Select>
          <Chip pressed={s.mf.changed} onClick={() => s.setMf({ ...s.mf, changed: !s.mf.changed })}>{t(K.matrix.changed)}{m ? ` (${m.facets.changed})` : ''}</Chip>
          <Chip pressed={s.mf.adminOnly} onClick={() => s.setMf({ ...s.mf, adminOnly: !s.mf.adminOnly })}>{t(K.matrix.adminOnly)}{m ? ` (${m.facets.adminOnly})` : ''}</Chip>
        </div>
        {m && <span className="t-xs t-muted" data-count={m.total}>{t(K.matrix.count, { count: m.total })}</span>}
      </div>
      <p className="t-xs t-muted">{t(K.matrix.legend)}</p>
      {!m && s.matrixLoading ? <LoadingState label={t(K.loading)} variant="list" rows={4} /> : s.rows.length === 0 ? (
        <EmptyState title={s.mf.q || s.mf.module !== null || s.mf.changed || s.mf.adminOnly ? t(K.matrix.noMatch) : t(K.matrix.empty)} body={t(K.matrix.hint)} actionLabel={t(K.refresh)} onAction={() => void s.refresh()} />
      ) : (
        <div className="stack gap-2" data-matrix>
          {s.rows.map((r) => (
            <Card key={r.id}>
              <div className="stack gap-2" data-row={r.id} data-admin-only={r.adminOnly}>
                <div className="row between" style={{ alignItems: 'flex-start', gap: 8 }}>
                  <span className="stack gap-0"><span className="t-sm t-semibold">{screenName(t, r.titleKey, r.id)}</span><span className="t-xs t-muted" style={{ overflowWrap: 'anywhere' }}>{r.id} · {moduleName(t, r.module)} · {r.path}</span></span>
                  {r.adminOnly && <Badge tone="neutral">{t(K.matrix.adminOnly)}</Badge>}
                </div>
                <div className="row gap-1 wrap" role="group" aria-label={screenName(t, r.titleKey, r.id)}>
                  {r.cells.map((c) => {
                    const role = roles.find((x) => x.id === c.roleId);
                    const label = role ? roleName(t, role, lang) : c.roleId;
                    const differs = c.source === 'role_grant' || c.source === 'role_revoke';
                    return (
                      <button key={c.roleId} type="button" className="ds-chip" aria-pressed={c.allowed} aria-label={t(K.matrix.cell, { role: label, state: stateText(t, c.allowed) })} title={t(`accessControl.source.${c.source}`)} data-cell={`${r.id}|${c.roleId}`} data-allowed={c.allowed} data-source={c.source} disabled={false} onClick={() => setChange({ row: r, roleId: c.roleId })} style={differs ? { outline: '2px solid var(--color-accent-primary)', outlineOffset: 1 } : undefined}>
                        {c.locked ? <LockSimple size={12} aria-hidden="true" /> : c.allowed ? <Check size={12} aria-hidden="true" /> : <X size={12} aria-hidden="true" />}{label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
          ))}
          {more && <div><Button variant="secondary" data-act="matrix-more" loading={s.matrixLoading} onClick={() => void s.moreRows()}>{t(K.matrix.more)}</Button></div>}
        </div>
      )}
      <ChangeSheet target={change} onClose={() => setChange(null)} s={s} t={t} lang={lang} roles={roles} />
    </Section>
  );
}

function ChangeSheet({ target, onClose, s, t, lang, roles }: { target: { row: MatrixRowView; roleId: string } | null; onClose: () => void; s: PermissionsState; t: T; lang: string; roles: PermissionRoleView[] }) {
  const toast = useToast();
  const [effect, setEffect] = useState<'grant' | 'revoke' | 'reset' | null>(null);
  const [reason, setReason] = useState('');
  const [ack, setAck] = useState(false);
  const [pv, setPv] = useState<RoleChangePreview | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const live = target ? s.rows.find((r) => r.id === target.row.id) ?? target.row : null;
  const cell = live && target ? live.cells.find((c) => c.roleId === target.roleId) : undefined;
  const role = target ? roles.find((r) => r.id === target.roleId) : undefined;
  useEffect(() => { setEffect(null); setReason(''); setAck(false); setPv(null); setProblem(null); }, [target?.row.id, target?.roleId]);
  useEffect(() => {
    if (!target || !effect) { setPv(null); return; }
    let on = true;
    void s.preview({ roleId: target.roleId, screenIds: [target.row.id], effect, reason, confirmHighRisk: ack }).then((r) => { if (!on) return; if (r.ok) { setPv(r.value); setProblem(null); } else setProblem(r.problem); });
    return () => { on = false; };
  }, [target?.row.id, target?.roleId, effect]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!target || !live || !cell || !role) return <Sheet open={false} onClose={onClose} title="" closeLabel={t(K.close)}>{null}</Sheet>;
  const options: ('grant' | 'revoke' | 'reset')[] = [cell.allowed ? 'revoke' : 'grant', ...(cell.source === 'role_grant' || cell.source === 'role_revoke' ? (['reset'] as const) : [])];
  const high = pv?.risk === 'high';
  const ready = !!effect && !!pv && !pv.refusal && lettersOf(reason) >= REASON_MIN_ROLE && (!high || ack);
  const apply = async () => { if (!effect) return; setProblem(null); const r = await s.changeRole({ roleId: target.roleId, screenIds: [target.row.id], effect, reason, confirmHighRisk: ack }); if (r.ok) { toast.push(t(K.change.done)); onClose(); } else setProblem(r.problem); };
  return (
    <Sheet open onClose={onClose} title={t(K.change.title, { role: roleName(t, role, lang), screen: screenName(t, live.titleKey, live.id) })} closeLabel={t(K.close)}>
      <div className="stack gap-3" data-change-sheet data-cell={`${live.id}|${role.id}`}>
        <p className="t-sm" data-current-state>{stateText(t, cell.allowed)} · {t(`accessControl.source.${cell.source}`)}</p>
        <p className="t-xs t-muted">{t(K.change.standard, { state: stateText(t, cell.defaultAllowed) })}</p>
        {cell.locked ? <p className="t-sm" data-locked style={{ color: 'var(--color-text-secondary)' }}><LockSimple size={14} aria-hidden="true" /> {t(K.change.locked)}</p> : (
          <>
            <div className="row gap-2 wrap" role="group">{options.map((e) => <Chip key={e} pressed={effect === e} onClick={() => { setEffect(e); setAck(false); }}>{t(`accessControl.change.${e}`)}</Chip>)}</div>
            {pv && (
              <div className="stack gap-1" data-preview>
                <span className="t-sm t-semibold">{t(K.change.preview)}</span>
                {pv.rows.map((r) => <span key={r.screenId} className="t-xs">{t(K.change.willBe, { screen: screenName(t, r.titleKey, r.screenId), from: stateText(t, r.was), to: stateText(t, r.willBe) })}</span>)}
                <span className="t-xs">{t(K.change.users, { count: pv.users })}</span>
                <span><Badge tone={RISK_TONE[pv.risk]}>{t(`accessControl.risk.${pv.risk}`)}</Badge></span>
                {high && <p className="t-sm" data-high style={{ color: 'var(--color-error)' }}>{t(K.change.highRisk)}</p>}
              </div>
            )}
            <Field label={t(K.change.reason)} hint={`${lettersOf(reason)}/${REASON_MIN_ROLE}`}>{(p) => <TextArea id={p.id} rows={2} value={reason} data-f="reason" onChange={(e) => setReason(e.target.value)} />}</Field>
            {high && <Checkbox checked={ack} onChange={setAck} label={t(K.change.confirmHigh)} />}
            {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
            <Button data-act="apply" disabled={!ready} loading={s.busy} onClick={() => void apply()} style={high ? { color: 'var(--color-error)' } : undefined}>{t(K.change.apply)}</Button>
          </>
        )}
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ roles */

function RolesTab({ s, t, lang, roles }: { s: PermissionsState; t: T; lang: string; roles: PermissionRoleView[] }) {
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [nameMr, setNameMr] = useState('');
  const [base, setBase] = useState<typeof CUSTOM_BASES[number]>('technician');
  const [description, setDescription] = useState('');
  const [copy, setCopy] = useState('');
  const [reason, setReason] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [retiring, setRetiring] = useState<PermissionRoleView | null>(null);
  const [why, setWhy] = useState('');
  const live = roles.filter((r) => !r.retired);
  const create = async () => { setProblem(null); const r = await s.createRole({ name, nameHi, nameMr, baseRole: base, description, copyFromRoleId: copy || null, reason }); if (r.ok) { setCreating(false); setName(''); setNameHi(''); setNameMr(''); setDescription(''); setCopy(''); setReason(''); toast.push(t(K.roles.created)); } else setProblem(r.problem); };
  const retire = async () => { if (!retiring) return; setProblem(null); const r = await s.retireRole(retiring.id, why); if (r.ok) { setRetiring(null); setWhy(''); toast.push(t(K.roles.retired)); } else setProblem(r.problem); };
  return (
    <Section title={t(K.roles.title)} hint={t(K.roles.hint)}>
      <div><Button size="sm" variant="secondary" icon={<Plus size={14} />} data-act="new-role" onClick={() => { setProblem(null); setCreating(true); }}>{t(K.roles.new)}</Button></div>
      <div className="grid-auto" data-roles>
        {live.map((r) => (
          <Card key={r.id}>
            <div className="stack gap-2" data-role={r.id}>
              <div className="row between" style={{ alignItems: 'center', gap: 8 }}><span className="t-sm t-semibold">{roleName(t, r, lang)}</span><Badge tone="neutral">{r.builtIn ? t(K.roles.builtIn) : t(K.roles.custom)}</Badge></div>
              {!r.builtIn && <span className="t-xs t-muted">{t(K.roles.behaves, { role: t(`role.${r.baseRole}`) })}</span>}
              {r.description && <span className="t-xs">{r.description}</span>}
              <span className="t-xs t-muted">{t(K.roles.users, { count: r.users })} · {t(K.roles.grants, { count: r.grants })} · {t(K.roles.revokes, { count: r.revokes })}</span>
              <div className="row gap-2 wrap">
                <Button size="sm" variant="ghost" onClick={() => { s.setMf({ q: '', module: null, changed: true, adminOnly: false }); s.setTab('matrix'); }}>{t(K.roles.see)}</Button>
                {!r.builtIn && r.users === 0 && <Button size="sm" variant="ghost" data-act={`retire-${r.id}`} onClick={() => { setProblem(null); setRetiring(r); }}>{t(K.roles.retire)}</Button>}
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Sheet open={creating} onClose={() => setCreating(false)} title={t(K.roles.newTitle)} closeLabel={t(K.close)}>
        <div className="stack gap-3" data-role-sheet>
          <Field label={t(K.roles.name)}>{(p) => <Input id={p.id} value={name} data-f="role-name" onChange={(e) => setName(e.target.value)} />}</Field>
          <Field label={t(K.roles.nameHi)}>{(p) => <Input id={p.id} lang="hi" value={nameHi} onChange={(e) => setNameHi(e.target.value)} />}</Field>
          <Field label={t(K.roles.nameMr)}>{(p) => <Input id={p.id} lang="mr" value={nameMr} onChange={(e) => setNameMr(e.target.value)} />}</Field>
          <Field label={t(K.roles.base)} hint={t(K.roles.baseHint)}>{(p) => <Select id={p.id} value={base} data-f="role-base" onChange={(e) => setBase(e.target.value as typeof base)}>{CUSTOM_BASES.map((b) => <option key={b} value={b}>{t(`role.${b}`)}</option>)}</Select>}</Field>
          <Field label={t(K.roles.description)}>{(p) => <TextArea id={p.id} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />}</Field>
          <Field label={t(K.roles.copy)}>{(p) => <Select id={p.id} value={copy} onChange={(e) => setCopy(e.target.value)}><option value="">{t(K.roles.copyNone)}</option>{live.map((r) => <option key={r.id} value={r.id}>{roleName(t, r, lang)}</option>)}</Select>}</Field>
          <Field label={t(K.roles.reason)} hint={`${lettersOf(reason)}/${REASON_MIN_ROLE}`}>{(p) => <TextArea id={p.id} rows={2} value={reason} data-f="role-reason" onChange={(e) => setReason(e.target.value)} />}</Field>
          {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
          <Button data-act="role-create" disabled={lettersOf(name) < 3 || lettersOf(reason) < REASON_MIN_ROLE} loading={s.busy} onClick={() => void create()}>{t(K.roles.create)}</Button>
        </div>
      </Sheet>
      <Sheet open={!!retiring} onClose={() => setRetiring(null)} title={t(K.roles.retire)} closeLabel={t(K.close)}>
        <div className="stack gap-3" data-retire-sheet>
          <Field label={t(K.roles.retireReason)} hint={`${lettersOf(why)}/${REASON_MIN_ROLE}`}>{(p) => <TextArea id={p.id} rows={2} value={why} data-f="retire-reason" onChange={(e) => setWhy(e.target.value)} />}</Field>
          {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
          <Button data-act="retire-do" disabled={lettersOf(why) < REASON_MIN_ROLE} loading={s.busy} onClick={() => void retire()} style={{ color: 'var(--color-error)' }}>{t(K.roles.retireDo)}</Button>
        </div>
      </Sheet>
    </Section>
  );
}

/* ------------------------------------------------------------------ people */

function UsersTab({ s, t, lang }: { s: PermissionsState; t: T; lang: string }) {
  const roles = s.overview?.roles ?? [];
  return (
    <Section title={t(K.users.title)} hint={t(K.users.hint)}>
      <Input value={s.uq} placeholder={t(K.users.search)} aria-label={t(K.users.search)} data-f="user-search" onChange={(e) => s.setUq(e.target.value)} />
      {!s.people ? <LoadingState label={t(K.loading)} variant="list" rows={4} /> : s.people.length === 0 ? <EmptyState title={t(K.users.empty)} body={t(K.users.hint)} actionLabel={t(K.refresh)} onAction={() => void s.refresh()} /> : (
        <div className="grid-auto" data-people>
          {s.people.map((p: PermissionUserRow) => (
            <Card key={p.id}>
              <div className="stack gap-2" data-person={p.id}>
                <div className="row between" style={{ alignItems: 'center', gap: 8 }}><span className="t-sm t-semibold">{p.name}</span><Badge tone="neutral">{t(`role.${p.role}`)}</Badge></div>
                <span className="t-xs t-muted">{p.customRoleIds.map((id) => roles.find((r) => r.id === id)).filter((r): r is PermissionRoleView => !!r).map((r) => roleName(t, r, lang)).join(', ') || '—'}{p.overrides > 0 ? ` · ${t(K.users.overrides, { count: p.overrides })}` : ''}</span>
                {p.isLastAdmin && <Badge tone="warning">{t(K.users.lastAdmin)}</Badge>}
                <div><Button size="sm" variant="secondary" data-act={`open-${p.id}`} onClick={() => s.openUser(p.id)}>{t(K.users.open)}</Button></div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <PersonSheet s={s} t={t} lang={lang} />
    </Section>
  );
}

function PersonSheet({ s, t, lang }: { s: PermissionsState; t: T; lang: string }) {
  const toast = useToast();
  const d = s.detail;
  const roles = s.overview?.roles ?? [];
  const [q, setQ] = useState('');
  const [screen, setScreen] = useState('');
  const [effect, setEffect] = useState<'allow' | 'deny'>('allow');
  const [reason, setReason] = useState('');
  const [until, setUntil] = useState('');
  const [ack, setAck] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [roleWhy, setRoleWhy] = useState('');
  const [acting, setActing] = useState<{ kind: 'review' | 'remove'; id: string } | null>(null);
  const [actWhy, setActWhy] = useState('');
  useEffect(() => { setQ(''); setScreen(''); setReason(''); setUntil(''); setAck(false); setProblem(null); setRoleWhy(''); setActing(null); setActWhy(''); }, [s.openUserId]);
  const governed = useMemo(() => { const seen = new Set<string>(); return s.screens.filter((x) => { if (x.roles === 'public' || seen.has(x.id)) return false; seen.add(x.id); return true; }); }, [s.screens]);
  const matches = useMemo(() => { const w = q.trim().toLowerCase(); return governed.filter((x) => !w || x.id.includes(w) || x.path.toLowerCase().includes(w) || t(x.titleKey, { defaultValue: x.titleKey }).toLowerCase().includes(w)).slice(0, 30); }, [governed, q, t]);
  if (!s.openUserId || !d) return <Sheet open={false} onClose={() => s.openUser(null)} title="" closeLabel={t(K.close)}>{null}</Sheet>;
  const day = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const maxDay = new Date(Date.now() + OVERRIDE_MAX_DAYS * 86_400_000).toISOString().slice(0, 10);
  const selected = governed.find((x) => x.id === screen);
  const high = !!selected && effect === 'allow' && selected.roles !== 'public' && (selected.roles.length === 1 && selected.roles[0] === 'admin' ? d.user.role !== 'admin' : ['customer', 'supplier'].includes(d.user.role) && !selected.roles.includes(d.user.role));
  const fitting = roles.filter((r) => !r.builtIn && !r.retired && r.baseRole === d.user.role);
  const held = new Set(d.customRoles.map((r) => r.id));
  const addOverride = async () => { setProblem(null); const r = await s.setOverride({ targetUserId: d.user.id, screenIds: [screen], effect, reason, until: until ? new Date(`${until}T23:59:59`).toISOString() : null, confirmHighRisk: ack }); if (r.ok) { setScreen(''); setReason(''); setUntil(''); setAck(false); toast.push(t(K.override.added)); } else setProblem(r.problem); };
  const assign = async (roleId: string, on: boolean) => { setProblem(null); const r = await s.assignRole(d.user.id, roleId, on, roleWhy); if (r.ok) { setRoleWhy(''); toast.push(t(K.detail.roleDone)); } else setProblem(r.problem); };
  const doAct = async () => { if (!acting) return; setProblem(null); const r = acting.kind === 'review' ? await s.reviewOverride(acting.id, actWhy) : await s.removeOverride(acting.id, actWhy); if (r.ok) { setActing(null); setActWhy(''); toast.push(acting.kind === 'review' ? t(K.detail.roleDone) : t(K.override.removed)); } else setProblem(r.problem); };
  return (
    <Sheet open onClose={() => s.openUser(null)} title={d.user.name} closeLabel={t(K.close)}>
      <div className="stack gap-4" data-person-sheet={d.user.id}>
        <div className="stack gap-1"><Badge tone="neutral">{t(`role.${d.user.role}`)}</Badge><span className="t-sm" data-allowed-count>{t(K.detail.allowed, { count: d.allowedCount })}</span></div>
        <div className="stack gap-1" data-beyond>
          <span className="t-sm t-semibold">{t(K.detail.beyond)}</span>
          {d.beyond.length === 0 ? <span className="t-xs t-muted">{t(K.detail.none)}</span> : d.beyond.map((b) => <span key={b.screenId} className="t-xs" data-beyond-row={b.screenId}>{screenName(t, b.titleKey, b.screenId)} · {stateText(t, b.allowed)} · {t(`accessControl.source.${b.source}`)}</span>)}
        </div>
        <div className="stack gap-2" data-roles-block>
          <span className="t-sm t-semibold">{t(K.detail.roles)}</span>
          {d.customRoles.length === 0 && <span className="t-xs t-muted">{t(K.detail.noRoles)}</span>}
          {fitting.length === 0 && d.customRoles.length === 0 && <span className="t-xs t-muted">{t(K.detail.noFitting)}</span>}
          {fitting.length > 0 && <Field label={t(K.detail.reason)} hint={`${lettersOf(roleWhy)}/${REASON_MIN_ROLE}`}>{(p) => <Input id={p.id} value={roleWhy} data-f="role-why" onChange={(e) => setRoleWhy(e.target.value)} />}</Field>}
          {fitting.map((r) => (
            <div key={r.id} className="row between" style={{ alignItems: 'center', gap: 8 }}>
              <span className="t-sm">{roleName(t, r, lang)}</span>
              {held.has(r.id) ? <Button size="sm" variant="ghost" data-act={`unassign-${r.id}`} disabled={lettersOf(roleWhy) < REASON_MIN_ROLE} onClick={() => void assign(r.id, false)}>{t(K.detail.unassign)}</Button> : <Button size="sm" variant="secondary" data-act={`assign-${r.id}`} disabled={lettersOf(roleWhy) < REASON_MIN_ROLE} onClick={() => void assign(r.id, true)}>{t(K.detail.assign)}</Button>}
            </div>
          ))}
        </div>
        <div className="stack gap-2" data-override-form>
          <span className="t-sm t-semibold">{t(K.override.title)}</span>
          <p className="t-xs t-muted">{t(K.override.hint)}</p>
          <Field label={t(K.override.find)}>{(p) => <Input id={p.id} value={q} data-f="override-find" onChange={(e) => setQ(e.target.value)} />}</Field>
          <Field label={t(K.override.screen)}>{(p) => <Select id={p.id} value={screen} data-f="override-screen" onChange={(e) => { setScreen(e.target.value); setAck(false); }}><option value="">{t(K.override.pick)}</option>{matches.map((x) => <option key={x.id} value={x.id}>{x.id} · {screenName(t, x.titleKey, x.id)}</option>)}</Select>}</Field>
          <div className="row gap-2" role="group"><Chip pressed={effect === 'allow'} onClick={() => setEffect('allow')}>{t(K.override.allow)}</Chip><Chip pressed={effect === 'deny'} onClick={() => setEffect('deny')}>{t(K.override.deny)}</Chip></div>
          <Field label={t(K.override.reason)} hint={`${lettersOf(reason)}/${REASON_MIN_OVERRIDE}`}>{(p) => <TextArea id={p.id} rows={2} value={reason} data-f="override-reason" onChange={(e) => setReason(e.target.value)} />}</Field>
          <Field label={t(K.override.until)} hint={t(K.override.noEnd)}>{(p) => <Input id={p.id} type="date" min={day} max={maxDay} value={until} data-f="override-until" onChange={(e) => setUntil(e.target.value)} />}</Field>
          {high && <><p className="t-sm" data-high style={{ color: 'var(--color-error)' }}>{t(K.override.highRisk)}</p><Checkbox checked={ack} onChange={setAck} label={t(K.change.confirmHigh)} /></>}
          {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{errText(t, problem)}</p>}
          <Button data-act="override-add" disabled={!screen || lettersOf(reason) < REASON_MIN_OVERRIDE || (high && !ack)} loading={s.busy} onClick={() => void addOverride()}>{t(K.override.add)}</Button>
        </div>
        <div className="stack gap-2" data-overrides>
          <span className="t-sm t-semibold">{t(K.override.list)}</span>
          {d.overrides.length === 0 ? <span className="t-xs t-muted">{t(K.override.none)}</span> : d.overrides.map((o) => {
            const ended = !!o.endedAt;
            const due = o.until && Date.parse(o.until) < Date.parse(o.createdAt) + 90 * 86_400_000 ? o.until : new Date(Date.parse(o.reviewedAt ?? o.createdAt) + 90 * 86_400_000).toISOString();
            return (
              <div key={o.id} className="stack gap-1" data-override={o.id} data-ended={ended}>
                <span className="t-xs t-semibold">{t(K.override.line, { effect: t(o.effect === 'allow' ? K.override.allow : K.override.deny), screen: `${o.screenId} ${screenName(t, governed.find((x) => x.id === o.screenId)?.titleKey ?? o.screenId, o.screenId)}` })}</span>
                <span className="t-xs t-muted">{t(K.override.by, { date: formatDate(o.createdAt, lang), by: o.createdByName, reason: o.reason })}</span>
                {ended ? <span className="t-xs t-muted">{t(`accessControl.override.ended.${o.endedReason ?? 'removed'}`)}</span> : <span className="t-xs t-muted">{o.until ? `${t(K.override.until_on, { date: formatDate(o.until, lang) })} · ` : ''}{t(K.override.dueOn, { date: formatDate(due, lang) })}</span>}
                {o.reviewedAt && <span className="t-xs t-muted">{t(K.override.reviewed, { date: formatDate(o.reviewedAt, lang), by: o.reviewedByName ?? '', note: o.reviewNote ?? '' })}</span>}
                {!ended && (acting?.id === o.id ? (
                  <div className="stack gap-2" data-act-form>
                    <Field label={acting.kind === 'review' ? t(K.override.reviewNote) : t(K.override.removeReason)} hint={`${lettersOf(actWhy)}/${REASON_MIN_ROLE}`}>{(p) => <TextArea id={p.id} rows={2} value={actWhy} data-f="act-why" onChange={(e) => setActWhy(e.target.value)} />}</Field>
                    <div className="row gap-2"><Button variant="ghost" size="sm" onClick={() => setActing(null)}>{t(K.close)}</Button><Button size="sm" data-act="act-do" disabled={lettersOf(actWhy) < REASON_MIN_ROLE} loading={s.busy} onClick={() => void doAct()} style={acting.kind === 'remove' ? { color: 'var(--color-error)' } : undefined}>{acting.kind === 'review' ? t(K.override.reviewDo) : t(K.override.removeDo)}</Button></div>
                  </div>
                ) : (
                  <div className="row gap-2"><Button size="sm" variant="secondary" data-act={`review-${o.id}`} onClick={() => { setProblem(null); setActWhy(''); setActing({ kind: 'review', id: o.id }); }}>{t(K.override.review)}</Button><Button size="sm" variant="ghost" data-act={`remove-${o.id}`} onClick={() => { setProblem(null); setActWhy(''); setActing({ kind: 'remove', id: o.id }); }}>{t(K.override.remove)}</Button></div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ audit */

function AuditTab({ s, t, lang }: { s: PermissionsState; t: T; lang: string }) {
  const kinds = ['all', 'role_grant', 'role_revoke', 'role_reset', 'role_created', 'role_retired', 'role_assigned', 'role_unassigned', 'override_set', 'override_removed', 'override_expired', 'override_reviewed', 'refused'] as const;
  const more = s.log ? s.entries.length < s.log.total : false;
  return (
    <Section title={t(K.audit.title)} hint={t(K.audit.hint)}>
      <Input value={s.af.q} placeholder={t(K.audit.search)} aria-label={t(K.audit.search)} data-f="audit-search" onChange={(e) => s.setAf({ ...s.af, q: e.target.value })} />
      <Select value={s.af.kind} aria-label={t(K.audit.title)} data-f="audit-kind" onChange={(e) => s.setAf({ ...s.af, kind: e.target.value as typeof s.af.kind })}>{kinds.map((k) => <option key={k} value={k}>{k === 'all' ? t(K.audit.all) : t(`accessControl.kind.${k}`)}</option>)}</Select>
      {!s.log ? <LoadingState label={t(K.loading)} variant="list" rows={3} /> : s.entries.length === 0 ? <EmptyState title={t(K.audit.empty)} body={t(K.audit.hint)} actionLabel={t(K.refresh)} onAction={() => void s.refresh()} /> : (
        <div className="stack gap-2" data-audit>
          {s.entries.map((e: PermissionChange) => (
            <Card key={e.id}>
              <div className="stack gap-1" data-entry={e.id} data-kind={e.kind} data-open={s.entryId === e.id}>
                <div className="row between" style={{ alignItems: 'center', gap: 8 }}><span className="t-sm t-semibold">{t(`accessControl.kind.${e.kind}`)}</span><Badge tone={RISK_TONE[e.risk]}>{t(`accessControl.risk.${e.risk}`)}</Badge></div>
                <span className="t-xs t-muted">{t(K.audit.line, { code: e.code, date: formatDate(e.at, lang), by: e.byName })}</span>
                {(e.userName || e.roleLabel) && <span className="t-xs">{t(K.audit.for, { who: e.userName ?? e.roleLabel ?? '' })}{e.userName && e.roleLabel ? ` · ${e.roleLabel}` : ''}</span>}
                {e.screenIds.length > 0 && <span className="t-xs t-muted">{t(K.audit.screens, { ids: e.screenIds.join(', ') })}</span>}
                {e.reason && <span className="t-xs">{e.reason}</span>}
                {e.refusal && <span className="t-xs" style={{ color: 'var(--color-error)' }}>{t(K.audit.refused, { why: errText(t, e.refusal) })}</span>}
              </div>
            </Card>
          ))}
          {more && <div><Button variant="secondary" data-act="audit-more" onClick={() => void s.moreEntries()}>{t(K.audit.more)}</Button></div>}
        </div>
      )}
    </Section>
  );
}
