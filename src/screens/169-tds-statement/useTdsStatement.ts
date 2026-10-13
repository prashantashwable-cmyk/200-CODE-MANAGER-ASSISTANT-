import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { TdsAdminView, TdsCertificateView, TdsExportRow, TdsPartnerView, TdsProblem } from '@/data/repository';
import type { TdsSection } from '@/features/tax/tds';

export type TdsStatementState = ReturnType<typeof useTdsStatement>;
export type TdsResult = { ok: true } | { ok: false; problem: string };
const PROBLEMS = ['rate_invalid', 'threshold_invalid', 'date_invalid', 'date_past', 'date_far', 'reason_short', 'before_current', 'bsr_invalid', 'serial_invalid', 'amount_invalid', 'ack_invalid', 'pan_invalid', 'nothing_to_file', 'not_found', 'forbidden'];
const problemOf = (e: unknown): string => { const m = e instanceof Error ? e.message : ''; return PROBLEMS.includes(m) ? m : 'generic'; };

/**
 * Screen 169. The tax deducted at source from partner payouts. A partner reads their own statement and certificates (a quarter's is provisional until the return is filed); Admin
 * reads the aggregate to deposit and file, schedules rate changes and records PANs. Everything comes from the payout ledger through the repository; the year is kept in the address.
 */
export function useTdsStatement() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const fy = params.get('fy');
  const admin = user?.role === 'admin';
  const [partner, setPartner] = useState<TdsPartnerView | null>(null);
  const [aggregate, setAggregate] = useState<TdsAdminView | null>(null);
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const read = useCallback(async () => {
    if (!user) return;
    try {
      if (admin) { const v = await repository.getTdsAdmin(fy, user.id); if (alive.current) { setAggregate(v); setLoad('ready'); } }
      else { const v = await repository.getTdsStatement(fy, user.id); if (alive.current) { setPartner(v); setLoad('ready'); } }
    } catch { if (alive.current) setLoad((s) => (s === 'ready' ? s : 'error')); }
  }, [repository, user, admin, fy]);
  useEffect(() => { setLoad((s) => (s === 'ready' ? s : 'loading')); void read(); const id = window.setInterval(() => void read(), 60_000); return () => window.clearInterval(id); }, [read]);

  const run = async (fn: (adminId: string) => Promise<unknown>): Promise<TdsResult> => {
    if (!user) return { ok: false, problem: 'forbidden' };
    try { await fn(user.id); await read(); return { ok: true }; } catch (e) { await read(); return { ok: false, problem: problemOf(e) }; }
  };
  return {
    load, partner, aggregate, admin, fy: partner?.fy ?? aggregate?.fy ?? fy, refreshing,
    setFy: (id: string) => setParams((prev) => { const n = new URLSearchParams(prev); n.set('fy', id); return n; }, { replace: true }),
    goTo: (path: string) => navigate(path),
    refresh: async () => { setRefreshing(true); try { await read(); } finally { if (alive.current) setRefreshing(false); } },
    certificate: async (year: string, quarter: 0 | 1 | 2 | 3 | 4): Promise<TdsCertificateView | null> => { if (!user) return null; try { return await repository.getTdsCertificate(year, quarter, user.id); } catch { return null; } },
    exportRows: async (year: string, quarter: 0 | 1 | 2 | 3 | 4): Promise<TdsExportRow[]> => { if (!user) return []; try { return await repository.getTdsExport(year, quarter, user.id); } catch { return []; } },
    deposit: (month: string, input: { bsr: string; serial: string; date: string; amount: number }) => run((a) => repository.recordTdsDeposit(month, input, a)),
    fileReturn: (year: string, quarter: 1 | 2 | 3 | 4, input: { ack: string; filedAt: string }) => run((a) => repository.recordTdsReturn(year, quarter, input, a)),
    scheduleRate: (section: TdsSection, input: { rate: number; threshold: number; effectiveFrom: string; reason: string }) => run((a) => repository.scheduleTdsRate(section, input, a)),
    recordPan: (userId: string, pan: string) => run((a) => repository.recordPartnerPan(userId, pan, a)),
  };
}
export type { TdsProblem };
