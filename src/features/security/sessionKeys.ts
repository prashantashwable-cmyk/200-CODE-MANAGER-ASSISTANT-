/** Where the browser remembers which recorded session (195) it is: the sign-in gate, the session provider and the reset flow all read these. */
export const AUTH_SESSION_KEY = 'aiec.authSession';
/** When this browser's session last passed the second step: kept so a page reload does not ask again. */
export const AUTH_2FA_KEY = 'aiec.authSession2fa';
export const SESSION_POLL_MS = 15_000;

export const readAuthSessionId = (): string | null => { try { return sessionStorage.getItem(AUTH_SESSION_KEY); } catch { return null; } };
export const writeAuthSessionId = (id: string | null): void => { try { if (id) sessionStorage.setItem(AUTH_SESSION_KEY, id); else sessionStorage.removeItem(AUTH_SESSION_KEY); } catch { /* storage may be unavailable: the gate then simply has nothing to check */ } };
export const readSecondFactorAt = (): string | null => { try { return sessionStorage.getItem(AUTH_2FA_KEY); } catch { return null; } };
export const writeSecondFactorAt = (at: string | null): void => { try { if (at) sessionStorage.setItem(AUTH_2FA_KEY, at); else sessionStorage.removeItem(AUTH_2FA_KEY); } catch { /* as above */ } };
