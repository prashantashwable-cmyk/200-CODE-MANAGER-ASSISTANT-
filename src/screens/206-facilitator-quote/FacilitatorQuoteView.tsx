import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, EmptyState, ErrorState, Field, Input, ListRow, LoadingState, Screen, ScreenHeader, Select, StatTile, Tabs, formatINR, useToast } from '@/design-system';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { Lead } from '@/data/types';
import { DEFAULT_COST_RATES, DEFAULT_FEE_SETTINGS } from '@/features/quotes/facilitatorQuote';
import type { FeeSettings, LineKind, QuoteLine } from '@/features/quotes/facilitatorQuote';
import type { FacilitatorQuote, FeeSettingsVersion, QuotePreview } from '@/features/quotes/types';
import { newClientId } from '@/features/ids/clientId';

const KINDS: LineKind[] = ['material', 'installation', 'logistics', 'amc', 'statutory'];
const BAND_TONE = { target: 'success', assistant_ok: 'success', human_only: 'warning', owner_approval: 'error' } as const;

type Row = { id: string; partnerName: string; kind: LineKind; description: string; price: string };
const blank = (): Row => ({ id: newClientId(), partnerName: '', kind: 'material', description: '', price: '' });

export function FacilitatorQuoteScreen() {
  const { t } = useTranslation();
  const repository = useData();
  const { user } = useSession();
  const toast = useToast();
  const uid = user?.id ?? '';
  const isOwner = user?.role === 'owner';
  const [tab, setTab] = useState('build');
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [quotes, setQuotes] = useState<FacilitatorQuote[]>([]);
  const [fee, setFee] = useState<{ current: FeeSettingsVersion; history: FeeSettingsVersion[] } | null>(null);
  const [leadId, setLeadId] = useState('');
  const [rows, setRows] = useState<Row[]>([blank()]);
  const [discount, setDiscount] = useState('');
  const [preview, setPreview] = useState<QuotePreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [clientEventId, setClientEventId] = useState(newClientId());

  const load = useCallback(async () => {
    setState('loading');
    try {
      const [l, q, f] = await Promise.all([repository.listLeads(), repository.listFacilitatorQuotes(uid), repository.getFeeSettings(uid)]);
      setLeads(l); setQuotes(q); setFee(f); setLeadId((cur) => cur || l[0]?.id || ''); setState('ready');
    } catch { setState('error'); }
  }, [repository, uid]);
  useEffect(() => { void load(); }, [load]);

  const lines: QuoteLine[] = useMemo(() => rows.filter((r) => r.partnerName.trim() && Number(r.price) > 0).map((r) => ({ id: r.id, partnerId: r.partnerName.trim().toLowerCase().replace(/\s+/g, '-'), partnerName: r.partnerName.trim(), kind: r.kind, description: r.description.trim() || r.partnerName.trim(), partnerPriceInr: Math.round(Number(r.price)) })), [rows]);
  const discountInr = Math.max(0, Math.round(Number(discount) || 0));

  useEffect(() => {
    if (lines.length === 0) { setPreview(null); return; }
    let alive = true;
    repository.previewFacilitatorQuote(uid, { lines, bundleDiscountInr: discountInr }).then((p) => { if (alive) setPreview(p); }).catch(() => { if (alive) setPreview(null); });
    return () => { alive = false; };
  }, [repository, uid, lines, discountInr]);

  const patch = (id: string, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const save = async () => {
    if (!leadId || !preview || preview.problems.length) return;
    setBusy(true);
    try {
      const res = await repository.saveFacilitatorQuote(uid, { leadId, lines, bundleDiscountInr: discountInr, clientEventId });
      if (res.status === 'saved') { toast.push(t('facQuote.saved')); setRows([blank()]); setDiscount(''); setClientEventId(newClientId()); await load(); setTab('quotes'); }
      else { toast.push(t('facQuote.sentToOwner')); setClientEventId(newClientId()); }
    } catch (e) { toast.push(t('facQuote.error.save', { code: e instanceof Error ? e.message : '' })); } finally { setBusy(false); }
  };
  const send = async (id: string) => { try { await repository.sendFacilitatorQuote(uid, id); toast.push(t('facQuote.sent')); await load(); } catch { toast.push(t('facQuote.error.send')); } };

  const [draft, setDraft] = useState<FeeSettings>(DEFAULT_FEE_SETTINGS);
  const [why, setWhy] = useState('');
  useEffect(() => { if (fee) setDraft(fee.current.settings); }, [fee]);
  const saveFee = async () => {
    if (!fee) return;
    setBusy(true);
    try { await repository.saveFeeSettings(uid, draft, fee.current.costRates ?? DEFAULT_COST_RATES, why); toast.push(t('facQuote.fee.saved')); setWhy(''); await load(); }
    catch (e) { toast.push(t(`facQuote.fee.err.${e instanceof Error ? e.message : 'x'}`, { defaultValue: t('facQuote.error.save', { code: '' }) })); } finally { setBusy(false); }
  };
  const num = (k: keyof FeeSettings) => (e: React.ChangeEvent<HTMLInputElement>) => setDraft((d) => ({ ...d, [k]: Number(e.target.value) }));

  return (
    <Screen width="wide">
      <ScreenHeader title={t('facQuote.title')} subtitle={t('facQuote.subtitle')} />
      <Card><p className="text-sm" data-testid="fq-disclosure">{t('facQuote.disclosure')}</p></Card>
      <Tabs label={t('facQuote.title')} value={tab} onChange={setTab} items={[{ id: 'build', label: t('facQuote.tab.build') }, { id: 'quotes', label: t('facQuote.tab.quotes') }, { id: 'fee', label: t('facQuote.tab.fee') }]} />
      {state === 'loading' && <LoadingState label={t('facQuote.loading')} rows={3} />}
      {state === 'error' && <ErrorState title={t('facQuote.error.title')} body={t('facQuote.error.body')} retryLabel={t('facQuote.retry')} onRetry={() => void load()} />}
      {state === 'ready' && tab === 'build' && (
        <div className="main-aside">
          <div className="stack gap-4">
            <Card title={t('facQuote.site')}>
              <Field label={t('facQuote.lead')}>{({ id }) => (
                <Select id={id} value={leadId} onChange={(e) => setLeadId(e.target.value)}>{leads.map((l) => <option key={l.id} value={l.id}>{l.siteName}</option>)}</Select>
              )}</Field>
            </Card>
            <Card title={t('facQuote.partnerPrices')}>
              <p className="text-sm text-muted">{t('facQuote.partnerPricesNote')}</p>
              {rows.map((r) => (
                <div key={r.id} className="grid-auto" style={{ ['--min' as string]: '150px' }}>
                  <Field label={t('facQuote.partner')}>{({ id }) => <Input id={id} value={r.partnerName} onChange={(e) => patch(r.id, { partnerName: e.target.value })} />}</Field>
                  <Field label={t('facQuote.kind')}>{({ id }) => <Select id={id} value={r.kind} onChange={(e) => patch(r.id, { kind: e.target.value as LineKind })}>{KINDS.map((k) => <option key={k} value={k}>{t(`facQuote.kinds.${k}`)}</option>)}</Select>}</Field>
                  <Field label={t('facQuote.what')}>{({ id }) => <Input id={id} value={r.description} onChange={(e) => patch(r.id, { description: e.target.value })} />}</Field>
                  <Field label={t('facQuote.price')}>{({ id }) => <Input id={id} inputMode="numeric" value={r.price} onChange={(e) => patch(r.id, { price: e.target.value.replace(/[^\d]/g, '') })} />}</Field>
                </div>
              ))}
              <div className="row gap-2">
                <Button variant="secondary" size="sm" onClick={() => setRows((rs) => [...rs, blank()])}>{t('facQuote.addLine')}</Button>
                {rows.length > 1 && <Button variant="ghost" size="sm" onClick={() => setRows((rs) => rs.slice(0, -1))}>{t('facQuote.removeLine')}</Button>}
              </div>
            </Card>
            <Card title={t('facQuote.discount')}>
              <p className="text-sm text-muted">{t('facQuote.discountNote')}</p>
              <Field label={t('facQuote.discountAmount')} hint={preview ? t('facQuote.discountMax', { max: formatINR(preview.maxDiscountInr) }) : undefined}>{({ id }) => <Input id={id} inputMode="numeric" value={discount} onChange={(e) => setDiscount(e.target.value.replace(/[^\d]/g, ''))} />}</Field>
            </Card>
          </div>
          <div className="stack gap-4">
            {!preview ? <EmptyState title={t('facQuote.empty.title')} body={t('facQuote.empty.body')} /> : (
              <>
                <Card title={t('facQuote.summary')}>
                  <ListRow title={t('facQuote.partnerTotal')} trailing={formatINR(preview.totals.partnerTotalInr)} />
                  <ListRow title={t('facQuote.feeLine')} subtitle={t('facQuote.feePct', { pct: preview.totals.effectivePct })} trailing={formatINR(preview.totals.feeInr)} />
                  <ListRow title={t('facQuote.gstOnFee', { pct: fee?.current.settings.gstPctOnFee ?? 18 })} trailing={formatINR(preview.totals.gstOnFeeInr)} />
                  <ListRow title={t('facQuote.total')} trailing={<strong>{formatINR(preview.totals.customerTotalInr)}</strong>} />
                  <ListRow title={t('facQuote.token')} subtitle={t('facQuote.tokenNote')} trailing={formatINR(preview.totals.tokenInr)} />
                  <div className="row gap-2"><Badge tone={BAND_TONE[preview.band]}>{t(`facQuote.band.${preview.band}`)}</Badge><Badge tone={preview.allowed ? 'success' : 'warning'}>{preview.allowed ? t('facQuote.mayOffer') : t('facQuote.needsOwner')}</Badge></div>
                  <p className="text-sm text-muted">{t('facQuote.feeShare', { pct: preview.totals.feeShareOfTotalPct })}</p>
                </Card>
                <Card title={t('facQuote.waterfall')}>
                  <p className="text-sm text-muted">{t('facQuote.waterfallNote')}</p>
                  {(['feeInr', 'scoutInr', 'salesInr', 'qcInr', 'mentorInr', 'providersInr', 'infrastructureInr', 'reserveInr'] as const).map((k) => (
                    <ListRow key={k} title={t(`facQuote.wf.${k}`)} trailing={`${k === 'feeInr' ? '' : '− '}${formatINR(preview.waterfall[k])}`} />
                  ))}
                  <ListRow title={t('facQuote.wf.marginInr')} subtitle={t('facQuote.wf.marginPct', { pct: preview.waterfall.marginPctOfFee })} trailing={<strong>{formatINR(preview.waterfall.marginInr)}</strong>} />
                  <p className="text-sm text-muted">{t('facQuote.wf.gstNote', { gst: formatINR(preview.waterfall.gstOnFeeInr) })}</p>
                </Card>
                <Card title={t('facQuote.alternatives')}>
                  {preview.alternatives.map((a) => <ListRow key={a.id} title={t(`facQuote.alt.${a.id}`)} subtitle={t('facQuote.altSub', { pct: a.effectivePct, partner: formatINR(a.partnerFeeInr) })} trailing={formatINR(a.customerFeeInr)} />)}
                </Card>
                <Button onClick={() => void save()} disabled={busy || !leadId || preview.problems.length > 0}>{preview.allowed ? t('facQuote.save') : t('facQuote.askOwner')}</Button>
              </>
            )}
          </div>
        </div>
      )}
      {state === 'ready' && tab === 'quotes' && (
        quotes.length === 0 ? <EmptyState title={t('facQuote.none.title')} body={t('facQuote.none.body')} /> : (
          <Card>{quotes.map((q) => (
            <ListRow key={q.id} title={`${q.code} · ${q.siteName}`} subtitle={t('facQuote.row', { fee: formatINR(q.totals.feeInr), total: formatINR(q.totals.customerTotalInr), v: q.feeVersion })} trailing={q.status === 'draft' ? <Button size="sm" onClick={() => void send(q.id)}>{t('facQuote.send')}</Button> : <Badge tone={q.status === 'accepted' ? 'success' : 'neutral'}>{t(`facQuote.status.${q.status}`)}</Badge>} />
          ))}</Card>
        )
      )}
      {state === 'ready' && tab === 'fee' && fee && (
        <div className="stack gap-4">
          <div className="grid-auto" style={{ ['--min' as string]: '160px' }}>
            <StatTile label={t('facQuote.fee.target')} value={`${fee.current.settings.targetPct}%`} />
            <StatTile label={t('facQuote.fee.assistant')} value={`${fee.current.settings.assistantFloorPct}%`} />
            <StatTile label={t('facQuote.fee.human')} value={`${fee.current.settings.humanFloorPct}%`} />
            <StatTile label={t('facQuote.fee.version')} value={`v${fee.current.version}`} />
          </div>
          <Card title={t('facQuote.fee.edit')}>
            <p className="text-sm text-muted">{isOwner ? t('facQuote.fee.ownerNote') : t('facQuote.fee.adminNote')}</p>
            <div className="grid-auto" style={{ ['--min' as string]: '160px' }}>
              <Field label={t('facQuote.fee.target')}>{({ id }) => <Input id={id} type="number" disabled={!isOwner} value={draft.targetPct} onChange={num('targetPct')} />}</Field>
              <Field label={t('facQuote.fee.assistant')}>{({ id }) => <Input id={id} type="number" disabled={!isOwner} value={draft.assistantFloorPct} onChange={num('assistantFloorPct')} />}</Field>
              <Field label={t('facQuote.fee.human')}>{({ id }) => <Input id={id} type="number" disabled={!isOwner} value={draft.humanFloorPct} onChange={num('humanFloorPct')} />}</Field>
              <Field label={t('facQuote.fee.gst')}>{({ id }) => <Input id={id} type="number" disabled={!isOwner} value={draft.gstPctOnFee} onChange={num('gstPctOnFee')} />}</Field>
              <Field label={t('facQuote.fee.tokenInr')}>{({ id }) => <Input id={id} type="number" disabled={!isOwner} value={draft.tokenInr} onChange={num('tokenInr')} />}</Field>
            </div>
            <p className="text-sm text-muted">{t('facQuote.fee.placeholder')}</p>
            {isOwner && (<>
              <Field label={t('facQuote.fee.why')}>{({ id }) => <Input id={id} value={why} onChange={(e) => setWhy(e.target.value)} />}</Field>
              <Button onClick={() => void saveFee()} disabled={busy || why.trim().length < 10}>{t('facQuote.fee.save')}</Button>
            </>)}
          </Card>
          <Card title={t('facQuote.fee.history')}>{fee.history.map((h) => <ListRow key={h.version} title={`v${h.version} · ${h.settings.targetPct}% / ${h.settings.assistantFloorPct}% / ${h.settings.humanFloorPct}%`} subtitle={`${h.setByName} · ${h.reason}`} />)}</Card>
        </div>
      )}
    </Screen>
  );
}
