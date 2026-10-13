import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  AscensionLine,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  Sheet,
  TextArea,
  formatDateTime,
  formatINRCompact,
  formatPhone,
  relativeTimeParts,
} from '@/design-system';
import type { AscensionStep } from '@/design-system';
import { STAGE_TONE } from '@/features/crm/stageTone';
import type { LeadStage, LeadTimelineEvent } from '@/data/types';
import { useLeadDetail } from './useLeadDetail';
import { LEAD_DETAIL_KEYS as K, NEXT_STAGE, STAGE_SHEET_OPTIONS, TIMELINE_COLLAPSE_THRESHOLD } from './lead-detail.types';

type Translate = (key: string, opts?: Record<string, unknown>) => string;

function eventLabel(event: LeadTimelineEvent, t: Translate): string {
  switch (event.kind) {
    case 'captured':
      return t(K.timeline.captured, { detail: event.detail });
    case 'stage_changed':
      return t(K.timeline.stageChanged, {
        from: event.fromValue ? t(`stage.${event.fromValue}`) : '—',
        to: event.toValue ? t(`stage.${event.toValue}`) : '—',
      });
    case 'note_added':
      return t(K.timeline.noteAdded, { note: event.detail });
    case 'assigned':
      return t(K.timeline.assigned, { to: event.toValue });
    case 'reassigned':
      return t(K.timeline.reassigned, { from: event.fromValue, to: event.toValue });
    case 'communication_sent':
      return t(K.timeline.communicationSent, { message: event.detail });
    case 'communication_failed':
      return t(K.timeline.communicationFailed, { detail: event.detail });
    case 'quote_created':
      return t(K.timeline.quoteCreated);
    case 'quote_change_requested':
      return t(K.timeline.quoteChangeRequested, { note: event.detail });
    case 'task_completed':
      return t(K.timeline.taskCompleted, { title: event.detail });
    case 'merged':
      return t(K.timeline.merged, { detail: event.detail });
    case 'marked_lost':
      return t(K.timeline.markedLost, { reason: event.detail ? t(`lostReason.${event.detail}`) : '—' });
    case 'reopened':
      return t(K.timeline.reopened);
    default:
      return event.kind;
  }
}

/**
 * Screen 042 — Lead Detail / Timeline. The 360° view of one lead, and the
 * single place its append-only history renders using the Ascension Line
 * motif — a lead's life story as a stage-progress rail, not a plain log.
 */
export function LeadDetailView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const s = useLeadDetail();

  const [stageSheetOpen, setStageSheetOpen] = useState(false);
  const [pickedStage, setPickedStage] = useState<LeadStage | ''>('');
  const [noteSheetOpen, setNoteSheetOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [followUpSheetOpen, setFollowUpSheetOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [messageSheetOpen, setMessageSheetOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [timelineExpanded, setTimelineExpanded] = useState(false);

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title="" back={() => navigate('/admin/leads')} />
        <LoadingState label={t(K.loading)} variant="cards" rows={4} />
      </Screen>
    );
  }

  if (s.status === 'not_found') {
    return (
      <Screen>
        <ScreenHeader title="" back={() => navigate('/admin/leads')} />
        <EmptyState title={t(K.notFound.title)} body={t(K.notFound.body)} />
      </Screen>
    );
  }

  if (s.status === 'error' || !s.lead) {
    return (
      <Screen>
        <ScreenHeader title="" back={() => navigate('/admin/leads')} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  const lead = s.lead;
  const blockedForStage = pickedStage === 'quoted' && !s.canAdvanceToQuoted ? K.stageSheet.blockedQuoted : pickedStage === 'won' && !s.canAdvanceToWon ? K.stageSheet.blockedWon : null;

  const orderedEvents = [...s.timeline];
  const visibleEvents = timelineExpanded ? orderedEvents : orderedEvents.slice(-TIMELINE_COLLAPSE_THRESHOLD);
  const hiddenCount = orderedEvents.length - visibleEvents.length;
  const steps: AscensionStep[] = visibleEvents.map((event, index) => ({
    id: event.id,
    label: eventLabel(event, t),
    meta: (() => {
      const rel = relativeTimeParts(event.at);
      return rel.key === 'time.justNow' ? t(rel.key) : t(rel.key, { count: rel.count });
    })(),
    status: index === visibleEvents.length - 1 ? 'current' : 'complete',
  }));

  return (
    <Screen>
      <ScreenHeader title={lead.siteName} subtitle={lead.code} back={() => navigate('/admin/leads')} action={<Badge tone={STAGE_TONE[lead.stage]}>{t(`stage.${lead.stage}`)}</Badge>} />

      {lead.stage === 'lost' && (
        <Card className="mb-4">
          <div className="row between items-center gap-3">
            <span className="t-sm">{t(K.lostBanner.title, { reason: lead.lostReason ? t(`lostReason.${lead.lostReason}`) : '—' })}</span>
            <Button size="sm" variant="secondary" onClick={() => void s.reopen()}>
              {t(K.lostBanner.reopen)}
            </Button>
          </div>
        </Card>
      )}

      {lead.duplicateOfLeadId && (
        <Card className="mb-4">
          <p className="t-sm t-muted">{t(K.duplicateBanner)}</p>
        </Card>
      )}

      <h2 className="t-lg mb-2">{t(K.section.overview)}</h2>
      <Card className="mb-4">
        <div className="stack gap-2">
          <div className="row between">
            <span className="t-sm t-muted">{t(K.owner)}</span>
            <span className="t-sm t-semibold">{s.surveyorName || t(K.unassigned)}</span>
          </div>
          <div className="row between">
            <span className="t-sm t-muted">{t(K.source)}</span>
            <span className="t-sm">{t(`leadSource.${lead.source}`)}</span>
          </div>
          <div className="row between">
            <span className="t-sm t-muted">{t(K.estimatedValue)}</span>
            <span className="t-sm t-semibold num">{formatINRCompact(lead.estimatedValue)}</span>
          </div>
          <div className="row between">
            <span className="t-sm t-muted">{t(K.incentive)}</span>
            <span className="t-sm t-semibold num">{formatINRCompact(lead.incentiveAmount)}</span>
          </div>
        </div>
      </Card>

      <h2 className="t-lg mb-2">{t(K.section.contact)}</h2>
      <Card className="mb-4">
        <div className="stack gap-2">
          <div className="row between">
            <span className="t-sm t-muted">{t(K.contactName)}</span>
            <span className="t-sm">{lead.contactName}</span>
          </div>
          <div className="row between">
            <span className="t-sm t-muted">{t(K.contactPhone)}</span>
            <span className="t-sm num">{formatPhone(lead.contactPhone)}</span>
          </div>
          <div className="row between">
            <span className="t-sm t-muted">{t(K.address)}</span>
            <span className="t-sm" style={{ textAlign: 'right', maxWidth: '60%' }}>{lead.address}, {lead.city}</span>
          </div>
        </div>
      </Card>

      <h2 className="t-lg mb-2">{t(K.section.spec)}</h2>
      <Card className="mb-4">
        {lead.spec ? (
          <div className="stack gap-2">
            <div className="row between">
              <span className="t-sm t-muted">{t(K.spec.buildingType)}</span>
              <span className="t-sm">{t(`buildingType.${lead.spec.buildingType}`)}</span>
            </div>
            <div className="row between">
              <span className="t-sm t-muted">{t(K.spec.floors)}</span>
              <span className="t-sm num">{lead.spec.floors}</span>
            </div>
            <div className="row between">
              <span className="t-sm t-muted">{t(K.spec.capacity)}</span>
              <span className="t-sm num">{lead.spec.capacityPersons}</span>
            </div>
            <div className="row between">
              <span className="t-sm t-muted">{t(K.spec.constructionStage)}</span>
              <span className="t-sm">{t(`constructionStage.${lead.spec.constructionStage}`)}</span>
            </div>
          </div>
        ) : (
          <p className="t-sm t-muted">{t(K.spec.none)}</p>
        )}
      </Card>

      <h2 className="t-lg mb-2">{t(K.section.deal)}</h2>
      <Card className="mb-4">
        {s.deal ? (
          <div className="stack gap-2">
            <div className="row between">
              <span className="t-sm t-muted">{t(K.deal.quoted)}</span>
              <span className="t-sm num">{formatINRCompact(s.deal.quotedPrice)}</span>
            </div>
            <div className="row between">
              <span className="t-sm t-muted">{t(K.deal.agreed)}</span>
              <span className="t-sm num">{s.deal.agreedPrice > 0 ? formatINRCompact(s.deal.agreedPrice) : '—'}</span>
            </div>
            <div className="row between">
              <span className="t-sm t-muted">{t(K.deal.status)}</span>
              <span className="t-sm">{t(`dealStatus.${s.deal.status}`)}</span>
            </div>
          </div>
        ) : (
          <p className="t-sm t-muted">{t(K.deal.none)}</p>
        )}
      </Card>

      <div className="row wrap gap-2 mb-4">
        <Button size="sm" variant="secondary" onClick={() => setStageSheetOpen(true)}>
          {t(K.actions.changeStage)}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setNoteSheetOpen(true)}>
          {t(K.actions.addNote)}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setFollowUpSheetOpen(true)}>
          {t(K.actions.scheduleFollowUp)}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setMessageSheetOpen(true)}>
          {t(K.actions.sendMessage)}
        </Button>
        {lead.stage !== 'lost' && (
          <Button size="sm" variant="danger" onClick={() => navigate(`/admin/leads/${lead.id}/lost`)}>
            {t(K.actions.markLost)}
          </Button>
        )}
      </div>

      <h2 className="t-lg mb-2">{t(K.section.timeline)}</h2>
      <Card className="mb-4">
        {hiddenCount > 0 && (
          <button type="button" className="tappable t-xs t-accent mb-3" onClick={() => setTimelineExpanded(true)}>
            {t(K.timeline.showEarlier, { count: hiddenCount })}
          </button>
        )}
        {steps.length > 0 ? <AscensionLine steps={steps} /> : <p className="t-sm t-muted">{t(K.timeline.empty)}</p>}
      </Card>

      <Sheet
        open={stageSheetOpen}
        onClose={() => setStageSheetOpen(false)}
        title={t(K.stageSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button block disabled={!pickedStage || pickedStage === lead.stage || blockedForStage !== null} onClick={() => pickedStage && void s.changeStage(pickedStage).then((ok) => ok && setStageSheetOpen(false))}>
            {t(K.stageSheet.confirm)}
          </Button>
        }
      >
        <div className="stack gap-2">
          <span className="label">{t(K.stageSheet.label)}</span>
          <Select value={pickedStage} onChange={(e) => setPickedStage(e.target.value as LeadStage)}>
            <option value="">—</option>
            {STAGE_SHEET_OPTIONS.map((stg) => (
              <option key={stg} value={stg}>
                {t(`stage.${stg}`)}
                {stg === NEXT_STAGE[lead.stage] ? ' ➜' : ''}
              </option>
            ))}
          </Select>
          {blockedForStage && <p className="t-xs t-error">{t(blockedForStage)}</p>}
        </div>
      </Sheet>

      <Sheet
        open={noteSheetOpen}
        onClose={() => setNoteSheetOpen(false)}
        title={t(K.noteSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button block disabled={!noteText.trim()} onClick={() => void s.addNote(noteText).then((ok) => { if (ok) { setNoteText(''); setNoteSheetOpen(false); } })}>
            {t(K.noteSheet.confirm)}
          </Button>
        }
      >
        <TextArea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={4} placeholder={t(K.noteSheet.placeholder)} />
      </Sheet>

      <Sheet
        open={followUpSheetOpen}
        onClose={() => setFollowUpSheetOpen(false)}
        title={t(K.followUpSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button
            block
            disabled={!taskTitle.trim() || !taskDue || !taskAssignee}
            onClick={() =>
              void s.scheduleFollowUp(taskTitle, taskDue, taskAssignee).then((ok) => {
                if (ok) {
                  setTaskTitle('');
                  setTaskDue('');
                  setTaskAssignee('');
                  setFollowUpSheetOpen(false);
                }
              })
            }
          >
            {t(K.followUpSheet.confirm)}
          </Button>
        }
      >
        <div className="stack gap-3">
          <div className="stack gap-1">
            <span className="label">{t(K.followUpSheet.titleLabel)}</span>
            <TextArea value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} rows={2} placeholder={t(K.followUpSheet.titlePlaceholder)} />
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.followUpSheet.dueLabel)}</span>
            <input type="date" className="ds-input" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.followUpSheet.assigneeLabel)}</span>
            <Select value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)}>
              <option value="">—</option>
              {s.surveyors.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Sheet>

      <Sheet
        open={messageSheetOpen}
        onClose={() => setMessageSheetOpen(false)}
        title={t(K.messageSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button block disabled={!messageText.trim()} onClick={() => void s.sendMessage(messageText).then((ok) => { if (ok) { setMessageText(''); setMessageSheetOpen(false); } })}>
            {t(K.messageSheet.confirm)}
          </Button>
        }
      >
        <div className="stack gap-2">
          <TextArea value={messageText} onChange={(e) => setMessageText(e.target.value)} rows={3} placeholder={t(K.messageSheet.placeholder)} />
          <p className="t-xs t-muted">{t(K.messageSheet.disclaimer)}</p>
        </div>
      </Sheet>

      <p className="t-xs t-muted mt-2">{formatDateTime(lead.updatedAt, i18n.language)}</p>
    </Screen>
  );
}
