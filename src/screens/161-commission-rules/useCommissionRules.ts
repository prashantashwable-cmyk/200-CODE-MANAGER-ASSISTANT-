import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { CommissionChangePreview, CommissionRulesView, CommissionSimulationView } from '@/data/repository';
import type { CommissionParams, CommissionRuleId, SimInput } from '@/features/commission/rules';
import { isRuleId } from '@/features/commission/rules';
import { VIEWS } from './commission-rules.types';
import type { View } from './commission-rules.types';

export interface ActionResult<V = undefined> {
  ok: boolean;
  code?: string;
  value?: V;
}
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');
export type CommissionRulesState = ReturnType<typeof useCommissionRules>;

/**
 * Screen 161. The one place every commission rate is set. It reads the rules (versioned, with the tiers they read from the partner tiers), tries a deal against them
 * (and against a proposed change) before anyone is affected, and publishes a change as a new version that applies from its own day and never reaches back.
 */
export function useCommissionRules() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const view: View = (VIEWS as readonly string[]).includes(params.get('view') ?? '') ? (params.get('view') as View) : 'rules';
  const ruleParam = params.get('rule');
  const openRuleId: CommissionRuleId | null = ruleParam && isRuleId(ruleParam) ? ruleParam : null;
  const [data, setData] = useState<CommissionRulesView | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const v = await repository.getCommissionRules(user.id);
      if (alive.current) { setData(v); setStatus('ready'); }
    } catch {
      if (alive.current) setStatus((s) => (s === 'ready' ? s : 'error'));
    }
  }, [repository, user]);
  useEffect(() => { setStatus((s) => (s === 'ready' ? s : 'loading')); void load(); const id = window.setInterval(() => void load(), 60_000); return () => window.clearInterval(id); }, [load]);

  const patchParams = (fn: (n: URLSearchParams) => void) => setParams((prev) => { const n = new URLSearchParams(prev); fn(n); return n; }, { replace: true });

  return {
    status,
    data,
    view,
    openRuleId,
    refreshing,
    busy,
    userId: user?.id ?? '',
    setView: (v: View) => patchParams((n) => { if (v === 'rules') n.delete('view'); else n.set('view', v); n.delete('rule'); }),
    openRule: (id: CommissionRuleId | null) => patchParams((n) => { if (id) n.set('rule', id); else n.delete('rule'); }),
    goTo: (path: string) => navigate(path),
    refresh: async () => { setRefreshing(true); try { await load(); } finally { if (alive.current) setRefreshing(false); } },
    simulate: async (input: SimInput, proposal: { ruleId: CommissionRuleId; params: CommissionParams }[] | null): Promise<ActionResult<CommissionSimulationView>> => {
      try { return { ok: true, value: await repository.simulateCommission(input, proposal, user?.id ?? '') }; } catch (e) { return { ok: false, code: codeOf(e) }; }
    },
    preview: async (ruleId: CommissionRuleId, p: CommissionParams, effectiveFrom: string): Promise<ActionResult<CommissionChangePreview>> => {
      try { return { ok: true, value: await repository.previewCommissionChange(ruleId, p, effectiveFrom, user?.id ?? '') }; } catch (e) { return { ok: false, code: codeOf(e) }; }
    },
    publish: async (ruleId: CommissionRuleId, input: { params: CommissionParams; effectiveFrom: string; reason: string; notice: { message: string } | null; acknowledged: string[] }): Promise<ActionResult<CommissionRulesView>> => {
      setBusy(true);
      try {
        const value = await repository.publishCommissionRule(ruleId, input, user?.id ?? '');
        if (alive.current) setData(value);
        return { ok: true, value };
      } catch (e) { return { ok: false, code: codeOf(e) }; } finally { if (alive.current) setBusy(false); }
    },
  };
}
