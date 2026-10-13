/** Screen 076 — E-Signature Capture. Types and translation keys only. */

export type EsignatureCaptureStatus = 'loading' | 'ready' | 'error';

/** Matches screen 003's own login OTP exactly — a demo stand-in with no
 *  real SMS gateway, checked client-side only. */
export const DEMO_OTP = '123456';
export const OTP_LENGTH = 6;
export const WRONG_ATTEMPTS_BEFORE_FALLBACK = 3;

export type OtpStepPhase = 'entering' | 'wrong' | 'verified';

export type SigningMethodTab = 'drawn' | 'typed';

export const ESIGNATURE_CAPTURE_KEYS = {
  title: 'esignatureCapture.title',
  loading: 'esignatureCapture.loading',
  error: { title: 'esignatureCapture.error.title', body: 'esignatureCapture.error.body' },

  notReady: {
    title: 'esignatureCapture.notReady.title',
    body: 'esignatureCapture.notReady.body',
    goToContract: 'esignatureCapture.notReady.goToContract',
  },

  status: {
    unsigned: 'esignatureCapture.status.unsigned',
    customer_signed: 'esignatureCapture.status.customer_signed',
    fully_signed: 'esignatureCapture.status.fully_signed',
  },

  otp: {
    heading: 'esignatureCapture.otp.heading',
    body: 'esignatureCapture.otp.body',
    label: 'esignatureCapture.otp.label',
    wrongCode: 'esignatureCapture.otp.wrongCode',
    verify: 'esignatureCapture.otp.verify',
    fallbackOffer: 'esignatureCapture.otp.fallbackOffer',
    fallbackButton: 'esignatureCapture.otp.fallbackButton',
    verified: 'esignatureCapture.otp.verified',
    verifiedManually: 'esignatureCapture.otp.verifiedManually',
    demoHint: 'esignatureCapture.otp.demoHint',
  },

  signing: {
    heading: 'esignatureCapture.signing.heading',
    tabDrawn: 'esignatureCapture.signing.tabDrawn',
    tabTyped: 'esignatureCapture.signing.tabTyped',
    drawHint: 'esignatureCapture.signing.drawHint',
    clear: 'esignatureCapture.signing.clear',
    typedLabel: 'esignatureCapture.signing.typedLabel',
    typedPlaceholder: 'esignatureCapture.signing.typedPlaceholder',
    consentLabel: 'esignatureCapture.signing.consentLabel',
    submit: 'esignatureCapture.signing.submit',
  },

  progress: {
    customerStep: 'esignatureCapture.progress.customerStep',
    aiecStep: 'esignatureCapture.progress.aiecStep',
  },

  pendingCountersign: {
    heading: 'esignatureCapture.pendingCountersign.heading',
    body: 'esignatureCapture.pendingCountersign.body',
    signedBy: 'esignatureCapture.pendingCountersign.signedBy',
    countersignButton: 'esignatureCapture.pendingCountersign.countersignButton',
  },

  fullySigned: {
    heading: 'esignatureCapture.fullySigned.heading',
    body: 'esignatureCapture.fullySigned.body',
    customerSignedLine: 'esignatureCapture.fullySigned.customerSignedLine',
    countersignedLine: 'esignatureCapture.fullySigned.countersignedLine',
    viewClosure: 'esignatureCapture.fullySigned.viewClosure',
  },

  toast: {
    signed: 'esignatureCapture.toast.signed',
    countersigned: 'esignatureCapture.toast.countersigned',
    error: 'esignatureCapture.toast.error',
  },
} as const;
