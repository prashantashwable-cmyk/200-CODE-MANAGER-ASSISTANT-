/** Screen 152 — Video/Interactive Lesson Player. Constants and translation keys only. */

import type { LessonVisual } from '@/data/types';
import { SPEEDS } from '@/features/training/lesson';

export { SPEEDS };
export const LANGS = ['en', 'hi', 'mr'] as const;
export type LessonLang = (typeof LANGS)[number];
/** The voice a browser is asked for when a lesson is read aloud. */
export const VOICE_LANG: Record<LessonLang, string> = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };
/** A device keeps a place this often while a lesson plays; the record on the server is updated this often when there is signal. */
export const LOCAL_SAVE_EVERY_S = 2;
export const SYNC_EVERY_S = 8;
export const TICK_MS = 250;

export const positionKey = (userId: string, lessonId: string) => `aiec.lessonPos.${userId}.${lessonId}`;
export const prefsKey = (userId: string) => `aiec.lessonPrefs.${userId}`;
export const libraryPath = '/training';
export const modulePath = (moduleId: string, lesson?: number) => `/training/${moduleId}${lesson ? `?lesson=${lesson}` : ''}`;

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;
const PROBLEMS = ['forbidden', 'not_found', 'locked', 'not_for_you', 'retired', 'invalid_state', 'no_lessons', 'none_chosen', 'single_only', 'out_of_range', 'not_finished', 'checks_open', 'unknown_check', 'offline', 'generic'] as const;
const VISUALS: LessonVisual[] = ['welcome', 'promise', 'person', 'phone', 'warning', 'harness', 'inspect', 'anchor', 'rescue', 'power', 'lock', 'tag', 'meter'];

export const PLAYER_KEYS = {
  title: 'lessonPlayer.title',
  loading: 'lessonPlayer.loading',
  error: { title: 'lessonPlayer.error.title', body: 'lessonPlayer.error.body' },
  notFound: { title: 'lessonPlayer.notFound.title', body: 'lessonPlayer.notFound.body' },
  soon: { title: 'lessonPlayer.soon.title', body: 'lessonPlayer.soon.body' },
  locked: { title: 'lessonPlayer.locked.title', body: 'lessonPlayer.locked.body' },
  back: 'lessonPlayer.back',
  backToModule: 'lessonPlayer.backToModule',
  overview: {
    progress: 'lessonPlayer.overview.progress',
    changed: 'lessonPlayer.overview.changed',
    lessonsHeading: 'lessonPlayer.overview.lessonsHeading',
    minutes: 'lessonPlayer.overview.minutes',
    play: 'lessonPlayer.overview.play',
    resume: 'lessonPlayer.overview.resume',
    replay: 'lessonPlayer.overview.replay',
    updatedBadge: 'lessonPlayer.overview.updatedBadge',
    doneBadge: 'lessonPlayer.overview.doneBadge',
    lockedHint: 'lessonPlayer.overview.lockedHint',
    allDone: 'lessonPlayer.overview.allDone',
    keyPoints: 'lessonPlayer.overview.keyPoints',
  },
  reference: {
    heading: 'lessonPlayer.reference.heading',
    body: 'lessonPlayer.reference.body',
    download: 'lessonPlayer.reference.download',
    none: 'lessonPlayer.reference.none',
    lesson: 'lessonPlayer.reference.lesson',
    downloaded: 'lessonPlayer.reference.downloaded',
    brand: 'lessonPlayer.reference.brand',
    generated: 'lessonPlayer.reference.generated',
    footer: 'lessonPlayer.reference.footer',
    version: 'lessonPlayer.reference.version',
  },
  player: {
    sceneOf: 'lessonPlayer.player.sceneOf',
    play: 'lessonPlayer.player.play',
    pause: 'lessonPlayer.player.pause',
    replaySection: 'lessonPlayer.player.replaySection',
    restart: 'lessonPlayer.player.restart',
    speed: 'lessonPlayer.player.speed',
    speedValue: 'lessonPlayer.player.speedValue',
    captions: 'lessonPlayer.player.captions',
    captionsOff: 'lessonPlayer.player.captionsOff',
    listen: 'lessonPlayer.player.listen',
    listenOff: 'lessonPlayer.player.listenOff',
    language: 'lessonPlayer.player.language',
    timeline: 'lessonPlayer.player.timeline',
    time: 'lessonPlayer.player.time',
    resumed: 'lessonPlayer.player.resumed',
    sections: 'lessonPlayer.player.sections',
    sectionPlayed: 'lessonPlayer.player.sectionPlayed',
    sectionAhead: 'lessonPlayer.player.sectionAhead',
    aheadNote: 'lessonPlayer.player.aheadNote',
    offline: 'lessonPlayer.player.offline',
    synced: 'lessonPlayer.player.synced',
    replaying: 'lessonPlayer.player.replaying',
    checkMarker: 'lessonPlayer.player.checkMarker',
  },
  lang: rec('lessonPlayer.lang', LANGS),
  visual: rec('lessonPlayer.visual', VISUALS),
  check: {
    heading: 'lessonPlayer.check.heading',
    blocked: 'lessonPlayer.check.blocked',
    single: 'lessonPlayer.check.single',
    multi: 'lessonPlayer.check.multi',
    submit: 'lessonPlayer.check.submit',
    correct: 'lessonPlayer.check.correct',
    notYet: 'lessonPlayer.check.notYet',
    attempts: 'lessonPlayer.check.attempts',
    tryAgain: 'lessonPlayer.check.tryAgain',
    watchAgain: 'lessonPlayer.check.watchAgain',
    continue: 'lessonPlayer.check.continue',
    needSignal: 'lessonPlayer.check.needSignal',
  },
  done: {
    heading: 'lessonPlayer.done.heading',
    body: 'lessonPlayer.done.body',
    again: 'lessonPlayer.done.again',
    next: 'lessonPlayer.done.next',
    moduleDone: 'lessonPlayer.done.moduleDone',
    gateLifted: 'lessonPlayer.done.gateLifted',
    saving: 'lessonPlayer.done.saving',
    pending: 'lessonPlayer.done.pending',
    retry: 'lessonPlayer.done.retry',
    points: 'lessonPlayer.done.points',
  },
  problem: rec('lessonPlayer.problem', PROBLEMS),
} as const;

/** Lesson words are translation keys under the module's code, so authoring a lesson adds keys and no screen. */
export const lessonBase = (code: string, order: number) => `lessonContent.${code.toLowerCase()}.l${order}`;
export const sceneKey = (code: string, order: number, scene: number) => `${lessonBase(code, order)}.scene.${scene + 1}`;
export const titleKey = (code: string, order: number) => `${lessonBase(code, order)}.title`;
export const summaryKey = (code: string, order: number) => `${lessonBase(code, order)}.summary`;
export const pointKey = (code: string, order: number, n: number) => `${lessonBase(code, order)}.point.${n}`;
/** A lesson's checks are numbered in the order they appear. */
export const checkBase = (code: string, order: number, n: number) => `${lessonBase(code, order)}.check.${n}`;
