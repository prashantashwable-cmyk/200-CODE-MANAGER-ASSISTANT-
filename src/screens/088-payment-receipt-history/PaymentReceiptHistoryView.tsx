import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bank, CreditCard, Download, Money, Printer, Receipt } from '@phosphor-icons/react';
import { Button, Card, EmptyState, ErrorState, Input, ListRow, LoadingState, Screen, ScreenHeader, Select, Sheet, formatDate, formatINR } from '@/design-system';
import type { PaymentReceiptLine } from '@/data/repository';
import { usePaymentReceiptHistory, receiptDateOf } from './usePaymentReceiptHistory';
import { EXPORT_CSV_FILENAME, METHOD_FILTERS, PAYMENT_RECEIPT_HISTORY_KEYS as K, downloadCsv, toCsv } from './payment-receipt-history.types';

const MONTH_LOCALE: Record<string, string> = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };

const METHOD_ICON: Record<string, typeof Money> = {
  upi: Money,
  netbanking: Bank,
  neft: Bank,
  card: CreditCard,
  cash: Money,
  cheque: Bank,
  financing: Bank,
};

export function PaymentReceiptHistoryView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const s = usePaymentReceiptHistory();

  const groups = useMemo(() => {
    const map = new Map<string, PaymentReceiptLine[]>();
    for (const line of s.filteredLines) {
      const d = new Date(receiptDateOf(line));
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const list = map.get(key) ?? [];
      list.push(line);
      map.set(key, list);
    }
    return [...map.entries()].map(([key, lines]) => ({
      key,
      label: new Date(receiptDateOf(lines[0])).toLocaleDateString(MONTH_LOCALE[i18n.language] ?? 'en-IN', { month: 'long', year: 'numeric' }),
      lines,
    }));
  }, [s.filteredLines, i18n.language]);

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="list" rows={5} />
      </Screen>
    );
  }

  if (s.status === 'error') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  const exportCsv = () => {
    const csv = toCsv(
      [t(K.export.header.date), t(K.export.header.deal), t(K.export.header.site), t(K.export.header.customer), t(K.export.header.stage), t(K.export.header.amount), t(K.export.header.method), t(K.export.header.invoice)],
      s.filteredLines.map((l) => [
        formatDate(receiptDateOf(l), i18n.language),
        l.dealCode,
        l.siteName,
        l.customerName,
        t(`finance.paymentStage.${l.payment.stage}`),
        l.receivedAmount,
        l.payment.method ? t(K.method[l.payment.method as keyof typeof K.method]) : '',
        l.invoiceCode ?? '',
      ]),
    );
    downloadCsv(EXPORT_CSV_FILENAME, csv);
  };

  return (
    <Screen>
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      {!s.isAdmin && (
        <div className="grid-2 mb-4">
          <Card>
            <span className="t-xs t-muted">{t(K.kpi.paidToDate)}</span>
            <div className="t-2xl num t-medium mt-2">{formatINR(s.totalPaidToDate)}</div>
          </Card>
          <Card>
            <span className="t-xs t-muted">{t(K.kpi.remaining)}</span>
            <div className="t-2xl num t-medium mt-2">{formatINR(s.totalRemaining)}</div>
          </Card>
        </div>
      )}

      <div className="stack gap-2 mb-4">
        {(s.isAdmin || s.dealOptions.length > 1) && (
          <Select value={s.dealFilter} onChange={(e) => s.setDealFilter(e.target.value)}>
            <option value="all">{t(K.filters.dealAll)}</option>
            {s.dealOptions.map((d) => (
              <option key={d.code} value={d.code}>
                {d.label}
              </option>
            ))}
          </Select>
        )}
        <Select value={s.methodFilter} onChange={(e) => s.setMethodFilter(e.target.value)}>
          <option value="all">{t(K.filters.methodAll)}</option>
          {METHOD_FILTERS.map((m) => (
            <option key={m} value={m}>
              {t(K.method[m as keyof typeof K.method])}
            </option>
          ))}
        </Select>
        <div className="row gap-2">
          <div className="grow stack gap-1">
            <span className="label">{t(K.filters.from)}</span>
            <Input type="date" value={s.dateFrom} onChange={(e) => s.setDateFrom(e.target.value)} />
          </div>
          <div className="grow stack gap-1">
            <span className="label">{t(K.filters.to)}</span>
            <Input type="date" value={s.dateTo} onChange={(e) => s.setDateTo(e.target.value)} />
          </div>
        </div>
        {s.isAdmin && (
          <Button size="sm" variant="secondary" icon={<Download size={16} />} onClick={exportCsv} disabled={s.filteredLines.length === 0}>
            {t(K.export.button)}
          </Button>
        )}
      </div>

      {s.allLines.length === 0 ? (
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      ) : s.filteredLines.length === 0 ? (
        <EmptyState title={t(K.noResults.title)} body={t(K.noResults.body)} />
      ) : (
        <div className="stack gap-4">
          {groups.map((group) => (
            <div key={group.key} className="stack gap-2">
              <span className="t-xs t-muted t-semibold">{group.label}</span>
              <div className="stack gap-2">
                {group.lines.map((line) => {
                  const Icon = line.payment.method ? (METHOD_ICON[line.payment.method] ?? Receipt) : Receipt;
                  return (
                    <ListRow
                      key={line.payment.id}
                      onClick={() => s.openReceipt(line.payment.id)}
                      leading={<Icon size={22} className="t-emerald" />}
                      title={t(K.row.stageLine, { stage: t(`finance.paymentStage.${line.payment.stage}`) })}
                      subtitle={s.isAdmin ? `${line.customerName} · ${line.dealCode}` : formatDate(receiptDateOf(line), i18n.language)}
                      trailing={<span className="t-sm num t-medium">{formatINR(line.receivedAmount)}</span>}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={!!s.selectedLine} onClose={s.closeReceipt} title={t(K.detail.heading)} closeLabel={t('action.close')}>
        {s.selectedLine && (
          <div className="stack gap-3">
            <div className="row between">
              <span className="t-sm t-muted">{t(K.detail.amountReceived)}</span>
              <span className="t-lg num t-medium">{formatINR(s.selectedLine.receivedAmount)}</span>
            </div>
            <div className="row between hairline-top">
              <span className="t-sm t-muted">{t(K.detail.date)}</span>
              <span className="t-sm">{formatDate(receiptDateOf(s.selectedLine), i18n.language)}</span>
            </div>
            <div className="row between">
              <span className="t-sm t-muted">{t(K.detail.method)}</span>
              <span className="t-sm">{s.selectedLine.payment.method ? t(K.method[s.selectedLine.payment.method as keyof typeof K.method]) : '—'}</span>
            </div>
            {(s.selectedLine.payment.gatewayTransactionRef || s.selectedLine.payment.manualReferenceNumber) && (
              <div className="row between">
                <span className="t-sm t-muted">{t(K.detail.reference)}</span>
                <span className="t-sm num">{s.selectedLine.payment.gatewayTransactionRef ?? s.selectedLine.payment.manualReferenceNumber}</span>
              </div>
            )}
            <div className="row between hairline-top">
              <span className="t-sm t-muted">{t(K.detail.deal)}</span>
              <span className="t-sm">{s.selectedLine.dealCode} · {s.selectedLine.siteName}</span>
            </div>
            <div className="row between">
              <span className="t-sm t-muted">{t(K.detail.stage)}</span>
              <span className="t-sm">{t(`finance.paymentStage.${s.selectedLine.payment.stage}`)}</span>
            </div>
            {s.isAdmin && (
              <div className="row between">
                <span className="t-sm t-muted">{t(K.detail.customer)}</span>
                <span className="t-sm">{s.selectedLine.customerName}</span>
              </div>
            )}
            <div className="row between hairline-top">
              <span className="t-sm t-muted">{t(K.detail.invoice)}</span>
              <span className="t-sm">{s.selectedLine.invoiceCode ?? t(K.detail.invoicePending)}</span>
            </div>

            <Button variant="secondary" onClick={() => navigate(`/deals/${s.selectedLine!.payment.dealId}/invoices`)}>
              {t(K.detail.viewInvoice)}
            </Button>
            <Button variant="ghost" icon={<Printer size={16} />} onClick={() => window.print()}>
              {t(K.detail.print)}
            </Button>
          </div>
        )}
      </Sheet>
    </Screen>
  );
}
