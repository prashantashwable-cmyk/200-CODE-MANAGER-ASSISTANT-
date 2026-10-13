import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { CompliancePartnerView, ComplianceReminderResult, ComplianceReviewView, ComplianceTrackerView } from '@/data/repository';
import { CSV_COLUMNS, FILTERS, PAGE, REMIND_GAP_HOURS, VIEWS } from './training-compliance.types';
import type { Filter, View } from './training-compliance.types';

export interface ActionResult<V = undefined> {
  ok: boolean;
  code?: string;
  value?: V;
}
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');
export type TrainingComplianceState = ReturnType<typeof useTrainingCompliance>;

/** A formula-looking cell is neutralised so a spreadsheet never runs it. */
const csvCell = (v: string | number | null | undefined) => {
  const raw = String(v ?? '');
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** The reminders a bulk send would really send, worked out the same way the repository will (so the sheet never promises what it will not do). */
export function planOf(rows: CompliancePartnerView[], now: number) {
  const out = rows.filter((r) => r.status === 'non_compliant');
  const recent = (r: CompliancePartnerView) => !!r.lastReminderAt && now - Date.parse(r.lastReminderAt) < REMIND_GAP_HOURS * 3_600_000;
  const sendable = (r: CompliancePartnerView) => r.items.some((i) => i.response === 'nudge' || i.response === 'refresher');
  const willSend = out.filter((r) => sendable(r) && !recent(r));
  return {
    willSend,
    coaching: out.filter((r) => !sendable(r)),
    recent: out.filter((r) => sendable(r) && recent(r)),
    safetyFirst: willSend.filter((r) => r.urgency === 'safety').length,
  };
}

/**
 * Screen 158. One read of every active partner's training standing, built from lessons, tests, certifications, refreshers and assigned training. The person
 * looking is Admin, who needs to know whether the whole workforce is properly trained now, who is not and why, and who to ask to do something about it.
 */
export function useTrainingCompliance() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const view: View = (VIEWS as readonly string[]).includes(params.get('view') ?? '') ? (params.get('view') as View) : 'overview';
  const filter: Filter = (FILTERS as readonly string[]).includes(params.get('f') ?? '') ? (params.get('f') as Filter) : 'out';
  const role = params.get('role') ?? '';
  const territory = params.get('terr') ?? '';
  const query = params.get('q') ?? '';
  const openId = params.get('partner');
  const [data, setData] = useState<ComplianceTrackerView | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const v = await repository.getComplianceTracker(user.id);
      if (alive.current) { setData(v); setStatus('ready'); }
    } catch { if (alive.current) setStatus((s) => (s === 'ready' ? s : 'error')); }
  }, [repository, user]);
  useEffect(() => { void load(); const id = window.setInterval(() => void load(), 60_000); return () => window.clearInterval(id); }, [load]);

  const patch = useCallback((changes: Record<string, string | null>, replace = true) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(changes)) { if (v === null || v === '') next.delete(k); else next.set(k, v); }
      return next;
    }, { replace });
    setShown(PAGE);
  }, [setParams]);

  const rows = useMemo(() => {
    const d = data;
    if (!d) return [];
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    return d.partners.filter((p) => {
      if (role && p.role !== role) return false;
      if (territory && p.territory !== territory) return false;
      if (tokens.length && !tokens.every((t) => `${p.name} ${p.territory} ${p.role}`.toLowerCase().includes(t))) return false;
      const has = (r: string) => p.items.some((i) => i.response === r);
      switch (filter) {
        case 'out': return p.status === 'non_compliant';
        case 'safety': return p.urgency === 'safety';
        case 'coaching': return has('coaching');
        case 'refresher': return has('refresher');
        case 'nudge': return has('nudge');
        case 'soon': return p.status === 'due_soon';
        default: return true;
      }
    });
  }, [data, filter, role, territory, query]);

  return {
    status, data, view, filter, role, territory, query, openId, rows, shown, refreshing, busy,
    visible: rows.slice(0, shown),
    more: () => setShown((n) => n + PAGE),
    setView: (v: string) => patch({ view: v === 'overview' ? null : v }),
    setFilter: (f: string) => patch({ f: f === 'out' ? null : f }),
    setRole: (v: string) => patch({ role: v }),
    setTerritory: (v: string) => patch({ terr: v }),
    setQuery: (v: string) => patch({ q: v }),
    clearFilters: () => patch({ f: null, role: null, terr: null, q: null }),
    drill: (changes: { role?: string; territory?: string; filter?: string }) => patch({ view: 'partners', ...(changes.role !== undefined ? { role: changes.role } : {}), ...(changes.territory !== undefined ? { terr: changes.territory } : {}), f: changes.filter ?? 'all' }, false),
    open: (id: string | null) => patch({ partner: id }, false),
    reload: () => { setStatus('loading'); void load(); },
    refresh: async () => { setRefreshing(true); await load(); if (alive.current) setRefreshing(false); },
    goto: (path: string) => navigate(path),
    remind: async (userIds: string[]): Promise<ActionResult<ComplianceReminderResult>> => {
      if (!user) return { ok: false, code: 'generic' };
      setBusy(true);
      try { const r = await repository.sendComplianceReminders({ userIds }, user.id); await load(); return { ok: true, value: r }; } catch (e) { return { ok: false, code: codeOf(e) }; } finally { if (alive.current) setBusy(false); }
    },
    review: async (note: string): Promise<ActionResult<ComplianceReviewView>> => {
      if (!user) return { ok: false, code: 'generic' };
      setBusy(true);
      try { const r = await repository.recordComplianceReview({ note }, user.id); await load(); return { ok: true, value: r }; } catch (e) { return { ok: false, code: codeOf(e) }; } finally { if (alive.current) setBusy(false); }
    },
    /** The spec's own columns, one line per partner and reason, so an auditor can read it without the app. */
    exportCsv: (reasonLabel: (reason: string) => string, statusLabel: (s: string) => string, roleLabel: (r: string) => string): boolean => {
      if (!data) return false;
      const lines = [CSV_COLUMNS.join(',')];
      for (const p of data.partners) {
        const open = p.items.filter((i) => i.response);
        const reasons = open.length ? open.map((i) => `${i.moduleCode}: ${reasonLabel(i.state)}`).join('; ') : '';
        lines.push([p.userId, statusLabel(p.status), reasons, roleLabel(p.role), p.territory].map(csvCell).join(','));
      }
      const blob = new Blob([`﻿${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aiec-training-compliance-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      return true;
    },
  };
}
