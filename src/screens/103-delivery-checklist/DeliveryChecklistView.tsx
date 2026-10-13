import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ClipboardText, Package, Truck, Warning } from '@phosphor-icons/react';
import {
  ActionBar,
  AscensionLine,
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  Sheet,
  Tabs,
  TextArea,
  formatDateTime,
  useToast,
} from '@/design-system';
import type { AscensionStep, BadgeTone } from '@/design-system';
import type { ChecklistArrival, DeliveryChecklistView as ChecklistView } from '@/data/repository';
import type { DeliveryCheckItem, DeliveryItemVerdict, ShipmentMilestone } from '@/data/types';
import { DocumentSlot } from '@/features/onboarding/DocumentSlot';
import { MIN_NOTE_LENGTH, isReceived } from '@/features/logistics/deliveryChecklist';
import { stepText } from '@/features/logistics/deliverySop';
import { useDeliveryChecklist } from './useDeliveryChecklist';
import type { ActionResult, DeliveryChecklistState } from './useDeliveryChecklist';
import { DELIVERY_CHECKLIST_KEYS as K, MAX_PHOTOS, RECEIVER_ROLES } from './delivery-checklist.types';

type T = ReturnType<typeof useTranslation>['t'];

const VERDICT_TONE: Record<DeliveryItemVerdict, BadgeTone> = { pending: 'neutral', ok: 'success', discrepancy: 'warning', not_arrived: 'neutral' };
const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);

/**
 * Screen 103 — Site Delivery Checklist. The authoritative "it arrived":
 * every part counted, looked at and photographed at the tailgate, signed for
 * by whoever actually received it. What arrived becomes delivered everywhere
 * else in the app; what is wrong raises its report on the spot.
 */
export function DeliveryChecklistView() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const toast = useToast();
  const s = useDeliveryChecklist();
  const isOpen = !!s.checklistParam;

  const report = (r: ActionResult, success?: string) => {
    if (!r.ok) {
      toast.push(t(errorKey(r.code)), 'error');
      return;
    }
    if (success) toast.push(t(success), 'success');
  };

  const subtitle = s.isAdmin ? K.subtitleAdmin : K.subtitleTechnician;

  if (s.status === 'loading') {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
      </Screen>
    );
  }
  if (s.status === 'error' || !s.board) {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />
      </Screen>
    );
  }

  if (isOpen) {
    if (!s.open) {
      return (
        <Screen width="narrow">
          <ScreenHeader title={t(K.title)} back={s.closeChecklist} backLabel={t('action.back')} />
          <EmptyState icon={<ClipboardText size={30} />} title={t(K.work.notFound)} body={t(K.work.notFoundBody)} />
        </Screen>
      );
    }
    return <ChecklistScreen s={s} checklist={s.open} t={t} lang={lang} report={report} />;
  }

  return (
    <Screen width="default">
      <ScreenHeader title={t(K.title)} subtitle={t(subtitle)} />
      <Board s={s} t={t} lang={lang} report={report} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ board */

function Board({ s, t, lang, report }: { s: DeliveryChecklistState; t: T; lang: string; report: (r: ActionResult, success?: string) => void }) {
  const empty = s.arrivals.length === 0 && s.recent.length === 0;
  if (empty) {
    return (
      <EmptyState
        icon={<Truck size={32} />}
        title={t(K.board.emptyTitle)}
        body={t(s.filteredToPo ? K.board.emptyPoBody : K.board.emptyBody)}
        actionLabel={s.filteredToPo ? t(K.board.showAll) : undefined}
        onAction={s.filteredToPo ? s.showAll : undefined}
      />
    );
  }
  return (
    <div className="stack gap-4">
      {s.filteredToPo && (
        <div>
          <Button size="sm" variant="ghost" onClick={s.showAll}>
            {t(K.board.showAll)}
          </Button>
        </div>
      )}
      <section className="stack gap-2" aria-labelledby="arrivals-heading">
        <div className="stack">
          <h2 id="arrivals-heading" className="t-md t-semibold">
            {t(K.board.arrivalsHeading)}
          </h2>
          <p className="t-xs t-muted">{t(K.board.arrivalsHint)}</p>
        </div>
        {s.arrivals.length === 0 ? (
          <p className="t-sm t-muted">{t(K.board.emptyBody)}</p>
        ) : (
          <div className="grid-auto" style={{ ['--min' as string]: '300px' }}>
            {s.arrivals.map((a) => (
              <ArrivalCard key={a.key} arrival={a} s={s} t={t} lang={lang} report={report} />
            ))}
          </div>
        )}
      </section>
      {s.recent.length > 0 && (
        <section className="stack gap-2" aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="t-md t-semibold">
            {t(K.board.recentHeading)}
          </h2>
          <div className="grid-auto" style={{ ['--min' as string]: '300px' }}>
            {s.recent.map((c) => (
              <RecentCard key={c.id} c={c} s={s} t={t} lang={lang} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ArrivalCard({ arrival, s, t, lang, report }: { arrival: ChecklistArrival; s: DeliveryChecklistState; t: T; lang: string; report: (r: ActionResult, success?: string) => void }) {
  const inProgress = s.board?.checklists.find((c) => c.id === arrival.checklistId);
  const checked = inProgress ? inProgress.items.filter((i) => i.verdict !== 'pending').length : 0;
  const milestone = arrival.legMilestone;
  const onTheWay = milestone === 'dispatched' || milestone === 'in_transit';
  return (
    <Card>
      <div className="stack gap-2">
        <div className="row between gap-2 wrap">
          <span className="t-semibold">{arrival.poCode}</span>
          <Badge tone={milestone === 'arrived' ? 'success' : milestone === 'nearby' ? 'accent' : 'neutral'}>
            {milestone ? t(K.board.tracking[milestone as ShipmentMilestone]) : t(K.board.untracked)}
          </Badge>
        </div>
        <p className="t-sm">{arrival.siteName}</p>
        <p className="t-xs t-muted">
          {arrival.supplierName}
          {arrival.vehicleLabel ? ` · ${arrival.vehicleLabel}` : ''}
        </p>
        <ul className="stack gap-1">
          {arrival.lines.map((l) => (
            <li key={l.id} className="t-sm row gap-2">
              <Package size={16} aria-hidden="true" className="shrink-0" /> {l.quantity > 1 ? `${l.quantity} × ` : ''}
              {l.description}
            </li>
          ))}
        </ul>
        {onTheWay && (
          <p className="t-xs t-muted">
            {t(K.board.stillOnWay)}
            {arrival.etaAt ? ` ${t(K.board.eta, { time: formatDateTime(arrival.etaAt, lang) })}` : ''}
          </p>
        )}
        {inProgress && <p className="t-xs t-muted">{t(K.board.checkedOf, { checked, total: inProgress.items.length })}</p>}
        <div>
          <Button variant={milestone === 'arrived' || milestone === 'nearby' || inProgress ? 'primary' : 'secondary'} loading={s.busy} onClick={() => void s.start(arrival).then((r) => report(r))}>
            {t(inProgress ? K.board.continue : K.board.start)}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function RecentCard({ c, s, t, lang }: { c: ChecklistView; s: DeliveryChecklistState; t: T; lang: string }) {
  const received = c.items.filter(isReceived).length;
  const wrong = c.items.filter((i) => i.verdict === 'discrepancy').length;
  const missing = c.items.filter((i) => i.verdict === 'not_arrived').length;
  return (
    <Card>
      <div className="stack gap-2">
        <div className="row between gap-2 wrap">
          <span className="t-semibold">{c.poCode}</span>
          <Badge tone={wrong > 0 ? 'warning' : 'success'}>{wrong > 0 ? t(K.item.state.discrepancy) : t(K.item.state.ok)}</Badge>
        </div>
        <p className="t-sm">{c.siteName}</p>
        <p className="t-xs t-muted">{t(K.board.summary, { received, wrong, missing, time: c.completedAt ? formatDateTime(c.completedAt, lang) : '' })}</p>
        {c.report?.status === 'open' && <p className="t-xs t-warning">{t(K.board.reportRaised, { code: c.report.code })}</p>}
        <div>
          <Button size="sm" variant="secondary" onClick={() => s.openChecklist(c.id)}>
            {t(K.board.view)}
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* --------------------------------------------------------------- checklist */

function ChecklistScreen({ s, checklist, t, lang, report }: { s: DeliveryChecklistState; checklist: ChecklistView; t: T; lang: string; report: (r: ActionResult, success?: string) => void }) {
  const done = checklist.status === 'completed';
  const p = s.progress!;
  const steps: AscensionStep[] = checklist.items.map((item, i) => ({
    id: item.lineItemId,
    label: item.description,
    meta: item.verdict === 'pending' ? undefined : t(K.item.state[item.verdict]),
    status: item.verdict === 'pending' ? (item.lineItemId === s.expandedId || i === checklist.items.findIndex((x) => x.verdict === 'pending') ? 'current' : 'upcoming') : 'complete',
    onClick: done ? undefined : () => s.toggleExpanded(item.lineItemId),
  }));

  return (
    <Screen width="narrow">
      <ScreenHeader title={checklist.poCode} subtitle={checklist.siteName} back={s.closeChecklist} backLabel={t('action.back')} />
      <div className="stack gap-3">
        {done && s.result && <ResultCard s={s} t={t} />}
        {!done && p.nothingArrived && (
          <Card>
            <div className="stack gap-2">
              <p className="t-md t-semibold row gap-2">
                <Warning size={18} aria-hidden="true" /> {t(K.work.nothingTitle)}
              </p>
              <p className="t-sm">{t(K.work.nothingBody)}</p>
            </div>
          </Card>
        )}
        <Card>
          <section className="stack gap-2" aria-labelledby="progress-heading">
            <div className="row between gap-2">
              <h2 id="progress-heading" className="t-md t-semibold">
                {t(K.work.progress)}
              </h2>
              <span className="t-sm t-muted">{t(K.work.progressOf, { checked: p.checked, total: p.total })}</span>
            </div>
            <AscensionLine steps={steps} />
            {!done && <p className="t-xs t-muted">{t(K.work.photoRule)}</p>}
          </section>
        </Card>

        <div className="stack gap-2">
          {checklist.items.map((item) => (
            <ItemCard key={item.lineItemId} item={item} s={s} t={t} lang={lang} done={done} report={report} />
          ))}
        </div>

        {done ? <RecordCard checklist={checklist} t={t} lang={lang} /> : (
          <div>
            <Button variant="ghost" size="sm" onClick={() => void s.discard().then((r) => report(r, K.toast.discarded))}>
              {t(K.work.discard)}
            </Button>
            <p className="t-xs t-muted mt-1">{t(K.work.discardBody)}</p>
          </div>
        )}
      </div>
      {!done && (
        <ActionBar>
          <span className="t-sm t-muted grow">{p.complete ? '' : t(K.work.remaining, { count: p.total - p.checked })}</span>
          <Button disabled={!p.complete} onClick={s.openSignOff}>
            {t(K.work.complete)}
          </Button>
        </ActionBar>
      )}
      <SignOffSheet s={s} checklist={checklist} t={t} report={report} />
    </Screen>
  );
}

function ItemCard({ item, s, t, lang, done, report }: { item: DeliveryCheckItem; s: DeliveryChecklistState; t: T; lang: string; done: boolean; report: (r: ActionResult, success?: string) => void }) {
  const open = !done && s.expandedId === item.lineItemId;
  const d = s.draftOf(item);
  const problem = s.problemFor(item);
  const kinds = s.kindsFor(item);
  const photoRequired = d.arrived && Number(d.qty) !== 0;
  return (
    <Card>
      <div className="stack gap-2">
        <button
          type="button"
          className="row between gap-2 full-w"
          style={{ minHeight: 48, textAlign: 'left', background: 'none', border: 0, padding: 0, color: 'inherit', cursor: done ? 'default' : 'pointer' }}
          onClick={() => !done && s.toggleExpanded(item.lineItemId)}
          aria-expanded={open}
          disabled={done}
        >
          <span className="stack grow">
            <span className="t-md t-semibold">{item.description}</span>
            <span className="t-xs t-muted">{t(K.item.expected, { count: item.expectedQty })}</span>
          </span>
          <span className="row gap-2">
            {item.verdict === 'pending' && photoRequired && item.photos.length === 0 && <Badge tone="accent">{t(K.item.blocked.photo)}</Badge>}
            <Badge tone={VERDICT_TONE[item.verdict]}>{t(K.item.state[item.verdict])}</Badge>
          </span>
        </button>

        {item.verdict !== 'pending' && !open && (
          <div className="stack gap-1">
            {item.verdict !== 'not_arrived' && <p className="t-xs t-muted">{t(K.item.received, { qty: item.receivedQty ?? item.expectedQty, expected: item.expectedQty })}</p>}
            {item.kinds.length > 0 && <p className="t-xs t-warning">{item.kinds.map((k) => t(K.item.kind[k])).join(' · ')}</p>}
            {item.note && <p className="t-xs">“{item.note}”</p>}
            {item.photos.length > 0 && (
              <div className="row gap-2 wrap">
                {item.photos.map((ph) =>
                  ph.previewUrl ? (
                    <img key={ph.id} src={ph.previewUrl} alt={item.description} style={{ height: 64, width: 64, objectFit: 'cover', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)' }} />
                  ) : (
                    <span key={ph.id} className="t-xs t-muted">{ph.fileName}</span>
                  ),
                )}
              </div>
            )}
            {item.checkedAt && item.checkedByName && <p className="t-xs t-muted">{t(K.item.checkedBy, { name: item.checkedByName, time: formatDateTime(item.checkedAt, lang) })}</p>}
          </div>
        )}

        {open && (
          <div className="stack gap-3 hairline-top pt-3">
            <Field label={t(K.item.onDelivery)}>
              {() => (
                <Tabs
                  label={t(K.item.onDelivery)}
                  value={d.arrived ? 'yes' : 'no'}
                  onChange={(id) => s.patchDraft(item, { arrived: id === 'yes' })}
                  items={[
                    { id: 'yes', label: t(K.item.yes) },
                    { id: 'no', label: t(K.item.no) },
                  ]}
                />
              )}
            </Field>
            {!d.arrived && <p className="t-sm t-muted">{t(K.item.notOnBody)}</p>}
            {d.arrived && (
              <>
                <Field label={t(K.item.count)} hint={t(K.item.countHint, { count: item.expectedQty })}>
                  {({ id, describedBy }) => (
                    <Input id={id} aria-describedby={describedBy} type="number" inputMode="numeric" min={0} value={d.qty} onChange={(e) => s.patchDraft(item, { qty: e.target.value })} />
                  )}
                </Field>
                {Number(d.qty) > 0 && (
                  <>
                    <Field label={t(K.item.condition)}>
                      {() => (
                        <Tabs
                          label={t(K.item.condition)}
                          value={d.conditionOk ? 'ok' : 'bad'}
                          onChange={(id) => s.patchDraft(item, { conditionOk: id === 'ok' })}
                          items={[
                            { id: 'ok', label: t(K.item.conditionOk) },
                            { id: 'bad', label: t(K.item.conditionBad) },
                          ]}
                        />
                      )}
                    </Field>
                    <Field label={t(K.item.spec)}>
                      {() => (
                        <Tabs
                          label={t(K.item.spec)}
                          value={d.specOk ? 'ok' : 'bad'}
                          onChange={(id) => s.patchDraft(item, { specOk: id === 'ok' })}
                          items={[
                            { id: 'ok', label: t(K.item.specOk) },
                            { id: 'bad', label: t(K.item.specBad) },
                          ]}
                        />
                      )}
                    </Field>
                    <div className="stack gap-2">
                      <span className="t-sm t-semibold">
                        {t(K.item.photos)} <Badge tone="accent">{t(K.item.blocked.photo)}</Badge>
                      </span>
                      <p className="t-xs t-muted">{t(K.item.photoHint)}</p>
                      {d.photos.map((ph, i) => (
                        <DocumentSlot
                          key={ph.id ?? `${ph.fileName}-${ph.capturedAt}`}
                          label={t(K.item.photoSlot, { n: i + 1 })}
                          value={{ fileName: ph.fileName, capturedAt: ph.capturedAt, previewUrl: ph.previewUrl ?? '' }}
                          onChange={(v) => s.setPhotos(item, v ? d.photos.map((x, j) => (j === i ? { fileName: v.fileName, capturedAt: v.capturedAt, previewUrl: v.previewUrl } : x)) : d.photos.filter((_, j) => j !== i))}
                          accept="image/*"
                          skipQualityCheck
                        />
                      ))}
                      {d.photos.length < MAX_PHOTOS && (
                        <DocumentSlot
                          key={`add-${d.photos.length}`}
                          label={d.photos.length === 0 ? t(K.item.photoSlot, { n: 1 }) : t(K.item.photoMore)}
                          required={d.photos.length === 0}
                          value={null}
                          onChange={(v) => v && s.setPhotos(item, [...d.photos, { fileName: v.fileName, capturedAt: v.capturedAt, previewUrl: v.previewUrl }])}
                          accept="image/*"
                          skipQualityCheck
                        />
                      )}
                    </div>
                    {(item.sopSteps ?? []).length > 0 && (
                      <div className="stack gap-2 hairline-top pt-3">
                        <span className="t-sm t-semibold">{t(K.item.sop.heading)}</span>
                        <p className="t-xs t-muted">
                          {t(K.item.sop.hint)}
                          {item.sopVersions && item.sopVersions.length > 0 ? ` ${item.sopVersions.map((v) => t(K.item.sop.version, { version: v.version })).join(' · ')}` : ''}
                        </p>
                        {s.sopNotices[item.lineItemId] && (
                          <p className="t-xs t-warning" role="status">
                            {t(K.item.sop.updated, { from: s.sopNotices[item.lineItemId].from, to: s.sopNotices[item.lineItemId].to })}
                          </p>
                        )}
                        {(item.sopSteps ?? []).map((st) => {
                          const text = stepText(st, lang);
                          const r = d.sop[st.id];
                          const fresh = s.sopNotices[item.lineItemId]?.newStepIds.includes(st.id);
                          return (
                            <div key={st.id} className="stack gap-2">
                              <Checkbox
                                checked={!!r?.done}
                                onChange={(v) => s.setSopStep(item, st.id, { done: v })}
                                label={
                                  <span className="stack">
                                    <span className="row gap-2 wrap">
                                      <span className="t-sm">{text.label}</span>
                                      <Badge tone={st.mandatory ? 'accent' : 'neutral'}>{t(st.mandatory ? K.item.sop.mandatory : K.item.sop.optional)}</Badge>
                                      {fresh && <Badge tone="warning">{t(K.item.sop.newStep)}</Badge>}
                                    </span>
                                    {text.hint && <span className="t-xs t-muted">{text.hint}</span>}
                                  </span>
                                }
                              />
                              {st.needsPhoto && r?.done && (
                                <DocumentSlot
                                  label={t(K.item.sop.photoSlot)}
                                  required
                                  value={r.photo ? { fileName: r.photo.fileName, capturedAt: r.photo.capturedAt, previewUrl: r.photo.previewUrl ?? '' } : null}
                                  onChange={(v) => s.setSopStep(item, st.id, { photo: v ? { fileName: v.fileName, capturedAt: v.capturedAt, previewUrl: v.previewUrl } : null })}
                                  accept="image/*"
                                  skipQualityCheck
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            {d.arrived && kinds.length > 0 && (
              <p className="t-sm t-warning row-top gap-2" role="status">
                <Warning size={16} className="shrink-0" aria-hidden="true" />
                <span>
                  {kinds.map((k) => t(K.item.kind[k])).join(' · ')}. {t(K.item.willRaise)}
                </span>
              </p>
            )}
            <Field label={t(K.item.note)} hint={t(kinds.length > 0 ? K.item.noteHintRequired : K.item.noteHint, { min: MIN_NOTE_LENGTH })} required={kinds.length > 0}>
              {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={2} value={d.note} onChange={(e) => s.patchDraft(item, { note: e.target.value })} />}
            </Field>
            {problem && (
              <p className="t-xs t-muted row gap-2" role="status">
                <ClipboardText size={14} className="shrink-0" aria-hidden="true" /> {t(K.item.blocked[problem === 'condition' ? 'note' : problem])}
              </p>
            )}
            <div>
              <Button disabled={!!problem} loading={s.busy} onClick={() => void s.saveItem(item).then((r) => report(r, K.toast.itemSaved))}>
                {t(item.verdict === 'pending' ? K.item.confirm : K.item.reconfirm)}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------ sign-off & record */

function SignOffSheet({ s, checklist, t, report }: { s: DeliveryChecklistState; checklist: ChecklistView; t: T; report: (r: ActionResult, success?: string) => void }) {
  const p = s.progress!;
  const wrongCount = p.discrepancies;
  return (
    <Sheet open={s.signOpen && checklist.status === 'in_progress'} onClose={() => s.setSignOpen(false)} title={t(K.sign.title)} closeLabel={t('action.close')}>
      <div className="stack gap-3">
        <p className="t-sm t-muted">{t(K.sign.intro)}</p>
        <ul className="stack gap-1 t-sm">
          <li>{t(K.sign.summary, { count: p.received })}</li>
          {p.notArrived > 0 && <li>{t(K.sign.summaryRest, { count: p.notArrived })}</li>}
          {wrongCount > 0 && <li className="t-warning">{t(K.sign.summaryReport, { count: wrongCount })}</li>}
        </ul>
        <Field label={t(K.sign.role)}>
          {() => (
            <Tabs
              label={t(K.sign.role)}
              value={s.sign.role}
              onChange={(id) => s.pickRole(id as (typeof RECEIVER_ROLES)[number])}
              items={RECEIVER_ROLES.map((r) => ({ id: r, label: t(r === 'technician' ? K.sign.role_technician : K.sign.role_site_contact) }))}
            />
          )}
        </Field>
        {s.sign.role === 'site_contact' && <p className="t-xs t-muted">{t(K.sign.roleHint_site_contact)}</p>}
        <Field label={t(K.sign.name)} hint={t(K.sign.nameHint)} required>
          {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={s.sign.name} onChange={(e) => s.patchSign({ name: e.target.value })} />}
        </Field>
        {s.sign.role === 'site_contact' && (
          <Field label={t(K.sign.phone)}>
            {({ id }) => <Input id={id} type="tel" inputMode="tel" value={s.sign.phone} onChange={(e) => s.patchSign({ phone: e.target.value })} />}
          </Field>
        )}
        {s.sign.role === 'technician' && (
          <Field label={t(K.sign.ack)} hint={t(K.sign.ackHint)}>
            {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={s.sign.ackName} onChange={(e) => s.patchSign({ ackName: e.target.value })} />}
          </Field>
        )}
        <Field label={t(K.sign.note)}>
          {({ id }) => <TextArea id={id} rows={2} value={s.sign.note} onChange={(e) => s.patchSign({ note: e.target.value })} />}
        </Field>
        <div className="row gap-2">
          <Button disabled={!s.canSign} loading={s.busy} onClick={() => void s.complete().then((r) => report(r))}>
            {t(K.sign.submit)}
          </Button>
          <Button variant="ghost" onClick={() => s.setSignOpen(false)}>
            {t('action.cancel')}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

function ResultCard({ s, t }: { s: DeliveryChecklistState; t: T }) {
  const navigate = useNavigate();
  const r = s.result!;
  return (
    <Card>
      <div className="stack gap-2" role="status">
        <p className="t-md t-semibold row gap-2">
          <CheckCircle size={20} weight="fill" aria-hidden="true" /> {t(K.done.title)}
        </p>
        <p className="t-sm">{r.poFullyDelivered ? t(K.done.fully, { code: r.checklist.poCode }) : t(K.done.partial, { code: r.checklist.poCode, count: r.deliveredLineCount })}</p>
        {r.checklist.report?.status === 'open' && <p className="t-sm t-warning">{t(K.done.report, { code: r.checklist.report.code })}</p>}
        {r.jobReady && <p className="t-sm">{t(K.done.jobReady)}</p>}
        <p className="t-xs t-muted">{t(K.done.signHint)}</p>
        <div className="row gap-2 wrap">
          <Button size="sm" onClick={() => navigate(`/delivery-confirmation?confirmation=${r.confirmationId}`)}>
            {t(K.done.sign)}
          </Button>
          {r.checklist.report?.status === 'open' && (
            <Button size="sm" variant="secondary" onClick={() => navigate(`/damaged-parts?report=${r.checklist.report!.id}`)}>
              {t(K.done.openReport)}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={s.closeChecklist}>
            {t(K.done.back)}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function RecordCard({ checklist, t, lang }: { checklist: ChecklistView; t: T; lang: string }) {
  const r = checklist.receivedBy;
  return (
    <Card>
      <div className="stack gap-2 t-sm">
        {checklist.completedAt && <p>{t(K.record.completedAt, { time: formatDateTime(checklist.completedAt, lang) })}</p>}
        {r && <p>{t(K.record.receivedBy, { name: r.name, role: t(r.role === 'technician' ? K.sign.role_technician : K.sign.role_site_contact) })}</p>}
        {checklist.recordedByName && <p className="t-muted">{t(K.record.recordedBy, { name: checklist.recordedByName })}</p>}
        {checklist.siteAck && <p>{t(K.record.ack, { name: checklist.siteAck.name })}</p>}
        {checklist.vehicleLabel && <p className="t-muted">{t(K.record.fromVehicle, { vehicle: checklist.vehicleLabel })}</p>}
        {checklist.note && <p>{t(K.record.note, { note: checklist.note })}</p>}
        {checklist.report && (
          <div className="stack gap-1 hairline-top pt-2">
            <p className="t-semibold">{t(K.record.reportHeading, { code: checklist.report.code })}</p>
            <p className="t-xs t-muted">{t(checklist.report.status === 'open' ? K.record.reportBody : K.record.reportWithdrawn)}</p>
          </div>
        )}
        <p className="t-xs t-muted hairline-top pt-2">{t(K.record.laterDefects)}</p>
      </div>
    </Card>
  );
}
