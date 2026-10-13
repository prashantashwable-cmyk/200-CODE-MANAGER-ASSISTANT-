import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, EmptyState, ErrorState, ListRow, LoadingState, Screen, ScreenHeader, StatTile, formatDateTime } from '@/design-system';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { DecisionListView } from '@/data/repository';

export function OwnerHomeScreen() {
  const { t, i18n } = useTranslation();
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState<DecisionListView | null>(null);
  const [chain, setChain] = useState<{ ok: boolean; count: number } | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const uid = user?.id ?? '';

  useEffect(() => {
    let alive = true;
    setState('loading');
    Promise.all([repository.listDecisionCards(uid, { status: 'open' }), repository.verifyDecisionChain(uid)])
      .then(([list, check]) => { if (!alive) return; setOpen(list); setChain({ ok: check.ok, count: check.count }); setState('ready'); })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [repository, uid, attempt]);

  const cards = open?.cards ?? [];
  const pending = cards.filter((c) => c.status === 'pending').length;
  const waiting = cards.filter((c) => c.status === 'info_requested').length;
  return (
    <Screen width="wide">
      <ScreenHeader title={t('ownerHome.title')} subtitle={t('ownerHome.subtitle', { name: user?.name ?? '' })} action={<Button size="sm" onClick={() => navigate('/owner/decisions')}>{t('ownerHome.openDesk')}</Button>} />
      {state === 'loading' && <LoadingState label={t('ownerHome.loading')} rows={3} variant="stats" />}
      {state === 'error' && <ErrorState title={t('ownerHome.error.title')} body={t('ownerHome.error.body')} retryLabel={t('ownerHome.error.retry')} onRetry={() => setAttempt((n) => n + 1)} />}
      {state === 'ready' && (
        <div className="stack gap-4">
          <div className="grid-auto" style={{ ['--min' as string]: '180px' }}>
            <StatTile label={t('ownerHome.stat.pending')} value={pending} large />
            <StatTile label={t('ownerHome.stat.waiting')} value={waiting} />
            <StatTile label={t('ownerHome.stat.chain')} value={chain?.ok ? t('ownerHome.chain.ok', { n: chain.count }) : t('ownerHome.chain.broken')} caption={t('ownerHome.stat.chainNote')} />
          </div>
          <Card title={t('ownerHome.needs')}>
            {cards.length === 0 ? <EmptyState title={t('ownerHome.empty.title')} body={t('ownerHome.empty.body')} /> : cards.slice(0, 5).map((c) => (
              <ListRow key={c.id} title={c.title} subtitle={`${t(`decisionDesk.kind.${c.kind}`)} · ${formatDateTime(c.createdAt, i18n.language)}`} trailing={<Badge tone={c.status === 'pending' ? 'warning' : 'neutral'}>{t(`decisionDesk.status.${c.status}`)}</Badge>} onClick={() => navigate('/owner/decisions')} />
            ))}
          </Card>
        </div>
      )}
    </Screen>
  );
}
