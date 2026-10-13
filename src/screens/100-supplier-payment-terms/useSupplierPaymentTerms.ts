import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { SupplierPaymentTermsView, SupplierRetentionView, SupplierTermsRow } from '@/data/repository';
import type { SupplierPaymentTermSettings, SupplierTrustTier } from '@/data/types';
import { checkSettings, increasesRisk } from '@/features/suppliers/paymentTerms';
import type { SettingsIssue } from '@/features/suppliers/paymentTerms';
import type { SettingsDraft, SupplierPaymentTermsStatus } from './supplier-payment-terms.types';

const draftOf = (s: SupplierPaymentTermSettings): SettingsDraft => ({ termType: s.termType, upfrontPct: String(s.upfrontPct), retentionPct: String(s.retentionPct) });
const settingsOf = (d: SettingsDraft): SupplierPaymentTermSettings => ({
  termType: d.termType,
  // Net terms pay nothing ahead of delivery, whatever the field last said.
  upfrontPct: d.termType === 'net' ? 0 : Number(d.upfrontPct),
  retentionPct: Number(d.retentionPct),
});
const sameSettings = (a: SupplierPaymentTermSettings, b: SupplierPaymentTermSettings) =>
  a.termType === b.termType && a.upfrontPct === b.upfrontPct && a.retentionPct === b.retentionPct;

export function useSupplierPaymentTerms() {
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<SupplierPaymentTermsStatus>('loading');
  const [view, setView] = useState<SupplierPaymentTermsView | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setView(await repository.getSupplierPaymentTerms(user.id));
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (fn: () => Promise<unknown>): Promise<boolean> => {
    setBusy(true);
    try {
      await fn();
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------------------------------------ tier defaults */
  const [tierEditing, setTierEditing] = useState<SupplierTrustTier | null>(null);
  const [tierDraft, setTierDraft] = useState<SettingsDraft>({ termType: 'net', upfrontPct: '0', retentionPct: '0' });
  const [tierReason, setTierReason] = useState('');
  const [tierRiskAck, setTierRiskAck] = useState(false);
  const openTier = (tier: SupplierTrustTier) => {
    if (!view) return;
    setTierDraft(draftOf(view.config.tiers[tier]));
    setTierReason('');
    setTierRiskAck(false);
    setTierEditing(tier);
  };
  const tierSettings = settingsOf(tierDraft);
  const tierIssues: SettingsIssue[] = tierEditing ? checkSettings(tierSettings) : [];
  const tierCurrent = tierEditing && view ? view.config.tiers[tierEditing] : null;
  const tierRisky = !!tierCurrent && increasesRisk(tierCurrent, tierSettings);
  const tierChanged = !!tierCurrent && !sameSettings(tierCurrent, tierSettings);
  const canSaveTier = tierChanged && tierIssues.length === 0 && tierReason.trim().length >= 10 && (!tierRisky || tierRiskAck);
  const saveTier = async () => {
    if (!tierEditing || !user) return false;
    const ok = await run(() => repository.updateTierDefaults(tierEditing, tierSettings, tierReason, user.id));
    if (ok) setTierEditing(null);
    return ok;
  };

  /* ----------------------------------------------------- one supplier */
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const row: SupplierTermsRow | null = useMemo(() => view?.suppliers.find((r) => r.supplier.id === supplierId) ?? null, [view, supplierId]);
  const [tierChoice, setTierChoice] = useState<SupplierTrustTier>('new');
  const [customOn, setCustomOn] = useState(false);
  const [customDraft, setCustomDraft] = useState<SettingsDraft>({ termType: 'net', upfrontPct: '0', retentionPct: '0' });
  const [supplierReason, setSupplierReason] = useState('');
  const [supplierRiskAck, setSupplierRiskAck] = useState(false);
  const openSupplier = (id: string) => {
    const r = view?.suppliers.find((x) => x.supplier.id === id);
    if (!r) return;
    setTierChoice(r.tier);
    setCustomOn(r.custom);
    setCustomDraft(draftOf(r.settings));
    setSupplierReason('');
    setSupplierRiskAck(false);
    setSupplierId(id);
  };
  /** What the supplier would be on after saving — for the preview and the risk check. */
  const nextSettings: SupplierPaymentTermSettings | null =
    row && view ? (customOn ? settingsOf(customDraft) : view.config.tiers[tierChoice]) : null;
  const customIssues: SettingsIssue[] = customOn ? checkSettings(settingsOf(customDraft)) : [];
  const supplierChanged = !!row && !!nextSettings && (tierChoice !== row.tier || customOn !== row.custom || !sameSettings(row.settings, nextSettings));
  const supplierRisky = !!row && !!nextSettings && increasesRisk(row.settings, nextSettings);
  const canSaveSupplier = supplierChanged && customIssues.length === 0 && supplierReason.trim().length >= 10 && (!supplierRisky || supplierRiskAck);
  const saveSupplier = async () => {
    if (!row || !user || !nextSettings) return false;
    const ok = await run(async () => {
      if (tierChoice !== row.tier) await repository.setSupplierPaymentTier(row.supplier.id, tierChoice, supplierReason, user.id);
      if (customOn && (!row.custom || !sameSettings(row.settings, nextSettings))) {
        await repository.setSupplierTermsOverride(row.supplier.id, nextSettings, supplierReason, user.id);
      } else if (!customOn && row.custom) {
        await repository.setSupplierTermsOverride(row.supplier.id, null, supplierReason, user.id);
      }
    });
    if (ok) setSupplierId(null);
    return ok;
  };
  const supplierHistory = useMemo(() => view?.history.filter((h) => h.supplierId === supplierId) ?? [], [view, supplierId]);

  /* ---------------------------------------------------------- retention */
  const [deciding, setDeciding] = useState<{ item: SupplierRetentionView; decision: 'release' | 'withhold' } | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const openDecision = (item: SupplierRetentionView, decision: 'release' | 'withhold') => {
    setDecisionReason('');
    setDeciding({ item, decision });
  };
  const canDecide = !!deciding && decisionReason.trim().length >= (deciding.decision === 'withhold' ? 10 : 4);
  const decide = async () => {
    if (!deciding || !user) return false;
    const ok = await run(() => repository.decideRetention(deciding.item.retention.id, deciding.decision, decisionReason, user.id));
    if (ok) setDeciding(null);
    return ok;
  };

  return {
    status,
    view,
    reload: load,
    busy,
    tierEditing,
    closeTier: () => setTierEditing(null),
    openTier,
    tierDraft,
    setTierDraft,
    tierSettings,
    tierIssues,
    tierRisky,
    tierChanged,
    tierReason,
    setTierReason,
    tierRiskAck,
    setTierRiskAck,
    canSaveTier,
    saveTier,
    row,
    openSupplier,
    closeSupplier: () => setSupplierId(null),
    tierChoice,
    setTierChoice,
    customOn,
    setCustomOn,
    customDraft,
    setCustomDraft,
    customIssues,
    nextSettings,
    supplierChanged,
    supplierRisky,
    supplierReason,
    setSupplierReason,
    supplierRiskAck,
    setSupplierRiskAck,
    canSaveSupplier,
    saveSupplier,
    supplierHistory,
    deciding,
    openDecision,
    closeDecision: () => setDeciding(null),
    decisionReason,
    setDecisionReason,
    canDecide,
    decide,
  };
}

export type SupplierPaymentTermsState = ReturnType<typeof useSupplierPaymentTerms>;
