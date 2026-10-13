import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCaptureDraft } from '@/features/leadCapture/CaptureDraftProvider';
import type { DocumentSlotValue } from '@/features/onboarding/DocumentSlot';
import { MIN_PHOTOS_REQUIRED, POOR_ACCURACY_METRES } from './capture-gps.types';
import type { GpsPhase, PhotoSlotId } from './capture-gps.types';

interface CaptureGpsState {
  phase: GpsPhase;
  accuracyMetres: number | null;
  location: { lat: number; lng: number } | null;
  locate: () => void;
  /** Lets the surveyor drop a corrected pin when the GPS fix is poor. */
  adjustLocation: (point: { lat: number; lng: number }) => void;
  photos: Partial<Record<PhotoSlotId, DocumentSlotValue>>;
  setPhoto: (slot: PhotoSlotId, value: DocumentSlotValue | null) => void;
  landmarkNote: string;
  setLandmarkNote: (value: string) => void;
  photoCount: number;
  canContinue: boolean;
  continueToNext: () => void;
  isOffline: boolean;
}

/**
 * Owns real GPS acquisition and the guided photo set for the anti-fraud
 * capture bundle.
 *
 * This calls the browser's actual `navigator.geolocation.getCurrentPosition`
 * — no simulated coordinates. A fix worse than ±50m is flagged rather than
 * silently accepted, since the whole duplicate-detection model downstream
 * depends on this fix being trustworthy.
 */
export function useCaptureGps(): CaptureGpsState {
  const navigate = useNavigate();
  const { draft, update } = useCaptureDraft();

  const [phase, setPhase] = useState<GpsPhase>('idle');
  const [accuracyMetres, setAccuracyMetres] = useState<number | null>(draft.accuracyMetres ?? null);
  const [photos, setPhotos] = useState<Partial<Record<PhotoSlotId, DocumentSlotValue>>>({});
  const [landmarkNote, setLandmarkNote] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setPhase('unavailable');
      return;
    }
    setPhase('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setAccuracyMetres(Math.round(accuracy));
        update({
          location: { lat: latitude, lng: longitude },
          accuracyMetres: Math.round(accuracy),
          capturedAt: new Date().toISOString(),
        });
        setPhase(accuracy > POOR_ACCURACY_METRES ? 'poorAccuracy' : 'located');
      },
      (err) => {
        setPhase(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable');
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }, [update]);

  // Auto-captures the instant the screen opens, per the spec.
  useEffect(() => {
    if (!draft.location) locate();
    else setPhase(accuracyMetres && accuracyMetres > POOR_ACCURACY_METRES ? 'poorAccuracy' : 'located');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A manual correction is treated as ground truth: the surveyor visually
  // confirmed the pin against the real map, so accuracy stops being a concern.
  const adjustLocation = useCallback(
    (point: { lat: number; lng: number }) => {
      setAccuracyMetres(0);
      update({ location: point, accuracyMetres: 0, capturedAt: new Date().toISOString() });
      setPhase('located');
    },
    [update],
  );

  const setPhoto = useCallback(
    (slot: PhotoSlotId, value: DocumentSlotValue | null) => {
      setPhotos((current) => {
        const next = { ...current };
        if (value) next[slot] = value;
        else delete next[slot];
        update({ photos: Object.values(next).map((v) => v.fileName) });
        return next;
      });
    },
    [update],
  );

  const photoCount = Object.keys(photos).length;
  const hasUsableFix = phase === 'located' || (phase === 'poorAccuracy' && Boolean(draft.location));
  const canContinue = hasUsableFix && photoCount >= MIN_PHOTOS_REQUIRED;

  const continueToNext = useCallback(() => {
    update({ notes: landmarkNote });
    navigate('/surveyor/capture/contact');
  }, [update, landmarkNote, navigate]);

  return {
    phase,
    accuracyMetres,
    location: draft.location ?? null,
    locate,
    adjustLocation,
    photos,
    setPhoto,
    landmarkNote,
    setLandmarkNote,
    photoCount,
    canContinue,
    continueToNext,
    isOffline,
  };
}
