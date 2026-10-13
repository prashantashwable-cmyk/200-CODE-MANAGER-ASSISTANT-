import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from '@/session/SessionProvider';
import {
  PERMISSIONS_BY_ROLE,
  PRIMER_SHOWN_AT_KEY,
  PRIMER_SHOWN_KEY,
} from './permissions.types';
import type { PermissionId, PermissionState } from './permissions.types';

type PermissionMap = Record<PermissionId, PermissionState>;

interface PermissionsPrimerState {
  /** Only the permissions this role genuinely needs. */
  items: PermissionId[];
  states: PermissionMap;
  request: (id: PermissionId) => Promise<void>;
  requestAll: () => Promise<void>;
  recheck: () => Promise<void>;
  markSeen: () => void;
  /** True when a permission changed at OS level since we last looked. */
  changedOutside: boolean;
  busy: boolean;
  anyBlocked: boolean;
  locationUsable: boolean;
}

const INITIAL: PermissionMap = {
  location: 'unknown',
  camera: 'unknown',
  notifications: 'unknown',
};

/**
 * Reads and requests real browser permissions.
 *
 * Nothing here fakes a granted state: where an API is missing the permission is
 * reported 'unsupported', and a permanently-blocked permission is reported as
 * such so the UI can point at device settings instead of prompting into a wall.
 */
export function usePermissionsPrimer(): PermissionsPrimerState {
  const { role } = useSession();
  const items = PERMISSIONS_BY_ROLE[role ?? 'customer'];

  const [states, setStates] = useState<PermissionMap>(INITIAL);
  const [busy, setBusy] = useState(false);
  const [changedOutside, setChangedOutside] = useState(false);
  const previousRef = useRef<PermissionMap>(INITIAL);

  /** Reads current status without triggering any prompt. */
  const readAll = useCallback(async (): Promise<PermissionMap> => {
    const next: PermissionMap = { ...INITIAL };

    // Geolocation has no queryable state without the Permissions API.
    if (!('geolocation' in navigator)) {
      next.location = 'unsupported';
    } else if ('permissions' in navigator) {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' });
        next.location =
          status.state === 'granted' ? 'granted' : status.state === 'denied' ? 'blocked' : 'prompt';
      } catch {
        next.location = 'prompt';
      }
    } else {
      next.location = 'prompt';
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      next.camera = 'unsupported';
    } else if ('permissions' in navigator) {
      try {
        // Not every browser exposes 'camera' to the Permissions API; falling
        // through to 'prompt' is correct rather than assuming denial.
        const status = await navigator.permissions.query({
          name: 'camera' as PermissionName,
        });
        next.camera =
          status.state === 'granted' ? 'granted' : status.state === 'denied' ? 'blocked' : 'prompt';
      } catch {
        next.camera = 'prompt';
      }
    } else {
      next.camera = 'prompt';
    }

    if (typeof Notification === 'undefined') {
      next.notifications = 'unsupported';
    } else if (Notification.permission === 'granted') {
      next.notifications = 'granted';
    } else if (Notification.permission === 'denied') {
      next.notifications = 'blocked';
    } else {
      next.notifications = 'prompt';
    }

    return next;
  }, []);

  const recheck = useCallback(async () => {
    const next = await readAll();
    const previous = previousRef.current;
    const drifted = items.some(
      (id) =>
        previous[id] !== 'unknown' &&
        previous[id] !== next[id] &&
        // Only flag changes we did not cause ourselves.
        previous[id] !== 'requesting',
    );
    if (drifted) setChangedOutside(true);
    previousRef.current = next;
    setStates(next);
  }, [readAll, items]);

  // Permission status is re-read on every foreground, because the user may
  // have changed it in device settings while the app was in the background.
  useEffect(() => {
    void recheck();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void recheck();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [recheck]);

  const request = useCallback(
    async (id: PermissionId) => {
      setStates((current) => ({ ...current, [id]: 'requesting' }));
      try {
        if (id === 'location') {
          if (!('geolocation' in navigator)) {
            setStates((c) => ({ ...c, location: 'unsupported' }));
            return;
          }
          await new Promise<void>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              () => {
                setStates((c) => ({ ...c, location: 'granted' }));
                resolve();
              },
              (err) => {
                // PERMISSION_DENIED is 1; anything else is a transient failure,
                // not a refusal, and must not be reported as one.
                setStates((c) => ({
                  ...c,
                  location: err.code === err.PERMISSION_DENIED ? 'blocked' : 'denied',
                }));
                resolve();
              },
              { timeout: 10_000 },
            );
          });
          return;
        }

        if (id === 'camera') {
          if (!navigator.mediaDevices?.getUserMedia) {
            setStates((c) => ({ ...c, camera: 'unsupported' }));
            return;
          }
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            // Release the camera immediately — we only wanted the grant.
            stream.getTracks().forEach((track) => track.stop());
            setStates((c) => ({ ...c, camera: 'granted' }));
          } catch {
            setStates((c) => ({ ...c, camera: 'blocked' }));
          }
          return;
        }

        if (typeof Notification === 'undefined') {
          setStates((c) => ({ ...c, notifications: 'unsupported' }));
          return;
        }
        const result = await Notification.requestPermission();
        setStates((c) => ({
          ...c,
          notifications:
            result === 'granted' ? 'granted' : result === 'denied' ? 'blocked' : 'denied',
        }));
      } finally {
        previousRef.current = { ...previousRef.current };
      }
    },
    [],
  );

  const requestAll = useCallback(async () => {
    setBusy(true);
    try {
      // Sequential, not parallel: browsers queue or drop simultaneous prompts,
      // and a person can only answer one dialog at a time anyway.
      for (const id of items) {
        // eslint-disable-next-line no-await-in-loop
        await request(id);
      }
    } finally {
      setBusy(false);
    }
  }, [items, request]);

  const markSeen = useCallback(() => {
    localStorage.setItem(PRIMER_SHOWN_KEY, '1');
    localStorage.setItem(PRIMER_SHOWN_AT_KEY, new Date().toISOString());
  }, []);

  return {
    items,
    states,
    request,
    requestAll,
    recheck,
    markSeen,
    changedOutside,
    busy,
    anyBlocked: items.some((id) => states[id] === 'blocked'),
    locationUsable: !items.includes('location') || states.location === 'granted',
  };
}
