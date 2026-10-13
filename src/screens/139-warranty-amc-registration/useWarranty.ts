import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { WarrantyBoardView, WarrantyView } from '@/data/repository';
import type { AmcTierId } from '@/features/qc/warranty';
import type { Choice, WarrantyStatus } from './warranty.types';
import { POLL_MS, WARRANTY_KEYS as K, draftKey } from './warranty.types';

export interface ActionResult {
  ok: boolean;
  code?: string;
}
export interface Draft {
  choice: Choice | '';
  tier: AmcTierId | '';
  extra: string;
  note: string;
}
const EMPTY: Draft = { choice: '', tier: '', extra: '0', note: '' };
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');

function readDraft(key: string): Draft | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Draft>) } : null;
  } catch {
    return null;
  }
}

export type WarrantyState = ReturnType<typeof useWarranty>;

/**
 * Screen 139. The warranty (from what was sold and what was installed, three layers kept distinct) and the optional AMC, registered once the
 * handover walkthrough is done. Registering freezes the terms, records the AMC choice and sets up every renewal and re-engagement reminder by
 * itself. A customer who postponed or declined AMC can enrol later from here; an AMC can be renewed a term at a time.
 */
export function useWarranty() {
  const repository = useData();
  const { user } = useSession();
  const { jobId } = useParams();
  const { t } = useTranslation();
  const { push } = useToast();
  const navigate = useNavigate();
  const [view, setView] = useState<WarrantyView | null>(null);
  const [board, setBoard] = useState<WarrantyBoardView | null>(null);
  const [status, setStatus] = useState<WarrantyStatus>('loading');
  const [busy, setBusy] = useState(false);
  const dKey = user && jobId ? draftKey(user.id, jobId) : '';
  const [draft, setDraftState] = useState<Draft>(() => (dKey ? (readDraft(dKey) ?? EMPTY) : EMPTY));
  const [restored, setRestored] = useState<boolean>(() => !!(dKey && readDraft(dKey)));

  const load = useCallback(async () => {
    if (!user) return;
    try {
      if (jobId) setView(await repository.getWarranty(jobId, user.id));
      else setBoard(await repository.getWarrantyBoard(user.id));
      setStatus('ready');
    } catch (e) {
      const c = codeOf(e);
      if (c === 'not_found' || c === 'forbidden') setStatus('not_found');
      else setStatus((s) => (s === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, jobId]);

  useEffect(() => {
    setView(null);
    setBoard(null);
    setStatus('loading');
    const kept = dKey ? readDraft(dKey) : null;
    setDraftState(kept ?? EMPTY);
    setRestored(!!kept);
    void load();
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load, dKey]);

  useEffect(() => {
    if (!dKey) return;
    try {
      if (JSON.stringify(draft) === JSON.stringify(EMPTY)) localStorage.removeItem(dKey);
      else localStorage.setItem(dKey, JSON.stringify(draft));
    } catch {
      // Not kept.
    }
  }, [dKey, draft]);

  const guard = async (fn: () => Promise<unknown>, okKey?: string): Promise<ActionResult> => {
    if (!navigator.onLine) return { ok: false, code: 'offline' };
    setBusy(true);
    try {
      await fn();
      await load();
      if (okKey) push(t(okKey), 'success');
      return { ok: true };
    } catch (e) {
      return { ok: false, code: codeOf(e) };
    } finally {
      setBusy(false);
    }
  };
  const uid = user?.id ?? '';
  const id = jobId ?? '';

  return {
    status,
    jobId: jobId ?? null,
    view,
    board,
    busy,
    reload: () => {
      setStatus('loading');
      void load();
    },
    draft,
    restored,
    setDraft: (patch: Partial<Draft>) => {
      setRestored(false);
      setDraftState((d) => ({ ...d, ...patch }));
    },
    clearDraft: () => setDraftState(EMPTY),
    register: () =>
      guard(async () => {
        await repository.registerWarrantyAndAmc(id, { choice: draft.choice as Choice, ...(draft.choice === 'enrol' && draft.tier ? { tier: draft.tier } : {}), ...(Number(draft.extra) > 0 ? { extraVisits: Number(draft.extra) } : {}), ...(draft.note.trim() ? { note: draft.note } : {}) }, uid);
        setDraftState(EMPTY);
      }, K.register.toast),
    enrol: (tier: AmcTierId, extraVisits: number, note: string) => guard(() => repository.enrolAmc(id, { tier, ...(extraVisits > 0 ? { extraVisits } : {}), ...(note.trim() ? { note } : {}) }, uid), K.registered.enrolToast),
    renew: () => guard(() => repository.renewAmc(id, uid), K.registered.renewToast),
    goto: (path: string, replace = false) => navigate(path, { replace }),
  };
}
