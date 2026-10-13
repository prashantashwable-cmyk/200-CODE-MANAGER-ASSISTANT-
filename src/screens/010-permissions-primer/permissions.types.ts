/** Screen 010 — Permissions primer. Types and translation keys only. */

import type { Role } from '@/data/types';

export type PermissionId = 'location' | 'camera' | 'notifications';

export type PermissionState =
  | 'unknown'
  /** Not asked yet — the OS prompt will appear. */
  | 'prompt'
  | 'granted'
  /** Declined this time; asking again is still allowed. */
  | 'denied'
  /** Declined permanently — only the device's settings can undo it. */
  | 'blocked'
  /** This browser has no such API at all. */
  | 'unsupported'
  | 'requesting';

export const PRIMER_SHOWN_KEY = 'aiec.permissionsPrimerShown';
export const PRIMER_SHOWN_AT_KEY = 'aiec.permissionsPrimerShownAt';

/**
 * Which permissions each role is actually asked for. A customer never captures
 * site photos, so asking them for the camera is asking for access we do not
 * need — the spec calls this out explicitly.
 */
export const PERMISSIONS_BY_ROLE: Record<Role, PermissionId[]> = {
  surveyor: ['location', 'camera', 'notifications'],
  technician: ['location', 'camera', 'notifications'],
  admin: ['notifications'],
  customer: ['notifications'],
  supplier: ['notifications'],
};

export const PERMISSION_KEYS = {
  title: 'permissions.title',
  subtitle: 'permissions.subtitle',
  enableAll: 'permissions.enableAll',
  continue: 'permissions.continue',
  skip: 'permissions.skip',
  locationWarning: 'permissions.locationWarning',
  openSettings: 'permissions.openSettings',
  openSettingsHint: 'permissions.openSettingsHint',
  allow: 'permissions.allow',
  notNow: 'permissions.notNow',
  recheck: 'permissions.recheck',
  changedNotice: 'permissions.changedNotice',
  state: {
    granted: 'permissions.state.granted',
    denied: 'permissions.state.denied',
    blocked: 'permissions.state.blocked',
    unsupported: 'permissions.state.unsupported',
    prompt: 'permissions.state.prompt',
  },
  item: {
    location: {
      title: 'permissions.item.location.title',
      why: 'permissions.item.location.why',
      ifDenied: 'permissions.item.location.ifDenied',
    },
    camera: {
      title: 'permissions.item.camera.title',
      why: 'permissions.item.camera.why',
      ifDenied: 'permissions.item.camera.ifDenied',
    },
    notifications: {
      title: 'permissions.item.notifications.title',
      why: 'permissions.item.notifications.why',
      ifDenied: 'permissions.item.notifications.ifDenied',
    },
  },
} as const;
