/**
 * The as-installed material record's rules, pure (128). The purchase order says what was planned; this is what was actually put in the
 * lift, logged by the technician who did it. It is what a warranty should refer to, so it is kept honest: a serial number that cannot be
 * read is said to be unreadable rather than invented, every departure from the plan has a reason, and a part from the technician's own
 * general stock can never stand in for a major delivered component. The screen and the repository read the same functions.
 */
import type { JobMaterialUse, LeftoverAction, MaterialDeviationKind, MaterialIdentifier } from '@/data/types';

export const REASON_MIN = 8;
export const IDENTIFIER_MIN = 3;

export const DEVIATION_KINDS: MaterialDeviationKind[] = ['defective_replaced', 'damaged_in_transit', 'wrong_part_supplied', 'unsuitable', 'not_needed', 'wastage', 'other'];
export const LEFTOVER_ACTIONS: LeftoverAction[] = ['return_to_pool', 'return_to_supplier', 'scrap', 'left_with_customer'];

/** Deviations that point at the part or its supplier, not at the site: the ones that feed the supplier's quality record. */
export const SUPPLIER_FAULT_KINDS: MaterialDeviationKind[] = ['defective_replaced', 'damaged_in_transit', 'wrong_part_supplied'];
export const isSupplierFault = (k: MaterialDeviationKind | undefined) => !!k && SUPPLIER_FAULT_KINDS.includes(k);

/** How a delivered part is traced. Machines, controllers, drives and door operators have serial numbers; ropes come in batches. */
const SERIAL: string[] = ['traction_machine', 'controller', 'vfd', 'door_operator', 'governor', 'safety_gear', 'load_weighing', 'rescue_device'];
const BATCH: string[] = ['ropes'];
export const identifierKind = (category: string): 'serial' | 'batch' | 'none' => (SERIAL.includes(category) ? 'serial' : BATCH.includes(category) ? 'batch' : 'none');
/** A major component: not something that can come out of a general stock box. */
export const isMajor = (category: string) => identifierKind(category) !== 'none' || ['cabin', 'guide_rails', 'counterweight'].includes(category);

export type MaterialProblem =
  | 'row_invalid'
  | 'quantity_invalid'
  | 'over_quantity'
  | 'deviation_required'
  | 'reason_required'
  | 'leftover_action_required'
  | 'identifier_required'
  | 'stock_not_allowed_for_major'
  | 'replacement_needs_reason'
  | 'unknown_replaced_line'
  | 'extra_needs_reason'
  | 'line_missing'
  | 'not_confirmed_yet';

const whole = (n: number) => Number.isInteger(n) && n >= 0;

/** Whether one identifier entry is honest and complete: a number of some length, or an explicit "cannot be read". */
export const identifierOk = (i: MaterialIdentifier): boolean => (!i.legible ? true : (i.serial ?? i.batch ?? '').trim().length >= IDENTIFIER_MIN);

export interface RowProblem {
  key: string;
  problem: MaterialProblem;
}

/** What is wrong with one row, or null. `plannedIds` are the plan's own lines, for a replacement to point at. */
export function rowProblem(u: JobMaterialUse, plannedIds: string[]): MaterialProblem | null {
  if (!u.description.trim() || !u.category.trim()) return 'row_invalid';
  if (!whole(u.plannedQty) || !whole(u.usedQty) || !whole(u.leftoverQty)) return 'quantity_invalid';
  const planned = !!u.lineItemId;
  if (planned) {
    if (u.usedQty + u.leftoverQty > u.plannedQty) return 'over_quantity';
    const short = u.usedQty + u.leftoverQty < u.plannedQty;
    // A planned part used in full, or with what is left over accounted for, needs no explanation. Anything else does.
    if ((short || u.usedQty === 0) && !u.deviation) return 'deviation_required';
    if (u.deviation && u.deviation.reason.trim().length < REASON_MIN) return 'reason_required';
  } else {
    // Something not on the plan is either a substitute for a planned part or an extra: either way it says why.
    if (!u.deviation || (u.deviation.kind !== 'substitute' && u.deviation.kind !== 'extra_needed')) return 'deviation_required';
    if (u.deviation.reason.trim().length < REASON_MIN) return u.deviation.kind === 'substitute' ? 'replacement_needs_reason' : 'extra_needs_reason';
    if (u.deviation.kind === 'substitute' && (!u.deviation.replacesLineItemId || !plannedIds.includes(u.deviation.replacesLineItemId))) return 'unknown_replaced_line';
    if (u.source === 'delivered') return 'row_invalid';
    // The technician's own general stock is for small common parts: a major component is never "from stock".
    if (u.source === 'stock' && isMajor(u.category)) return 'stock_not_allowed_for_major';
  }
  if (u.leftoverQty > 0 && !u.leftoverAction) return 'leftover_action_required';
  // Delivered or bought parts that are traced need a serial or batch for each unit, or a plain "cannot be read".
  if (u.usedQty > 0 && u.source !== 'stock' && identifierKind(u.category) !== 'none') {
    const needed = identifierKind(u.category) === 'batch' ? 1 : u.usedQty;
    if (u.identifiers.length < needed || u.identifiers.slice(0, needed).some((i) => !identifierOk(i))) return 'identifier_required';
  }
  return null;
}

/** Every problem with a whole log: what stops it being saved, and (when `confirm`) what stops it being called complete. */
export function logProblems(uses: JobMaterialUse[], plannedIds: string[], confirm: boolean): RowProblem[] {
  const out: RowProblem[] = [];
  for (const u of uses) {
    const p = rowProblem(u, plannedIds);
    if (p && (confirm || (p !== 'identifier_required' && p !== 'deviation_required' && p !== 'reason_required' && p !== 'leftover_action_required'))) out.push({ key: u.id, problem: p });
  }
  if (confirm) {
    for (const id of plannedIds) if (!uses.some((u) => u.lineItemId === id)) out.push({ key: id, problem: 'line_missing' });
  }
  return out;
}

/** What was left over, valued: what was not used of what was delivered. */
export const leftoverValue = (uses: JobMaterialUse[], priceOf: (lineItemId: string) => number): number => uses.filter((u) => u.lineItemId).reduce((sum, u) => sum + u.leftoverQty * priceOf(u.lineItemId as string), 0);

/** What a part used in place of a planned one, or extra, cost when known. */
export const extrasCost = (uses: JobMaterialUse[]): number => uses.filter((u) => !u.lineItemId).reduce((sum, u) => sum + u.usedQty * (u.unitCost ?? 0), 0);
