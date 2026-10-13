import { useTranslation } from 'react-i18next';
import { Camera, Check, Checks, Microphone, WarningCircle } from '@phosphor-icons/react';
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, Screen, ScreenHeader, Select, Sheet, TextArea, formatTime, useToast } from '@/design-system';
import { renderTemplateBody } from '@/features/communication/templateRender';
import { botParams } from '@/features/support/render';
import { useWhatsappConsole } from './useWhatsappConsole';
import { WHATSAPP_CONSOLE_KEYS as K } from './whatsapp-console.types';

export function WhatsappConsoleView() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const s = useWhatsappConsole();

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="list" rows={5} />
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

      {s.conversations.length === 0 ? (
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      ) : (
        <Card flush>
          {s.conversations.map((conv) => {
            const lastMessage = conv.messages.at(-1);
            const needsReview = conv.messages.some((m) => m.requiresHumanReview && !m.handled);
            const agentName = conv.assignedAgentId ? s.agents.find((a) => a.id === conv.assignedAgentId)?.name ?? null : null;
            return (
              <div key={conv.id} className="ds-listrow" role="button" tabIndex={0} onClick={() => s.select(conv.id)} onKeyDown={(e) => e.key === 'Enter' && s.select(conv.id)} style={{ cursor: 'pointer' }}>
                <span className="grow stack gap-1" style={{ minWidth: 0 }}>
                  <span className="t-medium truncate">{conv.lead.siteName}</span>
                  <span className="t-xs t-muted truncate">{lastMessage?.body ?? '—'}</span>
                </span>
                <span className="stack items-end gap-1 shrink-0">
                  {needsReview && <Badge tone="warning">{t(K.needsReview)}</Badge>}
                  <span className="t-xs t-muted">{agentName ?? t(K.unassigned)}</span>
                </span>
              </div>
            );
          })}
        </Card>
      )}

      <Sheet open={s.selected !== undefined} onClose={s.closeThread} title={s.selected?.lead.siteName ?? ''} closeLabel={t('action.close')}>
        {s.selected && (
          <div className="stack gap-3">
            <div className="row between items-center gap-2">
              <span className="t-xs t-muted">{s.selected.assignedAgentId ? t(K.assignedTo, { name: s.agents.find((a) => a.id === s.selected?.assignedAgentId)?.name ?? '—' }) : t(K.unassigned)}</span>
              <div className="row gap-2">
                <Button size="sm" variant="secondary" onClick={() => void s.claim().then((ok) => toast.push(t(ok ? K.toast.assigned : K.toast.error), ok ? 'success' : 'error'))}>
                  {t(K.claim)}
                </Button>
                <Select value={s.selected.assignedAgentId ?? ''} onChange={(e) => void s.assign(e.target.value).then((ok) => toast.push(t(ok ? K.toast.assigned : K.toast.error), ok ? 'success' : 'error'))} style={{ width: 'auto' }}>
                  <option value="">—</option>
                  {s.agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {s.optOutTriggered && (
              <Card>
                <div className="row gap-2 items-start mb-2">
                  <WarningCircle size={18} className="t-error shrink-0" />
                  <div className="stack gap-1">
                    <span className="t-sm t-semibold">{t(K.optOutBanner.title)}</span>
                    <span className="t-xs t-muted">{t(K.optOutBanner.body)}</span>
                  </div>
                </div>
                <Button size="sm" variant="danger" onClick={() => void s.confirmOptOut().then((ok) => toast.push(t(ok ? K.toast.optedOut : K.toast.error), ok ? 'success' : 'error'))}>
                  {t(K.optOutBanner.confirm)}
                </Button>
              </Card>
            )}
            {s.optOutConfirmed && (
              <p className="t-xs t-muted row gap-1 items-center">
                <Check size={13} />
                {t(K.optOutBanner.confirmed)}
              </p>
            )}

            <div className="stack gap-2">
              {s.selected.messages.map((msg) => {
                const isCustomer = msg.sender === 'customer';
                return (
                  <div key={msg.id} className="row" style={{ justifyContent: isCustomer ? 'flex-start' : 'flex-end' }}>
                    <div
                      className="stack gap-1"
                      style={{
                        maxWidth: '80%',
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-control)',
                        background: isCustomer ? 'var(--color-surface-alt)' : 'var(--color-accent-primary)',
                        color: isCustomer ? 'var(--color-text-primary)' : 'var(--color-bg)',
                      }}
                    >
                      {msg.sender !== 'customer' && (
                        <span className="t-xs" style={{ opacity: 0.8 }}>
                          {msg.sender === 'bot' ? t(K.bubble.bot) : msg.senderName}
                        </span>
                      )}
                      {msg.mediaKind ? (
                        <span className="row gap-2 items-center">
                          {msg.mediaKind === 'photo' ? <Camera size={16} /> : <Microphone size={16} />}
                          {t(msg.mediaKind === 'photo' ? K.bubble.photo : K.bubble.voice)}
                        </span>
                      ) : (
                        <span className="t-sm">{msg.body || (msg.botKey ? t(msg.botKey.key, botParams(msg.botKey.params, i18n.language)) : '')}</span>
                      )}
                      <span className="row gap-1 items-center t-xs" style={{ opacity: 0.7, alignSelf: 'flex-end' }}>
                        <span title={t(K.bubble.status[msg.status])}>{formatTime(msg.at, i18n.language)}</span>
                        {!isCustomer &&
                          (msg.status === 'read' ? (
                            <Checks size={13} weight="bold" style={{ color: 'var(--color-success)' }} />
                          ) : msg.status === 'delivered' ? (
                            <Checks size={13} />
                          ) : msg.status === 'sent' ? (
                            <Check size={13} />
                          ) : msg.status === 'failed' ? (
                            <WarningCircle size={13} style={{ color: 'var(--color-error)' }} />
                          ) : null)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {s.quickReplyTemplates.length > 0 && (
              <div className="stack gap-1">
                <span className="label">{t(K.composer.quickReplies)}</span>
                <div className="row wrap gap-2">
                  {s.quickReplyTemplates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      className="ds-chip"
                      onClick={() =>
                        s.setComposerText(
                          renderTemplateBody(tpl.body, {
                            customerName: s.selected?.lead.contactName,
                            buildingName: s.selected?.lead.siteName,
                          }),
                        )
                      }
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="stack gap-2">
              <TextArea value={s.composerText} onChange={(e) => s.setComposerText(e.target.value)} rows={2} placeholder={t(K.composer.placeholder)} />
              <Button block disabled={!s.composerText.trim()} onClick={() => void s.send().then((ok) => toast.push(t(ok ? K.toast.sent : K.composer.sendError), ok ? 'success' : 'error'))}>
                {t(K.composer.send)}
              </Button>
              <p className="t-xs t-muted">{t(K.composer.pauseNote)}</p>
            </div>
          </div>
        )}
      </Sheet>
    </Screen>
  );
}
