import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, Scales } from '@phosphor-icons/react';
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
  TextArea,
  formatDate,
  formatINRCompact,
  useToast,
} from '@/design-system';
import type { Lead } from '@/data/types';
import { useLeadAssignment } from './useLeadAssignment';
import { LEAD_ASSIGNMENT_KEYS as K } from './lead-assignment.types';

function daysWaiting(lead: Lead): number {
  return Math.max(0, Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 86_400_000));
}

/**
 * Screen 044 — Lead Assignment & Reassignment. Two distinct workflows on one
 * screen: the unassigned queue (inbound leads with no field surveyor at all)
 * and territory-wide bulk redistribution off one surveyor's book — both
 * write through the same reason-required repository calls.
 */
export function LeadAssignmentView() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const s = useLeadAssignment();

  const [assignTarget, setAssignTarget] = useState<Lead | null>(null);
  const [assignTo, setAssignTo] = useState('');
  const [assignReason, setAssignReason] = useState('');

  const [bulkSheetOpen, setBulkSheetOpen] = useState(false);
  const [bulkTo, setBulkTo] = useState('');
  const [bulkReason, setBulkReason] = useState('');

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="list" rows={4} />
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

  function openAssign(lead: Lead) {
    setAssignTarget(lead);
    const suggestion = s.suggestions[lead.id];
    setAssignTo(suggestion?.userId ?? '');
    setAssignReason('');
  }

  return (
    <Screen>
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <h2 className="t-lg mb-2">{t(K.queue.heading)}</h2>
      {s.queue.length === 0 ? (
        <EmptyState title={t(K.queue.empty)} body="" />
      ) : (
        <div className="stack gap-2 mb-5">
          {s.queue.map((lead) => {
            const suggestion = s.suggestions[lead.id];
            return (
              <Card key={lead.id} onClick={() => openAssign(lead)}>
                <div className="row between items-start gap-3">
                  <div className="stack gap-1" style={{ minWidth: 0 }}>
                    <span className="t-sm t-semibold truncate">{lead.siteName}</span>
                    <span className="t-xs t-muted truncate">
                      {lead.builderName} · {lead.contactName}
                    </span>
                    <span className="t-xs t-muted">{t(K.queue.waitingDays, { count: daysWaiting(lead) })}</span>
                  </div>
                  <span className="t-xs t-semibold num shrink-0">{formatINRCompact(lead.estimatedValue)}</span>
                </div>
                <div className="row gap-2 items-center mt-2">
                  {suggestion ? (
                    <Badge tone="accent" dot>
                      {t(K.queue.suggested, { name: suggestion.name })}
                    </Badge>
                  ) : (
                    <span className="t-xs t-muted">{t(K.queue.noSuggestion)}</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <h2 className="t-lg mb-2">{t(K.redistribute.heading)}</h2>
      <p className="t-sm t-muted mb-3">{t(K.redistribute.body)}</p>
      <Card className="mb-3">
        <div className="stack gap-1">
          <span className="label">{t(K.redistribute.fromLabel)}</span>
          <Select value={s.sourceSurveyorId} onChange={(e) => s.setSourceSurveyorId(e.target.value)}>
            <option value="">{t(K.redistribute.fromPlaceholder)}</option>
            {s.surveyors.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {s.sourceSurveyorId && (
        <>
          {s.sourceSurveyorLeads.length === 0 ? (
            <EmptyState title={t(K.redistribute.none)} body="" />
          ) : (
            <>
              <Card flush className="mb-3">
                {s.sourceSurveyorLeads.map((lead) => (
                  <div key={lead.id} className="ds-listrow">
                    <Checkbox checked={s.selectedIds.has(lead.id)} onChange={() => s.toggleSelect(lead.id)} label="" />
                    <span className="grow stack gap-1" style={{ minWidth: 0 }}>
                      <span className="t-sm truncate">{lead.siteName}</span>
                      <span className="t-xs t-muted truncate">{formatDate(lead.createdAt, i18n.language)}</span>
                    </span>
                    <span className="t-xs t-muted num shrink-0">{formatINRCompact(lead.estimatedValue)}</span>
                  </div>
                ))}
              </Card>
              <div className="row wrap gap-2 items-center mb-4">
                <span className="t-xs t-muted grow">{t(K.redistribute.selectedCount, { count: s.selectedIds.size })}</span>
                <button type="button" className="tappable t-xs t-accent" onClick={s.selectAll}>
                  {t(K.redistribute.selectAll)}
                </button>
                <button type="button" className="tappable t-xs" onClick={s.clearSelection}>
                  {t(K.redistribute.clear)}
                </button>
                <Button size="sm" disabled={s.selectedIds.size === 0} onClick={() => setBulkSheetOpen(true)}>
                  {t(K.redistribute.reassignButton)}
                </Button>
              </div>
            </>
          )}
        </>
      )}

      <Sheet
        open={assignTarget !== null}
        onClose={() => setAssignTarget(null)}
        title={assignTarget ? t(K.assignSheet.title, { site: assignTarget.siteName }) : ''}
        closeLabel={t('action.close')}
        footer={
          <Button
            block
            disabled={!assignTo || !assignReason.trim()}
            onClick={() =>
              assignTarget &&
              void s.assignLead(assignTarget.id, assignTo, assignReason).then((ok) => {
                if (ok) {
                  toast.push(t(K.toast.assigned), 'success');
                  setAssignTarget(null);
                } else {
                  toast.push(t(K.toast.ineligible), 'error');
                }
              })
            }
          >
            {t(K.assignSheet.confirm)}
          </Button>
        }
      >
        <div className="stack gap-3">
          <div className="stack gap-1">
            <span className="label">{t(K.assignSheet.assigneeLabel)}</span>
            <Select value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
              <option value="">—</option>
              {s.surveyors.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                  {assignTarget && s.suggestions[assignTarget.id]?.userId === u.id ? ` — ${t(K.queue.suggestedTag)}` : ''}
                </option>
              ))}
            </Select>
            {assignTarget && s.suggestions[assignTarget.id] && (
              <span className="t-xs t-muted row gap-1 items-center mt-1">
                {s.suggestions[assignTarget.id]?.reasonKey === 'assignment.reason.proximity' ? <Compass size={13} /> : <Scales size={13} />}
                {t(s.suggestions[assignTarget.id]?.reasonKey ?? '')}
              </span>
            )}
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.assignSheet.reasonLabel)}</span>
            <TextArea value={assignReason} onChange={(e) => setAssignReason(e.target.value)} rows={3} placeholder={t(K.assignSheet.reasonHint)} />
          </div>
        </div>
      </Sheet>

      <Sheet
        open={bulkSheetOpen}
        onClose={() => setBulkSheetOpen(false)}
        title={t(K.bulkSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button
            block
            disabled={!bulkTo || !bulkReason.trim()}
            onClick={() =>
              void s.bulkReassign(bulkTo, bulkReason).then((ok) => {
                if (ok) {
                  toast.push(t(K.toast.bulkAssigned, { count: s.selectedIds.size }), 'success');
                  setBulkSheetOpen(false);
                  setBulkTo('');
                  setBulkReason('');
                } else {
                  toast.push(t(K.toast.ineligible), 'error');
                }
              })
            }
          >
            {t(K.bulkSheet.confirm)}
          </Button>
        }
      >
        <div className="stack gap-3">
          <div className="stack gap-1">
            <span className="label">{t(K.bulkSheet.previewHeading, { count: s.selectedIds.size })}</span>
            <div className="stack gap-1">
              {s.sourceSurveyorLeads
                .filter((l) => s.selectedIds.has(l.id))
                .map((l) => (
                  <span key={l.id} className="t-xs t-muted">
                    {l.siteName}
                  </span>
                ))}
            </div>
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.bulkSheet.assigneeLabel)}</span>
            <Select value={bulkTo} onChange={(e) => setBulkTo(e.target.value)}>
              <option value="">—</option>
              {s.surveyors.filter((u) => u.id !== s.sourceSurveyorId).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.bulkSheet.reasonLabel)}</span>
            <TextArea value={bulkReason} onChange={(e) => setBulkReason(e.target.value)} rows={3} />
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}
