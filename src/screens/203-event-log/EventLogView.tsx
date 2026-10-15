import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, Chip, EmptyState, ErrorState, Field, LoadingState, Screen, ScreenHeader, Sheet, TextArea, formatDateTime, useToast } from '@/design-system';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { EVENT_FAMILIES } from '@/features/events/taxonomy';
import type { EventFamily } from '@/features/events/taxonomy';
import type { PlatformEvent } from '@/features/events/eventLog';

type T = ReturnType<typeof useTranslation>['t'];
const errText = (t: T, code: string) => t(`eventLog.error.${code}`, { defaultValue: t('eventLog.error.generic') });
const FAMILIES = Object.keys(EVENT_FAMILIES) as EventFamily[];
/** `Lead · captured`, each part in the reader's language. */
const typeLabel = (t: T, type: string): string => { const [f, w] = type.split('.'); return `${t(`eventLog.family.${f}`)} · ${t(`eventLog.what.${w}`)}`; };

export function EventLogScreen() {
  const { t, i18n } = useTranslation();
  const repository = useData();
  const { user, role } = useSession();
  const toast = useToast();
  const uid = user?.id ?? '';
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [family, setFamily] = useState<EventFamily | null>(null);
  const [open, setOpen] = useState<PlatformEvent | null>(null);
  const [text, setText] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [corrected, setCorrected] = useState<Record<string, Record<string, unknown>>>({});

  const read = useCallback(async () => {
    if (!uid) return;
    try { setEvents(await repository.listEvents(uid, family ? { family } : {})); setState('ready'); } catch { setState((s) => (s === 'ready' ? s : 'error')); }
  }, [repository, uid, family]);
  useEffect(() => { setState((s) => (s === 'ready' ? s : 'loading')); void read(); }, [read]);

  const feed = useMemo(() => [...events].reverse(), [events]);
  const correctionsOf = useCallback((id: string) => events.filter((e) => e.about === id && (e.type === 'correction.applied' || e.type === 'correction.proposed')), [events]);

  const openEvent = async (e: PlatformEvent) => {
    setOpen(e); setText(''); setProblem(null);
    try { const eff = await repository.getEffectiveEvent(uid, e.id); setCorrected((c) => ({ ...c, [e.id]: eff.payload })); } catch { /* the original is still shown */ }
  };
  const act = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true); setProblem(null);
    try { await fn(); toast.push(t(done), 'success'); setText(''); await read(); } catch (e) { setProblem(e instanceof Error ? e.message : 'generic'); } finally { setBusy(false); }
  };
  const canWrite = role !== 'admin';

  return (
    <Screen width="wide">
      <ScreenHeader title={t('eventLog.title')} subtitle={t(role === 'admin' ? 'eventLog.subtitleAdmin' : 'eventLog.subtitle')} />
      <div className="row gap-2 wrap" role="group" aria-label={t('eventLog.filter')}>
        <Chip pressed={family === null} onClick={() => setFamily(null)}>{t('eventLog.all')}</Chip>
        {FAMILIES.map((f) => <Chip key={f} pressed={family === f} onClick={() => setFamily(f)}>{t(`eventLog.family.${f}`)}</Chip>)}
      </div>
      <div className="stack gap-3" style={{ marginTop: 'var(--space-4)' }}>
        {state === 'loading' && <LoadingState label={t('eventLog.loading')} rows={5} variant="list" />}
        {state === 'error' && <ErrorState title={t('eventLog.error.title')} body={t('eventLog.error.body')} retryLabel={t('eventLog.error.retry')} onRetry={() => void read()} />}
        {state === 'ready' && feed.length === 0 && <EmptyState title={t('eventLog.empty.title')} body={t('eventLog.empty.body')} />}
        {state === 'ready' && feed.map((e) => (
          <Card key={e.id} onClick={() => void openEvent(e)} title={typeLabel(t, e.type)} body={String(e.payload.siteName ?? e.payload.text ?? e.subject.id)}
            aside={<Badge tone={e.type.startsWith('correction') ? 'warning' : 'neutral'}>{t(`eventLog.family.${e.type.split('.')[0]}`)}</Badge>}>
            <div className="row gap-2 wrap" style={{ marginTop: 'var(--space-2)' }}>
              <span className="t-xs t-muted">{formatDateTime(e.capturedAt, i18n.language)}</span>
              <span className="t-xs t-muted">{t(`role.${e.actor.role}`, { defaultValue: e.actor.role })}</span>
              {correctionsOf(e.id).length > 0 && <Badge tone="warning">{t('eventLog.corrected')}</Badge>}
              {Math.abs(e.skewMs) > 300_000 && <Badge tone="neutral">{t('eventLog.clockOff')}</Badge>}
            </div>
          </Card>
        ))}
      </div>

      <Sheet open={open !== null} onClose={() => setOpen(null)} title={open ? typeLabel(t, open.type) : ''} closeLabel={t('eventLog.close')}>
        {open && (
          <div className="stack gap-4">
            <dl className="stack gap-1 t-sm">
              <div><dt className="t-xs t-muted">{t('eventLog.happened')}</dt><dd>{formatDateTime(open.capturedAt, i18n.language)}</dd></div>
              <div><dt className="t-xs t-muted">{t('eventLog.recorded')}</dt><dd>{formatDateTime(open.receivedAt, i18n.language)}</dd></div>
              <div><dt className="t-xs t-muted">{t('eventLog.by')}</dt><dd>{t(`role.${open.actor.role}`, { defaultValue: open.actor.role })}</dd></div>
              {open.geo && <div><dt className="t-xs t-muted">{t('eventLog.place')}</dt><dd>{open.geo.lat.toFixed(4)}, {open.geo.lng.toFixed(4)} ± {open.geo.accuracyM} m</dd></div>}
            </dl>
            <section className="stack gap-1"><h3 className="t-md t-semibold">{t('eventLog.original')}</h3><pre className="t-xs" style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(open.payload, null, 2)}</pre></section>
            {correctionsOf(open.id).length > 0 && <section className="stack gap-1"><h3 className="t-md t-semibold">{t('eventLog.nowReads')}</h3><pre className="t-xs" style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(corrected[open.id] ?? open.payload, null, 2)}</pre>
              <ul className="stack gap-1">{correctionsOf(open.id).map((c) => <li key={c.id} className="t-sm">{typeLabel(t, c.type)} · {String(c.payload.reason ?? '')}</li>)}</ul></section>}
            <Field label={t('eventLog.reasonLabel')} error={problem ? errText(t, problem) : undefined}>{({ id }) => <TextArea id={id} rows={3} value={text} onChange={(e) => setText(e.target.value)} />}</Field>
            <div className="row gap-2 wrap">
              {canWrite && open.actor.id === uid && !open.type.startsWith('correction') && !open.type.startsWith('event.') && (
                <Button loading={busy} onClick={() => void act(() => repository.correctEvent(uid, open.id, { note: text }, text).then(async (r) => { if (r.status === 'needs_approval') toast.push(t('eventLog.sentToOwner'), 'success'); }), 'eventLog.corrected')}>{t('eventLog.correct')}</Button>
              )}
              <Button variant="ghost" loading={busy} onClick={() => void act(() => repository.markEvent(uid, open.id, 'flagged', text), 'eventLog.flaggedDone')}>{t('eventLog.flag')}</Button>
              {canWrite && <Button variant="ghost" loading={busy} onClick={() => void act(() => repository.markEvent(uid, open.id, 'disputed', text), 'eventLog.disputedDone')}>{t('eventLog.dispute')}</Button>}
            </div>
            <p className="t-xs t-muted">{t(role === 'admin' ? 'eventLog.adminNote' : 'eventLog.neverOverwrite')}</p>
          </div>
        )}
      </Sheet>
    </Screen>
  );
}
