/** Screen 141 — Recruitment Landing. Types and translation keys only. */

import { GUIDE, RECRUIT_ROLES } from '@/features/recruitment/interest';
import type { InterestRole } from '@/features/recruitment/interest';

export type LandingStatus = 'loading' | 'ready' | 'error';
export const DRAFT_KEY = 'aiec.recruitDraft';
export const SOURCE_KEY = 'aiec.recruitSource';
export const joinPath = '/join';
export const applyPath = (applicationId: string) => `/apply/${applicationId}`;
export const CARD_ROLES = [...RECRUIT_ROLES, 'undecided'] as const satisfies readonly InterestRole[];

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;
const PROBLEMS = ['name_required', 'phone_invalid', 'role_required', 'consent_required', 'already_partner', 'invalid_input', 'offline', 'generic'] as const;
const DETAIL = ['involves', 'earns', 'gives', 'handle'] as const;

export const RECRUIT_KEYS = {
  title: 'recruit.title',
  loading: 'recruit.loading',
  error: { title: 'recruit.error.title', body: 'recruit.error.body' },
  brand: 'recruit.brand',
  language: 'recruit.language',
  hero: { heading: 'recruit.hero.heading', intro: 'recruit.hero.intro', honest: 'recruit.hero.honest' },
  demand: { busy: 'recruit.demand.busy', surge: 'recruit.demand.surge', normal: 'recruit.demand.normal' },
  areas: { heading: 'recruit.areas.heading', none: 'recruit.areas.none' },
  roles: {
    heading: 'recruit.roles.heading',
    hint: 'recruit.roles.hint',
    details: 'recruit.roles.details',
    chosen: 'recruit.roles.chosen',
    choose: 'recruit.roles.choose',
    name: rec('recruit.roles.name', CARD_ROLES),
    tagline: rec('recruit.roles.tagline', CARD_ROLES),
    detail: Object.fromEntries(CARD_ROLES.map((r) => [r, rec(`recruit.roles.detail.${r}`, DETAIL)])) as Record<(typeof CARD_ROLES)[number], Record<(typeof DETAIL)[number], string>>,
    detailLabel: rec('recruit.roles.detailLabel', DETAIL),
  },
  guide: {
    open: 'recruit.guide.open',
    heading: 'recruit.guide.heading',
    intro: 'recruit.guide.intro',
    question: Object.fromEntries(GUIDE.map((q) => [q.id, `recruit.guide.question.${q.id}`])) as Record<(typeof GUIDE)[number]['id'], string>,
    answer: Object.fromEntries(GUIDE.map((q) => [q.id, Object.fromEntries(q.options.map((o) => [o.id, `recruit.guide.answer.${q.id}.${o.id}`]))])) as Record<(typeof GUIDE)[number]['id'], Record<string, string>>,
    pointsTo: 'recruit.guide.pointsTo',
    pointsNowhere: 'recruit.guide.pointsNowhere',
    use: 'recruit.guide.use',
    keep: 'recruit.guide.keep',
    again: 'recruit.guide.again',
    progress: 'recruit.guide.progress',
  },
  form: {
    heading: 'recruit.form.heading',
    intro: 'recruit.form.intro',
    name: 'recruit.form.name',
    phone: 'recruit.form.phone',
    phoneHint: 'recruit.form.phoneHint',
    phoneOk: 'recruit.form.phoneOk',
    selected: 'recruit.form.selected',
    consent: 'recruit.form.consent',
    draftRestored: 'recruit.form.draftRestored',
  },
  submit: { button: 'recruit.submit.button', waiting: 'recruit.submit.waiting' },
  problem: rec('recruit.problem', PROBLEMS),
  done: {
    heading: 'recruit.done.heading',
    intro: 'recruit.done.intro',
    created: 'recruit.done.created',
    existed: 'recruit.done.existed',
    code: 'recruit.done.code',
    continue: 'recruit.done.continue',
    undecided: 'recruit.done.undecided',
    later: 'recruit.done.later',
    reply: 'recruit.done.reply',
    another: 'recruit.done.another',
  },
  share: { heading: 'recruit.share.heading', body: 'recruit.share.body', copy: 'recruit.share.copy', copied: 'recruit.share.copied', send: 'recruit.share.send', message: 'recruit.share.message' },
} as const;
