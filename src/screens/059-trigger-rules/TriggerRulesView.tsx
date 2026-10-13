import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, ChatCircleText, Lightning, Plus, Sparkle } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  Checkbox,
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
import type { BadgeTone } from '@/design-system';
import type { LeadStage } from '@/data/types';
import { useTriggerRules } from './useTriggerRules';
import type { RuleRow, SaveRuleInput } from './useTriggerRules';
import { RULE_STAGES, TRIGGER_RULES_KEYS as K } from './trigger-rules.types';
import type { ActionKind } from './trigger-rules.types';

export function TriggerRulesView() {
  const { t } = useTranslation();
  const toast = useToast();
  const s = useTriggerRules();

  const [name, setName] = useState('');
  const [stage, setStage] = useState<LeadStage>('captured');
  const [delayHours, setDelayHours] = useState(0);
  const [actionKind, setActionKind] = useState<ActionKind>('sequence');
  const [actionSequenceId, setActionSequenceId] = useState('');
  const [actionTemplateGroupId, setActionTemplateGroupId] = useState('');
  const [allowStacking, setAllowStacking] = useState(false);

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

  const openCreateForm = () => {
    setName('');
    setStage('captured');
    setDelayHours(0);
    setActionKind('sequence');
    setActionSequenceId(s.sequences[0]?.id ?? '');
    setActionTemplateGroupId(s.templateGroups[0]?.groupId ?? '');
    setAllowStacking(false);
    s.openCreate();
  };

  const openEditForm = (row: RuleRow) => {
    setName(row.rule.name);
    setStage(row.rule.triggerStage);
    setDelayHours(row.rule.delayHours);
    setActionKind(row.actionKind ?? 'sequence');
    setActionSequenceId(row.rule.actionSequenceId ?? s.sequences[0]?.id ?? '');
    setActionTemplateGroupId(row.rule.actionTemplateGroupId ?? s.templateGroups[0]?.groupId ?? '');
    setAllowStacking(row.rule.allowStacking);
    s.openEdit(row.rule);
  };

  const handleSave = () => {
    const input: SaveRuleInput = {
      id: s.editingRule?.id,
      name: name.trim(),
      triggerStage: stage,
      delayHours,
      actionKind,
      actionSequenceId: actionKind === 'sequence' ? actionSequenceId : undefined,
      actionTemplateGroupId: actionKind === 'template' ? actionTemplateGroupId : undefined,
      allowStacking,
    };
    void s.saveRule(input).then((ok) => toast.push(t(ok ? K.toast.saved : K.toast.error), ok ? 'success' : 'error'));
  };

  return (
    <Screen>
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <Card className="mb-4" onClick={openCreateForm}>
        <div className="row gap-3">
          <Plus size={22} className="t-emerald" />
          <span className="t-sm t-medium">{t(K.addRule)}</span>
        </div>
      </Card>

      {s.stageGroups.length === 0 ? (
        <EmptyState title={t(K.empty.title)} body={t(K.empty.body)} />
      ) : (
        <div className="stack gap-4 mb-4">
          {s.stageGroups.map((group) => (
            <div key={group.stage}>
              <h2 className="t-lg mb-2">{t(`stage.${group.stage}`)}</h2>
              <div className="stack gap-2">
                {group.rules.map((row, index) => (
                  <Card key={row.rule.id}>
                    <button type="button" className="row between items-start gap-3 mb-2 full-w" onClick={() => openEditForm(row)}>
                      <div className="stack gap-1" style={{ minWidth: 0 }}>
                        <span className="t-sm t-semibold truncate">{row.rule.name}</span>
                        <span className="t-xs t-muted truncate">
                          {row.rule.delayHours === 0 ? t(K.delayNow) : t(K.delayHours, { count: row.rule.delayHours })}
                          {' · '}
                          {row.actionKind === 'sequence' ? t(K.actionSequence) : t(K.actionTemplate)}: {row.actionName}
                        </span>
                      </div>
                      <div className="row gap-1 shrink-0">
                        {row.rule.allowStacking && <Badge tone="accent">{t(K.stackingBadge)}</Badge>}
                        <span className="t-xs t-muted">{t(K.priorityLabel)} {row.rule.priority}</span>
                      </div>
                    </button>

                    <div className="row between items-center gap-3">
                      <div className="row gap-1">
                        <button
                          type="button"
                          className="tappable"
                          disabled={index === 0}
                          aria-label={t(K.moveUp)}
                          onClick={() => void s.reorder(row.rule, 'up').then((ok) => ok && toast.push(t(K.toast.reordered), 'success'))}
                        >
                          <ArrowUp size={16} className={index === 0 ? 't-muted' : 't-emerald'} />
                        </button>
                        <button
                          type="button"
                          className="tappable"
                          disabled={index === group.rules.length - 1}
                          aria-label={t(K.moveDown)}
                          onClick={() => void s.reorder(row.rule, 'down').then((ok) => ok && toast.push(t(K.toast.reordered), 'success'))}
                        >
                          <ArrowDown size={16} className={index === group.rules.length - 1 ? 't-muted' : 't-emerald'} />
                        </button>
                      </div>
                      <Toggle checked={row.rule.enabled} onChange={() => s.toggle(row.rule)} label={t(K.enabledToggle)} />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="t-lg mb-1">{t(K.simulator.heading)}</h2>
      <p className="t-sm t-muted mb-3">{t(K.simulator.subtitle)}</p>
      <Card className="mb-4">
        <div className="stack gap-3">
          <div className="row gap-2">
            <Select value={s.simStage} onChange={(e) => s.setSimStage(e.target.value as LeadStage)}>
              {RULE_STAGES.map((st) => (
                <option key={st} value={st}>
                  {t(`stage.${st}`)}
                </option>
              ))}
            </Select>
            <Button variant="secondary" icon={<Sparkle size={16} />} loading={s.simRunning} onClick={() => void s.runSimulation()}>
              {t(K.simulator.run)}
            </Button>
          </div>

          {s.simResults === null ? (
            <div className="stack gap-1">
              <span className="t-sm t-medium">{t(K.simulator.empty.title)}</span>
              <p className="t-xs t-muted">{t(K.simulator.empty.body)}</p>
            </div>
          ) : s.simResults.length === 0 ? (
            <p className="t-sm t-muted">{t(K.simulator.noMatch)}</p>
          ) : (
            <div className="stack gap-2">
              {s.simResults.map((evaluation) => {
                const tone: BadgeTone = !evaluation.rule.enabled ? 'neutral' : evaluation.wouldFire ? 'success' : 'warning';
                const label = !evaluation.rule.enabled
                  ? t(K.simulator.disabled)
                  : evaluation.wouldFire
                    ? t(K.simulator.wouldFire)
                    : t(K.simulator.suppressed);
                return (
                  <div key={evaluation.rule.id} className="row between items-center gap-2">
                    <div className="row gap-2 items-center" style={{ minWidth: 0 }}>
                      <Lightning size={16} className="t-emerald shrink-0" />
                      <span className="t-sm truncate">{evaluation.rule.name}</span>
                    </div>
                    <Badge tone={tone}>{label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      <Sheet open={s.sheetOpen} onClose={s.closeSheet} title={t(K.sheet.title)} closeLabel={t('action.close')}>
        <div className="stack gap-3">
          <div className="stack gap-1">
            <span className="label">{t(K.sheet.nameLabel)}</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.sheet.stageLabel)}</span>
            <Select value={stage} onChange={(e) => setStage(e.target.value as LeadStage)}>
              {RULE_STAGES.map((st) => (
                <option key={st} value={st}>
                  {t(`stage.${st}`)}
                </option>
              ))}
            </Select>
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.sheet.delayHoursLabel)}</span>
            <Input type="number" min={0} value={delayHours} onChange={(e) => setDelayHours(Number(e.target.value))} />
          </div>
          <div className="stack gap-1">
            <span className="label">{t(K.sheet.actionKindLabel)}</span>
            <div className="row gap-2">
              <Checkbox checked={actionKind === 'sequence'} onChange={() => setActionKind('sequence')} label={t(K.actionSequence)} />
              <Checkbox checked={actionKind === 'template'} onChange={() => setActionKind('template')} label={t(K.actionTemplate)} />
            </div>
          </div>
          {actionKind === 'sequence' ? (
            <div className="stack gap-1">
              <span className="label">{t(K.sheet.sequenceLabel)}</span>
              <Select value={actionSequenceId} onChange={(e) => setActionSequenceId(e.target.value)}>
                {s.sequences.map((seq) => (
                  <option key={seq.id} value={seq.id}>
                    {seq.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <div className="stack gap-1">
              <span className="label">{t(K.sheet.templateLabel)}</span>
              <Select value={actionTemplateGroupId} onChange={(e) => setActionTemplateGroupId(e.target.value)}>
                {s.templateGroups.map((tpl) => (
                  <option key={tpl.groupId} value={tpl.groupId}>
                    {tpl.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <Checkbox checked={allowStacking} onChange={setAllowStacking} label={t(K.sheet.allowStackingLabel)} />
          <p className="t-xs t-muted">{t(K.sheet.allowStackingHint)}</p>
          <Button block icon={<ChatCircleText size={16} />} disabled={!name.trim()} onClick={handleSave}>
            {t(K.sheet.save)}
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={!!s.disableConfirmRule}
        onClose={s.closeDisableConfirm}
        title={t(K.disableConfirm.title, { name: s.disableConfirmRule?.name ?? '' })}
        closeLabel={t('action.close')}
      >
        <div className="stack gap-4">
          <p className="t-sm">{t(K.disableConfirm.body, { name: s.disableConfirmRule?.name ?? '' })}</p>
          <Button
            block
            variant="secondary"
            onClick={() =>
              void s.confirmDisable('finish').then((ok) => toast.push(t(ok ? K.toast.toggled : K.toast.error), ok ? 'success' : 'error'))
            }
          >
            {t(K.disableConfirm.letFinish)}
          </Button>
          <Button
            block
            variant="danger"
            onClick={() =>
              void s.confirmDisable('stop').then((ok) => toast.push(t(ok ? K.toast.toggled : K.toast.error), ok ? 'success' : 'error'))
            }
          >
            {t(K.disableConfirm.stopNow)}
          </Button>
        </div>
      </Sheet>
    </Screen>
  );
}
