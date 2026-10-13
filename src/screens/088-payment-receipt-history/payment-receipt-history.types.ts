/** Screen 088 — Payment Receipt & History Screen. Types, pure helpers and translation keys only. */

export type PaymentHistoryScreenStatus = 'loading' | 'ready' | 'error';

export const METHOD_FILTERS: string[] = ['upi', 'netbanking', 'neft', 'card', 'cash', 'cheque', 'financing'];

/** Quotes a CSV field only when it needs it (contains a comma, quote or
 *  newline) — the same minimal-escaping rule any spreadsheet import
 *  expects. Small and self-contained rather than reused from screen
 *  050's own csv.ts, since screens never import from another screen's
 *  folder. */
function csvField(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: (string | number)[][]): string {
  return [headers, ...rows].map((row) => row.map(csvField).join(',')).join('\n');
}

/** Triggers a real, working file download for the CSV — no server, no
 *  fabricated PDF pipeline, just the browser's own Blob/download
 *  mechanism, same honest scope as 087's window.print(). */
/** A technical file identifier, not user-facing prose — deliberately not
 *  run through the translation system (a filename shouldn't change with
 *  the viewer's language). */
export const EXPORT_CSV_FILENAME = 'aiec-payment-history.csv';

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const PAYMENT_RECEIPT_HISTORY_KEYS = {
  title: 'paymentReceiptHistory.title',
  subtitle: 'paymentReceiptHistory.subtitle',
  loading: 'paymentReceiptHistory.loading',
  error: { title: 'paymentReceiptHistory.error.title', body: 'paymentReceiptHistory.error.body' },
  empty: { title: 'paymentReceiptHistory.empty.title', body: 'paymentReceiptHistory.empty.body' },
  noResults: { title: 'paymentReceiptHistory.noResults.title', body: 'paymentReceiptHistory.noResults.body' },

  kpi: {
    paidToDate: 'paymentReceiptHistory.kpi.paidToDate',
    remaining: 'paymentReceiptHistory.kpi.remaining',
  },

  filters: {
    dealAll: 'paymentReceiptHistory.filters.dealAll',
    methodAll: 'paymentReceiptHistory.filters.methodAll',
    from: 'paymentReceiptHistory.filters.from',
    to: 'paymentReceiptHistory.filters.to',
  },

  method: {
    upi: 'paymentReceiptHistory.method.upi',
    netbanking: 'paymentReceiptHistory.method.netbanking',
    neft: 'paymentReceiptHistory.method.neft',
    card: 'paymentReceiptHistory.method.card',
    cash: 'paymentReceiptHistory.method.cash',
    cheque: 'paymentReceiptHistory.method.cheque',
    financing: 'paymentReceiptHistory.method.financing',
  },

  row: {
    stageLine: 'paymentReceiptHistory.row.stageLine',
  },

  detail: {
    heading: 'paymentReceiptHistory.detail.heading',
    amountReceived: 'paymentReceiptHistory.detail.amountReceived',
    method: 'paymentReceiptHistory.detail.method',
    date: 'paymentReceiptHistory.detail.date',
    reference: 'paymentReceiptHistory.detail.reference',
    deal: 'paymentReceiptHistory.detail.deal',
    stage: 'paymentReceiptHistory.detail.stage',
    customer: 'paymentReceiptHistory.detail.customer',
    invoice: 'paymentReceiptHistory.detail.invoice',
    invoicePending: 'paymentReceiptHistory.detail.invoicePending',
    viewInvoice: 'paymentReceiptHistory.detail.viewInvoice',
    print: 'paymentReceiptHistory.detail.print',
  },

  export: {
    button: 'paymentReceiptHistory.export.button',
    header: {
      date: 'paymentReceiptHistory.export.header.date',
      deal: 'paymentReceiptHistory.export.header.deal',
      site: 'paymentReceiptHistory.export.header.site',
      customer: 'paymentReceiptHistory.export.header.customer',
      stage: 'paymentReceiptHistory.export.header.stage',
      amount: 'paymentReceiptHistory.export.header.amount',
      method: 'paymentReceiptHistory.export.header.method',
      invoice: 'paymentReceiptHistory.export.header.invoice',
    },
  },
} as const;
