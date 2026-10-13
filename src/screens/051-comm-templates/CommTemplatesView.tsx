import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlass,
  Image as ImageIcon,
  WarningCircle,
  FlowArrow,
  ChatCircleText,
  Phone,
  Megaphone,
  Robot,
  Tray,
  ShieldWarning,
  Lightning,
  ChartLineUp,
} from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  Sheet,
  SegBar,
  TextArea,
  formatDate,
  useToast,
} from '@/design-system';
import { useCommTemplates } from './useCommTemplates';
import { CHANNEL_FILTERS, COMM_TEMPLATES_KEYS as K, EDITOR_LANGUAGES, KNOWN_MERGE_FIELDS, SMS_SEGMENT_LIMIT, STAGE_FILTERS } from './comm-templates.types';

/** Renders `{{token}}` as a visible pill rather than raw curly-brace syntax. */
function renderPreviewWithChips(body: string, t: (k: string) => string) {
  const parts = body.split(/(\{\{\w+\}\})/g);
  return parts.map((part, i) => {
    const match = part.match(/^\{\{(\w+)\}\}$/);
    if (!match) return <span key={i}>{part}</span>;
    const key = match[1];
    const known = (KNOWN_MERGE_FIELDS as readonly string[]).includes(key);
    return (
      <span key={i} className="ds-badge" style={{ margin: '0 2px' }}>
        {known ? t(`commTemplates.mergeField.${key}`) : key}
      </span>
    );
  });
}

export function CommTemplatesView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useCommTemplates();

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

  const editingGroup = s.groups.find((g) => g.groupId === s.openGroupId);
  const smsOverLimit = s.currentVariant?.channel === 'sms' && s.draftBody.length > SMS_SEGMENT_LIMIT;

  return (
    <Screen>
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <div className="mb-3" style={{ position: 'relative' }}>
        <MagnifyingGlass size={16} className="t-muted" style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <Input placeholder={t(K.searchPlaceholder)} value={s.query} onChange={(e) => s.setQuery(e.target.value)} style={{ paddingLeft: 'calc(var(--space-3) * 2 + 16px)' }} />
      </div>

      <div className="row wrap gap-2 mb-2">
        {CHANNEL_FILTERS.map((c) => (
          <Chip key={c} pressed={s.channelFilter === c} onClick={() => s.setChannelFilter(s.channelFilter === c ? null : c)}>
            {t(`commChannel.${c}`)}
          </Chip>
        ))}
      </div>
      <div className="mb-4">
        <Select value={s.stageFilter ?? ''} onChange={(e) => s.setStageFilter((e.target.value || null) as never)}>
          <option value="">{t(K.allStagesOption)}</option>
          {STAGE_FILTERS.map((stg) => (
            <option key={stg} value={stg}>
              {stg === 'any' ? t(K.anyStage) : t(`stage.${stg}`)}
            </option>
          ))}
        </Select>
      </div>

      {s.groups.length === 0 ? (
        <EmptyState title={s.query ? t(K.noResults.title) : t(K.empty.title)} body={s.query ? t(K.noResults.body) : t(K.empty.body)} />
      ) : (
        <Card flush>
          {s.groups.map((group) => (
            <div key={group.groupId} className="ds-listrow" role="button" tabIndex={0} onClick={() => s.openEditor(group.groupId)} onKeyDown={(e) => e.key === 'Enter' && s.openEditor(group.groupId)} style={{ cursor: 'pointer' }}>
              <span className="grow stack gap-1" style={{ minWidth: 0 }}>
                <span className="t-medium truncate">{group.name}</span>
                <span className="t-xs t-muted truncate">
                  {t(`commChannel.${group.channel}`)} · {group.associatedStage === 'any' ? t(K.anyStage) : t(`stage.${group.associatedStage}`)} · {t(K.languagesAvailable, { count: group.languages.length })}
                </span>
              </span>
              <Badge tone={group.status === 'active' ? 'success' : 'neutral'}>{t(K.statusBadge[group.status])}</Badge>
            </div>
          ))}
        </Card>
      )}

      <h2 className="t-lg mb-3 mt-4">{t(K.quickLinks.heading)}</h2>
      <div className="grid-auto mb-4" style={{ ['--min' as string]: '160px' }}>
        <Card onClick={() => navigate('/admin/comm/sequences')}>
          <div className="row gap-3">
            <FlowArrow size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.quickLinks.sequences)}</span>
          </div>
        </Card>
        <Card onClick={() => navigate('/admin/comm/whatsapp')}>
          <div className="row gap-3">
            <ChatCircleText size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.quickLinks.whatsapp)}</span>
          </div>
        </Card>
        <Card onClick={() => navigate('/admin/comm/calls')}>
          <div className="row gap-3">
            <Phone size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.quickLinks.calls)}</span>
          </div>
        </Card>
        <Card onClick={() => navigate('/admin/comm/broadcast')}>
          <div className="row gap-3">
            <Megaphone size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.quickLinks.broadcast)}</span>
          </div>
        </Card>
        <Card onClick={() => navigate('/admin/comm/bot')}>
          <div className="row gap-3">
            <Robot size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.quickLinks.bot)}</span>
          </div>
        </Card>
        <Card onClick={() => navigate('/admin/comm/inbox')}>
          <div className="row gap-3">
            <Tray size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.quickLinks.inbox)}</span>
          </div>
        </Card>
        <Card onClick={() => navigate('/admin/comm/opt-outs')}>
          <div className="row gap-3">
            <ShieldWarning size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.quickLinks.optOuts)}</span>
          </div>
        </Card>
        <Card onClick={() => navigate('/admin/comm/trigger-rules')}>
          <div className="row gap-3">
            <Lightning size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.quickLinks.triggerRules)}</span>
          </div>
        </Card>
        <Card onClick={() => navigate('/admin/comm/analytics')}>
          <div className="row gap-3">
            <ChartLineUp size={22} className="t-emerald" />
            <span className="t-sm t-medium">{t(K.quickLinks.analytics)}</span>
          </div>
        </Card>
      </div>

      <Sheet
        open={s.openGroupId !== null}
        onClose={s.closeEditor}
        title={editingGroup ? t(K.editor.title, { name: editingGroup.name }) : ''}
        closeLabel={t('action.close')}
        footer={
          s.currentVariant && (
            <div className="stack gap-2">
              <Button block disabled={s.draftBody === s.currentVariant.body} onClick={() => void s.save().then((ok) => toast.push(t(ok ? K.toast.saved : K.toast.error), ok ? 'success' : 'error'))}>
                {t(K.editor.save)}
              </Button>
              {s.currentVariant.status === 'active' ? (
                <Button block variant="secondary" onClick={() => void s.setTemplateActiveStatus(false).then((ok) => toast.push(t(ok ? K.toast.statusChanged : K.toast.error), ok ? 'success' : 'error'))}>
                  {t(K.editor.markDraft)}
                </Button>
              ) : (
                <Button block variant="secondary" disabled={s.unknownFields.length > 0} onClick={() => void s.setTemplateActiveStatus(true).then((ok) => toast.push(t(ok ? K.toast.statusChanged : K.toast.error), ok ? 'success' : 'error'))}>
                  {t(K.editor.markActive)}
                </Button>
              )}
            </div>
          )
        }
      >
        {s.currentVariant && (
          <div className="stack gap-4">
            <SegBar label={t(K.editor.languageTab)} value={s.editorLanguage} onChange={(id) => s.setEditorLanguage(id as never)} items={EDITOR_LANGUAGES.map((lang) => ({ id: lang, label: lang.toUpperCase() }))} />

            <div className="stack gap-1">
              <span className="label">{t(K.editor.bodyLabel)}</span>
              <TextArea value={s.draftBody} onChange={(e) => s.setDraftBody(e.target.value)} rows={5} />
              {smsOverLimit && (
                <span className="t-xs t-warning row gap-1 items-center">
                  <WarningCircle size={13} />
                  {t(K.editor.smsLengthWarning, { count: s.draftBody.length, limit: SMS_SEGMENT_LIMIT })}
                </span>
              )}
              {s.currentVariant.channel === 'whatsapp' && (
                <span className="t-xs t-muted row gap-1 items-center">
                  <ImageIcon size={13} />
                  {t(K.editor.mediaSlotHint)}
                </span>
              )}
            </div>

            <div className="stack gap-1">
              <span className="label">{t(K.editor.insertField)}</span>
              <div className="row wrap gap-2">
                {KNOWN_MERGE_FIELDS.map((field) => (
                  <Chip key={field} onClick={() => s.insertField(field)}>
                    {t(`commTemplates.mergeField.${field}`)}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="stack gap-1">
              <span className="label">{t(K.editor.previewHeading)}</span>
              <Card>
                <p className="t-sm">{renderPreviewWithChips(s.draftBody, t)}</p>
              </Card>
            </div>

            {s.concurrentEditDetected && <p className="t-xs t-warning">{t(K.editor.concurrentEditWarning)}</p>}

            {s.unknownFields.length > 0 && (
              <p className="t-xs t-error">{t(K.editor.unknownFieldWarning, { fields: s.unknownFields.join(', ') })}</p>
            )}

            <div className="stack gap-1">
              <span className="label">{t(K.editor.versionHistory)}</span>
              <div className="stack gap-2">
                {[...s.currentVariant.versions].reverse().map((v) => (
                  <div key={v.version} className="row between items-center gap-2">
                    <span className="t-xs t-muted">{t(K.editor.versionRow, { version: v.version, editor: v.editedBy, date: formatDate(v.editedAt, i18n.language) })}</span>
                    {v.version !== s.currentVariant?.versions.at(-1)?.version && (
                      <button type="button" className="tappable t-xs t-accent" onClick={() => void s.revertToVersion(v.version)}>
                        {t(K.editor.revert)}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Sheet>
    </Screen>
  );
}
