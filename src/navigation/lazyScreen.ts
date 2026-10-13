import { lazy } from 'react';
import type { ComponentType } from 'react';

const RELOAD_KEY = 'aiec.screenReload';

/**
 * A screen's code is fetched the first time it is opened, not with the app: the app used to arrive as one file of
 * about 12 MB, which a phone on mobile data showed as a blank page for many seconds. The route's facts (path, roles,
 * tab) stay in route.tsx and load at once; only the screen itself waits.
 *
 * After a new version is published, a page opened before it may ask for a screen file that no longer exists. Then the
 * page is reloaded once to fetch the new version, rather than showing an error.
 */
export function lazyScreen<M>(load: () => Promise<M>, name: keyof M & string): ComponentType {
  return lazy(async () => {
    try {
      const mod = await load();
      sessionStorage.removeItem(RELOAD_KEY);
      return { default: mod[name] as unknown as ComponentType };
    } catch (err) {
      if (!sessionStorage.getItem(RELOAD_KEY)) {
        sessionStorage.setItem(RELOAD_KEY, '1');
        window.location.reload();
        return new Promise<never>(() => undefined);
      }
      throw err;
    }
  });
}
