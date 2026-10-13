import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { normalizeSkills } from '@/features/qc/inspectors';
import { CheckCircle, Lock, XCircle } from '@phosphor-icons/react';
import {
  ActionBar,
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  ListRow,
  LoadingState,
  Select,
  formatPhone,
  formatDate,
  formatDateTime,
} from '@/design-system';
import type { Role, SignInRequest } from '@/data/types';
import { useRoleSelect } from './useRoleSelect';
import { ROLE_SELECT_KEYS as K, SELECTABLE_ROLES } from './role-select.types';

/**
 * Screen 004 — Role Selection.
 *
 * An applicant sees role tiles. An Admin sees every pending request in one
 * place, plus the audit trail of who changed what.
 */
export function RoleSelectView() {
  const { t, i18n } = useTranslation();
  const s = useRoleSelect();
  const navigate = useNavigate();

  if (s.status === 'loading') {
    return (
      <div className="ds-screen ds-screen--narrow">
        <LoadingState label={t(K.loading)} variant="cards" rows={4} />
      </div>
    );
  }

  if (s.status === 'error') {
    return (
      <div className="ds-screen ds-screen--narrow">
        <ErrorState
          title={t(K.error.title)}
          body={t(K.error.body)}
          retryLabel={t('action.retry')}
          onRetry={() => void s.reload()}
        />
      </div>
    );
  }

  if (s.mode === 'adminQueue') {
    return (
      <div className="ds-screen ds-screen--narrow">
        <div className="ds-screen-header">
          <h1 className="ds-screen-header__title">{t(K.queue.title)}</h1>
          <p className="ds-screen-header__subtitle">{t(K.queue.subtitle)}</p>
        </div>

        {s.staleRecordName && (
          <Card className="mb-3">
            <p className="t-sm t-warning" role="status">
              {t(K.queue.changedElsewhere, { name: s.staleRecordName })}
            </p>
            <div className="mt-2">
              <Button size="sm" variant="quiet" onClick={s.clearStale}>
                {t('action.close')}
              </Button>
            </div>
          </Card>
        )}

        {s.signInRequests && (
          <section className="mb-4" data-signin-requests>
            <h2 className="t-lg mb-1">{t(K.signIn.title)}</h2>
            <p className="t-sm t-muted mb-2">{t(K.signIn.subtitle)}</p>
            {s.signInRequests.length === 0 ? (
              <Card body={t(K.signIn.empty)} />
            ) : (
              <div className="stack gap-3">
                {s.signInRequests.map((r) => (
                  <SignInRequestCard key={r.id} request={r} onDecide={s.decideSignIn} />
                ))}
              </div>
            )}
          </section>
        )}

        {s.pending.length === 0 ? (
          <EmptyState title={t(K.queue.emptyTitle)} body={t(K.queue.emptyBody)} />
        ) : (
          <div className="stack gap-3">
            {s.pending.map((person) => {
              const o = person.onboarding;
              const lines: string[] = [];
              if (person.city || person.joinedAt) lines.push(t(K.queue.details, { city: person.city ?? '—', date: person.joinedAt ? formatDate(person.joinedAt, i18n.language) : '—' }));
              if (o?.preferredZoneIds?.length) lines.push(t(K.queue.zones, { count: o.preferredZoneIds.length }));
              if (person.role === 'technician' && person.skills?.length) lines.push(t(K.queue.certified, { list: normalizeSkills(person.skills).map((id) => t(`partnerDir.skill.${id}`, { defaultValue: id })).join(', ') }));
              if (o?.unverifiedSkills?.length) lines.push(t(K.queue.uncertified, { list: o.unverifiedSkills.map((id) => t(`partnerDir.skill.${id}`, { defaultValue: id })).join(', ') }));
              if (o?.aadhaarLast4) lines.push(t(K.queue.aadhaar, { last4: o.aadhaarLast4 }));
              if (o?.panNumber) lines.push(t(K.queue.pan, { pan: o.panNumber }));
              if (o?.bankVerified !== undefined) lines.push(t(o.bankVerified ? K.queue.bankVerified : K.queue.bankUnverified));
              return (
                <Card key={person.id}>
                  <div className="row gap-3">
                    <Avatar name={person.name} />
                    <div className="grow stack gap-1" style={{ minWidth: 0 }}>
                      <span className="t-medium">{person.name}</span>
                      <span className="t-xs t-muted">{t(K.queue.appliedAs, { role: t(`role.${person.role}`) })}</span>
                    </div>
                    {o?.reapplication && <Badge tone="warning">{t(K.reapplication)}</Badge>}
                  </div>
                  {lines.length > 0 && (
                    <ul className="stack gap-1 mt-3 t-xs t-muted">
                      {lines.map((line) => <li key={line}>{line}</li>)}
                    </ul>
                  )}
                  <div className="row gap-2 mt-3" style={{ justifyContent: 'flex-end' }}>
                    {person.role === 'supplier' ? (
                      <Button size="sm" variant="ghost" onClick={() => navigate('/admin/suppliers')}>
                        {t(K.queue.supplierKyc)}
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" variant="ghost" icon={<XCircle size={16} />} onClick={() => void s.decide(person, false)}>
                          {t(K.queue.rejected)}
                        </Button>
                        <Button size="sm" icon={<CheckCircle size={16} />} onClick={() => void s.decide(person, true)}>
                          {t(K.queue.approved)}
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <h2 className="t-lg mt-5 mb-2">{t(K.queue.auditTitle)}</h2>
        {s.audit.length === 0 ? (
          <Card body={t(K.queue.auditEmpty)} />
        ) : (
          <Card flush>
            {s.audit.slice(0, 12).map((entry) => (
              <ListRow
                key={entry.id}
                title={
                  entry.decision
                    ? t(K.queue.auditDecision, { name: entry.userName, role: t(`role.${entry.newRole}`), decision: t(K.queue.decision[entry.decision]) })
                    : t(K.queue.auditEntry, {
                        name: entry.userName || '—',
                        from: entry.previousRole ? t(`role.${entry.previousRole}`) : '—',
                        to: t(`role.${entry.newRole}`),
                      })
                }
                subtitle={formatDateTime(entry.at, i18n.language)}
                trailing={
                  entry.isReapplication ? (
                    <Badge tone="warning">{t(K.reapplication)}</Badge>
                  ) : undefined
                }
              />
            ))}
          </Card>
        )}
      </div>
    );
  }

  // ---- Applicant view -----------------------------------------------------
  return (
    <div className="ds-screen ds-screen--narrow stack pb-action-bar" style={{ minHeight: '100dvh' }}>
      <div className="ds-screen-header mt-4">
        <h1 className="ds-screen-header__title t-balance">{t(K.title)}</h1>
        <p className="ds-screen-header__subtitle">{t(K.subtitle)}</p>
      </div>

      {s.resumed && (
        <Card className="mb-3">
          <p className="t-sm t-muted" role="status">
            {t(K.resumed)}
          </p>
        </Card>
      )}
      {s.isReapplication && (
        <Card className="mb-3">
          <p className="t-sm t-warning">{t(K.reapplication)}</p>
        </Card>
      )}

      <div className="stack gap-2 grow">
        {SELECTABLE_ROLES.map((role: Role, index) => (
          <Card
            key={role}
            riseIndex={index}
            selected={s.selected === role}
            onClick={() => s.select(role)}
          >
            <div className="row between gap-3">
              <span className="stack gap-1 grow">
                <span className="t-md t-semibold">{t(`role.${role}`)}</span>
                <span className="t-xs t-muted">
                  {t(K.description[role as keyof typeof K.description])}
                </span>
              </span>
              {s.selected === role && (
                <CheckCircle size={22} weight="fill" className="t-accent shrink-0" />
              )}
            </div>
          </Card>
        ))}

        {/* Admin is never self-selectable — it only appears on an invite. */}
        <Card selected={false}>
          <div className="row between gap-3">
            <span className="stack gap-1 grow">
              <span className="t-md t-semibold t-muted">{t('role.admin')}</span>
              <span className="t-xs t-muted">{t(K.description.admin)}</span>
            </span>
            {!s.adminInvited && <Lock size={18} className="t-muted shrink-0" />}
          </div>
          {!s.adminInvited && <p className="t-xs t-muted mt-2">{t(K.adminLocked)}</p>}
        </Card>
      </div>

      {s.selected && (
        <p className="t-xs t-muted t-center mt-3">
          {s.needsApproval ? t(K.approvalNeeded) : t(K.autoApproved)}
        </p>
      )}

      <ActionBar>
        <Button
          block
          disabled={!s.selected}
          loading={s.status === 'submitting'}
          onClick={s.submit}
        >
          {t(K.continue)}
        </Button>
      </ActionBar>
    </div>
  );
}

/** S1: one person who signed in through the server and waits for Admin to say what they are. */
function SignInRequestCard({ request: r, onDecide }: { request: SignInRequest; onDecide: (r: SignInRequest, approve: boolean, role: Role) => Promise<void> }) {
  const { t, i18n } = useTranslation();
  const [role, setRole] = useState<Role>(r.requestedRole ?? 'customer');
  const selectId = `signin-role-${r.id}`;
  return (
    <Card>
      <div className="row gap-3">
        <Avatar name={r.name || r.phone} />
        <div className="grow stack gap-1" style={{ minWidth: 0 }}>
          <span className="t-medium num">{r.name || formatPhone(r.phone.replace(/\D/g, '').slice(-10))}</span>
          <span className="t-xs t-muted">
            {r.requestedRole ? t(K.signIn.asked, { role: t(`role.${r.requestedRole}`) }) : t(K.signIn.notAsked)}
            {' · '}
            {t(K.signIn.since, { date: formatDateTime(r.waitingSince, i18n.language) })}
          </span>
        </div>
      </div>
      <div className="stack gap-1 mt-3">
        <label className="t-xs t-muted" htmlFor={selectId}>{t(K.signIn.giveRole)}</label>
        <Select id={selectId} value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {SELECTABLE_ROLES.map((x) => (
            <option key={x} value={x}>{t(`role.${x}`)}</option>
          ))}
        </Select>
      </div>
      <div className="row gap-2 mt-3" style={{ justifyContent: 'flex-end' }}>
        <Button size="sm" variant="ghost" icon={<XCircle size={16} />} onClick={() => void onDecide(r, false, role)}>
          {t(K.queue.rejected)}
        </Button>
        <Button size="sm" icon={<CheckCircle size={16} />} onClick={() => void onDecide(r, true, role)}>
          {t(K.queue.approved)}
        </Button>
      </div>
    </Card>
  );
}
