import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { IssueBoardView, JobIssuesView, SopMediaInput } from '@/data/repository';
import type { IssueCategory, IssueResolutionKind, IssueSeverity } from '@/data/types';
import { DESCRIPTION_MIN, MAX_ATTACHMENTS, minSeverityFor, relatedCandidates, reportProblem, severityAtLeast } from '@/features/technician/issues';
import { applyIssueQueue } from '@/features/technician/issueQueue';
import type { IssueQueueInput, IssueQueueItem } from '@/features/technician/issueQueue';
import type { IssuesStatus } from './issue-reporting.types';
import { FINAL_ERRORS, ISSUE_KEYS as K, POLL_MS, draftKey, queueKey, viewKey } from './issue-reporting.types';
import { newClientId } from '@/features/ids/clientId';

export interface FailedChange {
  id: string;
  code: string;
}
export interface ActionResult {
  ok: boolean;
  code?: string;
}
export interface Attachment {
  media: Omit<SopMediaInput, 'capturedAt'>;
  takenAt: string;
}
export interface FormState {
  category: IssueCategory | null;
  severity: IssueSeverity | null;
  stepId: string;
  sopGap: boolean;
  description: string;
  linkTo: string;
  attachments: Attachment[];
}

const EMPTY: FormState = { category: null, severity: null, stepId: '', sopGap: false, description: '', linkTo: '', attachments: [] };
const isFinal = (code: string) => (FINAL_ERRORS as readonly string[]).includes(code);
const newId = (): string => newClientId();
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');
const hasVideo = (q: IssueQueueItem) => q.kind === 'report' && q.media.some((m) => m.kind === 'video');
/** Reports with a video cannot go into the phone's small storage; they are held while the app is open, across screens. */
const volatile = new Map<string, IssueQueueItem[]>();

function readQueue(key: string): IssueQueueItem[] {
  let stored: IssueQueueItem[] = [];
  try {
    const raw = localStorage.getItem(key);
    stored = raw ? (JSON.parse(raw) as IssueQueueItem[]) : [];
  } catch {
    stored = [];
  }
  return [...stored, ...(volatile.get(key) ?? [])].sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
}
function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
const lightView = (v: JobIssuesView): JobIssuesView => ({ ...v, issues: v.issues.map((i) => ({ ...i, evidence: i.evidence.map((e) => ({ ...e, previewUrl: '', mediaUrl: undefined })) })) });

export type IssueState = ReturnType<typeof useIssueReporting>;

/**
 * Screen 127. A technician's quick report is a form whose severity decides what the system does (minor is only logged; blocking pauses the
 * work and tells Admin; safety stops it at once and escalates), written on the phone first so a report is never lost to a basement with no
 * signal, with the words the person has typed kept as a draft so an interrupted report is not lost either. Admin, on the same screen, sees
 * every report, resolves them, and sees which steps keep being reported as a problem with the procedure.
 */
export function useIssueReporting() {
  const repository = useData();
  const { user } = useSession();
  const { jobId } = useParams();
  const [params] = useSearchParams();
  const { t } = useTranslation();
  const { push } = useToast();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const qKey = user && !isAdmin ? queueKey(user.id) : '';
  const vKey = user && jobId ? viewKey(user.id, jobId) : '';
  const dKey = user && jobId && !isAdmin ? draftKey(user.id, jobId) : '';
  const [server, setServer] = useState<JobIssuesView | null>(() => (vKey ? readJson<JobIssuesView>(vKey) : null));
  const [board, setBoard] = useState<IssueBoardView | null>(null);
  const [status, setStatus] = useState<IssuesStatus>(() => (server ? 'ready' : jobId || isAdmin ? 'loading' : 'ready'));
  const [queue, setQueue] = useState<IssueQueueItem[]>(() => (qKey ? readQueue(qKey) : []));
  const [failed, setFailed] = useState<FailedChange[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [form, setFormState] = useState<FormState>(() => ({ ...EMPTY, ...(dKey ? (readJson<Partial<FormState>>(dKey) ?? {}) : {}), attachments: [] }));
  const [draftRestored, setDraftRestored] = useState<boolean>(() => !!(dKey && readJson(dKey)));
  const flushing = useRef(false);
  const queueRef = useRef(queue);
  queueRef.current = queue;

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

  const persist = useCallback(
    (next: IssueQueueItem[]) => {
      queueRef.current = next;
      setQueue(next);
      if (!qKey) return;
      volatile.set(qKey, next.filter(hasVideo));
      try {
        const keep = next.filter((q) => !hasVideo(q));
        if (keep.length === 0) localStorage.removeItem(qKey);
        else localStorage.setItem(qKey, JSON.stringify(keep));
      } catch {
        // Storage full: still held while the app stays open.
      }
    },
    [qKey],
  );

  const load = useCallback(async () => {
    if (!user || !navigator.onLine) return;
    try {
      if (jobId) {
        const fresh = await repository.getJobIssues(jobId, user.id);
        setServer(fresh);
        try {
          localStorage.setItem(viewKey(user.id, jobId), JSON.stringify(lightView(fresh)));
        } catch {
          // Not cached.
        }
      }
      if (isAdmin && !jobId) setBoard(await repository.listIssueBoard(user.id));
      setStatus('ready');
    } catch (e) {
      const code = codeOf(e);
      if (code === 'not_found' || code === 'forbidden') setStatus('not_found');
      else setStatus((c) => (c === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, jobId, isAdmin]);

  const flush = useCallback(async () => {
    if (!user || flushing.current || !navigator.onLine || queueRef.current.length === 0) return;
    flushing.current = true;
    setSyncing(true);
    try {
      for (const item of [...queueRef.current]) {
        try {
          if (item.kind === 'report') {
            await repository.reportJobIssue(item.jobId, { ...item.input, evidence: item.media.map((m, n) => ({ ...m, capturedAt: item.takenAt[n] ?? item.capturedAt })), capturedAt: item.capturedAt }, user.id);
          } else await repository.addIssueNote(item.issueId, item.note, user.id);
          persist(queueRef.current.filter((q) => q.id !== item.id));
        } catch (e) {
          const code = codeOf(e);
          if (!isFinal(code)) break;
          persist(queueRef.current.filter((q) => q.id !== item.id));
          setFailed((f) => [...f, { id: item.id, code }]);
        }
      }
    } finally {
      flushing.current = false;
      setSyncing(false);
      await load();
    }
  }, [repository, user, persist, load]);

  useEffect(() => {
    const kept = vKey ? readJson<JobIssuesView>(vKey) : null;
    setServer(kept);
    setStatus(kept ? 'ready' : jobId || isAdmin ? 'loading' : 'ready');
    void load().then(() => flush());
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load, flush, vKey, jobId, isAdmin]);
  useEffect(() => {
    if (isOnline) void flush();
  }, [isOnline, flush]);

  // What has been typed is kept, so an interrupted report is never lost. Pictures are not (they are too big); the words are what matter.
  useEffect(() => {
    if (!dKey) return;
    const words = { category: form.category, severity: form.severity, stepId: form.stepId, sopGap: form.sopGap, description: form.description, linkTo: form.linkTo };
    try {
      if (!form.category && !form.description && !form.stepId) localStorage.removeItem(dKey);
      else localStorage.setItem(dKey, JSON.stringify(words));
    } catch {
      // Not saved.
    }
  }, [dKey, form.category, form.severity, form.stepId, form.sopGap, form.description, form.linkTo]);

  const enqueue = useCallback(
    (item: IssueQueueInput) => {
      if (!jobId) return;
      persist([...queueRef.current, { ...item, id: newId(), jobId, capturedAt: new Date().toISOString() } as IssueQueueItem]);
      void flush();
    },
    [jobId, persist, flush],
  );

  const view: JobIssuesView | null = useMemo(() => (server && user && !isAdmin ? applyIssueQueue(server, queue, { id: user.id, name: user.name }) : server), [server, queue, user, isAdmin]);

  const setForm = (patch: Partial<FormState>) => {
    setDraftRestored(false);
    setFormState((f) => {
      const next = { ...f, ...patch };
      // A safety concern is always a safety report: it cannot be quietly filed as minor.
      if (next.category && next.severity && !severityAtLeast(next.severity, minSeverityFor(next.category))) next.severity = minSeverityFor(next.category);
      if (patch.category && next.category === 'safety_concern') next.severity = 'safety';
      if (!next.stepId) next.sopGap = false;
      return next;
    });
  };

  const open = useMemo(() => (view?.issues ?? []).filter((i) => i.status === 'open'), [view]);
  const related = useMemo(() => (form.category ? relatedCandidates(open.filter((i) => !i.local).map((i) => ({ id: i.id, category: i.category, createdAt: i.createdAt, groupId: i.groupId })), form.category, Date.now()) : []), [open, form.category]);
  const problem = form.category && form.severity ? reportProblem({ category: form.category, severity: form.severity, description: form.description, attachments: form.attachments.length }) : 'description_required';
  const valid = !!form.category && !!form.severity && problem === null;

  const submit = () => {
    if (!valid || !form.category || !form.severity || !jobId) return;
    enqueue({
      kind: 'report',
      input: { category: form.category, severity: form.severity, description: form.description.trim(), ...(form.stepId ? { stepId: form.stepId } : {}), sopGap: form.sopGap && !!form.stepId, evidence: [], ...(form.linkTo ? { linkTo: form.linkTo } : {}) },
      media: form.attachments.map((a) => a.media),
      takenAt: form.attachments.map((a) => a.takenAt),
    });
    setFormState(EMPTY);
    push(t(isOnline ? K.form.toast : K.form.toastQueued), 'success');
  };

  const guard = async (fn: () => Promise<unknown>, okKey?: string): Promise<ActionResult> => {
    setBusy(true);
    try {
      await fn();
      await load();
      if (okKey) push(t(okKey), 'success');
      return { ok: true };
    } catch (e) {
      return { ok: false, code: codeOf(e) };
    } finally {
      setBusy(false);
    }
  };
  const uid = user?.id ?? '';

  return {
    status,
    reload: () => {
      setStatus('loading');
      void load();
    },
    isAdmin: !!isAdmin,
    jobId: jobId ?? null,
    highlight: params.get('issue'),
    tab: params.get('tab'),
    view,
    board,
    isOnline,
    syncing,
    busy,
    queue: queue.filter((q) => q.jobId === jobId),
    videoAtRisk: queue.some(hasVideo),
    failed,
    dismissFailed: () => setFailed([]),
    form,
    setForm,
    draftRestored,
    related,
    valid,
    problem,
    descriptionMin: DESCRIPTION_MIN,
    maxAttachments: MAX_ATTACHMENTS,
    addAttachment: (a: Attachment) => setForm({ attachments: [...form.attachments, a].slice(0, MAX_ATTACHMENTS) }),
    removeAttachment: (i: number) => setForm({ attachments: form.attachments.filter((_, n) => n !== i) }),
    submit,
    note: (issueId: string, text: string) => {
      enqueue({ kind: 'note', issueId, note: text.trim() });
      push(t(K.action.toastNote), 'success');
    },
    resolve: (issueId: string, how: IssueResolutionKind, note: string) => guard(() => repository.resolveJobIssue(issueId, how, note, uid), K.action.toastResolved),
    reopen: (issueId: string, note: string) => guard(() => repository.reopenJobIssue(issueId, note, uid), K.action.toastReopened),
    setSeverity: (issueId: string, severity: IssueSeverity, note: string) => guard(() => repository.setIssueSeverity(issueId, severity, note, uid), K.action.toastSeverity),
    adminNote: (issueId: string, text: string) => guard(() => repository.addIssueNote(issueId, text, uid), K.action.toastNote),
    addEvidence: (issueId: string, media: SopMediaInput) => guard(() => repository.addIssueEvidence(issueId, media, uid)),
    reviewPattern: (stepId: string, outcome: 'sop_updated' | 'no_change' | 'training_planned', note: string) =>
      guard(async () => {
        setBoard(await repository.reviewIssuePattern(stepId, outcome, note, uid));
      }, K.action.toastReviewed),
    goto: (path: string) => navigate(path),
  };
}
