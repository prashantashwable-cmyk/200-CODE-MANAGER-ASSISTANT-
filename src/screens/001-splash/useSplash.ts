import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/session/SessionProvider';
import { HOME_PATH_BY_ROLE } from '@/navigation/registry';
import {
  APP_VERSION,
  FLOOR_COUNT,
  INTRO_STEP_MS,
  MAX_HOLD_MS,
  STORAGE_FIRST_LAUNCH,
  STORAGE_LAST_VERSION,
  VALUE_PROPS,
} from './splash.types';
import type { SplashPhase } from './splash.types';

interface SplashState {
  phase: SplashPhase;
  /** How many floors of the Ascension Line have lit, 0..FLOOR_COUNT. */
  litFloors: number;
  carouselIndex: number;
  isFirstLaunch: boolean;
  advanceCarousel: () => void;
  dismissWhatsNew: () => void;
  skip: () => void;
}

/**
 * Owns the splash sequence and the silent session decision.
 *
 * The session check is deliberately not awaited before showing anything —
 * the animation plays regardless, and whichever finishes last decides when we
 * leave. That is what removes dead wait time on a cold start.
 */
export function useSplash(): SplashState {
  const navigate = useNavigate();
  const { kind, role } = useSession();

  const [phase, setPhase] = useState<SplashPhase>('intro');
  const [litFloors, setLitFloors] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Read once, before anything writes to them.
  const firstLaunchRef = useRef<boolean>(
    typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_FIRST_LAUNCH) === null,
  );
  const versionChangedRef = useRef<boolean>(
    typeof localStorage !== 'undefined' &&
      localStorage.getItem(STORAGE_LAST_VERSION) !== null &&
      localStorage.getItem(STORAGE_LAST_VERSION) !== APP_VERSION,
  );
  const leftRef = useRef(false);

  /** The one place that decides where a launch ends up. */
  const leave = useCallback(() => {
    if (leftRef.current) return;
    leftRef.current = true;
    setPhase('leaving');
    localStorage.setItem(STORAGE_FIRST_LAUNCH, '1');
    localStorage.setItem(STORAGE_LAST_VERSION, APP_VERSION);
    // An expired or tampered session leaves `kind` anonymous, so this same
    // branch handles it — silently to Login, never an error dialog.
    navigate(kind !== 'anonymous' && role ? HOME_PATH_BY_ROLE[role] : '/login', { replace: true });
  }, [navigate, kind, role]);

  // Light the Ascension Line floor by floor.
  useEffect(() => {
    const timers = Array.from({ length: FLOOR_COUNT }, (_, i) =>
      window.setTimeout(() => setLitFloors(i + 1), INTRO_STEP_MS * (i + 1)),
    );
    return () => timers.forEach(window.clearTimeout);
  }, []);

  // The hard cap. Whatever else is happening, the intro ends here.
  useEffect(() => {
    if (phase !== 'intro') return undefined;
    const timer = window.setTimeout(() => {
      if (firstLaunchRef.current) setPhase('carousel');
      else if (versionChangedRef.current) setPhase('whatsNew');
      else leave();
    }, MAX_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [phase, leave]);

  const advanceCarousel = useCallback(() => {
    // Decide before setting state. Calling leave() — and therefore navigate()
    // — inside a state updater runs it during React's render phase, which
    // updates the router while another component is rendering.
    if (carouselIndex >= VALUE_PROPS.length - 1) {
      // The carousel is a first-launch-only screen; leaving ends it forever.
      leave();
      return;
    }
    setCarouselIndex((index) => index + 1);
  }, [carouselIndex, leave]);

  const dismissWhatsNew = useCallback(() => leave(), [leave]);

  const skip = useCallback(() => {
    if (phase === 'intro' && firstLaunchRef.current) {
      setPhase('carousel');
      return;
    }
    leave();
  }, [phase, leave]);

  return {
    phase,
    litFloors,
    carouselIndex,
    isFirstLaunch: firstLaunchRef.current,
    advanceCarousel,
    dismissWhatsNew,
    skip,
  };
}
