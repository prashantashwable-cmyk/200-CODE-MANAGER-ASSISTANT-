import type { Role } from '@/data/types';
import type { DecisionCard, DecisionEvidence, DecisionRecord, DecisionStatusRow } from '@/features/decisions/decisions';
import type { DecisionAction, DecisionKind, DecisionStatus } from '@/features/authority/authority';
import type { ChainCheck } from '@/features/audit/chain';

/** Row shapes as the database returns them (supabase/migrations/20261014000003_decisions.sql). */
export interface CardRow {
  id: string; code: string; kind: DecisionKind; title: string; summary: string; status: DecisionStatus;
  proposed_by_kind: 'owner' | 'admin' | 'system' | 'ai'; proposed_by: string | null; proposed_by_name: string; amount_inr: number | null;
  place: DecisionCard['place'] | null; evidence: DecisionEvidence[]; impact: string[]; ai: DecisionCard['ai'] | null;
  delegated_to: string | null; is_demo: boolean; created_at: string; decided_at: string | null;
}
export type StatusRow = Pick<CardRow, 'id' | 'code' | 'kind' | 'title' | 'status' | 'proposed_by_kind' | 'proposed_by_name' | 'created_at' | 'decided_at' | 'is_demo'>;
export interface RecordRow {
  seq: number; id: string; card_id: string; event_type: string; action: DecisionAction; by_profile: string; by_role: Role; as_kind: 'owner' | 'delegate';
  reason: string; edits: string | null; delegate_to: string | null; at: string; prev_hash: string; hash: string;
}

const proposer = (kind: CardRow['proposed_by_kind'], userId: string | null, name: string): DecisionCard['proposedBy'] => ({ role: kind === 'owner' ? 'owner' : kind === 'admin' ? 'admin' : kind, ...(userId ? { userId } : {}), name });

export const cardFromRow = (r: CardRow): DecisionCard => ({
  id: r.id, code: r.code, kind: r.kind, title: r.title, summary: r.summary, status: r.status, proposedBy: proposer(r.proposed_by_kind, r.proposed_by, r.proposed_by_name),
  createdAt: r.created_at, ...(r.decided_at ? { decidedAt: r.decided_at } : {}), ...(r.amount_inr != null ? { amountInr: Number(r.amount_inr) } : {}),
  ...(r.place ? { place: r.place } : {}), evidence: r.evidence ?? [], impact: r.impact ?? [], ...(r.ai ? { ai: r.ai } : {}), ...(r.delegated_to ? { delegatedTo: r.delegated_to } : {}), isDemo: r.is_demo,
});

export const statusRowFromRow = (r: StatusRow): DecisionStatusRow => ({
  id: r.id, code: r.code, kind: r.kind, title: r.title, status: r.status, createdAt: r.created_at, ...(r.decided_at ? { decidedAt: r.decided_at } : {}),
  proposedBy: proposer(r.proposed_by_kind, null, r.proposed_by_name), isDemo: r.is_demo,
});

export const recordFromRow = (r: RecordRow): DecisionRecord => ({
  id: r.id, seq: Number(r.seq), cardId: r.card_id, eventType: r.event_type, action: r.action, byUserId: r.by_profile, byRole: r.by_role, as: r.as_kind, reason: r.reason,
  ...(r.edits ? { edits: r.edits } : {}), ...(r.delegate_to ? { delegateTo: r.delegate_to } : {}), at: r.at, prevHash: r.prev_hash, hash: r.hash,
});

export const chainFrom = (rows: { ok: boolean; checked: number | string; broken_at: number | string | null }[], headHash: string): ChainCheck => {
  const r = rows[0];
  return { ok: r?.ok ?? false, count: Number(r?.checked ?? 0), headHash, brokenAtSeq: r?.broken_at == null ? null : Number(r.broken_at) };
};

export function decisionErrorCode(message: string): string {
  return /admin_cannot_decide|already_decided|reason_short|edits_missing|delegate_missing|action_invalid|title_short|summary_short|amount_invalid|kind_invalid|not_found|forbidden|permission denied|row-level security/.exec(message)?.[0]
    .replace('permission denied', 'forbidden').replace('row-level security', 'forbidden') ?? 'network';
}
