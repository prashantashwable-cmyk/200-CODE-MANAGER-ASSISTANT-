import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, ErrorState, Field, Input, LoadingState, Select, formatDate, useToast } from '@/design-system';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { GATES, LINE_KINDS, TEMPLATE_MAX_ROWS, templateSetProblem } from '@/features/workorders/workOrder';
import type { MilestoneTemplate, TemplateSet } from '@/features/workorders/workOrder';
import type { TemplateHistory } from '@/features/workorders/types';

/** The Owner's editor for how each kind of work releases payment. Saving adds a version; orders already issued keep theirs. */
export function TemplateEditor() {
  const { t, i18n } = useTranslation();
  const repository = useData();
  const { user } = useSession();
  const toast = useToast();
  const uid = user?.id ?? '';
  const isOwner = user?.role === 'owner';
  const [data, setData] = useState<TemplateHistory | null>(null);
  const [draft, setDraft] = useState<TemplateSet | null>(null);
  const [reason, setReason] = useState('');
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setState('loading');
    try { const h = await repository.getMilestoneTemplates(uid); setData(h); setDraft(structuredClone(h.current.templates)); setReason(''); setState('ready'); }
    catch { setState('error'); }
  }, [repository, uid]);
  useEffect(() => { void load(); }, [load]);

  if (state === 'loading') return <LoadingState label={t('workOrders.loading')} rows={2} />;
  if (state === 'error' || !data || !draft) return <ErrorState title={t('workOrders.error.title')} body={t('workOrders.error.body')} retryLabel={t('workOrders.retry')} onRetry={() => void load()} />;

  const problem = templateSetProblem(draft, data.current.templates, reason);
  const edit = (k: (typeof LINE_KINDS)[number], i: number, patch: Partial<MilestoneTemplate>) => setDraft({ ...draft, [k]: draft[k].map((m, j) => (j === i ? { ...m, ...patch } : m)) });
  const save = async () => {
    setBusy(true);
    try { await repository.saveMilestoneTemplates(uid, draft, reason); toast.push(t('workOrders.tplSaved')); await load(); }
    catch (e) { toast.push(t(`workOrders.problem.${e instanceof Error ? e.message : ''}`, { defaultValue: t('workOrders.error.action') })); }
    finally { setBusy(false); }
  };

  return (
    <Card title={t('workOrders.tplTitle')}>
      <div className="stack gap-3" data-testid="wo-templates">
        <p className="text-sm text-muted">{t('workOrders.tplHint')}</p>
        <Badge tone="accent">{t('workOrders.tplVersion', { version: data.current.version, date: formatDate(data.current.at, i18n.language) })}</Badge>
        {LINE_KINDS.map((k) => {
          const sum = draft[k].reduce((a, m) => a + (Number.isFinite(m.pct) ? m.pct : 0), 0);
          return (
            <div key={k} className="stack gap-2" data-testid={`wo-tpl-${k}`}>
              <strong>{t(`workOrders.kinds.${k}`)}</strong>
              {draft[k].map((m, i) => (
                <div key={m.id + i} className="row gap-2">
                  <Field label={t('workOrders.tplLabel')}>{({ id }) => <Input id={id} value={m.label} disabled={!isOwner} onChange={(e) => edit(k, i, { label: e.target.value })} />}</Field>
                  <Field label="%">{({ id }) => <Input id={id} inputMode="numeric" value={String(m.pct)} disabled={!isOwner} onChange={(e) => edit(k, i, { pct: Number(e.target.value.replace(/\D/g, '')) })} />}</Field>
                  <Field label={t('workOrders.tplGate')}>{({ id }) => (
                    <Select id={id} value={m.gate} disabled={!isOwner} onChange={(e) => edit(k, i, { gate: e.target.value as MilestoneTemplate['gate'] })}>
                      {GATES.map((g) => <option key={g} value={g}>{t(`workOrders.gate.${g}`)}</option>)}
                    </Select>
                  )}</Field>
                  {isOwner && draft[k].length > 1 && <Button size="sm" variant="ghost" onClick={() => setDraft({ ...draft, [k]: draft[k].filter((_, j) => j !== i) })}>{t('workOrders.tplRemove')}</Button>}
                </div>
              ))}
              <div className="row gap-2">
                <Badge tone={sum === 100 ? 'success' : 'warning'}>{t('workOrders.tplSum', { sum })}</Badge>
                {isOwner && draft[k].length < TEMPLATE_MAX_ROWS && <Button size="sm" variant="ghost" onClick={() => setDraft({ ...draft, [k]: [...draft[k], { id: `m${draft[k].length + 1}-${Date.now().toString(36).slice(-4)}`, label: '', pct: 0, gate: 'on_handover' }] })}>{t('workOrders.tplAddRow')}</Button>}
              </div>
            </div>
          );
        })}
        {isOwner && (
          <div className="stack gap-2">
            <Field label={t('workOrders.tplReason')}>{({ id }) => <Input id={id} value={reason} onChange={(e) => setReason(e.target.value)} />}</Field>
            {reason.length > 0 && problem && <p className="text-sm text-muted" data-testid="wo-tpl-problem">{t(`workOrders.problem.${problem}`)}</p>}
            <Button disabled={busy || problem !== null} onClick={() => void save()}>{t('workOrders.tplSave')}</Button>
          </div>
        )}
        {data.history.length > 1 && (
          <details>
            <summary>{t('workOrders.tplHistory')}</summary>
            <ul>{data.history.map((v) => <li key={v.version} className="text-sm">{`v${v.version} · ${v.setByName} · ${formatDate(v.at, i18n.language)} · ${v.reason}`}</li>)}</ul>
          </details>
        )}
      </div>
    </Card>
  );
}
