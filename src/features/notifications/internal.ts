/**
 * Internal (staff-facing) notifications (183), kept structurally apart from the customer-facing templates (051): different audience, different governance. Pure: the settings
 * screen and the repository read the same urgency rules, channel limits and checks, so a preview and a real send can never disagree about whether a message fits a channel.
 */
import type { AlertSeverity } from '@/data/types';

export const URGENCIES = ['critical', 'high', 'routine'] as const;
export type Urgency = (typeof URGENCIES)[number];
export const CHANNELS = ['inApp', 'sms', 'email'] as const;
export type Channel = (typeof CHANNELS)[number];
export type ChannelSet = Record<Channel, boolean>;

/** What each urgency level does when nothing more specific is configured (placeholders for the owner to confirm): the most important notices use every channel, routine ones stay in the app. */
export const DEFAULT_URGENCY_CHANNELS: Record<Urgency, ChannelSet> = {
  critical: { inApp: true, sms: true, email: true },
  high: { inApp: true, sms: true, email: false },
  routine: { inApp: true, sms: false, email: false },
};
export const NO_CHANNELS: ChannelSet = { inApp: false, sms: false, email: false };
export const IN_APP_ONLY: ChannelSet = { inApp: true, sms: false, email: false };

/** The urgency an alert gets when nobody has tagged its type. */
export const urgencyOfSeverity = (severity: AlertSeverity): Urgency => (severity === 'critical' ? 'critical' : severity === 'high' ? 'high' : 'routine');
/** A type tagged critical or high is never shown as less than that, wherever alerts are read. */
export const severityFloorOf = (urgency: Urgency): AlertSeverity | null => (urgency === 'critical' ? 'critical' : urgency === 'high' ? 'high' : null);
const SEVERITY_RANK: Record<AlertSeverity, number> = { low: 0, medium: 1, high: 2, critical: 3 };
export const atLeast = (severity: AlertSeverity, floor: AlertSeverity | null): AlertSeverity => (floor && SEVERITY_RANK[floor] > SEVERITY_RANK[severity] ? floor : severity);

export const channelCount = (c: ChannelSet): number => CHANNELS.filter((ch) => c[ch]).length;
/** True when `after` reaches the person by fewer channels than `before`: a change that needs confirming for something important. */
export const reducesReach = (before: ChannelSet, after: ChannelSet): boolean => CHANNELS.some((ch) => before[ch] && !after[ch]);

/** Trigger frequency against the urgency: a critical notice that fires often trains people to ignore it (placeholders). */
export const NOISY_PER_WEEK: Record<Urgency, number> = { critical: 5, high: 15, routine: 1000 };
export const fatigueOf = (urgency: Urgency, last7: number): 'noisy' | null => (last7 >= NOISY_PER_WEEK[urgency] ? 'noisy' : null);

export const SUBJECT_MAX = 80;
export const BODY_MAX = 400;
export const SMS_SEGMENTS_MAX = 3;
export const EMAIL_SUBJECT_MAX = 78;
export const IN_APP_TITLE_MAX = 65;

/** Merge fields an Admin may use in a template, and what a test fills them with. */
export const MERGE_FIELDS = ['title', 'context', 'severity', 'code', 'time', 'link'] as const;
export const SAMPLE_VALUES: Record<(typeof MERGE_FIELDS)[number], string> = { title: 'Delivery is running late', context: 'AIEC-PO-8204 for Kulkarni Signature: parts expected 2 days after the installation start', severity: 'high', code: 'ALT-9001', time: '10:30', link: 'aiec.app/a/9001' };

export function renderContent(text: string, values: Partial<Record<string, string>>): string {
  return text.replace(/\{\{\s*([a-zA-Z]+)\s*\}\}/g, (_m, key: string) => values[key] ?? `[${key}]`);
}

/** Characters outside the basic GSM set force a Unicode SMS: 70 characters a message (67 once it is in parts) instead of 160 (153). Hindi and Marathi always do. */
const GSM_BASIC = /^[\n\r @£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#¤%&'()*+,\-./0-9:;<=>?¡A-ZÄÖÑÜ§¿a-zäöñüà^{}\\[~\]|€]*$/;
export function segmentsOf(text: string): { unicode: boolean; length: number; segments: number; perSegment: number } {
  const unicode = !GSM_BASIC.test(text);
  const length = [...text].length;
  const single = unicode ? 70 : 160;
  const multi = unicode ? 67 : 153;
  const segments = length === 0 ? 0 : length <= single ? 1 : Math.ceil(length / multi);
  return { unicode, length, segments, perSegment: length <= single ? single : multi };
}

export type ChannelProblem = 'sms_too_long' | 'sms_multipart' | 'email_subject_long' | 'in_app_title_long' | 'body_empty';
/** What would go wrong sending this on that channel. The first two are what a test-send exists to catch before a real critical alert hits them. */
export function channelProblems(channel: Channel, rendered: { subject: string; body: string }): ChannelProblem[] {
  const out: ChannelProblem[] = [];
  if (rendered.body.trim() === '' && rendered.subject.trim() === '') out.push('body_empty');
  if (channel === 'sms') {
    const s = segmentsOf(rendered.body || rendered.subject);
    if (s.segments > SMS_SEGMENTS_MAX) out.push('sms_too_long');
    else if (s.segments > 1) out.push('sms_multipart');
  }
  if (channel === 'email' && [...rendered.subject].length > EMAIL_SUBJECT_MAX) out.push('email_subject_long');
  if (channel === 'inApp' && [...rendered.subject].length > IN_APP_TITLE_MAX) out.push('in_app_title_long');
  return out;
}
/** A problem that stops the message arriving intact; a warning only costs more or reads worse. */
export const isBlocking = (p: ChannelProblem): boolean => p === 'sms_too_long' || p === 'body_empty';

export type ContentProblem = 'subject_long' | 'body_long';
export const contentProblems = (c: { subject: string; body: string }): ContentProblem[] => [...(c.subject.length > SUBJECT_MAX ? ['subject_long' as const] : []), ...(c.body.length > BODY_MAX ? ['body_long' as const] : [])];

/** The notification types the app is known to raise (the rest are added by name as they appear). Ids are the title keys the alerts board already translates. */
export const CORE_TYPES: { id: string; urgency: Urgency }[] = [
  { id: 'alerts.type.fieldSos', urgency: 'critical' },
  { id: 'payoutDisbursement.alert.failed', urgency: 'high' },
  { id: 'deliveryDelay.alert.delayed', urgency: 'high' },
  { id: 'verification.alert.failed', urgency: 'high' },
  { id: 'referral.alert.newLead', urgency: 'routine' },
  { id: 'supplierInvoiceMatching.alert.mismatch', urgency: 'high' },
  { id: 'partnerExit.alert.violation', urgency: 'critical' },
  { id: 'trainingFeedback.alert.error', urgency: 'high' },
  { id: 'automationRules.alert.unitFailing', urgency: 'high' },
  { id: 'qcElec.alert.fail', urgency: 'critical' },
  { id: 'snagList.alert.safety', urgency: 'critical' },
  { id: 'supportChat.alert.safety', urgency: 'critical' },
];
