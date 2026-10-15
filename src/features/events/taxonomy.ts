/**
 * The platform event taxonomy (master prompt P9.1): every action by a human, AI or system is one of these.
 * Families are fixed; a new type is one entry here. Naming is `<family>.<what_happened>`, past tense.
 */
export const EVENT_FAMILIES = {
  lead: ['captured', 'photo_added', 'contact_added', 'shaft_readiness_set', 'duplicate_detected', 'ownership_claimed', 'ownership_disputed', 'handed_to_sales', 'marked_lost', 'reopened'],
  outreach: ['message_sent', 'reply_received', 'call_logged', 'consent_recorded', 'opted_out'],
  quote: ['requirement_captured', 'rfq_sent', 'partner_offer_received', 'drafted', 'itemised', 'sent', 'component_accepted', 'rejected', 'expired'],
  contract: ['pack_generated', 'work_order_created', 'signed', 'accepted_in_app', 'signature_declined', 'amended'],
  milestone: ['opened', 'evidence_submitted', 'verified', 'closed', 'payment_recorded', 'payment_confirmed'],
  delivery: ['dispatched', 'in_transit', 'arrived', 'proof_captured', 'material_handover_signed'],
  installation: ['started', 'step_completed', 'blocked', 'resumed', 'completed'],
  qc: ['assigned', 'inspection_started', 'passed', 'failed', 'surprise_audit_triggered'],
  safety: ['check_recorded', 'tripwire_raised', 'hold_applied', 'hold_released'],
  payout: ['invoice_generated', 'approved', 'released', 'failed'],
  tier: ['proposed', 'changed', 'appealed'],
  decision: ['card_created', 'approved', 'rejected', 'info_requested', 'delegated'],
  correction: ['applied', 'proposed', 'rejected'],
  event: ['flagged', 'annotated', 'disputed'],
  complaint: ['raised', 'acknowledged', 'resolved'],
  access: ['sensitive_viewed', 'export_requested', 'login', 'permission_changed'],
  system: ['sync_conflict', 'integration_unavailable', 'rule_changed'],
} as const;

export type EventFamily = keyof typeof EVENT_FAMILIES;
export type EventType = { [F in EventFamily]: `${F}.${(typeof EVENT_FAMILIES)[F][number]}` }[EventFamily];

export const EVENT_TYPES: EventType[] = (Object.keys(EVENT_FAMILIES) as EventFamily[]).flatMap((f) => EVENT_FAMILIES[f].map((w) => `${f}.${w}` as EventType));
const KNOWN = new Set<string>(EVENT_TYPES);
export const isEventType = (s: string): s is EventType => KNOWN.has(s);
export const familyOf = (t: EventType): EventFamily => t.split('.')[0] as EventFamily;
