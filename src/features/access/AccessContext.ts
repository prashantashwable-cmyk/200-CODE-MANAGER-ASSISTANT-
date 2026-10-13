import { createContext, useContext } from 'react';
import type { Role } from '@/data/types';
import type { ScreenRef } from './permissions';

/** Fired by the permission screen after any change, so a person whose access just moved is told without waiting for the next look. */
export const ACCESS_CHANGED = 'aiec:access-changed';

export interface AccessContextValue {
  /** Every screen the app declares, with the roles each was built for. */
  screens: ScreenRef[];
  /** Resolves once the repository has been told the screen table: a screen that reads permissions waits for it first. */
  ready: Promise<void>;
  /** May the signed-in person open this route? Until the permissions have been read, the code's own table answers. */
  canOpen: (route: Pick<ScreenRef, 'id' | 'path' | 'roles'>) => boolean;
  role: Role | null;
}
export const AccessContext = createContext<AccessContextValue>({ screens: [], ready: Promise.resolve(), canOpen: () => true, role: null });
export const useAccess = (): AccessContextValue => useContext(AccessContext);
