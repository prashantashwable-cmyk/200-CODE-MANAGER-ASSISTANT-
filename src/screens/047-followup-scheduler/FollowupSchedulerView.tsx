import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Robot } from '@phosphor-icons/react';
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
  Select,
  Sheet,
  formatDate,
  useToast,
} from '@/design-system';
import type { FollowUpTask } from '@/data/types';
import { useFollowupScheduler } from './useFollowupScheduler';
import { FOLLOWUP_SCHEDULER_KEYS as K, RESCHEDULE_REASONS } from './followup-scheduler.types';

/**
 * Screen 047 — Follow-up Task Scheduler. A date-bucketed hybrid of the
 * calendar and list views the spec asks for — overdue always leads
 * regardless of due date, exactly as required.
 */
export function FollowupSchedulerView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useFollowupScheduler();

  const [rescheduleTarget, setRescheduleTarget] = useState<FollowUpTask | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [bulkRescheduleOpen, setBulkRescheduleOpen] = useState(false);
  const [bulkReassignOpen, setBulkReassignOpen] = useState(false);
  const [bulkDate, setBulkDate] = useState('');
  const [bulkReason, setBulkReason] = useState('');
  const [bulkAssignee, setBulkAssignee] = useState('');

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

  return (
    <Screen>
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      {s.groups.length === 0 ? (
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      ) : (
        <div className="stack gap-5">
          {s.groups.map((group) => (
            <div key={group.bucket}>
              <h2 className={`t-lg mb-2 ${group.bucket === 'overdue' ? 't-error' : ''}`}>{t(K.bucket[group.bucket])}</h2>
              <div className="stack gap-2">
                {group.tasks.map((task) => {
                  const lead = s.leadOf(task.leadId);
                  const assignee = s.assigneeOf(task.assignedTo);
                  const unavailable = assignee ? assignee.status !== 'active' || !assignee.onDuty : false;
                  return (
                    <Card key={task.id}>
                      <div className="row between items-start gap-3 mb-2">
                        <div className="stack gap-1" style={{ minWidth: 0 }}>
                          <span className="t-sm t-semibold">{task.title}</span>
                          {lead && (
                            <button type="button" className="tappable t-xs t-accent" style={{ textAlign: 'left' }} onClick={() => navigate(`/admin/leads/${lead.id}`)}>
                              {lead.siteName}
                            </button>
                          )}
                        </div>
                        {task.source === 'auto' && (
                          <Badge tone="neutral">
                            <Robot size={12} /> {t(K.autoTag)}
                          </Badge>
                        )}
                      </div>
                      <div className="row wrap gap-2 items-center mb-2">
                        <span className={`t-xs ${group.bucket === 'overdue' ? 't-error' : 't-muted'}`}>{t(K.dueOn, { date: formatDate(task.dueDate, i18n.language) })}</span>
                        <span className="t-xs t-muted">· {assignee?.name ?? task.assignedTo}</span>
                        {unavailable && <Badge tone="warning">{t(K.unavailableTag)}</Badge>}
                      </div>
                      <div className="row wrap gap-2 items-center">
                        <Checkbox checked={s.selectedIds.has(task.id)} onChange={() => s.toggleSelect(task.id)} label="" />
                        <Button
                          size="sm"
                          onClick={() =>
                            void s.completeTask(task.id).then((ok) => toast.push(t(ok ? K.toast.completed : K.toast.error), ok ? 'success' : 'error'))
                          }
                        >
                          {t(K.complete)}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setRescheduleTarget(task);
                            setRescheduleDate(task.dueDate.slice(0, 10));
                            setRescheduleReason('');
                          }}
                        >
                          {t(K.reschedule)}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {s.selectedIds.size > 0 && (
        <div className="ds-action-bar row gap-2 items-center">
          <span className="t-sm grow">{t(K.bulkBar.selectedCount, { count: s.selectedIds.size })}</span>
          <button type="button" className="tappable t-sm" onClick={s.clearSelection}>
            {t(K.bulkBar.clear)}
          </button>
          <Button size="sm" variant="secondary" onClick={() => setBulkReassignOpen(true)}>
            {t(K.bulkBar.reassign)}
          </Button>
          <Button size="sm" onClick={() => setBulkRescheduleOpen(true)}>
            {t(K.bulkBar.reschedule)}
          </Button>
        </div>
      )}

      <Sheet
        open={rescheduleTarget !== null}
        onClose={() => setRescheduleTarget(null)}
        title={t(K.rescheduleSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button
            block
            disabled={!rescheduleDate || !rescheduleReason}
            onClick={() =>
              rescheduleTarget &&
              void s.rescheduleTask(rescheduleTarget.id, rescheduleDate, rescheduleReason).then((ok) => {
                toast.push(t(ok ? K.toast.rescheduled : K.toast.error), ok ? 'success' : 'error');
                if (ok) setRescheduleTarget(null);
              })
            }
          >
            {t(K.rescheduleSheet.confirm)}
          </Button>
        }
      >
        <div className="stack gap-3">
          <div className="stack gap-1">
            <span className="label">{t(K.rescheduleSheet.dateLabel)}</span>
            <input type="date" className="ds-input" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.rescheduleSheet.reasonLabel)}</span>
            <Select value={rescheduleReason} onChange={(e) => setRescheduleReason(e.target.value)}>
              <option value="">—</option>
              {RESCHEDULE_REASONS.map((r) => (
                <option key={r} value={`followUp.reason.${r}`}>
                  {t(K.reason[r])}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Sheet>

      <Sheet
        open={bulkRescheduleOpen}
        onClose={() => setBulkRescheduleOpen(false)}
        title={t(K.rescheduleSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button
            block
            disabled={!bulkDate || !bulkReason}
            onClick={() =>
              void s.bulkReschedule(bulkDate, bulkReason).then((ok) => {
                toast.push(t(ok ? K.toast.rescheduled : K.toast.error), ok ? 'success' : 'error');
                if (ok) {
                  setBulkRescheduleOpen(false);
                  setBulkDate('');
                  setBulkReason('');
                }
              })
            }
          >
            {t(K.rescheduleSheet.confirm)}
          </Button>
        }
      >
        <div className="stack gap-3">
          <div className="stack gap-1">
            <span className="label">{t(K.rescheduleSheet.dateLabel)}</span>
            <input type="date" className="ds-input" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} />
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.rescheduleSheet.reasonLabel)}</span>
            <Select value={bulkReason} onChange={(e) => setBulkReason(e.target.value)}>
              <option value="">—</option>
              {RESCHEDULE_REASONS.map((r) => (
                <option key={r} value={`followUp.reason.${r}`}>
                  {t(K.reason[r])}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Sheet>

      <Sheet
        open={bulkReassignOpen}
        onClose={() => setBulkReassignOpen(false)}
        title={t(K.reassignSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button
            block
            disabled={!bulkAssignee}
            onClick={() =>
              void s.bulkReassign(bulkAssignee).then((ok) => {
                toast.push(t(ok ? K.toast.reassigned : K.toast.error), ok ? 'success' : 'error');
                if (ok) {
                  setBulkReassignOpen(false);
                  setBulkAssignee('');
                }
              })
            }
          >
            {t(K.reassignSheet.confirm)}
          </Button>
        }
      >
        <div className="stack gap-1">
          <span className="label">{t(K.reassignSheet.assigneeLabel)}</span>
          <Select value={bulkAssignee} onChange={(e) => setBulkAssignee(e.target.value)}>
            <option value="">—</option>
            {s.surveyors.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </div>
      </Sheet>
    </Screen>
  );
}
