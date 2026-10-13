import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { JobSpecView, TechnicianJobDetail } from '@/data/repository';
import type { JobDetailStatus, JobSpecField } from './job-detail-site-info.types';
import { POLL_MS, SPEC_FIELDS } from './job-detail-site-info.types';

/** What moved between the configuration the technician had open and the one that replaced it. */
export interface SpecChange {
  fromVersion: number;
  toVersion: number;
  fields: { field: JobSpecField; before: string | number; after: string | number }[];
}

const keyOf = (s: JobSpecView | null) => (s ? `${s.quotationId}:${s.version}` : 'none');

/** The fields that differ, by value, so a change is shown as "finish: Standard to Premium" and not just "something changed". */
export function specDiff(before: JobSpecView, after: JobSpecView): SpecChange {
  return {
    fromVersion: before.version,
    toVersion: after.version,
    fields: SPEC_FIELDS.filter((f) => before[f] !== after[f]).map((f) => ({ field: f, before: before[f], after: after[f] })),
  };
}

export type JobDetailState = ReturnType<typeof useJobDetailSiteInfo>;

/**
 * Owns one job's context. It is read-mostly: the working record of the installation lives in the SOP checklist. The screen keeps
 * the configuration the person last saw, so when a change to it lands while it is open (a revised quotation accepted, polled in),
 * the change is put in front of them to acknowledge instead of the view quietly turning into something they never read.
 */
export function useJobDetailSiteInfo() {
  const repository = useData();
  const { user } = useSession();
  const { jobId } = useParams();
  const [status, setStatus] = useState<JobDetailStatus>('loading');
  const [detail, setDetail] = useState<TechnicianJobDetail | null>(null);
  /** The configuration the person has read. Moves only when they say they have read a change. */
  const [seen, setSeen] = useState<JobSpecView | null>(null);
  const seenSet = useRef(false);

  const load = useCallback(async () => {
    if (!user || !jobId) return;
    try {
      const d = await repository.getTechnicianJob(jobId, user.id);
      setDetail(d);
      if (!seenSet.current) {
        seenSet.current = true;
        setSeen(d.spec);
      }
      setStatus('ready');
    } catch (e) {
      const code = e instanceof Error ? e.message : '';
      if (code === 'not_found' || code === 'forbidden') setStatus('not_found');
      else setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, jobId]);

  useEffect(() => {
    seenSet.current = false;
    setSeen(null);
    setStatus('loading');
    void load();
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load]);
  const reload = () => {
    setStatus('loading');
    void load();
  };

  const change: SpecChange | null = useMemo(() => {
    const now = detail?.spec ?? null;
    if (!seen || !now || keyOf(seen) === keyOf(now)) return null;
    return specDiff(seen, now);
  }, [seen, detail]);
  const acknowledgeChange = () => setSeen(detail?.spec ?? null);

  return { status, detail, reload, change, acknowledgeChange };
}
