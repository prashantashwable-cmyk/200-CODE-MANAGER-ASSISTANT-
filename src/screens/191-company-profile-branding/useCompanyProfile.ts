import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { CompanyProfilePreview, CompanyProfileVersionView, CompanyProfileView } from '@/data/repository';
import type { BrandDraft } from '@/features/brand/brand';
import { DEFAULT_TOKENS, LOGO_MAX_BYTES, LOGO_TYPES, changesOf, dayStart } from '@/features/brand/brand';
import { BRAND_CHANGED } from '@/features/brand/BrandProvider';
import { DRAFT_PREFIX } from './company-profile.types';

export type CompanyProfileState = ReturnType<typeof useCompanyProfile>;
type Result<T = undefined> = { ok: true; value: T } | { ok: false; problem: string };
const problemOf = (e: unknown): string => (e instanceof Error && e.message && e.message !== 'repository_failed' ? e.message : 'generic');
export interface Effective { mode: 'now' | 'day'; day: string }
interface Stored { draft: BrandDraft; effective: Effective; reason: string }

const draftOf = (v: CompanyProfileVersionView): BrandDraft => ({ companyName: v.companyName, nameHi: v.nameHi, nameMr: v.nameMr, ownerName: v.ownerName, logo: v.logo ? { ...v.logo } : null, gstin: v.gstin, address: { ...v.address }, tokens: { ...v.tokens } });
const todayStr = (): string => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const readStored = (key: string): Stored | null => { try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as Stored) : null; } catch { return null; } };
const writeStored = (key: string, v: Stored | null) => { try { if (v) localStorage.setItem(key, JSON.stringify(v)); else localStorage.removeItem(key); } catch { /* the draft is a convenience */ } };

/** Screen 191. The edits live in a draft kept on this phone; the preview and the checks come from the repository for exactly that draft, and a publish carries the preview's token so nothing is published unseen. */
export function useCompanyProfile() {
  const repository = useData();
  const { user } = useSession();
  const uid = user?.id ?? '';
  const key = `${DRAFT_PREFIX}.${uid}`;
  const [params, setParams] = useSearchParams();
  const openVersion = params.get('version') ?? '';
  const [view, setView] = useState<CompanyProfileView | null>(null);
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraftState] = useState<BrandDraft | null>(null);
  const [effective, setEffective] = useState<Effective>({ mode: 'now', day: todayStr() });
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState<CompanyProfilePreview | null>(null);
  const alive = useRef(true);
  const started = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const read = useCallback(async () => {
    if (!uid) return;
    try {
      const v = await repository.getCompanyProfile(uid);
      if (!alive.current) return;
      setView(v); setLoad('ready'); setOffline(false);
      if (!started.current) {
        started.current = true;
        const stored = readStored(key);
        if (stored) { setEffective(stored.effective); setReason(stored.reason); setDraftState(stored.draft); } else setDraftState(draftOf(v.current));
      }
    } catch { if (alive.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); } }
  }, [repository, uid, key]);
  useEffect(() => {
    void read();
    const onShow = () => { if (document.visibilityState === 'visible') void read(); };
    document.addEventListener('visibilitychange', onShow);
    return () => document.removeEventListener('visibilitychange', onShow);
  }, [read]);

  const base = view ? draftOf(view.current) : null;
  const changes = useMemo(() => (base && draft ? changesOf(base, draft) : []), [base, draft]);
  const dirty = changes.length > 0;
  const effectiveFrom: string | null = effective.mode === 'now' ? null : dayStart(effective.day);

  // The draft is kept on the phone as it is typed; a draft with no change is not worth keeping.
  useEffect(() => { if (draft) writeStored(key, dirty || reason ? { draft, effective, reason } : null); }, [draft, effective, reason, dirty, key]);

  // The repository judges exactly this draft (after a short pause in typing): problems, the combined effect, what stays as issued, and the token a publish must carry.
  useEffect(() => {
    if (!draft || !uid || !dirty) { setPreview(null); return; }
    let live = true;
    const id = window.setTimeout(() => { void repository.previewCompanyProfile(uid, draft, effectiveFrom).then((p) => { if (live && alive.current) setPreview(p); }).catch(() => undefined); }, 350);
    return () => { live = false; window.clearTimeout(id); };
  }, [repository, uid, draft, effectiveFrom, dirty]);

  const act = async <T,>(fn: () => Promise<T>): Promise<Result<T>> => {
    setBusy(true);
    try { return { ok: true, value: await fn() }; } catch (e) { return { ok: false, problem: problemOf(e) }; } finally { if (alive.current) setBusy(false); }
  };
  const after = (v: CompanyProfileView) => { setView(v); window.dispatchEvent(new Event(BRAND_CHANGED)); };

  return {
    load, offline, view, busy, draft, base, changes, dirty, effective, reason, preview, openVersion, effectiveFrom,
    refresh: read,
    setDraft: (fn: (d: BrandDraft) => BrandDraft) => setDraftState((d) => (d ? fn(d) : d)),
    setEffective, setReason,
    openVersionSheet: (id: string | null) => setParams((p) => { const n = new URLSearchParams(p); if (id) n.set('version', id); else n.delete('version'); return n; }, { replace: true }),
    resetLook: () => setDraftState((d) => (d ? { ...d, tokens: { ...DEFAULT_TOKENS } } : d)),
    discard: () => { if (view) setDraftState(draftOf(view.current)); setEffective({ mode: 'now', day: todayStr() }); setReason(''); setPreview(null); writeStored(key, null); },
    startFrom: (v: CompanyProfileVersionView) => { setDraftState(draftOf(v)); },
    /** Reads a picture into the draft: a small, real image only. */
    chooseLogo: (file: File): Promise<Result> => new Promise((resolve) => {
      if (!LOGO_TYPES.includes(file.type)) { resolve({ ok: false, problem: 'logo_type' }); return; }
      if (file.size > LOGO_MAX_BYTES) { resolve({ ok: false, problem: 'logo_size' }); return; }
      const reader = new FileReader();
      reader.onerror = () => resolve({ ok: false, problem: 'logo_unreadable' });
      reader.onload = () => {
        const dataUrl = String(reader.result);
        const img = new Image();
        img.onerror = () => resolve({ ok: false, problem: 'logo_unreadable' });
        img.onload = () => { setDraftState((d) => (d ? { ...d, logo: { dataUrl, fileName: file.name.slice(0, 80), sizeBytes: file.size } } : d)); resolve({ ok: true, value: undefined }); };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }),
    publish: async (ticks: { confirmPreview: boolean; registrationChecked: boolean; accountantTold: boolean }) => {
      if (!draft || !preview) return { ok: false, problem: 'preview_stale' } as Result<CompanyProfileView>;
      const r = await act(() => repository.publishCompanyProfile(uid, { draft, effectiveFrom, reason, token: preview.token, ...ticks }));
      if (r.ok) { after(r.value); setDraftState(draftOf(r.value.current)); setReason(''); setEffective({ mode: 'now', day: todayStr() }); setPreview(null); writeStored(key, null); }
      return r;
    },
    cancelScheduled: async (versionId: string, why: string) => { const r = await act(() => repository.cancelScheduledProfile(uid, versionId, why)); if (r.ok) after(r.value); return r; },
    confirmLegal: async (versionId: string, note: string) => { const r = await act(() => repository.confirmLegalChange(uid, versionId, note)); if (r.ok) after(r.value); return r; },
  };
}
