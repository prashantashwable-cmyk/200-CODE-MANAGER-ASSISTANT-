import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { SupplierAgreementSummary, SupplierAgreementView } from '@/data/repository';
import type { SupplierAgreementTerms, SupplierAgreementVersion } from '@/data/types';
import { changedTerms, checkTerms } from '@/features/suppliers/agreement';
import type { TermsIssue } from '@/features/suppliers/agreement';
import type { DocumentSlotValue } from '@/features/onboarding/DocumentSlot';
import type { AgreementTab, SupplierAgreementScreenStatus, TermsDraft } from './supplier-agreement.types';

const DEFAULT_TERMS: SupplierAgreementTerms = { deliverySlaDays: 30, paymentTermsDays: 30, minQualityScore: 4, warrantyMonths: 12, qualityStandards: '' };

/** yyyy-mm-dd in local time, for a date input. */
function toDateInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function addDays(dateInput: string, n: number): string {
  const d = new Date(`${dateInput}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toDateInput(d.toISOString());
}
/** A term starts at the beginning of its first day and runs to the end of its last. */
const startOf = (dateInput: string) => new Date(`${dateInput}T00:00:00`).toISOString();
const endOf = (dateInput: string) => new Date(`${dateInput}T23:59:59`).toISOString();

const draftOf = (terms: SupplierAgreementTerms): TermsDraft => ({
  deliverySlaDays: String(terms.deliverySlaDays),
  paymentTermsDays: String(terms.paymentTermsDays),
  minQualityScore: String(terms.minQualityScore),
  warrantyMonths: String(terms.warrantyMonths),
  qualityStandards: terms.qualityStandards,
});
const termsOf = (draft: TermsDraft): SupplierAgreementTerms => ({
  deliverySlaDays: Number(draft.deliverySlaDays),
  paymentTermsDays: Number(draft.paymentTermsDays),
  minQualityScore: Number(draft.minQualityScore),
  warrantyMonths: Number(draft.warrantyMonths),
  qualityStandards: draft.qualityStandards,
});

export type FormIssue = TermsIssue | 'starts_before_previous';

export function useSupplierAgreement() {
  const repository = useData();
  const { user, role } = useSession();
  const isAdmin = role === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSupplierId = searchParams.get('supplierId');

  const [status, setStatus] = useState<SupplierAgreementScreenStatus>('loading');
  const [view, setView] = useState<SupplierAgreementView | null>(null);
  const [summaries, setSummaries] = useState<SupplierAgreementSummary[]>([]);
  const [tab, setTab] = useState<AgreementTab>('orders');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      let supplierId = requestedSupplierId;
      if (!isAdmin) {
        supplierId = (await repository.getSupplierForUser(user.id))?.id ?? null;
      } else if (!supplierId) {
        setSummaries(await repository.listSupplierAgreements(user.id));
        setStatus('pick');
        return;
      }
      if (!supplierId) {
        setStatus('not_found');
        return;
      }
      const next = await repository.getSupplierAgreement(supplierId, user.id);
      setView(next);
      setStatus(next ? 'ready' : 'not_found');
    } catch {
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, isAdmin, requestedSupplierId]);

  useEffect(() => {
    void load();
  }, [load]);

  const pickSupplier = (supplierId: string) => setSearchParams({ supplierId });

  /** The supplier's own oldest unconfirmed version — what they're asked to confirm. */
  const awaitingAck: SupplierAgreementVersion | null = useMemo(
    () => (view ? ([...view.versions].reverse().find((v) => !v.version.acknowledgedAt)?.version ?? null) : null),
    [view],
  );

  /* -------------------------------------------------------- record form */
  const [formKind, setFormKind] = useState<SupplierAgreementVersion['kind'] | null>(null);
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [expiresOn, setExpiresOn] = useState('');
  const [termsDraft, setTermsDraft] = useState<TermsDraft>(draftOf(DEFAULT_TERMS));
  const [reason, setReason] = useState('');
  const [document, setDocument] = useState<DocumentSlotValue | null>(null);
  const [passThrough, setPassThrough] = useState(false);
  const [saving, setSaving] = useState(false);

  const latest = view?.versions[0]?.version ?? null;

  const openForm = (kind: SupplierAgreementVersion['kind']) => {
    const today = toDateInput(new Date().toISOString());
    const current = view?.current ?? latest;
    let from = today;
    let to = addDays(today, 364);
    if (kind === 'amendment' && current) to = toDateInput(current.expiresOn);
    if (kind === 'renewal' && current) {
      // Pick up the day after the old term ends — or today, if it already has.
      const dayAfter = addDays(toDateInput(current.expiresOn), 1);
      from = dayAfter > today ? dayAfter : today;
      to = addDays(from, 364);
    }
    setEffectiveFrom(from);
    setExpiresOn(to);
    setTermsDraft(draftOf(current?.terms ?? DEFAULT_TERMS));
    setReason('');
    setDocument(null);
    setPassThrough(false);
    setFormKind(kind);
  };
  const closeForm = () => setFormKind(null);
  const setTerm = (key: keyof TermsDraft, value: string) => setTermsDraft((d) => ({ ...d, [key]: value }));

  const formTerms = termsOf(termsDraft);
  const formIssues: FormIssue[] = useMemo(() => {
    if (!formKind || !effectiveFrom || !expiresOn) return formKind ? ['expiry_before_start'] : [];
    const issues: FormIssue[] = checkTerms(termsOf(termsDraft), startOf(effectiveFrom), endOf(expiresOn));
    if (latest && new Date(startOf(effectiveFrom)).getTime() < new Date(latest.effectiveFrom).getTime()) issues.push('starts_before_previous');
    return issues;
  }, [formKind, effectiveFrom, expiresOn, termsDraft, latest]);
  const formChanges = useMemo(() => {
    const base = view?.current?.terms ?? latest?.terms ?? null;
    return base ? changedTerms(base, termsOf(termsDraft)).map((key) => ({ key, from: base[key], to: termsOf(termsDraft)[key] })) : [];
  }, [view, latest, termsDraft]);
  const needsReason = formKind !== null && formKind !== 'initial';
  const canSave =
    formIssues.length === 0 && !!document && passThrough && (!needsReason || reason.trim().length >= 10) && !saving;

  const saveForm = async (): Promise<boolean> => {
    if (!view || !user || !formKind || !document) return false;
    setSaving(true);
    try {
      await repository.recordAgreementVersion(
        view.supplier.id,
        {
          kind: formKind,
          terms: formTerms,
          effectiveFrom: startOf(effectiveFrom),
          expiresOn: endOf(expiresOn),
          documentName: document.fileName,
          reason: needsReason ? reason : undefined,
          warrantyPassThrough: passThrough,
        },
        user.id,
      );
      setFormKind(null);
      setTab('history');
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------------------------------ acknowledge */
  const [acknowledging, setAcknowledging] = useState(false);
  const acknowledge = async (): Promise<boolean> => {
    if (!awaitingAck || !user) return false;
    setAcknowledging(true);
    try {
      await repository.acknowledgeAgreementVersion(awaitingAck.id, user.id);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setAcknowledging(false);
    }
  };

  return {
    status,
    isAdmin,
    view,
    summaries,
    pickSupplier,
    reload: load,
    tab,
    setTab,
    awaitingAck,
    acknowledge,
    acknowledging,
    formKind,
    openForm,
    closeForm,
    effectiveFrom,
    setEffectiveFrom,
    expiresOn,
    setExpiresOn,
    termsDraft,
    setTerm,
    reason,
    setReason,
    needsReason,
    document,
    setDocument,
    passThrough,
    setPassThrough,
    formIssues,
    formChanges,
    canSave,
    saving,
    saveForm,
  };
}

export type SupplierAgreementState = ReturnType<typeof useSupplierAgreement>;
