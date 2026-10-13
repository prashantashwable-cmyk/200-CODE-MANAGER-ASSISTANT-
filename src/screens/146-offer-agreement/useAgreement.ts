import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { applyLanguage } from '@/i18n';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { AgreementTemplatesView, OfferApplicantView, OfferBoardView, OfferDetailView } from '@/data/repository';
import type { AgreementTerms } from '@/data/types';
import { AGREEMENT_KEYS as K, POLL_MS, STAGE_FILTERS, TABS, boardPath, detailPath, keyKey } from './agreement.types';
import type { AgreementTab, StageFilter } from './agreement.types';

export interface ActionResult {
  ok: boolean;
  code?: string;
}
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');
type Items = { key: keyof AgreementTerms; value: number }[];

export type AgreementState = ReturnType<typeof useAgreement>;

/**
 * Screen 146. The formal partner agreement: generated from the role's versioned template, with Admin-approved custom terms where someone has
 * negotiated one, signed by the partner on their own link with an OTP-confirmed identity, and signing is what activates the account. A change to
 * the standard terms is a new version for agreements prepared from then on; nothing already signed is touched.
 */
export function useAgreement() {
  const repository = useData();
  const { user } = useSession();
  const { applicationId } = useParams();
  const { pathname, search } = useLocation();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { push } = useToast();
  const admin = pathname.startsWith('/offers');
  const tabParam = params.get('tab') as AgreementTab | null;
  const tab: AgreementTab = tabParam && (TABS as readonly string[]).includes(tabParam) ? tabParam : 'offers';
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

  const [board, setBoard] = useState<OfferBoardView | null>(null);
  const [detail, setDetail] = useState<OfferDetailView | null>(null);
  const [detailStatus, setDetailStatus] = useState<'idle' | 'loading' | 'error' | 'gone'>('idle');
  const [templates, setTemplates] = useState<AgreementTemplatesView | null>(null);
  const [mine, setMine] = useState<OfferApplicantView | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'invalid' | 'not_found'>('loading');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StageFilter>(() => { const f = params.get('stage') as StageFilter | null; return f && (STAGE_FILTERS as readonly string[]).includes(f) ? f : 'all'; });
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    try {
      if (admin) {
        if (!user) return;
        const b = await repository.getOfferBoard(user.id);
        if (alive.current) setBoard(b);
      } else {
        if (!applicationId || !key) return alive.current && setStatus('invalid');
        const v = await repository.getOfferForApplicant(applicationId, key);
        if (alive.current) setMine(v);
      }
      if (alive.current) setStatus('ready');
    } catch (e) {
      if (!alive.current) return;
      const c = codeOf(e);
      setStatus(c === 'invalid_link' ? 'invalid' : c === 'not_found' || c === 'not_approved' ? 'not_found' : (s) => (s === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, admin, applicationId, key]);

  const loadTemplates = useCallback(async () => {
    if (!admin || !user) return;
    try {
      const v = await repository.getAgreementTemplates(user.id);
      if (alive.current) setTemplates(v);
    } catch {
      // The tab shows its own loading state.
    }
  }, [repository, user, admin]);

  const loadDetail = useCallback(async () => {
    if (!admin || !user || !applicationId) return;
    try {
      const d = await repository.getOfferDetail(applicationId, user.id);
      if (alive.current) {
        setDetail(d);
        setDetailStatus('idle');
      }
    } catch (e) {
      if (alive.current) setDetailStatus(['not_found', 'not_approved'].includes(codeOf(e)) ? 'gone' : 'error');
    }
  }, [repository, user, admin, applicationId]);

  useEffect(() => {
    setStatus('loading');
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (admin && tab === 'terms') void loadTemplates();
  }, [admin, tab, loadTemplates]);

  useEffect(() => {
    setDetail(null);
    if (!admin || !applicationId) return setDetailStatus('idle');
    setDetailStatus('loading');
    void loadDetail();
  }, [admin, applicationId, loadDetail]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (board?.rows ?? []).filter((r) => (filter === 'all' || (filter === 'waiting' ? r.stage === 'interview_open' || r.stage === 'verifying' || r.stage === 'waitlisted' : r.stage === filter)) && (!q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)));
  }, [board, query, filter]);

  const act = useCallback(
    async <R,>(fn: (userId: string) => Promise<R>, done?: string, apply?: (r: R) => void): Promise<{ ok: true; value: R } | { ok: false; code: string }> => {
      if (!user) return { ok: false, code: 'generic' };
      setBusy(true);
      try {
        const value = await fn(user.id);
        if (alive.current && apply) apply(value);
        if (done) push(done, 'success');
        void load();
        return { ok: true, value };
      } catch (e) {
        void loadDetail();
        return { ok: false, code: codeOf(e) };
      } finally {
        if (alive.current) setBusy(false);
      }
    },
    [user, load, loadDetail, push],
  );
  const asDetail = (d: OfferDetailView) => {
    setDetail(d);
    setDetailStatus('idle');
  };
  const id = applicationId ?? '';
  const name = detail?.applicant.name ?? '';

  return {
    admin,
    status,
    board,
    shown,
    query,
    setQuery,
    filter,
    setFilter,
    tab,
    setTab: (next: AgreementTab) => setParams((p) => { const n = new URLSearchParams(p); if (next === 'offers') n.delete('tab'); else n.set('tab', next); return n; }, { replace: true }),
    applicationId,
    detail,
    detailStatus,
    templates,
    mine,
    busy,
    reload: () => {
      setStatus('loading');
      void load();
    },
    reloadDetail: loadDetail,
    open: (appId: string) => navigate(detailPath(appId)),
    close: () => navigate(boardPath),
    goto: (path: string) => navigate(path),
    setLanguage: applyLanguage,
    prepare: (input: { territoryZoneIds: string[]; overrideReason?: string }): Promise<ActionResult> => act((u) => repository.prepareOffer(id, input, u), undefined, asDetail),
    send: (): Promise<ActionResult> => act((u) => repository.sendOffer(id, u), t(K.detail.send) + ' ✓', asDetail),
    withdraw: (reason: string): Promise<ActionResult> => act((u) => repository.withdrawOffer(id, reason, u), undefined, asDetail),
    addendum: (items: Items, reason: string): Promise<ActionResult> => act((u) => repository.setOfferAddendum(id, { items, reason }, u), undefined, asDetail),
    respond: (requestId: string, input: { outcome: 'approved' | 'declined'; note: string; items?: Items }): Promise<ActionResult> => act((u) => repository.respondTermRequest(id, requestId, input, u), t(K.detail.answered), asDetail),
    step: (stepKey: string, done: boolean): Promise<ActionResult> => act((u) => repository.markActivationStep(id, stepKey, done, u), undefined, asDetail),
    publish: (role: 'surveyor' | 'technician' | 'supplier', input: { terms: AgreementTerms; effectiveFrom: string; changeNote: string }): Promise<ActionResult> => act((u) => repository.publishAgreementTemplate(role, input, u), t(K.templates.published), (v) => setTemplates(v)),
    askChange: async (text: string): Promise<ActionResult> => {
      if (!applicationId) return { ok: false, code: 'generic' };
      setBusy(true);
      try {
        setMine(await repository.requestTermChange(applicationId, key, text));
        push(t(K.applicant.askSent), 'success');
        return { ok: true };
      } catch (e) {
        void load();
        return { ok: false, code: codeOf(e) };
      } finally {
        setBusy(false);
      }
    },
    sign: async (input: { method: 'drawn' | 'typed'; data: string; signerName: string; language: 'en' | 'hi' | 'mr'; consentGiven: boolean; otpVerified: boolean; viaFallback: boolean }): Promise<ActionResult> => {
      if (!applicationId) return { ok: false, code: 'generic' };
      if (!navigator.onLine) return { ok: false, code: 'offline' };
      setBusy(true);
      try {
        setMine(await repository.signPartnerAgreement(applicationId, key, input));
        return { ok: true };
      } catch (e) {
        void load();
        return { ok: false, code: codeOf(e) };
      } finally {
        setBusy(false);
      }
    },
  };
}
