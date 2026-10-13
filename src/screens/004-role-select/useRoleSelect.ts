import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { Role, SignInRequest, User } from '@/data/types';
import { serverConfigured } from '@/data/supabase/client';
import {
  AUTO_APPROVED_ROLES,
  ONBOARDING_PATH_BY_ROLE,
  STORAGE_PENDING_SELECTION,
} from './role-select.types';
import type { RoleAuditEntry, RoleSelectMode, RoleSelectStatus } from './role-select.types';

interface RoleSelectState {
  mode: RoleSelectMode;
  status: RoleSelectStatus;
  selected: Role | null;
  select: (role: Role) => void;
  /** True when a selection was restored after the app closed mid-flow. */
  resumed: boolean;
  /** True when this applicant was previously rejected for the same role. */
  isReapplication: boolean;
  adminInvited: boolean;
  needsApproval: boolean;
  submit: () => Promise<void>;

  pending: User[];
  audit: RoleAuditEntry[];
  /** Set when another admin changed a record we were also looking at. */
  staleRecordName: string | null;
  clearStale: () => void;
  decide: (user: User, approve: boolean) => Promise<void>;
  /** S1: people who signed in through the server and wait for a role; null when sign-in is not on the server. */
  signInRequests: SignInRequest[] | null;
  decideSignIn: (request: SignInRequest, approve: boolean, role: Role) => Promise<void>;
  reload: () => Promise<void>;
}

/**
 * Owns role assignment from both sides: an applicant asking, and an Admin
 * resolving the queue. Every change writes an audit entry — who, when, and
 * from what to what — because a role change is a permission change.
 */
export function useRoleSelect(): RoleSelectState {
  const navigate = useNavigate();
  const repository = useData();
  const { user, role } = useSession();
  const [searchParams] = useSearchParams();

  const mode: RoleSelectMode = role === 'admin' ? 'adminQueue' : 'applicant';
  const adminInvited = searchParams.get('invite') === 'admin';

  const [status, setStatus] = useState<RoleSelectStatus>('loading');
  const [selected, setSelected] = useState<Role | null>(null);
  const [resumed, setResumed] = useState(false);
  const [isReapplication, setIsReapplication] = useState(false);
  const [pending, setPending] = useState<User[]>([]);
  const [audit, setAudit] = useState<RoleAuditEntry[]>([]);
  const [signInRequests, setSignInRequests] = useState<SignInRequest[] | null>(null);
  const [staleRecordName, setStaleRecordName] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      const askServer = mode === 'adminQueue' && serverConfigured && user;
      const [waiting, trail, requests] = await Promise.all([
        repository.listUsers({ status: 'pending_approval' }),
        repository.listRoleAudit(50),
        askServer ? repository.listSignInRequests(user.id) : Promise.resolve(null),
      ]);
      setPending(waiting);
      setAudit(trail);
      setSignInRequests(requests);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [repository, mode, user]);

  useEffect(() => {
    // Resume exactly where the applicant left off rather than restarting.
    const saved = localStorage.getItem(STORAGE_PENDING_SELECTION) as Role | null;
    if (saved) {
      setSelected(saved);
      setResumed(true);
    }
    setIsReapplication(user?.status === 'rejected');
    void reload();
  }, [reload, user?.status]);

  const select = useCallback((next: Role) => {
    setSelected(next);
    setResumed(false);
    localStorage.setItem(STORAGE_PENDING_SELECTION, next);
  }, []);

  const submit = useCallback(async () => {
    if (!selected) return;
    setStatus('submitting');
    try {
      await repository.recordRoleRequest({
        userId: user?.id ?? null,
        userName: user?.name ?? '',
        previousRole: user?.role ?? null,
        newRole: selected,
        isReapplication,
      });
    } catch {
      // The request is also visible as the pending account itself; a missed
      // audit line must not stop someone from reaching their onboarding.
    }
    localStorage.removeItem(STORAGE_PENDING_SELECTION);
    // Selecting a role opens that role's onboarding, never the role's home —
    // the account is not live until it is approved.
    navigate(ONBOARDING_PATH_BY_ROLE[selected]);
  }, [selected, user, isReapplication, navigate, repository]);

  const decide = useCallback(
    async (target: User, approve: boolean) => {
      if (!user) return;
      setStatus('submitting');
      try {
        // The repository refuses when someone else decided first, so two
        // admins can never overwrite each other's decision.
        await repository.decidePendingUser(target.id, approve, user.id);
        await reload();
      } catch (err) {
        if (err instanceof Error && err.message === 'not_pending') {
          setStaleRecordName(target.name);
          await reload();
          return;
        }
        setStatus('error');
      }
    },
    [repository, user, reload],
  );

  const decideSignIn = useCallback(
    async (request: SignInRequest, approve: boolean, chosen: Role) => {
      if (!user) return;
      setStatus('submitting');
      try {
        // The server refuses when someone else decided first (`not_pending`), and keeps the decision in its audit trail.
        await repository.decideSignInRequest(request.id, { approve, role: chosen }, user.id);
        await reload();
      } catch (err) {
        if (err instanceof Error && err.message === 'not_pending') {
          setStaleRecordName(request.name || request.phone);
          await reload();
          return;
        }
        setStatus('error');
      }
    },
    [repository, user, reload],
  );

  return {
    mode,
    status,
    selected,
    select,
    resumed,
    isReapplication,
    adminInvited,
    needsApproval: selected ? !AUTO_APPROVED_ROLES.includes(selected) : false,
    submit,
    pending,
    audit,
    staleRecordName,
    clearStale: () => setStaleRecordName(null),
    decide,
    signInRequests,
    decideSignIn,
    reload,
  };
}
