import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkle, Trophy } from '@phosphor-icons/react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  ListRow,
  LoadingState,
  MapCanvas,
  Screen,
  ScreenHeader,
  formatPercent,
  useToast,
} from '@/design-system';
import type { MapMarker } from '@/design-system';
import { useRouteOptimize } from './useRouteOptimize';
import { MAX_REASONABLE_KM, ROUTE_OPTIMIZE_KEYS as K } from './route-optimize.types';
import type { Candidate } from './route-optimize.types';

/**
 * Screen 020 — Route Optimization / Best-Match Suggestion. Every unassigned
 * task gets a sensible top pick without the admin manually checking everyone's
 * location and workload — but the suggestion is advisory; the admin decides.
 */
export function RouteOptimizeView() {
  const { t } = useTranslation();
  const toast = useToast();
  const s = useRouteOptimize();

  const markers = useMemo<MapMarker[]>(() => {
    if (!s.selectedTask) return [];
    const list: MapMarker[] = [
      {
        id: s.selectedTask.id,
        lat: s.selectedTask.location.lat,
        lng: s.selectedTask.location.lng,
        tone: 'warning',
        glyph: '!',
        label: s.selectedTask.title,
      },
    ];
    s.candidates.forEach((candidate, index) => {
      if (!candidate.user.location) return;
      list.push({
        id: candidate.user.id,
        lat: candidate.user.location.lat,
        lng: candidate.user.location.lng,
        tone: index === 0 ? 'success' : 'accent',
        glyph: String(index + 1),
        label: candidate.user.name,
      });
    });
    return list;
  }, [s.selectedTask, s.candidates]);

  const assignTo = (candidate: Candidate) => {
    const task = s.selectedTask;
    if (!task) return;
    void s.assign(task, candidate).then((result) => {
      if (result === 'assigned') {
        toast.push(t(K.assigned, { name: candidate.user.name, task: task.title }), 'success');
      } else if (typeof result === 'object') {
        const known = result.failed in K.reason;
        toast.push(t(K.assignFailed, { reason: known ? t(K.reason[result.failed as keyof typeof K.reason]) : t(K.error.body) }), 'error');
      }
    });
  };

  if (s.status === 'loading') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
      </Screen>
    );
  }

  if (s.status === 'error') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <ErrorState
          title={t(K.error.title)}
          body={t(K.error.body)}
          retryLabel={t('action.retry')}
          onRetry={() => void s.reload()}
        />
      </Screen>
    );
  }

  if (s.status === 'empty') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      </Screen>
    );
  }

  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <h2 className="label mb-2">{t(K.taskList)}</h2>
      <Card flush className="mb-4">
        {s.tasks.map((task) => (
          <ListRow
            key={task.id}
            title={task.title}
            subtitle={`${t(K.kind[task.kind])} · ${task.address}`}
            trailing={
              s.conflictTaskId === task.id ? (
                <Badge tone="warning">{t(K.alreadyAssigned)}</Badge>
              ) : task.id === s.selectedTask?.id ? (
                <Badge tone="accent">{t('action.viewDetails')}</Badge>
              ) : undefined
            }
            onClick={() => s.selectTask(task)}
          />
        ))}
      </Card>

      {s.selectedTask && (
        <>
          <MapCanvas label={t(K.mapLabel)} markers={markers} height={280} />

          <h2 className="t-lg mt-4 mb-2">{t(K.candidates)}</h2>

          {s.candidates.length === 0 ? (
            <Card title={t(K.noneEligible)} body={t(K.noneEligibleBody)} />
          ) : (
            <div className="stack gap-2">
              {s.candidates.map((candidate, index) => (
                <CandidateCard
                  key={candidate.user.id}
                  candidate={candidate}
                  rank={index}
                  busy={s.busyUserId === candidate.user.id}
                  onAssign={() => assignTo(candidate)}
                />
              ))}
            </div>
          )}

          {s.notOffered.length > 0 && (
            <>
              <h2 className="label mt-4 mb-2">{t(K.notOffered)}</h2>
              <Card flush>
                {s.notOffered.map((c) => (
                  <ListRow
                    key={c.user.id}
                    leading={<Avatar name={c.user.name} />}
                    title={c.user.name}
                    subtitle={c.unavailableReason ? t(K.reason[c.unavailableReason]) : t(K.tooFar, { km: MAX_REASONABLE_KM })}
                    // Distance is only a suggestion: someone further away can still be chosen. A rule (training, tier, leave) cannot be overridden here.
                    trailing={
                      c.unavailable ? undefined : (
                        <Button size="sm" variant="ghost" loading={s.busyUserId === c.user.id} onClick={() => assignTo(c)}>
                          {t(K.assign)}
                        </Button>
                      )
                    }
                  />
                ))}
              </Card>
            </>
          )}

          <p className="t-xs t-muted mt-3">{t(K.overrideNote)}</p>
        </>
      )}
    </Screen>
  );
}

function CandidateCard({
  candidate,
  rank,
  busy,
  onAssign,
}: {
  candidate: Candidate;
  rank: number;
  busy: boolean;
  onAssign: () => void;
}) {
  const { t } = useTranslation();
  const isTop = rank === 0;

  return (
    <Card selected={isTop} riseIndex={rank}>
      <div className="row gap-3">
        <Avatar name={candidate.user.name} />
        <div className="stack gap-1 grow">
          <span className="row gap-2">
            <span className="t-md t-semibold">{candidate.user.name}</span>
            {isTop && (
              <Badge tone="success">
                <Trophy size={12} />
                {t(K.topPick)}
              </Badge>
            )}
            {candidate.isNewJoiner && <Badge tone="neutral">{t(K.newJoiner)}</Badge>}
          </span>
          <div className="row wrap gap-3 t-xs t-muted">
            <span>
              {t(K.field.distance)}: <span className="num">{candidate.distanceKm} km</span>
            </span>
            <span>
              {t(K.field.eta)}: <span className="num">{candidate.etaMinutes} min</span>
            </span>
            <span>
              {t(K.field.workload)}: <span className="num">{candidate.currentWorkload}</span>
            </span>
            <span>
              {t(K.field.skillMatch)}: <span className="num">{formatPercent(candidate.skillMatch, 0)}</span>
            </span>
          </div>
        </div>
        <Button
          size="sm"
          variant={isTop ? 'primary' : 'ghost'}
          icon={<Sparkle size={14} />}
          loading={busy}
          onClick={onAssign}
        >
          {t(K.assign)}
        </Button>
      </div>
    </Card>
  );
}
