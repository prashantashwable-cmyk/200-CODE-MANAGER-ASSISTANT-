/**
 * AIEC domain model.
 *
 * These are the Firestore collection shapes from the Foundation prompt, grown
 * to cover what the built screens actually read. Field names stay snake_case-
 * free camelCase on the client; the Firebase adapter is where any mapping to
 * stored document keys would live.
 *
 * Money is always a whole number of rupees (INR). Timestamps are ISO 8601
 * strings so seeded data is diffable and locale formatting stays in one place.
 */
import type { SecurityConfig } from '@/features/security/security';
import type { BackupConfig } from '@/features/backup/backup';

export type Role = 'admin' | 'surveyor' | 'technician' | 'customer' | 'supplier';

export type Language = 'en' | 'hi' | 'mr';

export type ThemePreference =
  | 'light'
  | 'snow'
  | 'dark'
  | 'orbital'
  | 'lithium'
  | 'pure'
  | 'system';

export type UserStatus = 'active' | 'pending_approval' | 'suspended' | 'rejected';

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** Uploaded proof — KYC, certification, site photo, QC evidence. */
export interface DocumentRef {
  id: string;
  kind:
    | 'aadhaar'
    | 'pan'
    | 'gst'
    | 'bank'
    | 'photo'
    | 'certificate'
    | 'licence'
    | 'insurance'
    | 'other';
  label: string;
  status: 'missing' | 'uploaded' | 'verified' | 'rejected';
  uploadedAt?: string;
  rejectionReason?: string;
}

export interface User {
  id: string;
  role: Role;
  name: string;
  phone: string;
  email?: string;
  status: UserStatus;
  preferredLanguage: Language;
  themePreference: ThemePreference;
  /** Demo records are a separate dataset that can never mix with production. */
  isDemo: boolean;
  city?: string;
  territory?: string;
  joinedAt?: string;
  rating?: number;
  /** Surveyor/technician live position, when on duty. */
  location?: GeoPoint;
  lastSeenAt?: string;
  onDuty?: boolean;
  skills?: string[];
  documents?: DocumentRef[];
  companyName?: string;
  gstin?: string;
  /** Who hears about this person's commitments once they run past their
   *  escalation window — the second human the follow-up engine reaches
   *  before anything becomes an Alert. Unset for Admin (the top of the
   *  chain) and for customers/suppliers, whose missed promises go to Admin. */
  reportsTo?: string;
  /** Who covers this person's escalations when they themselves are the
   *  owner — only meaningful for Admin. Unset means nobody backs Admin up
   *  yet, which is a real business decision, not a default. */
  backupUserId?: string;
  /** What a surveyor or technician said about themselves on 005 / 006, kept for
   *  the Admin who approves them (004). Never the full Aadhaar number. */
  onboarding?: FieldPartnerOnboarding;
  /** A customer's answer on 008 to sharing their project details with the people doing the work. */
  serviceDataConsent?: { granted: boolean; at: string };
}

/** One line in the role-change audit (004): an applicant asking for a role, or Admin deciding. Append-only. */
export interface RoleAuditEntry {
  id: string;
  userId: string;
  userName: string;
  previousRole: Role | null;
  newRole: Role;
  /** Null when the applicant themself asked. */
  changedByAdminId: string | null;
  /** What Admin decided; absent for an applicant's own request. */
  decision?: 'approved' | 'rejected';
  at: string;
  /** True when a previously rejected applicant asks for the same role again. */
  isReapplication: boolean;
  isDemo: boolean;
}

/** A report definition someone saved on 030 (their own; read live each time it is opened). */
export interface SavedReportDefinition {
  id: string;
  ownerUserId: string;
  name: string;
  metric: string;
  dimension: string;
  range: string;
  createdAt: string;
  isDemo: boolean;
}

export interface FieldPartnerOnboarding {
  submittedAt: string;
  preferredZoneIds?: string[];
  unverifiedSkills?: string[];
  yearsExperience?: string;
  insuranceExpiry?: string;
  ownsTwoWheeler?: boolean;
  aadhaarLast4?: string;
  panNumber?: string;
  /** The bank check's answer when they applied; undefined when no account was given. */
  bankVerified?: boolean;
  reapplication: boolean;
}

/* ------------------------------------------------------------------- Leads */

export type LeadStage =
  | 'captured'
  | 'contacted'
  | 'site_visit'
  | 'quoted'
  | 'negotiation'
  | 'won'
  | 'lost';

export type BuildingType =
  | 'residential_apartment'
  | 'residential_villa'
  | 'commercial_office'
  | 'retail'
  | 'hospital'
  | 'hotel'
  | 'industrial'
  | 'institutional';

export interface BuildingSpec {
  buildingType: BuildingType;
  /** Ground floor retail, upper floors residential, etc — a real, common
   *  case the capture flow must not force into one category. */
  mixedUse: boolean;
  floors: number;
  basements: number;
  shaftCount: number;
  /** Persons — the standard Indian capacity rating. */
  capacityPersons: number;
  /** Kilograms, derived from capacity but stored so field edits stick. */
  capacityKg: number;
  speedMps: number;
  shaftWidthMm?: number;
  shaftDepthMm?: number;
  pitDepthMm?: number;
  headroomMm?: number;
  machineRoom: 'mrl' | 'with_machine_room' | 'unknown';
  doorType: 'automatic_centre' | 'automatic_side' | 'manual_swing' | 'collapsible';
  cabinFinish: 'standard_ss' | 'premium_ss' | 'glass' | 'custom';
  powerBackup: boolean;
  /** Rough construction stage — drives how urgent the lead is. */
  constructionStage: 'foundation' | 'structure' | 'finishing' | 'ready';
}

/** Captured once, immutably, at creation — attribution stays historically
 *  accurate no matter how the lead's stage or ownership evolves afterward. */
export type LeadSource =
  | 'field_survey'
  | 'referral_repeat'
  | 'inbound_website'
  | 'inbound_whatsapp'
  | 'bulk_import';

/** One factor behind a computed priority score, kept so the number is never
 *  a black box (screen 046). `contribution` is the points it added to the
 *  final 0-100 score under the weighting active at `scoreLastComputed`. */
export interface ScoreFactor {
  key: 'buildingSize' | 'constructionReadiness' | 'responsiveness' | 'territoryHistory';
  weight: number;
  value: number;
  contribution: number;
}

export interface Lead {
  id: string;
  /** Human-readable code surveyors read out on the phone, e.g. AIEC-L-0042. */
  code: string;
  stage: LeadStage;
  /** Current owner — reassignment (044) moves this. */
  surveyorId: string;
  /** The surveyor who captured it, fixed forever. Reassigning ownership never
   *  moves the capture-bonus commission entitlement, only ongoing responsibility. */
  originalSurveyorId: string;
  source: LeadSource;
  builderName: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  siteName: string;
  address: string;
  city: string;
  pincode: string;
  location: GeoPoint;
  photos: string[];
  spec?: BuildingSpec;
  estimatedValue: number;
  /** What the surveyor earns if this converts. */
  incentiveAmount: number;
  incentiveStatus: 'projected' | 'approved' | 'paid' | 'forfeited';
  createdAt: string;
  updatedAt: string;
  stageEnteredAt: string;
  notes?: string;
  /** Set when duplicate detection matched an existing lead. */
  duplicateOfLeadId?: string;
  isDemo: boolean;
  /** Fixed taxonomy key, e.g. 'price' | 'timeline' | 'competitor' |
   *  'site_not_ready' | 'unresponsive' | 'not_a_fit' — kept as a plain string
   *  so the Sales Funnel screen can aggregate it without a hard enum coupling. */
  lostReason?: string;
  lostNote?: string;
  revisitReminderDate?: string;
  markedLostBy?: string;
  markedLostAt?: string;
  score?: number;
  scoreFactorBreakdown?: ScoreFactor[];
  scoreLastComputed?: string;
  importBatchId?: string;
  /** The contact's own language preference, captured at intake — drives
   *  which template-language variant an automated send picks. */
  preferredLanguage?: Language;
  /** Set when a customer's referral brought this lead (179): who, with which code, and the referral record. The source is `referral_repeat`. */
  referral?: { referralId: string; customerId: string; code: string; at: string };
}

export interface ScoreWeightingProfile {
  buildingSize: number;
  constructionReadiness: number;
  responsiveness: number;
  territoryHistory: number;
  updatedAt: string;
}

/* ---------------------------------------------------------- CRM: timeline */

export type LeadTimelineEventKind =
  | 'captured'
  | 'stage_changed'
  | 'note_added'
  | 'assigned'
  | 'reassigned'
  | 'communication_sent'
  | 'communication_failed'
  | 'quote_created'
  | 'quote_change_requested'
  | 'task_completed'
  | 'merged'
  | 'marked_lost'
  | 'reopened';

/** Append-only. Past events are never edited or deleted — even a failed
 *  automated action logs here rather than being silently dropped. */
export interface LeadTimelineEvent {
  id: string;
  leadId: string;
  kind: LeadTimelineEventKind;
  actorName: string;
  at: string;
  detail?: string;
  fromValue?: string;
  toValue?: string;
  /** What a `note_added` note is about, so the person installing can find what matters to them (121/122). */
  topic?: 'access' | 'contact' | 'safety' | 'other';
}

/* ------------------------------------------------------ CRM: follow-ups */

export type FollowUpTaskStatus = 'open' | 'done' | 'cancelled';

export interface FollowUpTask {
  id: string;
  leadId: string;
  title: string;
  dueDate: string;
  assignedTo: string;
  status: FollowUpTaskStatus;
  /** Auto-generated by the stage-based rule engine, or created by hand. */
  source: 'auto' | 'manual';
  /** `'collection'` is chasing money on a deal that's already won — it must
   *  survive the lead closing, unlike a sales follow-up, which a won or lost
   *  lead makes moot. Unset means sales. */
  purpose?: 'sales' | 'collection';
  createdAt: string;
  completedAt?: string;
  rescheduleReasonKey?: string;
  isDemo: boolean;
}

/* ------------------------------------------------- CRM: duplicate pairs */

export interface DuplicatePair {
  id: string;
  primaryLeadId: string;
  secondaryLeadId: string;
  status: 'pending' | 'merged' | 'not_duplicate';
  detectedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  commissionImpactSummary?: string;
  isDemo: boolean;
}

/* --------------------------------------------------- CRM: bulk import */

export interface LeadImportBatch {
  id: string;
  fileName: string;
  importedBy: string;
  importedAt: string;
  totalRows: number;
  importedRows: number;
  rejectedRows: number;
  isDemo: boolean;
}

export interface LeadSourceAttribution {
  source: LeadSource;
  leadCount: number;
  conversionRate: number;
  avgDealValue: number;
  /** Only set for sources with a real associated acquisition cost. */
  costPerConversion?: number;
  trend: SeriesPoint[];
}

/* ------------------------------------------------------------------- Deals */

export type DealStatus =
  | 'draft'
  | 'quoted'
  | 'negotiating'
  | 'approved'
  | 'won'
  | 'lost'
  | 'cancelled';

export interface Deal {
  id: string;
  code: string;
  leadId: string;
  customerId?: string;
  status: DealStatus;
  quotedPrice: number;
  agreedPrice: number;
  /** AIEC's margin after supplier cost and installation. */
  marginAmount: number;
  gstPercent: number;
  supplierId?: string;
  negotiationRounds: number;
  createdAt: string;
  closedAt?: string;
  /** Only for a business/commercial purchase eligible for input tax
   *  credit — screen 087's invoices carry this when set, and never
   *  fabricate one when it isn't. */
  customerGstin?: string;
  isDemo: boolean;
}

/* -------------------------------------------------------- Auto-Negotiation */

/** Fixed taxonomy so the bot's response strategy is always traceable to one
 *  of these, never an ad-hoc classification — an objection that matches
 *  none of them is exactly the "genuinely novel" case that always escalates. */
export type NegotiationObjectionKey = 'price_too_high' | 'competitor_comparison' | 'wants_to_delay';

export interface NegotiationObjectionScenario {
  objectionKey: NegotiationObjectionKey;
  /** Admin-authored guidance for how the bot should respond — a strategy,
   *  not a single canned line, since the actual reply still varies. */
  responseStrategy: string;
}

export type NegotiationTone = 'professional' | 'warm' | 'concise' | 'firm';

/** Deal-closing-specific bot configuration, layered on top of the general
 *  Conversation AI Bot settings (`BotConfig`, screen 056) — screen 071.
 *  The bot's own floor is always the Pricing Rules margin floor *plus*
 *  this buffer, so it can only ever be more conservative, never less. */
export interface NegotiationBotConfig {
  marginBufferPct: number;
  maxNegotiationRounds: number;
  toneKey: NegotiationTone;
  /** Off by default for a new deployment — Admin must deliberately opt in
   *  once the bot's behaviour has earned that trust. */
  autoCloseAuthorityFlag: boolean;
  objectionScenarios: NegotiationObjectionScenario[];
  updatedAt: string;
}

export type NegotiationStatus = 'bot_active' | 'escalated' | 'human_takeover' | 'closed_won' | 'closed_lost';

/**
 * One bot-run negotiation session against a `Deal`. Settings that govern it
 * (`maxRoundsAllowed`, `autoCloseAuthorityAllowed`, `floorPrice`) are
 * snapshotted at creation from `NegotiationBotConfig` and never re-read
 * afterward, so an in-flight negotiation always finishes under the rules it
 * started with even if Admin changes the configuration mid-conversation.
 */
export interface Negotiation {
  id: string;
  dealId: string;
  leadId: string;
  status: NegotiationStatus;
  roundsUsed: number;
  currentOfferPrice: number;
  /** The bot's own snapshotted floor (company floor + its margin buffer) —
   *  never crossed on the bot's own authority. An ask below this but still
   *  at or above the company's true floor is exactly the "borderline" case
   *  the Counter-Offer Approval queue (screen 073) exists for; an ask below
   *  the company's true floor is declined automatically and never queued. */
  floorPrice: number;
  maxRoundsAllowed: number;
  autoCloseAuthorityAllowed: boolean;
  /** Set once a customer message hasn't matched any objection scenario
   *  above the bot's confidence threshold — always a human handoff. */
  lastEscalationReason?: 'no_scenario_match' | 'max_rounds_reached' | 'manual_takeover';
  startedAt: string;
  lastActivityAt: string;
  takenOverBy?: string;
  takenOverAt?: string;
  isDemo: boolean;
}

export type CounterOfferStatus = 'pending' | 'approved' | 'rejected' | 'countered' | 'superseded';

/**
 * A single genuinely-borderline ask the bot escalated because it falls
 * outside its own authority (`Negotiation.floorPrice`) without being
 * outright rejectable (still at or above the company's true margin
 * floor) — screen 073. Shares its approve/reject/counter mechanics with
 * `DiscountRequest`, just scoped to a live negotiation instead of a quote.
 */
export interface CounterOffer {
  id: string;
  negotiationId: string;
  dealId: string;
  leadId: string;
  customerRequestedPrice: number;
  /** Resulting margin if accepted at `customerRequestedPrice`, computed the
   *  same way as `DiscountRequest.resultingMarginPct`. */
  marginImpactPct: number;
  /** A non-price ask riding alongside or instead of a price change (e.g. a
   *  free AMC year) — always needs a human decision regardless of margin. */
  bundledConcessionNote?: string;
  status: CounterOfferStatus;
  approverId?: string;
  decidedAt?: string;
  rejectionReason?: string;
  counterPriceOffered?: number;
  createdAt: string;
  isDemo: boolean;
}

export type DealTermsStatus = 'draft' | 'awaiting_customer' | 'confirmed';

/** A corrective note logged after both parties have already confirmed —
 *  screen 074's answer to "a data issue turns up afterward": the record
 *  stays confirmed and the fix is logged, never a silent retroactive edit. */
export interface DealTermsAmendment {
  id: string;
  note: string;
  amendedBy: string;
  amendedAt: string;
}

/**
 * The single choke point between "negotiation is happening" and "a binding
 * deal exists" — screen 074. Nothing downstream (contract, payment
 * schedule, supplier ordering) reads as final until `bothPartyConfirmedFlag`
 * is true. `paymentStagePlan` reuses the exact `PaymentStage` vocabulary
 * `Payment.stage` uses (see Payments, below) — the one source of truth the
 * Payment Stage Schedule Setup screen reads directly, never re-derived.
 * `advance`/`material`/`installation`/`handover` together must total 100%
 * of `finalAgreedPrice`; a `retention` line, if present, is an additional
 * holdback percentage on top of that 100%, matching how existing seeded
 * payments already split (25/35/30/10, +5 retention).
 */
export interface DealTerms {
  id: string;
  dealId: string;
  finalAgreedPrice: number;
  paymentStagePlan: { stage: PaymentStage; percentage: number }[];
  specialTermsNotes: string;
  status: DealTermsStatus;
  internalConfirmedBy?: string;
  internalConfirmedAt?: string;
  /** Simulated in this build via an explicit "on the customer's behalf"
   *  action, since there is no live customer portal yet — never inferred
   *  or auto-set from any internal action. */
  customerConfirmedAt?: string;
  bothPartyConfirmedFlag: boolean;
  amendments: DealTermsAmendment[];
  createdAt: string;
  updatedAt: string;
  isDemo: boolean;
}

export type ContractClauseKey = 'scope' | 'price_and_payment' | 'installation_and_liability' | 'warranty_and_amc' | 'state_compliance';

/** One clause, always carrying both forms side by side — screen 075's
 *  "plain-language summary alongside the full legal text" requirement,
 *  never a summary the customer has to trust without the source text. */
export interface ContractClause {
  key: ContractClauseKey;
  legalText: string;
  plainLanguageSummary: string;
}

/** An Admin-reviewed custom term (e.g. a large commercial client's own
 *  procurement terms) attached to, never replacing, the generated
 *  contract — the standard clauses stay version-locked either way. */
export interface ContractAddendum {
  id: string;
  note: string;
  addedBy: string;
  addedAt: string;
}

export type ContractStatus = 'active' | 'superseded';

/**
 * The auto-generated, version-locked contract for a deal — screen 075.
 * Only ever produced from a `DealTerms` record whose
 * `bothPartyConfirmedFlag` is true; a later amendment doesn't touch this
 * record, it requires a fresh `generateContract` call that supersedes it,
 * so two valid-looking versions are never in circulation at once.
 */
export interface Contract {
  id: string;
  dealId: string;
  version: number;
  supersedesContractId?: string;
  status: ContractStatus;
  clauses: ContractClause[];
  /** True when the customer's state has no Lift Act clause configured yet
   *  and the National Building Code / BIS-standard default was used
   *  instead — surfaced so Admin can add the state-specific set. */
  usedStateClauseFallback: boolean;
  addenda: ContractAddendum[];
  generatedAt: string;
  generatedBy: string;
  isDemo: boolean;
}

export type SignatureStatus = 'unsigned' | 'customer_signed' | 'fully_signed';

export type SignatureMethod = 'drawn' | 'typed';

/**
 * The two-party signature record for one generated `Contract` — screen 076,
 * the precise moment a deal becomes formally Closed Won. Reaching
 * `customer_signed` moves `Deal.status` to `'approved'`; only
 * `fully_signed` (AIEC's countersignature too) moves it to `'won'` with
 * `closedAt` set — Deal Terms Finalization's mutual agreement is not yet a
 * signed instrument, and downstream fulfilment must not start on it alone.
 */
export interface ContractSignature {
  id: string;
  contractId: string;
  dealId: string;
  status: SignatureStatus;
  customerSignatureMethod?: SignatureMethod;
  /** A data URL for a drawn signature, or the typed name itself. */
  customerSignatureData?: string;
  customerConsentGiven?: boolean;
  /** True whether verified by OTP or by the manual fallback path — both are
   *  a genuine identity confirmation, just via a different route. */
  customerOtpVerified?: boolean;
  customerSignedAt?: string;
  aiecCountersignedBy?: string;
  aiecCountersignedAt?: string;
  isDemo: boolean;
}

/** `'triggered'`/`'failed'` are 077's own bare kickoff-attempt marker,
 *  unchanged since Module 8. The later four are screen 092's real
 *  purchase-order lifecycle, which only ever appears on a record 092
 *  itself created (always carrying real `lineItems`) — 092 never adopts
 *  or edits an old bare 077 stub, it drafts its own alongside it. */
export type SupplierPurchaseOrderStatus = 'triggered' | 'failed' | 'draft' | 'pending_approval' | 'approved' | 'sent';

/** One component line on a real (092-drafted) PO. `catalogUnitPriceAtDraft`
 *  is snapshotted from the supplier's catalog at the moment this line was
 *  drafted (or last reassigned to a different supplier) — 092's own UI
 *  compares it live against the supplier's *current* catalog price to
 *  flag a since-changed cost, never stored as a second "current price"
 *  that could go stale itself. */
export interface PurchaseOrderLineItem {
  id: string;
  category: string;
  description: string;
  quantity: number;
  catalogUnitPriceAtDraft: number;
  agreedUnitPrice: number;
  /** Fulfilment stage once the PO is sent (095), per line — one part can
   *  ship while another is still in production. Unset reads as derived
   *  from the PO (`acknowledgedAt` / `receivedAt`). */
  fulfilmentStage?: PoFulfilmentStage;
  stageEnteredAt?: string;
}

/** A sent PO's one true fulfilment status (095) — the same status Material
 *  Logistics (101+) will read. Order matters: index is progress. */
export type PoFulfilmentStage = 'sent' | 'acknowledged' | 'in_production' | 'ready_to_ship' | 'shipped' | 'delivered';

/** Append-only. Every stage change, forward or back, by whom and why —
 *  also the history each supplier's "typical timing" is learned from. */
export interface PoStatusEvent {
  id: string;
  lineItemIds: string[];
  fromStage: PoFulfilmentStage;
  toStage: PoFulfilmentStage;
  at: string;
  byName: string;
  byRole: 'supplier' | 'admin' | 'technician';
  /** Admin recorded it for a supplier who hadn't updated it themselves. */
  onBehalf: boolean;
  note?: string;
  /** The on-site checklist (103) that verified a delivery. */
  checklistId?: string;
}

/** What Admin decided to do with parts ordered for a deal that was later cancelled (106). */
export interface PurchaseOrderOrphanResolution {
  kind: 'redirect' | 'return';
  /** The deal the parts were redirected to. */
  toDealId?: string;
  note?: string;
  decidedByName: string;
  decidedAt: string;
}

/** A minimal record that a supplier PO was kicked off by a deal closure —
 *  now also screen 092's own real purchase-order record once `lineItems`
 *  is populated. Whether it currently *needs* approval (any line's
 *  `agreedUnitPrice` deviating from `catalogUnitPriceAtDraft` beyond 092's
 *  own tolerance) is always computed live from `lineItems`, never stored,
 *  so it can never go stale after an edit — `approvedBy`/`approvedAt` are
 *  the only stored trace, cleared by any further price edit so a second
 *  deviation always asks again. */
export interface SupplierPurchaseOrder {
  id: string;
  code: string;
  dealId: string;
  supplierId?: string;
  status: SupplierPurchaseOrderStatus;
  failureReason?: string;
  triggeredAt: string;
  lineItems?: PurchaseOrderLineItem[];
  expectedDeliveryDate?: string;
  approvedBy?: string;
  approvedAt?: string;
  sentBy?: string;
  sentAt?: string;
  /** The supplier's own "we have this order" — the first promise a sent PO
   *  asks of them, and what the follow-up engine chases for 24h after
   *  `sentAt`. */
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  /** Admin's confirmation that the goods physically arrived. A stand-in
   *  until Module 11's delivery screens (101–104) own receipt properly —
   *  without it, nobody owns "did the parts come?" at all. */
  receivedAt?: string;
  receivedBy?: string;
  /** Why each line's supplier was chosen (094) — the rules version and the
   *  full candidate ranking per category, frozen at draft time so a later
   *  rule change never rewrites the explanation of an existing PO. */
  matchedByRulesVersion?: number;
  selection?: CategoryMatchResult[];
  statusEvents?: PoStatusEvent[];
  /** The agreement terms in force when it was sent (098). */
  agreementTerms?: PurchaseOrderAgreementSnapshot;
  /** The payment terms it was sent under (100). */
  paymentTerms?: PurchaseOrderPaymentSnapshot;
  /** Set when its deal was cancelled after the order was placed, and Admin decided what to do (106). */
  orphanResolution?: PurchaseOrderOrphanResolution;
  /** Set on a small replacement order raised to put a snag right (136). */
  reworkSnagId?: string;
  isDemo: boolean;
}

/* ------------------------------------- Manufacturer production (096) */

/** Inside a manufacturer's "in production" (095) — `complete` hands the line
 *  to "ready to ship". A simple standard part uses a shorter list. */
export type ProductionStage = 'raw_material' | 'fabrication' | 'quality_testing' | 'packaging' | 'complete';

/** Part of AIEC's permanent documentation trail — what a later quality
 *  dispute is settled against. Never deleted. */
export interface ProductionEvidence {
  id: string;
  stage: ProductionStage;
  fileName: string;
  kind: 'photo' | 'document';
  /** Session-only preview (no storage bucket in this build). */
  previewUrl?: string;
  note?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ProductionEvent {
  id: string;
  kind: 'advanced' | 'regressed' | 'skipped';
  fromStage: ProductionStage;
  toStage: ProductionStage;
  at: string;
  byName: string;
  byRole: 'supplier' | 'admin';
  /** Required for a regression (what the defect was) or a skip. */
  reason?: string;
  /** Moved together with the rest of its production batch. */
  viaBatch?: boolean;
}

/** One manufactured PO line's production (096). Id is `prod-<lineItemId>`,
 *  so any screen holding a line can link straight to it. */
export interface ProductionRecord {
  id: string;
  poId: string;
  lineItemId: string;
  supplierId: string;
  /** The stages that apply to this item, in order, ending `complete`. */
  stages: ProductionStage[];
  currentStage: ProductionStage;
  stageEnteredAt: string;
  startedAt: string;
  completedAt?: string;
  /** Several AIEC orders built in one run — why they move in lockstep. */
  batchId?: string;
  evidence: ProductionEvidence[];
  events: ProductionEvent[];
  isDemo: boolean;
}

/* ------------------------------- Supplier rating & quality scorecard (097) */

/** Who a defect is really down to. Only `supplier` counts against the
 *  supplier's quality — a technician's installation error or transit damage
 *  is recorded, but never scored against the part's maker. */
export type DefectAttribution = 'supplier' | 'installation' | 'transport';

export interface OrderDefect {
  id: string;
  note: string;
  loggedBy: string;
  loggedAt: string;
  attribution: DefectAttribution;
  /** Set when a dispute (or Admin's own investigation) moved the blame. */
  reattributedBy?: string;
  reattributedAt?: string;
  reattributionNote?: string;
  /** Who carried the blame when it was first logged, so the history stays honest. */
  attributedBefore?: DefectAttribution;
  /** The delivery discrepancy report (108) this came from, so it is never logged twice. */
  sourceReportId?: string;
}

/** A supplier's challenge to one order's rating. Raising it changes
 *  nothing — only Admin's resolution does, and only as far as it says. */
export interface RatingDispute {
  raisedBy: string;
  raisedAt: string;
  reason: string;
  status: 'open' | 'upheld' | 'rejected';
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

/**
 * One delivered order's rating (097). Objective facts — delivery timing,
 * defects logged on receipt — plus Admin's optional own judgement; never a
 * black box. Supplier-level on-time rate and quality are derived from these,
 * so 026, 091 and 094 all read the same numbers through one engine.
 */
export interface SupplierOrderRating {
  id: string;
  supplierId: string;
  /** Absent for orders from before PO records existed in the app. */
  poId?: string;
  orderCode: string;
  siteName: string;
  expectedDeliveryDate: string;
  deliveredAt: string;
  /** Delivered minus promised, in whole days (negative = early). */
  timelinessDays: number;
  defects: OrderDefect[];
  /** Admin's qualitative 1–5, blended with the objective defect score. */
  adminQuality?: number;
  adminQualityNote?: string;
  adminQualityBy?: string;
  adminQualityAt?: string;
  dispute?: RatingDispute;
  /** Why it was late, when Admin tagged it (105). `external_event` is an excused delay. */
  delayCause?: DelayRootCause;
  isDemo: boolean;
}

/** Context shown beside a supplier's score (a regional disruption, say) —
 *  explains a number without ever changing it. */
export interface SupplierScoreContextNote {
  id: string;
  supplierId: string;
  note: string;
  /** Set when it came from a flagged supplier message (099). */
  sourceMessageId?: string;
  sourceThreadId?: string;
  addedBy: string;
  addedAt: string;
  isDemo: boolean;
}

/* ------------------------------------------ Delivery scheduling (101) */

/** Calendar dates in this section are plain `yyyy-mm-dd` keys, not instants:
 *  a delivery is booked for a day on the site's own calendar. */
export type DeliveryWindow = 'morning' | 'afternoon';

/** When a supplier can actually dispatch — what Admin may book against. */
export interface SupplierDispatchAvailability {
  supplierId: string;
  /** 0 = Sunday … 6 = Saturday. */
  weekdays: number[];
  windows: DeliveryWindow[];
  /** Deliveries the supplier can make in one day, across all their orders. */
  maxPerDay: number;
  /** Minimum notice, in days. */
  leadDays: number;
  blackouts: { date: string; reason: string }[];
  updatedBy: string;
  updatedAt: string;
  isDemo: boolean;
}

export type SiteReadinessItem = 'shaft_civil' | 'pit_depth' | 'machine_room' | 'power_supply' | 'access_route' | 'storage_space';

/** Whether the site can receive parts — one record per deal, because every
 *  PO on the deal goes to the same shaft. Confirmed only when every item is. */
export interface SiteReadiness {
  dealId: string;
  items: Record<SiteReadinessItem, boolean>;
  /** The person on site who vouched for it. */
  contactName?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  /** Why a confirmed site was reset (a delivery turned up and it wasn't). */
  resetReason?: string;
  resetAt?: string;
  isDemo: boolean;
}

/** Who a date moved on account of. Only `site` and `aiec` move the supplier's
 *  promised date — a supplier-caused delay stays measured against the
 *  original promise, so 097's on-time rating sees it. */
export type DeliveryRescheduleCause = 'supplier' | 'site' | 'aiec' | 'other';

export type DeliveryEventKind = 'scheduled' | 'rescheduled' | 'attempt_failed';

export interface DeliveryEvent {
  id: string;
  kind: DeliveryEventKind;
  at: string;
  byName: string;
  byRole: 'admin' | 'supplier';
  date?: string;
  window?: DeliveryWindow;
  fromDate?: string;
  fromWindow?: DeliveryWindow;
  cause?: DeliveryRescheduleCause;
  reason?: string;
  /** The supplier's promised date before this event moved it. */
  promiseMovedFrom?: string;
}

/** One PO's booked delivery. `attempt_failed` is a delivery that turned up
 *  and couldn't unload — not a reschedule — and needs a fresh date. */
export interface DeliverySchedule {
  id: string;
  poId: string;
  dealId: string;
  supplierId: string;
  status: 'scheduled' | 'attempt_failed';
  date?: string;
  window?: DeliveryWindow;
  /** A PO on the same deal that must be delivered first (cabin before drive unit). */
  dependsOnPoId?: string;
  failedAttempts: number;
  /** The installation job this delivery is what's holding up. */
  jobId?: string;
  events: DeliveryEvent[];
  createdAt: string;
  isDemo: boolean;
}

/* ------------------------------------------ Shipment tracking (102) */

export type ShipmentMilestone = 'dispatched' | 'in_transit' | 'nearby' | 'arrived';

/** How a vehicle's progress reaches AIEC: a live location feed, or the
 *  supplier telling us by hand (a smaller supplier's own vehicle with no
 *  telematics). A manual leg never shows a live pin. */
export type ShipmentTrackingSource = 'live_gps' | 'manual';

export interface ShipmentMilestoneEvent {
  milestone: ShipmentMilestone;
  at: string;
  source: 'gps' | 'manual';
  /** Who said so, for a manual update. */
  byName?: string;
  note?: string;
  /** The customer was messaged about it (customer_notified_flag). */
  customerNotifiedAt?: string;
  /** Why they weren't, when they weren't. */
  customerNotifySkipped?: 'opted_out' | 'no_contact';
}

/** One vehicle carrying some of a PO's lines. A PO whose lines ship on
 *  different vehicles has one leg each, tracked on its own. */
export interface ShipmentLeg {
  id: string;
  poId: string;
  dealId: string;
  supplierId: string;
  lineItemIds: string[];
  vehicleLabel: string;
  driverName: string;
  driverPhone?: string;
  source: ShipmentTrackingSource;
  origin: { name: string; lat: number; lng: number };
  dispatchedAt: string;
  /** The planned arrival — for a manual leg, the supplier's own estimate. */
  etaAt: string;
  /** A live feed that stopped reporting. The vehicle's position is frozen
   *  here and shown honestly as last known. */
  feedLostAt?: string;
  /** Why the feed is lost. `partner_outage`: the carrier's own integration broke (109), so every
   *  in-flight live leg of theirs falls back to milestones together, and comes back together. */
  feedLostReason?: 'partner_outage';
  /** The third-party carrier booked for this leg (109), when the supplier isn't delivering itself. */
  partnerId?: string;
  /** The rate card's price for this lane at booking, when the lane was on the card. */
  freightCost?: number;
  bookedByName?: string;
  milestones: ShipmentMilestoneEvent[];
  isDemo: boolean;
}

/* ------------------------------------ Supplier invoice matching (113) */

/** A price the supplier is invoicing that differs from the order, with the approved change that explains it. */
export interface InvoiceAdjustmentRef {
  /** The approved price change (093) accepted as the basis for the difference. */
  changeId: string;
  toPrice: number;
  acceptedBy: string;
  acceptedAt: string;
  note?: string;
}

export interface SupplierInvoiceLine {
  /** The order line it bills. Null for an item that is not on the order at all. */
  lineItemId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  adjustment?: InvoiceAdjustmentRef;
}

export type SupplierInvoiceEventKind = 'submitted' | 'adjustment_accepted' | 'rejected' | 'withdrawn' | 'reinstated' | 'mismatch_notified';

export interface SupplierInvoiceEvent {
  id: string;
  kind: SupplierInvoiceEventKind;
  at: string;
  byName: string;
  note?: string;
}

/** A supplier's invoice for an order. What matched is never stored: it is read each time from the order's own
 *  prices and the confirmed delivery quantities, so it can never drift from either. */
export interface SupplierInvoice {
  id: string;
  code: string;
  poId: string;
  supplierId: string;
  /** The supplier's own number for it. Unique per supplier among invoices not rejected. */
  invoiceNumber: string;
  /** `yyyy-mm-dd` on the document. */
  invoiceDate: string;
  /** GST rate on the document, snapshotted from the rate in force on `invoiceDate` (116). */
  gstPercent: number;
  /** The document's file name. There is no storage bucket here, so only the name is kept. */
  documentName?: string;
  lines: SupplierInvoiceLine[];
  submittedAt: string;
  submittedByName: string;
  submittedByRole: 'supplier' | 'admin';
  status: 'open' | 'rejected';
  rejectedReason?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  /** The supplier took it back themselves to correct it, rather than Admin sending it back. */
  withdrawnBySupplier?: boolean;
  /** The supplier was told, and Admin alerted, about a mismatch on this invoice: once, never repeatedly. */
  mismatchNotifiedAt?: string;
  events: SupplierInvoiceEvent[];
  isDemo: boolean;
}

/* ------------------------------------ Advance recovery (118) */

export type AdvanceRecoveryEventKind = 'started' | 'recovered' | 'written_off';

/* ------------------------------------ Bank reconciliation (120) */

/** What the bank connection is doing. While it is `unavailable` a run reports "could not run": comparing against nothing
 *  would read as a clean result, so it is never allowed to. */
export interface BankFeed {
  status: 'connected' | 'unavailable';
  since: string;
  reason?: 'outage' | 'consent_expired';
  lastStatementAt: string;
}

/** One line of the bank's own statement, as the feed delivered it. It is never edited by the app. */
export interface BankTransaction {
  id: string;
  postedAt: string;
  direction: 'debit' | 'credit';
  amount: number;
  /** The UTR or instruction reference the bank shows, when it shows one. */
  reference: string | null;
  narration: string;
  counterparty: string;
  isDemo: boolean;
}

export type ReconExceptionKind = 'unrecorded_credit' | 'unrecorded_debit' | 'missing_in_bank' | 'amount_differs' | 'bank_charge' | 'duplicate_debit' | 'duplicate_credit' | 'recorded_twice';
export type ReconReason = 'bank_fee' | 'rounding' | 'verified';
export type ReconRunStatus = 'passed' | 'review' | 'failed' | 'could_not_run';

/** A transaction that did not match cleanly. It stays open across runs until Admin explains it or the records catch up; the run
 *  log keeps what each run saw at the time. */
export interface ReconException {
  id: string;
  /** Stable across runs, so the same problem is one exception however many times it is seen. */
  key: string;
  kind: ReconExceptionKind;
  direction: 'in' | 'out';
  amount: number;
  /** Bank minus the app's figure, when both sides exist. */
  difference: number | null;
  bankTxnId: string | null;
  ledgerId: string | null;
  reference: string | null;
  counterparty: string;
  occurredAt: string;
  firstSeenAt: string;
  firstSeenRunId: string;
  lastSeenRunId: string;
  status: 'open' | 'reconciled' | 'cleared';
  reconciled?: { category: ReconReason; note: string; byName: string; at: string; confirmedSerious: boolean };
  clearedAt?: string;
  isDemo: boolean;
}

export interface ReconciliationRun {
  id: string;
  code: string;
  runAt: string;
  trigger: 'scheduled' | 'manual';
  byName: string;
  windowFrom: string;
  windowTo: string;
  status: ReconRunStatus;
  matchedCount: number;
  matchedAmount: number;
  /** Differences Admin had already explained and that were seen again. */
  explainedCount: number;
  /** Recorded in the app but not yet on the statement, inside the grace period. */
  pendingCount: number;
  matched: { bankId: string; ledgerId: string; difference: number }[];
  unmatched: { exceptionId: string; kind: ReconExceptionKind; direction: 'in' | 'out'; amount: number; reference: string | null; date: string; counterparty: string }[];
  feedReason?: 'outage' | 'consent_expired';
  isDemo: boolean;
}

/** Admin's own explanation of a month of supplier spending that stands out (119), so a spike caused by something unusual (a bulk
 *  order, a one-off purchase) is understood, not misread as a cost-control problem. It explains a number and never changes it. */
export interface SupplierSpendNote {
  id: string;
  /** `yyyy-mm`. One note per month. */
  month: string;
  label: string;
  note?: string;
  createdByName: string;
  createdAt: string;
  isDemo: boolean;
}

/** AIEC asking a supplier to return an advance for goods that never came. The advance itself is never edited: what comes back
 *  is a credit beside the payment (115), so the ledger shows both. */
export interface AdvanceRecovery {
  id: string;
  code: string;
  /** The executed `upfront` payment being recovered. */
  paymentId: string;
  poId: string;
  supplierId: string;
  /** The advance's net amount when recovery began. */
  amount: number;
  reason: string;
  status: 'open' | 'recovered' | 'written_off';
  startedByName: string;
  startedAt: string;
  recoveredAmount: number;
  writtenOffAmount: number;
  closedAt?: string;
  events: { id: string; kind: AdvanceRecoveryEventKind; at: string; byName: string; amount?: number; note?: string }[];
  isDemo: boolean;
}

/* ------------------------------------ Supplier dispute resolution (117) */

/** What a supplier is disputing: an amount they were paid (or are still owed), when a held retention is released,
 *  or an invoice AIEC sent back or would not match. */
export type SupplierDisputeKind = 'amount' | 'retention_timing' | 'invoice';
export type SupplierDisputeDecision = 'uphold' | 'supplier_favor' | 'partial';
export type DisputeProcessArea = 'invoice_matching' | 'payment_terms' | 'delivery_sop' | 'other';

export type SupplierDisputeEventKind = 'raised' | 'decided' | 'reopened' | 'process_flagged' | 'process_addressed';

export interface SupplierDisputeEvent {
  id: string;
  kind: SupplierDisputeEventKind;
  at: string;
  byName: string;
  note?: string;
}

/** The real correction a decision made, so it can be traced from the dispute to the payment or invoice it changed. */
export type DisputeCorrection = 'none' | 'payment_adjustment' | 'payment_amount' | 'retention_released' | 'invoice_accepted';

export interface SupplierDisputeDecisionRecord {
  id: string;
  decision: SupplierDisputeDecision;
  /** The extra money the decision gave the supplier. Zero for upholding. */
  amount: number;
  note: string;
  byName: string;
  at: string;
  correction: DisputeCorrection;
  /** The adjustment, payment, retention or invoice the correction landed on. */
  correctionRef: string | null;
}

/** A supplier dispute over a payment. The record keeps the supplier's own words and every decision; what the evidence says
 *  is read from the order, its invoices and payments each time, never copied here. */
export interface SupplierDispute {
  id: string;
  code: string;
  supplierId: string;
  poId: string;
  kind: SupplierDisputeKind;
  paymentId?: string;
  retentionId?: string;
  invoiceId?: string;
  /** The supplier's stated position, in their words. */
  position: string;
  /** What the supplier says it is owed on top of what it has, when the dispute is about an amount. */
  claimedAmount: number | null;
  /** The supplier has said it may stop taking AIEC's orders. */
  threatensHalt: boolean;
  raisedByRole: 'supplier' | 'admin';
  raisedByName: string;
  raisedAt: string;
  status: 'open' | 'resolved';
  /** 1 for the first time round; each time the supplier contests a decision it goes up by one. */
  round: number;
  /** When the current round started: the resolution clock runs from here. */
  roundStartedAt: string;
  decisions: SupplierDisputeDecisionRecord[];
  events: SupplierDisputeEvent[];
  /** The dispute showed a flaw in AIEC's own process rather than the supplier's fault. */
  processFlag?: {
    area: DisputeProcessArea;
    note: string;
    byName: string;
    at: string;
    status: 'open' | 'addressed';
    addressedNote?: string;
    addressedBy?: string;
    addressedAt?: string;
  };
  isDemo: boolean;
}

/* ------------------------------------ GST compliance (116) */

export type SupplierGstStanding = 'active' | 'suspended' | 'cancelled';

/** One recorded look at a supplier's GST standing, taken from the GST portal or on the accountant's word. The history is
 *  append-only; the latest is the current standing, and an older one is never rewritten. */
export interface SupplierGstCheck {
  id: string;
  supplierId: string;
  /** The GSTIN as it was when checked, so a later change of number is visible. */
  gstin: string;
  standing: SupplierGstStanding;
  /** The latest month (`yyyy-mm`) the supplier has filed its own return for. */
  lastReturnPeriod: string | null;
  /** For a suspension or cancellation: the day it took effect (`yyyy-mm-dd`). Credit from then on is in doubt. */
  effectiveFrom?: string;
  checkedAt: string;
  checkedByName: string;
  note?: string;
  isDemo: boolean;
}

/** A month's figures handed to the accountant. The snapshot lets a later change to that month be seen as a difference. */
export interface GstPeriodHandover {
  id: string;
  period: string;
  handedOverAt: string;
  byName: string;
  note?: string;
  outputGst: number;
  inputClaimable: number;
  atRisk: number;
  isDemo: boolean;
}

/* ------------------------------------ Supplier payment history (115) */

/** A correction made after a payment went out. The payment itself is never edited: this is a separate entry that
 *  points at it, so the ledger shows the original and what changed it, side by side. */
export interface SupplierPaymentAdjustment {
  id: string;
  paymentId: string;
  /** `credit`: money back to AIEC (a credit note, a partial reversal). `top_up`: a further amount paid on the same entry. */
  direction: 'credit' | 'top_up';
  amount: number;
  reason: string;
  byName: string;
  at: string;
  isDemo: boolean;
}

/** A supplier asking about a payment they were sent. It also lands in the order's 099 thread. */
export interface SupplierPaymentQuery {
  id: string;
  paymentId: string;
  note: string;
  byName: string;
  at: string;
  isDemo: boolean;
}

/* ------------------------------------ Supplier payment processing (111) */

/** The three parts a supplier order can be paid in (100's schedule). */
export type SupplierPaymentPart = 'upfront' | 'balance' | 'retention';
/** The milestone that made it due, as 100's `paymentSchedule` names it. */
export type SupplierPaymentTrigger = 'on_send' | 'on_acknowledge' | 'after_delivery' | 'on_handover';

/** `pending_approval`: due and waiting for Admin. `held`: Admin said not yet, with a reason.
 *  `approved`: still inside the reversal window, nothing has moved. `executed`: the transfer went. */
export type SupplierPaymentStatus = 'pending_approval' | 'held' | 'approved' | 'executed';

export type SupplierPaymentEventKind = 'triggered' | 'held' | 'hold_released' | 'approved' | 'reversed' | 'executed' | 'amount_changed';

export interface SupplierPaymentEvent {
  id: string;
  kind: SupplierPaymentEventKind;
  at: string;
  byName: string;
  note?: string;
}

/** One payment to a supplier, made real the moment its configured milestone fires (never before).
 *  Approving it is the deliberate last human step before money moves. */
export interface SupplierPayment {
  id: string;
  code: string;
  poId: string;
  supplierId: string;
  dealId: string;
  part: SupplierPaymentPart;
  trigger: SupplierPaymentTrigger;
  /** Frozen when it fired, so a later edit to the terms never changes what was owed. */
  amount: number;
  /** When the milestone fired. */
  triggeredAt: string;
  /** When it is actually owed: the same moment, or the end of the net period. */
  dueAt: string;
  status: SupplierPaymentStatus;
  heldReason?: string;
  /** Held by the assistant, not by Admin: a related dispute was still open when the payment fell due (112). */
  heldAuto?: 'related_dispute';
  heldAt?: string;
  heldByName?: string;
  /** `override`: Admin released this portion ahead of its milestone, with a reason (112). Never the default. */
  origin?: 'event' | 'override';
  overrideReason?: string;
  approvedAt?: string;
  approvedByName?: string;
  /** Until this moment an approval can be taken back. After it the transfer is irreversible. */
  reversibleUntil?: string;
  executedAt?: string;
  bankReference?: string;
  events: SupplierPaymentEvent[];
  isDemo: boolean;
}

/* ------------------------------------ Delivery analytics (110) */

/** A stretch when something outside anyone's control (a flood, closed expressway, strike) hit deliveries
 *  broadly. Annotated by Admin so a bad month is not misread as AIEC's own process failing. */
export interface DeliveryDisruption {
  id: string;
  label: string;
  note?: string;
  /** `yyyy-mm-dd`, inclusive. */
  startsOn: string;
  endsOn: string;
  createdByName: string;
  createdAt: string;
  isDemo: boolean;
}

/* ------------------------------------ Delivery partners (109) */

/** One priced lane on a partner's rate card. */
export interface DeliveryPartnerLane {
  id: string;
  /** Where the goods leave from (a supplier's city). */
  originCity: string;
  /** A city the partner delivers to. */
  destinationCity: string;
  distanceKm: number;
  ratePerTrip: number;
  transitDays: number;
}

export type PartnerEventKind = 'onboarded' | 'details' | 'lane_added' | 'paused' | 'resumed' | 'feed_outage' | 'feed_restored' | 'booked';

export interface PartnerEvent {
  id: string;
  kind: PartnerEventKind;
  at: string;
  byName: string;
  note?: string;
}

/** A third-party logistics partner: a different role from a supplier, an asset-light
 *  relationship AIEC orchestrates rather than owns. Performance is never stored, it is
 *  read off the trips they have actually made. */
export interface DeliveryPartner {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email?: string;
  /** Cities the partner delivers to. Booking offers only partners that serve the site's. */
  serviceAreas: string[];
  /** Whether their integration can give a live pin at all. */
  liveTrackingSupported: boolean;
  /** `outage` while their live feed is broken; in-flight deliveries fall back to milestones. */
  feedStatus: 'connected' | 'outage';
  feedBrokenSince?: string;
  rateCardRef: string;
  rateCardEffectiveFrom: string;
  lanes: DeliveryPartnerLane[];
  status: 'active' | 'paused';
  events: PartnerEvent[];
  createdAt: string;
  isDemo: boolean;
}

/** A completed carrier trip from before AIEC tracked it in-app: enough to judge them by. A trip
 *  since booked in-app is read from its own ShipmentLeg. */
export interface PartnerTripRecord {
  id: string;
  partnerId: string;
  poCode: string;
  siteName: string;
  laneLabel: string;
  /** What the supplier had promised the customer for this delivery. */
  promisedAt: string;
  dispatchedAt: string;
  /** The partner's own estimate at dispatch. */
  etaAt: string;
  arrivedAt: string;
  /** The delay was an event outside anyone's control (a flood, a strike): not held against them. */
  externalEvent?: boolean;
  isDemo: boolean;
}

/* ------------------------------------ Site delivery checklist (103) */

/** What was actually found when a part was checked against its PO line.
 *  `not_arrived` is not a fault: the part is on another vehicle or backordered,
 *  and stays shipped until it turns up. */
export type DeliveryItemVerdict = 'pending' | 'ok' | 'discrepancy' | 'not_arrived';

/** Any of these on an arrived item is a discrepancy. `count` covers short and over. */
export type DiscrepancyKind = 'damaged' | 'count' | 'wrong_spec';

/** A photograph taken at the tailgate. Session-only preview (no storage
 *  bucket in this build), permanent metadata — what a later dispute is
 *  settled against. */
export interface DeliveryPhoto {
  id: string;
  fileName: string;
  previewUrl?: string;
  capturedAt: string;
}

export interface DeliveryCheckItem {
  lineItemId: string;
  /** Snapshots, so the checklist reads the same after the PO is edited. */
  description: string;
  expectedQty: number;
  verdict: DeliveryItemVerdict;
  receivedQty?: number;
  conditionOk?: boolean;
  specOk?: boolean;
  kinds: DiscrepancyKind[];
  photos: DeliveryPhoto[];
  note?: string;
  checkedAt?: string;
  checkedByName?: string;
  /** The part's category and the SOP (107) it was pinned to when the checklist started: a
   *  checklist in progress finishes under the procedure it began with. */
  category?: string;
  sopSteps?: DeliverySopStep[];
  sopVersions?: SopVersionRef[];
  sopResults?: SopStepResult[];
}

/** Who stood at the tailgate. A site contact receiving in the technician's
 *  absence is a different accountability, recorded as such. */
export type DeliveryReceiverRole = 'technician' | 'site_contact';

export interface DeliveryReceiver {
  role: DeliveryReceiverRole;
  name: string;
  phone?: string;
}

/** One arrival, checked. A PO delivered in parts has one per arrival. Once
 *  completed it is never edited: a defect found at installation is a
 *  different record (an installation issue), not a rewrite of this one. */
export interface DeliveryChecklist {
  id: string;
  poId: string;
  dealId: string;
  supplierId: string;
  /** The vehicle it came on, when one was tracked (102). */
  legId?: string;
  status: 'in_progress' | 'completed';
  startedAt: string;
  startedByName: string;
  items: DeliveryCheckItem[];
  receivedBy?: DeliveryReceiver;
  /** A customer or site contact's acknowledgment, when the technician received. */
  siteAck?: { name: string; at: string };
  note?: string;
  /** Who used the app, if not the receiver (Admin recording for someone on site). */
  recordedByName?: string;
  completedByUserId?: string;
  completedAt?: string;
  isDemo: boolean;
}

export interface DiscrepancyReportItem {
  lineItemId: string;
  description: string;
  kinds: DiscrepancyKind[];
  expectedQty: number;
  receivedQty: number;
  note?: string;
  photoCount: number;
  /** Snapshots of the part's category and worth, so a report is still costed after its order is edited (110). */
  category?: string;
  value?: number;
}

/** Where a report has got to with the supplier. Only Admin moves it, and only forward:
 *  `credited` is money back instead of a replacement, both end the report. */
export type ReportResolution = 'reported' | 'replacement_requested' | 'replacement_shipped' | 'resolved' | 'credited';

/** Append-only account of what happened to a report and who did it. */
export interface ReportEvent {
  id: string;
  kind: 'raised' | 'details' | 'routed' | 'attributed' | 'resolution' | 'customer_told' | 'rush';
  at: string;
  byName: string;
  note?: string;
}

/** Raised the instant a checked item is found wrong (103), one per delivery
 *  (never one per item). 108 owns it from there: what happened, whose it is,
 *  the supplier told with the evidence, and the road to a replacement or a credit. */
export interface DeliveryDiscrepancyReport {
  id: string;
  code: string;
  poId: string;
  dealId: string;
  supplierId: string;
  checklistId: string;
  items: DiscrepancyReportItem[];
  /** `withdrawn` when every item was corrected before the checklist closed;
   *  `resolved` once the resolution is `resolved` or `credited`. */
  status: 'open' | 'withdrawn' | 'resolved';
  resolution: ReportResolution;
  /** What the person at the tailgate honestly thinks could have caused it. Several are allowed: it is
   *  Admin, not the technician, who decides whose it is. */
  possibleCauses: DefectAttribution[];
  causeNote?: string;
  /** A replacement is needed urgently to protect a booked installation. */
  rush: boolean;
  neededBy?: string;
  /** Admin's judgement. Only `supplier` marks down the supplier's quality (097). */
  attribution?: DefectAttribution;
  attributionNote?: string;
  attributedByName?: string;
  attributedAt?: string;
  replacementEta?: string;
  creditAmount?: number;
  /** Days the installation slipped because of it, when a replacement landed after it was due to start (110). */
  scheduleDelayDays?: number;
  routedToSupplierAt?: string;
  customerNotifiedAt?: string;
  events: ReportEvent[];
  createdAt: string;
  createdByName: string;
  isDemo: boolean;
}

/* ------------------------------------ Delivery delay escalation (105) */

/** How worried to be. `watch`: trending late but not yet. `late`: past what
 *  we are held to. `critical`: an installation is blocked, or it is days late. */
export type DelaySeverity = 'watch' | 'late' | 'critical';

/** What a late delivery does to the customer's installation. */
export type DelayImpact = 'blocks_install' | 'tight' | 'flexible' | 'none';

/** The real cause of a delay, so it is attributed rather than blended into
 *  "was late". `external_event` (a flood, a strike) is nobody's fault: the
 *  supplier's promise moves and their on-time rate is not marked down. */
export type DelayRootCause = 'supplier_production' | 'logistics_transit' | 'customs_documentation' | 'external_event';

/** One delivery that has been running late, and what has been done about it.
 *  Opened by the heartbeat when the live assessment first goes wrong, kept
 *  when it recovers (so the good news is visible), never deleted. */
export interface DeliveryDelayCase {
  id: string;
  poId: string;
  dealId: string;
  supplierId: string;
  status: 'open' | 'recovered';
  openedAt: string;
  /** The worst it has been while open. */
  worstSeverity: DelaySeverity;
  /** When it first went past what we are held to (a watch is not yet late). */
  lateSince?: string;
  /** Worst it has been, in hours past what we are held to. */
  peakGapHours: number;
  recoveredAt?: string;
  /** What "recovered" looked like: the ETA it settled at. */
  recoveredEta?: string;
  rootCause?: DelayRootCause;
  rootCauseNote?: string;
  /** The shared event, so one cause across many orders reads as one. */
  externalLabel?: string;
  causeTaggedByName?: string;
  causeTaggedAt?: string;
  /** Set when an external cause moved the promise, with the date it moved from. */
  promiseMovedFrom?: string;
  contactedSupplierAt?: string;
  customerNotifiedAt?: string;
  /** The arrival time the customer was told, so a later change can be told again. */
  customerNotifiedEta?: string;
  escalatedAt?: string;
  escalatedByName?: string;
  isDemo: boolean;
}

/* --------------------------------- Delivery SOP checklist (107) */

/** One thing a technician must verify on a part, beyond the counting, condition, spec and
 *  photograph every part gets. Written once, centrally, by Admin. */
export interface DeliverySopStep {
  id: string;
  label: string;
  labelHi?: string;
  labelMr?: string;
  hint?: string;
  hintHi?: string;
  hintMr?: string;
  /** A mandatory step must be ticked before the part can be confirmed. */
  mandatory: boolean;
  /** Ticking it needs a photograph of exactly that thing. */
  needsPhoto: boolean;
}

/** One version of one template. Append-only: an amendment is a new version with its own
 *  effective date, and the older one stays exactly as it was. */
export interface DeliverySopVersion {
  id: string;
  templateId: string;
  version: number;
  /** Applies to checklists started from this instant on. */
  effectiveFrom: string;
  steps: DeliverySopStep[];
  changeNote: string;
  createdByName: string;
  createdAt: string;
}

/** `all` is the master template every part follows; any other category adds its own steps to it. */
export interface DeliverySopTemplate {
  id: string;
  category: string;
  name: string;
  versions: DeliverySopVersion[];
  createdByName: string;
  createdAt: string;
  isDemo: boolean;
}

export interface SopVersionRef {
  templateId: string;
  versionId: string;
  version: number;
  category: string;
}

export interface SopStepResult {
  stepId: string;
  done: boolean;
  photo?: DeliveryPhoto;
}

/* -------------------------------- Delivery confirmation (104) */

/** Who put a signature on it: whoever AIEC's checklist named as the receiver,
 *  and, when present, the customer or a second site contact. */
export type ConfirmationPartyRole = 'technician' | 'site_contact' | 'customer';

export interface ConfirmationSignature {
  role: ConfirmationPartyRole;
  name: string;
  /** A flat PNG data URL, as SignaturePad produces. */
  signature: string;
  signedAt: string;
}

/** One line of what was checked, frozen the moment the checklist closed. */
export interface DeliveryConfirmationItem {
  lineItemId: string;
  description: string;
  expectedQty: number;
  receivedQty: number;
  verdict: 'ok' | 'discrepancy' | 'not_arrived';
  kinds: DiscrepancyKind[];
  photoCount: number;
  note?: string;
}

/** The clean, signable summary of one checked delivery. It exists from the
 *  moment the checklist (103) closes, and is locked the moment it is signed:
 *  a signed confirmation is never edited. */
export interface DeliveryConfirmation {
  id: string;
  code: string;
  checklistId: string;
  poId: string;
  dealId: string;
  supplierId: string;
  legId?: string;
  status: 'awaiting_signature' | 'signed';
  items: DeliveryConfirmationItem[];
  createdAt: string;
  signatures: ConfirmationSignature[];
  /** Why only one side signed (the customer was not on site). */
  note?: string;
  /** Who used the app, if not the person who signed. */
  recordedByName?: string;
  /** When the signatures were actually drawn, if they reached the server later (offline on site). */
  capturedAt?: string;
  signedAt?: string;
  /** The discrepancy reports (103) this delivery raised. */
  reportIds: string[];
  /** Their state at the moment of signing: an unresolved one does not block the signature. */
  reportsAtSigning?: { id: string; code: string; status: DeliveryDiscrepancyReport['status'] }[];
  /** Whether signing this finished every part ordered for the deal, which is what fires a
   *  "due on material delivery" payment stage. */
  materialsComplete?: boolean;
  isDemo: boolean;
}

/* ---------------------------------- Supplier payment terms (100) */

/** Trust earned through performance: a new supplier pays its way in with an
 *  advance; a proven one is paid on net terms. */
export type SupplierTrustTier = 'new' | 'standard' | 'trusted';

/** `net`: everything after delivery. `milestone`: part on the supplier's
 *  order confirmation, the rest after delivery. `advance`: part up front,
 *  before the supplier starts. */
export type SupplierPaymentTermType = 'net' | 'milestone' | 'advance';

export interface SupplierPaymentTermSettings {
  termType: SupplierPaymentTermType;
  /** Share paid before delivery (0 for `net`). */
  upfrontPct: number;
  /** Share held back until the installation is handed over. */
  retentionPct: number;
}

export interface SupplierPaymentTermsOverride {
  settings: SupplierPaymentTermSettings;
  reason: string;
  setBy: string;
  setAt: string;
}

/** The root of how AIEC pays suppliers. Net days after delivery are not
 *  here — they belong to each supplier's agreement (098). */
export interface SupplierPaymentTermsConfig {
  tiers: Record<SupplierTrustTier, SupplierPaymentTermSettings>;
  /** Release a retention by itself when its installation is handed over. Off by default: a held amount stays held until Admin releases it (118). */
  autoReleaseRetention?: boolean;
  updatedBy?: string;
  updatedAt?: string;
}

/** Every change to a supplier's terms, with the scorecard at that moment —
 *  a graduation is justified by the record, not by memory. */
export interface SupplierTermsChange {
  id: string;
  /** Unset for a change to a tier's defaults. */
  supplierId?: string;
  kind: 'tier' | 'override_set' | 'override_cleared' | 'tier_defaults';
  fromTier?: SupplierTrustTier;
  toTier?: SupplierTrustTier;
  settings?: SupplierPaymentTermSettings;
  reason: string;
  scoreAtChange: number | null;
  ratedOrdersAtChange: number;
  by: string;
  at: string;
  isDemo: boolean;
}

/** The payment terms a PO was sent under, frozen with it (like 098's). */
export interface PurchaseOrderPaymentSnapshot extends SupplierPaymentTermSettings {
  tier: SupplierTrustTier;
  custom: boolean;
  /** One-off changes to this order's split, oldest first. Append-only: the reason for a deviation is never lost (112). */
  deviations?: PaymentDeviation[];
}

/** A one-off arrangement that moved an order off its tier's default split. */
export interface PaymentDeviation {
  id: string;
  at: string;
  byName: string;
  reason: string;
  before: { upfrontPct: number; retentionPct: number };
  after: { upfrontPct: number; retentionPct: number };
}

export type SupplierRetentionStatus = 'held' | 'paused' | 'released' | 'withheld';

/** The share held back from a delivered order until its installation is
 *  handed over — released automatically, never left in limbo. */
export interface SupplierRetention {
  id: string;
  poId: string;
  supplierId: string;
  dealId: string;
  pct: number;
  amount: number;
  heldAt: string;
  status: SupplierRetentionStatus;
  /** Paused because a supplier-attributed defect was logged on the order. */
  pausedAt?: string;
  decidedAt?: string;
  /** `system` when released automatically at handover. */
  decidedBy?: string;
  decisionReason?: string;
  isDemo: boolean;
}

/* -------------------------------- Supplier communication thread (099) */

/** How a message happened. Anything but `in_app` was a call, email or visit
 *  logged here afterwards, so the whole conversation stays in one place. */
export type SupplierMessageChannel = 'in_app' | 'phone' | 'email' | 'whatsapp' | 'in_person';
export type SupplierMessageAuthor = 'aiec' | 'supplier';

/** One conversation with a supplier: about one PO, or their general thread
 *  (no `relatedPoId`). Kept apart from every customer-facing channel. */
export interface SupplierThread {
  id: string;
  supplierId: string;
  relatedPoId?: string;
  createdAt: string;
  isDemo: boolean;
}

export interface SupplierMessage {
  id: string;
  threadId: string;
  author: SupplierMessageAuthor;
  /** The staff member or supplier contact — several AIEC staff may write. */
  authorName: string;
  authorUserId?: string;
  body: string;
  channel: SupplierMessageChannel;
  /** When it happened — for a logged call, when the call was. */
  at: string;
  /** Who logged an off-app conversation. */
  loggedBy?: string;
  /** Whether the other side owes an answer. Logged calls were answered live. */
  expectsReply: boolean;
  /** A PO this message is about — a live link to the record, not a copy. */
  poRef?: string;
  /** A document attached by name (this build has no file storage). */
  attachmentName?: string;
  /** Photographs and files sent as evidence, by name (108). */
  evidenceNames?: string[];
  /** Needs an answer sooner than the usual day (a rush replacement). */
  urgent?: boolean;
  /** When the other side first opened it (the read receipt). */
  readAt?: string;
  /** Put on the supplier's formal record as a 097 context note. */
  flaggedNoteId?: string;
  isDemo: boolean;
}

/* ------------------------------------------ Supplier agreement (098) */

/** The commercial terms of one version of a supplier's agreement. These are
 *  the operational thresholds themselves, not a description of them:
 *  `deliverySlaDays` sets a sent PO's promised date (so 095's delay flag and
 *  097's on-time rating), and `paymentTermsDays` sets when AIEC owes payment. */
export interface SupplierAgreementTerms {
  /** Days from a PO being sent to the parts being delivered. */
  deliverySlaDays: number;
  /** Net days after delivery that AIEC pays within. */
  paymentTermsDays: number;
  /** The quality score (1–5, 097's scale) the supplier commits to holding. */
  minQualityScore: number;
  /** Standards and certifications the parts must meet, as agreed. */
  qualityStandards: string;
  /** The supplier's own warranty on its parts, passed through to the end customer. */
  warrantyMonths: number;
}

export type SupplierAgreementVersionKind = 'initial' | 'amendment' | 'renewal';

/** Where a supplier's agreement stands today. Only `active` and `expiring`
 *  allow a new PO to be sent. */
export type SupplierAgreementStatus = 'none' | 'active' | 'expiring' | 'lapsed';

/** One version of the agreement. Versions are append-only — an amendment
 *  never rewrites an earlier version, so a PO always knows the terms it was
 *  sent under. The version in force at any moment is the latest one whose
 *  `effectiveFrom` has arrived. */
export interface SupplierAgreementVersion {
  id: string;
  supplierId: string;
  version: number;
  kind: SupplierAgreementVersionKind;
  terms: SupplierAgreementTerms;
  effectiveFrom: string;
  expiresOn: string;
  /** The signed document (agreement_terms_document). An amendment agreed by
   *  phone isn't in force on paper until this exists. Name only — this build
   *  has no file storage (see BUILD_README). */
  documentName: string;
  /** What changed and why — required for anything after the first version. */
  reason?: string;
  /** The supplier is the manufacturer of record and warrants its own parts;
   *  AIEC orchestrates. A version can't be recorded without it. */
  warrantyPassThrough: true;
  recordedBy: string;
  recordedAt: string;
  /** The supplier's own confirmation that this is what they signed. */
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  isDemo: boolean;
}

/** The terms a PO was sent under, frozen at send — a later amendment or a
 *  lapse never changes an order already in flight. */
export interface PurchaseOrderAgreementSnapshot {
  agreementVersionId: string;
  version: number;
  deliverySlaDays: number;
  paymentTermsDays: number;
}

/* ------------------------------------------ Auto-PO trigger rules (094) */

/** When a won deal's POs draft by themselves. `on_first_payment` waits for
 *  the advance stage to clear — less exposure before the customer has paid. */
export type PoTriggerCondition = 'on_countersignature' | 'on_first_payment';

export type SupplierMatchStrategy = 'price' | 'speed' | 'performance' | 'blend';

/** Percentages; the strategy presets use one factor at 100. */
export interface SupplierMatchWeights {
  price: number;
  speed: number;
  performance: number;
}

/** One supplier's standing for one category, with every factor shown. */
export interface SupplierMatchCandidate {
  supplierId: string;
  supplierName: string;
  itemId: string;
  unitPrice: number;
  leadTimeDays: number;
  /** 0..1 — 1 is the cheapest / fastest candidate for this category. */
  priceScore: number;
  speedScore: number;
  performanceScore: number;
  /** A supplier with no order history gets a neutral score, not zero. */
  performanceIsDefault: boolean;
  /** Weighted total, 0..1. */
  total: number;
}

export interface CategoryMatchResult {
  category: string;
  chosenSupplierId: string | null;
  reason: 'assigned_supplier' | 'best_score' | 'no_candidate';
  /** No listing fit the deal's drive type, so any live one was used. */
  driveTypeFallback: boolean;
  candidates: SupplierMatchCandidate[];
}

export interface AutoPoSimulationResult {
  at: string;
  byName: string;
  rulesVersion: number;
  /** Run against rules still being edited, not the saved ones. */
  usedUnsavedRules: boolean;
  driveType: DriveType | null;
  assignedSupplierId: string | null;
  results: CategoryMatchResult[];
  totalValue: number;
  /** Would any resulting PO need Admin sign-off before sending? */
  wouldNeedApproval: boolean;
  /** Share of total PO value per supplier, largest first. */
  valueShare: { supplierId: string; supplierName: string; sharePct: number }[];
}

/** The single configuration governing automated supplier ordering (094) —
 *  092's drafting, matching and approval gate read these and nothing else. */
export interface AutoPoRules {
  autoDraftEnabled: boolean;
  triggerCondition: PoTriggerCondition;
  strategy: SupplierMatchStrategy;
  /** Used as-is for `blend`; the other strategies use their preset. */
  weights: SupplierMatchWeights;
  /** The deal's own assigned supplier wins any category it can supply. */
  preferAssignedSupplier: boolean;
  /** A PO worth more than this (₹, GST-inclusive) is held for Admin. */
  approvalThreshold: number;
  version: number;
  updatedBy?: string;
  updatedAt?: string;
  lastSimulation?: AutoPoSimulationResult;
}

/** `pending_review` — a new item whose own details looked implausible on
 *  submission (093's sanity check); it can't be drafted onto a PO until
 *  Admin clears it. `discontinued` leaves every PO already drafted with it
 *  untouched (their lines snapshot the price) and only drops it from new
 *  drafting. `rejected` — Admin declined a flagged new item. */
export type CatalogItemStatus = 'active' | 'pending_review' | 'discontinued' | 'rejected';

/** One supplier's own published part — the single source 092's PO drafting
 *  prices from (093 owns the full surface). There is no second, internal
 *  parts-cost table: what a supplier publishes here *is* AIEC's cost
 *  assumption. Two suppliers' equivalent items at very different prices
 *  are both kept as-is — that spread is sourcing information, not an
 *  error to correct. */
export interface SupplierCatalogItem {
  id: string;
  supplierId: string;
  /** Component category key (`partCategory.*`), the same keys 092 drafts by. */
  category: string;
  description: string;
  /** Free-text spec as the supplier states it — capacity, speed, rating. */
  specification: string;
  /** The Quotation Engine's own `DriveType` taxonomy; empty means the part
   *  fits any drive type. */
  driveTypes: DriveType[];
  /** The live price — what new POs draft at. A price change awaiting
   *  Admin's review never touches this until approved. */
  unitPrice: number;
  leadTimeDays: number;
  status: CatalogItemStatus;
  /** Set while a supplier's price change waits for review. */
  pendingPrice?: number;
  pendingPriceChangeId?: string;
  updatedAt: string;
  isDemo: boolean;
}

export type CatalogPriceChangeSource = 'supplier' | 'admin' | 'bulk_upload';

/** Append-only price history per catalog item — 092's "this PO's cost
 *  differs from the draft" context, and the review trail for 093's
 *  threshold rule. `fromPrice` is null for an item's first listing. */
export interface CatalogPriceChange {
  id: string;
  itemId: string;
  supplierId: string;
  fromPrice: number | null;
  toPrice: number;
  source: CatalogPriceChangeSource;
  requestedBy: string;
  requestedAt: string;
  status: 'applied' | 'pending' | 'rejected' | 'superseded';
  /** Why this one needed review (sanity-check issue keys, or the threshold). */
  reviewReasonKeys?: string[];
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  isDemo: boolean;
}

/**
 * The single, reliable kickoff event fired once a deal is fully signed —
 * screen 077. Idempotent per `dealId`: triggering it again when a record
 * already exists returns the existing one rather than re-running side
 * effects or creating a second set of Payments/commissions for the same
 * deal, which is also what keeps two deals closing minutes apart from
 * ever sharing or overwriting each other's kickoff.
 */
export interface DealClosure {
  id: string;
  dealId: string;
  closedAt: string;
  paymentRecordIds: string[];
  supplierPoId?: string;
  /** A failed PO kickoff never blocks this record from existing — the deal
   *  genuinely closed regardless, and the failure surfaces separately on
   *  the Automation Health Monitor (screen 027) instead. */
  supplierPoFailed: boolean;
  commissionEntryIds: string[];
  /** A closed deal is never deleted to reverse it — voiding just logs the
   *  reversal on the existing record, fully audited. */
  voided: boolean;
  voidReason?: string;
  voidedBy?: string;
  voidedAt?: string;
  isDemo: boolean;
}

/**
 * Fixed taxonomy for the customer-concern script library — screen 078.
 * `competitor_comparison`, `price_too_high` and `wants_to_delay` reuse the
 * exact literal values `NegotiationObjectionKey` already uses, so the human
 * quick-reference and the bot's Objection Scenario Map (screen 071) draw
 * from the same well on those three, never two independently drifting
 * classifications. The other three are concerns the bot doesn't yet handle.
 */
export type ObjectionCategory =
  | 'safety_new_brand'
  | 'installation_disruption'
  | 'timeline_worry'
  | 'competitor_comparison'
  | 'price_too_high'
  | 'wants_to_delay'
  | 'other';

/** One saved edit of a script's response text — same shape as
 *  `TemplateVersion` (screen 051) so both content libraries keep a
 *  reviewable, revertible history the same way. */
export interface ObjectionScriptVersion {
  version: number;
  responseText: string;
  editedBy: string;
  editedAt: string;
}

export type ObjectionScriptStatus = 'approved' | 'suggested' | 'archived';

/**
 * One approved talking point for a customer concern, used verbatim by human
 * sales staff and referenced when configuring the bot's Objection Scenario
 * Map. A `suggested` script is a pattern a sales user noticed emerging in a
 * real conversation (Customer Reply Inbox or Live Negotiation Thread) that
 * isn't in the library yet — `sourceNote` records where it came from — and
 * sits for review before an admin promotes it to `approved`, so a real
 * emerging pattern is never just lost.
 */
export interface ObjectionScript {
  id: string;
  code: string;
  category: ObjectionCategory;
  responseText: string;
  /** Real BIS/IS or other standard references the response cites, kept
   *  separate from the prose so a safety/compliance claim can be checked
   *  for currency without re-reading the whole script. */
  citedStandards?: string[];
  status: ObjectionScriptStatus;
  sourceNote?: string;
  versions: ObjectionScriptVersion[];
  updatedAt: string;
  updatedBy: string;
  isDemo: boolean;
}

/**
 * One real instance of a script being used with a lead, the raw material
 * for effectiveness scoring. Kept separate from `ObjectionScript` itself so
 * the same before/after stage-movement approach the Communication Analytics
 * screen's conversion-influence metric uses (did the lead this was used on
 * go on to reach "won"?) can be computed per script, and per territory
 * (grouped by `Lead.city`, since a script performing well in one city's
 * customer base doesn't guarantee the same elsewhere).
 */
export interface ObjectionScriptUsage {
  id: string;
  scriptId: string;
  leadId: string;
  usedAt: string;
  isDemo: boolean;
}

export type CompetitorPricePosition = 'premium' | 'comparable' | 'budget';

/** Same version-history shape as `ObjectionScriptVersion` / `TemplateVersion`
 *  — this content asset gets reviewed and refreshed periodically, not
 *  automated, so a reviewable history matters the same way. */
export interface CompetitorVersion {
  version: number;
  priceSummary: string;
  strengths: string[];
  differentiationPoints: string[];
  editedBy: string;
  editedAt: string;
}

/**
 * One competitor's sales-enablement battlecard — screen 079. Internal-only
 * by design: `internalOnlyFlag` is always `true` and this type is never
 * read by anything in the communication engine (`CommTemplate`,
 * `NegotiationBotConfig`, etc.), so it is structurally impossible for this
 * content to reach a customer message, not just a UI convention.
 */
export interface Competitor {
  id: string;
  code: string;
  name: string;
  pricePosition: CompetitorPricePosition;
  priceSummary: string;
  /** Constructive, factual points — genuine competitor strengths, not
   *  disparagement. */
  strengths: string[];
  /** Grounded in AIEC's actual capabilities (aggregator breadth, automated
   *  responsiveness, transparent stage tracking), never unverifiable claims. */
  differentiationPoints: string[];
  internalOnlyFlag: true;
  /** Any sales user can raise this the moment they notice stale or
   *  inaccurate positioning — Admin doesn't have to notice independently. */
  flaggedForReview: boolean;
  flagReason?: string;
  flaggedBy?: string;
  flaggedAt?: string;
  versions: CompetitorVersion[];
  lastReviewedAt: string;
  lastReviewedBy: string;
  isDemo: boolean;
}

/**
 * The internal-only celebratory counterpart to `DealClosure` — screen 080.
 * Deliberately holds only what a human actually decides here (the
 * acknowledgment and an optional feedback note); who was involved and what
 * they earned are read live off `Lead`/`CommissionEntry` on every view, the
 * same records the Commission & Rewards Tracker itself reads, so this is
 * never a second, driftable calculation. Created the moment a deal is first
 * viewed as won (mirroring `DealClosure`'s own creation), so the moment
 * persists for a staff member who was offline when it actually closed
 * rather than depending on a fleeting push they might miss.
 */
export interface DealCelebration {
  id: string;
  dealId: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  /** Admin-only content by design — never rendered back to a surveyor,
   *  including the one who wrote it. */
  feedbackNote?: string;
  createdAt: string;
  isDemo: boolean;
}

/* ------------------------------------------------------------- Quotations */

export type DriveType = 'hydraulic' | 'geared_traction' | 'gearless_traction' | 'mrl' | 'vacuum' | 'screw_driven';

export type FinishTier = 'standard' | 'premium' | 'luxury';

export type PackageTier = 'basic' | 'premium' | 'luxury';

export type QuotationStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'expired'
  | 'superseded'
  | 'change_requested';

export type QuotationDeliveryChannel = 'whatsapp' | 'email';

export interface QuotationDeliveryResult {
  channel: QuotationDeliveryChannel;
  status: 'sent' | 'delivered' | 'failed';
  failureReason?: string;
  at: string;
}

/** Itemized so the breakdown always sums exactly to the displayed total,
 *  and so a manual adjustment (e.g. a difficult site's civil work) is
 *  visible with its own required note rather than folded silently in. */
export interface QuotationCostBreakdown {
  equipmentCost: number;
  civilWorkEstimate: number;
  civilWorkAdjustmentNote?: string;
  installationLaborCost: number;
  transportCost: number;
  /** Cost delta contributed per additional floor above the base — shown
   *  explicitly since stops are a major real-world cost driver. */
  perFloorCostDelta: number;
  gstPercent: number;
  gstAmount: number;
  marginPct: number;
  marginAmount: number;
  /** Sum of every line above, GST-inclusive — the customer-facing price. */
  finalPrice: number;
}

export interface Quotation {
  id: string;
  code: string;
  leadId: string;
  version: number;
  /** The immediately-prior version this one replaced, if any — the whole
   *  chain is reconstructable by walking this pointer back to version 1. */
  supersedesQuotationId?: string;
  status: QuotationStatus;

  /* Input specs (061) */
  driveType: DriveType;
  capacityPersons: number;
  capacityKg: number;
  stopsCount: number;
  travelHeightM: number;
  finishTier: FinishTier;
  /** Set when floor count or another survey estimate was overridden here,
   *  never silently — always paired with a reason. */
  specOverrideNote?: string;
  /** True for a configuration outside the standard presets (e.g. a
   *  hospital stretcher lift) — routes to manual Admin pricing instead of
   *  the auto cost engine. */
  customConfiguration: boolean;
  /** True for 20+ floors — flagged for specialized review rather than the
   *  standard auto-quotation flow. */
  needsSpecializedReview: boolean;

  /* Cost breakdown (062) */
  cost: QuotationCostBreakdown;

  /* Package comparison (065) */
  comparisonSetId?: string;
  packageTier?: PackageTier;
  recommended?: boolean;

  /* Template & branding (063) — snapshotted at send time so an edited
   *  template never silently changes an already-sent quote. */
  templateId?: string;
  templateVersionAtSend?: number;

  /* Customer-facing (064) */
  validityDate?: string;
  viewedAt?: string;
  acceptedAt?: string;

  /* Send & delivery (068) */
  deliveryChannels: QuotationDeliveryChannel[];
  coverMessage?: string;
  scheduledSendAt?: string;
  sentAt?: string;
  deliveryResults: QuotationDeliveryResult[];

  /* Version history (066) */
  createdBy: string;
  createdAt: string;
  createdReasonKey?: string;
  createdReasonNote?: string;

  isDemo: boolean;
}

export type QuotationTemplateVariant = 'residential_standard' | 'premium_luxury' | 'commercial_bulk';

export interface QuotationTemplate {
  id: string;
  name: string;
  variant: QuotationTemplateVariant;
  version: number;
  logoAssetUrl?: string;
  /** National-default legal boilerplate. */
  legalBoilerplate: string;
  /** Keyed by state name — layered on top of the national default. */
  stateOverrides: Record<string, string>;
  validityPeriodDays: number;
  footerTagline: string;
  updatedAt: string;
  updatedBy: string;
  isDemo: boolean;
}

export type DiscountRequestStatus = 'pending' | 'approved' | 'rejected';

export interface DiscountRequest {
  id: string;
  quotationId: string;
  leadId: string;
  requestedByUserId: string;
  requestedDiscountPct: number;
  reasonNote: string;
  resultingMarginPct: number;
  urgent: boolean;
  status: DiscountRequestStatus;
  approverId?: string;
  decidedAt?: string;
  rejectionReason?: string;
  counterSuggestionPct?: number;
  /** Set when this request is a resubmission of an earlier rejected one —
   *  surfaces the repeated-request pattern rather than treating it as fresh. */
  resubmissionOfId?: string;
  createdAt: string;
  isDemo: boolean;
}

export interface AmcPricingTier {
  tier: 'basic' | 'standard' | 'comprehensive';
  annualPrice: number;
  responseTimeHours: number;
}

/** The single governed root of every price the Quotation Engine
 *  calculates — screen 070. Changing it only affects quotes generated
 *  after the change; already-sent quotes keep their locked-in numbers. */
export interface PricingConfig {
  driveTypeBasePrice: Record<DriveType, number>;
  /** Percent cost increase per additional floor above the base, per drive
   *  type — varies roughly 10-25% in practice, never a single flat number. */
  perFloorIncrementPct: Record<DriveType, number>;
  minimumMarginFloorPct: number;
  gstRatePct: number;
  scheduledGstChange?: { newRatePct: number; effectiveDate: string };
  amcTiers: AmcPricingTier[];
  updatedAt: string;
}

/* -------------------------------------------------------------------- Jobs */

export type JobStatus =
  | 'scheduled'
  | 'materials_pending'
  | 'in_progress'
  | 'qc_pending'
  | 'handover_pending'
  | 'completed'
  | 'on_hold';

export interface JobStep {
  id: string;
  labelKey: string;
  status: 'complete' | 'current' | 'upcoming' | 'blocked';
  /** Safety-critical steps cannot be completed without attached evidence. */
  requiresEvidence: boolean;
  evidenceCount: number;
  completedAt?: string;
  /** The photos attached to this step, one or more per evidence slot the SOP names (123). A step finished before evidence was kept
   *  in the app only has `evidenceCount`. */
  evidence?: JobEvidence[];
  /** Set when the step genuinely does not apply to this configuration: it is done, but says so and why, and is never mistaken for a
   *  step that applied and was skipped. */
  notApplicable?: { reason: string; byName: string; at: string };
  /** Required evidence that could not be captured, explained (124). */
  evidenceExceptions?: JobEvidenceException[];
  completedByName?: string;
}

export interface JobEvidence {
  id: string;
  slotId: string;
  /** A photo, or a short video for a check that is about motion (a door-sensor test, a safety-gear trip). */
  kind: 'photo' | 'video';
  fileName: string;
  /** A data URL, so the picture still shows on other screens once the capture screen is gone. For a video, its poster frame. */
  previewUrl: string;
  /** Where a video plays from. Held in memory in this build (see BUILD_README); a real store would hand back a durable URL. */
  mediaUrl?: string;
  mimeType: string;
  sizeBytes: number;
  durationS?: number;
  /** When it was taken on site, never when it reached the server. */
  capturedAt: string;
  /** Where the phone was, when it could say quickly. Never waited for. */
  location?: GeoPoint;
  byUserId: string;
  byName: string;
  /** The technician says this shows a problem rather than a clean pass: kept in full, and it does not count as the proof the step needs. */
  finding?: boolean;
  note?: string;
  /** A later capture replaced this one for the slot. It stays in the record: evidence is never deleted, only superseded. */
  supersededAt?: string;
}

/** A required piece of evidence that genuinely could not be captured as specified (a physically inaccessible angle in a tight shaft),
 *  with the technician's explanation. It lets the work go on, and Admin is told. */
export interface JobEvidenceException {
  slotId: string;
  reason: string;
  byName: string;
  at: string;
}

/* ------------------------------------ Site check-in / check-out (125) */

/** Why someone leaves the site with steps still open. It decides how loudly Admin is told: an ordinary end of day is not an emergency. */
export type SiteLeaveReason = 'end_of_day' | 'waiting_material' | 'site_blocked' | 'emergency' | 'other';

/** One person's one visit to a site: in, and (later) out. **The only record of who was on site and when.** The live map's technician view
 *  (014), the job screen (122) and every on-site duration read these, so there is one true time, per person and never a blended job
 *  presence. A person who forgets to check out has an open record that is closed by their own confirmation of when they left, never by a
 *  guess. */
export interface SiteCheckIn {
  id: string;
  jobId: string;
  userId: string;
  userName: string;
  /** When they arrived on site: the moment on the phone, which is not the moment it reached the server. */
  checkInAt: string;
  /** Where the phone said it was, or null when it could not say (permission refused, no signal) and the person said so. */
  checkInLocation: GeoPoint | null;
  /** The phone's own reported accuracy radius in metres, when it gave one. */
  checkInAccuracyM: number | null;
  /** Metres from the fix to the job's site. */
  checkInDriftM: number | null;
  /** `clean` within the radius; `borderline` outside it but within the phone's own margin of error; `mismatch` clearly elsewhere;
   *  `unverified` no location at all. The last two need the person's own reason and tell Admin. */
  checkInVerdict: 'clean' | 'borderline' | 'mismatch' | 'unverified';
  checkInReason?: string;
  checkOutAt?: string;
  checkOutLocation?: GeoPoint | null;
  /** `confirmed_late`: they had forgotten, and told the app when they really left the next time they opened it. */
  checkOutKind?: 'manual' | 'confirmed_late';
  /** When a forgotten visit was actually closed by the person's confirmation (their `checkOutAt` is when they said they left). */
  closedAt?: string;
  leaveReason?: SiteLeaveReason;
  leaveNote?: string;
  /** The person's own steps that were not done when they left, so Admin is told rather than finding out. */
  openStepIds?: string[];
  isDemo: boolean;
}

/* ------------------------------------ Safety compliance checklist (126) */

/** What kind of check a safety item is. `state` ones are added by Admin for a state's own Lift Act requirements. */
export type SafetyItemKind = 'device' | 'trial' | 'state';
export type SafetyResult = 'pass' | 'fail';
/** What was done about a failure. A minor adjustment or a replaced part is fixed and retested on the spot; a fundamental defect
 *  is rework, and Admin takes it from there. */
export type SafetyFixKind = 'minor_adjustment' | 'part_replaced' | 'needs_rework';

/** One safety check the procedure asks for on every installation, modelled on the state lift inspector's pre-commissioning checks. The
 *  proof for it is the evidence already captured on the installation checklist (124): `slots` are the evidence slots that must have proof
 *  before a pass can be recorded. */
export interface SafetyItemDef {
  id: string;
  kind: 'device' | 'trial';
  /** The installation step this belongs to, so an assistant may record the checks on their own steps. */
  stepId: string;
  slots: string[];
  /** Other checks that come first, in the order the inspector takes them. */
  dependsOn: string[];
  appliesWhen?: InstallSopApplicability;
}

/** A requirement of one state's own Lift Act beyond the standard list, added by Admin. Shown as written. */
export interface SafetyStateItem {
  id: string;
  state: string;
  label: string;
  method: string;
  /** A pass needs a reading or note (8+ letters) as its record, since there is no evidence slot for it. */
  requiresReading: boolean;
  active: boolean;
  createdByName: string;
  createdAt: string;
  isDemo: boolean;
}

export interface SafetyAttempt {
  id: string;
  /** 1 for the first test, 2 for the first retest, and so on. */
  n: number;
  result: SafetyResult;
  /** The reading taken (trip speed, load, time): what makes a pass more than a tick. */
  measured?: string;
  /** What failed, required for a failure. */
  note?: string;
  at: string;
  byUserId: string;
  byName: string;
  /** Recorded after a failure, before the next attempt. */
  fix?: { kind: SafetyFixKind; note: string; at: string; byName: string };
}

/** The technician disagrees with how the check is to be done. It is heard by Admin, not decided by the technician and not dismissed. */
export interface SafetyDisagreement {
  note: string;
  raisedByName: string;
  at: string;
  resolution?: { decision: 'method_stands' | 'method_changed'; note: string; byName: string; at: string };
}

/** A failed check cleared by someone with the standing to do so, never by the technician alone. */
export interface SafetyOverride {
  byUserId: string;
  byName: string;
  /** The qualified engineer who takes responsibility for accepting it. */
  engineerName: string;
  reason: string;
  at: string;
}

/** Why a check waits for Admin before it can be retested. */
export interface SafetyHold {
  reason: 'needs_rework' | 'too_many_fails';
  at: string;
  releasedAt?: string;
  releasedByName?: string;
  releaseNote?: string;
}

/** One job's record of one safety check. Append-only: attempts are never edited, so the history of a check that failed and was fixed is
 *  kept for the inspector, the certificate and any later dispute. */
export interface JobSafetyTest {
  id: string;
  jobId: string;
  /** A `SafetyItemDef` id, or a `SafetyStateItem` id. */
  itemId: string;
  attempts: SafetyAttempt[];
  holds: SafetyHold[];
  disagreement?: SafetyDisagreement;
  override?: SafetyOverride;
  isDemo: boolean;
}

/** A dated readiness summary for a job: what was tested, how it went and what is still open, kept as it stood when it was made. */
export interface PreInspectionSummary {
  id: string;
  jobId: string;
  version: number;
  generatedAt: string;
  generatedByName: string;
  ready: boolean;
  /** The state's requirements it was made under, and whether none were configured (the national baseline applied). */
  state: string | null;
  stateFallback: boolean;
  lines: { itemId: string; labelKey: string | null; label: string | null; state: string; attempts: number; fixes: number; lastResult: SafetyResult | null; overriddenBy: string | null }[];
  isDemo: boolean;
}

/* ------------------------------------ QC electrical & safety check (133) */

export type QcElecItemId = 'wiring_grounding' | 'control_panel' | 'governor_overspeed' | 'buffer_function' | 'ard_function' | 'door_sensors' | 'overload_device' | 'alarm_comms' | 'trial_no_load' | 'trial_full_load';

/** One recording of one safety-critical check. There is no soft pass here: it passed or it failed, and every attempt is kept. */
export interface QcElecAttempt {
  id: string;
  n: number;
  verdict: 'pass' | 'fail';
  suggested: 'pass' | 'fail' | null;
  measures: { key: string; value: number }[];
  checks: { key: string; ok: boolean }[];
  /** It did not behave the same every time. That is a fail to investigate, never a "sometimes fine". */
  intermittent: boolean;
  note?: string;
  evidence: JobEvidence[];
  at: string;
  byUserId: string;
  byName: string;
}

export interface QcElecCheck {
  jobId: string;
  attempts: Partial<Record<QcElecItemId, QcElecAttempt[]>>;
  signedOff?: { at: string; byUserId: string; byName: string };
  isDemo: boolean;
}

/* ------------------------------------ Warranty & AMC registration (139) */

/** What the customer's lift is covered by and for how long, registered at handover. The terms are frozen when registered: they are read from
 *  the accepted configuration and the parts actually installed, never from a template. */
export interface WarrantyRegistration {
  jobId: string;
  registeredAt: string;
  registeredByName: string;
  registeredByRole: 'customer' | 'admin';
  /** The handover day: when every warranty starts. */
  startsOn: string;
  terms: {
    basis: { quotationCode: string; version: number; finishTier: string; driveType: string; materialsConfirmedAt: string | null };
    /** The manufacturer's warranty, part by part. A substituted part carries its own supplier's terms. `months` is null where only the purchase receipt states it. */
    parts: { category: string; description: string; quantity: number; substituted: boolean; supplierName: string | null; poCode: string | null; months: number | null; endsOn: string | null }[];
    service: { months: number; endsOn: string };
  };
  amc?: {
    status: 'active' | 'later' | 'declined';
    tier?: 'basic' | 'standard' | 'comprehensive';
    annualPrice?: number;
    responseTimeHours?: number;
    includedVisits?: number;
    extraVisits: number;
    note?: string;
    decidedAt: string;
    decidedByName: string;
    /** One annual term per year: the first begins the day after the service warranty ends. */
    terms: { n: number; startsOn: string; endsOn: string; price: number; addedByName: string; at: string }[];
  };
  /** Everything the registration sets up by itself to say something to the customer later. */
  reminders: { id: string; kind: 'warranty_ending' | 'amc_renewal' | 'amc_reengage'; dueAt: string; sentAt?: string; skipped?: 'opted_out' | 'no_contact' | 'enrolled' | 'superseded' }[];
  isDemo: boolean;
}

/* ------------------------------------ Recruitment: the public front door (141) */

/** One person asking about one role. Never merged across roles; the same role asked twice is one interest with another touch. */
export interface RecruitmentInterest {
  id: string;
  code: string;
  name: string;
  /** Ten digits. */
  phone: string;
  role: 'surveyor' | 'technician' | 'supplier' | 'undecided';
  /** Where the first ask came from. Later asks never overwrite it. */
  source: { channel: 'qr' | 'social' | 'referral' | 'whatsapp' | 'walk_in' | 'event' | 'website' | 'other'; campaign?: string; referrerCode?: string };
  interestedAt: string;
  language: 'en' | 'hi' | 'mr';
  /** What the person agreed to: being contacted about this application. */
  contactConsent: boolean;
  /** For someone not sure of a role: what they answered and what it pointed to (null when it pointed nowhere). */
  guided?: { answers: Record<string, string>; suggested: 'surveyor' | 'technician' | 'supplier' | null };
  status: 'interested' | 'started' | 'submitted' | 'withdrawn';
  /** Every later ask for the same role, from whichever channel, kept for the record. */
  touches: { at: string; channel: RecruitmentInterest['source']['channel']; campaign?: string }[];
  startedAt?: string;
  isDemo: boolean;
}

/* ------------------------------------ Recruitment: the applicant's full details (142) */

/** A document held as a data URL for the session, the same shape the onboarding wizards keep. */
export interface ApplicationDoc {
  fileName: string;
  capturedAt: string;
  previewUrl: string;
}

export interface ApplicationReference {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  organisation: string;
  /** What Admin found when they called. Never blocks the application; an unreachable one is simply carried as outstanding. */
  outcome?: { status: 'verified' | 'unreachable' | 'declined'; at: string; byName: string; note?: string };
}

export interface ApplicationForm {
  personal: { fullName: string; phone: string; city: string; address: string; dob: string; languages: ('en' | 'hi' | 'mr')[] };
  /** Structured answers and the applicant's own words: real experience does not always fit a list, so words alone can be enough. */
  experience: { years: string; skills: string[]; sectors: string[]; summary: string };
  territory: { zoneIds: string[]; travelKm: string; ownTransport: boolean };
  availability: { days: number[]; timeOfDay: 'full_day' | 'mornings' | 'afternoons' | 'evenings' | ''; hoursPerWeek: string; earliestStart: string };
  /** Surveyor and technician: an Aadhaar or PAN number with its photo. Supplier: the firm's GSTIN with its certificate. */
  /** `aadhaarNumber` lives only on the applicant's own phone while they type: AIEC keeps the last four digits and whether the number's
   *  checksum passed, never the number (UIDAI). The repository blanks `aadhaarNumber` on every save. */
  identity: { aadhaarNumber: string; aadhaarLast4: string; aadhaarChecked: boolean; aadhaarDoc: ApplicationDoc | null; panNumber: string; panDoc: ApplicationDoc | null; gstin: string; gstDoc: ApplicationDoc | null };
  references: ApplicationReference[];
  /** The applicant has no one to name right now: carried as outstanding for the decision, never a block. */
  noReferences: boolean;
}

/** The one record behind a partner's whole journey: the interest becomes this, the form fills it, screening and onboarding add to it. */
export interface PartnerApplication {
  id: string;
  code: string;
  /** Set when the personal details were erased under the retention policy or at the person's request (194): the record stays as a bare fact. */
  erasedAt?: string;
  interestId: string;
  /** What the applicant's own link carries: there is no account yet. */
  accessKey: string;
  role: 'surveyor' | 'technician' | 'supplier';
  /** `info_requested` reopens the form for what Admin asked; `approved` (through screening, on to interview) and `rejected` lock it. */
  status: 'draft' | 'submitted' | 'info_requested' | 'approved' | 'rejected' | 'withdrawn';
  startedAt: string;
  updatedAt: string;
  submittedAt?: string;
  form: ApplicationForm;
  events: { id: string; at: string; kind: 'started' | 'saved' | 'submitted' | 'resubmitted' | 'reference_outcome' | 'info_requested' | 'info_answered' | 'approved' | 'rejected' | 'adjusted' | 'outcome'; byName: string; note?: string }[];
  /** What AIEC said to the applicant: shown on their own link, in their own language, rendered from a key at the time it is read. */
  messages: { id: string; at: string; kind: 'info_request' | 'decline' | 'approved' | 'interview_invite' | 'interview_confirmed' | 'interview_move' | 'interview_reminder' | 'interview_missed' | 'interview_nudge' | 'interview_cancelled' | 'waitlisted' | 'offer_sent' | 'offer_nudge' | 'offer_term_response' | 'offer_signed'; templateKey: string; params: Record<string, string>; note?: string; byName: string }[];
  screening?: ApplicationScreening;
  /** The one conversation AIEC has before an offer (144); optional, an approved applicant may go straight to the offer. */
  interview?: PartnerInterview;
  /** What AIEC has checked before an offer can be made (145): role-aware, with the method, the evidence and who did it. */
  verification?: PartnerVerification;
  /** The agreement AIEC offers and the partner signs (146): signing activates the account. */
  offer?: PartnerOffer;
  /** Qualified, but there is no room to activate them right now (147): kept, told kindly, and reviewed rather than rejected or activated beyond what can be kept busy. */
  waitlist?: { at: string; byName: string; reason: string };
  isDemo: boolean;
}

export interface ScreeningFactorRow {
  key: 'completeness' | 'experience' | 'territory' | 'availability' | 'references';
  weight: number;
  value: number;
  contribution: number;
}

/** What screening decided, and what it was decided on: the score and its breakdown are frozen with the decision. */
export interface ApplicationScreening {
  decision?: { status: 'approved' | 'rejected'; at: string; byName: string; reasonKey?: string; note?: string; score: number; effective: number; rows: ScreeningFactorRow[] };
  /** Admin's documented override of the ranking: a standout the formula does not capture, or a concern it does not see. */
  adjustment?: { points: number; reason: string; byName: string; at: string };
  infoRequest?: { sections: string[]; note: string; at: string; byName: string; answeredAt?: string };
  /** How the person turned out once working with AIEC: the feedback that tunes the weights. */
  outcome?: { rating: 'strong' | 'steady' | 'weak'; at: string; byName: string; note?: string };
}

/* ------------------------------------ Interview scheduling (144) */

export type InterviewMode = 'phone' | 'video' | 'in_person';
export type InterviewConcernCategory = 'communication' | 'reliability' | 'safety_attitude' | 'experience' | 'other';

export interface PartnerInterview {
  /** `invited` waits for the applicant to pick; `scheduled` has a slot; the rest are how it ended. */
  status: 'invited' | 'scheduled' | 'completed' | 'missed' | 'cancelled' | 'skipped';
  /** What the applicant may choose between. */
  modes: InterviewMode[];
  /** Where it happens: a meeting link for a video call, a place for an in-person one. A phone call needs neither (AIEC rings the applicant). */
  details: { videoLink?: string; place?: string };
  invitedAt: string;
  invitedByName: string;
  inviteNote?: string;
  slot?: { start: string; end: string; mode: InterviewMode; chosenAt: string; chosenBy: 'applicant' | 'admin' };
  /** AIEC needs to move a confirmed time: the old time stands until a new one is chosen, so nobody is left without an appointment. */
  moveRequest?: { at: string; reason: string; byName: string };
  misses: number;
  reschedules: number;
  completed?: {
    at: string;
    byName: string;
    ratings: { communication: 'clear' | 'ok' | 'concern'; reliability: 'clear' | 'ok' | 'concern'; experience: 'confirmed' | 'partly' | 'not_confirmed' };
    note: string;
    concern?: { category: InterviewConcernCategory; text: string };
    outcome: 'recommend' | 'hold' | 'not_recommended';
    outcomeReason?: string;
  };
  /** A later note, never an edit: a concern that surfaces after the conversation is added here and weighs on the offer decision. */
  addenda: { id: string; at: string; byName: string; text: string; concern?: { category: InterviewConcernCategory; text: string } }[];
  skipped?: { at: string; byName: string; reason: string };
  /** Which automatic reminders have gone out, so each is sent once. */
  remindersSent: string[];
  events: { id: string; at: string; kind: 'invited' | 'nudged' | 'slot_chosen' | 'rescheduled' | 'move_requested' | 'reminder' | 'missed' | 'completed' | 'cancelled' | 'skipped' | 'addendum' | 'availability'; byName: string; note?: string }[];
}

/** Admin's weekly windows for interviews: the applicant picks from what is left of them. */
export interface InterviewAvailability {
  /** 0 = Sunday … 6 = Saturday; null is a day off. `HH:MM`. */
  weekly: Record<number, { from: string; to: string } | null>;
  slotMinutes: number;
  bufferMinutes: number;
  /** `yyyy-mm-dd` days nothing is offered, however the week is set. */
  closedDates: string[];
  /** The soonest a slot can be taken from now. */
  leadHours: number;
  horizonDays: number;
  updatedAt: string | null;
  updatedByName: string | null;
}

/* ------------------------------------ Background and document verification (145) */

export type VerificationMethod = 'third_party' | 'manual';
export type VerificationHow = 'saw_original' | 'called_issuer' | 'online_registry' | 'practical_test' | 'other';

export interface VerificationRecord {
  /** `conditional` lets an offer go ahead while a document that is hard to get is still on its way, with a firm deadline. */
  status: 'passed' | 'failed' | 'conditional';
  method: VerificationMethod;
  at: string;
  byName: string;
  note?: string;
  how?: VerificationHow;
  /** The service's own reference for a third-party answer. */
  reference?: string;
  /** Recorded by hand because the service was down: it carries a stronger note. */
  serviceDown?: boolean;
  /** A concerning result (not just a missing document): it blocks the offer and its reason is kept for consistency. */
  redFlag?: boolean;
  conditional?: { dueAt: string; reason: string; grantedBy: string; at: string };
  /** Every earlier result for this item, never overwritten. */
  history: { at: string; status: VerificationRecord['status']; method: VerificationMethod; byName: string; note?: string; dueAt?: string }[];
}

export interface PartnerVerification {
  records: Record<string, VerificationRecord>;
  /** Items already sent to the ID service automatically, so each goes once. */
  autoSent: string[];
  events: { id: string; at: string; kind: 'service_check' | 'manual' | 'conditional' | 'lapsed' | 'service_down' | 'cleared'; byName: string; item?: string; note?: string }[];
}

/* ------------------------------------ Offer & onboarding agreement (146) */

/** Starting terms in numbers: only the ones a role has are set. Wording is versioned separately so a signed document never changes. */
export interface AgreementTerms {
  /** Surveyor: share of a converted deal paid to the original surveyor; and to the current owner of a reassigned lead. */
  conversionPct?: number;
  closePct?: number;
  /** Technician: share of a deal's value pooled for installers, the lead's extra share of that pool, and the independent QC inspector's fee. */
  installPoolPct?: number;
  leadBonusPct?: number;
  qcFee?: number;
  /** Supplier: the same terms 098 holds for a supplier's agreement. */
  deliverySlaDays?: number;
  paymentTermsDays?: number;
  minQualityScore?: number;
  qualityStandards?: string;
  warrantyMonths?: number;
  /** Field roles: where they start, as zone ids. */
  territoryZoneIds?: string[];
}

export interface PartnerAgreementTemplate {
  id: string;
  role: 'surveyor' | 'technician' | 'supplier';
  version: number;
  effectiveFrom: string;
  terms: AgreementTerms;
  /** Which frozen wording the clauses use (`agreement.wording.<wording>.*`): a signed document keeps the wording it was signed under. */
  wording: 'v1';
  changeNote: string;
  createdByName: string;
  createdAt: string;
  isDemo: boolean;
}

export interface PartnerOffer {
  status: 'draft' | 'sent' | 'signed' | 'withdrawn';
  documentNo: string;
  role: 'surveyor' | 'technician' | 'supplier';
  templateId: string;
  templateVersion: number;
  wording: 'v1';
  /** Frozen when the offer is prepared; a newer template never changes it. */
  terms: AgreementTerms;
  /** Admin-approved custom terms for this person, over the standard ones, with the reason kept. */
  addendum?: { items: { key: keyof AgreementTerms; value: number }[]; reason: string; approvedByName: string; approvedAt: string };
  /** The partner asked to talk about a term; Admin answers by approving an addendum or declining with a reason. */
  requests: { id: string; at: string; text: string; response?: { at: string; byName: string; outcome: 'approved' | 'declined'; note: string } }[];
  /** Proceeding although the interview was not recommended: said out loud and kept. */
  concernOverride?: { reason: string; byName: string; at: string };
  gateAtPrepare: 'clear' | 'conditional';
  preparedAt: string;
  preparedByName: string;
  sentAt?: string;
  nudgedAt?: string;
  withdrawn?: { at: string; byName: string; reason: string };
  signature?: { at: string; method: 'drawn' | 'typed'; data: string; signerName: string; language: 'en' | 'hi' | 'mr'; otpVerified: boolean; viaFallback: boolean; consentGiven: boolean };
  /** Signing is the one event that activates the account; full capability (payouts) still waits for the remaining steps. */
  activation?: { at: string; userId: string; supplierId?: string; steps: Record<string, { done: boolean; at?: string; byName?: string }> };
  events: { id: string; at: string; kind: 'prepared' | 'addendum' | 'sent' | 'nudged' | 'request' | 'response' | 'withdrawn' | 'signed' | 'activated' | 'step'; byName: string; note?: string }[];
}

/* ------------------------------------ Partner tier and category (148) */

export interface PartnerTierEntry {
  id: string;
  userId: string;
  role: 'surveyor' | 'technician';
  tier: string;
  fromTier: string | null;
  /** `yyyy-mm-dd`: the tier in force is the latest entry whose day has arrived. */
  effectiveFrom: string;
  kind: 'initial' | 'promotion' | 'demotion' | 'exception' | 'review' | 'dispute';
  reason: string;
  byName: string;
  at: string;
  /** Which criteria version this was judged against, and how each criterion read at the time. */
  criteriaVersion: number;
  met: { metric: string; required: number; actual: number; kind: 'min' | 'max'; ok: boolean }[];
  /** A promotion put through although a recent incident put its timing in question: the judgement is kept. */
  incidentAcknowledged?: boolean;
  isDemo: boolean;
}

export interface TierCriteriaVersion {
  id: string;
  role: 'surveyor' | 'technician';
  version: number;
  effectiveFrom: string;
  tiers: { id: string; criteria: { metric: 'monthsActive' | 'wonDeals' | 'completedInstalls' | 'verifiedSkills' | 'qcPassRate' | 'openSafetyIssues' | 'ratedOrders' | 'score'; min?: number; max?: number }[]; effects: { commissionPlusPct?: number; canLead?: boolean } }[];
  changeNote: string;
  createdByName: string;
  createdAt: string;
  isDemo: boolean;
}

export interface TierDeferral {
  userId: string;
  until: string;
  reason: string;
  byName: string;
  at: string;
}

export interface TierDispute {
  id: string;
  userId: string;
  grounds: string;
  raisedAt: string;
  raisedByName: string;
  /** What the criteria said when it was raised, so the answer rests on visible facts. */
  criteriaVersion: number;
  tierAtRaise: string;
  status: 'open' | 'decided';
  decision?: { outcome: 'tier_stands' | 'tier_changed' | 'criteria_unclear'; note: string; byName: string; at: string };
  isDemo: boolean;
}

/** An existing partner who no longer meets their tier under a raised bar: kept where they are, and reviewed by a date. */
export interface TierReview {
  userId: string;
  versionId: string;
  dueBy: string;
  resolved?: { at: string; byName: string; reason: string };
}

/** A surveyor's areas changed by Admin from the directory (149): the reason is kept, and what changed is the zones' own assignment. */
export interface PartnerTerritoryChange {
  id: string;
  partnerId: string;
  from: string[];
  to: string[];
  reason: string;
  byName: string;
  at: string;
  isDemo: boolean;
}

/* ------------------------------------ Training module library (151) */

export type TrainingTopic = 'onboarding' | 'safety' | 'customer' | 'product';
export type TrainingRole = 'surveyor' | 'technician' | 'supplier';

/** One published version of a module's content. Append-only: a partner is always trained on the version in force. */
export interface TrainingModuleVersion {
  version: number;
  effectiveFrom: string;
  /** The lowest version that still counts as completed: raising it makes earlier completions need a retake. */
  minVersion: number;
  /** Translation key (`trainingLib.content.<code>.<key>`) of what changed, when it did. */
  changeKey?: string;
}

/**
 * A training module as the library holds it. This is the one governed dataset the lesson player (152), the quiz (154), the skill matrix (157)
 * and the compliance tracker (158) all read. Titles and summaries are translation keys under `trainingLib.content.<code>`.
 */
export interface TrainingModule {
  id: string;
  code: string;
  topic: TrainingTopic;
  /** Order inside its topic. */
  order: number;
  /** required_for_roles[]: the partner must complete it. */
  requiredFor: TrainingRole[];
  /** Roles it is shown to at all (always includes requiredFor). */
  relevantFor: TrainingRole[];
  /** sequence_lock_dependency: modules that must be completed before this one unlocks. */
  dependsOn: string[];
  /** Completing it is part of being offered a job: a technician who has not cannot be put on one. */
  gatesJobAssignment: boolean;
  minutes: number;
  lessons: number;
  /** Size of the offline copy, in KB. */
  offlineKb: number;
  versions: TrainingModuleVersion[];
  status: 'published' | 'retired';
  isDemo: boolean;
}

export interface TrainingProgress {
  userId: string;
  moduleId: string;
  status: 'in_progress' | 'completed';
  startedAt: string;
  completedAt?: string;
  /** The version they last completed (the lessons seen, for an unfinished one). */
  version: number;
  lessonsDone: number;
}

/* ------------------------------------ Lesson player (152) */

/** The picture shown for a scene (a drawn icon, never a stock photo). */
export type LessonVisual = 'welcome' | 'promise' | 'person' | 'phone' | 'warning' | 'harness' | 'inspect' | 'anchor' | 'rescue' | 'power' | 'lock' | 'tag' | 'meter';

export interface TrainingScene {
  id: string;
  durationS: number;
  visual: LessonVisual;
}

/** A knowledge check shown at the end of a scene: playback cannot go past it until it is answered correctly. */
export interface TrainingCheck {
  id: string;
  /** Index of the scene it follows (0-based). */
  afterScene: number;
  kind: 'single' | 'multi';
  options: number;
  correct: number[];
}

/**
 * A lesson belongs to a module and is authored with it (151): its words are translation keys `lessonContent.<module code>.l<order>.*`, so there
 * is no second content system. `changedInVersion` is the module version in which the lesson last changed, so a partner who finished an older
 * version redoes only what moved.
 */
export interface TrainingLesson {
  id: string;
  moduleId: string;
  order: number;
  changedInVersion: number;
  scenes: TrainingScene[];
  checks: TrainingCheck[];
  points: number;
}

export interface LessonCheckAttempt {
  at: string;
  selected: number[];
  correct: boolean;
}

export interface LessonCheckResponse {
  checkId: string;
  attempts: LessonCheckAttempt[];
  clearedAt?: string;
}

/** One person's run through one lesson: where they are, how far they have genuinely played, what they answered, and when it was finished. */
export interface TrainingLessonProgress {
  userId: string;
  lessonId: string;
  moduleId: string;
  /** The module version they took it on. */
  version: number;
  positionS: number;
  furthestS: number;
  checks: LessonCheckResponse[];
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
}

/* ------------------------------------ Skill matrix and assigned training (157) */

/** Training Admin asked a partner to do, by a date: the way a gap on the skill matrix becomes work someone owns and is reminded of. */
export interface TrainingAssignment {
  id: string;
  userId: string;
  moduleId: string;
  assignedById: string;
  assignedByName: string;
  assignedAt: string;
  /** yyyy-mm-dd. */
  dueDate: string;
  note: string;
  status: 'open' | 'cancelled';
}

/* ------------------------------------ Training compliance (158) */

/** The workforce's compliance as last observed in one calendar month; the month's record stops changing once the month has passed. */
export interface ComplianceSnapshot {
  id: string;
  /** yyyy-mm. */
  month: string;
  observedAt: string;
  compliant: number;
  total: number;
  safetyOpen: number;
  byRole: { role: TrainingRole; compliant: number; total: number }[];
}

/** Admin looked at the figures and said so: the governance record an auditor reads. */
export interface ComplianceReview {
  id: string;
  at: string;
  byName: string;
  note: string;
  compliant: number;
  total: number;
  safetyOpen: number;
}

/** A reminder sent to one partner from the tracker, kept so the same person is not nagged twice in a row and Admin can see who was told. */
export interface ComplianceReminder {
  userId: string;
  at: string;
  byName: string;
  moduleCodes: string[];
}

/* ------------------------------------ SOP rollout (159) */

export interface SopRolloutQuestion {
  id: string;
  text: string;
  options: string[];
  correct: number;
}

/** The announcement that a version of a governed procedure is coming into force. A correction is a new rollout that replaces an earlier one; the earlier one is kept as sent. */
export interface SopRollout {
  id: string;
  /** `AIEC-SR-####`, a correction adds `-R<n>`. */
  code: string;
  docId: string;
  version: number;
  kind: 'announce' | 'correction';
  correctsId?: string;
  correctionReason?: string;
  supersededById?: string;
  supersededAt?: string;
  roles: TrainingRole[];
  summary: string;
  /** yyyy-mm-dd. The day it takes effect (for an urgent change, the day it was sent). */
  effectiveDate: string;
  urgent: boolean;
  questions: SopRolloutQuestion[];
  createdAt: string;
  createdByName: string;
}

/** What one partner has done about one rollout; absent until they or Admin do something. `userId` is the account that did it (people with two roles share by phone). */
export interface SopRolloutReceipt {
  rolloutId: string;
  userId: string;
  seenAt?: string;
  acknowledgedAt?: string;
  quizPassedAt?: string;
  attempts: { at: string; passed: boolean }[];
  /** Admin recorded that the partner is away: the acknowledgement stays pending, with the day they are back. */
  awayUntil?: string;
  awayNote?: string;
  awayByName?: string;
  lastRemindedAt?: string;
}

/* ------------------------------------ Training feedback (160) */

/** One partner's reply about one training (on the version they took). Anonymous replies keep a pseudonym (`authorKey`) so the author can update theirs, and no name. */
export interface TrainingFeedback {
  id: string;
  moduleId: string;
  version: number;
  authorKey: string;
  /** Present only when the author chose to be named. */
  userId?: string;
  anonymous: boolean;
  clarity: number;
  relevance: number;
  comment: string;
  /** The partner says something in it looks wrong or unsafe, as opposed to merely unclear. */
  serious: boolean;
  target?: { lessonId?: string; questionId?: string };
  createdAt: string;
  updatedAt: string;
  edits: number;
  status: 'new' | 'reviewing' | 'addressed' | 'dismissed';
  handledByName?: string;
  handledAt?: string;
  handledNote?: string;
  addressedInVersion?: number;
  /** A comment that is abusive or not constructive is hidden (its ratings still count). */
  hidden?: { at: string; byName: string; reason: string };
}

/* ------------------------------------ Refresher cadence (156) */

/** One version of how often a certification must be refreshed. Append-only: a change is a new version with its own effective date and reason. */
export interface RefresherCadenceVersion {
  version: number;
  effectiveFrom: string;
  /** Months a certification earned from then on lasts; null does not expire. */
  months: number | null;
  /** Days after it ends that the holder can still be given work while they refresh. */
  graceDays: number;
  reason: string;
  setByName: string;
  setAt: string;
}

export interface RefresherCadence {
  assessmentId: string;
  versions: RefresherCadenceVersion[];
}

/** A documented extension of the grace period (approved leave, say): never a silent move of a date, and kept even after the refresher is done. */
export interface RefresherExtension {
  id: string;
  badgeId: string;
  userId: string;
  /** The last day the holder stays eligible without refreshing. */
  until: string;
  reason: string;
  byName: string;
  at: string;
}

/* ------------------------------------ Quiz and certification (154) */

export interface AssessmentQuestion {
  /** Stable within an assessment (`q1`…): the words are `assessmentContent.<module code>.<id>.*`. */
  id: string;
  kind: 'single' | 'multi';
  options: number;
  correct: number[];
  /** The module version this question first appears in, and (exclusive) the one it stops being asked from: questions move with the content they test. */
  sinceVersion: number;
  untilVersion?: number;
}

/** The formal test that follows a module's lessons. Its questions are versioned alongside the module, so it always tests the content now in force. */
export interface Assessment {
  id: string;
  moduleId: string;
  /** Share of the questions that must be right (placeholder business decision, Admin configures it). */
  passPercent: number;
  /** Hours to wait after the 1st, 2nd and 3rd-or-later failed attempt on the same version (placeholders). */
  cooldownHours: [number, number, number];
  questions: AssessmentQuestion[];
}

export interface AssessmentAnswer {
  questionId: string;
  selected: number[];
}

export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  moduleId: string;
  userId: string;
  /** The module version it tested. */
  version: number;
  attemptNumber: number;
  /** The questions asked, in the order they were asked (a different order every attempt). */
  questionIds: string[];
  answers: AssessmentAnswer[];
  status: 'in_progress' | 'submitted' | 'void';
  startedAt: string;
  updatedAt: string;
  submittedAt?: string;
  correctCount?: number;
  score?: number;
  passPercent?: number;
  passed?: boolean;
}

/** Issued by passing, and by nothing else: the one event 155 shows as a badge and the job gate (151) reads. */
export interface CertificationBadge {
  id: string;
  /** The credential number written on the downloadable credential (`AIEC-CT-####`). */
  code: string;
  userId: string;
  moduleId: string;
  assessmentId: string;
  /** The module version it was earned on. */
  version: number;
  score: number;
  attemptId: string | null;
  issuedAt: string;
  /** Frozen when issued, from the rule that applied then: a later change to how long certifications last never moves a badge already earned. */
  expiresAt: string | null;
  /** How many days after it ends the holder is still eligible for work while they refresh (frozen at issue with the cadence in force). */
  graceDays: number;
  /** The cadence version that set the dates above: a later change to the cadence never moves a certification already issued. */
  cadenceVersion: number;
  /** The certification this one renewed. */
  renewedFromId?: string;
}

/** A partner's own choice about being named in the peer standing on 155 (they still see their own place). */
export interface CertificationPref {
  userId: string;
  hidden: boolean;
}

/* ------------------------------------ SOP document repository (153) */

/** A category Admin added as the business grew (a new lift technology, say). The built-in ones (installation, delivery, safety, quality) are not stored. */
export interface SopCategory {
  id: string;
  name: string;
  nameHi?: string;
  nameMr?: string;
  createdByName: string;
  createdAt: string;
}

export interface SopReferenceItem {
  en: string;
  hi?: string;
  mr?: string;
}

export interface SopReferenceVersion {
  version: number;
  effectiveFrom: string;
  changeNote: string;
  publishedByName: string;
  publishedAt: string;
  items: SopReferenceItem[];
}

/**
 * A reference document Admin wrote for a category that has no enforced checklist behind it yet. Everything else in the repository is read from the
 * governed templates (installation, delivery, safety, quality) and is never copied; these are the one thing the repository itself stores, and each
 * says on screen that no checklist enforces it.
 */
export interface SopReferenceDocument {
  id: string;
  categoryId: string;
  title: string;
  titleHi?: string;
  titleMr?: string;
  versions: SopReferenceVersion[];
  createdByName: string;
  createdAt: string;
}

export interface SopBookmark {
  userId: string;
  docId: string;
  at: string;
}

/* ------------------------------------ Partner deactivation and exit (150) */

export type ExitKind = 'voluntary' | 'involuntary';
export type ExitItemType = 'lead' | 'job' | 'order';
export type ExitActionKind = 'reassigned' | 'returned_to_pool' | 'finish_first' | 'alternate_sourcing' | 'cancelled';

/** One decision about one piece of work in hand: append-only, the reassignment_actions the exit keeps. */
export interface ExitAction {
  id: string;
  itemType: ExitItemType;
  itemId: string;
  /** A code or name from the record itself (data, not prose). */
  label: string;
  action: ExitActionKind;
  toId?: string;
  toName?: string;
  note: string;
  byName: string;
  at: string;
}

export interface ExitSettlementLine {
  kind: 'commission_payable' | 'payment_owed' | 'advance_recoverable' | 'adjustment';
  ref: string;
  label: string;
  /** Signed: a recovery AIEC may make is negative. */
  amount: number;
}
export interface ExitHeldLine {
  kind: 'commission_pending' | 'retention_held';
  ref: string;
  label: string;
  amount: number;
}
export interface ExitDispute {
  id: string;
  claimedAmount: number;
  grounds: string;
  raisedAt: string;
  raisedByName: string;
  status: 'open' | 'decided';
  decision?: { outcome: 'uphold' | 'partner_favor' | 'partial'; amount: number; note: string; byName: string; at: string };
}
export interface ExitSettlement {
  calculatedAt: string;
  byName: string;
  lines: ExitSettlementLine[];
  held: ExitHeldLine[];
  /** What is owed to the partner at the moment it was confirmed (adjustments from a decided dispute are added on top). */
  amount: number;
  status: 'proposed' | 'agreed' | 'disputed' | 'paid';
  /** An involuntary exit: the figure stands, but nothing is released until Admin has reviewed the violation. */
  withheld?: { reason: string; byName: string; at: string };
  agreed?: { at: string; byName: string; how: 'call' | 'message' | 'in_person' | 'decision'; note: string };
  dispute?: ExitDispute;
  adjustment?: { amount: number; entryId?: string; at: string };
  paid?: { at: string; byName: string; reference: string; amount: number };
}
export interface ExitInterview {
  at: string;
  byName: string;
  how: 'call' | 'in_person' | 'form' | 'declined';
  reasons: string[];
  wouldReturn: 'yes' | 'maybe' | 'no' | null;
  notes: string;
}
export interface PartnerExit {
  id: string;
  code: string;
  partnerId: string;
  partnerType: 'surveyor' | 'technician' | 'supplier';
  partnerName: string;
  kind: ExitKind;
  /** An `exit_reason` key from the reasons list for this kind. */
  reason: string;
  note: string;
  /** `yyyy-mm-dd`: the day they stop being a partner. */
  lastDay: string;
  startedAt: string;
  startedByName: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  actions: ExitAction[];
  settlement?: ExitSettlement;
  interview?: ExitInterview;
  /** access_revoked_timestamp: set once, only after the work and the money are handled (an involuntary exit ends access first). */
  accessRevoked?: { at: string; byName: string; first: boolean };
  cancelled?: { at: string; byName: string; reason: string };
  completedAt?: string;
  events: { kind: string; at: string; byName: string; detail?: string }[];
  isDemo: boolean;
}

/* ------------------------------------ Handover completion certificate (140) */

export interface FinalPayoutLine {
  id: string;
  userId: string;
  name: string;
  role: 'surveyor' | 'sales' | 'technician_lead' | 'technician' | 'qc_inspector';
  commissionId: string;
  reasonKey: string;
  /** What the amount is based on: the commission already on record for the deal, time on site, steps finished, an equal split, or a flat fee. */
  basis: 'existing' | 'time' | 'steps' | 'equal' | 'fixed' | 'percent';
  amount: number;
  /** The part of the crew pool this person received. */
  share?: number;
  minutes?: number;
  steps?: number;
  results?: number;
  leadBonus?: number;
  /** The person was no longer on the job at the end: what they did is still theirs. */
  leftEarly?: boolean;
  /** The rule (161) and version this was paid under. */
  ruleId?: string;
  ruleVersion?: number;
}

/** Admin's documented decision about a defect found after payouts were triggered. Append-only. */
export interface PayoutJudgement {
  id: string;
  at: string;
  byName: string;
  issue: string;
  decision: 'no_change' | 'hold' | 'release' | 'adjust';
  reason: string;
  changes: { commissionId: string; userId: string; name: string; before: { status: CommissionEntry['status']; amount: number }; after: { status: CommissionEntry['status']; amount: number } }[];
}

export interface CompletionMilestone {
  id: 'survey' | 'quotation' | 'contract' | 'delivery' | 'installation' | 'qc' | 'compliance' | 'handover' | 'warranty';
  at: string | null;
  /** The record's own reference (quotation code, contract, certificate number ...). */
  ref: string | null;
  byName: string | null;
  /** Small facts in a fixed shape the screen words itself, so the summary is translated in whatever language is read. */
  facts: Record<string, string | number>;
}

/** What closes a project. One per job, never edited: it freezes the project's summary at the moment of issue, so it reads the same years later. */
export interface HandoverCompletion {
  jobId: string;
  certificateNo: string;
  issuedAt: string;
  issuedByName: string;
  /** The customer had not signed off at the walkthrough and Admin closed the project anyway, with this reason. */
  signoffWaived?: { reason: string };
  summary: {
    customerName: string;
    siteName: string;
    address: string;
    city: string;
    jobCode: string;
    dealCode: string;
    value: number;
    driveType: string;
    finishTier: string;
    capacityPersons: number | null;
    stops: number | null;
    milestones: CompletionMilestone[];
    compliance: { code: string; standard: string; state: string | null; issuedAt: string } | null;
    warranty: { startsOn: string; serviceEndsOn: string; partsCount: number; amc: { status: 'active' | 'later' | 'declined'; tier: string | null; endsOn: string | null } | null } | null;
  };
  /** The people who took part, and how each took part. Frozen with the summary. */
  team: { userId: string; name: string; roles: FinalPayoutLine['role'][]; minutes: number; steps: number; results: number }[];
  payout: { triggeredAt: string; lines: FinalPayoutLine[]; pools: { installation: number; qc: number; salesClose: number } };
  judgements: PayoutJudgement[];
  isDemo: boolean;
}

/* ------------------------------------ Customer handover walkthrough (138) */

/** The in-person (or video, or site-representative) walkthrough of a finished lift, and everything that comes of it. One per job. */
export interface HandoverWalkthrough {
  jobId: string;
  mode?: 'in_person' | 'video_call' | 'site_representative';
  scheduledFor?: { date: string; window: 'morning' | 'afternoon' };
  conductorId?: string;
  conductorName?: string;
  /** When the customer is not on site: who receives the handover for them. The customer still signs off for themselves. */
  representative?: { name: string; phone: string; relationship: string };
  /** What has been shown, by whom. */
  script: Record<string, { at: string; byName: string }>;
  documents: Partial<Record<'warranty_terms' | 'amc_options' | 'user_manual' | 'emergency_contacts', { at: string; how: 'printed' | 'digital'; byName: string }>>;
  conducted?: { at: string; byName: string };
  /** The customer's own confirmation that they were shown and understand the basics: separate from, and after, every technical gate. */
  signoff?: { at: string; signerName: string; mode: 'own_account' | 'on_device'; recordedByName: string; signature?: string; note?: string };
  amc?: { choice: 'enrol' | 'later' | 'declined'; tier?: 'basic' | 'standard' | 'comprehensive'; at: string; byName: string; note?: string };
  feedback?: { score: number; comment?: string; at: string; byName: string };
  /** Questions beyond the script: a warm handoff to whoever supports the customer, never something the conductor must answer on the spot. */
  followUps: { id: string; text: string; at: string; byName: string; answer?: { text: string; at: string; byName: string } }[];
  events: { id: string; at: string; kind: string; byName: string; note?: string }[];
  isDemo: boolean;
}

/* ------------------------------------ Final handover checklist (137) */

/** The documentation package's checks and the final gate's own record, one per job. What the gate says is read from the snag list and the
 *  compliance certificate each time; only what a person confirms or flags here is stored. */
export interface HandoverReadiness {
  jobId: string;
  /** A document a person checked, and what it was checked against. */
  docs: Partial<Record<'warranty_terms' | 'amc_options' | 'user_manual', { basis: { quotationCode: string; version: number; finishTier: string; driveType: string; materialsConfirmedAt: string | null; pricingUpdatedAt: string | null }; confirmedAt: string; confirmedByName: string }>>;
  issues: { id: string; kind: 'warranty_terms' | 'amc_options' | 'user_manual'; text: string; raisedByName: string; at: string; resolvedAt?: string; resolvedByName?: string; resolution?: string }[];
  /** Very small paperwork fixes made at the gate (a typo), each kept. */
  corrections: { id: string; kind: 'warranty_terms' | 'amc_options' | 'user_manual'; note: string; byName: string; at: string }[];
  /** Admin's own final look, added when a job warrants it. The standard case never needs one. */
  adminReview?: { reason: string; addedByName: string; addedAt: string; completedAt?: string; completedByName?: string; note?: string };
  /** Every time Ready for Handover was said. The last one stands while the gate stays clear. */
  confirmations: { at: string; byUserId: string; byName: string }[];
  isDemo: boolean;
}

/* ------------------------------------ Compliance certification (134) */

export type ComplianceStandardId = 'IS_14665' | 'IS_15259' | 'IS_14671' | 'other';
/** A standard as cited on the certificate. `other` carries the name Admin gave it; an additional one carries why it applies. */
export interface ComplianceStandard {
  id: ComplianceStandardId;
  label?: string;
  reason?: string;
}

/** What the certificate's evidence package held when it was issued. Frozen: a later check never changes an issued certificate. */
export interface CertificatePackage {
  builtAt: string;
  installation: { stepsDone: number; stepsTotal: number; completedAt: string | null; leadName: string | null; teamCount: number };
  mechanical: { signedOff: { at: string; byName: string } | null; items: { id: QcMechItemId; state: string; attempts: number; fails: number; evidence: number }[] };
  electrical: { signedOff: { at: string; byName: string } | null; items: { id: QcElecItemId; state: string; attempts: number; fails: number; evidence: number; measures: { key: string; value: number }[] }[] };
  trials: { id: 'trial_no_load' | 'trial_full_load'; at: string | null; runs: number | null; loadPct: number | null; evidence: number }[];
  safety: { ready: boolean; state: string | null; lines: PreInspectionSummary['lines'] };
  parts: { category: string; description: string; quantity: number; identifiers: number; substituted: boolean }[];
  partsConfirmedAt: string | null;
}

/** What the state's own next steps are, written by Admin. Example wording is flagged where it was seeded; it is not legal advice. */
export interface StateInspectionGuidance {
  id: string;
  state: string;
  authority: string;
  steps: string[];
  note: string;
  updatedByName: string;
  updatedAt: string;
  isDemo: boolean;
}

/** AIEC's own internal certificate that an installation was checked and is ready for the customer's government inspection. Immutable once issued;
 *  a paperwork correction is a new version that voids this one. It is not the government's licence to operate. */
export interface ComplianceCertificate {
  id: string;
  code: string;
  jobId: string;
  version: number;
  driveType: DriveType;
  quotationCode: string;
  primary: ComplianceStandard;
  /** `drive_type`: the standard the drive type gives. `selected`: Admin's documented choice. */
  basis: 'drive_type' | 'selected';
  overrideReason?: string;
  additional: ComplianceStandard[];
  state: string | null;
  /** The state's next steps as they read when this was issued. */
  guidance: { state: string | null; fallback: boolean; authority: string | null; steps: string[]; note: string | null };
  package: CertificatePackage;
  issuedAt: string;
  issuedByName: string;
  supersedes?: string;
  supersededBy?: string;
  /** Set on the original when a reissue voids it. */
  voidedAt?: string;
  voidReason?: string;
  /** Issued before digital checks were kept: there is no package behind it. */
  historic?: boolean;
  isDemo: boolean;
}

/* ------------------------------------ QC mechanical check (132) */

export type QcMechItemId = 'rail_alignment' | 'car_cwt_balance' | 'ride_smoothness' | 'levelling' | 'door_smoothness';
/** `exception` is a pass with a noted, Admin-reviewable imperfection; it is never a hard fail and never a silent pass. */
export type QcVerdict = 'pass' | 'exception' | 'fail';

/** One recording of one check by the inspector. Append-only: a fail that was put right is followed by a new attempt, never edited. */
export interface QcMechAttempt {
  id: string;
  n: number;
  verdict: QcVerdict;
  /** What the app's reference thresholds said the verdict should be, kept so an override is visible. */
  suggested: QcVerdict | null;
  overrideReason?: string;
  /** Named measurements (rail deviation, vibration, jerk, balance) and the per-floor levelling readings. */
  measures: { key: string; value: number }[];
  floors: { floor: number; mm: number }[];
  /** Door rubric: 1 smooth, 2 slight noise, 3 rough or sticking. */
  rubric?: 1 | 2 | 3;
  note?: string;
  evidence: JobEvidence[];
  at: string;
  byUserId: string;
  byName: string;
  /** For an `exception`: what Admin decided. */
  review?: { status: 'pending' | 'accepted' | 'rejected'; byName?: string; at?: string; note?: string };
}

/** The inspector found the installation differs from what was logged at install time. It needs an explanation before sign-off. */
export interface QcFinding {
  id: string;
  jobId: string;
  itemId: QcMechItemId;
  description: string;
  raisedByName: string;
  raisedAt: string;
  explanation?: { text: string; byName: string; at: string };
  acceptedAt?: string;
  acceptedByName?: string;
  isDemo: boolean;
}

export interface QcMechCheck {
  jobId: string;
  attempts: Partial<Record<QcMechItemId, QcMechAttempt[]>>;
  signedOff?: { at: string; byUserId: string; byName: string };
  isDemo: boolean;
}

export type SnagEventKind = 'raised' | 'failed_again' | 'assigned' | 'reassigned' | 'handed_back' | 'rework_started' | 'escalated' | 'part_requested' | 'part_ordered' | 'regraded' | 'linked' | 'disputed' | 'dispute_decided' | 'ready_for_retest' | 'verified' | 'waived' | 'withdrawn';
/** Append-only: what happened to a snag, by whom, and why. */
export interface SnagEvent {
  id: string;
  at: string;
  kind: SnagEventKind;
  byName: string;
  note?: string;
}

/**
 * One finding that has to be put right before handover (the defect / snag list, 135). Raised by a failed mechanical or electrical check (132,
 * 133) or by the inspector on the list itself. Closed only by QC: a checklist snag when its own re-test passes, a snag raised on the list when
 * the inspector verifies it. The rework screen (136) owns the work of putting it right.
 */
export interface ReworkRequest {
  id: string;
  code: string;
  jobId: string;
  source: 'qc_mechanical' | 'qc_electrical' | 'snag';
  /** The checklist item, or `manual` for a snag raised on the list. */
  itemId: string;
  /** A short name for a snag raised on the list. */
  title?: string;
  note: string;
  evidence: JobEvidence[];
  raisedByName: string;
  raisedAt: string;
  severity: 'safety_critical' | 'functional' | 'cosmetic';
  /** `assigned` waits for the rework to start; `ready_for_retest` is "pending re-verification"; `waived` is the customer's own choice; `withdrawn` is Admin's ruling that the finding was acceptable. */
  status: 'open' | 'assigned' | 'in_progress' | 'ready_for_retest' | 'disputed' | 'verified' | 'waived' | 'withdrawn';
  ownerId?: string;
  ownerName?: string;
  assignedAt?: string;
  dueAt?: string;
  /** Whoever did the rework (136): never the one who verifies it. */
  fixedById?: string;
  fixedAt?: string;
  /** Snags that share a root cause: fixing the primary resolves the rest. */
  groupId?: string;
  groupPrimaryId?: string;
  groupNote?: string;
  /** A technician's professional disagreement with the finding, and Admin's tie-break. */
  dispute?: { reason: string; byName: string; at: string; fromStatus: 'open' | 'assigned' | 'in_progress' | 'ready_for_retest'; decision?: { kind: 'finding_stands' | 'retest_ordered' | 'finding_withdrawn'; note: string; byName: string; at: string } };
  /** A cosmetic finding the customer is content to live with. A choice, never a fix. */
  waiver?: { by: string; note: string; recordedByName: string; at: string };
  verifiedAt?: string;
  verifiedByName?: string;
  /** Closed because the primary snag of its group was resolved. */
  resolvedVia?: string;
  events: SnagEvent[];
  /** The work of putting it right (136): each attempt, the parts it needed, and how its scope grew. */
  rework?: { rounds: ReworkRound[]; parts: ReworkPartRequest[]; scope: { at: string; byName: string; note: string; from: 'safety_critical' | 'functional' | 'cosmetic'; to: 'safety_critical' | 'functional' | 'cosmetic' }[] };
  isDemo: boolean;
}

/** One attempt at putting a snag right. A retest that fails again starts the next round; earlier rounds stay on the record. */
export interface ReworkRound {
  n: number;
  startedAt: string;
  startedById: string;
  startedByName: string;
  completedAt?: string;
  notes?: string;
  evidence: JobEvidence[];
}

/** A part the fix needs that was not part of the original delivery. Admin turns it into a small purchase order. */
export interface ReworkPartRequest {
  id: string;
  description: string;
  quantity: number;
  note?: string;
  requestedByName: string;
  requestedAt: string;
  /** The draft purchase order Admin raised for it (092 takes it from there). */
  poId?: string;
  itemId?: string;
  orderedByName?: string;
  orderedAt?: string;
}

/* ------------------------------------ QC inspector assignment (131) */

export type QcAssignmentStatus = 'assigned' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type QcWindow = 'morning' | 'afternoon';

export type QcEventKind = 'assigned' | 'exception_assigned' | 'reassigned' | 'preference_recorded' | 'scheduled' | 'rescheduled' | 'conflict_flagged' | 'conflict_cleared' | 'cancelled';
/** Append-only: who was named, why, what was agreed with the customer, and every independence concern that was raised. */
export interface QcAssignmentEvent {
  id: string;
  at: string;
  kind: QcEventKind;
  byName: string;
  note?: string;
}

/** The person who checks a finished installation, independent of the people who did it. Admin may hold the role as a documented exception. */
export interface QcAssignment {
  id: string;
  jobId: string;
  inspectorId: string;
  inspectorName: string;
  /** `admin_exception`: no independent, qualified inspector was available, so Admin (or someone Admin named despite a gap) does it, and says why. */
  mode: 'inspector' | 'admin_exception';
  /** What the person lacks that made this an exception (a skill tag, or being Admin), kept for the record. */
  exceptionGaps?: string[];
  exceptionNote?: string;
  status: QcAssignmentStatus;
  /** The site's calendar day (`yyyy-mm-dd`) and half-day of the visit once agreed. */
  scheduledDate?: string;
  window?: QcWindow;
  /** Admin recorded that the customer agreed to this time (or that it is one they asked for). */
  customerAgreedAt?: string;
  /** An independence concern: they were part of the installation, or said so themselves. Admin decides. */
  conflict?: { kind: 'was_on_installation' | 'self_reported'; involvement: string[]; note?: string; flaggedAt: string; byName: string; clearedAt?: string; clearedNote?: string; clearedByName?: string };
  assignedAt: string;
  assignedByName: string;
  notifiedAt?: string;
  previous: { inspectorId: string; inspectorName: string; until: string; reason: string }[];
  events: QcAssignmentEvent[];
  isDemo: boolean;
}

/** A day (or half-day) an inspector cannot take a visit. Set by them or by Admin. */
export interface InspectorUnavailability {
  id: string;
  userId: string;
  date: string;
  window: QcWindow | 'all';
  reason: string;
  setByName: string;
  at: string;
}

/** When the customer would like the quality-check visit, as Admin recorded it from the conversation. */
export interface QcVisitPreference {
  dates: string[];
  window: QcWindow | 'any';
  note?: string;
  recordedByName: string;
  at: string;
}

/* ------------------------------------ As-installed material log (128) */

/** Where a part that was used came from. `stock` is the technician's own general stock (a small common fastener): accountable
 *  differently from a delivered component, so it is never allowed to stand in for a major one. */
export type MaterialSource = 'delivered' | 'stock' | 'local_purchase';
/** Why a planned part was not used as planned (or why an unplanned one was). */
export type MaterialDeviationKind = 'defective_replaced' | 'damaged_in_transit' | 'wrong_part_supplied' | 'unsuitable' | 'not_needed' | 'wastage' | 'substitute' | 'extra_needed' | 'other';
/** What becomes of what was not used. `return_to_pool` keeps it as a reusable part for a nearby job. */
export type LeftoverAction = 'return_to_pool' | 'return_to_supplier' | 'scrap' | 'left_with_customer';

/** One installed unit's serial or batch number. A number that cannot be read is said to be unreadable, never made up. */
export interface MaterialIdentifier {
  serial?: string;
  batch?: string;
  legible: boolean;
  note?: string;
}

/** What was actually done with one line of the bill of materials, or with a part that was not on it. The technician's own record,
 *  closest to the ground truth: the original order is what was planned, this is what is in the lift. */
export interface JobMaterialUse {
  id: string;
  source: MaterialSource;
  /** The purchase-order line it stands for; unset for a part that was not on the plan. */
  lineItemId?: string;
  poCode?: string;
  supplierId?: string;
  category: string;
  description: string;
  plannedQty: number;
  usedQty: number;
  leftoverQty: number;
  leftoverAction?: LeftoverAction;
  deviation?: { kind: MaterialDeviationKind; reason: string; replacesLineItemId?: string };
  identifiers: MaterialIdentifier[];
  /** The order record still said this had not arrived when it was used: kept, so the two records can be reconciled. */
  deliveryUnconfirmed?: boolean;
  /** What a stock or locally bought part cost, when the person knows: it feeds the job's final costing. */
  unitCost?: number;
}

export interface JobMaterialLog {
  jobId: string;
  uses: JobMaterialUse[];
  status: 'draft' | 'confirmed';
  savedAt: string;
  savedByName: string;
  confirmedAt?: string;
  confirmedByName?: string;
  /** Admin reopened it, with a reason: the record of a confirmed log being changed after the fact. */
  reopened: { at: string; byName: string; reason: string }[];
  isDemo: boolean;
}

/* ------------------------------------ Issue / blocker reports (127) */

/** What kind of real-world problem it is: the ones the procedure has no step for. */
export type IssueCategory = 'parts' | 'site_condition' | 'customer_readiness' | 'safety_concern' | 'other';
/** `minor` is noted and work carries on; `blocking` pauses the work and tells Admin; `safety` stops it now and escalates at once. */
export type IssueSeverity = 'minor' | 'blocking' | 'safety';
export type IssueResolutionKind = 'self_resolved' | 'fixed_on_site' | 'admin_resolved' | 'no_longer_relevant';

export interface JobIssueEvent {
  id: string;
  kind: 'reported' | 'note' | 'admin_note' | 'severity' | 'evidence' | 'linked' | 'resolved' | 'reopened' | 'paused' | 'resumed';
  at: string;
  byUserId: string;
  byName: string;
  byRole: 'technician' | 'admin' | 'system';
  note?: string;
  from?: IssueSeverity;
  to?: IssueSeverity;
}

/** One problem reported from the field. Never deleted: it is part of the job's permanent history, showing what was found and how it was
 *  handled, which protects AIEC and the technician alike. */
export interface JobIssue {
  id: string;
  code: string;
  jobId: string;
  category: IssueCategory;
  severity: IssueSeverity;
  description: string;
  /** The installation step it is about, when it is about one. */
  stepId?: string;
  /** The person says the procedure itself was unclear or wrong here: the signal that turns repeated reports into a change to the SOP. */
  sopGap: boolean;
  /** Raised from the team chat because the people on the job could not agree on what to do (130). */
  teamDisagreement?: boolean;
  evidence: JobEvidence[];
  status: 'open' | 'resolved';
  /** Reports that are the same problem share a group; the first report's id names it. */
  groupId: string;
  reportedByUserId: string;
  reportedByName: string;
  /** When it was found on site (a report made without signal keeps its own time). */
  createdAt: string;
  resolution?: { how: IssueResolutionKind; note: string; byName: string; byRole: 'technician' | 'admin'; at: string };
  events: JobIssueEvent[];
  isDemo: boolean;
}

/** Admin looked at a repeating pattern on one step and decided what to do about it. */
export interface IssuePatternReview {
  stepId: string;
  outcome: 'sop_updated' | 'no_change' | 'training_planned';
  note: string;
  byName: string;
  at: string;
}

/* ------------------------------------ Installation SOP (123) */

export type InstallSopPhase = 'preparation' | 'rails' | 'machine' | 'car' | 'wiring' | 'safety' | 'final';

/** A step or a photo that is only asked for when this configuration has the feature (an automatic rescue device only when the
 *  lift has power backup, door sensors only on automatic doors). */
export type InstallSopApplicability = { field: 'powerBackup'; equals: boolean } | { field: 'doorType'; oneOf: BuildingSpec['doorType'][] };

export interface InstallSopSlot {
  id: string;
  labelKey: string;
  required: boolean;
  /** What is to be captured: a still, or a short video for a check that is about behaviour. */
  kind: 'photo' | 'video';
  appliesWhen?: InstallSopApplicability;
}

export interface InstallSopStepDef {
  /** The job step this defines (`s1`…`s10`): the SOP says what each step needs, the job records what happened. */
  id: string;
  labelKey: string;
  phase: InstallSopPhase;
  /** Governor, buffers, rescue device, door safety sensors and the tests that prove them (BIS / IS emphasis): hard-gated on evidence. */
  safetyCritical: boolean;
  slots: InstallSopSlot[];
  /** Steps that must be done (or not applicable) first. Anything not listed can be done in whatever order the site allows. */
  dependsOn: string[];
  appliesWhen?: InstallSopApplicability;
  /** Whether the technician may mark it not applicable with a reason. A step that applies and is safety-critical never can. */
  canBeNotApplicable: boolean;
  /** Satisfied by the signed delivery confirmation (104), so it is never ticked a second time. */
  satisfiedByDelivery?: boolean;
}

/** One published version of the installation procedure. Append-only, like 107's delivery procedure: a job in progress finishes
 *  under the version it started with. */
export interface InstallSopVersion {
  version: number;
  effectiveFrom: string;
  changeNote: string;
  publishedByName: string;
  publishedAt: string;
  steps: InstallSopStepDef[];
}

export interface Job {
  id: string;
  code: string;
  dealId: string;
  technicianId?: string;
  status: JobStatus;
  siteName: string;
  address: string;
  location: GeoPoint;
  scheduledFor: string;
  startedAt?: string;
  completedAt?: string;
  steps: JobStep[];
  /** Set only when `status` moves to `'on_hold'` via screen 089's own
   *  "Flag to Pause Installation Progress" action — a payments escalation
   *  reaching into the installation module's own gating logic, never a
   *  silent status flip. Resuming (clearing these) is the installation
   *  module's own concern, not this screen's. */
  holdReason?: string;
  heldBy?: string;
  heldAt?: string;
  /** Everyone on the job when it is more than one person's. `technicianId` is the lead; the crew names the others and the steps each
   *  is responsible for, so an assistant sees their own part of the job and not the lead's whole view (121). Unset means the lead alone. */
  crew?: JobCrewMember[];
  /** The installation procedure version this job is being done under, pinned when it starts (123). */
  sopVersion?: number;
  /** Where a job goes back to when a hold that an issue report put on it is lifted (127). Set only while such a hold is in place. */
  resumeStatus?: JobStatus;
  /** Admin has turned the customer's view of this job's timeline off (129), with when, by whom and why. Unset means the customer sees it. */
  customerTimelineHidden?: { at: string; byName: string; note?: string };
  /** Someone on the crew holds the lead's authority for a while (130). */
  leadDelegation?: JobLeadDelegation;
  /** On a job with more than one person, the lead says the whole checklist is done before it goes to quality check (130). */
  leadSignOff?: { at: string; byUserId: string; byName: string };
  teamLog?: JobTeamEvent[];
  /** When the customer would like the quality-check visit (131). */
  qcPreference?: QcVisitPreference;
  isDemo: boolean;
}

export interface JobCrewMember {
  userId: string;
  role: 'lead' | 'assistant';
  /** The job steps this person owns. Empty for the lead, who answers for all of them. */
  stepIds: string[];
  /** What this person is doing on this job, in a few words (130). */
  responsibility?: string;
}

/** The lead is away on a day the job goes on: someone on the crew holds the lead's authority for a while (130). */
export interface JobLeadDelegation {
  toUserId: string;
  toName: string;
  /** Inclusive days, `yyyy-mm-dd`, on the site's calendar. */
  from: string;
  until: string;
  reason: string;
  byName: string;
  at: string;
  revokedAt?: string;
}

export type JobTeamEventKind = 'added' | 'reassigned' | 'lead_changed' | 'delegated' | 'delegation_ended' | 'steps_assigned' | 'signed_off';
/** Who joined, left, was given what, and who held the lead: the team's own history, kept on the job. */
export interface JobTeamEvent {
  id: string;
  at: string;
  kind: JobTeamEventKind;
  byName: string;
  subjectName?: string;
  note?: string;
}

/** What the next person on a job needs to know when a shift ends part-way through (130). */
export interface JobHandoffNote {
  id: string;
  jobId: string;
  fromUserId: string;
  fromName: string;
  /** A named person, or the whole team when unset. */
  toUserId?: string;
  toName?: string;
  text: string;
  /** The steps that were still open (the author's own) when it was written. */
  openStepIds: string[];
  createdAt: string;
  acknowledgedBy: { userId: string; name: string; at: string }[];
  isDemo: boolean;
}

/** One line in a job's own team chat: only the people on it, and Admin, ever see it. */
export interface JobTeamMessage {
  id: string;
  jobId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
  kind: 'message' | 'disagreement';
  /** The issue report a disagreement went up as (127). */
  issueId?: string;
  readBy: string[];
  isDemo: boolean;
}

/** Someone in the field pressed SOS. It is sent after a short window in which it can be cancelled, and the attempt is kept either way:
 *  a safety audit reads the cancelled ones too (019). Sending does not depend on the phone staying open. */
export interface FieldSosAttempt {
  id: string;
  userId: string;
  startedAt: string;
  /** Until this moment the person can cancel. At it, the alert is raised. */
  sendsAt: string;
  status: 'pending' | 'sent' | 'cancelled';
  cancelledAt?: string;
  alertId?: string;
  location?: GeoPoint;
  /** The job they were on, when they had one open that day. */
  jobId?: string;
  isDemo: boolean;
}

/* ---------------------------------------------------------------- Payments */

export type PaymentStage = 'advance' | 'material' | 'installation' | 'handover' | 'retention';
export type PaymentStatus = 'due' | 'pending' | 'paid' | 'overdue' | 'failed' | 'refunded' | 'disputed';

export interface Payment {
  id: string;
  code: string;
  dealId: string;
  stage: PaymentStage;
  amount: number;
  status: PaymentStatus;
  dueDate: string;
  paidAt?: string;
  method?: 'upi' | 'netbanking' | 'neft' | 'card' | 'cash' | 'cheque' | 'financing';
  /** Set once any amount has actually come in against this stage — may be
   *  less than `amount` (a common real-world partial payment). The
   *  remaining balance is `amount - amountReceived`, never forced into an
   *  all-or-nothing paid/unpaid state. Only reaches `status: 'paid'` once
   *  this covers the full amount. */
  amountReceived?: number;
  /** Set on every write that moves `amountReceived`, partial or full —
   *  unlike `paidAt` (only ever set once the stage is fully `'paid'`),
   *  this is the one field 088's receipt history can always sort and
   *  display by, even for a stage still only partly received. */
  lastReceivedAt?: string;
  /** Set only when Admin records a bank transfer or other payment received
   *  outside the app's own gateway — always paired with a reference
   *  number, and kept distinct from a gateway-confirmed automatic payment. */
  manualReferenceNumber?: string;
  recordedManuallyBy?: string;
  /** Set only when screen 084's gateway checkout confirms this stage —
   *  the gateway's own reference, stored verbatim for reconciliation and
   *  dispute-resolution, distinct from `manualReferenceNumber`. */
  gatewayTransactionRef?: string;
  /** Set when moved to `'disputed'` — pauses automated reminders/escalation
   *  for this specific stage without touching the deal's other stages. */
  disputeReason?: string;
  disputedBy?: string;
  disputedAt?: string;
  /** Snapshotted the moment `disputePayment` fires — what `status` was
   *  right before the dispute, so screen 090's resolution can restore it
   *  (a rejected or non-`'full_refund'` dispute never invents a new status
   *  out of thin air). */
  preDisputeStatus?: PaymentStatus;
  /** Set once screen 090 resolves the dispute — one of the three outcomes
   *  the spec names. `resolutionAmount` is only set for a refund, and is
   *  never more than what was actually received. */
  resolutionType?: 'full_refund' | 'partial_refund' | 'rejected';
  resolutionAmount?: number;
  resolutionNote?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  /** True when a refund had to be routed to the financing partner rather
   *  than paid back to the customer directly, because `method` was
   *  `'financing'` at resolution time — AIEC never held this money from
   *  the customer personally, so it was never AIEC's to hand back to them. */
  refundRoutedToFinancingPartner?: boolean;
  isDemo: boolean;
}

/* ------------------------------------------------------ Loan / EMI (085) */

export type LoanIncomeRange = 'below_5l' | '5l_10l' | '10l_25l' | 'above_25l';

export type LoanApplicationStatus = 'submitted' | 'under_review' | 'approved' | 'disbursed' | 'cancelled';

/** The quick, non-binding fit check — screen 085 shows its result plainly
 *  but never hard-blocks a full application on it, per the brief's own
 *  edge case. */
export interface LoanEligibilityPrecheck {
  incomeRange: LoanIncomeRange;
  tenurePreferenceMonths: number;
  eligible: boolean;
  /** Set only when `eligible` is false — the plain-language reason shown. */
  reasonKey?: string;
}

/** One customer's application to convert a deal's remaining balance to
 *  EMI through the financing partner. AIEC never decides approval here —
 *  `advanceLoanApplication` only ever moves this one step at a time, and
 *  the `disbursed` transition is the one moment this screen touches
 *  `Payment` at all: it settles the deal's outstanding stages up to
 *  `disbursedAmountReceived`, via the same partial-payment mechanics
 *  082/084 already use, tagged `method: 'financing'`.
 *
 * `partnerName` is real data (not translated UI copy) so 086's admin
 * reconciliation view can genuinely group and compare by partner if AIEC
 * ever integrates a second one — today every application has the same
 * value, which is exactly what "supports comparing them fairly" should
 * degrade to with only one partner. */
export interface LoanApplication {
  id: string;
  dealId: string;
  customerId: string;
  partnerName: string;
  precheck: LoanEligibilityPrecheck;
  requestedAmount: number;
  tenureMonths: number;
  interestRatePercent: number;
  emiAmount: number;
  totalRepayment: number;
  status: LoanApplicationStatus;
  /** Set once `status` reaches `'approved'` — may be less than
   *  `requestedAmount`; the gap is left for the customer to cover another
   *  way (084's per-stage checkout still works for whatever's left). */
  approvedAmount?: number;
  /** Set once `status` reaches `'disbursed'` — the amount that actually
   *  landed in AIEC's account, which a partner's processing fee can leave
   *  lower than `approvedAmount` even when nothing else went wrong. This,
   *  not `approvedAmount`, is what actually gets applied to `Payment`. */
  disbursedAmountReceived?: number;
  /** Set only when cancelled before disbursement — see
   *  `cancelLoanApplication`. Never set once `disbursed`: real money has
   *  moved by then, so this build has no reversal for it. */
  cancelReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  submittedAt: string;
  underReviewAt?: string;
  approvedAt?: string;
  disbursedAt?: string;
  isDemo: boolean;
}

/** The financing partner's own published rate for a tenure — fetched live
 *  each time (`getFinancingPartnerRates`), never cached or estimated, so
 *  the rate a customer locks in at application time is always current. */
export interface FinancingPartnerRate {
  tenureMonths: number;
  annualRatePercent: number;
}

/* -------------------------------------------------------- Invoicing (087) */

export type InvoiceType = 'stage' | 'final' | 'credit_note' | 'reissue';

/**
 * A GST-compliant document generated only from a real, already-paid
 * `Payment` (`type: 'stage'`) or a deal's full agreed price once every
 * stage has paid (`type: 'final'`) — there is no independent amount entry
 * anywhere, so nothing here can ever drift from what was actually charged
 * and paid. `customerName`/`customerAddress` are snapshotted at issue
 * time, not read live from the lead, so an already-issued invoice reads
 * exactly as it did the day it was issued even if the lead's own address
 * changes later — the whole reason a correction needs a `'reissue'`
 * rather than an edit.
 *
 * Immutable once created: a `'reissue'` supersedes an earlier invoice
 * (`supersedesInvoiceId`) rather than changing it, and a `'credit_note'`
 * references one (`referencesInvoiceId`) rather than editing or deleting
 * it — both are how this build satisfies "never silently edit a past
 * invoice."
 */
export interface Invoice {
  id: string;
  code: string;
  dealId: string;
  /** Set only for `type: 'stage'` — the exact Payment this invoice was
   *  generated from. */
  paymentId?: string;
  /** Snapshotted from `paymentId`'s own Payment at creation — set only
   *  for `type: 'stage'`, so the detail view never needs a second lookup
   *  just to say which stage this invoice covers. */
  stage?: PaymentStage;
  type: InvoiceType;
  customerName: string;
  customerAddress: string;
  customerGstin?: string;
  aiecGstin: string;
  taxableValue: number;
  gstPercent: number;
  gstAmount: number;
  totalAmount: number;
  issuedAt: string;
  issuedBy: string;
  /** Set only on a `'reissue'` — the invoice it supersedes. */
  supersedesInvoiceId?: string;
  reissueReason?: string;
  /** Set only on a `'credit_note'` — the invoice it's issued against. */
  referencesInvoiceId?: string;
  creditNoteReason?: string;
  isDemo: boolean;
}

export type PaymentDueTriggerType = 'fixed_date' | 'milestone';

export type PaymentScheduleType = 'standard' | 'custom' | 'bank_guarantee';

/**
 * One line of a deal's payment schedule — screen 081. `stage` keeps every
 * line traceable to the real `PaymentStage` taxonomy even on a fully
 * customised schedule; `label` is the admin-authored display name (default
 * seeded from the stage preset, freely editable) and, like other
 * admin-authored content in this build (objection scripts, competitor
 * positioning), is never machine-translated three ways.
 *
 * A `milestone` trigger names a real `Job.steps[].labelKey` (e.g.
 * `'job.step.materialsReceived'`) rather than storing a date at all — the
 * due date is resolved live from that job's own `completedAt` every time
 * this schedule is read, so a delayed milestone automatically pushes the
 * due date out with no separate update needed, and a due date is never set
 * before the event that's actually supposed to trigger it.
 */
export interface PaymentScheduleStage {
  id: string;
  stage: PaymentStage;
  label: string;
  amount: number;
  sequenceOrder: number;
  dueTrigger: PaymentDueTriggerType;
  /** Only meaningful when `dueTrigger` is `'fixed_date'`. */
  fixedDueDate?: string;
  /** Only meaningful when `dueTrigger` is `'milestone'`. */
  triggerMilestone?: string;
  isDemo: boolean;
}

/**
 * The one governed payment schedule for a deal, built from
 * `DealTerms.paymentStagePlan` once terms are confirmed. `activated` gates
 * it from being read as a live source anywhere else — an unactivated
 * schedule is still a draft, however far it's been edited. `scheduleType`
 * `'bank_guarantee'` is the very-large-commercial-deal edge case requiring
 * a documented note for Admin's direct oversight, distinct from a merely
 * `'custom'` stage count/split.
 */
export interface PaymentSchedule {
  id: string;
  dealId: string;
  scheduleType: PaymentScheduleType;
  stages: PaymentScheduleStage[];
  activated: boolean;
  activatedAt?: string;
  activatedBy?: string;
  customNote?: string;
  updatedAt: string;
  updatedBy: string;
  isDemo: boolean;
}

export type ReminderEscalationTier = 'friendly' | 'firm' | 'call_task';

/**
 * One step of the automated payment-reminder cadence — screen 083.
 * `daysOffset` is signed against a payment stage's own due date (negative
 * before, 0 on the day, positive after), so recalculating the whole
 * timeline for a shifted due date is just re-adding this same offset to
 * whatever the due date is now, never a stale cached date. `'call_task'`
 * tier has no `templateGroupId` — it creates a `FollowUpTask` for the
 * deal's owner instead of a customer-facing message, since escalating to a
 * human call is explicitly not another automated nudge.
 */
export interface ReminderRuleStep {
  id: string;
  daysOffset: number;
  escalationTier: ReminderEscalationTier;
  channel: CommChannel;
  /** Required for `'friendly'`/`'firm'` tiers — the Communication Templates
   *  Library (051) group this step sends from. Omitted for `'call_task'`. */
  templateGroupId?: string;
}

/** The one governed reminder cadence, applied to every deal's outstanding
 *  payment stages alike — there is no second, per-deal copy of this. */
export interface PaymentReminderConfig {
  id: string;
  steps: ReminderRuleStep[];
  /** A reminder due outside this daily window waits for the window to
   *  open, the same "don't message at 2am" courtesy the rest of the
   *  Communication Engine already extends. No holiday calendar exists
   *  anywhere in this build yet, so a public holiday is not checked. */
  sendWindowStartHour: number;
  sendWindowEndHour: number;
  updatedAt: string;
  updatedBy: string;
  isDemo: boolean;
}

/**
 * A deliberate, logged override that stops every automated reminder for
 * one deal's stages — never a silent mute. `paused` toggles; the record
 * keeps whichever of the pause/resume pairs happened most recently rather
 * than being deleted, so the history of why a deal went quiet is never lost.
 */
export interface PaymentReminderPause {
  id: string;
  dealId: string;
  paused: boolean;
  reason: string;
  pausedBy: string;
  pausedAt: string;
  resumedBy?: string;
  resumedAt?: string;
  /** A stop that ends by itself on this day (188); unset means until someone resumes it. */
  until?: string;
  isDemo: boolean;
}

/* --------------------------------------------------------------- Suppliers */

export type SupplierKycStatus = 'pending' | 'approved' | 'rejected';

export interface Supplier {
  id: string;
  name: string;
  status: 'active' | 'pending_approval' | 'suspended';
  /** Tracked separately from `status` — screen 091's own structural gate:
   *  only `'approved'` may ever be eligible for a Purchase Order, whatever
   *  `status` says, enforced through `@/features/suppliers/eligibility`. */
  kycStatus: SupplierKycStatus;
  kycReviewedBy?: string;
  kycReviewedAt?: string;
  city: string;
  gstin?: string;
  contactName?: string;
  contactPhone?: string;
  /** Component categories this supplier manufactures/supplies (e.g.
   *  `'traction_machine'`, `'controller'`) — screen 093's own catalogue
   *  taxonomy, distinct from `driveTypeSpecialties` below. */
  categories: string[];
  /** Free-form, not the closed `DriveType` union — 091's own edge case
   *  requires letting Admin add a genuinely new specialty (e.g. a niche
   *  accessibility-lift component) rather than forcing a mismatch into an
   *  existing one. Seeded from `DriveType`'s own values where they fit. */
  driveTypeSpecialties: string[];
  regionsServed: string[];
  /** 0..1 — share of orders delivered by the promised date. */
  onTimeRate: number;
  qualityScore: number;
  avgLeadTimeDays: number;
  openOrders: number;
  totalOrderValue: number;
  rating: number;
  invitedBy?: string;
  invitedAt?: string;
  suspendedReason?: string;
  suspendedBy?: string;
  suspendedAt?: string;
  /** Set only on the record retired into a canonical duplicate after a
   *  merge — its own order history is never rewound or deleted, only its
   *  future purchase orders and deal links are reassigned to the
   *  canonical supplier so both records' history reads under one id. */
  mergedIntoSupplierId?: string;
  /** Builds components to order (096) rather than reselling stock — only a
   *  manufacturer's PO lines get production-stage tracking. Set in 091. */
  isManufacturer?: boolean;
  /** How much trust AIEC extends on payment (100). Unset reads as `new`. */
  paymentTier?: SupplierTrustTier;
  /** A negotiated arrangement that doesn't fit the tier (100). */
  paymentTermsOverride?: SupplierPaymentTermsOverride;
  isDemo: boolean;
  /** Put on the watchlist by hand on 026 (a low score over two months puts a supplier there by itself). */
  watchlist?: { at: string; byName: string };
}

/* --------------------------------------------------- Operational telemetry */

export type ActivityKind =
  | 'lead_captured'
  | 'lead_stage_changed'
  | 'quote_sent'
  | 'deal_won'
  | 'deal_lost'
  | 'payment_received'
  | 'job_started'
  | 'job_step_completed'
  | 'job_completed'
  | 'qc_passed'
  | 'qc_failed'
  | 'surveyor_checked_in'
  | 'technician_checked_in'
  | 'automation_ran'
  | 'alert_raised';

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  /** Pre-resolved display values — the feed never re-queries to render a row. */
  actorName: string;
  actorRole: Role;
  subject: string;
  detail?: string;
  amount?: number;
  location?: GeoPoint;
  at: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  isDemo: boolean;
}

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface Alert {
  id: string;
  code: string;
  titleKey: string;
  /** Free-text specifics that don't belong in a translation file. */
  context: string;
  severity: AlertSeverity;
  category:
    | 'safety'
    | 'sla_breach'
    | 'payment'
    | 'automation'
    | 'quality'
    | 'staffing'
    | 'supplier';
  status: 'open' | 'acknowledged' | 'resolved';
  raisedAt: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
  relatedId?: string;
  /** Where to act on this — lets any dashboard route straight to the source
   *  without a per-category switch. */
  sourceRoute?: string;
  location?: GeoPoint;
  /** Hidden from the board, and its acknowledge reminder paused, until then (029). The alert itself is unchanged. */
  snoozedUntil?: string;
  snoozedByName?: string;
  /** Someone Admin handed this to: they own the follow-up until it is acknowledged (029). */
  delegatedToUserId?: string;
  delegatedAt?: string;
  delegatedByName?: string;
  isDemo: boolean;
}

export interface GeoZone {
  id: string;
  name: string;
  /** Polygon vertices, closed implicitly. */
  points: GeoPoint[];
  assignedUserIds: string[];
  leadCount: number;
  status: 'active' | 'draft';
  isDemo: boolean;
}

export interface RouteStop {
  id: string;
  leadId?: string;
  jobId?: string;
  label: string;
  address: string;
  location: GeoPoint;
  windowStart: string;
  windowEnd: string;
  status: 'pending' | 'arrived' | 'done' | 'skipped';
  /** Distance from the previous stop, km. */
  legKm: number;
  legMinutes: number;
}

export interface RoutePlan {
  id: string;
  userId: string;
  date: string;
  stops: RouteStop[];
  totalKm: number;
  totalMinutes: number;
  /** Set when the optimizer has a better ordering than the current one. */
  optimizedKm?: number;
  optimizedMinutes?: number;
  isDemo: boolean;
}

export interface CommissionEntry {
  id: string;
  userId: string;
  leadId?: string;
  dealId?: string;
  /** Translation key for the reason, e.g. 'commission.reason.leadConverted'. */
  reasonKey: string;
  amount: number;
  status: 'projected' | 'approved' | 'paid' | 'forfeited';
  earnedAt: string;
  paidAt?: string;
  /** Set on a final-stage payout triggered by a project's handover certificate (140). */
  jobId?: string;
  payoutRole?: 'surveyor' | 'sales' | 'technician_lead' | 'technician' | 'qc_inspector';
  /** The judgement (140) that is holding this entry back: it stays `projected` until Admin releases it. */
  heldBy?: string;
  /** An entry that was taken back after it was recorded (a deal fell through): never deleted, so every figure that moved can say why. */
  reversal?: { at: string; reason: string; wasPaid: boolean };
  /** Set on a contest prize (167): which contest and the place that earned it. */
  contestId?: string;
  contestRank?: number;
  /** Set on an entry that corrects another (170): the one it adds to, which is never edited. */
  correctsId?: string;
  /** The commission rule (161) and the version of it that was in force when this was earned. Older entries carry none and are traced by their reason and date. */
  ruleId?: string;
  ruleVersion?: number;
  /** Absent means rupees. The workforce view (162) never adds amounts of different currencies together. */
  currency?: string;
  /**
   * Admin's checkpoint before this payout is released (163). Only an entry the ledger calls `approved` is in front of the checkpoint; with no record here it is
   * waiting. The amount cleared is kept so an amount changed afterwards puts it back in the queue. A hold carries only a kind: the reason Admin wrote is in the
   * decision history, and the partner is shown a standard line for the kind.
   */
  payoutApproval?: { status: 'approved' | 'held'; at: string; byName: string; amount?: number; expedited?: boolean; holdKind?: string };
  /** Where this payout is on its way to the partner's account (164): a pointer to the disbursement carrying it, kept in step with that record. A failed one stays here until it is retried or cancelled. */
  disbursement?: { id: string; status: 'initiated' | 'processing' | 'completed' | 'failed' | 'cancelled'; failure?: string };
  isDemo: boolean;
}

/* ------------------------------------------------------------------ Contests and the leaderboard (165, configured by 167) */

export interface ContestReward {
  /** The place that earns it: 1 for the winner. */
  rank: number;
  kind: 'cash' | 'recognition';
  /** Rupees, for a cash reward. */
  amount?: number;
  /** What a recognition reward is (a badge, a shout-out), written by Admin. */
  label?: string;
}

/**
 * A time-boxed competition on one number (165 reads it, 167 configures it). The phase is never stored: it follows the dates, or `endedAt` when Admin stopped it early.
 * Once it closes, `final` freezes the standings so a later data correction can never silently change who won.
 */
export interface Contest {
  id: string;
  code: string;
  name: string;
  description?: string;
  cohort: 'surveyor' | 'technician';
  metric: 'leadsCaptured' | 'leadsConverted' | 'revenue' | 'jobsCompleted';
  startsAt: string;
  endsAt: string;
  rewards: ContestReward[];
  createdByName: string;
  createdAt: string;
  endedAt?: string;
  endedReason?: string;
  final?: { at: string; rows: { userId: string; rank: number; value: number }[] };
  /** Who may take part (167): partners with at least this much tenure on the day it starts, and whether someone who joins later can take part (counting only from the day they joined). */
  minTenureDays?: number;
  allowLateJoiners?: boolean;
  /** Whether the prizes are paid at the close; an early end chooses (`none` when the contest was flawed). */
  rewardPolicy?: 'pay' | 'none';
  /** What closing paid out: each cash prize is a real commission entry, cleared through the payout approval like any other (163); a recognition prize is recorded. `legacy` = settled before this record existed. */
  rewarded?: { at: string; entries: { userId: string; rank: number; kind: 'cash' | 'recognition'; amount?: number; label?: string; entryId?: string }[]; skipped: { rank: number; reason: 'no_winner' | 'nothing_earned' | 'not_paid' }[]; legacy?: boolean };
  /** Append-only: who did what to this contest and when. */
  events?: { at: string; kind: 'created' | 'edited' | 'launched' | 'ended_early' | 'closed' | 'rewarded' | 'cancelled'; byName: string; detail?: string }[];
  isDemo: boolean;
}

/** A change in someone's standing, kept so a number never moves without a visible reason. `correction` = the number went down, which only a corrected record can do. */
export interface ContestMovement {
  id: string;
  contestId: string;
  userId: string;
  at: string;
  kind: 'value' | 'rank';
  from: number;
  to: number;
  correction: boolean;
  isDemo: boolean;
}

/** Someone Admin has taken out of the ranking pending a review (024). One list, shared by every view of the ranking. */
export interface LeaderboardExclusion {
  userId: string;
  reason: string;
  byName: string;
  at: string;
}

/** A catalogue badge a partner has earned (166). Never removed or edited: the criteria version it was earned under is kept, so raising the bar later never takes it back. */
export interface EarnedBadge {
  id: string;
  userId: string;
  badgeId: string;
  /** The criteria version in force when it was earned. */
  version: number;
  earnedAt: string;
  isDemo: boolean;
}

/**
 * A partner's question about one of their own payouts (168). A thread of short messages (theirs and Admin's), read by both; Admin is asked to answer within a set time, and the
 * partner says when it is settled. Nothing is deleted.
 */
export interface PayoutQuery {
  id: string;
  code: string;
  entryId: string;
  partnerId: string;
  /** A message is the partner's words, Admin's, or the app's own (`system`: a translation key, never English). `progress` marks a "still working on it" that is not an answer. */
  messages: { at: string; from: 'partner' | 'admin' | 'system'; byName: string; text?: string; key?: string; params?: Record<string, string | number>; progress?: boolean }[];
  resolvedAt?: string;
  /** From 170. Absent means a plain question (168): the two-day answer and nothing more formal. */
  kind?: 'question' | 'dispute';
  topic?: 'amount_low' | 'missing' | 'wrong_rule' | 'held_long' | 'deduction' | 'other';
  /** What the partner expected the entry to be. */
  claimedAmount?: number;
  /** 1 for a first ask; asking again after a resolution makes a new record with the next round and says which it follows. */
  round?: number;
  repeatOf?: { code: string; same: boolean };
  firstReplyAt?: string;
  escalation?: { at: string; byName: string; reason: string };
  /** How it ended. No resolution on a resolved record means the partner withdrew it. */
  resolution?: { type: 'adjustment' | 'explanation'; notes: string; at: string; byName: string; correctionEntryId?: string; correction?: number };
  /** The dispute pointed at the commission rules, not one partner: Admin asked for a broader review (kept with the figures as they stood). */
  systemic?: { ruleId: string | null; version: number | null; note: string; at: string; byName: string; others: number; othersAmount: number; review?: { outcome: 'rule_changed' | 'no_change'; note: string; at: string; byName: string } };
  isDemo: boolean;
}

/* ------------------------------------------------------------------ Tax deducted at source (169) */

/** One version of a TDS section's rate and yearly limit. Append-only and may start on a future day, so a rule change is scheduled, never retroactive; a deduction keeps the rate it was made at. */
export interface TdsRateRecord {
  id: string;
  section: '194H' | '194C' | '194Q';
  version: number;
  /** Percent. */
  rate: number;
  /** Tax is deducted once the partner's payouts in the financial year pass this. */
  threshold: number;
  effectiveFrom: string;
  reason: string;
  byName: string;
  at: string;
  isDemo: boolean;
}

/** What was deducted from one payout (or none: below the limit, a genuine zero). Never edited: a transfer that did not go has its deduction voided, and the retry makes a new one. */
export interface TdsDeduction {
  id: string;
  code: string;
  partnerId: string;
  role: 'surveyor' | 'technician' | 'supplier';
  section: '194H' | '194C' | '194Q';
  fy: string;
  quarter: 1 | 2 | 3 | 4;
  deductedAt: string;
  /** What this payout was worth before tax. */
  grossAmount: number;
  /** Everything paid to them this financial year including this payout (the limit is judged on it). */
  cumulativeGross: number;
  baseRate: number;
  /** The rate applied: the base rate, or the higher one when there was no PAN. */
  rate: number;
  amount: number;
  panOnFile: boolean;
  rateVersion: number;
  /** The share of the deduction that belongs to earlier payments this year (the payout that crosses the limit carries it). */
  catchUp: number;
  entryIds: string[];
  disbursementId?: string;
  confirmedAt?: string;
  voidedAt?: string;
  isDemo: boolean;
}

export interface PartnerTaxProfile {
  userId: string;
  pan?: string;
  recordedAt?: string;
  byName?: string;
}

/** A deposit of the tax deducted in one month, recorded by Admin from the accountant's challan. */
export interface TdsDeposit {
  id: string;
  month: string;
  bsr: string;
  serial: string;
  date: string;
  amount: number;
  byName: string;
  at: string;
  isDemo: boolean;
}

/** A quarterly return filed by the accountant, recorded with its acknowledgement. */
export interface TdsReturn {
  fy: string;
  quarter: 1 | 2 | 3 | 4;
  ack: string;
  filedAt: string;
  byName: string;
  at: string;
  isDemo: boolean;
}

/** Where a partner is paid (164). The full number never leaves the repository; views show the last four digits. `simulatedBank` stands in for what the bank itself would answer. */
export interface PayoutAccount {
  userId: string;
  holderName: string;
  upiId?: string;
  accountNumber?: string;
  ifsc?: string;
  bankName?: string;
  /** Verified by a penny-drop when the partner was onboarded, or when Admin last recorded corrected details. */
  verifiedAt?: string;
  updatedAt: string;
  updatedByName: string;
  simulatedBank?: 'ok' | 'closed' | 'rejected';
  isDemo: boolean;
}

export type DisbursementEventKind = 'created' | 'processing' | 'completed' | 'failed' | 'retried' | 'cancelled' | 'contacted' | 'details_updated' | 'note';
export interface DisbursementEvent {
  at: string;
  kind: DisbursementEventKind;
  byName: string;
  /** What happened, as a short fact or the reason code; the screen words it in the reader's language. */
  detail?: string;
}

/**
 * One transfer of cleared commission to one partner (164), carrying one or several of their entries. Append-only history: a failed transfer is never rewritten into a
 * success; a retry is a new disbursement that points back at it (`retryOf`).
 */
export interface PayoutDisbursement {
  id: string;
  code: string;
  partnerId: string;
  entryIds: string[];
  /** What was sent to the partner's account (after any tax deducted at source). */
  amount: number;
  /** What the entries are worth before tax, and the tax held back from this transfer (169). */
  grossAmount?: number;
  tdsAmount?: number;
  method: 'bank_transfer' | 'upi';
  /** What it was sent to, as it read then (masked): later changes to the partner's details never rewrite it. */
  destination: string;
  status: 'initiated' | 'processing' | 'completed' | 'failed' | 'cancelled';
  kind: 'scheduled' | 'urgent' | 'retry';
  runId?: string;
  retryOf?: string;
  attempt: number;
  createdAt: string;
  sentAt?: string;
  completedAt?: string;
  failedAt?: string;
  failure?: string;
  bankReference?: string;
  createdByName: string;
  events: DisbursementEvent[];
  isDemo: boolean;
}

/** A run of the payout engine (164): the weekly schedule or a run Admin started. It says exactly which transfers went and which did not, so a run stopped partway is never ambiguous. */
export interface PayoutRun {
  id: string;
  code: string;
  kind: 'weekly' | 'manual';
  /** The schedule slot a weekly run answers, so it can never run twice for the same slot. */
  slot?: string;
  startedAt: string;
  finishedAt?: string;
  status: 'running' | 'completed' | 'interrupted';
  interruptedReason?: string;
  disbursementIds: string[];
  skipped: { partnerId: string; reason: string; entryIds: string[] }[];
  byName: string;
  isDemo: boolean;
}

export interface PayoutSchedule {
  enabled: boolean;
  weekday: number;
  hour: number;
  consolidate: boolean;
  /** Runs before this are never made up: a changed schedule starts from now. */
  since: string;
  /** The slot already answered (with a run, or because nothing was ready), so it is never answered twice. */
  handledSlot?: string;
  updatedAt: string;
  updatedByName: string;
}

/** One decision at the payout checkpoint (163). Append-only: a hold, a release or a clearance is never edited, only followed by the next one. */
export interface PayoutDecision {
  id: string;
  entryId: string;
  kind: 'approved' | 'held' | 'released';
  at: string;
  byName: string;
  /** What Admin wrote: for a hold, why; for an urgent clearance, why it could not wait. Never shown to the partner. */
  reason?: string;
  holdKind?: string;
  expedited?: boolean;
  /** The flags Admin had seen and accepted when clearing. */
  acknowledged?: string[];
  /** Cleared together with others in one batch. */
  batchId?: string;
  isDemo: boolean;
}

/** One version of a commission rule's numbers (161). Append-only: a version applies from its own day and is never edited. */
export interface CommissionRuleVersion {
  version: number;
  /** yyyy-mm-dd: the first day an event is paid under these numbers. */
  effectiveFrom: string;
  params: { amount?: number; pct?: number; floor?: number; leadBonusPct?: number; minCrewPct?: number };
  reason: string;
  setByName: string;
  at: string;
  /** Partners told ahead of the change, with what they were told. */
  notice?: { sentAt: string; message: string; recipients: number };
  /** What Admin had seen and accepted from the simulation when publishing. */
  acknowledged?: string[];
}
export interface CommissionRule {
  id: string;
  versions: CommissionRuleVersion[];
}

export interface Badge {
  id: string;
  labelKey: string;
  descriptionKey: string;
  earned: boolean;
  earnedAt?: string;
  progress: number;
  target: number;
}

export interface AutomationRule {
  id: string;
  name: string;
  triggerKey: string;
  actionKey: string;
  enabled: boolean;
  runsToday: number;
  failuresToday: number;
  lastRunAt: string;
  avgLatencyMs: number;
  status: 'healthy' | 'degraded' | 'failing' | 'paused';
  /** A step of the heartbeat (181) rather than a configured rule: `runsToday` counts the runs that did something, `failuresToday` the runs that failed. */
  scheduled?: boolean;
  category?: string;
  lastError?: string | null;
  skippedRuns?: number;
  isDemo: boolean;
}

/** One thing an automation did on its own initiative — no human at the call
 *  site. Not lead-scoped (unlike `LeadTimelineEvent`), since automated
 *  actions touch payments, invoices and POs too. `ruleId` is optional: some
 *  automated actions (e.g. invoice backfill) have no `AutomationRule` row. */
export interface AutomatedActionLogEntry {
  id: string;
  ruleId?: string;
  sourceKey: string;
  triggeringCondition: string;
  actionTaken: string;
  affectedRecordId: string;
  affectedRecordType: 'payment' | 'invoice' | 'purchase_order' | 'lead' | 'deal' | 'quotation' | 'commitment' | 'alert' | 'other';
  /** The affected record's human code (PAY-…, PO-…), for display. Never
   *  prose — the drawer renders the action from `sourceKey` in the reader's
   *  own language. */
  subjectLabel?: string;
  /** The heartbeat step that took the action, when one did (181): what ties an action to its category. */
  unitId?: string;
  at: string;
  /** Position in the log (1, 2, 3…): the log is append-only, so a gap or a change shows (187). */
  seq?: number;
  /** The fingerprint of the entry before it, and of this one: a chain that makes later tampering visible. */
  prevHash?: string;
  hash?: string;
  /** Set when the action was a person's override, not an automation's own: who, and the override it belongs to (188). */
  manual?: { byName: string; overrideId: string };
  isDemo: boolean;
}

/** Who took a copy of the log out of the app, and what it covered: the audit of the audit (187). Append-only. */
export interface AuditExportRecord {
  id: string;
  at: string;
  byName: string;
  kind: 'csv' | 'record_bundle';
  count: number;
  /** What was asked for, in words. */
  scope: string;
  fromSeq: number | null;
  toSeq: number | null;
  /** The fingerprint at the head of the log when it was taken, so a copy can later be checked against the log. */
  headHash: string;
}

/* ---------------------------------------------------- Manager layer: work */

/**
 * Every dated promise the business runs on, derived from the records that
 * already carry it (see `src/features/work/commitmentRules.ts`). A new
 * screen that introduces a new dated obligation adds a rule there rather
 * than a queue of its own.
 */
export type CommitmentKind =
  | 'onboarding_review'
  | 'payment_due'
  | 'payment_collect'
  | 'job_assign'
  | 'job_start'
  | 'po_send'
  | 'po_acknowledge'
  | 'po_status_update'
  | 'po_delivery_date'
  | 'po_delivery'
  | 'quote_expiring'
  | 'terms_customer_confirm'
  | 'discount_decision'
  | 'counter_offer_decision'
  | 'catalog_price_review'
  | 'rating_dispute_review'
  | 'supplier_agreement_renewal'
  | 'supplier_agreement_acknowledge'
  | 'supplier_thread_reply'
  | 'supplier_retention_decision'
  | 'delivery_schedule'
  | 'delivery_receive'
  | 'shipment_status_update'
  | 'delivery_confirmation_sign'
  | 'site_checkout_confirm'
  | 'safety_review'
  | 'job_issue_resolve'
  | 'material_log_confirm'
  | 'handoff_acknowledge'
  | 'qc_assign'
  | 'qc_schedule'
  | 'qc_visit'
  | 'qc_exception_review'
  | 'qc_certificate_issue'
  | 'snag_assign'
  | 'snag_rework'
  | 'snag_reverify'
  | 'snag_dispute_decide'
  | 'snag_part_order'
  | 'handover_confirm'
  | 'handover_admin_review'
  | 'walkthrough_arrange'
  | 'walkthrough_conduct'
  | 'walkthrough_signoff'
  | 'walkthrough_followup'
  | 'warranty_register'
  | 'amc_renewal_review'
  | 'handover_certificate_issue'
  | 'application_reference_check'
  | 'application_screening'
  | 'interview_arrange'
  | 'interview_slot_wait'
  | 'interview_conduct'
  | 'verification_pending'
  | 'verification_conditional_due'
  | 'offer_prepare'
  | 'offer_signature_wait'
  | 'partner_onboarding_finish'
  | 'waitlist_review'
  | 'tier_dispute_decide'
  | 'exit_work_handover'
  | 'exit_settlement'
  | 'exit_dispute_decide'
  | 'tier_review_due'
  | 'certification_renewal'
  | 'training_assignment' | 'compliance_review' | 'sop_rollout_ack' | 'sop_rollout_close' | 'training_feedback_urgent' | 'training_feedback_review' | 'commission_rule_notice' | 'payout_approval' | 'payout_hold_review' | 'payout_disbursement_attention' | 'contest_live' | 'contest_closing' | 'contest_result' | 'payout_query_answer' | 'payout_query_reply' | 'tds_deposit' | 'tds_return' | 'payout_dispute_resolve' | 'payout_rule_review' | 'service_ticket_respond' | 'service_visit' | 'service_claim_review' | 'service_visit_followup' | 'support_chat_reply' | 'feedback_outreach' | 'feedback_recognition' | 'referral_reward' | 'automation_pause_review' | 'escalation_drill_due' | 'escalation_gap_fix' | 'integration_followup' | 'integration_credential_rotation' | 'sandbox_promotion_pending' | 'sandbox_library_review' | 'company_profile_legal_verify' | 'permission_override_review' | 'monitor_daily_check' | 'monitor_concern_followup' | 'privacy_request_respond' | 'privacy_policy_notice' | 'privacy_retention_review' | 'security_place_review' | 'security_2fa_exception_decide' | 'security_2fa_exception_review' | 'security_account_recovery' | 'backup_failure_followup' | 'backup_restore_test' | 'export_collect' | 'billing_payment_fix' | 'billing_renewal_due' | 'legal_issue_fix' | 'legal_review_due' | 'help_content_attention' | 'help_suggestions_review' | 'app_feedback_review'
  | 'qc_finding_explain'
  | 'lead_signoff'
  | 'discrepancy_report_review'
  | 'partner_feed_restore'
  | 'supplier_payment_approve'
  | 'supplier_payment_hold_review'
  | 'advance_recovery_followup'
  | 'reconciliation_exception_review'
  | 'reconciliation_feed_restore'
  | 'retention_release_ready'
  | 'supplier_dispute_resolve'
  | 'supplier_dispute_process_review'
  | 'gst_period_handover'
  | 'gst_status_check'
  | 'supplier_invoice_submit'
  | 'supplier_invoice_mismatch_review'
  | 'delivery_delay_action'
  | 'orphaned_po_decision'
  | 'discrepancy_report_review'
  | 'alert_acknowledge'
  | 'follow_up_task'
  | 'lead_revisit';

export type CommitmentSubjectType =
  | 'application'
  | 'service_ticket'
  | 'snag'
  | 'material_log'
  | 'handoff'
  | 'qc_assignment'
  | 'qc_attempt'
  | 'qc_finding'
  | 'job_issue'
  | 'safety_test'
  | 'site_checkin'
  | 'payment'
  | 'job'
  | 'purchase_order'
  | 'quotation'
  | 'deal_terms'
  | 'discount_request'
  | 'counter_offer'
  | 'alert'
  | 'follow_up_task'
  | 'lead'
  | 'catalog_price_change'
  | 'supplier_order_rating'
  | 'supplier_agreement'
  | 'supplier_thread'
  | 'supplier_retention'
  | 'delivery'
  | 'shipment'
  | 'delivery_partner'
  | 'supplier_payment'
  | 'supplier_invoice'
  | 'gst_period'
  | 'supplier_dispute'
  | 'advance_recovery'
  | 'supplier_retention'
  | 'reconciliation_exception'
  | 'bank_feed'
  | 'supplier_gst';

/**
 * 0 nothing sent yet · 1 owner nudged before due · 2 owner told it's overdue
 * · 3 escalated to the owner's `reportsTo` (or Admin's backup) · 4 raised as
 * an Alert for Admin. The engine only ever moves this forward, which is what
 * makes it safe to run every minute.
 */
export type EscalationLevel = 0 | 1 | 2 | 3 | 4;

export interface Commitment {
  id: string;
  /** `${kind}:${subject.id}` — one commitment per obligation, whoever owns it. */
  key: string;
  kind: CommitmentKind;
  ownerUserId: string;
  subject: { type: CommitmentSubjectType; id: string };
  titleKey: string;
  /** Codes, names and numbers only — never prose. */
  titleParams: Record<string, string>;
  /** Rendered with `formatINR` by the reader, not pre-formatted. */
  amount?: number;
  dueAt: string;
  status: 'open' | 'done' | 'cancelled';
  /** Open but not being chased — a disputed payment, a deal someone has
   *  paused reminders on. The ladder doesn't advance while paused. */
  paused: boolean;
  escalationLevel: EscalationLevel;
  escalatedToUserId?: string;
  lastActionAt?: string;
  createdAt: string;
  completedAt?: string;
  /** Where the owner acts, one tap from the assistant. */
  actionRoute: string;
  /** Where Admin acts when this reaches them by escalation. */
  oversightRoute: string;
  isDemo: boolean;
}

export type WorkNotificationKind = 'nudge' | 'overdue' | 'escalated';

/** Written only by the follow-up engine. Named to stay clear of the DOM's
 *  own global `Notification`. */
export interface WorkNotification {
  id: string;
  userId: string;
  commitmentId: string;
  kind: WorkNotificationKind;
  at: string;
  readAt?: string;
  isDemo: boolean;
}

/** One point in any time series a dashboard charts. */
export interface SeriesPoint {
  /** ISO date, or a short bucket label for non-date axes. */
  t: string;
  v: number;
}

export interface SiteVisitVerification {
  id: string;
  leadId: string;
  surveyorId: string;
  surveyorName: string;
  siteName: string;
  checkInAt: string;
  checkOutAt?: string;
  /** Metres between the recorded GPS fix and the lead's site coordinates. */
  gpsDriftMetres: number;
  photoCount: number;
  photoTimestampsValid: boolean;
  dwellMinutes: number;
  status: 'pending' | 'verified' | 'flagged' | 'rejected';
  flagReason?: string;
  location: GeoPoint;
  isDemo: boolean;
}

/* ============================================== Communication engine (M6) */

export type CommChannel = 'sms' | 'whatsapp' | 'call' | 'in_app';

/** One saved edit of a template's body — the version history the spec
 *  requires so a change can be reviewed or reverted. */
export interface TemplateVersion {
  version: number;
  body: string;
  editedBy: string;
  editedAt: string;
}

/** `groupId` ties together the per-language variants of one logical
 *  template — "Quote Follow-Up" in en/hi/mr is three records, one groupId. */
export interface CommTemplate {
  id: string;
  groupId: string;
  name: string;
  channel: CommChannel;
  associatedStage: LeadStage | 'any';
  language: Language;
  /** Contains `{{tokenKey}}` merge-field placeholders. */
  body: string;
  mergeFields: string[];
  status: 'active' | 'draft';
  versions: TemplateVersion[];
  updatedAt: string;
  updatedBy: string;
  isDemo: boolean;
}

export type SequenceBranch = 'always' | 'no_response' | 'positive_response' | 'negative_response';

export interface SequenceStep {
  id: string;
  order: number;
  /** Days to wait after the previous step (or the trigger, for step 1). */
  waitDays: number;
  templateGroupId: string;
  branch: SequenceBranch;
}

export interface CommSequence {
  id: string;
  name: string;
  triggerStage: LeadStage;
  steps: SequenceStep[];
  maxNudgesPerLead: number;
  priority: number;
  isActive: boolean;
  /** Explicit, logged choice for the "lead reopens after Lost" edge case —
   *  never an accidental restart. */
  restartOnReopen: boolean;
  updatedAt: string;
  isDemo: boolean;
}

export type MessageSender = 'customer' | 'bot' | 'agent';
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export interface CommMessage {
  id: string;
  conversationId: string;
  channel: CommChannel;
  sender: MessageSender;
  /** Set when sender is 'agent' — whose name shows on the bubble. */
  senderName?: string;
  body: string;
  /** A support-chat assistant reply is a translation key (the customer reads it in their own language); `body` stays empty for it. */
  botKey?: { key: string; params?: Record<string, string | number> };
  /** Buttons that go with an assistant reply. */
  links?: { labelKey: string; route: string }[];
  /** Makes a message sent twice from a phone with poor signal one message. */
  clientId?: string;
  mediaKind?: 'photo' | 'voice';
  /** Set on bot/automated sends — which logical template produced this
   *  message, so Communication Analytics can compute real per-template
   *  response rates instead of an estimate. */
  templateGroupId?: string;
  /** Set when the channel the template asked for was not allowed for this person (their opt-out or choice) and the notice reached them in the app instead (180). */
  fallbackFrom?: CommChannel;
  status: MessageStatus;
  at: string;
  /** Bot handled this with confidence below the escalation threshold, or an
   *  explicit escalation topic — surfaces in the Reply Inbox either way. */
  requiresHumanReview?: boolean;
  handled?: boolean;
}

export interface Conversation {
  id: string;
  leadId: string;
  /** A post-sale support conversation with a customer (176), apart from the sales thread on the same lead. */
  kind?: 'sales' | 'support';
  support?: SupportChatMeta;
  assignedAgentId?: string;
  lastMessageAt: string;
  /** A human's live reply pauses the automated sequence until this instant. */
  sequencePausedUntil?: string;
  isDemo: boolean;
}

export type CallOutcome = 'connected_interested' | 'connected_not_interested' | 'no_answer' | 'wrong_number' | 'pocket_dial';

export interface CallLogEntry {
  id: string;
  leadId: string;
  /** Null means placed/scheduled but never dispositioned. */
  outcome: CallOutcome | null;
  durationSec: number;
  at: string;
  recordingUrl?: string;
  consentGiven: boolean;
  loggedBy: 'auto_dialer' | 'manual';
  isDemo: boolean;
}

export type BroadcastStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';

export type SmsFailureReason = 'invalid_number' | 'carrier_block' | 'handset_unreachable';

export interface SmsBroadcast {
  id: string;
  name: string;
  /** Human-readable summary of the filter used, e.g. "Pune · Quoted · Field survey". */
  segmentDescription: string;
  segmentLeadIds: string[];
  messageBody: string;
  scheduledFor?: string;
  status: BroadcastStatus;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  /** Only present once `failedCount > 0` — breaks the aggregate down by cause. */
  failureBreakdown?: Partial<Record<SmsFailureReason, number>>;
  optedOutExcludedCount: number;
  estimatedCost: number;
  actualCost?: number;
  createdAt: string;
  isDemo: boolean;
}

export interface BotConfig {
  toneKey: 'professional' | 'warm' | 'concise';
  allowedDiscountMinPct: number;
  allowedDiscountMaxPct: number;
  /** 0..1 — below this, the bot always hands off rather than guessing. */
  escalationConfidenceThreshold: number;
  autoResolvedRatePct: number;
  escalatedRatePct: number;
  updatedAt: string;
}

export type OptOutChannel = CommChannel | 'all';
export type OptOutEventType = 'opted_out' | 'opted_in';

/** Append-only. A re-opt-in is a new event, never an edit to the old one —
 *  the compliance record has to survive a regulatory inquiry intact. */
export interface OptOutEvent {
  id: string;
  contactPhone: string;
  contactName: string;
  channel: OptOutChannel;
  type: OptOutEventType;
  source: 'stop_keyword' | 'manual_entry' | 'customer_request' | 'dnd_registry';
  reason?: string;
  at: string;
  recordedBy: string;
  isDemo: boolean;
}

export interface TriggerRule {
  id: string;
  name: string;
  triggerStage: LeadStage;
  delayHours: number;
  actionTemplateGroupId?: string;
  actionSequenceId?: string;
  priority: number;
  enabled: boolean;
  allowStacking: boolean;
  createdAt: string;
  isDemo: boolean;
}

export interface ChannelStat {
  channel: CommChannel;
  totalSent: number;
  responseRatePct: number;
  cost: number;
}

export interface TemplateStat {
  templateGroupId: string;
  templateName: string;
  channel: CommChannel;
  totalSent: number;
  responseRatePct: number;
  conversionInfluenceScore: number;
  /** Too few sends yet for the rate to be statistically meaningful. */
  earlyData: boolean;
}


/* ------------------------------------------------------------------ Service tickets (175) */

/** What the customer says it is about. `emergency` (someone trapped / unsafe right now) is its own path; `safety` is "looks or sounds unsafe"; `fault` is "not working properly". */
export type TicketCategory = 'emergency' | 'safety' | 'fault' | 'billing' | 'general' | 'maintenance';
export type TicketUrgency = 'emergency' | 'high' | 'normal' | 'low';
/** For a fault: how bad it is, in the customer's own terms. */
export type TicketImpact = 'out_of_service' | 'working_badly' | 'minor';
export type TicketStatus = 'submitted' | 'assigned' | 'in_progress' | 'resolved' | 'withdrawn';
/** Where the request goes: a person on call now, a technician's visit, the accounts side, or Admin to look at first. */
export type TicketRoute = 'emergency' | 'site_visit' | 'accounts' | 'triage';
/** Who a defect is down to, decided by a person from the installation's evidence trail, never automatically. */
export type TicketResponsibility = 'aiec_installation' | 'manufacturer_defect' | 'customer_misuse' | 'normal_wear';
export type VisitOutcome = 'fixed' | 'needs_parts' | 'needs_followup' | 'no_fault_found' | 'unsafe_shut_down';
export type TicketCoverageState = 'in_warranty' | 'on_amc' | 'out_of_cover' | 'unknown';

export interface TicketCoverage {
  state: TicketCoverageState;
  warrantyEndsOn: string | null;
  amcEndsOn: string | null;
  amcTier: string | null;
  /** The AMC's promised response time, when the lift is on one. */
  responseHours: number | null;
}

export interface TicketAttachment {
  id: string;
  kind: 'photo' | 'video';
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  durationS?: number;
  /** A still, or a video's poster frame (the file itself is not stored: there is no storage backend in this build). */
  previewUrl: string;
  capturedAt: string;
}

export interface TicketEvent {
  id: string;
  at: string;
  kind: 'filed' | 'on_the_way' | 'triaged' | 'retriaged' | 'reply' | 'info' | 'assigned' | 'reassigned' | 'started' | 'visit_done' | 'resolved' | 'reopened' | 'withdrawn' | 'claim_decided' | 'internal_note' | 'urgency_changed';
  /** What the customer may read. An internal event (Admin's own notes, the evidence review) never reaches them. */
  audience: 'customer' | 'internal';
  byRole: 'customer' | 'admin' | 'technician' | 'system';
  byName: string;
  note?: string;
  params?: Record<string, string>;
}

export interface TicketVisit {
  technicianId: string;
  technicianName: string;
  date: string;
  window: 'morning' | 'afternoon';
  status: 'planned' | 'in_progress' | 'done' | 'missed';
  assignedAt: string;
  assignedByName: string;
  /** The technician said they are on the way (the customer sees it on the day), with where they were. */
  onTheWayAt?: string;
  onTheWayLocation?: GeoPoint;
  startedAt?: string;
  doneAt?: string;
  outcome?: VisitOutcome;
  notes?: string;
  partsNote?: string;
}

export interface ServiceTicket {
  id: string;
  /** `AIEC-TK-####`. */
  code: string;
  customerId: string;
  dealId: string;
  /** The lift this is about: a handed-over job, or none for a billing or general question. */
  jobId: string | null;
  siteName: string;
  address: string;
  contactName: string;
  contactPhone: string;
  category: TicketCategory;
  urgency: TicketUrgency;
  route: TicketRoute;
  impact: TicketImpact | null;
  summary: string;
  description: string;
  attachments: TicketAttachment[];
  location?: GeoPoint;
  /** The customer thinks this should be covered. `review` is whether responsibility is unclear enough that Admin must investigate; `decision` is Admin's documented answer. */
  claim: { raised: boolean; review: boolean; decision?: { responsibility: TicketResponsibility; note: string; byName: string; at: string; reviewedEvidence: boolean } };
  triage: { confidence: 'confident' | 'needs_human'; reason: 'vague' | 'safety_words' | 'general' | 'claim' | null; words: string[]; human?: { byName: string; at: string; note?: string } };
  /** Frozen when filed: what cover the lift had that day. */
  coverage: TicketCoverage;
  status: TicketStatus;
  /** When AIEC aims to have answered by (a placeholder target for the category and urgency; the customer is told it upfront). */
  responseDueAt: string;
  firstResponseAt?: string;
  visit?: TicketVisit;
  /** A maintenance booking made by the customer themself (178): routine or a non-urgent call-out, free under their service plan or chargeable. */
  booking?: { purpose: 'routine' | 'adhoc'; chargeable: boolean; estimatedPrice: number | null; status: 'confirmed' | 'pending' };
  resolution?: { note: string; byName: string; at: string; outcome?: VisitOutcome };
  reopenedCount: number;
  /** Idempotence for a request sent twice from a phone with poor signal. */
  clientId: string;
  createdAt: string;
  updatedAt: string;
  /** When the customer last looked at it, so "new reply" can be said. */
  customerSeenAt?: string;
  events: TicketEvent[];
  isDemo: boolean;
}


/* ------------------------------------------------------------------ Support chat (176) */

export type SupportHandoffReason = 'requested' | 'low_confidence' | 'borderline' | 'safety' | 'needs_person';
/** What a person picking up a support conversation needs to know, so the customer never has to explain it again: read from the records, and frozen as it stood when the assistant handed over. */
export interface SupportContext {
  customerName: string;
  phone: string;
  language: string;
  projects: { dealId: string; siteName: string; code: string; stage: string | null; mode: 'starting' | 'project' | 'service'; percent: number | null; payment: { kind: string; amount: number; dueAt: string | null } }[];
  tickets: { id: string; code: string; status: string; urgency: string; summary: string }[];
  coverage: { siteName: string; state: string; endsOn: string | null }[];
  documents: number;
  lastIntent: string | null;
}
export interface SupportChatMeta {
  customerId: string;
  /** An open request for a person: set when the assistant hands over, cleared once a person has replied. */
  handoff?: { at: string; reason: SupportHandoffReason; intent: string; snapshot: SupportContext; urgent: boolean };
  /** A person handed it back to the assistant at this time. */
  botResumedAt?: string;
  lastIntent?: string;
}


/* ------------------------------------------------------------------ Customer feedback (177) */

export type FeedbackMoment = 'handover' | 'ongoing' | 'visit';
export type FeedbackDimension = 'installation' | 'service' | 'communication' | 'timeliness' | 'value';
/** One customer's feedback at one moment: an overall score, the specific dimensions they chose to rate (never blended away), their own words, and who it is about. */
export interface CustomerFeedback {
  id: string;
  /** `AIEC-FB-####`. */
  code: string;
  customerId: string;
  dealId: string;
  jobId: string | null;
  ticketId: string | null;
  moment: FeedbackMoment;
  siteName: string;
  overall: number;
  dimensions: Partial<Record<FeedbackDimension, number>>;
  comment: string;
  /** The technicians the rating counts toward (the job's team, or the one who made a visit). */
  rated: string[];
  /** Staff named in the comment: a person confirms, this only points. */
  mentioned: string[];
  supplierId?: string;
  flags: ('negative' | 'weak_dimension' | 'staff_concern')[];
  weak: FeedbackDimension[];
  sentiment: 'positive' | 'neutral' | 'negative';
  outreach?: { byName: string; at: string; note: string };
  clientId: string;
  createdAt: string;
  isDemo: boolean;
}


/* ------------------------------------------------------------------ Referrals (179) */

/** One person a customer referred. It points at the lead it created, or at the lead that already existed (then it is `already_known` and does not count as a new referral). Its status is read from that lead, never stored. */
export interface ReferralRecord {
  id: string;
  /** `AIEC-RF-####`. */
  code: string;
  customerId: string;
  referralCode: string;
  name: string;
  phone: string;
  city: string;
  note: string;
  via: 'link' | 'invite';
  clientId: string;
  createdAt: string;
  leadId: string | null;
  outcome: 'new_lead' | 'already_known';
  /** The lead (or customer) that was already known to AIEC, and since when. */
  knownLeadId?: string;
  knownSince?: string;
  /** The reward entry in the commission ledger, once the referred deal is won. */
  rewardEntryId?: string;
  isDemo: boolean;
}


/* ------------------------------------------------------------------ Notification centre (180) */

/** One customer's choices for the optional kinds of notice (renewal prompts, ideas). Essential notices have none. Channel-level choices (SMS, WhatsApp) are not kept here: they are the compliance record's opt-out events. */
export interface NotificationPrefs {
  userId: string;
  optional: { plan: { sms: boolean; whatsapp: boolean; inApp: boolean }; offers: { sms: boolean; whatsapp: boolean; inApp: boolean } };
  updatedAt: string;
}

/** What a customer has seen. A message is read once its id is here; a commitment notice keeps its own `readAt`. */
export interface NotificationSeen { userId: string; messageId: string; at: string }


/* ------------------------------------------------------------------ Automation dashboard (181) */

/** Append-only: a pause and the resume that ends it are two records, so the history of who stopped what, and why, is never edited. A unit is one step of the heartbeat. */
export interface AutomationPause {
  id: string;
  scope: 'category' | 'unit';
  target: string;
  kind: 'paused' | 'resumed';
  at: string;
  byName: string;
  reason: string;
  /** On a resume: how many runs of what was paused did not happen meanwhile. */
  skippedRuns?: number;
  isDemo: boolean;
}


/* ------------------------------------------------------------------ Custom rules (182) */

export type CustomRuleStatus = 'draft' | 'active' | 'paused' | 'retired';
export interface CustomRuleEvent {
  at: string;
  kind: 'created' | 'edited' | 'simulated' | 'activated' | 'paused' | 'resumed' | 'retired' | 'copied' | 'capped';
  byName: string;
  detail?: string;
}
/** A rule an Admin built in plain language. Never deleted: a retired one keeps its conditions, action and whole history. `armed` is the records it has already acted on while they still match, which is what makes it act once and not every minute. */
export interface CustomRule {
  id: string;
  /** `AIEC-CR-####`. */
  code: string;
  name: string;
  subject: 'lead' | 'payment' | 'job' | 'ticket';
  logic: 'all' | 'any';
  conditions: { field: string; op: 'gte' | 'lte' | 'eq' | 'is' | 'isNot' | 'contains'; value: string }[];
  action: { kind: 'alert' | 'task' | 'message'; severity?: 'low' | 'medium' | 'high'; note?: string; dueInDays?: number; templateGroupId?: string };
  status: CustomRuleStatus;
  version: number;
  createdAt: string;
  createdByName: string;
  updatedAt: string;
  activatedAt?: string;
  retiredAt?: string;
  retiredReason?: string;
  /** The test of exactly this version: what it would have matched, and when. Activation needs `hash` to equal the rule's own. */
  simulated?: { hash: string; at: string; matched: number };
  armed: string[];
  firedTotal: number;
  firings: { at: string; subjectId: string; label: string }[];
  runs: { at: string; matched: number; acted: number }[];
  events: CustomRuleEvent[];
  isDemo: boolean;
}


/* ------------------------------------------------------------------ Internal notifications (183) */

export type InternalUrgency = 'critical' | 'high' | 'routine';
export type InternalChannel = 'inApp' | 'sms' | 'email';
export type InternalChannelSet = Record<InternalChannel, boolean>;
/** What an Admin wrote to replace the standard wording of one notification type in one language. Merge fields look like {{context}}. */
export interface InternalContent { subject: string; body: string }

/** The settings of one kind of staff-facing notification (an alert type, named by its title key). Only what was changed is stored: anything unset follows the urgency it inherits. */
export interface InternalTypeConfig {
  typeId: string;
  /** Null: the urgency follows the severity the alert is raised with. */
  urgency: InternalUrgency | null;
  /** Channels per recipient role. Null: the admin role follows its urgency's defaults and nobody else is told. A role added later is just another key. */
  roles: Record<string, InternalChannelSet> | null;
  enabled: boolean;
  content: Partial<Record<Language, InternalContent>>;
  version: number;
  updatedAt: string;
  updatedByName: string;
  history: { at: string; byName: string; version: number; summary: string }[];
}

/** Which channels each urgency level uses when a type does not say otherwise. */
export interface InternalUrgencyChannels {
  channels: Record<InternalUrgency, InternalChannelSet>;
  version: number;
  updatedAt: string;
  updatedByName: string;
  history: { at: string; byName: string; version: number; summary: string }[];
}

/** One notice sent (or refused) to a person on a channel. The delivery rail is a demo: nothing leaves the app, the record says what would have gone where. */
export interface InternalDelivery {
  id: string;
  typeId: string;
  alertId?: string;
  channel: InternalChannel;
  role: string;
  recipientName: string;
  urgency: InternalUrgency;
  severity: AlertSeverity;
  at: string;
  status: 'sent' | 'rejected';
  problem?: string;
  test: boolean;
  context: string;
  isDemo: boolean;
}

/* ------------------------------------------------------------------ Escalation matrix (184) */

export type EscalationChannel = 'inApp' | 'sms' | 'call';
export type EscalationRailState = 'working' | 'failing' | 'silent';
export interface EscalationChainTier { id: string; targets: string[]; channels: EscalationChannel[]; afterMinutes: number }
export interface EscalationLastResort { repeatEveryMinutes: number; repeats: number }

/** One person who can be reached when the Admin cannot. A backup need not have an app account: a phone number is enough. `rail` is the demo gateway's answer for each channel. */
export interface EscalationContact {
  name: string;
  phone: string;
  userId?: string;
  note?: string;
  rail: { sms: EscalationRailState; call: EscalationRailState };
}
/** What Admin changed for one scenario. Anything unset follows the defaults. */
export interface EscalationScenarioConfig {
  id: string;
  enabled: boolean;
  trigger: 'unacknowledged' | 'unresolved';
  tiers: EscalationChainTier[];
  lastResort: EscalationLastResort;
  /** Kept when a vital chain deliberately reaches only the Admin. */
  singlePointNote?: string;
  version: number;
  updatedAt: string;
  updatedByName: string;
  history: { at: string; byName: string; version: number; summary: string }[];
}
/** One real alert being walked up its chain. The chain is frozen at the start, so changing a scenario never rewrites an escalation already under way. */
export interface EscalationRun {
  id: string;
  alertId: string;
  alertCode: string;
  scenarioId: string;
  trigger: 'unacknowledged' | 'unresolved';
  startedAt: string;
  tiers: EscalationChainTier[];
  lastResort: EscalationLastResort;
  firedTiers: number;
  repeatsFired: number;
  status: 'running' | 'stopped' | 'exhausted';
  stoppedBy?: 'acknowledged' | 'resolved';
  stoppedAt?: string;
  exhaustedAlertId?: string;
}
export interface EscalationDelivery {
  id: string;
  runId: string;
  alertId: string;
  tierIndex: number;
  /** 0 for the tier itself, 1.. for each repeat of the last tier. */
  repeat: number;
  target: string;
  name: string;
  channel: EscalationChannel;
  at: string;
  status: 'sent' | 'failed' | 'skipped';
  reason?: 'unfilled' | 'no_phone' | 'no_account' | 'gateway_refused';
}
export interface EscalationDrillStep {
  id: string;
  tierIndex: number;
  target: string;
  name: string;
  channel: EscalationChannel;
  status: 'pending' | 'confirmed' | 'failed' | 'no_response' | 'unfilled' | 'no_phone' | 'no_account';
  sentAt: string;
  confirmedAt?: string;
  confirmedBy?: 'gateway' | 'admin';
  /** When the demo rail's answer arrives. */
  answerAt: string;
  answer: 'confirms' | 'fails' | 'silent';
}
export interface EscalationDrill {
  id: string;
  code: string;
  scenarioId: string;
  startedAt: string;
  byName: string;
  tiers: EscalationChainTier[];
  steps: EscalationDrillStep[];
  status: 'running' | 'passed' | 'gaps';
  finishedAt?: string;
  gapAlertId?: string;
  accepted?: { at: string; byName: string; note: string };
}

/* ------------------------------------------------------------------ System health (186) */

export type IntegrationProviderStatus = 'operational' | 'degraded' | 'down' | 'unknown';
/** What Admin has recorded of an integration: its status page, what the provider says, and (demo only) how the stand-in gateway answers AIEC's own checks. */
export interface IntegrationConfig {
  id: string;
  statusPage: string | null;
  reported: { status: IntegrationProviderStatus; at: string | null; byName: string | null; note?: string };
  demo: 'working' | 'degraded' | 'failing';
}
export interface IntegrationProbe { id: string; integrationId: string; at: string; ok: boolean }
export interface IntegrationIncident {
  id: string;
  code: string;
  integrationId: string;
  startedAt: string;
  endedAt?: string;
  status: 'open' | 'recovered';
  cause: 'third_party' | 'ours' | 'unknown';
  peakStatus: 'degraded' | 'down';
  peakRate: number | null;
  /** False when it was already failing the first time AIEC looked, so its start was not seen. */
  onsetKnown: boolean;
  /** Work the outage left behind (messages that did not go, payouts that failed): counted when it recovered, closed only by a person. */
  followUp?: { kind: 'messages' | 'payouts' | 'statements'; count: number; route: string | null; done?: { at: string; byName: string; note: string } };
  alertId?: string;
}

/* ------------------------------------------------------------------ Manual overrides (188) */

/** One time Admin forced something a rule would not, or tried to force something nothing may override. Append-only. */
export interface ManualOverride {
  id: string;
  /** `AIEC-MO-####`. */
  code: string;
  kind: string;
  targetId: string;
  targetLabel: string;
  reason: string;
  byId: string;
  byName: string;
  at: string;
  status: 'applied' | 'refused';
  /** Why a refused one was refused. */
  refusal?: string;
  /** The value before and after, as plain tokens the screen can translate. */
  before: string;
  after: string;
  /** What the preview said would follow, kept as it read when Admin confirmed. */
  effects: { key: string; params?: Record<string, string | number> }[];
  /** The place in the audit log this override was written to. */
  auditSeq: number | null;
}

/* ------------------------------------------------------------------ Integration management (189) */

export interface IntegrationCredentialView {
  keyId: string;
  /** Only the end of the secret, with the rest hidden: a stored secret is never sent to the screen. */
  masked: string;
  length: number;
  createdAt: string;
  rotatedAt: string;
  rotatedByName: string;
  /** Set while a new credential is being picked up: both the old and the new are accepted until `endsAt`. */
  rotation: { startedAt: string; endsAt: string; previousMasked: string; byName: string } | null;
}
export interface IntegrationSetup {
  id: string;
  mode: 'sandbox' | 'live';
  /** Providers issue separate keys for testing and for real use: each is kept apart, and demo traffic can only ever read the sandbox one. */
  slots: { sandbox: IntegrationCredentialView | null; live: IntegrationCredentialView | null };
}
export interface IntegrationChange {
  id: string;
  integrationId: string;
  at: string;
  byName: string;
  kind: 'mode' | 'rotation' | 'rotation_completed' | 'rotation_cancelled' | 'credential_added' | 'environment';
  summary: string;
  reason?: string;
}

/* ------------------------------------------------------------------ Automation sandbox (190) */

export type SandboxValue = string | number | boolean;
export interface SandboxScenario {
  id: string;
  engine: string;
  builtIn: boolean;
  /** Built-ins are named by a translation key; one an Admin added has its own words. */
  name: string;
  facts: Record<string, SandboxValue>;
  reviewedAt: string;
  reviewedByName: string;
  createdByName: string;
}
/** One scenario run through one rule. Nothing here is ever applied to real data. */
export interface SandboxRun {
  id: string;
  /** `AIEC-TR-####`. */
  code: string;
  engine: string;
  ruleRef: string;
  ruleLabel: string;
  scenarioId: string;
  scenarioName: string;
  facts: Record<string, SandboxValue>;
  /** What was expected: declared by hand, or the baseline last accepted for this scenario; null when there is no baseline yet. */
  expected: Record<string, SandboxValue> | null;
  expectedFrom: 'declared' | 'baseline' | 'none';
  actual: Record<string, SandboxValue>;
  comparisons: { field: string; expected: SandboxValue | null; actual: SandboxValue; match: boolean }[];
  status: 'matched' | 'differs' | 'new';
  /** The rule's definition when it was tested: a later change makes the test stale. */
  ruleHash: string;
  at: string;
  byName: string;
  /** Real records the run created or changed: always zero, and checked, not assumed. */
  sideEffects: number;
  baselineAccepted?: boolean;
}
export interface SandboxBaseline {
  key: string;
  engine: string;
  ruleRef: string;
  scenarioId: string;
  outcome: Record<string, SandboxValue>;
  ruleHash: string;
  acceptedAt: string;
  byName: string;
  note?: string;
}

/* ------------------------------------------------------------------ Company profile & branding (191) */

export interface CompanyProfileChange { field: string; group: 'identity' | 'legal' | 'theme'; from: string; to: string }
/**
 * One version of AIEC's identity, legal details and look. Append-only: a change is a new version that applies from `effectiveFrom` onward, never an edit, so anything issued
 * under an earlier version (an invoice, a quotation, a contract) is read back against the version in force on the day it was issued.
 */
export interface CompanyProfileVersion {
  id: string;
  version: number;
  effectiveFrom: string;
  createdAt: string;
  createdByName: string;
  /** Why: kept with the version. */
  reason: string;
  kind: 'initial' | 'cosmetic' | 'legal';
  changes: CompanyProfileChange[];
  companyName: string;
  nameHi: string;
  nameMr: string;
  ownerName: string;
  logo: { dataUrl: string; fileName: string; sizeBytes: number } | null;
  gstin: string;
  address: { line1: string; city: string; state: string; pincode: string };
  tokens: { accentPrimary: string; accentSecondary: string; headingFont: 'fraunces' | 'martel' | 'jakarta' };
  /** Called off before it took effect: kept, never deleted. */
  cancelled?: { at: string; byName: string; reason: string };
  /** A legal change is checked after it takes effect: the first documents, the GST portal, the accountant. */
  announcedAt?: string;
  legal?: { confirmedAt?: string; confirmedByName?: string; note?: string; stateFrom?: string; stateTo?: string };
}

/* ------------------------------------------------------------------ User & role permissions (192) */

/** A role an Admin adds as the business grows (a QC inspector, a team lead): it behaves like one of the built-in kinds for its home and tab bar, and adds the screens it is granted. */
export interface CustomRole {
  id: string;
  name: string;
  nameHi: string;
  nameMr: string;
  baseRole: Role;
  description: string;
  createdAt: string;
  createdByName: string;
  retired?: { at: string; byName: string; reason: string };
}
/** One person's own exception to their role: always with a reason, and by default an end. Kept after it ends. */
export interface UserAccessOverride {
  id: string;
  userId: string;
  screenId: string;
  effect: 'allow' | 'deny';
  reason: string;
  until: string | null;
  createdAt: string;
  createdByName: string;
  reviewedAt?: string | null;
  reviewedByName?: string;
  reviewNote?: string;
  endedAt?: string;
  endedReason?: 'removed' | 'expired';
  endedByName?: string;
}
export type PermissionChangeKind = 'role_grant' | 'role_revoke' | 'role_reset' | 'role_created' | 'role_retired' | 'role_assigned' | 'role_unassigned' | 'override_set' | 'override_removed' | 'override_expired' | 'override_reviewed' | 'refused';
/** The audit trail: who changed what for whom, why, and how much it mattered. Append-only and frozen. */
export interface PermissionChange {
  id: string;
  code: string;
  seq: number;
  at: string;
  byName: string;
  kind: PermissionChangeKind;
  roleId?: string;
  roleLabel?: string;
  userId?: string;
  userName?: string;
  screenIds: string[];
  reason: string;
  risk: 'low' | 'medium' | 'high';
  /** For a refused attempt: why. */
  refusal?: string;
}

/* ------------------------------------------------------------------ Single-person monitor (193) */

export interface MonitorConfig { adminId: string; signalIds: string[]; preset: string | null; checkTime: string; checkDays: number[]; updatedAt: string }
/** A morning check that was made: what the panel showed, and whether it was "all fine" or "with concerns". Append-only. */
export interface MonitorCheck {
  id: string;
  code: string;
  adminId: string;
  adminName: string;
  at: string;
  kind: 'all_fine' | 'with_concerns';
  note: string;
  panel: string[];
  values: Record<string, number | null>;
  statuses: Record<string, 'ok' | 'watch' | 'act'>;
  actIds: string[];
  /** Signals outside the Admin's own set that needed action at the time. */
  outsideActIds: string[];
  hash: string;
}
/** Something the Admin knows that no number shows: kept, looked at again on a day, and closed with a word. */
export interface MonitorConcern { id: string; adminId: string; note: string; createdAt: string; reviewAt: string; resolvedAt?: string; resolution?: string }
/** The Admin is away: a chosen backup may look at a limited, read-only panel until the day they are back. The access itself is one of 192's time-limited exceptions. */
export interface MonitorAbsence { id: string; adminId: string; from: string; until: string; backupUserId: string; backupName: string; reason: string; overrideId: string; endedAt?: string; endedReason?: string }

/* ------------------------------------------------------------------ Data privacy & consent (194) */

export interface ConsentRecord { id: string; phone10: string; purpose: 'sms' | 'whatsapp' | 'recruitment_contact' | 'location_tracking'; status: 'granted' | 'withdrawn'; source: 'request' | 'admin' | 'onboarding'; at: string; byName: string; note: string; requestId?: string }
export interface PrivacyPlanRow { category: string; count: number; action: 'erase' | 'anonymise' | 'retain'; reason: string; until: string | null; executable: boolean }
export interface DataRequestEvent { id: string; at: string; byName: string; kind: 'received' | 'identity_verified' | 'plan_reviewed' | 'fulfilled' | 'refused' | 'withdrawn' | 'note'; note: string }
/** A person asking about their own data. Nothing is dropped: it is answered, partly answered with the reasons, or refused with one. */
export interface DataRequest {
  id: string;
  code: string;
  /** The last ten digits of the person's phone: one person, however many roles they have held. */
  subjectId: string;
  subjectName: string;
  subjectKinds: string[];
  type: 'access' | 'correction' | 'deletion' | 'consent_withdrawal';
  channel: 'phone' | 'email' | 'whatsapp' | 'in_person' | 'in_app' | 'letter';
  receivedAt: string;
  receivedByName: string;
  note: string;
  purpose?: 'sms' | 'whatsapp' | 'recruitment_contact' | 'location_tracking';
  status: 'received' | 'in_progress' | 'completed' | 'partially_completed' | 'refused' | 'withdrawn';
  verified?: { method: 'call_back' | 'otp' | 'in_person' | 'id_document'; note: string; at: string; byName: string };
  dueAt: string;
  closedAt?: string;
  plan?: { rows: PrivacyPlanRow[]; at: string };
  result?: { erased: { category: string; count: number }[]; retained: { category: string; count: number; reason: string; until: string | null }[]; accessCategories?: Record<string, number>; correctionNote?: string };
  response?: { via: string; note: string; at: string; byName: string };
  refusal?: string;
  events: DataRequestEvent[];
}
export interface RetentionPolicyVersion { id: string; version: number; effectiveFrom: string; createdAt: string; byName: string; reason: string; rules: Record<string, { days: number | null; action: 'erase' | 'anonymise' | 'review' | 'retain' }>; appliedToExisting: boolean }
export interface RetentionRun { id: string; code: string; at: string; policyVersion: number; actions: { category: string; action: string; count: number }[]; remaining: number; capped: boolean }
export interface PrivacyPolicyVersion { id: string; version: number; effectiveFrom: string; createdAt: string; byName: string; summary: string; material: boolean; text: { en: string; hi: string; mr: string }; noticeAt?: string; noticeBy?: string; noticeHow?: string; noticeNote?: string }


/* ------------------------------------------------------------------ Security & session management (195) */

export interface AuthSession {
  id: string;
  userId: string;
  role: Role;
  deviceLabel: string;
  platform: string;
  /** Masked. The browser cannot know its own address: a real backend records it on the server. Null where none was recorded. */
  ipMasked: string | null;
  city: string | null;
  openedAt: string;
  lastActiveAt: string;
  status: 'active' | 'revoked' | 'expired' | 'signed_out';
  endedAt?: string;
  /** A person's name, or "system" for an automatic end. */
  endedBy?: string;
  endReason?: string;
  secondFactorAt?: string;
  place: 'unknown' | 'usual' | 'new' | 'confirmed' | 'denied';
  placeBy?: string;
  placeNote?: string;
  placeAt?: string;
  /** Made by the demo "simulate a sign-in" control, not by a real sign-in. */
  simulated?: boolean;
}
export interface SecurityEvent {
  id: string;
  at: string;
  kind: string;
  severity: 'info' | 'notice' | 'warning' | 'critical';
  userId: string | null;
  userName: string;
  role?: Role;
  phoneMasked: string | null;
  sessionId?: string;
  deviceLabel?: string;
  ipMasked?: string | null;
  city?: string | null;
  /** Words an Admin wrote (a reason, a note), shown as written. */
  detail?: string;
  byName?: string;
  /** Needs an Admin's attention until someone has dealt with it. */
  flagged?: boolean;
  resolved?: { at: string; byName: string; note: string };
}
export interface TwoFactorEnrolment { userId: string; method: 'authenticator' | 'second_phone'; enrolledAt: string; secondPhoneMasked?: string }
export interface TwoFactorException {
  id: string;
  code: string;
  userId: string;
  userName: string;
  role: Role;
  /** The person's own words (a request) or Admin's reason (a grant). */
  reason: string;
  requestedAt: string;
  requestedBy: string;
  status: 'requested' | 'active' | 'declined' | 'ended' | 'expired';
  decidedAt?: string;
  decidedByName?: string;
  decisionNote?: string;
  until?: string;
  endedAt?: string;
  endNote?: string;
}
export interface AccountLock {
  id: string;
  userId: string;
  reason: 'device_lost' | 'not_me' | 'admin';
  since: string;
  byName: string;
  note: string;
  sessionsEnded: number;
  status: 'locked' | 'cleared';
  clearedAt?: string;
}
export interface AccountRecovery {
  id: string;
  code: string;
  userId: string;
  lockId: string;
  startedAt: string;
  byName: string;
  method: 'call_back_known' | 'in_person' | 'video_call' | 'reference';
  note: string;
  oldPhoneMasked: string;
  newPhoneMasked?: string;
  codeHash: string;
  expiresAt: string;
  tries: number;
  status: 'issued' | 'used' | 'expired' | 'cancelled';
  usedAt?: string;
  cancelNote?: string;
}
export interface SecurityPolicyVersion {
  id: string;
  version: number;
  effectiveFrom: string;
  createdAt: string;
  byName: string;
  reason: string;
  config: SecurityConfig;
  /** When each role's second-factor requirement last came into force (null: not required). */
  twoFactorSince: Record<string, string | null>;
  weakened: string[];
}
export interface TrustedPlace { userId: string; city: string; until: string; byName: string }


/* ------------------------------------------------------------------ Backups & data export (196) */

export interface BackupRun {
  id: string;
  code: string;
  startedAt: string;
  finishedAt: string;
  trigger: 'scheduled' | 'retry' | 'manual';
  /** The scheduled moment this run answers (a retry carries the slot it is retrying). */
  slot?: string;
  attempt: number;
  status: 'success' | 'failed';
  failure?: string;
  /** What the backup held: how many records of each kind, and how large. */
  counts?: Record<string, number>;
  sizeBytes?: number;
  checksum?: string;
  verified?: boolean;
  byName?: string;
}
export interface BackupConfigVersion { id: string; version: number; at: string; byName: string; reason: string; config: BackupConfig; weakened: string[] }
export interface RestoreTest { id: string; at: string; byName: string; runId: string; outcome: 'ok' | 'problems'; note: string }
export interface ExportJob {
  id: string;
  code: string;
  requestedAt: string;
  byName: string;
  datasetId: string;
  from: string | null;
  to: string | null;
  format: 'csv' | 'json';
  purpose: string;
  purposeNote: string;
  columns: string[];
  personalColumns: string[];
  justification?: string;
  status: 'queued' | 'running' | 'ready' | 'failed' | 'cancelled' | 'expired';
  rowCount: number;
  rowsDone: number;
  builtAt?: string;
  sizeBytes?: number;
  checksum?: string;
  fileName?: string;
  expiresAt?: string;
  downloadedAt?: string;
  downloads: number;
  error?: string;
}


/* ------------------------------------------------------------------ Subscriptions & billing of AIEC's own software (197) */

export interface ServiceSubscription {
  serviceId: string;
  provider: string;
  tierId: string;
  /** A plan change that takes effect at the next renewal. */
  pending?: { tierId: string; at: string };
  autoRenew: boolean;
  renewalDate: string;
  card: { last4: string; expiry: string } | null;
  lastInvoiceStatus: 'paid' | 'failed' | 'pending' | null;
  /** Demo: the provider declines the card on the next attempt. */
  declined?: boolean;
  since: string;
}
export interface BillingInvoice {
  id: string;
  code: string;
  serviceId: string;
  period: string;
  issuedAt: string;
  amount: number;
  tierId: string;
  used: number;
  status: 'paid' | 'failed' | 'pending';
  attempt: number;
  failure?: 'card_declined' | 'card_expired' | 'no_card' | 'manual_due';
  paidAt?: string;
  byName?: string;
}
export interface UsageMonth {
  serviceId: string;
  month: string;
  tierId: string;
  used: number;
  drivers: { key: string; count: number }[];
  note?: { text: string; byName: string; at: string };
}
export interface TierChange { id: string; serviceId: string; from: string; to: string; at: string; byName: string; effective: 'renewal' | 'now'; effectiveAt: string; reason: string; monthlyDelta: number; accepted: string[] }
export interface PaymentMethodChange { id: string; serviceId: string; at: string; byName: string; from: string | null; to: string }

/* ------------------------------------------------------------------ Legal & contract templates (198) */

export type LegalRevisionKind = 'boilerplate' | 'state_clause';
export type LegalRevisionReason = 'law_change' | 'standard_change' | 'legal_review' | 'correction' | 'new_state' | 'edited_elsewhere';
/**
 * One change to a piece of governed legal wording that the contract and quotation generators read (198).
 * Append-only: a scheduled change is applied by the heartbeat on its day (or cancelled with a reason, never removed), the wording it replaced is kept.
 */
export interface LegalRevision {
  id: string;
  code: string;
  kind: LegalRevisionKind;
  templateId: string;
  state: string | null;
  text: string;
  previousText: string;
  changeNote: string;
  reason: LegalRevisionReason;
  /** The Act, notice or standard behind the change (required for a change in law, a standard or a new state). */
  reference: string;
  effectiveFrom: string;
  status: 'scheduled' | 'applied' | 'cancelled';
  createdAt: string;
  byName: string;
  appliedAt?: string;
  /** The template's own version number once this took effect. */
  version?: number;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
}
export interface LegalReview {
  id: string;
  code: string;
  docKey: string;
  reviewedOn: string;
  reviewer: string;
  firm: string | null;
  outcome: 'clear' | 'issues_found';
  versionReviewed: number;
  note: string;
  nextDueOn: string;
  recordedAt: string;
  recordedBy: string;
  closedAt?: string;
  closedBy?: string;
  closeNote?: string;
}
export interface LegalState {
  state: string;
  cities: string[];
  authority: string;
  addedAt: string;
  addedBy: string;
  note: string;
  events: { at: string; byName: string; kind: 'added' | 'cities_added' | 'authority_changed'; note: string }[];
}

/* ------------------------------------------------------------------ Help, FAQ & support (199) */

export interface HelpText { en: string; hi?: string; mr?: string }
export interface HelpArticleVersion { version: number; title: HelpText; body: HelpText; changeNote: string; byName: string; at: string }
/**
 * One self-service help article (199). Role-tagged by free strings (a built-in role, a custom role's id, or `all`) so a role added later needs no change here;
 * the text is versioned and never edited in place, and the article is looked at again on its own rhythm and whenever people say it is wrong.
 */
export interface HelpArticle {
  id: string;
  code: string;
  category: string;
  roles: string[];
  relatedRoutes: string[];
  status: 'published' | 'draft' | 'retired';
  versions: HelpArticleVersion[];
  reviewedAt: string;
  reviewedBy: string;
  reviewNote: string;
  createdAt: string;
  retiredNote?: string;
}
export type HelpReason = 'wrong' | 'outdated' | 'unclear' | 'missing_steps' | 'other';
export interface HelpFeedback { id: string; articleId: string; version: number; userId: string; role: string; helpful: boolean; reason?: HelpReason; comment?: string; at: string }
export interface HelpSuggestion { id: string; code: string; text: string; searchedFor: string; role: string; userId: string; at: string; status: 'new' | 'planned' | 'done' | 'declined'; note?: string; articleId?: string; handledBy?: string; handledAt?: string }
/** A search that found nothing, kept without who searched: the content gaps people actually hit. */
export interface HelpSearchMiss { key: string; sample: string; count: number; roles: Record<string, number>; firstAt: string; lastAt: string; handled?: { byName: string; at: string; note: string } }
export interface HelpEscalation { id: string; articleId: string | null; role: string; kind: 'chat' | 'ticket' | 'call' | 'messages' | 'safety'; at: string }

/* ------------------------------------------------------------------ App version, changelog & product feedback (200) */

export type ReleaseItemKind = 'workflow' | 'new' | 'improved' | 'fixed';
export interface ReleaseItem { id: string; kind: ReleaseItemKind; text: HelpText; roles: string[]; route?: string }
export interface BrowserRequirement { chrome?: number; edge?: number; firefox?: number; safari?: number }
/** One published version of the app, written in plain words for the people who use it; a change to how someone works is marked as such. */
export interface AppRelease { id: string; version: string; releasedAt: string; byName: string; items: ReleaseItem[]; requires: BrowserRequirement; note?: HelpText }
/** What version and device a person last reported, so Admin can see who is behind. */
export interface AppVersionReport { userId: string; role: string; version: string; device: 'phone' | 'tablet' | 'desktop'; browser: string; major: number | null; compatible: boolean | null; at: string }
export type FeedbackKind = 'idea' | 'problem' | 'praise';
export type FeedbackStatus = 'new' | 'planned' | 'done' | 'declined' | 'duplicate';
/** A general idea or problem about the app itself, from any role. Others only ever see what Admin chose to publish about it, never the words as written. */
export interface ProductFeedback {
  id: string;
  code: string;
  kind: FeedbackKind;
  text: string;
  area: string;
  role: string;
  userId: string;
  at: string;
  version: string;
  status: FeedbackStatus;
  note?: string;
  /** What Admin chose to show other people. */
  published?: { title: string; note: string };
  /** The earlier, similar suggestion this one was grouped under. */
  clusterOf?: string;
  duplicateOf?: string;
  /** People who said "me too" on a published item. */
  votes: string[];
  handledBy?: string;
  handledAt?: string;
}

/* ============================== S1: signing in through the server */

/** A person as the server (Supabase `profiles`) knows them. The server decides role and status; the app never does. */
export type ServerProfileStatus = 'pending' | 'active' | 'suspended' | 'rejected';

export interface ServerProfile {
  id: string;
  phone: string;
  name: string;
  role: Role | null;
  status: ServerProfileStatus;
  isDemo: boolean;
  preferredLanguage: Language;
  requestedRole: Role | null;
}

/** Someone who signed in with a phone AIEC did not know, waiting for Admin to give them a role (004). */
export interface SignInRequest {
  id: string;
  phone: string;
  name: string;
  requestedRole: Role | null;
  waitingSince: string;
}
