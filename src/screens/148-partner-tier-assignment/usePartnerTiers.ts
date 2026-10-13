import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { PartnerTierBoardView, PartnerTierDetailView, TierCriteriaView } from '@/data/repository';
import type { TierCriteriaVersion } from '@/data/types';
import { POLL_MS, TABS, TIER_KEYS as K, criteriaDraftKey, partnerPath } from './partner-tiers.types';
import type { Filter, RoleFilter, Tab } from './partner-tiers.types';

export interface ActionResult {
  ok: boolean;
  code?: string;
}
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');
export type PartnerTiersState = ReturnType<typeof usePartnerTiers>;
type Tiers = TierCriteriaVersion['tiers'];

/**
 * Screen 148. Where Admin sets the tier a partner holds. A tier is not a label: it changes what a surveyor earns on a conversion, whether a
 * technician may lead a job, and which payment terms a supplier is on (the repository writes each of those, so there is nothing to keep in
 * step by hand). The criteria are versioned and visible; every change keeps who, why and what the criteria said at the time.
 */
export function usePartnerTiers() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { push } = useToast();
  const { partnerId } = useParams();
  const [params, setParams] = useSearchParams();
  const tab: Tab = (TABS as readonly string[]).includes(params.get('tab') ?? '') ? (params.get('tab') as Tab) : 'partners';
  const [board, setBoard] = useState<PartnerTierBoardView | null>(null);
  const [detail, setDetail] = useState<PartnerTierDetailView | null>(null);
  const [criteria, setCriteria] = useState<TierCriteriaView | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'not_found'>('loading');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [query, setQuery] = useState('');
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      if (partnerId) setDetail(await repository.getPartnerTier(partnerId, user.id));
      else if (tab === 'criteria') setCriteria(await repository.getTierCriteria(user.id));
      else setBoard(await repository.getTierBoard(user.id));
      if (alive.current) setStatus('ready');
    } catch (e) {
      if (!alive.current) return;
      const c = codeOf(e);
      setStatus((s) => (c === 'not_found' ? 'not_found' : s === 'ready' ? s : 'error'));
    }
  }, [repository, user, partnerId, tab]);

  useEffect(() => {
    setDetail(null);
    setStatus('loading');
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const act = async (fn: () => Promise<void>, toastKey?: string): Promise<ActionResult> => {
    setBusy(true);
    try {
      await fn();
      if (toastKey) push(t(toastKey), 'success');
      return { ok: true };
    } catch (e) {
      return { ok: false, code: codeOf(e) };
    } finally {
      if (alive.current) setBusy(false);
    }
  };
  const who = user?.id ?? '';
  const id = partnerId ?? '';

  return {
    status,
    board,
    detail,
    criteria,
    busy,
    partnerId: partnerId ?? null,
    tab,
    setTab: (next: Tab) => setParams((q) => { const n = new URLSearchParams(q); if (next === 'partners') n.delete('tab'); else n.set('tab', next); return n; }, { replace: true }),
    filter,
    setFilter,
    roleFilter,
    setRoleFilter,
    query,
    setQuery,
    userId: who,
    reload: () => {
      setStatus('loading');
      void load();
    },
    open: (pid: string) => navigate(partnerPath(pid)),
    goto: (path: string) => navigate(path),
    back: () => navigate('/partner-tiers'),
    assign: (input: { tier: string; reason: string; effectiveFrom: string; exception?: boolean; incidentAcknowledged?: boolean }) =>
      act(async () => setDetail(await repository.assignPartnerTier(id, input, who)), K.change.saved),
    defer: (input: { until: string; reason: string }) => act(async () => setDetail(await repository.deferTierPromotion(id, input, who)), K.defer.saved),
    keepGrandfathered: (reason: string) => act(async () => setDetail(await repository.reviewGrandfathered(id, reason, who)), K.review.saved),
    raiseDispute: (grounds: string) => act(async () => setDetail(await repository.raiseTierDispute(id, grounds, who)), K.dispute.saved),
    decideDispute: (disputeId: string, input: { outcome: 'tier_stands' | 'tier_changed' | 'criteria_unclear'; note: string; tier?: string; effectiveFrom?: string }) =>
      act(async () => setDetail(await repository.decideTierDispute(disputeId, input, who)), K.dispute.decided),
    publish: (role: 'surveyor' | 'technician', input: { tiers: Tiers; effectiveFrom: string; changeNote: string }) =>
      act(async () => {
        setCriteria(await repository.publishTierCriteria(role, input, who));
        try {
          localStorage.removeItem(criteriaDraftKey(who, role));
        } catch {
          // Nothing kept.
        }
      }, K.criteria.saved),
  };
}
