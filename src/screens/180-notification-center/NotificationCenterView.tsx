import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowsClockwise, Bell, BellSimple, CheckCircle } from '@phosphor-icons/react';
import { ActionBar, Badge, Button, Card, Chip, EmptyState, ErrorState, LoadingState, Screen, ScreenHeader, Sheet, Tabs, Toggle, formatDate, useToast } from '@/design-system';
import type { NotificationCenterView, NotificationItemView, NotificationPrefsView } from '@/data/repository';
import { OPTIONAL, dayLabelOf, isEssential, rowsOf } from '@/features/notifications/center';
import type { NotificationCategory, OptionalCategory } from '@/features/notifications/center';
import { CATEGORY_ORDER, NOTIFICATION_KEYS as K } from './notification-center.types';
import { useNotifications } from './useNotifications';
import type { NotificationsState } from './useNotifications';

type T = ReturnType<typeof useTranslation>['t'];
const problemText = (t: T, code: string) => t(`notifications.problem.${code}`, { defaultValue: t(K.problem.generic) });
const channelWord = (t: T, c: string) => t(`notifications.prefs.channel.${c}`, { defaultValue: c });
const titleOf = (t: T, i: NotificationItemView) => t(i.titleKey, { ...(i.titleParams ?? {}), defaultValue: t(K.group.generic) });

/** Screen 180 — Customer Notification Center. A view over what the Communication Engine and the commitment engine have already sent, grouped by day and kind so an eventful week stays scannable, where each notice opens at its place and says what is true now, and preferences that write to the compliance opt-out record. */
export function NotificationCenterScreen() {
  const { t, i18n } = useTranslation();
  const s = useNotifications();
  const v = s.view;
  const head = (
    <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" variant="ghost" data-refresh onClick={() => void s.refresh()} aria-label={t(K.refresh)}><ArrowsClockwise size={18} /></Button>} />
  );
  if (s.load === 'loading' && !v) return <Screen width="narrow">{head}<LoadingState label={t(K.loading)} variant="list" rows={5} /></Screen>;
  if (s.load === 'error' && !v) return <Screen width="narrow">{head}<ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.refresh()} /></Screen>;
  if (!v) return null;
  return (
    <Screen width="narrow">
      {head}
      <div className="stack gap-3">
        <Tabs label={t(K.title)} value={s.tab} onChange={(id) => s.setTab(id as 'feed' | 'prefs')} items={[{ id: 'feed', label: `${t(K.tabs.feed)}${v.unread > 0 ? ` · ${v.unread}` : ''}` }, { id: 'prefs', label: t(K.tabs.prefs) }]} />
        {s.offline && <p className="t-xs t-muted" role="status" data-offline>{t(K.error.body)}</p>}
        {s.tab === 'feed' ? <Feed v={v} s={s} t={t} lang={i18n.language} /> : <Prefs s={s} t={t} lang={i18n.language} />}
        <p className="t-xs t-muted" data-placeholder-note>{t(K.notice.placeholders)}</p>
      </div>
      <Detail s={s} t={t} lang={i18n.language} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ the feed */

function Feed({ v, s, t, lang }: { v: NotificationCenterView; s: NotificationsState; t: T; lang: string }) {
  const [open, setOpen] = useState<string[]>([]);
  const everything = v.counts.payments.total + v.counts.project.total + v.counts.delivery.total + v.counts.service.total + v.counts.plan.total + v.counts.offers.total;
  const now = Date.now();
  const rows = rowsOf(v.items);
  // Day headings: the first row of each day carries it.
  let lastDay = '';
  return (
    <div className="stack gap-3" data-feed>
      <div className="stack gap-2">
        <div className="row gap-2 wrap" role="group" aria-label={t(K.tabs.feed)} data-filters>
          <span data-cat="all"><Chip pressed={!s.category} onClick={() => s.setCategory(null)}>{t(K.feed.filter.all)}</Chip></span>
          {CATEGORY_ORDER.filter((c) => v.counts[c].total > 0).map((c) => <span key={c} data-cat={c}><Chip pressed={s.category === c} onClick={() => s.setCategory(c)}>{t(`notifications.category.${c}`)}{v.counts[c].unread > 0 ? ` · ${v.counts[c].unread}` : ''}</Chip></span>)}
        </div>
        <div className="row gap-2 wrap" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <span data-unread-only><Chip pressed={s.unreadOnly} onClick={() => s.setUnreadOnly(!s.unreadOnly)}>{t(K.feed.filter.unread)}{v.unread > 0 ? ` · ${v.unread}` : ''}</Chip></span>
          {v.unread > 0 && <Button size="sm" variant="ghost" data-act="mark-all" onClick={() => void s.markAll()}><CheckCircle size={16} /> {t(K.feed.markAll)}</Button>}
        </div>
      </div>
      {everything === 0 && <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />}
      {everything > 0 && v.items.length === 0 && (s.unreadOnly && !s.category ? <EmptyState title={t(K.feed.allRead)} body="" /> : <EmptyState title={t(K.empty.filtered.title)} body={t(K.empty.filtered.body)} actionLabel={t(K.feed.filter.all)} onAction={() => { s.setCategory(null); s.setUnreadOnly(false); }} />)}
      {rows.map((r) => {
        const first = r.kind === 'item' ? r.item : r.items[0];
        const showDay = first.dayKey !== lastDay;
        lastDay = first.dayKey;
        const heading = showDay ? dayHeading(first.at, now, t, lang) : null;
        return (
          <div key={r.kind === 'item' ? r.item.id : r.key} className="stack gap-2">
            {heading && <h2 className="t-xs t-muted t-semibold" data-day={first.dayKey} style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{heading}</h2>}
            {r.kind === 'item'
              ? <Row i={r.item} s={s} t={t} lang={lang} />
              : (
                <div className="stack gap-2" data-group={r.key}>
                  <button type="button" className="ds-card tappable" data-act="group" aria-expanded={open.includes(r.key)} onClick={() => setOpen((o) => (o.includes(r.key) ? o.filter((x) => x !== r.key) : [...o, r.key]))} style={{ display: 'block', textAlign: 'left', width: '100%' }}>
                    <span className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="t-sm t-semibold">{t(K.feed.group.count, { count: r.items.length, category: t(`notifications.category.${r.category}`) })}</span>
                      <span className="row gap-2" style={{ alignItems: 'center' }}>{r.unread > 0 && <Badge tone="accent">{t(K.feed.unread, { count: r.unread })}</Badge>}<span className="t-xs t-muted">{open.includes(r.key) ? t(K.feed.group.collapse) : t(K.feed.group.expand)}</span></span>
                    </span>
                  </button>
                  {open.includes(r.key) && r.items.map((i) => <Row key={i.id} i={i} s={s} t={t} lang={lang} />)}
                </div>
              )}
          </div>
        );
      })}
      {v.total > v.items.length && <Button variant="secondary" data-act="more" onClick={s.showMore}>{t(K.feed.showMore)}</Button>}
    </div>
  );
}

function dayHeading(at: string, now: number, t: T, lang: string): string {
  const d = dayLabelOf(at, now).label;
  return d === 'today' ? t(K.feed.day.today) : d === 'yesterday' ? t(K.feed.day.yesterday) : formatDate(at, lang);
}

function Row({ i, s, t, lang }: { i: NotificationItemView; s: NotificationsState; t: T; lang: string }) {
  const preview = i.body.length > 140 ? `${i.body.slice(0, 140)}…` : i.body;
  return (
    <button type="button" className="ds-card tappable" data-item={i.id} data-read={i.read ? '1' : '0'} data-category={i.category} onClick={() => void s.open(i)} style={{ display: 'block', textAlign: 'left', width: '100%', borderColor: i.read ? undefined : 'var(--color-accent-primary)' }}>
      <span className="stack gap-1">
        <span className="row gap-2" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="row gap-2" style={{ alignItems: 'center' }}>
            {!i.read && <span aria-label={t(K.row.new)} role="img" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent-primary)', display: 'inline-block' }} />}
            <span className={`t-sm ${i.read ? '' : 't-semibold'}`}>{titleOf(t, i)}</span>
          </span>
          <Badge tone={i.essential ? 'neutral' : 'accent'}>{t(`notifications.category.${i.category}`)}</Badge>
        </span>
        {preview && <span className="t-xs t-muted">{preview}</span>}
        <span className="t-xs t-muted">{formatDate(i.at, lang)} · {i.source === 'work' ? t(K.row.work) : t(`notifications.row.via.${i.channel}`)}</span>
        {i.fellBackFrom && <span className="t-xs" data-fellback>{t(K.row.fellBack, { channel: channelWord(t, i.fellBackFrom) })}</span>}
      </span>
    </button>
  );
}

function Detail({ s, t, lang }: { s: NotificationsState; t: T; lang: string }) {
  const nav = useNavigate();
  const i = s.item;
  const st = s.state;
  const goto = (route: string | null) => { if (route) { s.close(); nav(route); } };
  return (
    <Sheet open={!!i} onClose={s.close} title={i ? titleOf(t, i) : ''} closeLabel={t(K.close)}>
      {i && (
        <div className="stack gap-3" data-detail={i.id}>
          <span className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Badge tone={i.essential ? 'neutral' : 'accent'}>{t(`notifications.category.${i.category}`)}</Badge>
            <Badge tone="neutral">{i.essential ? t(K.kind.essential) : t(K.kind.optional)}</Badge>
            <span className="t-xs t-muted">{t(K.detail.sent, { date: formatDate(i.at, lang) })} · {i.source === 'work' ? t(K.row.work) : t(`notifications.row.via.${i.channel}`)}</span>
          </span>
          {i.body && <p className="t-sm" data-body style={{ whiteSpace: 'pre-wrap' }}>{i.body}</p>}
          {i.fellBackFrom && <p className="t-xs t-muted">{t(K.row.fellBack, { channel: channelWord(t, i.fellBackFrom) })}</p>}
          <Card>
            <div className="stack gap-1" data-now>
              <span className="t-xs t-muted t-semibold">{t(K.detail.now)}</span>
              <p className="t-sm">{st && st.key ? t(st.key, { ...st.params, amount: typeof st.params.amount === 'number' ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(st.params.amount) : st.params.amount, date: typeof st.params.date === 'string' && st.params.date ? formatDate(st.params.date, lang) : '', stage: st.params.stage ? t(`customerHome.stage.${st.params.stage}`, { defaultValue: String(st.params.stage) }) : '' }) : t(K.detail.noState)}</p>
            </div>
          </Card>
          {i.route && <Button block data-act="open" onClick={() => goto(st?.route ?? i.route)}><BellSimple size={18} /> {t(K.detail.open)}</Button>}
        </div>
      )}
    </Sheet>
  );
}

/* ------------------------------------------------------------------ preferences */

function ChannelRow({ id, on, locked, since, set, t, lang }: { id: 'sms' | 'whatsapp'; on: boolean; locked: 'stop' | 'dnd' | null; since: string | null; set: (v: boolean) => void; t: T; lang: string }) {
  return (
    <div className="stack gap-1" data-channel={id}>
      <Toggle checked={on} onChange={set} label={t(`notifications.prefs.channels.${id}`)} disabled={locked === 'dnd'} />
      {!on && locked === 'stop' && since && <p className="t-xs t-muted">{t(K.prefs.channels.stop, { date: formatDate(since, lang) })}</p>}
      {!on && locked === 'dnd' && <p className="t-xs t-muted">{t(K.prefs.channels.dnd)}</p>}
    </div>
  );
}

function Prefs({ s, t, lang }: { s: NotificationsState; t: T; lang: string }) {
  const toast = useToast();
  const p: NotificationPrefsView | null = s.prefs;
  const d = s.draft;
  const [problem, setProblem] = useState<string | null>(null);
  if (!p || !d) return <LoadingState label={t(K.loading)} variant="list" rows={3} />;
  const dirty = d.sms !== p.channels.sms.on || d.whatsapp !== p.channels.whatsapp.on || JSON.stringify(d.optional) !== JSON.stringify(p.optional);
  const bothOff = !d.sms && !d.whatsapp;
  const save = async () => { setProblem(null); const r = await s.save(); if (r.ok) toast.push(t(K.prefs.saved)); else setProblem(r.problem); };
  const setOptional = (c: OptionalCategory, patch: Partial<{ sms: boolean; whatsapp: boolean; inApp: boolean }>) => s.edit({ optional: { ...d.optional, [c]: { ...d.optional[c], ...patch } } });
  return (
    <div className="stack gap-3 pb-action-bar" data-prefs>
      <Card>
        <div className="stack gap-3">
          <h2 className="t-md t-semibold">{t(K.prefs.channels.title)}</h2>
          <p className="t-sm t-muted">{t(K.prefs.intro)}</p>
          <ChannelRow id="sms" on={d.sms} locked={p.channels.sms.locked} since={p.channels.sms.since} set={(v) => s.edit({ sms: v })} t={t} lang={lang} />
          <ChannelRow id="whatsapp" on={d.whatsapp} locked={p.channels.whatsapp.locked} since={p.channels.whatsapp.since} set={(v) => s.edit({ whatsapp: v })} t={t} lang={lang} />
          <div className="stack gap-1" data-channel="in_app"><Toggle checked onChange={() => undefined} disabled label={t(K.prefs.channels.inApp)} description={t(K.prefs.channels.inAppHint)} /></div>
          <p className="t-xs t-muted">{t(K.prefs.channels.number, { phone: p.phoneMasked })}</p>
        </div>
      </Card>
      {bothOff && (
        <Card>
          <div className="stack gap-1" role="status" data-warn="in-app-only" style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: 12 }}>
            <span className="t-sm t-semibold">{t(K.prefs.warn.title)}</span>
            <p className="t-xs">{t(K.prefs.warn.body)}</p>
          </div>
        </Card>
      )}
      <Card>
        <div className="stack gap-2" data-essential>
          <h2 className="t-md t-semibold">{t(K.prefs.essential.title)}</h2>
          <p className="t-xs t-muted">{t(K.prefs.essential.body)}</p>
          {CATEGORY_ORDER.filter((c) => isEssential(c)).map((c) => (
            <div key={c} className="row gap-2" data-essential-item={c} style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="stack gap-0"><span className="t-sm t-semibold">{t(`notifications.category.${c}`)}</span><span className="t-xs t-muted">{t(`notifications.category.hint.${c}`)}</span></span>
              <Badge tone="neutral">{t(K.kind.essential)}</Badge>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="stack gap-3" data-optional>
          <h2 className="t-md t-semibold">{t(K.prefs.optional.title)}</h2>
          <p className="t-xs t-muted">{t(K.prefs.optional.body)}</p>
          {OPTIONAL.map((c) => {
            const o = d.optional[c];
            const off = !o.sms && !o.whatsapp && !o.inApp;
            return (
              <div key={c} className="stack gap-2" data-optional-item={c}>
                <span className="stack gap-0"><span className="t-sm t-semibold">{t(`notifications.category.${c}`)}</span><span className="t-xs t-muted">{t(`notifications.category.hint.${c}`)}</span></span>
                <div className="row gap-2 wrap" role="group">
                  <span data-opt="sms"><Chip pressed={o.sms} onClick={() => setOptional(c, { sms: !o.sms })}>{t(K.prefs.optional.sms)}</Chip></span>
                  <span data-opt="whatsapp"><Chip pressed={o.whatsapp} onClick={() => setOptional(c, { whatsapp: !o.whatsapp })}>{t(K.prefs.optional.whatsapp)}</Chip></span>
                  <span data-opt="inApp"><Chip pressed={o.inApp} onClick={() => setOptional(c, { inApp: !o.inApp })}>{t(K.prefs.optional.inApp)}</Chip></span>
                  <span data-opt="off"><Chip pressed={off} onClick={() => setOptional(c, { sms: false, whatsapp: false, inApp: false })}>{t(K.prefs.optional.off)}</Chip></span>
                </div>
                {((o.sms && !d.sms) || (o.whatsapp && !d.whatsapp)) && <p className="t-xs t-muted">{t(K.prefs.optional.channelsOff, { channel: [o.sms && !d.sms ? 'SMS' : '', o.whatsapp && !d.whatsapp ? 'WhatsApp' : ''].filter(Boolean).join(' / ') })}</p>}
              </div>
            );
          })}
        </div>
      </Card>
      <Card>
        <div className="stack gap-2" data-history>
          <h2 className="t-md t-semibold">{t(K.prefs.history.title)}</h2>
          {p.history.length === 0 && <p className="t-xs t-muted">{t(K.prefs.history.empty)}</p>}
          {p.history.map((h, i) => <p key={`${h.at}-${i}`} className="t-xs">{formatDate(h.at, lang)} · {t(K.prefs.history.line, { channel: channelWord(t, h.channel), state: h.on ? t(K.prefs.history.on) : t(K.prefs.history.off), source: t(`notifications.prefs.source.${h.source}`, { defaultValue: h.source }) })}</p>)}
        </div>
      </Card>
      {problem && <p className="t-sm t-error" role="alert" data-problem={problem}>{problemText(t, problem)}</p>}
      <ActionBar>
        {dirty && <Button variant="ghost" onClick={s.discard}>{t('action.cancel', { defaultValue: 'Cancel' })}</Button>}
        <Button className="grow" block data-act="save" disabled={!dirty} loading={s.saving} onClick={() => void save()}><Bell size={18} /> {t(K.prefs.save)}</Button>
      </ActionBar>
    </div>
  );
}
