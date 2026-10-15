import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, EmptyState, ErrorState, ListRow, LoadingState, ProgressBar, Screen, ScreenHeader, formatINR, useToast } from '@/design-system';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { ProjectView } from '@/features/projects/types';

export function ProjectsScreen() {
  const { t } = useTranslation();
  const repository = useData();
  const { user } = useSession();
  const toast = useToast();
  const uid = user?.id ?? '';
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setState('loading');
    try { setProjects(await repository.listProjects(uid)); setState('ready'); } catch { setState('error'); }
  }, [repository, uid]);
  useEffect(() => { void load(); }, [load]);

  const acknowledge = async (quoteId: string) => {
    setBusy(true);
    try { await repository.acknowledgeHandover(uid, quoteId); toast.push(t('projects.acknowledgedOk')); await load(); }
    catch (e) { toast.push(t(`projects.problem.${e instanceof Error ? e.message : ''}`, { defaultValue: t('projects.error.action') })); }
    finally { setBusy(false); }
  };

  return (
    <Screen width="default">
      <ScreenHeader title={t('projects.title')} subtitle={t('projects.subtitle')} />
      <p className="text-sm"><Link to="/complaints" data-testid="pj-open-complaints">{t('projects.openComplaints')}</Link></p>
      {state === 'loading' && <LoadingState label={t('projects.loading')} rows={3} />}
      {state === 'error' && <ErrorState title={t('projects.error.title')} body={t('projects.error.body')} retryLabel={t('projects.retry')} onRetry={() => void load()} />}
      {state === 'ready' && projects.length === 0 && <EmptyState title={t('projects.empty.title')} body={t('projects.empty.body')} />}
      {state === 'ready' && projects.length > 0 && (
        <div className="stack gap-4">
          {projects.map((p) => {
            const h = p.handover;
            return (
              <Card key={p.quoteId} title={`${p.siteName} · ${p.code}`}>
                <div className="stack gap-3" data-testid={`pj-${p.quoteId}`}>
                  <div className="stack gap-1">
                    <div className="row gap-2"><strong data-testid={`pj-percent-${p.quoteId}`}>{`${p.percent}%`}</strong><span className="text-sm text-muted">{t('projects.progressLabel')}</span></div>
                    <ProgressBar value={p.percent / 100} tone={p.percent === 100 ? 'success' : 'accent'} label={t('projects.progressLabel')} />
                    {p.amounts && <p className="text-sm text-muted">{t('projects.amounts', { verified: formatINR(p.amounts.verifiedInr), paid: formatINR(p.amounts.paidInr), total: formatINR(p.amounts.totalInr) })}</p>}
                  </div>
                  {p.orders.map((o) => <ListRow key={o.id} title={`${o.code} · ${t(`workOrders.kinds.${o.kind}`)}`} subtitle={o.partnerName} trailing={<Badge tone={o.status === 'completed' ? 'success' : 'neutral'}>{t(`projects.status.${o.status}`)}</Badge>} />)}
                  <div className="stack gap-2" data-testid={`pj-handover-${p.quoteId}`}>
                    <strong>{t('projects.handoverTitle')}</strong>
                    {h.complete && <Badge tone="success">{t('projects.complete')}</Badge>}
                    {h.parties.map((x) => <ListRow key={`${x.role}:${x.accountId}`} title={`${t(`projects.role.${x.role}`)}${x.mine ? ` · ${t('projects.you')}` : ''}`} subtitle={x.name} trailing={<Badge tone={x.signed ? 'success' : 'neutral'}>{x.signed ? t('projects.signed') : t('projects.waiting')}</Badge>} />)}
                    {!h.complete && !h.ready && <p className="text-sm text-muted">{t('projects.notReady')}</p>}
                    {!h.complete && h.qcMissing && <p className="text-sm text-muted" data-testid={`pj-qc-missing-${p.quoteId}`}>{t('projects.qcMissing')}</p>}
                    {h.canAcknowledge && <Button disabled={busy} onClick={() => void acknowledge(p.quoteId)}>{t('projects.acknowledge')}</Button>}
                    <p className="text-sm text-muted">{t('projects.notNoc')}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Screen>
  );
}
