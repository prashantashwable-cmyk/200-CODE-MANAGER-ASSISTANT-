import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { FinancingPartnerRate } from '@/data/types';
import type { LoanApplicationView } from '@/data/repository';
import { useWizard } from '@/features/onboarding/useWizard';
import type { WizardStepDef } from '@/features/onboarding/useWizard';
import { INITIAL_LOAN_DRAFT, LOAN_EMI_APPLICATION_KEYS as K, computeEmi, evaluatePrecheck } from './loan-emi-application.types';
import type { LoanDraft, LoanEmiApplicationStatus } from './loan-emi-application.types';

const ADVANCE_DELAY_MS = 2600;

export const LOAN_STEPS: WizardStepDef<LoanDraft>[] = [
  {
    id: 'precheck',
    labelKey: K.step.precheck,
    isComplete: (d) => d.incomeRange !== '' && d.tenurePreferenceMonths !== '',
  },
  {
    id: 'details',
    labelKey: K.step.details,
    isComplete: (d) => Number(d.requestedAmount) > 0 && d.tenureMonths !== '' && d.interestRatePercent !== null,
  },
  {
    id: 'review',
    labelKey: K.step.review,
    isComplete: (d) => Number(d.requestedAmount) > 0 && d.tenureMonths !== '' && d.interestRatePercent !== null,
  },
];

type RatesStatus = 'idle' | 'loading' | 'unavailable' | 'loaded';

interface LoanEmiApplicationState {
  status: LoanEmiApplicationStatus;
  view: LoanApplicationView | null;
  wizard: ReturnType<typeof useWizard<LoanDraft>>;
  precheckResult: { eligible: boolean; reasonKey?: string } | null;
  ratesTable: FinancingPartnerRate[] | null;
  ratesStatus: RatesStatus;
  fetchRates: () => void;
  submitting: boolean;
  submit: () => Promise<boolean>;
  reload: () => Promise<void>;
}

/**
 * One deal's EMI intake, scoped to the signed-in customer. The wizard
 * mechanics (step navigation, localStorage draft resume) are the same
 * generic `useWizard` the partner-onboarding screens use — nothing about
 * loan intake needed its own parallel draft system.
 *
 * Once an application exists for this deal, `view.activeApplication`
 * takes over and a timer here moves it one status forward every ~2.6s
 * (submitted → under_review → approved → disbursed) — AIEC never decides
 * the outcome, only records it; see `advanceLoanApplication`'s own
 * comment for why the approved amount can come back lower than requested.
 */
export function useLoanEmiApplication(): LoanEmiApplicationState {
  const { dealId } = useParams<{ dealId: string }>();
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<LoanEmiApplicationStatus>('loading');
  const [view, setView] = useState<LoanApplicationView | null>(null);
  const [ratesStatus, setRatesStatus] = useState<RatesStatus>('idle');
  const [ratesTable, setRatesTable] = useState<FinancingPartnerRate[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const ratesAttempted = useRef(false);
  const defaultedAmount = useRef(false);

  const draftKey = `aiec.loanApplication.${dealId ?? 'unknown'}`;
  const wizard = useWizard<LoanDraft>(draftKey, INITIAL_LOAN_DRAFT, LOAN_STEPS);
  const { draft, update } = wizard;

  const load = useCallback(async () => {
    if (!dealId || !user) return;
    try {
      const result = await repository.getLoanApplicationView(dealId, user.id);
      if (!result) {
        setStatus('not_found');
        return;
      }
      setView(result);
      setStatus('ready');
    } catch {
      setStatus((cur) => (cur === 'ready' ? cur : 'error'));
    }
  }, [dealId, user, repository]);

  useEffect(() => {
    void load();
  }, [load]);

  // Default the requested amount to the deal's live remaining balance the
  // first time it's known — never re-forced after that, so a customer's
  // own edit sticks even if the view reloads.
  useEffect(() => {
    if (view && !defaultedAmount.current && draft.requestedAmount === '') {
      defaultedAmount.current = true;
      update({ requestedAmount: view.remainingBalance });
    }
  }, [view, draft.requestedAmount, update]);

  const fetchRates = useCallback(() => {
    setRatesStatus('loading');
    void repository
      .getFinancingPartnerRates(ratesAttempted.current)
      .then((rates) => {
        setRatesTable(rates);
        setRatesStatus('loaded');
      })
      .catch(() => {
        ratesAttempted.current = true;
        setRatesStatus('unavailable');
      });
  }, [repository]);

  // Auto-attempt once on entering the details step.
  useEffect(() => {
    if (wizard.step.id === 'details' && ratesStatus === 'idle') fetchRates();
  }, [wizard.step.id, ratesStatus, fetchRates]);

  // Recompute EMI/total live against the loaded rate whenever amount or
  // tenure change — the rate itself only changes on a fresh fetch.
  useEffect(() => {
    if (!ratesTable || draft.tenureMonths === '' || !(Number(draft.requestedAmount) > 0)) return;
    const rate = ratesTable.find((r) => r.tenureMonths === draft.tenureMonths);
    if (!rate) return;
    const emi = computeEmi(Number(draft.requestedAmount), rate.annualRatePercent, Number(draft.tenureMonths));
    if (rate.annualRatePercent === draft.interestRatePercent && emi === draft.emiAmount) return;
    update({ interestRatePercent: rate.annualRatePercent, emiAmount: emi, totalRepayment: emi * Number(draft.tenureMonths) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratesTable, draft.tenureMonths, draft.requestedAmount]);

  const precheckResult = draft.incomeRange !== '' && draft.tenurePreferenceMonths !== '' ? evaluatePrecheck(draft.incomeRange, draft.tenurePreferenceMonths) : null;

  // Default the final tenure from the precheck's preference the moment the
  // details step is reached, if the customer hasn't picked one yet.
  useEffect(() => {
    if (wizard.step.id === 'details' && draft.tenureMonths === '' && draft.tenurePreferenceMonths !== '') {
      update({ tenureMonths: draft.tenurePreferenceMonths });
    }
  }, [wizard.step.id, draft.tenureMonths, draft.tenurePreferenceMonths, update]);

  const submit = useCallback(async () => {
    if (!dealId || !user || !wizard.canSubmit || !precheckResult) return false;
    setSubmitting(true);
    try {
      await repository.submitLoanApplication(dealId, user.id, {
        precheck: { incomeRange: draft.incomeRange as Exclude<LoanDraft['incomeRange'], ''>, tenurePreferenceMonths: Number(draft.tenurePreferenceMonths), ...precheckResult },
        requestedAmount: Number(draft.requestedAmount),
        tenureMonths: Number(draft.tenureMonths),
        interestRatePercent: draft.interestRatePercent!,
        emiAmount: draft.emiAmount!,
        totalRepayment: draft.totalRepayment!,
      });
      wizard.discard();
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [dealId, user, repository, wizard, draft, precheckResult, load]);

  // Advance the active application one status every ~2.6s until disbursed.
  useEffect(() => {
    const app = view?.activeApplication;
    if (!app || app.status === 'disbursed') return undefined;
    const timer = setTimeout(() => {
      void repository.advanceLoanApplication(app.id).then(() => load());
    }, ADVANCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [view?.activeApplication?.id, view?.activeApplication?.status, repository, load]);

  return {
    status,
    view,
    wizard,
    precheckResult,
    ratesTable,
    ratesStatus,
    fetchRates,
    submitting,
    submit,
    reload: load,
  };
}
