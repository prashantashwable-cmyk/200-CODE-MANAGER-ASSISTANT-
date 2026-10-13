/**
 * The public recruitment front door's rules, pure (141). One interest is one person asking about one role: the same phone asking about two
 * roles is two interests, never one overwriting the other, and asking about the same role twice is one interest (the second ask is only
 * another touch). Where the person came from is captured with the same discipline as a customer lead's source, so channels can be compared.
 *
 * The intake thresholds are AIEC's own placeholder business decisions, kept in one place and flagged where they are shown.
 */
import { isIndianMobile } from '@/features/validation/india';
import { hours } from '@/features/sla/clock';

export const RECRUIT_ROLES = ['surveyor', 'technician', 'supplier'] as const;
export type RecruitRole = (typeof RECRUIT_ROLES)[number];
/** Someone who is not sure yet: kept as an interest of its own, with what they answered, for a person to place. */
export type InterestRole = RecruitRole | 'undecided';

export const RECRUIT_CHANNELS = ['qr', 'social', 'referral', 'whatsapp', 'walk_in', 'event', 'website', 'other'] as const;
export type RecruitChannel = (typeof RECRUIT_CHANNELS)[number];

export interface RecruitSource {
  channel: RecruitChannel;
  /** A named campaign, e.g. one print run's flyer. */
  campaign?: string;
  /** An existing partner's own code, when the link was shared by them. */
  referrerCode?: string;
}

const CAMPAIGN_MAX = 40;
const REF_MAX = 24;

/** Reads `?src=&c=&ref=` from the link the person arrived by. Nothing about it is trusted: unknown values are kept as `other`, text is trimmed. */
export function parseSource(search: string): RecruitSource {
  const q = new URLSearchParams(search);
  const raw = (q.get('src') ?? '').trim().toLowerCase();
  const campaign = (q.get('c') ?? '').replace(/[^\p{L}\p{N}_-]/gu, '').slice(0, CAMPAIGN_MAX);
  const ref = (q.get('ref') ?? '').replace(/[^A-Za-z0-9-]/g, '').slice(0, REF_MAX);
  const channel: RecruitChannel = ref ? 'referral' : (RECRUIT_CHANNELS as readonly string[]).includes(raw) ? (raw as RecruitChannel) : raw ? 'other' : 'website';
  return { channel, ...(campaign ? { campaign } : {}), ...(ref ? { referrerCode: ref } : {}) };
}

/** The ten digits of an Indian mobile number, whatever way it was typed (+91, 0, spaces). */
export function normalisePhone(value: string): string {
  const d = value.replace(/\D/g, '');
  return d.length > 10 ? d.slice(-10) : d;
}
export const isMobile = (value: string): boolean => isIndianMobile(value);

export type InterestProblem = 'name_required' | 'phone_invalid' | 'role_required' | 'consent_required' | 'already_partner' | 'invalid_input';
export const NAME_MIN = 3;

export function interestProblem(i: { name: string; phone: string; roles: InterestRole[]; consent: boolean }): InterestProblem | null {
  if (i.name.replace(/[^\p{L}]/gu, '').length < NAME_MIN) return 'name_required';
  if (!isMobile(i.phone)) return 'phone_invalid';
  if (i.roles.length === 0) return 'role_required';
  if (!i.consent) return 'consent_required';
  return null;
}

/* ------------------------------------------------------------------ "help me choose" */

export interface GuideQuestion {
  id: 'enjoy' | 'business' | 'experience' | 'travel';
  options: { id: string; scores: Partial<Record<RecruitRole, number>> }[];
}

export const GUIDE: GuideQuestion[] = [
  { id: 'enjoy', options: [{ id: 'people', scores: { surveyor: 2 } }, { id: 'tools', scores: { technician: 2 } }, { id: 'business', scores: { supplier: 2 } }] },
  { id: 'business', options: [{ id: 'yes', scores: { supplier: 3 } }, { id: 'no', scores: {} }] },
  { id: 'experience', options: [{ id: 'lifts', scores: { technician: 3 } }, { id: 'trade', scores: { technician: 1 } }, { id: 'none', scores: {} }] },
  { id: 'travel', options: [{ id: 'yes', scores: { surveyor: 1 } }, { id: 'no', scores: {} }] },
];

export type GuideAnswers = Partial<Record<GuideQuestion['id'], string>>;

/** The role the answers point to, or null when they do not point to one: then the person is not pushed into a role. */
export function suggestRole(answers: GuideAnswers): RecruitRole | null {
  const total: Record<RecruitRole, number> = { surveyor: 0, technician: 0, supplier: 0 };
  for (const q of GUIDE) {
    const o = q.options.find((x) => x.id === answers[q.id]);
    for (const r of RECRUIT_ROLES) total[r] += o?.scores[r] ?? 0;
  }
  const ranked = [...RECRUIT_ROLES].sort((a, b) => total[b] - total[a]);
  return total[ranked[0]] > 0 && total[ranked[0]] > total[ranked[1]] ? ranked[0] : null;
}
export const guideComplete = (answers: GuideAnswers): boolean => GUIDE.every((q) => !!answers[q.id]);

/* ------------------------------------------------------------------ intake and surges */

export const INTAKE_WINDOW = hours(24);
/** A normal day brings about this many new interests. Placeholders until AIEC has a real history. */
export const INTAKE_BUSY_PER_DAY = 25;
export const INTAKE_SURGE_PER_DAY = 60;
export type Demand = 'normal' | 'busy' | 'surge';

/** How busy intake is and how long a person should honestly expect to wait for a first reply, from the last day's count. */
export function demandOf(lastDay: number): { level: Demand; expectedReplyDays: number } {
  if (lastDay >= INTAKE_SURGE_PER_DAY) return { level: 'surge', expectedReplyDays: 7 };
  if (lastDay >= INTAKE_BUSY_PER_DAY) return { level: 'busy', expectedReplyDays: 4 };
  return { level: 'normal', expectedReplyDays: 2 };
}
