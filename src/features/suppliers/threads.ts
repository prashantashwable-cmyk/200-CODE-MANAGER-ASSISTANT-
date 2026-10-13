import type { SupplierMessage, SupplierMessageAuthor } from '@/data/types';
import { hours } from '@/features/sla/clock';

/**
 * Screen 099's supplier conversation, pure. Who owes the next word in a
 * thread is derived from its messages, never stored, so a reply (or a logged
 * call) settles it the moment it's recorded — and the follow-up engine's
 * `supplier_thread_reply` commitment reads exactly this.
 */

/** How long either side has to answer before it's flagged as unanswered. */
export const SUPPLIER_REPLY_WINDOW = hours(24);

export function byAt(a: SupplierMessage, b: SupplierMessage): number {
  return a.at < b.at ? -1 : a.at > b.at ? 1 : a.id.localeCompare(b.id);
}

export interface AwaitingReply {
  /** The side that owes an answer. */
  from: SupplierMessageAuthor;
  /** The message waiting on it. */
  message: SupplierMessage;
  since: string;
}

/** The last message decides: if it asked for an answer, the other side owes one. */
export function awaitingReply(messages: SupplierMessage[]): AwaitingReply | null {
  const last = [...messages].sort(byAt).pop();
  if (!last || !last.expectsReply) return null;
  return { from: last.author === 'aiec' ? 'supplier' : 'aiec', message: last, since: last.at };
}

/** `last_response_timestamp` — when the supplier last said anything. */
export function lastSupplierResponseAt(messages: SupplierMessage[]): string | null {
  return [...messages].filter((m) => m.author === 'supplier').sort(byAt).pop()?.at ?? null;
}

export function isUnanswered(waiting: AwaitingReply | null, now: number): boolean {
  return !!waiting && now - new Date(waiting.since).getTime() > SUPPLIER_REPLY_WINDOW;
}

/** A new time label where the conversation pauses — not on every bubble. */
export const NATURAL_BREAK = hours(2);

export function startsNewGroup(previousAt: string | null, at: string): boolean {
  if (!previousAt) return true;
  const a = new Date(previousAt);
  const b = new Date(at);
  return a.toDateString() !== b.toDateString() || b.getTime() - a.getTime() > NATURAL_BREAK;
}
