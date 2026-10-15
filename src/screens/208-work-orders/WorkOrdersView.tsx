import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, EmptyState, ErrorState, Field, Input, ListRow, LoadingState, Screen, ScreenHeader, formatDate, formatINR, useToast } from '@/design-system';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { FacilitatorQuote } from '@/features/quotes/types';
import type { ProviderStatus, WorkOrderView } from '@/features/workorders/types';

const MILESTONE_TONE = { waiting: 'neutral', evidence_submitted: 'warning', verified: 'accent', payment_recorded: 'success', closed: 'success' } as const;

export function WorkOrdersScreen() {
  const { t, i18n } = useTranslation();
  const repository = useData();
  const { user } = useSession();
  const toast = useToast();
  const uid = user?.id ?? '';
  const [orders, setOrders] = useState<WorkOrderView[]>([]);
  const [quotes, setQuotes] = useState<FacilitatorQuote[]>([]);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [text, setText] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const isOwner = user?.role === 'owner';

  const load = useCallback(async () => {
    setState('loading');
    try {
      const [o, p, q] = await Promise.all([repository.listWorkOrders(uid), repository.getProviderStatus(uid), isOwner ? repository.listFacilitatorQuotes(uid) : Promise.resolve([] as FacilitatorQuote[])]);
      setOrders(o); setProviders(p); setQuotes(q.filter((x) => x.components.some((c) => c.acceptedAt))); setState('ready');
    } catch { setState('error'); }
  }, [repository, uid, isOwner]);
  useEffect(() => { void load(); }, [load]);

  const run = async (fn: () => Promise<unknown>, okKey: string) => {
    setBusy(true);
    try { await fn(); toast.push(t(okKey)); await load(); }
    catch (e) { const code = e instanceof Error ? e.message : ''; toast.push(t(`workOrders.problem.${code}`, { defaultValue: t('workOrders.error.action') })); }
    finally { setBusy(false); }
  };
  const key = (id: string, m: string) => `${id}:${m}`;
  const off = providers.filter((p) => !p.connected);

  return (
    <Screen width="default">
      <ScreenHeader title={t('workOrders.title')} subtitle={t('workOrders.subtitle')} />
      <Card><p className="text-sm" data-testid="wo-disclosure">{t('workOrders.disclosure')}</p></Card>
      {state === 'loading' && <LoadingState label={t('workOrders.loading')} rows={3} />}
      {state === 'error' && <ErrorState title={t('workOrders.error.title')} body={t('workOrders.error.body')} retryLabel={t('workOrders.retry')} onRetry={() => void load()} />}
      {state === 'ready' && (
        <div className="stack gap-4">
          {off.length > 0 && (
            <Card title={t('workOrders.notConnected')}>
              {off.filter((p) => p.id === 'esign' || p.id === 'payments').map((p) => <p key={p.id} className="text-sm" data-testid={`wo-provider-${p.id}`}>{t(`workOrders.provider.${p.id}`)}</p>)}
            </Card>
          )}
          {isOwner && quotes.length > 0 && (
            <Card title={t('workOrders.fromQuotes')}>
              {quotes.map((q) => <ListRow key={q.id} title={`${q.code} · ${q.siteName}`} trailing={<Button size="sm" disabled={busy} onClick={() => void run(() => repository.createWorkOrdersFromQuote(uid, q.id), 'workOrders.created')}>{t('workOrders.create')}</Button>} />)}
            </Card>
          )}
          {orders.length === 0 && <EmptyState title={t('workOrders.empty.title')} body={t('workOrders.empty.body')} />}
          {orders.map((w) => (
            <Card key={w.id} title={`${w.code} · ${w.partnerName}`}>
              <div data-testid={`wo-${w.id}`} className="stack gap-2">
                <p className="text-sm text-muted">{`${w.siteName} · ${t(`workOrders.kinds.${w.kind}`)} · ${w.description}`}</p>
                <ListRow title={t('workOrders.price')} trailing={formatINR(w.priceInr)} />
                <div className="row gap-2">
                  <Badge tone={w.status === 'completed' ? 'success' : w.status === 'in_progress' ? 'accent' : 'neutral'}>{t(`workOrders.status.${w.status}`)}</Badge>
                  {w.customerAcceptedAt && <Badge tone="success">{t('workOrders.customerAccepted', { date: formatDate(w.customerAcceptedAt, i18n.language) })}</Badge>}
                  {w.partnerAcceptedAt && <Badge tone="success">{t('workOrders.partnerAccepted', { date: formatDate(w.partnerAcceptedAt, i18n.language) })}</Badge>}
                </div>
                {w.can.accept && <Button disabled={busy} onClick={() => void run(() => repository.acceptWorkOrder(uid, w.id), 'workOrders.acceptedOk')}>{t('workOrders.accept')}</Button>}
                {w.status === 'issued' && w.side === 'partner' && w.startBlock && <p className="text-sm text-muted" data-testid="wo-start-block">{t(`workOrders.problem.${w.startBlock}`)}</p>}
                {w.can.start && <Button disabled={busy} onClick={() => void run(() => repository.startWorkOrder(uid, w.id), 'workOrders.started')}>{t('workOrders.start')}</Button>}
                {w.milestones.map((m) => {
                  const k = key(w.id, m.id);
                  return (
                    <div key={m.id} className="stack gap-1" data-testid={`wo-ms-${m.id}`}>
                      <ListRow title={`${t(`workOrders.gate.${m.gate}`)} · ${m.pct}%`} subtitle={m.label} trailing={<span className="row gap-2">{formatINR(m.amountInr)}<Badge tone={MILESTONE_TONE[m.status]}>{t(`workOrders.milestone.${m.status}`)}</Badge></span>} />
                      {m.status === 'waiting' && w.can.submitEvidence && (
                        <div className="row gap-2">
                          <Field label={t('workOrders.evidence')}>{({ id }) => <Input id={id} value={text[k] ?? ''} placeholder={t('workOrders.evidenceHint')} onChange={(e) => setText({ ...text, [k]: e.target.value })} />}</Field>
                          <Button size="sm" disabled={busy} onClick={() => void run(() => repository.submitMilestoneEvidence(uid, w.id, m.id, (text[k] ?? '').split(',')), 'workOrders.evidenceOk')}>{t('workOrders.submit')}</Button>
                        </div>
                      )}
                      {m.status === 'evidence_submitted' && w.can.verify && <Button size="sm" disabled={busy} onClick={() => void run(() => repository.verifyMilestone(uid, w.id, m.id), 'workOrders.verifiedOk')}>{t('workOrders.verify')}</Button>}
                      {m.status === 'verified' && w.can.recordPayment && (
                        <div className="row gap-2">
                          <Field label={t('workOrders.reference')}>{({ id }) => <Input id={id} value={text[k] ?? ''} onChange={(e) => setText({ ...text, [k]: e.target.value })} />}</Field>
                          <Button size="sm" disabled={busy} onClick={() => void run(() => repository.recordMilestonePayment(uid, w.id, m.id, text[k] ?? ''), 'workOrders.paymentOk')}>{t('workOrders.recordPayment')}</Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Screen>
  );
}
