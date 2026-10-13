/** Screen 098 — Supplier Contract & SLA. Types and translation keys only. */

export type SupplierAgreementScreenStatus = 'loading' | 'ready' | 'error' | 'pick' | 'not_found';

export type AgreementTab = 'orders' | 'history';
export const AGREEMENT_TABS: AgreementTab[] = ['orders', 'history'];

/** The editable terms, as the form holds them (strings until saved). */
export interface TermsDraft {
  deliverySlaDays: string;
  paymentTermsDays: string;
  minQualityScore: string;
  warrantyMonths: string;
  qualityStandards: string;
}

export const SUPPLIER_AGREEMENT_KEYS = {
  title: 'supplierAgreement.title',
  subtitleAdmin: 'supplierAgreement.subtitleAdmin',
  subtitleSupplier: 'supplierAgreement.subtitleSupplier',
  loading: 'supplierAgreement.loading',
  error: { title: 'supplierAgreement.error.title', body: 'supplierAgreement.error.body' },
  notFound: { title: 'supplierAgreement.notFound.title', body: 'supplierAgreement.notFound.body' },
  pick: {
    heading: 'supplierAgreement.pick.heading',
    summary: 'supplierAgreement.pick.summary',
    inFlight: 'supplierAgreement.pick.inFlight',
    awaitingAck: 'supplierAgreement.pick.awaitingAck',
  },
  status: {
    none: 'supplierAgreement.status.none',
    active: 'supplierAgreement.status.active',
    expiring: 'supplierAgreement.status.expiring',
    lapsed: 'supplierAgreement.status.lapsed',
  },
  hero: {
    version: 'supplierAgreement.hero.version',
    expires: 'supplierAgreement.hero.expires',
    expiredOn: 'supplierAgreement.hero.expiredOn',
    daysLeft: 'supplierAgreement.hero.daysLeft',
    document: 'supplierAgreement.hero.document',
    none: 'supplierAgreement.hero.none',
    lapsed: 'supplierAgreement.hero.lapsed',
    expiring: 'supplierAgreement.hero.expiring',
    renewed: 'supplierAgreement.hero.renewed',
    upcoming: 'supplierAgreement.hero.upcoming',
  },
  terms: {
    heading: 'supplierAgreement.terms.heading',
    sla: 'supplierAgreement.terms.sla',
    slaValue: 'supplierAgreement.terms.slaValue',
    slaUse: 'supplierAgreement.terms.slaUse',
    payment: 'supplierAgreement.terms.payment',
    paymentValue: 'supplierAgreement.terms.paymentValue',
    paymentUse: 'supplierAgreement.terms.paymentUse',
    quality: 'supplierAgreement.terms.quality',
    qualityValue: 'supplierAgreement.terms.qualityValue',
    qualityBelow: 'supplierAgreement.terms.qualityBelow',
    qualityMet: 'supplierAgreement.terms.qualityMet',
    qualityUnrated: 'supplierAgreement.terms.qualityUnrated',
    warrantyValue: 'supplierAgreement.terms.warrantyValue',
    viewScorecard: 'supplierAgreement.terms.viewScorecard',
  },
  liability: {
    heading: 'supplierAgreement.liability.heading',
    clause: 'supplierAgreement.liability.clause',
  },
  tab: {
    orders: 'supplierAgreement.tab.orders',
    history: 'supplierAgreement.tab.history',
  },
  orders: {
    empty: 'supplierAgreement.orders.empty',
    emptyBody: 'supplierAgreement.orders.emptyBody',
    underVersion: 'supplierAgreement.orders.underVersion',
    noSnapshot: 'supplierAgreement.orders.noSnapshot',
    priorTerms: 'supplierAgreement.orders.priorTerms',
    promised: 'supplierAgreement.orders.promised',
    paymentDue: 'supplierAgreement.orders.paymentDue',
    paymentOnDelivery: 'supplierAgreement.orders.paymentOnDelivery',
    lapsedNote: 'supplierAgreement.orders.lapsedNote',
  },
  history: {
    empty: 'supplierAgreement.history.empty',
    kind: {
      initial: 'supplierAgreement.history.kind.initial',
      amendment: 'supplierAgreement.history.kind.amendment',
      renewal: 'supplierAgreement.history.kind.renewal',
    },
    step: 'supplierAgreement.history.step',
    effective: 'supplierAgreement.history.effective',
    recorded: 'supplierAgreement.history.recorded',
    acknowledged: 'supplierAgreement.history.acknowledged',
    awaitingAck: 'supplierAgreement.history.awaitingAck',
    current: 'supplierAgreement.history.current',
    upcoming: 'supplierAgreement.history.upcoming',
  },
  termName: {
    deliverySlaDays: 'supplierAgreement.termName.deliverySlaDays',
    paymentTermsDays: 'supplierAgreement.termName.paymentTermsDays',
    minQualityScore: 'supplierAgreement.termName.minQualityScore',
    warrantyMonths: 'supplierAgreement.termName.warrantyMonths',
    qualityStandards: 'supplierAgreement.termName.qualityStandards',
  },
  action: {
    recordInitial: 'supplierAgreement.action.recordInitial',
    recordAmendment: 'supplierAgreement.action.recordAmendment',
    recordRenewal: 'supplierAgreement.action.recordRenewal',
    acknowledge: 'supplierAgreement.action.acknowledge',
    acknowledgeHint: 'supplierAgreement.action.acknowledgeHint',
  },
  form: {
    titleInitial: 'supplierAgreement.form.titleInitial',
    titleAmendment: 'supplierAgreement.form.titleAmendment',
    titleRenewal: 'supplierAgreement.form.titleRenewal',
    effectiveFrom: 'supplierAgreement.form.effectiveFrom',
    effectiveHint: 'supplierAgreement.form.effectiveHint',
    expiresOn: 'supplierAgreement.form.expiresOn',
    slaDays: 'supplierAgreement.form.slaDays',
    paymentDays: 'supplierAgreement.form.paymentDays',
    minQuality: 'supplierAgreement.form.minQuality',
    warrantyMonths: 'supplierAgreement.form.warrantyMonths',
    standards: 'supplierAgreement.form.standards',
    reason: 'supplierAgreement.form.reason',
    reasonHint: 'supplierAgreement.form.reasonHint',
    document: 'supplierAgreement.form.document',
    documentHint: 'supplierAgreement.form.documentHint',
    passThrough: 'supplierAgreement.form.passThrough',
    changes: 'supplierAgreement.form.changes',
    change: 'supplierAgreement.form.change',
    noChanges: 'supplierAgreement.form.noChanges',
    inFlightNote: 'supplierAgreement.form.inFlightNote',
    save: 'supplierAgreement.form.save',
    issue: {
      sla_range: 'supplierAgreement.form.issue.sla_range',
      payment_range: 'supplierAgreement.form.issue.payment_range',
      quality_range: 'supplierAgreement.form.issue.quality_range',
      warranty_range: 'supplierAgreement.form.issue.warranty_range',
      standards_required: 'supplierAgreement.form.issue.standards_required',
      expiry_before_start: 'supplierAgreement.form.issue.expiry_before_start',
      starts_before_previous: 'supplierAgreement.form.issue.starts_before_previous',
    },
  },
  toast: {
    recorded: 'supplierAgreement.toast.recorded',
    acknowledged: 'supplierAgreement.toast.acknowledged',
    error: 'supplierAgreement.toast.error',
  },
} as const;
