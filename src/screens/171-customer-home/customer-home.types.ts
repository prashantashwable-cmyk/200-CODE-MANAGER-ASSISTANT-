import type { CustomerStageKey } from '@/data/repository';

export const POLL_MS = 30_000;
export const STAGE_ORDER: CustomerStageKey[] = ['agreed', 'contract', 'materials', 'installation', 'quality', 'handover'];
export const viewKey = (userId: string, project: string) => `aiec.customerHome.${userId}.${project || 'first'}`;
export const statusPath = (projectKey: string) => `/project-status?p=${encodeURIComponent(projectKey)}`;
export const paymentsPath = (dealId?: string | null) => (dealId ? `/my-payments?p=${dealId}` : '/my-payments');
export const checkoutPath = (paymentId: string) => `/customer/payments/${paymentId}/checkout`;
export const documentsPath = '/documents';
export const servicePath = (jobId: string) => `/warranty/${jobId}`;

export const HOME_KEYS = {
  title: 'customerHome.title',
  greeting: {
    morning: 'customerHome.greeting.morning',
    afternoon: 'customerHome.greeting.afternoon',
    evening: 'customerHome.greeting.evening',
  },
  loading: 'customerHome.loading',
  error: {
    title: 'customerHome.error.title',
    body: 'customerHome.error.body',
  },
  refresh: 'customerHome.refresh',
  switcher: {
    label: 'customerHome.switcher.label',
    mode: {
      starting: 'customerHome.switcher.mode.starting',
      project: 'customerHome.switcher.mode.project',
      service: 'customerHome.switcher.mode.service',
    },
  },
  unread: 'customerHome.unread',
  unreadHint: 'customerHome.unreadHint',
  hero: {
    starting: 'customerHome.hero.starting',
    stage: {
      agreed: 'customerHome.hero.stage.agreed',
      contract: 'customerHome.hero.stage.contract',
      materials: 'customerHome.hero.stage.materials',
      installation: 'customerHome.hero.stage.installation',
      quality: 'customerHome.hero.stage.quality',
      handover: 'customerHome.hero.stage.handover',
    },
    service: 'customerHome.hero.service',
    paused: 'customerHome.hero.paused',
  },
  stage: {
    agreed: 'customerHome.stage.agreed',
    contract: 'customerHome.stage.contract',
    materials: 'customerHome.stage.materials',
    installation: 'customerHome.stage.installation',
    quality: 'customerHome.stage.quality',
    handover: 'customerHome.stage.handover',
    doneOn: 'customerHome.stage.doneOn',
    now: 'customerHome.stage.now',
  },
  progress: {
    label: 'customerHome.progress.label',
    value: 'customerHome.progress.value',
    hidden: 'customerHome.progress.hidden',
  },
  expected: 'customerHome.expected',
  lastUpdate: 'customerHome.lastUpdate',
  openStatus: 'customerHome.openStatus',
  concern: {
    heading: 'customerHome.concern.heading',
    delay: 'customerHome.concern.delay',
    paused: 'customerHome.concern.paused',
    payment_disputed: 'customerHome.concern.payment_disputed',
    viewPayments: 'customerHome.concern.viewPayments',
  },
  next: {
    heading: 'customerHome.next.heading',
    paymentDue: 'customerHome.next.paymentDue',
    paymentOverdue: 'customerHome.next.paymentOverdue',
    payNow: 'customerHome.next.payNow',
    on: 'customerHome.next.on',
    milestone: {
      agreed: 'customerHome.next.milestone.agreed',
      contract: 'customerHome.next.milestone.contract',
      materials: 'customerHome.next.milestone.materials',
      installation: 'customerHome.next.milestone.installation',
      quality: 'customerHome.next.milestone.quality',
      handover: 'customerHome.next.milestone.handover',
    },
    service: {
      warranty: 'customerHome.next.service.warranty',
      amc: 'customerHome.next.service.amc',
      none: 'customerHome.next.service.none',
    },
    paidAlready: 'customerHome.next.paidAlready',
  },
  early: {
    heading: 'customerHome.early.heading',
    intro: 'customerHome.early.intro',
    step: {
      agreed: 'customerHome.early.step.agreed',
      contract: 'customerHome.early.step.contract',
      materials: 'customerHome.early.step.materials',
      installation: 'customerHome.early.step.installation',
      quality: 'customerHome.early.step.quality',
      handover: 'customerHome.early.step.handover',
    },
  },
  tile: {
    status: {
      title: 'customerHome.tile.status.title',
      hint: 'customerHome.tile.status.hint',
    },
    payments: {
      title: 'customerHome.tile.payments.title',
      hint: 'customerHome.tile.payments.hint',
    },
    documents: {
      title: 'customerHome.tile.documents.title',
      hint: 'customerHome.tile.documents.hint',
    },
    support: {
      title: 'customerHome.tile.support.title',
      hint: 'customerHome.tile.support.hint',
    },
    service: {
      title: 'customerHome.tile.service.title',
      hint: 'customerHome.tile.service.hint',
    },
  },
  service: {
    heading: 'customerHome.service.heading',
    warranty: 'customerHome.service.warranty',
    warrantyNone: 'customerHome.service.warrantyNone',
    amc: {
      active: 'customerHome.service.amc.active',
      later: 'customerHome.service.amc.later',
      declined: 'customerHome.service.amc.declined',
    },
    open: 'customerHome.service.open',
  },
  pay: {
    heading: 'customerHome.pay.heading',
    line: 'customerHome.pay.line',
    open: 'customerHome.pay.open',
  },
  contact: {
    heading: 'customerHome.contact.heading',
    body: 'customerHome.contact.body',
    call: 'customerHome.contact.call',
  },
  empty: {
    title: 'customerHome.empty.title',
    body: 'customerHome.empty.body',
  },
} as const;
