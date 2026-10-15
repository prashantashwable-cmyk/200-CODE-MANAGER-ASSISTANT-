import { GENESIS, hashOf, verifyChain } from '@/features/audit/chain';
import type { ChainCheck } from '@/features/audit/chain';
import type { Role } from '@/data/types';
import { canDecide, canPrepareDecisionPacket, canSeeDecisionDetail, canSeeDecisionStatus, decisionProblem, statusAfter } from '@/features/authority/authority';
import type { DecisionAction, DecisionKind, DecisionStatus, DelegateGrant } from '@/features/authority/authority';

/**
 * The Owner's Decision Desk (P1, P4): cards the Owner approves, rejects, edits,
 * asks more about, or delegates. Every decision becomes an immutable, hash-
 * chained record. Admin sees status only and may prepare packets; nothing Admin
 * prepares takes effect until the Owner decides.
 *
 * The store holds state and asks `authority.ts` who may do what. It is
 * constructed with its dependencies so a server-backed version can replace it.
 */

export interface DecisionEvidence { label: string; kind: 'photo' | 'document' | 'map' | 'log' | 'note' }

export interface DecisionRecord {
  id: string;
  seq: number;
  cardId: string;
  /** Event type in the platform taxonomy, e.g. `decision.approved`. */
  eventType: string;
  action: DecisionAction;
  byUserId: string;
  byRole: Role;
  as: 'owner' | 'delegate';
  reason: string;
  edits?: string;
  delegateTo?: string;
  at: string;
  prevHash: string;
  hash: string;
}

export interface DecisionCard {
  id: string;
  code: string;
  kind: DecisionKind;
  title: string;
  summary: string;
  status: DecisionStatus;
  proposedBy: { role: Role | 'ai' | 'system'; userId?: string; name: string };
  createdAt: string;
  decidedAt?: string;
  /** Rupees at stake, when an amount applies (a delegate's limit is checked against it). */
  amountInr?: number;
  /** Where on the map the card is pinned. */
  place?: { lat: number; lng: number; label: string };
  evidence: DecisionEvidence[];
  /** What the decision would change, written before the Owner decides. */
  impact: string[];
  ai?: { action: DecisionAction; confidence: number; model: string };
  delegatedTo?: string;
  /** Flags raised by the Admin on the way in. */
  isDemo: boolean;
}

/** Admin's view: that a decision exists and where it stands. No evidence, impact, amounts or AI notes. */
export type DecisionStatusRow = Pick<DecisionCard, 'id' | 'code' | 'kind' | 'title' | 'status' | 'createdAt' | 'decidedAt' | 'proposedBy' | 'isDemo'>;

export type DecisionView = { level: 'detail'; card: DecisionCard; records: DecisionRecord[] } | { level: 'status'; card: DecisionStatusRow };

export interface PacketInput {
  kind: DecisionKind;
  title: string;
  summary: string;
  amountInr?: number;
  place?: DecisionCard['place'];
  evidence?: DecisionEvidence[];
  impact?: string[];
  /** Admin's recommended action, shown to the Owner as a recommendation only. */
  recommendation?: string;
}

export interface DecisionInput { cardId: string; action: DecisionAction; reason: string; edits?: string; delegateTo?: string }

export class DecisionError extends Error {
  constructor(public code: string) { super(code); this.name = 'DecisionError'; }
}

export interface StoreDeps {
  now: () => string;
  roleOf: (userId: string) => Role | null;
  nameOf: (userId: string) => string;
}

const TITLE_MIN = 8;
const SUMMARY_MIN = 20;
const DELEGATION_DAYS = 7;

export function createDecisionStore(seed: DecisionCard[], deps: StoreDeps) {
  const cards = new Map<string, DecisionCard>(seed.map((c) => [c.id, c]));
  const records: DecisionRecord[] = [];
  let cardCounter = seed.length;
  let recordCounter = 0;

  const asStatus = (c: DecisionCard): DecisionStatusRow => ({ id: c.id, code: c.code, kind: c.kind, title: c.title, status: c.status, createdAt: c.createdAt, ...(c.decidedAt ? { decidedAt: c.decidedAt } : {}), proposedBy: c.proposedBy, isDemo: c.isDemo });
  const recordsOf = (cardId: string): DecisionRecord[] => records.filter((r) => r.cardId === cardId);
  const role = (userId: string): Role => {
    const r = deps.roleOf(userId);
    if (!r) throw new DecisionError('not_found');
    return r;
  };

  /** A person the Owner delegated this card to holds a grant for exactly this kind, for a week, up to the matrix limit. */
  const grantFor = (card: DecisionCard, userId: string): DelegateGrant | null => {
    if (card.delegatedTo !== userId) return null;
    const delegatedAt = [...recordsOf(card.id)].reverse().find((r) => r.action === 'delegate')?.at ?? card.createdAt;
    return { kinds: [card.kind], maxAmountInr: null, expiresAt: new Date(Date.parse(delegatedAt) + DELEGATION_DAYS * 86_400_000).toISOString(), revoked: false };
  };

  return {
    /** Owner: every card in full. Admin: status rows. Others: only cards delegated to them, in full. */
    list(userId: string, filter: { status?: DecisionStatus | 'open'; kind?: DecisionKind } = {}): { level: 'detail' | 'status'; cards: DecisionCard[]; statusRows: DecisionStatusRow[] } {
      const r = role(userId);
      const match = (c: DecisionCard) => (!filter.kind || c.kind === filter.kind) && (!filter.status || (filter.status === 'open' ? c.status === 'pending' || c.status === 'info_requested' : c.status === filter.status));
      const all = [...cards.values()].filter(match).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      if (canSeeDecisionDetail(r)) return { level: 'detail', cards: all, statusRows: [] };
      if (canSeeDecisionStatus(r)) return { level: 'status', cards: [], statusRows: all.map(asStatus) };
      return { level: 'detail', cards: all.filter((c) => c.delegatedTo === userId), statusRows: [] };
    },

    get(userId: string, cardId: string): DecisionView {
      const r = role(userId);
      const card = cards.get(cardId);
      if (!card) throw new DecisionError('not_found');
      if (canSeeDecisionDetail(r) || card.delegatedTo === userId) return { level: 'detail', card, records: recordsOf(cardId) };
      if (canSeeDecisionStatus(r)) return { level: 'status', card: asStatus(card) };
      throw new DecisionError('forbidden');
    },

    /** Admin or Owner prepares a packet. It is pending until the Owner decides; Admin cannot decide it. */
    prepare(userId: string, input: PacketInput): DecisionCard {
      const r = role(userId);
      if (!canPrepareDecisionPacket(r)) throw new DecisionError('forbidden');
      if (input.title.trim().length < TITLE_MIN) throw new DecisionError('title_short');
      if (input.summary.trim().length < SUMMARY_MIN) throw new DecisionError('summary_short');
      if (input.amountInr != null && (!Number.isFinite(input.amountInr) || input.amountInr < 0)) throw new DecisionError('amount_invalid');
      cardCounter += 1;
      const card: DecisionCard = {
        id: `dc-${cardCounter}`,
        code: `AIEC-DC-${String(cardCounter).padStart(4, '0')}`,
        kind: input.kind,
        title: input.title.trim(),
        summary: input.summary.trim(),
        status: 'pending',
        proposedBy: { role: r, userId, name: deps.nameOf(userId) },
        createdAt: deps.now(),
        ...(input.amountInr != null ? { amountInr: input.amountInr } : {}),
        ...(input.place ? { place: input.place } : {}),
        evidence: input.evidence ?? [],
        impact: [...(input.impact ?? []), ...(input.recommendation ? [`Recommendation from ${deps.nameOf(userId)}: ${input.recommendation.trim()}`] : [])],
        isDemo: false,
      };
      cards.set(card.id, card);
      return card;
    },

    /** The system raises a card by itself (a rule found something only a person can settle). Never reachable from a browser caller. */
    raiseSystem(input: PacketInput & { proposedByName: string }): DecisionCard {
      if (input.title.trim().length < TITLE_MIN || input.summary.trim().length < SUMMARY_MIN) throw new DecisionError('summary_short');
      cardCounter += 1;
      const card: DecisionCard = {
        id: `dc-${cardCounter}`, code: `AIEC-DC-${String(cardCounter).padStart(4, '0')}`, kind: input.kind, title: input.title.trim(), summary: input.summary.trim(), status: 'pending',
        proposedBy: { role: 'system', name: input.proposedByName }, createdAt: deps.now(),
        ...(input.amountInr != null ? { amountInr: input.amountInr } : {}), ...(input.place ? { place: input.place } : {}),
        evidence: input.evidence ?? [], impact: input.impact ?? [], isDemo: false,
      };
      cards.set(card.id, card);
      return card;
    },

    /** The Owner (or a delegate for this card) decides. The record is appended to the chain and never changed. */
    decide(userId: string, input: DecisionInput): { card: DecisionCard; record: DecisionRecord } {
      const r = role(userId);
      const card = cards.get(input.cardId);
      if (!card) throw new DecisionError('not_found');
      const verdict = canDecide(r, card.kind, { grant: grantFor(card, userId), amountInr: card.amountInr ?? null, now: deps.now() });
      if (!verdict.ok) throw new DecisionError(verdict.reason === 'admin_cannot_decide' ? 'admin_cannot_decide' : 'forbidden');
      if (card.status === 'approved' || card.status === 'rejected') throw new DecisionError('already_decided');
      const problem = decisionProblem(input);
      if (problem) throw new DecisionError(problem);
      if (input.action === 'delegate' && verdict.as === 'delegate') throw new DecisionError('forbidden');
      const at = deps.now();
      const prevHash = records[records.length - 1]?.hash ?? GENESIS;
      const seq = records.length + 1;
      recordCounter += 1;
      const base = { id: `dr-${recordCounter}`, seq, cardId: card.id, eventType: `decision.${statusAfter(input.action)}`, action: input.action, byUserId: userId, byRole: r, as: verdict.as, reason: input.reason.trim(), ...(input.edits ? { edits: input.edits.trim() } : {}), ...(input.delegateTo ? { delegateTo: input.delegateTo } : {}), at };
      const record: DecisionRecord = Object.freeze({ ...base, prevHash, hash: hashOf(prevHash, chainCore(base)) });
      records.push(record);
      card.status = statusAfter(input.action);
      if (card.status === 'approved' || card.status === 'rejected') card.decidedAt = at;
      if (input.action === 'delegate') card.delegatedTo = input.delegateTo;
      return { card, record };
    },

    /** Owner and Admin see the chain's state; Admin may flag a break but cannot repair it. */
    verify(userId: string): ChainCheck {
      if (!canSeeDecisionStatus(role(userId))) throw new DecisionError('forbidden');
      return verifyChain(records.map(chainLink));
    },

    /** For tests and the Owner dashboard: the whole chain, oldest first. */
    allRecords(userId: string): DecisionRecord[] {
      if (!canSeeDecisionDetail(role(userId))) throw new DecisionError('forbidden');
      return [...records];
    },
  };
}

type RecordBase = Omit<DecisionRecord, 'prevHash' | 'hash'>;
const chainCore = (r: RecordBase) => ({ id: r.id, seq: r.seq, sourceKey: r.eventType, triggeringCondition: r.action, actionTaken: r.reason, affectedRecordId: r.cardId, affectedRecordType: 'decision', subjectLabel: r.byUserId, at: r.at });
const chainLink = (r: DecisionRecord) => ({ ...chainCore(r), prevHash: r.prevHash, hash: r.hash });
