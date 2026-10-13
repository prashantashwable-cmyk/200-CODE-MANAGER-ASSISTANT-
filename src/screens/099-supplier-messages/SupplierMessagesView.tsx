import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ChatCircleDots,
  Check,
  Checks,
  EnvelopeSimple,
  Gear,
  MagnifyingGlass,
  Package,
  Paperclip,
  Phone,
  PhoneCall,
  Plus,
  SealCheck,
  UsersThree,
  Warning,
  WhatsappLogo,
} from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import {
  ActionBar,
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  Sheet,
  TextArea,
  formatDate,
  formatDateTime,
  formatTime,
  useToast,
} from '@/design-system';
import type { SupplierMessage, SupplierMessageChannel } from '@/data/types';
import type { SupplierThreadSummary } from '@/data/repository';
import { DocumentSlot } from '@/features/onboarding/DocumentSlot';
import { startsNewGroup } from '@/features/suppliers/threads';
import { useSupplierMessages } from './useSupplierMessages';
import type { SupplierMessagesState } from './useSupplierMessages';
import { LOGGABLE_CHANNELS, QUICK_REPLIES, SUPPLIER_MESSAGES_KEYS as K } from './supplier-messages.types';

type T = ReturnType<typeof useTranslation>['t'];

const CHANNEL_ICON: Record<SupplierMessageChannel, ReactNode> = {
  in_app: <ChatCircleDots size={12} aria-hidden="true" />,
  phone: <Phone size={12} aria-hidden="true" />,
  email: <EnvelopeSimple size={12} aria-hidden="true" />,
  whatsapp: <WhatsappLogo size={12} aria-hidden="true" />,
  in_person: <UsersThree size={12} aria-hidden="true" />,
};

const hoursSince = (iso: string) => Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000));

export function SupplierMessagesView() {
  const { t } = useTranslation();
  const s = useSupplierMessages();

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="list" rows={4} />
      </Screen>
    );
  }
  if (s.status === 'error') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reloadList()} />
      </Screen>
    );
  }

  return (
    <Screen width="wide">
      <div className={`split-pane ${s.isOpen ? 'split-pane--open' : ''}`}>
        <div className="split-pane__list">
          <ScreenHeader
            title={t(K.title)}
            subtitle={t(s.isAdmin ? K.subtitleAdmin : K.subtitleSupplier)}
            action={
              <Button size="sm" icon={<Plus size={16} />} onClick={s.openStart}>
                {t(K.list.newThread)}
              </Button>
            }
          />
          <ThreadList s={s} t={t} />
        </div>
        <div className="split-pane__detail">
          <Conversation s={s} t={t} />
        </div>
      </div>
      <StartSheet s={s} t={t} />
    </Screen>
  );
}

/* ------------------------------------------------------------------- list */

function ThreadList({ s, t }: { s: SupplierMessagesState; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  return (
    <div className="stack gap-3">
      <Input
        type="search"
        aria-label={t(K.search.placeholder)}
        placeholder={t(K.search.placeholder)}
        value={s.query}
        onChange={(e) => s.setQuery(e.target.value)}
      />
      {s.hits !== null ? (
        s.hits.length === 0 ? (
          <EmptyState icon={<MagnifyingGlass size={28} />} title={t(K.search.none)} body={t(K.search.noneBody)} />
        ) : (
          <>
            <span className="label">{t(K.search.results, { count: s.hits.length })}</span>
            <Card className="ds-card--flush">
              {s.hits.map((hit) => (
                <button key={hit.message.id} type="button" className="ds-listrow" style={{ alignItems: 'flex-start' }} onClick={() => s.openThread(hit.threadId)}>
                  <span className="grow stack gap-1" style={{ minWidth: 0 }}>
                    <span className="t-sm t-medium">
                      {s.isAdmin ? `${hit.supplierName} · ` : ''}
                      {hit.poCode ? t(K.list.order, { code: hit.poCode }) : t(K.list.general)}
                    </span>
                    <span className="t-xs clamp-2">
                      {hit.message.authorName}: {hit.message.body}
                    </span>
                    <span className="t-xs t-muted">{formatDate(hit.message.at, lang)}</span>
                  </span>
                </button>
              ))}
            </Card>
          </>
        )
      ) : s.threads.length === 0 ? (
        <EmptyState icon={<ChatCircleDots size={28} />} title={t(K.list.empty)} body={t(K.list.emptyBody)} />
      ) : (
        <Card className="ds-card--flush">
          {s.threads.map((th) => (
            <ThreadRow key={th.threadId} th={th} s={s} t={t} lang={lang} />
          ))}
        </Card>
      )}
    </div>
  );
}

function ThreadRow({ th, s, t, lang }: { th: SupplierThreadSummary; s: SupplierMessagesState; t: T; lang: string }) {
  const active = s.activeThreadId === th.threadId;
  const waitingOnMe = th.awaiting?.from === s.viewerSide;
  const last = th.lastMessage;
  return (
    <button
      type="button"
      className="ds-listrow"
      aria-current={active || undefined}
      style={{ alignItems: 'flex-start', background: active ? 'var(--color-surface-alt)' : undefined }}
      onClick={() => s.openThread(th.threadId)}
    >
      <span className="grow stack gap-1" style={{ minWidth: 0 }}>
        <span className="row between gap-2">
          <span className="t-sm t-medium" style={{ minWidth: 0 }}>
            {s.isAdmin ? th.supplierName : th.poCode ? t(K.list.order, { code: th.poCode }) : t(K.list.general)}
          </span>
          {last && <span className="t-xs t-muted shrink-0">{formatDate(last.at, lang)}</span>}
        </span>
        {s.isAdmin && <span className="t-xs t-muted">{th.poCode ? t(K.list.order, { code: th.poCode }) : t(K.list.general)}</span>}
        {last && (
          <span className="t-xs clamp-2">
            {last.author === s.viewerSide ? t(K.list.you) : last.authorName}: {last.body}
          </span>
        )}
        <span className="row wrap gap-1">
          {th.unreadCount > 0 && <Badge tone="accent">{t(K.list.unread, { count: th.unreadCount })}</Badge>}
          {th.awaiting && waitingOnMe && <Badge tone={th.awaiting.overdue ? 'warning' : 'emerald'}>{t(K.list.waitingOnYou)}</Badge>}
          {th.awaiting && !waitingOnMe && th.awaiting.overdue && (
            <Badge tone="warning">{t(K.list.noReply, { hours: hoursSince(th.awaiting.since) })}</Badge>
          )}
          {th.awaiting && !waitingOnMe && !th.awaiting.overdue && <Badge tone="neutral">{t(K.list.awaitingThem)}</Badge>}
        </span>
      </span>
    </button>
  );
}

/* ----------------------------------------------------------- conversation */

function Conversation({ s, t }: { s: SupplierMessagesState; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();
  const toast = useToast();

  if (!s.isOpen) {
    // Wide screens only — a phone shows the list instead.
    return <EmptyState icon={<ChatCircleDots size={28} />} title={t(K.list.pickThread)} body={t(K.list.emptyBody)} />;
  }
  if (s.threadStatus === 'loading' || s.threadStatus === 'idle') return <LoadingState label={t(K.loading)} variant="cards" rows={3} />;
  if (s.threadStatus === 'error') {
    return <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reloadThread()} />;
  }
  if (s.threadStatus === 'not_found' || !s.view) {
    return (
      <>
        <ScreenHeader title={t(K.title)} back={s.closeThread} />
        <EmptyState title={t(K.notFound.title)} body={t(K.notFound.body)} />
      </>
    );
  }

  const view = s.view;
  const canSendInApp = !s.isAdmin || view.supplierHasPortal;
  const orderRoute = (poId: string) => `/orders?poId=${poId}`;

  // Messages and the order's own record, in the order they happened.
  type Entry = { at: string; id: string; message?: SupplierMessage; stage?: string };
  const entries: Entry[] = [
    ...view.messages.map((m) => ({ at: m.at, id: m.id, message: m })),
    ...view.systemEvents.map((e) => ({ at: e.at, id: e.id, stage: e.stage })),
  ].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));

  return (
    <div className="stack gap-3">
      <ScreenHeader
        title={s.isAdmin ? view.supplier.name : view.po ? t(K.list.order, { code: view.po.code }) : t(K.thread.general)}
        subtitle={
          view.po
            ? t(K.thread.orderLine, {
                code: view.po.code,
                stage: t(`fulfilmentStage.${view.po.stage}`),
                date: view.po.promisedDelivery ? formatDate(view.po.promisedDelivery, lang) : '—',
              })
            : t(K.thread.general)
        }
        back={s.closeThread}
        action={
          view.po ? (
            <Button size="sm" variant="ghost" icon={<Package size={16} />} onClick={() => navigate(orderRoute(view.po!.id))}>
              {t(K.thread.openOrder)}
            </Button>
          ) : undefined
        }
      />

      {/* Who owes the next word — the flag the follow-up engine chases. */}
      <Banners s={s} t={t} lang={lang} />

      {entries.length === 0 ? (
        <EmptyState icon={<ChatCircleDots size={28} />} title={t(K.thread.empty)} body={t(K.thread.emptyBody)} />
      ) : (
        <div className="ds-thread" aria-live="polite">
          {entries.map((entry, i) => {
            const prev = i > 0 ? entries[i - 1].at : null;
            return (
              <div key={entry.id} className="stack gap-2">
                {startsNewGroup(prev, entry.at) && <span className="ds-thread__break">{formatDateTime(entry.at, lang)}</span>}
                {entry.message ? (
                  <Bubble m={entry.message} s={s} t={t} lang={lang} onOrder={(poId) => navigate(orderRoute(poId))} />
                ) : (
                  <span className="ds-thread__system">
                    <Gear size={12} aria-hidden="true" />
                    <strong>{t(K.bubble.automatic)}</strong>{' '}
                    {entry.stage === 'sent'
                      ? t(K.bubble.sentEvent, { time: formatTime(entry.at, lang) })
                      : t(K.bubble.stage, { stage: t(`fulfilmentStage.${entry.stage}`), time: formatTime(entry.at, lang) })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ActionBar>
        <div className="stack gap-2 grow" style={{ minWidth: 0 }}>
          {canSendInApp ? (
            <>
              <div className="stack gap-1">
                <span className="label">{t(K.composer.quickReplies)}</span>
                <div className="row gap-2 ds-tabs--scroll" style={{ overflowX: 'auto' }}>
                  {QUICK_REPLIES[s.viewerSide].map((key) => (
                    <button key={key} type="button" className="ds-chip shrink-0" onClick={() => s.setDraft(t(K.quickText[key]))}>
                      {t(K.quick[key])}
                    </button>
                  ))}
                </div>
              </div>
              <TextArea aria-label={t(K.composer.placeholder)} placeholder={t(K.composer.placeholder)} rows={2} value={s.draft} onChange={(e) => s.setDraft(e.target.value)} />
              {(s.poRef || s.document) && (
                <span className="t-xs row gap-1 wrap">
                  <Paperclip size={12} aria-hidden="true" />
                  {[s.poRef ? view.poOptions.find((p) => p.id === s.poRef)?.code : null, s.document?.fileName].filter(Boolean).join(' · ')}
                </span>
              )}
              <div className="row between gap-2 wrap">
                <Checkbox checked={s.expectsReply} onChange={s.setExpectsReply} label={t(K.composer.expectsReply)} />
                <div className="row gap-2">
                  {s.isAdmin && (
                    <Button size="sm" variant="ghost" icon={<PhoneCall size={16} />} onClick={s.openLog}>
                      {t(K.composer.logContact)}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" icon={<Paperclip size={16} />} aria-label={t(K.composer.attach)} onClick={() => s.setAttachOpen(true)} />
                  <Button
                    size="sm"
                    disabled={!s.draft.trim()}
                    loading={s.sending}
                    onClick={() =>
                      void s.send().then((r) =>
                        toast.push(t(r === 'ok' ? K.toast.sent : r === 'no_portal' ? K.toast.noPortal : K.toast.error), r === 'ok' ? 'success' : 'error'),
                      )
                    }
                  >
                    {t(K.composer.send)}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            // No portal login: the conversation happens by phone or email, and is logged here.
            <Button block icon={<PhoneCall size={18} />} onClick={s.openLog}>
              {t(K.composer.logContact)}
            </Button>
          )}
        </div>
      </ActionBar>

      <AttachSheet s={s} t={t} />
      {s.isAdmin && <LogSheet s={s} t={t} />}
      {s.isAdmin && <RecordSheet s={s} t={t} />}
    </div>
  );
}

function Banners({ s, t, lang }: { s: SupplierMessagesState; t: T; lang: string }) {
  const view = s.view!;
  const w = view.awaiting;
  return (
    <div className="stack gap-2">
      {s.isAdmin && !view.supplierHasPortal && (
        <p className="t-xs t-muted row-top gap-2">
          <PhoneCall size={14} className="shrink-0" aria-hidden="true" /> {t(K.thread.noPortal, { supplier: view.supplier.name })}
        </p>
      )}
      {w && w.from === 'supplier' && (
        <p className={`t-sm row-top gap-2 ${w.overdue ? 't-warning' : 't-muted'}`}>
          <Warning size={16} className="shrink-0" aria-hidden="true" />
          {s.isAdmin
            ? w.overdue
              ? t(K.thread.overdueAdmin, { supplier: view.supplier.name, hours: hoursSince(w.since) })
              : t(K.thread.waitingOnSupplier, { supplier: view.supplier.name })
            : t(w.overdue ? K.thread.waitingOnSupplierOverdue : K.thread.waitingOnAiec, { hours: hoursSince(w.since) })}
        </p>
      )}
      {w && w.from === 'aiec' && s.isAdmin && (
        <p className={`t-sm row-top gap-2 ${w.overdue ? 't-warning' : 't-muted'}`}>
          <Warning size={16} className="shrink-0" aria-hidden="true" /> {t(K.list.waitingOnYou)}
        </p>
      )}
      {s.isAdmin && (
        <span className="t-xs t-muted">
          {view.lastSupplierResponseAt ? t(K.thread.lastReply, { when: formatDateTime(view.lastSupplierResponseAt, lang) }) : t(K.thread.neverReplied)}
        </span>
      )}
    </div>
  );
}

function Bubble({ m, s, t, lang, onOrder }: { m: SupplierMessage; s: SupplierMessagesState; t: T; lang: string; onOrder: (poId: string) => void }) {
  const own = m.author === s.viewerSide;
  const logged = m.channel !== 'in_app';
  const poCode = m.poRef ? (s.view!.poOptions.find((p) => p.id === m.poRef)?.code ?? s.view!.po?.code) : null;
  return (
    <div className={`ds-bubble-row ${own ? 'ds-bubble-row--own' : ''}`}>
      <div className={`ds-bubble ${logged ? 'ds-bubble--logged' : own ? 'ds-bubble--own' : ''}`}>
        <span className="ds-bubble__tag">
          {logged && CHANNEL_ICON[m.channel]}
          <strong>{m.authorName}</strong>
          {logged && <span>· {t(K.bubble.logged, { channel: t(K.bubble.channel[m.channel]), name: m.loggedBy ?? '' })}</span>}
        </span>
        <span className="t-sm" style={{ whiteSpace: 'pre-line' }}>
          {m.body}
        </span>
        {m.poRef && poCode && (
          <button type="button" className="ds-bubble__ref" onClick={() => onOrder(m.poRef!)}>
            <Package size={12} aria-hidden="true" /> {t(K.bubble.viewOrder, { code: poCode })}
          </button>
        )}
        {m.urgent && <Badge tone="error">{t(K.bubble.urgent)}</Badge>}
        {(m.evidenceNames?.length ?? 0) > 1 ? (
          <span className="ds-bubble__tag">
            <Paperclip size={12} aria-hidden="true" /> {t(K.bubble.photos, { count: m.evidenceNames!.length })}
          </span>
        ) : (
          m.attachmentName && (
            <span className="ds-bubble__tag">
              <Paperclip size={12} aria-hidden="true" /> {m.attachmentName}
            </span>
          )
        )}
        <span className="ds-bubble__meta">
          {m.flaggedNoteId && (
            <span className="row gap-1">
              <SealCheck size={12} aria-hidden="true" /> {t(K.bubble.onRecord)}
            </span>
          )}
          {!m.expectsReply && !logged && <span>{t(K.bubble.noReplyNeeded)}</span>}
          <span>{formatTime(m.at, lang)}</span>
          {own && !logged && (
            <span title={t(m.readAt ? K.bubble.read : K.bubble.sent)} aria-label={t(m.readAt ? K.bubble.read : K.bubble.sent)} className="row">
              {m.readAt ? <Checks size={13} weight="bold" /> : <Check size={13} />}
            </span>
          )}
        </span>
        {s.isAdmin && m.author === 'supplier' && !m.flaggedNoteId && (
          <button type="button" className="ds-bubble__ref" onClick={() => s.openFlag(m.id)}>
            <SealCheck size={12} aria-hidden="true" /> {t(K.bubble.addToRecord)}
          </button>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- sheets */

function AttachSheet({ s, t }: { s: SupplierMessagesState; t: T }) {
  const view = s.view!;
  return (
    <Sheet
      open={s.attachOpen}
      onClose={() => s.setAttachOpen(false)}
      title={t(K.composer.attachTitle)}
      closeLabel={t('action.close')}
      footer={
        <Button block onClick={() => s.setAttachOpen(false)}>
          {t(K.composer.attachDone)}
        </Button>
      }
    >
      <div className="stack gap-3">
        <Field label={t(K.composer.attachOrder)}>
          {({ id }) => (
            <Select id={id} value={s.poRef} onChange={(e) => s.setPoRef(e.target.value)}>
              <option value="">{t(K.composer.attachNone)}</option>
              {view.poOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <DocumentSlot label={t(K.composer.attachDocument)} value={s.document} onChange={s.setDocument} accept="application/pdf,image/*" skipQualityCheck />
      </div>
    </Sheet>
  );
}

function LogSheet({ s, t }: { s: SupplierMessagesState; t: T }) {
  const toast = useToast();
  const view = s.view!;
  return (
    <Sheet
      open={s.logOpen}
      onClose={() => s.setLogOpen(false)}
      title={t(K.log.title, { supplier: view.supplier.name })}
      closeLabel={t('action.close')}
      footer={
        <Button
          block
          disabled={s.logBody.trim().length < 4 || s.logInFuture || !s.logAt}
          loading={s.sending}
          onClick={() => void s.saveLog().then((ok) => toast.push(t(ok ? K.toast.logged : K.toast.error), ok ? 'success' : 'error'))}
        >
          {t(K.log.save)}
        </Button>
      }
    >
      <div className="stack gap-3">
        <Field label={t(K.log.direction)}>
          {({ id }) => (
            <Select id={id} value={s.logAuthor} onChange={(e) => s.setLogAuthor(e.target.value as typeof s.logAuthor)}>
              <option value="supplier">{t(K.log.theyContacted, { supplier: view.supplier.name })}</option>
              <option value="aiec">{t(K.log.weContacted, { supplier: view.supplier.name })}</option>
            </Select>
          )}
        </Field>
        <div className="grid-2 gap-2">
          <Field label={t(K.log.channel)}>
            {({ id }) => (
              <Select id={id} value={s.logChannel} onChange={(e) => s.setLogChannel(e.target.value as typeof s.logChannel)}>
                {LOGGABLE_CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {t(K.bubble.channel[c])}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t(K.log.when)} error={s.logInFuture ? t(K.log.future) : undefined}>
            {({ id, describedBy, invalid }) => (
              <Input id={id} aria-describedby={describedBy} invalid={invalid} type="datetime-local" value={s.logAt} onChange={(e) => s.setLogAt(e.target.value)} />
            )}
          </Field>
        </div>
        <Field label={t(K.log.summary)} hint={t(K.log.summaryHint)} required>
          {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={3} value={s.logBody} onChange={(e) => s.setLogBody(e.target.value)} />}
        </Field>
        <Checkbox
          checked={s.logExpectsReply}
          onChange={s.setLogExpectsReply}
          label={t(s.logAuthor === 'aiec' ? K.log.theyOwe : K.log.weOwe, { supplier: view.supplier.name })}
        />
      </div>
    </Sheet>
  );
}

function RecordSheet({ s, t }: { s: SupplierMessagesState; t: T }) {
  const toast = useToast();
  const navigate = useNavigate();
  const view = s.view!;
  const m = s.flagMessage;
  return (
    <Sheet
      open={m !== null}
      onClose={s.closeFlag}
      title={t(K.record.title, { supplier: view.supplier.name })}
      closeLabel={t('action.close')}
      footer={
        <Button
          block
          disabled={s.flagNote.trim().length < 10}
          loading={s.sending}
          onClick={() =>
            void s.saveFlag().then((ok) => {
              toast.push(t(ok ? K.toast.recorded : K.toast.error), ok ? 'success' : 'error');
            })
          }
        >
          {t(K.record.save)}
        </Button>
      }
    >
      {m && (
        <div className="stack gap-3">
          <p className="t-xs t-muted">{t(K.record.hint)}</p>
          <Card>
            <span className="t-xs t-muted">{m.authorName}</span>
            <p className="t-sm">“{m.body}”</p>
          </Card>
          <Field label={t(K.record.note)} required>
            {({ id }) => <TextArea id={id} rows={3} value={s.flagNote} onChange={(e) => s.setFlagNote(e.target.value)} />}
          </Field>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/scorecard?supplierId=${view.supplier.id}`)}>
            {t(K.record.viewScorecard)}
          </Button>
        </div>
      )}
    </Sheet>
  );
}

function StartSheet({ s, t }: { s: SupplierMessagesState; t: T }) {
  return (
    <Sheet
      open={s.startOpen}
      onClose={() => s.setStartOpen(false)}
      title={t(K.start.title)}
      closeLabel={t('action.close')}
      footer={
        <Button block disabled={!s.startSupplier} onClick={s.confirmStart}>
          {t(K.start.open)}
        </Button>
      }
    >
      <div className="stack gap-3">
        {s.isAdmin && (
          <Field label={t(K.start.supplier)}>
            {({ id }) => (
              <Select id={id} value={s.startSupplierId} onChange={(e) => s.setStartSupplierId(e.target.value)}>
                <option value="">—</option>
                {s.suppliers.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
        <Field label={t(K.start.topic)}>
          {({ id }) => (
            <Select id={id} value={s.startPoId} disabled={!s.startSupplier} onChange={(e) => s.setStartPoId(e.target.value)}>
              <option value="">{t(K.list.general)}</option>
              {s.startPoOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {t(K.list.order, { code: p.code })}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
    </Sheet>
  );
}

