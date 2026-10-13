import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useData } from '@/data/DataProvider';
import type { AccessGrantsView } from '@/data/repository';
import { HOME_PATH_BY_ROLE, screenRoutes } from '@/navigation/registry';
import { useSession } from '@/session/SessionProvider';
import { ACCESS_CHANGED, AccessContext } from './AccessContext';
import type { AccessContextValue } from './AccessContext';
import { accessFor, decisionKey } from './permissions';
import type { Decision, OverrideEffect, ScreenRef } from './permissions';

const REFRESH_MS = 30_000;
/** Routes in the form the permission rules read. Imported only here and in `main.tsx`: the screens themselves read the context, never the registry, so there is no import cycle. */
const SCREENS: ScreenRef[] = screenRoutes.map((r) => ({ id: r.id, path: r.path, roles: r.roles, titleKey: r.titleKey }));

/**
 * The enforcement point for who may open which screen (192): the router asks this before it renders a route. The code's own route table is the default; Admin's decisions
 * (a role granted or refused a screen, a person's own exception) are read from the repository and applied on top, so a change takes effect on the next look.
 */
export function AccessProvider({ children }: { children: ReactNode }) {
  const repository = useData();
  const { user, role } = useSession();
  const [grants, setGrants] = useState<AccessGrantsView | null>(null);
  const ready = useMemo(() => repository.setAccessCatalogue(SCREENS, HOME_PATH_BY_ROLE).catch(() => undefined), [repository]);
  const uid = user?.id ?? '';
  const read = useCallback(() => {
    if (!uid) { setGrants(null); return; }
    void ready.then(() => repository.getMyAccess(uid)).then((g) => setGrants((old) => (old && old.version === g.version && old.baseRole === g.baseRole ? old : g))).catch(() => undefined);
  }, [repository, uid, ready]);
  useEffect(() => {
    read();
    const id = window.setInterval(read, REFRESH_MS);
    const onShow = () => { if (document.visibilityState === 'visible') read(); };
    document.addEventListener('visibilitychange', onShow);
    window.addEventListener(ACCESS_CHANGED, read);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); window.removeEventListener(ACCESS_CHANGED, read); };
  }, [read]);
  const decisions = useMemo(() => new Map<string, Decision>((grants?.decisions ?? []).map((d) => [decisionKey(d.roleId, d.screenId), d.effect] as const)), [grants]);
  const overrides = useMemo(() => new Map<string, OverrideEffect>((grants?.overrides ?? []).map((o) => [o.screenId, o.effect] as const)), [grants]);
  const canOpen = useCallback<AccessContextValue['canOpen']>((route) => {
    if (route.roles === 'public') return true;
    if (!role) return false;
    // Until the decisions have been read, what the code says stands.
    if (!grants || grants.baseRole !== role) return route.roles.includes(role);
    return accessFor({ id: route.id, path: route.path, roles: route.roles, titleKey: '' }, { baseRole: role, customRoleIds: grants.customRoleIds, overrides }, decisions, HOME_PATH_BY_ROLE).allowed;
  }, [role, grants, decisions, overrides]);
  const value = useMemo<AccessContextValue>(() => ({ screens: SCREENS, ready, canOpen, role }), [ready, canOpen, role]);
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}
