import type { ComponentType } from 'react';
import type { Role } from '@/data/types';

/**
 * Routes are DISCOVERED, not centrally listed.
 *
 * Each screen folder ships a `route.tsx` that default-exports a ScreenRoute,
 * and this module globs them all in. Same reasoning as the i18n assembly: many
 * screens can be built in parallel without any of them editing one shared
 * router file, which is where merge collisions come from.
 *
 * To add a screen: create `src/screens/<nnn>-<slug>/route.tsx` with
 *   const route: ScreenRoute = { ... };  export default route;
 * Nothing else to register.
 */

export interface ScreenRoute {
  /** The prompt number this screen implements, e.g. '011'. */
  id: string;
  /** React Router path. Params allowed, e.g. '/admin/tracking/surveyor/:userId'. */
  path: string;
  /** Which roles may open it. 'public' means no session required. */
  roles: Role[] | 'public';
  /** Translation key for the screen title, used by the shell and page title. */
  titleKey: string;
  Component: ComponentType;
  /** Which bottom-tab/sidebar item highlights while this screen is open —
   *  per role for a screen two roles reach from different tabs. */
  tab?: string | Partial<Record<Role, string>>;
  /** Auth and splash screens render without the navigation shell. */
  chromeless?: boolean;
}

const modules = import.meta.glob<{ default: ScreenRoute | ScreenRoute[] }>('../screens/**/route.tsx', {
  eager: true,
});

function collect(): ScreenRoute[] {
  const routes: ScreenRoute[] = [];
  const seenPaths = new Map<string, string>();

  for (const key of Object.keys(modules).sort()) {
    const exported = modules[key]?.default;
    if (!exported) {
      if (import.meta.env.DEV) console.warn(`[routes] ${key} has no default export`);
      continue;
    }
    // One screen may be reached by two roles through two paths (a public applicant link and Admin's own page): it exports a list.
    for (const route of Array.isArray(exported) ? exported : [exported]) {
      const clash = seenPaths.get(route.path);
      if (clash) {
        // Two screens on one path means one is unreachable — loud in dev.
        console.error(`[routes] path "${route.path}" claimed by both ${clash} and ${route.id}`);
      }
      seenPaths.set(route.path, route.id);
      routes.push(route);
    }
  }

  // Static segments before params so '/admin/map/filters' is not swallowed by
  // a '/admin/map/:id' style route.
  return routes.sort((a, b) => {
    const aParams = (a.path.match(/:/g) ?? []).length;
    const bParams = (b.path.match(/:/g) ?? []).length;
    if (aParams !== bParams) return aParams - bParams;
    return b.path.length - a.path.length;
  });
}

export const screenRoutes: ScreenRoute[] = collect();

export function routeById(id: string): ScreenRoute | undefined {
  return screenRoutes.find((r) => r.id === id);
}

export function canAccess(route: ScreenRoute, role: Role | null): boolean {
  if (route.roles === 'public') return true;
  return role !== null && route.roles.includes(role);
}

/** Where each role lands after sign-in or entering Demo Mode. */
export const HOME_PATH_BY_ROLE: Record<Role, string> = {
  admin: '/admin',
  surveyor: '/surveyor',
  technician: '/technician',
  customer: '/customer',
  supplier: '/orders',
};
