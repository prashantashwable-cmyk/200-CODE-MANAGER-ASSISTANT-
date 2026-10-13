import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { applyLanguage } from '@/i18n';
import { useData } from '@/data/DataProvider';
import type { Language, Role, ThemePreference, User } from '@/data/types';
import { deviceLabelOf } from '@/features/security/security';
import { readAuthSessionId, readSecondFactorAt, writeAuthSessionId, writeSecondFactorAt } from '@/features/security/sessionKeys';
import { serverConfigured } from '@/data/supabase/client';
import { myServerProfile, signOutServer } from '@/features/auth/serverAuth';
import type { ServerProfile } from '@/data/types';

/**
 * Who is signed in, in what mode, in what language, in what theme.
 *
 * Demo Mode is a first-class session kind, not a flag bolted onto a real
 * session: entering demo replaces the whole session, and leaving demo clears it
 * completely. That is what stops demo state (selected role, sample leads)
 * leaking into a real login mid-session, which the login screen spec calls out
 * explicitly.
 */

export type SessionKind = 'anonymous' | 'demo' | 'authenticated';

interface SessionState {
  kind: SessionKind;
  user: User | null;
  role: Role | null;
  isDemo: boolean;
  language: Language;
  theme: ThemePreference;
  /**
   * True while a stored session is being rehydrated. Route guards MUST wait for
   * this rather than treating it as anonymous — otherwise every page refresh
   * and every deep link bounces a signed-in user back to the login screen.
   */
  restoring: boolean;
  /** True when this session was signed in through the server (S1), not the in-memory build. */
  serverSession: boolean;
}

interface SessionContextValue extends SessionState {
  /** Loads the seeded sandbox account for a role. No credentials involved. */
  enterDemo: (role: Role) => Promise<void>;
  /** Completes a real sign-in once OTP has been verified. */
  signInAs: (userId: string) => Promise<void>;
  /** S1: completes a sign-in the server verified (Supabase phone code). The server's profile decides the role. */
  signInWithServer: (profile: ServerProfile) => Promise<void>;
  signOut: () => void;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: ThemePreference) => void;
}

const STORAGE_KEY_THEME = 'aiec.theme';
const STORAGE_KEY_SESSION = 'aiec.session';

const DEMO_USER_BY_ROLE: Record<Role, string> = {
  admin: 'u-admin-1',
  surveyor: 'u-srv-1',
  technician: 'u-tech-1',
  customer: 'u-cust-1',
  supplier: 'u-sup-1',
};

const VALID_THEMES: ThemePreference[] = [
  'light',
  'snow',
  'dark',
  'orbital',
  'lithium',
  'pure',
  'system',
];

/** What the browser can say about itself. Its address and place are not known here: a real backend records both on the server. */
const sessionContext = () => { const d = deviceLabelOf(typeof navigator === 'undefined' ? '' : navigator.userAgent); return { deviceLabel: d.label, platform: d.platform }; };

function readStoredTheme(): ThemePreference {
  const saved = localStorage.getItem(STORAGE_KEY_THEME) as ThemePreference | null;
  return saved && VALID_THEMES.includes(saved) ? saved : 'light';
}

/** The single place the theme reaches the DOM. */
function applyTheme(theme: ThemePreference) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY_THEME, theme);
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const repository = useData();
  const [state, setState] = useState<SessionState>(() => ({
    kind: 'anonymous',
    user: null,
    role: null,
    isDemo: false,
    language: (localStorage.getItem('aiec.language') as Language) ?? 'en',
    theme: readStoredTheme(),
    // Start in the restoring state only if there is actually something stored.
    restoring: sessionStorage.getItem(STORAGE_KEY_SESSION) !== null,
    serverSession: false,
  }));

  // Apply the stored theme before first paint of the shell.
  useEffect(() => {
    applyTheme(state.theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore a session across reloads so a demo click-through survives F5.
  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY_SESSION);
    if (!raw) {
      setState((s) => ({ ...s, restoring: false }));
      return;
    }
    try {
      const parsed = JSON.parse(raw) as { kind: SessionKind; userId: string; server?: boolean };
      if (parsed.kind === 'anonymous') {
        setState((s) => ({ ...s, restoring: false }));
        return;
      }
      // A server sign-in survives a reload on the server's side; the in-memory workspace starts fresh, so the person is taken
      // into it again from what the server says now (their role may have changed, or they may no longer be allowed in).
      const restored: Promise<User | null> = parsed.server
        ? serverConfigured
          ? myServerProfile().then((p) => (p && p.status === 'active' && p.role ? repository.adoptServerProfile(p) : null))
          : Promise.resolve(null)
        : repository.getUser(parsed.userId);
      void restored
        .then((user) => {
          if (!user) {
            if (parsed.server && serverConfigured) void signOutServer().catch(() => undefined);
            // The stored id no longer resolves — clear it and fail safely to
            // anonymous rather than leaving the app stuck restoring forever.
            sessionStorage.removeItem(STORAGE_KEY_SESSION);
            setState((s) => ({ ...s, restoring: false }));
            return;
          }
          applyLanguage(user.preferredLanguage);
          // A recorded session is taken up again after a reload; demo sessions are never recorded (they have no real account to protect).
          if (parsed.kind === 'authenticated') {
            const known = readAuthSessionId();
            const ctx = { ...sessionContext(), secondFactorAt: readSecondFactorAt() ?? undefined };
            void (known ? repository.resumeAuthSession(user.id, known, ctx) : repository.openAuthSession(user.id, ctx)).then((r) => writeAuthSessionId(r.sessionId)).catch(() => undefined);
          }
          setState((s) => ({
            ...s,
            kind: parsed.kind,
            user,
            role: user.role,
            isDemo: parsed.kind === 'demo',
            language: user.preferredLanguage ?? s.language,
            restoring: false,
            serverSession: Boolean(parsed.server),
          }));
        })
        .catch(() => setState((s) => ({ ...s, restoring: false })));
    } catch {
      sessionStorage.removeItem(STORAGE_KEY_SESSION);
      setState((s) => ({ ...s, restoring: false }));
    }
  }, [repository]);

  const adopt = useCallback((user: User, kind: SessionKind, server = false) => {
    // A real sign-in is a recorded session Admin can see and end (195); a demo one is not.
    writeSecondFactorAt(null);
    if (kind === 'authenticated') void repository.openAuthSession(user.id, sessionContext()).then((r) => writeAuthSessionId(r.sessionId)).catch(() => writeAuthSessionId(null));
    else writeAuthSessionId(null);
    setState((s) => ({
      ...s,
      kind,
      user,
      role: user.role,
      isDemo: kind === 'demo',
      language: user.preferredLanguage ?? s.language,
      theme: user.themePreference ?? s.theme,
      restoring: false,
      serverSession: server,
    }));
    applyLanguage(user.preferredLanguage);
    applyTheme(user.themePreference);
    sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify({ kind, userId: user.id, server }));
  }, [repository]);

  const enterDemo = useCallback(
    async (role: Role) => {
      const user = await repository.getUser(DEMO_USER_BY_ROLE[role]);
      if (!user) throw new Error(`No seeded demo account for role ${role}`);
      adopt(user, 'demo');
    },
    [repository, adopt],
  );

  const signInAs = useCallback(
    async (userId: string) => {
      const user = await repository.getUser(userId);
      if (!user) throw new Error('unknown_user');
      adopt(user, 'authenticated');
    },
    [repository, adopt],
  );

  const signInWithServer = useCallback(
    async (profile: ServerProfile) => {
      const user = await repository.adoptServerProfile(profile);
      adopt(user, 'authenticated', true);
    },
    [repository, adopt],
  );

  const signOut = useCallback(() => {
    if (serverConfigured) void signOutServer().catch(() => undefined);
    // Full teardown — nothing from the previous session carries over.
    const recorded = readAuthSessionId();
    if (recorded) void repository.endAuthSession(recorded).catch(() => undefined);
    writeAuthSessionId(null);
    writeSecondFactorAt(null);
    sessionStorage.removeItem(STORAGE_KEY_SESSION);
    setState((s) => ({
      kind: 'anonymous',
      user: null,
      role: null,
      isDemo: false,
      language: s.language,
      theme: s.theme,
      restoring: false,
      serverSession: false,
    }));
  }, [repository]);

  const setLanguage = useCallback(
    (lang: Language) => {
      applyLanguage(lang);
      setState((s) => ({ ...s, language: lang }));
      if (state.user) void repository.updateUser(state.user.id, { preferredLanguage: lang });
    },
    [repository, state.user],
  );

  const setTheme = useCallback(
    (theme: ThemePreference) => {
      applyTheme(theme);
      setState((s) => ({ ...s, theme }));
      if (state.user) void repository.updateUser(state.user.id, { themePreference: theme });
    },
    [repository, state.user],
  );

  const value = useMemo<SessionContextValue>(
    () => ({ ...state, enterDemo, signInAs, signInWithServer, signOut, setLanguage, setTheme }),
    [state, enterDemo, signInAs, signInWithServer, signOut, setLanguage, setTheme],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
