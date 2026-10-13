import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Bell } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Sheet,
  formatDate,
  formatINR,
  formatTime,
  relativeTimeParts,
  useToast,
} from '@/design-system';
import type { WorkItem } from '@/data/repository';
import type { Commitment, Role, User } from '@/data/types';
import { useAssistantDrawer } from './useAssistantDrawer';

/** The bell every role sees in the shell — the assistant's front door. */
export function AssistantBell({
  unread,
  onClick,
  variant,
}: {
  unread: number;
  onClick: () => void;
  variant: 'topbar' | 'sidebar';
}) {
  const { t } = useTranslation();
  const label = unread > 0 ? t('work.bellUnread', { count: unread }) : t('work.bell');
  return (
    <button
      type="button"
      className={variant === 'sidebar' ? 'shell__side-item shell__bell shell__bell--side' : 'tappable shell__bell'}
      onClick={onClick}
      aria-label={label}
    >
      <Bell size={22} weight={unread > 0 ? 'fill' : 'regular'} />
      {variant === 'sidebar' && <span className="grow">{t('work.bell')}</span>}
      {unread > 0 && <span className="shell__bell-count">{unread > 99 ? '99+' : unread}</span>}
    </button>
  );
}

function commitmentTitle(t: (key: string, params?: Record<string, string>) => string, c: Commitment): string {
  return t(c.titleKey, { ...c.titleParams, amount: c.amount != null ? formatINR(c.amount) : '' });
}

function overdueFor(dueAt: string, now: number): { key: string; count: number } {
  const minutesLate = Math.max(1, Math.floor((now - new Date(dueAt).getTime()) / 60_000));
  if (minutesLate < 60) return { key: 'work.duration.minutes', count: minutesLate };
  if (minutesLate < 48 * 60) return { key: 'work.duration.hours', count: Math.floor(minutesLate / 60) };
  return { key: 'work.duration.days', count: Math.floor(minutesLate / 1440) };
}

/**
 * Screen-independent assistant: every role's own promises, most urgent
 * first, each one tap from where it gets done. Not a numbered screen — the
 * later dashboards (180, 193) read the same Commitments rather than keep
 * their own lists.
 */
export function AssistantDrawer({
  open,
  onClose,
  user,
  role,
  tick,
  onRead,
}: {
  open: boolean;
  onClose: () => void;
  user: User | null;
  role: Role | null;
  tick: number;
  onRead: () => void;
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useAssistantDrawer(open, user?.id, role, tick, onRead);
  const now = Date.now();

  const go = (route: string) => {
    onClose();
    navigate(route);
  };

  const dueLine = (item: WorkItem) => {
    const { dueAt } = item.commitment;
    if (item.dueState === 'overdue') {
      const late = overdueFor(dueAt, now);
      return t('work.due.overdue', { time: t(late.key, { count: late.count }) });
    }
    if (item.dueState === 'due_today') return t('work.due.today', { time: formatTime(dueAt, i18n.language) });
    return t('work.due.upcoming', { date: formatDate(dueAt, i18n.language) });
  };

  const renderItem = (item: WorkItem, mode: 'mine' | 'escalated') => {
    const c = item.commitment;
    return (
      <Card key={c.id}>
        <div className="row between gap-2" style={{ alignItems: 'flex-start' }}>
          <span className="t-sm t-semibold grow" style={{ minWidth: 0 }}>
            {commitmentTitle(t, c)}
          </span>
          {item.dueState === 'overdue' && <Badge tone="error">{t('work.notification.overdue')}</Badge>}
          {item.dueState === 'due_today' && <Badge tone="warning">{t('time.today')}</Badge>}
        </div>
        <p className="t-xs t-muted mt-1">
          {dueLine(item)}
          {mode === 'mine' && item.escalatedToName ? ` · ${t('work.escalatedTo', { name: item.escalatedToName })}` : ''}
          {mode === 'escalated' ? ` · ${t('work.owner', { name: item.ownerName })}` : ''}
        </p>
        <div className="row gap-2 wrap mt-2">
          <Button size="sm" variant="ghost" onClick={() => go(mode === 'mine' ? c.actionRoute : c.oversightRoute)}>
            {t('work.open')}
          </Button>
          {mode === 'mine' && item.quickAction && (
            <Button
              size="sm"
              loading={s.busyCommitmentId === c.id}
              onClick={() =>
                void s
                  .runQuickAction(c.id)
                  .then((ok) => toast.push(t(ok ? 'work.quickDone' : 'work.quickFailed'), ok ? 'success' : 'error'))
              }
            >
              {t(`work.quick.${item.quickAction}`)}
            </Button>
          )}
        </div>
      </Card>
    );
  };

  const relative = (iso: string) => {
    const parts = relativeTimeParts(iso, now);
    return t(parts.key, { count: parts.count });
  };

  const hasAnything =
    (s.work?.mine.length ?? 0) + (s.work?.escalatedToMe.length ?? 0) + s.notifications.length + s.doneForYou.length > 0;

  return (
    <Sheet open={open} onClose={onClose} title={t('work.heading')} closeLabel={t('action.close')}>
      <p className="t-sm t-muted mb-2">{t('work.subtitle')}</p>
      {s.reliability && (
        <p className="t-xs mb-3">
          {s.reliability.onTimePct !== null
            ? t('work.reliability', { pct: s.reliability.onTimePct, count: s.reliability.completed })
            : t('work.reliabilityTooEarly')}
        </p>
      )}

      {s.status === 'loading' && <LoadingState label={t('work.loading')} rows={3} />}

      {s.status === 'error' && (
        <ErrorState
          title={t('work.error.title')}
          body={t('work.error.body')}
          retryLabel={t('action.retry')}
          onRetry={() => void s.reload()}
        />
      )}

      {s.status === 'ready' && s.work && (
        <div className="stack gap-4">
          {!hasAnything && <EmptyState title={t('work.empty.title')} body={t('work.empty.body')} />}

          {s.work.mine.length > 0 && (
            <section className="stack gap-2">
              <h3 className="label">{t('work.section.mine')}</h3>
              {s.work.mine.map((item) => renderItem(item, 'mine'))}
              {s.work.laterCount > 0 && (
                <p className="t-xs t-muted">{t('work.laterCount', { count: s.work.laterCount })}</p>
              )}
            </section>
          )}
          {s.work.mine.length === 0 && hasAnything && (
            <p className="t-sm t-muted">{t('work.empty.title')}</p>
          )}

          {s.work.escalatedToMe.length > 0 && (
            <section className="stack gap-2">
              <h3 className="label">{t('work.section.escalated')}</h3>
              {s.work.escalatedToMe.map((item) => renderItem(item, 'escalated'))}
            </section>
          )}

          {role === 'admin' && !user?.backupUserId && (
            <p className="t-xs t-warning">{t('work.noBackup')}</p>
          )}

          {s.notifications.length > 0 && (
            <section className="stack gap-2">
              <h3 className="label">{t('work.section.updates')}</h3>
              {s.notifications.map(({ notification, commitment, ownerName }) => (
                <div key={notification.id} className="row gap-2" style={{ alignItems: 'flex-start' }}>
                  {s.freshIds.has(notification.id) && <Badge tone="accent" dot="live">{t('work.new')}</Badge>}
                  <span className="stack gap-1 grow" style={{ minWidth: 0 }}>
                    <span className="t-xs t-semibold">
                      {notification.kind === 'escalated'
                        ? t('work.notification.escalated', { name: ownerName })
                        : t(`work.notification.${notification.kind}`)}
                    </span>
                    <span className="t-xs clamp-2">{commitmentTitle(t, commitment)}</span>
                  </span>
                  <span className="t-xs t-muted shrink-0">{relative(notification.at)}</span>
                </div>
              ))}
            </section>
          )}

          {s.doneForYou.length > 0 && (
            <section className="stack gap-2">
              <h3 className="label">{t('work.section.doneForYou')}</h3>
              {s.doneForYou.map((action) => (
                <div key={action.id} className="row between gap-2">
                  <span className="t-xs grow" style={{ minWidth: 0 }}>
                    {i18n.exists(`work.auto.${action.sourceKey}`)
                      ? t(`work.auto.${action.sourceKey}`, { label: action.subjectLabel ?? '' })
                      : action.sourceKey}
                  </span>
                  <span className="t-xs t-muted shrink-0">{relative(action.at)}</span>
                </div>
              ))}
            </section>
          )}

          <p className="t-xs t-muted">{t('work.heartbeatNote')}</p>
        </div>
      )}
    </Sheet>
  );
}
