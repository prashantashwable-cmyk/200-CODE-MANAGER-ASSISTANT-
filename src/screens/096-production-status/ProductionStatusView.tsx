import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, DotsThree, FileText, Image, Warning } from '@phosphor-icons/react';
import {
  ActionBar,
  AscensionLine,
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  ProgressBar,
  Screen,
  ScreenHeader,
  Select,
  Sheet,
  TextArea,
  formatDate,
  formatDateTime,
  useToast,
} from '@/design-system';
import type { AscensionStep } from '@/design-system';
import type { ProductionEvent, ProductionStage } from '@/data/types';
import { DocumentSlot } from '@/features/onboarding/DocumentSlot';
import { FULL_PRODUCTION_STAGES } from '@/features/suppliers/production';
import { useProductionStatus } from './useProductionStatus';
import type { ProductionStatusHook } from './useProductionStatus';
import { PRODUCTION_STATUS_KEYS as K } from './production-status.types';

type T = (key: string, params?: Record<string, unknown>) => string;

/**
 * Screen 096 — Manufacturer Production Status. The inside of a
 * manufacturer's "in production": which stage each custom-built part is at,
 * the evidence behind it, and — without anyone checking — whether it has
 * stalled against that manufacturer's own usual pace.
 */
export function ProductionStatusView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useProductionStatus();
  const lang = i18n.language;
  const back = () => navigate(-1);

  if (s.status === 'loading') {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} back={back} />
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
      </Screen>
    );
  }
  if (s.status === 'error') {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} back={back} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }
  if (s.status === 'unavailable' || !s.view) {
    const reason = s.unavailable ?? 'not_found';
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} back={back} />
        <EmptyState
          title={t(K.unavailable[reason].title)}
          body={t(K.unavailable[reason].body)}
          actionLabel={t(K.unavailable.action)}
          onAction={() => navigate('/orders')}
        />
      </Screen>
    );
  }

  const { view } = s;
  const { record } = view;
  const complete = record.currentStage === 'complete';
  const notify = (ok: boolean, key: string) => toast.push(t(ok ? key : K.toast.error), ok ? 'success' : 'error');
  const skippedStages = FULL_PRODUCTION_STAGES.filter((st) => !record.stages.includes(st));

  const stageSteps: AscensionStep[] = record.stages.map((stage, i) => {
    const current = record.stages.indexOf(record.currentStage);
    const evidenceCount = record.evidence.filter((e) => e.stage === stage).length;
    return {
      id: stage,
      label: t(K.stage[stage]),
      meta: evidenceCount > 0 ? t(K.stages.evidenceCount, { count: evidenceCount }) : undefined,
      status: i < current || complete ? 'complete' : i === current ? (view.stalled ? 'blocked' : 'current') : 'upcoming',
    };
  });

  const historySteps: AscensionStep[] = [
    { id: 'start', label: t(K.history.started, { stage: t(K.stage[record.stages[0]]) }), meta: formatDateTime(record.startedAt, lang), status: 'complete' },
    ...record.events.map((e) => historyStep(e, t, lang)),
  ];

  return (
    <Screen width="narrow" className="pb-action-bar">
      <ScreenHeader title={view.lineDescription} subtitle={t(K.hero.meta, { po: view.poCode, supplier: view.supplierName, site: view.siteName || view.dealCode })} back={back} />

      <div className="stack gap-4">
        {/* Hero — status and the two numbers that matter. */}
        <Card>
          <div className="row between gap-2">
            <Badge tone={complete ? 'success' : view.stalled ? 'warning' : 'accent'}>
              {complete ? t(K.hero.complete) : t(K.stage[record.currentStage])}
            </Badge>
            {!complete && <Badge tone={view.stalled ? 'warning' : 'success'}>{t(view.stalled ? K.hero.stalled : K.hero.onPace)}</Badge>}
          </div>
          <div className="mt-3">
            <div className="row between mb-1">
              <span className="t-sm">{t(K.hero.percent)}</span>
              <span className="num t-semibold">{view.completionPct}%</span>
            </div>
            <ProgressBar value={view.completionPct / 100} tone={view.stalled ? 'warning' : complete ? 'success' : 'accent'} label={t(K.hero.percent)} />
          </div>
          {!complete && (
            <p className="t-xs t-muted mt-3">
              {t(K.hero.inStage, { days: view.daysInStage.toFixed(1), stage: t(K.stage[record.currentStage]) })} ·{' '}
              {t(view.expectedIsDefault ? K.hero.usuallyDefault : K.hero.usually, { days: view.expectedDays })}
            </p>
          )}
          {view.stalled && (
            <p className="t-xs t-warning row gap-1 mt-2">
              <Warning size={12} className="shrink-0" /> {t(K.hero.stalledNote)}
            </p>
          )}
        </Card>

        {/* Batch context — why several POs move together. */}
        {record.batchId && view.batchSiblings.length > 0 && (
          <Card>
            <h2 className="t-md t-semibold">{t(K.batch.heading, { batch: record.batchId })}</h2>
            <p className="t-xs t-muted mt-1">{t(K.batch.body)}</p>
            <div className="stack gap-1 mt-2">
              {view.batchSiblings.map((sib) => (
                <button
                  key={sib.recordId}
                  type="button"
                  className="t-sm"
                  style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', color: 'var(--color-accent-secondary)', cursor: 'pointer', textDecoration: 'underline', font: 'inherit' }}
                  onClick={() => navigate(`/orders/production/${sib.recordId}`)}
                >
                  {t(K.batch.sibling, { po: sib.poCode, part: sib.lineDescription, stage: t(K.stage[sib.currentStage]) })}
                </button>
              ))}
            </div>
          </Card>
        )}

        <section className="stack gap-2">
          <h2 className="t-lg">{t(K.stages.heading)}</h2>
          <Card>
            <AscensionLine steps={stageSteps} />
            {skippedStages.length > 0 && (
              <p className="t-xs t-muted mt-3">{t(K.stages.shortened, { stages: skippedStages.map((st) => t(K.stage[st])).join(', ') })}</p>
            )}
          </Card>
        </section>

        <Evidence s={s} t={t} lang={lang} notify={notify} />

        <section className="stack gap-2">
          <h2 className="t-lg">{t(K.history.heading)}</h2>
          <Card>
            <AscensionLine steps={historySteps} />
          </Card>
        </section>

        <div>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/orders?poId=${record.poId}`)}>
            {t(K.action.openOrder)}
          </Button>
        </div>
      </div>

      <ActionBar>
        {view.canUpdate && !complete ? (
          <div className="stack gap-2 grow">
            {view.batchSiblings.length > 0 && (
              <Checkbox checked={s.applyToBatch} onChange={s.setApplyToBatch} label={t(K.batch.applyToBatch, { count: view.batchSiblings.length + 1 })} />
            )}
            {s.isAdmin && (
              <Input aria-label={t(K.action.adminNote)} placeholder={t(K.action.adminNoteHint)} value={s.adminNote} onChange={(e) => s.setAdminNote(e.target.value)} />
            )}
            <div className="row gap-2">
              <Button variant="ghost" icon={<DotsThree size={18} />} aria-label={t(K.action.more)} onClick={() => s.setMoreOpen(true)}>
                {t(K.action.more)}
              </Button>
              <Button
                className="grow"
                block
                icon={<CheckCircle size={16} />}
                disabled={!s.canAdvance}
                loading={s.busy}
                onClick={() =>
                  void s.advance().then((result) => {
                    if (result === 'batch_evidence_missing') toast.push(t(K.toast.batchEvidenceMissing), 'error');
                    else notify(result !== false, result === 'finished' ? K.toast.finished : K.toast.advanced);
                  })
                }
              >
                {view.nextStage === 'complete' ? t(K.action.finish) : t(K.action.advance, { stage: t(K.stage[record.currentStage]) })}
              </Button>
            </div>
          </div>
        ) : (
          <p className="t-sm t-muted grow">{t(K.action.readOnly)}</p>
        )}
      </ActionBar>

      <MoreSheet s={s} t={t} notify={notify} />
    </Screen>
  );
}

function historyStep(e: ProductionEvent, t: T, lang: string): AscensionStep {
  const label =
    e.kind === 'regressed'
      ? t(K.history.regressed, { from: t(K.stage[e.fromStage]), to: t(K.stage[e.toStage]) })
      : e.kind === 'skipped'
        ? t(K.history.skipped, { stage: t(K.stage[e.fromStage]) })
        : t(K.history.advanced, { from: t(K.stage[e.fromStage]), to: t(K.stage[e.toStage]) });
  const meta = [
    t(K.history.meta, { name: e.byName, date: formatDateTime(e.at, lang) }),
    e.viaBatch ? t(K.history.viaBatch) : '',
    e.reason ? `“${e.reason}”` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  // A regression is shown as blocked — visible rework, never a silent stall.
  return { id: e.id, label, meta, status: e.kind === 'regressed' ? 'blocked' : 'complete' };
}

function Evidence({ s, t, lang, notify }: { s: ProductionStatusHook; t: T; lang: string; notify: (ok: boolean, key: string) => void }) {
  const view = s.view!;
  const { record } = view;
  const complete = record.currentStage === 'complete';
  return (
    <section className="stack gap-2">
      <h2 className="t-lg">{t(K.evidence.heading)}</h2>
      <p className="t-xs t-muted">{t(K.evidence.intro)}</p>
      {view.evidenceRequired && (
        <p className="t-xs t-warning row gap-1">
          <Warning size={12} className="shrink-0" /> {t(K.evidence.required, { stage: t(K.stage[record.currentStage]) })}
        </p>
      )}
      <Card>
        {record.evidence.length === 0 ? (
          <p className="t-sm t-muted">{t(K.evidence.none)}</p>
        ) : (
          <ul className="stack gap-2">
            {record.evidence.map((ev) => (
              <li key={ev.id} className="row gap-2" style={{ alignItems: 'flex-start' }}>
                {ev.previewUrl && ev.kind === 'photo' ? (
                  <img src={ev.previewUrl} alt={ev.fileName} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  <span className="ds-avatar shrink-0" aria-hidden="true">
                    {ev.kind === 'photo' ? <Image size={20} /> : <FileText size={20} />}
                  </span>
                )}
                <span className="stack gap-1 grow" style={{ minWidth: 0 }}>
                  <span className="t-sm" style={{ overflowWrap: 'anywhere' }}>
                    {ev.fileName}
                  </span>
                  <span className="t-xs t-muted">
                    {t(K.stage[ev.stage])} · {t(K.evidence.by, { name: ev.uploadedBy, date: formatDate(ev.uploadedAt, lang) })}
                  </span>
                  {ev.note && <span className="t-xs">{ev.note}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
        {view.canUpdate && !complete && (
          <div className="stack gap-2 hairline-top pt-3 mt-3">
            <DocumentSlot
              label={t(K.evidence.slot, { stage: t(K.stage[record.currentStage]) })}
              hint={t(K.evidence.slotHint)}
              value={s.evidenceFile}
              onChange={s.setEvidenceFile}
              accept="image/*,application/pdf"
              skipQualityCheck
            />
            {s.evidenceFile && (
              <>
                <Input aria-label={t(K.evidence.note)} placeholder={t(K.evidence.note)} value={s.evidenceNote} onChange={(e) => s.setEvidenceNote(e.target.value)} />
                <div>
                  <Button size="sm" variant="secondary" loading={s.busy} onClick={() => void s.addEvidence().then((ok) => notify(ok, K.toast.evidenceAdded))}>
                    {t(K.evidence.add)}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Card>
    </section>
  );
}

function MoreSheet({ s, t, notify }: { s: ProductionStatusHook; t: T; notify: (ok: boolean, key: string) => void }) {
  return (
    <Sheet open={s.moreOpen} onClose={() => s.setMoreOpen(false)} title={t(K.more.title)} closeLabel={t('action.close')}>
      <div className="stack gap-5">
        {/* Rework is a consequential move, so it's styled as one. */}
        <section className="stack gap-2">
          <h3 className="t-md t-semibold t-error row gap-2">
            <Warning size={16} /> {t(K.more.defect)}
          </h3>
          <p className="t-xs t-muted">{t(K.more.defectHint)}</p>
          <Select aria-label={t(K.more.backTo)} value={s.regressTo} onChange={(e) => s.setRegressTo(e.target.value as ProductionStage | '')} disabled={s.regressOptions.length === 0}>
            <option value="">{t(K.more.backTo)}</option>
            {s.regressOptions.map((stage) => (
              <option key={stage} value={stage}>
                {t(K.stage[stage])}
              </option>
            ))}
          </Select>
          <TextArea aria-label={t(K.more.defectReason)} placeholder={t(K.more.defectReason)} value={s.regressReason} onChange={(e) => s.setRegressReason(e.target.value)} />
          <div>
            <Button
              variant="danger"
              size="sm"
              disabled={!s.regressTo || s.regressReason.trim().length < 4}
              loading={s.busy}
              onClick={() => void s.regress().then((ok) => notify(ok, K.toast.regressed))}
            >
              {t(K.more.sendBack)}
            </Button>
          </div>
        </section>

        <section className="stack gap-2 hairline-top pt-4">
          <h3 className="t-md t-semibold">{t(K.more.skip)}</h3>
          <p className="t-xs t-muted">{t(K.more.skipHint)}</p>
          {s.skipOptions.length === 0 ? (
            <p className="t-xs t-muted">{t(K.more.nothingToSkip)}</p>
          ) : (
            <>
              <Select aria-label={t(K.more.skipStage)} value={s.skipStage} onChange={(e) => s.setSkipStage(e.target.value as ProductionStage | '')}>
                <option value="">{t(K.more.skipStage)}</option>
                {s.skipOptions.map((stage) => (
                  <option key={stage} value={stage}>
                    {t(K.stage[stage])}
                  </option>
                ))}
              </Select>
              <TextArea aria-label={t(K.more.skipReason)} placeholder={t(K.more.skipReason)} value={s.skipReason} onChange={(e) => s.setSkipReason(e.target.value)} />
              <div>
                <Button size="sm" variant="secondary" disabled={!s.skipStage || s.skipReason.trim().length < 4} loading={s.busy} onClick={() => void s.skip().then((ok) => notify(ok, K.toast.skipped))}>
                  {t(K.more.doSkip)}
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
    </Sheet>
  );
}
