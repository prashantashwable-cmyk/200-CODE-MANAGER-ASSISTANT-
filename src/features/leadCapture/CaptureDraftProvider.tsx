import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { BuildingSpec, GeoPoint } from '@/data/types';

/**
 * The in-progress lead a surveyor is capturing, shared across the capture
 * wizard (screens 032 GPS/photo → 033 contact → 034 spec → 035 duplicate check
 * → 036 confirm).
 *
 * It lives above the screens because the wizard genuinely spans five routes: a
 * surveyor who backs out of the spec step to fix a photo must not lose what
 * they already entered. Submitting or explicitly discarding clears it.
 *
 * It is also persisted to localStorage. Field surveyors work with unreliable
 * connectivity and phones that get interrupted mid-task — a captured GPS fix
 * and three site photos surviving only in React state would be lost the
 * moment the app backgrounds and the tab is reclaimed, or the phone restarts.
 * Only plain serialisable fields are stored: photo *filenames* (the
 * `photos: string[]` field), never the in-memory object URLs a DocumentSlot
 * preview uses, since those cannot survive a reload regardless.
 */

const STORAGE_KEY = 'aiec.captureDraft';

export interface CaptureDraft {
  location?: GeoPoint;
  /** Accuracy of the GPS fix in metres — a poor fix blocks submission. */
  accuracyMetres?: number;
  capturedAt?: string;
  photos: string[];
  siteName: string;
  address: string;
  city: string;
  pincode: string;
  builderName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  notes: string;
  spec: Partial<BuildingSpec>;
  /** Set by screen 035 once the surveyor has seen and dismissed the warning. */
  duplicateAcknowledged: boolean;
  duplicateOfLeadId?: string;
}

export const EMPTY_DRAFT: CaptureDraft = {
  photos: [],
  siteName: '',
  address: '',
  city: 'Pune',
  pincode: '',
  builderName: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  notes: '',
  spec: {},
  duplicateAcknowledged: false,
};

/** Which wizard steps are far enough along to be considered complete. */
export interface CaptureProgress {
  location: boolean;
  contact: boolean;
  spec: boolean;
  duplicateChecked: boolean;
}

interface CaptureDraftContextValue {
  draft: CaptureDraft;
  update: (patch: Partial<CaptureDraft>) => void;
  updateSpec: (patch: Partial<BuildingSpec>) => void;
  reset: () => void;
  progress: CaptureProgress;
}

const CaptureDraftContext = createContext<CaptureDraftContextValue | null>(null);

function readStoredDraft(): CaptureDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DRAFT;
    // Merge onto EMPTY_DRAFT so a draft saved by an older build that is
    // missing newer fields still loads instead of throwing downstream.
    return { ...EMPTY_DRAFT, ...(JSON.parse(raw) as Partial<CaptureDraft>) };
  } catch {
    return EMPTY_DRAFT;
  }
}

export function CaptureDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<CaptureDraft>(readStoredDraft);
  const isResettingRef = useRef(false);

  useEffect(() => {
    if (isResettingRef.current) {
      isResettingRef.current = false;
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  const update = useCallback((patch: Partial<CaptureDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const updateSpec = useCallback((patch: Partial<BuildingSpec>) => {
    setDraft((current) => ({ ...current, spec: { ...current.spec, ...patch } }));
  }, []);

  const reset = useCallback(() => {
    isResettingRef.current = true;
    setDraft(EMPTY_DRAFT);
  }, []);

  const progress = useMemo<CaptureProgress>(
    () => ({
      location: Boolean(draft.location) && draft.photos.length > 0,
      contact: draft.contactName.trim().length > 0 && draft.contactPhone.trim().length === 10,
      spec: Boolean(draft.spec.floors && draft.spec.capacityPersons),
      duplicateChecked: draft.duplicateAcknowledged,
    }),
    [draft],
  );

  const value = useMemo(
    () => ({ draft, update, updateSpec, reset, progress }),
    [draft, update, updateSpec, reset, progress],
  );

  return <CaptureDraftContext.Provider value={value}>{children}</CaptureDraftContext.Provider>;
}

export function useCaptureDraft(): CaptureDraftContextValue {
  const ctx = useContext(CaptureDraftContext);
  if (!ctx) throw new Error('useCaptureDraft must be used inside <CaptureDraftProvider>');
  return ctx;
}
