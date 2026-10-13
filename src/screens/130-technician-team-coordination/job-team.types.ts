/** Screen 130 — Technician Team Coordination. Types and translation keys only. */

export type TeamStatus = 'loading' | 'ready' | 'error' | 'not_found';
export type TeamTab = 'team' | 'chat' | 'handoffs';

export const POLL_MS = 10_000;
export const TABS: TeamTab[] = ['team', 'chat', 'handoffs'];
export const outboxKey = (userId: string) => `aiec.teamOutbox.${userId}`;
export const viewKey = (userId: string, jobId: string) => `aiec.teamView.${userId}.${jobId}`;
export const draftKey = (userId: string, jobId: string) => `aiec.teamDraft.${userId}.${jobId}`;
export const CHAT_MAX = 1000;
export const HANDOFF_MIN = 15;
export const REASON_MIN = 8;

/** Errors that will not succeed on a second try: a queued message that gets one is reported and dropped. */
export const FINAL_ERRORS = [
  'text_required', 'text_too_long', 'note_required', 'unknown_member', 'forbidden', 'not_found', 'read_only', 'captured_in_future', 'captured_invalid',
  'not_lead', 'unknown_step', 'lead_owns_all', 'reason_required', 'dates_invalid', 'dates_too_long', 'invalid_state', 'already_on_job', 'still_checked_in',
  'new_lead_required', 'already_open', 'job_finished', 'not_ready', 'job_on_hold', 'tier_cannot_lead', 'training_incomplete',
] as const;

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;

export const listPath = '/technician';
export const teamPath = (id: string, tab?: TeamTab) => `/job-team/${id}${tab ? `?tab=${tab}` : ''}`;
export const jobPath = (id: string) => `/technician/jobs/${id}`;
export const issuePath = (jobId: string, issueId: string) => `/job-issues/${jobId}?issue=${issueId}`;

export const TEAM_KEYS = {
  title: 'jobTeam.title',
  loading: 'jobTeam.loading',
  back: 'jobTeam.back',
  offline: 'jobTeam.offline',
  error: { title: 'jobTeam.error.title', body: 'jobTeam.error.body' },
  notFound: { title: 'jobTeam.notFound.title', body: 'jobTeam.notFound.body', action: 'jobTeam.notFound.action' },
  pick: { title: 'jobTeam.pick.title', body: 'jobTeam.pick.body', action: 'jobTeam.pick.action' },
  problem: rec('jobTeam.problem', [...FINAL_ERRORS, 'offline', 'generic'] as const),
  tab: rec('jobTeam.tab', ['team', 'chat', 'handoffs'] as const),
  tabLabel: 'jobTeam.tabLabel',
  hero: { lead: 'jobTeam.hero.lead', people: 'jobTeam.hero.people', onSite: 'jobTeam.hero.onSite', steps: 'jobTeam.hero.steps', unread: 'jobTeam.hero.unread' },
  status: rec('jobTeam.status', ['scheduled', 'materials_pending', 'in_progress', 'qc_pending', 'handover_pending', 'completed', 'on_hold'] as const),
  role: { lead: 'jobTeam.role.lead', assistant: 'jobTeam.role.assistant', delegated: 'jobTeam.role.delegated', me: 'jobTeam.role.me' },
  member: {
    onSite: 'jobTeam.member.onSite',
    onSiteSince: 'jobTeam.member.onSiteSince',
    notOnSite: 'jobTeam.member.notOnSite',
    responsibility: 'jobTeam.member.responsibility',
    noResponsibility: 'jobTeam.member.noResponsibility',
    ownSteps: 'jobTeam.member.ownSteps',
    wholeJob: 'jobTeam.member.wholeJob',
    now: 'jobTeam.member.now',
    completedBy: 'jobTeam.member.completedBy',
    call: 'jobTeam.member.call',
    manage: 'jobTeam.member.manage',
    noSteps: 'jobTeam.member.noSteps',
    leadOwns: 'jobTeam.member.leadOwns',
  },
  stepStatus: rec('jobTeam.stepStatus', ['complete', 'current', 'upcoming', 'blocked'] as const),
  delegation: { banner: 'jobTeam.delegation.banner', end: 'jobTeam.delegation.end', toastEnded: 'jobTeam.delegation.toastEnded', open: 'jobTeam.delegation.open', title: 'jobTeam.delegation.title', body: 'jobTeam.delegation.body', to: 'jobTeam.delegation.to', pick: 'jobTeam.delegation.pick', from: 'jobTeam.delegation.from', until: 'jobTeam.delegation.until', reason: 'jobTeam.delegation.reason', reasonHint: 'jobTeam.delegation.reasonHint', go: 'jobTeam.delegation.go', toast: 'jobTeam.delegation.toast', none: 'jobTeam.delegation.none' },
  signOff: {
    heading: 'jobTeam.signOff.heading',
    intro: 'jobTeam.signOff.intro',
    single: 'jobTeam.signOff.single',
    notReady: 'jobTeam.signOff.notReady',
    waiting: 'jobTeam.signOff.waiting',
    waitingOther: 'jobTeam.signOff.waitingOther',
    done: 'jobTeam.signOff.done',
    button: 'jobTeam.signOff.button',
    confirmTitle: 'jobTeam.signOff.confirmTitle',
    confirmBody: 'jobTeam.signOff.confirmBody',
    back: 'jobTeam.signOff.back',
    go: 'jobTeam.signOff.go',
    toast: 'jobTeam.signOff.toast',
  },
  assign: { title: 'jobTeam.assign.title', body: 'jobTeam.assign.body', responsibility: 'jobTeam.assign.responsibility', responsibilityHint: 'jobTeam.assign.responsibilityHint', steps: 'jobTeam.assign.steps', doneNote: 'jobTeam.assign.doneNote', heldBy: 'jobTeam.assign.heldBy', save: 'jobTeam.assign.save', toast: 'jobTeam.assign.toast' },
  admin: {
    add: 'jobTeam.admin.add',
    addTitle: 'jobTeam.admin.addTitle',
    addBody: 'jobTeam.admin.addBody',
    addPick: 'jobTeam.admin.addPick',
    addBusy: 'jobTeam.admin.addBusy',
    addNone: 'jobTeam.admin.addNone',
    addGo: 'jobTeam.admin.addGo',
    toastAdded: 'jobTeam.admin.toastAdded',
    reassign: 'jobTeam.admin.reassign',
    reassignTitle: 'jobTeam.admin.reassignTitle',
    reassignBody: 'jobTeam.admin.reassignBody',
    reassignLeadBody: 'jobTeam.admin.reassignLeadBody',
    reason: 'jobTeam.admin.reason',
    handTo: 'jobTeam.admin.handTo',
    handToLead: 'jobTeam.admin.handToLead',
    newLead: 'jobTeam.admin.newLead',
    reassignGo: 'jobTeam.admin.reassignGo',
    toastReassigned: 'jobTeam.admin.toastReassigned',
    changeLead: 'jobTeam.admin.changeLead',
    changeLeadTitle: 'jobTeam.admin.changeLeadTitle',
    changeLeadBody: 'jobTeam.admin.changeLeadBody',
    changeLeadGo: 'jobTeam.admin.changeLeadGo',
    toastLead: 'jobTeam.admin.toastLead',
    readOnly: 'jobTeam.admin.readOnly',
  },
  log: { heading: 'jobTeam.log.heading', empty: 'jobTeam.log.empty', added: 'jobTeam.log.added', reassigned: 'jobTeam.log.reassigned', lead_changed: 'jobTeam.log.lead_changed', delegated: 'jobTeam.log.delegated', delegation_ended: 'jobTeam.log.delegation_ended', steps_assigned: 'jobTeam.log.steps_assigned', signed_off: 'jobTeam.log.signed_off', by: 'jobTeam.log.by' },
  chat: {
    heading: 'jobTeam.chat.heading',
    intro: 'jobTeam.chat.intro',
    empty: 'jobTeam.chat.empty',
    placeholder: 'jobTeam.chat.placeholder',
    send: 'jobTeam.chat.send',
    notSent: 'jobTeam.chat.notSent',
    sending: 'jobTeam.chat.sending',
    unread: 'jobTeam.chat.unread',
    adminNote: 'jobTeam.chat.adminNote',
    disagree: 'jobTeam.chat.disagree',
    disagreeTitle: 'jobTeam.chat.disagreeTitle',
    disagreeBody: 'jobTeam.chat.disagreeBody',
    disagreeLabel: 'jobTeam.chat.disagreeLabel',
    disagreeHint: 'jobTeam.chat.disagreeHint',
    disagreeGo: 'jobTeam.chat.disagreeGo',
    disagreeOpen: 'jobTeam.chat.disagreeOpen',
    disagreeResolved: 'jobTeam.chat.disagreeResolved',
    disagreeTag: 'jobTeam.chat.disagreeTag',
    toastDisagree: 'jobTeam.chat.toastDisagree',
    viewReport: 'jobTeam.chat.viewReport',
    tooLong: 'jobTeam.chat.tooLong',
  },
  handoff: {
    heading: 'jobTeam.handoff.heading',
    intro: 'jobTeam.handoff.intro',
    empty: 'jobTeam.handoff.empty',
    write: 'jobTeam.handoff.write',
    title: 'jobTeam.handoff.title',
    to: 'jobTeam.handoff.to',
    toTeam: 'jobTeam.handoff.toTeam',
    text: 'jobTeam.handoff.text',
    textHint: 'jobTeam.handoff.textHint',
    textOk: 'jobTeam.handoff.textOk',
    open: 'jobTeam.handoff.open',
    openNone: 'jobTeam.handoff.openNone',
    send: 'jobTeam.handoff.send',
    toast: 'jobTeam.handoff.toast',
    toastQueued: 'jobTeam.handoff.toastQueued',
    from: 'jobTeam.handoff.from',
    forYou: 'jobTeam.handoff.forYou',
    forTeam: 'jobTeam.handoff.forTeam',
    ack: 'jobTeam.handoff.ack',
    acked: 'jobTeam.handoff.acked',
    ackBy: 'jobTeam.handoff.ackBy',
    notAcked: 'jobTeam.handoff.notAcked',
    toastAck: 'jobTeam.handoff.toastAck',
    waiting: 'jobTeam.handoff.waiting',
    local: 'jobTeam.handoff.local',
    adminCannot: 'jobTeam.handoff.adminCannot',
  },
  failed: { title: 'jobTeam.failed.title', dismiss: 'jobTeam.failed.dismiss' },
  cancel: 'jobTeam.cancel',
  alert: { disagreement: 'jobTeam.alert.disagreement' },
} as const;
