import { GENESIS, hashOf, verifyChain } from '@/features/audit/chain';
import type { ChainCheck } from '@/features/audit/chain';
import type { Role } from '@/data/types';
import { familyOf, isEventType } from './taxonomy';
import type { EventType } from './taxonomy';

/**
 * One persistent, append-only, hash-chained event stream (master prompt P9). The map, the Event Log page, entity timelines
 * and the AI training set are projections of it. "Modify" means correct, never overwrite (four classes).
 * Tamper-evident, not tamper-proof: the hash is a fast non-cryptographic fingerprint (see features/audit/chain).
 */

export interface PlatformEvent {
  id: string;
  seq: number;
  type: EventType;
  actor: { role: Role | 'system' | 'ai'; id: string };
  subject: { kind: string; id: string };
  /** Time on the device when it happened, and when the server received it: never merged. */
  capturedAt: string;
  receivedAt: string;
  /** The phone's clock error measured at send: (phone clock when sending) minus (server clock). 0 when not measured. Beyond SKEW_FLAG_MS it is flagged. */
  skewMs: number;
  source: 'app' | 'ai' | 'system' | 'human';
  geo?: { lat: number; lng: number; accuracyM: number };
  evidence?: { ref: string; sha256: string }[];
  ai?: { confidence: number; model: string };
  reasonTag?: string;
  correlationId: string;
  clientEventId?: string;
  /** For a correction / annotation: the event it is about. */
  about?: string;
  payload: Record<string, unknown>;
  prevHash: string;
  hash: string;
}

export interface AppendInput {
  type: string;
  subject: { kind: string; id: string };
  capturedAt?: string;
  /** The phone's clock reading at the moment of sending: lets the server measure its clock error. An old offline capture is not a wrong clock. */
  deviceSentAt?: string;
  source?: PlatformEvent['source'];
  geo?: PlatformEvent['geo'];
  evidence?: PlatformEvent['evidence'];
  ai?: PlatformEvent['ai'];
  reasonTag?: string;
  correlationId?: string;
  clientEventId?: string;
  about?: string;
  payload?: Record<string, unknown>;
}

export type CorrectionClass = 1 | 2 | 3 | 4;
export const SKEW_FLAG_MS = 5 * 60_000;
export const CORRECTION_WINDOW_MS = 15 * 60_000; // [ASSUMPTION] default; Owner-settable
export const REASON_MIN = 10;

/** Class 4, locked: evidence, signatures, payment proofs, safety tripwires, verification reports, closed milestones. */
const LOCKED: EventType[] = ['contract.signed', 'delivery.proof_captured', 'delivery.material_handover_signed', 'milestone.payment_recorded', 'milestone.payment_confirmed', 'milestone.verified', 'milestone.closed', 'safety.tripwire_raised', 'safety.check_recorded', 'milestone.evidence_submitted', 'qc.passed', 'qc.failed', 'decision.approved', 'decision.rejected'];
const FREE: EventType[] = ['lead.contact_added'];
const AFFECTS_MONEY_OR_RANK: EventType[] = ['quote.itemised', 'quote.component_accepted', 'tier.changed', 'payout.approved', 'payout.released', 'lead.ownership_claimed', 'milestone.opened'];

export function classOf(e: Pick<PlatformEvent, 'type' | 'actor' | 'receivedAt'>, byUserId: string, now: string, synced = true): CorrectionClass {
  if (LOCKED.includes(e.type)) return 4;
  if (FREE.includes(e.type) || familyOf(e.type) === 'event') return 1;
  if (AFFECTS_MONEY_OR_RANK.includes(e.type)) return 3;
  const mine = e.actor.id === byUserId;
  const inWindow = Date.parse(now) - Date.parse(e.receivedAt) <= CORRECTION_WINDOW_MS;
  return mine && (inWindow || !synced) ? 2 : 3;
}

export class EventError extends Error { constructor(public code: string) { super(code); this.name = 'EventError'; } }

export interface EventDeps {
  now: () => string;
  roleOf: (userId: string) => Role | null;
  /** Whether this person may see this event (the visibility matrix). Owner and Admin are handled here, not by the caller. */
  canSee: (userId: string, role: Role, e: PlatformEvent) => boolean;
}

export function createEventLog(deps: EventDeps) {
  const events: PlatformEvent[] = [];
  const byClientId = new Map<string, PlatformEvent>();
  let counter = 0;

  const role = (userId: string): Role => { const r = deps.roleOf(userId); if (!r) throw new EventError('not_found'); return r; };
  const find = (id: string): PlatformEvent => { const e = events.find((x) => x.id === id); if (!e) throw new EventError('not_found'); return e; };

  function push(actor: PlatformEvent['actor'], input: AppendInput): PlatformEvent {
    if (!isEventType(input.type)) throw new EventError('unknown_type');
    const receivedAt = deps.now();
    const capturedAt = input.capturedAt ?? receivedAt;
    if (!Number.isFinite(Date.parse(capturedAt)) || (input.deviceSentAt !== undefined && !Number.isFinite(Date.parse(input.deviceSentAt)))) throw new EventError('time_invalid');
    const skewMs = input.deviceSentAt ? Date.parse(input.deviceSentAt) - Date.parse(receivedAt) : 0;
    counter += 1;
    const prevHash = events[events.length - 1]?.hash ?? GENESIS;
    const base = { id: `ev-${counter}`, seq: events.length + 1, type: input.type, actor, subject: input.subject, capturedAt, receivedAt, skewMs, source: input.source ?? 'app', ...(input.geo ? { geo: input.geo } : {}), ...(input.evidence ? { evidence: input.evidence } : {}), ...(input.ai ? { ai: input.ai } : {}), ...(input.reasonTag ? { reasonTag: input.reasonTag } : {}), correlationId: input.correlationId ?? `co-${counter}`, ...(input.clientEventId ? { clientEventId: input.clientEventId } : {}), ...(input.about ? { about: input.about } : {}), payload: input.payload ?? {} };
    const e: PlatformEvent = Object.freeze({ ...base, prevHash, hash: hashOf(prevHash, core(base)) });
    events.push(e);
    if (e.clientEventId) byClientId.set(e.clientEventId, e);
    return e;
  }

  const sees = (userId: string, r: Role, e: PlatformEvent) => r === 'owner' || r === 'admin' || deps.canSee(userId, r, e);
  const masked = (e: PlatformEvent, r: Role): PlatformEvent => (r === 'admin' ? ({ ...e, payload: maskPayload(e.payload) } as PlatformEvent) : e);

  return {
    /** Idempotent by `clientEventId`: a retry after a dropped connection returns the same event. The actor is the signed-in person, never what the client says. */
    append(userId: string, input: AppendInput): { event: PlatformEvent; duplicate: boolean } {
      const r = role(userId);
      if (r === 'admin' && !input.type.startsWith('event.')) throw new EventError('admin_read_only');
      const dup = input.clientEventId ? byClientId.get(input.clientEventId) : undefined;
      if (dup) { if (dup.actor.id !== userId) throw new EventError('forbidden'); return { event: dup, duplicate: true }; }
      return { event: push({ role: r, id: userId }, input), duplicate: false };
    },
    /** System and AI writers (heartbeat, rules): never reachable from a browser caller. */
    appendSystem(input: AppendInput & { source: 'system' | 'ai' }): PlatformEvent { return push({ role: input.source === 'ai' ? 'ai' : 'system', id: input.source }, input); },

    list(userId: string, filter: { subject?: { kind: string; id: string }; family?: string; type?: string } = {}): PlatformEvent[] {
      const r = role(userId);
      return events.filter((e) => sees(userId, r, e) && (!filter.subject || (e.subject.kind === filter.subject.kind && e.subject.id === filter.subject.id)) && (!filter.family || familyOf(e.type) === filter.family) && (!filter.type || e.type === filter.type)).map((e) => masked(e, r));
    },

    /** What the record reads now: the original with applied corrections laid over it. The original stays in `list`. */
    effective(userId: string, eventId: string): { event: PlatformEvent; payload: Record<string, unknown>; corrections: PlatformEvent[] } {
      const r = role(userId);
      const e = find(eventId);
      if (!sees(userId, r, e)) throw new EventError('forbidden');
      const corrections = events.filter((c) => c.about === eventId && c.type === 'correction.applied');
      return { event: masked(e, r), payload: Object.assign({}, e.payload, ...corrections.map((c) => (c.payload.patch ?? {}) as Record<string, unknown>)), corrections };
    },

    classFor(userId: string, eventId: string, synced = true): CorrectionClass { return classOf(find(eventId), userId, deps.now(), synced); },

    /** Class 1/2 apply at once as a new correction event; class 3 becomes a proposal for the Owner; class 4 is refused (annotate or dispute instead). Admin never. */
    correct(userId: string, eventId: string, patch: Record<string, unknown>, reason: string, synced = true): { status: 'applied' | 'needs_approval'; event: PlatformEvent; class: CorrectionClass } {
      const r = role(userId);
      if (r === 'admin') throw new EventError('admin_cannot_correct');
      const target = find(eventId);
      if (!sees(userId, r, target)) throw new EventError('forbidden');
      if (reason.trim().length < REASON_MIN) throw new EventError('reason_short');
      const cls = r === 'owner' && !LOCKED.includes(target.type) ? (1 as CorrectionClass) : classOf(target, userId, deps.now(), synced);
      if (cls === 4) throw new EventError('locked');
      const payload = { patch, reason: reason.trim(), class: cls };
      if (cls === 3) return { status: 'needs_approval', class: cls, event: push({ role: r, id: userId }, { type: 'correction.proposed', subject: target.subject, about: eventId, payload, reasonTag: 'class3' }) };
      return { status: 'applied', class: cls, event: push({ role: r, id: userId }, { type: 'correction.applied', subject: target.subject, about: eventId, payload }) };
    },

    /** Only the Owner decides a class 3 proposal. Approval applies the patch as a correction event; the proposal and the original stay. */
    decideCorrection(userId: string, proposalId: string, approve: boolean, reason: string): PlatformEvent {
      const r = role(userId);
      if (r !== 'owner') throw new EventError(r === 'admin' ? 'admin_cannot_approve' : 'forbidden');
      const proposal = find(proposalId);
      if (proposal.type !== 'correction.proposed') throw new EventError('not_a_proposal');
      if (events.some((e) => e.about === proposalId)) throw new EventError('already_decided');
      if (reason.trim().length < REASON_MIN) throw new EventError('reason_short');
      const orig = find(proposal.about as string);
      const applied = approve ? push({ role: r, id: userId }, { type: 'correction.applied', subject: orig.subject, about: orig.id, payload: { patch: proposal.payload.patch, reason: reason.trim(), class: 3, proposal: proposalId } }) : null;
      return push({ role: r, id: userId }, { type: approve ? 'correction.applied' : 'correction.rejected', subject: orig.subject, about: proposalId, payload: { reason: reason.trim(), ...(applied ? { appliedEvent: applied.id } : {}) } });
    },

    /** Anyone who can see an event may flag it, annotate it or dispute it (the only things allowed on a locked one). Admin may flag, nothing else. */
    mark(userId: string, eventId: string, kind: 'flagged' | 'annotated' | 'disputed', text: string): PlatformEvent {
      const r = role(userId);
      const target = find(eventId);
      if (!sees(userId, r, target)) throw new EventError('forbidden');
      if (r === 'admin' && kind !== 'flagged') throw new EventError('admin_may_only_flag');
      if (text.trim().length < REASON_MIN) throw new EventError('reason_short');
      return push({ role: r, id: userId }, { type: `event.${kind}`, subject: target.subject, about: eventId, payload: { text: text.trim() } });
    },

    verify(): ChainCheck { return verifyChain(events.map(link)); },
    size: () => events.length,
  };
}

/** Contact data is masked for Admin: last four digits only. */
function maskPayload(p: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...p };
  for (const k of ['phone', 'contactPhone', 'mobile']) if (typeof out[k] === 'string') out[k] = `••••••${String(out[k]).slice(-4)}`;
  for (const k of ['contactName', 'customerName']) if (k in out) out[k] = '••••';
  return out;
}

type Base = Omit<PlatformEvent, 'prevHash' | 'hash'>;
const core = (e: Base) => ({ id: e.id, seq: e.seq, sourceKey: e.type, triggeringCondition: `${e.actor.role}:${e.actor.id}`, actionTaken: JSON.stringify([e.payload, e.geo ?? null, e.evidence ?? null, e.ai ?? null, e.capturedAt, e.reasonTag ?? '', e.about ?? '']), affectedRecordId: e.subject.id, affectedRecordType: e.subject.kind, at: e.receivedAt });
const link = (e: PlatformEvent) => ({ ...core(e), prevHash: e.prevHash, hash: e.hash });
