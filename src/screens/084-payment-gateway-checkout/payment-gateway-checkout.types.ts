/** Screen 084 — Online Payment Gateway Checkout Screen. Types and translation keys only. */

import type { PaymentGatewayMethod } from '@/data/repository';

export type PaymentGatewayCheckoutStatus = 'loading' | 'ready' | 'not_found' | 'error';

/** What the checkout card is currently showing. `blocked` covers both the
 *  "already paid" edge case and any other terminal state that isn't a
 *  fresh, payable stage. */
export type CheckoutStage = 'idle' | 'processing' | 'awaiting_confirmation' | 'paid' | 'failed' | 'blocked';

export const GATEWAY_METHODS: PaymentGatewayMethod[] = ['upi', 'card', 'netbanking'];

export const PAYMENT_GATEWAY_CHECKOUT_KEYS = {
  title: 'paymentGatewayCheckout.title',
  loading: 'paymentGatewayCheckout.loading',
  notFound: { title: 'paymentGatewayCheckout.notFound.title', body: 'paymentGatewayCheckout.notFound.body' },
  error: { title: 'paymentGatewayCheckout.error.title', body: 'paymentGatewayCheckout.error.body' },

  summary: {
    heading: 'paymentGatewayCheckout.summary.heading',
    site: 'paymentGatewayCheckout.summary.site',
    deal: 'paymentGatewayCheckout.summary.deal',
    stage: 'paymentGatewayCheckout.summary.stage',
    amountDue: 'paymentGatewayCheckout.summary.amountDue',
    partialNote: 'paymentGatewayCheckout.summary.partialNote',
  },

  method: {
    heading: 'paymentGatewayCheckout.method.heading',
    upi: 'paymentGatewayCheckout.method.upi',
    card: 'paymentGatewayCheckout.method.card',
    netbanking: 'paymentGatewayCheckout.method.netbanking',
  },

  actionBar: {
    pay: 'paymentGatewayCheckout.actionBar.pay',
    retry: 'paymentGatewayCheckout.actionBar.retry',
  },

  processing: {
    title: 'paymentGatewayCheckout.processing.title',
    body: 'paymentGatewayCheckout.processing.body',
  },

  awaitingConfirmation: {
    title: 'paymentGatewayCheckout.awaitingConfirmation.title',
    body: 'paymentGatewayCheckout.awaitingConfirmation.body',
    checkingNote: 'paymentGatewayCheckout.awaitingConfirmation.checkingNote',
  },

  failed: {
    title: 'paymentGatewayCheckout.failed.title',
    body: 'paymentGatewayCheckout.failed.body',
  },

  alreadyPaid: {
    title: 'paymentGatewayCheckout.alreadyPaid.title',
    body: 'paymentGatewayCheckout.alreadyPaid.body',
  },

  receipt: {
    heading: 'paymentGatewayCheckout.receipt.heading',
    amountPaid: 'paymentGatewayCheckout.receipt.amountPaid',
    method: 'paymentGatewayCheckout.receipt.method',
    reference: 'paymentGatewayCheckout.receipt.reference',
    paidAt: 'paymentGatewayCheckout.receipt.paidAt',
    done: 'paymentGatewayCheckout.receipt.done',
  },
} as const;
