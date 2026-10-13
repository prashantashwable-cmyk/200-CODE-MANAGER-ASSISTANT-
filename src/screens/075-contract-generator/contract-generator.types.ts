/** Screen 075 — Digital Contract Generator. Types and translation keys only. */

import type { ContractClauseKey } from '@/data/types';

export type ContractGeneratorStatus = 'loading' | 'ready' | 'error';

export const CLAUSE_ORDER: ContractClauseKey[] = [
  'scope',
  'price_and_payment',
  'installation_and_liability',
  'warranty_and_amc',
  'state_compliance',
];

export const CONTRACT_GENERATOR_KEYS = {
  title: 'contractGenerator.title',
  loading: 'contractGenerator.loading',
  error: { title: 'contractGenerator.error.title', body: 'contractGenerator.error.body' },

  notConfirmed: {
    title: 'contractGenerator.notConfirmed.title',
    body: 'contractGenerator.notConfirmed.body',
    goToTerms: 'contractGenerator.notConfirmed.goToTerms',
  },

  readyToGenerate: {
    title: 'contractGenerator.readyToGenerate.title',
    body: 'contractGenerator.readyToGenerate.body',
  },

  clause: {
    scope: 'contractGenerator.clause.scope',
    price_and_payment: 'contractGenerator.clause.price_and_payment',
    installation_and_liability: 'contractGenerator.clause.installation_and_liability',
    warranty_and_amc: 'contractGenerator.clause.warranty_and_amc',
    state_compliance: 'contractGenerator.clause.state_compliance',
  },

  legalTextLabel: 'contractGenerator.legalTextLabel',
  fallbackBanner: 'contractGenerator.fallbackBanner',
  versionLabel: 'contractGenerator.versionLabel',
  generatedOn: 'contractGenerator.generatedOn',

  priorVersions: {
    heading: 'contractGenerator.priorVersions.heading',
    supersededLabel: 'contractGenerator.priorVersions.supersededLabel',
  },

  addenda: {
    heading: 'contractGenerator.addenda.heading',
    empty: 'contractGenerator.addenda.empty',
    addButton: 'contractGenerator.addenda.addButton',
    sheetTitle: 'contractGenerator.addenda.sheetTitle',
    sheetHint: 'contractGenerator.addenda.sheetHint',
    noteLabel: 'contractGenerator.addenda.noteLabel',
    submit: 'contractGenerator.addenda.submit',
    addedBy: 'contractGenerator.addenda.addedBy',
  },

  actions: {
    generate: 'contractGenerator.actions.generate',
    regenerate: 'contractGenerator.actions.regenerate',
    proceedToSignature: 'contractGenerator.actions.proceedToSignature',
  },

  toast: {
    generated: 'contractGenerator.toast.generated',
    regenerated: 'contractGenerator.toast.regenerated',
    addendumAdded: 'contractGenerator.toast.addendumAdded',
    error: 'contractGenerator.toast.error',
  },
} as const;
