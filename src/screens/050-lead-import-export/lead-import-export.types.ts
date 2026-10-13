/** Screen 050 — Bulk Lead Import/Export. Types and translation keys only. */

export type ImportStep = 'upload' | 'mapping' | 'preview' | 'done';

export const REQUIRED_IMPORT_FIELDS = ['builderName', 'contactName', 'contactPhone', 'siteName', 'city'] as const;
export const OPTIONAL_IMPORT_FIELDS = ['address', 'pincode', 'estimatedValue'] as const;
export type ImportField = (typeof REQUIRED_IMPORT_FIELDS)[number] | (typeof OPTIONAL_IMPORT_FIELDS)[number];
export const ALL_IMPORT_FIELDS: ImportField[] = [...REQUIRED_IMPORT_FIELDS, ...OPTIONAL_IMPORT_FIELDS];

export const LEAD_IMPORT_EXPORT_KEYS = {
  title: 'leadImportExport.title',
  subtitle: 'leadImportExport.subtitle',

  field: {
    builderName: 'leadImportExport.field.builderName',
    contactName: 'leadImportExport.field.contactName',
    contactPhone: 'leadImportExport.field.contactPhone',
    siteName: 'leadImportExport.field.siteName',
    city: 'leadImportExport.field.city',
    address: 'leadImportExport.field.address',
    pincode: 'leadImportExport.field.pincode',
    estimatedValue: 'leadImportExport.field.estimatedValue',
  },

  upload: {
    heading: 'leadImportExport.upload.heading',
    body: 'leadImportExport.upload.body',
    chooseFile: 'leadImportExport.upload.chooseFile',
    invalidFile: 'leadImportExport.upload.invalidFile',
  },
  mapping: {
    heading: 'leadImportExport.mapping.heading',
    body: 'leadImportExport.mapping.body',
    columnLabel: 'leadImportExport.mapping.columnLabel',
    required: 'leadImportExport.mapping.required',
    optional: 'leadImportExport.mapping.optional',
    rowCount: 'leadImportExport.mapping.rowCount',
    continue: 'leadImportExport.mapping.continue',
    back: 'leadImportExport.mapping.back',
  },
  preview: {
    heading: 'leadImportExport.preview.heading',
    validCount: 'leadImportExport.preview.validCount',
    errorCount: 'leadImportExport.preview.errorCount',
    rowLabel: 'leadImportExport.preview.rowLabel',
    duplicateNote: 'leadImportExport.preview.duplicateNote',
    commit: 'leadImportExport.preview.commit',
    back: 'leadImportExport.preview.back',
    error: {
      missing_builderName: 'leadImportExport.preview.error.missing_builderName',
      missing_contactName: 'leadImportExport.preview.error.missing_contactName',
      missing_contactPhone: 'leadImportExport.preview.error.missing_contactPhone',
      missing_siteName: 'leadImportExport.preview.error.missing_siteName',
      missing_city: 'leadImportExport.preview.error.missing_city',
      invalid_phone: 'leadImportExport.preview.error.invalid_phone',
    },
  },
  done: {
    heading: 'leadImportExport.done.heading',
    summary: 'leadImportExport.done.summary',
    importAnother: 'leadImportExport.done.importAnother',
    viewLeads: 'leadImportExport.done.viewLeads',
  },
  history: {
    heading: 'leadImportExport.history.heading',
    empty: 'leadImportExport.history.empty',
    row: 'leadImportExport.history.row',
  },
  exportSection: {
    heading: 'leadImportExport.exportSection.heading',
    body: 'leadImportExport.exportSection.body',
    button: 'leadImportExport.exportSection.button',
    perScreenNote: 'leadImportExport.exportSection.perScreenNote',
  },
  toast: {
    exported: 'leadImportExport.toast.exported',
    imported: 'leadImportExport.toast.imported',
    error: 'leadImportExport.toast.error',
  },
} as const;
