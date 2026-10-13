import type { NotificationCategory } from '@/features/notifications/center';

export const POLL_MS = 20_000;
export const NOTIFICATIONS_PATH = '/notifications';
export const viewKey = (userId: string): string => `aiec.notificationCenter.${userId}`;
export const SMS_WORD = 'SMS';
export const CATEGORY_ORDER: NotificationCategory[] = ['payments', 'project', 'delivery', 'service', 'plan', 'offers'];

export const NOTIFICATION_KEYS = {
  title: 'notifications.title',
  subtitle: 'notifications.subtitle',
  loading: 'notifications.loading',
  error: {
    title: 'notifications.error.title',
    body: 'notifications.error.body',
  },
  refresh: 'notifications.refresh',
  close: 'notifications.close',
  tabs: {
    feed: 'notifications.tabs.feed',
    prefs: 'notifications.tabs.prefs',
  },
  link: {
    open: 'notifications.link.open',
    hint: 'notifications.link.hint',
    unread: 'notifications.link.unread',
  },
  notice: {
    placeholders: 'notifications.notice.placeholders',
  },
  feed: {
    markAll: 'notifications.feed.markAll',
    marked: 'notifications.feed.marked',
    unread: 'notifications.feed.unread',
    allRead: 'notifications.feed.allRead',
    filter: {
      all: 'notifications.feed.filter.all',
      unread: 'notifications.feed.filter.unread',
    },
    showMore: 'notifications.feed.showMore',
    day: {
      today: 'notifications.feed.day.today',
      yesterday: 'notifications.feed.day.yesterday',
    },
    group: {
      count: 'notifications.feed.group.count',
      expand: 'notifications.feed.group.expand',
      collapse: 'notifications.feed.group.collapse',
    },
  },
  empty: {
    title: 'notifications.empty.title',
    body: 'notifications.empty.body',
    filtered: {
      title: 'notifications.empty.filtered.title',
      body: 'notifications.empty.filtered.body',
    },
  },
  category: {
    payments: 'notifications.category.payments',
    project: 'notifications.category.project',
    delivery: 'notifications.category.delivery',
    service: 'notifications.category.service',
    plan: 'notifications.category.plan',
    offers: 'notifications.category.offers',
    hint: {
      payments: 'notifications.category.hint.payments',
      project: 'notifications.category.hint.project',
      delivery: 'notifications.category.hint.delivery',
      service: 'notifications.category.hint.service',
      plan: 'notifications.category.hint.plan',
      offers: 'notifications.category.hint.offers',
    },
  },
  kind: {
    essential: 'notifications.kind.essential',
    optional: 'notifications.kind.optional',
  },
  row: {
    via: {
      sms: 'notifications.row.via.sms',
      whatsapp: 'notifications.row.via.whatsapp',
      in_app: 'notifications.row.via.in_app',
    },
    fellBack: 'notifications.row.fellBack',
    new: 'notifications.row.new',
    work: 'notifications.row.work',
  },
  group: {
    generic: 'notifications.group.generic',
    'tpl-amc-reconsider': 'notifications.group.tpl-amc-reconsider',
    'tpl-amc-renewal': 'notifications.group.tpl-amc-renewal',
    'tpl-delay-external': 'notifications.group.tpl-delay-external',
    'tpl-delay-notice': 'notifications.group.tpl-delay-notice',
    'tpl-handover-certificate': 'notifications.group.tpl-handover-certificate',
    'tpl-install-update': 'notifications.group.tpl-install-update',
    'tpl-parts-notice': 'notifications.group.tpl-parts-notice',
    'tpl-payment-formal-notice': 'notifications.group.tpl-payment-formal-notice',
    'tpl-payment-reminder': 'notifications.group.tpl-payment-reminder',
    'tpl-payment-reminder-firm': 'notifications.group.tpl-payment-reminder-firm',
    'tpl-quote-followup': 'notifications.group.tpl-quote-followup',
    'tpl-ship-arrived': 'notifications.group.tpl-ship-arrived',
    'tpl-ship-dispatched': 'notifications.group.tpl-ship-dispatched',
    'tpl-ship-nearby': 'notifications.group.tpl-ship-nearby',
    'tpl-ship-transit': 'notifications.group.tpl-ship-transit',
    'tpl-site-visit-confirm': 'notifications.group.tpl-site-visit-confirm',
    'tpl-ticket-received': 'notifications.group.tpl-ticket-received',
    'tpl-ticket-visit': 'notifications.group.tpl-ticket-visit',
    'tpl-warranty-ending': 'notifications.group.tpl-warranty-ending',
    'tpl-welcome': 'notifications.group.tpl-welcome',
  },
  detail: {
    sent: 'notifications.detail.sent',
    older: 'notifications.detail.older',
    now: 'notifications.detail.now',
    open: 'notifications.detail.open',
    noState: 'notifications.detail.noState',
  },
  state: {
    payments: {
      overdue: 'notifications.state.payments.overdue',
      due: 'notifications.state.payments.due',
      confirming: 'notifications.state.payments.confirming',
      disputed: 'notifications.state.payments.disputed',
      upcoming: 'notifications.state.payments.upcoming',
      complete: 'notifications.state.payments.complete',
      empty: 'notifications.state.payments.empty',
    },
    delivery: {
      none: 'notifications.state.delivery.none',
      moving: 'notifications.state.delivery.moving',
      arrived: 'notifications.state.delivery.arrived',
    },
    service: {
      open: 'notifications.state.service.open',
      none: 'notifications.state.service.none',
    },
    plan: {
      active: 'notifications.state.plan.active',
      expiring: 'notifications.state.plan.expiring',
      lapsed: 'notifications.state.plan.lapsed',
      warranty: 'notifications.state.plan.warranty',
      none: 'notifications.state.plan.none',
    },
    project: {
      stage: 'notifications.state.project.stage',
      service: 'notifications.state.project.service',
    },
  },
  prefs: {
    title: 'notifications.prefs.title',
    intro: 'notifications.prefs.intro',
    channels: {
      title: 'notifications.prefs.channels.title',
      sms: 'notifications.prefs.channels.sms',
      whatsapp: 'notifications.prefs.channels.whatsapp',
      inApp: 'notifications.prefs.channels.inApp',
      inAppHint: 'notifications.prefs.channels.inAppHint',
      number: 'notifications.prefs.channels.number',
      stop: 'notifications.prefs.channels.stop',
      dnd: 'notifications.prefs.channels.dnd',
    },
    warn: {
      title: 'notifications.prefs.warn.title',
      body: 'notifications.prefs.warn.body',
    },
    essential: {
      title: 'notifications.prefs.essential.title',
      body: 'notifications.prefs.essential.body',
    },
    optional: {
      title: 'notifications.prefs.optional.title',
      body: 'notifications.prefs.optional.body',
      sms: 'notifications.prefs.optional.sms',
      whatsapp: 'notifications.prefs.optional.whatsapp',
      inApp: 'notifications.prefs.optional.inApp',
      off: 'notifications.prefs.optional.off',
      channelsOff: 'notifications.prefs.optional.channelsOff',
    },
    save: 'notifications.prefs.save',
    saved: 'notifications.prefs.saved',
    history: {
      title: 'notifications.prefs.history.title',
      empty: 'notifications.prefs.history.empty',
      line: 'notifications.prefs.history.line',
      on: 'notifications.prefs.history.on',
      off: 'notifications.prefs.history.off',
    },
    source: {
      customer_request: 'notifications.prefs.source.customer_request',
      stop_keyword: 'notifications.prefs.source.stop_keyword',
      manual_entry: 'notifications.prefs.source.manual_entry',
      dnd_registry: 'notifications.prefs.source.dnd_registry',
    },
    channel: {
      sms: 'notifications.prefs.channel.sms',
      whatsapp: 'notifications.prefs.channel.whatsapp',
      all: 'notifications.prefs.channel.all',
      call: 'notifications.prefs.channel.call',
      in_app: 'notifications.prefs.channel.in_app',
    },
  },
  problem: {
    dnd_locked: 'notifications.problem.dnd_locked',
    invalid_choice: 'notifications.problem.invalid_choice',
    generic: 'notifications.problem.generic',
  },
} as const;
