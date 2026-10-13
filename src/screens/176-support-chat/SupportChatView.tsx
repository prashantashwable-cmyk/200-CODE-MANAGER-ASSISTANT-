import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, PaperPlaneTilt, Phone, Robot, WarningCircle } from '@phosphor-icons/react';
import { useSession } from '@/session/SessionProvider';
import { Badge, Button, Card, Chip, EmptyState, ErrorState, Input, LoadingState, Screen, ScreenHeader, formatDate, formatINR, formatTime } from '@/design-system';
import type { SupportMessageView, SupportThread } from '@/data/repository';
import { botParams } from '@/features/support/render';
import { AGENT_TEMPLATES, QUICK_INTENTS } from '@/features/support/chat';
import { CHAT_KEYS as K, MAX_LENGTH } from './support-chat.types';
import { useSupportChat } from './useSupportChat';
import type { Pending, SupportChatState } from './useSupportChat';

type T = ReturnType<typeof useTranslation>['t'];
type Head = (sub: string, extra?: ReactNode) => ReactNode;
const telOf = (p: string | null) => (p ? `tel:${p.replace(/[^\d+]/g, '')}` : undefined);
const LANGUAGE_NAME: Record<string, string> = { en: 'English', hi: 'हिन्दी', mr: 'मराठी' };
const dayKey = (iso: string) => iso.slice(0, 10);

/** Screen 176 — Live Chat with AIEC Support. The customer's after-sale conversation: an assistant that answers from their own records and hands over, warmly and with everything it knows, to a person whenever it is not sure; and the agent's board and thread, with the customer's whole picture beside it. */
export function SupportChatScreen() {
  const { t } = useTranslation();
  const s = useSupportChat();
  const head: Head = (sub, extra) => <ScreenHeader title={t(K.title)} subtitle={sub} action={<span className="row gap-2">{extra}<Button size="sm" variant="ghost" data-refresh onClick={() => void s.refresh()}><ArrowsClockwise size={14} aria-hidden="true" /> {t(K.refresh)}</Button></span>} />;
  if (s.role === 'admin') return s.conversationId ? <AdminThread s={s} t={t} head={head} /> : <AdminBoard s={s} t={t} head={head} />;
  return <CustomerChat s={s} t={t} head={head} />;
}
interface P { s: SupportChatState; t: T; head: Head }

function Bubble({ m, lang, t, s }: { m: SupportMessageView | (Pick<SupportMessageView, 'id' | 'from' | 'text' | 'at'> & { key?: null; params?: null; links?: []; senderName?: null; notSent?: boolean }); lang: string; t: T; s: SupportChatState }) {
  const mine = m.from === 'customer';
  const bot = m.from === 'bot';
  const agent = m.from === 'agent';
  const text = m.text ?? (m.key ? t(m.key, botParams(m.params, lang)) : '');
  const notSent = 'notSent' in m && m.notSent;
  return (
    <div className={`ds-bubble-row ${mine ? 'ds-bubble-row--own' : ''}`} data-msg={m.id} data-from={m.from}>
      <div className={`ds-bubble ${mine ? 'ds-bubble--own' : ''}`} style={agent ? { border: '1px solid var(--color-accent-secondary)' } : undefined}>
        {!mine && <span className="ds-bubble__tag">{bot ? <><Robot size={12} aria-hidden="true" /> {t(K.tag.bot)}</> : <>{m.senderName} · {t(K.tag.team)}</>}</span>}
        <span className="t-sm" style={{ whiteSpace: 'pre-wrap' }}>{text}</span>
        {(m.links ?? []).length > 0 && <span className="row gap-1" style={{ flexWrap: 'wrap' }}>{(m.links ?? []).map((l) => <button key={l.route} type="button" className="ds-bubble__ref" data-link={l.route} onClick={() => s.goTo(l.route)}>{t(l.labelKey)}</button>)}</span>}
        <span className="ds-bubble__meta">{notSent ? t(K.composer.notSent) : formatTime(m.at, lang)}</span>
      </div>
    </div>
  );
}

function Thread({ messages, pending, s, t, lang }: { messages: SupportMessageView[]; pending: Pending[]; s: SupportChatState; t: T; lang: string }) {
  const end = useRef<HTMLDivElement>(null);
  const count = messages.length + pending.length;
  useEffect(() => { end.current?.scrollIntoView?.({ block: 'end' }); }, [count]);
  let last = '';
  const items: ReactNode[] = [];
  for (const m of messages) {
    if (dayKey(m.at) !== last) { last = dayKey(m.at); items.push(<span key={`d-${last}`} className="ds-thread__break">{formatDate(m.at, lang)}</span>); }
    items.push(<Bubble key={m.id} m={m} lang={lang} t={t} s={s} />);
  }
  for (const p of pending) items.push(<Bubble key={p.clientId} m={{ id: p.clientId, from: 'customer', text: p.text, at: p.at, notSent: true }} lang={lang} t={t} s={s} />);
  return <div className="ds-thread" data-thread>{items}<div ref={end} /></div>;
}

/* ------------------------------------------------------------------ the customer */

function CustomerChat({ s, t, head }: P) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const c = s.chat;
  const [text, setText] = useState('');
  if (s.load === 'loading' && !c) return <Screen width="narrow">{head(t(K.subtitle.customer))}<LoadingState label={t(K.loading)} variant="list" rows={4} /></Screen>;
  if (s.load === 'error' && !c) return <Screen width="narrow">{head(t(K.subtitle.customer))}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /></Screen>;
  if (!c) return null;
  const empty = c.messages.length === 0 && s.pending.length === 0;
  const send = async (value: string, intent?: Parameters<typeof s.send>[1]) => { if (!value.trim()) return; setText(''); await s.send(value, intent); };
  const state = c.handling;
  return (
    <Screen width="narrow">
      {head(t(K.subtitle.customer))}
      {(s.offline || s.pending.length > 0) && <p className="t-xs t-muted mb-2" data-offline>{t(K.offline)}</p>}
      <Card>
        <div className="stack gap-1" data-handling={state}>
          <span className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Badge tone={state === 'bot' ? 'neutral' : 'accent'}>{state === 'human' ? t(K.handling.human.badge) : state === 'waiting' ? t(K.handling.waiting.badge) : t(K.handling.bot.badge)}</Badge>
            <span className="t-sm t-semibold">{state === 'human' ? t(K.handling.human.title, { name: c.agentName ?? '' }) : state === 'waiting' ? t(K.handling.waiting.title) : t(K.handling.bot.title)}</span>
          </span>
          <p className="t-sm t-muted">{state === 'human' ? t(K.handling.human.body) : state === 'waiting' && c.queue ? t(K.handling.waiting.body, { position: c.queue.position, minutes: c.queue.expectedMin }) : t(K.handling.bot.body)}</p>
          {state === 'waiting' && c.queue?.busy && <p className="t-sm" data-busy>{t(K.handling.waiting.busy)}</p>}
        </div>
      </Card>
      <div className="mt-3" />
      {c.emergencyPhone && <p className="t-xs t-muted mb-2" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><WarningCircle size={14} aria-hidden="true" /> {t(K.emergency.note)} <a className="ds-btn ds-btn--ghost ds-btn--sm" href={telOf(c.emergencyPhone)}><Phone size={14} aria-hidden="true" /> {t(K.emergency.call)}</a></p>}
      {empty ? <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} /> : <Thread messages={c.messages} pending={s.pending} s={s} t={t} lang={lang} />}
      {s.failed && <p className="t-sm" role="alert" style={{ color: 'var(--color-error)' }}>{t(K.composer.failed)}</p>}
      <div style={{ position: 'sticky', bottom: 'var(--shell-bottom-height, 0px)', background: 'var(--color-bg)', paddingTop: 8, paddingBottom: 8, marginTop: 12 }} data-composer>
        <div className="row gap-2" data-quick style={{ overflowX: 'auto', paddingBottom: 6 }} aria-label={t(K.quick.label)}>
          {QUICK_INTENTS.map((i) => <span key={i} data-quick-intent={i} style={{ flex: '0 0 auto' }}><Chip onClick={() => void send(t(`supportChat.quick.${i}`), i as Parameters<typeof s.send>[1])}>{t(`supportChat.quick.${i}`)}</Chip></span>)}
        </div>
        <form className="row gap-2" onSubmit={(e) => { e.preventDefault(); void send(text); }}>
          <div style={{ flex: 1 }}><Input value={text} maxLength={MAX_LENGTH} placeholder={t(K.composer.placeholder)} aria-label={t(K.composer.placeholder)} data-f="message" onChange={(e) => setText(e.target.value)} /></div>
          <Button type="submit" data-act="send" disabled={!text.trim()}><PaperPlaneTilt size={16} aria-hidden="true" /> {t(K.composer.send)}</Button>
        </form>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ the agent */

const handlingTone = (h: string) => (h === 'waiting' ? 'warning' : h === 'human' ? 'accent' : 'neutral');
function AdminBoard({ s, t, head }: P) {
  const b = s.board;
  const filters = ['waiting', 'human', 'bot', 'all'] as const;
  const rows = (b?.rows ?? []).filter((r) => s.filter === 'all' || r.handling === s.filter);
  return (
    <Screen width="default">
      {head(t(K.subtitle.admin))}
      <div className="row gap-2 mb-3" style={{ overflowX: 'auto' }} data-filters>
        {filters.map((f) => <span key={f} data-filter={f} style={{ flex: '0 0 auto' }}><Chip pressed={s.filter === f} onClick={() => s.setFilter(f)}>{t(`supportChat.board.filter.${f}`)}{b ? ` · ${b.counts[f]}` : ''}</Chip></span>)}
      </div>
      {b?.busy && <p className="t-sm mb-2" data-busy>{t(K.board.busy)}</p>}
      <p className="t-xs t-muted mb-2">{t(K.notice.placeholders)}</p>
      {s.load === 'loading' && !b ? <LoadingState label={t(K.loading)} variant="list" rows={4} />
        : s.load === 'error' && !b ? <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} />
        : rows.length === 0 ? <EmptyState title={t(K.board.empty.title)} body={t(K.board.empty.body)} />
        : <div className="grid-auto" data-board>{rows.map((r) => (
          <Card key={r.conversationId}><button type="button" data-conv={r.conversationId} className="stack gap-1" style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', color: 'inherit', cursor: 'pointer', width: '100%' }} onClick={() => s.open(r.conversationId)}>
            <span className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center' }}><span className="t-sm t-semibold">{r.customerName}</span><Badge tone={handlingTone(r.handling)}>{t(`supportChat.handling.${r.handling}.badge`)}</Badge></span>
            <span className="t-xs t-muted">{r.siteName}</span>
            {r.preview && <span className="t-sm" style={{ overflowWrap: 'anywhere' }}>{r.preview}</span>}
            <span className="row gap-1" style={{ flexWrap: 'wrap' }}>
              {r.handling === 'waiting' && <Badge tone={r.slaBreached ? 'warning' : 'neutral'}>{t(K.board.waited, { minutes: r.waitingMinutes })}</Badge>}
              {r.slaBreached && <Badge tone="warning">{t(K.board.sla)}</Badge>}
              {r.urgent && <Badge tone="error">{t(K.board.urgent)}</Badge>}
              {r.reason && <Badge tone="neutral">{t(`supportChat.reason.${r.reason}`)}</Badge>}
            </span>
          </button></Card>))}</div>}
    </Screen>
  );
}

function AdminThread({ s, t, head }: P) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const th = s.thread;
  const { user } = useSession();
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const back = <Button size="sm" variant="ghost" data-back onClick={() => s.list()}>{t(K.back)}</Button>;
  if (s.threadState === 'loading' && !th) return <Screen width="default">{head('', back)}<LoadingState label={t(K.loading)} variant="list" rows={4} /></Screen>;
  if (!th) return <Screen width="default">{head('', back)}{s.threadState === 'error' ? <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /> : <EmptyState title={t(K.notFound)} body="" actionLabel={t(K.back)} onAction={() => s.list()} />}</Screen>;
  const ctx = th.handoff?.snapshot ?? th.context;
  const customerLang = ctx.language;
  const tpl = (id: string) => t(`supportChat.agent.template.${id}`, { lng: customerLang, name: ctx.customerName.split(/\s+/)[0] ?? '', agent: user?.name.trim().split(/\s+/)[0] ?? '' });
  const send = async () => { if (!text.trim()) return; const ok = await s.agentSend(text); if (ok) { setText(''); setSent(true); } };
  return (
    <Screen width="default">
      {head(`${ctx.customerName} · ${ctx.phone}`, back)}
      <div className="main-aside">
        <div className="stack gap-3" data-main>
          <Card>
            <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }} data-handling={th.chat.handling}>
              <Badge tone={handlingTone(th.chat.handling)}>{t(`supportChat.handling.${th.chat.handling}.badge`)}</Badge>
              {th.handoff && <><Badge tone={th.handoff.slaBreached ? 'warning' : 'neutral'}>{t(K.board.waited, { minutes: th.handoff.waitingMinutes })}</Badge><Badge tone="neutral">{t(`supportChat.reason.${th.handoff.reason}`)}</Badge>{th.handoff.urgent && <Badge tone="error">{t(K.board.urgent)}</Badge>}</>}
              <span className="t-xs t-muted">{th.chat.handling === 'human' ? t(K.agent.youHandle) : t(K.agent.assistantHandles)}</span>
            </div>
          </Card>
          <Thread messages={th.chat.messages} pending={[]} s={s} t={t} lang={lang} />
          <Card>
            <div className="stack gap-2" data-agent-composer>
              <span className="t-xs t-muted">{t(K.agent.templates)}</span>
              <div className="row gap-2" style={{ flexWrap: 'wrap' }}>{AGENT_TEMPLATES.map((id) => <span key={id} data-template={id}><Chip onClick={() => { setText(tpl(id)); setSent(false); }}>{tpl(id).slice(0, 26)}…</Chip></span>)}</div>
              <textarea className="ds-input" rows={3} value={text} maxLength={MAX_LENGTH} placeholder={t(K.agent.placeholder)} aria-label={t(K.agent.placeholder)} data-f="agent-reply" onChange={(e) => { setText(e.target.value); setSent(false); }} />
              <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                <Button data-act="agent-send" disabled={!text.trim()} onClick={() => void send()}><PaperPlaneTilt size={16} aria-hidden="true" /> {t(K.agent.send)}</Button>
                {th.chat.handling === 'human' && <Button variant="secondary" data-act="hand-back" onClick={() => void s.handBack()}>{t(K.agent.handBack)}</Button>}
                {sent && <span className="t-xs t-muted" data-sent>{t(K.agent.sent)}</span>}
              </div>
            </div>
          </Card>
        </div>
        <div className="stack gap-3" data-aside><Context th={th} t={t} lang={lang} /></div>
      </div>
    </Screen>
  );
}

function Context({ th, t, lang }: { th: SupportThread; t: T; lang: string }) {
  const frozen = !!th.handoff;
  const c = th.handoff?.snapshot ?? th.context;
  return (
    <Card>
      <div className="stack gap-2" data-context>
        <h2 className="t-md t-semibold">{t(K.ctx.title)}</h2>
        <p className="t-xs t-muted">{frozen ? t(K.ctx.frozen) : t(K.ctx.live)}</p>
        <div className="stack gap-1">
          <p className="t-sm">{c.customerName}</p>
          <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <a className="ds-btn ds-btn--secondary ds-btn--sm" href={telOf(c.phone)}><Phone size={14} aria-hidden="true" /> {c.phone}</a>
            <span className="t-xs t-muted">{t(K.ctx.language, { language: LANGUAGE_NAME[c.language] ?? c.language })}</span>
          </div>
        </div>
        <h3 className="t-sm t-semibold">{t(K.ctx.projects)}</h3>
        {c.projects.map((p, i) => (
          <div key={`${p.dealId}-${p.code}`} className="stack gap-0" data-project={p.dealId}>
            <span className="t-sm">{p.siteName} · {p.code}</span>
            <span className="t-xs t-muted">{p.mode === 'service' ? t(K.ctx.stage.service) : p.stage ? t(`supportChat.ctx.stage.${p.stage}`) : ''}{p.percent !== null && p.mode !== 'service' ? ` · ${t(K.ctx.percent, { percent: Math.round(p.percent) })}` : ''}</span>
            {c.projects.findIndex((x) => x.dealId === p.dealId) === i && <span className="t-xs t-muted">{t(`supportChat.ctx.pay.${p.payment.kind}`, { amount: formatINR(p.payment.amount) })}{p.payment.dueAt && (p.payment.kind === 'overdue' || p.payment.kind === 'due' || p.payment.kind === 'upcoming') ? ` · ${formatDate(p.payment.dueAt, lang)}` : ''}</span>}
          </div>
        ))}
        <h3 className="t-sm t-semibold">{t(K.ctx.ticketsTitle)}</h3>
        {c.tickets.length === 0 ? <p className="t-xs t-muted">{t(K.ctx.tickets.none)}</p> : c.tickets.map((x) => <p key={x.id} className="t-xs" data-ticket={x.id}>{x.code} · {t(`serviceTickets.status.${x.status}`)} · {x.summary}</p>)}
        {c.coverage.length > 0 && <><h3 className="t-sm t-semibold">{t(K.ctx.coverage)}</h3>{c.coverage.map((x) => <p key={x.siteName} className="t-xs">{x.siteName}: {t(`serviceTickets.coverage.${x.state}`, { date: x.endsOn ? formatDate(x.endsOn, lang) : '' })}</p>)}</>}
        <p className="t-xs t-muted">{t(K.ctx.documents, { count: c.documents })}</p>
      </div>
    </Card>
  );
}
