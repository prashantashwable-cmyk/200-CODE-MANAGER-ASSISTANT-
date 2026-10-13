import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, EmptyState, ErrorState, Field, Input, LoadingState, Screen, ScreenHeader, SegBar, Select, Sheet, TextArea, formatDateTime, formatINR, useToast } from '@/design-system';
import { DECISION_ACTIONS, DECISION_KINDS, DECISION_REASON_MIN, canPrepareDecisionPacket } from '@/features/authority/authority';
import type { DecisionAction, DecisionKind, DecisionStatus } from '@/features/authority/authority';
import type { DecisionCard, DecisionStatusRow } from '@/features/decisions/decisions';
import { useSession } from '@/session/SessionProvider';
import { useDecisionDesk } from './useDecisionDesk';
import type { DeskFilter } from './useDecisionDesk';

type T = ReturnType<typeof useTranslation>['t'];
const errText = (t: T, code: string) => t(`decisionDesk.error.${code}`, { defaultValue: t('decisionDesk.error.generic') });
const tone = (s: DecisionStatus): 'warning' | 'success' | 'error' | 'neutral' => (s === 'approved' ? 'success' : s === 'rejected' ? 'error' : s === 'pending' ? 'warning' : 'neutral');
const FILTERS: DeskFilter[] = ['open', 'approved', 'rejected', 'delegated', 'all'];

export function DecisionDeskScreen() {
  const { t, i18n } = useTranslation();
  const { role } = useSession();
  const desk = useDecisionDesk();
  const toast = useToast();
  const [packetOpen, setPacketOpen] = useState(false);

  const openCard = async (id: string) => {
    const r = await desk.open(id);
    if (!r.ok) toast.push(errText(t, r.problem), 'error');
  };
  const canPrepare = role ? canPrepareDecisionPacket(role) : false;

  return (
    <Screen width="wide">
      <ScreenHeader
        title={t('decisionDesk.title')}
        subtitle={role === 'admin' ? t('decisionDesk.subtitleAdmin') : t('decisionDesk.subtitle')}
        action={canPrepare ? <Button size="sm" onClick={() => setPacketOpen(true)}>{t('decisionDesk.prepare.open')}</Button> : undefined}
      />
      <SegBar label={t('decisionDesk.filter.label')} value={desk.filter} onChange={(v) => desk.setFilter(v as DeskFilter)} items={FILTERS.map((f) => ({ id: f, label: t(`decisionDesk.filter.${f}`) }))} />
      {desk.offline && desk.load === 'ready' && <p className="t-sm t-muted" role="status">{t('decisionDesk.offline')}</p>}
      <div className="stack gap-3" style={{ marginTop: 'var(--space-4)' }}>
        {desk.load === 'loading' && <LoadingState label={t('decisionDesk.loading')} rows={4} variant="cards" />}
        {desk.load === 'error' && <ErrorState title={t('decisionDesk.error.title')} body={t('decisionDesk.error.body')} retryLabel={t('decisionDesk.error.retry')} onRetry={() => void desk.refresh()} />}
        {desk.load === 'ready' && desk.list && desk.list.cards.length + desk.list.statusRows.length === 0 && <EmptyState title={t('decisionDesk.empty.title')} body={t('decisionDesk.empty.body')} />}
        {desk.load === 'ready' && desk.list?.level === 'detail' && (
          <div className="grid-auto" style={{ ['--min' as string]: '320px' }}>
            {desk.list.cards.map((c) => <CardTile key={c.id} card={c} t={t} lang={i18n.language} onOpen={() => void openCard(c.id)} />)}
          </div>
        )}
        {desk.load === 'ready' && desk.list?.level === 'status' && (
          <div className="grid-auto" style={{ ['--min' as string]: '320px' }}>
            {desk.list.statusRows.map((c) => <StatusTile key={c.id} row={c} t={t} lang={i18n.language} />)}
          </div>
        )}
      </div>

      <Sheet open={desk.selected !== null} onClose={desk.close} title={desk.selected?.card.title ?? ''} closeLabel={t('decisionDesk.close')}>
        {desk.selected?.level === 'detail' && <Detail key={desk.selected.card.id} view={desk.selected} desk={desk} t={t} lang={i18n.language} />}
      </Sheet>
      <PacketSheet open={packetOpen} onClose={() => setPacketOpen(false)} desk={desk} t={t} />
    </Screen>
  );
}

function CardTile({ card, t, lang, onOpen }: { card: DecisionCard; t: T; lang: string; onOpen: () => void }) {
  return (
    <Card onClick={onOpen} title={card.title} body={card.summary} aside={<Badge tone={tone(card.status)}>{t(`decisionDesk.status.${card.status}`)}</Badge>}>
      <div className="row gap-2 wrap" style={{ marginTop: 'var(--space-2)' }}>
        <Badge tone="neutral">{t(`decisionDesk.kind.${card.kind}`)}</Badge>
        {card.amountInr != null && card.amountInr > 0 && <Badge tone="neutral">{formatINR(card.amountInr)}</Badge>}
        {card.place && <Badge tone="neutral">{card.place.label}</Badge>}
        <span className="t-xs t-muted">{formatDateTime(card.createdAt, lang)}</span>
      </div>
    </Card>
  );
}

function StatusTile({ row, t, lang }: { row: DecisionStatusRow; t: T; lang: string }) {
  return (
    <Card title={row.title} aside={<Badge tone={tone(row.status)}>{t(`decisionDesk.status.${row.status}`)}</Badge>}>
      <div className="row gap-2 wrap" style={{ marginTop: 'var(--space-2)' }}>
        <Badge tone="neutral">{t(`decisionDesk.kind.${row.kind}`)}</Badge>
        <span className="t-xs t-muted">{row.code} · {formatDateTime(row.createdAt, lang)}</span>
      </div>
    </Card>
  );
}

type Desk = ReturnType<typeof useDecisionDesk>;

function Detail({ view, desk, t, lang }: { view: Extract<NonNullable<Desk['selected']>, { level: 'detail' }>; desk: Desk; t: T; lang: string }) {
  const { card, records } = view;
  const toast = useToast();
  const [action, setAction] = useState<DecisionAction>('approve');
  const [reason, setReason] = useState('');
  const [edits, setEdits] = useState('');
  const [delegateTo, setDelegateTo] = useState('');
  const [people, setPeople] = useState<{ id: string; name: string; role: string }[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const open = card.status === 'pending' || card.status === 'info_requested';

  useEffect(() => {
    if (action !== 'delegate' || people.length) return;
    void desk.people().then(setPeople).catch(() => setPeople([]));
  }, [action, people.length, desk]);

  const submit = async () => {
    setProblem(null);
    const r = await desk.decide({ cardId: card.id, action, reason, ...(action === 'edit' ? { edits } : {}), ...(action === 'delegate' ? { delegateTo } : {}) });
    if (r.ok) { toast.push(t('decisionDesk.recorded'), 'success'); setReason(''); setEdits(''); } else setProblem(r.problem);
  };

  return (
    <div className="stack gap-4">
      <div className="row gap-2 wrap">
        <Badge tone={tone(card.status)}>{t(`decisionDesk.status.${card.status}`)}</Badge>
        <Badge tone="neutral">{t(`decisionDesk.kind.${card.kind}`)}</Badge>
        {card.amountInr != null && card.amountInr > 0 && <Badge tone="neutral">{formatINR(card.amountInr)}</Badge>}
      </div>
      <p>{card.summary}</p>
      <p className="t-xs t-muted">{t('decisionDesk.proposedBy', { name: card.proposedBy.name, when: formatDateTime(card.createdAt, lang) })}</p>
      {card.evidence.length > 0 && <Section title={t('decisionDesk.evidence')}><ul className="stack gap-1">{card.evidence.map((e) => <li key={e.label}>{e.label} <span className="t-xs t-muted">({t(`decisionDesk.evidenceKind.${e.kind}`)})</span></li>)}</ul></Section>}
      {card.impact.length > 0 && <Section title={t('decisionDesk.impact')}><ul className="stack gap-1">{card.impact.map((i) => <li key={i}>{i}</li>)}</ul></Section>}
      {card.ai && <Section title={t('decisionDesk.ai')}><p className="t-sm">{t('decisionDesk.aiBody', { action: t(`decisionDesk.action.${card.ai.action}`), pct: Math.round(card.ai.confidence * 100), model: card.ai.model })}</p></Section>}
      {records.length > 0 && <Section title={t('decisionDesk.history')}><ul className="stack gap-2">{records.map((r) => <li key={r.id}><strong>{t(`decisionDesk.action.${r.action}`)}</strong> · {formatDateTime(r.at, lang)} {r.as === 'delegate' ? `· ${t('decisionDesk.asDelegate')}` : ''}<br /><span className="t-sm">{r.reason}</span>{r.edits && <><br /><span className="t-sm t-muted">{r.edits}</span></>}</li>)}</ul></Section>}
      {open && (
        <Section title={t('decisionDesk.decide')}>
          <div className="stack gap-3">
            <Field label={t('decisionDesk.actionLabel')}>{({ id }) => <Select id={id} value={action} onChange={(e) => setAction(e.target.value as DecisionAction)}>{DECISION_ACTIONS.map((a) => <option key={a} value={a}>{t(`decisionDesk.action.${a}`)}</option>)}</Select>}</Field>
            {action === 'edit' && <Field label={t('decisionDesk.editsLabel')} error={problem === 'edits_missing' ? errText(t, problem) : undefined}>{({ id }) => <TextArea id={id} rows={2} value={edits} onChange={(e) => setEdits(e.target.value)} />}</Field>}
            {action === 'delegate' && <Field label={t('decisionDesk.delegateLabel')} error={problem === 'delegate_missing' ? errText(t, problem) : undefined}>{({ id }) => <Select id={id} value={delegateTo} onChange={(e) => setDelegateTo(e.target.value)}><option value="">{t('decisionDesk.delegateChoose')}</option>{people.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.role}</option>)}</Select>}</Field>}
            <Field label={t('decisionDesk.reasonLabel')} hint={t('decisionDesk.reasonHint', { n: DECISION_REASON_MIN })} error={problem === 'reason_short' ? errText(t, problem) : undefined}>{({ id }) => <TextArea id={id} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />}</Field>
            {problem && !['reason_short', 'edits_missing', 'delegate_missing'].includes(problem) && <p className="t-error t-sm" role="alert">{errText(t, problem)}</p>}
            <Button loading={desk.busy} onClick={() => void submit()}>{t('decisionDesk.record')}</Button>
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="stack gap-2"><h3 className="t-md t-semibold">{title}</h3>{children}</section>;
}

function PacketSheet({ open, onClose, desk, t }: { open: boolean; onClose: () => void; desk: Desk; t: T }) {
  const toast = useToast();
  const [kind, setKind] = useState<DecisionKind>('tier_change');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [amount, setAmount] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const submit = async () => {
    setProblem(null);
    const amountInr = amount.trim() ? Number(amount) : undefined;
    const r = await desk.prepare({ kind, title, summary, ...(amountInr != null ? { amountInr } : {}), ...(recommendation.trim() ? { recommendation } : {}) });
    if (r.ok) { toast.push(t('decisionDesk.prepare.done'), 'success'); setTitle(''); setSummary(''); setAmount(''); setRecommendation(''); onClose(); } else setProblem(r.problem);
  };
  return (
    <Sheet open={open} onClose={onClose} title={t('decisionDesk.prepare.title')} closeLabel={t('decisionDesk.close')}>
      <div className="stack gap-3">
        <p className="t-sm t-muted">{t('decisionDesk.prepare.note')}</p>
        <Field label={t('decisionDesk.prepare.kind')}>{({ id }) => <Select id={id} value={kind} onChange={(e) => setKind(e.target.value as DecisionKind)}>{DECISION_KINDS.map((k) => <option key={k} value={k}>{t(`decisionDesk.kind.${k}`)}</option>)}</Select>}</Field>
        <Field label={t('decisionDesk.prepare.titleLabel')} error={problem === 'title_short' ? errText(t, problem) : undefined}>{({ id }) => <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} />}</Field>
        <Field label={t('decisionDesk.prepare.summary')} error={problem === 'summary_short' ? errText(t, problem) : undefined}>{({ id }) => <TextArea id={id} rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />}</Field>
        <Field label={t('decisionDesk.prepare.amount')} error={problem === 'amount_invalid' ? errText(t, problem) : undefined}>{({ id }) => <Input id={id} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />}</Field>
        <Field label={t('decisionDesk.prepare.recommendation')}>{({ id }) => <Input id={id} value={recommendation} onChange={(e) => setRecommendation(e.target.value)} />}</Field>
        {problem && !['title_short', 'summary_short', 'amount_invalid'].includes(problem) && <p className="t-error t-sm" role="alert">{errText(t, problem)}</p>}
        <Button loading={desk.busy} onClick={() => void submit()}>{t('decisionDesk.prepare.send')}</Button>
      </div>
    </Sheet>
  );
}
