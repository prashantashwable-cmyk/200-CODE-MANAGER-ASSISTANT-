/** Screen 057 — Customer Reply Inbox (Unified). Types and translation keys only. */

export type ReplyInboxStatus = 'loading' | 'ready' | 'error';

export const REPLY_INBOX_KEYS = {
  title: 'replyInbox.title',
  subtitle: 'replyInbox.subtitle',
  loading: 'replyInbox.loading',
  error: { title: 'replyInbox.error.title', body: 'replyInbox.error.body' },
  empty: { title: 'replyInbox.empty.title', body: 'replyInbox.empty.body' },

  channel: {
    whatsapp: 'replyInbox.channel.whatsapp',
    sms: 'replyInbox.channel.sms',
    call: 'replyInbox.channel.call',
  },
  allChannels: 'replyInbox.allChannels',

  reasonMissedCall: 'replyInbox.reasonMissedCall',
  relatedNote: 'replyInbox.relatedNote',
  waitingMinutes: 'replyInbox.waitingMinutes',
  waitingHours: 'replyInbox.waitingHours',
  slaBreached: 'replyInbox.slaBreached',
  unassigned: 'replyInbox.unassigned',
  assignedTo: 'replyInbox.assignedTo',

  action: {
    assign: 'replyInbox.action.assign',
    markHandled: 'replyInbox.action.markHandled',
    callBack: 'replyInbox.action.callBack',
    assignSheetTitle: 'replyInbox.action.assignSheetTitle',
    close: 'action.close',
  },

  toast: {
    assigned: 'replyInbox.toast.assigned',
    handled: 'replyInbox.toast.handled',
    calledBack: 'replyInbox.toast.calledBack',
    error: 'replyInbox.toast.error',
  },
} as const;
