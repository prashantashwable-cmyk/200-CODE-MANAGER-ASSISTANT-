/** Screen 001 — Splash / Brand Intro. Types and translation keys only. */

/**
 * The splash is a sequence, not a spinner. It never blocks: the session check
 * runs underneath the animation, and a hard cap guarantees the screen is gone
 * within MAX_HOLD_MS even with no network at all.
 */
export type SplashPhase = 'intro' | 'carousel' | 'whatsNew' | 'leaving';

/** The spec's hard requirement: never hold the screen for more than 3 seconds. */
export const MAX_HOLD_MS = 3000;
export const INTRO_STEP_MS = 380;
export const FLOOR_COUNT = 4;

/** Bumping this shows the "What's new" sheet once, after the splash. */
export const APP_VERSION = '0.1.0';

export const STORAGE_FIRST_LAUNCH = 'aiec.hasLaunched';
export const STORAGE_LAST_VERSION = 'aiec.lastVersion';

export interface ValueProp {
  id: string;
  titleKey: string;
  bodyKey: string;
}

/** Survey → Sell → Install → Get Paid, shown once on a genuine first launch. */
export const VALUE_PROPS: ValueProp[] = [
  { id: 'survey', titleKey: 'splash.carousel.survey.title', bodyKey: 'splash.carousel.survey.body' },
  { id: 'sell', titleKey: 'splash.carousel.sell.title', bodyKey: 'splash.carousel.sell.body' },
  { id: 'install', titleKey: 'splash.carousel.install.title', bodyKey: 'splash.carousel.install.body' },
  { id: 'paid', titleKey: 'splash.carousel.paid.title', bodyKey: 'splash.carousel.paid.body' },
];

export const SPLASH_KEYS = {
  tagline: 'splash.tagline',
  owner: 'splash.owner',
  founder: 'splash.founder',
  skip: 'splash.skip',
  checking: 'splash.checking',
  carousel: {
    next: 'splash.carousel.next',
    start: 'splash.carousel.start',
    of: 'splash.carousel.of',
  },
  whatsNew: {
    title: 'splash.whatsNew.title',
    body: 'splash.whatsNew.body',
    dismiss: 'splash.whatsNew.dismiss',
  },
} as const;
