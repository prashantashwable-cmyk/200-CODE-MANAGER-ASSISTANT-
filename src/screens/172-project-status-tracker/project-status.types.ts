import type { InstallSopPhase } from '@/data/types';

export const POLL_MS = 30_000;
export const RECENT = 4;
export const PHASE_IDS: InstallSopPhase[] = ['preparation', 'rails', 'machine', 'car', 'wiring', 'safety', 'final'];
export const viewKey = (userId: string, project: string) => `aiec.projectStatus.${userId}.${project || 'first'}`;
export const homePath = '/customer';
export const paymentsPath = (dealId?: string | null) => (dealId ? `/my-payments?p=${dealId}` : '/my-payments');
export const checkoutPath = (paymentId: string) => `/customer/payments/${paymentId}/checkout`;
export const captionKey = (slot: string) => `projectStatus.highlights.caption.${slot.replace('.', '_')}`;

export const STATUS_KEYS = {
  title: 'projectStatus.title',
  subtitle: 'projectStatus.subtitle',
  loading: 'projectStatus.loading',
  error: {
    title: 'projectStatus.error.title',
    body: 'projectStatus.error.body',
  },
  refresh: 'projectStatus.refresh',
  close: 'projectStatus.close',
  back: 'projectStatus.back',
  empty: {
    title: 'projectStatus.empty.title',
    body: 'projectStatus.empty.body',
  },
  section: {
    where: 'projectStatus.section.where',
    next: 'projectStatus.section.next',
    phases: 'projectStatus.section.phases',
    highlights: 'projectStatus.section.highlights',
    history: 'projectStatus.section.history',
    documents: 'projectStatus.section.documents',
  },
  where: {
    service: 'projectStatus.where.service',
  },
  next: {
    none: 'projectStatus.next.none',
    estimate: 'projectStatus.next.estimate',
    booked: 'projectStatus.next.booked',
    firstPlanned: 'projectStatus.next.firstPlanned',
    stage: {
      materials: 'projectStatus.next.stage.materials',
      installation: 'projectStatus.next.stage.installation',
      quality: 'projectStatus.next.stage.quality',
      handover: 'projectStatus.next.stage.handover',
      agreed: 'projectStatus.next.stage.agreed',
      contract: 'projectStatus.next.stage.contract',
    },
  },
  later: 'projectStatus.later',
  paused: {
    payment: 'projectStatus.paused.payment',
    issue: 'projectStatus.paused.issue',
    payNow: 'projectStatus.paused.payNow',
    payments: 'projectStatus.paused.payments',
  },
  concern: {
    delay: 'projectStatus.concern.delay',
    payment_disputed: 'projectStatus.concern.payment_disputed',
  },
  hidden: 'projectStatus.hidden',
  early: {
    heading: 'projectStatus.early.heading',
    body: 'projectStatus.early.body',
  },
  phase: {
    status: {
      done: 'projectStatus.phase.status.done',
      current: 'projectStatus.phase.status.current',
      upcoming: 'projectStatus.phase.status.upcoming',
    },
    expected: 'projectStatus.phase.expected',
    slip: 'projectStatus.phase.slip',
    photos: 'projectStatus.phase.photos',
    paused: 'projectStatus.phase.paused',
    steps: 'projectStatus.phase.steps',
  },
  detail: {
    more: 'projectStatus.detail.more',
    less: 'projectStatus.detail.less',
    stepDone: 'projectStatus.detail.stepDone',
    stepOpen: 'projectStatus.detail.stepOpen',
  },
  highlights: {
    note: 'projectStatus.highlights.note',
    empty: 'projectStatus.highlights.empty',
    caption: {
      s3_alignment: 'projectStatus.highlights.caption.s3_alignment',
      s4_mount: 'projectStatus.highlights.caption.s4_mount',
      s5_frame: 'projectStatus.highlights.caption.s5_frame',
      s10_final: 'projectStatus.highlights.caption.s10_final',
    },
    taken: 'projectStatus.highlights.taken',
  },
  history: {
    empty: 'projectStatus.history.empty',
    more: 'projectStatus.history.more',
    less: 'projectStatus.history.less',
  },
  milestone: {
    order_confirmed: 'projectStatus.milestone.order_confirmed',
    quotation_accepted: 'projectStatus.milestone.quotation_accepted',
    agreement_signed: 'projectStatus.milestone.agreement_signed',
    first_payment: 'projectStatus.milestone.first_payment',
    parts_delivered: 'projectStatus.milestone.parts_delivered',
    installation_started: 'projectStatus.milestone.installation_started',
    phase_done: 'projectStatus.milestone.phase_done',
    quality_checked: 'projectStatus.milestone.quality_checked',
    handover: 'projectStatus.milestone.handover',
    warranty_registered: 'projectStatus.milestone.warranty_registered',
  },
  documents: {
    empty: 'projectStatus.documents.empty',
    quotation: 'projectStatus.documents.quotation',
    agreement: 'projectStatus.documents.agreement',
    delivery: 'projectStatus.documents.delivery',
    certificate: 'projectStatus.documents.certificate',
    warranty: 'projectStatus.documents.warranty',
    open: 'projectStatus.documents.open',
    dated: 'projectStatus.documents.dated',
  },
} as const;
