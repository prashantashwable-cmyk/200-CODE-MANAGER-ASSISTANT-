import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import type { AmcPricingTier, DriveType, PricingConfig } from '@/data/types';
import type { PricingConfigStatus } from './pricing-config.types';

/** Mirrors the repository's own `effectiveGstRatePct` exactly, so the rate
 *  shown here never disagrees with what a new quotation would actually use. */
export function effectiveGstRatePct(pricing: PricingConfig): number {
  const scheduled = pricing.scheduledGstChange;
  if (scheduled && new Date(scheduled.effectiveDate).getTime() <= Date.now()) {
    return scheduled.newRatePct;
  }
  return pricing.gstRatePct;
}

interface DriveTypeSheetState {
  driveType: DriveType;
  baseDraft: string;
  perFloorDraft: string;
}

interface AmcSheetState {
  tier: AmcPricingTier['tier'];
  priceDraft: string;
  responseDraft: string;
}

interface PricingConfigState {
  status: PricingConfigStatus;
  pricing: PricingConfig | null;
  effectiveGstRatePct: number;
  gstScheduleIsPending: boolean;
  saving: boolean;

  driveTypeSheet: DriveTypeSheetState | null;
  openDriveTypeSheet: (driveType: DriveType) => void;
  closeDriveTypeSheet: () => void;
  setDriveTypeDraft: (patch: Partial<Pick<DriveTypeSheetState, 'baseDraft' | 'perFloorDraft'>>) => void;
  saveDriveTypeSheet: () => Promise<boolean>;

  marginSheetOpen: boolean;
  marginDraft: string;
  marginLoweringConfirmed: boolean;
  openMarginSheet: () => void;
  closeMarginSheet: () => void;
  setMarginDraft: (v: string) => void;
  setMarginLoweringConfirmed: (v: boolean) => void;
  saveMarginSheet: () => Promise<boolean>;

  gstSheetOpen: boolean;
  gstRateDraft: string;
  gstDateDraft: string;
  openGstSheet: () => void;
  closeGstSheet: () => void;
  setGstRateDraft: (v: string) => void;
  setGstDateDraft: (v: string) => void;
  saveGstSheet: () => Promise<boolean>;
  cancelScheduledGst: () => Promise<boolean>;

  amcSheet: AmcSheetState | null;
  openAmcSheet: (tier: AmcPricingTier['tier']) => void;
  closeAmcSheet: () => void;
  setAmcDraft: (patch: Partial<Pick<AmcSheetState, 'priceDraft' | 'responseDraft'>>) => void;
  saveAmcSheet: () => Promise<boolean>;

  reload: () => Promise<void>;
}

/**
 * Owns the single governed root of every price the Quotation Engine
 * calculates. Every save routes through `updatePricingConfig`, the same
 * guardrails (margin floor never zero or negative) enforced there — this
 * screen never applies a softer check of its own that the repository
 * doesn't also see.
 */
export function usePricingConfig(): PricingConfigState {
  const repository = useData();
  const [status, setStatus] = useState<PricingConfigStatus>('loading');
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [saving, setSaving] = useState(false);

  const [driveTypeSheet, setDriveTypeSheet] = useState<DriveTypeSheetState | null>(null);
  const [marginSheetOpen, setMarginSheetOpen] = useState(false);
  const [marginDraft, setMarginDraft] = useState('');
  const [marginLoweringConfirmed, setMarginLoweringConfirmed] = useState(false);
  const [gstSheetOpen, setGstSheetOpen] = useState(false);
  const [gstRateDraft, setGstRateDraft] = useState('');
  const [gstDateDraft, setGstDateDraft] = useState('');
  const [amcSheet, setAmcSheet] = useState<AmcSheetState | null>(null);

  const load = useCallback(async () => {
    try {
      const config = await repository.getPricingConfig();
      setPricing(config);
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository]);

  useEffect(() => {
    void load();
  }, [load]);

  const effectiveRate = useMemo(() => (pricing ? effectiveGstRatePct(pricing) : 0), [pricing]);
  const gstScheduleIsPending = Boolean(pricing?.scheduledGstChange && new Date(pricing.scheduledGstChange.effectiveDate).getTime() > Date.now());

  const openDriveTypeSheet = useCallback(
    (driveType: DriveType) => {
      if (!pricing) return;
      setDriveTypeSheet({
        driveType,
        baseDraft: String(pricing.driveTypeBasePrice[driveType]),
        perFloorDraft: String(Math.round(pricing.perFloorIncrementPct[driveType] * 1000) / 10),
      });
    },
    [pricing],
  );
  const closeDriveTypeSheet = useCallback(() => setDriveTypeSheet(null), []);
  const setDriveTypeDraft = useCallback((patch: Partial<Pick<DriveTypeSheetState, 'baseDraft' | 'perFloorDraft'>>) => {
    setDriveTypeSheet((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const saveDriveTypeSheet = useCallback(async () => {
    if (!pricing || !driveTypeSheet) return false;
    const base = Number(driveTypeSheet.baseDraft);
    const perFloorPct = Number(driveTypeSheet.perFloorDraft) / 100;
    if (Number.isNaN(base) || Number.isNaN(perFloorPct)) return false;
    setSaving(true);
    try {
      const updated = await repository.updatePricingConfig({
        driveTypeBasePrice: { ...pricing.driveTypeBasePrice, [driveTypeSheet.driveType]: base },
        perFloorIncrementPct: { ...pricing.perFloorIncrementPct, [driveTypeSheet.driveType]: perFloorPct },
      });
      setPricing(updated);
      setDriveTypeSheet(null);
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [repository, pricing, driveTypeSheet]);

  const openMarginSheet = useCallback(() => {
    if (!pricing) return;
    setMarginDraft(String(pricing.minimumMarginFloorPct));
    setMarginLoweringConfirmed(false);
    setMarginSheetOpen(true);
  }, [pricing]);
  const closeMarginSheet = useCallback(() => setMarginSheetOpen(false), []);

  const saveMarginSheet = useCallback(async () => {
    if (!pricing) return false;
    const next = Number(marginDraft);
    if (Number.isNaN(next) || next <= 0) return false;
    const isLowering = next < pricing.minimumMarginFloorPct;
    if (isLowering && !marginLoweringConfirmed) return false;
    setSaving(true);
    try {
      const updated = await repository.updatePricingConfig({ minimumMarginFloorPct: next });
      setPricing(updated);
      setMarginSheetOpen(false);
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [repository, pricing, marginDraft, marginLoweringConfirmed]);

  const openGstSheet = useCallback(() => {
    if (!pricing) return;
    setGstRateDraft(String(pricing.scheduledGstChange?.newRatePct ?? pricing.gstRatePct));
    setGstDateDraft(pricing.scheduledGstChange?.effectiveDate.slice(0, 10) ?? '');
    setGstSheetOpen(true);
  }, [pricing]);
  const closeGstSheet = useCallback(() => setGstSheetOpen(false), []);

  const saveGstSheet = useCallback(async () => {
    if (!pricing) return false;
    const rate = Number(gstRateDraft);
    if (Number.isNaN(rate) || rate < 0) return false;
    const isFutureDate = gstDateDraft !== '' && new Date(gstDateDraft).getTime() > Date.now();
    setSaving(true);
    try {
      const updated = await repository.updatePricingConfig(
        isFutureDate
          ? { scheduledGstChange: { newRatePct: rate, effectiveDate: new Date(gstDateDraft).toISOString() } }
          : { gstRatePct: rate, scheduledGstChange: undefined },
      );
      setPricing(updated);
      setGstSheetOpen(false);
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [repository, pricing, gstRateDraft, gstDateDraft]);

  const cancelScheduledGst = useCallback(async () => {
    if (!pricing) return false;
    setSaving(true);
    try {
      const updated = await repository.updatePricingConfig({ scheduledGstChange: undefined });
      setPricing(updated);
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [repository, pricing]);

  const openAmcSheet = useCallback(
    (tier: AmcPricingTier['tier']) => {
      const existing = pricing?.amcTiers.find((t) => t.tier === tier);
      if (!existing) return;
      setAmcSheet({ tier, priceDraft: String(existing.annualPrice), responseDraft: String(existing.responseTimeHours) });
    },
    [pricing],
  );
  const closeAmcSheet = useCallback(() => setAmcSheet(null), []);
  const setAmcDraft = useCallback((patch: Partial<Pick<AmcSheetState, 'priceDraft' | 'responseDraft'>>) => {
    setAmcSheet((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const saveAmcSheet = useCallback(async () => {
    if (!pricing || !amcSheet) return false;
    const annualPrice = Number(amcSheet.priceDraft);
    const responseTimeHours = Number(amcSheet.responseDraft);
    if (Number.isNaN(annualPrice) || Number.isNaN(responseTimeHours) || annualPrice <= 0 || responseTimeHours <= 0) return false;
    setSaving(true);
    try {
      const amcTiers = pricing.amcTiers.map((t) => (t.tier === amcSheet.tier ? { ...t, annualPrice, responseTimeHours } : t));
      const updated = await repository.updatePricingConfig({ amcTiers });
      setPricing(updated);
      setAmcSheet(null);
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [repository, pricing, amcSheet]);

  return {
    status,
    pricing,
    effectiveGstRatePct: effectiveRate,
    gstScheduleIsPending,
    saving,
    driveTypeSheet,
    openDriveTypeSheet,
    closeDriveTypeSheet,
    setDriveTypeDraft,
    saveDriveTypeSheet,
    marginSheetOpen,
    marginDraft,
    marginLoweringConfirmed,
    openMarginSheet,
    closeMarginSheet,
    setMarginDraft,
    setMarginLoweringConfirmed,
    saveMarginSheet,
    gstSheetOpen,
    gstRateDraft,
    gstDateDraft,
    openGstSheet,
    closeGstSheet,
    setGstRateDraft,
    setGstDateDraft,
    saveGstSheet,
    cancelScheduledGst,
    amcSheet,
    openAmcSheet,
    closeAmcSheet,
    setAmcDraft,
    saveAmcSheet,
    reload: load,
  };
}
