/** Screen 053 — WhatsApp Business Chat Console. Types and translation keys only. */

export type WhatsappConsoleStatus = 'loading' | 'ready' | 'error';

export const OPT_OUT_KEYWORDS = ['stop', 'unsubscribe'];

export const WHATSAPP_CONSOLE_KEYS = {
  title: 'whatsappConsole.title',
  subtitle: 'whatsappConsole.subtitle',
  loading: 'whatsappConsole.loading',
  error: { title: 'whatsappConsole.error.title', body: 'whatsappConsole.error.body' },
  empty: { title: 'whatsappConsole.empty.title', body: 'whatsappConsole.empty.body' },

  unassigned: 'whatsappConsole.unassigned',
  needsReview: 'whatsappConsole.needsReview',
  claim: 'whatsappConsole.claim',
  assignedTo: 'whatsappConsole.assignedTo',

  bubble: {
    bot: 'whatsappConsole.bubble.bot',
    photo: 'whatsappConsole.bubble.photo',
    voice: 'whatsappConsole.bubble.voice',
    status: {
      queued: 'whatsappConsole.bubble.status.queued',
      sent: 'whatsappConsole.bubble.status.sent',
      delivered: 'whatsappConsole.bubble.status.delivered',
      read: 'whatsappConsole.bubble.status.read',
      failed: 'whatsappConsole.bubble.status.failed',
    },
  },

  optOutBanner: {
    title: 'whatsappConsole.optOutBanner.title',
    body: 'whatsappConsole.optOutBanner.body',
    confirm: 'whatsappConsole.optOutBanner.confirm',
    confirmed: 'whatsappConsole.optOutBanner.confirmed',
  },

  composer: {
    placeholder: 'whatsappConsole.composer.placeholder',
    quickReplies: 'whatsappConsole.composer.quickReplies',
    send: 'whatsappConsole.composer.send',
    pauseNote: 'whatsappConsole.composer.pauseNote',
    sendError: 'whatsappConsole.composer.sendError',
  },

  toast: {
    sent: 'whatsappConsole.toast.sent',
    assigned: 'whatsappConsole.toast.assigned',
    optedOut: 'whatsappConsole.toast.optedOut',
    error: 'whatsappConsole.toast.error',
  },
} as const;
