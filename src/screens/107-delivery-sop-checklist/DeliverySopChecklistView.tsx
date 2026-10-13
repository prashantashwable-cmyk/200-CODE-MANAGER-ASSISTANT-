import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, Camera, ClipboardText, Plus, Trash } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Chip,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  Sheet,
  Tabs,
  TextArea,
  formatDate,
  useToast,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { SopTemplateView, SopVersionView } from '@/data/repository';
import type { DeliverySopStep, DeliverySopTemplate } from '@/data/types';
import { MASTER_CATEGORY, resolveSopSteps, stepText } from '@/features/logistics/deliverySop';
import type { SopVersionStatus } from '@/features/logistics/deliverySop';
import { useDeliverySop } from './useDeliverySop';
import type { ActionResult, DeliverySopState } from './useDeliverySop';
import { DELIVERY_SOP_KEYS as K, PREVIEW_LANGUAGES } from './delivery-sop-checklist.types';

type T = ReturnType<typeof useTranslation>['t'];

const STATUS_TONE: Record<SopVersionStatus, BadgeTone> = { active: 'success', scheduled: 'accent', retired: 'neutral' };
const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);

/** A category's display name: the shared `partCategory.*` labels, the master's own, or the raw key. */
function templateName(t: T, exists: (k: string) => boolean, tpl: { category: string; name: string }): string {
  if (tpl.category === MASTER_CATEGORY) return t(K.templates.master);
  return exists(`partCategory.${tpl.category}`) ? t(`partCategory.${tpl.category}`) : tpl.name;
}

/**
 * Screen 107 — Delivery SOP Checklist. The single place a delivery checklist's
 * steps are defined. 103 reads it and nothing else: there is no other list of
 * what a technician must check. An amendment is always a new version with an
 * effective date; deliveries already under way finish under the version they began with.
 */
export function DeliverySopChecklistView() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const toast = useToast();
  const s = useDeliverySop();
  const exists = (key: string) => i18n.exists(key);

  const report = (r: ActionResult, success?: string) => {
    if (!r.ok) {
      toast.push(t(errorKey(r.code)), 'error');
      return;
    }
    if (success) toast.push(t(success), 'success');
  };

  if (s.status === 'loading') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
      </Screen>
    );
  }
  if (s.status === 'error' || !s.board) {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />
      </Screen>
    );
  }

  return (
    <Screen width="wide">
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(K.subtitle)}
        action={
          <Button size="sm" variant="secondary" icon={<Plus size={16} />} onClick={s.openNew}>
            {t(K.templates.add)}
          </Button>
        }
      />

      <div className="row gap-2 ds-tabs--scroll mb-3" style={{ overflowX: 'auto' }} role="group" aria-label={t(K.templates.label)}>
        {s.templates.map((tpl) => (
          <Chip key={tpl.id} pressed={tpl.id === s.selected?.id} onClick={() => s.select(tpl.id)}>
            {templateName(t, exists, tpl)}
          </Chip>
        ))}
      </div>

      {s.selected ? (
        <div className="main-aside">
          <div className="stack gap-3">
            <CurrentCard s={s} tpl={s.selected} t={t} lang={lang} exists={exists} />
            <HistoryCard s={s} tpl={s.selected} t={t} lang={lang} />
          </div>
          <PreviewCard s={s} t={t} lang={lang} exists={exists} />
        </div>
      ) : (
        <EmptyState icon={<ClipboardText size={30} />} title={t(K.current.none)} body={t(K.current.noneBody)} />
      )}
      <EditorSheet s={s} t={t} exists={exists} report={report} />
    </Screen>
  );
}

/* ---------------------------------------------------------------- steps */

function StepRow({ step, lang, t, fromMaster }: { step: DeliverySopStep; lang: string; t: T; fromMaster?: boolean }) {
  const text = stepText(step, lang);
  return (
    <li className="stack gap-1 hairline-top pt-2">
      <span className="t-sm">{text.label}</span>
      {text.hint && <span className="t-xs t-muted">{text.hint}</span>}
      <span className="row gap-2 wrap">
        <Badge tone={step.mandatory ? 'accent' : 'neutral'}>{t(step.mandatory ? K.step.mandatory : K.step.optional)}</Badge>
        {step.needsPhoto && (
          <Badge tone="neutral">
            <Camera size={12} aria-hidden="true" /> {t(K.step.photo)}
          </Badge>
        )}
        {fromMaster && <Badge tone="neutral">{t(K.step.fromMaster)}</Badge>}
      </span>
    </li>
  );
}

function CurrentCard({ s, tpl, t, lang, exists }: { s: DeliverySopState; tpl: SopTemplateView; t: T; lang: string; exists: (k: string) => boolean }) {
  const active = tpl.versions.find((v) => v.status === 'active');
  const scheduled = tpl.versions.find((v) => v.status === 'scheduled');
  return (
    <Card>
      <section className="stack gap-2" aria-labelledby="current-heading">
        <div className="row between gap-2 wrap">
          <h2 id="current-heading" className="t-md t-semibold">
            {t(K.current.heading, { name: templateName(t, exists, tpl) })}
          </h2>
          {active && <Badge tone="success">{t(K.current.version, { version: active.version })}</Badge>}
        </div>
        {active ? (
          <>
            <p className="t-xs t-muted">
              {t(K.current.since, { date: formatDate(active.effectiveFrom, lang) })} · {t(K.current.steps, { count: active.steps.length })}
            </p>
            <ul className="stack gap-2">
              {active.steps.map((st) => (
                <StepRow key={st.id} step={st} lang={lang} t={t} />
              ))}
            </ul>
          </>
        ) : (
          <p className="t-sm t-muted">{t(K.current.noneBody)}</p>
        )}
        {tpl.category === MASTER_CATEGORY && <p className="t-xs t-muted">{t(K.current.coreNote)}</p>}
        {scheduled && <p className="t-xs t-warning">{t(K.current.scheduledNote, { version: scheduled.version, date: formatDate(scheduled.effectiveFrom, lang) })}</p>}
        {tpl.inFlight > 0 && <p className="t-xs t-muted">{t(K.current.inFlight, { count: tpl.inFlight })}</p>}
        <div>
          <Button size="sm" onClick={s.openAmend}>
            {t(K.current.amend)}
          </Button>
        </div>
      </section>
    </Card>
  );
}

function HistoryCard({ s, tpl, t, lang }: { s: DeliverySopState; tpl: SopTemplateView; t: T; lang: string }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <Card>
      <section className="stack gap-2" aria-labelledby="history-heading">
        <div className="stack">
          <h2 id="history-heading" className="t-md t-semibold">
            {t(K.history.heading)}
          </h2>
          <p className="t-xs t-muted">{t(K.history.intro)}</p>
        </div>
        {tpl.versions.map((v) => (
          <VersionRow key={v.id} v={v} open={open === v.version} onToggle={() => setOpen(open === v.version ? null : v.version)} onPreview={() => s.setPreviewVersion(v.version)} t={t} lang={lang} />
        ))}
      </section>
    </Card>
  );
}

function VersionRow({ v, open, onToggle, onPreview, t, lang }: { v: SopVersionView; open: boolean; onToggle: () => void; onPreview: () => void; t: T; lang: string }) {
  return (
    <div className="stack gap-1 hairline-top pt-2">
      <div className="row between gap-2 wrap">
        <span className="t-sm t-semibold">{t(K.current.version, { version: v.version })}</span>
        <Badge tone={STATUS_TONE[v.status]}>{t(K.status[v.status])}</Badge>
      </div>
      <p className="t-xs t-muted">
        {t(K.history.effective, { date: formatDate(v.effectiveFrom, lang) })} · {t(K.history.by, { name: v.createdByName })}
      </p>
      <p className="t-sm">“{v.changeNote}”</p>
      <div className="row gap-2 wrap">
        <Button size="sm" variant="ghost" onClick={onToggle}>
          {t(open ? K.history.hide : K.history.show, { count: v.steps.length })}
        </Button>
        <Button size="sm" variant="ghost" onClick={onPreview}>
          {t(K.history.view)}
        </Button>
      </div>
      {open && (
        <ul className="stack gap-2">
          {v.steps.map((st) => (
            <StepRow key={st.id} step={st} lang={lang} t={t} />
          ))}
        </ul>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- preview */

/** Exactly how the technician's checklist will show this version: the same steps, in the chosen language. */
function PreviewCard({ s, t, lang, exists }: { s: DeliverySopState; t: T; lang: string; exists: (k: string) => boolean }) {
  const [ticks, setTicks] = useState<Record<string, boolean>>({});
  const tpl = s.selected!;
  const v = s.previewing;
  const asTemplates: DeliverySopTemplate[] = s.templates.map((x) => ({ id: x.id, category: x.category, name: x.name, versions: x.versions, createdByName: '', createdAt: '', isDemo: true }));
  // The category's version as it stands on its own effective date, with the master as it stood then.
  const at = v ? new Date(v.effectiveFrom).getTime() : Date.now();
  const resolved = v ? resolveSopSteps(asTemplates, tpl.category, at) : { steps: [], versions: [] };
  const previewLang = s.previewLang;
  return (
    <Card>
      <section className="stack gap-3" aria-labelledby="preview-heading">
        <div className="stack">
          <h2 id="preview-heading" className="t-md t-semibold">
            {t(K.preview.heading)}
          </h2>
          <p className="t-xs t-muted">{t(K.preview.intro)}</p>
        </div>
        <Field label={t(K.preview.version)}>
          {({ id }) => (
            <Select id={id} value={String(v?.version ?? '')} onChange={(e) => s.setPreviewVersion(Number(e.target.value))}>
              {tpl.versions.map((x) => (
                <option key={x.id} value={x.version}>
                  {t(K.current.version, { version: x.version })} · {t(K.status[x.status])}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Tabs label={t(K.preview.language)} value={previewLang} onChange={(id) => s.setPreviewLang(id as typeof previewLang)} items={PREVIEW_LANGUAGES.map((l) => ({ id: l, label: l.toUpperCase() }))} />
        {v && v.status === 'scheduled' && <p className="t-xs t-warning">{t(K.preview.notInForce, { date: formatDate(v.effectiveFrom, lang) })}</p>}
        <div className="stack gap-2 hairline-top pt-3" style={{ opacity: 1 }}>
          <span className="t-md t-semibold">{t(K.preview.samplePart, { name: templateName(t, exists, tpl) })}</span>
          <p className="t-xs t-muted">{t(K.preview.core)}</p>
          {resolved.steps.length === 0 ? (
            <p className="t-sm t-muted">{t(K.preview.empty)}</p>
          ) : (
            resolved.steps.map((st) => {
              const text = stepText(st, previewLang);
              return (
                <Checkbox
                  key={st.id}
                  checked={!!ticks[st.id]}
                  onChange={(on) => setTicks((cur) => ({ ...cur, [st.id]: on }))}
                  label={
                    <span className="stack">
                      <span className="row gap-2 wrap">
                        <span className="t-sm">{text.label}</span>
                        <Badge tone={st.mandatory ? 'accent' : 'neutral'}>{t(st.mandatory ? K.step.mandatory : K.step.optional)}</Badge>
                        {st.needsPhoto && (
                          <Badge tone="neutral">
                            <Camera size={12} aria-hidden="true" /> {t(K.step.photo)}
                          </Badge>
                        )}
                      </span>
                      {text.hint && <span className="t-xs t-muted">{text.hint}</span>}
                    </span>
                  }
                />
              );
            })
          )}
        </div>
      </section>
    </Card>
  );
}

/* ---------------------------------------------------------------- editor */

function EditorSheet({ s, t, exists, report }: { s: DeliverySopState; t: T; exists: (k: string) => boolean; report: (r: ActionResult, success?: string) => void }) {
  const tpl = s.selected;
  const title = s.creating ? t(K.editor.titleNew) : t(K.editor.titleAmend, { name: tpl ? templateName(t, exists, tpl) : '' });
  return (
    <Sheet open={s.editorOpen} onClose={() => s.setEditorOpen(false)} title={title} closeLabel={t('action.close')}>
      <div className="stack gap-3">
        <p className="t-sm t-muted">{t(K.editor.intro)}</p>
        {s.creating && (
          <div className="stack gap-2">
            <Field label={t(K.editor.category)} required>
              {({ id }) => (
                <Select id={id} value={s.category} onChange={(e) => s.setCategory(e.target.value)}>
                  {(s.board?.untemplated ?? []).map((c) => (
                    <option key={c} value={c}>
                      {exists(`partCategory.${c}`) ? t(`partCategory.${c}`) : c}
                    </option>
                  ))}
                  <option value="__other">{t(K.editor.categoryOther)}</option>
                </Select>
              )}
            </Field>
            {s.category === '__other' && (
              <Field label={t(K.editor.categoryOther)} hint={t(K.editor.categoryOtherHint)} required>
                {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={s.otherCategory} onChange={(e) => s.setOtherCategory(e.target.value)} />}
              </Field>
            )}
          </div>
        )}

        <section className="stack gap-3" aria-labelledby="steps-heading">
          <h3 id="steps-heading" className="t-md t-semibold">
            {t(K.editor.stepsHeading)}
          </h3>
          {s.steps.length === 0 && <p className="t-sm t-muted">{t(K.editor.noSteps)}</p>}
          {s.steps.map((st, i) => (
            <Card key={st.key}>
              <div className="stack gap-2">
                <div className="row between gap-2">
                  <span className="t-sm t-semibold">{t(K.editor.stepN, { n: i + 1 })}</span>
                  <span className="row gap-1">
                    <Button size="sm" variant="ghost" aria-label={t(K.editor.up)} disabled={i === 0} onClick={() => s.moveStep(st.key, -1)} icon={<ArrowUp size={16} />} />
                    <Button size="sm" variant="ghost" aria-label={t(K.editor.down)} disabled={i === s.steps.length - 1} onClick={() => s.moveStep(st.key, 1)} icon={<ArrowDown size={16} />} />
                    <Button size="sm" variant="ghost" aria-label={t(K.editor.remove)} onClick={() => s.removeStep(st.key)} icon={<Trash size={16} />} />
                  </span>
                </div>
                <Field label={t(K.editor.label)} required>
                  {({ id }) => <Input id={id} value={st.label} onChange={(e) => s.patchStep(st.key, { label: e.target.value })} />}
                </Field>
                <Field label={t(K.editor.hint)}>
                  {({ id }) => <Input id={id} value={st.hint} onChange={(e) => s.patchStep(st.key, { hint: e.target.value })} />}
                </Field>
                <details>
                  <summary className="t-sm" style={{ cursor: 'pointer', minHeight: 32 }}>
                    {t(K.editor.translations)}
                  </summary>
                  <div className="stack gap-2 mt-2">
                    <Field label={t(K.editor.labelHi)}>
                      {({ id }) => <Input id={id} value={st.labelHi} onChange={(e) => s.patchStep(st.key, { labelHi: e.target.value })} />}
                    </Field>
                    <Field label={t(K.editor.hintHi)}>
                      {({ id }) => <Input id={id} value={st.hintHi} onChange={(e) => s.patchStep(st.key, { hintHi: e.target.value })} />}
                    </Field>
                    <Field label={t(K.editor.labelMr)}>
                      {({ id }) => <Input id={id} value={st.labelMr} onChange={(e) => s.patchStep(st.key, { labelMr: e.target.value })} />}
                    </Field>
                    <Field label={t(K.editor.hintMr)}>
                      {({ id }) => <Input id={id} value={st.hintMr} onChange={(e) => s.patchStep(st.key, { hintMr: e.target.value })} />}
                    </Field>
                  </div>
                </details>
                <Checkbox checked={st.mandatory} onChange={(v) => s.patchStep(st.key, { mandatory: v })} label={t(K.editor.mandatory)} />
                <Checkbox checked={st.needsPhoto} onChange={(v) => s.patchStep(st.key, { needsPhoto: v })} label={t(K.editor.needsPhoto)} />
              </div>
            </Card>
          ))}
          <div>
            <Button size="sm" variant="secondary" icon={<Plus size={16} />} onClick={s.addStep}>
              {t(K.editor.addStep)}
            </Button>
          </div>
          {s.issues.map((i) => (
            <p key={i} className="t-xs t-error" role="alert">
              {t(K.editor.issue[i])}
            </p>
          ))}
        </section>

        <Field label={t(K.editor.effective)} hint={t(K.editor.effectiveHint)} required>
          {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} type="date" min={s.minEffective} value={s.effectiveFrom} onChange={(e) => s.setEffectiveFrom(e.target.value)} />}
        </Field>
        <Field label={t(K.editor.changeNote)} hint={t(K.editor.changeNoteHint)} required>
          {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={2} value={s.changeNote} onChange={(e) => s.setChangeNote(e.target.value)} />}
        </Field>
        {s.unchanged && <p className="t-xs t-muted">{t(K.editor.unchanged)}</p>}
        <div className="row gap-2">
          <Button disabled={!s.canPublish} loading={s.busy} onClick={() => void s.publish().then((r) => report(r, K.toast.published))}>
            {t(s.creating ? K.editor.publishFirst : K.editor.publish)}
          </Button>
          <Button variant="ghost" onClick={() => s.setEditorOpen(false)}>
            {t('action.cancel')}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
