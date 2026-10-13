import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUp,
  CheckCircle,
  CurrencyInr,
  Lightning,
  MapPinLine,
  Prohibit,
  Sparkle,
  Warning,
  Wrench,
} from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  formatDate,
  formatINR,
  formatTime,
  relativeTimeParts,
} from '@/design-system';
import type { ActivityEvent, ActivityKind } from '@/data/types';
import { useActivityFeed } from './useActivityFeed';
import {
  ACTIVITY_KEYS as K,
  DEEP_LINK_BY_KIND,
  FEED_MODULES,
  MODULE_BY_KIND,
} from './activity-feed.types';

const KIND_ICON: Partial<Record<ActivityKind, ReactNode>> = {
  lead_captured: <MapPinLine size={16} />,
  lead_stage_changed: <Sparkle size={16} />,
  quote_sent: <Sparkle size={16} />,
  deal_won: <CheckCircle size={16} />,
  deal_lost: <Prohibit size={16} />,
  payment_received: <CurrencyInr size={16} />,
  job_started: <Wrench size={16} />,
  job_step_completed: <Wrench size={16} />,
  job_completed: <CheckCircle size={16} />,
  qc_passed: <CheckCircle size={16} />,
  qc_failed: <Warning size={16} />,
  surveyor_checked_in: <MapPinLine size={16} />,
  technician_checked_in: <MapPinLine size={16} />,
  automation_ran: <Lightning size={16} />,
  alert_raised: <Warning size={16} />,
};

/**
 * Screen 012 — Live Activity Feed. One true timeline: every automated action
 * the system takes is logged here exactly as a human action would be, so an
 * admin can reconstruct the whole day without opening anything else.
 */
export function ActivityFeedView() {
  const { t, i18n } = useTranslation();
  const s = useActivityFeed();

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="list" rows={6} />
      </Screen>
    );
  }

  if (s.status === 'error') {
    return (
      <Screen>
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

  return (
    <Screen>
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <div className="stack gap-3 mb-3">
        <div className="row wrap gap-2">
          {FEED_MODULES.map((module) => (
            <Chip
              key={module}
              pressed={s.activeModules.includes(module)}
              onClick={() => s.toggleModule(module)}
            >
              {t(K.module[module])}
            </Chip>
          ))}
        </div>

        <div className="row gap-2 wrap">
          <label className="grow" style={{ maxWidth: 260 }}>
            <span className="sr-only">{t(K.filterByPerson)}</span>
            <Select
              value={s.actorFilter ?? ''}
              onChange={(e) => s.setActorFilter(e.target.value || null)}
            >
              <option value="">{t(K.allPeople)}</option>
              {s.actors.map((actor) => (
                <option key={actor} value={actor}>
                  {actor}
                </option>
              ))}
            </Select>
          </label>
          {s.hasFilters && (
            <Button size="sm" variant="quiet" onClick={s.clearFilters}>
              {t('action.clearFilters')}
            </Button>
          )}
        </div>
      </div>

      {/* New events wait here rather than shifting the list under the reader. */}
      {s.pendingCount > 0 && (
        <div className="mb-3">
          <Button size="sm" icon={<ArrowUp size={15} />} onClick={s.showPending}>
            {t(K.newEvents, { count: s.pendingCount })}
          </Button>
        </div>
      )}

      {s.status === 'empty' ? (
        <EmptyState
          title={t(K.empty.title)}
          body={t(K.empty.body)}
          actionLabel={s.hasFilters ? t('action.clearFilters') : undefined}
          onAction={s.hasFilters ? s.clearFilters : undefined}
        />
      ) : (
        <div className="stack gap-4">
          {s.days.map((day) => (
            <section key={day.date}>
              <h2 className="label mb-2">{formatDate(day.date, i18n.language)}</h2>
              <Card flush>
                {day.events.map((event) => (
                  <FeedRow key={event.id} event={event} />
                ))}
              </Card>
            </section>
          ))}

          <div className="row center">
            {s.hasMore ? (
              <Button variant="ghost" onClick={s.loadMore}>
                {t(K.loadMore)}
              </Button>
            ) : (
              <span className="t-xs t-muted">{t(K.allLoaded)}</span>
            )}
          </div>
        </div>
      )}
    </Screen>
  );
}

function FeedRow({ event }: { event: ActivityEvent }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const relative = relativeTimeParts(event.at);
  const target = DEEP_LINK_BY_KIND[event.kind];
  // Automated actors are logged identically to people, but it should still be
  // obvious which is which when reading the timeline back.
  const isAutomated = event.actorName === 'Automation' || event.actorName === 'Quality bot';

  const tone =
    event.severity === 'error'
      ? 't-error'
      : event.severity === 'warning'
        ? 't-warning'
        : event.severity === 'success'
          ? 't-success'
          : 't-emerald';

  return (
    <div className="hairline-top">
      <button
        type="button"
        className="ds-listrow"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className={`shrink-0 ${tone}`}>{KIND_ICON[event.kind]}</span>
        <span className="grow stack gap-1" style={{ minWidth: 0 }}>
          <span className="t-sm truncate">
            <span className="t-medium">{event.actorName}</span>
            {' · '}
            {t(K.kind[event.kind])}
          </span>
          <span className="t-xs t-muted truncate">{event.subject}</span>
        </span>
        <span className="shrink-0 stack items-end gap-1">
          <span className="t-xs t-muted num">{formatTime(event.at, i18n.language)}</span>
          {isAutomated && <Badge tone="neutral">{t(K.automated)}</Badge>}
        </span>
      </button>

      {expanded && (
        <div className="stack gap-2 p-3" style={{ paddingTop: 0 }}>
          <div className="row gap-2 wrap">
            <Badge tone="neutral">{t(K.module[MODULE_BY_KIND[event.kind]])}</Badge>
            <Badge tone="neutral">{t(relative.key, { count: relative.count })}</Badge>
            {event.amount !== undefined && (
              <Badge tone="success">
                <span className="num">{formatINR(event.amount)}</span>
              </Badge>
            )}
          </div>
          {event.detail && <p className="t-sm t-muted">{event.detail}</p>}

          {/* A record that was later deleted or merged still renders as a row —
              it just says so, rather than offering a link into nothing. */}
          {target ? (
            <div>
              <Button size="sm" variant="ghost" onClick={() => navigate(target)}>
                {t('action.viewDetails')}
              </Button>
            </div>
          ) : (
            <p className="t-xs t-muted">{t(K.recordGone)}</p>
          )}
        </div>
      )}
    </div>
  );
}
