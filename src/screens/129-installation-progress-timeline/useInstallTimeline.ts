import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { InstallTimelineView, TimelineListItem } from '@/data/repository';
import type { TimelineStatus } from './install-timeline.types';
import { POLL_MS, TIMELINE_KEYS as K, timelinePath, viewKey } from './install-timeline.types';

export interface ActionResult {
  ok: boolean;
  code?: string;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');

export type TimelineState = ReturnType<typeof useInstallTimeline>;

/**
 * Screen 129. A presentation of the job's own record (its steps, evidence and issue reports): there is no timeline data of its own, so the
 * customer's view is always a truthful reflection of what is really happening on site. One screen, three audiences: the customer gets plain
 * milestones and an honest expected date with a tactful reason; the technician and Admin get the same rail with the procedure steps,
 * reports, team and activity behind each milestone. The last good view is kept on the phone so it can still be read without signal.
 */
export function useInstallTimeline() {
  const repository = useData();
  const { user } = useSession();
  const { jobId } = useParams();
  const { t } = useTranslation();
  const { push } = useToast();
  const navigate = useNavigate();
  const vKey = user && jobId ? viewKey(user.id, jobId) : '';
  const [view, setView] = useState<InstallTimelineView | null>(() => (vKey ? readJson<InstallTimelineView>(vKey) : null));
  const [list, setList] = useState<TimelineListItem[] | null>(null);
  const [status, setStatus] = useState<TimelineStatus>(() => (view || !jobId ? 'ready' : 'loading'));
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [busy, setBusy] = useState(false);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    if (!navigator.onLine) {
      setStale(true);
      return;
    }
    try {
      if (jobId) {
        const fresh = await repository.getInstallationTimeline(jobId, user.id);
        setView(fresh);
        setStale(false);
        try {
          localStorage.setItem(viewKey(user.id, jobId), JSON.stringify(fresh));
        } catch {
          // Not cached.
        }
      } else {
        const rows = await repository.listInstallationTimelines(user.id);
        setList(rows);
        // A customer with one installation goes straight to it.
        if (user.role !== 'admin' && rows.length === 1) navigate(timelinePath(rows[0].jobId), { replace: true });
      }
      setStatus('ready');
    } catch (e) {
      const code = codeOf(e);
      if (code === 'not_found' || code === 'forbidden') setStatus('not_found');
      else setStatus((c) => (c === 'ready' && (jobId ? view : list) ? 'ready' : 'error'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repository, user, jobId, navigate]);

  useEffect(() => {
    setView(vKey ? readJson<InstallTimelineView>(vKey) : null);
    setList(null);
    setStatus(vKey && readJson(vKey) ? 'ready' : 'loading');
    void load();
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, vKey]);
  useEffect(() => {
    if (isOnline) void load();
  }, [isOnline, load]);

  const setVisible = async (visible: boolean, note: string): Promise<ActionResult> => {
    if (!user || !jobId) return { ok: false, code: 'generic' };
    setBusy(true);
    try {
      setView(await repository.setTimelineCustomerVisible(jobId, visible, note, user.id));
      push(t(visible ? K.visibility.toastShown : K.visibility.toastHidden), 'success');
      return { ok: true };
    } catch (e) {
      return { ok: false, code: codeOf(e) };
    } finally {
      setBusy(false);
    }
  };

  return {
    status,
    reload: () => {
      setStatus('loading');
      void load();
    },
    role: user?.role,
    jobId: jobId ?? null,
    view,
    list,
    isOnline,
    stale,
    busy,
    setVisible,
    goto: (path: string) => navigate(path),
  };
}
