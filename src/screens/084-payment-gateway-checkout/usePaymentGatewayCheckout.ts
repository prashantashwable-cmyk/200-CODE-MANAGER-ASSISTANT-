import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { PaymentGatewayMethod, PaymentCheckoutView } from '@/data/repository';
import type { CheckoutStage, PaymentGatewayCheckoutStatus } from './payment-gateway-checkout.types';

const RECONCILE_DELAY_MS = 2600;

interface PaymentGatewayCheckoutState {
  status: PaymentGatewayCheckoutStatus;
  view: PaymentCheckoutView | null;
  stage: CheckoutStage;
  method: PaymentGatewayMethod;
  setMethod: (m: PaymentGatewayMethod) => void;
  paying: boolean;
  pay: () => Promise<void>;
  reload: () => Promise<void>;
}

/**
 * One payment stage's checkout, scoped to the signed-in customer. The
 * charged amount is never taken from local state — every attempt re-reads
 * the live remaining balance server-side, so nothing here could ever send
 * a different amount than what's actually owed.
 *
 * `card`'s first attempt always fails (a deterministic stand-in for a bank
 * timeout, tracked via `cardRetried` so the very next attempt on the same
 * payment succeeds) and `netbanking` always goes through a real `'pending'`
 * state resolved a few seconds later by `reconcilePaymentGatewayStatus` —
 * standing in for the confirmation webhook this demo has no server to
 * receive, the same honest gap 083's "no cron" run-now button discloses.
 *
 * `stage: 'blocked'` (found already paid on load, e.g. via bank transfer
 * logged elsewhere) is deliberately kept distinct from `stage: 'paid'`
 * (just settled by this screen, live or via the reconciliation timer) —
 * they read the same underlying `payment.status`, but only one of them is
 * this visit's own receipt to show.
 */
export function usePaymentGatewayCheckout(): PaymentGatewayCheckoutState {
  const { paymentId } = useParams<{ paymentId: string }>();
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<PaymentGatewayCheckoutStatus>('loading');
  const [view, setView] = useState<PaymentCheckoutView | null>(null);
  const [stage, setStage] = useState<CheckoutStage>('idle');
  const [method, setMethod] = useState<PaymentGatewayMethod>('upi');
  const [paying, setPaying] = useState(false);
  const cardRetried = useRef(false);
  const reconcileTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleReconcile = useCallback(
    (id: string) => {
      if (reconcileTimer.current) return;
      reconcileTimer.current = setTimeout(() => {
        reconcileTimer.current = null;
        void repository
          .reconcilePaymentGatewayStatus(id)
          .then((payment) => {
            setView((v) => (v ? { ...v, payment, amountDue: 0 } : v));
            setStage('paid');
          })
          .catch(() => {});
      }, RECONCILE_DELAY_MS);
    },
    [repository],
  );

  const load = useCallback(async () => {
    if (!paymentId || !user) return;
    try {
      const result = await repository.getPaymentCheckoutView(paymentId, user.id);
      if (!result) {
        setStatus('not_found');
        return;
      }
      setView(result);
      setStatus('ready');
      if (result.payment.status === 'paid') {
        setStage('blocked');
      } else if (result.payment.status === 'pending') {
        setStage('awaiting_confirmation');
        scheduleReconcile(paymentId);
      } else {
        setStage('idle');
      }
    } catch {
      setStatus((cur) => (cur === 'ready' ? cur : 'error'));
    }
  }, [paymentId, user, repository, scheduleReconcile]);

  useEffect(() => {
    void load();
    return () => {
      if (reconcileTimer.current) clearTimeout(reconcileTimer.current);
    };
  }, [load]);

  const pay = useCallback(async () => {
    if (!paymentId || !user) return;
    setPaying(true);
    setStage('processing');
    try {
      const result = await repository.attemptPaymentGatewayCheckout(paymentId, user.id, method, method === 'card' && cardRetried.current);
      if (result.outcome === 'paid') {
        setView((v) => (v ? { ...v, payment: result.payment, amountDue: 0 } : v));
        setStage('paid');
      } else if (result.outcome === 'processing') {
        setView((v) => (v ? { ...v, payment: result.payment } : v));
        setStage('awaiting_confirmation');
        scheduleReconcile(paymentId);
      } else {
        cardRetried.current = true;
        setStage('failed');
      }
    } catch {
      await load();
    } finally {
      setPaying(false);
    }
  }, [paymentId, user, repository, method, scheduleReconcile, load]);

  return { status, view, stage, method, setMethod, paying, pay, reload: load };
}
