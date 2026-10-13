/** Screen 032 — New Lead Capture: GPS & Site Photo. Types and keys only. */

export type GpsPhase = 'idle' | 'locating' | 'located' | 'denied' | 'unavailable' | 'poorAccuracy';

/** Worse than this and the surveyor is warned before being allowed to proceed. */
export const POOR_ACCURACY_METRES = 50;
export const MIN_PHOTOS_REQUIRED = 3;

export type PhotoSlotId = 'front' | 'entrance' | 'landmark';

export const PHOTO_SLOTS: PhotoSlotId[] = ['front', 'entrance', 'landmark'];

export const CAPTURE_GPS_KEYS = {
  title: 'captureGps.title',
  subtitle: 'captureGps.subtitle',
  step: {
    location: 'captureGps.step.location',
    contact: 'captureGps.step.contact',
    spec: 'captureGps.step.spec',
    duplicate: 'captureGps.step.duplicate',
    confirm: 'captureGps.step.confirm',
  },
  gps: {
    locating: 'captureGps.gps.locating',
    located: 'captureGps.gps.located',
    accuracy: 'captureGps.gps.accuracy',
    manuallyPlaced: 'captureGps.gps.manuallyPlaced',
    denied: 'captureGps.gps.denied',
    deniedAction: 'captureGps.gps.deniedAction',
    unavailable: 'captureGps.gps.unavailable',
    poorAccuracy: 'captureGps.gps.poorAccuracy',
    poorAccuracyAction: 'captureGps.gps.poorAccuracyAction',
    retry: 'captureGps.gps.retry',
    mapLabel: 'captureGps.gps.mapLabel',
    manualAdjustNote: 'captureGps.gps.manualAdjustNote',
  },
  photos: {
    heading: 'captureGps.photos.heading',
    body: 'captureGps.photos.body',
    slot: {
      front: 'captureGps.photos.slot.front',
      entrance: 'captureGps.photos.slot.entrance',
      landmark: 'captureGps.photos.slot.landmark',
    },
    slotHint: {
      front: 'captureGps.photos.slotHint.front',
      entrance: 'captureGps.photos.slotHint.entrance',
      landmark: 'captureGps.photos.slotHint.landmark',
    },
    minRequired: 'captureGps.photos.minRequired',
    liveOnlyNote: 'captureGps.photos.liveOnlyNote',
    geotagNote: 'captureGps.photos.geotagNote',
  },
  landmarkNote: {
    label: 'captureGps.landmarkNote.label',
    hint: 'captureGps.landmarkNote.hint',
  },
  offlineQueued: 'captureGps.offlineQueued',
  continue: 'captureGps.continue',
  discard: 'captureGps.discard',
  discardConfirm: 'captureGps.discardConfirm',
} as const;
