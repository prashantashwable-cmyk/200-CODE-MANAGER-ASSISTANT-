import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, Checkbox, EmptyState, ErrorState, ListRow, LoadingState, Screen, ScreenHeader, formatDate, formatINR, useToast } from '@/design-system';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { CustomerQuoteView } from '@/features/quotes/types';

export function MyQuoteScreen() {
  const { t, i18n } = useTranslation();
  const repository = useData();
  const { user } = useSession();
  const toast = useToast();
  const uid = user?.id ?? '';
  const [view, setView] = useState<CustomerQuoteView | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setState('loading');
    try { setView(await repository.getMyQuote(uid)); setState('ready'); } catch { setState('error'); }
  }, [repository, uid]);
  useEffect(() => { void load(); }, [load]);

  const q = view?.quote;
  const open = q ? q.components.filter((c) => !c.acceptedAt) : [];
  const toggle = (id: string) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const accept = async () => {
    if (!q || picked.size === 0) return;
    setBusy(true);
    try { setView(await repository.acceptQuoteComponents(uid, q.id, [...picked])); setPicked(new Set()); toast.push(t('myQuote.accepted')); }
    catch { toast.push(t('myQuote.error.accept')); } finally { setBusy(false); }
  };

  return (
    <Screen width="narrow">
      <ScreenHeader title={t('myQuote.title')} subtitle={q ? `${q.siteName} · ${q.code}` : undefined} />
      <Card><p className="text-sm" data-testid="mq-disclosure">{t('myQuote.disclosure')}</p></Card>
      {state === 'loading' && <LoadingState label={t('myQuote.loading')} rows={3} />}
      {state === 'error' && <ErrorState title={t('myQuote.error.title')} body={t('myQuote.error.body')} retryLabel={t('myQuote.retry')} onRetry={() => void load()} />}
      {state === 'ready' && !q && <EmptyState title={t('myQuote.empty.title')} body={t('myQuote.empty.body')} />}
      {state === 'ready' && q && (
        <div className="stack gap-4">
          <Card title={t('myQuote.parts')}>
            <p className="text-sm text-muted">{t('myQuote.partsNote')}</p>
            {q.components.map((c) => (
              <div key={c.id} className="stack gap-1">
                <ListRow title={c.partnerName} subtitle={`${t(`myQuote.kinds.${c.kind}`)} · ${c.description}`} trailing={formatINR(c.partnerPriceInr)} />
                {c.acceptedAt ? <span data-testid="mq-accepted"><Badge tone="success">{t('myQuote.acceptedOn', { date: formatDate(c.acceptedAt, i18n.language) })}</Badge></span>
                  : <Checkbox checked={picked.has(c.id)} onChange={() => toggle(c.id)} label={t('myQuote.accept', { partner: c.partnerName })} />}
              </div>
            ))}
          </Card>
          <Card title={t('myQuote.platformFee')}>
            <ListRow title={t('myQuote.feeLine')} subtitle={t('myQuote.feeNote')} trailing={formatINR(q.totals.feeInr)} />
            {q.bundleDiscountInr > 0 && <p className="text-sm text-muted">{t('myQuote.discountApplied', { amount: formatINR(q.bundleDiscountInr) })}</p>}
            <ListRow title={t('myQuote.gst')} trailing={formatINR(q.totals.gstOnFeeInr)} />
          </Card>
          <Card title={t('myQuote.total')}>
            <ListRow title={t('myQuote.partnersTotal')} trailing={formatINR(q.totals.partnerTotalInr)} />
            <ListRow title={t('myQuote.grand')} trailing={<strong>{formatINR(q.totals.customerTotalInr)}</strong>} />
            <ListRow title={t('myQuote.token')} subtitle={t('myQuote.tokenNote')} trailing={formatINR(view!.tokenInr)} />
          </Card>
          {open.length > 0 && <Button onClick={() => void accept()} disabled={busy || picked.size === 0}>{t('myQuote.acceptSelected', { count: picked.size })}</Button>}
          {open.length === 0 && <Badge tone="success">{t('myQuote.allAccepted')}</Badge>}
        </div>
      )}
    </Screen>
  );
}
