import { useTranslation } from 'react-i18next';
import { CaretDown, CaretUp, Trash } from '@phosphor-icons/react';
import {
  ActionBar,
  AscensionLine,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  Sheet,
  Toggle,
  useToast,
} from '@/design-system';
import type { AscensionStep } from '@/design-system';
import { useSequenceBuilder } from './useSequenceBuilder';
import { BRANCH_OPTIONS, SEQUENCE_BUILDER_KEYS as K, TRIGGER_STAGES, WIZARD_STEPS } from './sequence-builder.types';

export function SequenceBuilderView() {
  const { t } = useTranslation();
  const toast = useToast();
  const s = useSequenceBuilder();

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="list" rows={4} />
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

  const stepIndex = WIZARD_STEPS.indexOf(s.wizardStep);
  const railSteps: AscensionStep[] = WIZARD_STEPS.map((step, i) => ({
    id: step,
    label: t(K.wizard.step[step]),
    status: i < stepIndex ? 'complete' : i === stepIndex ? 'current' : 'upcoming',
    onClick: i <= stepIndex ? () => s.goToStep(step) : undefined,
  }));

  return (
    <Screen>
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} action={<Button size="sm" onClick={s.openNewSequence}>{t(K.newSequence)}</Button>} />

      {s.sequences.length === 0 ? (
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      ) : (
        <div className="stack gap-2">
          {s.sequences.map((seq) => (
            <Card key={seq.id}>
              <button
                type="button"
                className="row between items-start gap-3 mb-2"
                style={{ width: '100%', background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'inherit', textAlign: 'left' }}
                onClick={() => s.openEditSequence(seq)}
              >
                <div className="stack gap-1">
                  <span className="t-sm t-semibold">{seq.name}</span>
                  <span className="t-xs t-muted">
                    {t(K.list.triggerLabel, { stage: t(`stage.${seq.triggerStage}`) })} · {t(K.list.stepCount, { count: seq.steps.length })}
                  </span>
                </div>
                <Badge tone={seq.isActive ? 'success' : 'neutral'}>{seq.isActive ? t(K.list.active) : t(K.list.paused)}</Badge>
              </button>
              <div>
                <Toggle
                  checked={seq.isActive}
                  onChange={(next) =>
                    void s.toggleSequence(seq.id, next).then((ok) => toast.push(t(ok ? K.toast.toggled : K.toast.error), ok ? 'success' : 'error'))
                  }
                  label={seq.isActive ? t(K.pauseToggle) : t(K.resumeToggle)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={s.wizardOpen} onClose={s.closeWizard} title={t(K.wizard.step[s.wizardStep])} closeLabel={t('action.close')}>
        <div className="stack gap-4">
          <AscensionLine orientation="horizontal" steps={railSteps} />

          {s.wizardStep === 'basics' && (
            <div className="stack gap-3">
              <div className="stack gap-1">
                <span className="label">{t(K.basics.nameLabel)}</span>
                <Input value={s.draft.name} onChange={(e) => s.setDraftField('name', e.target.value)} placeholder={t(K.basics.namePlaceholder)} />
              </div>
              <div className="stack gap-1">
                <span className="label">{t(K.basics.triggerLabel)}</span>
                <Select value={s.draft.triggerStage} onChange={(e) => s.setDraftField('triggerStage', e.target.value as never)}>
                  {TRIGGER_STAGES.map((stg) => (
                    <option key={stg} value={stg}>
                      {t(`stage.${stg}`)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="stack gap-1">
                <span className="label">{t(K.basics.maxNudgesLabel)}</span>
                <Input type="number" min={1} max={10} value={s.draft.maxNudgesPerLead} onChange={(e) => s.setDraftField('maxNudgesPerLead', Number(e.target.value))} />
                <span className="t-xs t-muted">{t(K.basics.maxNudgesHint)}</span>
              </div>
              <div className="stack gap-1">
                <span className="label">{t(K.basics.priorityLabel)}</span>
                <Input type="number" min={1} max={20} value={s.draft.priority} onChange={(e) => s.setDraftField('priority', Number(e.target.value))} />
              </div>
              <Toggle checked={s.draft.restartOnReopen} onChange={(v) => s.setDraftField('restartOnReopen', v)} label={t(K.basics.restartLabel)} description={t(K.basics.restartHint)} />
            </div>
          )}

          {s.wizardStep === 'steps' && (
            <div className="stack gap-3">
              <p className="t-sm t-muted">{t(K.steps.body)}</p>
              {s.draft.steps.length === 0 && <p className="t-sm t-muted">{t(K.steps.noSteps)}</p>}
              {s.draft.steps.map((step, i) => (
                <Card key={step.id}>
                  <div className="row between items-center mb-2">
                    <span className="t-sm t-semibold">{t(K.steps.stepLabel, { n: i + 1 })}</span>
                    <div className="row gap-1">
                      <button type="button" className="tappable" disabled={i === 0} onClick={() => s.moveStep(step.id, 'up')} aria-label={t(K.steps.moveUp)}>
                        <CaretUp size={16} />
                      </button>
                      <button type="button" className="tappable" disabled={i === s.draft.steps.length - 1} onClick={() => s.moveStep(step.id, 'down')} aria-label={t(K.steps.moveDown)}>
                        <CaretDown size={16} />
                      </button>
                      <button type="button" className="tappable t-error" onClick={() => s.removeStep(step.id)} aria-label={t(K.steps.removeStep)}>
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="stack gap-2">
                    <div className="stack gap-1">
                      <span className="label">{t(K.steps.waitLabel)}</span>
                      <Input type="number" min={0} max={30} value={step.waitDays} onChange={(e) => s.updateStep(step.id, { waitDays: Number(e.target.value) })} />
                    </div>
                    <div className="stack gap-1">
                      <span className="label">{t(K.steps.templateLabel)}</span>
                      <Select value={step.templateGroupId} onChange={(e) => s.updateStep(step.id, { templateGroupId: e.target.value })}>
                        <option value="">—</option>
                        {s.templateOptions.map((tpl) => (
                          <option key={tpl.groupId} value={tpl.groupId}>
                            {tpl.name} ({t(`commChannel.${tpl.channel}`)})
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="stack gap-1">
                      <span className="label">{t(K.steps.branchLabel)}</span>
                      <Select value={step.branch} onChange={(e) => s.updateStep(step.id, { branch: e.target.value as never })}>
                        {BRANCH_OPTIONS.map((b) => (
                          <option key={b} value={b}>
                            {t(K.branch[b])}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                </Card>
              ))}
              <Button variant="secondary" onClick={s.addStep}>
                {t(K.steps.addStep)}
              </Button>
            </div>
          )}

          {s.wizardStep === 'test' && (
            <div className="stack gap-3">
              <p className="t-sm t-muted">{t(K.test.body)}</p>
              <div className="stack gap-1">
                <span className="label">{t(K.test.pickLead)}</span>
                <Select value={s.testLeadId} onChange={(e) => s.setTestLeadId(e.target.value)}>
                  <option value="">—</option>
                  {s.leadOptions.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.siteName} — {lead.contactName}
                    </option>
                  ))}
                </Select>
              </div>
              <Button variant="secondary" disabled={!s.testLeadId} onClick={() => void s.runTest()}>
                {t(K.test.run)}
              </Button>
              {s.testResult && (
                <div className="stack gap-2">
                  <span className="label">{t(K.test.resultHeading)}</span>
                  {s.testResult.map((step) => (
                    <Card key={step.stepId}>
                      <div className="row between mb-1">
                        <span className="t-xs t-semibold">{t(K.steps.stepLabel, { n: step.order })}</span>
                        <span className="t-xs t-muted">{step.waitDays === 0 ? t(K.test.immediately) : t(K.test.dueOn, { days: step.waitDays })}</span>
                      </div>
                      <p className="t-sm">{step.renderedBody}</p>
                    </Card>
                  ))}
                  <p className="t-xs t-muted">{t(K.test.disclaimer)}</p>
                </div>
              )}
            </div>
          )}

          {s.wizardStep === 'review' && (
            <div className="stack gap-3">
              <Card>
                <div className="stack gap-2">
                  <div className="row between">
                    <span className="t-sm t-muted">{t(K.review.trigger)}</span>
                    <span className="t-sm t-semibold">{t(`stage.${s.draft.triggerStage}`)}</span>
                  </div>
                  <div className="row between">
                    <span className="t-sm t-muted">{t(K.review.stepCount)}</span>
                    <span className="t-sm t-semibold">{s.draft.steps.length}</span>
                  </div>
                  <div className="row between">
                    <span className="t-sm t-muted">{t(K.review.maxNudges)}</span>
                    <span className="t-sm t-semibold">{s.draft.maxNudgesPerLead}</span>
                  </div>
                  <div className="row between">
                    <span className="t-sm t-muted">{t(K.review.priority)}</span>
                    <span className="t-sm t-semibold">{s.draft.priority}</span>
                  </div>
                  <div className="row between">
                    <span className="t-sm t-muted">{t(K.review.restart)}</span>
                    <span className="t-sm t-semibold">{s.draft.restartOnReopen ? t(K.review.yes) : t(K.review.no)}</span>
                  </div>
                </div>
              </Card>
              <Toggle checked={s.draft.isActive} onChange={(v) => s.setDraftField('isActive', v)} label={t(K.review.activateNow)} />
            </div>
          )}

          <ActionBar>
            {stepIndex > 0 && (
              <Button variant="ghost" onClick={s.goBack}>
                {t(K.wizard.back)}
              </Button>
            )}
            {s.wizardStep === 'review' ? (
              <Button
                block
                onClick={() =>
                  void s.finish(s.draft.isActive).then((ok) => toast.push(t(ok ? K.toast.saved : K.toast.error), ok ? 'success' : 'error'))
                }
              >
                {t(K.wizard.finish)}
              </Button>
            ) : (
              <Button block disabled={!s.canProceed} onClick={() => void s.goNext()}>
                {t(K.wizard.next)}
              </Button>
            )}
          </ActionBar>
        </div>
      </Sheet>
    </Screen>
  );
}
