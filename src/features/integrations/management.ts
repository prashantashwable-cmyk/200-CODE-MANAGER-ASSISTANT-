/**
 * Integration management (189): the one place each external connection's credentials, mode and rotation are governed. Pure: the screen and the repository read the same rules for what a credential
 * must look like, how it is masked, when it is due for rotation and which credential a request is allowed to use. Every number is a placeholder flagged on the screen.
 */
export type IntegrationMode = 'sandbox' | 'live';
export type AppEnvironment = 'demo' | 'production';

/** The connections whose credentials Admin governs here (186 reads their health). Carrier feeds belong to each carrier, and the engine is AIEC's own. */
export const MANAGED_IDS = ['payment_gateway', 'whatsapp', 'sms', 'maps', 'financing_partner', 'bank_feed', 'payout_rail', 'id_verification'] as const;
export const isManaged = (id: string): boolean => (MANAGED_IDS as readonly string[]).includes(id);

/** A credential is rotated at least this often, and for this long both the old and new are accepted while services pick the new one up (placeholders). */
export const ROTATE_EVERY_DAYS = 90;
export const ROTATION_MS = 2 * 60_000;
export const SECRET_MIN = 16;
export const SECRET_MAX = 200;
export const KEY_ID_MAX = 80;
export const REASON_MIN = 15;

/** Only the end of a secret is ever shown, and only enough to tell two apart. */
export const last4Of = (secret: string): string => secret.slice(-4);
export const maskOf = (last4: string | null, length: number): string => (last4 ? `${'•'.repeat(Math.min(12, Math.max(4, length - 4)))}${last4}` : '');

export type CredentialProblem = 'secret_short' | 'secret_long' | 'secret_spaces' | 'secret_weak' | 'secret_same' | 'key_id_long' | 'reason_short';
/** What a secret must be before it is accepted: long enough, no spaces, not a single repeated character, and not what it replaces. */
export function credentialProblem(input: { secret: string; keyId: string; current: string | null }): CredentialProblem | null {
  const s = input.secret;
  if (/\s/.test(s)) return 'secret_spaces';
  if (s.length < SECRET_MIN) return 'secret_short';
  if (s.length > SECRET_MAX) return 'secret_long';
  if (new Set(s).size < 6) return 'secret_weak';
  if (input.current !== null && s === input.current) return 'secret_same';
  if (input.keyId.length > KEY_ID_MAX) return 'key_id_long';
  return null;
}

export const ageDaysOf = (rotatedAt: string, now: number): number => Math.max(0, Math.floor((now - Date.parse(rotatedAt)) / 86_400_000));
export const dueForRotation = (rotatedAt: string, now: number): boolean => ageDaysOf(rotatedAt, now) >= ROTATE_EVERY_DAYS;
export const rotationDueAt = (rotatedAt: string): string => new Date(Date.parse(rotatedAt) + ROTATE_EVERY_DAYS * 86_400_000).toISOString();

/**
 * Which credential a request may use. Demo traffic is always served by the sandbox credential, whatever an integration is set to, and can never be handed the live one: this is the single rule the
 * rest of the app asks (and the isolation check proves), so demo behaviour is separated by configuration and not only by the screens.
 */
export function endpointFor(input: { demoUser: boolean; configuredMode: IntegrationMode }): { mode: IntegrationMode; slot: IntegrationMode } {
  const mode: IntegrationMode = input.demoUser ? 'sandbox' : input.configuredMode;
  return { mode, slot: mode };
}

export type ModeProblem = 'live_not_configured' | 'live_not_tested' | 'reason_short' | 'confirm_required' | 'rotating' | 'same_mode';
/** Going live needs a live credential, a connection that is working right now, a reason and a confirmation; going back to sandbox needs the reason and confirmation too. */
export function modeProblem(input: { to: IntegrationMode; from: IntegrationMode; liveConfigured: boolean; working: boolean; rotating: boolean; reason: string; confirmed: boolean }): ModeProblem | null {
  if (input.to === input.from) return 'same_mode';
  if (input.rotating) return 'rotating';
  if (input.reason.replace(/[^\p{L}]/gu, '').length < REASON_MIN) return 'reason_short';
  if (!input.confirmed) return 'confirm_required';
  if (input.to === 'live') {
    if (!input.liveConfigured) return 'live_not_configured';
    if (!input.working) return 'live_not_tested';
  }
  return null;
}

/** Real customers served by a test configuration: the serious mistake the screen exists to make impossible to miss. */
export const sandboxInProduction = (env: AppEnvironment, modes: { id: string; mode: IntegrationMode }[]): string[] => (env === 'production' ? modes.filter((m) => m.mode === 'sandbox').map((m) => m.id) : []);
