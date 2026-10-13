import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChatCircleText, ChatDots, Phone, UserCircle, WarningCircle } from '@phosphor-icons/react';
import { Badge, Button, Card, Chip, EmptyState, ErrorState, LoadingState, Screen, ScreenHeader, Sheet, useToast } from '@/design-system';
import { useReplyInbox } from './useReplyInbox';
import type { ReplyInboxRow } from './useReplyInbox';
import { REPLY_INBOX_KEYS as K } from './reply-inbox.types';

const CHANNEL_ICON = {
  whatsapp: <ChatCircleText size={20} className="t-emerald" />,
  sms: <ChatDots size={20} className="t-emerald" />,
  call: <Phone size={20} className="t-emerald" />,
} as const;

type ChannelFilter = 'all' | 'whatsapp' | 'sms' | 'call';

function formatWaiting(t: (key: string, opts?: Record<string, unknown>) => string, minutes: number): string {
  if (minutes < 60) return t(K.waitingMinutes, { count: minutes });
  return t(K.waitingHours, { count: Math.round(minutes / 60) });
}

export function ReplyInboxView() {
  const { t } = useTranslation();
  const toast = useToast();
  const s = useReplyInbox();
  const [filter, setFilter] = useState<ChannelFilter>('all');

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
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  const filtered = filter === 'all' ? s.rows : s.rows.filter((r) => r.channel === filter);

  return (
    <Screen>
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <div className="row wrap gap-2 mb-4">
        {(['all', 'whatsapp', 'sms', 'call'] as ChannelFilter[]).map((c) => (
          <Chip key={c} pressed={filter === c} onClick={() => setFilter(c)}>
            {c === 'all' ? t(K.allChannels) : t(K.channel[c])}
          </Chip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      ) : (
        <div className="stack gap-2">
          {filtered.map((row) => (
            <ReplyInboxRowCard
              key={row.item.kind === 'message' ? row.item.message.id : row.item.call.id}
              row={row}
              onAssign={() => s.openAssign(row.item)}
              onMarkHandled={() =>
                void s.markHandled(row.item).then((ok) => toast.push(t(ok ? K.toast.handled : K.toast.error), ok ? 'success' : 'error'))
              }
              onCallBack={() =>
                void s.callBack(row.item).then((ok) => toast.push(t(ok ? K.toast.calledBack : K.toast.error), ok ? 'success' : 'error'))
              }
            />
          ))}
        </div>
      )}

      <Sheet
        open={!!s.assigningItem}
        onClose={s.closeAssign}
        title={t(K.action.assignSheetTitle)}
        closeLabel={t(K.action.close)}
      >
        <div className="stack gap-1">
          {s.agents.map((agent) => (
            <button
              key={agent.id}
              type="button"
              className="ds-listrow"
              onClick={() => void s.assign(agent.id).then((ok) => toast.push(t(ok ? K.toast.assigned : K.toast.error), ok ? 'success' : 'error'))}
            >
              <UserCircle size={22} className="t-emerald" />
              <span className="grow t-medium">{agent.name}</span>
            </button>
          ))}
        </div>
      </Sheet>
    </Screen>
  );
}

function ReplyInboxRowCard({
  row,
  onAssign,
  onMarkHandled,
  onCallBack,
}: {
  row: ReplyInboxRow;
  onAssign: () => void;
  onMarkHandled: () => void;
  onCallBack: () => void;
}) {
  const { t } = useTranslation();
  const { item, channel, relatedCount, assignedAgentName } = row;

  return (
    <Card>
      <div className="row gap-3 items-start">
        <span className="shrink-0">{CHANNEL_ICON[channel]}</span>
        <div className="grow stack gap-1" style={{ minWidth: 0 }}>
          <div className="row between gap-2">
            <span className="t-sm t-semibold truncate">{item.lead.siteName}</span>
            <Badge tone={item.slaBreached ? 'error' : 'success'}>
              {formatWaiting(t, item.waitingMinutes)}
            </Badge>
          </div>
          <span className="t-xs t-muted truncate">{item.lead.contactName}</span>

          {item.kind === 'message' ? (
            <p className="t-sm truncate">{item.message.body}</p>
          ) : (
            <p className="t-sm t-muted">{t(K.reasonMissedCall)}</p>
          )}

          {item.slaBreached && (
            <p className="t-xs t-error row gap-1 items-center">
              <WarningCircle size={13} />
              {t(K.slaBreached)}
            </p>
          )}

          {item.kind === 'message' && (
            <span className="t-xs t-muted">
              {assignedAgentName ? t(K.assignedTo, { name: assignedAgentName }) : t(K.unassigned)}
            </span>
          )}

          {relatedCount > 0 && <span className="t-xs t-muted">{t(K.relatedNote, { count: relatedCount })}</span>}

          <div className="row wrap gap-2 mt-1">
            {item.kind === 'message' ? (
              <>
                <Button variant="ghost" size="sm" onClick={onAssign}>
                  {t(K.action.assign)}
                </Button>
                <Button variant="ghost" size="sm" onClick={onMarkHandled}>
                  {t(K.action.markHandled)}
                </Button>
              </>
            ) : (
              <Button variant="secondary" size="sm" icon={<Phone size={14} />} onClick={onCallBack}>
                {t(K.action.callBack)}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
