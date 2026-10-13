/** Screen 063 — Quotation Template & Branding. Types and translation keys only. */

import type { QuotationTemplateVariant } from '@/data/types';

export type QuotationTemplateStatus = 'loading' | 'ready' | 'error';

export const TEMPLATE_VARIANTS: QuotationTemplateVariant[] = ['residential_standard', 'premium_luxury', 'commercial_bulk'];

/** This business operates in Maharashtra — the one state override this
 *  screen manages today. Adding another state means adding another key
 *  here and to `stateOverrides`, not a data-model change. */
export const OVERRIDE_STATE = 'Maharashtra';

export const QUOTATION_TEMPLATE_KEYS = {
  title: 'quotationTemplate.title',
  subtitle: 'quotationTemplate.subtitle',
  loading: 'quotationTemplate.loading',
  error: { title: 'quotationTemplate.error.title', body: 'quotationTemplate.error.body' },

  variant: {
    residential_standard: 'quotationTemplate.variant.residential_standard',
    premium_luxury: 'quotationTemplate.variant.premium_luxury',
    commercial_bulk: 'quotationTemplate.variant.commercial_bulk',
  },

  listRow: {
    version: 'quotationTemplate.listRow.version',
    validity: 'quotationTemplate.listRow.validity',
  },

  form: {
    logoHeading: 'quotationTemplate.form.logoHeading',
    logoLabel: 'quotationTemplate.form.logoLabel',
    logoHint: 'quotationTemplate.form.logoHint',
    taglineLabel: 'quotationTemplate.form.taglineLabel',
    validityLabel: 'quotationTemplate.form.validityLabel',
    validityHint: 'quotationTemplate.form.validityHint',
    boilerplateHeading: 'quotationTemplate.form.boilerplateHeading',
    nationalLabel: 'quotationTemplate.form.nationalLabel',
    stateOverrideLabel: 'quotationTemplate.form.stateOverrideLabel',
    stateOverrideHint: 'quotationTemplate.form.stateOverrideHint',
    openQuotesNote: 'quotationTemplate.form.openQuotesNote',
    save: 'quotationTemplate.form.save',
  },

  preview: {
    heading: 'quotationTemplate.preview.heading',
    validUntil: 'quotationTemplate.preview.validUntil',
  },

  toast: {
    saved: 'quotationTemplate.toast.saved',
    error: 'quotationTemplate.toast.error',
  },
} as const;
