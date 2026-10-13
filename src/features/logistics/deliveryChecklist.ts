import type { DeliveryCheckItem, DeliveryItemVerdict, DeliverySopStep, DiscrepancyKind } from '@/data/types';
import { sopProblem } from '@/features/logistics/deliverySop';
import type { SopAnswer } from '@/features/logistics/deliverySop';

/**
 * Screen 103's checking rules, pure — shared by the screen (so a step visibly
 * refuses to tick off) and the repository (so nothing gets past it anyway).
 * Two places, one definition: completion can never outrun the evidence.
 */

/** A discrepancy has to say what was found, in words. */
export const MIN_NOTE_LENGTH = 4;

/** What a person says about one part, before it's saved. */
export interface ItemFindings {
  /** False when the part isn't on this delivery. */
  arrived: boolean;
  receivedQty?: number;
  conditionOk?: boolean;
  specOk?: boolean;
  note?: string;
  photoCount: number;
  /** The procedure (107) this part was pinned to, and what has been answered on it. */
  sopSteps?: DeliverySopStep[];
  sopResults?: SopAnswer[];
}

export type ItemProblem = 'quantity' | 'photo' | 'note' | 'condition' | 'sop_step' | 'sop_photo';

export function receivedQtyOf(f: ItemFindings, expectedQty: number): number {
  return f.receivedQty ?? expectedQty;
}

/** Which of the three things could be wrong, and are. */
export function kindsOf(f: ItemFindings, expectedQty: number): DiscrepancyKind[] {
  if (!f.arrived) return [];
  const qty = receivedQtyOf(f, expectedQty);
  // Nothing in the box: the state of a part that isn't there is not a question.
  if (qty === 0) return ['count'];
  const kinds: DiscrepancyKind[] = [];
  if (f.conditionOk === false) kinds.push('damaged');
  if (qty !== expectedQty) kinds.push('count');
  if (f.specOk === false) kinds.push('wrong_spec');
  return kinds;
}

export function verdictOf(f: ItemFindings, expectedQty: number): Exclude<DeliveryItemVerdict, 'pending'> {
  if (!f.arrived) return 'not_arrived';
  return kindsOf(f, expectedQty).length > 0 ? 'discrepancy' : 'ok';
}

/** The first thing stopping this part being ticked off, or null when it can be. */
export function problemWith(f: ItemFindings, expectedQty: number): ItemProblem | null {
  if (!f.arrived) return null;
  const qty = receivedQtyOf(f, expectedQty);
  if (!Number.isInteger(qty) || qty < 0 || qty > 9999) return 'quantity';
  if (qty === 0) return (f.note ?? '').trim().length >= MIN_NOTE_LENGTH ? null : 'note';
  // Every part that turned up is photographed — the evidence trail.
  if (f.photoCount < 1) return 'photo';
  // The centrally governed steps for this kind of part: nothing is ticked off around them.
  const sop = sopProblem(f.sopSteps, f.sopResults);
  if (sop) return sop;
  if (kindsOf(f, expectedQty).length > 0 && (f.note ?? '').trim().length < MIN_NOTE_LENGTH) return 'note';
  return null;
}

export const isChecked = (item: DeliveryCheckItem): boolean => item.verdict !== 'pending';

/** A part that physically turned up, however imperfect. Only these are delivered. */
export const isReceived = (item: DeliveryCheckItem): boolean => (item.verdict === 'ok' || item.verdict === 'discrepancy') && (item.receivedQty ?? item.expectedQty) > 0;

export interface ChecklistProgress {
  total: number;
  checked: number;
  received: number;
  discrepancies: number;
  notArrived: number;
  /** Nothing has turned up at all: there is nothing to sign for. */
  nothingArrived: boolean;
  complete: boolean;
}

export function progressOf(items: DeliveryCheckItem[]): ChecklistProgress {
  const checked = items.filter(isChecked);
  const received = items.filter(isReceived);
  return {
    total: items.length,
    checked: checked.length,
    received: received.length,
    discrepancies: items.filter((i) => i.verdict === 'discrepancy').length,
    notArrived: items.filter((i) => i.verdict === 'not_arrived').length,
    nothingArrived: checked.length === items.length && received.length === 0,
    // Every part answered, and at least one of them is here to sign for.
    complete: items.length > 0 && checked.length === items.length && received.length > 0,
  };
}

/** Value of what a checklist verified as delivered — what a milestone payment can be measured against. */
export function deliveredValue(items: DeliveryCheckItem[], unitPrice: (lineItemId: string) => number): number {
  return items.filter(isReceived).reduce((sum, i) => sum + unitPrice(i.lineItemId) * Math.min(i.receivedQty ?? i.expectedQty, i.expectedQty), 0);
}
