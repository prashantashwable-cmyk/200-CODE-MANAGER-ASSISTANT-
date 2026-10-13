import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Clock, Link as LinkIcon, UserSwitch } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  SegBar,
  Select,
  Sheet,
  Tabs,
  useToast,
} from '@/design-system';
import { useAlertsBoard } from './useAlertsBoard';
import { AGE_FILTERS, ALERTS_BOARD_KEYS as K } from './alerts-board.types';
import type { ExceptionRow } from './alerts-board.types';

/** Where each alert category is actually resolved. */
const CATEGORY_TARGET: Record<string, string> = {
  safety: '/admin/escalations',
  sla_breach: '/admin/analytics/funnel',
  payment: '/admin/analytics/finance',
  automation: '/admin/analytics/automation',
  quality: '/admin/site-visits',
  staffing: '/admin/map',
  supplier: '/admin/analytics/suppliers',
};

/**
 * Screen 029 — Alerts & Exceptions Dashboard. The deliberate single home for
 * everything the automation could not fully resolve on its own. Nothing here
 * is a copy of its source record — resolving it in either place clears it in
 * both, because both read the same alert.
 */
export function AlertsBoardView() {
  const { t } = useTranslation();
  const toast = useToast();
  const s = useAlertsBoard();
  const [delegateTarget, setDelegateTarget] = useState<ExceptionRow | null>(null);
  const [delegateName, setDelegateName] = useState('');

  if (s.status === 'loading') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="list" rows={6} />
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

  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <Tabs
        label={t(K.statusFilter.open)}
        value={s.showResolved ? 'resolved' : 'open'}
        onChange={(id) => s.setShowResolved(id === 'resolved')}
        items={[
          { id: 'open', label: t(K.statusFilter.open) },
          { id: 'resolved', label: t(K.statusFilter.resolved) },
        ]}
        className="mb-3"
      />

      <div className="row wrap gap-3 mb-3">
        <SegBar
          label={t(K.ageFilter.all)}
          value={s.ageFilter}
          onChange={(id) => s.setAgeFilter(id as typeof s.ageFilter)}
          items={AGE_FILTERS.map((a) => ({ id: a, label: t(K.ageFilter[a]) }))}
        />
      </div>

      <div className="row wrap gap-2 mb-4">
        {s.categories.map((category) => (
          <Button
            key={category}
            size="sm"
            variant={s.activeCategories.includes(category) ? 'primary' : 'ghost'}
            onClick={() => s.toggleCategory(category)}
          >
            {t(K.category[category as keyof typeof K.category])}
          </Button>
        ))}
      </div>

      {s.selectedIds.length > 0 && (
        <Card className="mb-3">
          <div className="row between gap-3">
            <span className="t-sm">{s.selectedIds.length}</span>
            <Button
              size="sm"
              onClick={() =>
                void s.bulkAcknowledge().then(() => toast.push(t(K.bulkAcknowledged), 'success'))
              }
            >
              {t(K.bulkAcknowledge, { count: s.selectedIds.length })}
            </Button>
          </div>
        </Card>
      )}

      {s.status === 'empty' || s.rows.length === 0 ? (
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      ) : (
        <>
          <p className="t-xs t-muted mb-2">{t(K.criticalFirst)}</p>
          <div className="stack gap-2">
            {s.rows.map((row) => (
              <ExceptionCard
                key={row.alert.id}
                row={row}
                selected={s.selectedIds.includes(row.alert.id)}
                onSelect={() => s.toggleSelect(row.alert.id)}
                onSnooze={(hours) => {
                  void s.snooze(row.alert, hours).then((ok) => toast.push(ok ? t(K.snoozed) : t(K.actionFailed), ok ? 'success' : 'error'));
                }}
                onDelegateClick={() => setDelegateTarget(row)}
                delegatedTo={row.alert.delegatedToUserId ? s.staff.find((u) => u.id === row.alert.delegatedToUserId)?.name : undefined}
              />
            ))}
          </div>
        </>
      )}

      <p className="t-xs t-muted mt-4">{t(K.liveLinkNote)}</p>

      <Sheet
        open={!!delegateTarget}
        onClose={() => setDelegateTarget(null)}
        title={t(K.delegateTo)}
        closeLabel={t('action.close')}
        footer={
          <div className="row gap-2">
            <Button
              disabled={!delegateName || !delegateTarget}
              onClick={() => {
                if (!delegateTarget) return;
                const person = s.staff.find((u) => u.id === delegateName);
                void s.delegate(delegateTarget.alert, delegateName).then((ok) => {
                  toast.push(ok ? t(K.delegated, { name: person?.name ?? '' }) : t(K.actionFailed), ok ? 'success' : 'error');
                  if (ok) {
                    setDelegateTarget(null);
                    setDelegateName('');
                  }
                });
              }}
            >
              {t(K.delegate)}
            </Button>
            <Button variant="quiet" onClick={() => setDelegateTarget(null)}>
              {t('action.cancel')}
            </Button>
          </div>
        }
      >
        {delegateTarget && <p className="t-sm mb-2">{t(delegateTarget.alert.titleKey)} · {delegateTarget.alert.code}</p>}
        <Select aria-label={t(K.delegateTo)} value={delegateName} onChange={(e) => setDelegateName(e.target.value)}>
          <option value="">{t(K.delegatePick)}</option>
          {s.staff.map((u) => (
            <option key={u.id} value={u.id}>{`${u.name} · ${t(`role.${u.role}`)}`}</option>
          ))}
        </Select>
        <p className="t-xs t-muted mt-2">{t(K.delegateNote)}</p>
      </Sheet>
    </Screen>
  );
}

function ExceptionCard({
  row,
  selected,
  onSelect,
  onSnooze,
  onDelegateClick,
  delegatedTo,
}: {
  row: ExceptionRow;
  selected: boolean;
  onSelect: () => void;
  onSnooze: (hours: number) => void;
  onDelegateClick: () => void;
  delegatedTo?: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { alert } = row;
  const target = CATEGORY_TARGET[alert.category];

  return (
    <Card selected={alert.severity === 'critical'}>
      <div className="row-top gap-3">
        {alert.status !== 'resolved' && (
          <span className="mt-1">
            <Checkbox checked={selected} onChange={onSelect} label={<span className="sr-only">select</span>} />
          </span>
        )}
        <div className="grow stack gap-2">
          <div className="row between gap-2">
            <span className="t-sm t-semibold">{t(alert.titleKey)}</span>
            <Badge tone={alert.severity === 'critical' ? 'error' : alert.severity === 'high' ? 'warning' : 'neutral'}>
              {t(`severity.${alert.severity}`)}
            </Badge>
          </div>
          <p className="t-xs t-muted">{alert.context}</p>
          <div className="row wrap gap-2">
            <Badge tone="neutral">{t(K.category[alert.category])}</Badge>
            <Badge tone="neutral">{t(K.ageHours, { hours: row.ageHours })}</Badge>
            {alert.status === 'resolved' && <Badge tone="success">{t(K.resolvedElsewhere)}</Badge>}
            {delegatedTo && (
              <Badge tone="accent">
                <UserSwitch size={12} /> {delegatedTo}
              </Badge>
            )}
          </div>
          {row.relatedIds.length > 0 && (
            <p className="t-xs t-muted row gap-1">
              <LinkIcon size={12} className="shrink-0" />
              {t(K.related, { codes: row.relatedIds.join(', ') })}
            </p>
          )}

          {alert.status !== 'resolved' && (
            <div className="row gap-2 wrap mt-1">
              {target && (
                <Button size="sm" onClick={() => navigate(target)}>
                  {t(K.openInto)}
                </Button>
              )}
              <Button size="sm" variant="ghost" icon={<Clock size={13} />} onClick={() => onSnooze(24)}>
                {t(K.snooze)}
              </Button>
              <Button size="sm" variant="quiet" icon={<UserSwitch size={13} />} onClick={onDelegateClick}>
                {t(K.delegate)}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
