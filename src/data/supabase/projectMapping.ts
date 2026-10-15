import type { HandoverRole } from '@/features/projects/project';
import type { ProjectView } from '@/features/projects/types';
import type { WorkOrderView } from '@/features/workorders/types';

/** What the database function public.project_view returns (supabase/migrations/20261015000004_handover_record.sql). */
export interface ProjectJson {
  quoteId: string; siteName: string; percent: number;
  amounts: { verifiedInr: number | string; paidInr: number | string; totalInr: number | string } | null;
  ready: boolean; qcMissing: boolean; complete: boolean;
  parties: { role: HandoverRole; accountId: string; name: string; signed: boolean }[];
}

/** The same shape the in-memory repository gives. What the caller may do next is worked out here; the database still refuses anything not allowed. */
export function projectFromJson(j: ProjectJson, orders: WorkOrderView[], code: string | undefined, callerId: string): ProjectView {
  const mineUnsigned = j.parties.some((p) => p.accountId === callerId && !p.signed);
  return {
    quoteId: j.quoteId, code: code ?? j.quoteId.slice(0, 8), siteName: j.siteName, percent: Number(j.percent),
    amounts: j.amounts ? { verifiedInr: Number(j.amounts.verifiedInr), paidInr: Number(j.amounts.paidInr), totalInr: Number(j.amounts.totalInr) } : null,
    orders: orders.filter((o) => o.quoteId === j.quoteId).map((o) => ({ id: o.id, code: o.code, kind: o.kind, partnerName: o.partnerName, status: o.status })),
    handover: {
      ready: j.ready, qcMissing: j.qcMissing, complete: j.complete,
      parties: j.parties.map((p) => ({ ...p, mine: p.accountId === callerId })),
      canAcknowledge: mineUnsigned && j.ready && !j.qcMissing,
    },
  };
}
