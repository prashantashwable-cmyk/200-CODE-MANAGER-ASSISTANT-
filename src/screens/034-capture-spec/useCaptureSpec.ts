import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCaptureDraft } from '@/features/leadCapture/CaptureDraftProvider';
import { KG_PER_PERSON, SPECIALIZED_QUOTE_FLOOR_THRESHOLD, suggestCapacity } from './capture-spec.types';
import type { UsageType } from './capture-spec.types';
import type { BuildingType } from '@/data/types';

const USAGE_TO_BUILDING_TYPE: Record<UsageType, BuildingType> = {
  residential: 'residential_apartment',
  commercial: 'commercial_office',
  institutional: 'institutional',
  mixed: 'residential_apartment',
};

const BUILDING_TYPE_TO_USAGE: Partial<Record<BuildingType, UsageType>> = {
  residential_apartment: 'residential',
  residential_villa: 'residential',
  commercial_office: 'commercial',
  retail: 'commercial',
  hospital: 'institutional',
  institutional: 'institutional',
  hotel: 'commercial',
  industrial: 'commercial',
};

interface CaptureSpecState {
  usage: UsageType;
  setUsage: (value: UsageType) => void;
  mixedUse: boolean;
  setMixedUse: (value: boolean) => void;
  floors: string;
  setFloors: (value: string) => void;
  basements: string;
  setBasements: (value: string) => void;
  stage: import('@/data/types').BuildingSpec['constructionStage'];
  setStage: (value: import('@/data/types').BuildingSpec['constructionStage']) => void;
  capacity: string;
  setCapacity: (value: string) => void;
  capacityKg: number;
  speed: string;
  setSpeed: (value: string) => void;
  shaftWidth: string;
  setShaftWidth: (value: string) => void;
  shaftDepth: string;
  setShaftDepth: (value: string) => void;
  shaftNotVisible: boolean;
  setShaftNotVisible: (value: boolean) => void;
  notes: string;
  setNotes: (value: string) => void;
  isSpecialized: boolean;
  canContinue: boolean;
  continueToNext: () => void;
}

/**
 * Owns the building specification step.
 *
 * Floor count and usage feed the Auto-Quotation Engine's base pricing, so
 * they are required, not optional. Shaft dimensions stay explicitly optional
 * and labelled as an estimate — never presented as a final measurement,
 * because a surveyor genuinely cannot always see the shaft this early.
 */
export function useCaptureSpec(): CaptureSpecState {
  const navigate = useNavigate();
  const { draft, updateSpec, update } = useCaptureDraft();

  const [usage, setUsageState] = useState<UsageType>(
    (draft.spec.buildingType && BUILDING_TYPE_TO_USAGE[draft.spec.buildingType]) || 'residential',
  );
  const [mixedUse, setMixedUse] = useState(draft.spec.mixedUse ?? false);
  const [floors, setFloors] = useState(draft.spec.floors ? String(draft.spec.floors) : '');
  const [basements, setBasements] = useState(draft.spec.basements ? String(draft.spec.basements) : '1');
  const [stage, setStage] = useState<import('@/data/types').BuildingSpec['constructionStage']>(
    draft.spec.constructionStage ?? 'structure',
  );
  const [capacity, setCapacityState] = useState(
    draft.spec.capacityPersons ? String(draft.spec.capacityPersons) : '',
  );
  const [capacityTouched, setCapacityTouched] = useState(Boolean(draft.spec.capacityPersons));
  const [speed, setSpeed] = useState(draft.spec.speedMps ? String(draft.spec.speedMps) : '1');
  const [shaftWidth, setShaftWidth] = useState(draft.spec.shaftWidthMm ? String(draft.spec.shaftWidthMm) : '');
  const [shaftDepth, setShaftDepth] = useState(draft.spec.shaftDepthMm ? String(draft.spec.shaftDepthMm) : '');
  const [shaftNotVisible, setShaftNotVisible] = useState(false);
  const [notes, setNotes] = useState(draft.notes);

  const setUsage = useCallback(
    (value: UsageType) => {
      setUsageState(value);
      // The capacity helper re-suggests when usage changes, but only while
      // the surveyor has not overridden it themselves.
      if (!capacityTouched && floors) {
        setCapacityState(String(suggestCapacity(value, Number(floors))));
      }
    },
    [capacityTouched, floors],
  );

  const setFloorsAndSuggest = useCallback(
    (value: string) => {
      const digits = value.replace(/\D/g, '').slice(0, 3);
      setFloors(digits);
      if (!capacityTouched && digits) {
        setCapacityState(String(suggestCapacity(usage, Number(digits))));
      }
    },
    [capacityTouched, usage],
  );

  const setCapacity = useCallback((value: string) => {
    setCapacityTouched(true);
    setCapacityState(value.replace(/\D/g, '').slice(0, 2));
  }, []);

  const capacityKg = (Number(capacity) || 0) * KG_PER_PERSON;
  const floorCount = Number(floors) || 0;
  const isSpecialized = floorCount >= SPECIALIZED_QUOTE_FLOOR_THRESHOLD;

  const canContinue = floorCount > 0 && Number(capacity) > 0;

  const continueToNext = useCallback(() => {
    updateSpec({
      buildingType: USAGE_TO_BUILDING_TYPE[usage],
      mixedUse,
      floors: floorCount,
      basements: Number(basements) || 0,
      shaftCount: 1,
      capacityPersons: Number(capacity),
      capacityKg,
      speedMps: Number(speed) || 1,
      shaftWidthMm: shaftNotVisible ? undefined : Number(shaftWidth) || undefined,
      shaftDepthMm: shaftNotVisible ? undefined : Number(shaftDepth) || undefined,
      machineRoom: 'unknown',
      doorType: 'automatic_centre',
      cabinFinish: 'standard_ss',
      powerBackup: true,
      constructionStage: stage,
    });
    update({ notes });
    navigate('/surveyor/capture/duplicate');
  }, [
    updateSpec,
    usage,
    mixedUse,
    floorCount,
    basements,
    capacity,
    capacityKg,
    speed,
    shaftNotVisible,
    shaftWidth,
    shaftDepth,
    stage,
    update,
    notes,
    navigate,
  ]);

  return {
    usage,
    setUsage,
    mixedUse,
    setMixedUse,
    floors,
    setFloors: setFloorsAndSuggest,
    basements,
    setBasements,
    stage,
    setStage,
    capacity,
    setCapacity,
    capacityKg,
    speed,
    setSpeed,
    shaftWidth,
    setShaftWidth,
    shaftDepth,
    setShaftDepth,
    shaftNotVisible,
    setShaftNotVisible,
    notes,
    setNotes,
    isSpecialized,
    canContinue,
    continueToNext,
  };
}
