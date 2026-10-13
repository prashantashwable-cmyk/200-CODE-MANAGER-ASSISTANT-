import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, ChartLineUp, ChartPie, Copy, Kanban, MagnifyingGlass, UploadSimple, UserSwitch } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Chip,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  Sheet,
  StatTile,
  TextArea,
  formatDate,
  formatINRCompact,
} from '@/design-system';
import { STAGE_TONE } from '@/features/crm/stageTone';
import { useLeadInbox } from './useLeadInbox';
import { FILTERABLE_SOURCES, FILTERABLE_STAGES, LEAD_INBOX_KEYS as K } from './lead-inbox.types';
import type { DateRangeFilter } from './lead-inbox.types';

const DATE_CHIPS: DateRangeFilter[] = ['all', 'today', 'week', 'month'];
const DATE_LABEL_KEY: Record<DateRangeFilter, string> = {
  all: K.filters.date_all,
  today: K.filters.date_today,
  week: K.filters.date_week,
  month: K.filters.date_month,
};

const LOST_REASON_KEYS = ['price', 'timeline', 'competitor', 'site_not_ready', 'unresponsive', 'not_a_fit'];

/**
 * Screen 041 — Lead Inbox / Master List. The full CRM dataset, one row per
 * lead, filterable every way Admin needs to triage. Renders from the exact
 * same `listLeads()` call the Kanban board (043) uses — never a second copy
 * of the data — so the two views can never quietly disagree.
 */
export function LeadInboxView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const s = useLeadInbox();
  const [reassignTo, setReassignTo] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [lostReasonKey, setLostReasonKey] = useState('');

  if (s.status === 'loading') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="list" rows={8} />
      </Screen>
    );
  }

  if (s.status === 'error') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <div className="grid-auto gap-3 mb-4" style={{ ['--min' as string]: '150px' }}>
        <Card>
          <StatTile label={t(K.summary.total)} value={s.summary.total} />
        </Card>
        <Card>
          <StatTile label={t(K.summary.unassigned)} value={s.summary.unassigned} />
        </Card>
        <Card>
          <StatTile label={t(K.summary.totalValue)} value={<span className="num">{formatINRCompact(s.summary.totalValue)}</span>} />
        </Card>
      </div>

      <div className="mb-3" style={{ position: 'relative' }}>
        <MagnifyingGlass
          size={16}
          className="t-muted"
          style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        />
        <Input
          placeholder={t(K.searchPlaceholder)}
          value={s.query}
          onChange={(e) => s.setQuery(e.target.value)}
          style={{ paddingLeft: 'calc(var(--space-3) * 2 + 16px)' }}
        />
      </div>

      <div className="stack gap-2 mb-4">
        <div className="row wrap gap-2">
          {FILTERABLE_STAGES.map((stage) => (
            <Chip key={stage} pressed={s.activeStages.includes(stage)} onClick={() => s.toggleStage(stage)}>
              {t(`stage.${stage}`)}
            </Chip>
          ))}
        </div>
        <div className="row wrap gap-2">
          {FILTERABLE_SOURCES.map((source) => (
            <Chip key={source} pressed={s.activeSources.includes(source)} onClick={() => s.toggleSource(source)}>
              {t(`leadSource.${source}`)}
            </Chip>
          ))}
        </div>
        <div className="row wrap gap-2 items-center">
          <Select value={s.city} onChange={(e) => s.setCity(e.target.value)} style={{ width: 'auto' }}>
            <option value="">{t(K.filters.allCities)}</option>
            {s.cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          {DATE_CHIPS.map((d) => (
            <Chip key={d} pressed={s.dateRange === d} onClick={() => s.setDateRange(d)}>
              {t(DATE_LABEL_KEY[d])}
            </Chip>
          ))}
          {s.filtersActive && (
            <button type="button" className="tappable t-xs t-accent" onClick={s.clearFilters}>
              {t(K.filters.clear)}
            </button>
          )}
        </div>
      </div>

      {s.hasNoMatches ? (
        <EmptyState title={t(K.noResults.title)} body={t(K.noResults.body)} />
      ) : s.leads.length === 0 ? (
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      ) : (
        <>
          <Card flush>
            {s.visible.map((lead) => (
              <div key={lead.id} className="ds-listrow">
                <Checkbox checked={s.selectedIds.has(lead.id)} onChange={() => s.toggleSelect(lead.id)} label="" />
                <button type="button" className="grow row between gap-3" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'inherit', textAlign: 'left', minWidth: 0 }} onClick={() => s.openQuickView(lead)}>
                  <span className="grow stack gap-1" style={{ minWidth: 0 }}>
                    <span className="t-medium truncate row gap-2 items-center">
                      {lead.siteName}
                      {!lead.surveyorId && <Badge tone="warning">{t(K.unassignedBadge)}</Badge>}
                    </span>
                    <span className="t-xs t-muted truncate">
                      {lead.builderName} · {lead.contactName} · {formatDate(lead.createdAt, i18n.language)}
                    </span>
                  </span>
                  <span className="stack items-end gap-1 shrink-0">
                    <Badge tone={STAGE_TONE[lead.stage]}>{t(`stage.${lead.stage}`)}</Badge>
                    <span className="t-xs t-muted num">{formatINRCompact(lead.estimatedValue)}</span>
                  </span>
                </button>
              </div>
            ))}
          </Card>

          <div className="row center mt-3">
            {s.hasMore ? (
              <button type="button" className="tappable t-sm t-accent" onClick={s.loadMore}>
                {t(K.loadMore)}
              </button>
            ) : (
              <span className="t-xs t-muted">{t(K.allLoaded)}</span>
            )}
          </div>
        </>
      )}

      <h2 className="t-lg mb-3 mt-4">{t(K.quickLinks.heading)}</h2>
      <div className="grid-auto mb-4" style={{ ['--min' as string]: '160px' }}>
        <Card onClick={() => navigate('/admin/leads/pipeline')}>
          <div className="row gap-3">
            <Kanban size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.quickLinks.pipeline)}</span>
          </div>
        </Card>
        <Card onClick={() => navigate('/admin/leads/assignment')}>
          <div className="row gap-3">
            <UserSwitch size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.quickLinks.assignment)}</span>
          </div>
        </Card>
        <Card onClick={() => navigate('/admin/leads/duplicates')}>
          <div className="row gap-3">
            <Copy size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.quickLinks.duplicates)}</span>
          </div>
        </Card>
        <Card onClick={() => navigate('/admin/leads/scoring')}>
          <div className="row gap-3">
            <ChartLineUp size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.quickLinks.scoring)}</span>
          </div>
        </Card>
        <Card onClick={() => navigate('/admin/leads/follow-ups')}>
          <div className="row gap-3">
            <CalendarCheck size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.quickLinks.followUps)}</span>
          </div>
        </Card>
        <Card onClick={() => navigate('/admin/leads/attribution')}>
          <div className="row gap-3">
            <ChartPie size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.quickLinks.attribution)}</span>
          </div>
        </Card>
        <Card onClick={() => navigate('/admin/leads/import-export')}>
          <div className="row gap-3">
            <UploadSimple size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.quickLinks.importExport)}</span>
          </div>
        </Card>
      </div>

      {s.selectedIds.size > 0 && (
        <div className="ds-action-bar row gap-2 items-center">
          <span className="t-sm grow">{t(K.bulkBar.selectedCount, { count: s.selectedIds.size })}</span>
          <button type="button" className="tappable t-sm" onClick={s.clearSelection}>
            {t(K.bulkBar.clear)}
          </button>
          <button type="button" className="tappable t-sm t-accent" onClick={s.exportSelected}>
            {t(K.bulkBar.export)}
          </button>
          <button type="button" className="tappable t-sm t-error" onClick={s.openMarkLostSheet}>
            {t(K.bulkBar.markLost)}
          </button>
          <button type="button" className="tappable t-sm t-accent" onClick={s.openReassignSheet}>
            {t(K.bulkBar.reassign)}
          </button>
        </div>
      )}

      <Sheet open={s.quickView !== null} onClose={s.closeQuickView} title={s.quickView ? t(K.quickView.title, { code: s.quickView.code }) : ''} closeLabel={t('action.close')}>
        {s.quickView && (
          <div className="stack gap-3">
            <div className="row between">
              <span className="t-sm t-semibold">{s.quickView.siteName}</span>
              <Badge tone={STAGE_TONE[s.quickView.stage]}>{t(`stage.${s.quickView.stage}`)}</Badge>
            </div>
            <div className="row between">
              <span className="t-sm t-muted">{t(K.quickView.contact)}</span>
              <span className="t-sm">{s.quickView.contactName}</span>
            </div>
            <div className="row between">
              <span className="t-sm t-muted">{t(K.quickView.owner)}</span>
              <span className="t-sm">{s.surveyors.find((u) => u.id === s.quickView?.surveyorId)?.name ?? t(K.unassignedBadge)}</span>
            </div>
            <div className="row between">
              <span className="t-sm t-muted">{t(K.quickView.source)}</span>
              <span className="t-sm">{t(`leadSource.${s.quickView.source}`)}</span>
            </div>
            <div className="row between">
              <span className="t-sm t-muted">{t(K.quickView.estimatedValue)}</span>
              <span className="t-sm t-semibold num">{formatINRCompact(s.quickView.estimatedValue)}</span>
            </div>
            <button type="button" className="tappable t-sm t-accent" onClick={() => navigate(`/admin/leads/${s.quickView?.id}`)}>
              {t(K.quickView.openFull)}
            </button>
          </div>
        )}
      </Sheet>

      <Sheet
        open={s.reassignSheetOpen}
        onClose={s.closeReassignSheet}
        title={t(K.reassignSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button
            block
            disabled={!reassignTo || !reassignReason.trim()}
            onClick={() => void s.submitReassign(reassignTo, reassignReason).then((ok) => ok && setReassignReason(''))}
          >
            {t(K.reassignSheet.confirm)}
          </Button>
        }
      >
        <div className="stack gap-3">
          <div className="stack gap-1">
            <span className="label">{t(K.reassignSheet.assigneeLabel)}</span>
            <Select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)}>
              <option value="">—</option>
              {s.surveyors.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.reassignSheet.reasonLabel)}</span>
            <TextArea value={reassignReason} onChange={(e) => setReassignReason(e.target.value)} rows={3} placeholder={t(K.reassignSheet.reasonHint)} />
          </div>
        </div>
      </Sheet>

      <Sheet
        open={s.markLostSheetOpen}
        onClose={s.closeMarkLostSheet}
        title={t(K.markLostSheet.title)}
        closeLabel={t('action.close')}
        footer={
          <Button
            block
            variant="danger"
            disabled={!lostReasonKey}
            onClick={() => void s.submitMarkLost(lostReasonKey).then((ok) => ok && setLostReasonKey(''))}
          >
            {t(K.markLostSheet.confirm)}
          </Button>
        }
      >
        <div className="stack gap-1">
          <span className="label">{t(K.markLostSheet.reasonLabel)}</span>
          <Select value={lostReasonKey} onChange={(e) => setLostReasonKey(e.target.value)}>
            <option value="">—</option>
            {LOST_REASON_KEYS.map((r) => (
              <option key={r} value={r}>
                {t(`lostReason.${r}`)}
              </option>
            ))}
          </Select>
        </div>
      </Sheet>
    </Screen>
  );
}
