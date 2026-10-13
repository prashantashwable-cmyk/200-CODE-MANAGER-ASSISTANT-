import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { DirectorySort, DirectoryStatus, DirectoryType, PartnerDirectoryFilter, PartnerDirectoryProfileView, PartnerDirectoryView } from '@/data/repository';
import { CSV_COLUMNS, DEFAULT_STATUS, DIRECTORY_KEYS as K, PAGE, POLL_MS, SEARCH_DELAY_MS, STATUSES, TYPES } from './partner-directory.types';

export interface ActionResult {
  ok: boolean;
  code?: string;
}
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');
export type DirectoryState = ReturnType<typeof usePartnerDirectory>;

const csvCell = (v: string | number | null | undefined) => {
  const s = v === null || v === undefined ? '' : String(v);
  // A cell that starts like a formula is neutralised so a spreadsheet never runs a partner's name.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/**
 * Screen 149. One searchable master list over every partner, whatever their role. Search, filters and paging all run in the repository (a
 * network of thousands stays quick: only a page is ever drawn); the screen keeps only what the person asked for in the address, so a view can be
 * shared or come back to. Nothing about a partner is kept here: every figure is read from the screen that owns it.
 */
export function usePartnerDirectory() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { push } = useToast();
  const [params, setParams] = useSearchParams();
  const type = ((TYPES as readonly string[]).includes(params.get('type') ?? '') ? params.get('type') : 'all') as DirectoryType | 'all';
  const status = ((STATUSES as readonly string[]).includes(params.get('status') ?? '') ? params.get('status') : DEFAULT_STATUS) as DirectoryStatus | 'all';
  const tier = params.get('tier') ?? '';
  const zoneId = params.get('zone') ?? '';
  const sort = (params.get('sort') === 'joined' ? 'joined' : 'name') as DirectorySort;
  const q = params.get('q') ?? '';
  const profileKey = params.get('p');
  const [text, setText] = useState(q);
  const [pages, setPages] = useState(1);
  const [view, setView] = useState<PartnerDirectoryView | null>(null);
  const [profile, setProfile] = useState<PartnerDirectoryProfileView | null>(null);
  const [profileStatus, setProfileStatus] = useState<'idle' | 'loading' | 'ready' | 'not_found'>('idle');
  const [status_, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const set = useCallback((patch: Record<string, string | null>) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) {
        if (!v || (k === 'type' && v === 'all') || (k === 'status' && v === DEFAULT_STATUS) || (k === 'sort' && v === 'name')) next.delete(k);
        else next.set(k, v);
      }
      return next;
    }, { replace: true });
  }, [setParams]);

  // Typing is sent to the repository a moment after the person stops, so a fast typist does not search every letter.
  useEffect(() => {
    if (text === q) return undefined;
    const id = window.setTimeout(() => {
      setPages(1);
      set({ q: text.trim() });
    }, SEARCH_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [text, q, set]);

  const filter: PartnerDirectoryFilter = { query: q, type, status, tier, zoneId, sort };
  const filterKey = JSON.stringify(filter);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const v = await repository.searchPartnerDirectory({ ...filter, offset: 0, limit: PAGE * pages }, user.id);
      if (!alive.current) return;
      setView(v);
      setLoad('ready');
    } catch {
      if (alive.current) setLoad((s) => (s === 'ready' ? s : 'error'));
    }
  }, [repository, user, filterKey, pages]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const loadProfile = useCallback(async () => {
    if (!user || !profileKey) return;
    try {
      const p = await repository.getPartnerDirectoryProfile(profileKey, user.id);
      if (!alive.current) return;
      setProfile(p);
      setProfileStatus('ready');
    } catch (e) {
      if (alive.current) setProfileStatus(codeOf(e) === 'not_found' ? 'not_found' : 'loading');
    }
  }, [repository, user, profileKey]);

  useEffect(() => {
    if (!profileKey) {
      setProfile(null);
      setProfileStatus('idle');
      return;
    }
    setProfileStatus('loading');
    void loadProfile();
  }, [profileKey, loadProfile]);

  const activeFilters = [status !== DEFAULT_STATUS, !!tier, !!zoneId, sort !== 'name'].filter(Boolean).length;

  return {
    status: status_,
    view,
    profile,
    profileStatus,
    profileOpen: !!profileKey,
    busy,
    text,
    setText,
    type,
    statusFilter: status,
    tier,
    zoneId,
    sort,
    activeFilters,
    hasFilters: !!q || type !== 'all' || activeFilters > 0,
    setType: (v: string) => { setPages(1); set({ type: v }); },
    setStatus: (v: string) => { setPages(1); set({ status: v }); },
    setTier: (v: string) => { setPages(1); set({ tier: v }); },
    setZone: (v: string) => { setPages(1); set({ zone: v }); },
    setSort: (v: string) => set({ sort: v }),
    clear: () => { setText(''); setPages(1); setParams(new URLSearchParams(), { replace: true }); },
    showMore: () => setPages((p) => p + 1),
    reload: () => {
      setLoad('loading');
      void load();
    },
    openProfile: (key: string) => set({ p: key }),
    closeProfile: () => set({ p: null }),
    goto: (path: string) => navigate(path),
    reassign: async (partnerId: string, input: { zoneIds: string[]; reason: string }): Promise<ActionResult> => {
      if (!user) return { ok: false, code: 'generic' };
      setBusy(true);
      try {
        setProfile(await repository.reassignPartnerTerritory(partnerId, input, user.id));
        push(t(K.reassign.saved), 'success');
        void load();
        return { ok: true };
      } catch (e) {
        return { ok: false, code: codeOf(e) };
      } finally {
        if (alive.current) setBusy(false);
      }
    },
    /** Every match, not just the page on screen: the export is the list as filtered. */
    exportCsv: async (labels: { type: (t: DirectoryType) => string; status: (s: DirectoryStatus) => string; tier: (t: DirectoryType, id: string) => string; area: (k: string, v: string) => string; perf: (r: PartnerDirectoryView['rows'][number]['roles'][number]) => string }): Promise<boolean> => {
      if (!user) return false;
      push(t(K.export.busy), 'accent');
      try {
        const all = await repository.searchPartnerDirectory({ ...filter, offset: 0, limit: 0 }, user.id);
        const lines = [CSV_COLUMNS.join(',')];
        for (const row of all.rows) {
          for (const r of row.roles) {
            lines.push([r.partnerId, labels.type(r.type), labels.status(r.status), labels.tier(r.type, r.tier), r.territory.map((x) => labels.area(x.kind, x.value)).join('; '), row.name, row.phone, r.city, labels.perf(r)].map(csvCell).join(','));
          }
        }
        const blob = new Blob([`﻿${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aiec-partners-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        push(t(K.export.done), 'success');
        return true;
      } catch {
        push(t(K.export.failed), 'error');
        return false;
      }
    },
  };
}
