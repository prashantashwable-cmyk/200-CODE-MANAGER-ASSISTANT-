import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, EmptyState, ErrorState, Field, Input, ListRow, LoadingState, Screen, ScreenHeader, Select, formatDate, formatINR, useToast } from '@/design-system';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { FacilitatorQuote } from '@/features/quotes/types';
import { mayVerify, skipsWorkOrder } from '@/features/workorders/workOrder';
import type { PartnerAccount, ProviderStatus, WorkOrderView } from '@/features/workorders/types';

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
  const [accounts, setAccounts] = useState<PartnerAccount[]>([]);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [text, setText] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const isOwner = user?.role === 'owner';

  const load = useCallback(async () => {
    setState('loading');
    try {
      const [o, p, q, a] = await Promise.all([repository.listWorkOrders(uid), repository.getProviderStatus(uid), isOwner ? repository.listFacilitatorQuotes(uid) : Promise.resolve([] as FacilitatorQuote[]), isOwner ? repository.listPartnerAccounts(uid) : Promise.resolve([] as PartnerAccount[])]);
      setOrders(o); setProviders(p); setAccounts(a); setQuotes(q.filter((x) => x.components.some((c) => c.acceptedAt))); setState('ready');
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
  /** Accepted components that still need a work order: one account to bind to each, chosen by the Owner. */
  const todoOf = (q: FacilitatorQuote) => q.components.filter((c) => c.acceptedAt && !skipsWorkOrder(c.kind) && !orders.some((w) => w.quoteId === q.id && w.lineId === c.id));

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
          {isOwner && quotes.map((q) => {
            const todo = todoOf(q);
            const passThrough = q.components.filter((c) => c.acceptedAt && skipsWorkOrder(c.kind));
            if (todo.length === 0 && passThrough.length === 0) return null;
            const ready = todo.length > 0 && todo.every((c) => picks[`${q.id}:${c.id}`]);
            return (
              <Card key={q.id} title={`${t('workOrders.fromQuotes')} · ${q.code} · ${q.siteName}`}>
                <div className="stack gap-2" data-testid={`wo-issue-${q.id}`}>
                  {todo.map((c) => (
                    <Field key={c.id} label={`${c.partnerName} · ${t(`workOrders.kinds.${c.kind}`)} · ${formatINR(c.partnerPriceInr)}`}>
                      {({ id }) => (
                        <Select id={id} value={picks[`${q.id}:${c.id}`] ?? ''} onChange={(e) => setPicks({ ...picks, [`${q.id}:${c.id}`]: e.target.value })}>
                          <option value="">{t('workOrders.chooseAccount')}</option>
                          {accounts.map((a) => <option key={a.id} value={a.id}>{`${a.name} · ${t(`workOrders.accountRole.${a.role}`)}`}</option>)}
                        </Select>
                      )}
                    </Field>
                  ))}
                  {passThrough.length > 0 && <p className="text-sm text-muted" data-testid="wo-pass-through">{t('workOrders.passThrough', { count: passThrough.length })}</p>}
                  {todo.length > 0 && accounts.length === 0 && <p className="text-sm text-muted">{t('workOrders.noAccounts')}</p>}
                  {todo.length > 0 && <Button disabled={busy || !ready} onClick={() => void run(() => repository.createWorkOrdersFromQuote(uid, q.id, Object.fromEntries(todo.map((c) => [c.id, picks[`${q.id}:${c.id}`]]))), 'workOrders.created')}>{t('workOrders.create')}</Button>}
                </div>
              </Card>
            );
          })}
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
                      {m.evidence.length > 0 && <p className="text-sm text-muted" data-testid={`wo-evidence-${m.id}`}>{t('workOrders.evidenceSent', { names: m.evidence.join(', ') })}</p>}
                      {m.status === 'waiting' && w.can.submitEvidence && (
                        <div className="row gap-2">
                          <Field label={t('workOrders.evidence')}>{({ id }) => <Input id={id} value={text[k] ?? ''} placeholder={t('workOrders.evidenceHint')} onChange={(e) => setText({ ...text, [k]: e.target.value })} />}</Field>
                          <Button size="sm" disabled={busy} onClick={() => void run(() => repository.submitMilestoneEvidence(uid, w.id, m.id, (text[k] ?? '').split(',')), 'workOrders.evidenceOk')}>{t('workOrders.submit')}</Button>
                        </div>
                      )}
                      {w.status === 'in_progress' && m.qcInspectorId && <p className="text-sm text-muted" data-testid={`wo-qc-${m.id}`}>{m.qcInspectorName ? t('workOrders.qcCheckedBy', { name: m.qcInspectorName }) : t('workOrders.qcCheckedByNamed')}</p>}
                      {w.can.assignQc && m.status !== 'verified' && m.status !== 'payment_recorded' && m.status !== 'closed' && (
                        <div className="row gap-2">
                          <Field label={t('workOrders.qcPick')}>{({ id }) => (
                            <Select id={id} value={picks[`qc:${k}`] ?? ''} onChange={(e) => setPicks({ ...picks, [`qc:${k}`]: e.target.value })}>
                              <option value="">{t('workOrders.qcChoose')}</option>
                              {accounts.filter((a) => a.role === 'technician' && a.id !== w.partnerAccountId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </Select>
                          )}</Field>
                          <Button size="sm" disabled={busy} onClick={() => void run(() => repository.assignMilestoneInspector(uid, w.id, m.id, picks[`qc:${k}`] ?? ''), 'workOrders.qcAssignedOk')}>{t('workOrders.qcAssign')}</Button>
                        </div>
                      )}
                      {m.status === 'evidence_submitted' && mayVerify({ role: user?.role, callerId: uid, partnerAccountId: w.partnerAccountId, inspectorId: m.qcInspectorId, orderOpen: w.status === 'in_progress' }) && <Button size="sm" disabled={busy} onClick={() => void run(() => repository.verifyMilestone(uid, w.id, m.id), 'workOrders.verifiedOk')}>{t('workOrders.verify')}</Button>}
                      {m.status === 'verified' && w.can.recordPayment && (
                        <div className="row gap-2">
                          <Field label={t('workOrders.reference')}>{({ id }) => <Input id={id} value={text[k] ?? ''} onChange={(e) => setText({ ...text, [k]: e.target.value })} />}</Field>
                          <Button size="sm" disabled={busy} onClick={() => void run(() => repository.recordMilestonePayment(uid, w.id, m.id, text[k] ?? ''), 'workOrders.paymentOk')}>{t('workOrders.recordPayment')}</Button>
                        </div>
                      )}
                      {m.status === 'payment_recorded' && w.can.confirmPayment && <Button size="sm" disabled={busy} onClick={() => void run(() => repository.confirmMilestonePayment(uid, w.id, m.id), 'workOrders.confirmedOk')}>{t('workOrders.confirmPayment')}</Button>}
                      {m.status === 'payment_recorded' && !w.can.confirmPayment && <p className="text-sm text-muted" data-testid={`wo-await-${m.id}`}>{t('workOrders.awaitingConfirm')}</p>}
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
