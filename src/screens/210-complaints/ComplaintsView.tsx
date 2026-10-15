import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, EmptyState, ErrorState, Field, ListRow, LoadingState, Screen, ScreenHeader, Select, TextArea, formatDate, useToast } from '@/design-system';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { COMPLAINT_CATEGORIES, COMPLAINT_OUTCOMES, NOTE_MIN, REPLY_MIN, TEXT_MIN, raiseProblem, replyProblem, resolveProblem } from '@/features/complaints/complaint';
import type { ComplaintCategory, ComplaintOutcome, TrustSummary } from '@/features/complaints/complaint';
import { trustSummaryText } from '@/features/complaints/complaint';
import type { ComplaintView } from '@/features/complaints/types';
import type { ProjectView } from '@/features/projects/types';

const STATUS_TONE = { open: 'warning', acknowledged: 'accent', resolved: 'success' } as const;

export function ComplaintsScreen() {
  const { t, i18n } = useTranslation();
  const repository = useData();
  const { user } = useSession();
  const toast = useToast();
  const uid = user?.id ?? '';
  const isCustomer = user?.role === 'customer';
  const isOwner = user?.role === 'owner';
  const [items, setItems] = useState<ComplaintView[]>([]);
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [trust, setTrust] = useState<Record<string, TrustSummary>>({});
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{ quoteId: string; orderId: string; category: ComplaintCategory; text: string; clientId: string }>({ quoteId: '', orderId: '', category: 'defect', text: '', clientId: crypto.randomUUID() });
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [res, setRes] = useState<Record<string, { outcome: ComplaintOutcome; note: string }>>({});

  const load = useCallback(async () => {
    setState('loading');
    try {
      const [c, p] = await Promise.all([repository.listComplaints(uid), repository.listProjects(uid)]);
      setItems(c); setProjects(p);
      if (user?.role === 'owner' || user?.role === 'admin') {
        const accounts = [...new Set(c.map((x) => x.partnerAccountId).filter((x): x is string => !!x))];
        const entries = await Promise.all(accounts.map(async (a) => [a, await repository.getPartnerTrust(uid, a)] as const));
        setTrust(Object.fromEntries(entries));
      }
      setState('ready');
    } catch { setState('error'); }
  }, [repository, uid, user?.role]);
  useEffect(() => { void load(); }, [load]);

  const run = async (fn: () => Promise<unknown>, okKey: string) => {
    setBusy(true);
    try { await fn(); toast.push(t(okKey)); await load(); }
    catch (e) { toast.push(t(`complaints.problem.${e instanceof Error ? e.message : ''}`, { defaultValue: t('complaints.error.action') })); }
    finally { setBusy(false); }
  };

  const project = projects.find((p) => p.quoteId === form.quoteId);
  const raiseBad = form.quoteId ? raiseProblem({ category: form.category, text: form.text }) : 'text_short';
  const siteOf = (c: ComplaintView) => c.siteName || projects.find((p) => p.quoteId === c.quoteId)?.siteName || c.code;

  return (
    <Screen width="default">
      <ScreenHeader title={t('complaints.title')} subtitle={t('complaints.subtitle')} />
      {state === 'loading' && <LoadingState label={t('complaints.loading')} rows={3} />}
      {state === 'error' && <ErrorState title={t('complaints.error.title')} body={t('complaints.error.body')} retryLabel={t('complaints.retry')} onRetry={() => void load()} />}
      {state === 'ready' && (
        <div className="stack gap-4">
          {isCustomer && projects.length > 0 && (
            <Card title={t('complaints.raiseTitle')}>
              <div className="stack gap-2" data-testid="cp-form">
                <Field label={t('complaints.project')}>{({ id }) => (
                  <Select id={id} value={form.quoteId} onChange={(e) => setForm({ ...form, quoteId: e.target.value, orderId: '' })}>
                    <option value="">{t('complaints.chooseProject')}</option>
                    {projects.map((p) => <option key={p.quoteId} value={p.quoteId}>{`${p.siteName} · ${p.code}`}</option>)}
                  </Select>
                )}</Field>
                {project && (
                  <Field label={t('complaints.about')}>{({ id }) => (
                    <Select id={id} value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })}>
                      <option value="">{t('complaints.aboutAll')}</option>
                      {project.orders.map((o) => <option key={o.id} value={o.id}>{`${o.code} · ${o.partnerName}`}</option>)}
                    </Select>
                  )}</Field>
                )}
                <Field label={t('complaints.category')}>{({ id }) => (
                  <Select id={id} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ComplaintCategory })}>
                    {COMPLAINT_CATEGORIES.map((c) => <option key={c} value={c}>{t(`complaints.categories.${c}`)}</option>)}
                  </Select>
                )}</Field>
                {form.category === 'safety' && <p className="text-sm" data-testid="cp-safety-note">{t('complaints.safetyNote')}</p>}
                <Field label={t('complaints.describe')} hint={t('complaints.describeHint', { min: TEXT_MIN })}>{({ id }) => <TextArea id={id} rows={4} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />}</Field>
                <Button disabled={busy || raiseBad !== null} onClick={() => void run(async () => { await repository.raiseComplaint(uid, { quoteId: form.quoteId, ...(form.orderId ? { workOrderId: form.orderId } : {}), category: form.category, text: form.text, clientId: form.clientId }); setForm({ quoteId: '', orderId: '', category: 'defect', text: '', clientId: crypto.randomUUID() }); }, 'complaints.raisedOk')}>{t('complaints.raise')}</Button>
              </div>
            </Card>
          )}
          {items.length === 0 && <EmptyState title={t('complaints.empty.title')} body={t(isCustomer ? 'complaints.empty.customer' : 'complaints.empty.other')} />}
          {items.map((c) => {
            const r = res[c.id] ?? { outcome: 'upheld' as ComplaintOutcome, note: '' };
            const bad = resolveProblem({ status: c.status }, r);
            const tr = c.partnerAccountId ? trust[c.partnerAccountId] : undefined;
            return (
              <Card key={c.id} title={`${c.code} · ${siteOf(c)}`}>
                <div className="stack gap-2" data-testid={`cp-${c.id}`}>
                  <div className="row gap-2">
                    <Badge tone={STATUS_TONE[c.status]}>{t(`complaints.status.${c.status}`)}</Badge>
                    <Badge tone="neutral">{t(`complaints.categories.${c.category}`)}</Badge>
                    {c.overdue && !isCustomer && <Badge tone="error" >{t('complaints.overdue')}</Badge>}
                  </div>
                  <p className="text-sm">{c.description}</p>
                  <p className="text-sm text-muted">{t('complaints.raisedOn', { date: formatDate(c.createdAt, i18n.language) })}{c.workOrderCode ? ` · ${c.workOrderCode}` : ''}{c.partnerName ? ` · ${c.partnerName}` : ''}</p>
                  {c.status !== 'resolved' && <p className="text-sm text-muted">{t('complaints.dueBy', { date: formatDate(c.ackDueAt, i18n.language) })}</p>}
                  {tr && <ListRow title={t('complaints.partnerRecord')} subtitle={t(`complaints.trust.${trustSummaryText(tr)}`)} trailing={<span className="text-sm" data-testid={`cp-trust-${c.id}`}>{t('complaints.trustCounts', { verified: tr.verifiedMilestones, raised: tr.complaintsRaised, upheld: tr.complaintsUpheld })}</span>} />}
                  {c.status === 'resolved' && c.outcome && <p data-testid={`cp-outcome-${c.id}`}><strong>{t(`complaints.outcome.${c.outcome}`)}</strong>{c.resolutionNote ? `: ${c.resolutionNote}` : ''}</p>}
                  {c.partnerReply && <p className="text-sm" data-testid={`cp-reply-${c.id}`}><strong>{t('complaints.partnerReplyTitle')}</strong>: {c.partnerReply}</p>}
                  {c.can.reply && (
                    <div className="stack gap-2">
                      <Field label={t('complaints.replyLabel')} hint={t('complaints.replyHint', { min: REPLY_MIN })}>{({ id }) => <TextArea id={id} rows={3} value={replies[c.id] ?? ''} onChange={(e) => setReplies({ ...replies, [c.id]: e.target.value })} />}</Field>
                      <Button disabled={busy || replyProblem({ status: c.status }, replies[c.id] ?? '') !== null} onClick={() => void run(() => repository.replyToComplaint(uid, c.id, replies[c.id] ?? ''), 'complaints.repliedOk')}>{t('complaints.reply')}</Button>
                    </div>
                  )}
                  {c.can.acknowledge && <Button disabled={busy} onClick={() => void run(() => repository.acknowledgeComplaint(uid, c.id), 'complaints.acknowledgedOk')}>{t('complaints.acknowledge')}</Button>}
                  {c.can.resolve && isOwner && (
                    <div className="stack gap-2">
                      <Field label={t('complaints.outcomeLabel')}>{({ id }) => (
                        <Select id={id} value={r.outcome} onChange={(e) => setRes({ ...res, [c.id]: { ...r, outcome: e.target.value as ComplaintOutcome } })}>
                          {COMPLAINT_OUTCOMES.map((o) => <option key={o} value={o}>{t(`complaints.outcome.${o}`)}</option>)}
                        </Select>
                      )}</Field>
                      <Field label={t('complaints.noteLabel')} hint={t('complaints.noteHint', { min: NOTE_MIN })}>{({ id }) => <TextArea id={id} rows={3} value={r.note} onChange={(e) => setRes({ ...res, [c.id]: { ...r, note: e.target.value } })} />}</Field>
                      <Button disabled={busy || bad !== null} onClick={() => void run(() => repository.resolveComplaint(uid, c.id, r.outcome, r.note), 'complaints.resolvedOk')}>{t('complaints.resolve')}</Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Screen>
  );
}
