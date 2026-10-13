/**
 * The customer's notification centre (180): which kind of notice a message is, which kinds a customer may switch off, and the one rule that decides how a message
 * reaches them. Pure: the screen and the repository both read it.
 */
import { days } from '@/features/sla/clock';

export const CATEGORIES = ['payments', 'project', 'delivery', 'service', 'plan', 'offers'] as const;
export type NotificationCategory = (typeof CATEGORIES)[number];
/** Essential account notices: a payment due, where the work stands, a delivery, a service request. These are never switched off, only moved between channels. */
export const ESSENTIAL: NotificationCategory[] = ['payments', 'project', 'delivery', 'service'];
/** Optional: renewal prompts and ideas. Fully the customer's choice. */
export const OPTIONAL = ['plan', 'offers'] as const;
export type OptionalCategory = (typeof OPTIONAL)[number];
export const isEssential = (c: NotificationCategory): boolean => ESSENTIAL.includes(c);

/** Unread only counts what is recent; older history reads as seen (placeholder). */
export const NEW_DAYS = 14;
export const NEW_MS = days(NEW_DAYS);
/** One page of the list, and how many items of one kind on one day fold into a single line (placeholders). */
export const PAGE = 30;
export const GROUP_MIN = 3;

const GROUP_CATEGORY: [RegExp, NotificationCategory][] = [
  [/^tpl-payment-/, 'payments'],
  [/^tpl-(ship-|delay-|parts-)/, 'delivery'],
  [/^tpl-ticket-/, 'service'],
  [/^tpl-(warranty-ending|amc-renewal)$/, 'plan'],
  [/^tpl-(quote-followup|amc-reconsider)$/, 'offers'],
];
/** What a Communication Engine template is about. Anything not named is an ordinary account notice about the project. */
export function categoryOfGroup(groupId: string): NotificationCategory {
  return GROUP_CATEGORY.find(([re]) => re.test(groupId))?.[1] ?? 'project';
}

const KIND_CATEGORY: [RegExp, NotificationCategory][] = [
  [/^(payment_|loan_|supplier_payment)/, 'payments'],
  [/^(shipment|delivery|po_)/, 'delivery'],
  [/^(service_|support_|feedback_)/, 'service'],
  [/^(warranty_|amc_|certification_)/, 'plan'],
  [/^referral_/, 'offers'],
];
/** What a commitment on the customer's own list is about. */
export function categoryOfKind(kind: string): NotificationCategory {
  return KIND_CATEGORY.find(([re]) => re.test(kind))?.[1] ?? 'project';
}

export type OutsideChannel = 'sms' | 'whatsapp';
export interface OptionalChoice { sms: boolean; whatsapp: boolean; inApp: boolean }
export type OptionalChoices = Record<OptionalCategory, OptionalChoice>;
export const DEFAULT_CHOICES: OptionalChoices = { plan: { sms: true, whatsapp: true, inApp: true }, offers: { sms: true, whatsapp: true, inApp: true } };

/**
 * How a message may actually reach the person. `channel` is what the template asked for, `optedOut` is their standing opt-out on that channel (the compliance record),
 * `choice` their own choice for an optional kind. A person with an account is never left without the notice: an essential one falls back to the in-app copy; an optional
 * one is only dropped when they turned it off altogether. Someone with no account has no app to fall back to.
 */
export function deliveryOf(input: { channel: string; essential: boolean; optedOut: boolean; choice: OptionalChoice | null; hasAccount: boolean }): { channel: string | null; fellBack: boolean } {
  const { channel, essential, optedOut, choice, hasAccount } = input;
  if (channel === 'call' || channel === 'in_app') return { channel, fellBack: false };
  const choiceOff = !essential && choice ? !choice[channel as OutsideChannel] : false;
  if (!optedOut && !choiceOff) return { channel, fellBack: false };
  if (!hasAccount) return { channel: null, fellBack: false };
  if (!essential && choice && !choice.inApp) return { channel: null, fellBack: false };
  return { channel: 'in_app', fellBack: true };
}

/** An essential notice reaches the person only inside the app once both outside channels are off: said to them when they save, never hidden. */
export const essentialInAppOnly = (smsOn: boolean, whatsappOn: boolean): boolean => !smsOn && !whatsappOn;

export type DayLabel = 'today' | 'yesterday' | 'earlier';
/** Which heading an item sits under (calendar days in the viewer's clock). */
export function dayLabelOf(atIso: string, now: number): { key: string; label: DayLabel } {
  const day = (ms: number) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const key = day(Date.parse(atIso));
  return { key, label: key === day(now) ? 'today' : key === day(now - 86_400_000) ? 'yesterday' : 'earlier' };
}

export interface Groupable { id: string; category: NotificationCategory; dayKey: string; read: boolean }
export type Row<T extends Groupable> = { kind: 'item'; item: T } | { kind: 'group'; key: string; category: NotificationCategory; items: T[]; unread: number };
/** Folds a day's run of the same kind (an eventful installation) into one line once there are `GROUP_MIN` of them, keeping the list scannable. Order is kept. */
export function rowsOf<T extends Groupable>(items: T[]): Row<T>[] {
  const rows: Row<T>[] = [];
  const counts = new Map<string, number>();
  for (const i of items) counts.set(`${i.dayKey}|${i.category}`, (counts.get(`${i.dayKey}|${i.category}`) ?? 0) + 1);
  const placed = new Set<string>();
  for (const i of items) {
    const key = `${i.dayKey}|${i.category}`;
    if ((counts.get(key) ?? 0) < GROUP_MIN) { rows.push({ kind: 'item', item: i }); continue; }
    if (placed.has(key)) continue;
    placed.add(key);
    const all = items.filter((x) => `${x.dayKey}|${x.category}` === key);
    rows.push({ kind: 'group', key, category: i.category, items: all, unread: all.filter((x) => !x.read).length });
  }
  return rows;
}
