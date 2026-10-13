/** Screen 112 — Milestone-Linked Payment Release. Types and translation keys only. */

import type { AnomalyKind, ChainNodeKind, ChainSource } from '@/features/suppliers/paymentChain';
import type { ChainTimelineKind, SplitPartState } from '@/data/repository';
import type { SupplierPaymentPart } from '@/data/types';

export type MilestoneReleaseStatus = 'loading' | 'ready' | 'error';

/** How often the chain re-reads while open: it recalculates as real events happen. */
export const POLL_MS = 30_000;

export type ChainFilter = 'all' | 'attention' | 'complete';
export const CHAIN_FILTERS: ChainFilter[] = ['all', 'attention', 'complete'];

export const NODE_KINDS: ChainNodeKind[] = ['po_issued', 'acknowledged', 'delivery_confirmed', 'net_period', 'retention_release', 'final_release'];
export const SOURCES: ChainSource[] = ['event', 'system', 'manual'];
export const ANOMALIES: AnomalyKind[] = ['retention_before_delivery_confirmed', 'delivery_before_send'];
export const PART_STATES: SplitPartState[] = ['not_due', 'pending', 'held', 'approved', 'paid'];
export const PARTS: SupplierPaymentPart[] = ['upfront', 'balance', 'retention'];
export const TIMELINE_KINDS: ChainTimelineKind[] = [...NODE_KINDS, 'held', 'auto_held', 'hold_released', 'approved', 'reversed', 'executed', 'amount_changed', 'split_changed', 'early_release', 'triggered'];

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;

export const RELEASE_KEYS = {
  title: 'supplierPaymentRelease.title',
  subtitle: 'supplierPaymentRelease.subtitle',
  loading: 'supplierPaymentRelease.loading',
  error: { title: 'supplierPaymentRelease.error.title', body: 'supplierPaymentRelease.error.body' },
  alert: { outOfSequence: 'supplierPaymentRelease.alert.outOfSequence' },
  list: {
    search: 'supplierPaymentRelease.list.search',
    filterLabel: 'supplierPaymentRelease.list.filterLabel',
    ...rec('supplierPaymentRelease.list.filter', CHAIN_FILTERS),
    emptyTitle: 'supplierPaymentRelease.list.emptyTitle',
    emptyBody: 'supplierPaymentRelease.list.emptyBody',
    emptySearchTitle: 'supplierPaymentRelease.list.emptySearchTitle',
    emptySearchBody: 'supplierPaymentRelease.list.emptySearchBody',
    clear: 'supplierPaymentRelease.list.clear',
    paidOf: 'supplierPaymentRelease.list.paidOf',
    waiting: 'supplierPaymentRelease.list.waiting',
    customSplit: 'supplierPaymentRelease.list.customSplit',
    outOfOrder: 'supplierPaymentRelease.list.outOfOrder',
    complete: 'supplierPaymentRelease.list.complete',
    awaiting: 'supplierPaymentRelease.list.awaiting',
    inProgress: 'supplierPaymentRelease.list.inProgress',
    notFound: 'supplierPaymentRelease.list.notFound',
    back: 'supplierPaymentRelease.list.back',
  },
  node: rec('supplierPaymentRelease.node', NODE_KINDS),
  nodeHint: rec('supplierPaymentRelease.nodeHint', NODE_KINDS),
  chain: {
    heading: 'supplierPaymentRelease.chain.heading',
    hint: 'supplierPaymentRelease.chain.hint',
    firedOn: 'supplierPaymentRelease.chain.firedOn',
    expected: 'supplierPaymentRelease.chain.expected',
    notYet: 'supplierPaymentRelease.chain.notYet',
    here: 'supplierPaymentRelease.chain.here',
    open: 'supplierPaymentRelease.chain.open',
    netDays: 'supplierPaymentRelease.chain.netDays',
    outOfOrderNode: 'supplierPaymentRelease.chain.outOfOrderNode',
  },
  source: rec('supplierPaymentRelease.source', SOURCES),
  anomaly: {
    heading: 'supplierPaymentRelease.anomaly.heading',
    ...rec('supplierPaymentRelease.anomaly', ANOMALIES),
    action: 'supplierPaymentRelease.anomaly.action',
  },
  split: {
    heading: 'supplierPaymentRelease.split.heading',
    hint: 'supplierPaymentRelease.split.hint',
    part: rec('supplierPaymentRelease.split.part', PARTS),
    state: rec('supplierPaymentRelease.split.state', PART_STATES),
    due: 'supplierPaymentRelease.split.due',
    expectedDue: 'supplierPaymentRelease.split.expectedDue',
    noDate: 'supplierPaymentRelease.split.noDate',
    ofOrder: 'supplierPaymentRelease.split.ofOrder',
    heldAuto: 'supplierPaymentRelease.split.heldAuto',
    early: 'supplierPaymentRelease.split.early',
    openInQueue: 'supplierPaymentRelease.split.openInQueue',
    releaseEarly: 'supplierPaymentRelease.split.releaseEarly',
    locked: 'supplierPaymentRelease.split.locked',
    total: 'supplierPaymentRelease.split.total',
    adjust: 'supplierPaymentRelease.split.adjust',
    nothingEditable: 'supplierPaymentRelease.split.nothingEditable',
    tierDefault: 'supplierPaymentRelease.split.tierDefault',
    customBanner: 'supplierPaymentRelease.split.customBanner',
    paidOnOrder: 'supplierPaymentRelease.split.paidOnOrder',
  },
  deviation: {
    heading: 'supplierPaymentRelease.deviation.heading',
    change: 'supplierPaymentRelease.deviation.change',
    by: 'supplierPaymentRelease.deviation.by',
  },
  adjust: {
    title: 'supplierPaymentRelease.adjust.title',
    intro: 'supplierPaymentRelease.adjust.intro',
    upfront: 'supplierPaymentRelease.adjust.upfront',
    upfrontNet: 'supplierPaymentRelease.adjust.upfrontNet',
    retention: 'supplierPaymentRelease.adjust.retention',
    preview: 'supplierPaymentRelease.adjust.preview',
    reason: 'supplierPaymentRelease.adjust.reason',
    reasonHint: 'supplierPaymentRelease.adjust.reasonHint',
    risk: 'supplierPaymentRelease.adjust.risk',
    riskAck: 'supplierPaymentRelease.adjust.riskAck',
    lockedNote: 'supplierPaymentRelease.adjust.lockedNote',
    save: 'supplierPaymentRelease.adjust.save',
    saved: 'supplierPaymentRelease.adjust.saved',
    issue: rec('supplierPaymentRelease.adjust.issue', ['upfront_range', 'retention_range', 'net_has_upfront', 'upfront_required', 'total_too_high', 'no_change', 'reason_required'] as const),
  },
  early: {
    title: 'supplierPaymentRelease.early.title',
    intro: 'supplierPaymentRelease.early.intro',
    reason: 'supplierPaymentRelease.early.reason',
    reasonHint: 'supplierPaymentRelease.early.reasonHint',
    confirm: 'supplierPaymentRelease.early.confirm',
    done: 'supplierPaymentRelease.early.done',
  },
  timeline: {
    heading: 'supplierPaymentRelease.timeline.heading',
    hint: 'supplierPaymentRelease.timeline.hint',
    kind: rec('supplierPaymentRelease.timeline.kind', TIMELINE_KINDS),
    by: 'supplierPaymentRelease.timeline.by',
    empty: 'supplierPaymentRelease.timeline.empty',
  },
  problem: {
    forbidden: 'supplierPaymentRelease.problem.forbidden',
    not_found: 'supplierPaymentRelease.problem.not_found',
    invalid_input: 'supplierPaymentRelease.problem.invalid_input',
    part_locked: 'supplierPaymentRelease.problem.part_locked',
    risk_unconfirmed: 'supplierPaymentRelease.problem.risk_unconfirmed',
    reason_required: 'supplierPaymentRelease.problem.reason_required',
    already_fired: 'supplierPaymentRelease.problem.already_fired',
    upfront_range: 'supplierPaymentRelease.problem.upfront_range',
    retention_range: 'supplierPaymentRelease.problem.retention_range',
    net_has_upfront: 'supplierPaymentRelease.problem.net_has_upfront',
    upfront_required: 'supplierPaymentRelease.problem.upfront_required',
    total_too_high: 'supplierPaymentRelease.problem.total_too_high',
    no_change: 'supplierPaymentRelease.problem.no_change',
    generic: 'supplierPaymentRelease.problem.generic',
  },
} as const;
