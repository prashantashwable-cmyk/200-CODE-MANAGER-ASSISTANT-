/** Screen 070 — Pricing Rules & Margin Configuration. Types and translation keys only. */

import type { AmcPricingTier, DriveType } from '@/data/types';

export type PricingConfigStatus = 'loading' | 'ready' | 'error';

export const DRIVE_TYPES: DriveType[] = ['hydraulic', 'geared_traction', 'gearless_traction', 'mrl', 'vacuum', 'screw_driven'];

export const AMC_TIER_ORDER: AmcPricingTier['tier'][] = ['basic', 'standard', 'comprehensive'];

/** Real-world guidance only — never enforced as a hard block, since the
 *  spec calls it "roughly" a market range, not a rule. */
export const PER_FLOOR_INCREMENT_GUIDANCE_MIN = 0.1;
export const PER_FLOOR_INCREMENT_GUIDANCE_MAX = 0.25;

export const PRICING_CONFIG_KEYS = {
  title: 'pricingConfig.title',
  subtitle: 'pricingConfig.subtitle',
  loading: 'pricingConfig.loading',
  error: { title: 'pricingConfig.error.title', body: 'pricingConfig.error.body' },

  governanceNote: 'pricingConfig.governanceNote',

  section: {
    basePricing: 'pricingConfig.section.basePricing',
    marginFloor: 'pricingConfig.section.marginFloor',
    gst: 'pricingConfig.section.gst',
    amc: 'pricingConfig.section.amc',
  },

  basePricing: {
    sheetTitle: 'pricingConfig.basePricing.sheetTitle',
    baseLabel: 'pricingConfig.basePricing.baseLabel',
    perFloorLabel: 'pricingConfig.basePricing.perFloorLabel',
    perFloorLabelInput: 'pricingConfig.basePricing.perFloorLabelInput',
    perFloorHint: 'pricingConfig.basePricing.perFloorHint',
    perFloorOutOfRange: 'pricingConfig.basePricing.perFloorOutOfRange',
    save: 'pricingConfig.basePricing.save',
  },

  marginFloor: {
    rowValue: 'pricingConfig.marginFloor.rowValue',
    sheetTitle: 'pricingConfig.marginFloor.sheetTitle',
    label: 'pricingConfig.marginFloor.label',
    riskWarning: 'pricingConfig.marginFloor.riskWarning',
    mustBePositive: 'pricingConfig.marginFloor.mustBePositive',
    loweringConfirm: 'pricingConfig.marginFloor.loweringConfirm',
    save: 'pricingConfig.marginFloor.save',
  },

  gst: {
    currentLabel: 'pricingConfig.gst.currentLabel',
    scheduledLabel: 'pricingConfig.gst.scheduledLabel',
    appliedLabel: 'pricingConfig.gst.appliedLabel',
    editSheetTitle: 'pricingConfig.gst.editSheetTitle',
    externalNote: 'pricingConfig.gst.externalNote',
    newRateLabel: 'pricingConfig.gst.newRateLabel',
    effectiveDateLabel: 'pricingConfig.gst.effectiveDateLabel',
    effectiveDateHint: 'pricingConfig.gst.effectiveDateHint',
    cancelScheduled: 'pricingConfig.gst.cancelScheduled',
    save: 'pricingConfig.gst.save',
  },

  amc: {
    sheetTitle: 'pricingConfig.amc.sheetTitle',
    priceLabel: 'pricingConfig.amc.priceLabel',
    responseLabel: 'pricingConfig.amc.responseLabel',
    responseHoursLabel: 'pricingConfig.amc.responseHoursLabel',
    save: 'pricingConfig.amc.save',
  },

  amcTierLabel: {
    basic: 'pricingConfig.amcTierLabel.basic',
    standard: 'pricingConfig.amcTierLabel.standard',
    comprehensive: 'pricingConfig.amcTierLabel.comprehensive',
  },

  toast: {
    saved: 'pricingConfig.toast.saved',
    scheduled: 'pricingConfig.toast.scheduled',
    cancelled: 'pricingConfig.toast.cancelled',
    error: 'pricingConfig.toast.error',
  },
} as const;
