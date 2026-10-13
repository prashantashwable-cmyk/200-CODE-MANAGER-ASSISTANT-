import { useTranslation } from 'react-i18next';
import { CheckCircle, ClipboardText, Lock, Package, WifiSlash } from '@phosphor-icons/react';
import {
  ActionBar,
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
  SignaturePad,
  Tabs,
  TextArea,
  formatDateTime,
  useToast,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { DeliveryConfirmationView as ConfirmationView } from '@/data/repository';
import type { ConfirmationSignature, DeliveryConfirmationItem } from '@/data/types';
import { useDeliveryConfirmation } from './useDeliveryConfirmation';
import type { ActionResult, DeliveryConfirmationState } from './useDeliveryConfirmation';
import { DELIVERY_CONFIRMATION_KEYS as K, SECOND_PARTY_ROLES } from './delivery-confirmation.types';

type T = ReturnType<typeof useTranslation>['t'];

const VERDICT_TONE: Record<DeliveryConfirmationItem['verdict'], BadgeTone> = { ok: 'success', discrepancy: 'warning', not_arrived: 'neutral' };
const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);

/**
 * Screen 104 — Material Received Confirmation. The clean, signable summary of
 * a checked delivery: what arrived, what is still in question, and who stood
 * there. Signing locks it and, when it completes the deal's materials, starts
 * the clock on any payment that falls due on delivery.
 */
export function DeliveryConfirmationView() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const toast = useToast();
  const s = useDeliveryConfirmation();

  const report = (r: ActionResult) => {
    if (!r.ok) {
      toast.push(t(errorKey(r.code)), 'error');
      return;
    }
    toast.push(t(r.queued ? K.toast.queued : K.toast.signed), r.queued ? 'warning' : 'success');
  };

  const subtitle = s.isCustomer ? K.subtitleCustomer : s.isAdmin ? K.subtitleAdmin : K.subtitleTechnician;

  if (s.status === 'loading') {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
      </Screen>
    );
  }
  if (s.status === 'error' || !s.items) {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />
      </Screen>
    );
  }

  if (s.confirmationParam) {
    if (!s.open) {
      return (
        <Screen width="narrow">
          <ScreenHeader title={t(K.title)} back={s.closeConfirmation} backLabel={t('action.back')} />
          <EmptyState icon={<ClipboardText size={30} />} title={t(K.doc.notFound)} body={t(K.doc.notFoundBody)} />
        </Screen>
      );
    }
    return <Document s={s} c={s.open} t={t} lang={lang} report={report} />;
  }

  const empty = s.awaiting.length === 0 && s.signed.length === 0;
  return (
    <Screen width="default">
      <ScreenHeader title={t(K.title)} subtitle={t(subtitle)} />
      {s.flushed > 0 && <p className="t-sm t-success mb-3" role="status">{t(K.toast.sent, { count: s.flushed })}</p>}
      {empty ? (
        <EmptyState
          icon={<ClipboardText size={32} />}
          title={t(K.board.emptyTitle)}
          body={t(s.isCustomer ? K.board.emptyCustomerBody : K.board.emptyBody)}
          actionLabel={s.filteredToPo ? t(K.board.showAll) : undefined}
          onAction={s.filteredToPo ? s.showAll : undefined}
        />
      ) : (
        <div className="stack gap-4">
          {s.awaiting.length > 0 && (
            <section className="stack gap-2" aria-labelledby="awaiting-heading">
              <div className="stack">
                <h2 id="awaiting-heading" className="t-md t-semibold">
                  {t(K.board.awaitingHeading)}
                </h2>
                <p className="t-xs t-muted">{t(K.board.awaitingHint)}</p>
              </div>
              <div className="grid-auto" style={{ ['--min' as string]: '300px' }}>
                {s.awaiting.map((c) => (
                  <ConfirmationCard key={c.id} c={c} s={s} t={t} lang={lang} />
                ))}
              </div>
            </section>
          )}
          {s.signed.length > 0 && (
            <section className="stack gap-2" aria-labelledby="signed-heading">
              <h2 id="signed-heading" className="t-md t-semibold">
                {t(s.isCustomer ? K.board.customerHeading : K.board.signedHeading)}
              </h2>
              <div className="grid-auto" style={{ ['--min' as string]: '300px' }}>
                {s.signed.map((c) => (
                  <ConfirmationCard key={c.id} c={c} s={s} t={t} lang={lang} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </Screen>
  );
}

/* ------------------------------------------------------------------ board */

function countsOf(c: ConfirmationView) {
  return {
    received: c.items.filter((i) => i.verdict !== 'not_arrived' && i.receivedQty > 0).length,
    wrong: c.items.filter((i) => i.verdict === 'discrepancy').length,
    missing: c.items.filter((i) => i.verdict === 'not_arrived').length,
  };
}

function ConfirmationCard({ c, s, t, lang }: { c: ConfirmationView; s: DeliveryConfirmationState; t: T; lang: string }) {
  const n = countsOf(c);
  const signed = c.status === 'signed';
  const queued = s.queuedIds.has(c.id);
  const openReports = c.reports.filter((r) => r.status === 'open').length;
  return (
    <Card>
      <div className="stack gap-2">
        <div className="row between gap-2 wrap">
          <span className="t-semibold">{c.code}</span>
          {signed ? (
            <Badge tone="success">
              <Lock size={12} aria-hidden="true" /> {t(K.doc.statusSigned)}
            </Badge>
          ) : (
            <Badge tone={queued ? 'accent' : 'warning'}>{t(queued ? K.board.queued : K.doc.statusAwaiting)}</Badge>
          )}
        </div>
        <p className="t-sm">
          {c.poCode} · {c.siteName}
        </p>
        <p className="t-xs t-muted">{t(K.board.summary, n)}</p>
        {signed && c.signedAt && <p className="t-xs t-muted">{t(K.board.signedOn, { time: formatDateTime(c.signedAt, lang) })}</p>}
        {openReports > 0 && <p className="t-xs t-warning">{t(K.board.pendingReports, { count: openReports })}</p>}
        <div>
          <Button size="sm" variant={signed ? 'secondary' : 'primary'} onClick={() => s.openConfirmation(c.id)}>
            {t(signed || s.isCustomer ? K.board.open : K.board.sign)}
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* --------------------------------------------------------------- document */

function Document({ s, c, t, lang, report }: { s: DeliveryConfirmationState; c: ConfirmationView; t: T; lang: string; report: (r: ActionResult) => void }) {
  const signed = c.status === 'signed';
  const customerCopy = s.isCustomer;
  const stillToCome = c.items.filter((i) => i.verdict === 'not_arrived');
  const wrong = c.items.filter((i) => i.verdict === 'discrepancy');
  const reportsShown = signed && c.reportsAtSigning ? c.reportsAtSigning : c.reports;
  const openNow = c.reports.filter((r) => r.status === 'open');
  const queued = s.queuedIds.has(c.id);
  const aloneSigned = signed && c.signatures.length === 1;

  return (
    <Screen width="narrow">
      <ScreenHeader title={c.code} subtitle={`${c.poCode} · ${c.siteName}`} back={s.closeConfirmation} backLabel={t('action.back')} />
      <div className="stack gap-3">
        <Card>
          <div className="stack gap-2">
            <div className="row between gap-2 wrap">
              <Badge tone={signed ? 'success' : 'warning'}>{signed ? t(K.doc.statusSigned) : t(K.doc.statusAwaiting)}</Badge>
              {customerCopy && <span className="t-xs t-muted">{t(K.doc.customerCopy)}</span>}
            </div>
            <dl className="stack gap-1 t-sm">
              <DocRow label={t(K.doc.site)} value={`${c.siteName}${c.address ? `, ${c.address}` : ''}`} />
              <DocRow label={t(K.doc.order)} value={c.poCode} />
              {c.supplierName && <DocRow label={t(K.doc.supplier)} value={c.supplierName} />}
              {c.vehicleLabel && <DocRow label={t(K.doc.vehicle)} value={c.vehicleLabel} />}
              {c.receiver && <DocRow label={t(K.doc.receivedBy)} value={`${c.receiver.name} · ${t(K.doc.role[c.receiver.role])}`} />}
            </dl>
            {signed && c.signedAt && (
              <p className="t-sm row gap-2" role="status">
                <Lock size={16} aria-hidden="true" /> {t(K.doc.locked, { time: formatDateTime(c.signedAt, lang) })}
              </p>
            )}
            {signed && c.capturedAt && <p className="t-xs t-muted">{t(K.doc.delayed)}</p>}
          </div>
        </Card>

        <Card>
          <section className="stack gap-2" aria-labelledby="parts-heading">
            <h2 id="parts-heading" className="t-md t-semibold">
              {t(K.doc.partsHeading)}
            </h2>
            <ul className="stack gap-2">
              {c.items.map((i) => (
                <li key={i.lineItemId} className="stack gap-1 hairline-top pt-2">
                  <div className="row between gap-2">
                    <span className="t-sm t-semibold row gap-2">
                      <Package size={16} aria-hidden="true" className="shrink-0" /> {i.description}
                    </span>
                    <Badge tone={VERDICT_TONE[i.verdict]}>{t(K.doc.verdict[i.verdict])}</Badge>
                  </div>
                  {i.verdict !== 'not_arrived' && (
                    <p className="t-xs t-muted">
                      {t(K.doc.received, { qty: i.receivedQty, expected: i.expectedQty })}
                      {i.photoCount > 0 ? ` · ${t(K.doc.photos, { count: i.photoCount })}` : ''}
                    </p>
                  )}
                  {i.kinds.length > 0 && <p className="t-xs t-warning">{i.kinds.map((k) => t(K.doc.kind[k])).join(' · ')}</p>}
                  {i.note && !customerCopy && <p className="t-xs">“{i.note}”</p>}
                </li>
              ))}
            </ul>
            <p className="t-sm">{c.poFullyDelivered && stillToCome.length === 0 ? t(K.doc.fullyDelivered) : t(K.doc.partDelivered)}</p>
            {stillToCome.length > 0 && <p className="t-xs t-muted">{t(K.doc.stillToCome, { count: stillToCome.length })}</p>}
          </section>
        </Card>

        {(wrong.length > 0 || reportsShown.length > 0) && (
          <Card>
            <section className="stack gap-2" aria-labelledby="pending-heading">
              <h2 id="pending-heading" className="t-md t-semibold">
                {t(K.doc.pendingHeading)}
              </h2>
              <p className="t-sm">{t(customerCopy ? K.doc.pendingBodyCustomer : K.doc.pendingBody)}</p>
              {reportsShown.map((r) => {
                const now = c.reports.find((x) => x.id === r.id);
                return (
                  <p key={r.id} className="t-xs t-muted">
                    {t(reportKey(r.status), { code: r.code })}
                    {signed && now && now.status !== r.status ? ` → ${t(reportKey(now.status), { code: now.code })}` : ''}
                  </p>
                );
              })}
            </section>
          </Card>
        )}

        {signed && (
          <Card>
            <section className="stack gap-3" aria-labelledby="signatures-heading">
              <h2 id="signatures-heading" className="t-md t-semibold">
                {t(K.doc.signedHeading)}
              </h2>
              {c.signatures.map((sig) => (
                <SignatureBlock key={sig.role + sig.name} sig={sig} t={t} lang={lang} />
              ))}
              {aloneSigned && c.note && <p className="t-sm">{t(K.doc.aloneNote, { note: c.note })}</p>}
              {c.recordedByName && !customerCopy && <p className="t-xs t-muted">{t(K.doc.recordedBy, { name: c.recordedByName })}</p>}
              {c.materialsComplete && !customerCopy && <p className="t-xs t-muted">{t(K.doc.materialsFired)}</p>}
              <p className="t-xs t-muted hairline-top pt-2">{t(K.doc.lockedBody)}</p>
            </section>
          </Card>
        )}

        {!signed && c.canSign && <SignSection s={s} c={c} t={t} openReports={openNow.length} />}
        {queued && (
          <Card>
            <p className="t-sm row gap-2" role="status">
              <CheckCircle size={18} weight="fill" aria-hidden="true" /> <span>{t(K.sign.queuedBody)}</span>
            </p>
          </Card>
        )}
      </div>
      {!signed && c.canSign && !queued && (
        <ActionBar>
          <Button block disabled={!s.canSubmit} loading={s.busy} icon={s.online ? <Lock size={18} /> : <WifiSlash size={18} />} onClick={() => void s.submit().then(report)}>
            {t(s.online ? K.sign.submit : K.sign.submitOffline)}
          </Button>
        </ActionBar>
      )}
    </Screen>
  );
}

const reportKey = (status: string) => (status === 'open' ? K.doc.reportOpen : status === 'resolved' ? K.doc.reportResolved : K.doc.reportWithdrawn);

function DocRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="row between gap-3" style={{ alignItems: 'baseline' }}>
      <dt className="t-muted">{label}</dt>
      <dd style={{ textAlign: 'right' }}>{value}</dd>
    </div>
  );
}

function SignatureBlock({ sig, t, lang }: { sig: ConfirmationSignature; t: T; lang: string }) {
  return (
    <div className="stack gap-1">
      <img
        src={sig.signature}
        alt={t(K.doc.signatureOf, { name: sig.name })}
        style={{ maxHeight: 90, maxWidth: '100%', objectFit: 'contain', alignSelf: 'flex-start', borderBottom: '1px solid var(--color-border)' }}
      />
      <p className="t-sm t-semibold">
        {sig.name} · {t(K.doc.role[sig.role])}
      </p>
      <p className="t-xs t-muted">{t(K.doc.signedAt, { time: formatDateTime(sig.signedAt, lang) })}</p>
    </div>
  );
}

/* ---------------------------------------------------------------- signing */

function SignSection({ s, c, t, openReports }: { s: DeliveryConfirmationState; c: ConfirmationView; t: T; openReports: number }) {
  const d = s.draft;
  const receiver = c.receiver;
  const queued = s.queuedIds.has(c.id);
  if (!receiver || queued) return null;
  return (
    <Card>
      <section className="stack gap-3" aria-labelledby="sign-heading">
        <div className="stack">
          <h2 id="sign-heading" className="t-md t-semibold">
            {t(K.sign.heading)}
          </h2>
          <p className="t-xs t-muted">{t(K.sign.intro)}</p>
        </div>
        {!s.online && (
          <div className="stack gap-1" role="status">
            <p className="t-sm t-warning row gap-2">
              <WifiSlash size={16} aria-hidden="true" /> {t(K.sign.offlineTitle)}
            </p>
            <p className="t-xs t-muted">{t(K.sign.offlineBody)}</p>
          </div>
        )}
        {openReports > 0 && <p className="t-xs t-warning">{t(K.sign.pendingWarning, { count: openReports })}</p>}

        <div className="stack gap-2">
          <p className="t-sm t-semibold">{t(K.sign.primary, { name: receiver.name, role: t(K.doc.role[receiver.role]) })}</p>
          <p className="t-xs t-muted">{t(K.sign.primaryHint)}</p>
          <SignaturePad value={d.signature} onChange={(v) => s.patch({ signature: v })} clearLabel={t(K.sign.clear)} />
        </div>

        <Checkbox checked={d.hasSecond} onChange={(v) => s.patch({ hasSecond: v })} label={t(K.sign.second)} />
        {d.hasSecond ? (
          <div className="stack gap-3">
            <p className="t-xs t-muted">{t(K.sign.secondHint)}</p>
            <Field label={t(K.sign.secondRole)}>
              {() => (
                <Tabs
                  label={t(K.sign.secondRole)}
                  value={d.secondRole}
                  onChange={(id) => s.patch({ secondRole: id as (typeof SECOND_PARTY_ROLES)[number] })}
                  items={SECOND_PARTY_ROLES.map((r) => ({ id: r, label: t(K.doc.role[r]) }))}
                />
              )}
            </Field>
            <Field label={t(K.sign.secondName)} required>
              {({ id }) => <Input id={id} value={d.secondName} onChange={(e) => s.patch({ secondName: e.target.value })} />}
            </Field>
            <SignaturePad value={d.secondSignature} onChange={(v) => s.patch({ secondSignature: v })} clearLabel={t(K.sign.clear)} />
          </div>
        ) : (
          <Field label={t(K.sign.noSecondNote)} hint={t(K.sign.noSecondHint)} required>
            {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={2} value={d.note} onChange={(e) => s.patch({ note: e.target.value })} />}
          </Field>
        )}
        <p className="t-xs t-muted">{t(K.sign.lockWarning)}</p>
      </section>
    </Card>
  );
}
