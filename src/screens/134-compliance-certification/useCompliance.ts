import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { ComplianceInput, ComplianceView } from '@/data/repository';
import type { ComplianceStandard, ComplianceStandardId } from '@/data/types';
import { primaryOf, standardsProblem } from '@/features/qc/compliance';
import type { ComplianceStatus, ComplianceTab } from './compliance.types';
import { COMPLIANCE_KEYS as K, POLL_MS, TABS } from './compliance.types';

export interface ActionResult {
  ok: boolean;
  code?: string;
}
export interface StandardsForm {
  /** Empty: the drive type decides. */
  primary: ComplianceStandardId | '';
  primaryLabel: string;
  overrideReason: string;
  additional: { id: ComplianceStandardId; label: string; reason: string }[];
}
export const EMPTY_STANDARDS: StandardsForm = { primary: '', primaryLabel: '', overrideReason: '', additional: [] };

const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');

/** The repository's input from the form: what was left empty is what the drive type decides. */
export function inputOf(f: StandardsForm): ComplianceInput {
  const std = (id: ComplianceStandardId, label: string, reason?: string): ComplianceStandard => ({ id, ...(id === 'other' ? { label: label.trim() } : {}), ...(reason !== undefined ? { reason: reason.trim() } : {}) });
  return {
    ...(f.primary ? { primary: std(f.primary, f.primaryLabel) } : {}),
    additional: f.additional.map((a) => std(a.id, a.label, a.reason)),
    ...(f.overrideReason.trim() ? { overrideReason: f.overrideReason.trim() } : {}),
  };
}

export type ComplianceState = ReturnType<typeof useCompliance>;

/**
 * Screen 134. AIEC's own compliance certificate for a checked installation, the evidence package behind it and the customer's next external
 * step. Admin issues it (once both quality checks are signed off) and reissues it as a formal correction; the inspector reads. The standard
 * follows the drive type that was sold, and is Admin's documented choice where the drive type is not one the common standards cover.
 */
export function useCompliance() {
  const repository = useData();
  const { user } = useSession();
  const { jobId } = useParams();
  const { t } = useTranslation();
  const { push } = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<ComplianceView | null>(null);
  const [status, setStatus] = useState<ComplianceStatus>(jobId ? 'loading' : 'ready');
  const [busy, setBusy] = useState(false);
  const [form, setFormState] = useState<StandardsForm>(EMPTY_STANDARDS);
  const tabParam = params.get('tab') as ComplianceTab | null;
  const tab: ComplianceTab = tabParam && (TABS as readonly string[]).includes(tabParam) ? tabParam : 'certificate';

  const load = useCallback(async () => {
    if (!user || !jobId) return;
    try {
      setView(await repository.getComplianceCertification(jobId, user.id));
      setStatus('ready');
    } catch (e) {
      const c = codeOf(e);
      if (c === 'not_found' || c === 'forbidden') setStatus('not_found');
      else setStatus((s) => (s === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, jobId]);

  useEffect(() => {
    setView(null);
    setFormState(EMPTY_STANDARDS);
    if (jobId) setStatus('loading');
    void load();
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load, jobId]);

  const guard = async (fn: () => Promise<unknown>, okKey?: string): Promise<ActionResult> => {
    if (!navigator.onLine) return { ok: false, code: 'offline' };
    setBusy(true);
    try {
      await fn();
      await load();
      if (okKey) push(t(okKey), 'success');
      return { ok: true };
    } catch (e) {
      return { ok: false, code: codeOf(e) };
    } finally {
      setBusy(false);
    }
  };
  const uid = user?.id ?? '';

  /** What stops the choice as it stands: the same rule the repository applies. */
  const problem = (f: StandardsForm) => (view ? standardsProblem(view.driveType, inputOf(f)) : null);
  const primaryNow = (f: StandardsForm) => (view ? primaryOf(view.driveType, inputOf(f)) : null);

  return {
    status,
    jobId: jobId ?? null,
    view,
    busy,
    tab,
    setTab: (next: ComplianceTab) => setParams(next === 'certificate' ? {} : { tab: next }, { replace: true }),
    reload: () => {
      setStatus('loading');
      void load();
    },
    form,
    setForm: (patch: Partial<StandardsForm>) => setFormState((f) => ({ ...f, ...patch })),
    resetForm: () => setFormState(EMPTY_STANDARDS),
    problem,
    primaryNow,
    issue: () => guard(() => repository.issueComplianceCertificate(jobId ?? '', inputOf(form), uid), K.issue.toast),
    reissue: (f: StandardsForm, reason: string) => guard(() => repository.reissueComplianceCertificate(jobId ?? '', { ...inputOf(f), reason }, uid), K.reissue.toast),
    saveGuidance: (input: { authority: string; steps: string[]; note: string }) => guard(() => repository.saveStateGuidance({ state: view?.guidance.state ?? '', ...input }, uid), K.next.saved),
    goto: (path: string) => navigate(path),
  };
}
