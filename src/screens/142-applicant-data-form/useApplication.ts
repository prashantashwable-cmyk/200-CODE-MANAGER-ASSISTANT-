import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { applyLanguage } from '@/i18n';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { ApplicationBoardView, PartnerApplicationView } from '@/data/repository';
import type { ApplicationForm } from '@/data/types';
import { seedOnboardingDraft } from '@/features/onboarding/handoff';
import { EMPTY_FORM, identityForServer, sectionStates } from '@/features/recruitment/application';
import { APPLICATION_KEYS as K, POLL_MS, SAVE_DELAY_MS, draftKey, keyKey } from './application.types';
import type { ApplicationStatus } from './application.types';

/** The full Aadhaar number never leaves this phone: only its last four digits and whether the checksum passed. */
const forServer = (form: ApplicationForm): ApplicationForm => ({ ...form, identity: identityForServer(form.identity) });

export type SaveState = 'saved' | 'saving' | 'offline' | 'failed' | 'idle';
export interface ActionResult {
  ok: boolean;
  code?: string;
}
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');

interface StoredDraft {
  form: ApplicationForm;
  savedAt: string;
}
function readDraft(id: string): StoredDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(id));
    return raw ? (JSON.parse(raw) as StoredDraft) : null;
  } catch {
    return null;
  }
}

export type ApplicationState = ReturnType<typeof useApplication>;

/**
 * Screen 142. The applicant's full details: personal, experience in structured fields and their own words, the areas they can work in,
 * availability, references and identity documents. The form is the one partner-application record the rest of the journey adds to: it saves as
 * the person types (and is kept on the phone when there is no signal), and a reference who cannot be reached never blocks anything. The same
 * screen gives Admin the board of applications and each one's detail, where they record what they found when they called a reference.
 */
export function useApplication() {
  const repository = useData();
  const { user } = useSession();
  const { applicationId } = useParams();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { push } = useToast();
  const admin = pathname.startsWith('/applications');
  const key = useMemo(() => {
    if (admin || !applicationId) return '';
    const fromLink = new URLSearchParams(search).get('k');
    if (fromLink) {
      try {
        localStorage.setItem(keyKey(applicationId), fromLink);
      } catch {
        // The link still carries it.
      }
      return fromLink;
    }
    try {
      return localStorage.getItem(keyKey(applicationId)) ?? '';
    } catch {
      return '';
    }
  }, [admin, applicationId, search]);

  const [view, setView] = useState<PartnerApplicationView | null>(null);
  const [board, setBoard] = useState<ApplicationBoardView | null>(null);
  const [status, setStatus] = useState<ApplicationStatus>('loading');
  const [form, setForm] = useState<ApplicationForm>(EMPTY_FORM);
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [restored, setRestored] = useState(false);
  const [busy, setBusy] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const loadedFor = useRef('');

  const load = useCallback(async () => {
    try {
      if (admin) {
        if (!user) return;
        if (applicationId) setView(await repository.getPartnerApplication(applicationId, { userId: user.id }));
        else setBoard(await repository.listPartnerApplications(user.id));
      } else {
        if (!applicationId || !key) return setStatus('invalid');
        const v = await repository.getPartnerApplication(applicationId, { key });
        setView(v);
        // The form is taken from the record once, or from the phone when what is kept there is newer (a change made without signal).
        if (loadedFor.current !== applicationId) {
          loadedFor.current = applicationId;
          const kept = readDraft(applicationId);
          if (kept && kept.savedAt > v.updatedAt) {
            setForm(kept.form);
            setDirty(true);
            setRestored(true);
          } else setForm(v.form);
        }
      }
      setStatus('ready');
    } catch (e) {
      const c = codeOf(e);
      if (c === 'invalid_link') setStatus('invalid');
      else if (c === 'not_found' || c === 'forbidden') setStatus('not_found');
      else setStatus((s) => (s === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, admin, applicationId, key]);

  useEffect(() => {
    setStatus('loading');
    void load();
    const poll = window.setInterval(() => (admin ? void load() : undefined), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load, admin]);

  const locked = !!view?.locked;
  const states = useMemo(() => (view && !admin ? sectionStates(view.role, form) : []), [view, form, admin]);

  // Every change is kept on the phone at once and sent a moment after the person stops typing.
  useEffect(() => {
    if (admin || !dirty || !applicationId || locked) return;
    try {
      localStorage.setItem(draftKey(applicationId), JSON.stringify({ form, savedAt: new Date().toISOString() } satisfies StoredDraft));
    } catch {
      // Not kept.
    }
    if (!navigator.onLine) return setSaveState('offline');
    setSaveState('saving');
    const timer = window.setTimeout(async () => {
      try {
        const v = await repository.savePartnerApplication(applicationId, key, forServer(form));
        setView(v);
        setDirty(false);
        setSaveState('saved');
        try {
          localStorage.removeItem(draftKey(applicationId));
        } catch {
          // Nothing to clear.
        }
      } catch (e) {
        setSaveState(codeOf(e) === 'locked' ? 'idle' : 'failed');
      }
    }, SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [form, dirty, admin, applicationId, key, locked, repository]);

  // Coming back online sends what was kept on the phone.
  useEffect(() => {
    const on = () => dirty && setForm((f) => ({ ...f }));
    window.addEventListener('online', on);
    return () => window.removeEventListener('online', on);
  }, [dirty]);

  const update = <S extends keyof ApplicationForm>(section: S, patch: Partial<ApplicationForm[S]> | ApplicationForm[S]) => {
    setRestored(false);
    setDirty(true);
    setForm((f) => ({ ...f, [section]: Array.isArray(patch) || typeof patch !== 'object' || patch === null ? patch : { ...(f[section] as object), ...(patch as object) } }));
  };

  return {
    admin,
    applicationId: applicationId ?? null,
    status,
    view,
    board,
    form,
    states,
    dirty,
    saveState,
    restored,
    busy,
    locked,
    justSubmitted,
    reload: () => {
      setStatus('loading');
      void load();
    },
    update,
    setLanguage: applyLanguage,
    goto: (path: string, replace = false) => navigate(path, { replace }),
    submit: async (): Promise<ActionResult> => {
      if (!applicationId) return { ok: false, code: 'generic' };
      if (!navigator.onLine) return { ok: false, code: 'offline' };
      setBusy(true);
      try {
        await repository.savePartnerApplication(applicationId, key, forServer(form));
        const v = await repository.submitPartnerApplication(applicationId, key);
        setView(v);
        setDirty(false);
        setSaveState('saved');
        setJustSubmitted(true);
        try {
          localStorage.removeItem(draftKey(applicationId));
        } catch {
          // Nothing to clear.
        }
        // What was given here is what the onboarding wizard asks for too: it opens already filled in.
        const f = v.form;
        if (v.role === 'surveyor') seedOnboardingDraft('surveyor', { name: f.personal.fullName, phone: f.personal.phone }, { city: f.personal.city, aadhaarNumber: f.identity.aadhaarNumber, aadhaarDoc: f.identity.aadhaarDoc, panNumber: f.identity.panNumber, panDoc: f.identity.panDoc, preferredZoneIds: f.territory.zoneIds, twoWheelerOwned: f.territory.ownTransport });
        else if (v.role === 'technician') seedOnboardingDraft('technician', { name: f.personal.fullName, phone: f.personal.phone }, { city: f.personal.city });
        else seedOnboardingDraft('supplier', { name: f.personal.fullName, phone: f.personal.phone }, { gstin: f.identity.gstin, city: f.personal.city });
        return { ok: true };
      } catch (e) {
        return { ok: false, code: codeOf(e) };
      } finally {
        setBusy(false);
      }
    },
    editAgain: () => setJustSubmitted(false),
    recordOutcome: async (referenceId: string, outcome: 'verified' | 'unreachable' | 'declined', note: string): Promise<ActionResult> => {
      if (!user || !applicationId) return { ok: false, code: 'generic' };
      setBusy(true);
      try {
        setView(await repository.recordReferenceOutcome(applicationId, referenceId, { status: outcome, ...(note.trim() ? { note } : {}) }, user.id));
        push(t(K.admin.outcome.saved), 'success');
        return { ok: true };
      } catch (e) {
        return { ok: false, code: codeOf(e) };
      } finally {
        setBusy(false);
      }
    },
  };
}
